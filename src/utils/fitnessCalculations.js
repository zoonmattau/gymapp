// Fitness calculation utilities for personalized targets

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} gender - 'male', 'female', or 'other'
 */
export function calculateBMR(weight, height, age, gender) {
  // Mifflin-St Jeor Equation
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;

  if (gender === 'male') {
    return baseBMR + 5;
  } else if (gender === 'female') {
    return baseBMR - 161;
  } else {
    // Average for 'other'
    return baseBMR - 78;
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param {number} bmr - Basal Metabolic Rate
 * @param {number} workoutsPerWeek - Number of workouts per week
 * @param {string} goal - 'build_muscle', 'lose_fat', 'strength', 'fitness'
 */
export function calculateTDEE(bmr, workoutsPerWeek, goal) {
  // Activity multipliers based on workout frequency
  let activityMultiplier;

  if (workoutsPerWeek <= 1) {
    activityMultiplier = 1.2; // Sedentary
  } else if (workoutsPerWeek <= 3) {
    activityMultiplier = 1.375; // Lightly active
  } else if (workoutsPerWeek <= 5) {
    activityMultiplier = 1.55; // Moderately active
  } else {
    activityMultiplier = 1.725; // Very active
  }

  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculate daily calorie target based on goal
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - 'build_muscle', 'lose_fat', 'strength', 'fitness'
 * @param {number} currentWeight - Current weight in kg
 * @param {number} goalWeight - Target weight in kg
 */
export function calculateCalorieTarget(tdee, goal, currentWeight, goalWeight) {
  const weightDiff = goalWeight - currentWeight;

  switch (goal) {
    case 'build_muscle':
      // Lean bulk: 10-15% surplus
      return Math.round(tdee * 1.1);

    case 'lose_fat':
      // Cut: 15-20% deficit (more aggressive if more to lose)
      const deficitPercent = Math.abs(weightDiff) > 10 ? 0.8 : 0.85;
      return Math.round(tdee * deficitPercent);

    case 'strength':
      // Slight surplus for strength gains
      return Math.round(tdee * 1.05);

    case 'fitness':
    default:
      // Maintenance or slight deficit/surplus based on goal weight
      if (weightDiff > 2) {
        return Math.round(tdee * 1.05);
      } else if (weightDiff < -2) {
        return Math.round(tdee * 0.9);
      }
      return tdee;
  }
}

/**
 * Calculate macro targets based on goal and calories
 * @param {number} calories - Daily calorie target
 * @param {number} weight - Current weight in kg
 * @param {string} goal - 'build_muscle', 'lose_fat', 'strength', 'fitness'
 */
export function calculateMacros(calories, weight, goal) {
  let proteinPerKg, fatPercent;

  switch (goal) {
    case 'build_muscle':
      proteinPerKg = 2.0; // High protein for muscle building
      fatPercent = 0.25; // 25% from fat
      break;

    case 'lose_fat':
      proteinPerKg = 2.2; // Even higher protein to preserve muscle
      fatPercent = 0.25; // 25% from fat
      break;

    case 'strength':
      proteinPerKg = 1.8; // Moderate-high protein
      fatPercent = 0.30; // 30% from fat
      break;

    case 'fitness':
    default:
      proteinPerKg = 1.6; // Standard athletic protein
      fatPercent = 0.30; // 30% from fat
      break;
  }

  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round((calories * fatPercent) / 9); // 9 cal per gram of fat
  const proteinCals = protein * 4; // 4 cal per gram of protein
  const fatCals = fat * 9;
  const carbs = Math.round((calories - proteinCals - fatCals) / 4); // 4 cal per gram of carbs

  return { protein, carbs, fat };
}

/**
 * Calculate water intake target
 * @param {number} weight - Weight in kg
 * @param {number} workoutsPerWeek - Number of workouts per week
 */
export function calculateWaterTarget(weight, workoutsPerWeek) {
  // Base: 35ml per kg of body weight
  let waterMl = weight * 35;

  // Add extra for workout days (average it out)
  const extraForWorkouts = (workoutsPerWeek / 7) * 500; // 500ml extra on workout days
  waterMl += extraForWorkouts;

  // Cap at reasonable limits (2L min, 3.5L max for most people)
  waterMl = Math.max(2000, Math.min(3500, waterMl));

  // Round to nearest 100ml
  return Math.round(waterMl / 100) * 100;
}

/**
 * Calculate expected weekly weight change
 * @param {number} calorieTarget - Daily calorie target
 * @param {number} tdee - TDEE
 */
export function calculateWeeklyWeightChange(calorieTarget, tdee) {
  // 7700 calories = approximately 1kg of body weight
  const dailyDiff = calorieTarget - tdee;
  const weeklyDiff = dailyDiff * 7;
  return parseFloat((weeklyDiff / 7700).toFixed(2)); // kg per week
}

/**
 * Calculate program duration based on goal
 * @param {number} currentWeight - Current weight in kg
 * @param {number} goalWeight - Target weight in kg
 * @param {number} weeklyChange - Expected weekly weight change
 */
export function calculateProgramWeeks(currentWeight, goalWeight, weeklyChange) {
  if (weeklyChange === 0) return 12; // Default

  const weightDiff = Math.abs(goalWeight - currentWeight);
  const weeksNeeded = Math.ceil(weightDiff / Math.abs(weeklyChange));

  // Cap between 8 and 52 weeks
  return Math.min(52, Math.max(8, weeksNeeded));
}

/**
 * Generate all nutrition targets for a user
 * @param {Object} userStats - User statistics
 */
export function generateNutritionTargets(userStats) {
  const {
    weight,
    height = 175, // Default height if not set
    age = 25, // Default age if not set
    gender = 'other',
    goal = 'fitness',
    workoutsPerWeek = 4,
    goalWeight,
  } = userStats;

  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, workoutsPerWeek, goal);
  const calories = calculateCalorieTarget(tdee, goal, weight, goalWeight || weight);
  const macros = calculateMacros(calories, weight, goal);
  const water = calculateWaterTarget(weight, workoutsPerWeek);
  const weeklyWeightChange = calculateWeeklyWeightChange(calories, tdee);

  return {
    bmr,
    tdee,
    calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    water,
    weeklyWeightChange,
  };
}

/**
 * Generate workout schedule based on user preferences
 * @param {Object} params - Schedule parameters
 */
export function generateWorkoutSchedule(params) {
  const {
    daysPerWeek = 4,
    restDays = [5, 6], // Saturday, Sunday (0=Monday)
    goal = 'build_muscle',
    experience = 'intermediate',
    startDate = new Date(),
    weeks = 16,
  } = params;

  // Workout templates based on days per week and goal
  const templates = getWorkoutTemplates(daysPerWeek, goal, experience);

  const schedule = {};
  let templateIndex = 0;
  const currentDate = new Date(startDate);

  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayOfWeek = (currentDate.getDay() + 6) % 7; // Convert to Mon=0 format

      if (restDays.includes(dayOfWeek)) {
        schedule[dateKey] = { workout: null, isRestDay: true, completed: false };
      } else if (templateIndex < daysPerWeek) {
        schedule[dateKey] = {
          workout: templates[templateIndex % templates.length],
          isRestDay: false,
          completed: false,
        };
        templateIndex++;
      } else {
        schedule[dateKey] = { workout: null, isRestDay: true, completed: false };
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
    templateIndex = 0; // Reset for new week
  }

  return schedule;
}

/**
 * Get workout templates based on training split
 * @param {number} daysPerWeek - Number of workout days
 * @param {string} goal - Training goal
 * @param {string} experience - Experience level
 */
function getWorkoutTemplates(daysPerWeek, goal, experience) {
  // Push/Pull/Legs for 6 days
  if (daysPerWeek >= 6) {
    return [
      { id: 'push_a', name: 'Push A', type: 'Push A', focus: 'Chest & Shoulders' },
      { id: 'pull_a', name: 'Pull A', type: 'Pull A', focus: 'Back & Biceps' },
      { id: 'legs_a', name: 'Legs A', type: 'Legs A', focus: 'Quads & Glutes' },
      { id: 'push_b', name: 'Push B', type: 'Push B', focus: 'Shoulders & Triceps' },
      { id: 'pull_b', name: 'Pull B', type: 'Pull B', focus: 'Back & Rear Delts' },
      { id: 'legs_b', name: 'Legs B', type: 'Legs B', focus: 'Hamstrings & Calves' },
    ];
  }

  // Upper/Lower for 4 days
  if (daysPerWeek >= 4) {
    return [
      { id: 'push_a', name: 'Push A', type: 'Push A', focus: 'Chest & Triceps' },
      { id: 'pull_a', name: 'Pull A', type: 'Pull A', focus: 'Back & Biceps' },
      { id: 'legs_a', name: 'Legs A', type: 'Legs A', focus: 'Quads & Glutes' },
      { id: 'upper_b', name: 'Upper B', type: 'Upper B', focus: 'Shoulders & Arms' },
    ];
  }

  // Full Body for 3 days
  if (daysPerWeek >= 3) {
    return [
      { id: 'full_a', name: 'Full Body A', type: 'Full Body A', focus: 'Compound Focus' },
      { id: 'full_b', name: 'Full Body B', type: 'Full Body B', focus: 'Hypertrophy' },
      { id: 'full_c', name: 'Full Body C', type: 'Full Body C', focus: 'Strength' },
    ];
  }

  // 2 days - Upper/Lower
  return [
    { id: 'upper', name: 'Upper Body', type: 'Upper', focus: 'Push & Pull' },
    { id: 'lower', name: 'Lower Body', type: 'Lower', focus: 'Legs & Core' },
  ];
}

/**
 * Calculate suggested starting weight for an exercise
 * Based on user's body weight, experience level, and target reps
 * @param {string} exerciseName - Name of the exercise
 * @param {Object} userStats - User statistics
 * @param {number} targetReps - Target reps for the set
 * @returns {number} Suggested weight in kg
 */
export function calculateSuggestedWeight(exerciseName, userStats, targetReps = 10) {
  const {
    bodyWeight = 70, // Default to 70kg if not provided
    experience = 'beginner',
    gender = 'male',
    goal = 'fitness',
  } = userStats;

  const name = exerciseName.toLowerCase();

  // Base weight as percentage of bodyweight for an intermediate male doing 8-10 reps
  const exerciseBaseWeights = {
    // Barbell Compounds
    'barbell bench press': { base: 0.65, type: 'upper', equipment: 'barbell' },
    'bench press': { base: 0.65, type: 'upper', equipment: 'barbell' },
    'incline barbell press': { base: 0.55, type: 'upper', equipment: 'barbell' },
    'incline bench press': { base: 0.55, type: 'upper', equipment: 'barbell' },
    'decline bench press': { base: 0.70, type: 'upper', equipment: 'barbell' },
    'barbell squat': { base: 0.85, type: 'lower', equipment: 'barbell' },
    'squat': { base: 0.85, type: 'lower', equipment: 'barbell' },
    'back squat': { base: 0.85, type: 'lower', equipment: 'barbell' },
    'front squat': { base: 0.65, type: 'lower', equipment: 'barbell' },
    'deadlift': { base: 1.0, type: 'lower', equipment: 'barbell' },
    'conventional deadlift': { base: 1.0, type: 'lower', equipment: 'barbell' },
    'romanian deadlift': { base: 0.60, type: 'lower', equipment: 'barbell' },
    'sumo deadlift': { base: 0.95, type: 'lower', equipment: 'barbell' },
    'overhead press': { base: 0.40, type: 'upper', equipment: 'barbell' },
    'barbell overhead press': { base: 0.40, type: 'upper', equipment: 'barbell' },
    'military press': { base: 0.40, type: 'upper', equipment: 'barbell' },
    'bent over row': { base: 0.55, type: 'upper', equipment: 'barbell' },
    'barbell row': { base: 0.55, type: 'upper', equipment: 'barbell' },
    'pendlay row': { base: 0.50, type: 'upper', equipment: 'barbell' },
    'barbell curl': { base: 0.25, type: 'upper', equipment: 'barbell' },
    'ez bar curl': { base: 0.22, type: 'upper', equipment: 'barbell' },
    'skull crusher': { base: 0.20, type: 'upper', equipment: 'barbell' },
    'close grip bench press': { base: 0.55, type: 'upper', equipment: 'barbell' },
    'barbell hip thrust': { base: 0.80, type: 'lower', equipment: 'barbell' },
    'hip thrust': { base: 0.80, type: 'lower', equipment: 'barbell' },
    'barbell lunge': { base: 0.40, type: 'lower', equipment: 'barbell' },
    'barbell shrug': { base: 0.65, type: 'upper', equipment: 'barbell' },
    'upright row': { base: 0.30, type: 'upper', equipment: 'barbell' },

    // Dumbbell Compounds
    'dumbbell bench press': { base: 0.25, type: 'upper', equipment: 'dumbbell', perHand: true },
    'flat dumbbell press': { base: 0.25, type: 'upper', equipment: 'dumbbell', perHand: true },
    'incline dumbbell press': { base: 0.22, type: 'upper', equipment: 'dumbbell', perHand: true },
    'dumbbell shoulder press': { base: 0.18, type: 'upper', equipment: 'dumbbell', perHand: true },
    'seated dumbbell press': { base: 0.18, type: 'upper', equipment: 'dumbbell', perHand: true },
    'arnold press': { base: 0.16, type: 'upper', equipment: 'dumbbell', perHand: true },
    'dumbbell row': { base: 0.28, type: 'upper', equipment: 'dumbbell', perHand: true },
    'one arm dumbbell row': { base: 0.28, type: 'upper', equipment: 'dumbbell', perHand: true },
    'dumbbell lunge': { base: 0.18, type: 'lower', equipment: 'dumbbell', perHand: true },
    'goblet squat': { base: 0.30, type: 'lower', equipment: 'dumbbell' },
    'dumbbell romanian deadlift': { base: 0.22, type: 'lower', equipment: 'dumbbell', perHand: true },
    'dumbbell deadlift': { base: 0.25, type: 'lower', equipment: 'dumbbell', perHand: true },
    'dumbbell step up': { base: 0.15, type: 'lower', equipment: 'dumbbell', perHand: true },

    // Dumbbell Isolation
    'dumbbell curl': { base: 0.12, type: 'upper', equipment: 'dumbbell', perHand: true },
    'bicep curl': { base: 0.12, type: 'upper', equipment: 'dumbbell', perHand: true },
    'hammer curl': { base: 0.13, type: 'upper', equipment: 'dumbbell', perHand: true },
    'concentration curl': { base: 0.10, type: 'upper', equipment: 'dumbbell', perHand: true },
    'incline dumbbell curl': { base: 0.10, type: 'upper', equipment: 'dumbbell', perHand: true },
    'preacher curl': { base: 0.11, type: 'upper', equipment: 'dumbbell', perHand: true },
    'lateral raise': { base: 0.08, type: 'upper', equipment: 'dumbbell', perHand: true },
    'lateral raises': { base: 0.08, type: 'upper', equipment: 'dumbbell', perHand: true },
    'side lateral raise': { base: 0.08, type: 'upper', equipment: 'dumbbell', perHand: true },
    'front raise': { base: 0.09, type: 'upper', equipment: 'dumbbell', perHand: true },
    'front raises': { base: 0.09, type: 'upper', equipment: 'dumbbell', perHand: true },
    'rear delt fly': { base: 0.07, type: 'upper', equipment: 'dumbbell', perHand: true },
    'reverse fly': { base: 0.07, type: 'upper', equipment: 'dumbbell', perHand: true },
    'bent over fly': { base: 0.07, type: 'upper', equipment: 'dumbbell', perHand: true },
    'dumbbell fly': { base: 0.15, type: 'upper', equipment: 'dumbbell', perHand: true },
    'chest fly': { base: 0.15, type: 'upper', equipment: 'dumbbell', perHand: true },
    'incline dumbbell fly': { base: 0.13, type: 'upper', equipment: 'dumbbell', perHand: true },
    'tricep kickback': { base: 0.08, type: 'upper', equipment: 'dumbbell', perHand: true },
    'overhead tricep extension': { base: 0.18, type: 'upper', equipment: 'dumbbell' },
    'dumbbell overhead extension': { base: 0.18, type: 'upper', equipment: 'dumbbell' },
    'dumbbell pullover': { base: 0.22, type: 'upper', equipment: 'dumbbell' },
    'dumbbell shrug': { base: 0.30, type: 'upper', equipment: 'dumbbell', perHand: true },

    // Cable Exercises
    'cable fly': { base: 0.12, type: 'upper', equipment: 'cable' },
    'cable crossover': { base: 0.12, type: 'upper', equipment: 'cable' },
    'high cable fly': { base: 0.10, type: 'upper', equipment: 'cable' },
    'low cable fly': { base: 0.12, type: 'upper', equipment: 'cable' },
    'cable row': { base: 0.45, type: 'upper', equipment: 'cable' },
    'seated cable row': { base: 0.45, type: 'upper', equipment: 'cable' },
    'face pull': { base: 0.18, type: 'upper', equipment: 'cable' },
    'face pulls': { base: 0.18, type: 'upper', equipment: 'cable' },
    'cable lateral raise': { base: 0.08, type: 'upper', equipment: 'cable' },
    'cable curl': { base: 0.20, type: 'upper', equipment: 'cable' },
    'cable hammer curl': { base: 0.22, type: 'upper', equipment: 'cable' },
    'tricep pushdown': { base: 0.25, type: 'upper', equipment: 'cable' },
    'tricep pushdowns': { base: 0.25, type: 'upper', equipment: 'cable' },
    'rope pushdown': { base: 0.22, type: 'upper', equipment: 'cable' },
    'rope tricep pushdown': { base: 0.22, type: 'upper', equipment: 'cable' },
    'overhead cable extension': { base: 0.20, type: 'upper', equipment: 'cable' },
    'cable tricep extension': { base: 0.20, type: 'upper', equipment: 'cable' },
    'straight arm pulldown': { base: 0.20, type: 'upper', equipment: 'cable' },
    'cable pull through': { base: 0.30, type: 'lower', equipment: 'cable' },
    'cable kickback': { base: 0.15, type: 'lower', equipment: 'cable' },

    // Machine Exercises
    'lat pulldown': { base: 0.55, type: 'upper', equipment: 'machine' },
    'wide grip lat pulldown': { base: 0.55, type: 'upper', equipment: 'machine' },
    'close grip lat pulldown': { base: 0.50, type: 'upper', equipment: 'machine' },
    'machine row': { base: 0.50, type: 'upper', equipment: 'machine' },
    'machine chest press': { base: 0.50, type: 'upper', equipment: 'machine' },
    'chest press machine': { base: 0.50, type: 'upper', equipment: 'machine' },
    'pec deck': { base: 0.35, type: 'upper', equipment: 'machine' },
    'pec deck fly': { base: 0.35, type: 'upper', equipment: 'machine' },
    'machine shoulder press': { base: 0.35, type: 'upper', equipment: 'machine' },
    'machine lateral raise': { base: 0.18, type: 'upper', equipment: 'machine' },
    'reverse pec deck': { base: 0.25, type: 'upper', equipment: 'machine' },
    'leg press': { base: 1.3, type: 'lower', equipment: 'machine' },
    'leg extension': { base: 0.40, type: 'lower', equipment: 'machine' },
    'leg extensions': { base: 0.40, type: 'lower', equipment: 'machine' },
    'leg curl': { base: 0.30, type: 'lower', equipment: 'machine' },
    'lying leg curl': { base: 0.30, type: 'lower', equipment: 'machine' },
    'seated leg curl': { base: 0.28, type: 'lower', equipment: 'machine' },
    'hack squat': { base: 0.80, type: 'lower', equipment: 'machine' },
    'smith machine squat': { base: 0.70, type: 'lower', equipment: 'machine' },
    'smith machine bench press': { base: 0.55, type: 'upper', equipment: 'machine' },
    'calf raise machine': { base: 0.90, type: 'lower', equipment: 'machine' },
    'seated calf raise': { base: 0.50, type: 'lower', equipment: 'machine' },
    'standing calf raise': { base: 0.90, type: 'lower', equipment: 'machine' },
    'hip abductor': { base: 0.40, type: 'lower', equipment: 'machine' },
    'hip adductor': { base: 0.40, type: 'lower', equipment: 'machine' },
    'glute machine': { base: 0.45, type: 'lower', equipment: 'machine' },
    'assisted pull up': { base: -0.30, type: 'upper', equipment: 'machine' }, // Negative = assistance
    'assisted dip': { base: -0.25, type: 'upper', equipment: 'machine' },

    // Bodyweight (return 0 weight but may have weighted versions)
    'pull up': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'pull ups': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'chin up': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'chin ups': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'dip': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'dips': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'push up': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'push ups': { base: 0, type: 'upper', equipment: 'bodyweight' },
    'bodyweight squat': { base: 0, type: 'lower', equipment: 'bodyweight' },
    'lunge': { base: 0, type: 'lower', equipment: 'bodyweight' },
    'lunges': { base: 0, type: 'lower', equipment: 'bodyweight' },
    'glute bridge': { base: 0, type: 'lower', equipment: 'bodyweight' },
    'single leg glute bridge': { base: 0, type: 'lower', equipment: 'bodyweight' },
    'calf raise': { base: 0, type: 'lower', equipment: 'bodyweight' },
    'plank': { base: 0, type: 'core', equipment: 'bodyweight' },
    'side plank': { base: 0, type: 'core', equipment: 'bodyweight' },
    'crunch': { base: 0, type: 'core', equipment: 'bodyweight' },
    'crunches': { base: 0, type: 'core', equipment: 'bodyweight' },
    'bicycle crunch': { base: 0, type: 'core', equipment: 'bodyweight' },
    'leg raise': { base: 0, type: 'core', equipment: 'bodyweight' },
    'hanging leg raise': { base: 0, type: 'core', equipment: 'bodyweight' },
    'hanging leg raises': { base: 0, type: 'core', equipment: 'bodyweight' },
    'mountain climber': { base: 0, type: 'core', equipment: 'bodyweight' },
    'mountain climbers': { base: 0, type: 'core', equipment: 'bodyweight' },
    'russian twist': { base: 0, type: 'core', equipment: 'bodyweight' },
    'dead bug': { base: 0, type: 'core', equipment: 'bodyweight' },
    'bird dog': { base: 0, type: 'core', equipment: 'bodyweight' },
    'hollow hold': { base: 0, type: 'core', equipment: 'bodyweight' },
    'v-up': { base: 0, type: 'core', equipment: 'bodyweight' },
    'ab wheel rollout': { base: 0, type: 'core', equipment: 'bodyweight' },
    'superman': { base: 0, type: 'core', equipment: 'bodyweight' },
  };

  // Find matching exercise (partial match)
  let exerciseData = null;
  for (const [key, data] of Object.entries(exerciseBaseWeights)) {
    if (name.includes(key) || key.includes(name)) {
      exerciseData = data;
      break;
    }
  }

  // Default to a moderate weight if exercise not found
  if (!exerciseData) {
    // Try to guess based on name patterns
    if (name.includes('curl')) {
      exerciseData = { base: 0.12, type: 'upper', equipment: 'dumbbell', perHand: true };
    } else if (name.includes('raise') || name.includes('fly')) {
      exerciseData = { base: 0.08, type: 'upper', equipment: 'dumbbell', perHand: true };
    } else if (name.includes('press')) {
      exerciseData = { base: 0.40, type: 'upper', equipment: 'barbell' };
    } else if (name.includes('row')) {
      exerciseData = { base: 0.45, type: 'upper', equipment: 'cable' };
    } else if (name.includes('squat') || name.includes('lunge')) {
      exerciseData = { base: 0.60, type: 'lower', equipment: 'barbell' };
    } else if (name.includes('extension') || name.includes('pushdown')) {
      exerciseData = { base: 0.20, type: 'upper', equipment: 'cable' };
    } else {
      exerciseData = { base: 0.25, type: 'upper', equipment: 'dumbbell' };
    }
  }

  // If bodyweight exercise, return 0
  if (exerciseData.equipment === 'bodyweight' || exerciseData.base === 0) {
    return 0;
  }

  // Experience multiplier
  const experienceMultipliers = {
    beginner: 0.6,
    intermediate: 1.0,
    experienced: 1.2,
    advanced: 1.35,
    expert: 1.5,
  };
  const expMultiplier = experienceMultipliers[experience] || experienceMultipliers.beginner;

  // Gender multiplier (applied to upper body mainly)
  let genderMultiplier = 1.0;
  if (gender === 'female') {
    genderMultiplier = exerciseData.type === 'upper' ? 0.55 : 0.75;
  }

  // Rep adjustment (heavier for low reps, lighter for high reps)
  // Baseline is 8-10 reps
  let repMultiplier = 1.0;
  if (targetReps <= 5) {
    repMultiplier = 1.15; // Heavier for strength
  } else if (targetReps <= 7) {
    repMultiplier = 1.08;
  } else if (targetReps >= 12 && targetReps <= 15) {
    repMultiplier = 0.85;
  } else if (targetReps > 15) {
    repMultiplier = 0.70;
  }

  // Goal adjustment
  const goalMultipliers = {
    strength: 1.1,
    build_muscle: 1.0,
    bulk: 1.0,
    recomp: 0.95,
    fitness: 0.90,
    lose_fat: 0.85,
    lean: 0.85,
  };
  const goalMultiplier = goalMultipliers[goal] || 1.0;

  // Calculate final weight
  let suggestedWeight = bodyWeight * exerciseData.base * expMultiplier * genderMultiplier * repMultiplier * goalMultiplier;

  // Round to nearest 2.5kg (standard plate increment)
  suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;

  // Minimum weights
  const minWeights = {
    barbell: 20, // Empty olympic bar
    dumbbell: 2.5,
    cable: 5,
    machine: 10,
  };
  const minWeight = minWeights[exerciseData.equipment] || 5;

  // Make sure we don't go below minimum
  suggestedWeight = Math.max(minWeight, suggestedWeight);

  // For per-hand exercises (dumbbells), this is already per hand
  // For barbell exercises, this is total weight
  return suggestedWeight;
}

/**
 * Project weight progress over time
 * @param {number} startWeight - Starting weight
 * @param {number} weeklyChange - Expected weekly change
 * @param {number} weeks - Number of weeks to project
 */
export function projectWeightProgress(startWeight, weeklyChange, weeks) {
  const projection = [];
  let currentWeight = startWeight;

  for (let week = 1; week <= weeks; week++) {
    currentWeight += weeklyChange;
    projection.push({
      week: week.toString(),
      expected: parseFloat(currentWeight.toFixed(1)),
    });
  }

  return projection;
}
