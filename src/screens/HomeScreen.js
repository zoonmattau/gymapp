import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
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
  TrendingDown,
  Minus,
  Utensils,
  Search,
  ChevronRight,
  Dumbbell,
  X,
  Pencil,
} from 'lucide-react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { useColors } from '../contexts/ThemeContext';
import { WORKOUT_TEMPLATES } from '../constants/workoutTemplates';
import { EXERCISES } from '../constants/exercises';
import { supabase } from '../lib/supabase';
import { nutritionService } from '../services/nutritionService';
import { workoutService } from '../services/workoutService';
import { streakService } from '../services/streakService';
import { weightService } from '../services/weightService';
import { sleepService } from '../services/sleepService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { socialService } from '../services/socialService';
import { competitionService } from '../services/competitionService';
import { profileService } from '../services/profileService';
import { getPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';
import { getCustomTemplates } from '../utils/customTemplateStore';
import { useAuth } from '../contexts/AuthContext';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import AddMealModal from '../components/AddMealModal';
import WaterEntryModal from '../components/WaterEntryModal';
import WeighInModal from '../components/WeighInModal';
import SleepEntryModal from '../components/SleepEntryModal';
import RepertoireModal from '../components/RepertoireModal';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Muscle group display configuration
const MUSCLE_DISPLAY_GROUPS = [
  { key: 'chest', label: 'Chest', defaultTarget: 16, color: '#EF4444', sourceGroups: ['Chest'] },
  { key: 'back', label: 'Back', defaultTarget: 16, color: '#3B82F6', sourceGroups: ['Back', 'Traps'] },
  { key: 'shoulders', label: 'Shoulders', defaultTarget: 14, color: '#F59E0B', sourceGroups: ['Shoulders'] },
  { key: 'legs', label: 'Legs', defaultTarget: 16, color: '#10B981', sourceGroups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { key: 'arms', label: 'Arms', defaultTarget: 14, color: '#8B5CF6', sourceGroups: ['Biceps', 'Triceps', 'Forearms'] },
  { key: 'core', label: 'Core', defaultTarget: 10, color: '#EC4899', sourceGroups: ['Core', 'Full Body'] },
];

const exerciseToGroupMap = {};
EXERCISES.forEach(ex => {
  const group = MUSCLE_DISPLAY_GROUPS.find(g => g.sourceGroups.includes(ex.muscleGroup));
  if (group) exerciseToGroupMap[ex.name] = group.key;
});

const HomeScreen = () => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();
  const { isActive: bannerActive } = useActiveWorkout();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedWorkout, setSavedWorkout] = useState(null);
  const [checkingForSavedWorkout, setCheckingForSavedWorkout] = useState(Platform.OS === 'web');

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
  const [sleepHistory, setSleepHistory] = useState([]);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [selectedWeightPoint, setSelectedWeightPoint] = useState(null);
  const [selectedSleepPoint, setSelectedSleepPoint] = useState(null);
  const [waterEntries, setWaterEntries] = useState([]);

  // Start workout modal
  const [showStartWorkoutModal, setShowStartWorkoutModal] = useState(false);
  const [workoutSearchQuery, setWorkoutSearchQuery] = useState('');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('scheduled'); // 'scheduled' | 'freeform' | 'browse'
  const [customTemplates, setCustomTemplates] = useState([]);

  // Social stats
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialModalTab, setSocialModalTab] = useState('followers'); // 'followers' | 'following'
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Active challenges
  const [activeChallenges, setActiveChallenges] = useState([]);

  // Notifications
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Weekly muscle sets tracking
  const [weeklyMuscleSets, setWeeklyMuscleSets] = useState({});
  const [weeklyMuscleVolume, setWeeklyMuscleVolume] = useState({});
  const [muscleViewMode, setMuscleViewMode] = useState('sets'); // 'sets' | 'volume'
  const [userBodyweight, setUserBodyweight] = useState(70); // Default 70kg
  const [muscleTargets, setMuscleTargets] = useState(() => {
    const defaults = {};
    MUSCLE_DISPLAY_GROUPS.forEach(g => { defaults[g.key] = g.defaultTarget; });
    return defaults;
  });
  const [showMuscleTargetModal, setShowMuscleTargetModal] = useState(false);
  const [tempTargets, setTempTargets] = useState({});

  // Load saved muscle targets
  useEffect(() => {
    try {
      if (Platform.OS === 'web') {
        const saved = localStorage.getItem('uprep_muscle_targets');
        if (saved) setMuscleTargets(JSON.parse(saved));
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Fetch user's bodyweight for volume calculations
  useEffect(() => {
    const fetchBodyweight = async () => {
      if (!user?.id) return;
      const { data } = await profileService.getLatestWeight(user.id);
      if (data?.weight) setUserBodyweight(data.weight);
    };
    fetchBodyweight();
  }, [user?.id]);

  const nutritionGoals = {
    calories: profile?.calorie_goal || 2200,
    protein: profile?.protein_goal || 150,
    water: profile?.water_goal || 3500,
  };

  // Check for saved workout on initial mount (runs once)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const paused = getPausedWorkout();
      console.log('HomeScreen MOUNT: Checking for saved workout:', paused ? `Found ${paused.exercises?.length} exercises` : 'None');

      if (paused && paused.exercises?.length > 0) {
        // Set saved workout state to show resume option
        setSavedWorkout(paused);
      }
      // Show the home screen
      setCheckingForSavedWorkout(false);
    }
  }, []); // Empty deps - only runs once on mount

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset checking state when returning to this screen
      setCheckingForSavedWorkout(false);

      // Check for saved workout
      if (Platform.OS === 'web') {
        const paused = getPausedWorkout();
        if (paused && paused.exercises?.length > 0) {
          setSavedWorkout(paused);
        } else {
          setSavedWorkout(null);
        }
      }

      // Load data when user is available
      if (user?.id) {
        loadHomeData();
        // Refresh profile to get latest settings (like weight_unit)
        refreshProfile();
        getCustomTemplates(user.id).then(setCustomTemplates);
      }
    }, [user])
  );

  const loadHomeData = async () => {
    console.log('loadHomeData starting...');
    try {
      // Run all in parallel but don't let one failure block others
      await Promise.allSettled([
        loadTodayNutrition(),
        loadTodayWorkout(),
        loadStreaks(),
        loadSleepStatus(),
        loadWeightHistory(),
        loadSleepHistory(),
        loadSocialStats(),
        loadWeeklyMuscleSets(),
        loadActiveChallenges(),
        loadWaterEntries(),
        loadSupplements(),
        loadNotifications(),
      ]);
      console.log('loadHomeData completed');
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

  const loadSleepHistory = async () => {
    try {
      const { data } = await sleepService.getRecentSleep(user.id, 14);
      // Sort by date descending (most recent first)
      const sorted = (data || []).sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
      setSleepHistory(sorted);

      // Load sleep goal
      const { data: goals } = await sleepService.getSleepGoals(user.id);
      if (goals?.target_hours) {
        setSleepGoal(goals.target_hours);
      }
    } catch (error) {
      console.log('Error loading sleep history:', error);
    }
  };

  const loadSocialStats = async () => {
    try {
      const [followersResult, followingResult] = await Promise.all([
        socialService.getFollowers(user.id),
        socialService.getFollowing(user.id),
      ]);

      setFollowersCount(followersResult.data?.length || 0);
      setFollowingCount(followingResult.data?.length || 0);
    } catch (error) {
      console.log('Error loading social stats:', error);
    }
  };

  const loadActiveChallenges = async () => {
    try {
      const { data } = await competitionService.getActiveChallenges(user.id);
      setActiveChallenges(data || []);
    } catch (error) {
      console.log('Error loading challenges:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    setNotificationsLoading(true);
    try {
      // Get pending friend requests
      const { data: requests } = await supabase
        .from('follows')
        .select('id, follower_id, created_at, profiles:follower_id(id, first_name, last_name, username, avatar_url)')
        .eq('following_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const notifs = (requests || []).map(req => ({
        id: req.id,
        type: 'friend_request',
        fromUser: req.profiles,
        createdAt: req.created_at,
      }));

      setNotifications(notifs);
    } catch (error) {
      console.log('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleAcceptRequest = async (notif) => {
    try {
      await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', notif.id);

      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (error) {
      console.log('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (notif) => {
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('id', notif.id);

      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (error) {
      console.log('Error declining request:', error);
    }
  };

  const openNotifications = () => {
    loadNotifications();
    setShowNotificationsModal(true);
  };

  const openSocialModal = async (tab) => {
    setSocialModalTab(tab);
    setShowSocialModal(true);

    // Load the lists
    try {
      const [followersResult, followingResult] = await Promise.all([
        socialService.getFollowersList(user.id),
        socialService.getFollowingList(user.id),
      ]);
      setFollowersList(followersResult.data || []);
      setFollowingList(followingResult.data || []);
    } catch (error) {
      console.log('Error loading social lists:', error);
    }
  };

  const [lastWeight, setLastWeight] = useState(0);

  const loadWeightHistory = async () => {
    try {
      const { data } = await weightService.getRecentWeights(user.id, 30);
      // Sort by date descending (most recent first)
      const sorted = (data || []).sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
      console.log('Weight history loaded:', sorted.length, 'entries');
      console.log('Latest entry full object:', JSON.stringify(sorted[0]));
      setWeightHistory(sorted);

      // Store the last weight in user's preferred unit
      if (sorted.length > 0 && sorted[0]?.weight) {
        const weightKg = sorted[0].weight;
        const userUnit = profile?.weight_unit || 'kg';
        const converted = userUnit === 'lbs'
          ? Math.round(weightKg * 2.205 * 10) / 10
          : Math.round(weightKg * 10) / 10;
        console.log('Setting lastWeight:', converted, userUnit);
        setLastWeight(converted);
      }
    } catch (error) {
      console.log('Error loading weight history:', error);
    }
  };

  // Compute the last recorded weight in user's preferred unit
  const getLastWeightInUserUnit = () => {
    if (weightHistory.length === 0) {
      console.log('getLastWeightInUserUnit: no weight history');
      return profile?.current_weight || profile?.weight || 0;
    }

    const latestEntry = weightHistory[0];
    console.log('getLastWeightInUserUnit: latest entry:', JSON.stringify(latestEntry));

    // The weight might be stored under different property names
    const weightKg = latestEntry?.weight ?? latestEntry?.value ?? 0;
    console.log('weightKg extracted:', weightKg);

    if (!weightKg || weightKg <= 0) return 0;

    const userUnit = profile?.weight_unit || 'kg';
    if (userUnit === 'lbs') {
      return Math.round(weightKg * 2.205 * 10) / 10;
    }
    return Math.round(weightKg * 10) / 10;
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

  const loadWaterEntries = async () => {
    try {
      const { data } = await nutritionService.getWaterLogs(user.id);
      if (data) {
        setWaterEntries(data.map(log => ({
          id: log.id,
          amount: log.amount_ml,
          logged_at: log.logged_at,
          log_date: log.log_date,
        })));
      }
    } catch (error) {
      console.log('Error loading water entries:', error);
    }
  };

  const loadSupplements = async () => {
    try {
      const { data } = await nutritionService.getSupplements(user.id);
      if (data) {
        const today = getLocalDateString();
        const { data: logs } = await nutritionService.getSupplementLogs(user.id, today);

        // Calculate total doses needed and taken
        const totalDoses = data.reduce((acc, s) => acc + (s.times_per_day || 1), 0);
        const takenDoses = data.reduce((acc, s) => {
          const takenCount = logs?.filter(l => l.supplement_id === s.id).length || 0;
          return acc + takenCount;
        }, 0);

        setSupplementsTotal(totalDoses);
        setSupplementsTaken(takenDoses);
      }
    } catch (error) {
      console.log('Error loading supplements:', error);
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

  const loadWeeklyMuscleSets = async () => {
    try {
      const today = new Date();
      const dow = today.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const { data: sessionsData } = await workoutService.getCompletedSessionsForDateRange(user.id, fmt(weekStart), fmt(weekEnd));

      const completedIds = (sessionsData || []).filter(s => s.ended_at).map(s => s.id);
      const counts = {};
      const volumes = {};
      MUSCLE_DISPLAY_GROUPS.forEach(g => {
        counts[g.key] = 0;
        volumes[g.key] = 0;
      });

      if (completedIds.length > 0) {
        const { data: setsData } = await supabase
          .from('workout_sets')
          .select('exercise_name, weight, reps')
          .in('session_id', completedIds)
          .eq('is_warmup', false);

        (setsData || []).forEach(s => {
          const groupKey = exerciseToGroupMap[s.exercise_name];
          if (groupKey) {
            counts[groupKey] += 1;
            // Use userBodyweight for bodyweight exercises (weight = 0)
            const weight = s.weight > 0 ? s.weight : userBodyweight;
            volumes[groupKey] += weight * (s.reps || 0);
          }
        });
      }
      setWeeklyMuscleSets(counts);
      setWeeklyMuscleVolume(volumes);
    } catch (error) {
      console.log('Error loading weekly muscle sets:', error);
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
      loadWaterEntries();
    } catch (error) {
      console.log('Error adding water:', error);
    }
  };

  const handleDeleteWater = async (entry) => {
    try {
      await nutritionService.deleteWaterLog(user.id, entry.id, entry.log_date);
      setWaterIntake(prev => prev - entry.amount);
      setWaterEntries(prev => prev.filter(e => e.id !== entry.id));
    } catch (error) {
      console.log('Error deleting water:', error);
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
      // Refresh sleep history to update graph immediately
      loadSleepHistory();
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

  const startFromCustomTemplate = (template) => {
    setShowStartWorkoutModal(false);
    navigation.navigate('ActiveWorkout', {
      workoutName: template.name,
      workout: template,
    });
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

  const filteredCustomTemplates = customTemplates.filter(template => {
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
      navigation.navigate('Health', { tab: 'supplements' });
    }
  };

  const renderProgressCircle = (stat) => {
    const progress = Math.min((stat.current || 0) / (stat.target || 1), 1);
    const isComplete = progress >= 1;
    const percentage = Math.round(progress * 100);
    const progressColor = isComplete ? COLORS.success : stat.color;

    let completeVal;
    if (stat.id === 'water') {
      completeVal = `${(stat.current / 1000).toFixed(1)}L`;
    } else if (stat.id === 'calories') {
      completeVal = stat.current >= 1000 ? `${(stat.current / 1000).toFixed(1)}k` : stat.current;
    } else {
      completeVal = stat.displayValue || `${stat.current}g`;
    }

    // SVG progress ring calculations
    const size = 52;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <TouchableOpacity
        key={stat.id}
        style={styles.statItem}
        onPress={() => handleStatTap(stat.id)}
      >
        <View style={styles.progressRingWrapper}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background ring (faint) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.surfaceLight}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress ring (fills in based on percentage) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={progressColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          {/* Inner content */}
          <View style={styles.progressRingInner}>
            {isComplete ? (
              <>
                <Check size={14} color={COLORS.success} strokeWidth={3} />
                <Text style={[styles.circleValue, { color: COLORS.success, fontSize: 9 }]} numberOfLines={1}>
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
    // Show resume workout card if there's a saved workout (hidden when banner is active)
    if (!bannerActive && savedWorkout && savedWorkout.exercises?.length > 0) {
      const exerciseCount = savedWorkout.exercises.length;
      const completedSets = savedWorkout.exercises.reduce(
        (acc, ex) => acc + (ex.sets?.filter(s => s.completed)?.length || 0), 0
      );
      const totalSets = savedWorkout.exercises.reduce(
        (acc, ex) => acc + (ex.sets?.length || 0), 0
      );

      return (
        <View style={styles.workoutCard}>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutBadge, { color: COLORS.primary }]}>WORKOUT IN PROGRESS</Text>
            <Text style={styles.workoutName}>{savedWorkout.workoutName || 'Workout'}</Text>
            <Text style={styles.workoutFocus}>
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} • {completedSets}/{totalSets} sets done
            </Text>
          </View>
          <View style={styles.savedWorkoutActions}>
            <TouchableOpacity
              style={[styles.workoutButton, { backgroundColor: COLORS.primary, flex: 1 }]}
              onPress={resumeSavedWorkout}
            >
              <Text style={styles.workoutButtonText}>Continue Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={dismissSavedWorkout}
            >
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (isPaused) {
      return (
        <View style={styles.workoutCard}>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutBadge, { color: COLORS.primary }]}>PAUSED</Text>
            <Text style={styles.workoutName}>Enjoying your break</Text>
          </View>
          <TouchableOpacity
            style={[styles.workoutButton, { backgroundColor: COLORS.primary }]}
            onPress={() => setIsPaused(false)}
          >
            <Text style={styles.workoutButtonText}>Resume Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (todayWorkout?.isCompleted) {
      return (
        <View style={styles.workoutCard}>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutBadge, { color: COLORS.success }]}>COMPLETED</Text>
            <Text style={styles.workoutName}>{todayWorkout?.name || 'Workout'}</Text>
            <Text style={styles.workoutFocus}>Great work today</Text>
          </View>
        </View>
      );
    }

    if (isRestDay) {
      return (
        <View style={styles.workoutCard}>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutBadge, { color: COLORS.sleep }]}>REST DAY</Text>
            <Text style={styles.workoutName}>Recovery Time</Text>
            <Text style={styles.workoutFocus}>Your muscles grow while you rest</Text>
          </View>
          <TouchableOpacity
            style={[styles.workoutButton, { backgroundColor: COLORS.primary }]}
            onPress={openStartWorkoutModal}
          >
            <Text style={styles.workoutButtonText}>Start Workout Anyway</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!todayWorkout) {
      return (
        <TouchableOpacity
          style={[styles.workoutCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}
          onPress={openStartWorkoutModal}
          activeOpacity={0.7}
        >
          <Text style={[styles.workoutButtonText, { color: COLORS.primary, fontSize: 16 }]}>Start Workout</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.workoutCard}>
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
          <Text style={styles.workoutButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading screen while checking for saved workout (prevents flash)
  if (checkingForSavedWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Empty view - will be brief, just prevents flash */}
        </View>
      </SafeAreaView>
    );
  }

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
        onScrollBeginDrag={() => {
          setSelectedWeightPoint(null);
          setSelectedSleepPoint(null);
        }}
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
              <Text style={styles.username}>@{profile?.username || user?.email?.split('@')[0] || 'user'}</Text>
              {profile?.bio && (
                <Text style={styles.userBio} numberOfLines={1}>{profile.bio}</Text>
              )}
              <View style={styles.followStats}>
                <TouchableOpacity onPress={() => openSocialModal('followers')}>
                  <Text style={styles.followText}>
                    <Text style={styles.followCount}>{followersCount}</Text> followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openSocialModal('following')}>
                  <Text style={styles.followText}>
                    <Text style={styles.followCount}>{followingCount}</Text> following
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openNotifications}
            >
              <Bell size={18} color={COLORS.textMuted} />
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Workout Banner — hidden when active workout banner is showing */}
        {!bannerActive && savedWorkout && savedWorkout.exercises?.length > 0 && (
          <View style={styles.savedWorkoutBanner}>
            <View style={styles.savedWorkoutInfo}>
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
              <Text style={styles.mealTitle}>Add Meal</Text>
              <Text style={styles.mealSubtitle}>Log with macros</Text>
            </TouchableOpacity>

            {/* Quick Water Card */}
            <View style={styles.quickWaterCard}>
              <Text style={[styles.waterLabel, { textAlign: 'center', marginBottom: 8 }]}>Quick Water</Text>
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
                  <Plus size={18} color={COLORS.textOnPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Sets/Volume by Muscle */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>WEEKLY PROGRESS</Text>
            <View style={styles.muscleToggleContainer}>
              <TouchableOpacity
                style={[styles.muscleToggleBtn, muscleViewMode === 'sets' && styles.muscleToggleBtnActive]}
                onPress={() => setMuscleViewMode('sets')}
              >
                <Text style={[styles.muscleToggleText, muscleViewMode === 'sets' && styles.muscleToggleTextActive]}>
                  Sets
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.muscleToggleBtn, muscleViewMode === 'volume' && styles.muscleToggleBtnActive]}
                onPress={() => setMuscleViewMode('volume')}
              >
                <Text style={[styles.muscleToggleText, muscleViewMode === 'volume' && styles.muscleToggleTextActive]}>
                  Volume
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.muscleCard}>
            {MUSCLE_DISPLAY_GROUPS.map(group => {
              const sets = weeklyMuscleSets[group.key] || 0;
              const volume = weeklyMuscleVolume[group.key] || 0;
              const value = muscleViewMode === 'sets' ? sets : volume;
              const maxValue = muscleViewMode === 'sets'
                ? Math.max(...Object.values(weeklyMuscleSets), 1)
                : Math.max(...Object.values(weeklyMuscleVolume), 1);
              const pct = maxValue > 0 ? value / maxValue : 0;

              return (
                <View key={group.key} style={styles.muscleRow}>
                  <Text style={styles.muscleLabel}>{group.label}</Text>
                  <View style={styles.muscleBarTrack}>
                    <View style={[styles.muscleBarFill, { width: `${pct * 100}%`, backgroundColor: group.color }]} />
                  </View>
                  <Text style={styles.muscleCount}>
                    {muscleViewMode === 'sets' ? sets : volume > 1000 ? `${(volume / 1000).toFixed(1)}k` : volume}
                  </Text>
                </View>
              );
            })}
            {(() => {
              const totalSets = Object.values(weeklyMuscleSets).reduce((a, b) => a + b, 0);
              const totalVolume = Object.values(weeklyMuscleVolume).reduce((a, b) => a + b, 0);
              return (
                <View style={styles.muscleTotalRow}>
                  <Text style={styles.muscleTotalLabel}>Total</Text>
                  <Text style={styles.muscleTotalCount}>
                    {muscleViewMode === 'sets'
                      ? `${totalSets} sets`
                      : totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k kg` : `${totalVolume} kg`}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR CHALLENGES</Text>
            {activeChallenges.slice(0, 2).map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeHomeCard}
                onPress={() => navigation.navigate('Community', { initialTab: 'community' })}
                activeOpacity={0.7}
              >
                <View style={styles.challengeHomeInfo}>
                  <Text style={styles.challengeHomeName}>{challenge.name}</Text>
                  <Text style={styles.challengeHomeGoal}>
                    {challenge.goal_type === 'streak' && `${challenge.goal_value} day streak`}
                    {challenge.goal_type === 'volume' && `Lift ${challenge.goal_value?.toLocaleString()} kg`}
                    {challenge.goal_type === 'prs' && `Set ${challenge.goal_value} PRs`}
                    {challenge.goal_type === 'workouts' && `Complete ${challenge.goal_value} workouts`}
                  </Text>
                </View>
                <View style={styles.challengeHomeProgress}>
                  <View style={styles.challengeHomeProgressBar}>
                    <View
                      style={[
                        styles.challengeHomeProgressFill,
                        { width: `${Math.min((challenge.user_progress || 0) / (challenge.goal_value || 1) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.challengeHomeProgressText}>
                    {challenge.user_progress || 0}/{challenge.goal_value || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Edit muscle targets modal */}
        <Modal
          visible={showMuscleTargetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMuscleTargetModal(false)}
        >
          <View style={styles.targetModalOverlay}>
            <View style={styles.targetModalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 }}>
                <Text style={styles.targetModalTitle}>Weekly Set Targets</Text>
                <TouchableOpacity onPress={() => setShowMuscleTargetModal(false)} style={{ padding: 4 }}>
                  <X size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.targetModalRow}>
                <Text style={[styles.targetModalRowLabel, { fontSize: 11, color: COLORS.textMuted }]}>Muscle</Text>
                <Text style={{ width: 70, textAlign: 'center', fontSize: 11, color: COLORS.textMuted, fontWeight: '600' }}>Target</Text>
                <Text style={{ width: 36, textAlign: 'center', fontSize: 11, color: COLORS.textMuted, fontWeight: '600' }}>Rec.</Text>
              </View>
              {MUSCLE_DISPLAY_GROUPS.map(group => (
                <View key={group.key} style={styles.targetModalRow}>
                  <Text style={styles.targetModalRowLabel}>{group.label}</Text>
                  <TextInput
                    style={styles.targetModalRowInput}
                    value={tempTargets[group.key] || ''}
                    onChangeText={(v) => setTempTargets(prev => ({ ...prev, [group.key]: v }))}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    placeholder={String(group.defaultTarget)}
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.targetModalRowRec}>{group.defaultTarget}</Text>
                </View>
              ))}
              <View style={styles.targetModalButtons}>
                <TouchableOpacity
                  style={styles.targetModalResetBtn}
                  onPress={() => {
                    const defaults = {};
                    MUSCLE_DISPLAY_GROUPS.forEach(g => { defaults[g.key] = String(g.defaultTarget); });
                    setTempTargets(defaults);
                  }}
                >
                  <Text style={styles.targetModalResetText}>Reset All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.targetModalSaveBtn}
                  onPress={() => {
                    const updated = {};
                    MUSCLE_DISPLAY_GROUPS.forEach(g => {
                      const val = parseInt(tempTargets[g.key]) || g.defaultTarget;
                      updated[g.key] = Math.max(1, val);
                    });
                    setMuscleTargets(updated);
                    try {
                      if (Platform.OS === 'web') {
                        localStorage.setItem('uprep_muscle_targets', JSON.stringify(updated));
                      }
                    } catch (e) { /* ignore */ }
                    setShowMuscleTargetModal(false);
                  }}
                >
                  <Text style={styles.targetModalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* My Rep-Ertoire Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY REP-ERTOIRE</Text>
          <TouchableOpacity style={styles.repertoireCard} onPress={loadRepertoire}>
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
          {(() => {
            const currentWeight = weightHistory[0]?.weight || 0;
            const targetWeight = profile?.target_weight || 0;
            const weightGoalReached = targetWeight > 0 && currentWeight > 0 && Math.abs(currentWeight - targetWeight) < 0.5;
            return (
          <View style={[styles.weightCard, weightGoalReached && styles.weightCardGoalReached]}>
            {weightHistory.length > 0 ? (
              <>
                <View style={styles.weightCurrentRow}>
                  <View style={styles.weightCurrentInfo}>
                    <Text style={styles.weightCurrentLabel}>Current</Text>
                    <View style={styles.weightNumbersRow}>
                      <Text style={styles.weightCurrentValue}>
                        {(() => {
                          const unit = profile?.weight_unit || 'kg';
                          const w = weightHistory[0]?.weight || 0;
                          return unit === 'lbs' ? (w * 2.205).toFixed(1) : w.toFixed(1);
                        })()} {profile?.weight_unit || 'kg'}
                      </Text>
                    </View>
                    {weightHistory.length > 1 && (
                      <Text style={styles.weightChangeText}>
                        {(() => {
                          const unit = profile?.weight_unit || 'kg';
                          const current = weightHistory[0]?.weight || 0;
                          const start = weightHistory[weightHistory.length - 1]?.weight || 0;
                          const change = current - start;
                          const displayChange = unit === 'lbs' ? (change * 2.205).toFixed(1) : change.toFixed(1);
                          const sign = change > 0 ? '+' : '';
                          return `${sign}${displayChange} ${unit} total`;
                        })()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.weightGoalInfo}>
                    <Text style={styles.weightGoalLabel}>Goal</Text>
                    <Text style={styles.weightGoalValue}>
                      {profile?.target_weight ? (
                        (() => {
                          const unit = profile?.weight_unit || 'kg';
                          const g = profile.target_weight;
                          return `${unit === 'lbs' ? (g * 2.205).toFixed(0) : g.toFixed(0)} ${unit}`;
                        })()
                      ) : 'Not set'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.weighInBtn}
                    onPress={() => setShowWeighInModal(true)}
                  >
                    <Plus size={18} color={COLORS.textOnPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Split Layout: Graph + History */}
                {weightHistory.length >= 2 && (
                  <View style={styles.weightSplitContainer}>
                    {/* Mini Chart - Left Half */}
                    <View style={styles.weightChartHalf}>
                      <View style={styles.chartWithLabel}>
                        {(() => {
                          const unit = profile?.weight_unit || 'kg';
                          const reversedHistory = weightHistory.slice(0, 7).reverse();
                          const weightData = reversedHistory.map(e =>
                            unit === 'lbs' ? e.weight * 2.205 : e.weight
                          );
                          const goalWeight = profile?.goal_weight
                            ? (unit === 'lbs' ? profile.goal_weight * 2.205 : profile.goal_weight)
                            : null;
                          const chartWidth = Dimensions.get('window').width * 0.8;

                          return (
                            <LineChart
                              data={{
                                labels: [],
                                datasets: [
                                  {
                                    data: weightData,
                                    color: () => COLORS.primary,
                                    strokeWidth: 2,
                                  },
                                  ...(goalWeight ? [{
                                    data: Array(weightData.length).fill(goalWeight),
                                    color: () => COLORS.textMuted,
                                    strokeWidth: 1,
                                    withDots: false,
                                  }] : []),
                                ],
                              }}
                              width={chartWidth}
                              height={200}
                              withVerticalLabels={false}
                              withHorizontalLabels={false}
                              withInnerLines={false}
                              withOuterLines={false}
                              withDots={true}
                              fromZero={false}
                              chartConfig={{
                                backgroundColor: 'transparent',
                                backgroundGradientFrom: COLORS.surface,
                                backgroundGradientTo: COLORS.surface,
                                decimalPlaces: 1,
                                color: () => COLORS.primary,
                                labelColor: () => COLORS.textMuted,
                                paddingRight: 0,
                                paddingLeft: 0,
                                propsForDots: {
                                  r: '4',
                                  strokeWidth: '0',
                                  fill: COLORS.primary,
                                },
                                propsForLabels: {
                                  fontSize: 11,
                                  fontWeight: '500',
                                },
                              }}
                              bezier
                              style={{ borderRadius: 8, marginLeft: -60, marginRight: -20 }}
                              onDataPointClick={({ index }) => {
                                setSelectedWeightPoint(selectedWeightPoint === index ? null : index);
                                setSelectedSleepPoint(null);
                              }}
                              renderDotContent={({ x, y, index: idx }) => {
                                if (selectedWeightPoint !== idx) return null;
                                const value = weightData[idx];
                                if (value === undefined) return null;
                                const entry = reversedHistory[idx];
                                const date = new Date(entry.log_date + 'T00:00:00');
                                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const prevValue = idx > 0 ? weightData[idx - 1] : null;
                                const diff = prevValue !== null ? value - prevValue : 0;
                                const trendStr = diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? diff.toFixed(1) : '0';
                                const trendColor = diff > 0 ? '#EF4444' : diff < 0 ? '#22C55E' : COLORS.textMuted;

                                // Position tooltip to stay in bounds
                                const tooltipWidth = 70;
                                const tooltipHeight = 42;
                                const visibleLeft = 70;
                                const visibleRight = chartWidth - 40;
                                let tooltipX = x - tooltipWidth / 2;
                                if (tooltipX < visibleLeft) tooltipX = visibleLeft;
                                if (tooltipX + tooltipWidth > visibleRight) tooltipX = visibleRight - tooltipWidth;

                                // Flip tooltip below point if too close to top
                                const showBelow = y < 60;
                                const tooltipY = showBelow ? y + 10 : y - 50;

                                return (
                                  <G key={idx}>
                                    <Rect
                                      x={tooltipX}
                                      y={tooltipY}
                                      width={tooltipWidth}
                                      height={tooltipHeight}
                                      rx={6}
                                      fill={COLORS.surface}
                                      stroke={COLORS.primary}
                                      strokeWidth={1}
                                    />
                                    <SvgText
                                      x={tooltipX + tooltipWidth / 2}
                                      y={tooltipY + 14}
                                      fontSize={10}
                                      fill={COLORS.textMuted}
                                      textAnchor="middle"
                                      fontFamily="System"
                                    >
                                      {dateStr}
                                    </SvgText>
                                    <SvgText
                                      x={tooltipX + tooltipWidth / 2}
                                      y={tooltipY + 28}
                                      fontSize={12}
                                      fontWeight="600"
                                      fill={COLORS.text}
                                      textAnchor="middle"
                                      fontFamily="System"
                                    >
                                      {value.toFixed(1)}{unit}
                                    </SvgText>
                                    {prevValue !== null && (
                                      <SvgText
                                        x={tooltipX + tooltipWidth / 2}
                                        y={tooltipY + 40}
                                        fontSize={10}
                                        fill={trendColor}
                                        textAnchor="middle"
                                        fontFamily="System"
                                      >
                                        {trendStr}{unit}
                                      </SvgText>
                                    )}
                                  </G>
                                );
                              }}
                            />
                          );
                        })()}
                      </View>
                    </View>

                    {/* History List - Right Half */}
                    <Pressable
                      style={styles.weightHistoryHalf}
                      onPress={() => {
                        setSelectedWeightPoint(null);
                        setSelectedSleepPoint(null);
                      }}
                    >
                      {weightHistory.slice(0, 5).map((entry, index) => {
                        const date = new Date(entry.log_date + 'T00:00:00');
                        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const unit = profile?.weight_unit || 'kg';
                        const displayWeight = unit === 'lbs' ? (entry.weight * 2.205).toFixed(1) : entry.weight?.toFixed(1);
                        const nextEntry = weightHistory[index + 1];
                        const diff = nextEntry ? entry.weight - nextEntry.weight : 0;

                        return (
                          <View key={entry.id || index} style={styles.weightHistoryRow}>
                            <Text style={styles.weightHistoryDate}>{monthDay}</Text>
                            <View style={styles.weightHistoryTrend}>
                              {diff > 0.05 && <TrendingUp size={12} color={COLORS.success} />}
                              {diff < -0.05 && <TrendingDown size={12} color={COLORS.primary} />}
                              {Math.abs(diff) <= 0.05 && <Minus size={12} color={COLORS.textMuted} />}
                            </View>
                            <Text style={styles.weightHistoryValue}>{displayWeight}</Text>
                          </View>
                        );
                      })}
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.weightEmptyState}
                onPress={() => setShowWeighInModal(true)}
              >
                <Text style={styles.weightEmptyText}>Log your first weigh-in</Text>
                <Plus size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
            );
          })()}
        </View>

        {/* Sleep Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SLEEP TRACKING</Text>
          <View style={styles.weightCard}>
            {sleepHistory.length > 0 ? (
              <>
                <View style={styles.weightCurrentRow}>
                  <View style={styles.weightCurrentInfo}>
                    <Text style={styles.weightCurrentLabel}>Last Night</Text>
                    <View style={styles.weightNumbersRow}>
                      <Text style={styles.weightCurrentValue}>
                        {sleepHistory[0]?.hours_slept?.toFixed(1) || '0'}h
                      </Text>
                    </View>
                    {sleepHistory.length > 1 && (
                      <Text style={styles.weightChangeText}>
                        Avg: {(sleepHistory.reduce((sum, s) => sum + (s.hours_slept || 0), 0) / sleepHistory.length).toFixed(1)}h
                      </Text>
                    )}
                  </View>
                  <View style={styles.weightGoalInfo}>
                    <Text style={styles.weightGoalLabel}>Goal</Text>
                    <Text style={styles.weightGoalValue}>{sleepGoal}h</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.weighInBtn}
                    onPress={() => setShowSleepModal(true)}
                  >
                    <Plus size={18} color={COLORS.textOnPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Split Layout: Graph + History */}
                {sleepHistory.length >= 2 && (
                  <View style={styles.weightSplitContainer}>
                    {/* Mini Chart - Left Half */}
                    <View style={styles.weightChartHalf}>
                      <View style={styles.chartWithLabel}>
                        {(() => {
                          const reversedSleepHistory = sleepHistory.slice(0, 7).reverse();
                          const sleepData = reversedSleepHistory.map(e => e.hours_slept || 0);
                          const chartWidth = Dimensions.get('window').width * 0.8;

                          return (
                            <LineChart
                              data={{
                                labels: [],
                                datasets: [
                                  {
                                    data: sleepData.length > 0 ? sleepData : [0],
                                    color: () => '#8B5CF6',
                                    strokeWidth: 2,
                                  },
                                  {
                                    data: Array(sleepData.length || 1).fill(sleepGoal),
                                    color: () => COLORS.textMuted,
                                    strokeWidth: 1,
                                    withDots: false,
                                  },
                                ],
                              }}
                              width={chartWidth}
                              height={200}
                              withVerticalLabels={false}
                              withHorizontalLabels={false}
                              withInnerLines={false}
                              withOuterLines={false}
                              withDots={true}
                              fromZero={true}
                              chartConfig={{
                                backgroundColor: 'transparent',
                                backgroundGradientFrom: COLORS.surface,
                                backgroundGradientTo: COLORS.surface,
                                decimalPlaces: 1,
                                color: () => '#8B5CF6',
                                labelColor: () => COLORS.textMuted,
                                paddingRight: 0,
                                paddingLeft: 0,
                                propsForDots: {
                                  r: '4',
                                  strokeWidth: '0',
                                  fill: '#8B5CF6',
                                },
                                propsForLabels: {
                                  fontSize: 11,
                                  fontWeight: '500',
                                },
                              }}
                              bezier
                              style={{ borderRadius: 8, marginLeft: -60, marginRight: -20 }}
                              getDotColor={(dataPoint) =>
                                dataPoint >= sleepGoal ? '#8B5CF6' : '#EF4444'
                              }
                              onDataPointClick={({ index }) => {
                                setSelectedSleepPoint(selectedSleepPoint === index ? null : index);
                                setSelectedWeightPoint(null);
                              }}
                              renderDotContent={({ x, y, index: idx }) => {
                                if (selectedSleepPoint !== idx) return null;
                                const value = sleepData[idx];
                                if (value === undefined) return null;
                                const entry = reversedSleepHistory[idx];
                                const date = new Date(entry.log_date + 'T00:00:00');
                                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const prevValue = idx > 0 ? sleepData[idx - 1] : null;
                                const diff = prevValue !== null ? value - prevValue : 0;
                                const trendStr = diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? diff.toFixed(1) : '0';
                                const trendColor = diff > 0 ? '#22C55E' : diff < 0 ? '#EF4444' : COLORS.textMuted;

                                // Position tooltip to stay in bounds
                                const tooltipWidth = 65;
                                const tooltipHeight = 42;
                                const visibleLeft = 70;
                                const visibleRight = chartWidth - 40;
                                let tooltipX = x - tooltipWidth / 2;
                                if (tooltipX < visibleLeft) tooltipX = visibleLeft;
                                if (tooltipX + tooltipWidth > visibleRight) tooltipX = visibleRight - tooltipWidth;

                                // Flip tooltip below point if too close to top
                                const showBelow = y < 60;
                                const tooltipY = showBelow ? y + 10 : y - 50;

                                return (
                                  <G key={idx}>
                                    <Rect
                                      x={tooltipX}
                                      y={tooltipY}
                                      width={tooltipWidth}
                                      height={tooltipHeight}
                                      rx={6}
                                      fill={COLORS.surface}
                                      stroke="#8B5CF6"
                                      strokeWidth={1}
                                    />
                                    <SvgText
                                      x={tooltipX + tooltipWidth / 2}
                                      y={tooltipY + 14}
                                      fontSize={10}
                                      fill={COLORS.textMuted}
                                      textAnchor="middle"
                                      fontFamily="System"
                                    >
                                      {dateStr}
                                    </SvgText>
                                    <SvgText
                                      x={tooltipX + tooltipWidth / 2}
                                      y={tooltipY + 28}
                                      fontSize={12}
                                      fontWeight="600"
                                      fill={COLORS.text}
                                      textAnchor="middle"
                                      fontFamily="System"
                                    >
                                      {value.toFixed(1)}h
                                    </SvgText>
                                    {prevValue !== null && (
                                      <SvgText
                                        x={tooltipX + tooltipWidth / 2}
                                        y={tooltipY + 40}
                                        fontSize={10}
                                        fill={trendColor}
                                        textAnchor="middle"
                                        fontFamily="System"
                                      >
                                        {trendStr}h
                                      </SvgText>
                                    )}
                                  </G>
                                );
                              }}
                            />
                          );
                        })()}
                      </View>
                    </View>

                    {/* History List - Right Half */}
                    <Pressable
                      style={styles.weightHistoryHalf}
                      onPress={() => {
                        setSelectedWeightPoint(null);
                        setSelectedSleepPoint(null);
                      }}
                    >
                      {sleepHistory.slice(0, 5).map((entry, index) => {
                        const date = new Date(entry.log_date + 'T00:00:00');
                        const monthDay = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        const nextEntry = sleepHistory[index + 1];
                        const diff = nextEntry ? entry.hours_slept - nextEntry.hours_slept : 0;

                        return (
                          <View key={entry.id || index} style={styles.weightHistoryRow}>
                            <Text style={styles.weightHistoryDate}>{monthDay}</Text>
                            <View style={styles.weightHistoryTrend}>
                              {diff > 0.25 && <TrendingUp size={12} color={COLORS.success} />}
                              {diff < -0.25 && <TrendingDown size={12} color="#EF4444" />}
                              {Math.abs(diff) <= 0.25 && <Minus size={12} color={COLORS.textMuted} />}
                            </View>
                            <Text style={styles.weightHistoryValue}>{entry.hours_slept?.toFixed(1)}h</Text>
                          </View>
                        );
                      })}
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.weightEmptyState}
                onPress={() => setShowSleepModal(true)}
              >
                <Text style={styles.weightEmptyText}>Log your first sleep</Text>
                <Plus size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
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
        onDelete={handleDeleteWater}
        currentIntake={waterIntake}
        waterGoal={nutritionGoals.water}
        waterEntries={waterEntries}
      />

      <WeighInModal
        visible={showWeighInModal}
        onClose={() => setShowWeighInModal(false)}
        onSave={handleSaveWeight}
        unit={profile?.weight_unit || 'kg'}
        currentWeight={lastWeight}
        lastWeighInDate={weightHistory.length > 0 ? weightHistory[0].log_date : null}
        weightHistory={weightHistory}
      />

      <SleepEntryModal
        visible={showSleepModal}
        onClose={() => setShowSleepModal(false)}
        onSave={handleSaveSleep}
      />

      {/* Followers/Following Modal */}
      <Modal
        visible={showSocialModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSocialModal(false)}
      >
        <View style={styles.socialModalOverlay}>
          <View style={styles.socialModalContainer}>
            <View style={styles.socialModalHeader}>
              <TouchableOpacity onPress={() => setShowSocialModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.socialModalTabs}>
                <TouchableOpacity
                  style={[styles.socialModalTab, socialModalTab === 'followers' && styles.socialModalTabActive]}
                  onPress={() => setSocialModalTab('followers')}
                >
                  <Text style={[styles.socialModalTabText, socialModalTab === 'followers' && styles.socialModalTabTextActive]}>
                    Followers ({followersCount})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialModalTab, socialModalTab === 'following' && styles.socialModalTabActive]}
                  onPress={() => setSocialModalTab('following')}
                >
                  <Text style={[styles.socialModalTabText, socialModalTab === 'following' && styles.socialModalTabTextActive]}>
                    Following ({followingCount})
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.socialModalList}>
              {(socialModalTab === 'followers' ? followersList : followingList).map((person) => (
                <View key={person.id} style={styles.socialPersonRow}>
                  <View style={styles.socialPersonAvatar}>
                    <Text style={styles.socialPersonAvatarText}>
                      {person.name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.socialPersonInfo}>
                    <Text style={styles.socialPersonName}>{person.name}</Text>
                    <Text style={styles.socialPersonUsername}>@{person.username}</Text>
                  </View>
                  <Text style={styles.socialPersonStats}>{person.workouts} workouts</Text>
                </View>
              ))}
              {(socialModalTab === 'followers' ? followersList : followingList).length === 0 && (
                <Text style={styles.socialEmptyText}>
                  {socialModalTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <RepertoireModal
        visible={showRepertoireModal}
        onClose={() => setShowRepertoireModal(false)}
        savedWorkouts={savedWorkouts}
        loading={repertoireLoading}
        onStartWorkout={handleStartRepertoireWorkout}
      />

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <TouchableOpacity
          style={styles.notifModalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationsModal(false)}
        >
          <View style={styles.notifModalContainer}>
            <View style={styles.notifModalHeader}>
              <Text style={styles.notifModalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notifModalContent} showsVerticalScrollIndicator={false}>
              {notificationsLoading ? (
                <Text style={styles.notifEmptyText}>Loading...</Text>
              ) : notifications.length === 0 ? (
                <View style={styles.notifEmpty}>
                  <Bell size={32} color={COLORS.textMuted} />
                  <Text style={styles.notifEmptyText}>No notifications</Text>
                </View>
              ) : (
                notifications.map(notif => (
                  <View key={notif.id} style={styles.notifItem}>
                    <View style={styles.notifItemLeft}>
                      <View style={styles.notifAvatar}>
                        <Text style={styles.notifAvatarText}>
                          {notif.fromUser?.first_name?.[0] || '?'}
                        </Text>
                      </View>
                      <View style={styles.notifInfo}>
                        <Text style={styles.notifText}>
                          <Text style={styles.notifName}>
                            {notif.fromUser?.first_name} {notif.fromUser?.last_name}
                          </Text>
                          {' wants to follow you'}
                        </Text>
                        <Text style={styles.notifTime}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.notifActions}>
                      <TouchableOpacity
                        style={styles.notifAcceptBtn}
                        onPress={() => handleAcceptRequest(notif)}
                      >
                        <Check size={16} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.notifDeclineBtn}
                        onPress={() => handleDeclineRequest(notif)}
                      >
                        <X size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
                  {/* MY WORKOUTS - Custom Templates */}
                  {filteredCustomTemplates.length > 0 && (
                    <>
                      <Text style={styles.templateSectionLabel}>MY WORKOUTS</Text>
                      {filteredCustomTemplates.map(template => (
                        <TouchableOpacity
                          key={template.id}
                          style={[styles.templateItem, styles.customTemplateItem]}
                          onPress={() => startFromCustomTemplate(template)}
                        >
                          <View style={styles.templateIcon}>
                            <Pencil size={18} color={COLORS.primary} />
                          </View>
                          <View style={styles.templateInfo}>
                            <Text style={styles.templateName}>{template.name}</Text>
                            <Text style={styles.templateFocus}>{template.focus}</Text>
                            <Text style={styles.templateExercises}>{template.exercises?.length || 0} exercises</Text>
                          </View>
                          <ChevronRight size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      ))}
                      <Text style={styles.templateSectionLabel}>BROWSE TEMPLATES</Text>
                    </>
                  )}
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
                  {filteredTemplates.length === 0 && filteredCustomTemplates.length === 0 && (
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
                  <Play size={20} color={COLORS.textOnPrimary} />
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

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
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
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  savedWorkoutResumeText: {
    color: COLORS.textOnPrimary,
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
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  iconButton: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  // Notifications Modal
  notifModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  notifModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    maxHeight: 400,
    overflow: 'hidden',
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  notifModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  notifModalContent: {
    padding: 16,
  },
  notifEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  notifEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  notifItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  notifItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notifAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notifInfo: {
    flex: 1,
  },
  notifText: {
    color: COLORS.text,
    fontSize: 14,
  },
  notifName: {
    fontWeight: '600',
  },
  notifTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  notifActions: {
    flexDirection: 'row',
    gap: 8,
  },
  notifAcceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDeclineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutBadge: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  workoutHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  todayBadgeContainer: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
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
    textAlign: 'center',
    marginTop: 2,
  },
  workoutFocus: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 0,
    textAlign: 'center',
  },
  workoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'stretch',
    borderWidth: 0,
    outlineWidth: 0,
  },
  workoutButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  savedWorkoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discardButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  progressRingWrapper: {
    width: 52,
    height: 52,
    position: 'relative',
    marginBottom: 6,
  },
  progressRingInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    alignItems: 'stretch',
  },
  addMealCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealIconBox: {
    display: 'none',
  },
  mealInfo: {
    alignItems: 'center',
  },
  mealTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  mealSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  quickWaterCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  waterLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  waterTotalBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  waterTotalText: {
    color: COLORS.primary,
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
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  waterQuickBtnText: {
    color: COLORS.textSecondary,
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
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  discoverButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exploreCommunityText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },

  // Weight Tracking Section
  weightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weightCardGoalReached: {
    borderColor: COLORS.success + '60',
    borderWidth: 2,
  },
  weightCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightCurrentInfo: {
    flex: 1,
  },
  weightCurrentLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  weightCurrentValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
  },
  weightNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightGoalInline: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  weightUnitInline: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  weightChangeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  weightGoalInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  weightGoalLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  weightGoalValue: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  weightGoalMessage: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weightGoalText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  weightChartContainer: {
    marginTop: 16,
  },
  weightChart: {
    borderRadius: 8,
  },
  weightChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  weightChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightChartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weightChartLegendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  weighInBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightHistoryList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weightHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weightHistoryDate: {
    color: COLORS.textMuted,
    fontSize: 13,
    width: 60,
  },
  weightHistoryTrend: {
    width: 20,
    alignItems: 'center',
  },
  weightHistoryValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  weightEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  weightEmptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  weightSplitContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  weightChartHalf: {
    flex: 2,
  },
  chartWithLabel: {
    position: 'relative',
    width: '100%',
  },
  goalLabelOnChart: {
    position: 'absolute',
    right: 8,
    top: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  goalLabelText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  weightHistoryHalf: {
    flex: 1,
  },
  sleepButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sleepButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  sleepLoggedButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  sleepLoggedButtonText: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '500',
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
    color: COLORS.textOnPrimary,
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
    color: COLORS.textOnPrimary,
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
  templateSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  customTemplateItem: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
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

  // Weekly Sets by Muscle
  muscleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 2,
  },
  muscleToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  muscleToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  muscleToggleText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  muscleToggleTextActive: {
    color: COLORS.textOnPrimary,
  },
  muscleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    width: 72,
  },
  muscleBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  muscleBarFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 0,
  },
  muscleCount: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  muscleEditBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceLight,
  },
  muscleTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingTop: 10,
    marginTop: 2,
  },
  muscleTotalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  muscleTotalCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  targetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  targetModalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  targetModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  targetModalRowLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  targetModalRowInput: {
    width: 70,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  targetModalRowRec: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    width: 36,
    textAlign: 'center',
  },
  targetModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  targetModalResetBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  targetModalResetText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  targetModalSaveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  targetModalSaveText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Social Modal
  socialModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  socialModalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  socialModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  socialModalTabs: {
    flexDirection: 'row',
    gap: 16,
  },
  socialModalTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  socialModalTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  socialModalTabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  socialModalTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  socialModalList: {
    padding: 16,
  },
  socialPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  socialPersonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialPersonAvatarText: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  socialPersonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  socialPersonName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  socialPersonUsername: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  socialPersonStats: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  socialEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },

  // Challenge cards on home
  challengeHomeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeHomeInfo: {
    flex: 1,
  },
  challengeHomeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  challengeHomeGoal: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  challengeHomeProgress: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  challengeHomeProgressBar: {
    width: 80,
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  challengeHomeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  challengeHomeProgressText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});

export default HomeScreen;
