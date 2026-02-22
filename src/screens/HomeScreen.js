import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Bell,
  Play,
  Droplets,
  Check,
  Scale,
  Calendar,
  Moon,
  Pause,
  Plus,
  Bookmark,
  TrendingUp,
  Utensils,
  Search,
  ChevronRight,
  Dumbbell,
  X,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { WORKOUT_TEMPLATES } from '../constants/workoutTemplates';
import { nutritionService } from '../services/nutritionService';
import { workoutService } from '../services/workoutService';
import { streakService } from '../services/streakService';
import { weightService } from '../services/weightService';
import { sleepService } from '../services/sleepService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { getPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';
import { useAuth } from '../contexts/AuthContext';
import AddMealModal from '../components/AddMealModal';
import WaterEntryModal from '../components/WaterEntryModal';
import WeighInModal from '../components/WeighInModal';
import SleepEntryModal from '../components/SleepEntryModal';
import RepertoireModal from '../components/RepertoireModal';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedWorkout, setSavedWorkout] = useState(null);

  // Today's workout
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [isRestDay, setIsRestDay] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Quick stats data
  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [proteinIntake, setProteinIntake] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0);
  const [supplementsTaken, setSupplementsTaken] = useState(0);
  const [supplementsTotal, setSupplementsTotal] = useState(0);

  // Streaks
  const [currentStreak, setCurrentStreak] = useState(0);

  // Modal states
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [lastNightSleepLogged, setLastNightSleepLogged] = useState(false);
  const [showRepertoireModal, setShowRepertoireModal] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [repertoireLoading, setRepertoireLoading] = useState(false);
  const [weightHistory, setWeightHistory] = useState([]);

  // Start workout modal
  const [showStartWorkoutModal, setShowStartWorkoutModal] = useState(false);
  const [workoutSearchQuery, setWorkoutSearchQuery] = useState('');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('scheduled'); // 'scheduled' | 'freeform' | 'browse'

  // Social stats
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const nutritionGoals = {
    calories: profile?.calorie_goal || 2200,
    protein: profile?.protein_goal || 150,
    water: profile?.water_goal || 2500,
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Check for saved workout and auto-resume
      const paused = getPausedWorkout();
      if (paused && paused.exercises?.length > 0) {
        // Auto-navigate to continue the workout
        // Don't clear here - ActiveWorkout will handle saving/clearing
        navigation.navigate('ActiveWorkout', {
          workoutName: paused.workoutName || 'Workout',
          workout: paused.workout,
          sessionId: paused.sessionId,
          resumedExercises: paused.exercises,
          resumedTime: paused.elapsedTime,
        });
        return;
      }
      setSavedWorkout(null);

      if (user?.id) {
        loadHomeData();
        // Refresh profile to get latest settings (like weight_unit)
        refreshProfile();
      }
    }, [user])
  );

  const loadHomeData = async () => {
    try {
      await Promise.all([
        loadTodayNutrition(),
        loadTodayWorkout(),
        loadStreaks(),
        loadSleepStatus(),
        loadWeightHistory(),
      ]);
    } catch (error) {
      console.log('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSleepStatus = async () => {
    try {
      const isLogged = await sleepService.isLastNightLogged(user.id);
      setLastNightSleepLogged(isLogged);
    } catch (error) {
      console.log('Error checking sleep status:', error);
    }
  };

  const loadWeightHistory = async () => {
    try {
      const { data } = await weightService.getRecentWeights(user.id, 30);
      // Sort by date descending (most recent first)
      const sorted = (data || []).sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
      setWeightHistory(sorted);
    } catch (error) {
      console.log('Error loading weight history:', error);
    }
  };

  const loadTodayNutrition = async () => {
    try {
      const { data: dailyData } = await nutritionService.getDailyNutrition(user.id);

      if (dailyData) {
        setCaloriesIntake(dailyData.total_calories || 0);
        setProteinIntake(dailyData.total_protein || 0);
        setWaterIntake(dailyData.water_intake || 0);
      }
    } catch (error) {
      console.log('Error loading nutrition:', error);
    }
  };

  const loadTodayWorkout = async () => {
    try {
      const { data: schedule } = await workoutService.getTodaySchedule(user.id);

      if (schedule) {
        if (schedule.is_rest_day) {
          setIsRestDay(true);
          setTodayWorkout(null);
        } else if (schedule.workout_templates) {
          // Database template found
          setIsRestDay(false);
          setTodayWorkout({
            id: schedule.workout_templates.id,
            name: schedule.workout_templates.name,
            focus: schedule.workout_templates.focus,
            scheduleId: schedule.id,
            isCompleted: schedule.is_completed,
            exercises: schedule.workout_templates.workout_template_exercises?.map(te => ({
              id: te.exercises?.id,
              name: te.exercises?.name,
              sets: te.sets || 3,
            })) || [],
          });
        } else if (schedule.template_id) {
          // Local template - look up from WORKOUT_TEMPLATES
          const localTemplate = WORKOUT_TEMPLATES[schedule.template_id];
          if (localTemplate) {
            setIsRestDay(false);
            setTodayWorkout({
              id: schedule.template_id,
              name: localTemplate.name,
              focus: localTemplate.focus,
              scheduleId: schedule.id,
              isCompleted: schedule.is_completed,
              exercises: localTemplate.exercises || [],
            });
          } else {
            setIsRestDay(false);
            setTodayWorkout(null);
          }
        } else {
          setIsRestDay(false);
          setTodayWorkout(null);
        }
      } else {
        // No workout scheduled - show empty state
        setIsRestDay(false);
        setTodayWorkout(null);
      }
    } catch (error) {
      console.log('Error loading workout:', error);
      setIsRestDay(false);
      setTodayWorkout(null);
    }
  };

  const loadStreaks = async () => {
    try {
      const { streak } = await streakService.calculateWorkoutStreak(user.id);
      setCurrentStreak(streak || 0);
    } catch (error) {
      console.log('Error loading streaks:', error);
    }
  };

  const loadRepertoire = async () => {
    setShowRepertoireModal(true);
    setRepertoireLoading(true);
    try {
      const { data } = await publishedWorkoutService.getSavedWorkoutsWithDetails(user.id);
      setSavedWorkouts(data || []);
    } catch (error) {
      console.log('Error loading repertoire:', error);
    } finally {
      setRepertoireLoading(false);
    }
  };

  const handleStartRepertoireWorkout = (workout) => {
    setShowRepertoireModal(false);

    // Parse exercises from the saved workout
    const exercises = workout.exercises || [];

    navigation.navigate('ActiveWorkout', {
      workoutName: workout.name,
      workout: {
        id: workout.id,
        name: workout.name,
        focus: workout.muscle_groups?.join(', ') || '',
        exercises: exercises.map(ex => ({
          id: ex.exercise_id || ex.id,
          name: ex.name,
          sets: ex.sets || 3,
          targetReps: ex.reps,
          suggestedWeight: ex.weight,
        })),
      },
      fromRepertoire: true,
      publishedWorkoutId: workout.id,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleAddMeal = async (meal) => {
    try {
      await nutritionService.logMeal(user.id, {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      });

      setCaloriesIntake(prev => prev + (meal.calories || 0));
      setProteinIntake(prev => prev + (meal.protein || 0));
      setShowMealModal(false);
    } catch (error) {
      console.log('Error adding meal:', error);
    }
  };

  const handleAddWater = async (amount) => {
    try {
      await nutritionService.logWater(user.id, amount);
      setWaterIntake(prev => prev + amount);
      setShowWaterModal(false);
    } catch (error) {
      console.log('Error adding water:', error);
    }
  };

  const handleSaveWeight = async (weight, unit, date) => {
    try {
      await weightService.logWeight(user.id, weight, unit, date);
      setShowWeighInModal(false);
      // Reload weight history to show the new entry
      await loadWeightHistory();
    } catch (error) {
      console.log('Error saving weight:', error);
    }
  };

  const handleSaveSleep = async (sleepData) => {
    try {
      await sleepService.logSleep(user.id, sleepData);
      setLastNightSleepLogged(true);
      setShowSleepModal(false);
    } catch (error) {
      console.log('Error saving sleep:', error);
    }
  };

  const startWorkout = async () => {
    if (!todayWorkout) {
      navigation.navigate('Workouts');
      return;
    }

    try {
      const { data: session } = await workoutService.startWorkout(
        user.id,
        todayWorkout.id,
        todayWorkout.scheduleId,
        todayWorkout.name
      );

      navigation.navigate('ActiveWorkout', {
        workoutName: todayWorkout.name,
        sessionId: session?.id,
        workout: {
          id: todayWorkout.id,
          name: todayWorkout.name,
          focus: todayWorkout.focus,
          exercises: todayWorkout.exercises,
        },
      });
    } catch (error) {
      console.log('Error starting workout:', error);
      navigation.navigate('ActiveWorkout', {
        workoutName: todayWorkout.name,
        workout: {
          id: todayWorkout.id,
          name: todayWorkout.name,
          focus: todayWorkout.focus,
          exercises: todayWorkout.exercises,
        },
      });
    }
  };

  const openStartWorkoutModal = () => {
    // Set default selection based on whether there's a scheduled workout
    setSelectedWorkoutType(todayWorkout ? 'scheduled' : 'freeform');
    setWorkoutSearchQuery('');
    setShowStartWorkoutModal(true);
  };

  const startFreeformWorkout = () => {
    setShowStartWorkoutModal(false);
    navigation.navigate('ActiveWorkout', {
      workoutName: 'Workout',
      workout: null, // No template - user adds exercises as they go
    });
  };

  const resumeSavedWorkout = () => {
    if (savedWorkout) {
      navigation.navigate('ActiveWorkout', {
        workoutName: savedWorkout.workoutName || 'Workout',
        workout: savedWorkout.workout,
        sessionId: savedWorkout.sessionId,
        resumedExercises: savedWorkout.exercises,
        resumedTime: savedWorkout.elapsedTime,
      });
      clearPausedWorkout();
      setSavedWorkout(null);
    }
  };

  const dismissSavedWorkout = () => {
    clearPausedWorkout();
    setSavedWorkout(null);
  };

  const startScheduledWorkout = () => {
    setShowStartWorkoutModal(false);
    startWorkout();
  };

  const startFromTemplate = (templateId) => {
    setShowStartWorkoutModal(false);
    const template = WORKOUT_TEMPLATES[templateId];
    if (template) {
      navigation.navigate('ActiveWorkout', {
        workoutName: template.name,
        workout: {
          id: templateId,
          name: template.name,
          focus: template.focus,
          exercises: template.exercises,
        },
        templateId: templateId,
      });
    }
  };

  // Filter templates based on search
  const filteredTemplates = Object.entries(WORKOUT_TEMPLATES).filter(([id, template]) => {
    if (!workoutSearchQuery) return true;
    const query = workoutSearchQuery.toLowerCase();
    return (
      template.name?.toLowerCase().includes(query) ||
      template.focus?.toLowerCase().includes(query) ||
      template.exercises?.some(e => e.name?.toLowerCase().includes(query))
    );
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick stats for the compact circles
  const quickStats = [
    {
      id: 'calories',
      label: 'Cal',
      current: caloriesIntake,
      target: nutritionGoals.calories,
      color: COLORS.accent,
    },
    {
      id: 'protein',
      label: 'Protein',
      current: proteinIntake,
      target: nutritionGoals.protein,
      color: COLORS.protein,
    },
    {
      id: 'water',
      label: 'Water',
      current: waterIntake,
      target: nutritionGoals.water,
      color: COLORS.water,
    },
    {
      id: 'supplements',
      label: 'Supps',
      current: supplementsTaken,
      target: Math.max(supplementsTotal, 1),
      displayValue: `${supplementsTaken}/${supplementsTotal}`,
      color: COLORS.supplements,
    },
  ];

  const handleStatTap = (statId) => {
    if (statId === 'calories' || statId === 'protein') {
      setShowMealModal(true);
    } else if (statId === 'water') {
      setShowWaterModal(true);
    } else if (statId === 'supplements') {
      navigation.navigate('Health');
    }
  };

  const renderProgressCircle = (stat) => {
    const progress = Math.min((stat.current || 0) / (stat.target || 1), 1);
    const isComplete = progress >= 1;
    const percentage = Math.round(progress * 100);
    const progressColor = isComplete ? COLORS.success : stat.color;

    const completeVal = stat.id === 'water'
      ? `${(stat.current / 1000).toFixed(1)}L`
      : stat.displayValue || stat.current;

    // Calculate degrees for conic gradient (starts from top, so -90deg offset)
    const progressDegrees = progress * 360;

    // Web uses conic-gradient for smooth circular progress
    const webProgressStyle = Platform.OS === 'web' ? {
      background: `conic-gradient(from -90deg, ${progressColor} ${progressDegrees}deg, ${COLORS.surfaceLight} ${progressDegrees}deg)`,
    } : {};

    return (
      <TouchableOpacity
        key={stat.id}
        style={styles.statItem}
        onPress={() => handleStatTap(stat.id)}
      >
        <View style={[styles.progressRing, webProgressStyle]}>
          <View style={styles.progressRingInner}>
            {isComplete ? (
              <>
                <Check size={14} color={COLORS.success} strokeWidth={3} />
                <Text style={[styles.circleValue, { color: COLORS.success, fontSize: 9 }]}>
                  {completeVal}
                </Text>
              </>
            ) : (
              <Text style={[styles.circleValue, { color: stat.color }]}>
                {percentage}%
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.statLabel, { color: isComplete ? COLORS.success : COLORS.textMuted }]}>
          {stat.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTodayWorkout = () => {
    if (isPaused) {
      return (
        <View style={[styles.workoutCard, { borderLeftColor: COLORS.warning }]}>
          <View style={styles.workoutRow}>
            <View style={[styles.workoutIconBox, { backgroundColor: COLORS.warning + '20' }]}>
              <Pause size={28} color={COLORS.warning} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutBadge, { color: COLORS.warning }]}>PAUSED</Text>
              <Text style={styles.workoutName}>Enjoying your break</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.workoutButton, { backgroundColor: COLORS.warning }]}
            onPress={() => setIsPaused(false)}
          >
            <Text style={[styles.workoutButtonText, { color: COLORS.background }]}>Resume Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (todayWorkout?.isCompleted) {
      return (
        <View style={[styles.workoutCard, { borderLeftColor: COLORS.success }]}>
          <View style={styles.workoutRow}>
            <View style={[styles.workoutIconBox, { backgroundColor: COLORS.success + '20' }]}>
              <Check size={28} color={COLORS.success} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutBadge, { color: COLORS.success }]}>COMPLETED ✓</Text>
              <Text style={styles.workoutName}>{todayWorkout?.name || 'Workout'}</Text>
              <Text style={styles.workoutFocus}>Great work today! 💪</Text>
            </View>
          </View>
        </View>
      );
    }

    if (isRestDay) {
      return (
        <View style={[styles.workoutCard, { borderLeftColor: COLORS.sleep }]}>
          <View style={styles.workoutRow}>
            <View style={[styles.workoutIconBox, { backgroundColor: COLORS.sleep + '20' }]}>
              <Moon size={28} color={COLORS.sleep} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutBadge, { color: COLORS.sleep }]}>REST DAY 😴</Text>
              <Text style={styles.workoutName}>Recovery Time</Text>
              <Text style={styles.workoutFocus}>Your muscles grow while you rest</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.workoutButton, { backgroundColor: COLORS.primary }]}
            onPress={openStartWorkoutModal}
          >
            <Play size={18} color={COLORS.text} />
            <Text style={styles.workoutButtonText}>Start Workout Anyway</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!todayWorkout) {
      return (
        <View style={[styles.workoutCard, { borderLeftColor: COLORS.primary }]}>
          <View style={styles.workoutRow}>
            <View style={[styles.workoutIconBox, { backgroundColor: COLORS.primary + '20' }]}>
              <Dumbbell size={28} color={COLORS.primary} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutBadge, { color: COLORS.textMuted }]}>NO SCHEDULED WORKOUT</Text>
              <Text style={styles.workoutName}>Ready to train?</Text>
              <Text style={styles.workoutFocus}>Start blank or pick a template</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.workoutButton, { backgroundColor: COLORS.primary }]}
            onPress={openStartWorkoutModal}
          >
            <Play size={18} color={COLORS.text} />
            <Text style={styles.workoutButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.workoutCard, { borderLeftColor: COLORS.primary }]}>
        <View style={styles.workoutHeader}>
          <View style={styles.todayBadgeContainer}>
            <Text style={styles.todayBadgeText}>TODAY</Text>
          </View>
          <Text style={styles.workoutName}>{todayWorkout.name}</Text>
          <Text style={styles.workoutFocus}>{todayWorkout.focus}</Text>
        </View>
        <TouchableOpacity
          style={[styles.workoutButton, { backgroundColor: COLORS.primary }]}
          onPress={openStartWorkoutModal}
        >
          <Play size={18} color={COLORS.text} />
          <Text style={styles.workoutButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* User Header with Stats */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.avatarText}>
                {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{profile?.username || 'username'}</Text>
              {profile?.bio && (
                <Text style={styles.userBio} numberOfLines={1}>{profile.bio}</Text>
              )}
              <View style={styles.followStats}>
                <TouchableOpacity onPress={() => navigation.navigate('Community')}>
                  <Text style={styles.followText}>
                    <Text style={styles.followCount}>{followersCount}</Text> followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Community')}>
                  <Text style={styles.followText}>
                    <Text style={styles.followCount}>{followingCount}</Text> following
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Workout Banner */}
        {savedWorkout && savedWorkout.exercises?.length > 0 && (
          <View style={styles.savedWorkoutBanner}>
            <View style={styles.savedWorkoutInfo}>
              <View style={styles.savedWorkoutIcon}>
                <Pause size={20} color={COLORS.warning} />
              </View>
              <View style={styles.savedWorkoutText}>
                <Text style={styles.savedWorkoutTitle}>Workout in Progress</Text>
                <Text style={styles.savedWorkoutSubtitle}>
                  {savedWorkout.workoutName || 'Workout'} • {savedWorkout.exercises?.length || 0} exercises
                </Text>
              </View>
            </View>
            <View style={styles.savedWorkoutButtons}>
              <TouchableOpacity
                style={styles.savedWorkoutDismiss}
                onPress={dismissSavedWorkout}
                onClick={dismissSavedWorkout}
              >
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.savedWorkoutResume}
                onPress={resumeSavedWorkout}
                onClick={resumeSavedWorkout}
              >
                <Play size={16} color={COLORS.text} />
                <Text style={styles.savedWorkoutResumeText}>Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Today's Workout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
          {renderTodayWorkout()}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S PROGRESS</Text>
          <View style={styles.statsContainer}>
            {quickStats.map(renderProgressCircle)}
          </View>
        </View>

        {/* Log Food Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOG FOOD</Text>
          <View style={styles.logFoodRow}>
            {/* Add Meal Card */}
            <TouchableOpacity
              style={styles.addMealCard}
              onPress={() => setShowMealModal(true)}
            >
              <View style={styles.mealIconBox}>
                <Utensils size={24} color={COLORS.primary} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>Add Meal</Text>
                <Text style={styles.mealSubtitle}>Log with macros</Text>
              </View>
            </TouchableOpacity>

            {/* Quick Water Card */}
            <View style={styles.quickWaterCard}>
              <View style={styles.waterHeader}>
                <Droplets size={18} color={COLORS.water} />
                <Text style={styles.waterLabel}>Quick Water</Text>
                <View style={styles.waterTotalBadge}>
                  <Text style={styles.waterTotalText}>{(waterIntake / 1000).toFixed(1)}L</Text>
                </View>
              </View>
              <View style={styles.waterButtons}>
                <TouchableOpacity
                  style={styles.waterQuickBtn}
                  onPress={() => handleAddWater(250)}
                >
                  <Text style={styles.waterQuickBtnText}>250ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waterQuickBtn}
                  onPress={() => handleAddWater(500)}
                >
                  <Text style={styles.waterQuickBtnText}>500ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waterAddBtn}
                  onPress={() => setShowWaterModal(true)}
                >
                  <Plus size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* My Rep-Ertoire Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY REP-ERTOIRE</Text>
          <TouchableOpacity style={styles.repertoireCard} onPress={loadRepertoire}>
            <View style={styles.repertoireIconBox}>
              <Bookmark size={24} color={COLORS.warning} />
            </View>
            <View style={styles.repertoireInfo}>
              <Text style={styles.repertoireTitle}>My Saved Workouts</Text>
              <Text style={styles.repertoireSubtitle}>Tap to view your Rep-Ertoire</Text>
            </View>
            <View style={styles.discoverButton}>
              <Text style={styles.discoverButtonText}>Open</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trending Workouts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRENDING WORKOUTS</Text>
          <View style={styles.trendingCard}>
            <View style={styles.trendingIconBox}>
              <TrendingUp size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.trendingTitle}>No workouts currently trending</Text>
            <Text style={styles.trendingSubtitle}>Check back later or explore the community</Text>
            <TouchableOpacity
              style={styles.exploreCommunityButton}
              onPress={() => navigation.navigate('Community')}
            >
              <Text style={styles.exploreCommunityText}>Explore Community</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WEIGHT TRACKING</Text>
          <TouchableOpacity
            style={styles.weighInButton}
            onPress={() => setShowWeighInModal(true)}
          >
            <Plus size={20} color={COLORS.text} />
            <Text style={styles.weighInButtonText}>Log Weigh-In</Text>
          </TouchableOpacity>

          {weightHistory.length > 0 && (
            <View style={styles.weightHistoryContainer}>
              <ScrollView
                style={styles.weightHistoryScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {weightHistory.map((entry, index) => {
                  const date = new Date(entry.log_date + 'T00:00:00');
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const weight = entry.weight?.toFixed(1) || '0';
                  const unit = profile?.weight_unit || 'kg';
                  const displayWeight = unit === 'lbs' ? (entry.weight * 2.205).toFixed(1) : weight;

                  return (
                    <View key={entry.id || index} style={styles.weightHistoryItem}>
                      <Text style={styles.weightHistoryDate}>
                        {dayName} {monthDay}
                      </Text>
                      <Text style={styles.weightHistoryValue}>
                        {displayWeight} {unit}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Sleep Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SLEEP TRACKING</Text>
          {lastNightSleepLogged ? (
            <View style={styles.sleepLoggedButton}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.sleepLoggedButtonText}>Sleep Logged</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.sleepButton}
              onPress={() => setShowSleepModal(true)}
            >
              <Moon size={20} color={COLORS.text} />
              <Text style={styles.sleepButtonText}>Log Last Night's Sleep</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <AddMealModal
        visible={showMealModal}
        onClose={() => setShowMealModal(false)}
        onAdd={handleAddMeal}
      />

      <WaterEntryModal
        visible={showWaterModal}
        onClose={() => setShowWaterModal(false)}
        onAdd={handleAddWater}
        currentIntake={waterIntake}
      />

      <WeighInModal
        visible={showWeighInModal}
        onClose={() => setShowWeighInModal(false)}
        onSave={handleSaveWeight}
        unit={profile?.weight_unit || 'kg'}
        currentWeight={profile?.current_weight || profile?.weight || 0}
      />

      <SleepEntryModal
        visible={showSleepModal}
        onClose={() => setShowSleepModal(false)}
        onSave={handleSaveSleep}
      />

      <RepertoireModal
        visible={showRepertoireModal}
        onClose={() => setShowRepertoireModal(false)}
        savedWorkouts={savedWorkouts}
        loading={repertoireLoading}
        onStartWorkout={handleStartRepertoireWorkout}
      />

      {/* Start Workout Modal */}
      <Modal
        visible={showStartWorkoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartWorkoutModal(false)}
      >
        <View style={styles.startModalOverlay}>
          <View style={styles.startModalContainer}>
            <View style={styles.startModalHeader}>
              <Text style={styles.startModalTitle}>Start Your Workout</Text>
              <TouchableOpacity onPress={() => setShowStartWorkoutModal(false)} style={styles.startModalCloseBtn}>
                <X size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Workout Type Toggle */}
            <View style={styles.workoutTypeToggle}>
              {todayWorkout && (
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    selectedWorkoutType === 'scheduled' && styles.toggleButtonActive,
                    selectedWorkoutType === 'scheduled' && { backgroundColor: COLORS.primary }
                  ]}
                  onPress={() => setSelectedWorkoutType('scheduled')}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    selectedWorkoutType === 'scheduled' && styles.toggleButtonTextActive
                  ]}>Scheduled</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedWorkoutType === 'freeform' && styles.toggleButtonActive,
                  selectedWorkoutType === 'freeform' && { backgroundColor: COLORS.accent }
                ]}
                onPress={() => setSelectedWorkoutType('freeform')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedWorkoutType === 'freeform' && styles.toggleButtonTextActive
                ]}>Blank</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedWorkoutType === 'browse' && styles.toggleButtonActive,
                  selectedWorkoutType === 'browse' && { backgroundColor: COLORS.warning }
                ]}
                onPress={() => setSelectedWorkoutType('browse')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedWorkoutType === 'browse' && styles.toggleButtonTextActive
                ]}>Browse</Text>
              </TouchableOpacity>
            </View>

            {/* Type Description */}
            <View style={styles.typeDescription}>
              {selectedWorkoutType === 'scheduled' && todayWorkout && (
                <>
                  <View style={styles.typeDescHeader}>
                    <Calendar size={20} color={COLORS.primary} />
                    <Text style={styles.typeDescTitle}>{todayWorkout.name}</Text>
                  </View>
                  <Text style={styles.typeDescText}>
                    Pre-loaded with today's exercises from your program.
                  </Text>
                  <View style={styles.typeDescMeta}>
                    <Text style={styles.typeDescMetaText}>{todayWorkout.exercises?.length || 0} exercises</Text>
                    <Text style={styles.typeDescMetaDot}>•</Text>
                    <Text style={styles.typeDescMetaText}>{todayWorkout.focus || 'Full Body'}</Text>
                  </View>
                </>
              )}
              {selectedWorkoutType === 'freeform' && (
                <>
                  <View style={styles.typeDescHeader}>
                    <Dumbbell size={20} color={COLORS.accent} />
                    <Text style={styles.typeDescTitle}>Blank Workout</Text>
                  </View>
                  <Text style={styles.typeDescText}>
                    Start empty and add exercises as you go. Complete flexibility to train however you want today.
                  </Text>
                </>
              )}
              {selectedWorkoutType === 'browse' && (
                <>
                  <View style={styles.typeDescHeader}>
                    <Search size={20} color={COLORS.warning} />
                    <Text style={styles.typeDescTitle}>Browse Templates</Text>
                  </View>
                  <Text style={styles.typeDescText}>
                    Choose from pre-built workout templates for different muscle groups and goals.
                  </Text>
                </>
              )}
            </View>

            {/* Browse Templates Section - only show when browse is selected */}
            {selectedWorkoutType === 'browse' && (
              <>
                <View style={styles.searchSection}>
                  <View style={styles.searchInputContainer}>
                    <Search size={18} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search workouts..."
                      placeholderTextColor={COLORS.textMuted}
                      value={workoutSearchQuery}
                      onChangeText={setWorkoutSearchQuery}
                    />
                    {workoutSearchQuery ? (
                      <TouchableOpacity onPress={() => setWorkoutSearchQuery('')}>
                        <X size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Template List */}
                <ScrollView
                  style={styles.templateList}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {filteredTemplates.map(([id, template]) => (
                    <TouchableOpacity
                      key={id}
                      style={styles.templateItem}
                      onPress={() => startFromTemplate(id)}
                    >
                      <View style={styles.templateIcon}>
                        <Dumbbell size={18} color={COLORS.primary} />
                      </View>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateFocus}>{template.focus}</Text>
                        <Text style={styles.templateExercises}>{template.exercises?.length || 0} exercises</Text>
                      </View>
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>No templates found</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}

            {/* Start Button - show for scheduled and freeform */}
            {selectedWorkoutType !== 'browse' && (
              <View style={styles.startButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.startWorkoutButton,
                    { backgroundColor: selectedWorkoutType === 'scheduled' ? COLORS.primary : COLORS.accent }
                  ]}
                  onPress={() => {
                    if (selectedWorkoutType === 'scheduled') {
                      startScheduledWorkout();
                    } else {
                      startFreeformWorkout();
                    }
                  }}
                >
                  <Play size={20} color={COLORS.text} />
                  <Text style={styles.startWorkoutButtonText}>
                    {selectedWorkoutType === 'scheduled' ? 'Start Scheduled Workout' : 'Start Workout'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  // Saved Workout Banner
  savedWorkoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warning + '20',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  savedWorkoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  savedWorkoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.warning + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedWorkoutText: {
    flex: 1,
  },
  savedWorkoutTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  savedWorkoutSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  savedWorkoutButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedWorkoutDismiss: {
    padding: 8,
  },
  savedWorkoutResume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  savedWorkoutResumeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userBio: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  followStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  followText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  followCount: {
    color: COLORS.text,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  workoutIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutBadge: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  todayBadgeContainer: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  todayBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  workoutFocus: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  workoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  workoutButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  progressRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressRingInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
  },
  // Log Food Section
  logFoodRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addMealCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  mealSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  quickWaterCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  waterLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  waterTotalBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  waterTotalText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  waterQuickBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  waterQuickBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  waterAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // My Rep-Ertoire Section
  repertoireCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repertoireIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repertoireInfo: {
    flex: 1,
  },
  repertoireTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  repertoireSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  discoverButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  discoverButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Trending Workouts Section
  trendingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  trendingIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendingTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  exploreCommunityButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreCommunityText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },

  // Weight Tracking Section
  weighInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weighInButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  weightHistoryContainer: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    maxHeight: 200,
  },
  weightHistoryScroll: {
    padding: 12,
  },
  weightHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weightHistoryDate: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  weightHistoryValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sleepButton: {
    backgroundColor: COLORS.sleep || '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sleepButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sleepLoggedButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sleepLoggedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Start Workout Modal Styles
  startModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  startModalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  startModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  startModalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  startModalCloseBtn: {
    padding: 4,
  },
  workoutTypeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: COLORS.text,
  },
  typeDescription: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
  },
  typeDescHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  typeDescTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  typeDescText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  typeDescMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  typeDescMetaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  typeDescMetaDot: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  startButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startWorkoutButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    padding: 0,
  },
  templateList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  templateFocus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  templateExercises: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

export default HomeScreen;
