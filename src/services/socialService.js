import { supabase } from '../lib/supabase';

export const socialService = {
  // Get top followed users (most subscribers)
  // Returns empty array until real follower tracking is implemented
  async getTopFollowed(period = 'all', limit = 20) {
    try {
      // For now, return empty - real follower counts will come from subscriptions table
      // TODO: Implement real follower counting with aggregation query
      return { data: [], error: null };
    } catch (err) {
      console.warn('Error getting top followed:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get suggested users to follow
  async getSuggestedUsers(userId, limit = 10) {
    try {
      if (!userId) return { data: [], error: null };

      // Get users the current user is already following
      const { data: following } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const followingIds = new Set((following || []).map(f => f.friend_id));

      // Get profiles excluding self and already following
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, bio')
        .neq('id', userId)
        .limit(limit + followingIds.size);

      if (error) {
        console.warn('getSuggestedUsers query error:', error?.message);
        return { data: [], error };
      }

      // Filter out already following and limit
      const filtered = (data || []).filter(u => !followingIds.has(u.id)).slice(0, limit);

      // Get follower counts for each suggested user
      const enriched = await Promise.all(filtered.map(async (user) => {
        const { count } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', user.id)
          .eq('status', 'accepted');

        return {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User',
          username: user.username || 'user',
          avatar: user.avatar_url,
          bio: user.bio,
          followers: count || 0,
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('Error getting suggested users:', err?.message);
      return { data: [], error: err };
    }
  },

  // Check if user is following another user - uses friendships table
  async isFollowing(subscriberId, targetUserId) {
    try {
      if (!subscriberId || !targetUserId) {
        return { isFollowing: false, error: null };
      }
      const { data, error } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', subscriberId)
        .eq('friend_id', targetUserId)
        .eq('status', 'accepted')
        .maybeSingle();

      return { isFollowing: !!data && !error, error: null };
    } catch (err) {
      return { isFollowing: false, error: null };
    }
  },

  // Follow a user
  async followUser(subscriberId, targetUserId) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .upsert({
          user_id: subscriberId,
          friend_id: targetUserId,
          status: 'accepted',
          requested_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        }, { onConflict: 'user_id,friend_id' })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('Error following user:', err?.message);
      return { data: null, error: err };
    }
  },

  // Unfollow a user
  async unfollowUser(subscriberId, targetUserId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', subscriberId)
        .eq('friend_id', targetUserId);

      return { error };
    } catch (err) {
      console.warn('Error unfollowing user:', err?.message);
      return { error: err };
    }
  },

  // Get users the current user is following
  async getFollowing(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) {
        // Table might not exist or query error
        console.warn('getFollowing query error:', error?.message);
        return { data: [], error: null };
      }

      return {
        data: (data || []).map(s => s.friend_id),
        error: null
      };
    } catch (err) {
      console.warn('Error getting following:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get count of users who follow the current user
  async getFollowersCount(userId) {
    try {
      if (!userId) return { count: 0, error: null };

      const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.warn('getFollowersCount query error:', error?.message);
        return { count: 0, error: null };
      }

      return { count: count || 0, error: null };
    } catch (err) {
      console.warn('Error getting followers count:', err?.message);
      return { count: 0, error: null };
    }
  },

  // Get activity feed from followed users
  async getActivityFeed(userId, limit = 20) {
    try {
      if (!userId) return { data: [], error: null };

      // First get list of users being followed
      const { data: following } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const followingIds = (following || []).map(f => f.friend_id);
      if (followingIds.length === 0) return { data: [], error: null };

      // Get recent workout sessions from followed users
      const { data: workouts, error } = await supabase
        .from('workout_sessions')
        .select('id, user_id, workout_name, duration_minutes, ended_at')
        .in('user_id', followingIds)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('getActivityFeed error:', error?.message);
        return { data: [], error };
      }

      // Enrich with user profiles
      const enriched = await Promise.all((workouts || []).map(async (workout) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .eq('id', workout.user_id)
          .single();

        return {
          id: workout.id,
          type: 'workout',
          friendId: workout.user_id,
          friend: profile,
          workoutName: workout.workout_name || 'Workout',
          duration: workout.duration_minutes || 45,
          time: formatActivityTime(workout.ended_at),
          completedAt: workout.ended_at,
          likes: 0,
        };
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('Error getting activity feed:', err?.message);
      return { data: [], error: err };
    }
  },
};

// Helper function to format activity time
function formatActivityTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default socialService;
