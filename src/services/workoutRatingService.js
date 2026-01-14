import { supabase } from '../lib/supabase';

export const workoutRatingService = {
  // Rate a workout (1-5 stars)
  async rateWorkout(userId, workoutId, rating) {
    try {
      if (!userId || !workoutId || rating < 1 || rating > 5) {
        return { data: null, error: 'Invalid parameters' };
      }

      // Get existing rating to calculate delta
      const { data: existingRating } = await supabase
        .from('workout_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .single();

      const isNewRating = !existingRating;
      const oldRating = existingRating?.rating || 0;

      // Upsert the rating
      const { data, error } = await supabase
        .from('workout_ratings')
        .upsert({
          user_id: userId,
          workout_id: workoutId,
          workout_type: 'system',
          rating: rating,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Error rating workout:', error?.message);
        return { data: null, error };
      }

      // Update aggregated stats
      await this.updateWorkoutStats(workoutId, isNewRating, rating, oldRating);

      return { data, error: null };
    } catch (err) {
      console.warn('Error rating workout:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update workout stats after a rating change
  async updateWorkoutStats(workoutId, isNewRating, newRating, oldRating) {
    try {
      // Get current stats
      const { data: currentStats } = await supabase
        .from('workout_stats')
        .select('*')
        .eq('workout_id', workoutId)
        .single();

      if (!currentStats) {
        // Create new stats record
        await supabase
          .from('workout_stats')
          .insert({
            workout_id: workoutId,
            workout_type: 'system',
            completion_count: 0,
            total_rating: newRating,
            rating_count: 1,
            updated_at: new Date().toISOString(),
          });
      } else {
        // Update existing stats
        const newTotalRating = currentStats.total_rating - oldRating + newRating;
        const newRatingCount = isNewRating ? currentStats.rating_count + 1 : currentStats.rating_count;

        await supabase
          .from('workout_stats')
          .update({
            total_rating: newTotalRating,
            rating_count: newRatingCount,
            updated_at: new Date().toISOString(),
          })
          .eq('workout_id', workoutId);
      }
    } catch (err) {
      console.warn('Error updating workout stats:', err?.message);
    }
  },

  // Get user's rating for a specific workout
  async getUserRating(userId, workoutId) {
    try {
      if (!userId || !workoutId) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from('workout_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Error getting user rating:', error?.message);
        return { data: null, error };
      }

      return { data: data?.rating || null, error: null };
    } catch (err) {
      console.warn('Error getting user rating:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get all user's ratings (for local cache)
  async getAllUserRatings(userId) {
    try {
      if (!userId) {
        return { data: {}, error: null };
      }

      const { data, error } = await supabase
        .from('workout_ratings')
        .select('workout_id, rating')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error getting user ratings:', error?.message);
        return { data: {}, error };
      }

      // Convert to map for easy lookup
      const ratingsMap = {};
      (data || []).forEach(r => {
        ratingsMap[r.workout_id] = r.rating;
      });

      return { data: ratingsMap, error: null };
    } catch (err) {
      console.warn('Error getting user ratings:', err?.message);
      return { data: {}, error: err };
    }
  },

  // Get stats for a specific workout
  async getWorkoutStats(workoutId) {
    try {
      if (!workoutId) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from('workout_stats')
        .select('*')
        .eq('workout_id', workoutId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error getting workout stats:', error?.message);
        return { data: null, error };
      }

      if (!data) {
        return {
          data: { completionCount: 0, averageRating: 0, ratingCount: 0 },
          error: null
        };
      }

      return {
        data: {
          completionCount: data.completion_count || 0,
          averageRating: data.rating_count > 0 ? (data.total_rating / data.rating_count) : 0,
          ratingCount: data.rating_count || 0,
        },
        error: null
      };
    } catch (err) {
      console.warn('Error getting workout stats:', err?.message);
      return { data: { completionCount: 0, averageRating: 0, ratingCount: 0 }, error: err };
    }
  },

  // Get stats for all workouts (for display in lists)
  async getAllWorkoutStats() {
    try {
      const { data, error } = await supabase
        .from('workout_stats')
        .select('*');

      if (error) {
        console.warn('Error getting all workout stats:', error?.message);
        return { data: {}, error };
      }

      // Convert to map for easy lookup
      const statsMap = {};
      (data || []).forEach(s => {
        statsMap[s.workout_id] = {
          completionCount: s.completion_count || 0,
          averageRating: s.rating_count > 0 ? (s.total_rating / s.rating_count) : 0,
          ratingCount: s.rating_count || 0,
        };
      });

      return { data: statsMap, error: null };
    } catch (err) {
      console.warn('Error getting all workout stats:', err?.message);
      return { data: {}, error: err };
    }
  },

  // Increment completion count for a workout
  async incrementCompletion(workoutId) {
    try {
      if (!workoutId) return { error: null };

      // Get current stats or create new record
      const { data: currentStats } = await supabase
        .from('workout_stats')
        .select('*')
        .eq('workout_id', workoutId)
        .single();

      if (!currentStats) {
        // Create new stats record
        await supabase
          .from('workout_stats')
          .insert({
            workout_id: workoutId,
            workout_type: 'system',
            completion_count: 1,
            total_rating: 0,
            rating_count: 0,
            updated_at: new Date().toISOString(),
          });
      } else {
        // Increment existing count
        await supabase
          .from('workout_stats')
          .update({
            completion_count: (currentStats.completion_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('workout_id', workoutId);
      }

      return { error: null };
    } catch (err) {
      console.warn('Error incrementing completion:', err?.message);
      return { error: err };
    }
  },
};

export default workoutRatingService;
