import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import ExerciseLink from '../components/ExerciseLink';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { EXERCISES } from '../constants/exercises';

const TIME_FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: '3months', label: '3 Months' },
];

const MUSCLE_FILTERS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Core', 'Calves',
];

const PersonalRecordsScreen = ({ navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const [personalRecords, setPersonalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('All');

  useEffect(() => {
    loadPersonalRecords();
  }, []);

  const getMuscleGroup = (exerciseName) => {
    const exercise = EXERCISES.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
    return exercise?.muscleGroup || 'Other';
  };

  const loadPersonalRecords = async () => {
    try {
      // Try to load PRs from the workout service
      const { data } = await workoutService.getPersonalRecords(user?.id);
      if (data && data.length > 0) {
        // Map database fields to display format
        const formattedPRs = data.map(pr => {
          const exerciseName = pr.exercise_name || pr.exercise || 'Unknown Exercise';
          return {
            exercise: exerciseName,
            muscleGroup: getMuscleGroup(exerciseName),
            weight: pr.weight || 0,
            reps: pr.reps || 1,
            achievedAt: pr.achieved_at ? new Date(pr.achieved_at) : new Date(),
            date: pr.achieved_at
              ? new Date(pr.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : pr.date || 'Recently',
            e1rm: pr.e1rm || calculateE1RM(pr.weight || 0, pr.reps || 1),
          };
        });
        setPersonalRecords(formattedPRs);
      } else {
        setPersonalRecords([]);
      }
    } catch (error) {
      console.log('Error loading PRs:', error);
      setPersonalRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const now = new Date();
    return personalRecords.filter(pr => {
      // Time filter
      if (timeFilter !== 'all') {
        const prDate = pr.achievedAt;
        let cutoffDate;
        if (timeFilter === 'week') {
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeFilter === 'month') {
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (timeFilter === '3months') {
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }
        if (prDate < cutoffDate) return false;
      }
      // Muscle filter
      if (muscleFilter !== 'All' && pr.muscleGroup !== muscleFilter) {
        return false;
      }
      return true;
    });
  }, [personalRecords, timeFilter, muscleFilter]);

  // Calculate estimated 1RM using Epley formula
  const calculateE1RM = (weight, reps) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const renderPRItem = ({ item }) => (
    <View style={styles.prCard}>
      <View style={styles.prLeft}>
        <View style={styles.prInfo}>
          <ExerciseLink exerciseName={item.exercise} style={styles.prExercise} />
          <Text style={styles.prDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.prRight}>
        <Text style={styles.prWeight}>{weightUnit === 'lbs' ? Math.round(item.weight * 2.205) : item.weight}{weightUnit}</Text>
        <Text style={styles.prReps}>x {item.reps} reps</Text>
      </View>
      {item.weight > 0 && item.reps > 0 && (
        <View style={styles.prE1RM}>
          <Text style={styles.prE1RMLabel}>Est. 1RM</Text>
          <Text style={styles.prE1RMValue}>{weightUnit === 'lbs' ? Math.round(calculateE1RM(item.weight, item.reps) * 2.205) : calculateE1RM(item.weight, item.reps)}{weightUnit}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No PRs Yet</Text>
      <Text style={styles.emptyText}>
        Complete workouts and lift heavier to set your first personal records. Every new best becomes a PR!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Workouts' })}
      >
        <Text style={styles.emptyButtonText}>Start Training</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Records</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Records</Text>
        <View style={{ width: 24 }} />
      </View>

      {personalRecords.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Filters Section */}
          <View style={styles.filtersContainer}>
            {/* Time Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>When</Text>
              <View style={styles.filterRow}>
                {TIME_FILTERS.map(filter => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterChip, timeFilter === filter.key && styles.filterChipActive]}
                    onPress={() => setTimeFilter(filter.key)}
                  >
                    <Text style={[styles.filterChipText, timeFilter === filter.key && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Muscle Filter */}
            <View style={[styles.filterSection, { marginBottom: 0 }]}>
              <Text style={styles.filterLabel}>Muscle Group</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {MUSCLE_FILTERS.map(muscle => (
                  <TouchableOpacity
                    key={muscle}
                    style={[styles.filterChip, muscleFilter === muscle && styles.filterChipActive]}
                    onPress={() => setMuscleFilter(muscle)}
                  >
                    <Text style={[styles.filterChipText, muscleFilter === muscle && styles.filterChipTextActive]}>
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Result count */}
          <Text style={styles.resultCount}>
            {filteredRecords.length} PR{filteredRecords.length !== 1 ? 's' : ''}
          </Text>

          {/* PR List */}
          <FlatList
            data={filteredRecords}
            keyExtractor={(item, index) => `${item.exercise}-${index}`}
            renderItem={renderPRItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.textOnPrimary,
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  prCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  prLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  prRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  prWeight: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  prReps: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  prE1RM: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  prE1RMLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  prE1RMValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: COLORS.warning + '20',
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
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalRecordsScreen;
