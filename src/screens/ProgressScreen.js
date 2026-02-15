import React, { useState, useEffect } from 'react';
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
import WeighInModal from '../components/WeighInModal';

const ProgressScreen = () => {
  const { user } = useAuth();
  const [chartPeriod, setChartPeriod] = useState('All');
  const [showWeighInModal, setShowWeighInModal] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      const { count } = await workoutService.getWorkoutCount(user.id);
      const { data: streakData } = await streakService.getStreakData(user.id);

      setStats({
        totalWorkouts: count || 0,
        currentStreak: streakData?.current_streak || 0,
        bestStreak: streakData?.longest_streak || 0,
      });
    } catch (error) {
      console.log('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressToGoal = () => {
    const totalChange = Math.abs(weightData.start - weightData.target);
    const currentChange = Math.abs(weightData.current - weightData.start);
    return totalChange > 0 ? Math.round((currentChange / totalChange) * 100) : 0;
  };

  const handleSaveWeighIn = (weight, unit) => {
    setWeightData(prev => ({ ...prev, current: weight }));
    setWeightHistory(prev => [...prev, { week: `W${prev.length + 1}`, weight }]);
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

  // Empty chart placeholders - will show "No data" message instead
  const caloriesChartData = null;
  const proteinChartData = null;
  const waterChartData = null;
  const sleepChartData = null;

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
          <Text style={styles.overviewCardValue}>{weightData.current > 0 ? `${weightData.current}kg` : '--'}</Text>
          <Text style={styles.overviewCardSubtext}>{weightData.target > 0 ? `Target: ${weightData.target}kg` : 'Log a weigh-in'}</Text>
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
        <TouchableOpacity style={styles.changeButton}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <Target size={24} color={COLORS.primary} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>General Fitness</Text>
            <Text style={styles.goalSubtitle}>Novice</Text>
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
          <Text style={styles.goalWeightText}>Start: {weightData.start}kg</Text>
          <Text style={[styles.goalWeightText, { color: COLORS.text, fontWeight: '600' }]}>Now: {weightData.current}kg</Text>
          <Text style={[styles.goalWeightText, { color: COLORS.success }]}>Goal: {weightData.target}kg</Text>
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
              <Text style={styles.chartGoalText}>Goal: {weightData.target}kg</Text>
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
      <Text style={styles.sectionLabel}>NUTRITION TRENDS</Text>
      <View style={styles.nutritionCard}>
        {/* Calories */}
        <View style={styles.nutritionChartSection}>
          <Text style={[styles.nutritionChartTitle, { color: COLORS.accent }]}>Calories</Text>
          <View style={styles.miniChartEmpty}>
            <Flame size={24} color={COLORS.textMuted} />
            <Text style={styles.miniChartEmptyText}>No calorie data yet</Text>
          </View>
        </View>

        {/* Protein */}
        <View style={[styles.nutritionChartSection, styles.nutritionChartBorder]}>
          <Text style={[styles.nutritionChartTitle, { color: '#EC4899' }]}>Protein</Text>
          <View style={styles.miniChartEmpty}>
            <Zap size={24} color={COLORS.textMuted} />
            <Text style={styles.miniChartEmptyText}>No protein data yet</Text>
          </View>
        </View>

        {/* Water */}
        <View style={[styles.nutritionChartSection, styles.nutritionChartBorder]}>
          <Text style={[styles.nutritionChartTitle, { color: '#06B6D4' }]}>Water</Text>
          <View style={styles.miniChartEmpty}>
            <Droplets size={24} color={COLORS.textMuted} />
            <Text style={styles.miniChartEmptyText}>No water data yet</Text>
          </View>
        </View>

        {/* Sleep */}
        <View style={[styles.nutritionChartSection, styles.nutritionChartBorder]}>
          <Text style={[styles.nutritionChartTitle, { color: '#8B5CF6' }]}>Sleep</Text>
          <View style={styles.miniChartEmpty}>
            <Moon size={24} color={COLORS.textMuted} />
            <Text style={styles.miniChartEmptyText}>No sleep data yet</Text>
          </View>
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
          <Text style={styles.measurementValue}>{weightData.current > 0 ? `${weightData.current} kg` : '--'}</Text>
        </View>
        <View style={styles.measurementRow}>
          <View style={styles.measurementLeft}>
            <View style={[styles.measurementIcon, { backgroundColor: '#4DD0E1' + '20' }]}>
              <Target size={16} color="#4DD0E1" />
            </View>
            <Text style={styles.measurementLabel}>Goal Weight</Text>
          </View>
          <Text style={styles.measurementValue}>{weightData.target > 0 ? `${weightData.target} kg` : '--'}</Text>
        </View>
        <View style={styles.measurementRow}>
          <View style={styles.measurementLeft}>
            <View style={[styles.measurementIcon, { backgroundColor: COLORS.success + '20' }]}>
              <TrendingDown size={16} color={COLORS.success} />
            </View>
            <Text style={styles.measurementLabel}>To Go</Text>
          </View>
          <Text style={styles.measurementValue}>{weightData.current > 0 && weightData.target > 0 ? `${(weightData.current - weightData.target).toFixed(1)} kg` : '--'}</Text>
        </View>
      </View>

      {/* Log Weigh-In Button */}
      <TouchableOpacity
        style={styles.logWeighInBtn}
        onPress={() => setShowWeighInModal(true)}
      >
        <Plus size={20} color={COLORS.background} />
        <Text style={styles.logWeighInText}>Log Weigh-In</Text>
      </TouchableOpacity>

      {/* WEIGH-IN HISTORY Section */}
      <Text style={styles.sectionLabel}>WEIGH-IN HISTORY</Text>
      <View style={styles.historyCard}>
        {weightHistory.length > 0 ? (
          weightHistory.slice().reverse().map((entry, index) => (
            <View key={index} style={[styles.historyRow, index < weightHistory.length - 1 && styles.historyRowBorder]}>
              <Text style={styles.historyWeek}>{entry.week}</Text>
              <Text style={styles.historyWeight}>{entry.weight} kg</Text>
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
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
  },
  logWeighInText: {
    color: COLORS.background,
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
