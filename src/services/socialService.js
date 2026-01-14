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

      // Get profiles excluding self
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url')
        .neq('id', userId)
        .limit(limit);

      if (error) {
        console.warn('getSuggestedUsers query error:', error?.message);
        return { data: [], error };
      }

      return {
        data: (data || []).map(user => ({
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User',
          username: user.username || 'user',
          avatar: user.avatar_url || '💪',
          followers: 0,
          streak: 0,
          verified: false,
          mutualFriends: 0,
        })),
        error: null
      };
    } catch (err) {
      console.warn('Error getting suggested users:', err?.message);
      return { data: [], error: err };
    }
  },

  // Check if user is following another user
  async isFollowing(subscriberId, targetUserId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', subscriberId)
        .eq('target_user_id', targetUserId)
        .single();

      return { isFollowing: !!data && !error, error: null };
    } catch (err) {
      return { isFollowing: false, error: null };
    }
  },

  // Follow a user
  async followUser(subscriberId, targetUserId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          subscriber_id: subscriberId,
          target_user_id: targetUserId,
          subscribed_at: new Date().toISOString(),
        })
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
        .from('subscriptions')
        .delete()
        .eq('subscriber_id', subscriberId)
        .eq('target_user_id', targetUserId);

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
        .from('subscriptions')
        .select('target_user_id')
        .eq('subscriber_id', userId);

      if (error) {
        // Table might not exist
        console.warn('getFollowing query error:', error?.message);
        return { data: [], error: null };
      }

      return {
        data: (data || []).map(s => s.target_user_id),
        error: null
      };
    } catch (err) {
      console.warn('Error getting following:', err?.message);
      return { data: [], error: null };
    }
  },
};

export default socialService;
