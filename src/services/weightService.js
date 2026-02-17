import { supabase } from '../lib/supabase';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const weightService = {
  // Log a weight entry
  async logWeight(userId, weight, unit = 'kg', date = null) {
    try {
      const logDate = date || getLocalDateString();

      // Convert to kg if needed for consistent storage
      const weightKg = unit === 'lbs' ? weight / 2.205 : weight;

      console.log('weightService.logWeight:', { userId, weightKg, logDate });

      const { data, error } = await supabase
        .from('weight_logs')
        .upsert({
          user_id: userId,
          log_date: logDate,
          weight: weightKg,
        }, { onConflict: 'user_id,log_date' })
        .select()
        .maybeSingle();

      console.log('Supabase upsert result:', { data, error });

      if (error) {
        console.warn('logWeight error:', error?.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.warn('logWeight error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update the user's profile with current weight
  async updateProfileWeight(userId, weightKg) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_weight: weightKg })
        .eq('id', userId);

      if (error) {
        console.warn('updateProfileWeight error:', error?.message);
      }
      return { error };
    } catch (err) {
      console.warn('updateProfileWeight error:', err?.message);
      return { error: err };
    }
  },

  // Get weight for a specific date
  async getWeight(userId, date = null) {
    try {
      const logDate = date || getLocalDateString();

      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', logDate)
        .maybeSingle();

      if (error) {
        console.warn('getWeight error:', error?.message);
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('getWeight error:', err?.message);
      return { data: null, error: null };
    }
  },

  // Get weight history for date range
  async getWeightHistory(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: true });

      if (error) {
        console.warn('getWeightHistory error:', error?.message);
        return { data: [], error: null };
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getWeightHistory error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get recent weight logs
  async getRecentWeights(userId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getWeightHistory(
      userId,
      getLocalDateString(startDate),
      getLocalDateString(endDate)
    );
  },

  // Get all weight logs for a user
  async getAllWeights(userId) {
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: true });

      if (error) {
        console.warn('getAllWeights error:', error?.message);
        return { data: [], error: null };
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getAllWeights error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get latest weight
  async getLatestWeight(userId) {
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('getLatestWeight error:', error?.message);
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('getLatestWeight error:', err?.message);
      return { data: null, error: null };
    }
  },

  // Get weight statistics
  async getWeightStats(userId) {
    try {
      const { data: weights } = await this.getAllWeights(userId);

      if (!weights || weights.length === 0) {
        return {
          current: null,
          start: null,
          lowest: null,
          highest: null,
          change: 0,
          totalLogs: 0,
        };
      }

      const weightValues = weights.map(w => w.weight);
      const current = weights[weights.length - 1].weight;
      const start = weights[0].weight;
      const lowest = Math.min(...weightValues);
      const highest = Math.max(...weightValues);
      const change = current - start;

      return {
        current,
        start,
        lowest,
        highest,
        change,
        totalLogs: weights.length,
      };
    } catch (err) {
      console.warn('getWeightStats error:', err?.message);
      return {
        current: null,
        start: null,
        lowest: null,
        highest: null,
        change: 0,
        totalLogs: 0,
      };
    }
  },

  // Delete a weight log
  async deleteWeight(userId, date) {
    try {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('user_id', userId)
        .eq('log_date', date);

      if (error) {
        console.warn('deleteWeight error:', error?.message);
      }
      return { error };
    } catch (err) {
      console.warn('deleteWeight error:', err?.message);
      return { error: err };
    }
  },

  // Calculate progress towards goal
  calculateProgress(currentWeight, startWeight, goalWeight) {
    if (!currentWeight || !startWeight || !goalWeight) return 0;

    const totalChange = Math.abs(startWeight - goalWeight);
    const currentChange = Math.abs(currentWeight - startWeight);

    if (totalChange === 0) return 100;

    // Check if moving in the right direction
    const isLosingGoal = goalWeight < startWeight;
    const isMovingCorrectly = isLosingGoal
      ? currentWeight <= startWeight
      : currentWeight >= startWeight;

    if (!isMovingCorrectly) return 0;

    const progress = Math.min((currentChange / totalChange) * 100, 100);
    return Math.round(progress);
  },
};

export default weightService;
