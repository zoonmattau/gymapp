// Workout structures for different workout types
export const WORKOUT_STRUCTURES = {
  push: {
    name: 'Push Day',
    primaryMuscles: ['Chest', 'Upper Chest'],
    secondaryMuscles: ['Shoulders', 'Side Delts'],
    tertiaryMuscles: ['Triceps'],
    exerciseCounts: { primary: 2, secondary: 2, tertiary: 1 },
    focus: 'Chest, Shoulders & Triceps',
  },
  pull: {
    name: 'Pull Day',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Rear Delts', 'Traps'],
    tertiaryMuscles: ['Biceps'],
    exerciseCounts: { primary: 3, secondary: 1, tertiary: 2 },
    focus: 'Back & Biceps',
  },
  legs_quad: {
    name: 'Leg Day (Quad Focus)',
    primaryMuscles: ['Quads'],
    secondaryMuscles: ['Hamstrings', 'Glutes'],
    tertiaryMuscles: ['Calves'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 1 },
    focus: 'Quads, Hamstrings & Glutes',
  },
  legs_posterior: {
    name: 'Leg Day (Posterior Focus)',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Quads'],
    tertiaryMuscles: ['Calves'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 1 },
    focus: 'Hamstrings, Glutes & Quads',
  },
  upper: {
    name: 'Upper Body',
    primaryMuscles: ['Chest', 'Back', 'Lats'],
    secondaryMuscles: ['Shoulders', 'Side Delts'],
    tertiaryMuscles: ['Biceps', 'Triceps'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 2 },
    focus: 'Chest, Back & Shoulders',
  },
  lower: {
    name: 'Lower Body',
    primaryMuscles: ['Quads', 'Hamstrings'],
    secondaryMuscles: ['Glutes'],
    tertiaryMuscles: ['Calves'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 1 },
    focus: 'Full Leg Development',
  },
  full_body: {
    name: 'Full Body',
    primaryMuscles: ['Quads', 'Chest', 'Back'],
    secondaryMuscles: ['Shoulders', 'Hamstrings'],
    tertiaryMuscles: ['Biceps', 'Triceps'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 2 },
    focus: 'Complete Body Training',
  },
  arms: {
    name: 'Arms Day',
    primaryMuscles: ['Biceps', 'Triceps'],
    secondaryMuscles: ['Forearms'],
    tertiaryMuscles: [],
    exerciseCounts: { primary: 4, secondary: 1, tertiary: 0 },
    focus: 'Biceps & Triceps',
  },
};

// Core/Ab exercises for finishers
export const CORE_MUSCLE_GROUPS = ['Abs', 'Core', 'Obliques'];

// Cardio exercises for weight loss goals
export const CARDIO_EXERCISES = [
  { name: 'Treadmill Intervals', duration: 15, description: '30s sprint / 60s walk intervals', type: 'cardio', caloriesBurned: 200 },
  { name: 'Rowing Machine', duration: 10, description: 'Moderate intensity, focus on full strokes', type: 'cardio', caloriesBurned: 150 },
  { name: 'Stair Climber', duration: 12, description: 'Steady state, level 6-8', type: 'cardio', caloriesBurned: 180 },
  { name: 'Jump Rope', duration: 10, description: '30s on / 15s rest intervals', type: 'cardio', caloriesBurned: 160 },
  { name: 'Stationary Bike HIIT', duration: 15, description: '20s max effort / 40s recovery', type: 'cardio', caloriesBurned: 190 },
  { name: 'Battle Ropes', duration: 8, description: '20s work / 20s rest', type: 'cardio', caloriesBurned: 120 },
  { name: 'Burpees', duration: 10, description: '10 reps x 5 sets with 30s rest', type: 'cardio', caloriesBurned: 150 },
  { name: 'Mountain Climbers', duration: 8, description: '30s on / 30s rest', type: 'cardio', caloriesBurned: 100 },
];

