import { supabase } from '../lib/supabase';
import { EXERCISES } from '../constants/exercises';

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

    // First try to get schedule with joined template data
    let { data, error } = await supabase
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

    // If that fails (e.g. template_id is a string key not a UUID),
    // try getting just the schedule record
    if (error || (!data?.workout_templates && !data?.is_rest_day)) {
      const simpleResult = await supabase
        .from('workout_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_date', today)
        .maybeSingle();

      if (simpleResult.data) {
        data = simpleResult.data;
        error = null;
      }
    }

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
    const payload = {
      user_id: userId,
      scheduled_date: date,
      template_id: isRestDay ? null : templateId,
      is_rest_day: isRestDay,
    };

    // Delete existing entry first, then insert (more reliable than upsert)
    await supabase.from('workout_schedule').delete()
      .eq('user_id', userId).eq('scheduled_date', date);

    const { data, error } = await supabase
      .from('workout_schedule')
      .insert(payload)
      .select()
      .single();

    return { data, error };
  },

  // Start a workout session
  async startWorkout(userId, templateId, scheduleId = null, workoutName = null) {
    // Only use template_id if it's a valid UUID (36 chars with dashes)
    // Non-UUID template IDs (like "push_day") are from hardcoded templates
    const isValidUuid = templateId &&
      typeof templateId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        template_id: isValidUuid ? templateId : null,
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
    // If no exerciseId provided, look it up by name
    let finalExerciseId = exerciseId;
    if (!finalExerciseId && exerciseName) {
      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exerciseName)
        .maybeSingle();

      if (exerciseData?.id) {
        finalExerciseId = exerciseData.id;
      }
    }

    // Auto-create exercise in DB if not found
    if (!finalExerciseId && exerciseName) {
      const localExercise = EXERCISES.find(e => e.name === exerciseName);
      const { data: newExercise, error: createError } = await supabase
        .from('exercises')
        .upsert({
          name: exerciseName,
          muscle_group: localExercise?.muscleGroup || 'Full Body',
          equipment: localExercise?.equipment || null,
          exercise_type: (localExercise?.type || 'compound').toLowerCase(),
        }, { onConflict: 'name' })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create exercise:', exerciseName, createError);
      } else if (newExercise?.id) {
        finalExerciseId = newExercise.id;
      }
    }

    if (!finalExerciseId) {
      console.error('Could not resolve exercise_id for:', exerciseName);
      return { data: null, error: { message: 'Could not resolve exercise: ' + exerciseName } };
    }

    const insertData = {
      session_id: sessionId,
      exercise_id: finalExerciseId,
      exercise_name: exerciseName,
      set_number: setData.setNumber,
      weight: setData.weight,
      reps: setData.reps,
      rpe: setData.rpe || null,
      is_warmup: setData.isWarmup || false,
    };

    const { data, error } = await supabase
      .from('workout_sets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('logSet error:', error);
    }

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

  // Delete all sets for a session (used when re-saving edited workout)
  async deleteSessionSets(sessionId) {
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('deleteSessionSets error:', error);
    }
    return { error };
  },

  // Complete workout session
  async completeWorkout(sessionId, summary) {
    console.log('completeWorkout called:', { sessionId, summary });
    // Only update fields that definitely exist
    const updateData = {
      ended_at: new Date().toISOString(),
    };

    // Add optional fields only if they have values (only columns that exist in DB)
    if (summary.durationMinutes !== undefined) updateData.duration_minutes = summary.durationMinutes;
    if (summary.totalVolume !== undefined) updateData.total_volume = summary.totalVolume;
    // Note: exercise_count and total_sets columns don't exist in DB

    console.log('Updating workout_sessions with:', updateData);
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('completeWorkout error:', error);
    } else {
      console.log('completeWorkout success:', data);
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

  // Get completed workout sessions for a date range
  async getCompletedSessionsForDateRange(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('started_at', `${startDate}T00:00:00`)
        .lte('started_at', `${endDate}T23:59:59`)
        .order('started_at', { ascending: true });

      if (error) {
        console.warn('getCompletedSessionsForDateRange error:', error?.message);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getCompletedSessionsForDateRange exception:', err?.message);
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
      // First get user's recent completed workout sessions (ordered by most recent)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, started_at')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('started_at', ninetyDaysAgo)
        .order('started_at', { ascending: false });

      if (sessionsError || !sessions || sessions.length === 0) {
        return { data: {}, error: null };
      }

      const sessionIds = sessions.map(s => s.id);

      // Create a map of session ID to order (most recent first)
      const sessionOrder = {};
      sessions.forEach((s, idx) => {
        sessionOrder[s.id] = idx;
      });

      // Then get workout sets for those sessions
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .in('session_id', sessionIds)
        .eq('is_warmup', false);

      if (error) {
        console.warn('Error fetching exercise history:', error?.message);
        return { data: {}, error: null };
      }

      if (!data || data.length === 0) {
        return { data: {}, error: null };
      }

      // Sort sets by session order (most recent session first), then by set_number desc
      data.sort((a, b) => {
        const orderA = sessionOrder[a.session_id] ?? 999;
        const orderB = sessionOrder[b.session_id] ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return (b.set_number || 0) - (a.set_number || 0);
      });

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
            sessionId: set.session_id,
          };
        }
      });

      return { data: exerciseHistory, error: null };
    } catch (err) {
      console.warn('Exception in getExerciseHistory:', err?.message);
      return { data: {}, error: null };
    }
  },

  // Get detailed exercise history (last N sessions with full set data for a specific exercise)
  async getDetailedExerciseHistory(userId, exerciseName, sessionLimit = 5) {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      // Get user's recent completed sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, started_at')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('started_at', ninetyDaysAgo)
        .order('started_at', { ascending: false });

      if (sessionsError || !sessions || sessions.length === 0) {
        return { data: [], error: null };
      }

      const sessionIds = sessions.map(s => s.id);

      // Get sets for this specific exercise across those sessions
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select('*')
        .in('session_id', sessionIds)
        .eq('exercise_name', exerciseName)
        .eq('is_warmup', false);

      if (setsError || !sets || sets.length === 0) {
        return { data: [], error: null };
      }

      // Build a map of session ID -> date
      const sessionDateMap = {};
      sessions.forEach(s => {
        sessionDateMap[s.id] = s.started_at;
      });

      // Group sets by session
      const sessionSetsMap = {};
      sets.forEach(set => {
        if (!sessionSetsMap[set.session_id]) {
          sessionSetsMap[set.session_id] = [];
        }
        sessionSetsMap[set.session_id].push({
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          setNumber: set.set_number,
        });
      });

      // Build result array, ordered by most recent, limited to sessionLimit
      const result = sessions
        .filter(s => sessionSetsMap[s.id])
        .slice(0, sessionLimit)
        .map(s => ({
          sessionId: s.id,
          date: s.started_at,
          sets: sessionSetsMap[s.id].sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0)),
        }));

      return { data: result, error: null };
    } catch (err) {
      console.warn('getDetailedExerciseHistory error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Check and create PR if applicable
  async checkAndCreatePR(userId, exerciseId, exerciseName, weight, reps, sessionId = null) {
    console.log('checkAndCreatePR called:', { userId, exerciseName, weight, reps, sessionId });
    // Calculate estimated 1RM using Epley formula
    const e1rm = weight * (1 + reps / 30);

    // Get current PR for this exercise (by name since exerciseId may be null)
    let query = supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId);

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId);
    } else if (exerciseName) {
      query = query.eq('exercise_name', exerciseName);
    }

    const { data: currentPR } = await query
      .order('e1rm', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if new PR
    if (!currentPR || e1rm > currentPR.e1rm) {
      console.log('Creating new PR for', exerciseName, '- e1rm:', e1rm);
      const { data, error } = await supabase
        .from('personal_records')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          weight,
          reps,
          e1rm,
          achieved_at: new Date().toISOString(),
          workout_session_id: sessionId,
        })
        .select()
        .single();

      if (error) {
        console.error('PR insert error:', error);
      } else {
        console.log('PR created successfully:', data);
      }
      return { data, error, isNewPR: true };
    }

    return { data: null, error: null, isNewPR: false };
  },

  // One-time backfill: scan all workout history and populate personal_records
  async backfillPersonalRecords(userId) {
    try {
      // Get all completed sessions
      const { data: sessions, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .not('ended_at', 'is', null);

      if (sessErr || !sessions || sessions.length === 0) return;

      // Build best E1RM per exercise from all workout sets
      const prMap = {}; // { exerciseName: { weight, reps, e1rm } }

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < sessions.length; i += batchSize) {
        const batch = sessions.slice(i, i + batchSize).map(s => s.id);
        const { data: sets } = await supabase
          .from('workout_sets')
          .select('exercise_name, weight, reps')
          .in('session_id', batch)
          .eq('is_warmup', false);

        if (sets) {
          sets.forEach(s => {
            const w = parseFloat(s.weight) || 0;
            const r = parseInt(s.reps) || 0;
            if (w <= 0 || r <= 0 || s.weight === 'BW') return;
            const e1rm = r === 1 ? w : Math.round(w * (1 + r / 30));
            if (!prMap[s.exercise_name] || e1rm > prMap[s.exercise_name].e1rm) {
              prMap[s.exercise_name] = { weight: w, reps: r, e1rm };
            }
          });
        }
      }

      // Insert into personal_records for each exercise (skip if already exists with higher e1rm)
      for (const [exerciseName, best] of Object.entries(prMap)) {
        const { data: existing } = await supabase
          .from('personal_records')
          .select('e1rm')
          .eq('user_id', userId)
          .eq('exercise_name', exerciseName)
          .order('e1rm', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!existing || best.e1rm > existing.e1rm) {
          await supabase.from('personal_records').insert({
            user_id: userId,
            exercise_name: exerciseName,
            weight: best.weight,
            reps: best.reps,
            e1rm: best.e1rm,
            achieved_at: new Date().toISOString(),
          });
        }
      }

      console.log('PR backfill complete:', Object.keys(prMap).length, 'exercises');
    } catch (err) {
      console.error('PR backfill error:', err);
    }
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

  // Delete a completed workout session and its sets
  async deleteWorkoutSession(sessionId) {
    try {
      // Delete associated sets first
      await supabase
        .from('workout_sets')
        .delete()
        .eq('session_id', sessionId);

      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId);

      return { error };
    } catch (err) {
      console.error('Error deleting workout session:', err);
      return { error: err };
    }
  },

  // Rename a completed workout session
  async renameWorkoutSession(sessionId, newName) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .update({ workout_name: newName })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error renaming workout session:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error renaming workout session:', err);
      return { data: null, error: err };
    }
  },

  async updateWorkoutSession(sessionId, updates) {
    try {
      console.log('updateWorkoutSession called with:', sessionId, updates);
      const { data, error, count } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select();

      console.log('Update result - data:', data, 'error:', error, 'count:', count);

      if (error) {
        console.error('Error updating workout session:', error);
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        console.warn('No rows updated - sessionId may not exist:', sessionId);
        return { data: null, error: { message: 'No rows found with that sessionId' } };
      }

      return { data: data[0], error: null };
    } catch (err) {
      console.error('Error updating workout session:', err);
      return { data: null, error: err };
    }
  },
};

export default workoutService;
