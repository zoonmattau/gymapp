import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Dumbbell, Check, Clock, TrendingUp } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';

const WorkoutHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const { data } = await workoutService.getCompletedSessions(user?.id, 50);
      if (data && data.length > 0) {
        // Format the data for display
        const formattedHistory = data.map(session => ({
          id: session.id,
          name: session.workout_name || 'Workout',
          date: session.ended_at
            ? new Date(session.ended_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
            : 'Recently',
          duration: session.duration_minutes || Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 60000) || 0,
          exercises: session.exercise_count || 0,
          totalVolume: session.total_volume || 0,
          sets: session.total_sets || 0,
        }));
        setWorkoutHistory(formattedHistory);
      } else {
        setWorkoutHistory([]);
      }
    } catch (error) {
      console.log('Error loading workout history:', error);
      setWorkoutHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutColor = (name) => {
    const colors = {
      'Upper': COLORS.primary,
      'Lower': COLORS.success,
      'Push': COLORS.accent,
      'Pull': COLORS.warning,
      'Legs': '#EC4899',
      'Chest': COLORS.accent,
      'Back': COLORS.success,
      'Shoulders': COLORS.warning,
      'Arms': COLORS.primary,
    };

    for (const [key, color] of Object.entries(colors)) {
      if (name?.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return COLORS.primary;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${volume} kg`;
  };

  const renderHistoryItem = ({ item }) => {
    const workoutColor = getWorkoutColor(item.name);

    return (
      <TouchableOpacity style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.historyLeft}>
            <View style={[styles.historyIcon, { backgroundColor: workoutColor + '20' }]}>
              <Dumbbell size={18} color={workoutColor} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyName}>{item.name}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
          </View>
          <Check size={18} color={COLORS.success} />
        </View>
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Clock size={14} color={COLORS.textMuted} />
            <Text style={styles.historyStatText}>{item.duration} min</Text>
          </View>
          <View style={styles.historyStat}>
            <Dumbbell size={14} color={COLORS.textMuted} />
            <Text style={styles.historyStatText}>{item.exercises} exercises</Text>
          </View>
          {item.totalVolume > 0 && (
            <View style={styles.historyStat}>
              <TrendingUp size={14} color={COLORS.text} />
              <Text style={[styles.historyStatText, { color: COLORS.text, fontWeight: '600' }]}>
                {formatVolume(item.totalVolume)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Dumbbell size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyText}>
        Complete your first workout to start tracking your progress. Your workout history will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Workouts' })}
      >
        <Text style={styles.emptyButtonText}>Start a Workout</Text>
      </TouchableOpacity>
    </View>
  );

  const getTotalStats = () => {
    const totalWorkouts = workoutHistory.length;
    const totalDuration = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalVolume = workoutHistory.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    return { totalWorkouts, totalDuration, totalVolume };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Workout History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = getTotalStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
        <View style={{ width: 24 }} />
      </View>

      {workoutHistory.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.summaryLabel}>Workouts</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{Math.round(stats.totalDuration / 60)}h</Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatVolume(stats.totalVolume)}</Text>
              <Text style={styles.summaryLabel}>Volume</Text>
            </View>
          </View>

          {/* History List */}
          <FlatList
            data={workoutHistory}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutHistoryScreen;
