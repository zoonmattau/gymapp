// Workout templates
export const TEMPLATE_TO_WORKOUT_TYPE = {
  push_a: 'push', push_b: 'push',
  pull_a: 'pull', pull_b: 'pull',
  legs_a: 'legs_quad', legs_b: 'legs_posterior',
  upper_a: 'upper', upper_b: 'upper',
  lower: 'lower',
  full_body_a: 'full_body', full_body_b: 'full_body',
  arms: 'arms',
  chest_specialization: 'push',
  back_specialization: 'pull',
  leg_specialization: 'lower',
  powerlifting_squat: 'legs_quad',
  powerlifting_bench: 'push',
  powerlifting_deadlift: 'pull',
  athletic_power: 'full_body',
};

// ============================================
// END DYNAMIC WORKOUT GENERATION
// ============================================

// Workout Templates Database (kept for reference/fallback)
export const WORKOUT_TEMPLATES = {
  push_a: {
    id: 'push_a',
    name: 'Push Day A',
    focus: 'Chest, Shoulders & Triceps',
    description: 'This workout emphasizes chest development with heavy compound pressing, followed by shoulder and tricep work. Focus on controlled negatives and full range of motion.',
    goals: ['Build pressing strength', 'Develop chest mass', 'Progressive overload'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 6, suggestedWeight: 80, lastWeight: 77.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Chest' },
      { id: 'incline_db', name: 'Incline Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 30, lastWeight: 28, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, targetReps: 8, suggestedWeight: 50, lastWeight: 47.5, lastReps: [8, 7, 6], restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, suggestedWeight: 12, lastWeight: 10, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, targetReps: 12, suggestedWeight: 30, lastWeight: 27.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  push_b: {
    id: 'push_b',
    name: 'Push Day B',
    focus: 'Shoulders, Chest & Triceps',
    description: 'A shoulder-focused push day that develops overhead strength and shoulder stability. Includes chest work and tricep isolation for complete pushing development.',
    goals: ['Overhead strength', 'Shoulder hypertrophy', 'Tricep development'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 6, suggestedWeight: 55, lastWeight: 52.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'incline_bb', name: 'Incline Barbell Press', sets: 3, targetReps: 8, suggestedWeight: 65, lastWeight: 62.5, lastReps: [8, 7, 7], restTime: 150, muscleGroup: 'Upper Chest' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 26, lastWeight: 24, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'cable_fly', name: 'Cable Fly', sets: 3, targetReps: 12, suggestedWeight: 15, lastWeight: 12.5, lastReps: [12, 12, 10], restTime: 60, muscleGroup: 'Chest' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, targetReps: 10, suggestedWeight: 30, lastWeight: 27.5, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Triceps' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 20, lastWeight: 17.5, lastReps: [15, 15, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'cable_crunch', name: 'Cable Crunches', sets: 3, targetReps: 15, suggestedWeight: 0, lastWeight: 0, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  pull_a: {
    id: 'pull_a',
    name: 'Pull Day A',
    focus: 'Back Width & Biceps',
    description: 'This workout targets lat width and back thickness through vertical and horizontal pulling. Bicep work is included to maximize arm development.',
    goals: ['Build back width', 'Increase pulling strength', 'Bicep hypertrophy'],
    exercises: [
      { id: 'pullup', name: 'Pull Ups', sets: 4, targetReps: 8, suggestedWeight: 0, lastWeight: 0, lastReps: [8, 7, 6, 5], restTime: 150, muscleGroup: 'Lats' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, suggestedWeight: 80, lastWeight: 77.5, lastReps: [8, 8, 7, 6], restTime: 150, muscleGroup: 'Back' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, suggestedWeight: 60, lastWeight: 57.5, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Lats' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 22.5, lastWeight: 20, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'curl', name: 'Barbell Curl', sets: 3, targetReps: 10, suggestedWeight: 35, lastWeight: 32.5, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, suggestedWeight: 14, lastWeight: 12, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  pull_b: {
    id: 'pull_b',
    name: 'Pull Day B',
    focus: 'Back Thickness & Biceps',
    description: 'A back thickness-focused session emphasizing rowing movements and horizontal pulls. Develops the mid-back and creates that dense, powerful look.',
    goals: ['Back thickness', 'Rowing strength', 'Complete back development'],
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 4, targetReps: 5, suggestedWeight: 140, lastWeight: 135, lastReps: [5, 5, 5, 4], restTime: 240, muscleGroup: 'Back' },
      { id: 'db_row', name: 'Dumbbell Row', sets: 3, targetReps: 10, suggestedWeight: 36, lastWeight: 34, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Back' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, suggestedWeight: 65, lastWeight: 60, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Back' },
      { id: 'straight_arm', name: 'Straight Arm Pulldown', sets: 3, targetReps: 12, suggestedWeight: 30, lastWeight: 27.5, lastReps: [12, 12, 10], restTime: 60, muscleGroup: 'Lats' },
      { id: 'preacher', name: 'Preacher Curl', sets: 3, targetReps: 10, suggestedWeight: 25, lastWeight: 22.5, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'reverse_curl', name: 'Reverse Curls', sets: 2, targetReps: 15, suggestedWeight: 20, lastWeight: 17.5, lastReps: [15, 12], restTime: 60, muscleGroup: 'Forearms' },
      { id: 'hanging_knee_raise', name: 'Hanging Knee Raises', sets: 3, targetReps: 15, suggestedWeight: 0, lastWeight: 0, lastReps: [15, 12, 10], restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  legs_a: {
    id: 'legs_a',
    name: 'Leg Day A',
    focus: 'Quad Dominant',
    description: 'A quad-focused leg workout built around the squat pattern. Develops leg strength, size and athletic power through heavy compound movements.',
    goals: ['Quad development', 'Squat strength', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, suggestedWeight: 120, lastWeight: 115, lastReps: [6, 6, 5, 5], restTime: 240, muscleGroup: 'Quads' },
      { id: 'leg_press', name: 'Leg Press', sets: 3, targetReps: 10, suggestedWeight: 200, lastWeight: 180, lastReps: [10, 9, 8], restTime: 150, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, suggestedWeight: 90, lastWeight: 85, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, suggestedWeight: 50, lastWeight: 45, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 40, lastWeight: 37.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, suggestedWeight: 80, lastWeight: 70, lastReps: [15, 14, 12, 10], restTime: 60, muscleGroup: 'Calves' },
      { id: 'plank', name: 'Plank', sets: 3, targetReps: 45, suggestedWeight: 0, lastWeight: 0, lastReps: [45, 45, 40], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  legs_b: {
    id: 'legs_b',
    name: 'Leg Day B',
    focus: 'Posterior Chain & Glutes',
    description: 'A hamstring and glute-focused session that develops the posterior chain. Great for athletic performance, injury prevention, and building a strong foundation.',
    goals: ['Hamstring development', 'Glute strength', 'Posterior chain power'],
    exercises: [
      { id: 'rdl', name: 'Romanian Deadlift', sets: 4, targetReps: 8, suggestedWeight: 100, lastWeight: 95, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, suggestedWeight: 100, lastWeight: 90, lastReps: [10, 10, 9, 8], restTime: 120, muscleGroup: 'Glutes' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, suggestedWeight: 24, lastWeight: 22, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Seated Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 45, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'abduct', name: 'Hip Abduction', sets: 3, targetReps: 15, suggestedWeight: 50, lastWeight: 45, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Glutes' },
      { id: 'calf', name: 'Seated Calf Raises', sets: 4, targetReps: 15, suggestedWeight: 40, lastWeight: 35, lastReps: [15, 14, 12, 10], restTime: 60, muscleGroup: 'Calves' },
      { id: 'ab_wheel', name: 'Ab Wheel Rollout', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 8, 8], restTime: 60, muscleGroup: 'Core' },
    ]
  },
  upper_a: {
    id: 'upper_a',
    name: 'Upper Body A',
    focus: 'Horizontal Push/Pull',
    description: 'A balanced upper body session focusing on horizontal pressing and rowing. Develops chest and back equally for a proportional, powerful upper body.',
    goals: ['Upper body balance', 'Horizontal strength', 'Muscle symmetry'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 82.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, suggestedWeight: 82.5, lastWeight: 80, lastReps: [8, 7, 7, 6], restTime: 150, muscleGroup: 'Back' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 28, lastWeight: 26, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, suggestedWeight: 62.5, lastWeight: 60, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Lats' },
      { id: 'curl', name: 'EZ Bar Curl', sets: 3, targetReps: 10, suggestedWeight: 32.5, lastWeight: 30, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Rope Pushdowns', sets: 3, targetReps: 12, suggestedWeight: 25, lastWeight: 22.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  upper_b: {
    id: 'upper_b',
    name: 'Upper Body B',
    focus: 'Vertical Push/Pull',
    description: 'An upper body session emphasizing vertical movements. Builds impressive shoulders and lats while developing pulling and pressing strength overhead.',
    goals: ['Vertical strength', 'Shoulder & lat width', 'Overhead power'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 6, suggestedWeight: 57.5, lastWeight: 55, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'pullup', name: 'Chin Ups', sets: 4, targetReps: 8, suggestedWeight: 0, lastWeight: 0, lastReps: [8, 7, 6, 5], restTime: 150, muscleGroup: 'Lats' },
      { id: 'incline', name: 'Incline Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 32, lastWeight: 30, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, suggestedWeight: 67.5, lastWeight: 65, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Back' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, suggestedWeight: 12, lastWeight: 10, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, suggestedWeight: 16, lastWeight: 14, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'overhead_ext', name: 'Overhead Tricep Extension', sets: 3, targetReps: 12, suggestedWeight: 27.5, lastWeight: 25, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'v_ups', name: 'V-Ups', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 45, muscleGroup: 'Abs' },
    ]
  },
  lower: {
    id: 'lower',
    name: 'Lower Body',
    focus: 'Full Leg Development',
    description: 'A comprehensive lower body session hitting all major leg muscles. Combines heavy compound lifts with isolation work for complete leg development.',
    goals: ['Overall leg strength', 'Quad & hamstring balance', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, suggestedWeight: 125, lastWeight: 120, lastReps: [6, 6, 5, 5], restTime: 240, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, suggestedWeight: 95, lastWeight: 90, lastReps: [10, 9, 8], restTime: 150, muscleGroup: 'Hamstrings' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, suggestedWeight: 26, lastWeight: 24, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 42.5, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, suggestedWeight: 52.5, lastWeight: 50, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Quads' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, suggestedWeight: 85, lastWeight: 80, lastReps: [15, 14, 12, 10], restTime: 60, muscleGroup: 'Calves' },
      { id: 'bicycle_crunch', name: 'Bicycle Crunches', sets: 3, targetReps: 20, suggestedWeight: 0, lastWeight: 0, lastReps: [20, 18, 15], restTime: 45, muscleGroup: 'Abs' },
    ]
  },
  full_body_a: {
    id: 'full_body_a',
    name: 'Full Body A',
    focus: 'Compound Strength',
    description: 'A full body strength session built around the big three lifts. Efficient and effective for building overall strength and muscle when time is limited.',
    goals: ['Full body strength', 'Efficient training', 'Compound lift focus'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 5, suggestedWeight: 110, lastWeight: 105, lastReps: [5, 5, 5, 4], restTime: 240, muscleGroup: 'Quads' },
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 5, suggestedWeight: 82.5, lastWeight: 80, lastReps: [5, 5, 5, 4], restTime: 180, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 6, suggestedWeight: 77.5, lastWeight: 75, lastReps: [6, 6, 5, 5], restTime: 150, muscleGroup: 'Back' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, targetReps: 8, suggestedWeight: 47.5, lastWeight: 45, lastReps: [8, 7, 6], restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, suggestedWeight: 85, lastWeight: 80, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'hanging_knee_raise', name: 'Hanging Knee Raises', sets: 3, targetReps: 15, suggestedWeight: 0, lastWeight: 0, lastReps: [15, 12, 10], restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  full_body_b: {
    id: 'full_body_b',
    name: 'Full Body B',
    focus: 'Hypertrophy & Accessories',
    description: 'A full body session with higher rep ranges and more isolation work. Complements Full Body A for balanced muscle development.',
    goals: ['Muscle hypertrophy', 'Accessory work', 'Balanced development'],
    exercises: [
      { id: 'front_squat', name: 'Front Squat', sets: 3, targetReps: 8, suggestedWeight: 80, lastWeight: 75, lastReps: [8, 7, 6], restTime: 180, muscleGroup: 'Quads' },
      { id: 'db_bench', name: 'Dumbbell Bench Press', sets: 3, targetReps: 10, suggestedWeight: 34, lastWeight: 32, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Chest' },
      { id: 'pullup', name: 'Pull Ups', sets: 3, targetReps: 8, suggestedWeight: 0, lastWeight: 0, lastReps: [8, 7, 6], restTime: 120, muscleGroup: 'Lats' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 3, targetReps: 12, suggestedWeight: 90, lastWeight: 85, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Glutes' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, suggestedWeight: 10, lastWeight: 8, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'curl', name: 'Dumbbell Curl', sets: 2, targetReps: 12, suggestedWeight: 14, lastWeight: 12, lastReps: [12, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 2, targetReps: 12, suggestedWeight: 27.5, lastWeight: 25, lastReps: [12, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  arms: {
    id: 'arms',
    name: 'Arms Day',
    focus: 'Biceps & Triceps',
    description: 'A dedicated arm session for maximum bicep and tricep development. High volume with varied angles to target all heads of each muscle.',
    goals: ['Arm size', 'Peak development', 'Tricep horseshoe'],
    exercises: [
      { id: 'close_grip', name: 'Close Grip Bench Press', sets: 4, targetReps: 8, suggestedWeight: 65, lastWeight: 62.5, lastReps: [8, 8, 7, 6], restTime: 150, muscleGroup: 'Triceps' },
      { id: 'curl', name: 'Barbell Curl', sets: 4, targetReps: 8, suggestedWeight: 37.5, lastWeight: 35, lastReps: [8, 8, 7, 6], restTime: 90, muscleGroup: 'Biceps' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, targetReps: 10, suggestedWeight: 32.5, lastWeight: 30, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Triceps' },
      { id: 'incline_curl', name: 'Incline Dumbbell Curl', sets: 3, targetReps: 10, suggestedWeight: 12, lastWeight: 10, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Rope Pushdowns', sets: 3, targetReps: 12, suggestedWeight: 27.5, lastWeight: 25, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, suggestedWeight: 16, lastWeight: 14, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'overhead_ext', name: 'Overhead Tricep Extension', sets: 2, targetReps: 15, suggestedWeight: 25, lastWeight: 22.5, lastReps: [15, 12], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'conc_curl', name: 'Concentration Curl', sets: 2, targetReps: 12, suggestedWeight: 10, lastWeight: 8, lastReps: [12, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'plank', name: 'Plank', sets: 3, targetReps: 45, suggestedWeight: 0, lastWeight: 0, lastReps: [45, 40, 35], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  // ADVANCED WORKOUT TEMPLATES
  chest_specialization: {
    id: 'chest_specialization',
    name: 'Chest Specialization',
    focus: 'Chest Hypertrophy',
    description: 'An advanced chest-focused workout with high volume across multiple angles. For experienced lifters looking to bring up lagging chest development.',
    goals: ['Maximum chest development', 'Upper/lower chest balance', 'Mind-muscle connection'],
    difficulty: 'Advanced',
    muscleFrequency: { chest: 3, shoulders: 1, triceps: 2 },
    exercises: [
      { id: 'incline_bb', name: 'Incline Barbell Press', sets: 4, targetReps: 8, suggestedWeight: 70, lastWeight: 67.5, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Upper Chest' },
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 8, suggestedWeight: 85, lastWeight: 82.5, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Chest' },
      { id: 'db_fly', name: 'Dumbbell Fly', sets: 3, targetReps: 12, suggestedWeight: 18, lastWeight: 16, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Chest' },
      { id: 'cable_fly_high', name: 'Cable Fly', sets: 3, targetReps: 15, suggestedWeight: 15, lastWeight: 12.5, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Chest' },
      { id: 'incline_fly', name: 'Incline Cable Fly', sets: 3, targetReps: 15, suggestedWeight: 12.5, lastWeight: 10, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Upper Chest' },
      { id: 'dips', name: 'Dips', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 90, muscleGroup: 'Lower Chest' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, targetReps: 15, suggestedWeight: 25, lastWeight: 22.5, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 60, muscleGroup: 'Abs' },
    ]
  },
  back_specialization: {
    id: 'back_specialization',
    name: 'Back Specialization',
    focus: 'Back Width & Thickness',
    description: 'An advanced back workout combining width and thickness movements. High volume training for experienced lifters seeking maximum back development.',
    goals: ['Lat width', 'Mid-back thickness', 'Complete V-taper'],
    difficulty: 'Advanced',
    muscleFrequency: { back: 3, biceps: 2, rear_delts: 1 },
    exercises: [
      { id: 'weighted_pullup', name: 'Pull Ups', sets: 4, targetReps: 8, suggestedWeight: 15, lastWeight: 12.5, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Lats' },
      { id: 'pendlay_row', name: 'Pendlay Row', sets: 4, targetReps: 6, suggestedWeight: 90, lastWeight: 87.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Back' },
      { id: 'wide_pulldown', name: 'Wide Grip Pulldown', sets: 3, targetReps: 10, suggestedWeight: 65, lastWeight: 62.5, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Lats' },
      { id: 'chest_row', name: 'Chest Supported Row', sets: 3, targetReps: 10, suggestedWeight: 32, lastWeight: 30, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Back' },
      { id: 'straight_arm', name: 'Straight Arm Pulldown', sets: 3, targetReps: 12, suggestedWeight: 32.5, lastWeight: 30, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Lats' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 22.5, lastWeight: 20, lastReps: [15, 15, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'shrugs', name: 'Barbell Shrugs', sets: 3, targetReps: 12, suggestedWeight: 100, lastWeight: 95, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Traps' },
      { id: 'curl', name: 'EZ Bar Curl', sets: 3, targetReps: 10, suggestedWeight: 35, lastWeight: 32.5, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'ab_wheel', name: 'Ab Wheel Rollout', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 8, 8], restTime: 60, muscleGroup: 'Core' },
    ]
  },
  leg_specialization: {
    id: 'leg_specialization',
    name: 'Leg Specialization',
    focus: 'Complete Leg Development',
    description: 'An intense leg session targeting quads, hamstrings, glutes and calves equally. For advanced lifters committed to balanced lower body development.',
    goals: ['Quad sweep', 'Hamstring tie-in', 'Glute development', 'Calf growth'],
    difficulty: 'Advanced',
    muscleFrequency: { quads: 3, hamstrings: 2, glutes: 2, calves: 2 },
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, suggestedWeight: 130, lastWeight: 125, lastReps: [6, 6, 5, 5], restTime: 240, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 4, targetReps: 8, suggestedWeight: 105, lastWeight: 100, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'hack_squat', name: 'Hack Squat', sets: 3, targetReps: 10, suggestedWeight: 120, lastWeight: 110, lastReps: [10, 9, 8], restTime: 150, muscleGroup: 'Quads' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, suggestedWeight: 110, lastWeight: 100, lastReps: [10, 10, 9, 8], restTime: 120, muscleGroup: 'Glutes' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, suggestedWeight: 55, lastWeight: 50, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 45, lastWeight: 42.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'calf_standing', name: 'Standing Calf Raises', sets: 4, targetReps: 12, suggestedWeight: 90, lastWeight: 85, lastReps: [12, 12, 10, 10], restTime: 60, muscleGroup: 'Calves' },
      { id: 'calf_seated', name: 'Seated Calf Raises', sets: 3, targetReps: 15, suggestedWeight: 45, lastWeight: 40, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Calves' },
      { id: 'hollow_hold', name: 'Hollow Body Hold', sets: 3, targetReps: 30, suggestedWeight: 0, lastWeight: 0, lastReps: [30, 25, 20], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  powerlifting_squat: {
    id: 'powerlifting_squat',
    name: 'Squat Focus (Powerlifting)',
    focus: 'Squat Strength',
    description: 'A powerlifting-style squat-focused session with competition-style training. Heavy singles, doubles and triples with accessory work.',
    goals: ['Squat 1RM improvement', 'Competition prep', 'Technical refinement'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 5, targetReps: 3, suggestedWeight: 145, lastWeight: 140, lastReps: [3, 3, 3, 2, 2], restTime: 300, muscleGroup: 'Quads' },
      { id: 'pause_squat', name: 'Front Squat', sets: 3, targetReps: 5, suggestedWeight: 100, lastWeight: 95, lastReps: [5, 5, 4], restTime: 180, muscleGroup: 'Quads' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 8, suggestedWeight: 30, lastWeight: 28, lastReps: [8, 8, 7], restTime: 120, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 8, suggestedWeight: 95, lastWeight: 90, lastReps: [8, 8, 7], restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 42.5, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'core', name: 'Ab Wheel Rollout', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 8, 8], restTime: 60, muscleGroup: 'Core' },
    ]
  },
  powerlifting_bench: {
    id: 'powerlifting_bench',
    name: 'Bench Focus (Powerlifting)',
    focus: 'Bench Press Strength',
    description: 'A powerlifting-style bench press-focused session. Heavy work with pauses and accessory movements for maximum pressing strength.',
    goals: ['Bench 1RM improvement', 'Lockout strength', 'Chest drive'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 5, targetReps: 3, suggestedWeight: 105, lastWeight: 100, lastReps: [3, 3, 3, 2, 2], restTime: 300, muscleGroup: 'Chest' },
      { id: 'close_grip', name: 'Close Grip Bench Press', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 82.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Triceps' },
      { id: 'db_bench', name: 'Dumbbell Bench Press', sets: 3, targetReps: 8, suggestedWeight: 38, lastWeight: 36, lastReps: [8, 8, 7], restTime: 120, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, suggestedWeight: 82.5, lastWeight: 80, lastReps: [8, 8, 7, 6], restTime: 120, muscleGroup: 'Back' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 22.5, lastWeight: 20, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'tricep_ext', name: 'Overhead Tricep Extension', sets: 3, targetReps: 12, suggestedWeight: 30, lastWeight: 27.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  powerlifting_deadlift: {
    id: 'powerlifting_deadlift',
    name: 'Deadlift Focus (Powerlifting)',
    focus: 'Deadlift Strength',
    description: 'A powerlifting-style deadlift-focused session. Heavy pulls with variations and back accessories for maximum pulling power.',
    goals: ['Deadlift 1RM improvement', 'Floor speed', 'Lockout strength'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 5, targetReps: 2, suggestedWeight: 175, lastWeight: 170, lastReps: [2, 2, 2, 2, 1], restTime: 300, muscleGroup: 'Back' },
      { id: 'deficit_dl', name: 'Romanian Deadlift', sets: 3, targetReps: 6, suggestedWeight: 115, lastWeight: 110, lastReps: [6, 6, 5], restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'row', name: 'Pendlay Row', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 82.5, lastReps: [6, 6, 5, 5], restTime: 150, muscleGroup: 'Back' },
      { id: 'pullup', name: 'Pull Ups', sets: 3, targetReps: 8, suggestedWeight: 10, lastWeight: 7.5, lastReps: [8, 7, 6], restTime: 120, muscleGroup: 'Lats' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 42.5, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'shrugs', name: 'Barbell Shrugs', sets: 3, targetReps: 10, suggestedWeight: 110, lastWeight: 105, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Traps' },
      { id: 'pallof_press', name: 'Pallof Press', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
    ]
  },
  athletic_power: {
    id: 'athletic_power',
    name: 'Athletic Power',
    focus: 'Explosive Power & Conditioning',
    description: 'An athletic-focused workout combining strength with explosive power movements. Great for sports performance and functional fitness.',
    goals: ['Explosive power', 'Athletic performance', 'Conditioning'],
    difficulty: 'Intermediate',
    exercises: [
      { id: 'power_clean', name: 'Power Clean', sets: 5, targetReps: 3, suggestedWeight: 70, lastWeight: 65, lastReps: [3, 3, 3, 3, 2], restTime: 180, muscleGroup: 'Full Body' },
      { id: 'box_jump', name: 'Box Jumps', sets: 4, targetReps: 5, suggestedWeight: 0, lastWeight: 0, lastReps: [5, 5, 5, 5], restTime: 120, muscleGroup: 'Quads' },
      { id: 'front_squat', name: 'Front Squat', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 80, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Quads' },
      { id: 'push_press', name: 'Push Press', sets: 4, targetReps: 5, suggestedWeight: 60, lastWeight: 57.5, lastReps: [5, 5, 5, 4], restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'kb_swing', name: 'Kettlebell Swings', sets: 3, targetReps: 15, suggestedWeight: 24, lastWeight: 20, lastReps: [15, 15, 12], restTime: 90, muscleGroup: 'Glutes' },
      { id: 'plank', name: 'Plank', sets: 3, targetReps: 60, suggestedWeight: 0, lastWeight: 0, lastReps: [60, 45, 45], restTime: 60, muscleGroup: 'Core' },
    ]
  }
};

// Current workout - would be determined by program/schedule
