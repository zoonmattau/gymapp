/**
 * Seed Script: Generate 100 Dummy Users with Complete History
 *
 * Run with: node scripts/seed-users.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 * (Service role key bypasses RLS for admin operations)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============ NAME DATA ============
const MALE_FIRST_NAMES = [
  'James', 'Michael', 'Robert', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel',
  'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin',
  'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary',
  'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel',
  'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron',
  'Jose', 'Adam', 'Nathan', 'Henry', 'Douglas', 'Zachary', 'Peter', 'Kyle', 'Noah', 'Ethan',
  'Marcus', 'Derek', 'Cameron', 'Caleb', 'Dylan', 'Luke', 'Chase', 'Hunter', 'Austin', 'Jordan'
];

const FEMALE_FIRST_NAMES = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
  'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather',
  'Diane', 'Ruth', 'Julie', 'Olivia', 'Joyce', 'Virginia', 'Victoria', 'Kelly', 'Lauren', 'Christina',
  'Joan', 'Evelyn', 'Judith', 'Megan', 'Andrea', 'Cheryl', 'Hannah', 'Jacqueline', 'Martha', 'Gloria'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Turner', 'Phillips', 'Evans', 'Parker', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Murphy', 'Cook',
  'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed', 'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard'
];

const GOALS = ['build_muscle', 'lose_fat', 'strength', 'fitness'];
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];
const ACTIVITY_LEVELS = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'];

const BIOS = [
  'Lifting heavy and chasing gains',
  'Fitness journey started 2023',
  'No excuses, just results',
  'Consistency is key',
  'Building a better me every day',
  'Former athlete, forever competitor',
  'Mind over matter',
  'Work hard, train harder',
  'Gym rat and proud of it',
  'Transforming one rep at a time',
  'Dedicated to the grind',
  'Making gains, not excuses',
  'Every workout counts',
  'Pushing limits daily',
  'Strong body, strong mind',
  'Progress, not perfection',
  'Living the fit life',
  'One day at a time',
  'Sweat is just fat crying',
  'Iron therapy enthusiast',
  'Early morning gym crew',
  'Weekend warrior',
  'Cardio? I thought you said burrito',
  'Leg day is best day',
  'Never skip a workout',
  'Fitness is my therapy',
  'Just trying to be better than yesterday',
  'Muscle building in progress',
  'Gym newbie learning the ropes',
  'Retired couch potato',
];

const EXERCISES = [
  { name: 'Barbell Bench Press', muscle: 'chest', baseWeight: { m: 60, f: 30 } },
  { name: 'Incline Dumbbell Press', muscle: 'chest', baseWeight: { m: 25, f: 12 } },
  { name: 'Cable Fly', muscle: 'chest', baseWeight: { m: 15, f: 7 } },
  { name: 'Barbell Squat', muscle: 'legs', baseWeight: { m: 80, f: 40 } },
  { name: 'Romanian Deadlift', muscle: 'legs', baseWeight: { m: 70, f: 35 } },
  { name: 'Leg Press', muscle: 'legs', baseWeight: { m: 120, f: 60 } },
  { name: 'Leg Extension', muscle: 'legs', baseWeight: { m: 40, f: 20 } },
  { name: 'Leg Curl', muscle: 'legs', baseWeight: { m: 35, f: 18 } },
  { name: 'Calf Raise', muscle: 'legs', baseWeight: { m: 80, f: 40 } },
  { name: 'Barbell Deadlift', muscle: 'back', baseWeight: { m: 100, f: 50 } },
  { name: 'Pull-ups', muscle: 'back', baseWeight: { m: 0, f: 0 } },
  { name: 'Lat Pulldown', muscle: 'back', baseWeight: { m: 50, f: 25 } },
  { name: 'Barbell Row', muscle: 'back', baseWeight: { m: 60, f: 30 } },
  { name: 'Seated Cable Row', muscle: 'back', baseWeight: { m: 55, f: 28 } },
  { name: 'Overhead Press', muscle: 'shoulders', baseWeight: { m: 40, f: 15 } },
  { name: 'Lateral Raise', muscle: 'shoulders', baseWeight: { m: 10, f: 5 } },
  { name: 'Front Raise', muscle: 'shoulders', baseWeight: { m: 10, f: 5 } },
  { name: 'Face Pull', muscle: 'shoulders', baseWeight: { m: 20, f: 10 } },
  { name: 'Barbell Curl', muscle: 'arms', baseWeight: { m: 25, f: 10 } },
  { name: 'Tricep Pushdown', muscle: 'arms', baseWeight: { m: 25, f: 12 } },
  { name: 'Hammer Curl', muscle: 'arms', baseWeight: { m: 15, f: 7 } },
  { name: 'Skull Crushers', muscle: 'arms', baseWeight: { m: 25, f: 10 } },
];

const SUPPLEMENTS = [
  { name: 'Whey Protein', dosage: '30g', time: '08:00' },
  { name: 'Creatine', dosage: '5g', time: '07:00' },
  { name: 'Vitamin D3', dosage: '5000 IU', time: '08:00' },
  { name: 'Fish Oil', dosage: '2g', time: '08:00' },
  { name: 'Multivitamin', dosage: '1 tablet', time: '08:00' },
  { name: 'Magnesium', dosage: '400mg', time: '21:00' },
  { name: 'Zinc', dosage: '25mg', time: '21:00' },
  { name: 'Pre-workout', dosage: '1 scoop', time: '17:00' },
  { name: 'BCAAs', dosage: '10g', time: '17:00' },
  { name: 'Casein Protein', dosage: '30g', time: '22:00' },
];

const MEAL_NAMES = [
  'Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack',
  'Post-Workout Shake', 'Protein Bowl', 'Chicken & Rice', 'Oatmeal', 'Eggs & Toast',
  'Greek Yogurt', 'Salad', 'Steak & Veggies', 'Salmon & Quinoa', 'Turkey Sandwich'
];

// ============ HELPER FUNCTIONS ============
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateUsername(firstName, lastName) {
  const styles = [
    () => `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(1, 999)}`,
    () => `${firstName.toLowerCase()}_${lastName.toLowerCase().slice(0, 3)}`,
    () => `${firstName.toLowerCase()}${randomInt(1990, 2005)}`,
    () => `fit_${firstName.toLowerCase()}`,
    () => `${firstName.toLowerCase()}.lifts`,
    () => `${lastName.toLowerCase()}_gains`,
  ];
  return randomElement(styles)();
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Generate weight progress based on goal
function generateWeightProgress(startWeight, goal, weeksOnProgram, gender) {
  const weights = [];
  let currentWeight = startWeight;

  // Weekly change rates based on goal
  const weeklyChange = {
    lose_fat: gender === 'male' ? -0.5 : -0.4,
    build_muscle: gender === 'male' ? 0.25 : 0.15,
    strength: gender === 'male' ? 0.1 : 0.05,
    fitness: 0,
  };

  const baseChange = weeklyChange[goal] || 0;
  const today = new Date();

  for (let week = weeksOnProgram; week >= 0; week--) {
    // Add some randomness (+/- 0.5kg variation)
    const variance = randomFloat(-0.5, 0.5);
    const weekDate = addDays(today, -week * 7);

    // Log 2-4 weigh-ins per week
    const logsThisWeek = randomInt(2, 4);
    for (let i = 0; i < logsThisWeek; i++) {
      const dayOffset = randomInt(0, 6);
      const logDate = addDays(weekDate, dayOffset);
      if (logDate <= today) {
        weights.push({
          date: formatDate(logDate),
          weight: parseFloat((currentWeight + variance + randomFloat(-0.3, 0.3)).toFixed(1)),
        });
      }
    }

    currentWeight += baseChange;
  }

  // Sort by date and remove duplicates
  const seen = new Set();
  return weights
    .filter(w => {
      if (seen.has(w.date)) return false;
      seen.add(w.date);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Generate workout sessions
function generateWorkoutHistory(weeksOnProgram, experience, gender) {
  const sessions = [];
  const today = new Date();
  const workoutsPerWeek = experience === 'beginner' ? randomInt(2, 3) :
                          experience === 'intermediate' ? randomInt(3, 4) : randomInt(4, 6);

  // Strength multiplier based on experience
  const strengthMult = experience === 'beginner' ? 0.6 :
                       experience === 'intermediate' ? 0.85 : 1.1;

  for (let week = weeksOnProgram; week >= 0; week--) {
    const weekStart = addDays(today, -week * 7);

    // Generate workouts for this week
    for (let w = 0; w < workoutsPerWeek; w++) {
      const workoutDate = addDays(weekStart, randomInt(0, 6));
      if (workoutDate > today) continue;

      // Pick 4-6 exercises for this workout
      const numExercises = randomInt(4, 6);
      const workoutExercises = randomElements(EXERCISES, numExercises);

      const sets = [];
      let totalVolume = 0;

      workoutExercises.forEach(exercise => {
        const numSets = randomInt(3, 4);
        const baseWeight = exercise.baseWeight[gender === 'male' ? 'm' : 'f'] * strengthMult;

        // Progressive overload - increase weight over weeks
        const progressMultiplier = 1 + ((weeksOnProgram - week) * 0.02);
        const weight = Math.round(baseWeight * progressMultiplier / 2.5) * 2.5;

        for (let s = 1; s <= numSets; s++) {
          const reps = randomInt(6, 12);
          sets.push({
            exercise_name: exercise.name,
            set_number: s,
            weight: weight,
            reps: reps,
            rpe: randomInt(7, 9),
          });
          totalVolume += weight * reps;
        }
      });

      sessions.push({
        date: workoutDate,
        duration: randomInt(45, 90),
        totalVolume,
        sets,
        workoutName: randomElement(['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body', 'Full Body']),
      });
    }
  }

  return sessions.sort((a, b) => a.date - b.date);
}

// Generate nutrition history
function generateNutritionHistory(weeksOnProgram, goal, currentWeight, gender) {
  const nutrition = [];
  const today = new Date();

  // Base calories based on goal and weight
  const bmr = gender === 'male'
    ? 10 * currentWeight + 6.25 * 175 - 5 * 28 + 5
    : 10 * currentWeight + 6.25 * 163 - 5 * 26 - 161;

  const activityMultiplier = 1.55; // Moderately active
  const tdee = bmr * activityMultiplier;

  const calorieTarget = {
    lose_fat: tdee - 500,
    build_muscle: tdee + 300,
    strength: tdee + 200,
    fitness: tdee,
  }[goal] || tdee;

  const proteinTarget = currentWeight * (goal === 'build_muscle' ? 2.2 : 1.8);

  for (let day = weeksOnProgram * 7; day >= 0; day--) {
    const logDate = addDays(today, -day);
    if (logDate > today) continue;

    // 80% chance of logging nutrition each day
    if (Math.random() > 0.8) continue;

    // Variance in actual intake
    const calorieVariance = randomFloat(-300, 300);
    const actualCalories = Math.round(calorieTarget + calorieVariance);
    const actualProtein = Math.round(proteinTarget * randomFloat(0.8, 1.2));
    const actualCarbs = Math.round((actualCalories * 0.4) / 4);
    const actualFats = Math.round((actualCalories * 0.25) / 9);
    const waterMl = randomInt(1500, 3500);

    nutrition.push({
      date: formatDate(logDate),
      calories: actualCalories,
      protein: actualProtein,
      carbs: actualCarbs,
      fats: actualFats,
      water: waterMl,
    });
  }

  return nutrition;
}

// Generate sleep history
function generateSleepHistory(weeksOnProgram) {
  const sleepLogs = [];
  const today = new Date();

  for (let day = weeksOnProgram * 7; day >= 0; day--) {
    const logDate = addDays(today, -day);
    if (logDate > today) continue;

    // 70% chance of logging sleep each day
    if (Math.random() > 0.7) continue;

    const bedHour = randomInt(21, 23);
    const bedMin = randomInt(0, 59);
    const wakeHour = randomInt(5, 8);
    const wakeMin = randomInt(0, 59);

    // Calculate actual hours slept (bed to wake, crossing midnight)
    const hoursSlept = parseFloat(((24 - bedHour - bedMin/60) + wakeHour + wakeMin/60).toFixed(1));

    sleepLogs.push({
      date: formatDate(logDate),
      bed_time: `${bedHour.toString().padStart(2, '0')}:${bedMin.toString().padStart(2, '0')}`,
      wake_time: `${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}`,
      hours_slept: hoursSlept,
      quality_rating: randomInt(3, 5),
    });
  }

  return sleepLogs;
}

// ============ CLEANUP FUNCTION ============
async function cleanupTestUsers() {
  console.log('Cleaning up ALL test users and their data...');

  // Get ALL profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email');

  // Filter to test profiles: @example.com OR null email OR no real email
  const testProfiles = (allProfiles || []).filter(p =>
    !p.email ||
    p.email.endsWith('@example.com') ||
    !p.email.includes('@') ||
    p.email === ''
  );

  const testUserIds = testProfiles.map(p => p.id);
  console.log(`Found ${testUserIds.length} test/orphan profiles to delete (keeping real accounts)...`);

  if (testUserIds.length > 0) {
    console.log('Deleting related data...');

    // Delete in correct order to avoid FK issues
    await supabase.from('friendships').delete().in('user_id', testUserIds);
    await supabase.from('friendships').delete().in('friend_id', testUserIds);
    await supabase.from('supplement_logs').delete().in('user_id', testUserIds);
    await supabase.from('user_supplements').delete().in('user_id', testUserIds);
    await supabase.from('sleep_goals').delete().in('user_id', testUserIds);
    await supabase.from('sleep_logs').delete().in('user_id', testUserIds);
    await supabase.from('nutrition_goals').delete().in('user_id', testUserIds);
    await supabase.from('daily_nutrition').delete().in('user_id', testUserIds);
    await supabase.from('water_logs').delete().in('user_id', testUserIds);
    await supabase.from('meal_logs').delete().in('user_id', testUserIds);
    await supabase.from('weight_logs').delete().in('user_id', testUserIds);
    await supabase.from('user_goals').delete().in('user_id', testUserIds);

    // Delete workout data
    const { data: sessions } = await supabase.from('workout_sessions').select('id').in('user_id', testUserIds);
    if (sessions && sessions.length > 0) {
      await supabase.from('workout_sets').delete().in('session_id', sessions.map(s => s.id));
    }
    await supabase.from('workout_sessions').delete().in('user_id', testUserIds);

    // Delete profiles and auth users
    console.log('Deleting profiles and auth users...');
    for (const id of testUserIds) {
      await supabase.from('profiles').delete().eq('id', id);
      await supabase.auth.admin.deleteUser(id);
    }
  }

  console.log('Cleanup complete.\n');
}

// ============ MAIN SEED FUNCTION ============
async function seedUsers(count = 100) {
  await cleanupTestUsers();
  console.log(`Starting to seed ${count} users...`);

  const users = [];
  const usedUsernames = new Set();

  // Generate user data
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomElement(gender === 'male' ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);

    let username = generateUsername(firstName, lastName);
    while (usedUsernames.has(username)) {
      username = generateUsername(firstName, lastName);
    }
    usedUsernames.add(username);

    const goal = randomElement(GOALS);
    const experience = randomElement(EXPERIENCE_LEVELS);
    const activityLevel = randomElement(ACTIVITY_LEVELS);
    const weeksOnProgram = randomInt(4, 52);

    // Weight ranges based on gender and goal
    let startWeight, targetWeight;
    if (gender === 'male') {
      if (goal === 'lose_fat') {
        startWeight = randomInt(85, 120);
        targetWeight = randomInt(75, startWeight - 5);
      } else if (goal === 'build_muscle') {
        startWeight = randomInt(65, 85);
        targetWeight = randomInt(startWeight + 5, 100);
      } else {
        startWeight = randomInt(70, 95);
        targetWeight = startWeight + randomInt(-5, 5);
      }
    } else {
      if (goal === 'lose_fat') {
        startWeight = randomInt(70, 100);
        targetWeight = randomInt(55, startWeight - 5);
      } else if (goal === 'build_muscle') {
        startWeight = randomInt(50, 65);
        targetWeight = randomInt(startWeight + 3, 75);
      } else {
        startWeight = randomInt(55, 75);
        targetWeight = startWeight + randomInt(-3, 3);
      }
    }

    const daysPerWeek = experience === 'beginner' ? randomInt(2, 3) :
                        experience === 'intermediate' ? randomInt(3, 4) : randomInt(4, 6);

    users.push({
      id: uuidv4(),
      firstName,
      lastName,
      username,
      gender,
      goal,
      experience,
      activityLevel,
      weeksOnProgram,
      startWeight,
      targetWeight,
      currentWeight: startWeight, // Will be updated based on weight logs
      daysPerWeek,
      bio: randomElement(BIOS),
      allowSubscribers: Math.random() > 0.3, // 70% public profiles
    });
  }

  console.log('Generated user data, now inserting into database...');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`Processing user ${i + 1}/${users.length}: ${user.username}`);

    try {
      const email = `${user.username}@example.com`;
      const password = 'TestPassword123!';

      // 1. Create auth user first (profiles table has FK to auth.users)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          username: user.username,
        },
      });

      if (authError || !authData.user) {
        console.error(`Auth error for ${user.username}:`, authError?.message || 'No user returned');
        errorCount++;
        continue;
      }

      // Use the auth user's ID for the profile
      user.id = authData.user.id;

      // 2. Update profile (trigger should have created it, so we update)
      const { error: profileError } = await supabase.from('profiles').update({
        username: user.username,
        email: email,
        first_name: user.firstName,
        last_name: user.lastName,
        gender: user.gender,
        bio: user.bio,
        allow_subscribers: user.allowSubscribers,
      }).eq('id', user.id);

      if (profileError) {
        console.error(`Profile error for ${user.username}:`, profileError.message);
        errorCount++;
        continue;
      }

      // 2. Create user goals
      const { error: goalsError } = await supabase.from('user_goals').insert({
        user_id: user.id,
        goal: user.goal,
        experience: user.experience,
        current_weight: user.startWeight,
        goal_weight: user.targetWeight,
        days_per_week: user.daysPerWeek,
      });

      if (goalsError) {
        console.warn(`Goals error for ${user.username}:`, goalsError.message);
      }

      // 3. Generate and insert weight logs
      const weightLogs = generateWeightProgress(user.startWeight, user.goal, user.weeksOnProgram, user.gender);
      if (weightLogs.length > 0) {
        const weightData = weightLogs.map(w => ({
          user_id: user.id,
          log_date: w.date,
          weight: w.weight,
        }));

        const { error: weightError } = await supabase.from('weight_logs').insert(weightData);
        if (weightError) {
          console.warn(`Weight logs error for ${user.username}:`, weightError.message);
        }

        // Update current weight to latest
        const latestWeight = weightLogs[weightLogs.length - 1].weight;
        user.currentWeight = latestWeight;
        await supabase.from('user_goals').update({ current_weight: latestWeight }).eq('user_id', user.id);
      }

      // 4. Generate and insert workout sessions (limit to last 8 weeks for speed)
      const workoutHistory = generateWorkoutHistory(Math.min(user.weeksOnProgram, 8), user.experience, user.gender);

      // Batch insert all sessions first
      const sessionsToInsert = workoutHistory.map(workout => ({
        user_id: user.id,
        workout_name: workout.workoutName,
        started_at: workout.date.toISOString(),
        ended_at: workout.date.toISOString(),
        duration_minutes: workout.duration,
        total_volume: workout.totalVolume,
      }));

      if (sessionsToInsert.length > 0) {
        const { data: sessions } = await supabase.from('workout_sessions').insert(sessionsToInsert).select();

        // Batch insert all sets
        if (sessions && sessions.length > 0) {
          const allSets = [];
          sessions.forEach((session, idx) => {
            const workout = workoutHistory[idx];
            workout.sets.forEach(s => {
              allSets.push({
                session_id: session.id,
                exercise_name: s.exercise_name,
                set_number: s.set_number,
                weight: s.weight,
                reps: s.reps,
                rpe: s.rpe,
                is_warmup: false,
              });
            });
          });
          if (allSets.length > 0) {
            await supabase.from('workout_sets').insert(allSets);
          }
        }
      }

      // 5. Generate and insert nutrition data
      const nutritionHistory = generateNutritionHistory(user.weeksOnProgram, user.goal, user.currentWeight, user.gender);
      if (nutritionHistory.length > 0) {
        const nutritionData = nutritionHistory.map(n => ({
          user_id: user.id,
          log_date: n.date,
          total_calories: n.calories,
          total_protein: n.protein,
          total_carbs: n.carbs,
          total_fats: n.fats,
          water_intake: n.water,
        }));

        const { error: nutritionError } = await supabase.from('daily_nutrition').insert(nutritionData);
        if (nutritionError) {
          console.warn(`Nutrition error for ${user.username}:`, nutritionError.message);
        }
      }

      // 6. Create nutrition goals
      const { error: nutritionGoalsError } = await supabase.from('nutrition_goals').upsert({
        user_id: user.id,
        calorie_goal: Math.round(user.currentWeight * (user.goal === 'lose_fat' ? 28 : 35)),
        protein_goal: Math.round(user.currentWeight * (user.goal === 'build_muscle' ? 2.2 : 1.8)),
        carbs_goal: Math.round(user.currentWeight * 3),
        fats_goal: Math.round(user.currentWeight * 0.8),
        water_goal: 3000,
      }, { onConflict: 'user_id' });

      if (nutritionGoalsError) {
        console.warn(`Nutrition goals error for ${user.username}:`, nutritionGoalsError.message);
      }

      // 7. Generate and insert sleep logs
      const sleepLogs = generateSleepHistory(user.weeksOnProgram);
      if (sleepLogs.length > 0) {
        const sleepData = sleepLogs.map(s => ({
          user_id: user.id,
          log_date: s.date,
          bed_time: s.bed_time,
          wake_time: s.wake_time,
          hours_slept: s.hours_slept,
          quality_rating: s.quality_rating,
        }));

        const { error: sleepError } = await supabase.from('sleep_logs').insert(sleepData);
        if (sleepError) {
          console.warn(`Sleep logs error for ${user.username}:`, sleepError.message);
        }
      }

      // 8. Create sleep goals
      const { error: sleepGoalsError } = await supabase.from('sleep_goals').upsert({
        user_id: user.id,
        target_hours: randomFloat(7, 9),
        target_bedtime: '22:30',
        target_waketime: '06:30',
      }, { onConflict: 'user_id' });

      if (sleepGoalsError) {
        console.warn(`Sleep goals error for ${user.username}:`, sleepGoalsError.message);
      }

      // 9. Add some supplements (50% chance)
      if (Math.random() > 0.5) {
        const userSupplements = randomElements(SUPPLEMENTS, randomInt(2, 5));
        for (const supp of userSupplements) {
          await supabase.from('user_supplements').insert({
            user_id: user.id,
            name: supp.name,
            dosage: supp.dosage,
            scheduled_time: supp.time,
            is_active: true,
          });
        }
      }

      successCount++;
    } catch (err) {
      console.error(`Error processing ${user.username}:`, err.message);
      errorCount++;
    }
  }

  // 10. Create social connections (friendships)
  console.log('Creating social connections...');
  const userIds = users.map(u => u.id);

  for (const user of users) {
    // Each user follows 5-30 random other users
    const followCount = randomInt(5, 30);
    const toFollow = randomElements(userIds.filter(id => id !== user.id), followCount);

    for (const targetId of toFollow) {
      try {
        await supabase.from('friendships').insert({
          user_id: user.id,
          friend_id: targetId,
          status: 'accepted',
          requested_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        });
      } catch (e) {
        // Ignore duplicates
      }
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`Successfully created: ${successCount} users`);
  console.log(`Errors: ${errorCount}`);
}

// Run the seed
seedUsers(100).catch(console.error);
