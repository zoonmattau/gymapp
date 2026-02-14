import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  Flame,
  Droplets,
  Utensils,
  Check,
  Trash2,
  Moon,
  Pill,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Settings,
  Calendar,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { nutritionService } from '../services/nutritionService';
import { sleepService } from '../services/sleepService';
import AddMealModal from '../components/AddMealModal';
import WaterEntryModal from '../components/WaterEntryModal';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'meals', label: 'Meals' },
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trendFilter, setTrendFilter] = useState('Calories');
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);
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

  // Supplements state
  const [supplements, setSupplements] = useState([]);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementAmount, setNewSupplementAmount] = useState('');
  const [newSupplementUnit, setNewSupplementUnit] = useState('mg');
  const [newSupplementTimesPerDay, setNewSupplementTimesPerDay] = useState('1');
  const [newSupplementTimesPerWeek, setNewSupplementTimesPerWeek] = useState('7');

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

  // Modals
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showWaterEntry, setShowWaterEntry] = useState(false);

  // Goals
  const nutritionGoals = {
    calories: 3611,
    protein: 180,
    carbs: 350,
    fats: 90,
    water: 3500, // 3.5L in ml
  };

  // Nutrition mode
  const nutritionMode = {
    name: 'Fat Loss Mode',
    description: 'Stay in a calorie deficit to lose fat',
    color: '#7C2D2D', // Dark red/maroon
  };

  useEffect(() => {
    if (user?.id) {
      loadTodayNutrition();
      loadSupplements();
      loadSleepData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadSleepData();
    }
  }, [selectedSleepDate]);

  const loadTodayNutrition = async () => {
    try {
      const { data } = await nutritionService.getDailyNutrition(user.id);
      if (data) {
        setCaloriesIntake(data.total_calories || 0);
        setProteinIntake(data.total_protein || 0);
        setCarbsIntake(data.total_carbs || 0);
        setFatsIntake(data.total_fats || 0);
        setWaterIntake(data.water_intake || 0);
      }

      const { data: mealsData } = await nutritionService.getMeals(user.id);
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
      }
    } catch (error) {
      console.log('Error loading nutrition:', error);
    }
  };

  const loadSupplements = async () => {
    try {
      const { data } = await nutritionService.getSupplements(user.id);
      if (data) {
        // Get today's supplement logs
        const today = getLocalDateString();
        const { data: logs } = await nutritionService.getSupplementLogs(user.id, today);

        const supplementsWithStatus = data.map(supp => {
          const takenCount = logs?.filter(l => l.supplement_id === supp.id).length || 0;
          return {
            ...supp,
            takenCount,
            taken: takenCount > 0,
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
        await nutritionService.logMeal(user.id, meal);
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
        const today = getLocalDateString();
        await nutritionService.deleteMeal(meal.id, user.id, today);
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
    const newEntry = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
    };
    setWaterEntries(prev => [newEntry, ...prev]);
    setWaterIntake(prev => Math.min(prev + amount, 10000));

    if (user?.id) {
      try {
        await nutritionService.logWater(user.id, amount);
      } catch (error) {
        console.log('Error saving water:', error);
      }
    }
  };

  const handleDeleteWater = (entry) => {
    setWaterEntries(prev => prev.filter(e => e.id !== entry.id));
    setWaterIntake(prev => Math.max(0, prev - entry.amount));
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
    const isCurrentlyTaken = supp.taken || false;
    setSupplements(prev => prev.map(s =>
      s.id === supp.id ? { ...s, taken: !isCurrentlyTaken } : s
    ));

    if (user?.id && !isCurrentlyTaken) {
      await nutritionService.logSupplement(user.id, supp.id, getLocalDateString());
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

      // Add to sleep history for calendar display
      const sleepDate = new Date(selectedSleepDate);
      const dayOfMonth = sleepDate.getDate();
      setSleepHistory(prev => {
        // Remove any existing entry for this date
        const filtered = prev.filter(entry => entry.date !== dayOfMonth);
        return [...filtered, { date: dayOfMonth, hours: parseFloat(hours.toFixed(1)) }];
      });

      if (Platform.OS === 'web') {
        alert(`Sleep logged: ${hours.toFixed(1)} hours`);
      } else {
        Alert.alert('Success', `Sleep logged: ${hours.toFixed(1)} hours`);
      }
    } catch (error) {
      console.log('Error logging sleep:', error);
      if (Platform.OS === 'web') {
        alert('Failed to log sleep');
      } else {
        Alert.alert('Error', 'Failed to log sleep');
      }
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

  const totalSupplements = supplements.length;
  const takenSupplements = supplements.filter(s => s.taken).length;

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
          <View style={styles.modeIconContainer}>
            <Flame size={28} color="#F97316" />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>{nutritionMode.name}</Text>
            <Text style={styles.modeSubtitle}>{nutritionMode.description}</Text>
          </View>
        </View>
        <View style={styles.modeStats}>
          <View style={styles.modeStat}>
            <Text style={styles.modeStatLabel}>Daily Target (adjusted)</Text>
            <Text style={styles.modeStatValue}>{nutritionGoals.calories} kcal</Text>
          </View>
          <View style={styles.modeStat}>
            <Text style={styles.modeStatLabel}>Remaining</Text>
            <Text style={[styles.modeStatValue, styles.modeStatValueGreen]}>
              {caloriesRemaining} kcal
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
          <TouchableOpacity style={styles.circleSettingsBtn}>
            <Settings size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.circleContainer}>
            <View style={styles.progressRingWrapper}>
              {/* Background ring */}
              <View style={[styles.progressRingBg, { borderColor: COLORS.surfaceLight }]} />
              {/* Progress ring overlay */}
              <View style={[
                styles.progressRingOverlay,
                {
                  borderColor: caloriesComplete ? COLORS.success : COLORS.primary,
                  opacity: caloriesProgress > 0 ? 0.3 + (caloriesProgress / 100) * 0.7 : 0,
                }
              ]} />
              {/* Top indicator dot */}
              <View style={[
                styles.progressDotTop,
                { backgroundColor: caloriesComplete ? COLORS.success : COLORS.primary }
              ]} />
              <View style={styles.circleInner}>
                {caloriesComplete ? (
                  <Check size={24} color={COLORS.success} strokeWidth={3} />
                ) : (
                  <Flame size={22} color={caloriesProgress > 0 ? COLORS.primary : COLORS.textMuted} />
                )}
                <Text style={[
                  styles.circleValue,
                  { color: caloriesComplete ? COLORS.success : caloriesProgress > 0 ? COLORS.primary : COLORS.text }
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
          <TouchableOpacity style={styles.circleSettingsBtn}>
            <Settings size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.circleContainer}>
            <View style={styles.progressRingWrapper}>
              {/* Background ring */}
              <View style={[styles.progressRingBg, { borderColor: COLORS.surfaceLight }]} />
              {/* Progress ring overlay */}
              <View style={[
                styles.progressRingOverlay,
                {
                  borderColor: waterComplete ? COLORS.success : '#3B82F6',
                  opacity: waterProgress > 0 ? 0.3 + (waterProgress / 100) * 0.7 : 0,
                }
              ]} />
              {/* Top indicator dot */}
              <View style={[
                styles.progressDotTop,
                { backgroundColor: waterComplete ? COLORS.success : '#3B82F6' }
              ]} />
              <View style={styles.circleInner}>
                {waterComplete ? (
                  <Check size={24} color={COLORS.success} strokeWidth={3} />
                ) : (
                  <Droplets size={22} color="#3B82F6" />
                )}
                <Text style={[
                  styles.circleValue,
                  { color: waterComplete ? COLORS.success : COLORS.text }
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
            <View style={styles.actionCardIcon}>
              <Utensils size={18} color={COLORS.primary} />
            </View>
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
                <View style={[styles.macroRingBg, { borderColor: COLORS.surfaceLight }]} />
                <View style={[
                  styles.macroRingProgress,
                  {
                    borderColor: COLORS.primary,
                    opacity: proteinPercent > 0 ? 0.3 + (Math.min(proteinPercent, 100) / 100) * 0.7 : 0.2,
                  }
                ]} />
                <View style={styles.macroRingInner}>
                  <Text style={[styles.macroRingValue, { color: COLORS.primary }]}>{proteinPercent}%</Text>
                </View>
              </View>
              <Text style={styles.macroRingLabel}>Protein</Text>
              <Text style={styles.macroRingSubtext}>{proteinIntake}g / {nutritionGoals.protein}g</Text>
            </View>

            {/* Carbs Ring */}
            <View style={styles.macroRingItem}>
              <View style={styles.macroRingWrapper}>
                <View style={[styles.macroRingBg, { borderColor: COLORS.surfaceLight }]} />
                <View style={[
                  styles.macroRingProgress,
                  {
                    borderColor: COLORS.warning,
                    opacity: carbsPercent > 0 ? 0.3 + (Math.min(carbsPercent, 100) / 100) * 0.7 : 0.2,
                  }
                ]} />
                <View style={styles.macroRingInner}>
                  <Text style={[styles.macroRingValue, { color: COLORS.warning }]}>{carbsPercent}%</Text>
                </View>
              </View>
              <Text style={styles.macroRingLabel}>Carbs</Text>
              <Text style={styles.macroRingSubtext}>{carbsIntake}g / {nutritionGoals.carbs}g</Text>
            </View>
          </View>
        </View>

        {/* Quick Water Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <View style={[styles.actionCardIcon, { backgroundColor: '#3B82F6' + '20' }]}>
              <Droplets size={18} color="#3B82F6" />
            </View>
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
              <Plus size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Weekly Trends Section */}
      <View style={styles.weeklyTrendsCard}>
        <View style={styles.weeklyTrendsHeader}>
          <Text style={styles.weeklyTrendsTitle}>Weekly Trends</Text>
          <TouchableOpacity
            style={styles.trendFilterBtn}
            onPress={() => setShowTrendDropdown(!showTrendDropdown)}
          >
            <Text style={styles.trendFilterText}>{trendFilter}</Text>
            <ChevronDown size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showTrendDropdown && (
          <View style={styles.trendDropdown}>
            <TouchableOpacity
              style={[styles.trendDropdownItem, trendFilter === 'Calories' && styles.trendDropdownItemActive]}
              onPress={() => { setTrendFilter('Calories'); setShowTrendDropdown(false); }}
            >
              <Text style={[styles.trendDropdownText, trendFilter === 'Calories' && styles.trendDropdownTextActive]}>Calories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.trendDropdownItem, trendFilter === 'Hydration' && styles.trendDropdownItemActive]}
              onPress={() => { setTrendFilter('Hydration'); setShowTrendDropdown(false); }}
            >
              <Text style={[styles.trendDropdownText, trendFilter === 'Hydration' && styles.trendDropdownTextActive]}>Hydration</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: ['7w ago', '6w ago', '5w ago', '4w ago', '3w ago', 'This Week'],
              datasets: [
                {
                  data: trendFilter === 'Calories'
                    ? [0, 0, 0, 0, 800, 1200]
                    : [0, 0, 0, 0, 1.5, 2.5],
                  color: (opacity = 1) => COLORS.primary,
                  strokeWidth: 2,
                },
                {
                  data: trendFilter === 'Calories'
                    ? [2800, 2800, 2800, 2800, 2800, 2800]
                    : [3, 3, 3, 3, 3, 3],
                  color: (opacity = 1) => COLORS.success,
                  strokeWidth: 2,
                  withDots: false,
                },
              ],
            }}
            width={screenWidth - 64}
            height={180}
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: trendFilter === 'Calories' ? 0 : 1,
              color: (opacity = 1) => COLORS.primary,
              labelColor: (opacity = 1) => COLORS.textMuted,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: COLORS.primary,
              },
              propsForBackgroundLines: {
                strokeDasharray: '3 3',
                stroke: COLORS.surfaceLight,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            fromZero={true}
          />
        </View>

        {/* Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendLine, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.chartLegendText}>Avg/day</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendLine, { backgroundColor: COLORS.success }]} />
            <Text style={styles.chartLegendText}>Goal</Text>
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
              const dayNumber = weekIdx * 7 + dayIdx;
              const today = new Date();
              const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
              const isToday = weekIdx === 3 && dayIdx === currentDayOfWeek;
              // Demo data - random status
              const statuses = ['met', 'missed', 'noData'];
              const status = dayNumber > 21 + currentDayOfWeek ? 'noData' :
                            dayNumber === 21 + currentDayOfWeek ? 'met' :
                            weekIdx === 3 ? (dayIdx < currentDayOfWeek ? (Math.random() > 0.5 ? 'met' : 'missed') : 'noData') :
                            Math.random() > 0.4 ? 'met' : (Math.random() > 0.5 ? 'missed' : 'noData');

              return (
                <View
                  key={dayIdx}
                  style={[
                    styles.streakDay,
                    status === 'met' && styles.streakDayMet,
                    status === 'missed' && styles.streakDayMissed,
                    status === 'noData' && styles.streakDayNoData,
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

      {/* Recent Meals & Recent Water */}
      <View style={styles.recentRow}>
        {/* Recent Meals Column */}
        <View style={styles.recentColumn}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Meals</Text>
            <TouchableOpacity
              onPress={() => setActiveTab('meals')}
              onClick={() => setActiveTab('meals')}
            >
              <Text style={styles.recentSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {meals.length === 0 ? (
            <Text style={styles.recentEmpty}>No meals yet</Text>
          ) : (
            meals.slice(-3).reverse().map((meal) => (
              <View key={meal.id} style={styles.recentEntryCard}>
                <View style={styles.recentEntryInfo}>
                  <Text style={styles.recentEntryTitle}>{meal.name}</Text>
                  <Text style={styles.recentEntryTime}>
                    {new Date(meal.logged_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteMeal(meal)}
                  onClick={() => handleDeleteMeal(meal)}
                >
                  <X size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Recent Water Column */}
        <View style={styles.recentColumn}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Water</Text>
            <TouchableOpacity>
              <Text style={styles.recentSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {waterEntries.length === 0 ? (
            <Text style={styles.recentEmpty}>No water yet</Text>
          ) : (
            waterEntries.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.recentEntryCard}>
                <View style={styles.recentEntryInfo}>
                  <Text style={styles.recentEntryTitle}>{formatWaterAmount(entry.amount)}</Text>
                  <Text style={styles.recentEntryTime}>{formatTime(entry.timestamp)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteWater(entry)}
                  onClick={() => handleDeleteWater(entry)}
                >
                  <X size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );

  const renderMealsTab = () => {
    const caloriesLeft = Math.max(0, nutritionGoals.calories - caloriesIntake);
    const proteinLeft = Math.max(0, nutritionGoals.protein - proteinIntake);

    return (
      <>
        {/* REMAINING TODAY Section */}
        <View style={styles.remainingHeader}>
          <Text style={styles.remainingTitle}>REMAINING TODAY</Text>
          <View style={styles.adjustedBadge}>
            <Text style={styles.adjustedBadgeText}>adjusted</Text>
          </View>
        </View>

        <View style={styles.remainingCardsRow}>
          <View style={styles.remainingCard}>
            <Text style={styles.remainingValue}>{caloriesLeft}</Text>
            <Text style={styles.remainingLabel}>calories left</Text>
          </View>
          <View style={styles.remainingCard}>
            <Text style={[styles.remainingValue, { color: COLORS.primary }]}>{proteinLeft}g</Text>
            <Text style={styles.remainingLabel}>protein left</Text>
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
          <Plus size={20} color={COLORS.background} />
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

          {/* Calendar grid - 4 weeks */}
          {[0, 1, 2, 3].map((weekIdx) => (
            <View key={weekIdx} style={styles.streakWeekRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const today = new Date();
                const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
                const isToday = weekIdx === 3 && dayIdx === currentDayOfWeek;
                const isFuture = weekIdx === 3 && dayIdx > currentDayOfWeek;
                // Demo data
                const status = isFuture ? 'noData' :
                              isToday ? (proteinIntake >= nutritionGoals.protein ? 'met' : 'missed') :
                              Math.random() > 0.5 ? 'met' : 'missed';

                return (
                  <View
                    key={dayIdx}
                    style={[
                      styles.streakDay,
                      status === 'met' && styles.streakDayMet,
                      status === 'missed' && styles.streakDayMissed,
                      status === 'noData' && styles.streakDayNoData,
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

  const renderSupplementsTab = () => (
    <>
      <Text style={styles.sectionLabel}>TODAY'S PROGRESS ⚡</Text>
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
        <Text style={styles.sectionLabel}>MY SUPPLEMENTS 💊</Text>
        <TouchableOpacity style={styles.addSupplementBtn} onPress={() => setShowAddSupplement(true)}>
          <Plus size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {supplements.length === 0 ? (
        <View style={styles.emptyState}>
          <Pill size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>No supplements added</Text>
          <TouchableOpacity onPress={() => setShowAddSupplement(true)}>
            <Text style={[styles.emptyStateSubtext, { color: COLORS.primary }]}>Add your first supplement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        supplements.map((supp) => {
          const isTaken = supp.taken || false;
          return (
            <TouchableOpacity
              key={supp.id}
              style={[styles.supplementCard, isTaken && styles.supplementCardComplete]}
              onPress={() => handleSupplementTaken(supp)}
            >
              <View style={[styles.supplementCheck, isTaken && styles.supplementCheckComplete]}>
                {isTaken && <Check size={14} color={COLORS.background} />}
              </View>
              <View style={styles.supplementInfo}>
                <Text style={styles.supplementName}>{supp.name}</Text>
                <Text style={styles.supplementDosage}>
                  {supp.dosage} • {supp.times_per_day || 1}x/day
                </Text>
              </View>
              <Text style={[styles.supplementStatus, { color: isTaken ? COLORS.success : COLORS.textMuted }]}>
                {isTaken ? 'Taken' : 'Not taken'}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Add Supplement Modal */}
      {showAddSupplement && (
        <View style={styles.modalOverlay}>
          <View style={styles.supplementModal}>
            <Text style={styles.supplementModalTitle}>Add New Supplement</Text>

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
                <Text style={styles.supplementFreqLabel}>x/day</Text>
              </View>
              <View style={styles.supplementFreqItem}>
                <TextInput
                  style={styles.supplementFreqInput}
                  value={newSupplementTimesPerWeek}
                  onChangeText={setNewSupplementTimesPerWeek}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <Text style={styles.supplementFreqLabel}>x/week</Text>
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
                onPress={handleAddSupplement}
              >
                <Text style={styles.supplementAddText}>Add</Text>
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

        {/* Logging Info Banner */}
        <View style={styles.sleepLoggingBanner}>
          <Calendar size={16} color={COLORS.primary} />
          <Text style={styles.sleepLoggingText}>Logging sleep for {dateLabel}</Text>
        </View>

        {/* Sleep Hours Display */}
        <View style={styles.sleepHoursRow}>
          <Moon size={18} color={COLORS.primary} />
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
          <View style={styles.sleepLoggedBtn}>
            <Check size={20} color={COLORS.background} />
            <Text style={styles.sleepLoggedBtnText}>Sleep Logged</Text>
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

        {/* Current Streak Card */}
        <View style={styles.sleepStreakCard}>
          <View style={styles.sleepStreakLeft}>
            <View style={styles.sleepStreakIcon}>
              <Flame size={24} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.sleepStreakLabel}>Current Streak</Text>
              <Text style={styles.sleepStreakValue}>{currentStreak} nights</Text>
            </View>
          </View>
          <View style={styles.sleepStreakRight}>
            <Text style={styles.sleepStreakGoal}>Goal: {sleepGoal} hrs</Text>
            <Text style={styles.sleepStreakHint}>
              {sleepHistory.length === 0 ? 'Log sleep to start!' : `${sleepHistory.length} nights logged`}
            </Text>
          </View>
        </View>

        {/* LAST 7 NIGHTS Chart */}
        <View style={styles.sleepChartHeader}>
          <Text style={styles.sleepChartTitle}>LAST 7 NIGHTS</Text>
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
          <LineChart
            data={{
              labels: sleepChartPeriod === '7D'
                ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                : sleepChartPeriod === '4W'
                ? ['W1', 'W2', 'W3', 'W4']
                : ['M1', 'M2', 'M3'],
              datasets: [
                {
                  data: sleepChartPeriod === '7D'
                    ? sleepHistory.length > 0
                      ? [0, 1, 2, 3, 4, 5, 6].map(i => {
                          const entry = sleepHistory.find(h => h.date === new Date().getDate() - 6 + i);
                          return entry?.hours || 0;
                        })
                      : [0, 0, 0, 0, 0, 0, 0]
                    : sleepChartPeriod === '4W'
                    ? [6.5, 7.2, 6.8, 7.0]
                    : [6.8, 7.1, 7.0],
                  color: (opacity = 1) => '#8B5CF6',
                  strokeWidth: 2,
                },
                {
                  data: sleepChartPeriod === '7D'
                    ? [sleepGoal, sleepGoal, sleepGoal, sleepGoal, sleepGoal, sleepGoal, sleepGoal]
                    : sleepChartPeriod === '4W'
                    ? [sleepGoal, sleepGoal, sleepGoal, sleepGoal]
                    : [sleepGoal, sleepGoal, sleepGoal],
                  color: (opacity = 1) => COLORS.textMuted,
                  strokeWidth: 1,
                  withDots: false,
                },
              ],
            }}
            width={screenWidth - 64}
            height={160}
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => '#8B5CF6',
              labelColor: (opacity = 1) => COLORS.textMuted,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#8B5CF6',
              },
              propsForBackgroundLines: {
                strokeDasharray: '3 3',
                stroke: COLORS.surfaceLight,
              },
            }}
            bezier
            style={{ marginLeft: -16, borderRadius: 12 }}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            fromZero={true}
            segments={4}
          />
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
            <Calendar size={20} color={COLORS.textMuted} />
            <Text style={styles.dateNavText}>{getDateLabel()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.dateNavBtn, isToday && styles.dateNavBtnDisabled]}
            onPress={() => !isToday && navigateDate(1)}
            onClick={() => !isToday && navigateDate(1)}
            disabled={isToday}
          >
            <ChevronRight size={20} color={isToday ? COLORS.textMuted : COLORS.text} />
          </TouchableOpacity>
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
    opacity: 0.5,
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
    color: COLORS.text,
  },

  // Mode Card (Fat Loss Mode)
  modeCard: {
    backgroundColor: '#3D1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#5C2E2E',
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
    backgroundColor: '#5C2E2E',
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
    backgroundColor: '#2D1515',
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
    borderColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  logMealBtnText: {
    color: '#F97316',
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
  trendFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  trendFilterText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  trendDropdown: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  trendDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  trendDropdownItemActive: {
    backgroundColor: COLORS.primary + '20',
  },
  trendDropdownText: {
    color: COLORS.text,
    fontSize: 14,
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
    backgroundColor: COLORS.success + '80',
  },
  streakDayMissed: {
    backgroundColor: '#EF4444',
  },
  streakDayNoData: {
    backgroundColor: COLORS.surfaceLight,
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
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  recentEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recentEntryInfo: {
    flex: 1,
  },
  recentEntryTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  recentEntryTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
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
    color: COLORS.text,
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
    color: COLORS.background,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  sleepLogBtnTextNew: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  sleepLoggedBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sleepLoggedBtnText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  sleepStreakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sleepStreakLeft: {
    flexDirection: 'row',
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
    color: COLORS.text,
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
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
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
});

export default HealthScreen;
