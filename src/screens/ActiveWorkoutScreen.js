import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import LogSetModal from '../components/LogSetModal';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';
import { setPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';

// Get RPE color on a green to red scale (0-10)
const getRpeColor = (rpe) => {
  const value = parseFloat(rpe) || 0;
  const clamped = Math.min(10, Math.max(0, value));
  // Green (120°) to Red (0°) in HSL
  const hue = 120 - (clamped / 10) * 120;
  return `hsl(${hue}, 70%, 45%)`;
};

const ActiveWorkoutScreen = ({ route, navigation }) => {
  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const {
    workout,
    workoutName: initialName,
    sessionId: initialSessionId,
    resumedExercises,
    resumedTime,
  } = route?.params || {};

  const [workoutName, setWorkoutName] = useState(initialName || 'Workout');
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [exercises, setExercises] = useState(resumedExercises || []);
  const [expandedExercise, setExpandedExercise] = useState(resumedExercises?.length > 0 ? resumedExercises[0]?.id : null);
  const [workoutTime, setWorkoutTime] = useState(resumedTime || 0);
  const [workoutStartTime] = useState(() => {
    // Calculate start time based on resumed time or current time
    if (resumedTime) {
      return Date.now() - (resumedTime * 1000);
    }
    return Date.now();
  });
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showLogSetModal, setShowLogSetModal] = useState(false);
  const [selectedSetToLog, setSelectedSetToLog] = useState(null); // { exerciseId, exerciseName, setId, setNumber, weight, reps }
  const [pendingSupersetExercise, setPendingSupersetExercise] = useState(null);
  const [isReturningFromSuperset, setIsReturningFromSuperset] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSetModal, setShowDeleteSetModal] = useState(false);
  const [finishModalData, setFinishModalData] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [setToEdit, setSetToEdit] = useState(null); // { exerciseId, setId, ... }
  const [setToDelete, setSetToDelete] = useState(null); // { exerciseId, setId }
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState({}); // { visibleid: { visibleweight, visiblereps } }
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  const sessionIdRef = useRef(sessionId);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Auto-save workout progress to localStorage (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && exercises.length > 0) {
      const workoutData = {
        workoutName,
        workout,
        sessionId,
        exercises,
        elapsedTime: workoutTime,
        workoutStartTime,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem('activeWorkout', JSON.stringify(workoutData));
      } catch (e) {
        console.log('Error auto-saving workout:', e);
      }
    }
  }, [exercises, workoutName, sessionId, workoutTime]);

  // Save before browser closes (web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleBeforeUnload = (e) => {
        if (exercises.length > 0) {
          const workoutData = {
            workoutName,
            workout,
            sessionId: sessionIdRef.current,
            exercises,
            elapsedTime: Math.floor((Date.now() - workoutStartTime) / 1000),
            workoutStartTime,
            savedAt: Date.now(),
          };
          try {
            localStorage.setItem('activeWorkout', JSON.stringify(workoutData));
          } catch (err) {
            console.log('Error saving on unload:', err);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [exercises, workoutName, workout, workoutStartTime]);

  // Load exercise history for this user (last weight/reps for each exercise)
  useEffect(() => {
    const loadExerciseHistory = async () => {
      if (user?.id) {
        try {
          const { data } = await workoutService.getExerciseHistory(user.id);
          if (data) {
            // Convert array to object keyed by exercise name
            const historyMap = {};
            data.forEach(item => {
              historyMap[item.exercise_name] = {
                lastWeight: item.weight,
                lastReps: item.reps,
              };
            });
            setExerciseHistory(historyMap);
          }
        } catch (error) {
          console.log('Error loading exercise history:', error);
        }
      }
    };
    loadExerciseHistory();
  }, [user?.id]);


  // Create a workout session on mount if one doesn't exist
  useEffect(() => {
    const createSession = async () => {
      if (!sessionId && user?.id) {
        try {
          console.log('Creating workout session...');
          const { data, error } = await workoutService.startWorkout(
            user.id,
            workout?.id || null,
            null,
            workoutName
          );
          if (data?.id) {
            console.log('Session created:', data.id);
            setSessionId(data.id);
            sessionIdRef.current = data.id;
          } else if (error) {
            console.error('Failed to create session:', error);
          }
        } catch (err) {
          console.error('Error creating session:', err);
        }
      }
    };
    createSession();
  }, [user?.id]);

  // Keep sessionIdRef in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Load rest timer setting from storage
  useEffect(() => {
    const loadRestTimerSetting = async () => {
      try {
        const stored = await AsyncStorage.getItem('@rest_timer_enabled');
        if (stored !== null) {
          setRestTimerEnabled(stored === 'true');
        }
      } catch (error) {
        console.log('Error loading rest timer setting:', error);
      }
    };
    loadRestTimerSetting();
  }, []);

  // Initialize with workout exercises or empty (only if not resuming)
  useEffect(() => {
    if (!resumedExercises && workout?.exercises) {
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
  }, [workout, resumedExercises]);

  // Workout timer - uses start time so it persists through background
  useEffect(() => {
    if (isTimerRunning) {
      // Update immediately
      setWorkoutTime(Math.floor((Date.now() - workoutStartTime) / 1000));

      // Then update every second
      timerRef.current = setInterval(() => {
        setWorkoutTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, workoutStartTime]);

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
      sets: [], // Start with no sets - user adds via modal
    };
    setExercises([...exercises, newExercise]);
    setExpandedExercise(newExercise.id);
  };

  const addSet = (exerciseId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSetId = ex.sets.length + 1;
        // Pre-populate with last used weight/reps for this exercise
        const history = exerciseHistory[ex.name];
        const defaultWeight = history?.lastWeight?.toString() || '';
        const defaultReps = history?.lastReps?.toString() || '';
        return {
          ...ex,
          sets: [...ex.sets, { id: newSetId, weight: defaultWeight, reps: defaultReps, completed: false }],
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

    // Start rest timer after completing a set (only if enabled in profile)
    if (restTimerEnabled) {
      setRestTimer(90);
      setIsResting(true);
    }
  };

  // Open modal to add a new set
  const openAddSetModal = (exerciseId, exerciseName) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const nextSetNumber = exercise ? exercise.sets.length + 1 : 1;

    // Get the weight from the last set (if any)
    const lastSet = exercise?.sets?.length > 0 ? exercise.sets[exercise.sets.length - 1] : null;
    const previousWeight = lastSet?.weight || '';

    setSelectedSetToLog({
      exerciseId,
      exerciseName,
      setNumber: nextSetNumber,
      weight: previousWeight,
      isNewSet: true,
    });
    setShowLogSetModal(true);
  };

  const handleLogSet = (setData) => {
    if (!selectedSetToLog) return;

    const { exerciseId, setNumber } = selectedSetToLog;

    // Add a new set with the logged data
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSet = {
          id: setNumber,
          weight: setData.weight.toString(),
          reps: setData.reps.toString(),
          rpe: setData.rpe,
          setType: setData.setType,
          supersetExercise: setData.supersetExercise,
          supersetWeight: setData.supersetWeight,
          supersetReps: setData.supersetReps,
          drops: setData.drops,
          completed: true,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      }
      return ex;
    }));

    // Start rest timer after logging a set (only if enabled in profile)
    if (restTimerEnabled) {
      setRestTimer(90);
      setIsResting(true);
    }
    setSelectedSetToLog(null);
  };

  const handleSelectSupersetExercise = () => {
    setShowLogSetModal(false);
    setShowExerciseModal(true);
  };

  const handleExerciseSelect = (exerciseName) => {
    if (selectedSetToLog) {
      // Selecting for superset
      setPendingSupersetExercise(exerciseName);
      setIsReturningFromSuperset(true);
      setShowExerciseModal(false);
      setShowLogSetModal(true);
    } else {
      // Adding a new exercise
      addExercise(exerciseName);
    }
  };

  const deleteExercise = (exerciseId) => {
    setExerciseToDelete(exerciseId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (exerciseToDelete) {
      setExercises(exercises.filter(ex => ex.id !== exerciseToDelete));
    }
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  };

  // Edit a set
  const openEditSetModal = (exerciseId, exerciseName, set) => {
    setSetToEdit({
      exerciseId,
      exerciseName,
      setId: set.id,
      setNumber: set.id,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      setType: set.setType,
      supersetExercise: set.supersetExercise,
      supersetWeight: set.supersetWeight,
      supersetReps: set.supersetReps,
      drops: set.drops,
      isEdit: true,
    });
    setSelectedSetToLog({
      exerciseId,
      exerciseName,
      setId: set.id,
      setNumber: set.id,
      weight: set.weight,
      reps: set.reps,
      isEdit: true,
    });
    setShowLogSetModal(true);
  };

  // Update an existing set
  const handleUpdateSet = (setData) => {
    if (!setToEdit) return;

    setExercises(exercises.map(ex => {
      if (ex.id === setToEdit.exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setToEdit.setId) {
              return {
                ...set,
                weight: setData.weight.toString(),
                reps: setData.reps.toString(),
                rpe: setData.rpe,
                setType: setData.setType,
                supersetExercise: setData.supersetExercise,
                supersetWeight: setData.supersetWeight,
                supersetReps: setData.supersetReps,
                drops: setData.drops,
              };
            }
            return set;
          }),
        };
      }
      return ex;
    }));

    setSetToEdit(null);
  };

  // Delete a set
  const confirmDeleteSet = (exerciseId, setId) => {
    setSetToDelete({ exerciseId, setId });
    setShowDeleteSetModal(true);
  };

  const handleConfirmDeleteSet = () => {
    if (setToDelete) {
      setExercises(exercises.map(ex => {
        if (ex.id === setToDelete.exerciseId) {
          const newSets = ex.sets.filter(set => set.id !== setToDelete.setId);
          // Re-number the sets
          return {
            ...ex,
            sets: newSets.map((set, idx) => ({ ...set, id: idx + 1 })),
          };
        }
        return ex;
      }));
    }
    setShowDeleteSetModal(false);
    setSetToDelete(null);
  };

  const finishWorkout = async () => {
    // Capture values first
    const currentSessionId = sessionIdRef.current;
    const currentExercises = JSON.parse(JSON.stringify(exercises));
    const currentWorkoutTime = workoutTime;
    const currentUserId = user?.id;

    const totalSetsCount = currentExercises.reduce(
      (acc, ex) => acc + ex.sets.length, 0
    );
    const completedSetsCount = currentExercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
    );
    let totalVolume = 0;
    currentExercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          const weight = set.weight === 'BW' ? 0 : parseFloat(set.weight) || 0;
          totalVolume += weight * parseInt(set.reps);
        }
      });
    });

    // Save data FIRST, then navigate
    if (currentSessionId && currentUserId) {
      try {
        for (const exercise of currentExercises) {
          for (const set of exercise.sets) {
            if (set.completed) {
              await workoutService.logSet(currentSessionId, null, exercise.name, {
                setNumber: set.id,
                weight: set.weight === 'BW' ? 0 : parseFloat(set.weight) || 0,
                reps: parseInt(set.reps) || 0,
                rpe: set.rpe || null,
                isWarmup: false,
              });
            }
          }
        }

        await workoutService.completeWorkout(currentSessionId, {
          durationMinutes: Math.floor(currentWorkoutTime / 60),
          totalVolume,
          exerciseCount: currentExercises.length,
          totalSets: completedSetsCount,
        });
      } catch (err) {
        console.error('Error saving workout:', err);
      }
    }

    // Clear saved workout from localStorage
    clearPausedWorkout();

    // Build summary data for WorkoutSummaryScreen
    const summaryData = {
      sessionId: currentSessionId,
      workoutName: workoutName || 'Workout',
      duration: currentWorkoutTime,
      totalSets: totalSetsCount,
      completedSets: completedSetsCount,
      exercises: currentExercises,
      totalVolume: totalVolume,
      newPRs: [], // TODO: Calculate PRs by comparing to history
    };

    // Navigate to WorkoutSummaryScreen
    navigation.replace('WorkoutSummary', { summary: summaryData });
  };

  const handleConfirmFinish = () => {
    finishWorkout();
  };

  const cancelWorkout = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    clearPausedWorkout();
    navigation.goBack();
  };

  const saveAndContinueLater = () => {
    if (isSaving) return; // Prevent double-click

    setIsSaving(true);

    // Store paused workout data in global store
    const pausedWorkoutData = {
      workoutName,
      workout,
      sessionId: sessionId,
      exercises,
      elapsedTime: workoutTime,
    };

    setPausedWorkout(pausedWorkoutData);

    showToast('Workout saved! Continue from Workouts tab.', 'success');

    // Navigate after a short delay to let the user see the toast
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={cancelWorkout}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <View style={styles.timerRow}>
            <Clock size={14} color={COLORS.textMuted} />
            <Text style={styles.timerText}>{formatTime(workoutTime)}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.resumeLaterButton, isSaving && styles.buttonDisabled]}
            onPress={saveAndContinueLater}
            disabled={isSaving}
          >
            <Text style={styles.resumeLaterText}>Resume Later</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.finishButton, isSaving && styles.buttonDisabled]}
            onPress={finishWorkout}
            disabled={isSaving}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
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
                {/* Set Rows */}
                {exercise.sets.length > 0 && (
                  <>
                    {exercise.sets.map((set) => (
                      <View key={set.id} style={styles.setRowWrapper}>
                        <View style={styles.setRowCompact}>
                          {/* Left side: Checkmark + Set number */}
                          <View style={styles.setRowLeft}>
                            <View style={[styles.setCheckmark, set.completed && styles.setCheckmarkDone]}>
                              <Check size={14} color={set.completed ? COLORS.text : COLORS.textMuted} />
                            </View>
                            <Text style={styles.setLabel}>Set {set.id}</Text>
                          </View>

                          {/* Right side: Weight x Reps + Badges + Edit */}
                          <View style={styles.setRowRight}>
                            <Text style={styles.setWeightReps}>
                              {set.weight || 0}{weightUnit} × {set.reps || 0}
                            </Text>

                            {/* Dropset Badge */}
                            {set.setType === 'dropset' && (
                              <View style={[styles.setBadge, styles.dropsetBadge]}>
                                <Text style={styles.setBadgeText}>Dropset</Text>
                              </View>
                            )}

                            {/* Superset Badge */}
                            {set.setType === 'superset' && (
                              <View style={[styles.setBadge, styles.supersetBadge]}>
                                <Text style={styles.setBadgeText}>Superset</Text>
                              </View>
                            )}

                            {/* RPE Badge */}
                            {set.rpe && (
                              <View style={[styles.setBadge, { backgroundColor: getRpeColor(set.rpe) }]}>
                                <Text style={styles.setBadgeText}>RPE {set.rpe}</Text>
                              </View>
                            )}

                            {/* Edit Button */}
                            <TouchableOpacity
                              style={styles.setEditButton}
                              onPress={() => openEditSetModal(exercise.id, exercise.name, set)}
                            >
                              <Pencil size={16} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            {/* Delete Button */}
                            <TouchableOpacity
                              style={styles.setDeleteButton}
                              onPress={() => confirmDeleteSet(exercise.id, set.id)}
                            >
                              <Trash2 size={16} color={COLORS.error} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Superset Details */}
                        {set.setType === 'superset' && set.supersetExercise && (
                          <View style={styles.setDetailsContainer}>
                            <Text style={styles.setDetailsLabel}>Superset with: {set.supersetExercise}</Text>
                            <Text style={styles.setDetailsText}>
                              {set.supersetWeight || 0}{weightUnit} × {set.supersetReps || 0}
                            </Text>
                          </View>
                        )}

                        {/* Dropset Details */}
                        {set.setType === 'dropset' && set.drops && set.drops.length > 0 && (
                          <View style={styles.setDetailsContainer}>
                            {set.drops.map((drop, idx) => (
                              <Text key={idx} style={styles.setDetailsText}>
                                Drop {idx + 1}: {drop.weight || 0}{weightUnit} × {drop.reps || 0}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => openAddSetModal(exercise.id, exercise.name)}
                >
                  <Plus size={16} color={COLORS.primary} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowExerciseModal(true)}
        >
          <Plus size={20} color={COLORS.primary} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        visible={showExerciseModal}
        onClose={() => {
          setShowExerciseModal(false);
          // If we were selecting for superset, reopen the log modal
          if (selectedSetToLog) {
            setIsReturningFromSuperset(true);
            setShowLogSetModal(true);
          }
        }}
        onSelect={handleExerciseSelect}
        excludeExercises={exercises.map(ex => ex.name)}
        isSuperset={!!selectedSetToLog}
        currentExercise={selectedSetToLog?.exerciseName}
      />

      {/* Log Set Modal */}
      <LogSetModal
        visible={showLogSetModal}
        onClose={() => {
          setShowLogSetModal(false);
          setSelectedSetToLog(null);
          setSetToEdit(null);
          setPendingSupersetExercise(null);
          setIsReturningFromSuperset(false);
        }}
        onSave={(setData) => {
          if (setToEdit) {
            handleUpdateSet(setData);
          } else {
            handleLogSet(setData);
          }
          setPendingSupersetExercise(null);
          setIsReturningFromSuperset(false);
        }}
        exerciseName={selectedSetToLog?.exerciseName || ''}
        setNumber={selectedSetToLog?.setNumber || 1}
        initialWeight={selectedSetToLog?.weight || ''}
        initialReps={selectedSetToLog?.reps || ''}
        weightUnit={weightUnit}
        onSelectSupersetExercise={handleSelectSupersetExercise}
        pendingSupersetExercise={pendingSupersetExercise}
        isReturningFromSuperset={isReturningFromSuperset}
        isEdit={!!setToEdit}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Finish Workout Confirmation */}
      <ConfirmModal
        visible={showFinishModal}
        title="Finish Workout"
        message={finishModalData ? `You completed ${finishModalData.completedSets}/${finishModalData.totalSets} sets in ${formatTime(workoutTime)}. Save workout?` : ''}
        confirmText="Save & Finish"
        cancelText="Keep Going"
        confirmStyle="success"
        onConfirm={handleConfirmFinish}
        onCancel={() => setShowFinishModal(false)}
      />

      {/* Cancel Workout Confirmation */}
      <ConfirmModal
        visible={showCancelModal}
        title="Cancel Workout"
        message="Are you sure you want to cancel? Your progress will be lost."
        confirmText="Cancel Workout"
        cancelText="Keep Going"
        confirmStyle="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Delete Exercise Confirmation */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Exercise"
        message="Are you sure you want to remove this exercise?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setExerciseToDelete(null);
        }}
      />

      {/* Delete Set Confirmation */}
      <ConfirmModal
        visible={showDeleteSetModal}
        title="Delete Set"
        message="Are you sure you want to delete this set?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={handleConfirmDeleteSet}
        onCancel={() => {
          setShowDeleteSetModal(false);
          setSetToDelete(null);
        }}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
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
    ...(Platform.OS === 'web' ? { overflow: 'auto' } : {}),
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
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
  // Compact Set Row
  setRowWrapper: {
    marginBottom: 8,
  },
  setRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  setRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setCheckmarkDone: {
    backgroundColor: COLORS.success,
  },
  setLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  setRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setWeightReps: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  setBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  setBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  dropsetBadge: {
    backgroundColor: COLORS.error,
  },
  supersetBadge: {
    backgroundColor: '#D97706', // Darker amber/yellow
  },
  rpeBadge: {
    backgroundColor: COLORS.primary,
  },
  setEditButton: {
    padding: 4,
  },
  setDeleteButton: {
    padding: 4,
  },
  setDetailsContainer: {
    paddingLeft: 48,
    paddingTop: 6,
    paddingBottom: 4,
  },
  setDetailsLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  setDetailsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  // Keep old styles for header row
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  setInputText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
  },
  setInputCompleted: {
    backgroundColor: COLORS.success + '20',
  },
  setInputTextCompleted: {
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeLaterButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resumeLaterText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ActiveWorkoutScreen;
