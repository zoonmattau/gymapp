import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const TIME_PERIODS = [
  { key: '1w', label: '1W', days: 7 },
  { key: '4w', label: '4W', days: 28 },
  { key: '3m', label: '3M', days: 90 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'all', label: 'All', days: null },
];

const ExerciseHistoryScreen = ({ route, navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const screenWidth = Dimensions.get('window').width;

  const { exerciseName } = route.params;
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('3m');
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [historyData, setHistoryData] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState({});

  const METRICS = [
    { key: 'weight', label: 'Weight' },
    { key: 'volume', label: 'Volume' },
    { key: 'sets', label: 'Sets' },
    { key: 'reps', label: 'Reps' },
  ];

  useEffect(() => {
    loadExerciseHistory();
  }, [exerciseName, selectedPeriod]);

  const loadExerciseHistory = async () => {
    if (!user?.id || !exerciseName) return;
    setLoading(true);

    try {
      const period = TIME_PERIODS.find(p => p.key === selectedPeriod);

      // First get user's completed sessions
      let sessionsQuery = supabase
        .from('workout_sessions')
        .select('id, workout_name, started_at, ended_at')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false });

      if (period?.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period.days);
        sessionsQuery = sessionsQuery.gte('started_at', startDate.toISOString());
      }

      const { data: sessions, error: sessionsError } = await sessionsQuery;

      if (sessionsError || !sessions?.length) {
        console.log('No sessions found:', sessionsError);
        setHistoryData([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map(s => s.id);
      const sessionMap = {};
      sessions.forEach(s => {
        sessionMap[s.id] = s;
      });

      // Then get sets for this exercise from those sessions
      const { data, error } = await supabase
        .from('workout_sets')
        .select('id, session_id, weight, reps, rpe, set_number, is_warmup')
        .eq('exercise_name', exerciseName)
        .in('session_id', sessionIds);

      if (error) {
        console.error('Error loading exercise history:', error);
        setHistoryData([]);
      } else {
        // Group sets by session
        const setsGrouped = {};
        (data || []).forEach(set => {
          const sessionId = set.session_id;
          const sessionInfo = sessionMap[sessionId];
          if (!sessionInfo) return;

          if (!setsGrouped[sessionId]) {
            setsGrouped[sessionId] = {
              sessionId,
              workoutName: sessionInfo.workout_name || 'Workout',
              date: sessionInfo.started_at,
              sets: [],
            };
          }
          setsGrouped[sessionId].sets.push({
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            setNumber: set.set_number,
            isWarmup: set.is_warmup,
          });
        });

        // Convert to array and sort by date
        const sessionsWithSets = Object.values(setsGrouped)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Sort sets within each session
        sessionsWithSets.forEach(session => {
          session.sets.sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0));
          // Calculate best set (highest weight, then most reps)
          const workingSets = session.sets.filter(s => !s.isWarmup && s.weight > 0);
          if (workingSets.length > 0) {
            session.bestSet = workingSets.reduce((best, set) => {
              if (set.weight > best.weight) return set;
              if (set.weight === best.weight && set.reps > best.reps) return set;
              return best;
            }, workingSets[0]);
          }
        });

        setHistoryData(sessionsWithSets);
      }
    } catch (err) {
      console.error('Error loading exercise history:', err);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const navigateToWorkout = async (sessionId, workoutName) => {
    // Fetch workout sets to build summary
    try {
      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', sessionId)
        .order('exercise_name')
        .order('set_number');

      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      // Group sets by exercise
      const exerciseMap = {};
      (setsData || []).forEach(set => {
        if (!exerciseMap[set.exercise_name]) {
          exerciseMap[set.exercise_name] = {
            name: set.exercise_name,
            sets: [],
          };
        }
        exerciseMap[set.exercise_name].sets.push({
          id: set.id,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          completed: true,
          isWarmup: set.is_warmup,
        });
      });

      const formattedExercises = Object.values(exerciseMap);
      const durationMins = sessionData?.duration_minutes ||
        (sessionData?.ended_at && sessionData?.started_at
          ? Math.round((new Date(sessionData.ended_at) - new Date(sessionData.started_at)) / 60000)
          : 0);

      navigation.navigate('WorkoutSummary', {
        summary: {
          sessionId,
          workoutName: workoutName || 'Workout',
          duration: durationMins * 60,
          totalSets: formattedExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
          completedSets: formattedExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
          exercises: formattedExercises,
          totalVolume: sessionData?.total_volume || 0,
          newPRs: [],
          isFromHistory: true,
        },
      });
    } catch (err) {
      console.error('Error navigating to workout:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatWeight = (weight) => {
    if (weightUnit === 'lbs') {
      return Math.round(weight * 2.205);
    }
    return weight;
  };

  // Get metric value for a session
  const getMetricValue = (session) => {
    const workingSets = session.sets.filter(s => !s.isWarmup);
    switch (selectedMetric) {
      case 'weight':
        return session.bestSet ? Math.round(formatWeight(session.bestSet.weight)) : 0;
      case 'volume':
        return Math.round(formatWeight(workingSets.reduce((sum, s) => sum + (s.weight * s.reps), 0)));
      case 'sets':
        return workingSets.length;
      case 'reps':
        return workingSets.reduce((sum, s) => sum + (s.reps || 0), 0);
      default:
        return 0;
    }
  };

  // Get metric value for a single set (1W view)
  const getSetMetricValue = (set) => {
    switch (selectedMetric) {
      case 'weight':
        return Math.round(formatWeight(set.weight));
      case 'volume':
        return Math.round(formatWeight(set.weight * set.reps));
      case 'sets':
        return 1;
      case 'reps':
        return set.reps;
      default:
        return 0;
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (historyData.length === 0) {
      return null;
    }

    // For 1W with weight/volume: show all sets, otherwise show per workout
    if (selectedPeriod === '1w' && (selectedMetric === 'weight' || selectedMetric === 'volume')) {
      const allSets = [];
      historyData.forEach(session => {
        const workingSets = session.sets.filter(s => !s.isWarmup && s.weight > 0 && s.reps > 0);
        workingSets.forEach(set => {
          allSets.push({
            date: session.date,
            value: getSetMetricValue(set),
          });
        });
      });

      if (allSets.length === 0) {
        return null;
      }

      allSets.sort((a, b) => new Date(a.date) - new Date(b.date));
      const chartSets = allSets.slice(-20);

      if (chartSets.length === 1) {
        return {
          labels: [''],
          datasets: [{ data: [chartSets[0].value] }],
          singlePoint: true,
        };
      }

      return {
        labels: chartSets.map(() => ''),
        datasets: [{ data: chartSets.map(s => s.value) }],
      };
    }

    // For other periods/metrics: show per workout
    const chartSessions = historyData
      .filter(s => getMetricValue(s) > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12);

    if (chartSessions.length === 0) {
      return null;
    }

    if (chartSessions.length === 1) {
      const session = chartSessions[0];
      const d = new Date(session.date);
      return {
        labels: [`${d.getMonth() + 1}/${d.getDate()}`],
        datasets: [{ data: [getMetricValue(session)] }],
        singlePoint: true,
      };
    }

    const labels = chartSessions.map(s => {
      const d = new Date(s.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const data = chartSessions.map(s => getMetricValue(s));

    return {
      labels,
      datasets: [{ data }],
    };
  };

  const chartData = getChartData();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{exerciseName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          {TIME_PERIODS.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : historyData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No History</Text>
            <Text style={styles.emptyText}>
              Complete workouts with {exerciseName} to see your progress here.
            </Text>
          </View>
        ) : (
          <>
            {/* Chart */}
            {chartData && !chartData.singlePoint && (() => {
              const dataValues = chartData.datasets[0].data;
              const minVal = Math.min(...dataValues);
              const maxVal = Math.max(...dataValues);
              const range = maxVal - minVal || 1;
              const padding = Math.max(range * 0.15, 2);
              const segments = range < 5 ? 2 : 4;

              // Add padding to data range
              const paddedData = {
                ...chartData,
                datasets: [{
                  ...chartData.datasets[0],
                  data: chartData.datasets[0].data,
                  withDots: true,
                }],
              };

              // Track shown labels to avoid duplicates
              const shownLabels = new Set();

              return (
                <View style={styles.chartContainer}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>
                      {selectedMetric === 'weight' ? `Weight (${weightUnit})` :
                       selectedMetric === 'volume' ? `Volume (${weightUnit})` :
                       selectedMetric === 'sets' ? 'Sets' : 'Reps'}
                    </Text>
                    <View style={styles.metricSelector}>
                      {METRICS.map(metric => (
                        <TouchableOpacity
                          key={metric.key}
                          style={[
                            styles.metricButton,
                            selectedMetric === metric.key && styles.metricButtonActive,
                          ]}
                          onPress={() => setSelectedMetric(metric.key)}
                        >
                          <Text style={[
                            styles.metricButtonText,
                            selectedMetric === metric.key && styles.metricButtonTextActive,
                          ]}>
                            {metric.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <LineChart
                    data={paddedData}
                    width={screenWidth - 32}
                    height={200}
                    segments={segments}
                    fromZero={false}
                    yAxisInterval={1}
                    formatYLabel={(value) => {
                      const rounded = Math.round(parseFloat(value));
                      if (shownLabels.has(rounded)) {
                        return '';
                      }
                      shownLabels.add(rounded);
                      return rounded.toString();
                    }}
                    chartConfig={{
                      backgroundColor: COLORS.surface,
                      backgroundGradientFrom: COLORS.surface,
                      backgroundGradientTo: COLORS.surface,
                      decimalPlaces: 0,
                      color: (opacity = 1) => COLORS.primary,
                      labelColor: (opacity = 1) => COLORS.textMuted,
                      style: { borderRadius: 16 },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: COLORS.primary,
                      },
                      propsForBackgroundLines: {
                        stroke: COLORS.surfaceLight,
                      },
                      paddingRight: 16,
                      paddingTop: 16,
                    }}
                    bezier
                    withVerticalLines={false}
                    style={styles.chart}
                  />
                </View>
              );
            })()}
            {chartData?.singlePoint && (
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>
                    {selectedMetric === 'weight' ? `Weight (${weightUnit})` :
                     selectedMetric === 'volume' ? `Volume (${weightUnit})` :
                     selectedMetric === 'sets' ? 'Sets' : 'Reps'}
                  </Text>
                  <View style={styles.metricSelector}>
                    {METRICS.map(metric => (
                      <TouchableOpacity
                        key={metric.key}
                        style={[
                          styles.metricButton,
                          selectedMetric === metric.key && styles.metricButtonActive,
                        ]}
                        onPress={() => setSelectedMetric(metric.key)}
                      >
                        <Text style={[
                          styles.metricButtonText,
                          selectedMetric === metric.key && styles.metricButtonTextActive,
                        ]}>
                          {metric.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.singlePointContainer}>
                  <Text style={styles.singlePointValue}>{chartData.datasets[0].data[0]}</Text>
                  <Text style={styles.singlePointLabel}>{chartData.labels[0]}</Text>
                  <Text style={styles.singlePointHint}>Complete more workouts to see progress chart</Text>
                </View>
              </View>
            )}

            {/* Stats Summary */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{historyData.length}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {historyData.reduce((sum, s) => sum + s.sets.filter(set => !set.isWarmup).length, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
              {historyData[0]?.bestSet && (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {formatWeight(historyData[0].bestSet.weight)}
                  </Text>
                  <Text style={styles.statLabel}>Last ({weightUnit})</Text>
                </View>
              )}
            </View>

            {/* Session History */}
            <Text style={styles.sectionTitle}>Workout History</Text>
            {historyData.map(session => {
              const isExpanded = expandedSessions[session.sessionId];
              const workingSets = session.sets.filter(s => !s.isWarmup);

              return (
                <View key={session.sessionId} style={styles.sessionCard}>
                  <TouchableOpacity
                    style={styles.sessionHeader}
                    onPress={() => toggleSession(session.sessionId)}
                  >
                    <View style={styles.sessionInfo}>
                      <TouchableOpacity
                        onPress={() => navigateToWorkout(session.sessionId, session.workoutName, session.date)}
                      >
                        <Text style={styles.sessionName}>{session.workoutName}</Text>
                      </TouchableOpacity>
                      <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                    </View>
                    <View style={styles.sessionSummary}>
                      {session.bestSet && (
                        <Text style={styles.sessionBest}>
                          {formatWeight(session.bestSet.weight)}{weightUnit} x {session.bestSet.reps}
                        </Text>
                      )}
                      <Text style={styles.sessionSets}>{workingSets.length} sets</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={COLORS.textMuted} />
                    ) : (
                      <ChevronDown size={20} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.sessionSets}>
                      {session.sets.map((set, idx) => (
                        <View key={idx} style={styles.setRow}>
                          <Text style={[styles.setNumber, set.isWarmup && styles.warmupText]}>
                            {set.isWarmup ? 'W' : idx + 1 - session.sets.filter((s, i) => i < idx && s.isWarmup).length}
                          </Text>
                          <Text style={[styles.setWeight, set.isWarmup && styles.warmupText]}>
                            {formatWeight(set.weight)} {weightUnit}
                          </Text>
                          <Text style={[styles.setReps, set.isWarmup && styles.warmupText]}>
                            {set.reps} reps
                          </Text>
                          {set.rpe && (
                            <Text style={[styles.setRpe, set.isWarmup && styles.warmupText]}>
                              RPE {set.rpe}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: COLORS.textOnPrimary,
  },
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 2,
  },
  metricButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metricButtonActive: {
    backgroundColor: COLORS.primary,
  },
  metricButtonText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  metricButtonTextActive: {
    color: COLORS.textOnPrimary,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -8,
    marginRight: 8,
  },
  singlePointContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  singlePointValue: {
    color: COLORS.primary,
    fontSize: 48,
    fontWeight: 'bold',
  },
  singlePointLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  singlePointHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sessionSummary: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  sessionBest: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sessionSets: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  setNumber: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    width: 30,
  },
  setWeight: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  setReps: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
  },
  setRpe: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  warmupText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});

export default ExerciseHistoryScreen;
