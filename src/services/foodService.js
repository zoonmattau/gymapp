import { supabase } from '../lib/supabase';

export const foodService = {
  // Get all foods (with optional category filter)
  async getFoods(category = null) {
    try {
      let query = supabase
        .from('foods')
        .select('*')
        .eq('is_system', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('getFoods error:', error?.message);
        return { data: [], error: null };
      }

      // Transform to match existing food structure
      const foods = (data || []).map(food => ({
        name: food.name,
        category: food.category,
        per100g: {
          cal: food.calories,
          p: food.protein,
          c: food.carbs,
          f: food.fats
        },
        defaultUnit: food.default_unit,
        defaultAmount: food.default_amount,
        id: food.id
      }));

      return { data: foods, error: null };
    } catch (err) {
      console.warn('getFoods error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Search foods by name
  async searchFoods(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('is_system', true)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(50);

      if (error) {
        console.warn('searchFoods error:', error?.message);
        return { data: [], error: null };
      }

      // Transform to match existing food structure
      const foods = (data || []).map(food => ({
        name: food.name,
        category: food.category,
        per100g: {
          cal: food.calories,
          p: food.protein,
          c: food.carbs,
          f: food.fats
        },
        defaultUnit: food.default_unit,
        defaultAmount: food.default_amount,
        id: food.id
      }));

      return { data: foods, error: null };
    } catch (err) {
      console.warn('searchFoods error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get foods by IDs (for loading saved meals)
  async getFoodsByIds(foodIds) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .in('id', foodIds);

      if (error) {
        console.warn('getFoodsByIds error:', error?.message);
        return { data: [], error: null };
      }

      // Transform to match existing food structure
      const foods = (data || []).map(food => ({
        name: food.name,
        category: food.category,
        per100g: {
          cal: food.calories,
          p: food.protein,
          c: food.carbs,
          f: food.fats
        },
        defaultUnit: food.default_unit,
        defaultAmount: food.default_amount,
        id: food.id
      }));

      return { data: foods, error: null };
    } catch (err) {
      console.warn('getFoodsByIds error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Create custom food (for future feature)
  async createCustomFood(userId, foodData) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .insert({
          name: foodData.name,
          category: foodData.category,
          calories: foodData.per100g.cal,
          protein: foodData.per100g.p,
          carbs: foodData.per100g.c,
          fats: foodData.per100g.f,
          default_unit: foodData.defaultUnit || 'g',
          default_amount: foodData.defaultAmount || 100,
          is_system: false,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.warn('createCustomFood error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('createCustomFood error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Update custom food
  async updateCustomFood(foodId, userId, foodData) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .update({
          name: foodData.name,
          category: foodData.category,
          calories: foodData.per100g.cal,
          protein: foodData.per100g.p,
          carbs: foodData.per100g.c,
          fats: foodData.per100g.f,
          default_unit: foodData.defaultUnit,
          default_amount: foodData.defaultAmount
        })
        .eq('id', foodId)
        .eq('created_by', userId)
        .eq('is_system', false)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateCustomFood error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('updateCustomFood error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Delete custom food
  async deleteCustomFood(foodId, userId) {
    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', foodId)
        .eq('created_by', userId)
        .eq('is_system', false);

      if (error) {
        console.warn('deleteCustomFood error:', error?.message);
      }
      return { error };
    } catch (err) {
      console.warn('deleteCustomFood error:', err?.message);
      return { error: err };
    }
  }
};
