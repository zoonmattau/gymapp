// Programs ordered from weight gain to weight loss
export const GOAL_INFO = {
  bulk: {
    title: 'Mass Building (Bulk)',
    icon: '🦍',
    overview: "Maximize muscle and size gains with a calorie surplus.",
    requirements: [
      { icon: '🍽️', title: 'Calorie Surplus', desc: 'Eat 300-500 calories above maintenance.' },
      { icon: '🏋️', title: 'Heavy Training', desc: 'Focus on compound lifts with progressive overload.' },
      { icon: '🍗', title: 'High Protein', desc: 'Aim for 1.8-2.2g protein per kg bodyweight.' },
      { icon: '😴', title: 'Recovery', desc: 'Sleep 7-9 hours for optimal muscle growth.' },
    ],
    minDays: 4,
    idealDays: '4-6',
    weightDirection: 'gain',
  },
  bodybuilding: {
    title: 'Classic Bodybuilding',
    icon: '🏆',
    overview: "Traditional bro split - one muscle group per day for maximum focus.",
    requirements: [
      { icon: '💪', title: 'Isolation Focus', desc: 'Target each muscle group with dedicated sessions.' },
      { icon: '🔥', title: 'High Volume', desc: 'Multiple exercises per muscle group each session.' },
      { icon: '🍗', title: 'High Protein', desc: 'Aim for 1.8-2.2g protein per kg bodyweight.' },
      { icon: '😴', title: 'Recovery', desc: 'Each muscle gets 6-7 days rest between sessions.' },
    ],
    minDays: 5,
    idealDays: '5-6',
    weightDirection: 'gain',
  },
  build_muscle: {
    title: 'Lean Muscle Building',
    icon: '💪',
    overview: "Build muscle while minimizing fat gain with a slight surplus.",
    requirements: [
      { icon: '🏋️', title: 'Progressive Overload', desc: 'Gradually increase weight, reps, or sets.' },
      { icon: '📅', title: 'Consistency', desc: 'Results come from stacking sessions week after week.' },
      { icon: '🍗', title: 'Protein-Rich Diet', desc: 'Aim for 1.6-2.2g protein per kg bodyweight.' },
      { icon: '😴', title: 'Quality Sleep', desc: '7-9 hours per night for muscle repair.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'gain',
  },
  strength: {
    title: 'Strength & Power',
    icon: '🏋️',
    overview: "Maximize strength through heavy compound lifts.",
    requirements: [
      { icon: '🎯', title: 'Heavy Compounds', desc: 'Focus on squat, bench, deadlift, overhead press.' },
      { icon: '📈', title: 'Low Reps, High Weight', desc: '1-6 rep range with heavy loads.' },
      { icon: '⏰', title: 'Rest Periods', desc: 'Take 3-5 minutes rest between heavy sets.' },
    ],
    minDays: 3,
    idealDays: '3-4',
    weightDirection: 'maintain',
  },
  recomp: {
    title: 'Body Recomposition',
    icon: '🔄',
    overview: "Build muscle and lose fat simultaneously at maintenance calories.",
    requirements: [
      { icon: '⚖️', title: 'Maintenance Calories', desc: 'Eat at or slightly below TDEE.' },
      { icon: '🍗', title: 'Very High Protein', desc: 'Aim for 2.0-2.4g protein per kg bodyweight.' },
      { icon: '🏋️', title: 'Heavy Training', desc: 'Prioritize strength training to preserve muscle.' },
      { icon: '⏱️', title: 'Patience', desc: 'This approach is slower but sustainable.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'maintain',
  },
  fitness: {
    title: 'General Fitness',
    icon: '❤️',
    overview: "Overall fitness combining strength, cardio, and mobility.",
    requirements: [
      { icon: '🔄', title: 'Variety', desc: 'Mix resistance training, cardio, and flexibility.' },
      { icon: '❤️', title: 'Heart Health', desc: '150 mins moderate cardio per week minimum.' },
      { icon: '🧘', title: 'Mobility', desc: 'Include stretching and mobility work.' },
    ],
    minDays: 2,
    idealDays: '3-5',
    weightDirection: 'maintain',
  },
  athletic: {
    title: 'Athletic Performance',
    icon: '⚡',
    overview: "Optimize for sports performance, speed, and agility.",
    requirements: [
      { icon: '🏃', title: 'Conditioning', desc: 'Mix strength with sport-specific cardio.' },
      { icon: '💨', title: 'Speed & Power', desc: 'Include plyometrics and explosive movements.' },
      { icon: '🔄', title: 'Mobility', desc: 'Prioritize flexibility and injury prevention.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'maintain',
  },
  lean: {
    title: 'Getting Lean (Cut)',
    icon: '✂️',
    overview: "Shed fat while preserving muscle with a moderate deficit.",
    requirements: [
      { icon: '🍽️', title: 'Moderate Deficit', desc: 'Eat 300-400 calories below maintenance.' },
      { icon: '🍗', title: 'High Protein', desc: 'Keep protein at 2.0g+ per kg to preserve muscle.' },
      { icon: '🏋️', title: 'Maintain Intensity', desc: 'Keep lifting heavy to signal muscle retention.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'lose',
  },
  lose_fat: {
    title: 'Fat Loss',
    icon: '🔥',
    overview: "Aggressive fat loss with a larger calorie deficit.",
    requirements: [
      { icon: '🍽️', title: 'Calorie Deficit', desc: 'Eat 500-750 calories below maintenance.' },
      { icon: '🏃', title: 'Cardio + Weights', desc: 'Combine resistance training with cardio.' },
      { icon: '🍗', title: 'Very High Protein', desc: 'Maximize protein to preserve muscle mass.' },
    ],
    minDays: 3,
    idealDays: '4-6',
    weightDirection: 'lose',
  },
};

// Map goals to recommended programs
export const GOAL_TO_PROGRAM = {
  bulk: { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'High volume split for maximum muscle growth' },
  bodybuilding: { id: 'bro_split', name: 'Bro Split', days: 5, weeks: 12, desc: 'Classic bodybuilding - one muscle group per day' },
  build_muscle: { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach with optimal recovery' },
  strength: { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Powerlifting-style for max strength' },
  recomp: { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach for body recomposition' },
  fitness: { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Efficient training for overall fitness' },
  athletic: { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'Speed, agility, and power focus' },
  lean: { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements' },
  lose_fat: { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements' },
};

// Program to workout template mapping
export const PROGRAM_TEMPLATES = {
  ppl: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'],
  upper_lower: ['upper_a', 'lower', 'upper_b', 'lower'],
  strength: ['powerlifting_squat', 'powerlifting_bench', 'powerlifting_deadlift', 'upper_a'],
  full_body: ['full_body_a', 'full_body_b', 'full_body_a'],
  athlete: ['athletic_power', 'upper_a', 'legs_a', 'full_body_b', 'athletic_power'],
  fat_loss: ['full_body_a', 'full_body_b', 'upper_a', 'legs_a'],
  bro_split: ['chest', 'back', 'shoulders', 'legs_quad', 'arms'],
};

// Goal training parameters
export const GOAL_TRAINING_PARAMS = {
  bulk: { setsPerExercise: [4, 5], repsPerSet: [8, 12], restTime: [90, 120], compoundFirst: true },
  bodybuilding: { setsPerExercise: [4, 5], repsPerSet: [8, 12], restTime: [60, 90], compoundFirst: true },
  build_muscle: { setsPerExercise: [3, 4], repsPerSet: [8, 12], restTime: [60, 90], compoundFirst: true },
  strength: { setsPerExercise: [4, 5], repsPerSet: [3, 6], restTime: [180, 240], compoundFirst: true },
  recomp: { setsPerExercise: [3, 4], repsPerSet: [8, 12], restTime: [60, 90], compoundFirst: true },
  fitness: { setsPerExercise: [2, 3], repsPerSet: [12, 15], restTime: [45, 60], compoundFirst: false },
  athletic: { setsPerExercise: [3, 4], repsPerSet: [6, 10], restTime: [60, 90], compoundFirst: true },
  lean: { setsPerExercise: [3, 4], repsPerSet: [10, 15], restTime: [45, 60], compoundFirst: true },
  lose_fat: { setsPerExercise: [3, 4], repsPerSet: [12, 15], restTime: [30, 45], compoundFirst: false },
};
