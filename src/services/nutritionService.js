import { supabase } from '../lib/supabase';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const nutritionService = {
  // Get nutrition goals
  async getNutritionGoals(userId) {
    try {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('getNutritionGoals error:', error?.message);
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('getNutritionGoals error:', err?.message);
      return { data: null, error: null };
    }
  },

  // Update nutrition goals
  async updateNutritionGoals(userId, goals) {
    try {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .upsert({
          user_id: userId,
          ...goals,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateNutritionGoals error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('updateNutritionGoals error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get or create daily nutrition entry
  async getDailyNutrition(userId, date = null) {
    try {
      const logDate = date || getLocalDateString();

      // Try to get existing entry
      const { data, error } = await supabase
        .from('daily_nutrition')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', logDate)
        .maybeSingle();

      if (error) {
        console.warn('getDailyNutrition error:', error?.message);
        return { data: null, error: null };
      }
      return { data, error: null };
    } catch (err) {
      console.warn('getDailyNutrition error:', err?.message);
      return { data: null, error: null };
    }
  },

  // Update daily nutrition totals
  async updateDailyNutrition(userId, date, totals) {
    try {
      const { data, error } = await supabase
        .from('daily_nutrition')
        .upsert({
          user_id: userId,
          log_date: date,
          ...totals,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,log_date' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('updateDailyNutrition error:', error?.message);
      }
      return { data, error };
    } catch (err) {
      console.warn('updateDailyNutrition error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Log a meal
  async logMeal(userId, meal) {
    const logDate = meal.date || getLocalDateString();

    // Get existing daily nutrition entry (may be null)
    const { data: daily } = await this.getDailyNutrition(userId, logDate);

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        daily_nutrition_id: daily?.id,
        log_date: logDate,
        meal_name: meal.name,
        meal_time: meal.time,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fats: meal.fats || 0,
      })
      .select()
      .single();

    // Always recalculate daily totals (this will create the entry if it doesn't exist)
    if (data) {
      await this.recalculateDailyTotals(userId, logDate);
    }

    return { data, error };
  },

  // Delete a meal
  async deleteMeal(mealId, userId, date) {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId);

    if (!error) {
      await this.recalculateDailyTotals(userId, date);
    }

    return { error };
  },

  // Recalculate daily totals from meal logs
  async recalculateDailyTotals(userId, date) {
    const { data: meals } = await supabase
      .from('meal_logs')
      .select('calories, protein, carbs, fats')
      .eq('user_id', userId)
      .eq('log_date', date);

    const totals = meals?.reduce((acc, meal) => ({
      total_calories: acc.total_calories + (meal.calories || 0),
      total_protein: acc.total_protein + (meal.protein || 0),
      total_carbs: acc.total_carbs + (meal.carbs || 0),
      total_fats: acc.total_fats + (meal.fats || 0),
    }), { total_calories: 0, total_protein: 0, total_carbs: 0, total_fats: 0 }) || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fats: 0 };

    return this.updateDailyNutrition(userId, date, totals);
  },

  // Get meals for a date
  async getMeals(userId, date = null) {
    const logDate = date || getLocalDateString();

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .order('meal_time');

    return { data, error };
  },

  // Log water intake
  async logWater(userId, amountMl, date = null) {
    const logDate = date || getLocalDateString();

    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: userId,
        log_date: logDate,
        amount_ml: amountMl,
      })
      .select()
      .single();

    // Update daily total
    if (data) {
      await this.recalculateWaterTotal(userId, logDate);
    }

    return { data, error };
  },

  // Recalculate water total for a day
  async recalculateWaterTotal(userId, date) {
    const { data: logs } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('log_date', date);

    const totalWater = logs?.reduce((acc, log) => acc + log.amount_ml, 0) || 0;

    return this.updateDailyNutrition(userId, date, { water_intake: totalWater });
  },

  // Get water logs for a date
  async getWaterLogs(userId, date = null) {
    const logDate = date || getLocalDateString();

    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate);

    return { data, error };
  },

  // Get user supplements
  async getSupplements(userId) {
    const { data, error } = await supabase
      .from('user_supplements')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('scheduled_time');

    return { data, error };
  },

  // Add supplement
  async addSupplement(userId, supplement) {
    const { data, error } = await supabase
      .from('user_supplements')
      .insert({
        user_id: userId,
        name: supplement.name,
        dosage: supplement.dosage,
        scheduled_time: supplement.time,
      })
      .select()
      .single();

    return { data, error };
  },

  // Delete supplement
  async deleteSupplement(supplementId) {
    const { error } = await supabase
      .from('user_supplements')
      .delete()
      .eq('id', supplementId);

    return { error };
  },

  // Update supplement
  async updateSupplement(supplementId, updates) {
    const { data, error } = await supabase
      .from('user_supplements')
      .update(updates)
      .eq('id', supplementId)
      .select()
      .single();

    return { data, error };
  },

  // Log supplement taken
  async logSupplement(userId, supplementId, date = null) {
    const logDate = date || getLocalDateString();

    const { data, error } = await supabase
      .from('supplement_logs')
      .upsert({
        user_id: userId,
        supplement_id: supplementId,
        log_date: logDate,
      }, { onConflict: 'supplement_id,log_date' })
      .select()
      .maybeSingle();

    return { data, error };
  },

  // Get supplement logs for a date
  async getSupplementLogs(userId, date = null) {
    const logDate = date || getLocalDateString();

    const { data, error } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate);

    return { data, error };
  },

  // Get nutrition history for date range
  async getNutritionHistory(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('daily_nutrition')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date');

    return { data, error };
  },

  // Alias for getDailyNutritionRange
  async getDailyNutritionRange(userId, startDate, endDate) {
    return this.getNutritionHistory(userId, startDate, endDate);
  },

  // Get supplement logs for date range
  async getSupplementLogsRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date');

    return { data, error };
  },

  // Get user's most frequently logged meals
  async getFrequentMeals(userId, limit = 8) {
    const ninetyDaysAgoDate = new Date();
    ninetyDaysAgoDate.setDate(ninetyDaysAgoDate.getDate() - 90);
    const ninetyDaysAgo = getLocalDateString(ninetyDaysAgoDate);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('meal_name, calories, protein, carbs, fats')
      .eq('user_id', userId)
      .gte('log_date', ninetyDaysAgo)
      .order('created_at', { ascending: false });

    if (error || !data) return { data: [], error };

    // Group by meal name and count occurrences
    const mealMap = new Map();
    data.forEach(meal => {
      const key = meal.meal_name?.toLowerCase().trim();
      if (!key) return;

      if (!mealMap.has(key)) {
        mealMap.set(key, {
          name: meal.meal_name,
          cal: meal.calories || 0,
          p: meal.protein || 0,
          c: meal.carbs || 0,
          f: meal.fats || 0,
          count: 1
        });
      } else {
        mealMap.get(key).count++;
      }
    });

    // Sort by count and return top N (only meals logged at least twice)
    const frequent = Array.from(mealMap.values())
      .filter(m => m.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { data: frequent, error: null };
  },
};

export default nutritionService;
