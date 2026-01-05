import { supabase } from '../lib/supabase';

export const profileService = {
  // Get user profile with related data
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_goals (*),
        user_settings (*),
        nutrition_goals (*),
        sleep_goals (*)
      `)
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Update profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Update user goals
  async updateGoals(userId, goals) {
    const { data, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        ...goals,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Update user settings
  async updateSettings(userId, settings) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Check if username is available
  async checkUsernameAvailable(username, excludeUserId = null) {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase());

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;
    return { available: !data || data.length === 0, error };
  },

  // Log a weight entry
  async logWeight(userId, weight, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('weight_logs')
      .upsert({
        user_id: userId,
        log_date: logDate,
        weight,
      })
      .select()
      .single();

    // Also update current weight in user_goals
    if (data) {
      await supabase
        .from('user_goals')
        .update({ current_weight: weight })
        .eq('user_id', userId);
    }

    return { data, error };
  },

  // Get weight history
  async getWeightHistory(userId, limit = 90) {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Get weight logs for date range
  async getWeightRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date');

    return { data, error };
  },

  // Get latest weight
  async getLatestWeight(userId) {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(1)
      .single();

    return { data, error };
  },

  // Get weekly weight averages for the last N weeks
  async getWeeklyWeightAverages(userId, weeks = 4) {
    try {
      if (!userId) {
        return { data: null, error: 'No user ID provided' };
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (weeks * 7));

      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate.toISOString().split('T')[0])
        .lte('log_date', endDate.toISOString().split('T')[0])
        .order('log_date', { ascending: true });

      if (error) {
        console.warn('Weight logs query error:', error?.message);
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        return {
          data: { weeklyAverages: [], actualWeeklyRate: 0, latestAverage: null },
          error: null
        };
      }

      // Group by week
      const weeklyData = {};
      data.forEach(entry => {
        if (!entry?.log_date || entry?.weight == null) return;

        const date = new Date(entry.log_date);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { total: 0, count: 0 };
        }
        weeklyData[weekKey].total += entry.weight;
        weeklyData[weekKey].count++;
      });

      // Calculate averages per week
      const weeklyAverages = Object.keys(weeklyData)
        .sort()
        .map(weekKey => ({
          week: weekKey,
          average: parseFloat((weeklyData[weekKey].total / weeklyData[weekKey].count).toFixed(2)),
        }));

      // Calculate actual weekly rate of change
      let actualWeeklyRate = 0;
      if (weeklyAverages.length >= 2) {
        const recentWeeks = weeklyAverages.slice(-Math.min(4, weeklyAverages.length));
        const firstWeek = recentWeeks[0].average;
        const lastWeek = recentWeeks[recentWeeks.length - 1].average;
        actualWeeklyRate = parseFloat(((lastWeek - firstWeek) / (recentWeeks.length - 1)).toFixed(2));
      }

      return {
        data: {
          weeklyAverages,
          actualWeeklyRate,
          latestAverage: weeklyAverages.length > 0 ? weeklyAverages[weeklyAverages.length - 1].average : null,
        },
        error: null
      };
    } catch (err) {
      console.warn('getWeeklyWeightAverages error:', err?.message || err);
      return {
        data: { weeklyAverages: [], actualWeeklyRate: 0, latestAverage: null },
        error: err
      };
    }
  },

  // Search users by username (fuzzy match)
  async searchUsers(query, excludeUserId = null, limit = 20) {
    if (!query || query.length < 2) {
      return { data: [], error: null };
    }

    let searchQuery = supabase
      .from('profiles')
      .select(`
        id,
        username,
        first_name,
        last_name,
        avatar_url,
        allow_subscribers,
        subscriber_count
      `)
      .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(limit);

    if (excludeUserId) {
      searchQuery = searchQuery.neq('id', excludeUserId);
    }

    const { data, error } = await searchQuery;

    return { data: data || [], error };
  },

  // Subscribe to a user (for public accounts)
  async subscribeToUser(subscriberId, targetUserId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        subscriber_id: subscriberId,
        target_user_id: targetUserId,
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Increment subscriber count
    if (data) {
      await supabase.rpc('increment_subscriber_count', { user_id: targetUserId });
    }

    return { data, error };
  },

  // Unsubscribe from a user
  async unsubscribeFromUser(subscriberId, targetUserId) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('subscriber_id', subscriberId)
      .eq('target_user_id', targetUserId);

    // Decrement subscriber count
    if (!error) {
      await supabase.rpc('decrement_subscriber_count', { user_id: targetUserId });
    }

    return { error };
  },

  // Send friend request
  async sendFriendRequest(fromUserId, toUserId) {
    const { data, error } = await supabase
      .from('friend_requests')
      .upsert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Get subscriptions (users this user follows)
  async getSubscriptions(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        target_user_id,
        subscribed_at,
        profiles!subscriptions_target_user_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('subscriber_id', userId);

    return { data: data || [], error };
  },

  // Get subscribers (users following this user)
  async getSubscribers(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        subscriber_id,
        subscribed_at,
        profiles!subscriptions_subscriber_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('target_user_id', userId);

    return { data: data || [], error };
  },
};

export default profileService;
