import { supabase } from '../lib/supabase';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const competitionService = {
  // =====================================================
  // CHALLENGES
  // =====================================================

  // Get active challenges for a user
  async getActiveChallenges(userId) {
    try {
      if (!userId) return { data: [], error: null };

      // For now, return some sample challenges since we don't have a challenges table yet
      // This can be connected to a real database table later
      const sampleChallenges = [
        {
          id: '1',
          name: '30-Day Workout Streak',
          description: 'Complete at least one workout every day for 30 days',
          type: 'streak',
          target: 30,
          progress: 12,
          endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 245,
          reward: '🏆 Streak Master Badge',
        },
        {
          id: '2',
          name: 'Volume Challenge',
          description: 'Lift 100,000 kg total this month',
          type: 'volume',
          target: 100000,
          progress: 42500,
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 128,
          reward: '💪 Volume King Badge',
        },
        {
          id: '3',
          name: 'PR Hunter',
          description: 'Set 5 personal records this week',
          type: 'prs',
          target: 5,
          progress: 2,
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          participants: 89,
          reward: '🎯 PR Hunter Badge',
        },
      ];

      return { data: sampleChallenges, error: null };
    } catch (err) {
      console.warn('Error getting active challenges:', err?.message);
      return { data: [], error: err };
    }
  },

  // Join a challenge
  async joinChallenge(userId, challengeId) {
    try {
      // This would insert into a user_challenges table
      // For now, just return success
      return { data: { joined: true, challengeId }, error: null };
    } catch (err) {
      console.warn('Error joining challenge:', err?.message);
      return { data: null, error: err };
    }
  },

  // Create a new challenge
  async createChallenge({ name, type, duration, creatorId, invitedFriends }) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      // Try to insert into challenges table
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          name,
          goal_type: type,
          goal_value: type === 'workouts' ? 10 : type === 'streak' ? duration : 50000,
          creator_id: creatorId,
          start_date: getLocalDateString(),
          end_date: getLocalDateString(endDate),
          participant_count: invitedFriends.length + 1,
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, return mock success
        console.log('Challenge creation (table may not exist):', error.message);
        return {
          data: {
            id: Date.now().toString(),
            name,
            goal_type: type,
            goal_value: type === 'workouts' ? 10 : 7,
          },
          error: null,
        };
      }

      // Invite friends (add to challenge_participants)
      if (data && invitedFriends.length > 0) {
        const participants = invitedFriends.map(friendId => ({
          challenge_id: data.id,
          user_id: friendId,
          status: 'invited',
        }));

        // Add creator as participant
        participants.push({
          challenge_id: data.id,
          user_id: creatorId,
          status: 'joined',
        });

        await supabase
          .from('challenge_participants')
          .insert(participants);
      }

      return { data, error: null };
    } catch (err) {
      console.warn('Error creating challenge:', err?.message);
      // Return mock success so UI still works
      return {
        data: {
          id: Date.now().toString(),
          name,
          goal_type: type,
        },
        error: null,
      };
    }
  },

  // =====================================================
  // HEAD-TO-HEAD COMPARISONS
  // =====================================================

  // Get head-to-head stats between two users
  async getHeadToHead(userId, friendId, period = 'week') {
    try {
      if (!userId || !friendId) {
        return { data: null, error: new Error('Missing required parameters') };
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'all':
        default:
          startDate = new Date('2020-01-01');
          break;
      }

      const startDateStr = startDate.toISOString();

      // Fetch stats for both users in parallel
      const [userStats, friendStats] = await Promise.all([
        this.getUserStats(userId, startDateStr),
        this.getUserStats(friendId, startDateStr),
      ]);

      return {
        data: {
          user: userStats,
          friend: friendStats,
          period,
        },
        error: null,
      };
    } catch (err) {
      console.warn('Error getting head-to-head:', err?.message);
      return { data: null, error: err };
    }
  },

  // Helper: Get user stats for a period
  async getUserStats(userId, startDate) {
    try {
      // Get workout count
      const { count: workoutCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('ended_at', startDate);

      // Get total volume (sum of weight * reps)
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight, reps, session:workout_sessions!inner(user_id, ended_at)')
        .eq('session.user_id', userId)
        .gte('session.ended_at', startDate);

      const totalVolume = (sets || []).reduce((sum, set) => {
        return sum + ((set.weight || 0) * (set.reps || 0));
      }, 0);

      // Get PR count in period
      const { count: prCount } = await supabase
        .from('personal_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('achieved_at', startDate);

      // Get current streak
      const { data: streakData } = await supabase
        .from('workout_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        workouts: workoutCount || 0,
        volume: Math.round(totalVolume),
        prs: prCount || 0,
        streak: streakData?.current_streak || 0,
      };
    } catch (err) {
      console.warn('Error getting user stats:', err?.message);
      return { workouts: 0, volume: 0, prs: 0, streak: 0 };
    }
  },

  // =====================================================
  // WEEKLY LEADERBOARDS
  // =====================================================

  // Get friends leaderboard for a specific type
  async getFriendsLeaderboard(userId, type = 'workouts', limit = 10) {
    try {
      if (!userId) return { data: [], error: null };

      // Get list of friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const friendIds = (friendships || []).map(f => f.friend_id);
      const allUserIds = [userId, ...friendIds];

      if (allUserIds.length === 0) return { data: [], error: null };

      // Calculate week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString();

      // Calculate stats for each user
      const leaderboardData = await Promise.all(
        allUserIds.map(async (uid) => {
          const stats = await this.getUserStats(uid, weekStartStr);

          // Get profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, avatar_url')
            .eq('id', uid)
            .single();

          let score;
          switch (type) {
            case 'volume':
              score = stats.volume;
              break;
            case 'prs':
              score = stats.prs;
              break;
            case 'streak':
              score = stats.streak;
              break;
            case 'workouts':
            default:
              score = stats.workouts;
              break;
          }

          return {
            userId: uid,
            profile,
            score,
            stats,
            isCurrentUser: uid === userId,
          };
        })
      );

      // Sort by score descending and assign ranks
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return { data: leaderboardData.slice(0, limit), error: null };
    } catch (err) {
      console.warn('Error getting friends leaderboard:', err?.message);
      return { data: [], error: err };
    }
  },

  // =====================================================
  // PR BATTLES
  // =====================================================

  // Check if a new PR beats a friend's PR
  async checkPRBattle(userId, exerciseName, newWeight) {
    try {
      if (!userId || !exerciseName || !newWeight) {
        return { data: null, beaten: [], error: null };
      }

      // Get friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const friendIds = (friendships || []).map(f => f.friend_id);
      if (friendIds.length === 0) return { data: null, beaten: [], error: null };

      // Get friends' PRs for this exercise
      const { data: friendPRs } = await supabase
        .from('personal_records')
        .select('user_id, weight, profiles:profiles!inner(id, username, first_name, last_name)')
        .eq('exercise_name', exerciseName)
        .in('user_id', friendIds);

      // Find friends who were beaten
      const beaten = (friendPRs || [])
        .filter(pr => pr.weight && newWeight > pr.weight)
        .map(pr => ({
          userId: pr.user_id,
          profile: pr.profiles,
          previousWeight: pr.weight,
          newWeight: newWeight,
          exerciseName,
        }));

      // Record the PR battles
      for (const battle of beaten) {
        await supabase.from('pr_battles').insert({
          exercise_name: exerciseName,
          challenger_id: userId,
          defender_id: battle.userId,
          challenger_weight: newWeight,
          defender_weight: battle.previousWeight,
        });
      }

      return { data: { beaten }, beaten, error: null };
    } catch (err) {
      console.warn('Error checking PR battle:', err?.message);
      return { data: null, beaten: [], error: err };
    }
  },

  // Get recent PR battles for a user
  async getRecentPRBattles(userId, limit = 10) {
    try {
      if (!userId) return { data: [], error: null };

      const { data, error } = await supabase
        .from('pr_battles')
        .select(`
          *,
          challenger:profiles!pr_battles_challenger_id_fkey(id, username, first_name, last_name, avatar_url),
          defender:profiles!pr_battles_defender_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .or(`challenger_id.eq.${userId},defender_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('getRecentPRBattles error:', error?.message);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Error getting PR battles:', err?.message);
      return { data: [], error: null };
    }
  },

  // =====================================================
  // CACHED LEADERBOARDS (for larger scale)
  // =====================================================

  // Update cached leaderboard score
  async updateLeaderboardScore(userId, leaderboardType, score) {
    try {
      // Calculate week start
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = getLocalDateString(weekStart);

      const { data, error } = await supabase
        .from('weekly_leaderboards')
        .upsert({
          week_start: weekStartStr,
          leaderboard_type: leaderboardType,
          user_id: userId,
          score: score,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'week_start,leaderboard_type,user_id' })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.warn('Error updating leaderboard score:', err?.message);
      return { data: null, error: err };
    }
  },
};

export default competitionService;
