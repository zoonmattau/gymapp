import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import ExerciseSearchModal from '../components/ExerciseSearchModal';

const ActiveWorkoutScreen = ({ route, navigation }) => {
  const { workout, workoutName: initialName } = route?.params || {};

  const [workoutName, setWorkoutName] = useState(initialName || 'Workout');
  const [exercises, setExercises] = useState([]);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);

  // Initialize with workout exercises or empty
  useEffect(() => {
    if (workout?.exercises) {
      const initialExercises = workout.exercises.map((ex, idx) => ({
        id: idx + 1,
        name: ex.name,
        sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
          id: i + 1,
          weight: '',
          reps: '',
          completed: false,
        })),
      }));
      setExercises(initialExercises);
      setExpandedExercise(1);
    }
  }, [workout]);

  // Workout timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restTimerRef.current);
  }, [isResting, restTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addExercise = (exerciseName) => {
    const newExercise = {
      id: Date.now(),
      name: exerciseName,
      sets: [{ id: 1, weight: '', reps: '', completed: false }],
    };
    setExercises([...exercises, newExercise]);
    setExpandedExercise(newExercise.id);
  };

  const addSet = (exerciseId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSetId = ex.sets.length + 1;
        return {
          ...ex,
          sets: [...ex.sets, { id: newSetId, weight: '', reps: '', completed: false }],
        };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId, setId, field, value) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value };
            }
            return set;
          }),
        };
      }
      return ex;
    }));
  };

  const completeSet = (exerciseId, setId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, completed: !set.completed };
            }
            return set;
          }),
        };
      }
      return ex;
    }));

    // Start rest timer after completing a set
    setRestTimer(90);
    setIsResting(true);
  };

  const deleteExercise = (exerciseId) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter(ex => ex.id !== exerciseId));
          },
        },
      ]
    );
  };

  const finishWorkout = () => {
    const completedSets = exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    );
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    Alert.alert(
      'Finish Workout',
      `You completed ${completedSets}/${totalSets} sets in ${formatTime(workoutTime)}. Save workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save & Finish',
          onPress: () => {
            // TODO: Save to Supabase
            navigation.goBack();
          },
        },
      ]
    );
  };

  const cancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelWorkout} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <View style={styles.timerRow}>
            <Clock size={14} color={COLORS.textMuted} />
            <Text style={styles.timerText}>{formatTime(workoutTime)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={finishWorkout} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Rest Timer Banner */}
      {isResting && (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>Rest: {formatTime(restTimer)}</Text>
          <TouchableOpacity onPress={() => setIsResting(false)}>
            <Text style={styles.skipRestText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercises */}
        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <TouchableOpacity
              style={styles.exerciseHeader}
              onPress={() => setExpandedExercise(
                expandedExercise === exercise.id ? null : exercise.id
              )}
            >
              <View style={styles.exerciseIcon}>
                <Dumbbell size={18} color={COLORS.primary} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseSets}>
                  {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} sets
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteExercise(exercise.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={18} color={COLORS.error} />
              </TouchableOpacity>
              {expandedExercise === exercise.id ? (
                <ChevronUp size={20} color={COLORS.textMuted} />
              ) : (
                <ChevronDown size={20} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>

            {/* Sets (expanded) */}
            {expandedExercise === exercise.id && (
              <View style={styles.setsContainer}>
                {/* Header Row */}
                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setHeaderText, { width: 40 }]}>SET</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>KG</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
                  <View style={{ width: 44 }} />
                </View>

                {/* Set Rows */}
                {exercise.sets.map((set) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{set.id}</Text>
                    <TextInput
                      style={[styles.setInput, set.completed && styles.setInputCompleted]}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={set.weight}
                      onChangeText={(val) => updateSet(exercise.id, set.id, 'weight', val)}
                      editable={!set.completed}
                    />
                    <TextInput
                      style={[styles.setInput, set.completed && styles.setInputCompleted]}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={set.reps}
                      onChangeText={(val) => updateSet(exercise.id, set.id, 'reps', val)}
                      editable={!set.completed}
                    />
                    <TouchableOpacity
                      style={[
                        styles.completeButton,
                        set.completed && styles.completeButtonDone,
                      ]}
                      onPress={() => completeSet(exercise.id, set.id)}
                    >
                      <Check
                        size={18}
                        color={set.completed ? COLORS.text : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => addSet(exercise.id)}
                >
                  <Plus size={16} color={COLORS.primary} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity style={styles.addExerciseButton} onPress={() => setShowExerciseModal(true)}>
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelect={addExercise}
        excludeExercises={exercises.map(ex => ex.name)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  finishButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  restBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skipRestText: {
    color: COLORS.text,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  exerciseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseSets: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  setsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setHeaderText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    width: 40,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
  },
  setInputCompleted: {
    backgroundColor: COLORS.success + '20',
    color: COLORS.success,
  },
  completeButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonDone: {
    backgroundColor: COLORS.success,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  addSetText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActiveWorkoutScreen;
