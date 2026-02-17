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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Dumbbell,
  Trophy,
  Calendar,
  Target,
  Scale,
  Droplets,
  Moon,
  Zap,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { streakService } from '../services/streakService';
import { weightService } from '../services/weightService';
import { nutritionService } from '../services/nutritionService';
import { sleepService } from '../services/sleepService';
import { supabase } from '../lib/supabase';
import { GOAL_INFO, GOAL_TO_PROGRAM } from '../constants/goals';
import { EXPERIENCE_LEVELS } from '../constants/experience';
import WeighInModal from '../components/WeighInModal';
import GoalModal from '../components/GoalModal';

const ProgressScreen = () => {
  const { user, profile } = useAuth();
  const [chartPeriod, setChartPeriod] = useState('All');
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
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

  const [programData, setProgramData] = useState(null);

  // Nutrition trend data
  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [sleepHistory, setSleepHistory] = useState([]);

  const [loading, setLoading] = useState(true);

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
        loadProgressData();
      }
    }, [user])
  );

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
    try {
      const { data: weights } = await weightService.getAllWeights(user.id);

      if (weights && weights.length > 0) {
        const formattedHistory = weights.map((w, idx) => ({
          week: `W${idx + 1}`,
          weight: Math.round(w.weight * 10) / 10,
          date: w.log_date,
        }));

        setWeightHistory(formattedHistory);

        const current = weights[weights.length - 1].weight;
        const start = weights[0].weight;
        // Get target from profile
        const target = user?.user_metadata?.target_weight || 0;

        setWeightData({
          current: Math.round(current * 10) / 10,
          start: Math.round(start * 10) / 10,
          target: target,
        });
      }
    } catch (error) {
      console.log('Error loading weight data:', error);
    }
  };

  const loadProgramData = async () => {
    try {
      // Get user's goals from the database
      const { data: goalData } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (goalData && goalData.goal) {
        const goalKey = goalData.goal;
        const goalInfo = GOAL_INFO[goalKey];
        const programInfo = GOAL_TO_PROGRAM[goalKey];
        const experienceInfo = EXPERIENCE_LEVELS[goalData.experience] || EXPERIENCE_LEVELS.novice;

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
    const totalChange = Math.abs(weightData.start - weightData.target);
    const currentChange = Math.abs(weightData.current - weightData.start);
    return totalChange > 0 ? Math.round((currentChange / totalChange) * 100) : 0;
  };

  const handleSaveWeighIn = async (weight, unit, date) => {
    try {
      const logDate = date || new Date().toISOString().split('T')[0];
      await weightService.logWeight(user.id, weight, unit, logDate);

      // Reload weight data to show updated history
      await loadWeightData();
      setShowWeighInModal(false);
    } catch (error) {
      console.log('Error logging weight:', error);
    }
  };

  const handleSelectGoal = async (goalKey) => {
    console.log('Saving goal:', goalKey, 'for user:', user.id);
    setCurrentGoal(goalKey);
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
    } catch (error) {
      console.log('Error saving goal:', error);
    }
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
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
  };

  // Dynamic chart data based on period - returns actual user data only
  const getChartLabels = () => {
    if (weightHistory.length === 0) return [];
    return weightHistory.map(w => w.week);
  };

  const getWeightData = () => {
    if (weightHistory.length === 0) return [];
    return weightHistory.map(w => w.weight);
  };

  const weightChartData = weightHistory.length > 0 ? {
    labels: getChartLabels(),
    datasets: [
      {
        data: getWeightData(),
        color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  } : null;

  // Generate chart data from actual history
  const generateNutritionChartData = (dataKey, color) => {
    if (!nutritionHistory || nutritionHistory.length < 2) return null;

    const labels = nutritionHistory.map(n => {
      const date = new Date(n.log_date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = nutritionHistory.map(n => n[dataKey] || 0);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => color.replace('1)', `${opacity})`),
        strokeWidth: 2,
      }],
    };
  };

  const generateSleepChartData = () => {
    if (!sleepHistory || sleepHistory.length < 2) return null;

    const labels = sleepHistory.map(s => {
      const date = new Date(s.log_date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = sleepHistory.map(s => s.hours_slept || 0);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const caloriesChartData = generateNutritionChartData('total_calories', 'rgba(239, 68, 68, 1)');
  const proteinChartData = generateNutritionChartData('total_protein', 'rgba(236, 72, 153, 1)');
  const waterChartData = generateNutritionChartData('water_intake', 'rgba(6, 182, 212, 1)');
  const sleepChartData = generateSleepChartData();

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      {/* OVERVIEW Section */}
      <Text style={styles.sectionLabel}>OVERVIEW</Text>
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardHeader}>
            <TrendingUp size={16} color={COLORS.primary} />
            <Text style={styles.overviewCardLabel}>Current</Text>
          </View>
          <Text style={styles.overviewCardValue}>{formatWeight(weightData.current)}</Text>
          <Text style={styles.overviewCardSubtext}>{weightData.target > 0 ? `Target: ${formatWeight(weightData.target)}` : 'Log a weigh-in'}</Text>
        </View>
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardHeader}>
            <Target size={16} color={COLORS.success} />
            <Text style={styles.overviewCardLabel}>Progress</Text>
          </View>
          <Text style={[styles.overviewCardValue, { color: COLORS.success }]}>{weightData.current > 0 ? `${progressToGoal()}%` : '--'}</Text>
          <Text style={styles.overviewCardSubtext}>to goal</Text>
        </View>
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
          <View style={styles.goalIconContainer}>
            <Target size={24} color={COLORS.primary} />
          </View>
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
          <Dumbbell size={18} color={COLORS.textMuted} />
          <Text style={styles.streakLabel}>Workouts</Text>
          <Text style={[styles.streakValue, { color: '#F59E0B' }]}>{streaks.workouts}</Text>
        </View>
        <View style={styles.streakCard}>
          <Flame size={18} color={COLORS.textMuted} />
          <Text style={styles.streakLabel}>Calories</Text>
          <Text style={[styles.streakValue, { color: COLORS.accent }]}>{streaks.calories}</Text>
        </View>
        <View style={styles.streakCard}>
          <Droplets size={18} color={COLORS.textMuted} />
          <Text style={styles.streakLabel}>Water</Text>
          <Text style={[styles.streakValue, { color: '#06B6D4' }]}>{streaks.water}</Text>
        </View>
        <View style={styles.streakCard}>
          <Zap size={18} color={COLORS.textMuted} />
          <Text style={styles.streakLabel}>Supps</Text>
          <Text style={[styles.streakValue, { color: '#F59E0B' }]}>{streaks.supps}</Text>
        </View>
        <View style={styles.streakCard}>
          <Moon size={18} color={COLORS.textMuted} />
          <Text style={styles.streakLabel}>Sleep</Text>
          <Text style={[styles.streakValue, { color: '#8B5CF6' }]}>{streaks.sleep}</Text>
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
          {['7D', '30D', '90D', 'All'].map((period) => (
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
        {weightChartData && weightHistory.length > 0 ? (
          <>
            <LineChart
              data={weightChartData}
              width={chartWidth}
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
            />
            <View style={styles.chartGoalLine}>
              <Text style={styles.chartGoalText}>Goal: {formatWeight(weightData.target)}</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.chartLegendText}>Actual</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.chartLegendText}>Goal</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.chartEmpty}>
            <Scale size={32} color={COLORS.textMuted} />
            <Text style={styles.chartEmptyText}>No weight data yet</Text>
            <Text style={styles.chartEmptySubtext}>Log weigh-ins to see your progress</Text>
          </View>
        )}
      </View>

      {/* NUTRITION TRENDS Section */}
      <Text style={styles.sectionLabel}>NUTRITION TRENDS (Last 7 Days)</Text>
      <View style={styles.nutritionCard}>
        {/* Calories */}
        <View style={styles.nutritionChartSection}>
          <View style={styles.nutritionChartHeader}>
            <Text style={[styles.nutritionChartTitle, { color: COLORS.accent }]}>Calories</Text>
            {nutritionHistory.length > 0 && (
              <Text style={styles.nutritionAvgText}>
                Avg: {Math.round(nutritionHistory.reduce((sum, n) => sum + (n.total_calories || 0), 0) / nutritionHistory.length)}
              </Text>
            )}
          </View>
          {caloriesChartData ? (
            <LineChart
              data={caloriesChartData}
              width={chartWidth}
              height={100}
              chartConfig={{...chartConfig, color: () => COLORS.accent}}
              bezier
              style={styles.miniChart}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withDots={true}
              withShadow={false}
            />
          ) : (
            <View style={styles.miniChartEmpty}>
              <Flame size={24} color={COLORS.textMuted} />
              <Text style={styles.miniChartEmptyText}>No calorie data yet</Text>
            </View>
          )}
        </View>

        {/* Protein */}
        <View style={[styles.nutritionChartSection, styles.nutritionChartBorder]}>
          <View style={styles.nutritionChartHeader}>
            <Text style={[styles.nutritionChartTitle, { color: '#EC4899' }]}>Protein</Text>
            {nutritionHistory.length > 0 && (
              <Text style={styles.nutritionAvgText}>
                Avg: {Math.round(nutritionHistory.reduce((sum, n) => sum + (n.total_protein || 0), 0) / nutritionHistory.length)}g
              </Text>
            )}
          </View>
          {proteinChartData ? (
            <LineChart
              data={proteinChartData}
              width={chartWidth}
              height={100}
              chartConfig={{...chartConfig, color: () => '#EC4899'}}
              bezier
              style={styles.miniChart}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withDots={true}
              withShadow={false}
            />
          ) : (
            <View style={styles.miniChartEmpty}>
              <Zap size={24} color={COLORS.textMuted} />
              <Text style={styles.miniChartEmptyText}>No protein data yet</Text>
            </View>
          )}
        </View>

        {/* Water */}
        <View style={[styles.nutritionChartSection, styles.nutritionChartBorder]}>
          <View style={styles.nutritionChartHeader}>
            <Text style={[styles.nutritionChartTitle, { color: '#06B6D4' }]}>Water</Text>
            {nutritionHistory.length > 0 && (
              <Text style={styles.nutritionAvgText}>
                Avg: {(nutritionHistory.reduce((sum, n) => sum + (n.water_intake || 0), 0) / nutritionHistory.length / 1000).toFixed(1)}L
              </Text>
            )}
          </View>
          {waterChartData ? (
            <LineChart
              data={waterChartData}
              width={chartWidth}
              height={100}
              chartConfig={{...chartConfig, color: () => '#06B6D4'}}
              bezier
              style={styles.miniChart}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withDots={true}
              withShadow={false}
            />
          ) : (
            <View style={styles.miniChartEmpty}>
              <Droplets size={24} color={COLORS.textMuted} />
              <Text style={styles.miniChartEmptyText}>No water data yet</Text>
            </View>
          )}
        </View>

        {/* Sleep */}
        <View style={[styles.nutritionChartSection, styles.nutritionChartBorder]}>
          <View style={styles.nutritionChartHeader}>
            <Text style={[styles.nutritionChartTitle, { color: '#8B5CF6' }]}>Sleep</Text>
            {sleepHistory.length > 0 && (
              <Text style={styles.nutritionAvgText}>
                Avg: {(sleepHistory.reduce((sum, s) => sum + (s.hours_slept || 0), 0) / sleepHistory.length).toFixed(1)}h
              </Text>
            )}
          </View>
          {sleepChartData ? (
            <LineChart
              data={sleepChartData}
              width={chartWidth}
              height={100}
              chartConfig={{...chartConfig, color: () => '#8B5CF6'}}
              bezier
              style={styles.miniChart}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withDots={true}
              withShadow={false}
            />
          ) : (
            <View style={styles.miniChartEmpty}>
              <Moon size={24} color={COLORS.textMuted} />
              <Text style={styles.miniChartEmptyText}>No sleep data yet</Text>
            </View>
          )}
        </View>
      </View>

      {/* BODY COMPOSITION Section */}
      <Text style={styles.sectionLabel}>BODY COMPOSITION</Text>
      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonTitle}>Track body fat and muscle mass</Text>
        <Text style={styles.comingSoonText}>Coming soon</Text>
      </View>

      {/* MEASUREMENTS Section */}
      <Text style={styles.sectionLabel}>MEASUREMENTS</Text>
      <View style={styles.measurementsCard}>
        <View style={styles.measurementRow}>
          <View style={styles.measurementLeft}>
            <View style={[styles.measurementIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <TrendingUp size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.measurementLabel}>Current Weight</Text>
          </View>
          <Text style={styles.measurementValue}>{formatWeight(weightData.current)}</Text>
        </View>
        <View style={styles.measurementRow}>
          <View style={styles.measurementLeft}>
            <View style={[styles.measurementIcon, { backgroundColor: '#4DD0E1' + '20' }]}>
              <Target size={16} color="#4DD0E1" />
            </View>
            <Text style={styles.measurementLabel}>Goal Weight</Text>
          </View>
          <Text style={styles.measurementValue}>{formatWeight(weightData.target)}</Text>
        </View>
        <View style={styles.measurementRow}>
          <View style={styles.measurementLeft}>
            <View style={[styles.measurementIcon, { backgroundColor: COLORS.success + '20' }]}>
              <TrendingDown size={16} color={COLORS.success} />
            </View>
            <Text style={styles.measurementLabel}>To Go</Text>
          </View>
          <Text style={styles.measurementValue}>{weightData.current > 0 && weightData.target > 0 ? formatWeight(Math.abs(weightData.current - weightData.target)) : '--'}</Text>
        </View>
      </View>

      {/* Log Weigh-In Button */}
      <TouchableOpacity
        style={styles.logWeighInBtn}
        onPress={() => setShowWeighInModal(true)}
      >
        <Plus size={20} color={COLORS.text} />
        <Text style={styles.logWeighInText}>Log Weigh-In</Text>
      </TouchableOpacity>

      {/* WEIGH-IN HISTORY Section */}
      <Text style={styles.sectionLabel}>WEIGH-IN HISTORY</Text>
      <View style={styles.historyCard}>
        {weightHistory.length > 0 ? (
          weightHistory.slice().reverse().map((entry, index) => (
            <View key={index} style={[styles.historyRow, index < weightHistory.length - 1 && styles.historyRowBorder]}>
              <Text style={styles.historyDate}>
                {entry.date ? new Date(entry.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                }) : entry.week}
              </Text>
              <Text style={styles.historyWeight}>{formatWeight(entry.weight)}</Text>
            </View>
          ))
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
        />
        <GoalModal
          visible={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          currentGoal={currentGoal}
          onSelect={handleSelectGoal}
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
      />
      <GoalModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={currentGoal}
        onSelect={handleSelectGoal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  overviewCardLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  overviewCardValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  overviewCardSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
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
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // History
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 14,
  },
  historyWeight: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
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
});

export default ProgressScreen;
