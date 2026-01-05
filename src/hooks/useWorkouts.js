import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { supabase } from '../lib/supabase';

export function useWorkouts() {
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [
        scheduleResult,
        historyResult,
        prsResult,
        exercisesResult,
        templatesResult,
        programResult,
      ] = await Promise.all([
        workoutService.getTodaySchedule(user.id),
        workoutService.getWorkoutHistory(user.id),
        workoutService.getPersonalRecords(user.id),
        workoutService.getExercises(),
        workoutService.getWorkoutTemplates(),
        workoutService.getActiveProgram(user.id),
      ]);

      if (scheduleResult.data) setTodaySchedule(scheduleResult.data);
      if (historyResult.data) setWorkoutHistory(historyResult.data);
      if (prsResult.data) setPersonalRecords(prsResult.data);
      if (exercisesResult.data) setExercises(exercisesResult.data);
      if (templatesResult.data) setTemplates(templatesResult.data);
      if (programResult.data) setActiveProgram(programResult.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for workout updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('workout_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user, fetchData]);

  // Start a workout
  const startWorkout = useCallback(async (templateId, workoutName = null) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await workoutService.startWorkout(
      user.id,
      templateId,
      todaySchedule?.id,
      workoutName
    );

    if (data) {
      setActiveSession(data);
    }

    return { data, error: err };
  }, [user, todaySchedule]);

  // Log a set
  const logSet = useCallback(async (exerciseId, exerciseName, setData) => {
    if (!activeSession) return { error: 'No active session' };

    const { data, error: err } = await workoutService.logSet(
      activeSession.id,
      exerciseId,
      exerciseName,
      setData
    );

    // Check for PR
    if (data && !setData.isWarmup) {
      await workoutService.checkAndCreatePR(
        user.id,
        exerciseId,
        exerciseName,
        setData.weight,
        setData.reps,
        activeSession.id
      );
    }

    return { data, error: err };
  }, [activeSession, user]);

  // Complete workout
  const completeWorkout = useCallback(async (summary) => {
    if (!activeSession) return { error: 'No active session' };

    const { data, error: err } = await workoutService.completeWorkout(
      activeSession.id,
      {
        ...summary,
        scheduleId: todaySchedule?.id,
      }
    );

    if (data) {
      setActiveSession(null);
      await fetchData(); // Refresh data
    }

    return { data, error: err };
  }, [activeSession, todaySchedule, fetchData]);

  // Cancel workout
  const cancelWorkout = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Get schedule for date range
  const getSchedule = useCallback(async (startDate, endDate) => {
    if (!user) return { data: null, error: 'Not authenticated' };
    return workoutService.getSchedule(user.id, startDate, endDate);
  }, [user]);

  // Set workout for a specific date
  const setWorkoutForDate = useCallback(async (date, templateId, isRestDay = false) => {
    if (!user) return { error: 'Not authenticated' };
    return workoutService.setScheduleForDate(user.id, date, templateId, isRestDay);
  }, [user]);

  // Save program
  const saveProgram = useCallback(async (program) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error: err } = await workoutService.saveProgram(user.id, program);
    if (data) setActiveProgram(data);
    return { data, error: err };
  }, [user]);

  return {
    // State
    todaySchedule,
    workoutHistory,
    personalRecords,
    activeSession,
    exercises,
    templates,
    activeProgram,
    loading,
    error,

    // Actions
    startWorkout,
    logSet,
    completeWorkout,
    cancelWorkout,
    getSchedule,
    setWorkoutForDate,
    saveProgram,
    refresh: fetchData,
  };
}

export default useWorkouts;
