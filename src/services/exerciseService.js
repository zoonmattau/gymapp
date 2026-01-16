import { supabase } from '../lib/supabase';

export const exerciseService = {
  // In-memory cache for exercises (loaded once per session)
  _exerciseCache: null,

  // Get all exercises (with caching)
  async getAllExercises(forceRefresh = false) {
    // Return cached data if available and not forcing refresh
    if (this._exerciseCache && !forceRefresh) {
      return { data: this._exerciseCache, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) {
        console.warn('getAllExercises error:', error?.message);
        return { data: [], error: null };
      }

      // Transform to match existing ALL_EXERCISES structure
      const exercises = (data || []).map(ex => ({
        name: ex.name,
        muscleGroup: ex.muscle_group,
        equipment: ex.equipment,
        type: ex.exercise_type || 'isolation',
        targetedHeads: ex.targeted_heads || [],
        id: ex.id,
        description: ex.description,
        instructions: ex.instructions
      }));

      // Cache the results
      this._exerciseCache = exercises;
      return { data: exercises, error: null };
    } catch (err) {
      console.warn('getAllExercises error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get exercises by muscle group
  async getExercisesByMuscleGroup(muscleGroup) {
    const { data } = await this.getAllExercises();
    return {
      data: data.filter(ex => ex.muscleGroup === muscleGroup),
      error: null
    };
  },

  // Get exercises by multiple muscle groups
  async getExercisesByMuscleGroups(muscleGroups) {
    const { data } = await this.getAllExercises();
    return {
      data: data.filter(ex => muscleGroups.includes(ex.muscleGroup)),
      error: null
    };
  },

  // Search exercises by name
  async searchExercises(searchTerm, muscleGroup = null) {
    const { data } = await this.getAllExercises();
    let filtered = data.filter(ex =>
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (muscleGroup) {
      filtered = filtered.filter(ex => ex.muscleGroup === muscleGroup);
    }

    return { data: filtered, error: null };
  },

  // Get exercise by ID
  async getExerciseById(exerciseId) {
    const { data } = await this.getAllExercises();
    return {
      data: data.find(ex => ex.id === exerciseId) || null,
      error: null
    };
  },

  // Get exercise by name (for backwards compatibility)
  async getExerciseByName(exerciseName) {
    const { data } = await this.getAllExercises();
    return {
      data: data.find(ex => ex.name === exerciseName) || null,
      error: null
    };
  },

  // Get exercises by equipment type
  async getExercisesByEquipment(equipment) {
    const { data } = await this.getAllExercises();
    return {
      data: data.filter(ex => ex.equipment === equipment),
      error: null
    };
  },

  // Get exercises by type (compound/isolation)
  async getExercisesByType(type) {
    const { data } = await this.getAllExercises();
    return {
      data: data.filter(ex => ex.type === type),
      error: null
    };
  },

  // Create custom exercise (for future feature)
  async createCustomExercise(userId, exerciseData) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: exerciseData.name,
          muscle_group: exerciseData.muscleGroup,
          equipment: exerciseData.equipment,
          exercise_type: exerciseData.type || 'isolation',
          targeted_heads: exerciseData.targetedHeads || [],
          description: exerciseData.description,
          instructions: exerciseData.instructions || [],
          default_sets: exerciseData.defaultSets || 3,
          default_reps: exerciseData.defaultReps || 10,
          default_rest_time: exerciseData.defaultRestTime || 90,
          is_system: false,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.warn('createCustomExercise error:', error?.message);
        return { data: null, error };
      }

      // Clear cache to force refresh on next load
      this.clearCache();

      return { data, error: null };
    } catch (err) {
      console.warn('createCustomExercise error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update custom exercise
  async updateCustomExercise(exerciseId, userId, exerciseData) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update({
          name: exerciseData.name,
          muscle_group: exerciseData.muscleGroup,
          equipment: exerciseData.equipment,
          exercise_type: exerciseData.type,
          targeted_heads: exerciseData.targetedHeads,
          description: exerciseData.description,
          instructions: exerciseData.instructions,
          default_sets: exerciseData.defaultSets,
          default_reps: exerciseData.defaultReps,
          default_rest_time: exerciseData.defaultRestTime
        })
        .eq('id', exerciseId)
        .eq('created_by', userId)
        .eq('is_system', false)
        .select()
        .single();

      if (error) {
        console.warn('updateCustomExercise error:', error?.message);
        return { data: null, error };
      }

      // Clear cache to force refresh on next load
      this.clearCache();

      return { data, error: null };
    } catch (err) {
      console.warn('updateCustomExercise error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Delete custom exercise
  async deleteCustomExercise(exerciseId, userId) {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)
        .eq('created_by', userId)
        .eq('is_system', false);

      if (error) {
        console.warn('deleteCustomExercise error:', error?.message);
        return { error };
      }

      // Clear cache to force refresh on next load
      this.clearCache();

      return { error: null };
    } catch (err) {
      console.warn('deleteCustomExercise error:', err?.message);
      return { error: err };
    }
  },

  // Clear the cache (call when exercises are updated)
  clearCache() {
    this._exerciseCache = null;
  }
};
