import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Add followers for real user
  console.log('Adding followers for real user...');

  const { data: realUsers } = await supabase
    .from('profiles')
    .select('id, email')
    .not('email', 'like', '%@example.com');

  if (realUsers && realUsers.length > 0) {
    const realUserId = realUsers[0].id;

    const { data: testUsers } = await supabase
      .from('profiles')
      .select('id')
      .like('email', '%@example.com')
      .limit(120);

    let followerCount = 0;
    for (const test of testUsers || []) {
      const { error } = await supabase.from('friendships').upsert({
        user_id: test.id,
        friend_id: realUserId,
        status: 'accepted',
        requested_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,friend_id' });
      if (!error) followerCount++;
    }
    console.log(`Added ${followerCount} followers for ${realUsers[0].email}`);
  }

  // 2. Create challenges table if needed and add challenges
  console.log('\nCreating challenges...');

  // First ensure the challenges table exists
  // We'll try to insert and if it fails, the table might not exist

  const challengeTypes = [
    { name: '30 Day Squat Challenge', description: 'Complete 100 squats every day for 30 days', duration_days: 30, goal_type: 'daily', goal_value: 100 },
    { name: 'Plank Master', description: 'Hold a plank for 5 minutes total each day', duration_days: 14, goal_type: 'daily', goal_value: 300 },
    { name: '10K Steps Daily', description: 'Walk 10,000 steps every day for a week', duration_days: 7, goal_type: 'daily', goal_value: 10000 },
    { name: 'Push-up Challenge', description: 'Do 50 push-ups every day for 2 weeks', duration_days: 14, goal_type: 'daily', goal_value: 50 },
    { name: 'Hydration Hero', description: 'Drink 3L of water daily for 21 days', duration_days: 21, goal_type: 'daily', goal_value: 3000 },
    { name: 'Early Bird Workout', description: 'Complete a workout before 8am for 7 days', duration_days: 7, goal_type: 'daily', goal_value: 1 },
    { name: 'Protein Goal Streak', description: 'Hit your protein goal for 14 days straight', duration_days: 14, goal_type: 'daily', goal_value: 1 },
    { name: 'Sleep Champion', description: 'Get 8+ hours of sleep for 10 days', duration_days: 10, goal_type: 'daily', goal_value: 8 },
    { name: 'Consistency King', description: 'Log all meals for 30 days', duration_days: 30, goal_type: 'daily', goal_value: 3 },
    { name: 'Iron Will', description: 'Complete 20 workouts in 30 days', duration_days: 30, goal_type: 'total', goal_value: 20 },
  ];

  // Get all user IDs
  const { data: allProfiles } = await supabase.from('profiles').select('id');
  const allUserIds = (allProfiles || []).map(p => p.id);

  // Try to create challenges
  for (const challenge of challengeTypes) {
    // Pick a random creator from test users
    const creatorId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 20)); // Started 0-20 days ago

    const { data: newChallenge, error } = await supabase.from('challenges').insert({
      creator_id: creatorId,
      name: challenge.name,
      description: challenge.description,
      duration_days: challenge.duration_days,
      goal_type: challenge.goal_type,
      goal_value: challenge.goal_value,
      start_date: startDate.toISOString().split('T')[0],
      is_public: true,
    }).select().single();

    if (error) {
      console.log('Challenges table may not exist. Run this SQL first:');
      console.log(`
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER DEFAULT 30,
  goal_type TEXT DEFAULT 'daily',
  goal_value INTEGER DEFAULT 1,
  start_date DATE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone" ON challenges FOR SELECT USING (true);
CREATE POLICY "Challenge participants viewable by everyone" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);
      `);
      break;
    }

    if (newChallenge) {
      // Add random participants (20-80% of users)
      const participantCount = Math.floor(allUserIds.length * (0.2 + Math.random() * 0.6));
      const participants = allUserIds
        .sort(() => 0.5 - Math.random())
        .slice(0, participantCount);

      for (const participantId of participants) {
        const daysIntoChallenge = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        const maxProgress = Math.min(daysIntoChallenge, challenge.duration_days);
        const progress = Math.floor(Math.random() * (maxProgress + 1));
        const completed = progress >= challenge.duration_days;

        await supabase.from('challenge_participants').insert({
          challenge_id: newChallenge.id,
          user_id: participantId,
          progress: progress,
          completed: completed,
        });
      }
      console.log(`Created "${challenge.name}" with ${participantCount} participants`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
