import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { ArrowLeft, Dumbbell, Check, Clock, TrendingUp, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { supabase } from '../lib/supabase';

// Get RPE color on a green to red scale (0-10)
const getRpeColor = (rpe) => {
  const value = parseFloat(rpe) || 0;
  const clamped = Math.min(10, Math.max(0, value));
  const hue = 120 - (clamped / 10) * 120;
  return `hsl(${hue}, 70%, 45%)`;
};

const WorkoutHistoryScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [workoutToRename, setWorkoutToRename] = useState(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetails, setWorkoutDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const handleRenamePress = (workout) => {
    setWorkoutToRename(workout);
    setNewWorkoutName(workout.name);
    setRenameModalVisible(true);
  };

  const handleWorkoutPress = async (workout) => {
    setSelectedWorkout(workout);
    setDetailsLoading(true);

    try {
      // Fetch the sets for this workout session
      const { data: sets, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', workout.id)
        .order('completed_at', { ascending: true });

      if (error) {
        console.log('Error fetching workout details:', error);
        setWorkoutDetails([]);
      } else {
        // Group sets by exercise
        const exerciseMap = {};
        (sets || []).forEach(set => {
          const name = set.exercise_name || 'Unknown Exercise';
          if (!exerciseMap[name]) {
            exerciseMap[name] = {
              name,
              sets: [],
            };
          }
          exerciseMap[name].sets.push({
            setNumber: set.set_number,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            isWarmup: set.is_warmup,
          });
        });
        setWorkoutDetails(Object.values(exerciseMap));
      }
    } catch (err) {
      console.log('Error:', err);
      setWorkoutDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!workoutToRename || !newWorkoutName.trim()) return;

    try {
      const { error } = await workoutService.renameWorkoutSession(
        workoutToRename.id,
        newWorkoutName.trim()
      );

      if (!error) {
        // Update local state
        setWorkoutHistory(prev =>
          prev.map(w =>
            w.id === workoutToRename.id ? { ...w, name: newWorkoutName.trim() } : w
          )
        );
      }
    } catch (err) {
      console.log('Error renaming workout:', err);
    }

    setRenameModalVisible(false);
    setWorkoutToRename(null);
    setNewWorkoutName('');
  };

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
    const displayVolume = weightUnit === 'lbs' ? Math.round(volume * 2.205) : volume;
    if (displayVolume >= 1000) {
      return `${(displayVolume / 1000).toFixed(1)}k ${weightUnit}`;
    }
    return `${displayVolume} ${weightUnit}`;
  };

  const renderHistoryItem = ({ item }) => {
    const workoutColor = getWorkoutColor(item.name);
    const isExpanded = selectedWorkout?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleWorkoutPress(item)}
        activeOpacity={0.7}
      >
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
          <View style={styles.historyActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRenamePress(item);
              }}
            >
              <Pencil size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {isExpanded ? (
              <ChevronUp size={18} color={COLORS.primary} />
            ) : (
              <ChevronDown size={18} color={COLORS.textMuted} />
            )}
          </View>
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

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            {detailsLoading ? (
              <View style={styles.detailsLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.detailsLoadingText}>Loading exercises...</Text>
              </View>
            ) : workoutDetails && workoutDetails.length > 0 ? (
              workoutDetails.map((exercise, idx) => (
                <View key={idx} style={styles.exerciseDetail}>
                  <Text style={styles.exerciseDetailName}>{exercise.name}</Text>
                  <View style={styles.exerciseSets}>
                    {exercise.sets.map((set, setIdx) => (
                      <View key={setIdx} style={styles.setDetail}>
                        <Text style={[styles.setNumber, set.isWarmup && styles.warmupText]}>
                          {set.isWarmup ? 'W' : setIdx + 1}
                        </Text>
                        <Text style={styles.setInfo}>
                          {set.weight > 0 ? `${weightUnit === 'lbs' ? Math.round(set.weight * 2.205) : set.weight} ${weightUnit}` : 'BW'} × {set.reps}
                          {set.rpe ? <Text style={{ color: getRpeColor(set.rpe) }}> @{set.rpe}</Text> : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDetailsText}>No exercise data recorded</Text>
            )}
          </View>
        )}
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

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Workout</Text>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.renameInput}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Workout name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleRenameSubmit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
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
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  renameInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Expanded Details
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  detailsLoadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  exerciseDetail: {
    marginBottom: 12,
  },
  exerciseDetailName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  exerciseSets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  setNumber: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'center',
  },
  warmupText: {
    color: COLORS.warning,
  },
  setInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  noDetailsText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default WorkoutHistoryScreen;
