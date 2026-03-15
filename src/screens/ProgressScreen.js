import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { streakService } from '../services/streakService';
import { weightService } from '../services/weightService';
import { nutritionService } from '../services/nutritionService';
import { sleepService } from '../services/sleepService';
import { profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { GOAL_INFO, GOAL_TO_PROGRAM, PROGRAM_TEMPLATES } from '../constants/goals';
import { WORKOUT_TEMPLATES } from '../constants/workoutTemplates';
import { EXPERIENCE_LEVELS } from '../constants/experience';
import WeighInModal from '../components/WeighInModal';
import GoalModal from '../components/GoalModal';
import Toast from '../components/Toast';

const ProgressScreen = () => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, profile, refreshProfile } = useAuth();
  const [chartPeriod, setChartPeriod] = useState('7D');
  const [showGoalLine, setShowGoalLine] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(false);
  const [trendsPeriod, setTrendsPeriod] = useState('7D');
  const [selectedWeightPoint, setSelectedWeightPoint] = useState(null);
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTargetWeightModal, setShowTargetWeightModal] = useState(false);
  const [tempTargetWeight, setTempTargetWeight] = useState('');
  const [currentGoal, setCurrentGoal] = useState('fitness');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Weight unit from profile
  const weightUnit = profile?.weight_unit || 'kg';

  // Helper to format weight with correct unit
  const formatWeight = (weightKg) => {
    if (!weightKg || weightKg === 0) return '--';
    if (weightUnit === 'lbs') {
      return `${(weightKg * 2.205).toFixed(1)} lbs`;
    }
    return `${weightKg.toFixed(1)} kg`;
  };

  // Update width on dimension changes (important for web)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const chartWidth = Math.min(screenWidth - 64, 600); // Cap at 600 for larger screens

  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  const [streaks, setStreaks] = useState({
    workouts: 0,
    calories: 0,
    water: 0,
    supps: 0,
    sleep: 0,
  });

  const [weightData, setWeightData] = useState({
    current: 0,
    target: 0,
    start: 0,
  });

  const [weightHistory, setWeightHistory] = useState([]);
  const [lastWeighInDate, setLastWeighInDate] = useState(null);

  const [programData, setProgramData] = useState(null);

  // Nutrition trend data
  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [sleepHistory, setSleepHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Load current goal from user_goals table
  useEffect(() => {
    const loadCurrentGoal = async () => {
      if (!user?.id) return;
      console.log('Loading goal for user:', user.id);
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('goal')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Loaded goal data:', { data, error });

        if (data?.goal) {
          console.log('Setting current goal to:', data.goal);
          setCurrentGoal(data.goal);
        }
      } catch (error) {
        console.log('Error loading goal:', error);
      }
    };
    loadCurrentGoal();
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Refresh profile first, then load data
        refreshProfile().then(() => {
          loadProgressData();
        }).catch(() => {
          loadProgressData(); // Load anyway if refresh fails
        });
      }
    }, [user])
  );

  // Reload program data when profile changes (e.g., after refreshProfile)
  useEffect(() => {
    if (profile?.fitness_goal) {
      loadProgramData();
    }
  }, [profile?.fitness_goal]);

  const loadProgressData = async () => {
    try {
      // Load workout stats
      const { count } = await workoutService.getWorkoutCount(user.id);
      const { data: streakData } = await streakService.getStreakData(user.id);

      setStats({
        totalWorkouts: count || 0,
        currentStreak: streakData?.current_streak || 0,
        bestStreak: streakData?.longest_streak || 0,
      });

      // Load weight data
      await loadWeightData();

      // Load user program
      await loadProgramData();

      // Load streaks
      await loadStreakData();

      // Load nutrition data for charts
      await loadNutritionData();
    } catch (error) {
      console.log('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeightData = async () => {
    console.log('loadWeightData called for user:', user.id);
    try {
      // Get weights
      const { data: weights, error } = await weightService.getAllWeights(user.id);

      // Get target weight - try localStorage first (most reliable for web)
      let target = 0;
      if (Platform.OS === 'web') {
        try {
          const stored = localStorage.getItem(`target_weight_${user.id}`);
          if (stored) {
            target = parseFloat(stored) || 0;
          }
        } catch (e) {
          console.log('localStorage read error:', e);
        }
      }

      // If no localStorage value, try database
      if (target === 0) {
        try {
          const [profileResult, goalsResult] = await Promise.all([
            supabase.from('profiles').select('target_weight').eq('id', user.id).maybeSingle(),
            supabase.from('user_goals').select('target_weight').eq('user_id', user.id).maybeSingle()
          ]);
          target = profileResult.data?.target_weight || goalsResult.data?.target_weight || 0;
        } catch (e) {
          console.log('DB target weight fetch error:', e);
        }
      }

      console.log('Target weight loaded:', target);

      console.log('getAllWeights result:', { weights, error, count: weights?.length, target });

      if (weights && weights.length > 0) {
        const formattedHistory = weights.map((w, idx) => ({
          week: `W${idx + 1}`,
          weight: Math.round(w.weight * 10) / 10,
          date: w.log_date,
        }));

        setWeightHistory(formattedHistory);

        // Set last weigh-in date for retrospective logging
        const lastWeight = weights[weights.length - 1];
        console.log('Last weight entry:', lastWeight);
        if (lastWeight?.log_date) {
          setLastWeighInDate(lastWeight.log_date);
        }

        const current = lastWeight.weight;
        const start = weights[0].weight;

        console.log('Setting weightData:', { current, start, target });
        setWeightData({
          current: Math.round(current * 10) / 10,
          start: Math.round(start * 10) / 10,
          target: target,
        });
      } else {
        console.log('No weights found');
        // Still set target if we have it
        if (target > 0) {
          setWeightData(prev => ({ ...prev, target }));
        }
      }
    } catch (error) {
      console.log('Error loading weight data:', error);
    }
  };

  const loadProgramData = async () => {
    try {
      // Get user's fitness goal from profile
      const goalKey = profile?.fitness_goal;

      if (goalKey) {
        const goalInfo = GOAL_INFO[goalKey];
        const programInfo = GOAL_TO_PROGRAM[goalKey];
        const experienceInfo = EXPERIENCE_LEVELS[profile?.experience_level] || EXPERIENCE_LEVELS.novice;

        if (programInfo) {
          // Calculate program progress based on completed workouts
          const { count: completedCount } = await workoutService.getWorkoutCount(user.id);
          const totalWorkouts = programInfo.days * programInfo.weeks;
          const progressPercent = Math.min(Math.round((completedCount / totalWorkouts) * 100), 100);

          // Calculate current week
          const { data: firstWorkout } = await supabase
            .from('workout_sessions')
            .select('started_at')
            .eq('user_id', user.id)
            .order('started_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          let currentWeek = 1;
          if (firstWorkout?.started_at) {
            const startDate = new Date(firstWorkout.started_at);
            const now = new Date();
            const weeksPassed = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
            currentWeek = Math.min(weeksPassed, programInfo.weeks);
          }

          setProgramData({
            name: programInfo.name,
            goalTitle: goalInfo?.title || 'General Fitness',
            experience: experienceInfo.label,
            progressPercent,
            done: completedCount,
            left: Math.max(totalWorkouts - completedCount, 0),
            currentWeek,
            totalWeeks: programInfo.weeks,
            weeksLeft: Math.max(programInfo.weeks - currentWeek, 0),
          });
        }
      }
    } catch (error) {
      console.log('Error loading program data:', error);
    }
  };

  const loadStreakData = async () => {
    try {
      const { streak: workoutStreak } = await streakService.calculateWorkoutStreak(user.id);

      // Calculate nutrition streaks from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const { data: nutritionHistory } = await nutritionService.getNutritionHistory(user.id, startDate, endDate);
      const { data: sleepHistory } = await sleepService.getSleepHistory(user.id, startDate, endDate);

      // Calculate consecutive days hitting goals
      let calorieStreak = 0;
      let waterStreak = 0;
      let sleepStreak = 0;

      // This is a simplified calculation - can be enhanced
      if (nutritionHistory && nutritionHistory.length > 0) {
        // Count days with calories logged
        calorieStreak = nutritionHistory.filter(n => n.total_calories > 0).length;
        waterStreak = nutritionHistory.filter(n => n.water_intake > 0).length;
      }

      if (sleepHistory && sleepHistory.length > 0) {
        sleepStreak = sleepHistory.length;
      }

      setStreaks({
        workouts: workoutStreak || 0,
        calories: Math.min(calorieStreak, 30),
        water: Math.min(waterStreak, 30),
        supps: 0, // Would need supplement tracking
        sleep: Math.min(sleepStreak, 30),
      });
    } catch (error) {
      console.log('Error loading streak data:', error);
    }
  };

  const loadNutritionData = async () => {
    try {
      // Get last 7 days of data for mini charts
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const { data: nutrition } = await nutritionService.getNutritionHistory(user.id, startDate, endDate);
      const { data: sleep } = await sleepService.getSleepHistory(user.id, startDate, endDate);

      if (nutrition && nutrition.length > 0) {
        setNutritionHistory(nutrition);
      }

      if (sleep && sleep.length > 0) {
        setSleepHistory(sleep);
      }
    } catch (error) {
      console.log('Error loading nutrition data:', error);
    }
  };

  const progressToGoal = () => {
    // No progress if no target is set
    if (!weightData.target || weightData.target === 0) return 0;
    if (!weightData.start || weightData.start === 0) return 0;
    if (!weightData.current || weightData.current === 0) return 0;

    const totalChange = Math.abs(weightData.start - weightData.target);
    const currentChange = Math.abs(weightData.current - weightData.start);
    return totalChange > 0 ? Math.min(100, Math.round((currentChange / totalChange) * 100)) : 0;
  };

  const handleSaveWeighIn = async (weight, unit, date) => {
    console.log('handleSaveWeighIn called:', { weight, unit, date, userId: user.id });
    try {
      const logDate = date || new Date().toISOString().split('T')[0];
      console.log('Logging weight with date:', logDate);
      const result = await weightService.logWeight(user.id, weight, unit, logDate);
      console.log('Weight log result:', result);

      // Reload weight data to show updated history
      console.log('Reloading weight data...');
      await loadWeightData();
      console.log('Weight data reloaded, weightData:', weightData);
      setShowWeighInModal(false);
    } catch (error) {
      console.log('Error logging weight:', error);
    }
  };

  // Helper to format date for database
  const formatDateForDB = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate workout schedule based on selected goal/program
  const generateWorkoutSchedule = async (userId, goal) => {
    try {
      const program = GOAL_TO_PROGRAM[goal];
      if (!program) {
        console.log('No program found for goal:', goal);
        return false;
      }

      const templateIds = PROGRAM_TEMPLATES[program.id];
      if (!templateIds || templateIds.length === 0) {
        console.log('No templates found for program:', program.id);
        return false;
      }

      const daysPerWeek = program.days || 4;

      // Generate schedule for the next 4 weeks
      const today = new Date();
      let templateIndex = 0;
      let workoutDayCount = 0;

      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const scheduleDate = new Date(today);
          scheduleDate.setDate(today.getDate() + (week * 7) + day);

          const dayOfWeek = scheduleDate.getDay(); // 0 = Sunday
          // Rest on Sunday (0) by default
          const isRestDay = dayOfWeek === 0 || workoutDayCount >= daysPerWeek;

          if (isRestDay) {
            // Sunday is always rest - skip
            if (dayOfWeek === 0) {
              continue;
            }
          } else {
            // Schedule a workout
            const templateId = templateIds[templateIndex % templateIds.length];
            const template = WORKOUT_TEMPLATES[templateId];

            if (template) {
              const dateStr = formatDateForDB(scheduleDate);
              try {
                await workoutService.setScheduleForDate(userId, dateStr, templateId, false);
                templateIndex++;
                workoutDayCount++;
              } catch (e) {
                console.log('Error setting schedule for date:', dateStr, e);
              }
            }
          }

          // Reset workout count at end of week
          if (day === 6) {
            workoutDayCount = 0;
          }
        }
      }

      console.log('Generated workout schedule for', goal, 'with', program.name);
      return true;
    } catch (error) {
      console.log('Error generating workout schedule:', error);
      return false;
    }
  };

  const handleSaveTargetWeight = async () => {
    const weight = parseFloat(tempTargetWeight);
    if (isNaN(weight) || weight <= 0) {
      showToast('Please enter a valid weight', 'error');
      return;
    }

    setShowTargetWeightModal(false);

    if (user?.id) {
      // Save to localStorage (reliable for web)
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(`target_weight_${user.id}`, weight.toString());
        } catch (e) {
          console.log('localStorage save error:', e);
        }
      }

      // Update local state immediately
      setWeightData(prev => ({ ...prev, target: weight }));

      // Save to both profiles and user_goals for consistency
      const [profileResult, goalsResult] = await Promise.all([
        supabase
          .from('profiles')
          .update({ target_weight: weight })
          .eq('id', user.id),
        supabase
          .from('user_goals')
          .upsert({
            user_id: user.id,
            target_weight: weight,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' }),
      ]);

      if (profileResult.error && goalsResult.error) {
        console.log('DB save errors:', profileResult.error, goalsResult.error);
        showToast('Target weight saved locally but failed to sync', 'error');
      } else {
        showToast('Target weight saved', 'success');
      }
    }
  };

  const handleSelectGoal = async (goalKey) => {
    console.log('Saving goal:', goalKey, 'for user:', user.id);
    setCurrentGoal(goalKey);
    setShowGoalModal(false);

    // Save to user_goals table
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: user.id,
          goal: goalKey,
        }, { onConflict: 'user_id' })
        .select();

      console.log('Goal save result:', { data, error });

      // Generate workout schedule based on the selected goal
      const program = GOAL_TO_PROGRAM[goalKey];
      if (program) {
        showToast(`Generating ${program.name} schedule...`, 'info');
        const success = await generateWorkoutSchedule(user.id, goalKey);
        if (success) {
          showToast(`${program.name} schedule created!`, 'success');
        } else {
          showToast('Schedule created with default program', 'info');
        }
      }
    } catch (error) {
      console.log('Error saving goal:', error);
      showToast('Error saving goal', 'error');
    }
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
    labelColor: (opacity = 1) => COLORS.textMuted,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '3 3',
      stroke: COLORS.surfaceLight,
    },
    propsForLabels: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
  };

  // Filter weight history based on selected period - only show actual data points
  const getFilteredWeightHistory = () => {
    if (weightHistory.length === 0) return [];

    const now = new Date();
    let cutoffDate;

    switch (chartPeriod) {
      case '7D':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '4W':
        cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    return weightHistory.filter(w => {
      if (!w.date) return true;
      return new Date(w.date) >= cutoffDate;
    });
  };

  const filteredWeightHistory = getFilteredWeightHistory();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate labels - dd Mmm format, sparse for longer periods
  const getChartLabels = () => {
    if (filteredWeightHistory.length === 0) return [];
    const dataLength = filteredWeightHistory.length;

    return filteredWeightHistory.map((w, index) => {
      // For longer periods, only show first and last
      if ((chartPeriod === '3M' || chartPeriod === '4W') && index !== 0 && index !== dataLength - 1) {
        return '';
      }
      if (w.date) {
        const date = new Date(w.date);
        return `${date.getDate()} ${months[date.getMonth()]}`;
      }
      return w.week;
    });
  };

  // Calculate trend line (linear regression)
  const getTrendLineData = () => {
    const weights = filteredWeightHistory.map(w => w.weight);
    const n = weights.length;
    if (n < 2) return weights;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += weights[i];
      sumXY += i * weights[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return weights.map((_, i) => Math.round((intercept + slope * i) * 10) / 10);
  };

  const weightChartData = filteredWeightHistory.length > 0 ? {
    labels: getChartLabels(),
    datasets: [
      {
        data: filteredWeightHistory.map(w => w.weight),
        color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
        strokeWidth: 2,
      },
      // Goal weight line (flat horizontal)
      ...(showGoalLine && weightData.target > 0 ? [{
        data: filteredWeightHistory.map(() => weightData.target),
        color: (opacity = 1) => `rgba(74, 222, 128, ${opacity * 0.7})`,
        strokeWidth: 2,
        withDots: false,
      }] : []),
      // Trend line (linear regression)
      ...(showTrendLine && filteredWeightHistory.length >= 2 ? [{
        data: getTrendLineData(),
        color: (opacity = 1) => `rgba(251, 191, 36, ${opacity * 0.7})`,
        strokeWidth: 2,
        withDots: false,
      }] : []),
    ],
  } : null;

  // Get trend chart labels with proper spacing - always dd Mmm format
  const getTrendLabels = (history, dateKey = 'log_date') => {
    if (!history || history.length === 0) return [];

    const dataLength = history.length;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return history.map((item, index) => {
      // For longer periods, show fewer labels
      if ((trendsPeriod === '3M' || trendsPeriod === '4W') && index !== 0 && index !== dataLength - 1) {
        return '';
      }
      const date = new Date(item[dateKey]);
      return `${date.getDate()} ${months[date.getMonth()]}`;
    });
  };

  // Generate chart data from actual history
  const generateNutritionChartData = (dataKey, color) => {
    if (!nutritionHistory || nutritionHistory.length < 2) return null;

    return {
      labels: getTrendLabels(nutritionHistory),
      datasets: [{
        data: nutritionHistory.map(n => n[dataKey] || 0),
        color: (opacity = 1) => color.replace('1)', `${opacity})`),
        strokeWidth: 2,
      }],
    };
  };

  const generateSleepChartData = () => {
    if (!sleepHistory || sleepHistory.length < 2) return null;

    return {
      labels: getTrendLabels(sleepHistory),
      datasets: [{
        data: sleepHistory.map(s => s.hours_slept || 0),
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const caloriesChartData = generateNutritionChartData('total_calories', 'rgba(239, 68, 68, 1)');
  const proteinChartData = generateNutritionChartData('total_protein', 'rgba(236, 72, 153, 1)');
  const waterChartData = generateNutritionChartData('water_intake', 'rgba(6, 182, 212, 1)');
  const sleepChartData = generateSleepChartData();

  // Common chart config for trend charts
  const trendChartConfig = (color) => ({
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: () => color,
    labelColor: () => COLORS.textMuted,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '3 3',
      stroke: COLORS.surfaceLight,
    },
    propsForLabels: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
  });

  // Swipeable chart card width
  const trendCardWidth = screenWidth - 48;

  const renderContent = () => (
    <>
      {/* OVERVIEW Section */}
      <Text style={styles.sectionLabel}>OVERVIEW</Text>
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewCardLabel}>Current</Text>
          <Text style={styles.overviewCardValue}>{formatWeight(weightData.current)}</Text>
          <Text style={styles.overviewCardSubtext}>{weightData.target > 0 ? `Target: ${formatWeight(weightData.target)}` : 'Log a weigh-in'}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.overviewCard,
            progressToGoal() >= 100 && styles.overviewCardComplete
          ]}
          onPress={() => {
            if (!weightData.target || weightData.target === 0) {
              setTempTargetWeight('');
              setShowTargetWeightModal(true);
            }
          }}
          activeOpacity={weightData.target > 0 ? 1 : 0.7}
        >
          <Text style={styles.overviewCardLabel}>Progress</Text>
          {weightData.target > 0 ? (
            <>
              <Text style={[styles.overviewCardValue, { color: COLORS.success }]}>{progressToGoal()}%</Text>
              <Text style={styles.overviewCardSubtext}>{progressToGoal() >= 100 ? 'Goal reached!' : 'to goal'}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.overviewCardValue, { color: COLORS.primary, fontSize: 18 }]}>Set Goal</Text>
              <Text style={styles.overviewCardSubtext}>tap to start</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* TARGET WEIGHT Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>TARGET WEIGHT</Text>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={() => {
            setTempTargetWeight(weightData.target?.toString() || '');
            setShowTargetWeightModal(true);
          }}
        >
          <Text style={styles.changeButtonText}>{weightData.target > 0 ? 'Edit' : 'Set Goal'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.targetWeightCard}>
        <View style={styles.targetWeightContent}>
          <View style={styles.targetWeightItem}>
            <Text style={styles.targetWeightLabel}>Current</Text>
            <Text style={styles.targetWeightValue}>{formatWeight(weightData.current)}</Text>
          </View>
          <Text style={styles.targetWeightArrow}>→</Text>
          <View style={styles.targetWeightItem}>
            <Text style={styles.targetWeightLabel}>Target</Text>
            <Text style={[styles.targetWeightValue, { color: COLORS.primary }]}>
              {weightData.target > 0 ? formatWeight(weightData.target) : 'Set Goal'}
            </Text>
          </View>
        </View>
        {weightData.target > 0 && weightData.current > 0 && (
          <View style={styles.targetWeightProgress}>
            <Text style={styles.targetWeightProgressText}>
              {weightData.current > weightData.target
                ? `${formatWeight(weightData.current - weightData.target)} to lose`
                : weightData.current < weightData.target
                ? `${formatWeight(weightData.target - weightData.current)} to gain`
                : 'Goal reached!'}
            </Text>
          </View>
        )}
      </View>

      {/* CURRENT GOAL Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>CURRENT GOAL</Text>
        <TouchableOpacity style={styles.changeButton} onPress={() => setShowGoalModal(true)}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{GOAL_INFO[currentGoal]?.title || 'General Fitness'}</Text>
            <Text style={styles.goalSubtitle}>{GOAL_INFO[currentGoal]?.idealDays || '3-5'} days/week</Text>
          </View>
        </View>
        <View style={styles.goalProgressRow}>
          <Text style={styles.goalProgressLabel}>Progress to goal</Text>
          <Text style={styles.goalProgressPercent}>{progressToGoal()}%</Text>
        </View>
        <View style={styles.goalProgressBar}>
          <View style={[styles.goalProgressFill, { width: `${progressToGoal()}%` }]} />
        </View>
        <View style={styles.goalWeights}>
          <Text style={styles.goalWeightText}>Start: {formatWeight(weightData.start)}</Text>
          <Text style={[styles.goalWeightText, { color: COLORS.text, fontWeight: '600' }]}>Now: {formatWeight(weightData.current)}</Text>
          <Text style={[styles.goalWeightText, { color: COLORS.success }]}>Goal: {formatWeight(weightData.target)}</Text>
        </View>
      </View>

      {/* STREAKS Section */}
      <Text style={styles.sectionLabel}>STREAKS</Text>
      <View style={styles.streaksRow}>
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Workouts</Text>
          <Text style={[styles.streakValue, { color: COLORS.primary }]}>{streaks.workouts}</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Calories</Text>
          <Text style={[styles.streakValue, { color: COLORS.primary }]}>{streaks.calories}</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Water</Text>
          <Text style={[styles.streakValue, { color: COLORS.primary }]}>{streaks.water}</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Supps</Text>
          <Text style={[styles.streakValue, { color: COLORS.primary }]}>{streaks.supps}</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Sleep</Text>
          <Text style={[styles.streakValue, { color: COLORS.primary }]}>{streaks.sleep}</Text>
        </View>
      </View>

      {/* PROGRAM Section */}
      <Text style={styles.sectionLabel}>PROGRAM</Text>
      {programData ? (
        <View style={styles.programCard}>
          <View style={styles.programHeader}>
            <Text style={styles.programTitle}>{programData.name}</Text>
            <View style={styles.programBadge}>
              <Text style={styles.programBadgeText}>{programData.progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.programProgressBar}>
            <View style={[styles.programProgressFill, { width: `${programData.progressPercent}%` }]} />
          </View>
          <View style={styles.programStats}>
            <View style={styles.programStat}>
              <Text style={[styles.programStatValue, { color: COLORS.success }]}>{programData.done}</Text>
              <Text style={styles.programStatLabel}>Done</Text>
            </View>
            <View style={styles.programStat}>
              <Text style={[styles.programStatValue, { color: '#F59E0B' }]}>{programData.left}</Text>
              <Text style={styles.programStatLabel}>Left</Text>
            </View>
            <View style={styles.programStat}>
              <Text style={[styles.programStatValue, { color: COLORS.primary }]}>{programData.currentWeek}/{programData.totalWeeks}</Text>
              <Text style={styles.programStatLabel}>Week</Text>
            </View>
            <View style={styles.programStat}>
              <Text style={[styles.programStatValue, { color: COLORS.primary }]}>{programData.weeksLeft}</Text>
              <Text style={styles.programStatLabel}>Wks left</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No program active</Text>
          <Text style={styles.emptyCardSubtext}>Start a workout program to track progress</Text>
        </View>
      )}

      {/* WEIGHT TRACKING Section */}
      <View style={styles.chartSectionHeader}>
        <Text style={styles.chartTitle}>Weight Tracking</Text>
        <View style={styles.chartPeriodRow}>
          {['7D', '4W', '3M'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.chartPeriodBtn, chartPeriod === period && styles.chartPeriodBtnActive]}
              onPress={() => setChartPeriod(period)}
            >
              <Text style={[styles.chartPeriodText, chartPeriod === period && styles.chartPeriodTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.chartCard}>
        {weightChartData && filteredWeightHistory.length > 0 ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: chartWidth }}>
              <LineChart
                data={weightChartData}
                width={Math.max(chartWidth, filteredWeightHistory.length * 50)}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={false}
                segments={4}
                onDataPointClick={({ index }) => {
                  const point = filteredWeightHistory[index];
                  const prevPoint = filteredWeightHistory[index - 1];
                  if (point) {
                    setSelectedWeightPoint({
                      ...point,
                      change: prevPoint ? point.weight - prevPoint.weight : null,
                    });
                  }
                }}
              />
            </ScrollView>
            {selectedWeightPoint && (
              <TouchableOpacity
                style={styles.weightTooltip}
                onPress={() => setSelectedWeightPoint(null)}
                activeOpacity={0.9}
              >
                <Text style={styles.weightTooltipDate}>
                  {selectedWeightPoint.date ? new Date(selectedWeightPoint.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--'}
                </Text>
                <Text style={styles.weightTooltipValue}>{formatWeight(selectedWeightPoint.weight)}</Text>
                {selectedWeightPoint.change !== null && (() => {
                  const wantToGain = weightData.target > (filteredWeightHistory[filteredWeightHistory.length - 1]?.weight || weightData.current);
                  const gained = selectedWeightPoint.change > 0.05;
                  const lost = selectedWeightPoint.change < -0.05;
                  const isGood = gained ? wantToGain : lost ? !wantToGain : false;
                  const changeColor = (gained || lost) ? (isGood ? COLORS.success : '#FF6B6B') : COLORS.textMuted;
                  return (
                    <View style={styles.weightTooltipChange}>
                      {gained ? (
                        <TrendingUp size={12} color={changeColor} />
                      ) : lost ? (
                        <TrendingDown size={12} color={changeColor} />
                      ) : (
                        <Minus size={12} color={COLORS.textMuted} />
                      )}
                      <Text style={[styles.weightTooltipChangeText, { color: changeColor }]}>
                        {selectedWeightPoint.change > 0 ? '+' : ''}{formatWeight(selectedWeightPoint.change)}
                      </Text>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            )}
            <View style={styles.chartLegend}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.chartLegendText}>Actual</Text>
              </View>
              {weightData.target > 0 && (
                <TouchableOpacity
                  style={styles.chartLegendItem}
                  onPress={() => setShowGoalLine(!showGoalLine)}
                >
                  <View style={[
                    styles.chartLegendDot,
                    { backgroundColor: showGoalLine ? COLORS.success : COLORS.surfaceLight },
                    !showGoalLine && { borderWidth: 1, borderColor: COLORS.textMuted },
                  ]} />
                  <Text style={[
                    styles.chartLegendText,
                    !showGoalLine && { color: COLORS.textMuted },
                  ]}>Goal ({formatWeight(weightData.target)})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.chartLegendItem}
                onPress={() => setShowTrendLine(!showTrendLine)}
              >
                <View style={[
                  styles.chartLegendDot,
                  { backgroundColor: showTrendLine ? '#FBBF24' : COLORS.surfaceLight },
                  !showTrendLine && { borderWidth: 1, borderColor: COLORS.textMuted },
                ]} />
                <Text style={[
                  styles.chartLegendText,
                  !showTrendLine && { color: COLORS.textMuted },
                ]}>Trend</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.chartEmpty}>
            <Text style={styles.chartEmptyText}>No weight data yet</Text>
            <Text style={styles.chartEmptySubtext}>Log weigh-ins to see your progress</Text>
          </View>
        )}
      </View>

      {/* TRENDS Section */}
      <View style={styles.trendsSectionHeader}>
        <Text style={styles.sectionLabel}>TRENDS</Text>
        <View style={styles.chartPeriodRow}>
          {['7D', '4W', '3M'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.chartPeriodBtn, trendsPeriod === period && styles.chartPeriodBtnActive]}
              onPress={() => setTrendsPeriod(period)}
            >
              <Text style={[styles.chartPeriodText, trendsPeriod === period && styles.chartPeriodTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.trendsScrollView}
        contentContainerStyle={styles.trendsScrollContent}
      >
        {/* Calories Card */}
        <View style={[styles.trendCard, { width: trendCardWidth }]}>
          <View style={styles.trendCardHeader}>
            <Text style={[styles.trendCardTitle, { color: COLORS.accent }]}>Calories</Text>
            {nutritionHistory.length > 0 && (
              <Text style={styles.trendAvgText}>
                Avg: {Math.round(nutritionHistory.reduce((sum, n) => sum + (n.total_calories || 0), 0) / nutritionHistory.length)}
              </Text>
            )}
          </View>
          {caloriesChartData ? (
            <LineChart
              data={caloriesChartData}
              width={trendCardWidth - 32}
              height={160}
              chartConfig={trendChartConfig(COLORS.accent)}
              bezier
              withShadow={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              segments={3}
              style={{ marginLeft: -8 }}
            />
          ) : (
            <View style={styles.trendChartEmpty}>
              <Text style={styles.trendChartEmptyText}>No calorie data yet</Text>
            </View>
          )}
        </View>

        {/* Protein Card */}
        <View style={[styles.trendCard, { width: trendCardWidth }]}>
          <View style={styles.trendCardHeader}>
            <Text style={[styles.trendCardTitle, { color: '#EC4899' }]}>Protein</Text>
            {nutritionHistory.length > 0 && (
              <Text style={styles.trendAvgText}>
                Avg: {Math.round(nutritionHistory.reduce((sum, n) => sum + (n.total_protein || 0), 0) / nutritionHistory.length)}g
              </Text>
            )}
          </View>
          {proteinChartData ? (
            <LineChart
              data={proteinChartData}
              width={trendCardWidth - 32}
              height={160}
              chartConfig={trendChartConfig('#EC4899')}
              bezier
              withShadow={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              segments={3}
              style={{ marginLeft: -8 }}
            />
          ) : (
            <View style={styles.trendChartEmpty}>
              <Text style={styles.trendChartEmptyText}>No protein data yet</Text>
            </View>
          )}
        </View>

        {/* Water Card */}
        <View style={[styles.trendCard, { width: trendCardWidth }]}>
          <View style={styles.trendCardHeader}>
            <Text style={[styles.trendCardTitle, { color: '#06B6D4' }]}>Water</Text>
            {nutritionHistory.length > 0 && (
              <Text style={styles.trendAvgText}>
                Avg: {(nutritionHistory.reduce((sum, n) => sum + (n.water_intake || 0), 0) / nutritionHistory.length / 1000).toFixed(1)}L
              </Text>
            )}
          </View>
          {waterChartData ? (
            <LineChart
              data={waterChartData}
              width={trendCardWidth - 32}
              height={160}
              chartConfig={trendChartConfig('#06B6D4')}
              bezier
              withShadow={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              segments={3}
              style={{ marginLeft: -8 }}
            />
          ) : (
            <View style={styles.trendChartEmpty}>
              <Text style={styles.trendChartEmptyText}>No water data yet</Text>
            </View>
          )}
        </View>

        {/* Sleep Card */}
        <View style={[styles.trendCard, { width: trendCardWidth }]}>
          <View style={styles.trendCardHeader}>
            <Text style={[styles.trendCardTitle, { color: '#8B5CF6' }]}>Sleep</Text>
            {sleepHistory.length > 0 && (
              <Text style={styles.trendAvgText}>
                Avg: {(sleepHistory.reduce((sum, s) => sum + (s.hours_slept || 0), 0) / sleepHistory.length).toFixed(1)}h
              </Text>
            )}
          </View>
          {sleepChartData ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: trendCardWidth - 32 }}>
              <LineChart
                data={sleepChartData}
                width={Math.max(trendCardWidth - 32, (sleepHistory?.length || 0) * 50)}
                height={160}
                chartConfig={trendChartConfig('#8B5CF6')}
                bezier
                withShadow={false}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                segments={3}
                style={{ marginLeft: -8 }}
              />
            </ScrollView>
          ) : (
            <View style={styles.trendChartEmpty}>
              <Text style={styles.trendChartEmptyText}>No sleep data yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MEASUREMENTS Section */}
      <Text style={styles.sectionLabel}>MEASUREMENTS</Text>
      <View style={styles.measurementsCard}>
        <View style={styles.measurementRow}>
          <Text style={styles.measurementLabel}>Current Weight</Text>
          <Text style={styles.measurementValue}>{formatWeight(weightData.current)}</Text>
        </View>
        <View style={styles.measurementRow}>
          <Text style={styles.measurementLabel}>Goal Weight</Text>
          <Text style={styles.measurementValue}>{formatWeight(weightData.target)}</Text>
        </View>
        <View style={styles.measurementRow}>
          <Text style={styles.measurementLabel}>To Go</Text>
          <Text style={styles.measurementValue}>{weightData.current > 0 && weightData.target > 0 ? formatWeight(Math.abs(weightData.current - weightData.target)) : '--'}</Text>
        </View>
      </View>

      {/* Log Weigh-In Button */}
      <TouchableOpacity
        style={styles.logWeighInBtn}
        onPress={() => setShowWeighInModal(true)}
      >
        <Text style={styles.logWeighInText}>Log Weigh-In</Text>
      </TouchableOpacity>

      {/* WEIGH-IN HISTORY Section */}
      <Text style={styles.sectionLabel}>WEIGH-IN HISTORY</Text>
      <View style={styles.historyCard}>
        {weightHistory.length > 0 ? (
          <>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyHeaderText}>Date</Text>
              <Text style={[styles.historyHeaderText, { minWidth: 55, textAlign: 'right' }]}>Weight</Text>
              <Text style={[styles.historyHeaderText, { minWidth: 45, textAlign: 'right' }]}>Change</Text>
              <Text style={[styles.historyHeaderText, { minWidth: 45, textAlign: 'right' }]}>Total</Text>
            </View>
            <ScrollView
              style={styles.historyScrollView}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
            {weightHistory.slice().reverse().map((entry, index, arr) => {
              const nextEntry = arr[index + 1];
              const diffFromLast = nextEntry ? entry.weight - nextEntry.weight : 0;
              const startEntry = arr[arr.length - 1];
              const diffFromStart = startEntry ? entry.weight - startEntry.weight : 0;

              // Determine if goal is to gain or lose weight based on target vs first entry
              const firstWeight = arr[arr.length - 1]?.weight || weightData.current;
              const wantToGain = weightData.target > firstWeight;

              // Color logic: green = good progress, red = bad progress
              const getDiffColor = (diff) => {
                if (Math.abs(diff) < 0.05) return null;
                const gained = diff > 0;
                const isGood = wantToGain ? gained : !gained;
                return isGood ? COLORS.success : '#FF6B6B';
              };

              const formatDiff = (diff) => {
                if (Math.abs(diff) < 0.05) return '—';
                const sign = diff > 0 ? '+' : '';
                return `${sign}${diff.toFixed(1)}`;
              };

              return (
                <View key={index} style={[styles.historyRow, index < arr.length - 1 && styles.historyRowBorder]}>
                  <Text style={styles.historyDate}>
                    {entry.date ? new Date(entry.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    }) : entry.week}
                  </Text>
                  <Text style={styles.historyWeight}>{formatWeight(entry.weight)}</Text>
                  <Text style={[
                    styles.historyDiff,
                    getDiffColor(diffFromLast) && { color: getDiffColor(diffFromLast) },
                  ]}>
                    {formatDiff(diffFromLast)}
                  </Text>
                  <Text style={[
                    styles.historyDiff,
                    getDiffColor(diffFromStart) && { color: getDiffColor(diffFromStart) },
                  ]}>
                    {formatDiff(diffFromStart)}
                  </Text>
                </View>
              );
            })}
            </ScrollView>
          </>
        ) : (
          <Text style={styles.historyEmptyText}>Log your weigh-ins to track progress</Text>
        )}
      </View>

      <View style={{ height: 100 }} />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, position: 'relative', backgroundColor: COLORS.background }}>
        <SafeAreaView style={styles.container}>
          <div style={{ flex: 1, overflowY: 'auto', height: '100%' }}>
            <View style={styles.content}>
              {renderContent()}
            </View>
          </div>
        </SafeAreaView>
        <WeighInModal
          visible={showWeighInModal}
          onClose={() => setShowWeighInModal(false)}
          onSave={handleSaveWeighIn}
          currentWeight={weightData.current}
          unit={weightUnit}
          lastWeighInDate={lastWeighInDate}
        />
        <GoalModal
          visible={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          currentGoal={currentGoal}
          onSelect={handleSelectGoal}
        />
        {/* Target Weight Modal - Web Version */}
        {showTargetWeightModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowTargetWeightModal(false)}
          >
            <div
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 24,
                width: '90%',
                maxWidth: 400,
                paddingBottom: 24,
                overflow: 'visible',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.surfaceLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ cursor: 'pointer' }} onClick={() => setShowTargetWeightModal(false)}>
                  <X size={24} color={COLORS.text} />
                </div>
                <Text style={styles.targetModalTitle}>Set Target Weight</Text>
                <div style={{ width: 24 }} />
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Text style={styles.targetModalLabel}>
                  What's your goal weight?
                </Text>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: COLORS.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      const current = parseFloat(tempTargetWeight) || 0;
                      setTempTargetWeight((current - 0.1).toFixed(1));
                    }}
                  >
                    <span style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>−</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontSize: 28,
                      fontWeight: 'bold',
                      color: COLORS.text,
                      textAlign: 'center',
                      width: 100,
                      border: 'none',
                      outline: 'none',
                    }}
                    value={tempTargetWeight}
                    onChange={(e) => setTempTargetWeight(e.target.value)}
                    placeholder="0"
                  />
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: COLORS.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      const current = parseFloat(tempTargetWeight) || 0;
                      setTempTargetWeight((current + 0.1).toFixed(1));
                    }}
                  >
                    <span style={{ color: COLORS.text, fontSize: 20, fontWeight: 'bold' }}>+</span>
                  </div>
                  <span style={{ color: COLORS.textMuted, fontSize: 20, fontWeight: '600', marginLeft: 4 }}>
                    {weightUnit === 'lbs' ? 'lbs' : 'kg'}
                  </span>
                </div>
                {weightData.current > 0 && (
                  <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 16 }}>
                    Current weight: {formatWeight(weightData.current)}
                  </Text>
                )}
              </div>

              <div style={{ padding: '0 16px 16px 16px' }}>
                <div
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={handleSaveTargetWeight}
                >
                  <Text style={styles.targetSaveBtnText}>Save Target</Text>
                </div>
              </div>
            </div>
          </div>
        )}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastVisible(false)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderContent()}
        </View>
      </ScrollView>
      <WeighInModal
        visible={showWeighInModal}
        onClose={() => setShowWeighInModal(false)}
        onSave={handleSaveWeighIn}
        currentWeight={weightData.current}
        unit={weightUnit}
        lastWeighInDate={lastWeighInDate}
      />
      <GoalModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={currentGoal}
        onSelect={handleSelectGoal}
      />
      {/* Target Weight Modal */}
      <Modal
        visible={showTargetWeightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTargetWeightModal(false)}
      >
        <View style={styles.targetModalOverlay}>
          <View style={styles.targetModalContainer}>
            <View style={styles.targetModalHeader}>
              <TouchableOpacity onPress={() => setShowTargetWeightModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.targetModalTitle}>Set Target Weight</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.targetModalContent}>
              <Text style={styles.targetModalLabel}>
                What's your goal weight?
              </Text>
              <View style={styles.targetInputRow}>
                <TextInput
                  style={styles.targetInput}
                  value={tempTargetWeight}
                  onChangeText={setTempTargetWeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.targetInputUnit}>
                  {weightUnit === 'lbs' ? 'lbs' : 'kg'}
                </Text>
              </View>
              {weightData.current > 0 && (
                <Text style={styles.targetHint}>
                  Current weight: {formatWeight(weightData.current)}
                </Text>
              )}
            </View>

            <View style={styles.targetModalFooter}>
              <TouchableOpacity
                style={styles.targetSaveBtn}
                onPress={handleSaveTargetWeight}
              >
                <Text style={styles.targetSaveBtnText}>Save Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  changeButtonText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Overview
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  overviewCardComplete: {
    borderWidth: 2,
    borderColor: COLORS.success + '60',
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  overviewCardLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  overviewCardValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overviewCardSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Goal
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  goalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  goalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalProgressLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  goalProgressPercent: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    marginBottom: 12,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  goalWeights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalWeightText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // Streaks
  streaksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  streakCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  streakLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Program
  programCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  programTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  programBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  programBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  programProgressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    marginBottom: 16,
  },
  programProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  programStat: {
    alignItems: 'center',
  },
  programStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  programStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },

  // Chart
  chartSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  chartTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
  chartPeriodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chartPeriodRowSmall: {
    flexDirection: 'row',
    gap: 4,
  },
  chartPeriodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chartPeriodBtnActive: {
    borderColor: COLORS.primary,
  },
  chartPeriodText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chartPeriodTextActive: {
    color: COLORS.primary,
  },
  chartGoalLine: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  chartGoalText: {
    color: COLORS.success,
    fontSize: 11,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartLegendDot: {
    width: 12,
    height: 3,
    borderRadius: 2,
  },
  chartLegendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Nutrition
  nutritionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  nutritionChartSection: {
    paddingVertical: 12,
  },
  nutritionChartBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    marginTop: 12,
    paddingTop: 16,
  },
  nutritionChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionChartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionAvgText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  chartPeriodBtnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartPeriodBtnActiveSmall: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chartPeriodTextSmall: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  chartPeriodTextActiveSmall: {
    color: COLORS.primary,
  },
  miniChart: {
    marginLeft: -16,
    borderRadius: 8,
    paddingBottom: 10,
  },

  // Body Composition
  comingSoonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  comingSoonTitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  comingSoonText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Measurements
  measurementsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  measurementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  measurementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  measurementValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Log Weigh-In
  logWeighInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    marginTop: 20,
  },
  logWeighInText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // History
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    maxHeight: 300,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    gap: 12,
  },
  historyHeaderText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 50,
  },
  historyScrollView: {
    maxHeight: 250,
    ...(Platform.OS === 'web' ? { overflow: 'auto' } : {}),
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  historyWeek: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 13,
    minWidth: 50,
  },
  historyWeight: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 55,
    textAlign: 'right',
  },
  historyDiff: {
    color: COLORS.textMuted,
    fontSize: 13,
    minWidth: 45,
    textAlign: 'right',
  },
  historyEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },

  // Empty states
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyCardText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCardSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  chartEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartEmptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  chartEmptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  miniChartEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  miniChartEmptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  // Target Weight Section
  targetWeightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  targetWeightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetWeightItem: {
    flex: 1,
    alignItems: 'center',
  },
  targetWeightLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  targetWeightValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  targetWeightArrow: {
    paddingHorizontal: 16,
    color: COLORS.primary,
    fontSize: 24,
  },
  targetWeightProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  targetWeightProgressText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Target Weight Modal
  targetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  targetModalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  targetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  targetModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  targetModalContent: {
    padding: 24,
    alignItems: 'center',
  },
  targetModalLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 120,
  },
  targetInputUnit: {
    color: COLORS.textMuted,
    fontSize: 24,
    fontWeight: '600',
  },
  targetHint: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 16,
  },
  targetModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  targetSaveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  targetSaveBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Trends Section
  trendsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendsScrollView: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  trendsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  trendCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  trendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendAvgText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  trendChartEmpty: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendChartEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },

  // Weight Chart Tooltip
  weightTooltip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
    minWidth: 90,
  },
  weightTooltipDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  weightTooltipValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  weightTooltipChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  weightTooltipChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProgressScreen;
