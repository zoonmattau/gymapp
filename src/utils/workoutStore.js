// Workout store with localStorage persistence for web
import { Platform } from 'react-native';

let pausedWorkout = null;

// Initialize from localStorage on load (web only)
if (Platform.OS === 'web') {
  console.log('workoutStore: Initializing on web platform');
  try {
    const saved = localStorage.getItem('activeWorkout');
    console.log('workoutStore INIT: localStorage has activeWorkout:', !!saved);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if the workout is less than 24 hours old
      const savedAt = parsed.savedAt || 0;
      const hoursSinceSave = (Date.now() - savedAt) / (1000 * 60 * 60);
      console.log('workoutStore INIT: Hours since save:', hoursSinceSave.toFixed(2), 'exercises:', parsed.exercises?.length);
      if (hoursSinceSave < 24) {
        pausedWorkout = parsed;
        console.log('workoutStore INIT: Loaded saved workout with', parsed.exercises?.length, 'exercises');
      } else {
        // Expired - clear it
        console.log('workoutStore INIT: Workout expired, clearing');
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
  // For web, always read fresh from localStorage
  if (Platform.OS === 'web') {
    try {
      const saved = localStorage.getItem('activeWorkout');
      console.log('getPausedWorkout: localStorage has data:', !!saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedAt = parsed.savedAt || 0;
        const hoursSinceSave = (Date.now() - savedAt) / (1000 * 60 * 60);
        console.log('getPausedWorkout: Hours since save:', hoursSinceSave.toFixed(2));
        if (hoursSinceSave < 24) {
          pausedWorkout = parsed;
          console.log('getPausedWorkout: Returning workout with', parsed.exercises?.length, 'exercises');
          return pausedWorkout;
        } else {
          console.log('getPausedWorkout: Workout expired, clearing');
          localStorage.removeItem('activeWorkout');
          pausedWorkout = null;
        }
      } else {
        pausedWorkout = null;
      }
    } catch (e) {
      console.log('Error loading saved workout:', e);
      pausedWorkout = null;
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
