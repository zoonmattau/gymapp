import { supabase } from '../lib/supabase';

// NOTE: workout_ratings and workout_stats tables are not in the current schema
// These functions return graceful fallbacks until the tables are created

export const workoutRatingService = {
  // Rate a workout (1-5 stars)
  async rateWorkout(userId, workoutId, rating) {
    // Feature not available yet - return graceful fallback
    console.warn('rateWorkout: workout_ratings table not available');
    return { data: null, error: null };
  },

  // Update workout stats after a rating change
  async updateWorkoutStats(workoutId, isNewRating, newRating, oldRating) {
    // Feature not available yet
    return;
  },

  // Get user's rating for a specific workout
  async getUserRating(userId, workoutId) {
    // Feature not available yet - return null rating
    return { data: null, error: null };
  },

  // Get all user's ratings (for local cache)
  async getAllUserRatings(userId) {
    // Feature not available yet - return empty map
    return { data: {}, error: null };
  },

  // Get stats for a specific workout
  async getWorkoutStats(workoutId) {
    // Feature not available yet - return default stats
    return {
      data: { completionCount: 0, averageRating: 0, ratingCount: 0 },
      error: null
    };
  },

  // Get stats for all workouts (for display in lists)
  async getAllWorkoutStats() {
    // Feature not available yet - return empty map
    return { data: {}, error: null };
  },

  // Increment completion count for a workout
  async incrementCompletion(workoutId) {
    // Feature not available yet
    return { error: null };
  },
};

export default workoutRatingService;
