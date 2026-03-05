// UpRep Color Theme - Based on Logo (Cyan R + Charcoal U)

// Dark Mode
export const DARK_COLORS = {
  // Primary - Logo Cyan (from the R) - exact: #67C6D8
  primary: '#67C6D8',
  primaryDark: '#52B8CC',
  primaryLight: '#7DD3E4',

  // Accent - Logo Charcoal (from the U)
  accent: '#8B9199',
  accentLight: '#A8AEB5',

  // Background - Deep darks
  background: '#0A0A0C',
  surface: '#141418',
  surfaceLight: '#1E1E24',
  surfaceHover: '#2A2A32',

  // Text - Clean hierarchy
  text: '#FAFAFA',
  textSecondary: '#A8AEB5',
  textMuted: '#6B7280',

  // Status
  success: '#4ADE80',
  warning: '#FCD34D',
  error: '#F87171',

  // Category colors
  water: '#5DD3D3',
  sleep: '#C4B5FD',
  fats: '#FDBA74',
  protein: '#F9A8D4',
  carbs: '#FCA5A5',
  supplements: '#FDE047',

  // On-primary text
  textOnPrimary: '#0A0A0C',

  // Borders
  border: '#2A2A32',
  borderLight: '#3A3A44',
};

// Light Mode
export const LIGHT_COLORS = {
  // Primary - Logo Cyan (from the R) - exact: #67C6D8
  primary: '#67C6D8',
  primaryDark: '#52B8CC',
  primaryLight: '#7DD3E4',

  // Accent - Logo Charcoal (from the U)
  accent: '#6B7280',
  accentLight: '#8B9199',

  // Background - Clean whites
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceLight: '#F5F5F7',
  surfaceHover: '#EBEBED',

  // Text - Sharp hierarchy
  text: '#1A1A1E',
  textSecondary: '#4A4A52',
  textMuted: '#8B9199',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Category colors
  water: '#4BC5C5',
  sleep: '#8B5CF6',
  fats: '#F59E0B',
  protein: '#EC4899',
  carbs: '#F97316',
  supplements: '#EAB308',

  // On-primary text - Logo Charcoal (from the U)
  textOnPrimary: '#3D3D42',

  // Borders
  border: '#E5E5E8',
  borderLight: '#F0F0F2',
};

export const themes = {
  dark: DARK_COLORS,
  light: LIGHT_COLORS,
};

// Backward compatibility - unconverted files get dark theme
export const COLORS = DARK_COLORS;

export default COLORS;
