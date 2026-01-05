import { supabase } from '../lib/supabase';

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
    const today = new Date().toISOString().split('T')[0];
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
      .single();

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
      })
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
      .single();

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
      .single();

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

  // Get workout history
  async getWorkoutHistory(userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_sets (*)
      `)
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
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
      .single();

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
      .single();

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
      .upsert({
        user_id: userId,
        ...program,
        is_active: true,
      })
      .select()
      .single();

    return { data, error };
  },
};

export default workoutService;
