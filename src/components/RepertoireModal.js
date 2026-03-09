import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Dumbbell, Play, User, Star, Clock, Trash2 } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { EXERCISES } from '../constants/exercises';

const RepertoireModal = ({
  visible,
  onClose,
  savedWorkouts,
  loading,
  onStartWorkout,
  onRemoveWorkout,
}) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Build a lookup from exercise name → muscle group
  const exerciseMuscleMap = useMemo(() => {
    const map = {};
    EXERCISES.forEach(ex => { map[ex.name.toLowerCase()] = ex.muscleGroup; });
    return map;
  }, []);

  // Derive muscle groups for each workout (from muscle_groups field OR exercise names)
  const workoutsWithGroups = useMemo(() => {
    return (savedWorkouts || []).map(w => {
      if (w.muscle_groups && w.muscle_groups.length > 0) return w;
      // Derive from exercises
      const groups = new Set();
      const exercises = Array.isArray(w.exercises) ? w.exercises : [];
      exercises.forEach(ex => {
        const name = (ex.name || '').toLowerCase();
        // Try exact match first, then partial
        if (exerciseMuscleMap[name]) {
          groups.add(exerciseMuscleMap[name]);
        } else {
          for (const [key, group] of Object.entries(exerciseMuscleMap)) {
            if (name.includes(key) || key.includes(name)) {
              groups.add(group);
              break;
            }
          }
        }
      });
      return { ...w, muscle_groups: Array.from(groups) };
    });
  }, [savedWorkouts, exerciseMuscleMap]);

  // Collect all unique muscle groups
  const muscleGroups = useMemo(() => {
    const groups = new Set();
    workoutsWithGroups.forEach(w => {
      (w.muscle_groups || []).forEach(g => groups.add(g));
    });
    return ['All', ...Array.from(groups).sort()];
  }, [workoutsWithGroups]);

  // Filter workouts by selected muscle group
  const filteredWorkouts = useMemo(() => {
    if (selectedFilter === 'All') return workoutsWithGroups;
    return workoutsWithGroups.filter(w =>
      (w.muscle_groups || []).includes(selectedFilter)
    );
  }, [workoutsWithGroups, selectedFilter]);

  const handleRemove = (workout) => {
    const doRemove = () => {
      if (onRemoveWorkout) onRemoveWorkout(workout);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${workout.name}" from your repertoire?`)) {
        doRemove();
      }
    } else {
      Alert.alert(
        'Remove Workout',
        `Remove "${workout.name}" from your repertoire?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: doRemove },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Rep-Ertoire</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Your saved and imported workouts
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (savedWorkouts || []).length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Dumbbell size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No saved workouts yet</Text>
              <Text style={styles.emptyText}>
                Import a program from Profile or save workouts from the Community tab.
              </Text>
            </View>
          ) : (
            <>
              {/* Muscle group filter chips */}
              {muscleGroups.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterRow}
                  contentContainerStyle={styles.filterRowContent}
                >
                  {muscleGroups.map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={[
                        styles.filterChip,
                        selectedFilter === group && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedFilter(group)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedFilter === group && styles.filterChipTextActive,
                      ]}>
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {filteredWorkouts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No workouts match this filter</Text>
                  </View>
                ) : (
                  filteredWorkouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={styles.workoutCard}
                      onPress={() => onStartWorkout(workout)}
                    >
                      <View style={styles.workoutHeader}>
                        <View style={styles.workoutIconBox}>
                          <Dumbbell size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.workoutInfo}>
                          <Text style={styles.workoutName}>{workout.name}</Text>
                          {workout.creator && (
                            <View style={styles.creatorRow}>
                              <User size={12} color={COLORS.textMuted} />
                              <Text style={styles.creatorText}>
                                @{workout.creator.username}
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemove(workout)}
                        >
                          <Trash2 size={16} color={COLORS.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.startButton}
                          onPress={() => onStartWorkout(workout)}
                        >
                          <Play size={16} color={COLORS.textOnPrimary} />
                        </TouchableOpacity>
                      </View>

                      {workout.description && (
                        <Text style={styles.workoutDescription} numberOfLines={2}>
                          {workout.description}
                        </Text>
                      )}

                      <View style={styles.workoutMeta}>
                        {workout.exercises && (
                          <View style={styles.metaItem}>
                            <Dumbbell size={12} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>
                              {Array.isArray(workout.exercises) ? workout.exercises.length : 0} exercises
                            </Text>
                          </View>
                        )}
                        {workout.estimated_duration && (
                          <View style={styles.metaItem}>
                            <Clock size={12} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>
                              {formatDuration(workout.estimated_duration)}
                            </Text>
                          </View>
                        )}
                        {workout.averageRating > 0 && (
                          <View style={styles.metaItem}>
                            <Star size={12} color={COLORS.warning} fill={COLORS.warning} />
                            <Text style={styles.metaText}>
                              {workout.averageRating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                          <View style={styles.tagsRow}>
                            {workout.muscle_groups.slice(0, 3).map((group, idx) => (
                              <View key={idx} style={styles.tag}>
                                <Text style={styles.tagText}>{group}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </>
          )}

          {/* Done Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Filter chips
  filterRow: {
    maxHeight: 44,
    paddingBottom: 8,
  },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
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

  content: {
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  workoutCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconBox: {
    width: 44,
    height: 44,
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
    fontSize: 15,
    fontWeight: '600',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  creatorText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RepertoireModal;
