import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const accountabilityService = {
  // =====================================================
  // NUDGE SYSTEM
  // =====================================================

  // Send a nudge to a friend
  async sendNudge(fromUserId, toUserId, message = null, nudgeType = 'workout') {
    try {
      if (!fromUserId || !toUserId) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      // Check if already nudged today
      const today = getLocalDateString();
      const { data: existingNudge } = await supabase
        .from('nudges')
        .select('id')
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', toUserId)
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59.999Z')
        .maybeSingle();

      if (existingNudge) {
        return { data: null, error: new Error('Already nudged this user today'), alreadyNudged: true };
      }

      // Create the nudge
      const { data, error } = await supabase
        .from('nudges')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message: message || getDefaultNudgeMessage(nudgeType),
          nudge_type: nudgeType,
        })
        .select()
        .single();

      if (!error && data) {
        // Get sender's name for notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, username')
          .eq('id', fromUserId)
          .single();

        const senderName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username
          : 'Someone';

        // Create notification for recipient
        await notificationService.createNotification(
          toUserId,
          'nudge',
          'Workout Nudge',
          `${senderName} nudged you: "${message || getDefaultNudgeMessage(nudgeType)}"`,
          fromUserId,
          data.id
        );
      }

      return { data, error };
    } catch (err) {
      console.warn('Error sending nudge:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get nudges received by a user
  async getReceivedNudges(userId, limit = 10) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('nudges')
        .select(`
          *,
          from_user:profiles!nudges_from_user_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('getReceivedNudges error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error getting received nudges:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get unread nudge count
  async getUnreadNudgeCount(userId) {
    try {
      if (!userId) return { count: 0, error: null };

      const { count, error } = await supabase
        .from('nudges')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', userId)
        .eq('read', false);

      if (error) {
        console.warn('getUnreadNudgeCount error:', error?.message);
        return { count: 0, error: null };
      }

      return { count: count || 0, error: null };
    } catch (err) {
      console.warn('Error getting unread nudge count:', err?.message);
      return { count: 0, error: null };
    }
  },

  // Mark nudge as read
  async markNudgeAsRead(nudgeId) {
    try {
      const { error } = await supabase
        .from('nudges')
        .update({ read: true })
        .eq('id', nudgeId);

      return { error };
    } catch (err) {
      console.warn('Error marking nudge as read:', err?.message);
      return { error: err };
    }
  },

  // Check if can nudge today
  async canNudgeToday(fromUserId, toUserId) {
    try {
      if (!fromUserId || !toUserId) return { canNudge: false, error: null };

      const today = getLocalDateString();
      const { data } = await supabase
        .from('nudges')
        .select('id')
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', toUserId)
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59.999Z')
        .maybeSingle();

      return { canNudge: !data, error: null };
    } catch (err) {
      return { canNudge: true, error: null };
    }
  },

  // =====================================================
  // WORKOUT BUDDIES
  // =====================================================

  // Request a workout buddy
  async requestBuddy(userId, partnerId) {
    try {
      if (!userId || !partnerId) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      // Check if relationship already exists (in either direction)
      const { data: existing } = await supabase
        .from('workout_buddies')
        .select('id, status')
        .or(`and(user_a_id.eq.${userId},user_b_id.eq.${partnerId}),and(user_a_id.eq.${partnerId},user_b_id.eq.${userId})`)
        .maybeSingle();

      if (existing) {
        return { data: existing, error: null, alreadyExists: true };
      }

      // Create buddy request
      const { data, error } = await supabase
        .from('workout_buddies')
        .insert({
          user_a_id: userId,
          user_b_id: partnerId,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        // Get requester's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, username')
          .eq('id', userId)
          .single();

        const requesterName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username
          : 'Someone';

        // Notify the potential buddy
        await notificationService.createNotification(
          partnerId,
          'buddy_request',
          'Workout Buddy Request',
          `${requesterName} wants to be your workout buddy!`,
          userId,
          data.id
        );
      }

      return { data, error };
    } catch (err) {
      console.warn('Error requesting buddy:', err?.message);
      return { data: null, error: err };
    }
  },

  // Accept a buddy request
  async acceptBuddy(buddyId, userId) {
    try {
      if (!buddyId || !userId) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      const { data, error } = await supabase
        .from('workout_buddies')
        .update({
          status: 'accepted',
          matched_at: new Date().toISOString(),
        })
        .eq('id', buddyId)
        .eq('user_b_id', userId)
        .select()
        .maybeSingle();

      if (!error && data) {
        // Notify the requester that their request was accepted
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, username')
          .eq('id', userId)
          .single();

        const accepterName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username
          : 'Someone';

        await notificationService.createNotification(
          data.user_a_id,
          'buddy_accepted',
          'Buddy Request Accepted',
          `${accepterName} accepted your workout buddy request!`,
          userId,
          data.id
        );
      }

      return { data, error };
    } catch (err) {
      console.warn('Error accepting buddy:', err?.message);
      return { data: null, error: err };
    }
  },

  // Decline a buddy request
  async declineBuddy(buddyId, userId) {
    try {
      const { error } = await supabase
        .from('workout_buddies')
        .update({ status: 'declined' })
        .eq('id', buddyId)
        .eq('user_b_id', userId);

      return { error };
    } catch (err) {
      console.warn('Error declining buddy:', err?.message);
      return { error: err };
    }
  },

  // Get user's current workout buddy
  async getBuddy(userId) {
    try {
      if (!userId) return { data: null, error: null };

      const { data, error } = await supabase
        .from('workout_buddies')
        .select(`
          *,
          user_a:profiles!workout_buddies_user_a_id_fkey(id, username, first_name, last_name, avatar_url, bio),
          user_b:profiles!workout_buddies_user_b_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .eq('status', 'accepted')
        .maybeSingle();

      if (error) {
        console.warn('getBuddy error:', error?.message);
        return { data: null, error: null };
      }

      if (!data) return { data: null, error: null };

      // Return the other user as the buddy
      const buddy = data.user_a_id === userId ? data.user_b : data.user_a;
      return {
        data: {
          ...data,
          buddy,
        },
        error: null,
      };
    } catch (err) {
      console.warn('Error getting buddy:', err?.message);
      return { data: null, error: null };
    }
  },

  // Get pending buddy requests (received)
  async getPendingBuddyRequests(userId) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('workout_buddies')
        .select(`
          *,
          user_a:profiles!workout_buddies_user_a_id_fkey(id, username, first_name, last_name, avatar_url, bio)
        `)
        .eq('user_b_id', userId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.warn('getPendingBuddyRequests error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error getting pending buddy requests:', err?.message);
      return { data: [], error: null };
    }
  },

  // Remove workout buddy
  async removeBuddy(buddyId, userId) {
    try {
      const { error } = await supabase
        .from('workout_buddies')
        .delete()
        .eq('id', buddyId)
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      return { error };
    } catch (err) {
      console.warn('Error removing buddy:', err?.message);
      return { error: err };
    }
  },

  // =====================================================
  // SHARED GOALS
  // =====================================================

  // Create a shared goal
  async createSharedGoal(creatorId, partnerId, goalType, targetValue, targetUnit = null, deadline = null, description = null) {
    try {
      if (!creatorId || !partnerId || !goalType) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      const { data, error } = await supabase
        .from('shared_goals')
        .insert({
          creator_id: creatorId,
          partner_id: partnerId,
          goal_type: goalType,
          goal_description: description,
          target_value: targetValue,
          target_unit: targetUnit,
          deadline: deadline,
        })
        .select()
        .single();

      if (!error && data) {
        // Notify partner about the shared goal
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, username')
          .eq('id', creatorId)
          .single();

        const creatorName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username
          : 'Someone';

        await notificationService.createNotification(
          partnerId,
          'shared_goal',
          'New Shared Goal',
          `${creatorName} created a shared goal with you: ${goalType}`,
          creatorId,
          data.id
        );
      }

      return { data, error };
    } catch (err) {
      console.warn('Error creating shared goal:', err?.message);
      return { data: null, error: err };
    }
  },

  // Get shared goals for a user
  async getSharedGoals(userId, status = 'active') {
    try {
      if (!userId) return { data: [], error: null };

      let query = supabase
        .from('shared_goals')
        .select(`
          *,
          creator:profiles!shared_goals_creator_id_fkey(id, username, first_name, last_name, avatar_url),
          partner:profiles!shared_goals_partner_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .or(`creator_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('getSharedGoals error:', error?.message);
        return { data: [], error: null };
      }

      // Add current user's role to each goal
      const enrichedData = (data || []).map(goal => ({
        ...goal,
        isCreator: goal.creator_id === userId,
        myProgress: goal.creator_id === userId ? goal.creator_progress : goal.partner_progress,
        partnerProgress: goal.creator_id === userId ? goal.partner_progress : goal.creator_progress,
      }));

      return { data: enrichedData, error: null };
    } catch (err) {
      console.warn('Error getting shared goals:', err?.message);
      return { data: [], error: null };
    }
  },

  // Update progress on a shared goal
  async updateGoalProgress(goalId, userId, progress) {
    try {
      if (!goalId || !userId) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      // First, get the goal to determine which field to update
      const { data: goal } = await supabase
        .from('shared_goals')
        .select('creator_id, partner_id')
        .eq('id', goalId)
        .maybeSingle();

      if (!goal) {
        return { data: null, error: new Error('Goal not found') };
      }

      const isCreator = goal.creator_id === userId;
      const updateField = isCreator ? 'creator_progress' : 'partner_progress';

      const { data, error } = await supabase
        .from('shared_goals')
        .update({
          [updateField]: progress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .maybeSingle();

      return { data, error };
    } catch (err) {
      console.warn('Error updating goal progress:', err?.message);
      return { data: null, error: err };
    }
  },

  // Complete a shared goal
  async completeSharedGoal(goalId) {
    try {
      const { data, error } = await supabase
        .from('shared_goals')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .maybeSingle();

      return { data, error };
    } catch (err) {
      console.warn('Error completing shared goal:', err?.message);
      return { data: null, error: err };
    }
  },

  // Cancel a shared goal
  async cancelSharedGoal(goalId, userId) {
    try {
      const { data, error } = await supabase
        .from('shared_goals')
        .update({ status: 'cancelled' })
        .eq('id', goalId)
        .eq('creator_id', userId)
        .select()
        .maybeSingle();

      return { data, error };
    } catch (err) {
      console.warn('Error cancelling shared goal:', err?.message);
      return { data: null, error: err };
    }
  },
};

// Helper function for default nudge messages
function getDefaultNudgeMessage(nudgeType) {
  const messages = {
    workout: "Time to hit the gym! Let's get after it!",
    streak: "Don't break your streak! Get a workout in today!",
    challenge: "Ready to take on a challenge?",
    motivation: "You've got this! Let's crush it today!",
  };
  return messages[nudgeType] || messages.workout;
}

export default accountabilityService;
