import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addSocialConnections() {
  console.log('Adding social connections...');

  // Get all profiles
  const { data: profiles } = await supabase.from('profiles').select('id, email');

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found');
    return;
  }

  // Separate real user from test users
  const realUsers = profiles.filter(p => p.email && !p.email.endsWith('@example.com'));
  const testUsers = profiles.filter(p => p.email && p.email.endsWith('@example.com'));

  console.log(`Found ${realUsers.length} real user(s) and ${testUsers.length} test users`);

  if (testUsers.length === 0) {
    console.log('No test users to create connections for');
    return;
  }

  const testUserIds = testUsers.map(u => u.id);

  // 1. Have test users follow each other (each follows 10-30 random others)
  console.log('Creating connections between test users...');
  let connectionCount = 0;

  for (const user of testUsers) {
    // Random number of people to follow
    const followCount = Math.floor(Math.random() * 21) + 10; // 10-30
    const toFollow = testUserIds
      .filter(id => id !== user.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, followCount);

    for (const targetId of toFollow) {
      const { error } = await supabase.from('friendships').upsert({
        user_id: user.id,
        friend_id: targetId,
        status: 'accepted',
        requested_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,friend_id' });

      if (!error) connectionCount++;
    }
  }
  console.log(`Created ${connectionCount} connections between test users`);

  // 2. Have some test users follow real users
  if (realUsers.length > 0) {
    console.log('Having test users follow real user(s)...');
    let realFollowers = 0;

    for (const realUser of realUsers) {
      // 30-60% of test users will follow each real user
      const followerCount = Math.floor(testUsers.length * (0.3 + Math.random() * 0.3));
      const followers = testUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, followerCount);

      for (const follower of followers) {
        const { error } = await supabase.from('friendships').upsert({
          user_id: follower.id,
          friend_id: realUser.id,
          status: 'accepted',
          requested_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        }, { onConflict: 'user_id,friend_id' });

        if (!error) realFollowers++;
      }
      console.log(`${realUser.email} now has ~${followerCount} test user followers`);
    }
  }

  console.log('\nSocial connections complete!');

  // Show some stats
  const { count: totalConnections } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true });

  console.log(`Total friendships in database: ${totalConnections}`);
}

addSocialConnections().catch(console.error);
