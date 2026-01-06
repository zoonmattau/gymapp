import { supabase } from '../lib/supabase';

export const injuryService = {
  // Get all active injuries for a user
  async getActiveInjuries(userId) {
    const { data, error } = await supabase
      .from('user_injuries')
      .select('*')
      .eq('user_id', userId)
      .neq('current_phase', 'healed')
      .order('reported_date', { ascending: false });

    return { data, error };
  },

  // Get all injuries (including healed) for a user
  async getAllInjuries(userId) {
    const { data, error } = await supabase
      .from('user_injuries')
      .select('*')
      .eq('user_id', userId)
      .order('reported_date', { ascending: false });

    return { data, error };
  },

  // Get a specific injury by ID
  async getInjury(injuryId) {
    const { data, error } = await supabase
      .from('user_injuries')
      .select('*')
      .eq('id', injuryId)
      .single();

    return { data, error };
  },

  // Report a new injury
  async reportInjury(userId, injuryData) {
    const { data, error } = await supabase
      .from('user_injuries')
      .insert({
        user_id: userId,
        muscle_group: injuryData.muscleGroup,
        severity: injuryData.severity,
        notes: injuryData.notes || null,
        reported_date: injuryData.reportedDate || new Date().toISOString().split('T')[0],
        timeline: injuryData.timeline,
        current_phase: 'rest',
        expected_recovery_date: injuryData.timeline?.return?.end?.split('T')[0] || null,
      })
      .select()
      .single();

    return { data, error };
  },

  // Update injury phase
  async updateInjuryPhase(injuryId, newPhase) {
    const updates = {
      current_phase: newPhase,
      updated_at: new Date().toISOString(),
    };

    // If marked as healed, set healed_at timestamp
    if (newPhase === 'healed') {
      updates.healed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_injuries')
      .update(updates)
      .eq('id', injuryId)
      .select()
      .single();

    return { data, error };
  },

  // Update injury details
  async updateInjury(injuryId, updates) {
    const { data, error } = await supabase
      .from('user_injuries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', injuryId)
      .select()
      .single();

    return { data, error };
  },

  // Mark injury as healed
  async markAsHealed(injuryId) {
    return this.updateInjuryPhase(injuryId, 'healed');
  },

  // Delete an injury record
  async deleteInjury(injuryId) {
    const { error } = await supabase
      .from('user_injuries')
      .delete()
      .eq('id', injuryId);

    return { error };
  },

  // Get injury history for a specific muscle group
  async getInjuryHistoryForMuscle(userId, muscleGroup) {
    const { data, error } = await supabase
      .from('user_injuries')
      .select('*')
      .eq('user_id', userId)
      .eq('muscle_group', muscleGroup)
      .order('reported_date', { ascending: false });

    return { data, error };
  },

  // Check if user has any active injuries affecting a muscle group
  async hasActiveInjuryForMuscle(userId, muscleGroup) {
    const { data, error } = await supabase
      .from('user_injuries')
      .select('id')
      .eq('user_id', userId)
      .eq('muscle_group', muscleGroup)
      .neq('current_phase', 'healed')
      .limit(1);

    return { hasInjury: data && data.length > 0, error };
  },

  // Sync injuries - update phases based on current date
  async syncInjuryPhases(userId) {
    const { data: injuries, error } = await this.getActiveInjuries(userId);

    if (error || !injuries) return { error };

    const now = new Date();
    const updates = [];

    for (const injury of injuries) {
      const timeline = injury.timeline;
      if (!timeline) continue;

      let newPhase = injury.current_phase;

      // Determine current phase based on timeline dates
      if (now >= new Date(timeline.return?.start)) {
        newPhase = 'return';
      } else if (now >= new Date(timeline.strengthening?.start)) {
        newPhase = 'strengthening';
      } else if (now >= new Date(timeline.recovery?.start)) {
        newPhase = 'recovery';
      } else {
        newPhase = 'rest';
      }

      // Only update if phase changed
      if (newPhase !== injury.current_phase) {
        updates.push(this.updateInjuryPhase(injury.id, newPhase));
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Return updated injuries
    return this.getActiveInjuries(userId);
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
