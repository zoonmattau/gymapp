import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKOUT_TEMPLATES = [
  { name: 'Upper Body Blast', focus: 'Chest, Back, Arms', exercises: [
    { name: 'Bench Press', sets: 4, reps: 8 },
    { name: 'Bent Over Rows', sets: 4, reps: 8 },
    { name: 'Shoulder Press', sets: 3, reps: 10 },
    { name: 'Bicep Curls', sets: 3, reps: 12 },
    { name: 'Tricep Dips', sets: 3, reps: 12 },
  ]},
  { name: 'Lower Body Power', focus: 'Quads, Hamstrings, Glutes', exercises: [
    { name: 'Back Squats', sets: 5, reps: 5 },
    { name: 'Romanian Deadlifts', sets: 4, reps: 8 },
    { name: 'Walking Lunges', sets: 3, reps: 12 },
    { name: 'Leg Press', sets: 3, reps: 15 },
    { name: 'Calf Raises', sets: 4, reps: 15 },
  ]},
  { name: 'Full Body Strength', focus: 'Full Body', exercises: [
    { name: 'Deadlifts', sets: 5, reps: 5 },
    { name: 'Pull-ups', sets: 4, reps: 8 },
    { name: 'Dumbbell Press', sets: 3, reps: 10 },
    { name: 'Goblet Squats', sets: 3, reps: 12 },
    { name: 'Planks', sets: 3, reps: 60 },
  ]},
  { name: 'Push Day Elite', focus: 'Chest, Shoulders, Triceps', exercises: [
    { name: 'Incline Bench Press', sets: 4, reps: 8 },
    { name: 'Flat Dumbbell Press', sets: 3, reps: 10 },
    { name: 'Cable Flyes', sets: 3, reps: 12 },
    { name: 'Lateral Raises', sets: 3, reps: 15 },
    { name: 'Skull Crushers', sets: 3, reps: 12 },
  ]},
  { name: 'Pull Day Elite', focus: 'Back, Biceps, Rear Delts', exercises: [
    { name: 'Weighted Pull-ups', sets: 4, reps: 6 },
    { name: 'T-Bar Rows', sets: 4, reps: 8 },
    { name: 'Lat Pulldowns', sets: 3, reps: 12 },
    { name: 'Face Pulls', sets: 3, reps: 15 },
    { name: 'Hammer Curls', sets: 3, reps: 12 },
  ]},
  { name: 'Leg Day Destroyer', focus: 'Quads, Hamstrings, Calves', exercises: [
    { name: 'Front Squats', sets: 4, reps: 8 },
    { name: 'Hack Squats', sets: 3, reps: 10 },
    { name: 'Lying Leg Curls', sets: 4, reps: 12 },
    { name: 'Bulgarian Split Squats', sets: 3, reps: 10 },
    { name: 'Seated Calf Raises', sets: 4, reps: 15 },
  ]},
  { name: 'Hypertrophy Arms', focus: 'Biceps, Triceps, Forearms', exercises: [
    { name: 'Barbell Curls', sets: 4, reps: 10 },
    { name: 'Close Grip Bench', sets: 4, reps: 10 },
    { name: 'Preacher Curls', sets: 3, reps: 12 },
    { name: 'Overhead Extensions', sets: 3, reps: 12 },
    { name: 'Wrist Curls', sets: 3, reps: 15 },
  ]},
  { name: 'Core Crusher', focus: 'Abs, Obliques, Lower Back', exercises: [
    { name: 'Hanging Leg Raises', sets: 4, reps: 12 },
    { name: 'Cable Woodchops', sets: 3, reps: 15 },
    { name: 'Ab Wheel Rollouts', sets: 3, reps: 10 },
    { name: 'Russian Twists', sets: 3, reps: 20 },
    { name: 'Back Extensions', sets: 3, reps: 15 },
  ]},
  { name: 'Beginner Full Body', focus: 'Full Body', exercises: [
    { name: 'Goblet Squats', sets: 3, reps: 12 },
    { name: 'Push-ups', sets: 3, reps: 10 },
    { name: 'Dumbbell Rows', sets: 3, reps: 10 },
    { name: 'Lunges', sets: 2, reps: 10 },
    { name: 'Planks', sets: 3, reps: 30 },
  ]},
  { name: 'Athletic Performance', focus: 'Power, Speed, Agility', exercises: [
    { name: 'Power Cleans', sets: 5, reps: 3 },
    { name: 'Box Jumps', sets: 4, reps: 6 },
    { name: 'Medicine Ball Slams', sets: 3, reps: 10 },
    { name: 'Sprint Intervals', sets: 6, reps: 1 },
    { name: 'Farmer Carries', sets: 3, reps: 40 },
  ]},
];

async function seedCommunityWorkouts() {
  console.log('Seeding community workouts...\n');

  // Get test users
  const { data: testUsers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .like('email', '%@example.com')
    .limit(30);

  if (!testUsers || testUsers.length === 0) {
    console.log('No test users found');
    return;
  }

  console.log(`Found ${testUsers.length} test users`);

  // Create workouts from test users
  let createdCount = 0;
  for (const template of WORKOUT_TEMPLATES) {
    const creator = testUsers[Math.floor(Math.random() * testUsers.length)];
    const completionCount = Math.floor(Math.random() * 200) + 10;
    const ratingCount = Math.floor(completionCount * 0.3);
    const averageRating = (3.5 + Math.random() * 1.5).toFixed(2);

    const { data, error } = await supabase
      .from('published_workouts')
      .insert({
        creator_id: creator.id,
        name: template.name,
        focus: template.focus,
        exercises: template.exercises,
        is_public: true,
        completion_count: completionCount,
        rating_count: ratingCount,
        average_rating: parseFloat(averageRating),
      })
      .select()
      .single();

    if (error) {
      console.log(`Error creating ${template.name}:`, error.message);
    } else {
      createdCount++;
      console.log(`Created "${template.name}" by ${creator.first_name} ${creator.last_name} (${completionCount} completions, ${averageRating} rating)`);
    }
  }

  console.log(`\nCreated ${createdCount} community workouts`);
}

seedCommunityWorkouts().catch(console.error);