// Related muscle groups for exercise ordering
export const RELATED_MUSCLE_GROUPS = {
  'Chest': ['Upper Chest', 'Lower Chest', 'Front Delts', 'Triceps'],
  'Upper Chest': ['Chest', 'Lower Chest', 'Front Delts', 'Shoulders'],
  'Lower Chest': ['Chest', 'Upper Chest', 'Triceps'],
  'Back': ['Lats', 'Upper Back', 'Mid Back', 'Lower Back', 'Rear Delts', 'Biceps', 'Traps'],
  'Lats': ['Back', 'Upper Back', 'Mid Back', 'Biceps', 'Rear Delts'],
  'Shoulders': ['Front Delts', 'Side Delts', 'Rear Delts', 'Traps', 'Upper Chest'],
  'Front Delts': ['Shoulders', 'Side Delts', 'Chest', 'Upper Chest'],
  'Side Delts': ['Shoulders', 'Front Delts', 'Rear Delts', 'Traps'],
  'Rear Delts': ['Shoulders', 'Side Delts', 'Back', 'Upper Back', 'Traps'],
  'Biceps': ['Back', 'Lats', 'Forearms'],
  'Triceps': ['Chest', 'Shoulders', 'Front Delts'],
  'Quads': ['Hamstrings', 'Glutes', 'Calves'],
  'Hamstrings': ['Quads', 'Glutes', 'Lower Back', 'Calves'],
  'Glutes': ['Hamstrings', 'Quads', 'Lower Back'],
  'Calves': ['Quads', 'Hamstrings'],
  'Traps': ['Shoulders', 'Upper Back', 'Rear Delts', 'Side Delts'],
  'Abs': ['Core', 'Obliques'],
  'Core': ['Abs', 'Obliques', 'Lower Back'],
  'Obliques': ['Abs', 'Core'],
  'Forearms': ['Biceps'],
};

// Superset pairings
export const SUPERSET_PAIRINGS = {
  'Chest': ['Back', 'Lats', 'Biceps'],
  'Back': ['Chest', 'Shoulders', 'Triceps'],
  'Biceps': ['Triceps', 'Chest', 'Shoulders'],
  'Triceps': ['Biceps', 'Back', 'Lats'],
  'Quads': ['Hamstrings', 'Calves'],
  'Hamstrings': ['Quads', 'Calves'],
  'Shoulders': ['Lats', 'Back'],
  'Front Delts': ['Rear Delts', 'Back'],
  'Rear Delts': ['Front Delts', 'Chest'],
  'Side Delts': ['Back', 'Rear Delts'],
};

// Invalid superset pairings (same movement pattern)
export const INVALID_SUPERSET_PAIRINGS = {
  'Chest': ['Upper Chest', 'Lower Chest', 'Triceps', 'Front Delts'],
  'Back': ['Lats', 'Upper Back', 'Mid Back', 'Biceps'],
  'Shoulders': ['Front Delts', 'Side Delts', 'Rear Delts'],
  'Quads': ['Glutes'],
  'Hamstrings': ['Glutes', 'Lower Back'],
};

// Workout timing constants
export const WORKOUT_TIMING = {
  warmupMinutes: 5,
  cooldownMinutes: 3,
  averageSetDuration: 0.75, // 45 seconds per set average
  transitionTime: 0.5, // 30 seconds between exercises
};

// RPE Scale
export const RPE_SCALE = [
  { value: 1, label: 'Very Light', description: 'Almost no effort, like a warm-up', color: '#22C55E' },
  { value: 2, label: 'Light', description: 'Easy effort, can talk easily', color: '#22C55E' },
  { value: 3, label: 'Light-Moderate', description: 'Slightly challenging', color: '#84CC16' },
  { value: 4, label: 'Moderate', description: 'Starting to feel it', color: '#84CC16' },
  { value: 5, label: 'Moderate', description: 'Challenging but sustainable', color: '#EAB308' },
  { value: 6, label: 'Moderate-Hard', description: 'Getting tough, 4+ reps left', color: '#EAB308' },
  { value: 7, label: 'Hard', description: 'Difficult, 3 reps in reserve', color: '#F97316' },
  { value: 8, label: 'Very Hard', description: 'Very challenging, 2 reps left', color: '#F97316' },
  { value: 9, label: 'Near Max', description: 'Almost failure, 1 rep left', color: '#EF4444' },
  { value: 10, label: 'Maximum', description: 'Absolute failure, no more reps', color: '#EF4444' },
];
