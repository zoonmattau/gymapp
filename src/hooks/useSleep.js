import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sleepService } from '../services/sleepService';

export function useSleep() {
  const { user } = useAuth();
  const [goals, setGoals] = useState(null);
  const [todaySleep, setTodaySleep] = useState(null);
  const [lastNightSleep, setLastNightSleep] = useState(null);
  const [recentSleep, setRecentSleep] = useState([]);
  const [averages, setAverages] = useState({ averageHours: 0, averageQuality: 0, totalLogs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sleep data
  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const [goalsResult, todayResult, lastNightResult, recentResult, avgResult] = await Promise.all([
        sleepService.getSleepGoals(user.id),
        sleepService.getSleepLog(user.id, today),
        sleepService.getSleepLog(user.id, yesterdayStr),
        sleepService.getRecentSleep(user.id, 7),
        sleepService.getAverageSleep(user.id, 7),
      ]);

      if (goalsResult.data) setGoals(goalsResult.data);
      if (todayResult.data) setTodaySleep(todayResult.data);
      if (lastNightResult.data) setLastNightSleep(lastNightResult.data);
      if (recentResult.data) setRecentSleep(recentResult.data);
      if (avgResult) setAverages(avgResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update goals
  const updateGoals = useCallback(async (newGoals) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await sleepService.updateSleepGoals(user.id, newGoals);
    if (data) setGoals(data);
    return { data, error: err };
  }, [user]);

  // Log sleep
  const logSleep = useCallback(async (sleepData) => {
    if (!user) return { error: 'Not authenticated' };

    // Calculate hours if not provided
    if (!sleepData.hoursSlept && sleepData.bedTime && sleepData.wakeTime) {
      const bedParts = sleepData.bedTime.split(':');
      const wakeParts = sleepData.wakeTime.split(':');

      let bedMinutes = parseInt(bedParts[0]) * 60 + parseInt(bedParts[1]);
      let wakeMinutes = parseInt(wakeParts[0]) * 60 + parseInt(wakeParts[1]);

      // Handle overnight sleep
      if (wakeMinutes < bedMinutes) {
        wakeMinutes += 24 * 60;
      }

      sleepData.hoursSlept = ((wakeMinutes - bedMinutes) / 60).toFixed(1);
    }

    const { data, error: err } = await sleepService.logSleep(user.id, sleepData);
    if (data) {
      await fetchData();
    }
    return { data, error: err };
  }, [user, fetchData]);

  // Get history
  const getHistory = useCallback(async (startDate, endDate) => {
    if (!user) return { data: null, error: 'Not authenticated' };
    return sleepService.getSleepHistory(user.id, startDate, endDate);
  }, [user]);

  // Check if last night is logged
  const isLastNightLogged = !!lastNightSleep;

  // Calculate sleep quality percentage
  const sleepQualityPercent = goals && lastNightSleep
    ? Math.min(100, Math.round((lastNightSleep.hours_slept / goals.target_hours) * 100))
    : 0;

  return {
    // State
    goals,
    todaySleep,
    lastNightSleep,
    recentSleep,
    averages,
    isLastNightLogged,
    sleepQualityPercent,
    loading,
    error,

    // Actions
    updateGoals,
    logSleep,
    getHistory,
    refresh: fetchData,
  };
}

export default useSleep;
