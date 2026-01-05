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
