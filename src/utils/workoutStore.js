// Workout store with localStorage persistence for web
import { Platform } from 'react-native';

let pausedWorkout = null;

// Initialize from localStorage on load (web only)
if (Platform.OS === 'web') {
  try {
    const saved = localStorage.getItem('activeWorkout');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if the workout is less than 24 hours old
      const savedAt = parsed.savedAt || 0;
      const hoursSinceSave = (Date.now() - savedAt) / (1000 * 60 * 60);
      if (hoursSinceSave < 24) {
        pausedWorkout = parsed;
      } else {
        // Expired - clear it
        localStorage.removeItem('activeWorkout');
      }
    }
  } catch (e) {
    console.log('Error loading saved workout:', e);
  }
}

export const setPausedWorkout = (workout) => {
  pausedWorkout = workout;
  // Also save to localStorage for web
  if (Platform.OS === 'web') {
    try {
      if (workout) {
        localStorage.setItem('activeWorkout', JSON.stringify({
          ...workout,
          savedAt: Date.now(),
        }));
      }
    } catch (e) {
      console.log('Error saving workout to localStorage:', e);
    }
  }
};

export const getPausedWorkout = () => {
  // For web, also check localStorage in case the page was refreshed
  if (Platform.OS === 'web' && !pausedWorkout) {
    try {
      const saved = localStorage.getItem('activeWorkout');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedAt = parsed.savedAt || 0;
        const hoursSinceSave = (Date.now() - savedAt) / (1000 * 60 * 60);
        if (hoursSinceSave < 24) {
          pausedWorkout = parsed;
        } else {
          localStorage.removeItem('activeWorkout');
        }
      }
    } catch (e) {
      console.log('Error loading saved workout:', e);
    }
  }
  return pausedWorkout;
};

export const clearPausedWorkout = () => {
  pausedWorkout = null;
  // Also clear from localStorage for web
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem('activeWorkout');
    } catch (e) {
      console.log('Error clearing saved workout:', e);
    }
  }
};
