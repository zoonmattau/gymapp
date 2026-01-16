import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Plus, Minus, Play, X, Clock, Info, ChevronDown, ChevronUp, Undo2, Target, History, Sparkles, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { workoutService } from '../../services/workoutService';
import {
  ALL_EXERCISES,
  WORKOUT_STRUCTURES,
  CORE_MUSCLE_GROUPS,
  CARDIO_EXERCISES,
  GOAL_TRAINING_PARAMS,
  RPE_SCALE,
  RELATED_MUSCLE_GROUPS,
  getExerciseInstructions
} from '../../constants';

// Workout timing constants
const WORKOUT_TIMING = {
  AVG_SET_DURATION: 45,
  WARMUP_TIME: 180,
  COOLDOWN_TIME: 120,
  TRANSITION_TIME: 30,
};

// Optimize exercises for available time
const optimizeExercisesForTime = (exerciseList, targetMinutes) => {
  if (!exerciseList || exerciseList.length === 0) return exerciseList || [];
  const targetSeconds = targetMinutes * 60;

  const fixedTime = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME +
    (exerciseList.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;

  let optimized = exerciseList.map(ex => ({ ...ex, sets: ex.sets || 3 }));

  let totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
  let workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
  let totalRestPeriods = totalSets - optimized.length;
  let availableRestTime = targetSeconds - fixedTime - workingTime;

  while (availableRestTime < totalRestPeriods * 30 && optimized.some(ex => ex.sets > 2)) {
    const maxSetsEx = optimized.reduce((max, ex) => (ex.sets > max.sets) ? ex : max, optimized[0]);
    if (maxSetsEx.sets <= 2) break;
    const idx = optimized.findIndex(ex => ex.id === maxSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets - 1 };

    totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalRestPeriods = totalSets - optimized.length;
    availableRestTime = targetSeconds - fixedTime - workingTime;
  }

  while (availableRestTime > totalRestPeriods * 180 && optimized.some(ex => ex.sets < 5)) {
    const minSetsEx = optimized.reduce((min, ex) => (ex.sets < min.sets && ex.sets < 5) ? ex : min, optimized[0]);
    if (minSetsEx.sets >= 5) break;
    const idx = optimized.findIndex(ex => ex.id === minSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets + 1 };

    totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalRestPeriods = totalSets - optimized.length;
    availableRestTime = targetSeconds - fixedTime - workingTime;
  }

  const restPerPeriod = totalRestPeriods > 0
    ? Math.max(30, Math.min(180, Math.round(availableRestTime / totalRestPeriods)))
    : 90;

  optimized = optimized.map(ex => ({
    ...ex,
    restTime: restPerPeriod
  }));

  return optimized;
};

// Calculate workout time breakdown
const getWorkoutTimeBreakdown = (exerciseList) => {
  if (!exerciseList || exerciseList.length === 0) {
    return { workingTime: 0, restTime: 0, totalTime: 0, warmupCooldown: WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME };
  }
  let workingSeconds = 0, restSeconds = 0;
  exerciseList.forEach((ex) => {
    workingSeconds += (ex.sets || 3) * WORKOUT_TIMING.AVG_SET_DURATION;
    restSeconds += ((ex.sets || 3) - 1) * (ex.restTime || 90);
  });
  const transitionTime = (exerciseList.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;
  const warmupCooldown = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME;
  return { workingTime: workingSeconds, restTime: restSeconds, transitionTime, warmupCooldown, totalTime: workingSeconds + restSeconds + transitionTime + warmupCooldown };
};

function ActiveWorkoutScreen({ onClose, onComplete, COLORS, availableTime = 60, userGoal = 'build_muscle', userExperience = 'beginner', userId = null, workoutName = 'Workout', workoutTemplate = null, injuries = [] }) {
  // Default exercises if no template provided
  const DEFAULT_EXERCISES = [
    { id: 'bench-press', name: 'Bench Press', sets: 4, targetReps: 10, suggestedWeight: 60, lastWeight: 0, lastReps: [10, 10, 10, 10], restTime: 120, muscleGroup: 'Chest', equipment: 'Barbell', exerciseType: 'compound' },
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', sets: 3, targetReps: 12, suggestedWeight: 20, lastWeight: 0, lastReps: [12, 12, 12], restTime: 90, muscleGroup: 'Chest', equipment: 'Dumbbells', exerciseType: 'compound' },
    { id: 'cable-fly', name: 'Cable Fly', sets: 3, targetReps: 15, suggestedWeight: 15, lastWeight: 0, lastReps: [15, 15, 15], restTime: 60, muscleGroup: 'Chest', equipment: 'Cable', exerciseType: 'isolation' },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', sets: 3, targetReps: 12, suggestedWeight: 25, lastWeight: 0, lastReps: [12, 12, 12], restTime: 60, muscleGroup: 'Triceps', equipment: 'Cable', exerciseType: 'isolation' },
  ];

  // Use passed workout template or fall back to defaults with all required properties
  const activeWorkout = {
    name: workoutTemplate?.name || workoutName || 'Workout',
    focus: workoutTemplate?.focus || 'Full Body',
    description: workoutTemplate?.description || '',
    goals: workoutTemplate?.goals || [],
    exercises: workoutTemplate?.exercises || DEFAULT_EXERCISES,
    ...workoutTemplate
  };
  const isAdvancedUser = ['experienced', 'expert'].includes(userExperience);
  const [sessionId, setSessionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phase, setPhase] = useState('overview'); // 'overview', 'workout', 'workoutOverview', 'complete'
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);
  const [currentSetData, setCurrentSetData] = useState({ weight: 0, reps: 0, rpe: 5 });
  const [showExerciseHistory, setShowExerciseHistory] = useState(null);
  const [showSwapExercise, setShowSwapExercise] = useState(null);
  const [swapSearch, setSwapSearch] = useState('');
  // Initialize exercises from workout template, optimized for available time
  const [exercises, setExercises] = useState(() => {
    const baseExercises = activeWorkout?.exercises || DEFAULT_EXERCISES;
    const exerciseCount = Math.max(2, Math.floor(availableTime / 12));
    const selectedExercises = baseExercises.slice(0, exerciseCount).map(ex => ({
      ...ex,
      history: [],
      alternatives: ALL_EXERCISES.filter(e => e.muscleGroup === ex.muscleGroup).slice(0, 5).map(e => e.name)
    }));
    return optimizeExercisesForTime(selectedExercises, availableTime);
  });
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [showFullWorkoutList, setShowFullWorkoutList] = useState(false);
  const [editingSet, setEditingSet] = useState(null); // { exerciseId, setIndex }
  const [editSetData, setEditSetData] = useState({ weight: 0, reps: 0, rpe: 5 });
  const [showEndWorkoutConfirm, setShowEndWorkoutConfirm] = useState(false);
  const [showExerciseInfoModal, setShowExerciseInfoModal] = useState(null); // exercise name to show info for

  // Workout media (photos/videos)
  const [workoutMedia, setWorkoutMedia] = useState([]);
  const fileInputRef = React.useRef(null);
  
  // Time tracking
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutEndTime, setWorkoutEndTime] = useState(null);
  const [setStartTime, setSetStartTime] = useState(null);
  const [totalWorkingTime, setTotalWorkingTime] = useState(0); // Time actually doing sets (in seconds)
  const [totalRestTime, setTotalRestTime] = useState(0); // Time spent resting (in seconds)

  // Optimize exercise order based on user's goal
  const optimizeExerciseOrder = (exerciseList) => {
    if (!exerciseList || exerciseList.length <= 1) return exerciseList;
    
    const sorted = [...exerciseList];
    
    // Define muscle group priorities based on goal
    const getPriority = (muscleGroup) => {
      if (userGoal === 'build_muscle') {
        // Prioritize larger muscle groups first for maximum hypertrophy
        const priorities = { 'Chest': 1, 'Back': 2, 'Quads': 3, 'Hamstrings/Glutes': 4, 'Shoulders': 5, 'Triceps': 6, 'Biceps': 7, 'Calves': 8, 'Core': 9 };
        return priorities[muscleGroup] || 10;
      } else if (userGoal === 'strength') {
        // Prioritize compound movements and powerlifting muscles
        const priorities = { 'Quads': 1, 'Back': 2, 'Chest': 3, 'Hamstrings/Glutes': 4, 'Shoulders': 5, 'Core': 6, 'Triceps': 7, 'Biceps': 8, 'Calves': 9 };
        return priorities[muscleGroup] || 10;
      } else if (userGoal === 'lose_fat') {
        // Prioritize larger muscle groups for more calorie burn, then circuits
        const priorities = { 'Quads': 1, 'Back': 2, 'Chest': 3, 'Hamstrings/Glutes': 4, 'Shoulders': 5, 'Core': 6, 'Triceps': 7, 'Biceps': 8, 'Calves': 9 };
        return priorities[muscleGroup] || 10;
      } else {
        // General fitness - balanced approach
        const priorities = { 'Chest': 1, 'Back': 2, 'Quads': 3, 'Shoulders': 4, 'Hamstrings/Glutes': 5, 'Core': 6, 'Triceps': 7, 'Biceps': 8, 'Calves': 9 };
        return priorities[muscleGroup] || 10;
      }
    };
    
    // Also consider compound vs isolation - compounds first
    const getTypeBonus = (exercise) => {
      const compoundExercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Dip', 'Lunge', 'Romanian Deadlift'];
      const isCompound = compoundExercises.some(c => exercise.name.toLowerCase().includes(c.toLowerCase()));
      return isCompound ? 0 : 100; // Compounds get priority
    };
    
    sorted.sort((a, b) => {
      const priorityA = getPriority(a.muscleGroup) + getTypeBonus(a);
      const priorityB = getPriority(b.muscleGroup) + getTypeBonus(b);
      return priorityA - priorityB;
    });
    
    return sorted;
  };

  // Use exercises and calculate time breakdown
  const exercisesForTime = exercises;
  const timeBreakdown = getWorkoutTimeBreakdown(exercisesForTime);

  const totalSets = exercisesForTime.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSetsCount = completedSets.length;
  const progressPercent = (completedSetsCount / totalSets) * 100;
  const currentExercise = exercisesForTime[currentExerciseIndex];

  useEffect(() => {
    if (currentExercise) {
      // Get completed sets for this exercise
      const exerciseCompletedSets = completedSets.filter(s => s.exerciseId === currentExercise.id);
      const lastCompletedSet = exerciseCompletedSets[exerciseCompletedSets.length - 1];

      // If we have a previous set for this exercise, use that data as suggestion
      if (lastCompletedSet) {
        setCurrentSetData({
          weight: lastCompletedSet.weight,
          reps: lastCompletedSet.reps,
          rpe: lastCompletedSet.rpe || 5
        });
      } else {
        // Otherwise use exercise defaults
        setCurrentSetData({
          weight: currentExercise.suggestedWeight || currentExercise.lastWeight || 0,
          reps: currentExercise.targetReps,
          rpe: 5
        });
      }
    }
  }, [currentExerciseIndex, currentSetIndex, currentExercise?.id]);

  useEffect(() => {
    let interval;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => setRestTimeLeft(prev => prev - 1), 1000);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
      setSetStartTime(Date.now()); // Start timing the next set
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  const formatDuration = (ms) => {
    const totalSeconds = Math.round(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSet = () => {
    // Track working time for this set
    if (setStartTime) {
      const setDuration = Math.round((Date.now() - setStartTime) / 1000);
      setTotalWorkingTime(prev => prev + setDuration);
    }
    
    setCompletedSets(prev => [...prev, { 
      exerciseId: currentExercise.id, 
      setIndex: currentSetIndex, 
      weight: currentSetData.weight, 
      reps: currentSetData.reps,
      rpe: currentSetData.rpe 
    }]);
    
    if (currentSetIndex < currentExercise.sets - 1) {
      const restDuration = currentExercise.restTime;
      setRestTimeLeft(restDuration);
      setTotalRestTime(prev => prev + restDuration);
      setIsResting(true);
      setCurrentSetIndex(prev => prev + 1);
    } else if (currentExerciseIndex < exercisesForTime.length - 1) {
      const restDuration = currentExercise.restTime;
      setRestTimeLeft(restDuration);
      setTotalRestTime(prev => prev + restDuration);
      setIsResting(true);
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
    } else {
      setWorkoutEndTime(Date.now());
      setPhase('complete');
    }
  };
  
  const updateCompletedSet = (exerciseId, setIndex, newData) => {
    setCompletedSets(prev => prev.map(s => 
      s.exerciseId === exerciseId && s.setIndex === setIndex 
        ? { ...s, ...newData }
        : s
    ));
    setEditingSet(null);
  };
  
  const skipToExercise = (exerciseIndex, setIndex = 0) => {
    setCurrentExerciseIndex(exerciseIndex);
    setCurrentSetIndex(setIndex);
    setIsResting(false);
    setSetStartTime(Date.now()); // Start timing the new set
    setShowFullWorkoutList(false);
  };
  
  const endWorkoutEarly = () => {
    // Track any remaining working time from current set
    if (setStartTime && !isResting) {
      const setDuration = Math.round((Date.now() - setStartTime) / 1000);
      setTotalWorkingTime(prev => prev + setDuration);
    }
    setWorkoutEndTime(Date.now());
    setPhase('complete');
    setShowEndWorkoutConfirm(false);
  };

  const swapExercise = (exerciseIndex, newExerciseName) => {
    const existingExercise = ALL_EXERCISES.find(e => e.name === newExerciseName);
    const newExercise = { 
      ...exercises[exerciseIndex], 
      name: newExerciseName, 
      id: newExerciseName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now(),
      muscleGroup: existingExercise?.muscleGroup || exercises[exerciseIndex].muscleGroup
    };
    setExercises(prev => {
      const updated = prev.map((ex, i) => i === exerciseIndex ? newExercise : ex);
      return optimizeExerciseOrder(updated);
    });
    setShowSwapExercise(null);
    setSwapSearch('');
  };

  // Move exercise up or down in the list
  const moveExercise = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    setExercises(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
    // Adjust current exercise index if needed
    if (currentExerciseIndex === index) {
      setCurrentExerciseIndex(newIndex);
    } else if (currentExerciseIndex === newIndex) {
      setCurrentExerciseIndex(index);
    }
  };

  const addExercise = (exerciseName) => {
    const existingExercise = ALL_EXERCISES.find(e => e.name === exerciseName);
    const newEx = {
      id: exerciseName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now(),
      name: exerciseName,
      sets: 3,
      targetReps: existingExercise?.type === 'compound' ? 8 : 12,
      suggestedWeight: 20,
      lastWeight: 0,
      lastReps: [0, 0, 0],
      restTime: existingExercise?.type === 'compound' ? 180 : 90,
      muscleGroup: existingExercise?.muscleGroup || 'Other',
      history: [],
      alternatives: []
    };
    
    setExercises(prev => {
      const updated = [...prev, newEx];
      return optimizeExerciseOrder(updated);
    });
    setShowAddExercise(false);
    setAddExerciseSearch('');
  };
  
  const removeExercise = (exerciseIndex) => {
    // Don't remove if it's the only exercise
    if (exercises.length <= 1) return;
    
    // Check if any sets completed for this exercise
    const exerciseId = exercises[exerciseIndex].id;
    const hasCompletedSets = completedSets.some(s => s.exerciseId === exerciseId);
    
    setExercises(prev => {
      const updated = prev.filter((_, i) => i !== exerciseIndex);
      return optimizeExerciseOrder(updated);
    });
    
    // Adjust current index if needed
    if (currentExerciseIndex >= exerciseIndex && currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const addSetToExercise = (exerciseIndex) => {
    setExercises(prev => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: ex.sets + 1, lastReps: [...ex.lastReps, ex.targetReps] } : ex));
  };

  const removeSetFromExercise = (exerciseIndex) => {
    const exercise = exercises[exerciseIndex];
    // Don't allow removing if only 1 set left
    if (exercise.sets <= 1) return;
    // Remove the last set
    setExercises(prev => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: ex.sets - 1, lastReps: ex.lastReps.slice(0, -1) } : ex));
    // If we're on the last set of this exercise and removing it, adjust set index
    if (exerciseIndex === currentExerciseIndex && currentSetIndex >= exercise.sets - 1) {
      setCurrentSetIndex(Math.max(0, exercise.sets - 2));
    }
  };

  const getCompletedForExercise = (exId) => completedSets.filter(s => s.exerciseId === exId);
  const getUpcomingExercises = () => exercisesForTime.slice(currentExerciseIndex + 1);
  const filteredSwapExercises = ALL_EXERCISES.filter(ex => ex.name.toLowerCase().includes(swapSearch.toLowerCase()));
  const filteredAddExercises = ALL_EXERCISES.filter(ex => {
    // Filter by search
    const matchesSearch = ex.name.toLowerCase().includes(addExerciseSearch.toLowerCase());
    // Exclude already added exercises (by name, since IDs might differ)
    const alreadyAdded = exercises.some(e => e.name === ex.name);
    return matchesSearch && !alreadyAdded;
  });

  // EXERCISE HISTORY MODAL
  if (showExerciseHistory !== null) {
    const exercise = exercisesForTime[showExerciseHistory];
    const maxE1rm = Math.max(...(exercise.history?.map(h => h.e1rm) || [0]));
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => setShowExerciseHistory(null)}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{exercise.name} History</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>Estimated 1RM Progress</p>
            <div className="h-32 flex items-end gap-2">
              {exercise.history?.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t" style={{ backgroundColor: COLORS.primary, height: `${(h.e1rm / maxE1rm) * 100}%`, minHeight: 8 }} />
                  <p className="text-xs mt-1 font-bold" style={{ color: COLORS.text }}>{h.e1rm}kg</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{h.date}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="font-semibold mb-3" style={{ color: COLORS.text }}>Previous Sessions</p>
          <div className="space-y-3">
            {exercise.history?.map((session, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold" style={{ color: COLORS.text }}>{session.date}</p>
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.accent + '20', color: COLORS.accent }}>e1RM: {session.e1rm}kg</span>
                </div>
                <p style={{ color: COLORS.textSecondary }}>{session.weight}kg × {session.reps.join(', ')} reps</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4"><button onClick={() => setShowExerciseHistory(null)} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Back to Workout</button></div>
      </div>
    );
  }

  // SWAP EXERCISE MODAL
  if (showSwapExercise !== null) {
    const exercise = exercisesForTime[showSwapExercise];
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setShowSwapExercise(null); setSwapSearch(''); }}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Swap {exercise.name}</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <input type="text" placeholder="Search exercises..." value={swapSearch} onChange={e => setSwapSearch(e.target.value)}
            className="w-full p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Suggested Alternatives</p>
          <div className="space-y-2 mb-4">
            {exercise.alternatives?.map(alt => (
              <div key={alt} className="w-full p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: COLORS.text }}>{alt}</span>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(alt); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                </div>
                <button onClick={() => swapExercise(showSwapExercise, alt)} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Select</button>
              </div>
            ))}
          </div>
          {swapSearch && (
            <>
              <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Search Results</p>
              <div className="space-y-2">
                {filteredSwapExercises.slice(0, 8).map(ex => (
                  <div key={ex.name} className="w-full p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                    <div className="flex items-center gap-2">
                      <div>
                        <p style={{ color: COLORS.text }}>{ex.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.muscleGroup}</p>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(ex.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                    </div>
                    <button onClick={() => swapExercise(showSwapExercise, ex.name)} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Select</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ADD EXERCISE MODAL
  if (showAddExercise) {
    // Group exercises by muscle group for easier browsing
    const groupedExercises = filteredAddExercises.reduce((acc, ex) => {
      if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
      acc[ex.muscleGroup].push(ex);
      return acc;
    }, {});
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setShowAddExercise(false); setAddExerciseSearch(''); }}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Add Exercise</h2>
        </div>
        <div className="p-4 pb-2" style={{ backgroundColor: COLORS.primary + '10' }}>
          <p className="text-xs" style={{ color: COLORS.primary }}>
            💡 Exercises will be automatically reordered to optimize for your {userGoal === 'build_muscle' ? 'muscle building' : userGoal === 'strength' ? 'strength' : userGoal === 'lose_fat' ? 'fat loss' : 'fitness'} goal
          </p>
        </div>
        <div className="p-4 pt-2">
          <input type="text" placeholder="Search exercises..." value={addExerciseSearch} onChange={e => setAddExerciseSearch(e.target.value)}
            className="w-full p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          {filteredAddExercises.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: COLORS.textMuted }}>No exercises found</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                {addExerciseSearch ? 'Try a different search term' : 'All exercises already added'}
              </p>
            </div>
          ) : (
            Object.entries(groupedExercises).map(([muscleGroup, exs]) => (
              <div key={muscleGroup} className="mb-4">
                <p className="text-xs font-semibold mb-2 px-1" style={{ color: COLORS.textMuted }}>{muscleGroup.toUpperCase()}</p>
                <div className="space-y-2">
                  {exs.map(ex => (
                    <div key={ex.name} className="w-full p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p style={{ color: COLORS.text }}>{ex.name}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.equipment} • {ex.type}</p>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(ex.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                      </div>
                      <button onClick={() => addExercise(ex.name)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}><Plus size={18} color={COLORS.text} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // WORKOUT OVERVIEW (during workout)
  if (phase === 'workoutOverview') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setPhase('workout')}><ChevronLeft size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout Overview</h2>
          </div>
          <span className="text-sm" style={{ color: COLORS.textMuted }}>{completedSetsCount}/{totalSets} sets</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {exercisesForTime.map((exercise, exIdx) => {
            const exCompletedSets = getCompletedForExercise(exercise.id);
            const isCurrentEx = exIdx === currentExerciseIndex;
            const isCompleted = exCompletedSets.length === exercise.sets;
            return (
              <div key={exercise.id} className="mb-3 p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: isCurrentEx ? `2px solid ${COLORS.primary}` : 'none' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isCompleted ? <Check size={18} color={COLORS.success} /> : isCurrentEx ? <Play size={18} color={COLORS.primary} /> : <div className="w-4.5 h-4.5" />}
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold" style={{ color: isCompleted ? COLORS.success : COLORS.text }}>{exercise.name}</p>
                        {isAdvancedUser && exercise.targetedHeads && exercise.targetedHeads.length > 0 && (
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.targetedHeads.join(', ')}</p>
                        )}
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(exercise.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <button onClick={() => moveExercise(exIdx, 'up')} disabled={exIdx === 0} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, opacity: exIdx === 0 ? 0.4 : 1 }}><ChevronUp size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => moveExercise(exIdx, 'down')} disabled={exIdx === exercises.length - 1} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, opacity: exIdx === exercises.length - 1 ? 0.4 : 1 }}><ChevronDown size={14} color={COLORS.textMuted} /></button>
                    {/* Add/Remove set buttons */}
                    <button onClick={() => removeSetFromExercise(exIdx)} disabled={exercise.sets <= 1} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, opacity: exercise.sets <= 1 ? 0.4 : 1 }}><Minus size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => addSetToExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => setShowSwapExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight }}><ArrowLeftRight size={14} color={COLORS.textMuted} /></button>
                    {exercises.length > 1 && (
                      <button onClick={() => removeExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.error + '20' }}><X size={14} color={COLORS.error} /></button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {Array(exercise.sets).fill(0).map((_, setIdx) => {
                    const completedSet = exCompletedSets[setIdx];
                    return (
                      <div key={setIdx} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: completedSet ? COLORS.success + '20' : COLORS.surfaceLight, color: completedSet ? COLORS.success : COLORS.textMuted }}>
                        {completedSet ? `${completedSet.weight}×${completedSet.reps}` : `Set ${setIdx + 1}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAddExercise(true)} className="w-full p-4 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.surfaceLight, border: `2px dashed ${COLORS.textMuted}` }}>
            <Plus size={18} color={COLORS.textMuted} /><span style={{ color: COLORS.textMuted }}>Add Exercise</span>
          </button>
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="h-full rounded-full" style={{ backgroundColor: COLORS.primary, width: `${progressPercent}%` }} />
          </div>
          <button onClick={() => {
            // Make sure set timer is running if not resting
            if (!isResting && !setStartTime) {
              setSetStartTime(Date.now());
            }
            setPhase('workout');
          }} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Continue Workout</button>
        </div>
      </div>
    );
  }

  // INITIAL OVERVIEW PHASE
  if (phase === 'overview') {
    // Get workout purpose from template
    const workoutPurpose = {
      title: activeWorkout.name,
      focus: activeWorkout.focus,
      description: activeWorkout.description,
      goals: activeWorkout.goals || []
    };
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={onClose}><X size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{workoutPurpose.title}</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="text-center mb-4">
            <span className="text-5xl">💪</span>
            <h3 className="text-2xl font-bold mt-3" style={{ color: COLORS.text }}>Today's Workout</h3>
            <p style={{ color: COLORS.textSecondary }}>{exercisesForTime.length} exercises • ~{availableTime} mins</p>
          </div>
          
          {/* Workout Purpose Section */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.primary + '15', border: `1px solid ${COLORS.primary}40` }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} color={COLORS.primary} />
              <span className="font-semibold" style={{ color: COLORS.primary }}>{workoutPurpose.focus}</span>
            </div>
            <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>{workoutPurpose.description}</p>
            <div className="flex flex-wrap gap-2">
              {workoutPurpose.goals.map((goal, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.surface, color: COLORS.text }}>
                  ✓ {goal}
                </span>
              ))}
            </div>
          </div>

          {/* Injury Recovery Coaching */}
          {injuries.length > 0 && (() => {
            const primaryInjury = injuries[0];
            const currentPhase = getCurrentRecoveryPhase(primaryInjury);
            const phaseInfo = RECOVERY_PHASES[currentPhase];
            const coachingMessage = getCoachingMessage(currentPhase, primaryInjury.muscleGroup);
            const hasRecoveryExercises = exercisesForTime.some(ex => ex.isRecoveryExercise);

            return (
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.warning + '10', border: `1px solid ${COLORS.warning}30` }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{phaseInfo.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Recovery Mode Active</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: INJURY_SEVERITY[primaryInjury.severity].color + '20', color: INJURY_SEVERITY[primaryInjury.severity].color }}>
                        {primaryInjury.muscleGroup}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>{coachingMessage}</p>
                    {hasRecoveryExercises && (
                      <p className="text-xs" style={{ color: COLORS.success }}>
                        ✓ Rehab exercises included • Listen to your body and stop if you feel pain
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="space-y-3 mb-6">
            {exercisesForTime.map((exercise, i) => {
              const isSuperset = exercise.supersetId;
              const isFirstInSuperset = isSuperset && exercise.supersetOrder === 1;
              const isSecondInSuperset = isSuperset && exercise.supersetOrder === 2;

              return (
                <div key={exercise.id}>
                  {/* Superset header - show before first exercise in superset */}
                  {isFirstInSuperset && (
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Zap size={14} color={COLORS.warning} />
                      <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>SUPERSET</span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>— No rest between these exercises</span>
                    </div>
                  )}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: COLORS.surface,
                      ...(isSuperset && {
                        borderLeft: `3px solid ${COLORS.warning}`,
                        borderRadius: isFirstInSuperset ? '12px 12px 0 0' : isSecondInSuperset ? '0 0 12px 12px' : '12px',
                        marginTop: isSecondInSuperset ? '-1px' : 0
                      })
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setShowExerciseHistory(i)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                          <span className="font-bold" style={{ color: COLORS.primary }}>{i + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.name}</p>
                            {exercise.isRecoveryExercise && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                                Rehab
                              </span>
                            )}
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(exercise.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                          </div>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            {isAdvancedUser && exercise.targetedHeads && exercise.targetedHeads.length > 0
                              ? exercise.targetedHeads.join(', ')
                              : exercise.muscleGroup} • {exercise.isRecoveryExercise ? 'Focus on form' : 'Tap to view history'}
                            {isSuperset && <span style={{ color: COLORS.warning }}> — Paired with {exercise.supersetWith}</span>}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.sets} × {exercise.targetReps}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</p>
                        </div>
                        {/* Reorder buttons */}
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveExercise(i, 'up')}
                            disabled={i === 0}
                            className="p-1 rounded-t-lg"
                            style={{ backgroundColor: COLORS.surfaceLight, opacity: i === 0 ? 0.4 : 1 }}
                          >
                            <ChevronUp size={14} color={COLORS.textMuted} />
                          </button>
                          <button
                            onClick={() => moveExercise(i, 'down')}
                            disabled={i === exercises.length - 1}
                            className="p-1 rounded-b-lg"
                            style={{ backgroundColor: COLORS.surfaceLight, opacity: i === exercises.length - 1 ? 0.4 : 1 }}
                          >
                            <ChevronDown size={14} color={COLORS.textMuted} />
                          </button>
                        </div>
                        <button onClick={() => setShowSwapExercise(i)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                          <ArrowLeftRight size={16} color={COLORS.textMuted} />
                        </button>
                        {exercises.length > 1 && (
                          <button onClick={() => removeExercise(i)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '20' }}>
                            <X size={16} color={COLORS.error} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                      {/* Previous Session Summary */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>LAST SESSION</span>
                        {exercise.lastWeight > 0 && (
                          <span className="text-xs font-bold" style={{ color: COLORS.text }}>{exercise.lastWeight}kg</span>
                        )}
                      </div>
                      {exercise.lastWeight > 0 ? (
                        <div className="flex gap-1 mb-2">
                          {exercise.lastReps?.map((reps, idx) => (
                            <div key={idx} className="flex-1 p-1.5 rounded text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                              <p className="text-xs font-bold" style={{ color: COLORS.text }}>{reps}</p>
                              <p className="text-[10px]" style={{ color: COLORS.textMuted }}>Set {idx + 1}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>No previous data - first time!</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {exercise.suggestedWeight > 0 && (
                            <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                              <TrendingUp size={12} /> Target: {exercise.suggestedWeight}kg × {exercise.targetReps}
                            </span>
                          )}
                          {exercise.suggestedWeight > (exercise.lastWeight || 0) && exercise.lastWeight > 0 && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>↑ +{(exercise.suggestedWeight - exercise.lastWeight).toFixed(1)}kg</span>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                          {isSuperset && exercise.restTime === 0 ? 'No rest' : `${Math.floor((exercise.restTime || 90) / 60)}:${((exercise.restTime || 90) % 60).toString().padStart(2, '0')} rest`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowAddExercise(true)} className="w-full p-4 rounded-xl flex items-center justify-center gap-2 mb-4" style={{ backgroundColor: COLORS.surfaceLight, border: `2px dashed ${COLORS.textMuted}` }}>
            <Plus size={18} color={COLORS.textMuted} /><span style={{ color: COLORS.textMuted }}>Add Exercise</span>
          </button>

          {/* Time Breakdown Overview */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} color={COLORS.primary} />
              <span className="font-semibold" style={{ color: COLORS.text }}>Workout Time Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                <p className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {Math.floor(timeBreakdown.workingTime / 60)}:{(timeBreakdown.workingTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Working Time</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.warning + '15' }}>
                <p className="text-xl font-bold" style={{ color: COLORS.warning }}>
                  {Math.floor(timeBreakdown.restTime / 60)}:{(timeBreakdown.restTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Rest Time</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.text }}>Total Duration</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  Incl. {Math.floor(WORKOUT_TIMING.WARMUP_TIME / 60)} min warmup + {Math.floor(WORKOUT_TIMING.COOLDOWN_TIME / 60)} min cooldown
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
                  ~{Math.round(timeBreakdown.totalTime / 60)} min
                </p>
                {Math.abs(timeBreakdown.totalTime / 60 - availableTime) <= 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                    ✓ On target
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs space-y-1" style={{ color: COLORS.textMuted }}>
              <div className="flex justify-between">
                <span>• {totalSets} total sets × ~{WORKOUT_TIMING.AVG_SET_DURATION}s avg</span>
                <span>{Math.floor(timeBreakdown.workingTime / 60)}m working</span>
              </div>
              <div className="flex justify-between">
                <span>• Rest periods adjusted for {availableTime} min target</span>
                <span>~{Math.round((timeBreakdown.restTime / (totalSets - exercisesForTime.length)) || 0)}s/set</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>💡 <strong style={{ color: COLORS.text }}>Tip:</strong> Exercises are auto-ordered for your goal. Rest times and sets have been adjusted to fit your {availableTime} min target.</p>
          </div>
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={async () => {
            const now = Date.now();
            setWorkoutStartTime(now);
            setSetStartTime(now);

            // Start workout session in Supabase
            if (userId) {
              try {
                const { data: session } = await workoutService.startWorkout(userId, null, null, workoutName);
                if (session) {
                  setSessionId(session.id);
                }
              } catch (err) {
                console.error('Error starting workout session:', err);
              }
            }

            setPhase('workout');
          }} className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Start Workout <Play size={20} /></button>
        </div>
      </div>
    );
  }

  // COMPLETE PHASE
  if (phase === 'complete') {
    // Calculate workout stats
    const totalVolume = completedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
    const totalReps = completedSets.reduce((acc, set) => acc + set.reps, 0);
    const avgRPE = completedSets.length > 0 
      ? (completedSets.reduce((acc, set) => acc + (set.rpe || 5), 0) / completedSets.length).toFixed(1)
      : 5;
    
    // Actual workout duration (start to end)
    const actualEndTime = workoutEndTime || Date.now();
    const totalDurationMs = workoutStartTime ? (actualEndTime - workoutStartTime) : 0;
    const totalDurationMins = Math.round(totalDurationMs / 60000);
    
    // Working time (time actually doing sets, excluding rest)
    const workingTimeMins = Math.round(totalWorkingTime / 60);
    
    // Rest time in minutes
    const restTimeMins = Math.round(totalRestTime / 60);
    
    // Estimate calories burned based on actual working time and intensity
    // Formula: ~8-12 cal/min for active weight training, adjusted by RPE
    const intensityMultiplier = avgRPE / 7;
    const caloriesBurned = Math.round(workingTimeMins * 10 * intensityMultiplier + restTimeMins * 2);
    
    // Check for PRs - compare each exercise's best set to their history
    const prsAchieved = [];
    exercisesForTime.forEach(exercise => {
      const exerciseSets = completedSets.filter(s => s.exerciseId === exercise.id);
      if (exerciseSets.length === 0) return;
      
      // Find best set by estimated 1RM (Epley formula: weight * (1 + reps/30))
      const bestSet = exerciseSets.reduce((best, set) => {
        const e1rm = set.weight * (1 + set.reps / 30);
        const bestE1rm = best.weight * (1 + best.reps / 30);
        return e1rm > bestE1rm ? set : best;
      });
      
      const currentE1rm = bestSet.weight * (1 + bestSet.reps / 30);
      
      // Compare to history (if available)
      const historyMax = exercise.history?.length > 0 
        ? Math.max(...exercise.history.map(h => h.e1rm || 0))
        : 0;
      
      // Also check against last workout
      const lastMax = exercise.lastWeight * (1 + Math.max(...(exercise.lastReps || [0])) / 30);
      const previousBest = Math.max(historyMax, lastMax);
      
      if (currentE1rm > previousBest && previousBest > 0) {
        prsAchieved.push({
          exercise: exercise.name,
          type: 'E1RM',
          value: `${currentE1rm.toFixed(1)}kg`,
          improvement: `+${(currentE1rm - previousBest).toFixed(1)}kg`
        });
      }
      
      // Check for weight PR
      if (bestSet.weight > exercise.lastWeight && exercise.lastWeight > 0) {
        // Only add if not already captured by E1RM
        if (!prsAchieved.find(pr => pr.exercise === exercise.name)) {
          prsAchieved.push({
            exercise: exercise.name,
            type: 'Weight',
            value: `${bestSet.weight}kg`,
            improvement: `+${(bestSet.weight - exercise.lastWeight).toFixed(1)}kg`
          });
        }
      }
    });
    
    // Group sets by exercise for breakdown - include actual set data
    const exerciseBreakdown = exercisesForTime.map(exercise => {
      const sets = completedSets.filter(s => s.exerciseId === exercise.id);
      const volume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
      return {
        name: exercise.name,
        sets: sets.length,
        targetSets: exercise.sets,
        volume,
        setDetails: sets.map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }))
      };
    }).filter(e => e.sets > 0);
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={onClose}><X size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout Summary</h2>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {/* Hero Section */}
          <div className="text-center mb-6">
            <span className="text-6xl mb-2 block">🎉</span>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>Workout Complete!</h2>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{activeWorkout.name} • {totalDurationMins} mins</p>
          </div>
          
          {/* Time Breakdown */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} color={COLORS.primary} />
                <span className="font-semibold" style={{ color: COLORS.text }}>Time Breakdown</span>
              </div>
              <span className="text-lg font-bold" style={{ color: COLORS.primary }}>{totalDurationMins} min total</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.success + '15' }}>
                <p className="text-lg font-bold" style={{ color: COLORS.success }}>{workingTimeMins}m</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Working</p>
              </div>
              <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.accent + '15' }}>
                <p className="text-lg font-bold" style={{ color: COLORS.accent }}>{restTimeMins}m</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Resting</p>
              </div>
              <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                <p className="text-lg font-bold" style={{ color: COLORS.text }}>{Math.round((workingTimeMins / Math.max(totalDurationMins, 1)) * 100)}%</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Efficiency</p>
              </div>
            </div>
          </div>
          
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-3xl font-bold" style={{ color: COLORS.accent }}>🔥 {caloriesBurned}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Calories Burned</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>{(totalVolume / 1000).toFixed(1)}k</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>kg Volume</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xl font-bold" style={{ color: COLORS.text }}>{completedSetsCount}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Sets</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xl font-bold" style={{ color: COLORS.text }}>{totalReps}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Reps</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xl font-bold" style={{ color: COLORS.text }}>{avgRPE}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Avg RPE</p>
            </div>
          </div>
          
          {/* PRs Achieved Section */}
          {prsAchieved.length > 0 && (
            <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: COLORS.warning + '15', border: `1px solid ${COLORS.warning}40` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏆</span>
                <h3 className="font-bold" style={{ color: COLORS.warning }}>Personal Records!</h3>
              </div>
              <div className="space-y-2">
                {prsAchieved.map((pr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{pr.exercise}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{pr.type} PR</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: COLORS.warning }}>{pr.value}</p>
                      <p className="text-xs" style={{ color: COLORS.success }}>{pr.improvement}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Exercise Breakdown */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <Dumbbell size={16} /> Exercise Breakdown
            </h3>
            <div className="space-y-3">
              {exerciseBreakdown.map((ex, idx) => (
                <div key={idx} className="pb-3 border-b" style={{ borderColor: COLORS.surfaceLight }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ex.sets === ex.targetSets ? (
                        <Check size={16} color={COLORS.success} />
                      ) : (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.warning + '40' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: COLORS.text }}>{ex.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{ex.volume}kg vol</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {ex.setDetails.map((set, setIdx) => (
                      <div key={setIdx} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <span style={{ color: COLORS.text }}>{set.weight}kg × {set.reps}</span>
                        {set.rpe && <span style={{ color: COLORS.textMuted }}> @{set.rpe}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Workout Media Section */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <Eye size={16} /> Add Photos/Videos
            </h3>
            <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
              Document your workout with progress photos or form check videos
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const newMedia = files.map(file => ({
                  id: Date.now() + Math.random(),
                  file,
                  url: URL.createObjectURL(file),
                  type: file.type.startsWith('video') ? 'video' : 'image',
                  name: file.name,
                }));
                setWorkoutMedia(prev => [...prev, ...newMedia]);
                e.target.value = ''; // Reset input
              }}
            />

            {/* Media Preview Grid */}
            {workoutMedia.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {workoutMedia.map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                    {media.type === 'image' ? (
                      <img src={media.url} alt="Workout" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={24} color={COLORS.text} />
                        <video src={media.url} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(media.url);
                        setWorkoutMedia(prev => prev.filter(m => m.id !== media.id));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.error }}
                    >
                      <X size={12} color={COLORS.text} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}
            >
              <Plus size={18} />
              <span className="font-medium">Add Photo or Video</span>
            </button>
          </div>

          {/* Success Message */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.success + '15' }}>
            <p className="text-sm text-center" style={{ color: COLORS.success }}>
              ✓ Progress saved! {prsAchieved.length > 0 ? `Amazing work on ${prsAchieved.length} PR${prsAchieved.length > 1 ? 's' : ''}!` : 'Keep pushing for those PRs!'}
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button
            disabled={isSaving}
            onClick={async () => {
              // Save workout to Supabase
              if (userId && sessionId) {
                setIsSaving(true);
                try {
                  // Save each set
                  for (const set of completedSets) {
                    const exercise = exercisesForTime.find(e => e.id === set.exerciseId);
                    await workoutService.logSet(sessionId, null, exercise?.name || 'Unknown', {
                      setNumber: set.setIndex + 1,
                      weight: set.weight,
                      reps: set.reps,
                      rpe: set.rpe,
                    });

                    // Check for PRs
                    if (exercise) {
                      await workoutService.checkAndCreatePR(
                        userId,
                        null,
                        exercise.name,
                        set.weight,
                        set.reps,
                        sessionId
                      );
                    }
                  }

                  // Complete the session
                  await workoutService.completeWorkout(sessionId, {
                    durationMinutes: totalDurationMins,
                    totalVolume,
                    workingTime: totalWorkingTime,
                    restTime: totalRestTime,
                  });
                } catch (err) {
                  console.error('Error saving workout:', err);
                } finally {
                  setIsSaving(false);
                }
              }

              if (onComplete) onComplete();
              onClose();
            }}
            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.success, color: COLORS.text, opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><Check size={20} /> Return to App</>}
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE WORKOUT PHASE (rest timer now inline)
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose}><X size={24} color={COLORS.text} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{currentExercise.name}</h2>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(currentExercise.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
            </div>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{currentExercise.muscleGroup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSwapExercise(currentExerciseIndex)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}><Undo2 size={16} color={COLORS.textMuted} /></button>
          <button onClick={() => setPhase('workoutOverview')} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}>Overview</button>
          <div className="flex items-center">
            <button onClick={() => removeSetFromExercise(currentExerciseIndex)} disabled={currentExercise.sets <= 1} className="p-1 rounded-l-lg" style={{ backgroundColor: COLORS.surfaceLight, opacity: currentExercise.sets <= 1 ? 0.4 : 1 }}><Minus size={14} color={COLORS.textMuted} /></button>
            <span className="px-3 py-1 text-sm font-semibold" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>Set {currentSetIndex + 1}/{currentExercise.sets}</span>
            <button onClick={() => addSetToExercise(currentExerciseIndex)} className="p-1 rounded-r-lg" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={14} color={COLORS.textMuted} /></button>
          </div>
        </div>
      </div>
      
      {/* Inline Rest Timer Banner */}
      {isResting && (
        <div className="p-4" style={{ backgroundColor: COLORS.accent + '15' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.accent + '30', border: `3px solid ${COLORS.accent}` }}
              >
                <p className="text-xl font-bold" style={{ color: COLORS.accent }}>{formatTime(restTimeLeft)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Rest Time</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Next: {currentExercise.name} - Set {currentSetIndex + 1}</p>
              </div>
            </div>
            <button 
              onClick={() => { 
                // Adjust rest time - subtract skipped time
                setTotalRestTime(prev => prev - restTimeLeft);
                setIsResting(false); 
                setRestTimeLeft(0);
                setSetStartTime(Date.now()); // Start timing next set
              }} 
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: COLORS.accent, color: COLORS.text }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4">
        {/* Target Section */}
        <div className="p-5 rounded-2xl mb-3" style={{ backgroundColor: COLORS.primary + '15', border: `2px solid ${COLORS.primary}40` }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target size={16} color={COLORS.primary} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.primary }}>Target for Set {currentSetIndex + 1}</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>{currentExercise.suggestedWeight}</p>
              <p className="text-xs font-medium" style={{ color: COLORS.primary }}>kg</p>
            </div>
            <span className="text-3xl font-light" style={{ color: COLORS.primary }}>×</span>
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>{currentExercise.targetReps}</p>
              <p className="text-xs font-medium" style={{ color: COLORS.primary }}>reps</p>
            </div>
          </div>
          {currentExercise.suggestedWeight > currentExercise.lastWeight && currentExercise.lastWeight > 0 && (
            <div className="mt-3 text-center">
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                ↑ Progressive Overload: +{(currentExercise.suggestedWeight - currentExercise.lastWeight).toFixed(1)}kg from last session
              </span>
            </div>
          )}
        </div>

        {/* Previous Session Reference */}
        <div className="p-4 rounded-xl mb-3" style={{ backgroundColor: COLORS.surface }}>
          <div className="flex items-center gap-2 mb-3">
            <History size={14} color={COLORS.textMuted} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Last Session Performance</p>
          </div>
          {currentExercise.lastWeight > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl flex-1 text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{currentExercise.lastWeight}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>kg used</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-lg" style={{ color: COLORS.textMuted }}>×</p>
                </div>
                <div className="p-3 rounded-xl flex-1 text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{currentExercise.lastReps[currentSetIndex] || currentExercise.lastReps[0]}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>reps (set {currentSetIndex + 1})</p>
                </div>
              </div>
              <div className="flex gap-1">
                {currentExercise.lastReps?.map((reps, idx) => (
                  <div
                    key={idx}
                    className="flex-1 p-2 rounded text-center"
                    style={{
                      backgroundColor: idx === currentSetIndex ? COLORS.accent + '20' : COLORS.surfaceLight,
                      border: idx === currentSetIndex ? `1px solid ${COLORS.accent}` : '1px solid transparent'
                    }}
                  >
                    <p className="text-sm font-bold" style={{ color: idx === currentSetIndex ? COLORS.accent : COLORS.text }}>{reps}</p>
                    <p className="text-[10px]" style={{ color: COLORS.textMuted }}>S{idx + 1}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center mt-2" style={{ color: COLORS.textMuted }}>
                All sets from last session • Current set highlighted
              </p>
            </>
          ) : (
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
              <Sparkles size={20} color={COLORS.accent} className="mx-auto mb-2" />
              <p className="text-sm font-medium" style={{ color: COLORS.text }}>First time doing this exercise!</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Start with a comfortable weight and focus on form</p>
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
          <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Log your actual performance:</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Weight (kg)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentSetData(prev => ({...prev, weight: Math.max(0, prev.weight - 2.5)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                <input
                  type="number"
                  value={currentSetData.weight || ''}
                  onChange={e => setCurrentSetData(prev => ({...prev, weight: parseFloat(e.target.value) || 0}))}
                  onBlur={e => setCurrentSetData(prev => ({...prev, weight: Number(prev.weight) || 0}))}
                  className="flex-1 p-3 rounded-lg text-center text-xl font-bold"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                />
                <button onClick={() => setCurrentSetData(prev => ({...prev, weight: prev.weight + 2.5}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Reps</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentSetData(prev => ({...prev, reps: Math.max(0, prev.reps - 1)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                <input
                  type="number"
                  value={currentSetData.reps || ''}
                  onChange={e => setCurrentSetData(prev => ({...prev, reps: parseInt(e.target.value) || 0}))}
                  onBlur={e => setCurrentSetData(prev => ({...prev, reps: Number(prev.reps) || 0}))}
                  className="flex-1 p-3 rounded-lg text-center text-xl font-bold"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                />
                <button onClick={() => setCurrentSetData(prev => ({...prev, reps: prev.reps + 1}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
              </div>
            </div>
          </div>
          
          {/* RPE Selector */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: COLORS.textMuted }}>RPE (Rate of Perceived Exertion)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                <button
                  key={rpe}
                  onClick={() => setCurrentSetData(prev => ({...prev, rpe}))}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ 
                    backgroundColor: currentSetData.rpe === rpe ? COLORS.accent : COLORS.surfaceLight,
                    color: currentSetData.rpe === rpe ? COLORS.text : COLORS.textMuted
                  }}
                >
                  {rpe}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1 text-center" style={{ color: COLORS.textMuted }}>
              {currentSetData.rpe === 1 && 'Warm up - very light'}
              {currentSetData.rpe === 2 && 'Light - easy effort'}
              {currentSetData.rpe === 3 && 'Light - could do many more'}
              {currentSetData.rpe === 4 && 'Moderate - comfortable pace'}
              {currentSetData.rpe === 5 && 'Moderate - starting to work'}
              {currentSetData.rpe === 6 && 'Moderate-hard - 4+ reps left'}
              {currentSetData.rpe === 7 && 'Hard - 3 reps left'}
              {currentSetData.rpe === 8 && 'Very hard - 2 reps left'}
              {currentSetData.rpe === 9 && 'Near max - 1 rep left'}
              {currentSetData.rpe === 10 && 'Failure - no more reps possible'}
            </p>
          </div>
        </div>
        
        <div className="p-3 rounded-xl mb-4 flex items-center gap-3" style={{ backgroundColor: COLORS.accent + '15' }}><Clock size={18} color={COLORS.accent} /><p className="text-sm" style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.accent }}>{formatTime(currentExercise.restTime)}</strong> rest after this set</p></div>
        
        {/* Completed Sets - Clickable to edit */}
        {completedSets.filter(s => s.exerciseId === currentExercise.id).length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Completed Sets <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>(tap to edit)</span></p>
            <div className="flex gap-2 flex-wrap">
              {completedSets.filter(s => s.exerciseId === currentExercise.id).map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => { setEditingSet({ exerciseId: s.exerciseId, setIndex: s.setIndex }); setEditSetData({ weight: s.weight, reps: s.reps, rpe: s.rpe || 5 }); }}
                  className="px-3 py-2 rounded-lg" 
                  style={{ backgroundColor: COLORS.success + '20' }}
                >
                  <p className="text-xs font-semibold" style={{ color: COLORS.success }}>Set {i + 1}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{s.weight}kg × {s.reps}</p>
                  {s.rpe && <p className="text-xs" style={{ color: COLORS.accent }}>RPE {s.rpe}</p>}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Full Workout List Button */}
        <button 
          onClick={() => setShowFullWorkoutList(true)}
          className="w-full p-3 rounded-xl mb-4 flex items-center justify-between"
          style={{ backgroundColor: COLORS.surfaceLight }}
        >
          <div className="flex items-center gap-2">
            <Book size={18} color={COLORS.textMuted} />
            <span className="text-sm" style={{ color: COLORS.text }}>View Full Workout</span>
          </div>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </button>
        
        {/* Up Next Preview */}
        {getUpcomingExercises().length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Up Next</p>
            <div className="space-y-2">
              {getUpcomingExercises().slice(0, 2).map((ex, i) => (
                <button 
                  key={ex.id} 
                  onClick={() => skipToExercise(currentExerciseIndex + 1 + i)}
                  className="w-full p-3 rounded-lg flex items-center justify-between" 
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>{currentExerciseIndex + 2 + i}.</span>
                    <span className="text-sm" style={{ color: COLORS.text }}>{ex.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>{ex.sets} × {ex.targetReps}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
        <div className="flex items-center justify-between mb-2"><span className="text-sm" style={{ color: COLORS.textMuted }}>Progress</span><span className="text-sm font-semibold" style={{ color: COLORS.text }}>{completedSetsCount}/{totalSets} sets</span></div>
        <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: COLORS.surfaceLight }}><div className="h-full rounded-full transition-all" style={{ backgroundColor: COLORS.primary, width: `${progressPercent}%` }} /></div>
        <div className="flex gap-3">
          <button onClick={() => setShowEndWorkoutConfirm(true)} className="px-4 py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.error }}>End</button>
          <button onClick={completeSet} className="flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.success, color: COLORS.text }}><Check size={20} /> Complete Set</button>
        </div>
      </div>
      
      {/* Full Workout List Modal */}
      {showFullWorkoutList && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFullWorkoutList(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Full Workout</h3>
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted }}>{completedSetsCount}/{totalSets} sets</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {exercisesForTime.map((ex, exIndex) => {
              const completedForEx = completedSets.filter(s => s.exerciseId === ex.id);
              const isCurrentExercise = exIndex === currentExerciseIndex;
              
              return (
                <div key={ex.id} className="mb-4">
                  <div 
                    className="p-3 rounded-t-xl flex items-center justify-between"
                    style={{ 
                      backgroundColor: isCurrentExercise ? COLORS.primary + '20' : COLORS.surface,
                      borderLeft: isCurrentExercise ? `3px solid ${COLORS.primary}` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: isCurrentExercise ? COLORS.primary : COLORS.textMuted }}>{exIndex + 1}.</span>
                      <span className="font-semibold" style={{ color: COLORS.text }}>{ex.name}</span>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(ex.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={12} color={COLORS.primary} /></button>
                      {isCurrentExercise && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Current</span>}
                    </div>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{ex.suggestedWeight}kg</span>
                  </div>
                  <div className="rounded-b-xl overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                    {Array.from({ length: ex.sets }).map((_, setIdx) => {
                      const completedSet = completedForEx.find(s => s.setIndex === setIdx);
                      const isCurrentSet = isCurrentExercise && setIdx === currentSetIndex;
                      const isPastSet = exIndex < currentExerciseIndex || (isCurrentExercise && setIdx < currentSetIndex);
                      
                      return (
                        <button
                          key={setIdx}
                          onClick={() => {
                            if (!completedSet) skipToExercise(exIndex, setIdx);
                          }}
                          disabled={completedSet}
                          className="w-full p-3 flex items-center justify-between border-b last:border-b-0"
                          style={{ 
                            borderColor: COLORS.surface,
                            backgroundColor: completedSet ? COLORS.success + '10' : isCurrentSet ? COLORS.primary + '10' : 'transparent'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {completedSet ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success }}>
                                <Check size={14} color={COLORS.text} />
                              </div>
                            ) : isCurrentSet ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                                <Play size={12} color={COLORS.text} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.surface }}>
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>{setIdx + 1}</span>
                              </div>
                            )}
                            <span className="text-sm" style={{ color: completedSet ? COLORS.success : COLORS.text }}>Set {setIdx + 1}</span>
                          </div>
                          <div className="text-right">
                            {completedSet ? (
                              <div>
                                <span className="text-sm font-semibold" style={{ color: COLORS.success }}>{completedSet.weight}kg × {completedSet.reps}</span>
                                {completedSet.rpe && <span className="text-xs ml-2" style={{ color: COLORS.accent }}>RPE {completedSet.rpe}</span>}
                              </div>
                            ) : (
                              <span className="text-sm" style={{ color: COLORS.textMuted }}>{ex.suggestedWeight}kg × {ex.targetReps}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {/* Rest indicator after exercise */}
                    {exIndex < exercisesForTime.length - 1 && (
                      <div className="p-2 flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.accent + '10' }}>
                        <Clock size={12} color={COLORS.accent} />
                        <span className="text-xs" style={{ color: COLORS.accent }}>{formatTime(ex.restTime)} rest</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowFullWorkoutList(false)} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Back to Workout</button>
          </div>
        </div>
      )}
      
      {/* Edit Set Modal */}
      {editingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Edit Set</h3>
              <button onClick={() => setEditingSet(null)} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}><X size={20} color={COLORS.textMuted} /></button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Weight (kg)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditSetData(prev => ({...prev, weight: Math.max(0, prev.weight - 2.5)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                  <input type="number" value={editSetData.weight} onChange={e => setEditSetData(prev => ({...prev, weight: parseFloat(e.target.value) || 0}))} className="flex-1 p-3 rounded-lg text-center text-xl font-bold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }} />
                  <button onClick={() => setEditSetData(prev => ({...prev, weight: prev.weight + 2.5}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Reps</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditSetData(prev => ({...prev, reps: Math.max(0, prev.reps - 1)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                  <input type="number" value={editSetData.reps} onChange={e => setEditSetData(prev => ({...prev, reps: parseInt(e.target.value) || 0}))} className="flex-1 p-3 rounded-lg text-center text-xl font-bold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }} />
                  <button onClick={() => setEditSetData(prev => ({...prev, reps: prev.reps + 1}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
                </div>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: COLORS.textMuted }}>RPE</label>
                <div className="flex gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                    <button
                      key={rpe}
                      onClick={() => setEditSetData(prev => ({...prev, rpe}))}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold min-w-[28px]"
                      style={{ 
                        backgroundColor: editSetData.rpe === rpe ? COLORS.accent : COLORS.surfaceLight,
                        color: editSetData.rpe === rpe ? COLORS.text : COLORS.textMuted
                      }}
                    >
                      {rpe}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setEditingSet(null)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>Cancel</button>
              <button onClick={() => updateCompletedSet(editingSet.exerciseId, editingSet.setIndex, editSetData)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* End Workout Confirmation */}
      {showEndWorkoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.error + '20' }}>
                <X size={32} color={COLORS.error} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>End Workout Early?</h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                You've completed {completedSetsCount} of {totalSets} sets. Your progress will be saved.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndWorkoutConfirm(false)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}>Continue</button>
              <button onClick={endWorkoutEarly} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.error, color: COLORS.text }}>End Workout</button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Info Modal */}
      {showExerciseInfoModal && (
        <ExerciseInfoModal
          COLORS={COLORS}
          exerciseName={showExerciseInfoModal}
          onClose={() => setShowExerciseInfoModal(null)}
        />
      )}
    </div>
  );
}


export default ActiveWorkoutScreen;
