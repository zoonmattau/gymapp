import { supabase } from '../lib/supabase';

export const publishedWorkoutService = {
  // Publish a workout to the community
  async publishWorkout(userId, workoutData) {
    try {
      const { data, error } = await supabase
        .from('published_workouts')
        .insert({
          creator_id: userId,
          name: workoutData.name,
          focus: workoutData.focus,
          description: workoutData.description,
          exercises: workoutData.exercises || [],
          goals: workoutData.goals || [],
          is_public: true,
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('publishWorkout error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get published workouts with optional filters
  async getPublishedWorkouts(filters = {}) {
    try {
      let query = supabase
        .from('published_workouts')
        .select('*')
        .eq('is_public', true);

      // Apply sorting
      if (filters.sortBy === 'popular') {
        query = query.order('completion_count', { ascending: false });
      } else if (filters.sortBy === 'rating') {
        query = query.order('average_rating', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('getPublishedWorkouts error:', error?.message);
        return { data: [], error };
      }

      // Enrich with creator profiles and follower counts
      const enriched = await Promise.all((data || []).map(async (workout) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .eq('id', workout.creator_id)
          .single();

        // Get follower count for creator
        let followerCount = 0;
        if (workout.creator_id) {
          const { count } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('friend_id', workout.creator_id)
            .eq('status', 'accepted');
          followerCount = count || 0;
        }

        return {
          ...workout,
          creator: profile ? {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
            username: profile.username,
            avatar: profile.avatar_url || profile.first_name?.[0]?.toUpperCase(),
            followers: followerCount,
          } : null,
          averageRating: workout.average_rating,
          completionCount: workout.completion_count,
          ratingCount: workout.rating_count,
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('getPublishedWorkouts error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get workouts by a specific user
  async getUserPublishedWorkouts(userId) {
    try {
      const { data, error } = await supabase
        .from('published_workouts')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('getUserPublishedWorkouts error:', error?.message);
        return { data: [], error };
      }

      return {
        data: (data || []).map(w => ({
          ...w,
          averageRating: w.average_rating,
          completionCount: w.completion_count,
          ratingCount: w.rating_count,
        })),
        error: null
      };
    } catch (err) {
      console.warn('getUserPublishedWorkouts error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get current user's published workouts (alias)
  async getMyPublishedWorkouts(userId) {
    return this.getUserPublishedWorkouts(userId);
  },

  // Get a specific published workout by ID
  async getWorkoutById(workoutId) {
    try {
      const { data, error } = await supabase
        .from('published_workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (error) {
        console.warn('getWorkoutById error:', error?.message);
        return { data: null, error };
      }

      // Get creator profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url')
        .eq('id', data.creator_id)
        .single();

      return {
        data: {
          ...data,
          creator: profile ? {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
            username: profile.username,
            avatar: profile.avatar_url || profile.first_name?.[0]?.toUpperCase(),
          } : null,
          averageRating: data.average_rating,
          completionCount: data.completion_count,
          ratingCount: data.rating_count,
        },
        error: null
      };
    } catch (err) {
      console.warn('getWorkoutById error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Search published workouts
  async searchWorkouts(query) {
    try {
      const { data, error } = await supabase
        .from('published_workouts')
        .select('*')
        .eq('is_public', true)
        .or(`name.ilike.%${query}%,focus.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);

      return { data: data || [], error };
    } catch (err) {
      console.warn('searchWorkouts error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Save/bookmark a workout
  async saveWorkout(userId, workoutId) {
    try {
      const { data, error } = await supabase
        .from('saved_workouts')
        .insert({ user_id: userId, workout_id: workoutId })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('saveWorkout error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Remove saved workout
  async unsaveWorkout(userId, workoutId) {
    try {
      const { error } = await supabase
        .from('saved_workouts')
        .delete()
        .eq('user_id', userId)
        .eq('workout_id', workoutId);

      return { error };
    } catch (err) {
      console.warn('unsaveWorkout error:', err?.message);
      return { error: err };
    }
  },

  // Get user's saved workouts
  async getSavedWorkouts(userId) {
    try {
      const { data, error } = await supabase
        .from('saved_workouts')
        .select('workout_id')
        .eq('user_id', userId);

      return { data: (data || []).map(s => s.workout_id), error };
    } catch (err) {
      console.warn('getSavedWorkouts error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Delete a published workout (only by creator)
  async deleteWorkout(userId, workoutId) {
    try {
      const { error } = await supabase
        .from('published_workouts')
        .delete()
        .eq('id', workoutId)
        .eq('creator_id', userId);

      return { error };
    } catch (err) {
      console.warn('deleteWorkout error:', err?.message);
      return { error: err };
    }
  },

  // Update a published workout
  async updateWorkout(userId, workoutId, updates) {
    try {
      const { data, error } = await supabase
        .from('published_workouts')
        .update(updates)
        .eq('id', workoutId)
        .eq('creator_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('updateWorkout error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Rate a workout
  async rateWorkout(userId, workoutId, rating) {
    try {
      // Upsert the rating
      const { error: ratingError } = await supabase
        .from('workout_ratings')
        .upsert({
          user_id: userId,
          workout_id: workoutId,
          rating: rating,
        }, { onConflict: 'user_id,workout_id' });

      if (ratingError) {
        return { error: ratingError };
      }

      // Recalculate average rating
      const { data: ratings } = await supabase
        .from('workout_ratings')
        .select('rating')
        .eq('workout_id', workoutId);

      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        await supabase
          .from('published_workouts')
          .update({
            average_rating: avg,
            rating_count: ratings.length,
          })
          .eq('id', workoutId);
      }

      return { error: null };
    } catch (err) {
      console.warn('rateWorkout error:', err?.message);
      return { error: err };
    }
  },

  // Get user's rating for a workout
  async getUserRating(userId, workoutId) {
    try {
      const { data, error } = await supabase
        .from('workout_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .maybeSingle();

      return { data: data?.rating || null, error };
    } catch (err) {
      console.warn('getUserRating error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get all user's ratings (for caching)
  async getUserRatings(userId) {
    try {
      const { data, error } = await supabase
        .from('workout_ratings')
        .select('workout_id, rating')
        .eq('user_id', userId);

      const ratingsMap = {};
      (data || []).forEach(r => { ratingsMap[r.workout_id] = r.rating; });
      return { data: ratingsMap, error };
    } catch (err) {
      console.warn('getUserRatings error:', err?.message);
      return { data: {}, error: err };
    }
  },

  // Get comments for a workout
  async getComments(workoutId) {
    try {
      const { data, error } = await supabase
        .from('workout_comments')
        .select('*')
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('getComments error:', error?.message);
        return { data: [], error };
      }

      // Enrich with user profiles
      const enriched = await Promise.all((data || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          user: profile ? {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
            username: profile.username,
            avatar: profile.avatar_url || profile.first_name?.[0]?.toUpperCase(),
          } : null,
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('getComments error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Add a comment to a workout
  async addComment(userId, workoutId, content) {
    try {
      const { data, error } = await supabase
        .from('workout_comments')
        .insert({
          user_id: userId,
          workout_id: workoutId,
          content: content,
        })
        .select()
        .single();

      if (!error) {
        // Increment comment count
        await supabase.rpc('increment_comment_count', { workout_id: workoutId }).catch(() => {
          // Fallback: manually update
          supabase
            .from('published_workouts')
            .select('comment_count')
            .eq('id', workoutId)
            .single()
            .then(({ data: workout }) => {
              supabase
                .from('published_workouts')
                .update({ comment_count: (workout?.comment_count || 0) + 1 })
                .eq('id', workoutId);
            });
        });
      }

      return { data, error };
    } catch (err) {
      console.warn('addComment error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Delete a comment
  async deleteComment(userId, commentId) {
    try {
      const { error } = await supabase
        .from('workout_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      return { error };
    } catch (err) {
      console.warn('deleteComment error:', err?.message);
      return { error: err };
    }
  },

  // Get saved workouts with full details
  async getSavedWorkoutsWithDetails(userId) {
    try {
      const { data: saved, error } = await supabase
        .from('saved_workouts')
        .select('workout_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !saved || saved.length === 0) {
        return { data: [], error };
      }

      // Get full workout details
      const workoutIds = saved.map(s => s.workout_id);
      const { data: workouts } = await supabase
        .from('published_workouts')
        .select('*')
        .in('id', workoutIds);

      // Enrich with creator info
      const enriched = await Promise.all((workouts || []).map(async (workout) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .eq('id', workout.creator_id)
          .single();

        return {
          ...workout,
          creator: profile ? {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
            username: profile.username,
            avatar: profile.avatar_url || profile.first_name?.[0]?.toUpperCase(),
          } : null,
          averageRating: workout.average_rating,
          completionCount: workout.completion_count,
          ratingCount: workout.rating_count,
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('getSavedWorkoutsWithDetails error:', err?.message);
      return { data: [], error: err };
    }
  },

  // Increment completion count
  async incrementCompletion(workoutId, actualDuration = null) {
    try {
      // Get current stats
      const { data: workout } = await supabase
        .from('published_workouts')
        .select('completion_count, avg_actual_duration')
        .eq('id', workoutId)
        .single();

      const newCount = (workout?.completion_count || 0) + 1;
      let newAvgDuration = workout?.avg_actual_duration;

      if (actualDuration) {
        if (newAvgDuration) {
          // Rolling average
          newAvgDuration = Math.round((newAvgDuration * (newCount - 1) + actualDuration) / newCount);
        } else {
          newAvgDuration = actualDuration;
        }
      }

      await supabase
        .from('published_workouts')
        .update({
          completion_count: newCount,
          ...(newAvgDuration && { avg_actual_duration: newAvgDuration }),
        })
        .eq('id', workoutId);

      return { error: null };
    } catch (err) {
      console.warn('incrementCompletion error:', err?.message);
      return { error: err };
    }
  },
};

export default publishedWorkoutService;
