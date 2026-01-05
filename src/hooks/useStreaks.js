import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { streakService } from '../services/streakService';

export function useStreaks() {
  const { user } = useAuth();
  const [streaks, setStreaks] = useState({
    workout: { current_streak: 0, longest_streak: 0 },
    nutrition: { current_streak: 0, longest_streak: 0 },
    sleep: { current_streak: 0, longest_streak: 0 },
    water: { current_streak: 0, longest_streak: 0 },
    protein: { current_streak: 0, longest_streak: 0 },
    supplements: { current_streak: 0, longest_streak: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch streaks
  const fetchStreaks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await streakService.getStreaks(user.id);

      if (err) throw err;

      if (data) {
        const streakMap = {};
        data.forEach(streak => {
          streakMap[streak.streak_type] = streak;
        });
        setStreaks(prev => ({ ...prev, ...streakMap }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  // Refresh all streaks (recalculate from data)
  const refreshAllStreaks = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' };

    setLoading(true);
    try {
      const result = await streakService.refreshAllStreaks(user.id);
      await fetchStreaks(); // Reload from DB
      return { data: result, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user, fetchStreaks]);

  // Get formatted streaks for display
  const formattedStreaks = {
    weeklyWorkouts: {
      current: streaks.workout?.current_streak || 0,
      longest: streaks.workout?.longest_streak || 0,
    },
    calories: {
      current: streaks.nutrition?.current_streak || 0,
      longest: streaks.nutrition?.longest_streak || 0,
    },
    protein: {
      current: streaks.protein?.current_streak || 0,
      longest: streaks.protein?.longest_streak || 0,
    },
    water: {
      current: streaks.water?.current_streak || 0,
      longest: streaks.water?.longest_streak || 0,
    },
    sleep: {
      current: streaks.sleep?.current_streak || 0,
      longest: streaks.sleep?.longest_streak || 0,
    },
    supplements: {
      current: streaks.supplements?.current_streak || 0,
      longest: streaks.supplements?.longest_streak || 0,
    },
  };

  // Calculate total active streaks
  const totalActiveStreaks = Object.values(formattedStreaks).filter(s => s.current > 0).length;

  // Get longest current streak
  const longestCurrentStreak = Math.max(
    ...Object.values(formattedStreaks).map(s => s.current)
  );

  return {
    // State
    streaks: formattedStreaks,
    rawStreaks: streaks,
    totalActiveStreaks,
    longestCurrentStreak,
    loading,
    error,

    // Actions
    refresh: fetchStreaks,
    refreshAll: refreshAllStreaks,
  };
}

export default useStreaks;
