// Dark mode color palette
export const COLORS_DARK = {
  primary: '#06B6D4',        // Cyan - fresh, energetic, modern
  primaryDark: '#0891B2',    // Darker cyan for hover/pressed
  accent: '#22D3EE',         // Lighter cyan accent
  background: '#0D0F12',     // Dark background
  surface: '#121417',        // Card surface
  surfaceLight: '#1E2024',   // Slightly lighter surface
  text: '#F3F4F6',           // Primary text (slightly brighter)
  textSecondary: '#D1D5DB',  // Secondary text
  textMuted: '#9CA3AF',      // Muted text
  success: '#22C55E',        // Green - ONLY for success, wins, completed
  warning: '#FBBF24',        // Yellow warning
  error: '#EF4444',          // Red error
  border: '#2A2D32',         // Subtle borders
  // Category colors (all visually distinct)
  water: '#60A5FA',          // Blue - water
  sleep: '#C4B5FD',          // Soft lavender - sleep
  fats: '#F59E0B',           // Amber - fats
  protein: '#F472B6',        // Pink - protein
  carbs: '#FB923C',          // Orange - carbs
  supplements: '#FBBF24',    // Yellow - supplements (electric/zap)
};

// Light mode color palette
export const COLORS_LIGHT = {
  primary: '#0891B2',        // Cyan 600 - slightly darker for light bg
  primaryDark: '#0E7490',    // Cyan 700
  accent: '#06B6D4',         // Cyan 500
  background: '#F8FAFC',     // Slate 50 - clean white
  surface: '#FFFFFF',        // White card surface
  surfaceLight: '#E2E8F0',   // Slate 200 - dividers
  text: '#0F172A',           // Slate 900 - dark text
  textSecondary: '#475569',  // Slate 600
  textMuted: '#94A3B8',      // Slate 400
  success: '#16A34A',        // Green 600 - success only
  warning: '#EAB308',        // Yellow 500
  error: '#DC2626',          // Red 600
  border: '#E2E8F0',         // Slate 200
  // Category colors
  water: '#3B82F6',          // Blue
  sleep: '#A78BFA',          // Violet
  fats: '#F59E0B',           // Amber
  protein: '#EC4899',        // Pink
  carbs: '#F97316',          // Orange
  supplements: '#EAB308',    // Yellow - supplements
};

// Default to dark mode
export const COLORS = COLORS_DARK;
