import { supabase } from '../lib/supabase';

export const socialService = {
  // =====================================================
  // ACTIVITY LIKES & REACTIONS
  // =====================================================

  // Like an activity (workout post)
  async likeActivity(activityId, userId, reactionType = 'like') {
    try {
      if (!activityId || !userId) return { data: null, error: new Error('Missing required parameters') };

      const { data, error } = await supabase
        .from('activity_likes')
        .upsert({
          activity_id: activityId,
          user_id: userId,
          reaction_type: reactionType,
        }, { onConflict: 'activity_id,user_id' })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('Error liking activity:', err?.message);
      return { data: null, error: err };
    }
  },

  // Unlike an activity
  async unlikeActivity(activityId, userId) {
    try {
      if (!activityId || !userId) return { error: new Error('Missing required parameters') };

      const { error } = await supabase
        .from('activity_likes')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);

      return { error };
    } catch (err) {
      console.warn('Error unliking activity:', err?.message);
      return { error: err };
    }
  },

  // Get user's likes (for syncing UI state)
  async getUserLikes(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('activity_likes')
        .select('activity_id, reaction_type')
        .eq('user_id', userId);

      if (error) {
        console.warn('getUserLikes error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error getting user likes:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get likes for an activity
  async getActivityLikes(activityId) {
    try {
      if (!activityId) return { data: [], count: 0, error: null };

      const { data, error, count } = await supabase
        .from('activity_likes')
        .select('*, user:profiles(id, username, first_name, last_name, avatar_url)', { count: 'exact' })
        .eq('activity_id', activityId);

      if (error) {
        console.warn('getActivityLikes error:', error?.message);
        return { data: [], count: 0, error: null };
      }

      return { data: data || [], count: count || 0, error: null };
    } catch (err) {
      console.warn('Error getting activity likes:', err?.message);
      return { data: [], count: 0, error: null };
    }
  },

  // =====================================================
  // ACTIVITY COMMENTS
  // =====================================================

  // Add a comment to an activity
  async addComment(activityId, userId, content) {
    try {
      if (!activityId || !userId || !content?.trim()) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      const { data, error } = await supabase
        .from('activity_comments')
        .insert({
          activity_id: activityId,
          user_id: userId,
          content: content.trim(),
        })
        .select('*, user:profiles(id, username, first_name, last_name, avatar_url)')
        .single();

      return { data, error };
    } catch (err) {
      console.warn('Error adding comment:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get comments for an activity
  async getActivityComments(activityId, limit = 50) {
    try {
      if (!activityId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('activity_comments')
        .select('*, user:profiles(id, username, first_name, last_name, avatar_url)')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.warn('getActivityComments error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error getting comments:', err?.message);
      return { data: [], error: null };
    }
  },

  // Delete a comment
  async deleteComment(commentId, userId) {
    try {
      if (!commentId || !userId) return { error: new Error('Missing required parameters') };

      const { error } = await supabase
        .from('activity_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      return { error };
    } catch (err) {
      console.warn('Error deleting comment:', err?.message);
      return { error: err };
    }
  },

  // Get comment count for an activity
  async getCommentCount(activityId) {
    try {
      if (!activityId) return { count: 0, error: null };

      const { count, error } = await supabase
        .from('activity_comments')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId);

      if (error) {
        console.warn('getCommentCount error:', error?.message);
        return { count: 0, error: null };
      }

      return { count: count || 0, error: null };
    } catch (err) {
      console.warn('Error getting comment count:', err?.message);
      return { count: 0, error: null };
    }
  },

  // =====================================================
  // ORIGINAL METHODS
  // =====================================================

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

  // Get list of users who follow the current user with profile details
  async getFollowersList(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user_id,
          follower:profiles!friendships_user_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.warn('getFollowersList query error:', error?.message);
        return { data: [], error: null };
      }

      // Get workout counts for each follower
      const enriched = await Promise.all((data || []).map(async (item) => {
        const profile = item.follower;
        if (!profile) return null;

        // Get workout count
        const { count: workoutCount } = await supabase
          .from('workout_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .not('ended_at', 'is', null);

        // Get follower count for this user
        const { count: followerCount } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', profile.id)
          .eq('status', 'accepted');

        return {
          id: profile.id,
          username: profile.username,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User',
          avatar: profile.avatar_url,
          bio: profile.bio,
          workouts: workoutCount || 0,
          followers: followerCount || 0,
        };
      }));

      return { data: enriched.filter(Boolean), error: null };
    } catch (err) {
      console.warn('Error getting followers list:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get list of users the current user is following with profile details
  async getFollowingList(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          friend_id,
          following:profiles!friendships_friend_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.warn('getFollowingList query error:', error?.message);
        return { data: [], error: null };
      }

      // Get workout counts for each following
      const enriched = await Promise.all((data || []).map(async (item) => {
        const profile = item.following;
        if (!profile) return null;

        // Get workout count
        const { count: workoutCount } = await supabase
          .from('workout_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .not('ended_at', 'is', null);

        // Get follower count for this user
        const { count: followerCount } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', profile.id)
          .eq('status', 'accepted');

        return {
          id: profile.id,
          username: profile.username,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User',
          avatar: profile.avatar_url,
          bio: profile.bio,
          workouts: workoutCount || 0,
          followers: followerCount || 0,
        };
      }));

      return { data: enriched.filter(Boolean), error: null };
    } catch (err) {
      console.warn('Error getting following list:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get activity feed from followed users (Instagram-style)
  async getActivityFeed(userId, limit = 30) {
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

      // Fetch workouts and PRs in parallel
      const [workoutsResult, prsResult] = await Promise.all([
        // Get recent workout sessions
        supabase
          .from('workout_sessions')
          .select('id, user_id, workout_name, duration_minutes, ended_at')
          .in('user_id', followingIds)
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false })
          .limit(limit),
        // Get recent PRs
        supabase
          .from('personal_records')
          .select('id, user_id, exercise_name, weight, reps, achieved_at')
          .in('user_id', followingIds)
          .order('achieved_at', { ascending: false })
          .limit(limit)
      ]);

      const workouts = workoutsResult.data || [];
      const prs = prsResult.data || [];

      // Get unique user IDs and fetch profiles
      const allUserIds = [...new Set([
        ...workouts.map(w => w.user_id),
        ...prs.map(p => p.user_id)
      ])];

      const profilesMap = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .in('id', allUserIds);

        (profiles || []).forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      // Get like counts for activities
      const workoutIds = workouts.map(w => w.id);
      const likesMap = {};
      if (workoutIds.length > 0) {
        const { data: likes } = await supabase
          .from('activity_likes')
          .select('activity_id')
          .in('activity_id', workoutIds);

        (likes || []).forEach(l => {
          likesMap[l.activity_id] = (likesMap[l.activity_id] || 0) + 1;
        });
      }

      // Build workout activities
      const workoutActivities = workouts.map(workout => ({
        id: `workout_${workout.id}`,
        activityId: workout.id,
        type: 'workout',
        userId: workout.user_id,
        profile: profilesMap[workout.user_id] || {},
        title: workout.workout_name || 'Workout',
        subtitle: `${workout.duration_minutes || 0} min workout`,
        timestamp: workout.ended_at,
        likes: likesMap[workout.id] || 0,
        comments: 0,
        data: {
          duration: workout.duration_minutes,
          workoutName: workout.workout_name,
        }
      }));

      // Build PR activities
      const prActivities = prs.map(pr => ({
        id: `pr_${pr.id}`,
        activityId: pr.id,
        type: 'pr',
        userId: pr.user_id,
        profile: profilesMap[pr.user_id] || {},
        title: `New PR: ${pr.exercise_name}`,
        subtitle: `${pr.weight} kg × ${pr.reps} reps`,
        timestamp: pr.achieved_at,
        likes: 0,
        comments: 0,
        data: {
          exerciseName: pr.exercise_name,
          weight: pr.weight,
          reps: pr.reps,
        }
      }));

      // Combine and sort by timestamp
      const allActivities = [...workoutActivities, ...prActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return { data: allActivities, error: null };
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
