import { supabase } from '../lib/supabase';

export const prLeaderboardService = {
  // =====================================================
  // USER PR RANKINGS
  // =====================================================

  // Get user's PRs with global rankings
  async getMyPRsWithRankings(userId) {
    try {
      if (!userId) return { data: [], error: null };

      // Get user's personal records
      const { data: userPRs, error: prError } = await supabase
        .from('personal_records')
        .select('id, exercise_id, exercise_name, weight, reps, e1rm, achieved_at')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });

      if (prError) {
        console.warn('getMyPRsWithRankings error:', prError?.message);
        return { data: [], error: null };
      }

      if (!userPRs || userPRs.length === 0) {
        return { data: [], error: null };
      }

      // Deduplicate to get best PR per exercise (by e1rm)
      const bestPRsByExercise = {};
      for (const pr of userPRs) {
        const existing = bestPRsByExercise[pr.exercise_name];
        if (!existing || (pr.e1rm || 0) > (existing.e1rm || 0)) {
          bestPRsByExercise[pr.exercise_name] = pr;
        }
      }

      const uniquePRs = Object.values(bestPRsByExercise);

      // Get global rankings for each PR
      const prsWithRankings = await Promise.all(
        uniquePRs.map(async (pr) => {
          const ranking = await this.getGlobalRanking(pr.exercise_name, pr.e1rm);
          return {
            ...pr,
            globalRank: ranking.rank,
            totalUsers: ranking.total,
            percentile: ranking.percentile,
          };
        })
      );

      // Sort by e1rm descending (strongest lifts first)
      prsWithRankings.sort((a, b) => (b.e1rm || 0) - (a.e1rm || 0));

      return { data: prsWithRankings, error: null };
    } catch (err) {
      console.warn('Error getting PRs with rankings:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get global ranking for a specific e1rm on an exercise
  async getGlobalRanking(exerciseName, e1rm) {
    try {
      if (!exerciseName || !e1rm) {
        return { rank: 0, total: 0, percentile: 0 };
      }

      // Get count of users with higher e1rm
      const { count: higherCount, error: higherError } = await supabase
        .from('personal_records')
        .select('user_id', { count: 'exact', head: true })
        .eq('exercise_name', exerciseName)
        .gt('e1rm', e1rm);

      if (higherError) {
        console.warn('getGlobalRanking higher count error:', higherError?.message);
      }

      // Get total users with a PR for this exercise
      const { data: totalData, error: totalError } = await supabase
        .from('personal_records')
        .select('user_id')
        .eq('exercise_name', exerciseName);

      if (totalError) {
        console.warn('getGlobalRanking total count error:', totalError?.message);
      }

      // Count unique users
      const uniqueUsers = new Set((totalData || []).map(r => r.user_id));
      const total = uniqueUsers.size;
      const rank = (higherCount || 0) + 1;
      const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;

      return { rank, total, percentile };
    } catch (err) {
      console.warn('Error getting global ranking:', err?.message);
      return { rank: 0, total: 0, percentile: 0 };
    }
  },

  // =====================================================
  // DEMOGRAPHIC RANKINGS
  // =====================================================

  // Get ranking within a demographic group
  async getPRRankingByDemographic(userId, exerciseName, demographicType = 'age') {
    try {
      if (!userId || !exerciseName) {
        return { rank: 0, total: 0, percentile: 0, groupLabel: '' };
      }

      // Get current user's profile and PR
      const [{ data: userProfile }, { data: userPR }] = await Promise.all([
        supabase.from('profiles').select('date_of_birth, gender').eq('id', userId).single(),
        supabase
          .from('personal_records')
          .select('e1rm')
          .eq('user_id', userId)
          .eq('exercise_name', exerciseName)
          .order('e1rm', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (!userPR) {
        return { rank: 0, total: 0, percentile: 0, groupLabel: 'No PR' };
      }

      // Get user's weight (most recent)
      const { data: weightLog } = await supabase
        .from('weight_logs')
        .select('weight')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(1)
        .single();

      const userWeight = weightLog?.weight;
      const userAge = userProfile?.date_of_birth
        ? Math.floor((new Date() - new Date(userProfile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      let groupLabel = '';
      let filterCondition = null;

      switch (demographicType) {
        case 'age': {
          if (!userAge) {
            return { rank: 0, total: 0, percentile: 0, groupLabel: 'Age not set' };
          }
          const ageGroup = this.getAgeGroup(userAge);
          groupLabel = ageGroup.label;
          filterCondition = { ageMin: ageGroup.min, ageMax: ageGroup.max };
          break;
        }
        case 'weight': {
          if (!userWeight) {
            return { rank: 0, total: 0, percentile: 0, groupLabel: 'Weight not set' };
          }
          const weightClass = this.getWeightClass(userWeight);
          groupLabel = weightClass.label;
          filterCondition = { weightMin: weightClass.min, weightMax: weightClass.max };
          break;
        }
        case 'gender': {
          if (!userProfile?.gender) {
            return { rank: 0, total: 0, percentile: 0, groupLabel: 'Gender not set' };
          }
          groupLabel = userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1);
          filterCondition = { gender: userProfile.gender };
          break;
        }
        default:
          return { rank: 0, total: 0, percentile: 0, groupLabel: 'Unknown' };
      }

      // Get PRs with profile joins for filtering
      const { data: allPRs, error } = await supabase
        .from('personal_records')
        .select(`
          user_id,
          e1rm,
          user:profiles!inner(id, date_of_birth, gender)
        `)
        .eq('exercise_name', exerciseName);

      if (error) {
        console.warn('getPRRankingByDemographic error:', error?.message);
        return { rank: 0, total: 0, percentile: 0, groupLabel };
      }

      // Get weight logs for weight-based filtering
      let weightByUser = {};
      if (demographicType === 'weight') {
        const { data: weights } = await supabase
          .from('weight_logs')
          .select('user_id, weight, log_date')
          .order('log_date', { ascending: false });

        // Get most recent weight for each user
        for (const w of (weights || [])) {
          if (!weightByUser[w.user_id]) {
            weightByUser[w.user_id] = w.weight;
          }
        }
      }

      // Filter PRs by demographic and get best per user
      const bestPRsByUser = {};
      for (const pr of (allPRs || [])) {
        const profile = pr.user;
        if (!profile) continue;

        let matches = false;
        switch (demographicType) {
          case 'age': {
            if (profile.date_of_birth) {
              const age = Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000));
              matches = age >= filterCondition.ageMin && age <= filterCondition.ageMax;
            }
            break;
          }
          case 'weight': {
            const weight = weightByUser[pr.user_id];
            if (weight) {
              matches = weight >= filterCondition.weightMin && weight <= filterCondition.weightMax;
            }
            break;
          }
          case 'gender': {
            matches = profile.gender === filterCondition.gender;
            break;
          }
        }

        if (matches) {
          const existing = bestPRsByUser[pr.user_id];
          if (!existing || (pr.e1rm || 0) > (existing.e1rm || 0)) {
            bestPRsByUser[pr.user_id] = pr;
          }
        }
      }

      const filteredPRs = Object.values(bestPRsByUser);
      const total = filteredPRs.length;
      const higherCount = filteredPRs.filter(pr => (pr.e1rm || 0) > (userPR.e1rm || 0)).length;
      const rank = higherCount + 1;
      const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;

      return { rank, total, percentile, groupLabel };
    } catch (err) {
      console.warn('Error getting demographic ranking:', err?.message);
      return { rank: 0, total: 0, percentile: 0, groupLabel: '' };
    }
  },

  // Helper: Get age group range
  getAgeGroup(age) {
    if (age < 18) return { label: 'Under 18', min: 0, max: 17 };
    if (age <= 24) return { label: '18-24', min: 18, max: 24 };
    if (age <= 34) return { label: '25-34', min: 25, max: 34 };
    if (age <= 44) return { label: '35-44', min: 35, max: 44 };
    if (age <= 54) return { label: '45-54', min: 45, max: 54 };
    return { label: '55+', min: 55, max: 120 };
  },

  // Helper: Get weight class (in kg)
  getWeightClass(weight) {
    // Standard-ish powerlifting weight classes
    if (weight < 60) return { label: 'Under 60kg', min: 0, max: 59.9 };
    if (weight < 70) return { label: '60-69kg', min: 60, max: 69.9 };
    if (weight < 80) return { label: '70-79kg', min: 70, max: 79.9 };
    if (weight < 90) return { label: '80-89kg', min: 80, max: 89.9 };
    if (weight < 100) return { label: '90-99kg', min: 90, max: 99.9 };
    if (weight < 110) return { label: '100-109kg', min: 100, max: 109.9 };
    return { label: '110kg+', min: 110, max: 500 };
  },

  // =====================================================
  // EXERCISE LEADERBOARDS
  // =====================================================

  // Get top performers for a specific exercise
  async getExerciseLeaderboard(exerciseName, limit = 20, demographicFilters = null) {
    try {
      if (!exerciseName) return { data: [], error: null };

      // Get all PRs for this exercise with user profiles
      const { data: allPRs, error } = await supabase
        .from('personal_records')
        .select(`
          id,
          user_id,
          exercise_name,
          weight,
          reps,
          e1rm,
          achieved_at,
          user:profiles!inner(id, username, first_name, last_name, avatar_url, date_of_birth, gender)
        `)
        .eq('exercise_name', exerciseName)
        .order('e1rm', { ascending: false });

      if (error) {
        console.warn('getExerciseLeaderboard error:', error?.message);
        return { data: [], error: null };
      }

      // Get weight logs if filtering by weight
      let weightByUser = {};
      if (demographicFilters?.weightClass) {
        const { data: weights } = await supabase
          .from('weight_logs')
          .select('user_id, weight, log_date')
          .order('log_date', { ascending: false });

        for (const w of (weights || [])) {
          if (!weightByUser[w.user_id]) {
            weightByUser[w.user_id] = w.weight;
          }
        }
      }

      // Get best PR per user and apply filters
      const bestPRsByUser = {};
      for (const pr of (allPRs || [])) {
        const profile = pr.user;
        if (!profile) continue;

        // Apply demographic filters
        if (demographicFilters) {
          // Age group filter
          if (demographicFilters.ageGroup && profile.date_of_birth) {
            const age = Math.floor((new Date() - new Date(profile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000));
            const ageGroup = this.getAgeGroup(age);
            if (ageGroup.label !== demographicFilters.ageGroup) continue;
          }

          // Weight class filter
          if (demographicFilters.weightClass) {
            const userWeight = weightByUser[pr.user_id];
            if (!userWeight) continue;
            const weightClass = this.getWeightClass(userWeight);
            if (weightClass.label !== demographicFilters.weightClass) continue;
          }

          // Gender filter
          if (demographicFilters.gender && profile.gender !== demographicFilters.gender) {
            continue;
          }
        }

        // Keep best PR per user
        const existing = bestPRsByUser[pr.user_id];
        if (!existing || (pr.e1rm || 0) > (existing.e1rm || 0)) {
          bestPRsByUser[pr.user_id] = pr;
        }
      }

      // Convert to array, sort, and assign ranks
      const leaderboard = Object.values(bestPRsByUser)
        .sort((a, b) => (b.e1rm || 0) - (a.e1rm || 0))
        .slice(0, limit)
        .map((pr, index) => ({
          rank: index + 1,
          userId: pr.user_id,
          profile: pr.user,
          e1rm: pr.e1rm,
          weight: pr.weight,
          reps: pr.reps,
          achievedAt: pr.achieved_at,
        }));

      return { data: leaderboard, error: null };
    } catch (err) {
      console.warn('Error getting exercise leaderboard:', err?.message);
      return { data: [], error: err };
    }
  },

  // Get list of exercises that have PRs recorded
  async getExercisesWithPRs() {
    try {
      const { data, error } = await supabase
        .from('personal_records')
        .select('exercise_name')
        .order('exercise_name');

      if (error) {
        console.warn('getExercisesWithPRs error:', error?.message);
        return { data: [], error: null };
      }

      // Get unique exercise names
      const uniqueExercises = [...new Set((data || []).map(pr => pr.exercise_name))];
      return { data: uniqueExercises, error: null };
    } catch (err) {
      console.warn('Error getting exercises with PRs:', err?.message);
      return { data: [], error: null };
    }
  },
};

export default prLeaderboardService;
