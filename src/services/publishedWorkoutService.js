import { supabase } from '../lib/supabase';

export const publishedWorkoutService = {
  // Publish a workout to the community
  async publishWorkout(userId, workoutData) {
    try {
      if (!userId || !workoutData) {
        return { data: null, error: 'Invalid parameters' };
      }

      const { data, error } = await supabase
        .from('published_workouts')
        .insert({
          creator_id: userId,
          name: workoutData.name,
          focus: workoutData.focus || '',
          description: workoutData.description || '',
          goals: workoutData.goals || [],
          exercises: workoutData.exercises || [],
          is_public: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Error publishing workout:', error?.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.warn('Error publishing workout:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get published workouts with optional filters
  async getPublishedWorkouts(filters = {}) {
    try {
      let query = supabase
        .from('published_workouts')
        .select(`
          *,
          profiles:creator_id (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_public', true);

      // Apply filters
      if (filters.focus) {
        query = query.ilike('focus', `%${filters.focus}%`);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'popular':
          query = query.order('completion_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Limit results
      query = query.limit(filters.limit || 20);

      const { data, error } = await query;

      if (error) {
        console.warn('Error getting published workouts:', error?.message);
        return { data: [], error };
      }

      // Transform data
      const workouts = (data || []).map(w => ({
        id: w.id,
        name: w.name,
        focus: w.focus,
        description: w.description,
        goals: w.goals || [],
        exercises: w.exercises || [],
        completionCount: w.completion_count || 0,
        averageRating: w.average_rating || 0,
        ratingCount: w.rating_count || 0,
        createdAt: w.created_at,
        creator: w.profiles ? {
          id: w.profiles.id,
          name: `${w.profiles.first_name || ''} ${w.profiles.last_name || ''}`.trim() || w.profiles.username || 'User',
          username: w.profiles.username || 'user',
          avatar: w.profiles.avatar_url || '💪',
        } : null,
      }));

      return { data: workouts, error: null };
    } catch (err) {
      console.warn('Error getting published workouts:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get workouts published by a specific user
  async getMyPublishedWorkouts(userId) {
    try {
      if (!userId) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('published_workouts')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error getting my published workouts:', error?.message);
        return { data: [], error };
      }

      return {
        data: (data || []).map(w => ({
          id: w.id,
          name: w.name,
          focus: w.focus,
          description: w.description,
          goals: w.goals || [],
          exercises: w.exercises || [],
          completionCount: w.completion_count || 0,
          averageRating: w.average_rating || 0,
          ratingCount: w.rating_count || 0,
          createdAt: w.created_at,
        })),
        error: null
      };
    } catch (err) {
      console.warn('Error getting my published workouts:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get a single published workout by ID
  async getWorkoutById(workoutId) {
    try {
      if (!workoutId) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from('published_workouts')
        .select(`
          *,
          profiles:creator_id (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', workoutId)
        .single();

      if (error) {
        console.warn('Error getting workout:', error?.message);
        return { data: null, error };
      }

      return {
        data: {
          id: data.id,
          name: data.name,
          focus: data.focus,
          description: data.description,
          goals: data.goals || [],
          exercises: data.exercises || [],
          completionCount: data.completion_count || 0,
          averageRating: data.average_rating || 0,
          ratingCount: data.rating_count || 0,
          createdAt: data.created_at,
          creator: data.profiles ? {
            id: data.profiles.id,
            name: `${data.profiles.first_name || ''} ${data.profiles.last_name || ''}`.trim() || data.profiles.username || 'User',
            username: data.profiles.username || 'user',
            avatar: data.profiles.avatar_url || '💪',
          } : null,
        },
        error: null
      };
    } catch (err) {
      console.warn('Error getting workout:', err?.message);
      return { data: null, error: err };
    }
  },

  // Save/bookmark a workout
  async saveWorkout(userId, workoutId) {
    try {
      if (!userId || !workoutId) {
        return { data: null, error: 'Invalid parameters' };
      }

      const { data, error } = await supabase
        .from('saved_workouts')
        .upsert({
          user_id: userId,
          workout_id: workoutId,
          workout_type: 'published',
          saved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('Error saving workout:', error?.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.warn('Error saving workout:', err?.message);
      return { data: null, error: err };
    }
  },

  // Remove saved workout
  async unsaveWorkout(userId, workoutId) {
    try {
      if (!userId || !workoutId) {
        return { error: 'Invalid parameters' };
      }

      const { error } = await supabase
        .from('saved_workouts')
        .delete()
        .eq('user_id', userId)
        .eq('workout_id', workoutId);

      if (error) {
        console.warn('Error unsaving workout:', error?.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.warn('Error unsaving workout:', err?.message);
      return { error: err };
    }
  },

  // Get user's saved workouts
  async getSavedWorkouts(userId) {
    try {
      if (!userId) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('saved_workouts')
        .select('workout_id')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error getting saved workouts:', error?.message);
        return { data: [], error };
      }

      return {
        data: (data || []).map(s => s.workout_id),
        error: null
      };
    } catch (err) {
      console.warn('Error getting saved workouts:', err?.message);
      return { data: [], error: err };
    }
  },

  // Delete a published workout (only by creator)
  async deleteWorkout(userId, workoutId) {
    try {
      if (!userId || !workoutId) {
        return { error: 'Invalid parameters' };
      }

      const { error } = await supabase
        .from('published_workouts')
        .delete()
        .eq('id', workoutId)
        .eq('creator_id', userId);

      if (error) {
        console.warn('Error deleting workout:', error?.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.warn('Error deleting workout:', err?.message);
      return { error: err };
    }
  },

  // Increment completion count for a published workout
  async incrementCompletion(workoutId) {
    try {
      if (!workoutId) return { error: null };

      // Get current count and increment
      const { data: current } = await supabase
        .from('published_workouts')
        .select('completion_count')
        .eq('id', workoutId)
        .single();

      if (current) {
        await supabase
          .from('published_workouts')
          .update({
            completion_count: (current.completion_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workoutId);
      }

      return { error: null };
    } catch (err) {
      console.warn('Error incrementing completion:', err?.message);
      return { error: err };
    }
  },
};

export default publishedWorkoutService;
