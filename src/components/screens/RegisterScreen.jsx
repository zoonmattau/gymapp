import React, { useState } from 'react';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function RegisterScreen({ onBack, onRegister, COLORS }) {
  const [regData, setRegData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', dob: '', weight: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signUp } = useAuth();

  const isValid = regData.firstName && regData.lastName && regData.email &&
    regData.password && regData.password.length >= 6 && regData.password === regData.confirmPassword;

  const handleRegister = async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await signUp({
      email: regData.email,
      password: regData.password,
      firstName: regData.firstName,
      lastName: regData.lastName,
      dob: regData.dob || null,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Pass user data to continue to onboarding
      onRegister(regData);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
        <button onClick={onBack} disabled={loading}><ChevronLeft size={24} color={COLORS.text} /></button>
        <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Create Account</h2>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: COLORS.error + '20' }}>
            <AlertCircle size={18} color={COLORS.error} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>First Name</label>
              <input type="text" placeholder="First name" value={regData.firstName}
                onChange={e => setRegData(p => ({...p, firstName: e.target.value}))}
                disabled={loading}
                className="w-full p-4 rounded-xl outline-none"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            </div>
            <div className="flex-1">
              <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Last Name</label>
              <input type="text" placeholder="Last name" value={regData.lastName}
                onChange={e => setRegData(p => ({...p, lastName: e.target.value}))}
                disabled={loading}
                className="w-full p-4 rounded-xl outline-none"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            </div>
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Email</label>
            <input type="email" placeholder="your@email.com" value={regData.email}
              onChange={e => setRegData(p => ({...p, email: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Password</label>
            <input type="password" placeholder="••••••••" value={regData.password}
              onChange={e => setRegData(p => ({...p, password: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            {regData.password && regData.password.length < 6 && (
              <p className="text-xs mt-1" style={{ color: COLORS.warning }}>Password must be at least 6 characters</p>
            )}
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={regData.confirmPassword}
              onChange={e => setRegData(p => ({...p, confirmPassword: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text,
                border: `1px solid ${regData.confirmPassword && regData.password !== regData.confirmPassword ? COLORS.error : COLORS.surfaceLight}` }} />
            {regData.confirmPassword && regData.password !== regData.confirmPassword && (
              <p className="text-xs mt-1" style={{ color: COLORS.error }}>Passwords don't match</p>
            )}
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Date of Birth</label>
            <input type="date" value={regData.dob}
              onChange={e => setRegData(p => ({...p, dob: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Used to calculate your fitness metrics</p>
          </div>
        </div>
      </div>
      <div className="p-6 border-t" style={{ borderColor: COLORS.surfaceLight }}>
        <button onClick={handleRegister} disabled={!isValid || loading}
          className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.primary, color: COLORS.text, opacity: isValid && !loading ? 1 : 0.5 }}>
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </div>
    </div>
  );
}

// Workout time calculation constants and helpers (outside component for initialization)
const WORKOUT_TIMING = {
  AVG_SET_DURATION: 45, // Average time to complete one set (seconds)
  WARMUP_TIME: 180, // 3 minutes warmup
  COOLDOWN_TIME: 120, // 2 minutes cooldown
  TRANSITION_TIME: 30, // Time to move between exercises
};

const calculateWorkoutDuration = (exerciseList) => {
  if (!exerciseList || exerciseList.length === 0) return 0;
  let totalSeconds = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME;
  exerciseList.forEach((ex, exIndex) => {
    const sets = ex.sets || 3;
    const restTime = ex.restTime || 90;
    totalSeconds += sets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalSeconds += (sets - 1) * restTime;
    if (exIndex < exerciseList.length - 1) totalSeconds += WORKOUT_TIMING.TRANSITION_TIME;
  });
  return totalSeconds;
};

const optimizeExercisesForTime = (exerciseList, targetMinutes) => {
  if (!exerciseList || exerciseList.length === 0) return exerciseList;
  const targetSeconds = targetMinutes * 60;

  // Calculate fixed time components
  const fixedTime = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME +
    (exerciseList.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;

  // Start with base exercises
  let optimized = exerciseList.map(ex => ({ ...ex, sets: ex.sets || 3 }));

  // Calculate total sets and working time
  let totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
  let workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;

  // Calculate total rest periods needed (sets - exercises, since no rest after last set of each exercise)
  let totalRestPeriods = totalSets - optimized.length;

  // Available time for rest
  let availableRestTime = targetSeconds - fixedTime - workingTime;

  // If we have negative rest time, we need to reduce sets
  while (availableRestTime < totalRestPeriods * 30 && optimized.some(ex => ex.sets > 2)) {
    // Reduce sets from exercise with most sets
    const maxSetsEx = optimized.reduce((max, ex) => (ex.sets > max.sets) ? ex : max, optimized[0]);
    if (maxSetsEx.sets <= 2) break;
    const idx = optimized.findIndex(ex => ex.id === maxSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets - 1 };

    // Recalculate
    totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalRestPeriods = totalSets - optimized.length;
    availableRestTime = targetSeconds - fixedTime - workingTime;
  }

  // If we have too much time, add sets
  while (availableRestTime > totalRestPeriods * 180 && optimized.some(ex => ex.sets < 5)) {
    const minSetsEx = optimized.reduce((min, ex) => (ex.sets < min.sets && ex.sets < 5) ? ex : min, optimized[0]);
    if (minSetsEx.sets >= 5) break;
    const idx = optimized.findIndex(ex => ex.id === minSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets + 1 };

    // Recalculate
    totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalRestPeriods = totalSets - optimized.length;
    availableRestTime = targetSeconds - fixedTime - workingTime;
  }

  // Now distribute rest time EVENLY across all rest periods
  const restPerPeriod = totalRestPeriods > 0
    ? Math.max(30, Math.min(180, Math.round(availableRestTime / totalRestPeriods)))
    : 90;

  // Apply the same rest time to ALL exercises (even distribution)
  optimized = optimized.map(ex => ({
    ...ex,
    restTime: restPerPeriod
  }));

  return optimized;
};

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

// Optimize exercises for a specific time AND exercise count
// This allows users to have more or fewer exercises while keeping the same total time
// workoutType is optional - if provided, ensures all target muscle groups are covered
const optimizeExercisesForTimeAndCount = (baseExerciseList, fullExercisePool, targetMinutes, targetExerciseCount, workoutType = null) => {
  if (!baseExerciseList || baseExerciseList.length === 0) return baseExerciseList;
  const targetSeconds = targetMinutes * 60;

  let exercises = [...baseExerciseList];
  const defaultCount = Math.max(2, Math.floor(targetMinutes / 12));
  const targetCount = targetExerciseCount || defaultCount;
  const isShortening = targetCount < baseExerciseList.length;

  // If we need more exercises, add from the pool
  if (targetCount > exercises.length && fullExercisePool.length > exercises.length) {
    const currentIds = exercises.map(ex => ex.id);
    const additionalExercises = fullExercisePool
      .filter(ex => !currentIds.includes(ex.id))
      .slice(0, targetCount - exercises.length);
    exercises = [...exercises, ...additionalExercises];
  }

  // If we need fewer exercises, intelligently select which to keep
  if (targetCount < exercises.length) {
    // Prioritize keeping compounds and ensuring muscle group coverage
    const compounds = exercises.filter(ex => ex.exerciseType === 'compound');
    const isolations = exercises.filter(ex => ex.exerciseType !== 'compound');

    // Keep all compounds first (up to target count)
    const toKeep = compounds.slice(0, targetCount);

    // Fill remaining slots with isolations, prioritizing variety
    if (toKeep.length < targetCount) {
      const musclesCovered = new Set(toKeep.map(ex => ex.muscleGroup));
      // First add isolations targeting muscles not yet covered
      const uncoveredIsolations = isolations.filter(ex => !musclesCovered.has(ex.muscleGroup));
      const coveredIsolations = isolations.filter(ex => musclesCovered.has(ex.muscleGroup));
      const orderedIsolations = [...uncoveredIsolations, ...coveredIsolations];
      toKeep.push(...orderedIsolations.slice(0, targetCount - toKeep.length));
    }

    exercises = toKeep;
  }

  // Ensure muscle group coverage if we shortened the workout
  if (isShortening && workoutType) {
    exercises = ensureMuscleGroupCoverage(exercises, workoutType, fullExercisePool);
  }

  // Calculate fixed time components
  const fixedTime = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME +
    (exercises.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;

  // Start with base sets
  let optimized = exercises.map(ex => ({ ...ex, sets: ex.sets || 3 }));

  // Helper function to recalculate timing values
  const recalculate = () => {
    const totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    const workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    const totalRestPeriods = totalSets - optimized.length;
    const availableRestTime = targetSeconds - fixedTime - workingTime;
    return { totalSets, workingTime, totalRestPeriods, availableRestTime };
  };

  let timing = recalculate();

  // First pass: If more exercises than default, reduce sets to fit
  if (targetCount > defaultCount) {
    while (timing.availableRestTime < timing.totalRestPeriods * 30 && optimized.some(ex => ex.sets > 2)) {
      const maxSetsEx = optimized.reduce((max, ex) => (ex.sets > max.sets) ? ex : max, optimized[0]);
      if (maxSetsEx.sets <= 2) break;
      const idx = optimized.findIndex(ex => ex.id === maxSetsEx.id);
      optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets - 1 };
      timing = recalculate();
    }
  }

  // Second pass: ALWAYS try to fill remaining time by adding sets
  // If rest per period would exceed 120 seconds (2 min), add more sets to use the time productively
  // Max 6 sets per exercise to prevent excessive volume
  const MAX_SETS_PER_EXERCISE = 6;
  const IDEAL_REST_TIME = 90; // Target ~90 seconds rest between sets

  while (timing.totalRestPeriods > 0 &&
         timing.availableRestTime / timing.totalRestPeriods > IDEAL_REST_TIME + 30 &&
         optimized.some(ex => ex.sets < MAX_SETS_PER_EXERCISE)) {
    // Find exercise with fewest sets that's under max
    const minSetsEx = optimized
      .filter(ex => ex.sets < MAX_SETS_PER_EXERCISE)
      .reduce((min, ex) => (ex.sets < min.sets) ? ex : min, optimized.find(ex => ex.sets < MAX_SETS_PER_EXERCISE));

    if (!minSetsEx) break;

    const idx = optimized.findIndex(ex => ex.id === minSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets + 1 };
    timing = recalculate();

    // Safety check: if we've maxed all exercises, stop
    if (optimized.every(ex => ex.sets >= MAX_SETS_PER_EXERCISE)) break;
  }

  // Final recalculation
  timing = recalculate();

  // Distribute rest evenly (min 30s, max 180s)
  const restPerPeriod = timing.totalRestPeriods > 0
    ? Math.max(30, Math.min(180, Math.round(timing.availableRestTime / timing.totalRestPeriods)))
    : 90;

  optimized = optimized.map(ex => ({
    ...ex,
    restTime: restPerPeriod
  }));

  // Reorder exercises to avoid same muscle groups back-to-back
  // This provides better recovery between exercises for the same muscles
  // Skip cardio exercises in reordering (keep them at the end)
  const cardioExercises = optimized.filter(ex => ex.isCardio || ex.muscleGroup === 'Cardio');
  const nonCardioExercises = optimized.filter(ex => !ex.isCardio && ex.muscleGroup !== 'Cardio');
  const reorderedNonCardio = reorderExercisesForRecovery(nonCardioExercises);
  optimized = [...reorderedNonCardio, ...cardioExercises];

  // Check if workout still exceeds target time - if so, try to create supersets
  const currentTotalTime = getWorkoutTimeBreakdown(optimized).totalTime;
  const timeOverTarget = (currentTotalTime - targetSeconds) / 60; // in minutes

  if (timeOverTarget > 2) { // Only superset if we're more than 2 minutes over
    const supersetResult = createSupersets(optimized, timeOverTarget);
    if (supersetResult.supersets.length > 0) {
      return supersetResult.exercises;
    }
  }

  return optimized;
};


export default RegisterScreen;
