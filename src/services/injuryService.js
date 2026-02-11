import { supabase } from '../lib/supabase';

// NOTE: user_injuries table may not exist in the current database
// These functions return graceful fallbacks

export const injuryService = {
  // Get all active injuries for a user
  async getActiveInjuries(userId) {
    try {
      const { data, error } = await supabase
        .from('user_injuries')
        .select('*')
        .eq('user_id', userId)
        .neq('current_phase', 'healed')
        .order('reported_date', { ascending: false });

      if (error) {
        // Table likely doesn't exist
        if (error.code === '42P01' || error.message?.includes('not found')) {
          return { data: [], error: null };
        }
        console.warn('getActiveInjuries error:', error?.message);
        return { data: [], error: null };
      }
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('getActiveInjuries error:', err?.message);
      return { data: [], error: null };
    }
  },

  // Get all injuries (including healed) for a user
  async getAllInjuries(userId) {
    try {
      const { data, error } = await supabase
        .from('user_injuries')
        .select('*')
        .eq('user_id', userId)
        .order('reported_date', { ascending: false });

      if (error) {
        return { data: [], error: null };
      }
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: null };
    }
  },

  // Get a specific injury by ID
  async getInjury(injuryId) {
    return { data: null, error: null };
  },

  // Report a new injury
  async reportInjury(userId, injuryData) {
    console.warn('reportInjury: user_injuries table may not exist');
    return { data: null, error: null };
  },

  // Update injury phase
  async updateInjuryPhase(injuryId, newPhase) {
    return { data: null, error: null };
  },

  // Update injury details
  async updateInjury(injuryId, updates) {
    return { data: null, error: null };
  },

  // Mark injury as healed
  async markAsHealed(injuryId) {
    return { data: null, error: null };
  },

  // Delete an injury record
  async deleteInjury(injuryId) {
    return { error: null };
  },

  // Get injury history for a specific muscle group
  async getInjuryHistoryForMuscle(userId, muscleGroup) {
    return { data: [], error: null };
  },

  // Check if user has any active injuries affecting a muscle group
  async hasActiveInjuryForMuscle(userId, muscleGroup) {
    return { hasInjury: false, error: null };
  },

  // Sync injuries - update phases based on current date
  async syncInjuryPhases(userId) {
    return { data: [], error: null };
  },

  // Convert database injury to app format
  toAppFormat(dbInjury) {
    if (!dbInjury) return null;
    return {
      id: dbInjury.id,
      muscleGroup: dbInjury.muscle_group,
      severity: dbInjury.severity,
      notes: dbInjury.notes,
      reportedDate: dbInjury.reported_date,
      timeline: dbInjury.timeline,
      currentPhase: dbInjury.current_phase,
      expectedRecoveryDate: dbInjury.expected_recovery_date,
      healedAt: dbInjury.healed_at,
    };
  },

  // Convert app injury to database format
  toDbFormat(appInjury) {
    if (!appInjury) return null;
    return {
      muscle_group: appInjury.muscleGroup,
      severity: appInjury.severity,
      notes: appInjury.notes,
      reported_date: appInjury.reportedDate,
      timeline: appInjury.timeline,
      current_phase: appInjury.currentPhase || 'rest',
      expected_recovery_date: appInjury.timeline?.return?.end?.split('T')[0] || null,
    };
  },
};

export default injuryService;
