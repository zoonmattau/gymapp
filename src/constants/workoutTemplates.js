// Workout Templates Database
export const WORKOUT_TEMPLATES = {
  push_a: {
    id: 'push_a',
    name: 'Push Day A',
    focus: 'Chest, Shoulders & Triceps',
    description: 'Chest-focused push day with heavy compound pressing.',
    goals: ['Build pressing strength', 'Develop chest mass', 'Progressive overload'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 6, restTime: 180, muscleGroup: 'Chest' },
      { id: 'incline_db', name: 'Incline Dumbbell Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, targetReps: 8, restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  push_b: {
    id: 'push_b',
    name: 'Push Day B',
    focus: 'Shoulders, Chest & Triceps',
    description: 'Shoulder-focused push day with overhead strength.',
    goals: ['Overhead strength', 'Shoulder hypertrophy', 'Tricep development'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 6, restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'incline_bb', name: 'Incline Barbell Press', sets: 3, targetReps: 8, restTime: 150, muscleGroup: 'Upper Chest' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'cable_fly', name: 'Cable Fly', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Chest' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Triceps' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Rear Delts' },
    ]
  },
  pull_a: {
    id: 'pull_a',
    name: 'Pull Day A',
    focus: 'Back Width & Biceps',
    description: 'Targets lat width and back thickness.',
    goals: ['Build back width', 'Increase pulling strength', 'Bicep hypertrophy'],
    exercises: [
      { id: 'pullup', name: 'Pull Ups', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Lats' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Back' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Lats' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'curl', name: 'Barbell Curl', sets: 3, targetReps: 10, restTime: 60, muscleGroup: 'Biceps' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  pull_b: {
    id: 'pull_b',
    name: 'Pull Day B',
    focus: 'Back Thickness & Biceps',
    description: 'Back thickness-focused with rowing movements.',
    goals: ['Back thickness', 'Rowing strength', 'Complete back development'],
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 4, targetReps: 5, restTime: 240, muscleGroup: 'Back' },
      { id: 'db_row', name: 'Dumbbell Row', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Back' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Back' },
      { id: 'straight_arm', name: 'Straight Arm Pulldown', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Lats' },
      { id: 'preacher', name: 'Preacher Curl', sets: 3, targetReps: 10, restTime: 60, muscleGroup: 'Biceps' },
      { id: 'reverse_curl', name: 'Reverse Curls', sets: 2, targetReps: 15, restTime: 60, muscleGroup: 'Forearms' },
    ]
  },
  legs_a: {
    id: 'legs_a',
    name: 'Leg Day A',
    focus: 'Quad Dominant',
    description: 'Quad-focused leg workout built around squats.',
    goals: ['Quad development', 'Squat strength', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, restTime: 240, muscleGroup: 'Quads' },
      { id: 'leg_press', name: 'Leg Press', sets: 3, targetReps: 10, restTime: 150, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  legs_b: {
    id: 'legs_b',
    name: 'Leg Day B',
    focus: 'Posterior Chain & Glutes',
    description: 'Hamstring and glute-focused session.',
    goals: ['Hamstring development', 'Glute strength', 'Posterior chain power'],
    exercises: [
      { id: 'rdl', name: 'Romanian Deadlift', sets: 4, targetReps: 8, restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, restTime: 120, muscleGroup: 'Glutes' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Seated Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'abduct', name: 'Hip Abduction', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Glutes' },
      { id: 'calf', name: 'Seated Calf Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  upper_a: {
    id: 'upper_a',
    name: 'Upper Body A',
    focus: 'Horizontal Push/Pull',
    description: 'Balanced upper body with horizontal movements.',
    goals: ['Upper body balance', 'Horizontal strength', 'Muscle symmetry'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 6, restTime: 180, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Back' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Lats' },
      { id: 'curl', name: 'EZ Bar Curl', sets: 3, targetReps: 10, restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Rope Pushdowns', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  upper_b: {
    id: 'upper_b',
    name: 'Upper Body B',
    focus: 'Vertical Push/Pull',
    description: 'Upper body emphasizing vertical movements.',
    goals: ['Vertical strength', 'Shoulder & lat width', 'Overhead power'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 6, restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'pullup', name: 'Chin Ups', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Lats' },
      { id: 'incline', name: 'Incline Dumbbell Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Back' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  lower: {
    id: 'lower',
    name: 'Lower Body',
    focus: 'Full Leg Development',
    description: 'Comprehensive lower body session.',
    goals: ['Overall leg strength', 'Quad & hamstring balance', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, restTime: 240, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, restTime: 150, muscleGroup: 'Hamstrings' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Quads' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  full_body_a: {
    id: 'full_body_a',
    name: 'Full Body A',
    focus: 'Compound Strength',
    description: 'Full body strength built around big lifts.',
    goals: ['Full body strength', 'Efficient training', 'Compound lift focus'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 5, restTime: 240, muscleGroup: 'Quads' },
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 5, restTime: 180, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 6, restTime: 150, muscleGroup: 'Back' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Hamstrings' },
    ]
  },
  full_body_b: {
    id: 'full_body_b',
    name: 'Full Body B',
    focus: 'Hypertrophy & Accessories',
    description: 'Full body with higher reps and isolation.',
    goals: ['Muscle hypertrophy', 'Accessory work', 'Balanced development'],
    exercises: [
      { id: 'front_squat', name: 'Front Squat', sets: 3, targetReps: 8, restTime: 180, muscleGroup: 'Quads' },
      { id: 'db_bench', name: 'Dumbbell Bench Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Chest' },
      { id: 'pullup', name: 'Pull Ups', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Lats' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Glutes' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'curl', name: 'Dumbbell Curl', sets: 2, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  powerlifting_squat: {
    id: 'powerlifting_squat',
    name: 'Squat Focus',
    focus: 'Squat Strength',
    description: 'Powerlifting-style squat-focused session.',
    goals: ['Squat 1RM improvement', 'Competition prep', 'Technical refinement'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 5, targetReps: 3, restTime: 300, muscleGroup: 'Quads' },
      { id: 'front_squat', name: 'Front Squat', sets: 3, targetReps: 5, restTime: 180, muscleGroup: 'Quads' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
    ]
  },
  powerlifting_bench: {
    id: 'powerlifting_bench',
    name: 'Bench Focus',
    focus: 'Bench Press Strength',
    description: 'Powerlifting-style bench press session.',
    goals: ['Bench 1RM improvement', 'Lockout strength', 'Chest drive'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 5, targetReps: 3, restTime: 300, muscleGroup: 'Chest' },
      { id: 'close_grip', name: 'Close Grip Bench Press', sets: 4, targetReps: 6, restTime: 180, muscleGroup: 'Triceps' },
      { id: 'db_bench', name: 'Dumbbell Bench Press', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, restTime: 120, muscleGroup: 'Back' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Rear Delts' },
    ]
  },
  powerlifting_deadlift: {
    id: 'powerlifting_deadlift',
    name: 'Deadlift Focus',
    focus: 'Deadlift Strength',
    description: 'Powerlifting-style deadlift session.',
    goals: ['Deadlift 1RM improvement', 'Floor speed', 'Lockout strength'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 5, targetReps: 2, restTime: 300, muscleGroup: 'Back' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 6, restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'row', name: 'Pendlay Row', sets: 4, targetReps: 6, restTime: 150, muscleGroup: 'Back' },
      { id: 'pullup', name: 'Pull Ups', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Lats' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
    ]
  },
  athletic_power: {
    id: 'athletic_power',
    name: 'Athletic Power',
    focus: 'Explosive Power & Conditioning',
    description: 'Athletic workout with explosive power movements.',
    goals: ['Explosive power', 'Athletic performance', 'Conditioning'],
    difficulty: 'Intermediate',
    exercises: [
      { id: 'power_clean', name: 'Power Clean', sets: 5, targetReps: 3, restTime: 180, muscleGroup: 'Full Body' },
      { id: 'box_jump', name: 'Box Jumps', sets: 4, targetReps: 5, restTime: 120, muscleGroup: 'Quads' },
      { id: 'front_squat', name: 'Front Squat', sets: 4, targetReps: 6, restTime: 180, muscleGroup: 'Quads' },
      { id: 'push_press', name: 'Push Press', sets: 4, targetReps: 5, restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'kb_swing', name: 'Kettlebell Swings', sets: 3, targetReps: 15, restTime: 90, muscleGroup: 'Glutes' },
    ]
  },
};

// Get template by ID
export const getTemplate = (templateId) => {
  return WORKOUT_TEMPLATES[templateId] || null;
};

// Get templates for a program
export const getTemplatesForProgram = (programId, templates) => {
  return templates.map(id => WORKOUT_TEMPLATES[id]).filter(Boolean);
};
