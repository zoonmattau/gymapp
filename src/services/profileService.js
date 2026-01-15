import { supabase } from '../lib/supabase';

export const profileService = {
  // Get user's privacy settings
  async getUserSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('getUserSettings error:', error?.message);
        return { data: null, error };
      }

      // Return default privacy settings if none exist
      return {
        data: data || {
          public_prs: true,
          public_workouts: true,
        },
        error: null
      };
    } catch (err) {
      console.warn('getUserSettings error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get user profile with related data
  async getProfile(userId) {
    try {
      // Get profile separately to avoid join issues
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('getProfile error:', profileError?.message);
        return { data: null, error: profileError };
      }

      // Try to get related data separately (they may not exist)
      const [goalsResult, settingsResult, nutritionResult, sleepResult] = await Promise.all([
        supabase.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('sleep_goals').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      return {
        data: {
          ...profile,
          user_goals: goalsResult.data,
          user_settings: settingsResult.data,
          nutrition_goals: nutritionResult.data,
          sleep_goals: sleepResult.data,
        },
        error: null
      };
    } catch (err) {
      console.warn('getProfile error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.warn('updateProfile error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('updateProfile error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update user goals
  async updateGoals(userId, goals) {
    try {
      if (!userId) {
        return { data: null, error: null };
      }

      // Check if record exists first to get current goal value
      const { data: existing } = await supabase
        .from('user_goals')
        .select('goal')
        .eq('user_id', userId)
        .maybeSingle();

      // Build a clean object with only valid, non-null values
      const cleanGoals = { user_id: userId };

      // goal is required (NOT NULL) - use provided, existing, or default
      cleanGoals.goal = goals.goal || existing?.goal || 'fitness';

      // Only add other fields that have actual values
      if (goals.experience) cleanGoals.experience = goals.experience;
      if (goals.days_per_week != null) cleanGoals.days_per_week = goals.days_per_week;
      if (goals.target_weight != null) cleanGoals.target_weight = goals.target_weight;
      if (goals.current_weight != null) cleanGoals.current_weight = goals.current_weight;
      if (goals.activity_level) cleanGoals.activity_level = goals.activity_level;

      // Try upsert first (requires unique constraint on user_id)
      const { data, error } = await supabase
        .from('user_goals')
        .upsert(cleanGoals, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateGoals upsert error:', error?.message);
        // Just return gracefully - don't break the app
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('updateGoals error:', err?.message);
      // Always return gracefully
      return { data: null, error: null };
    }
  },

  // Update user settings
  async updateSettings(userId, settings) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateSettings error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('updateSettings error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Check if username is available
  async checkUsernameAvailable(username, excludeUserId = null) {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase());

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('checkUsernameAvailable error:', error?.message);
        return { available: true, error: null };
      }
      return { available: !data || data.length === 0, error: null };
    } catch (err) {
      console.warn('checkUsernameAvailable error:', err?.message);
      return { available: true, error: null };
    }
  },

  // Log a weight entry
  async logWeight(userId, weight, date = null, bodyFat = null, muscleMass = null) {
    try {
      const logDate = date || new Date().toISOString().split('T')[0];

      const logEntry = {
        user_id: userId,
        log_date: logDate,
        weight,
      };

      // Add optional body composition data if provided
      if (bodyFat != null) {
        logEntry.body_fat_percent = bodyFat;
      }
      if (muscleMass != null) {
        logEntry.muscle_mass_percent = muscleMass;
      }

      const { data, error } = await supabase
        .from('weight_logs')
        .upsert(logEntry, { onConflict: 'user_id,log_date' })
        .select()
        .maybeSingle();

      // Also try to update current weight in user_goals (ignore errors)
      if (data) {
        try {
          await supabase
            .from('user_goals')
            .update({ current_weight: weight })
            .eq('user_id', userId);
        } catch (e) {
          // Ignore - user_goals might not exist
        }
      }

      if (error) {
        console.warn('logWeight error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('logWeight error:', err?.message);
      return { data: null, error: err };
    }
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
    try {
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
          bio,
          allow_subscribers
        `)
        .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(limit);

      if (excludeUserId) {
        searchQuery = searchQuery.neq('id', excludeUserId);
      }

      const { data, error } = await searchQuery;

      if (error) {
        console.warn('searchUsers error:', error?.message);
        return { data: [], error: null };
      }

      // Fetch follower counts and published workout counts for each user
      const enrichedData = await Promise.all((data || []).map(async (user) => {
        // Get follower count
        const { count: followerCount } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', user.id)
          .eq('status', 'accepted');

        // Get published workout count (if table exists)
        let publishedCount = 0;
        try {
          const { count } = await supabase
            .from('published_workouts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          publishedCount = count || 0;
        } catch (e) {
          // Table might not exist
        }

        return {
          ...user,
          follower_count: followerCount || 0,
          published_workouts: publishedCount,
        };
      }));

      return { data: enrichedData, error: null };
    } catch (err) {
      console.warn('searchUsers error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Subscribe to a user (for public accounts) - uses friendships table
  async subscribeToUser(subscriberId, targetUserId) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .upsert({
          user_id: subscriberId,
          friend_id: targetUserId,
          status: 'accepted',
          requested_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        }, { onConflict: 'user_id,friend_id' })
        .select()
        .single();

      if (error) {
        console.warn('subscribeToUser error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('subscribeToUser error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Unsubscribe from a user - uses friendships table
  async unsubscribeFromUser(subscriberId, targetUserId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', subscriberId)
        .eq('friend_id', targetUserId);

      if (error) {
        console.warn('unsubscribeFromUser error:', error?.message);
      }
      return { error };
    } catch (err) {
      console.warn('unsubscribeFromUser error:', err?.message);
      return { error: err };
    }
  },

  // Send friend request - uses friendships table
  async sendFriendRequest(fromUserId, toUserId) {
    const { data, error } = await supabase
      .from('friendships')
      .upsert({
        user_id: fromUserId,
        friend_id: toUserId,
        status: 'pending',
        requested_at: new Date().toISOString(),
      }, { onConflict: 'user_id,friend_id' })
      .select()
      .single();

    return { data, error };
  },

  // Get subscriptions (users this user follows) - uses friendships table
  async getSubscriptions(userId) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id, accepted_at')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.warn('getSubscriptions error:', error?.message);
        return { data: [], error };
      }

      // Fetch profiles separately to avoid FK join issues
      const enriched = await Promise.all((data || []).map(async (sub) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, bio, updated_at')
          .eq('id', sub.friend_id)
          .single();

        return {
          friend_id: sub.friend_id,
          accepted_at: sub.accepted_at,
          profiles: profile
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('getSubscriptions error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get subscribers (users following this user) - uses friendships table
  async getSubscribers(userId) {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        user_id,
        accepted_at,
        profiles!friendships_user_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    return { data: data || [], error };
  },
};

export default profileService;
