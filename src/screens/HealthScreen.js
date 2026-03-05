import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import {
  Flame,
  Droplets,
  Utensils,
  Check,
  Trash2,
  Pencil,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Settings,
  Calendar,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { nutritionService } from '../services/nutritionService';
import { sleepService } from '../services/sleepService';
import AddMealModal from '../components/AddMealModal';
import WaterEntryModal from '../components/WaterEntryModal';
import { profileService } from '../services/profileService';
import Toast from '../components/Toast';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'meals', label: 'Meals' },
  { id: 'water', label: 'Water' },
  { id: 'supplements', label: 'Supps' },
  { id: 'sleep', label: 'Sleep' },
];

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const screenWidth = Dimensions.get('window').width;

const HealthScreen = () => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const route = useRoute();
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(route.params?.tab || 'overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trendFilter, setTrendFilter] = useState('Calories');
  const [sleepChartPeriod, setSleepChartPeriod] = useState('7D');

  // Date navigation helpers
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const getDateLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Nutrition state
  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [proteinIntake, setProteinIntake] = useState(0);
  const [carbsIntake, setCarbsIntake] = useState(0);
  const [fatsIntake, setFatsIntake] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterEntries, setWaterEntries] = useState([]); // Individual water logs
  const [meals, setMeals] = useState([]);
  const [nutritionHistory, setNutritionHistory] = useState([]);

  // Supplements state
  const [supplements, setSupplements] = useState([]);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementAmount, setNewSupplementAmount] = useState('');
  const [newSupplementUnit, setNewSupplementUnit] = useState('mg');
  const [newSupplementTimesPerDay, setNewSupplementTimesPerDay] = useState('1');
  const [newSupplementTimesPerWeek, setNewSupplementTimesPerWeek] = useState('7');
  const [editingSupplement, setEditingSupplement] = useState(null);

  // Sleep state
  const [selectedSleepDate, setSelectedSleepDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
  });
  const [bedTimeHour, setBedTimeHour] = useState('22');
  const [bedTimeMin, setBedTimeMin] = useState('00');
  const [wakeTimeHour, setWakeTimeHour] = useState('06');
  const [wakeTimeMin, setWakeTimeMin] = useState('30');
  const [sleepLogged, setSleepLogged] = useState(false);
  const [sleepData, setSleepData] = useState(null);
  const [sleepGoal, setSleepGoal] = useState(7);
  const [sleepHistory, setSleepHistory] = useState([]);
  const [selectedSleepPoint, setSelectedSleepPoint] = useState(null);

  // Water goal editing
  const [showWaterGoalEdit, setShowWaterGoalEdit] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState('');

  // Modals
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showWaterEntry, setShowWaterEntry] = useState(false);
  const [showAdjustedInfo, setShowAdjustedInfo] = useState(false);

  // Toast notification
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Goals - read from user profile
  const nutritionGoals = {
    calories: profile?.calorie_goal || 2200,
    protein: profile?.protein_goal || 150,
    carbs: profile?.carb_goal || 250,
    fats: profile?.fat_goal || 70,
    water: profile?.water_goal || 3500,
  };

  // Nutrition mode
  const nutritionMode = {
    name: 'Fat Loss Mode',
    description: 'Stay in a calorie deficit to lose fat',
    color: '#7C2D2D', // Dark red/maroon
  };

  // Reload data when screen comes into focus (syncs with HomeScreen)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadDateNutrition();
        loadWaterEntries();
        loadSupplements();
        loadSleepData();
        loadSleepHistory();
        loadNutritionHistory();
      }
    }, [user])
  );

  // Reload when selectedDate changes
  useEffect(() => {
    if (user?.id) {
      loadDateNutrition();
      loadWaterEntries();
      loadSupplements();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (user?.id) {
      loadSleepData();
    }
  }, [selectedSleepDate]);

  const loadDateNutrition = async () => {
    try {
      const dateStr = getLocalDateString(selectedDate);
      const { data } = await nutritionService.getDailyNutrition(user.id, dateStr);
      if (data) {
        setCaloriesIntake(data.total_calories || 0);
        setProteinIntake(data.total_protein || 0);
        setCarbsIntake(data.total_carbs || 0);
        setFatsIntake(data.total_fats || 0);
        setWaterIntake(data.water_intake || 0);
      } else {
        setCaloriesIntake(0);
        setProteinIntake(0);
        setCarbsIntake(0);
        setFatsIntake(0);
        setWaterIntake(0);
      }

      const { data: mealsData } = await nutritionService.getMeals(user.id, dateStr);
      if (mealsData) {
        setMeals(mealsData.map(m => ({
          id: m.id,
          name: m.meal_name,
          calories: m.calories || 0,
          protein: m.protein || 0,
          carbs: m.carbs || 0,
          fats: m.fats || 0,
          logged_at: m.created_at,
        })));
      } else {
        setMeals([]);
      }
    } catch (error) {
      console.log('Error loading nutrition:', error);
    }
  };

  const loadNutritionHistory = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 27); // Last 4 weeks

      const { data } = await nutritionService.getNutritionHistory(
        user.id,
        getLocalDateString(startDate),
        getLocalDateString(endDate)
      );
      if (data) {
        setNutritionHistory(data);
      }
    } catch (error) {
      console.log('Error loading nutrition history:', error);
    }
  };

  const loadWaterEntries = async () => {
    try {
      const dateStr = getLocalDateString(selectedDate);
      const { data } = await nutritionService.getWaterLogs(user.id, dateStr);
      if (data) {
        setWaterEntries(data.map(log => ({
          id: log.id,
          amount: log.amount_ml,
          timestamp: new Date(log.logged_at),
          log_date: log.log_date,
        })));
      } else {
        setWaterEntries([]);
      }
    } catch (error) {
      console.log('Error loading water entries:', error);
    }
  };

  const loadSupplements = async () => {
    try {
      const { data } = await nutritionService.getSupplements(user.id);
      if (data) {
        // Get supplement logs for selected date
        const dateStr = getLocalDateString(selectedDate);
        const { data: logs } = await nutritionService.getSupplementLogs(user.id, dateStr);

        const supplementsWithStatus = data.map(supp => {
          const takenCount = logs?.filter(l => l.supplement_id === supp.id).length || 0;
          const timesPerDay = supp.times_per_day || 1;
          return {
            ...supp,
            takenCount,
            taken: takenCount >= timesPerDay, // Fully complete when all doses taken
          };
        });
        setSupplements(supplementsWithStatus);
      }
    } catch (error) {
      console.log('Error loading supplements:', error);
    }
  };

  const loadSleepData = async () => {
    try {
      const { data } = await sleepService.getSleepLog(user.id, selectedSleepDate);
      if (data) {
        setSleepLogged(true);
        setSleepData(data);
        if (data.bed_time) {
          const [h, m] = data.bed_time.split(':');
          setBedTimeHour(h);
          setBedTimeMin(m);
        }
        if (data.wake_time) {
          const [h, m] = data.wake_time.split(':');
          setWakeTimeHour(h);
          setWakeTimeMin(m);
        }
      } else {
        setSleepLogged(false);
        setSleepData(null);
      }
    } catch (error) {
      console.log('Error loading sleep:', error);
    }
  };

  const loadSleepHistory = async () => {
    try {
      // Get date range: from 14 days ago (covers 7-day chart + buffer) to end of current month
      const now = new Date();
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = getLocalDateString(fourteenDaysAgo);
      const endDate = getLocalDateString(endOfMonth);

      const { data } = await sleepService.getSleepHistory(user.id, startDate, endDate);

      if (data && data.length > 0) {
        // Keep full data for tooltips, add date number for calendar
        const historyWithDate = data.map(entry => ({
          ...entry,
          date: new Date(entry.log_date + 'T00:00:00').getDate(),
          hours: entry.hours_slept || 0,
        }));
        setSleepHistory(historyWithDate);
      }
    } catch (error) {
      console.log('Error loading sleep history:', error);
    }
  };

  const handleAddMeal = async (meal) => {
    setCaloriesIntake(prev => prev + meal.calories);
    setProteinIntake(prev => prev + meal.protein);
    setCarbsIntake(prev => prev + meal.carbs);
    setFatsIntake(prev => prev + meal.fats);

    const newMeal = {
      id: Date.now().toString(),
      ...meal,
      logged_at: new Date().toISOString(),
    };
    setMeals(prev => [...prev, newMeal]);

    if (user?.id) {
      try {
        const mealWithDate = { ...meal, date: getLocalDateString(selectedDate) };
        await nutritionService.logMeal(user.id, mealWithDate);
        await loadNutritionHistory();
      } catch (error) {
        console.log('Error saving meal:', error);
      }
    }
  };

  const handleDeleteMeal = async (meal) => {
    const deleteMeal = async () => {
      setCaloriesIntake(prev => prev - meal.calories);
      setProteinIntake(prev => prev - meal.protein);
      setCarbsIntake(prev => prev - meal.carbs);
      setFatsIntake(prev => prev - meal.fats);
      setMeals(prev => prev.filter(m => m.id !== meal.id));

      if (user?.id && meal.id) {
        const dateStr = getLocalDateString(selectedDate);
        await nutritionService.deleteMeal(meal.id, user.id, dateStr);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${meal.name}?`)) {
        await deleteMeal();
      }
    } else {
      Alert.alert('Delete Meal', `Remove ${meal.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteMeal,
        },
      ]);
    }
  };

  const handleAddWater = async (amount) => {
    // Optimistic update
    setWaterIntake(prev => Math.min(prev + amount, 10000));

    if (user?.id) {
      try {
        const dateStr = getLocalDateString(selectedDate);
        await nutritionService.logWater(user.id, amount, dateStr);
        // Reload entries and history to update chart
        await loadWaterEntries();
        await loadNutritionHistory();
      } catch (error) {
        console.log('Error saving water:', error);
        // Revert on error
        setWaterIntake(prev => prev - amount);
      }
    }
  };

  const handleDeleteWater = async (entry) => {
    // Optimistic update
    setWaterEntries(prev => prev.filter(e => e.id !== entry.id));
    setWaterIntake(prev => Math.max(0, prev - entry.amount));

    if (user?.id) {
      try {
        const { error } = await nutritionService.deleteWaterLog(user.id, entry.id, entry.log_date);
        if (error) {
          console.log('Error deleting water entry:', error);
          // Reload to restore state on error
          await loadWaterEntries();
          await loadDateNutrition();
        }
        await loadNutritionHistory();
      } catch (error) {
        console.log('Error deleting water:', error);
        // Reload to restore state on error
        await loadWaterEntries();
        await loadDateNutrition();
      }
    }
  };

  const formatWaterAmount = (ml) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSupplementTaken = async (supp) => {
    const timesPerDay = supp.times_per_day || 1;
    const currentCount = supp.takenCount || 0;

    // If already at max doses, don't add more
    if (currentCount >= timesPerDay) {
      return;
    }

    const newCount = currentCount + 1;
    const isComplete = newCount >= timesPerDay;

    setSupplements(prev => prev.map(s =>
      s.id === supp.id ? { ...s, takenCount: newCount, taken: isComplete } : s
    ));

    if (user?.id) {
      await nutritionService.logSupplement(user.id, supp.id, getLocalDateString(selectedDate));
    }
  };

  const handleAddSupplement = async () => {
    if (!newSupplementName.trim()) return;

    const dosage = newSupplementAmount ? `${newSupplementAmount} ${newSupplementUnit}` : '1 serving';
    const timesPerDay = parseInt(newSupplementTimesPerDay) || 1;
    const timesPerWeek = parseInt(newSupplementTimesPerWeek) || 7;

    try {
      await nutritionService.addSupplement(user.id, {
        name: newSupplementName,
        dosage: dosage,
        times_per_day: timesPerDay,
        times_per_week: timesPerWeek,
        time: '08:00',
      });
      // Reset form
      setNewSupplementName('');
      setNewSupplementAmount('');
      setNewSupplementUnit('mg');
      setNewSupplementTimesPerDay('1');
      setNewSupplementTimesPerWeek('7');
      setShowAddSupplement(false);
      loadSupplements();
    } catch (error) {
      Alert.alert('Error', 'Failed to add supplement');
    }
  };

  const handleCancelAddSupplement = () => {
    setNewSupplementName('');
    setNewSupplementAmount('');
    setNewSupplementUnit('mg');
    setNewSupplementTimesPerDay('1');
    setNewSupplementTimesPerWeek('7');
    setShowAddSupplement(false);
    setEditingSupplement(null);
  };

  const handleDeleteSupplement = async (supp) => {
    try {
      await nutritionService.deleteSupplement(supp.id);
      setSupplements(prev => prev.filter(s => s.id !== supp.id));
      showToast(`${supp.name} deleted`, 'success');
    } catch (error) {
      console.log('Error deleting supplement:', error);
      showToast('Failed to delete supplement', 'error');
    }
  };

  const handleEditSupplement = (supp) => {
    setEditingSupplement(supp);
    setNewSupplementName(supp.name);
    setNewSupplementAmount(supp.dosage?.split(' ')[0] || '');
    setNewSupplementUnit(supp.dosage?.split(' ')[1] || 'mg');
    setShowAddSupplement(true);
  };

  const handleUpdateSupplement = async () => {
    if (!editingSupplement || !newSupplementName.trim()) return;

    const dosage = newSupplementAmount ? `${newSupplementAmount} ${newSupplementUnit}` : '1 serving';

    try {
      await nutritionService.updateSupplement(editingSupplement.id, {
        name: newSupplementName,
        dosage: dosage,
      });

      setSupplements(prev => prev.map(s =>
        s.id === editingSupplement.id ? { ...s, name: newSupplementName, dosage } : s
      ));

      handleCancelAddSupplement();
      showToast('Supplement updated', 'success');
    } catch (error) {
      console.log('Error updating supplement:', error);
      showToast('Failed to update supplement', 'error');
    }
  };

  const handleLogSleep = async () => {
    const bedTime = `${bedTimeHour}:${bedTimeMin}`;
    const wakeTime = `${wakeTimeHour}:${wakeTimeMin}`;

    // Calculate hours slept
    const bedH = parseInt(bedTimeHour) || 0;
    const bedM = parseInt(bedTimeMin) || 0;
    const wakeH = parseInt(wakeTimeHour) || 0;
    const wakeM = parseInt(wakeTimeMin) || 0;
    let hours = wakeH - bedH + (wakeM - bedM) / 60;
    if (hours < 0) hours += 24;

    try {
      if (user?.id) {
        await sleepService.logSleep(user.id, {
          date: selectedSleepDate,
          bedTime,
          wakeTime,
          hoursSlept: hours,
          qualityRating: 3,
        });
      }
      setSleepLogged(true);
      setSleepData({ hours_slept: hours, bed_time: bedTime, wake_time: wakeTime });

      // Add to sleep history for chart and calendar display
      const sleepDate = new Date(selectedSleepDate);
      const dayOfMonth = sleepDate.getDate();
      setSleepHistory(prev => {
        // Remove any existing entry for this date
        const filtered = prev.filter(entry => entry.date !== dayOfMonth && entry.log_date !== selectedSleepDate);
        return [...filtered, {
          date: dayOfMonth,
          hours: parseFloat(hours.toFixed(1)),
          log_date: selectedSleepDate,
          hours_slept: hours,
          bed_time: bedTime,
          wake_time: wakeTime,
        }];
      });

      showToast(`Sleep logged: ${hours.toFixed(1)} hours`, 'success');
    } catch (error) {
      console.log('Error logging sleep:', error);
      showToast('Failed to log sleep', 'error');
    }
  };

  const navigateSleepDate = (direction) => {
    const current = new Date(selectedSleepDate);
    current.setDate(current.getDate() + direction);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (current <= yesterday) {
      setSelectedSleepDate(getLocalDateString(current));
    }
  };

  const calculateSleepHours = () => {
    const bedH = parseInt(bedTimeHour) || 0;
    const bedM = parseInt(bedTimeMin) || 0;
    const wakeH = parseInt(wakeTimeHour) || 0;
    const wakeM = parseInt(wakeTimeMin) || 0;
    let hours = wakeH - bedH + (wakeM - bedM) / 60;
    if (hours < 0) hours += 24;
    return hours.toFixed(1);
  };

  const caloriesComplete = caloriesIntake >= nutritionGoals.calories;
  const waterComplete = waterIntake >= nutritionGoals.water;
  const proteinComplete = proteinIntake >= nutritionGoals.protein;

  // Calculate total doses needed and taken (accounting for multi-dose supplements)
  const totalSupplements = supplements.reduce((acc, s) => acc + (s.times_per_day || 1), 0);
  const takenSupplements = supplements.reduce((acc, s) => acc + (s.takenCount || 0), 0);

  const waterOptions = [
    { label: '100ml', amount: 100 },
    { label: '250ml', amount: 250 },
    { label: '500ml', amount: 500 },
    { label: '1L', amount: 1000 },
  ];

  const caloriesRemaining = nutritionGoals.calories - caloriesIntake;
  const waterRemaining = (nutritionGoals.water - waterIntake) / 1000;
  const isOnTrack = caloriesIntake <= nutritionGoals.calories;

  const caloriesProgress = Math.min((caloriesIntake / nutritionGoals.calories) * 100, 100);
  const waterProgress = Math.min((waterIntake / nutritionGoals.water) * 100, 100);

  const proteinPercent = nutritionGoals.protein > 0 ? Math.round((proteinIntake / nutritionGoals.protein) * 100) : 0;
  const carbsPercent = nutritionGoals.carbs > 0 ? Math.round((carbsIntake / nutritionGoals.carbs) * 100) : 0;

  const quickWaterOptions = [
    { label: '100ml', amount: 100 },
    { label: '250ml', amount: 250 },
    { label: '400ml', amount: 400 },
    { label: '500ml', amount: 500 },
    { label: '1L', amount: 1000 },
  ];

  const renderOverviewTab = () => (
    <>
      {/* Fat Loss Mode Card */}
      <View style={styles.modeCard}>
        <View style={styles.modeHeader}>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>{nutritionMode.name}</Text>
            <Text style={styles.modeSubtitle}>{nutritionMode.description}</Text>
          </View>
        </View>
        <View style={styles.modeStats}>
          <View style={styles.modeStat}>
            <Text style={styles.modeStatLabel}>Target</Text>
            <Text style={styles.modeStatValue} numberOfLines={1}>{nutritionGoals.calories}</Text>
          </View>
          <View style={styles.modeStat}>
            <Text style={styles.modeStatLabel}>Remaining</Text>
            <Text style={[styles.modeStatValue, caloriesRemaining >= 0 ? styles.modeStatValueGreen : styles.modeStatValueRed]} numberOfLines={1}>
              {caloriesRemaining}
            </Text>
          </View>
          <View style={[styles.onTrackBadge, !isOnTrack && styles.offTrackBadge]}>
            {isOnTrack && <Check size={14} color={COLORS.success} />}
            <Text style={[styles.onTrackText, !isOnTrack && styles.offTrackText]}>
              {isOnTrack ? 'On Track' : 'Over'}
            </Text>
          </View>
        </View>
      </View>

      {/* TODAY'S NUTRITION */}
      <Text style={styles.sectionLabel}>TODAY'S NUTRITION</Text>

      {/* Calories & Water Circles */}
      <View style={styles.circlesRow}>
        {/* Calories Circle */}
        <View style={styles.circleCard}>
          <View style={styles.circleContainer}>
            <View style={styles.progressRingWrapper}>
              <Svg width={100} height={100} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx={50}
                  cy={50}
                  r={45}
                  stroke={COLORS.surfaceLight}
                  strokeWidth={8}
                  fill="none"
                />
                <Circle
                  cx={50}
                  cy={50}
                  r={45}
                  stroke={caloriesComplete ? COLORS.success : COLORS.primary}
                  strokeWidth={8}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - Math.min(caloriesProgress / 100, 1))}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.circleInner}>
                {caloriesComplete && (
                  <Check size={24} color={COLORS.success} strokeWidth={3} />
                )}
                <Text style={[
                  styles.circleValue,
                  { color: caloriesComplete ? COLORS.success : COLORS.primary }
                ]}>
                  {caloriesIntake}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.circleLabel, caloriesComplete && { color: COLORS.success }]}>
            Calories
          </Text>
          <Text style={[styles.circleSubtext, caloriesComplete && { color: COLORS.success }]}>
            {caloriesComplete ? 'Goal reached!' : `${caloriesRemaining} remaining`}
          </Text>
        </View>

        {/* Water Circle */}
        <View style={styles.circleCard}>
          <View style={styles.circleContainer}>
            <View style={styles.progressRingWrapper}>
              <Svg width={100} height={100} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx={50}
                  cy={50}
                  r={45}
                  stroke={COLORS.surfaceLight}
                  strokeWidth={8}
                  fill="none"
                />
                <Circle
                  cx={50}
                  cy={50}
                  r={45}
                  stroke={waterComplete ? COLORS.success : COLORS.primary}
                  strokeWidth={8}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - Math.min(waterProgress / 100, 1))}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.circleInner}>
                {waterComplete && (
                  <Check size={24} color={COLORS.success} strokeWidth={3} />
                )}
                <Text style={[
                  styles.circleValue,
                  { color: waterComplete ? COLORS.success : COLORS.primary }
                ]}>
                  {(waterIntake / 1000).toFixed(1)}L
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.circleLabel, waterComplete && { color: COLORS.success }]}>
            Water
          </Text>
          <Text style={[styles.circleSubtext, waterComplete && { color: COLORS.success }]}>
            {waterComplete ? `${(waterIntake / 1000).toFixed(1)}L - Goal reached!` : `${waterRemaining.toFixed(1)}L remaining`}
          </Text>
        </View>
      </View>

      {/* Add Meal & Quick Water Cards */}
      <View style={styles.actionCardsRow}>
        {/* Add Meal Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardTitle}>Add Meal</Text>
          </View>
          <TouchableOpacity
            style={styles.logMealBtn}
            onPress={() => setShowAddMeal(true)}
            onClick={() => setShowAddMeal(true)}
          >
            <Text style={styles.logMealBtnText}>Log Meal</Text>
          </TouchableOpacity>
          <View style={styles.macroRingsRow}>
            {/* Protein Ring */}
            <View style={styles.macroRingItem}>
              <View style={styles.macroRingWrapper}>
                <Svg width={56} height={56} style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={28} cy={28} r={23} stroke={COLORS.surfaceLight} strokeWidth={5} fill="none" />
                  <Circle
                    cx={28}
                    cy={28}
                    r={23}
                    stroke={proteinComplete ? COLORS.success : COLORS.primary}
                    strokeWidth={5}
                    fill="none"
                    strokeDasharray={2 * Math.PI * 23}
                    strokeDashoffset={2 * Math.PI * 23 * (1 - Math.min(proteinPercent / 100, 1))}
                    strokeLinecap="round"
                  />
                </Svg>
                <View style={[styles.macroRingInner, { position: 'absolute' }]}>
                  <Text style={[styles.macroRingValue, { color: proteinComplete ? COLORS.success : COLORS.primary }]}>{proteinPercent}%</Text>
                </View>
              </View>
              <Text style={[styles.macroRingLabel, proteinComplete && { color: COLORS.success }]}>Protein</Text>
              <Text style={[styles.macroRingSubtext, proteinComplete && { color: COLORS.success }]}>{proteinIntake}g / {nutritionGoals.protein}g</Text>
            </View>

            {/* Carbs Ring */}
            <View style={styles.macroRingItem}>
              <View style={styles.macroRingWrapper}>
                <Svg width={56} height={56} style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={28} cy={28} r={23} stroke={COLORS.surfaceLight} strokeWidth={5} fill="none" />
                  <Circle
                    cx={28}
                    cy={28}
                    r={23}
                    stroke={COLORS.primary}
                    strokeWidth={5}
                    fill="none"
                    strokeDasharray={2 * Math.PI * 23}
                    strokeDashoffset={2 * Math.PI * 23 * (1 - Math.min(carbsPercent / 100, 1))}
                    strokeLinecap="round"
                  />
                </Svg>
                <View style={[styles.macroRingInner, { position: 'absolute' }]}>
                  <Text style={[styles.macroRingValue, { color: COLORS.primary }]}>{carbsPercent}%</Text>
                </View>
              </View>
              <Text style={styles.macroRingLabel}>Carbs</Text>
              <Text style={styles.macroRingSubtext}>{carbsIntake}g / {nutritionGoals.carbs}g</Text>
            </View>
          </View>
          {/* Recent Meals */}
          <View style={styles.recentInCard}>
            {meals.length === 0 ? (
              <Text style={styles.recentEmptyCompact}>No meals logged</Text>
            ) : (
              meals.slice(-3).reverse().map((meal) => (
                <View key={meal.id} style={styles.recentEntryCardCompact}>
                  <View style={styles.recentEntryInfo}>
                    <Text style={styles.recentEntryTitleCompact} numberOfLines={1}>{meal.name}</Text>
                    <Text style={styles.recentEntrySubtextCompact}>{meal.calories} kcal</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.recentDeleteBtnCompact}
                    onPress={() => handleDeleteMeal(meal)}
                    onClick={() => handleDeleteMeal(meal)}
                  >
                    <Trash2 size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Water Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardTitle}>Quick Water</Text>
          </View>
          <View style={styles.waterButtonsGrid}>
            {quickWaterOptions.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.waterQuickBtnNew}
                onPress={() => handleAddWater(opt.amount)}
                onClick={() => handleAddWater(opt.amount)}
              >
                <Text style={styles.waterQuickBtnText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.waterQuickBtnNew}
              onPress={() => setShowWaterEntry(true)}
              onClick={() => setShowWaterEntry(true)}
            >
              <Text style={styles.waterQuickBtnText}>Custom</Text>
            </TouchableOpacity>
          </View>
          {/* Recent Water */}
          <View style={styles.recentInCard}>
            {waterEntries.length === 0 ? (
              <Text style={styles.recentEmptyCompact}>No water logged</Text>
            ) : (
              waterEntries.slice(0, 3).map((entry) => (
                <View key={entry.id} style={styles.recentEntryCardCompact}>
                  <View style={styles.recentEntryInfo}>
                    <Text style={styles.recentEntryTitleCompact}>{formatWaterAmount(entry.amount)}</Text>
                    <Text style={styles.recentEntrySubtextCompact}>{formatTime(entry.timestamp)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.recentDeleteBtnCompact}
                    onPress={() => handleDeleteWater(entry)}
                    onClick={() => handleDeleteWater(entry)}
                  >
                    <Trash2 size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      {/* Weekly Trends Section */}
      <View style={styles.weeklyTrendsCard}>
        <View style={styles.weeklyTrendsHeader}>
          <Text style={styles.weeklyTrendsTitle}>Weekly Trends</Text>
          <View style={styles.trendToggle}>
            <TouchableOpacity
              style={[styles.trendToggleBtn, trendFilter === 'Calories' && styles.trendToggleBtnActive]}
              onPress={() => setTrendFilter('Calories')}
            >
              <Text style={[styles.trendToggleText, trendFilter === 'Calories' && styles.trendToggleTextActive]}>Calories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.trendToggleBtn, trendFilter === 'Hydration' && styles.trendToggleBtnActive]}
              onPress={() => setTrendFilter('Hydration')}
            >
              <Text style={[styles.trendToggleText, trendFilter === 'Hydration' && styles.trendToggleTextActive]}>Water</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart - No Data State */}
        <View style={styles.chartContainer}>
          <View style={styles.noDataChart}>
            <Text style={styles.noDataText}>No trend data yet</Text>
            <Text style={styles.noDataSubtext}>Log your nutrition to see trends</Text>
          </View>
        </View>
      </View>

      {/* Nutrition Streak Calendar */}
      <Text style={styles.sectionLabel}>NUTRITION STREAK</Text>
      <View style={styles.streakCalendarCard}>
        {/* Week day headers */}
        <View style={styles.streakWeekHeader}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <Text key={idx} style={styles.streakDayLabel}>{day}</Text>
          ))}
        </View>

        {/* Calendar grid - 4 weeks */}
        {[0, 1, 2, 3].map((weekIdx) => (
          <View key={weekIdx} style={styles.streakWeekRow}>
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const today = new Date();
              const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

              // Calculate date for this cell (week 3 = current week, dayIdx matches Mon-Sun)
              const daysFromToday = (3 - weekIdx) * 7 + (currentDayOfWeek - dayIdx);
              const cellDate = new Date(today);
              cellDate.setDate(today.getDate() - daysFromToday);
              const cellDateStr = getLocalDateString(cellDate);

              const isToday = daysFromToday === 0;
              const isFuture = daysFromToday < 0;

              // Check if date is before account creation (use auth user's created_at)
              const accountCreated = user?.created_at ? new Date(user.created_at) : null;
              const isBeforeAccount = accountCreated && cellDate < new Date(accountCreated.toDateString());

              // Find nutrition data for this date
              const dayData = nutritionHistory.find(d => d.log_date === cellDateStr);
              const hasData = dayData && dayData.total_calories > 0;
              const metGoal = hasData && dayData.total_calories >= nutritionGoals.calories * 0.9; // 90% of goal = met

              return (
                <View
                  key={dayIdx}
                  style={[
                    styles.streakDay,
                    (isFuture || isBeforeAccount) ? styles.streakDayFuture :
                      hasData ? (metGoal ? styles.streakDayMet : styles.streakDayMissed) :
                      styles.streakDayNoData,
                    isToday && styles.streakDayToday,
                  ]}
                />
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={styles.streakLegend}>
          <View style={styles.streakLegendItem}>
            <View style={[styles.streakLegendBox, styles.streakDayMet]} />
            <Text style={styles.streakLegendText}>Goal met</Text>
          </View>
          <View style={styles.streakLegendItem}>
            <View style={[styles.streakLegendBox, styles.streakDayMissed]} />
            <Text style={styles.streakLegendText}>Missed</Text>
          </View>
          <View style={styles.streakLegendItem}>
            <View style={[styles.streakLegendBox, styles.streakDayNoData]} />
            <Text style={styles.streakLegendText}>No data</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderMealsTab = () => {
    const caloriesOver = caloriesIntake > nutritionGoals.calories;
    const caloriesLeft = caloriesOver ? caloriesIntake - nutritionGoals.calories : nutritionGoals.calories - caloriesIntake;
    const proteinOver = proteinIntake > nutritionGoals.protein;
    const proteinLeft = proteinOver ? proteinIntake - nutritionGoals.protein : nutritionGoals.protein - proteinIntake;

    return (
      <>
        {/* REMAINING TODAY Section */}
        <View style={styles.remainingHeader}>
          <Text style={styles.remainingTitle}>REMAINING TODAY</Text>
          <TouchableOpacity
            style={styles.adjustedBadge}
            onPress={() => setShowAdjustedInfo(true)}
          >
            <Text style={styles.adjustedBadgeText}>adjusted</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.remainingCardsRow}>
          <View style={styles.remainingCard}>
            <Text style={[styles.remainingValue, caloriesOver && { color: COLORS.warning }]}>
              {caloriesOver ? `+${caloriesLeft}` : caloriesLeft}
            </Text>
            <Text style={styles.remainingLabel}>{caloriesOver ? 'calories over' : 'calories left'}</Text>
          </View>
          <View style={styles.remainingCard}>
            <Text style={[styles.remainingValue, { color: proteinOver ? COLORS.success : COLORS.primary }]}>
              {proteinOver ? `+${proteinLeft}g` : `${proteinLeft}g`}
            </Text>
            <Text style={styles.remainingLabel}>{proteinOver ? 'protein extra' : 'protein left'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.mealsStatsRow}>
          <View style={styles.mealsStat}>
            <Text style={styles.mealsStatValue}>{caloriesIntake}</Text>
            <Text style={styles.mealsStatLabel}>eaten</Text>
          </View>
          <View style={styles.mealsStat}>
            <Text style={styles.mealsStatValue}>{proteinIntake}g</Text>
            <Text style={styles.mealsStatLabel}>protein</Text>
          </View>
          <View style={styles.mealsStat}>
            <Text style={styles.mealsStatValue}>{carbsIntake}g</Text>
            <Text style={styles.mealsStatLabel}>carbs</Text>
          </View>
        </View>

        {/* Add Meal Button */}
        <TouchableOpacity
          style={styles.addMealWithMacrosBtn}
          onPress={() => setShowAddMeal(true)}
        >
          <Plus size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.addMealWithMacrosText}>Add Meal with Macros</Text>
        </TouchableOpacity>

        {/* TODAY'S MEALS */}
        <Text style={styles.sectionLabel}>TODAY'S MEALS</Text>

        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Utensils size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>No meals logged today</Text>
            <Text style={styles.emptyStateSubtext}>Tap "Add Meal" to get started</Text>
          </View>
        ) : (
          meals.slice().reverse().map((meal) => (
            <View key={meal.id} style={styles.mealCardNew}>
              <View style={styles.mealCardLeft}>
                <Text style={styles.mealCardName}>{meal.name}</Text>
                <Text style={styles.mealCardTime}>
                  {new Date(meal.logged_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }).toLowerCase()}
                </Text>
                <View style={styles.mealCardMacros}>
                  <View style={styles.mealCardMacroItem}>
                    <View style={[styles.mealCardMacroDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={styles.mealCardMacroText}>{meal.protein}g P</Text>
                  </View>
                  <View style={styles.mealCardMacroItem}>
                    <View style={[styles.mealCardMacroDot, { backgroundColor: COLORS.warning }]} />
                    <Text style={styles.mealCardMacroText}>{meal.carbs}g C</Text>
                  </View>
                </View>
              </View>
              <View style={styles.mealCardRight}>
                <Text style={styles.mealCardCalValue}>{meal.calories}</Text>
                <Text style={styles.mealCardCalLabel}>kcal</Text>
                <TouchableOpacity
                  style={styles.mealDeleteBtn}
                  onPress={() => handleDeleteMeal(meal)}
                  onClick={() => handleDeleteMeal(meal)}
                >
                  <X size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* PROTEIN STREAK */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PROTEIN STREAK</Text>
        <View style={styles.streakCalendarCard}>
          {/* Week day headers */}
          <View style={styles.streakWeekHeader}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.streakDayLabel}>{day}</Text>
            ))}
          </View>

          {/* Calendar grid - 4 weeks - showing no data state */}
          {[0, 1, 2, 3].map((weekIdx) => (
            <View key={weekIdx} style={styles.streakWeekRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const today = new Date();
                const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
                const isToday = weekIdx === 3 && dayIdx === currentDayOfWeek;

                return (
                  <View
                    key={dayIdx}
                    style={[
                      styles.streakDay,
                      styles.streakDayNoData,
                      isToday && styles.streakDayToday,
                    ]}
                  />
                );
              })}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.streakLegend}>
            <View style={styles.streakLegendItem}>
              <View style={[styles.streakLegendBox, styles.streakDayMet]} />
              <Text style={styles.streakLegendText}>Goal met</Text>
            </View>
            <View style={styles.streakLegendItem}>
              <View style={[styles.streakLegendBox, styles.streakDayMissed]} />
              <Text style={styles.streakLegendText}>Missed</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderWaterTab = () => {
    const waterGoalL = (nutritionGoals.water / 1000).toFixed(1);
    const waterIntakeL = (waterIntake / 1000).toFixed(1);
    const waterLeftL = Math.max(0, (nutritionGoals.water - waterIntake) / 1000).toFixed(1);

    return (
      <>
        {/* Water Progress */}
        <View style={styles.waterProgressCard}>
          <View style={styles.waterProgressHeader}>
            <Text style={[styles.waterProgressTitle, waterComplete && { color: COLORS.success }]}>
              {waterComplete ? "Goal Reached!" : "Today's Water"}
            </Text>
          </View>
          <View style={styles.waterProgressStats}>
            <View style={styles.waterProgressStat}>
              <Text style={[styles.waterProgressValue, { color: waterComplete ? COLORS.success : COLORS.water }]}>{waterIntakeL}L</Text>
              <Text style={styles.waterProgressLabel}>consumed</Text>
            </View>
            <View style={styles.waterProgressStat}>
              <Text style={styles.waterProgressValue}>{waterLeftL}L</Text>
              <Text style={styles.waterProgressLabel}>remaining</Text>
            </View>
            <View style={styles.waterProgressStat}>
              {showWaterGoalEdit ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <TextInput
                    style={{
                      color: COLORS.text,
                      fontSize: 20,
                      fontWeight: '700',
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.water,
                      width: 50,
                      textAlign: 'center',
                      paddingVertical: 2,
                    }}
                    value={waterGoalInput}
                    onChangeText={setWaterGoalInput}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                  <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700' }}>L</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      const liters = parseFloat(waterGoalInput);
                      if (!liters || liters <= 0 || liters > 20) {
                        showToast('Enter a value between 0.1 and 20 liters', 'error');
                        return;
                      }
                      const ml = Math.round(liters * 1000);
                      await profileService.updateProfile(user.id, { water_goal: ml });
                      await refreshProfile();
                      setShowWaterGoalEdit(false);
                      showToast(`Water goal set to ${liters}L`);
                    }}
                    onClick={async () => {
                      const liters = parseFloat(waterGoalInput);
                      if (!liters || liters <= 0 || liters > 20) {
                        showToast('Enter a value between 0.1 and 20 liters', 'error');
                        return;
                      }
                      const ml = Math.round(liters * 1000);
                      await profileService.updateProfile(user.id, { water_goal: ml });
                      await refreshProfile();
                      setShowWaterGoalEdit(false);
                      showToast(`Water goal set to ${liters}L`);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Text style={{ color: COLORS.success, fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowWaterGoalEdit(false)}
                    onClick={() => setShowWaterGoalEdit(false)}
                    style={{ marginLeft: 8 }}
                  >
                    <Text style={{ color: COLORS.error, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setWaterGoalInput(waterGoalL);
                    setShowWaterGoalEdit(true);
                  }}
                  onClick={() => {
                    setWaterGoalInput(waterGoalL);
                    setShowWaterGoalEdit(true);
                  }}
                >
                  <Text style={styles.waterProgressValue}>{waterGoalL}L</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.waterProgressLabel}>goal</Text>
            </View>
          </View>
          <View style={styles.waterProgressBar}>
            <View
              style={[
                styles.waterProgressFill,
                { width: `${Math.min(100, (waterIntake / nutritionGoals.water) * 100)}%` }
              ]}
            />
          </View>
        </View>

        {/* Quick Add Buttons */}
        <Text style={styles.sectionLabel}>QUICK ADD</Text>
        <View style={styles.waterQuickAddRow}>
          {[100, 250, 500, 1000].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.waterQuickAddBtn}
              onPress={() => handleAddWater(amount)}
              onClick={() => handleAddWater(amount)}
            >
              <Text style={styles.waterQuickAddText}>
                +{amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Add Button */}
        <TouchableOpacity
          style={styles.waterCustomAddBtn}
          onPress={() => setShowWaterEntry(true)}
          onClick={() => setShowWaterEntry(true)}
        >
          <Text style={styles.waterCustomAddText}>+ Add Custom Amount</Text>
        </TouchableOpacity>

        {/* Today's Water Log */}
        <Text style={styles.sectionLabel}>TODAY'S WATER LOG</Text>
        {waterEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No water logged today</Text>
            <Text style={styles.emptyStateSubtext}>Use the quick add buttons above</Text>
          </View>
        ) : (
          waterEntries.map((entry) => (
            <View key={entry.id} style={styles.waterLogEntry}>
              <View style={styles.waterLogInfo}>
                <Text style={styles.waterLogAmount}>{formatWaterAmount(entry.amount)}</Text>
                <Text style={styles.waterLogTime}>{formatTime(entry.timestamp)}</Text>
              </View>
              <TouchableOpacity
                style={styles.waterLogDeleteBtn}
                onPress={() => handleDeleteWater(entry)}
                onClick={() => handleDeleteWater(entry)}
              >
                <Text style={{ color: COLORS.error, fontSize: 14 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Weekly Water Chart */}
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.waterWeekChart}>
          {/* Y-Axis Labels */}
          <View style={styles.waterWeekYAxis}>
            <Text style={styles.waterWeekYLabel}>{(nutritionGoals.water / 1000).toFixed(1)}L</Text>
            <Text style={styles.waterWeekYLabel}>{(nutritionGoals.water / 2000).toFixed(1)}L</Text>
            <Text style={styles.waterWeekYLabel}>0</Text>
          </View>

          {/* Chart Area */}
          <View style={styles.waterWeekChartArea}>
            {/* Goal Line (dotted) */}
            <View style={styles.waterWeekGoalLine}>
              {[...Array(20)].map((_, i) => (
                <View key={i} style={styles.waterWeekGoalDash} />
              ))}
            </View>

            {/* Bars */}
            <View style={styles.waterWeekBars}>
              {(() => {
                const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                const today = new Date();
                const dayOfWeek = today.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

                return days.map((day, idx) => {
                  const date = new Date(today);
                  date.setDate(today.getDate() + mondayOffset + idx);
                  const dateStr = getLocalDateString(date);
                  const dayData = nutritionHistory.find(d => d.log_date === dateStr);
                  const intake = dayData?.water_intake || 0;
                  const percent = Math.min(100, (intake / nutritionGoals.water) * 100);
                  const isToday = date.toDateString() === today.toDateString();
                  const isFuture = date > today;

                  return (
                    <View key={idx} style={styles.waterWeekDay}>
                      <View style={styles.waterWeekBarContainer}>
                        <View
                          style={[
                            styles.waterWeekBar,
                            { height: `${percent}%` },
                            percent >= 100 && styles.waterWeekBarComplete,
                            isFuture && { opacity: 0.3 },
                          ]}
                        />
                      </View>
                      <Text style={[
                        styles.waterWeekLabel,
                        isToday && { color: COLORS.primary, fontWeight: '700' }
                      ]}>{day}</Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderSupplementsTab = () => (
    <>
      <Text style={styles.sectionLabel}>TODAY'S PROGRESS</Text>
      <View style={styles.supplementProgressCard}>
        <Text style={styles.supplementProgressText}>
          {takenSupplements}/{totalSupplements} taken
        </Text>
        <View style={styles.supplementProgressBar}>
          <View
            style={[
              styles.supplementProgressFill,
              { width: `${totalSupplements > 0 ? (takenSupplements / totalSupplements) * 100 : 0}%` }
            ]}
          />
        </View>
        <Text style={styles.supplementProgressSubtext}>
          {supplements.length === 0
            ? 'Add supplements to start tracking'
            : takenSupplements >= totalSupplements
              ? 'All supplements taken!'
              : `${totalSupplements - takenSupplements} remaining`}
        </Text>
      </View>

      <View style={styles.supplementsHeader}>
        <Text style={styles.sectionLabel}>MY SUPPLEMENTS</Text>
        <TouchableOpacity style={styles.addSupplementBtn} onPress={() => setShowAddSupplement(true)}>
          <Plus size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {supplements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No supplements added</Text>
          <TouchableOpacity onPress={() => setShowAddSupplement(true)}>
            <Text style={[styles.emptyStateSubtext, { color: COLORS.primary }]}>Add your first supplement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        supplements.map((supp) => {
          const timesPerDay = supp.times_per_day || 1;
          const takenCount = supp.takenCount || 0;
          const isComplete = takenCount >= timesPerDay;
          const isPartial = takenCount > 0 && takenCount < timesPerDay;

          return (
            <View key={supp.id} style={[styles.supplementCard, isComplete && styles.supplementCardComplete]}>
              <TouchableOpacity
                style={styles.supplementMainArea}
                onPress={() => handleSupplementTaken(supp)}
                disabled={isComplete}
              >
                <View style={[
                  styles.supplementCheck,
                  isPartial && styles.supplementCheckPartial,
                  isComplete && styles.supplementCheckComplete
                ]}>
                  {isComplete ? (
                    <Check size={14} color={COLORS.background} />
                  ) : timesPerDay > 1 ? (
                    <Text style={styles.supplementCheckText}>{takenCount}/{timesPerDay}</Text>
                  ) : null}
                </View>
                <View style={styles.supplementInfo}>
                  <Text style={styles.supplementName}>{supp.name}</Text>
                  <Text style={styles.supplementDosage}>
                    {supp.dosage} • {timesPerDay > 1 ? `${takenCount}/${timesPerDay} today` : (isComplete ? 'Taken' : '1/day')}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.supplementActions}>
                <TouchableOpacity
                  style={styles.supplementActionBtn}
                  onPress={() => handleEditSupplement(supp)}
                >
                  <Pencil size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.supplementActionBtn}
                  onPress={() => handleDeleteSupplement(supp)}
                >
                  <Trash2 size={16} color={COLORS.error || '#EF4444'} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Add Supplement Modal */}
      {showAddSupplement && (
        <View style={styles.modalOverlay}>
          <View style={styles.supplementModal}>
            <Text style={styles.supplementModalTitle}>
              {editingSupplement ? 'Edit Supplement' : 'Add New Supplement'}
            </Text>

            {/* Supplement Name */}
            <TextInput
              style={styles.supplementInput}
              value={newSupplementName}
              onChangeText={setNewSupplementName}
              placeholder="Supplement name"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Amount and Unit Row */}
            <View style={styles.supplementAmountRow}>
              <TextInput
                style={[styles.supplementInput, { flex: 1, marginRight: 12 }]}
                value={newSupplementAmount}
                onChangeText={setNewSupplementAmount}
                placeholder="Amount"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
              <View style={styles.supplementUnitBox}>
                <Text style={styles.supplementUnitText}>{newSupplementUnit}</Text>
              </View>
            </View>

            {/* Frequency Row */}
            <View style={styles.supplementFreqRow}>
              <View style={styles.supplementFreqItem}>
                <TextInput
                  style={styles.supplementFreqInput}
                  value={newSupplementTimesPerDay}
                  onChangeText={setNewSupplementTimesPerDay}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <Text style={styles.supplementFreqLabel}>/day</Text>
              </View>
              <View style={styles.supplementFreqItem}>
                <TextInput
                  style={styles.supplementFreqInput}
                  value={newSupplementTimesPerWeek}
                  onChangeText={setNewSupplementTimesPerWeek}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <Text style={styles.supplementFreqLabel}>/week</Text>
              </View>
            </View>

            {/* Buttons Row */}
            <View style={styles.supplementBtnRow}>
              <TouchableOpacity
                style={styles.supplementCancelBtn}
                onPress={handleCancelAddSupplement}
              >
                <Text style={styles.supplementCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.supplementAddBtn}
                onPress={editingSupplement ? handleUpdateSupplement : handleAddSupplement}
              >
                <Text style={styles.supplementAddText}>
                  {editingSupplement ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );

  const renderSleepTab = () => {
    const displayDate = new Date(selectedSleepDate);
    const dateLabel = displayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    // Calculate sleep streak (consecutive days meeting goal)
    const calculateSleepStreak = () => {
      if (sleepHistory.length === 0) return 0;
      const sortedHistory = [...sleepHistory].sort((a, b) => b.date - a.date);
      let streak = 0;
      const today = new Date().getDate();

      for (let i = 0; i < sortedHistory.length; i++) {
        const entry = sortedHistory[i];
        if (entry.hours >= sleepGoal) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    const currentStreak = calculateSleepStreak();

    return (
      <>
        {/* Date Navigation */}
        <View style={styles.sleepDateNav}>
          <Text style={styles.sleepDateLabel}>{dateLabel.toUpperCase()}</Text>
          <View style={styles.sleepDateBtns}>
            <TouchableOpacity style={styles.sleepDateBtn} onPress={() => navigateSleepDate(-1)}>
              <ChevronLeft size={18} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sleepDateBtn} onPress={() => navigateSleepDate(1)}>
              <ChevronRight size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep Hours Display */}
        <View style={styles.sleepHoursRow}>
          <Text style={styles.sleepHoursValue}>{calculateSleepHours()} hrs</Text>
        </View>

        {/* Time Inputs */}
        <View style={styles.sleepTimeRowNew}>
          <View style={styles.sleepTimeBlockNew}>
            <Text style={styles.sleepTimeLabelNew}>Bed Time</Text>
            <View style={styles.sleepTimeInputsNew}>
              <TextInput
                style={styles.sleepTimeInputNew}
                value={bedTimeHour}
                onChangeText={setBedTimeHour}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
              <Text style={styles.sleepTimeColonNew}>:</Text>
              <TextInput
                style={styles.sleepTimeInputNew}
                value={bedTimeMin}
                onChangeText={setBedTimeMin}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
            </View>
          </View>

          <View style={styles.sleepTimeBlockNew}>
            <Text style={styles.sleepTimeLabelNew}>Wake Time</Text>
            <View style={styles.sleepTimeInputsNew}>
              <TextInput
                style={styles.sleepTimeInputNew}
                value={wakeTimeHour}
                onChangeText={setWakeTimeHour}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
              <Text style={styles.sleepTimeColonNew}>:</Text>
              <TextInput
                style={styles.sleepTimeInputNew}
                value={wakeTimeMin}
                onChangeText={setWakeTimeMin}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
            </View>
          </View>
        </View>

        {/* Log Button */}
        {sleepHistory.find(d => d.date === displayDate.getDate()) ? (
          <View style={styles.sleepLoggedRow}>
            <View style={styles.sleepLoggedBtn}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.sleepLoggedBtnText}>Sleep Logged</Text>
            </View>
            <TouchableOpacity
              style={styles.sleepUndoBtn}
              onPress={async () => {
                const dateStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(displayDate.getDate()).padStart(2, '0')}`;
                await sleepService.deleteSleepLog(user.id, dateStr);
                loadSleepHistory();
              }}
            >
              <Text style={styles.sleepUndoBtnText}>Undo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.sleepLogBtnNew}
            onPress={handleLogSleep}
            onClick={handleLogSleep}
          >
            <Text style={styles.sleepLogBtnTextNew}>Log Past Sleep</Text>
          </TouchableOpacity>
        )}

        {/* Stats Row */}
        <View style={styles.sleepStatsRow}>
          <View style={styles.sleepStatCard}>
            <Text style={styles.sleepStatValue}>{currentStreak}</Text>
            <Text style={styles.sleepStatLabel}>Night Streak</Text>
          </View>
          <View style={styles.sleepStatCard}>
            <Text style={styles.sleepStatValue}>{sleepGoal}h</Text>
            <Text style={styles.sleepStatLabel}>Sleep Goal</Text>
          </View>
        </View>

        {/* Sleep Chart */}
        <View style={styles.sleepChartHeader}>
          <Text style={styles.sleepChartTitle}>
            {sleepChartPeriod === '7D' ? 'LAST 7 NIGHTS' : sleepChartPeriod === '4W' ? 'LAST 4 WEEKS' : 'LAST 3 MONTHS'}
          </Text>
          <View style={styles.sleepChartPeriods}>
            {['7D', '4W', '3M'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.sleepChartPeriodBtn, sleepChartPeriod === period && styles.sleepChartPeriodBtnActive]}
                onPress={() => setSleepChartPeriod(period)}
              >
                <Text style={[styles.sleepChartPeriodText, sleepChartPeriod === period && styles.sleepChartPeriodTextActive]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sleepChartCard}>
          {(() => {
            // Build chart data from sleep history
            const today = new Date();
            const chartData = [];
            const chartLabels = [];

            if (sleepChartPeriod === '7D') {
              // Start from 7 days ago up to yesterday (skip today since tonight's sleep isn't logged yet)
              for (let i = 7; i >= 1; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                chartLabels.push(dayNames[date.getDay()]);
                const entry = sleepHistory.find(h => h.log_date === getLocalDateString(date));
                chartData.push({ hours: entry?.hours_slept || 0.1, entry });
              }
            } else {
              // Placeholder for 4W/3M
              chartLabels.push(...(sleepChartPeriod === '4W' ? ['W1', 'W2', 'W3', 'W4'] : ['M1', 'M2', 'M3']));
              chartData.push(...chartLabels.map(() => ({ hours: 0.1, entry: null })));
            }

            return (
              <>
                <LineChart
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        data: chartData.map(d => d.hours),
                        color: (opacity = 1) => COLORS.textMuted,
                        strokeWidth: 2,
                      },
                      {
                        data: Array(chartLabels.length).fill(sleepGoal),
                        color: (opacity = 1) => COLORS.textMuted + '40',
                        strokeWidth: 1,
                        withDots: false,
                      },
                    ],
                  }}
                  width={screenWidth - 32}
                  height={160}
                  chartConfig={{
                    backgroundColor: COLORS.surface,
                    backgroundGradientFrom: COLORS.surface,
                    backgroundGradientTo: COLORS.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => COLORS.textMuted,
                    labelColor: (opacity = 1) => COLORS.textMuted,
                    fillShadowGradientOpacity: 0,
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '3 3',
                      stroke: COLORS.surfaceLight,
                    },
                    propsForLabels: {
                      fontSize: 11,
                      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
                    },
                  }}
                  getDotColor={(dataPoint) =>
                    dataPoint <= 0.1 ? COLORS.textMuted + '50' : dataPoint >= sleepGoal ? COLORS.primary : '#EF4444'
                  }
                  bezier
                  withShadow={false}
                  style={{ marginLeft: -8, borderRadius: 12 }}
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  fromZero={true}
                  segments={4}
                  onDataPointClick={({ index }) => {
                    const point = chartData[index];
                    if (point?.entry) {
                      setSelectedSleepPoint(point.entry);
                    } else {
                      setSelectedSleepPoint(null);
                    }
                  }}
                />
                {/* Tooltip */}
                {selectedSleepPoint && (
                  <TouchableOpacity
                    style={styles.sleepTooltip}
                    onPress={() => setSelectedSleepPoint(null)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.sleepTooltipDate}>
                      {new Date(selectedSleepPoint.log_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.sleepTooltipHours}>{selectedSleepPoint.hours_slept?.toFixed(1) || 0}h</Text>
                    <Text style={styles.sleepTooltipTimes}>
                      {selectedSleepPoint.bed_time?.slice(0, 5) || '--:--'} - {selectedSleepPoint.wake_time?.slice(0, 5) || '--:--'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </View>

        {/* SLEEP STREAK Calendar */}
        <Text style={styles.sectionLabel}>SLEEP STREAK</Text>
        <View style={styles.sleepCalendarCard}>
          {/* Week day headers */}
          <View style={styles.sleepCalendarHeader}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.sleepCalendarDayLabel}>{day}</Text>
            ))}
          </View>

          {/* Calendar grid - generate 5 weeks showing dates */}
          {[0, 1, 2, 3, 4].map((weekIdx) => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startDayOfWeek = startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() - 1;

            return (
              <View key={weekIdx} style={styles.sleepCalendarWeek}>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const dayNumber = weekIdx * 7 + dayIdx - startDayOfWeek + 1;
                  const isValidDay = dayNumber > 0 && dayNumber <= 31;
                  const isToday = dayNumber === today.getDate();
                  const sleepEntry = sleepHistory.find(d => d.date === dayNumber);
                  const hours = sleepEntry?.hours;
                  const hasData = hours !== undefined;
                  const isGood = hours && hours >= sleepGoal;

                  return (
                    <View
                      key={dayIdx}
                      style={[
                        styles.sleepCalendarDay,
                        hasData && isGood && styles.sleepCalendarDayGood,
                        hasData && !isGood && styles.sleepCalendarDayBad,
                        !hasData && styles.sleepCalendarDayEmpty,
                        isToday && styles.sleepCalendarDayToday,
                      ]}
                    >
                      {isValidDay && (
                        <>
                          <Text style={styles.sleepCalendarDayNum}>{dayNumber}</Text>
                          <Text style={styles.sleepCalendarDayHours}>
                            {hasData ? hours.toFixed(1) : '-'}
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Legend */}
          <View style={styles.sleepCalendarLegend}>
            <View style={styles.sleepCalendarLegendItem}>
              <View style={[styles.sleepCalendarLegendBox, styles.sleepCalendarDayGood]} />
              <Text style={styles.sleepCalendarLegendText}>{sleepGoal}+ hrs</Text>
            </View>
            <View style={styles.sleepCalendarLegendItem}>
              <View style={[styles.sleepCalendarLegendBox, styles.sleepCalendarDayBad]} />
              <Text style={styles.sleepCalendarLegendText}>&lt;{sleepGoal} hrs</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Navigation Header */}
        <View style={styles.dateNavHeader}>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => navigateDate(-1)}
            onClick={() => navigateDate(-1)}
          >
            <ChevronLeft size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.dateNavCenter}>
            <Text style={styles.dateNavText}>{getDateLabel()}</Text>
          </View>
          {isToday ? (
            <View style={[styles.dateNavBtn, styles.dateNavBtnDisabled]}>
              <ChevronRight size={20} color={COLORS.border} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dateNavBtn}
              onPress={() => navigateDate(1)}
              onClick={() => navigateDate(1)}
            >
              <ChevronRight size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'meals' && renderMealsTab()}
        {activeTab === 'water' && renderWaterTab()}
        {activeTab === 'supplements' && renderSupplementsTab()}
        {activeTab === 'sleep' && renderSleepTab()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <AddMealModal
        visible={showAddMeal}
        onClose={() => setShowAddMeal(false)}
        onAdd={handleAddMeal}
      />
      <WaterEntryModal
        visible={showWaterEntry}
        onClose={() => setShowWaterEntry(false)}
        onAdd={handleAddWater}
        currentIntake={waterIntake}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      {/* Adjusted Info Modal */}
      <Modal
        visible={showAdjustedInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdjustedInfo(false)}
      >
        <TouchableOpacity
          style={styles.adjustedModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAdjustedInfo(false)}
        >
          <View style={styles.adjustedModalContent}>
            <Text style={styles.adjustedModalTitle}>Adjusted Targets</Text>
            <Text style={styles.adjustedModalText}>
              Your daily targets are adjusted based on your current goal ({nutritionMode.name}).
              {'\n\n'}
              This accounts for your activity level, workouts, and progress to help you stay on track.
              {'\n\n'}
              Base: {nutritionGoals.calories} kcal • {nutritionGoals.protein}g protein
            </Text>
            <TouchableOpacity
              style={styles.adjustedModalButton}
              onPress={() => setShowAdjustedInfo(false)}
            >
              <Text style={styles.adjustedModalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Date Navigation Header
  dateNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  dateNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavBtnDisabled: {
    opacity: 0.2,
  },
  dateNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateNavText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textOnPrimary,
  },

  // Mode Card (Fat Loss Mode)
  modeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  modeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
  },
  modeStat: {
    flex: 1,
  },
  modeStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  modeStatValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modeStatValueGreen: {
    color: COLORS.success,
  },
  modeStatValueRed: {
    color: COLORS.error,
  },
  onTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  onTrackText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  offTrackBadge: {
    borderColor: COLORS.error,
  },
  offTrackText: {
    color: COLORS.error,
  },

  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Circles Row
  circlesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  circleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  circleSettingsBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  circleContainer: {
    marginBottom: 12,
  },
  progressRingWrapper: {
    width: 110,
    height: 110,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBg: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
  },
  progressRingOverlay: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
  },
  progressDotTop: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -1,
  },
  circleInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  circleValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  circleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  circleSubtext: {
    fontSize: 13,
    marginTop: 4,
    color: COLORS.textMuted,
  },

  // Action Cards Row
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  actionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  logMealBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  logMealBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  macroRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  macroRingItem: {
    alignItems: 'center',
  },
  macroRingWrapper: {
    width: 56,
    height: 56,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroRingBg: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 5,
  },
  macroRingProgress: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 5,
  },
  macroRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRingValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  macroRingLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  macroRingSubtext: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  waterButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waterQuickBtnNew: {
    width: '47%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterQuickBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  recentInCard: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  recentEntryCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recentEntryTitleCompact: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  recentEntrySubtextCompact: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  recentDeleteBtnCompact: {
    padding: 4,
  },
  recentEmptyCompact: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Weekly Trends
  weeklyTrendsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  weeklyTrendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyTrendsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 2,
  },
  trendToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trendToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  trendToggleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  trendToggleTextActive: {
    color: COLORS.textOnPrimary,
  },
  trendDropdownTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  chartContainer: {
    marginLeft: -16,
    marginRight: -16,
  },
  chart: {
    borderRadius: 12,
  },
  noDataChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  noDataText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  noDataSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartLegendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  chartLegendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Nutrition Streak Calendar
  streakCalendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  streakWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  streakDayLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  streakWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  streakDay: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  streakDayMet: {
    backgroundColor: COLORS.primary,
  },
  streakDayMissed: {
    backgroundColor: '#EF4444',
  },
  streakDayNoData: {
    backgroundColor: COLORS.surfaceLight,
  },
  streakDayFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.3,
  },
  streakDayToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  streakLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  streakLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakLegendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  streakLegendText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // Recent Section
  recentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  recentColumn: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  recentSeeAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  recentEmpty: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  recentEmptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recentEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  recentEntryInfo: {
    flex: 1,
    marginRight: 8,
  },
  recentEntryTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  recentEntrySubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  recentEntryTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  recentDeleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.error + '15',
  },

  // Legacy styles for other tabs
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
  },
  quickActionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  macrosCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  macroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroBarLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    width: 50,
  },
  macroBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroBarValue: {
    color: COLORS.textMuted,
    fontSize: 11,
    width: 70,
    textAlign: 'right',
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addMealBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },

  // New Meals Tab Styles
  remainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  remainingTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  adjustedBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adjustedBadgeText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  adjustedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adjustedModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  adjustedModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  adjustedModalText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  adjustedModalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adjustedModalButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  remainingCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  remainingCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  remainingValue: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: 'bold',
  },
  remainingLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  mealsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mealsStat: {
    alignItems: 'center',
  },
  mealsStatValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealsStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addMealWithMacrosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
  },
  addMealWithMacrosText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  mealCardNew: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealCardLeft: {
    flex: 1,
  },
  mealCardName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealCardTime: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  mealCardMacros: {
    flexDirection: 'row',
    gap: 16,
  },
  mealCardMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealCardMacroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealCardMacroText: {
    color: COLORS.text,
    fontSize: 13,
  },
  mealCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCardCalValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  mealCardCalLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  mealDeleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  // Water Tab Styles
  waterProgressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  waterProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  waterProgressTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  waterProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  waterProgressStat: {
    alignItems: 'center',
  },
  waterProgressValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  waterProgressLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  waterProgressBar: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: COLORS.water,
    borderRadius: 4,
  },
  waterQuickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  waterQuickAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  waterQuickAddText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  waterCustomAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  waterCustomAddText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  waterLogEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  waterLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterLogInfo: {
    gap: 2,
  },
  waterLogAmount: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  waterLogTime: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  waterLogDeleteBtn: {
    padding: 8,
  },
  waterWeekChart: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 12,
    height: 160,
    marginBottom: 16,
  },
  waterWeekYAxis: {
    width: 32,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 20,
  },
  waterWeekYLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  waterWeekChartArea: {
    flex: 1,
    position: 'relative',
  },
  waterWeekGoalLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterWeekGoalDash: {
    width: 8,
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.5,
    borderRadius: 1,
  },
  waterWeekBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  waterWeekDay: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  waterWeekBarContainer: {
    flex: 1,
    width: 20,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  waterWeekBar: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  waterWeekBarComplete: {
    backgroundColor: COLORS.success,
  },
  waterWeekLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  mealMacros: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  mealCalories: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  deleteMealBtn: {
    padding: 6,
  },
  waterQuickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waterQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.water + '15',
    borderRadius: 8,
    paddingVertical: 12,
  },
  waterQuickText: {
    color: COLORS.water,
    fontSize: 12,
    fontWeight: '600',
  },
  supplementProgressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  supplementProgressText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  supplementProgressBar: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  supplementProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  supplementProgressSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  supplementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addSupplementBtn: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  supplementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  supplementCardComplete: {
    backgroundColor: COLORS.primary + '15',
  },
  supplementCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supplementCheckComplete: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  supplementCheckPartial: {
    backgroundColor: COLORS.primary + '30',
    borderColor: COLORS.primary,
  },
  supplementCheckText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  supplementInfo: {
    flex: 1,
  },
  supplementName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  supplementDosage: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  supplementStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  supplementMainArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supplementActions: {
    flexDirection: 'row',
    gap: 8,
  },
  supplementActionBtn: {
    padding: 8,
  },
  sleepDateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepDateLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sleepDateBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  sleepDateBtn: {
    padding: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  sleepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  sleepLoggedState: {
    alignItems: 'center',
    gap: 8,
  },
  sleepLoggedHours: {
    color: COLORS.sleep || COLORS.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  sleepLoggedTimes: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  sleepEditBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  sleepEditBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  sleepHoursDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 16,
  },
  sleepHoursText: {
    color: COLORS.sleep || COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sleepTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  sleepTimeBlock: {
    flex: 1,
  },
  sleepTimeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  sleepTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sleepTimeInput: {
    width: 48,
    height: 44,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sleepTimeColon: {
    color: COLORS.textMuted,
    fontSize: 20,
  },
  sleepLogBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sleepLogBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  sleepGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  sleepGoalText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // New Supplement Modal Styles
  supplementModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  supplementModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  supplementInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 12,
  },
  supplementAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplementUnitBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  supplementUnitText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  supplementFreqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    gap: 16,
  },
  supplementFreqItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplementFreqInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    width: 50,
    height: 44,
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
  },
  supplementFreqLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginLeft: 8,
  },
  supplementBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  supplementCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  supplementCancelText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  supplementAddBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  supplementAddText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },

  // New Sleep Tab Styles
  sleepLoggingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sleepLoggingText: {
    color: COLORS.text,
    fontSize: 14,
  },
  sleepHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sleepHoursValue: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  sleepTimeRowNew: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  sleepTimeBlockNew: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  sleepTimeLabelNew: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  sleepTimeInputsNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sleepTimeInputNew: {
    width: 48,
    height: 44,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sleepTimeColonNew: {
    color: COLORS.textMuted,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sleepLogBtnNew: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sleepLogBtnTextNew: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  sleepLoggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sleepLoggedBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sleepUndoBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sleepUndoBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  sleepLoggedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sleepStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  sleepStatCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sleepStatValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  sleepStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  sleepStreakCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sleepStreakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    alignItems: 'center',
    gap: 12,
  },
  sleepStreakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepStreakLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sleepStreakValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sleepStreakRight: {
    alignItems: 'flex-end',
  },
  sleepStreakGoal: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sleepStreakHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sleepChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepChartTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sleepChartPeriods: {
    flexDirection: 'row',
    gap: 8,
  },
  sleepChartPeriodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  sleepChartPeriodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  sleepChartPeriodText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sleepChartPeriodTextActive: {
    color: COLORS.textOnPrimary,
  },
  sleepChartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sleepCalendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sleepCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  sleepCalendarDayLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  sleepCalendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  sleepCalendarDay: {
    width: 36,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepCalendarDayGood: {
    backgroundColor: COLORS.primary + '40',
  },
  sleepCalendarDayBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  sleepCalendarDayEmpty: {
    backgroundColor: COLORS.surfaceLight,
  },
  sleepCalendarDayToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  sleepCalendarDayNum: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  sleepCalendarDayHours: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  sleepCalendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  sleepCalendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sleepCalendarLegendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  sleepCalendarLegendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  // Sleep Chart Tooltip
  sleepTooltip: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
    minWidth: 100,
  },
  sleepTooltipDate: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  sleepTooltipHours: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sleepTooltipTimes: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});

export default HealthScreen;
