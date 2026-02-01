import { supabase } from '../lib/supabase';

// Helper to get local date string (YYYY-MM-DD) consistently
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const streakService = {
  // Get all streaks for user
  async getStreaks(userId) {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId);

    return { data, error };
  },

  // Get specific streak
  async getStreak(userId, streakType) {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', streakType)
      .maybeSingle();

    return { data, error };
  },

  // Update streak
  async updateStreak(userId, streakType, currentStreak, lastActivityDate) {
    // Get current streak to check longest
    const { data: existing } = await this.getStreak(userId, streakType);
    const longestStreak = Math.max(existing?.longest_streak || 0, currentStreak);

    const { data, error } = await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        streak_type: streakType,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: lastActivityDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,streak_type' })
      .select()
      .maybeSingle();

    return { data, error };
  },

  // Calculate workout streak
  async calculateWorkoutStreak(userId) {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false });

    if (!sessions || sessions.length === 0) {
      return { streak: 0, lastDate: null };
    }

    // Group by local date
    const workoutDates = new Set(
      sessions.map(s => getLocalDateString(new Date(s.started_at)))
    );

    // Count consecutive days from today backwards
    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    // Allow starting from today or yesterday
    const todayStr = getLocalDateString(today);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    if (workoutDates.has(todayStr)) {
      checkDate = today;
    } else if (workoutDates.has(yesterdayStr)) {
      checkDate = yesterdayDate;
    } else {
      return { streak: 0, lastDate: null };
    }

    while (workoutDates.has(getLocalDateString(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const lastDate = getLocalDateString(new Date(sessions[0].started_at));
    return { streak, lastDate };
  },

  // Calculate nutrition streak (met calorie goal based on user's fitness goal)
  async calculateNutritionStreak(userId) {
    const { data: goals } = await supabase
      .from('nutrition_goals')
      .select('calories')
      .eq('user_id', userId)
      .maybeSingle();

    if (!goals) return { streak: 0, lastDate: null };

    // Get user's fitness goal to determine streak logic
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('goal')
      .eq('id', userId)
      .maybeSingle();

    const userGoal = profile?.goal || 'build_muscle';
    const isFatLossGoal = ['lose_fat', 'lean', 'cut'].includes(userGoal);

    const { data: nutrition } = await supabase
      .from('daily_nutrition')
      .select('log_date, total_calories')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(60);

    if (!nutrition || nutrition.length === 0) {
      return { streak: 0, lastDate: null };
    }

    // For fat loss: must be UNDER goal (but at least 50% to ensure healthy eating)
    // For other goals: within 10% margin
    const targetMin = isFatLossGoal ? goals.calories * 0.5 : goals.calories * 0.9;
    const targetMax = isFatLossGoal ? goals.calories * 0.99 : goals.calories * 1.1;

    // Streak always counts from YESTERDAY backwards - today is always "in progress"
    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

    // Count consecutive days meeting goal from yesterday backwards
    for (const entry of nutrition) {
      const dateStr = entry.log_date;
      const expectedDate = getLocalDateString(checkDate);

      if (dateStr !== expectedDate) {
        break;
      }

      if (entry.total_calories >= targetMin && entry.total_calories <= targetMax) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const lastDate = nutrition[0]?.log_date;
    return { streak, lastDate };
  },

  // Calculate sleep streak (met sleep goal)
  async calculateSleepStreak(userId) {
    const { data: goals } = await supabase
      .from('sleep_goals')
      .select('target_hours')
      .eq('user_id', userId)
      .maybeSingle();

    if (!goals) return { streak: 0, lastDate: null };

    const { data: sleepLogs } = await supabase
      .from('sleep_logs')
      .select('log_date, hours_slept')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(60);

    if (!sleepLogs || sleepLogs.length === 0) {
      return { streak: 0, lastDate: null };
    }

    // Count consecutive days meeting goal (within 0.5 hour margin)
    const targetMin = goals.target_hours - 0.5;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // Sleep logs are for previous night

    for (const entry of sleepLogs) {
      const dateStr = entry.log_date;
      const expectedDate = getLocalDateString(checkDate);

      if (dateStr !== expectedDate) {
        break;
      }

      if (entry.hours_slept >= targetMin) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const lastDate = sleepLogs[0]?.log_date;
    return { streak, lastDate };
  },

  // Calculate water streak
  async calculateWaterStreak(userId) {
    const { data: goals } = await supabase
      .from('nutrition_goals')
      .select('water')
      .eq('user_id', userId)
      .maybeSingle();

    if (!goals) return { streak: 0, lastDate: null };

    const { data: nutrition } = await supabase
      .from('daily_nutrition')
      .select('log_date, water_intake')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(60);

    if (!nutrition || nutrition.length === 0) {
      return { streak: 0, lastDate: null };
    }

    const target = goals.water * 0.9; // 90% of goal

    // Streak always counts from YESTERDAY backwards - today is always "in progress"
    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

    for (const entry of nutrition) {
      const dateStr = entry.log_date;
      const expectedDate = getLocalDateString(checkDate);

      if (dateStr !== expectedDate) {
        break;
      }

      if (entry.water_intake >= target) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const lastDate = nutrition[0]?.log_date;
    return { streak, lastDate };
  },

  // Refresh all streaks for a user
  async refreshAllStreaks(userId) {
    const [workout, nutrition, sleep, water] = await Promise.all([
      this.calculateWorkoutStreak(userId),
      this.calculateNutritionStreak(userId),
      this.calculateSleepStreak(userId),
      this.calculateWaterStreak(userId),
    ]);

    await Promise.all([
      this.updateStreak(userId, 'workout', workout.streak, workout.lastDate),
      this.updateStreak(userId, 'nutrition', nutrition.streak, nutrition.lastDate),
      this.updateStreak(userId, 'sleep', sleep.streak, sleep.lastDate),
      this.updateStreak(userId, 'water', water.streak, water.lastDate),
    ]);

    return { workout, nutrition, sleep, water };
  },
};

export default streakService;
