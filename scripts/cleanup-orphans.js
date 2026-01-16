import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupOrphans() {
  console.log('Getting valid user IDs...');

  // Get all valid profile IDs
  const { data: profiles } = await supabase.from('profiles').select('id');
  const validIds = new Set((profiles || []).map(p => p.id));
  console.log('Valid users:', validIds.size);

  const tables = [
    'user_goals',
    'weight_logs',
    'workout_sessions',
    'daily_nutrition',
    'nutrition_goals',
    'sleep_logs',
    'sleep_goals',
    'user_supplements',
    'friendships',
    'meal_logs',
    'water_logs',
  ];

  for (const table of tables) {
    const { data: rows } = await supabase.from(table).select('user_id');
    if (!rows) continue;

    const orphanIds = [...new Set(rows.map(r => r.user_id).filter(id => id && !validIds.has(id)))];
    if (orphanIds.length > 0) {
      console.log(`Deleting ${orphanIds.length} orphan records from ${table}`);
      await supabase.from(table).delete().in('user_id', orphanIds);
    } else {
      console.log(`${table}: no orphans`);
    }
  }

  // Clean orphan friendships by friend_id too
  const { data: friendships } = await supabase.from('friendships').select('friend_id');
  if (friendships) {
    const orphanFriendIds = [...new Set(friendships.map(r => r.friend_id).filter(id => id && !validIds.has(id)))];
    if (orphanFriendIds.length > 0) {
      console.log(`Deleting ${orphanFriendIds.length} orphan friendships by friend_id`);
      await supabase.from('friendships').delete().in('friend_id', orphanFriendIds);
    }
  }

  // Clean orphan workout_sets
  const { data: sessions } = await supabase.from('workout_sessions').select('id');
  const validSessionIds = new Set((sessions || []).map(s => s.id));
  const { data: sets } = await supabase.from('workout_sets').select('session_id');
  if (sets) {
    const orphanSetSessionIds = [...new Set(sets.map(s => s.session_id).filter(id => id && !validSessionIds.has(id)))];
    if (orphanSetSessionIds.length > 0) {
      console.log(`Deleting orphan workout_sets for ${orphanSetSessionIds.length} invalid sessions`);
      await supabase.from('workout_sets').delete().in('session_id', orphanSetSessionIds);
    } else {
      console.log('workout_sets: no orphans');
    }
  }

  console.log('\nCleanup complete!');
}

cleanupOrphans().catch(console.error);
