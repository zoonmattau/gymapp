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
      { id: 'kb_swing', name: 'Kettlebell Swing', sets: 3, targetReps: 15, restTime: 90, muscleGroup: 'Full Body' },
    ]
  },

  // ─── CHEST B (Volume & Variety) ──────────────────────────────────────────
  chest_b: {
    id: 'chest_b',
    name: 'Chest Day B',
    focus: 'Volume & Lower Chest',
    description: 'High-volume chest session led by decline work and cable movements for a deep chest stretch.',
    goals: ['Lower chest development', 'High volume hypertrophy', 'Cable isolation'],
    exercises: [
      { id: 'decline_bb', name: 'Decline Barbell Bench Press', sets: 4, targetReps: 8, restTime: 180, muscleGroup: 'Chest' },
      { id: 'incline_db', name: 'Incline Dumbbell Press', sets: 4, targetReps: 10, restTime: 120, muscleGroup: 'Chest' },
      { id: 'floor_press', name: 'Floor Press', sets: 3, targetReps: 8, restTime: 150, muscleGroup: 'Chest' },
      { id: 'cable_fly_htl', name: 'Cable Flyes (High to Low)', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Chest' },
      { id: 'cable_fly_lth', name: 'Cable Flyes (Low to High)', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Chest' },
      { id: 'machine_press', name: 'Machine Chest Press', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Chest' },
      { id: 'chest_dips', name: 'Chest Dips', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Chest' },
    ]
  },

  // ─── BACK C (Thickness & Variety) ────────────────────────────────────────
  back_c: {
    id: 'back_c',
    name: 'Back Day C',
    focus: 'Thickness & Unilateral Work',
    description: 'Heavy back thickness session using rack pulls and unilateral row variations.',
    goals: ['Back thickness', 'Unilateral strength', 'Trap development'],
    exercises: [
      { id: 'rack_pull', name: 'Rack Pull', sets: 4, targetReps: 5, restTime: 240, muscleGroup: 'Back' },
      { id: 'meadows_row', name: 'Meadows Row', sets: 4, targetReps: 10, restTime: 90, muscleGroup: 'Back' },
      { id: 'chest_row', name: 'Chest-Supported Row', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Back' },
      { id: 'sa_cable_row', name: 'Single-Arm Cable Row', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Back' },
      { id: 'straight_pull', name: 'Straight-Arm Pulldown', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Back' },
      { id: 'face_pull', name: 'Face Pulls', sets: 4, targetReps: 20, restTime: 60, muscleGroup: 'Back' },
    ]
  },

  // ─── ARMS B (Advanced Variety) ────────────────────────────────────────────
  arms_b: {
    id: 'arms_b',
    name: 'Arms Day B',
    focus: 'Bicep Peak & Tricep Detail',
    description: 'Arm session with advanced isolation movements for peak and long-head development.',
    goals: ['Bicep peak', 'Tricep long head', 'Arm detail'],
    exercises: [
      { id: 'jm_press', name: 'JM Press', sets: 4, targetReps: 8, restTime: 120, muscleGroup: 'Triceps' },
      { id: 'spider_curl', name: 'Spider Curls', sets: 4, targetReps: 10, restTime: 75, muscleGroup: 'Biceps' },
      { id: 'cable_ohd_ext', name: 'Cable Overhead Tricep Extension', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Triceps' },
      { id: 'incline_db_curl', name: 'Incline Dumbbell Curl', sets: 3, targetReps: 10, restTime: 75, muscleGroup: 'Biceps' },
      { id: 'tate_press', name: 'Tate Press', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Triceps' },
      { id: 'cable_curl', name: 'Cable Curls', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
      { id: 'diamond_pu', name: 'Diamond Push Ups', sets: 2, targetReps: 15, restTime: 60, muscleGroup: 'Triceps' },
      { id: 'conc_curl', name: 'Concentration Curls', sets: 2, targetReps: 12, restTime: 60, muscleGroup: 'Biceps' },
    ]
  },

  // ─── LEGS C (Power & Variety) ─────────────────────────────────────────────
  legs_c: {
    id: 'legs_c',
    name: 'Leg Day C',
    focus: 'Posterior Power & Unilateral',
    description: 'Leg session featuring sumo deadlift, single-leg work, and Nordic curls for injury prevention.',
    goals: ['Posterior chain power', 'Single-leg strength', 'Hamstring resilience'],
    exercises: [
      { id: 'goblet_squat', name: 'Goblet Squat', sets: 3, targetReps: 12, restTime: 90, muscleGroup: 'Quads' },
      { id: 'sumo_dl', name: 'Sumo Deadlift', sets: 4, targetReps: 5, restTime: 240, muscleGroup: 'Glutes' },
      { id: 'step_ups', name: 'Step Ups', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Quads' },
      { id: 'sl_rdl', name: 'Single-Leg RDL', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Hamstrings' },
      { id: 'nordic_curl', name: 'Nordic Curl', sets: 3, targetReps: 6, restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'hip_abduct', name: 'Hip Abduction Machine', sets: 3, targetReps: 20, restTime: 60, muscleGroup: 'Glutes' },
      { id: 'calf_stand', name: 'Standing Calf Raises', sets: 4, targetReps: 20, restTime: 60, muscleGroup: 'Calves' },
    ]
  },

  // ─── GLUTE FOCUS ──────────────────────────────────────────────────────────
  glute_focus: {
    id: 'glute_focus',
    name: 'Glute Specialisation',
    focus: 'Glutes & Posterior Chain',
    description: 'Dedicated glute session covering hip thrust, sumo work, and cable isolation.',
    goals: ['Glute hypertrophy', 'Hip strength', 'Posterior chain development'],
    exercises: [
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, restTime: 120, muscleGroup: 'Glutes' },
      { id: 'sumo_dl', name: 'Sumo Deadlift', sets: 4, targetReps: 6, restTime: 210, muscleGroup: 'Glutes' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, restTime: 90, muscleGroup: 'Glutes' },
      { id: 'cable_pull_through', name: 'Cable Pull-Through', sets: 3, targetReps: 15, restTime: 75, muscleGroup: 'Glutes' },
      { id: 'cable_kick', name: 'Cable Kickbacks', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Glutes' },
      { id: 'hip_abduct', name: 'Hip Abduction Machine', sets: 3, targetReps: 20, restTime: 60, muscleGroup: 'Glutes' },
      { id: 'glute_bridge', name: 'Glute Bridge', sets: 3, targetReps: 20, restTime: 60, muscleGroup: 'Glutes' },
      { id: 'calf_seated', name: 'Seated Calf Raises', sets: 3, targetReps: 20, restTime: 60, muscleGroup: 'Calves' },
    ]
  },

  // ─── PUSH C (Advanced Push Variety) ──────────────────────────────────────
  push_c: {
    id: 'push_c',
    name: 'Push Day C',
    focus: 'Long Head Triceps & Cable Work',
    description: 'Push session emphasising overhead tricep work and cable chest movements for full muscle development.',
    goals: ['Tricep long head', 'Cable chest pump', 'Shoulder stability'],
    exercises: [
      { id: 'floor_press', name: 'Floor Press', sets: 4, targetReps: 8, restTime: 180, muscleGroup: 'Chest' },
      { id: 'landmine_press', name: 'Landmine Press', sets: 3, targetReps: 10, restTime: 120, muscleGroup: 'Chest' },
      { id: 'cable_fly_lth', name: 'Cable Flyes (Low to High)', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Chest' },
      { id: 'cable_lat_raise', name: 'Cable Lateral Raises', sets: 4, targetReps: 15, restTime: 60, muscleGroup: 'Shoulders' },
      { id: 'cable_ohd_ext', name: 'Cable Overhead Tricep Extension', sets: 4, targetReps: 12, restTime: 75, muscleGroup: 'Triceps' },
      { id: 'diamond_pu', name: 'Diamond Push Ups', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Triceps' },
    ]
  },

  // ─── PULL C (Advanced Pull Variety) ──────────────────────────────────────
  pull_c: {
    id: 'pull_c',
    name: 'Pull Day C',
    focus: 'Unilateral Back & Arm Detail',
    description: 'Pull session built around chest-supported and unilateral work to eliminate cheating and maximise stimulus.',
    goals: ['Lat isolation', 'Rear delt development', 'Forearm & grip strength'],
    exercises: [
      { id: 'rack_pull', name: 'Rack Pull', sets: 4, targetReps: 4, restTime: 240, muscleGroup: 'Back' },
      { id: 'chest_row', name: 'Chest-Supported Row', sets: 4, targetReps: 10, restTime: 90, muscleGroup: 'Back' },
      { id: 'sa_cable_row', name: 'Single-Arm Cable Row', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Back' },
      { id: 'straight_pull', name: 'Straight-Arm Pulldown', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Back' },
      { id: 'spider_curl', name: 'Spider Curls', sets: 3, targetReps: 10, restTime: 75, muscleGroup: 'Biceps' },
      { id: 'reverse_curl', name: 'Reverse Curls', sets: 3, targetReps: 12, restTime: 60, muscleGroup: 'Forearms' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 20, restTime: 60, muscleGroup: 'Back' },
    ]
  },

  // ─── OLYMPIC POWER B ──────────────────────────────────────────────────────
  olympic_b: {
    id: 'olympic_b',
    name: 'Olympic Power B',
    focus: 'Hang Movements & Explosive Power',
    description: 'Olympic lifting session built around hang clean and power snatch with plyometric support.',
    goals: ['Explosive hip extension', 'Coordination & power', 'Athletic performance'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'hang_clean', name: 'Hang Clean', sets: 5, targetReps: 3, restTime: 210, muscleGroup: 'Full Body' },
      { id: 'power_snatch', name: 'Power Snatch', sets: 4, targetReps: 3, restTime: 210, muscleGroup: 'Full Body' },
      { id: 'push_press', name: 'Push Press', sets: 4, targetReps: 5, restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 8, restTime: 120, muscleGroup: 'Quads' },
      { id: 'kb_swing', name: 'Kettlebell Swing', sets: 4, targetReps: 15, restTime: 90, muscleGroup: 'Full Body' },
      { id: 'box_jump', name: 'Box Jumps', sets: 3, targetReps: 5, restTime: 120, muscleGroup: 'Full Body' },
    ]
  },

  // ─── CONDITIONING CIRCUIT ─────────────────────────────────────────────────
  conditioning_day: {
    id: 'conditioning_day',
    name: 'Conditioning Circuit',
    focus: 'Cardiovascular Fitness & Fat Loss',
    description: 'High-intensity conditioning session combining kettlebells, plyometrics, and cardio tools.',
    goals: ['Burn fat', 'Improve cardiovascular fitness', 'Conditioning endurance'],
    exercises: [
      { id: 'kb_swing', name: 'Kettlebell Swing', sets: 5, targetReps: 20, restTime: 60, muscleGroup: 'Full Body' },
      { id: 'box_jump', name: 'Box Jumps', sets: 4, targetReps: 8, restTime: 90, muscleGroup: 'Full Body' },
      { id: 'burpees', name: 'Burpees', sets: 4, targetReps: 10, restTime: 75, muscleGroup: 'Full Body' },
      { id: 'battle_ropes', name: 'Battle Ropes', sets: 4, targetReps: 30, restTime: 60, muscleGroup: 'Full Body' },
      { id: 'jump_rope', name: 'Jump Rope', sets: 4, targetReps: 60, restTime: 60, muscleGroup: 'Full Body' },
    ]
  },

  // ─── TRAPS & GRIP ──────────────────────────────────────────────────────────
  trap_grip: {
    id: 'trap_grip',
    name: 'Traps & Grip',
    focus: 'Trap Development & Grip Strength',
    description: 'Dedicated session for trap thickness and grip strength — the finishing touch on a complete physique.',
    goals: ['Upper trap mass', 'Grip strength', 'Forearm development'],
    exercises: [
      { id: 'bb_shrug', name: 'Barbell Shrugs', sets: 5, targetReps: 12, restTime: 120, muscleGroup: 'Traps' },
      { id: 'farmers_walk', name: "Farmer's Walk", sets: 4, targetReps: 40, restTime: 120, muscleGroup: 'Traps' },
      { id: 'db_shrug', name: 'Dumbbell Shrugs', sets: 3, targetReps: 15, restTime: 90, muscleGroup: 'Traps' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 20, restTime: 60, muscleGroup: 'Back' },
      { id: 'hammer_curl', name: 'Hammer Curls', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Biceps' },
      { id: 'reverse_curl', name: 'Reverse Curls', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Forearms' },
      { id: 'wrist_curl', name: 'Wrist Curls', sets: 3, targetReps: 20, restTime: 45, muscleGroup: 'Forearms' },
    ]
  },

  // ─── CORE SPECIALIST ─────────────────────────────────────────────────────
  core_focus: {
    id: 'core_focus',
    name: 'Core Specialist',
    focus: 'Complete Core Development',
    description: 'Full core session covering anti-extension, anti-rotation, flexion, and stabilisation.',
    goals: ['Core strength', 'Spinal stability', 'Athletic core'],
    exercises: [
      { id: 'pallof_press', name: 'Pallof Press', sets: 4, targetReps: 10, restTime: 60, muscleGroup: 'Core' },
      { id: 'ab_wheel', name: 'Ab Wheel Rollout', sets: 4, targetReps: 10, restTime: 90, muscleGroup: 'Core' },
      { id: 'hang_lr', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, restTime: 75, muscleGroup: 'Core' },
      { id: 'cable_crunch', name: 'Cable Crunches', sets: 3, targetReps: 15, restTime: 60, muscleGroup: 'Core' },
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, restTime: 60, muscleGroup: 'Core' },
      { id: 'hollow_body', name: 'Hollow Body Hold', sets: 3, targetReps: 30, restTime: 60, muscleGroup: 'Core' },
      { id: 'dragon_flag', name: 'Dragon Flag', sets: 3, targetReps: 6, restTime: 90, muscleGroup: 'Core' },
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
  // ── Classic multi-day splits ───────────────────────────────────────────────
  { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'High volume split for maximum muscle growth', schedule: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'] },
  { id: 'ppl_advanced', name: 'PPL Advanced', days: 6, weeks: 12, desc: 'Full A/B/C rotation — max exercise variety', schedule: ['push_a', 'pull_a', 'legs_a', 'push_c', 'pull_c', 'legs_c'] },
  { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach with optimal recovery', schedule: ['upper_a', 'lower', 'upper_b', 'lower'] },
  { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Efficient training for overall fitness', schedule: ['full_body_a', 'full_body_b', 'full_body_a'] },
  { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Powerlifting-style training for max strength', schedule: ['powerlifting_squat', 'powerlifting_bench', 'powerlifting_deadlift', 'upper_a'] },
  { id: 'ppl_5day', name: 'PPL + Upper/Lower', days: 5, weeks: 12, desc: '5-day hybrid for balanced volume', schedule: ['push_a', 'pull_a', 'legs_a', 'upper_b', 'lower'] },
  { id: 'bro_split', name: 'Bro Split', days: 5, weeks: 12, desc: 'Classic bodybuilding — one muscle group per day', schedule: ['chest', 'back', 'shoulders', 'legs_quad', 'arms'] },
  { id: 'bro_split_extended', name: 'Bro Split Extended', days: 6, weeks: 12, desc: 'Full bro split with chest B, arms B, and glutes', schedule: ['chest', 'chest_b', 'back', 'shoulders', 'arms', 'glute_focus'] },
  { id: 'glute_builder', name: 'Glute Builder', days: 4, weeks: 12, desc: 'Posterior chain focus with dedicated glute day', schedule: ['glute_focus', 'upper_a', 'legs_c', 'upper_b'] },
  { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'Speed, agility, and power focus', schedule: ['athletic_power', 'upper_a', 'lower', 'push_a', 'pull_a'] },
  { id: 'olympic_program', name: 'Olympic & Power', days: 4, weeks: 12, desc: 'Olympic lifting combined with strength training', schedule: ['athletic_power', 'olympic_b', 'upper_a', 'lower'] },
  { id: 'conditioning_prog', name: 'Conditioning & Fat Loss', days: 4, weeks: 8, desc: 'High intensity conditioning with full body strength', schedule: ['conditioning_day', 'full_body_a', 'conditioning_day', 'full_body_b'] },
  { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements', schedule: ['full_body_a', 'full_body_b', 'full_body_a', 'full_body_b'] },

  // ── Specialist programs (new templates) ────────────────────────────────────
  { id: 'chest_specialist', name: 'Chest Specialist', days: 2, weeks: 8, desc: 'Two distinct chest sessions — press strength + cable volume', schedule: ['chest', 'chest_b'] },
  { id: 'back_specialist', name: 'Back Specialist', days: 2, weeks: 8, desc: 'Back width + back thickness across two dedicated sessions', schedule: ['back', 'back_c'] },
  { id: 'arms_specialist', name: 'Arms Specialist', days: 2, weeks: 8, desc: 'Classic arm day paired with advanced isolation variety', schedule: ['arms', 'arms_b'] },
  { id: 'legs_variety', name: 'Legs Variety', days: 3, weeks: 10, desc: 'Three leg days covering quads, hamstrings/glutes, and power', schedule: ['legs_quad', 'legs_posterior', 'legs_c'] },
  { id: 'push_variety', name: 'Push Variety', days: 2, weeks: 8, desc: 'Two push days using entirely different exercises for full chest/shoulder/tricep development', schedule: ['push_a', 'push_c'] },
  { id: 'pull_variety', name: 'Pull Variety', days: 2, weeks: 8, desc: 'Two pull days — width focus A, unilateral thickness C', schedule: ['pull_a', 'pull_c'] },
  { id: 'posterior_power', name: 'Posterior Power', days: 3, weeks: 10, desc: 'Glutes, hamstrings, and back — full posterior chain specialisation', schedule: ['glute_focus', 'legs_c', 'back_c'] },
  { id: 'olympic_b_prog', name: 'Olympic Power B', days: 3, weeks: 8, desc: 'Hang clean & snatch sessions paired with strength lower body', schedule: ['athletic_power', 'olympic_b', 'lower'] },
  { id: 'conditioning_only', name: 'Conditioning Only', days: 3, weeks: 6, desc: 'Pure conditioning — kettlebells, plyos, and circuits', schedule: ['conditioning_day', 'full_body_a', 'conditioning_day'] },
  { id: 'trap_grip_prog', name: 'Traps & Grip Builder', days: 2, weeks: 6, desc: 'Add trap mass and grip strength to any split', schedule: ['trap_grip', 'back_c'] },
  { id: 'core_specialist_prog', name: 'Core Specialist', days: 2, weeks: 8, desc: 'Dedicated anti-extension, anti-rotation, and flexion core work', schedule: ['core_focus', 'full_body_a'] },
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
    id: 'ppl_advanced',
    name: 'PPL Advanced',
    desc: 'Full A/B/C rotation with maximum exercise variety',
    cycle: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b', 'push_c', 'pull_c', 'legs_c'],
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
  {
    id: 'bro_split_extended',
    name: 'Bro Split Extended',
    desc: '6-day bro split with dedicated chest B, arms B, and glute sessions',
    cycle: ['chest', 'chest_b', 'back', 'shoulders', 'arms', 'arms_b', 'glute_focus', 'legs_c'],
    minDays: 4,
    maxDays: 6,
  },
  {
    id: 'glute_builder',
    name: 'Glute Builder',
    desc: 'Posterior chain focus with dedicated glute and leg variety days',
    cycle: ['glute_focus', 'upper_a', 'legs_c', 'upper_b'],
    minDays: 3,
    maxDays: 5,
  },
  {
    id: 'olympic_program',
    name: 'Olympic & Power',
    desc: 'Combines Olympic lifting with strength and hypertrophy work',
    cycle: ['athletic_power', 'olympic_b', 'upper_a', 'lower'],
    minDays: 3,
    maxDays: 5,
  },
  {
    id: 'conditioning_prog',
    name: 'Conditioning & Fat Loss',
    desc: 'High intensity conditioning circuits paired with strength sessions',
    cycle: ['conditioning_day', 'full_body_a', 'conditioning_day', 'full_body_b'],
    minDays: 3,
    maxDays: 5,
  },
];

// Map goals to recommended programs
export const GOAL_TO_PROGRAM = {
  bulk: 'ppl',
  build_muscle: 'upper_lower',
  strength: 'strength',
  recomp: 'upper_lower',
  fitness: 'full_body',
  athletic: 'olympic_program',
  lean: 'conditioning_prog',
  lose_fat: 'conditioning_prog',
  glutes: 'glute_builder',
};

// Suggested next programs based on current program completion
export const NEXT_PROGRAM_SUGGESTIONS = {
  ppl: [
    { id: 'ppl_advanced', name: 'PPL Advanced', days: 6, weeks: 12, desc: 'Full A/B/C rotation with all new exercises', reason: 'More variety and stimulus for continued growth' },
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Build on your muscle with raw strength', reason: 'Great for converting muscle gains to strength' },
  ],
  ppl_advanced: [
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Convert volume gains to peak strength', reason: 'You\'ve built the muscle — now build the strength' },
    { id: 'bro_split_extended', name: 'Bro Split Extended', days: 6, weeks: 12, desc: 'Maximum isolation volume per muscle', reason: 'Deep muscle group focus after high-frequency PPL' },
  ],
  upper_lower: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Increase volume for more growth', reason: 'Take your gains to the next level' },
    { id: 'glute_builder', name: 'Glute Builder', days: 4, weeks: 12, desc: 'Posterior chain specialisation', reason: 'Target a lagging area with dedicated sessions' },
  ],
  strength: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Add muscle to your frame', reason: 'Build muscle on your strength base' },
    { id: 'olympic_program', name: 'Olympic & Power', days: 4, weeks: 12, desc: 'Add explosive power to your strength', reason: 'Combine strength with athletic power' },
  ],
  full_body: [
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Progress to a split routine', reason: 'More volume per muscle group' },
    { id: 'conditioning_prog', name: 'Conditioning & Fat Loss', days: 4, weeks: 8, desc: 'Add conditioning to your base', reason: 'Burn fat while keeping your strength' },
  ],
  bro_split: [
    { id: 'bro_split_extended', name: 'Bro Split Extended', days: 6, weeks: 12, desc: 'More variety with new exercise days', reason: 'Add chest B, arms B, and glutes' },
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Higher frequency training', reason: 'Hit muscles more often for growth' },
  ],
  bro_split_extended: [
    { id: 'ppl_advanced', name: 'PPL Advanced', days: 6, weeks: 12, desc: 'Higher frequency with A/B/C variety', reason: 'Shift from isolation to compound focus' },
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Convert your size to strength', reason: 'Your body is ready to go heavy' },
  ],
  glute_builder: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Full body hypertrophy program', reason: 'Balance out your physique development' },
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced upper and lower sessions', reason: 'Maintain lower body focus with upper balance' },
  ],
  olympic_program: [
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Pure powerlifting strength block', reason: 'Build a strength base under your power' },
    { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'More athletic variety', reason: 'Expand your athletic toolkit' },
  ],
  conditioning_prog: [
    { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Build strength on your lean base', reason: 'You\'re conditioned — now build muscle' },
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Structured hypertrophy', reason: 'Great next step after a conditioning block' },
  ],
};
