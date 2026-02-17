// Workout Templates Database
export const WORKOUT_TEMPLATES = {
  // BRO SPLIT WORKOUTS
  chest: {
    id: 'chest',
    name: 'Chest Day',
    focus: 'Chest Hypertrophy',
    description: 'Complete chest development with pressing and fly movements.',
    goals: ['Chest mass', 'Upper/lower chest balance', 'Pressing strength'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 8, restTime: 180, muscleGroup: 'Chest' },
      { id: 'incline_db', name: 'Incline Dumbbell Press', sets: 4, targetReps: 10, restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'db_fly', name: 'Dumbbell Fly', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Chest' },
      { id: 'cable_fly', name: 'Cable Fly', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Chest' },
      { id: 'dips', name: 'Dips', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Lower Chest' },
      { id: 'pushup', name: 'Push Ups', sets: 2, targetReps: 20, restTime: 60, muscleGroup: 'Chest' },
    ]
  },
  back: {
    id: 'back',
    name: 'Back Day',
    focus: 'Back Width & Thickness',
    description: 'Complete back development with vertical and horizontal pulls.',
    goals: ['Lat width', 'Back thickness', 'V-taper'],
    exercises: [
      { id: 'pullup', name: 'Pull Ups', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Lats' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Back' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Lats' },
      { id: 'db_row', name: 'Dumbbell Row', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Back' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Back' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Rear Delts' },
    ]
  },
  shoulders: {
    id: 'shoulders',
    name: 'Shoulder Day',
    focus: 'Deltoid Development',
    description: 'Complete shoulder development targeting all three heads.',
    goals: ['Shoulder width', 'Deltoid separation', 'Overhead strength'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 8, restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'lateral', name: 'Lateral Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'rear_delt_fly', name: 'Rear Delt Fly', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'shrugs', name: 'Barbell Shrugs', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Traps' },
    ]
  },
  arms: {
    id: 'arms',
    name: 'Arms Day',
    focus: 'Biceps & Triceps',
    description: 'Dedicated arm session for maximum bicep and tricep development.',
    goals: ['Arm size', 'Peak development', 'Tricep horseshoe'],
    exercises: [
      { id: 'close_grip', name: 'Close Grip Bench Press', sets: 4, targetReps: 8, restTime: 150, muscleGroup: 'Triceps' },
      { id: 'curl', name: 'Barbell Curl', sets: 4, targetReps: 8, restTime: 90, muscleGroup: 'Biceps' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Triceps' },
      { id: 'incline_curl', name: 'Incline Dumbbell Curl', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Rope Pushdowns', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
      { id: 'overhead_ext', name: 'Overhead Tricep Extension', sets: 2, targetReps: 15, restTime: 60, muscleGroup: 'Triceps' },
      { id: 'conc_curl', name: 'Concentration Curl', sets: 2, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  legs_quad: {
    id: 'legs_quad',
    name: 'Leg Day (Quads)',
    focus: 'Quad Dominant',
    description: 'Quad-focused leg workout built around squats.',
    goals: ['Quad development', 'Squat strength', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, restTime: 240, muscleGroup: 'Quads' },
      { id: 'leg_press', name: 'Leg Press', sets: 3, targetReps: 10, restTime: 150, muscleGroup: 'Quads' },
      { id: 'hack_squat', name: 'Hack Squat', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Quads' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  legs_posterior: {
    id: 'legs_posterior',
    name: 'Leg Day (Posterior)',
    focus: 'Hamstrings & Glutes',
    description: 'Posterior chain focused leg workout.',
    goals: ['Hamstring development', 'Glute strength', 'Hip hinge mastery'],
    exercises: [
      { id: 'rdl', name: 'Romanian Deadlift', sets: 4, targetReps: 8, restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, restTime: 120, muscleGroup: 'Glutes' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Glutes' },
      { id: 'leg_curl', name: 'Seated Leg Curl', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'abduct', name: 'Hip Abduction', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Glutes' },
      { id: 'calf', name: 'Seated Calf Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Calves' },
    ]
  },
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

// All available workout programs/splits
export const AVAILABLE_PROGRAMS = [
  { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'High volume split for maximum muscle growth', schedule: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'] },
  { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach with optimal recovery', schedule: ['upper_a', 'lower', 'upper_b', 'lower'] },
  { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Efficient training for overall fitness', schedule: ['full_body_a', 'full_body_b', 'full_body_a'] },
  { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Powerlifting-style training for max strength', schedule: ['powerlifting_squat', 'powerlifting_bench', 'powerlifting_deadlift', 'upper_a'] },
  { id: 'ppl_5day', name: 'PPL + Upper/Lower', days: 5, weeks: 12, desc: '5-day hybrid for balanced volume', schedule: ['push_a', 'pull_a', 'legs_a', 'upper_b', 'lower'] },
  { id: 'bro_split', name: 'Bro Split', days: 5, weeks: 12, desc: 'Classic bodybuilding split - one muscle group per day', schedule: ['chest', 'back', 'shoulders', 'legs_quad', 'arms'] },
  { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'Speed, agility, and power focus', schedule: ['athletic_power', 'upper_a', 'lower', 'push_a', 'pull_a'] },
  { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements', schedule: ['full_body_a', 'full_body_b', 'full_body_a', 'full_body_b'] },
];

// Program templates that adapt to any number of days per week
export const PROGRAM_TEMPLATES = [
  {
    id: 'ppl',
    name: 'Push/Pull/Legs',
    desc: 'Classic bodybuilding split targeting each muscle group optimally',
    cycle: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'],
    minDays: 3,
    maxDays: 6,
  },
  {
    id: 'upper_lower',
    name: 'Upper/Lower Split',
    desc: 'Balanced approach with great recovery between sessions',
    cycle: ['upper_a', 'lower', 'upper_b', 'lower'],
    minDays: 2,
    maxDays: 6,
  },
  {
    id: 'full_body',
    name: 'Full Body',
    desc: 'Hit every muscle each session - efficient and effective',
    cycle: ['full_body_a', 'full_body_b', 'full_body_a'],
    minDays: 2,
    maxDays: 6,
  },
  {
    id: 'bro_split',
    name: 'Bro Split',
    desc: 'One muscle group per day for maximum focus and volume',
    cycle: ['chest', 'back', 'shoulders', 'legs_quad', 'arms'],
    minDays: 3,
    maxDays: 6,
  },
];

// Map goals to recommended programs
export const GOAL_TO_PROGRAM = {
  bulk: 'ppl',
  build_muscle: 'upper_lower',
  strength: 'strength',
  recomp: 'upper_lower',
  fitness: 'full_body',
  athletic: 'athlete',
  lean: 'fat_loss',
  lose_fat: 'fat_loss',
};

// Suggested next programs based on current program completion
export const NEXT_PROGRAM_SUGGESTIONS = {
  ppl: [
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Build on your muscle with raw strength', reason: 'Great for converting muscle gains to strength' },
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'More recovery, continued growth', reason: 'Allows recovery while maintaining gains' },
  ],
  upper_lower: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Increase volume for more growth', reason: 'Take your gains to the next level' },
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Focus on getting stronger', reason: 'Convert your muscle to strength' },
  ],
  strength: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Add muscle to your frame', reason: 'Build muscle on your strength base' },
    { id: 'bro_split', name: 'Bro Split', days: 5, weeks: 12, desc: 'Classic bodybuilding approach', reason: 'Focus on individual muscle groups' },
  ],
  full_body: [
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Progress to a split routine', reason: 'More volume per muscle group' },
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Maximize your training', reason: 'For serious muscle building' },
  ],
  bro_split: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Higher frequency training', reason: 'Hit muscles more often' },
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach', reason: 'Great recovery with solid volume' },
  ],
};
