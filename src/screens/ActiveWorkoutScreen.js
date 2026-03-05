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
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Check,
  Trash2,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Pencil,
  Lightbulb,
} from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { EXERCISES } from '../constants/exercises';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import LogSetModal from '../components/LogSetModal';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import MuscleMap, { PRIMARY_VIEW } from '../components/MuscleMap';
import AnatomyModal from '../components/AnatomyModal';
import { useAuth } from '../contexts/AuthContext';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { workoutService } from '../services/workoutService';
import { setPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';

// Find exercise tips from the library by name (case-insensitive, partial match)
const getExerciseTips = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase();
  const match = EXERCISES.find(e => e.name.toLowerCase() === lower)
    || EXERCISES.find(e => lower.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(lower));
  return match ? { tips: match.tips, description: match.description } : null;
};

// Find the muscle group for an exercise by name
const getMuscleGroup = (name) => {
  if (!name) return null;
  const match = EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase());
  return match?.muscleGroup || null;
};

// Check if an exercise is isometric (timed)
const isTimedExercise = (name) => {
  if (!name) return false;
  return EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase())?.type === 'Isometric';
};

// Format seconds as M:SS for display
const formatDuration = (seconds) => {
  const s = parseInt(seconds) || 0;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get RPE color on a green to red scale (0-10)
const getRpeColor = (rpe) => {
  const value = parseFloat(rpe) || 0;
  const clamped = Math.min(10, Math.max(0, value));
  // Green (120°) to Red (0°) in HSL
  const hue = 120 - (clamped / 10) * 120;
  return `hsl(${hue}, 70%, 45%)`;
};

// Format a date as relative ("2 days ago") or short date ("Feb 20")
const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

// Isolated timer display to avoid re-rendering the entire header every second
const WorkoutTimer = React.memo(({ workoutStartTime, COLORS }) => {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    const update = () => setDisplayTime(Math.floor((Date.now() - workoutStartTime) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [workoutStartTime]);

  const mins = Math.floor(displayTime / 60);
  const secs = displayTime % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <Clock size={14} color={COLORS.textMuted} />
      <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>{formatted}</Text>
    </View>
  );
});

const ActiveWorkoutScreen = ({ route, navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, profile } = useAuth();
  const { backgroundWorkout: setBackgroundWorkout, clearBackgroundWorkout } = useActiveWorkout();
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
  const [restDuration, setRestDuration] = useState(90); // adjustable per workout
  const [editingRestTime, setEditingRestTime] = useState(false);
  const [restTimeInput, setRestTimeInput] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showLogSetModal, setShowLogSetModal] = useState(false);
  const [selectedSetToLog, setSelectedSetToLog] = useState(null); // { exerciseId, exerciseName, setId, setNumber, weight, reps }
  const [pendingSupersetExercise, setPendingSupersetExercise] = useState(null);
  const [isReturningFromSuperset, setIsReturningFromSuperset] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false); // kept for potential future use
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSetModal, setShowDeleteSetModal] = useState(false);
  const [finishModalData, setFinishModalData] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [setToEdit, setSetToEdit] = useState(null); // { exerciseId, setId, ... }
  const [setToDelete, setSetToDelete] = useState(null); // { exerciseId, setId }
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState({}); // { visibleid: { visibleweight, visiblereps } }
  const [expandedTips, setExpandedTips] = useState(null); // exercise id with tips open
  const [expandedHistory, setExpandedHistory] = useState(null); // exercise id with history open
  const [activeSetRow, setActiveSetRow] = useState(null); // "exerciseId-setId" string of tapped set, or null
  const [historyCache, setHistoryCache] = useState({}); // { exerciseName: { loading, data } }
  const [anatomyModalVisible, setAnatomyModalVisible] = useState(false);
  const [anatomyMuscle, setAnatomyMuscle] = useState(null);
  const [anatomyExercise, setAnatomyExercise] = useState(null);
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  const sessionIdRef = useRef(sessionId);
  const exercisesRef = useRef(exercises);
  const workoutNameRef = useRef(workoutName);
  const workoutRef = useRef(workout);
  const workoutTimeRef = useRef(workoutTime);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Clear the background workout banner when resuming
  useEffect(() => {
    if (resumedExercises) {
      clearBackgroundWorkout();
    }
  }, []);

  // Keep refs up to date for beforeunload handler
  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  useEffect(() => {
    workoutNameRef.current = workoutName;
  }, [workoutName]);

  useEffect(() => {
    workoutRef.current = workout;
  }, [workout]);

  useEffect(() => {
    workoutTimeRef.current = workoutTime;
  }, [workoutTime]);

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
        console.log('Auto-saved workout:', workoutData.exercises.length, 'exercises');
      } catch (e) {
        console.log('Error auto-saving workout:', e);
      }
    }
  }, [exercises, workoutName, sessionId, workoutTime]);

  // Save before browser closes (web only) - uses refs to avoid stale closures
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleBeforeUnload = (e) => {
        const currentExercises = exercisesRef.current;
        console.log('beforeunload: exercises count:', currentExercises?.length);
        if (currentExercises && currentExercises.length > 0) {
          const workoutData = {
            workoutName: workoutNameRef.current,
            workout: workoutRef.current,
            sessionId: sessionIdRef.current,
            exercises: currentExercises,
            elapsedTime: workoutTimeRef.current,
            workoutStartTime,
            savedAt: Date.now(),
          };
          try {
            localStorage.setItem('activeWorkout', JSON.stringify(workoutData));
            console.log('beforeunload: Saved workout with', currentExercises.length, 'exercises');
          } catch (err) {
            console.log('Error saving on unload:', err);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [workoutStartTime]); // Only need workoutStartTime as it's stable

  // Load exercise history for this user (last weight/reps for each exercise)
  useEffect(() => {
    const loadExerciseHistory = async () => {
      if (user?.id) {
        try {
          const { data } = await workoutService.getExerciseHistory(user.id);
          if (data) {
            // data is already an object keyed by exercise name
            setExerciseHistory(data);
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
          console.log('Creating workout session for user:', user.id, 'workout:', workoutName);
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
          } else {
            console.error('Failed to create session. Error:', error, 'Data:', data);
          }
        } catch (err) {
          console.error('Error creating session:', err);
        }
      } else {
        console.log('Skipping session creation - sessionId:', sessionId, 'user:', user?.id);
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

  // Sync workoutTime state periodically (for auto-save). Display is handled by WorkoutTimer component.
  useEffect(() => {
    if (isTimerRunning) {
      setWorkoutTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      timerRef.current = setInterval(() => {
        setWorkoutTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 30000); // every 30s for auto-save, not every 1s
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

  const addExercise = (exerciseName, muscleGroup = null) => {
    const newExercise = {
      id: Date.now(),
      name: exerciseName,
      muscleGroup: muscleGroup || getMuscleGroup(exerciseName),
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
      setRestTimer(restDuration);
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

    // If the last set was a superset, pre-populate the superset exercise
    if (lastSet?.setType === 'superset' && lastSet?.supersetExercise) {
      setPendingSupersetExercise(lastSet.supersetExercise);
      setIsReturningFromSuperset(true);
    }

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
          isWarmup: setData.isWarmup || false,
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
      setRestTimer(restDuration);
      setIsResting(true);
    }
    setSelectedSetToLog(null);
  };

  const handleSelectSupersetExercise = () => {
    setShowLogSetModal(false);
    setShowExerciseModal(true);
  };

  const handleExerciseSelect = (exerciseName, muscleGroup) => {
    if (selectedSetToLog) {
      // Selecting for superset
      setPendingSupersetExercise(exerciseName);
      setIsReturningFromSuperset(true);
      setShowExerciseModal(false);
      setShowLogSetModal(true);
    } else {
      // Adding a new exercise
      addExercise(exerciseName, muscleGroup);
    }
  };

  const deleteExercise = (exerciseId) => {
    setExerciseToDelete(exerciseId);
    setShowDeleteModal(true);
  };

  const moveExerciseUp = (exerciseId) => {
    const idx = exercises.findIndex(ex => ex.id === exerciseId);
    if (idx <= 0) return;
    const newExercises = [...exercises];
    [newExercises[idx - 1], newExercises[idx]] = [newExercises[idx], newExercises[idx - 1]];
    setExercises(newExercises);
  };

  const moveExerciseDown = (exerciseId) => {
    const idx = exercises.findIndex(ex => ex.id === exerciseId);
    if (idx >= exercises.length - 1) return;
    const newExercises = [...exercises];
    [newExercises[idx + 1], newExercises[idx]] = [newExercises[idx], newExercises[idx + 1]];
    setExercises(newExercises);
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
                isWarmup: setData.isWarmup || false,
                supersetExercise: setData.supersetExercise,
                supersetWeight: setData.supersetWeight,
                supersetReps: setData.supersetReps,
                drops: setData.drops,
                completed: true,
              };
            }
            return set;
          }),
        };
      }
      return ex;
    }));

    // Start rest timer after updating a set (only if enabled in profile)
    if (restTimerEnabled) {
      setRestTimer(restDuration);
      setIsResting(true);
    }

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
    if (isFinishing) return; // Prevent double-tap
    setIsFinishing(true);

    // Capture values first
    let currentSessionId = sessionIdRef.current;
    const currentExercises = JSON.parse(JSON.stringify(exercises));
    const currentWorkoutTime = Math.floor((Date.now() - workoutStartTime) / 1000);
    const currentUserId = user?.id;

    // If session was never created, try creating it now as a fallback
    if (!currentSessionId && currentUserId) {
      console.log('No session ID at finish time - creating session now...');
      try {
        const { data, error } = await workoutService.startWorkout(
          currentUserId,
          workout?.id || null,
          null,
          workoutName
        );
        if (data?.id) {
          console.log('Late session created:', data.id);
          currentSessionId = data.id;
          sessionIdRef.current = data.id;
          setSessionId(data.id);
        } else {
          console.error('Failed to create late session:', error);
        }
      } catch (err) {
        console.error('Error creating late session:', err);
      }
    }

    console.log('Finishing workout - sessionId:', currentSessionId, 'userId:', currentUserId);

    const totalSetsCount = currentExercises.reduce(
      (acc, ex) => acc + ex.sets.length, 0
    );
    const completedSetsCount = currentExercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
    );
    let totalVolume = 0;
    currentExercises.forEach(ex => {
      // Skip isometric exercises from volume calc (seconds x weight doesn't make sense)
      if (isTimedExercise(ex.name)) return;
      ex.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          const weight = set.weight === 'BW' ? 0 : parseFloat(set.weight) || 0;
          totalVolume += weight * parseInt(set.reps);
        }
      });
    });

    // Save data FIRST, then navigate
    if (currentSessionId && currentUserId) {
      // Log sets - don't let failures prevent completing the session
      try {
        for (const exercise of currentExercises) {
          let setNumber = 1;
          for (const set of exercise.sets) {
            if (set.completed) {
              try {
                await workoutService.logSet(currentSessionId, null, exercise.name, {
                  setNumber: setNumber++,  // Use incrementing number, not set.id
                  weight: set.weight === 'BW' ? 0 : parseFloat(set.weight) || 0,
                  reps: parseInt(set.reps) || 0,
                  rpe: set.rpe || null,
                  isWarmup: set.isWarmup || set.setType === 'warmup',
                });
              } catch (setErr) {
                console.error('Error logging set:', exercise.name, setErr);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error in set logging loop:', err);
      }

      // Always mark the session as complete, even if sets failed
      try {
        await workoutService.completeWorkout(currentSessionId, {
          durationMinutes: Math.floor(currentWorkoutTime / 60),
          totalVolume,
          exerciseCount: currentExercises.length,
          totalSets: completedSetsCount,
        });
      } catch (err) {
        console.error('Error completing workout:', err);
      }

      // Check for PRs on each exercise
      for (const exercise of currentExercises) {
        // Skip timed/isometric exercises for PR tracking
        if (isTimedExercise(exercise.name)) continue;

        // Find best set (highest weight with at least 1 rep)
        const completedSets = exercise.sets.filter(s => s.completed && s.weight && s.reps);
        if (completedSets.length === 0) continue;

        const bestSet = completedSets.reduce((best, set) => {
          const weight = set.weight === 'BW' ? 0 : parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          const bestWeight = best.weight === 'BW' ? 0 : parseFloat(best.weight) || 0;
          const bestReps = parseInt(best.reps) || 0;
          // Compare by estimated 1RM (weight × (1 + reps/30))
          const e1rm = weight * (1 + reps / 30);
          const bestE1rm = bestWeight * (1 + bestReps / 30);
          return e1rm > bestE1rm ? set : best;
        }, completedSets[0]);

        try {
          const weight = bestSet.weight === 'BW' ? 0 : parseFloat(bestSet.weight) || 0;
          const reps = parseInt(bestSet.reps) || 0;
          if (weight > 0 && reps > 0) {
            await workoutService.checkAndCreatePR(
              currentUserId,
              null,
              exercise.name,
              weight,
              reps,
              currentSessionId
            );
          }
        } catch (prErr) {
          console.error('Error checking PR for', exercise.name, prErr);
        }
      }
    } else {
      console.error('Cannot save workout - missing sessionId:', currentSessionId, 'or userId:', currentUserId);
    }

    // Clear saved workout from localStorage and banner
    clearPausedWorkout();
    clearBackgroundWorkout();

    // Collect any new PRs for the summary
    const newPRs = [];
    for (const exercise of currentExercises) {
      if (isTimedExercise(exercise.name)) continue;
      const completedSets = exercise.sets.filter(s => s.completed && s.weight && s.reps);
      if (completedSets.length === 0) continue;

      const bestSet = completedSets.reduce((best, set) => {
        const weight = set.weight === 'BW' ? 0 : parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        const bestWeight = best.weight === 'BW' ? 0 : parseFloat(best.weight) || 0;
        const bestReps = parseInt(best.reps) || 0;
        const e1rm = weight * (1 + reps / 30);
        const bestE1rm = bestWeight * (1 + bestReps / 30);
        return e1rm > bestE1rm ? set : best;
      }, completedSets[0]);

      // Check against history to see if this is a PR (simplified check)
      const history = historyCache[exercise.name]?.data || [];
      const weight = bestSet.weight === 'BW' ? 0 : parseFloat(bestSet.weight) || 0;
      const reps = parseInt(bestSet.reps) || 0;
      const e1rm = weight * (1 + reps / 30);

      const previousBest = history.reduce((best, h) => {
        const hWeight = parseFloat(h.weight) || 0;
        const hReps = parseInt(h.reps) || 0;
        const hE1rm = hWeight * (1 + hReps / 30);
        return hE1rm > best ? hE1rm : best;
      }, 0);

      if (e1rm > previousBest && weight > 0) {
        newPRs.push({ exercise: exercise.name, weight, reps });
      }
    }

    // Build summary data for WorkoutSummaryScreen
    const summaryData = {
      sessionId: currentSessionId,
      workoutName: workoutName || 'Workout',
      duration: currentWorkoutTime,
      totalSets: totalSetsCount,
      completedSets: completedSetsCount,
      exercises: currentExercises,
      totalVolume: totalVolume,
      newPRs,
      startTime: workoutStartTime,
      isFromHistory: false, // Explicitly set to false for new workouts
    };

    // Navigate to WorkoutSummaryScreen
    console.log('Navigating to WorkoutSummary with isFromHistory:', summaryData.isFromHistory);
    navigation.replace('WorkoutSummary', { summary: summaryData });
  };

  const handleConfirmFinish = () => {
    finishWorkout();
  };

  const cancelWorkout = () => {
    // Show options modal instead of immediately backgrounding
    setShowCancelModal(true);
  };

  const saveAndExit = () => {
    // Background the workout instead of discarding
    const completedSetsCount = exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
    );
    const totalSetsCount = exercises.reduce(
      (acc, ex) => acc + ex.sets.length, 0
    );

    // Save full workout data to localStorage
    const currentElapsed = Math.floor((Date.now() - workoutStartTime) / 1000);

    setPausedWorkout({
      workoutName,
      workout,
      sessionId,
      exercises,
      elapsedTime: currentElapsed,
    });

    // Set lightweight context for the banner
    setBackgroundWorkout({
      workoutName,
      backgroundedAt: Date.now(),
      exerciseCount: exercises.length,
      completedSets: completedSetsCount,
      totalSets: totalSetsCount,
    });

    setShowCancelModal(false);
    navigation.goBack();
  };

  const discardWorkout = () => {
    // Clear UI immediately
    setShowCancelModal(false);
    clearPausedWorkout();  // Properly clears both state and localStorage
    clearBackgroundWorkout();

    // Navigate immediately
    navigation.goBack();

    // Delete from database in background (don't await)
    if (sessionId) {
      workoutService.deleteWorkoutSession(sessionId).catch(err => {
        console.log('Error deleting workout session:', err);
      });
    }
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

  const toggleExerciseHistory = async (exerciseId, exerciseName) => {
    // If already open, just close
    if (expandedHistory === exerciseId) {
      setExpandedHistory(null);
      return;
    }

    setExpandedHistory(exerciseId);

    // If already cached, don't re-fetch
    if (historyCache[exerciseName]) return;

    // Mark as loading
    setHistoryCache(prev => ({ ...prev, [exerciseName]: { loading: true, data: [] } }));

    try {
      const { data } = await workoutService.getDetailedExerciseHistory(user?.id, exerciseName, 5);
      setHistoryCache(prev => ({ ...prev, [exerciseName]: { loading: false, data: data || [] } }));
    } catch (err) {
      console.log('Error fetching exercise history:', err);
      setHistoryCache(prev => ({ ...prev, [exerciseName]: { loading: false, data: [] } }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={cancelWorkout}
          onClick={cancelWorkout}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <WorkoutTimer workoutStartTime={workoutStartTime} COLORS={COLORS} />
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.finishButton, (isSaving || isFinishing) && styles.buttonDisabled]}
            onPress={finishWorkout}
            onClick={(isSaving || isFinishing) ? undefined : finishWorkout}
            disabled={isSaving || isFinishing}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest Timer Banner */}
      {isResting && (
        <View style={styles.restBanner}>
          <View style={styles.restLeft}>
            {editingRestTime ? (
              <View style={styles.restEditRow}>
                <Text style={styles.restLabel}>Rest: </Text>
                <TextInput
                  style={styles.restTimeInput}
                  value={restTimeInput}
                  onChangeText={setRestTimeInput}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                  maxLength={3}
                  placeholder="sec"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  onSubmitEditing={() => {
                    const secs = parseInt(restTimeInput) || 90;
                    const clamped = Math.max(10, secs);
                    setRestDuration(clamped);
                    setRestTimer(clamped);
                    setEditingRestTime(false);
                  }}
                  onBlur={() => {
                    const secs = parseInt(restTimeInput) || 90;
                    const clamped = Math.max(10, secs);
                    setRestDuration(clamped);
                    setRestTimer(clamped);
                    setEditingRestTime(false);
                  }}
                />
                <Text style={styles.restLabel}>s</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => {
                setRestTimeInput(String(restTimer));
                setEditingRestTime(true);
              }}>
                <Text style={styles.restText}>Rest: {formatTime(restTimer)}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.restControls}>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => {
                const newDuration = Math.max(15, restDuration - 15);
                setRestDuration(newDuration);
                setRestTimer(prev => Math.max(0, prev - 15));
              }}
            >
              <Text style={styles.restAdjustText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.restAdjustBtn}
              onPress={() => {
                const newDuration = restDuration + 15;
                setRestDuration(newDuration);
                setRestTimer(prev => prev + 15);
              }}
            >
              <Text style={styles.restAdjustText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsResting(false); setEditingRestTime(false); }} style={styles.skipRestBtn}>
              <Text style={styles.skipRestText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Workout Stats Row */}
      {(() => {
        const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
        const totalVolume = exercises.reduce((acc, ex) => {
          return acc + ex.sets.filter(s => s.completed).reduce((setAcc, set) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            return setAcc + (weight * reps);
          }, 0);
        }, 0);
        const exerciseCount = exercises.length;

        return (
          <View style={styles.workoutStatsRow}>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>{exerciseCount}</Text>
              <Text style={styles.workoutStatLabel}>Exercises</Text>
            </View>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>{totalSets}</Text>
              <Text style={styles.workoutStatLabel}>Sets</Text>
            </View>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
              </Text>
              <Text style={styles.workoutStatLabel}>{weightUnit}</Text>
            </View>
          </View>
        );
      })()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Exercises */}
        {exercises.map((exercise) => {
          const muscle = exercise.muscleGroup || getMuscleGroup(exercise.name);
          return (
          <View key={exercise.id} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <TouchableOpacity
              style={styles.exerciseHeader}
              onPress={() => setExpandedExercise(
                expandedExercise === exercise.id ? null : exercise.id
              )}
            >
              {muscle ? (
                <TouchableOpacity
                  onPress={() => {
                    setAnatomyMuscle(muscle);
                    setAnatomyExercise(exercise.name);
                    setAnatomyModalVisible(true);
                  }}
                  style={styles.exerciseIcon}
                >
                  <MuscleMap
                    view={PRIMARY_VIEW[muscle] || 'front'}
                    highlightedMuscle={muscle}
                    size={36}
                    highlightColor={COLORS.primary}
                    baseColor={COLORS.textMuted + '40'}
                    outlineColor={COLORS.textMuted + '60'}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.exerciseIcon}>
                  <Dumbbell size={18} color={COLORS.primary} />
                </View>
              )}
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
              {exercises.indexOf(exercise) > 0 && (
                <TouchableOpacity
                  onPress={() => moveExerciseUp(exercise.id)}
                  style={styles.reorderButton}
                >
                  <ArrowUp size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              {exercises.indexOf(exercise) < exercises.length - 1 && (
                <TouchableOpacity
                  onPress={() => moveExerciseDown(exercise.id)}
                  style={styles.reorderButton}
                >
                  <ArrowDown size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              {expandedExercise === exercise.id ? (
                <ChevronUp size={20} color={COLORS.textMuted} />
              ) : (
                <ChevronDown size={20} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>

            {/* Sets (expanded) */}
            {expandedExercise === exercise.id && (
              <View style={styles.setsContainer}>
                {/* Tips Section */}
                {(() => {
                  const exerciseTips = getExerciseTips(exercise.name);
                  if (!exerciseTips) return null;
                  const tipsOpen = expandedTips === exercise.id;
                  return (
                    <View style={styles.tipsWrapper}>
                      <TouchableOpacity
                        style={styles.tipsToggle}
                        onPress={() => setExpandedTips(tipsOpen ? null : exercise.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.tipsToggleLeft}>
                          <Lightbulb size={14} color={COLORS.primary} />
                          <Text style={styles.tipsToggleText}>Coaching Cues</Text>
                        </View>
                        {tipsOpen ? (
                          <ChevronUp size={14} color={COLORS.textMuted} />
                        ) : (
                          <ChevronDown size={14} color={COLORS.textMuted} />
                        )}
                      </TouchableOpacity>
                      {tipsOpen && (
                        <View style={styles.tipsContent}>
                          {exerciseTips.description && (
                            <Text style={styles.tipsDescription}>{exerciseTips.description}</Text>
                          )}
                          {exerciseTips.tips?.map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                              <Text style={styles.tipBullet}>·</Text>
                              <Text style={styles.tipText}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })()}

                {/* Previous Best (max set from last session) */}
                {exerciseHistory[exercise.name] && (
                  <View style={styles.previousBestRow}>
                    <Text style={styles.previousBestLabel}>Previous Best:</Text>
                    <Text style={styles.previousBestValue}>
                      {exerciseHistory[exercise.name].lastWeight}{weightUnit} × {exerciseHistory[exercise.name].lastReps}
                      {' '}({Math.round((parseFloat(exerciseHistory[exercise.name].lastWeight) || 0) * (1 + (parseInt(exerciseHistory[exercise.name].lastReps) || 0) / 30))} e1RM)
                    </Text>
                  </View>
                )}

                {/* 1RM History Graph */}
                {(() => {
                  const history = historyCache[exercise.name]?.data || [];
                  if (history.length < 2 || isTimedExercise(exercise.name)) return null;

                  // Group sets by session date and find max e1RM per session
                  const sessionE1rms = {};
                  history.forEach(h => {
                    const date = h.started_at ? h.started_at.split('T')[0] : 'unknown';
                    const weight = parseFloat(h.weight) || 0;
                    const reps = parseInt(h.reps) || 0;
                    const e1rm = weight * (1 + reps / 30);
                    if (!sessionE1rms[date] || e1rm > sessionE1rms[date].e1rm) {
                      sessionE1rms[date] = { date, e1rm, weight, reps };
                    }
                  });

                  const sortedSessions = Object.values(sessionE1rms)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(-10); // Last 10 sessions

                  if (sortedSessions.length < 2) return null;

                  const chartData = sortedSessions.map(s => Math.round(s.e1rm));
                  const labels = sortedSessions.map(s => {
                    const d = new Date(s.date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  });

                  return (
                    <View style={styles.e1rmGraphSection}>
                      <Text style={styles.e1rmGraphTitle}>Estimated 1RM Progress</Text>
                      <LineChart
                        data={{
                          labels: labels.length > 5 ? labels.filter((_, i) => i % 2 === 0) : labels,
                          datasets: [{ data: chartData, color: () => COLORS.primary, strokeWidth: 2 }],
                        }}
                        width={Dimensions.get('window').width - 80}
                        height={120}
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        withInnerLines={false}
                        withOuterLines={false}
                        withDots={true}
                        fromZero={false}
                        chartConfig={{
                          backgroundColor: 'transparent',
                          backgroundGradientFrom: COLORS.surface,
                          backgroundGradientTo: COLORS.surface,
                          decimalPlaces: 0,
                          color: () => COLORS.primary,
                          labelColor: () => COLORS.textMuted,
                          propsForDots: { r: '4', strokeWidth: '0', fill: COLORS.primary },
                          propsForLabels: { fontSize: 10 },
                        }}
                        bezier
                        style={styles.e1rmChart}
                      />
                      <View style={styles.e1rmStatsRow}>
                        <Text style={styles.e1rmStatText}>
                          Start: {chartData[0]}{weightUnit}
                        </Text>
                        <Text style={styles.e1rmStatText}>
                          Current: {chartData[chartData.length - 1]}{weightUnit}
                        </Text>
                        <Text style={[styles.e1rmStatText, { color: chartData[chartData.length - 1] > chartData[0] ? COLORS.success : COLORS.error }]}>
                          {chartData[chartData.length - 1] > chartData[0] ? '+' : ''}{chartData[chartData.length - 1] - chartData[0]}{weightUnit}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* This Workout - completed sets */}
                {exercise.sets.filter(s => s.completed).length > 0 && (
                  <View style={styles.thisWorkoutSection}>
                    <Text style={styles.thisWorkoutLabel}>This Workout:</Text>
                    <View style={styles.thisWorkoutPills}>
                      {exercise.sets.filter(s => s.completed).map((s) => (
                        <View key={s.id} style={styles.thisWorkoutPill}>
                          <Text style={styles.thisWorkoutPillText}>
                            {isTimedExercise(exercise.name)
                              ? formatDuration(s.reps)
                              : `${s.weight || 0}${weightUnit} × ${s.reps || 0}`
                            }
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Set Rows — completed sets dimmed, pending sets highlighted */}
                {exercise.sets.length > 0 && (
                  <>
                    {exercise.sets.map((set) => {
                      const rowKey = `${exercise.id}-${set.id}`;
                      const isActive = activeSetRow === rowKey;

                      return (
                        <TouchableOpacity
                          key={set.id}
                          activeOpacity={0.7}
                          onPress={() => setActiveSetRow(isActive ? null : rowKey)}
                        >
                          <View style={styles.setRowWrapper}>
                            <View style={[
                              styles.setRowCompact,
                              set.completed && styles.setRowCompleted,
                              !set.completed && styles.setRowPending,
                              isActive && styles.setRowActive,
                            ]}>
                              {/* Left side: Checkmark + Set number */}
                              <View style={styles.setRowLeft}>
                                <TouchableOpacity
                                  onPress={() => completeSet(exercise.id, set.id)}
                                  style={[styles.setCheckmark, set.completed && styles.setCheckmarkDone]}
                                >
                                  <Check size={14} color={set.completed ? COLORS.textOnPrimary : COLORS.textMuted} />
                                </TouchableOpacity>
                                <Text style={[
                                  styles.setLabel,
                                  set.completed && styles.setLabelCompleted,
                                  !set.completed && styles.setLabelPending,
                                ]}>Set {set.id}</Text>
                              </View>

                              {/* Right side: Weight x Reps + Badges + conditionally Edit/Delete */}
                              <View style={styles.setRowRight}>
                                <Text style={[
                                  styles.setWeightReps,
                                  set.completed && styles.setWeightRepsCompleted,
                                  !set.completed && styles.setWeightRepsPending,
                                ]}>
                                  {isTimedExercise(exercise.name)
                                    ? `${set.weight && set.weight !== '0' ? `${set.weight}${weightUnit} · ` : ''}${formatDuration(set.reps)}`
                                    : `${set.weight || 0}${weightUnit} × ${set.reps || 0}`
                                  }
                                </Text>
                                {/* Estimated 1RM for completed sets */}
                                {set.completed && !isTimedExercise(exercise.name) && set.weight && set.reps && (
                                  <Text style={styles.setE1rm}>
                                    {Math.round((parseFloat(set.weight) || 0) * (1 + (parseInt(set.reps) || 0) / 30))} e1RM
                                  </Text>
                                )}

                                {set.setType === 'warmup' && (
                                  <View style={[styles.setBadge, styles.warmupBadge]}>
                                    <Text style={styles.setBadgeText}>Warmup</Text>
                                  </View>
                                )}
                                {set.setType === 'dropset' && (
                                  <View style={[styles.setBadge, styles.dropsetBadge]}>
                                    <Text style={styles.setBadgeText}>Dropset</Text>
                                  </View>
                                )}
                                {set.setType === 'superset' && (
                                  <View style={[styles.setBadge, styles.supersetBadge]}>
                                    <Text style={styles.setBadgeText}>Superset</Text>
                                  </View>
                                )}
                                {set.rpe && (
                                  <View style={[styles.setBadge, { backgroundColor: getRpeColor(set.rpe) }]}>
                                    <Text style={styles.setBadgeText}>RPE {set.rpe}</Text>
                                  </View>
                                )}

                                {/* Edit & Delete only visible when row is tapped */}
                                {isActive && (
                                  <>
                                    <TouchableOpacity
                                      style={styles.setEditButton}
                                      onPress={() => openEditSetModal(exercise.id, exercise.name, set)}
                                    >
                                      <Pencil size={16} color={COLORS.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.setDeleteButton}
                                      onPress={() => confirmDeleteSet(exercise.id, set.id)}
                                    >
                                      <Trash2 size={16} color={COLORS.error} />
                                    </TouchableOpacity>
                                  </>
                                )}
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
                        </TouchableOpacity>
                      );
                    })}
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
          );
        })}

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
        editData={setToEdit}
        isTimedExercise={isTimedExercise(selectedSetToLog?.exerciseName)}
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

      {/* Cancel/Exit Workout Options */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContent}>
            <Text style={styles.cancelModalTitle}>Leave Workout?</Text>
            <Text style={styles.cancelModalMessage}>What would you like to do with this workout?</Text>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowCancelModal(false)}>
              <Text style={styles.cancelModalBtnText}>Continue Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={saveAndExit}>
              <Text style={styles.cancelModalBtnText}>Save & Exit</Text>
              <Text style={styles.cancelModalBtnSubtext}>Continue later from Workouts tab</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelModalBtn, styles.cancelModalBtnDanger]} onPress={discardWorkout}>
              <Text style={[styles.cancelModalBtnText, styles.cancelModalBtnTextDanger]}>Discard Workout</Text>
              <Text style={[styles.cancelModalBtnSubtext, styles.cancelModalBtnTextDanger]}>Delete without saving</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Anatomy Modal */}
      <AnatomyModal
        visible={anatomyModalVisible}
        onClose={() => {
          setAnatomyModalVisible(false);
          setAnatomyMuscle(null);
          setAnatomyExercise(null);
        }}
        muscleGroup={anatomyMuscle}
        exerciseName={anatomyExercise}
      />

      {/* Finishing Workout Loading Overlay */}
      {isFinishing && (
        <View style={styles.finishingOverlay}>
          <View style={styles.finishingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.finishingTitle}>Saving Workout...</Text>
            <Text style={styles.finishingSubtitle}>Logging your sets and calculating stats</Text>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' ? { height: '100vh', display: 'flex', flexDirection: 'column' } : {}),
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
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  restLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  restEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restTimeInput: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  restControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restAdjustBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  restAdjustText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  skipRestBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  skipRestText: {
    color: COLORS.text,
    opacity: 0.8,
    fontWeight: '600',
  },
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  workoutStatLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    ...(Platform.OS === 'web' ? { overflowY: 'auto', WebkitOverflowScrolling: 'touch' } : {}),
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
    marginRight: 4,
  },
  reorderButton: {
    padding: 6,
    marginRight: 2,
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
  warmupBadge: {
    backgroundColor: '#3B82F6',
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
  // Completed set row — green left accent
  setRowCompleted: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
    backgroundColor: COLORS.success + '08',
  },
  setLabelCompleted: {},
  setWeightRepsCompleted: {},
  // Pending set row — neutral (no accent)
  setRowPending: {},
  setLabelPending: {},
  setWeightRepsPending: {},
  // Estimated 1RM badge on completed sets
  setE1rm: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // 1RM History Graph Section
  e1rmGraphSection: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
  },
  e1rmGraphTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  e1rmChart: {
    borderRadius: 8,
    marginLeft: -10,
  },
  e1rmStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  e1rmStatText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  // Active row (tapped to reveal icons)
  setRowActive: {
    backgroundColor: COLORS.primary + '12',
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
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  finishButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  tipsWrapper: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '12',
    overflow: 'hidden',
  },
  tipsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tipsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipsToggleText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipsContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 4,
  },
  tipsDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 17,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  tipBullet: {
    color: COLORS.primary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  // History toggle styles
  historyWrapper: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#D97706' + '12',
    overflow: 'hidden',
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyToggleText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  historyContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  historySession: {
    gap: 4,
  },
  historySessionDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  historyPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  historyPillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  historyRpeBadge: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  historyRpeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
  },
  historyEmpty: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  // Previous Best styles
  previousBestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  previousBestLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  previousBestValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // This Workout styles
  thisWorkoutSection: {
    backgroundColor: COLORS.success + '15',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  thisWorkoutLabel: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  thisWorkoutPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  thisWorkoutPill: {
    backgroundColor: COLORS.success + '25',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  thisWorkoutPillText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  cancelModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelModalMessage: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelModalBtn: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cancelModalBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelModalBtnSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  cancelModalBtnDanger: {
    backgroundColor: COLORS.error + '15',
    marginBottom: 0,
  },
  cancelModalBtnTextDanger: {
    color: COLORS.error,
  },
  finishingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  finishingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
  },
  finishingTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  finishingSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ActiveWorkoutScreen;
