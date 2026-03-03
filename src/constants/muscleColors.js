// Unique color for each muscle group — works on dark backgrounds
export const MUSCLE_COLORS = {
  Chest: '#EF4444',       // Red
  Back: '#3B82F6',        // Blue
  Shoulders: '#F97316',   // Orange
  Biceps: '#06B6D4',      // Cyan
  Triceps: '#8B5CF6',     // Purple
  Quads: '#22C55E',       // Green
  Hamstrings: '#EAB308',  // Yellow
  Glutes: '#EC4899',      // Pink
  Calves: '#84CC16',      // Lime
  Core: '#6366F1',        // Indigo
  Traps: '#D97706',       // Amber
  Forearms: '#64748B',    // Slate
  'Full Body': '#F59E0B', // Gold
};

export function getMuscleColor(group) {
  return MUSCLE_COLORS[group] || '#9CA3AF';
}
