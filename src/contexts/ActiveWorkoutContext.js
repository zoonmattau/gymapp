import React, { createContext, useContext, useState } from 'react';

const ActiveWorkoutContext = createContext();

export const ActiveWorkoutProvider = ({ children }) => {
  const [workoutState, setWorkoutState] = useState({
    isActive: false,
    workoutName: null,
    backgroundedAt: null,
    exerciseCount: 0,
    completedSets: 0,
    totalSets: 0,
  });

  const backgroundWorkout = (data) => {
    setWorkoutState({
      isActive: true,
      workoutName: data.workoutName || 'Workout',
      backgroundedAt: data.backgroundedAt || Date.now(),
      exerciseCount: data.exerciseCount || 0,
      completedSets: data.completedSets || 0,
      totalSets: data.totalSets || 0,
    });
  };

  const clearBackgroundWorkout = () => {
    setWorkoutState({
      isActive: false,
      workoutName: null,
      backgroundedAt: null,
      exerciseCount: 0,
      completedSets: 0,
      totalSets: 0,
    });
  };

  return (
    <ActiveWorkoutContext.Provider value={{ ...workoutState, backgroundWorkout, clearBackgroundWorkout }}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkout = () => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
};
