import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedWorkoutNotifications() {
  console.log('Seeding workout notifications...\n');

  // Get real user (not test users)
  const { data: realUsers } = await supabase
    .from('profiles')
    .select('id, email, first_name')
    .not('email', 'like', '%@example.com');

  if (!realUsers || realUsers.length === 0) {
    console.log('No real users found');
    return;
  }

  const realUser = realUsers[0];
  console.log(`Found real user: ${realUser.email}`);

  // Get test users for generating notifications
  const { data: testUsers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .like('email', '%@example.com')
    .limit(50);

  if (!testUsers || testUsers.length === 0) {
    console.log('No test users found');
    return;
  }

  console.log(`Found ${testUsers.length} test users`);

  // Get or create published workouts for the real user
  let { data: publishedWorkouts } = await supabase
    .from('published_workouts')
    .select('id, name')
    .eq('creator_id', realUser.id);

  // If no published workouts, create some
  if (!publishedWorkouts || publishedWorkouts.length === 0) {
    console.log('No published workouts found, creating some...');

    const workoutTemplates = [
      { name: 'Push Day A', focus: 'Chest, Shoulders, Triceps', exercises: [
        { name: 'Bench Press', sets: 4, reps: 8 },
        { name: 'Overhead Press', sets: 3, reps: 10 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 12 },
        { name: 'Tricep Pushdowns', sets: 3, reps: 15 },
      ]},
      { name: 'Pull Day A', focus: 'Back, Biceps', exercises: [
        { name: 'Barbell Rows', sets: 4, reps: 8 },
        { name: 'Pull-ups', sets: 3, reps: 10 },
        { name: 'Face Pulls', sets: 3, reps: 15 },
        { name: 'Barbell Curls', sets: 3, reps: 12 },
      ]},
      { name: 'Leg Day', focus: 'Quads, Hamstrings, Glutes', exercises: [
        { name: 'Squats', sets: 4, reps: 8 },
        { name: 'Romanian Deadlifts', sets: 3, reps: 10 },
        { name: 'Leg Press', sets: 3, reps: 12 },
        { name: 'Leg Curls', sets: 3, reps: 15 },
      ]},
    ];

    for (const template of workoutTemplates) {
      const { data: newWorkout, error } = await supabase
        .from('published_workouts')
        .insert({
          creator_id: realUser.id,
          name: template.name,
          focus: template.focus,
          exercises: template.exercises,
          is_public: true,
        })
        .select()
        .single();

      if (error) {
        console.log('Error creating workout:', error.message);
      } else {
        console.log(`Created workout: ${newWorkout.name}`);
      }
    }

    // Refetch
    const result = await supabase
      .from('published_workouts')
      .select('id, name')
      .eq('creator_id', realUser.id);
    publishedWorkouts = result.data || [];
  }

  console.log(`\nFound ${publishedWorkouts.length} published workouts`);

  // Clear old workout notifications
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', realUser.id)
    .in('type', ['workout_like', 'comment']);

  console.log('Cleared old workout notifications');

  // Create workout like notifications
  const notifications = [];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const testUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    const workout = publishedWorkouts[Math.floor(Math.random() * publishedWorkouts.length)];
    const hoursAgo = Math.floor(Math.random() * 72); // 0-72 hours ago
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    notifications.push({
      user_id: realUser.id,
      type: 'workout_like',
      title: 'Workout Liked',
      message: `${testUser.first_name} ${testUser.last_name} liked your ${workout.name}`,
      from_user_id: testUser.id,
      reference_id: workout.id,
      read: Math.random() > 0.6,
      created_at: createdAt.toISOString(),
    });
  }

  // Create comment notifications
  for (let i = 0; i < 8; i++) {
    const testUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    const workout = publishedWorkouts[Math.floor(Math.random() * publishedWorkouts.length)];
    const hoursAgo = Math.floor(Math.random() * 96); // 0-96 hours ago
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const comments = [
      'Great workout! I tried this and loved it.',
      'This is exactly what I needed for my routine.',
      'Solid exercise selection!',
      'How long does this usually take you?',
      'Added this to my favorites!',
      'Been doing this for a week, seeing results already.',
      'Perfect for my push day, thanks!',
      'The rep ranges are perfect.',
    ];

    notifications.push({
      user_id: realUser.id,
      type: 'comment',
      title: 'New Comment',
      message: `${testUser.first_name} ${testUser.last_name} commented: "${comments[i % comments.length]}"`,
      from_user_id: testUser.id,
      reference_id: workout.id,
      read: Math.random() > 0.5,
      created_at: createdAt.toISOString(),
    });
  }

  // Insert notifications
  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    console.log('Error inserting notifications:', error.message);
  } else {
    console.log(`\nCreated ${notifications.length} workout notifications`);
  }

  // Show summary
  const { count: totalNotifs } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', realUser.id);

  const { count: unread } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', realUser.id)
    .eq('read', false);

  console.log(`\nTotal notifications: ${totalNotifs}`);
  console.log(`Unread: ${unread}`);
  console.log('\nDone!');
}

seedWorkoutNotifications().catch(console.error);
