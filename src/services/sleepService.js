import { supabase } from '../lib/supabase';

export const sleepService = {
  // Get sleep goals
  async getSleepGoals(userId) {
    try {
      const { data, error } = await supabase
        .from('sleep_goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('getSleepGoals error:', error?.message);
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('getSleepGoals error:', err?.message);
      return { data: null, error: null };
    }
  },

  // Update sleep goals
  async updateSleepGoals(userId, goals) {
    try {
      const { data, error } = await supabase
        .from('sleep_goals')
        .upsert({
          user_id: userId,
          ...goals,
        }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateSleepGoals error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('updateSleepGoals error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Log sleep entry
  async logSleep(userId, sleepData) {
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .upsert({
          user_id: userId,
          log_date: sleepData.date,
          bed_time: sleepData.bedTime,
          wake_time: sleepData.wakeTime,
          hours_slept: sleepData.hoursSlept,
          quality_rating: sleepData.qualityRating,
          notes: sleepData.notes,
        }, { onConflict: 'user_id,log_date' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('logSleep error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('logSleep error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get sleep log for a specific date
  async getSleepLog(userId, date = null) {
    try {
      const logDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', logDate)
        .maybeSingle();

      if (error) {
        console.warn('getSleepLog error:', error?.message);
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('getSleepLog error:', err?.message);
      return { data: null, error: null };
    }
  },

  // Get sleep history for date range
  async getSleepHistory(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date');

      if (error) {
        console.warn('getSleepHistory error:', error?.message);
        return { data: [], error: null };
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getSleepHistory error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get recent sleep logs (last N days)
  async getRecentSleep(userId, days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getSleepHistory(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  },

  // Calculate average sleep for a period
  async getAverageSleep(userId, days = 7) {
    const { data } = await this.getRecentSleep(userId, days);

    if (!data || data.length === 0) {
      return { averageHours: 0, averageQuality: 0, totalLogs: 0 };
    }

    const totalHours = data.reduce((acc, log) => acc + (log.hours_slept || 0), 0);
    const totalQuality = data.reduce((acc, log) => acc + (log.quality_rating || 0), 0);
    const logsWithQuality = data.filter(log => log.quality_rating).length;

    return {
      averageHours: totalHours / data.length,
      averageQuality: logsWithQuality > 0 ? totalQuality / logsWithQuality : 0,
      totalLogs: data.length,
    };
  },

  // Check if last night's sleep is logged
  async isLastNightLogged(userId) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data } = await this.getSleepLog(userId, yesterdayStr);
    return !!data;
  },

  // Alias for getSleepRange
  async getSleepRange(userId, startDate, endDate) {
    return this.getSleepHistory(userId, startDate, endDate);
  },
};

export default sleepService;
