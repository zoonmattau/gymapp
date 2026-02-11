import { supabase } from '../lib/supabase';

export const notificationService = {
  // Get notifications for a user
  async getNotifications(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('getNotifications error:', error?.message);
        return { data: [], error: null };
      }

      // Fetch from_user profiles separately
      const enriched = await Promise.all((data || []).map(async (notif) => {
        if (notif.from_user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, avatar_url')
            .eq('id', notif.from_user_id)
            .single();
          return { ...notif, from_user: profile };
        }
        return notif;
      }));

      return { data: enriched, error: null };
    } catch (err) {
      console.warn('getNotifications error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.warn('getUnreadCount error:', error?.message);
        return { count: 0, error: null };
      }

      return { count: count || 0, error: null };
    } catch (err) {
      console.warn('getUnreadCount error:', err?.message);
      return { count: 0, error: null };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      return { error };
    } catch (err) {
      console.warn('markAsRead error:', err?.message);
      return { error: err };
    }
  },

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      return { error };
    } catch (err) {
      console.warn('markAllAsRead error:', err?.message);
      return { error: err };
    }
  },

  // Create a notification
  async createNotification(userId, type, title, message, fromUserId = null, referenceId = null) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          from_user_id: fromUserId,
          reference_id: referenceId,
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('createNotification error:', err?.message);
      return { data: null, error: err };
    }
  },

  // Helper: notify user of new follower
  async notifyNewFollower(userId, followerId, followerName) {
    return this.createNotification(
      userId,
      'new_follower',
      'New Follower',
      `${followerName} started following you`,
      followerId
    );
  },

  // Helper: notify workout like
  async notifyWorkoutLike(userId, likerId, likerName, workoutId) {
    return this.createNotification(
      userId,
      'workout_like',
      'Workout Liked',
      `${likerName} liked your workout`,
      likerId,
      workoutId
    );
  },

  // Helper: notify comment
  async notifyComment(userId, commenterId, commenterName, referenceId) {
    return this.createNotification(
      userId,
      'comment',
      'New Comment',
      `${commenterName} commented on your post`,
      commenterId,
      referenceId
    );
  },
};

export default notificationService;
