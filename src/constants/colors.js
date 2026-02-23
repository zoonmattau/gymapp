// UpRep Color Theme

// Dark Mode (Original)
export const DARK_COLORS = {
  // Primary - Cyan theme
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  primaryLight: '#22D3EE',

  // Accent
  accent: '#22D3EE',
  accentLight: '#67E8F9',

  // Background
  background: '#0D0F12',
  surface: '#121417',
  surfaceLight: '#1E2024',

  // Text
  text: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',

  // Status
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#EF4444',

  // Category colors
  water: '#60A5FA',
  sleep: '#C4B5FD',
  fats: '#F59E0B',
  protein: '#F472B6',
  carbs: '#FB923C',
  supplements: '#FBBF24',

  // On-primary text (text on primary/success/error backgrounds)
  textOnPrimary: '#F3F4F6',

  // Borders
  border: '#2A2D32',
  borderLight: '#3D4A5C',
};

// Light Mode
export const LIGHT_COLORS = {
  // Primary - Deep indigo/blue for strong contrast on white
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',

  // Accent
  accent: '#6366F1',
  accentLight: '#818CF8',

  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Status
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',

  // Category colors
  water: '#3B82F6',
  sleep: '#8B5CF6',
  fats: '#D97706',
  protein: '#EC4899',
  carbs: '#EA580C',
  supplements: '#D97706',

  // On-primary text (text on primary/success/error backgrounds)
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

export const themes = {
  dark: DARK_COLORS,
  light: LIGHT_COLORS,
};

// Backward compatibility - unconverted files get dark theme
export const COLORS = DARK_COLORS;

export default COLORS;
