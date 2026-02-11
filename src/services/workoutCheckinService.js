import { supabase } from '../lib/supabase';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Readiness calculation based on weighted scores
const calculateReadiness = (responses) => {
  const weights = {
    energy: 0.25,
    mood: 0.15,
    sleep: 0.25,
    soreness: 0.20,
    motivation: 0.15,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  if (responses.energy != null) {
    weightedSum += responses.energy * weights.energy;
    totalWeight += weights.energy;
  }
  if (responses.mood != null) {
    weightedSum += responses.mood * weights.mood;
    totalWeight += weights.mood;
  }
  if (responses.sleep != null) {
    weightedSum += responses.sleep * weights.sleep;
    totalWeight += weights.sleep;
  }
  if (responses.soreness != null) {
    weightedSum += responses.soreness * weights.soreness;
    totalWeight += weights.soreness;
  }
  if (responses.motivation != null) {
    weightedSum += responses.motivation * weights.motivation;
    totalWeight += weights.motivation;
  }

  if (totalWeight === 0) return 50; // Default to middle if no responses

  // Normalize to 0-100 scale (responses are 1-5, so max is 5)
  const normalizedScore = (weightedSum / totalWeight) / 5 * 100;
  return Math.round(normalizedScore);
};

// Get workout adjustments based on readiness score
const getWorkoutAdjustments = (readinessScore) => {
  if (readinessScore >= 80) {
    return {
      weightAdjustmentPercent: 0,
      restAdjustmentSeconds: 0,
      intensity: 'full',
      message: "You're feeling great! Full intensity today.",
      color: '#22C55E', // green
    };
  } else if (readinessScore >= 60) {
    return {
      weightAdjustmentPercent: -10,
      restAdjustmentSeconds: 15,
      intensity: 'moderate',
      message: 'Slightly reduced intensity recommended.',
      color: '#3B82F6', // blue
    };
  } else if (readinessScore >= 40) {
    return {
      weightAdjustmentPercent: -20,
      restAdjustmentSeconds: 30,
      intensity: 'light',
      message: 'Take it easy today. Light workout recommended.',
      color: '#F59E0B', // yellow/amber
    };
  } else {
    return {
      weightAdjustmentPercent: -30,
      restAdjustmentSeconds: 45,
      intensity: 'skip',
      message: 'Consider resting today or a very light session.',
      color: '#EF4444', // red
    };
  }
};

export const workoutCheckinService = {
  // Calculate readiness score from responses
  calculateReadiness,

  // Get workout adjustments based on readiness
  getWorkoutAdjustments,

  // Save a pre-workout check-in
  async saveCheckin(userId, checkinData) {
    try {
      const readinessScore = calculateReadiness({
        energy: checkinData.energyLevel,
        mood: checkinData.moodState,
        sleep: checkinData.sleepQuality,
        soreness: checkinData.muscleSoreness,
        motivation: checkinData.motivationLevel,
      });

      const adjustments = getWorkoutAdjustments(readinessScore);

      const { data, error } = await supabase
        .from('workout_checkins')
        .insert({
          user_id: userId,
          session_id: checkinData.sessionId || null,
          energy_level: checkinData.energyLevel,
          mood_state: checkinData.moodState,
          sleep_quality: checkinData.sleepQuality,
          muscle_soreness: checkinData.muscleSoreness,
          motivation_level: checkinData.motivationLevel,
          readiness_score: readinessScore,
          sleep_hours: checkinData.sleepHours || null,
          sleep_auto_filled: checkinData.sleepAutoFilled || false,
          weight_adjustment_percent: adjustments.weightAdjustmentPercent,
          rest_adjustment_seconds: adjustments.restAdjustmentSeconds,
          suggested_intensity: adjustments.intensity,
          user_overrode: checkinData.userOverrode || false,
        })
        .select()
        .single();

      if (error) {
        console.warn('saveCheckin error:', error?.message);
        return { data: null, error };
      }

      return {
        data: {
          ...data,
          adjustments,
        },
        error: null
      };
    } catch (err) {
      console.warn('saveCheckin exception:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update check-in with session ID after workout starts
  async linkCheckinToSession(checkinId, sessionId) {
    try {
      const { data, error } = await supabase
        .from('workout_checkins')
        .update({ session_id: sessionId })
        .eq('id', checkinId)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('linkCheckinToSession error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('linkCheckinToSession exception:', err?.message);
      return { data: null, error: err };
    }
  },

  // Mark that user overrode the suggested intensity
  async markUserOverride(checkinId) {
    try {
      const { data, error } = await supabase
        .from('workout_checkins')
        .update({ user_overrode: true })
        .eq('id', checkinId)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('markUserOverride error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('markUserOverride exception:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get recent check-ins for a user
  async getRecentCheckins(userId, limit = 30) {
    try {
      const { data, error } = await supabase
        .from('workout_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('getRecentCheckins error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getRecentCheckins exception:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get check-in for a specific session
  async getCheckinForSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('workout_checkins')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        console.warn('getCheckinForSession error:', error?.message);
        return { data: null, error: null };
      }

      return { data, error: null };
    } catch (err) {
      console.warn('getCheckinForSession exception:', err?.message);
      return { data: null, error: null };
    }
  },

  // Get today's check-in (if any)
  async getTodayCheckin(userId) {
    try {
      const today = getLocalDateString();
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;

      const { data, error } = await supabase
        .from('workout_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('getTodayCheckin error:', error?.message);
        return { data: null, error: null };
      }

      return { data, error: null };
    } catch (err) {
      console.warn('getTodayCheckin exception:', err?.message);
      return { data: null, error: null };
    }
  },

  // Get check-in statistics for a user
  async getCheckinStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = getLocalDateString(startDate);

      const { data, error } = await supabase
        .from('workout_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${startDateStr}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('getCheckinStats error:', error?.message);
        return { data: null, error: null };
      }

      if (!data || data.length === 0) {
        return {
          data: {
            totalCheckins: 0,
            averageReadiness: 0,
            averageEnergy: 0,
            averageSleep: 0,
            averageSoreness: 0,
            overrideRate: 0,
          },
          error: null,
        };
      }

      const totalCheckins = data.length;
      const avgReadiness = data.reduce((sum, c) => sum + (c.readiness_score || 0), 0) / totalCheckins;
      const avgEnergy = data.reduce((sum, c) => sum + (c.energy_level || 0), 0) / totalCheckins;
      const avgSleep = data.reduce((sum, c) => sum + (c.sleep_quality || 0), 0) / totalCheckins;
      const avgSoreness = data.reduce((sum, c) => sum + (c.muscle_soreness || 0), 0) / totalCheckins;
      const overrideCount = data.filter(c => c.user_overrode).length;

      return {
        data: {
          totalCheckins,
          averageReadiness: Math.round(avgReadiness),
          averageEnergy: Math.round(avgEnergy * 10) / 10,
          averageSleep: Math.round(avgSleep * 10) / 10,
          averageSoreness: Math.round(avgSoreness * 10) / 10,
          overrideRate: Math.round((overrideCount / totalCheckins) * 100),
        },
        error: null,
      };
    } catch (err) {
      console.warn('getCheckinStats exception:', err?.message);
      return { data: null, error: null };
    }
  },
};

export default workoutCheckinService;
