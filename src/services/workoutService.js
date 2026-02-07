import { supabase } from '../lib/supabase';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const workoutService = {
  // Get all exercises
  async getExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    return { data, error };
  },

  // Get all workout templates
  async getWorkoutTemplates() {
    const { data, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        workout_template_exercises (
          *,
          exercises (*)
        )
      `)
      .order('name');

    return { data, error };
  },

  // Get today's scheduled workout
  async getTodaySchedule(userId) {
    const today = getLocalDateString();
    const { data, error } = await supabase
      .from('workout_schedule')
      .select(`
        *,
        workout_templates (
          *,
          workout_template_exercises (
            *,
            exercises (*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('scheduled_date', today)
      .maybeSingle();

    return { data, error };
  },

  // Get workout schedule for date range
  async getSchedule(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('workout_schedule')
      .select(`
        *,
        workout_templates (*)
      `)
      .eq('user_id', userId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date');

    return { data, error };
  },

  // Set workout for a date
  async setScheduleForDate(userId, date, templateId, isRestDay = false) {
    const { data, error } = await supabase
      .from('workout_schedule')
      .upsert({
        user_id: userId,
        scheduled_date: date,
        template_id: isRestDay ? null : templateId,
        is_rest_day: isRestDay,
      }, { onConflict: 'user_id,scheduled_date' })
      .select()
      .single();

    return { data, error };
  },

  // Start a workout session
  async startWorkout(userId, templateId, scheduleId = null, workoutName = null) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        template_id: templateId,
        schedule_id: scheduleId,
        workout_name: workoutName,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Log a completed set
  async logSet(sessionId, exerciseId, exerciseName, setData) {
    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        set_number: setData.setNumber,
        weight: setData.weight,
        reps: setData.reps,
        rpe: setData.rpe || null,
        is_warmup: setData.isWarmup || false,
      })
      .select()
      .single();

    return { data, error };
  },

  // Update a logged set
  async updateSet(setId, updates) {
    const { data, error } = await supabase
      .from('workout_sets')
      .update(updates)
      .eq('id', setId)
      .select()
      .maybeSingle();

    return { data, error };
  },

  // Complete workout session
  async completeWorkout(sessionId, summary) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: summary.durationMinutes,
        total_volume: summary.totalVolume,
        total_working_time: summary.workingTime,
        total_rest_time: summary.restTime,
        notes: summary.notes,
      })
      .eq('id', sessionId)
      .select()
      .maybeSingle();

    // Mark schedule as completed if schedule_id exists
    if (summary.scheduleId) {
      await supabase
        .from('workout_schedule')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', summary.scheduleId);
    }

    return { data, error };
  },

  // Get total completed workout count (uses exact count, no row limit)
  async getWorkoutCount(userId) {
    try {
      const { count, error } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('ended_at', 'is', null);

      if (error) {
        console.warn('getWorkoutCount error:', error?.message);
        return { count: 0, error };
      }

      return { count: count || 0, error: null };
    } catch (err) {
      console.warn('getWorkoutCount exception:', err?.message);
      return { count: 0, error: err };
    }
  },

  // Get workout history
  async getWorkoutHistory(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn('getWorkoutHistory error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getWorkoutHistory error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get personal records
  async getPersonalRecords(userId) {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    return { data, error };
  },

  // Get completed workout sessions for a user
  async getCompletedSessions(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('getCompletedSessions error:', error?.message);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getCompletedSessions exception:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get workout status for a list of users (active or recently completed)
  async getWorkoutStatuses(userIds) {
    try {
      if (!userIds || userIds.length === 0) return { data: {}, error: null };

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Get active sessions (started but not completed)
      const { data: activeSessions } = await supabase
        .from('workout_sessions')
        .select('user_id, workout_name, started_at')
        .in('user_id', userIds)
        .is('ended_at', null)
        .gte('started_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()); // Started within 4 hours

      // Get recently completed sessions
      const { data: recentSessions } = await supabase
        .from('workout_sessions')
        .select('user_id, workout_name, ended_at')
        .in('user_id', userIds)
        .not('ended_at', 'is', null)
        .gte('ended_at', oneHourAgo)
        .order('ended_at', { ascending: false });

      const statuses = {};

      // Mark active workouts
      (activeSessions || []).forEach(session => {
        if (!statuses[session.user_id]) {
          const startTime = new Date(session.started_at);
          const duration = Math.floor((Date.now() - startTime) / (1000 * 60));
          statuses[session.user_id] = {
            status: 'working_out',
            workoutName: session.workout_name || 'Workout',
            duration: duration,
          };
        }
      });

      // Mark recently completed (only if not already working out)
      (recentSessions || []).forEach(session => {
        if (!statuses[session.user_id]) {
          const completedTime = new Date(session.ended_at);
          const minutesAgo = Math.floor((Date.now() - completedTime) / (1000 * 60));
          statuses[session.user_id] = {
            status: 'just_finished',
            workoutName: session.workout_name || 'Workout',
            minutesAgo: minutesAgo,
          };
        }
      });

      return { data: statuses, error: null };
    } catch (err) {
      console.warn('getWorkoutStatuses error:', err?.message);
      return { data: {}, error: err };
    }
  },

  // Get exercise history for progressive overload (last weight/reps per exercise)
  async getExerciseHistory(userId) {
    try {
      // First get user's recent workout sessions
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, started_at')
        .eq('user_id', userId)
        .gte('started_at', ninetyDaysAgo);

      if (sessionsError || !sessions || sessions.length === 0) {
        return { data: {}, error: null };
      }

      const sessionIds = sessions.map(s => s.id);

      // Then get workout sets for those sessions
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .in('session_id', sessionIds)
        .eq('is_warmup', false)
        .order('completed_at', { ascending: false });

      if (error) {
        console.warn('Error fetching exercise history:', error?.message);
        return { data: {}, error: null };
      }

      if (!data || data.length === 0) {
        return { data: {}, error: null };
      }

      // Group by exercise name to get the last performed sets
      const exerciseHistory = {};
      data.forEach(set => {
        const exerciseName = set.exercise_name;
        if (!exerciseName) return;

        if (!exerciseHistory[exerciseName]) {
          exerciseHistory[exerciseName] = {
            lastWeight: set.weight || 0,
            lastReps: set.reps || 0,
            lastRpe: set.rpe,
            lastPerformedAt: set.completed_at,
          };
        }
      });

      return { data: exerciseHistory, error: null };
    } catch (err) {
      console.warn('Exception in getExerciseHistory:', err?.message);
      return { data: {}, error: null };
    }
  },

  // Check and create PR if applicable
  async checkAndCreatePR(userId, exerciseId, exerciseName, weight, reps, sessionId = null) {
    // Calculate estimated 1RM using Epley formula
    const e1rm = weight * (1 + reps / 30);

    // Get current PR for this exercise
    const { data: currentPR } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('e1rm', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if new PR
    if (!currentPR || e1rm > currentPR.e1rm) {
      const { data, error } = await supabase
        .from('personal_records')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          weight,
          reps,
          e1rm,
          workout_session_id: sessionId,
        })
        .select()
        .single();

      return { data, error, isNewPR: true };
    }

    return { data: null, error: null, isNewPR: false };
  },

  // Get user's active program
  async getActiveProgram(userId) {
    const { data, error } = await supabase
      .from('user_programs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    return { data, error };
  },

  // Create or update program
  async saveProgram(userId, program) {
    // Deactivate other programs first
    await supabase
      .from('user_programs')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { data, error } = await supabase
      .from('user_programs')
      .insert({
        user_id: userId,
        ...program,
        is_active: true,
      })
      .select()
      .single();

    return { data, error };
  },

  // Get all workout templates
  async getWorkoutTemplates() {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          template_exercises (
            order_index,
            sets,
            target_reps,
            suggested_weight,
            rest_time,
            exercise:exercises (
              id,
              name,
              muscle_group,
              equipment,
              exercise_type
            )
          )
        `)
        .eq('is_system', true)
        .order('name');

      if (error) {
        console.warn('getWorkoutTemplates error:', error?.message);
        return { data: [], error: null };
      }

      // Transform to match existing WORKOUT_TEMPLATES structure
      const templates = (data || []).map(template => ({
        id: template.id,
        name: template.name,
        focus: template.focus,
        description: template.description,
        goals: template.goals || [],
        difficulty: template.difficulty,
        exercises: (template.template_exercises || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map(te => ({
            id: te.exercise.id,
            name: te.exercise.name,
            sets: te.sets,
            targetReps: te.target_reps,
            suggestedWeight: te.suggested_weight,
            lastWeight: 0,
            lastReps: [],
            restTime: te.rest_time,
            muscleGroup: te.exercise.muscle_group
          }))
      }));

      return { data: templates, error: null };
    } catch (err) {
      console.warn('getWorkoutTemplates error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get a single workout template by ID
  async getWorkoutTemplate(templateId) {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          template_exercises (
            order_index,
            sets,
            target_reps,
            suggested_weight,
            rest_time,
            exercise:exercises (
              id,
              name,
              muscle_group,
              equipment,
              exercise_type
            )
          )
        `)
        .eq('id', templateId)
        .maybeSingle();

      if (error) {
        console.warn('getWorkoutTemplate error:', error?.message);
        return { data: null, error: null };
      }

      if (!data) {
        return { data: null, error: null };
      }

      // Transform to match existing structure
      const template = {
        id: data.id,
        name: data.name,
        focus: data.focus,
        description: data.description,
        goals: data.goals || [],
        difficulty: data.difficulty,
        exercises: (data.template_exercises || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map(te => ({
            id: te.exercise.id,
            name: te.exercise.name,
            sets: te.sets,
            targetReps: te.target_reps,
            suggestedWeight: te.suggested_weight,
            lastWeight: 0,
            lastReps: [],
            restTime: te.rest_time,
            muscleGroup: te.exercise.muscle_group
          }))
      };

      return { data: template, error: null };
    } catch (err) {
      console.warn('getWorkoutTemplate error:', err?.message);
      return { data: null, error: null };
    }
  },
};

export default workoutService;
