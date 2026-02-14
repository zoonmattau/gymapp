// Simple global store for paused workout state
// In a production app, this would use AsyncStorage or a proper state management solution

let pausedWorkout = null;

export const setPausedWorkout = (workout) => {
  pausedWorkout = workout;
};

export const getPausedWorkout = () => {
  return pausedWorkout;
};

export const clearPausedWorkout = () => {
  pausedWorkout = null;
};
