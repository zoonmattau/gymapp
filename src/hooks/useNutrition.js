import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { nutritionService } from '../services/nutritionService';

export function useNutrition() {
  const { user } = useAuth();
  const [goals, setGoals] = useState(null);
  const [dailyNutrition, setDailyNutrition] = useState(null);
  const [meals, setMeals] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [supplementLogs, setSupplementLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch today's data
  const fetchTodayData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        goalsResult,
        dailyResult,
        mealsResult,
        waterResult,
        supplementsResult,
        supplementLogsResult,
      ] = await Promise.all([
        nutritionService.getNutritionGoals(user.id),
        nutritionService.getDailyNutrition(user.id, today),
        nutritionService.getMeals(user.id, today),
        nutritionService.getWaterLogs(user.id, today),
        nutritionService.getSupplements(user.id),
        nutritionService.getSupplementLogs(user.id, today),
      ]);

      if (goalsResult.data) setGoals(goalsResult.data);
      if (dailyResult.data) setDailyNutrition(dailyResult.data);
      if (mealsResult.data) setMeals(mealsResult.data);
      if (waterResult.data) setWaterLogs(waterResult.data);
      if (supplementsResult.data) setSupplements(supplementsResult.data);
      if (supplementLogsResult.data) setSupplementLogs(supplementLogsResult.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  // Update goals
  const updateGoals = useCallback(async (newGoals) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await nutritionService.updateNutritionGoals(user.id, newGoals);
    if (data) setGoals(data);
    return { data, error: err };
  }, [user]);

  // Log meal
  const logMeal = useCallback(async (meal) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await nutritionService.logMeal(user.id, meal);
    if (data) {
      await fetchTodayData(); // Refresh to get updated totals
    }
    return { data, error: err };
  }, [user, fetchTodayData]);

  // Delete meal
  const deleteMeal = useCallback(async (mealId) => {
    if (!user) return { error: 'Not authenticated' };

    const today = new Date().toISOString().split('T')[0];
    const { error: err } = await nutritionService.deleteMeal(mealId, user.id, today);
    if (!err) {
      await fetchTodayData();
    }
    return { error: err };
  }, [user, fetchTodayData]);

  // Log water
  const logWater = useCallback(async (amountMl) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await nutritionService.logWater(user.id, amountMl);
    if (data) {
      await fetchTodayData();
    }
    return { data, error: err };
  }, [user, fetchTodayData]);

  // Add supplement
  const addSupplement = useCallback(async (supplement) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await nutritionService.addSupplement(user.id, supplement);
    if (data) {
      setSupplements(prev => [...prev, data]);
    }
    return { data, error: err };
  }, [user]);

  // Log supplement taken
  const logSupplement = useCallback(async (supplementId) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error: err } = await nutritionService.logSupplement(user.id, supplementId);
    if (data) {
      setSupplementLogs(prev => [...prev, data]);
    }
    return { data, error: err };
  }, [user]);

  // Get history
  const getHistory = useCallback(async (startDate, endDate) => {
    if (!user) return { data: null, error: 'Not authenticated' };
    return nutritionService.getNutritionHistory(user.id, startDate, endDate);
  }, [user]);

  // Calculate totals from current data
  const totals = {
    calories: dailyNutrition?.total_calories || 0,
    protein: dailyNutrition?.total_protein || 0,
    carbs: dailyNutrition?.total_carbs || 0,
    fats: dailyNutrition?.total_fats || 0,
    water: dailyNutrition?.water_intake || 0,
  };

  // Calculate remaining
  const remaining = goals ? {
    calories: goals.calories - totals.calories,
    protein: goals.protein - totals.protein,
    carbs: goals.carbs - totals.carbs,
    fats: goals.fats - totals.fats,
    water: goals.water - totals.water,
  } : null;

  // Check if supplements are taken
  const supplementsWithStatus = supplements.map(supp => ({
    ...supp,
    taken: supplementLogs.some(log => log.supplement_id === supp.id),
  }));

  return {
    // State
    goals,
    dailyNutrition,
    meals,
    waterLogs,
    supplements: supplementsWithStatus,
    totals,
    remaining,
    loading,
    error,

    // Actions
    updateGoals,
    logMeal,
    deleteMeal,
    logWater,
    addSupplement,
    logSupplement,
    getHistory,
    refresh: fetchTodayData,
  };
}

export default useNutrition;
