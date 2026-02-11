import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TrendingUp, Flame, Dumbbell, Trophy, Calendar, Target } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { streakService } from '../services/streakService';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalVolume: 0,
    thisWeekWorkouts: 0,
    thisMonthWorkouts: 0,
  });
  const [personalRecords, setPersonalRecords] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      // Load workout count
      const { count } = await workoutService.getWorkoutCount(user.id);

      // Load streak data
      const { data: streakData } = await streakService.getStreakData(user.id);

      // Load personal records
      const { data: prData } = await workoutService.getPersonalRecords(user.id);

      // Load recent workouts
      const { data: historyData } = await workoutService.getWorkoutHistory(user.id, 5);

      setStats({
        totalWorkouts: count || 0,
        currentStreak: streakData?.current_streak || 0,
        bestStreak: streakData?.longest_streak || 0,
        totalVolume: 0, // Calculate from workouts
        thisWeekWorkouts: streakData?.week_workouts || 0,
        thisMonthWorkouts: streakData?.month_workouts || 0,
      });

      if (prData) {
        // Group PRs by exercise and get the best one
        const prsByExercise = {};
        prData.forEach(pr => {
          if (!prsByExercise[pr.exercise_name] || pr.e1rm > prsByExercise[pr.exercise_name].e1rm) {
            prsByExercise[pr.exercise_name] = pr;
          }
        });
        setPersonalRecords(Object.values(prsByExercise).slice(0, 5));
      }

      if (historyData) {
        setRecentWorkouts(historyData);
      }
    } catch (error) {
      console.log('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M kg`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K kg`;
    return `${volume} kg`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Dumbbell size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Flame size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{stats.thisWeekWorkouts}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Personal Records */}
        <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
        {personalRecords.length > 0 ? (
          personalRecords.map((pr, index) => (
            <View key={index} style={styles.prCard}>
              <View style={styles.prIcon}>
                <Trophy size={18} color={COLORS.warning} />
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                <Text style={styles.prDate}>{formatDate(pr.achieved_at)}</Text>
              </View>
              <View style={styles.prStats}>
                <Text style={styles.prWeight}>{pr.weight}kg</Text>
                <Text style={styles.prReps}>x{pr.reps}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Trophy size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No personal records yet</Text>
            <Text style={styles.emptySubtext}>Complete workouts to set PRs</Text>
          </View>
        )}

        {/* Recent Workouts */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>RECENT WORKOUTS</Text>
        {recentWorkouts.length > 0 ? (
          recentWorkouts.map((workout, index) => (
            <View key={index} style={styles.workoutCard}>
              <View style={styles.workoutIcon}>
                <Dumbbell size={18} color={COLORS.primary} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{workout.workout_name || 'Workout'}</Text>
                <Text style={styles.workoutDate}>{formatDate(workout.started_at)}</Text>
              </View>
              <View style={styles.workoutStats}>
                {workout.duration_minutes && (
                  <Text style={styles.workoutDuration}>{workout.duration_minutes} min</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Dumbbell size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Start your first workout!</Text>
          </View>
        )}

        {/* Trends Placeholder */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TRENDS</Text>
        <View style={styles.trendsCard}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>This Week</Text>
            <View style={styles.trendBar}>
              <View
                style={[
                  styles.trendFill,
                  { width: `${Math.min((stats.thisWeekWorkouts / 5) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.trendValue}>{stats.thisWeekWorkouts}/5 workouts</Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>This Month</Text>
            <View style={styles.trendBar}>
              <View
                style={[
                  styles.trendFill,
                  { width: `${Math.min((stats.thisMonthWorkouts / 20) * 100, 100)}%`, backgroundColor: COLORS.success },
                ]}
              />
            </View>
            <Text style={styles.trendValue}>{stats.thisMonthWorkouts}/20 workouts</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  prCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  prDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  prStats: {
    alignItems: 'flex-end',
  },
  prWeight: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  prReps: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  workoutDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  trendsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  trendItem: {},
  trendLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  trendBar: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  trendValue: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProgressScreen;
