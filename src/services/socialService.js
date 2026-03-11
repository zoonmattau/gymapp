import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

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
  // USER SEARCH
  // =====================================================

  // Search users by username or name
  async searchUsers(query, limit = 20) {
    try {
      if (!query?.trim()) return { data: [], error: null };

      const q = query.trim().toLowerCase();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, bio')
        .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(limit);

      if (error) {
        console.warn('searchUsers query error:', error?.message);
        return { data: [], error };
      }

      return {
        data: (data || []).map(u => ({
          id: u.id,
          username: u.username || 'user',
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'User',
          avatar: u.avatar_url,
          bio: u.bio,
        })),
        error: null,
      };
    } catch (err) {
      console.warn('Error searching users:', err?.message);
      return { data: [], error: err };
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

      const followingIds = (following || []).map(f => f.friend_id);
      const excludeIds = [userId, ...followingIds];

      // Get profiles excluding self and already following directly in the query
      let query = supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, bio, created_at');

      // Supabase .not('id', 'in', ...) to exclude followed users at DB level
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.warn('getSuggestedUsers query error:', error?.message);
        return { data: [], error };
      }

      const filtered = data || [];

      // Get follower counts and workout counts for each suggested user
      const enriched = await Promise.all(filtered.map(async (user) => {
        const [followerResult, workoutResult] = await Promise.all([
          supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('friend_id', user.id)
            .eq('status', 'accepted'),
          supabase
            .from('workout_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        // Calculate time on app
        const createdAt = user.created_at ? new Date(user.created_at) : new Date();
        const now = new Date();
        const diffMs = now - createdAt;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        let timeOnApp = '';
        if (diffDays < 7) {
          timeOnApp = diffDays <= 1 ? 'New' : `${diffDays}d`;
        } else if (diffDays < 30) {
          timeOnApp = `${Math.floor(diffDays / 7)}w`;
        } else if (diffDays < 365) {
          timeOnApp = `${Math.floor(diffDays / 30)}mo`;
        } else {
          timeOnApp = `${Math.floor(diffDays / 365)}y`;
        }

        return {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User',
          username: user.username || 'user',
          avatar: user.avatar_url,
          bio: user.bio,
          followers: followerResult.count || 0,
          workoutCount: workoutResult.count || 0,
          timeOnApp,
          joinedAt: user.created_at,
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

  // Follow a user (checks target's privacy setting)
  async followUser(subscriberId, targetUserId) {
    try {
      // Check target user's privacy setting
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('private_account')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.warn('Error fetching target profile:', profileError?.message);
        return { data: null, error: profileError };
      }

      const isPrivate = targetProfile?.private_account !== false;
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('friendships')
        .upsert({
          user_id: subscriberId,
          friend_id: targetUserId,
          status: isPrivate ? 'pending' : 'accepted',
          requested_at: now,
          ...(isPrivate ? {} : { accepted_at: now }),
        }, { onConflict: 'user_id,friend_id' })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('Error following user:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get pending follow requests for the current user (people requesting to follow them)
  async getPendingFollowRequests(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          requested_at,
          requester:profiles!friendships_user_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.warn('getPendingFollowRequests error:', error?.message);
        return { data: [], error: null };
      }

      return {
        data: (data || []).map(item => ({
          id: item.id,
          requesterId: item.user_id,
          requestedAt: item.requested_at,
          requester: item.requester,
        })),
        error: null,
      };
    } catch (err) {
      console.warn('Error getting pending follow requests:', err?.message);
      return { data: [], error: null };
    }
  },

  // Accept a follow request
  async acceptFollowRequest(friendshipId) {
    try {
      if (!friendshipId) return { error: new Error('Missing friendship ID') };

      const { data, error } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', friendshipId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('Error accepting follow request:', err?.message);
      return { data: null, error: err };
    }
  },

  // Reject a follow request (deletes the friendship row)
  async rejectFollowRequest(friendshipId) {
    try {
      if (!friendshipId) return { error: new Error('Missing friendship ID') };

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      return { error };
    } catch (err) {
      console.warn('Error rejecting follow request:', err?.message);
      return { error: err };
    }
  },

  // Get IDs of users this user has sent pending requests to
  async getPendingRequestIds(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.warn('getPendingRequestIds error:', error?.message);
        return { data: [], error: null };
      }

      return { data: (data || []).map(f => f.friend_id), error: null };
    } catch (err) {
      console.warn('Error getting pending request IDs:', err?.message);
      return { data: [], error: null };
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

  // Get users the current user is following (with profile details)
  async getFollowing(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          friend_id,
          following:profiles!friendships_friend_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.warn('getFollowing query error:', error?.message);
        return { data: [], error: null };
      }

      return {
        data: (data || []).map(item => ({
          id: item.id,
          following_id: item.friend_id,
          following: item.following,
        })),
        error: null
      };
    } catch (err) {
      console.warn('Error getting following:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get users who follow the current user (with profile details)
  async getFollowers(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          follower:profiles!friendships_user_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.warn('getFollowers query error:', error?.message);
        return { data: [], error: null };
      }

      return {
        data: (data || []).map(item => ({
          id: item.id,
          follower_id: item.user_id,
          follower: item.follower,
        })),
        error: null
      };
    } catch (err) {
      console.warn('Error getting followers:', err?.message);
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

  // Get activity feed for a single user (for public profile)
  async getUserActivityFeed(targetUserId, limit = 20) {
    try {
      if (!targetUserId) return { data: [], error: null };

      const [workoutsResult, prsResult] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', targetUserId)
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false })
          .limit(limit),
        supabase
          .from('personal_records')
          .select('id, user_id, exercise_name, weight, reps, achieved_at')
          .eq('user_id', targetUserId)
          .order('achieved_at', { ascending: false })
          .limit(limit)
      ]);

      const workouts = workoutsResult.data || [];
      const prs = prsResult.data || [];

      // Get set counts from workout_sets table for accurate stats
      const workoutIds = workouts.map(w => w.id);
      const setCountsMap = {};
      if (workoutIds.length > 0) {
        const { data: setsData } = await supabase
          .from('workout_sets')
          .select('session_id, reps, exercise_name')
          .in('session_id', workoutIds);

        (setsData || []).forEach(s => {
          if (!setCountsMap[s.session_id]) {
            setCountsMap[s.session_id] = { sets: 0, reps: 0, exercises: new Set() };
          }
          setCountsMap[s.session_id].sets += 1;
          setCountsMap[s.session_id].reps += (s.reps || 0);
          if (s.exercise_name) setCountsMap[s.session_id].exercises.add(s.exercise_name);
        });
      }

      const workoutActivities = workouts.map(workout => {
        const setCounts = setCountsMap[workout.id] || { sets: 0, reps: 0, exercises: new Set() };
        return {
          id: `workout_${workout.id}`,
          type: 'workout',
          userId: workout.user_id,
          title: workout.workout_name || 'Workout',
          subtitle: `${workout.duration_minutes || 0} min workout`,
          timestamp: workout.ended_at,
          data: {
            duration: workout.duration_minutes,
            workoutName: workout.workout_name,
            volume: workout.total_volume,
            sets: setCounts.sets || workout.total_sets,
            reps: setCounts.reps,
            exercises: setCounts.exercises.size || workout.exercise_count,
            rating: workout.rating,
          }
        };
      });

      const prActivities = prs.map(pr => ({
        id: `pr_${pr.id}`,
        type: 'pr',
        userId: pr.user_id,
        title: `New PR: ${pr.exercise_name}`,
        subtitle: `${pr.weight} kg × ${pr.reps} reps`,
        timestamp: pr.achieved_at,
        data: {
          exerciseName: pr.exercise_name,
          weight: pr.weight,
          reps: pr.reps,
        }
      }));

      const allActivities = [...workoutActivities, ...prActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return { data: allActivities, error: null };
    } catch (err) {
      console.warn('Error getting user activity feed:', err?.message);
      return { data: [], error: err };
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
      // Include current user's activity in the feed
      const feedUserIds = [userId, ...followingIds];

      // Fetch workouts and PRs in parallel
      const [workoutsResult, prsResult] = await Promise.all([
        // Get recent workout sessions
        supabase
          .from('workout_sessions')
          .select('*')
          .in('user_id', feedUserIds)
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false })
          .limit(limit),
        // Get recent PRs
        supabase
          .from('personal_records')
          .select('id, user_id, exercise_name, weight, reps, achieved_at')
          .in('user_id', feedUserIds)
          .order('achieved_at', { ascending: false })
          .limit(limit)
      ]);

      if (workoutsResult.error) {
        console.error('Workouts query error:', workoutsResult.error);
      }
      if (prsResult.error) {
        console.error('PRs query error:', prsResult.error);
      }
      const workouts = workoutsResult.data || [];
      const prs = prsResult.data || [];
      console.log('Feed loaded:', workouts.length, 'workouts,', prs.length, 'PRs for users:', feedUserIds);

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

      // Get set counts from workout_sets table (like Workouts tab does)
      const setCountsMap = {};
      if (workoutIds.length > 0) {
        const { data: setsData, error: setsError } = await supabase
          .from('workout_sets')
          .select('session_id, reps, exercise_name')
          .in('session_id', workoutIds);

        console.log('workout_sets query:', { workoutIds, setsData: setsData?.length || 0, setsError });

        (setsData || []).forEach(s => {
          if (!setCountsMap[s.session_id]) {
            setCountsMap[s.session_id] = { sets: 0, reps: 0, exercises: new Set() };
          }
          setCountsMap[s.session_id].sets += 1;
          setCountsMap[s.session_id].reps += (s.reps || 0);
          if (s.exercise_name) setCountsMap[s.session_id].exercises.add(s.exercise_name);
        });
      }

      // Build workout activities
      console.log('setCountsMap:', setCountsMap);
      const workoutActivities = workouts.map(workout => {
        const setCounts = setCountsMap[workout.id] || { sets: 0, reps: 0, exercises: new Set() };
        console.log('Building workout activity:', workout.id, 'rating:', workout.rating, 'setCounts:', setCounts);
        return {
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
            volume: workout.total_volume,
            sets: setCounts.sets,
            reps: setCounts.reps,
            exercises: setCounts.exercises.size,
            rating: workout.rating,
          }
        };
      });

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
  // Get combined friends list (following + followers, deduplicated)
  async getFriendsList(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const [followingResult, followersResult] = await Promise.all([
        this.getFollowing(userId),
        this.getFollowers(userId),
      ]);

      const friendsMap = {};

      // Add users we follow
      (followingResult.data || []).forEach(item => {
        const profile = item.following;
        if (profile?.id) {
          friendsMap[profile.id] = {
            id: profile.id,
            username: profile.username || 'user',
            first_name: profile.first_name,
            last_name: profile.last_name,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User',
            avatar_url: profile.avatar_url,
          };
        }
      });

      // Add users who follow us (deduplicates by id)
      (followersResult.data || []).forEach(item => {
        const profile = item.follower;
        if (profile?.id && !friendsMap[profile.id]) {
          friendsMap[profile.id] = {
            id: profile.id,
            username: profile.username || 'user',
            first_name: profile.first_name,
            last_name: profile.last_name,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User',
            avatar_url: profile.avatar_url,
          };
        }
      });

      return { data: Object.values(friendsMap), error: null };
    } catch (err) {
      console.warn('Error getting friends list:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get shared workout details (session + grouped exercises)
  async getSharedWorkoutDetails(sessionId) {
    try {
      if (!sessionId) return { data: null, error: new Error('Missing sessionId') };

      const [sessionResult, setsResult] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('workout_sets')
          .select('*')
          .eq('session_id', sessionId)
          .order('completed_at', { ascending: true }),
      ]);

      if (sessionResult.error || !sessionResult.data) {
        return { data: null, error: sessionResult.error || new Error('Session not found') };
      }

      const session = sessionResult.data;
      const sets = setsResult.data || [];

      // Group sets by exercise name
      const exerciseMap = {};
      sets.forEach(set => {
        const name = set.exercise_name || 'Unknown Exercise';
        if (!exerciseMap[name]) {
          exerciseMap[name] = { name, sets: [] };
        }
        exerciseMap[name].sets.push({
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          completed: true,
          isWarmup: set.is_warmup,
        });
      });

      const exercises = Object.values(exerciseMap);

      return {
        data: {
          session,
          exercises,
          totalSets: sets.length,
          totalVolume: session.total_volume || 0,
          duration: session.duration_minutes || 0,
          workoutName: session.workout_name || 'Workout',
        },
        error: null,
      };
    } catch (err) {
      console.warn('Error getting shared workout details:', err?.message);
      return { data: null, error: err };
    }
  },

  // Share a workout to selected friends
  async shareWorkoutToFriends(fromUserId, fromUserName, sessionId, friendIds) {
    try {
      if (!fromUserId || !sessionId || !friendIds?.length) {
        return { error: new Error('Missing required parameters') };
      }

      // Insert shared_workouts rows
      const rows = friendIds.map(toUserId => ({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        session_id: sessionId,
      }));

      const { error: insertError } = await supabase
        .from('shared_workouts')
        .insert(rows);

      if (insertError) {
        console.warn('Error inserting shared_workouts:', insertError?.message);
        return { error: insertError };
      }

      // Send notifications to each friend
      await Promise.all(
        friendIds.map(friendId =>
          notificationService.notifySharedWorkout(friendId, fromUserId, fromUserName, sessionId)
        )
      );

      return { error: null };
    } catch (err) {
      console.warn('Error sharing workout to friends:', err?.message);
      return { error: err };
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
