import { supabase } from '../lib/supabase';

export const sleepService = {
  // Get sleep goals
  async getSleepGoals(userId) {
    const { data, error } = await supabase
      .from('sleep_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  },

  // Update sleep goals
  async updateSleepGoals(userId, goals) {
    const { data, error } = await supabase
      .from('sleep_goals')
      .upsert({
        user_id: userId,
        ...goals,
      })
      .select()
      .single();

    return { data, error };
  },

  // Log sleep entry
  async logSleep(userId, sleepData) {
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
      })
      .select()
      .single();

    return { data, error };
  },

  // Get sleep log for a specific date
  async getSleepLog(userId, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .single();

    return { data, error };
  },

  // Get sleep history for date range
  async getSleepHistory(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date');

    return { data, error };
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
