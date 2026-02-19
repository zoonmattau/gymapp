import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { X, Search, Dumbbell } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

// Comprehensive exercise database (250+ exercises)
const EXERCISES = [
  // CHEST
  { name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Incline Barbell Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Smith Machine Incline Press', muscleGroup: 'Chest', equipment: 'Machine', type: 'compound' },
  { name: 'Decline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Machine Chest Press', muscleGroup: 'Chest', equipment: 'Machine', type: 'compound' },
  { name: 'Cable Fly', muscleGroup: 'Chest', equipment: 'Cable', type: 'isolation' },
  { name: 'Incline Cable Fly', muscleGroup: 'Chest', equipment: 'Cable', type: 'isolation' },
  { name: 'Pec Deck', muscleGroup: 'Chest', equipment: 'Machine', type: 'isolation' },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Push Ups', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Landmine Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Floor Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Ring Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Archer Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Decline Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },

  // BACK
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Pendlay Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Chest Supported Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'compound' },
  { name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'Close Grip Pulldown', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'Wide Grip Pulldown', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'Pull Ups', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Chin Ups', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Neutral Grip Pull Ups', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Machine Row', muscleGroup: 'Back', equipment: 'Machine', type: 'compound' },
  { name: 'Meadows Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Seal Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Straight Arm Pulldown', muscleGroup: 'Back', equipment: 'Cable', type: 'isolation' },
  { name: 'Rack Pulls', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Snatch Grip Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Wide Grip Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'High Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'Back Extension', muscleGroup: 'Back', equipment: 'Equipment', type: 'isolation' },
  { name: 'Hyperextension', muscleGroup: 'Back', equipment: 'Equipment', type: 'isolation' },
  { name: 'Ring Rows', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Inverted Row', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Typewriter Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Archer Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },

  // SHOULDERS
  { name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Seated Dumbbell Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Machine', type: 'compound' },
  { name: 'Push Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Cable', type: 'isolation' },
  { name: 'Machine Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Machine', type: 'isolation' },
  { name: 'Front Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Front Raises', muscleGroup: 'Shoulders', equipment: 'Cable', type: 'isolation' },
  { name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', type: 'isolation' },
  { name: 'Reverse Pec Deck', muscleGroup: 'Shoulders', equipment: 'Machine', type: 'isolation' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Rear Delt Fly', muscleGroup: 'Shoulders', equipment: 'Cable', type: 'isolation' },
  { name: 'Upright Rows', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Lu Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Y Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Seated Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Bradford Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Z Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Behind the Neck Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Bottoms Up Press', muscleGroup: 'Shoulders', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Javelin Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Crucifix Hold', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Handstand Push Up', muscleGroup: 'Shoulders', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Pike Push Up', muscleGroup: 'Shoulders', equipment: 'Bodyweight', type: 'compound' },

  // TRICEPS
  { name: 'Tricep Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Rope Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Dumbbell Skull Crushers', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Diamond Push Ups', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound' },
  { name: 'JM Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'compound' },
  { name: 'Tricep Kickbacks', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Single Arm Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'V-Bar Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Reverse Grip Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'French Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Incline Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Overhead Dumbbell Extension', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'California Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'compound' },
  { name: 'Tate Press', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Bench Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Cross Body Tricep Extension', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },

  // BICEPS
  { name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'EZ Bar Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Hammer Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Spider Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Drag Curls', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Reverse Curls', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Wrist Curls', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Bayesian Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'High Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Machine Preacher Curl', muscleGroup: 'Biceps', equipment: 'Machine', type: 'isolation' },
  { name: 'Wide Grip Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Narrow Grip EZ Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: '21s (Bicep)', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Zottman Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Waiter Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Hammer Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Overhead Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },

  // QUADS
  { name: 'Barbell Back Squat', muscleGroup: 'Legs', equipment: 'Barbell', type: 'compound' },
  { name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell', type: 'compound' },
  { name: 'Goblet Squat', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Hack Squat', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Walking Lunges', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Reverse Lunges', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Step Ups', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Leg Extension', muscleGroup: 'Legs', equipment: 'Machine', type: 'isolation' },
  { name: 'Sissy Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Pendulum Squat', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Belt Squat', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Smith Machine Squat', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Heels Elevated Squat', muscleGroup: 'Legs', equipment: 'Barbell', type: 'compound' },
  { name: 'Narrow Stance Leg Press', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Wide Stance Leg Press', muscleGroup: 'Legs', equipment: 'Machine', type: 'compound' },
  { name: 'Pistol Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Box Step Up', muscleGroup: 'Legs', equipment: 'Equipment', type: 'compound' },
  { name: 'Reverse Lunge', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Walking Lunge', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Step Through Lunge', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },

  // HAMSTRINGS & GLUTES
  { name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', type: 'compound' },
  { name: 'Stiff Leg Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell RDL', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Single Leg RDL', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Good Mornings', muscleGroup: 'Legs', equipment: 'Barbell', type: 'compound' },
  { name: 'Lying Leg Curl', muscleGroup: 'Legs', equipment: 'Machine', type: 'isolation' },
  { name: 'Seated Leg Curl', muscleGroup: 'Legs', equipment: 'Machine', type: 'isolation' },
  { name: 'Nordic Curls', muscleGroup: 'Legs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Glute Ham Raise', muscleGroup: 'Legs', equipment: 'Equipment', type: 'isolation' },
  { name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound' },
  { name: 'Cable Pull Through', muscleGroup: 'Glutes', equipment: 'Cable', type: 'compound' },
  { name: 'Glute Kickback', muscleGroup: 'Glutes', equipment: 'Cable', type: 'isolation' },
  { name: 'Hip Abduction', muscleGroup: 'Glutes', equipment: 'Machine', type: 'isolation' },
  { name: 'Sumo Deadlift', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound' },
  { name: 'Single Leg Hip Thrust', muscleGroup: 'Glutes', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Cable Hip Abduction', muscleGroup: 'Glutes', equipment: 'Cable', type: 'isolation' },
  { name: 'Curtsy Lunge', muscleGroup: 'Glutes', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Single Leg Deadlift', muscleGroup: 'Legs', equipment: 'Dumbbells', type: 'compound' },

  // CALVES
  { name: 'Standing Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Seated Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Leg Press Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Donkey Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Single Leg Calf Raise', muscleGroup: 'Calves', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Smith Machine Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },

  // CORE & ABS
  { name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Hanging Knee Raises', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Cable Crunches', muscleGroup: 'Core', equipment: 'Cable', type: 'isolation' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', equipment: 'Equipment', type: 'isolation' },
  { name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Pallof Press', muscleGroup: 'Core', equipment: 'Cable', type: 'isolation' },
  { name: 'Wood Chops', muscleGroup: 'Core', equipment: 'Cable', type: 'isolation' },
  { name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Side Plank', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Decline Sit Ups', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Bicycle Crunches', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Mountain Climbers', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'compound' },
  { name: 'V-Ups', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Toe Touches', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Flutter Kicks', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Dragon Flags', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'L-Sit', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Hollow Body Hold', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Bird Dog', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Crunches', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },

  // TRAPS
  { name: 'Barbell Shrugs', muscleGroup: 'Traps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Dumbbell Shrugs', muscleGroup: 'Traps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Shrugs', muscleGroup: 'Traps', equipment: 'Cable', type: 'isolation' },
  { name: 'Farmers Walk', muscleGroup: 'Traps', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Rack Pulls (High)', muscleGroup: 'Traps', equipment: 'Barbell', type: 'compound' },

  // CARDIO & CONDITIONING
  { name: 'Treadmill Run', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Treadmill Walk (Incline)', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Stationary Bike', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Rowing Machine', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Stair Climber', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Elliptical', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Battle Ropes', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'cardio' },
  { name: 'Box Jumps', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'compound' },
  { name: 'Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Jump Rope', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'cardio' },
  { name: 'Sled Push', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'compound' },
  { name: 'Sled Pull', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'compound' },
  { name: 'Kettlebell Swings', muscleGroup: 'Cardio', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Assault Bike', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Ski Erg', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },

  // OLYMPIC LIFTS & VARIATIONS
  { name: 'Power Clean', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Hang Clean', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Clean and Jerk', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Snatch', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Hang Snatch', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Clean High Pull', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Snatch', muscleGroup: 'Full Body', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Kettlebell Clean', muscleGroup: 'Full Body', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Thruster', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Thruster', muscleGroup: 'Full Body', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Muscle Up', muscleGroup: 'Full Body', equipment: 'Bodyweight', type: 'compound' },

  // FUNCTIONAL & STABILITY
  { name: 'Turkish Get Up', muscleGroup: 'Full Body', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Landmine Rotation', muscleGroup: 'Core', equipment: 'Barbell', type: 'compound' },
  { name: 'Medicine Ball Slam', muscleGroup: 'Full Body', equipment: 'Equipment', type: 'compound' },
  { name: 'Wall Ball', muscleGroup: 'Full Body', equipment: 'Equipment', type: 'compound' },
  { name: 'Cable Woodchop (Low to High)', muscleGroup: 'Core', equipment: 'Cable', type: 'compound' },
  { name: 'Bosu Ball Squat', muscleGroup: 'Legs', equipment: 'Equipment', type: 'compound' },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Core', 'Traps', 'Cardio', 'Full Body'];

// Same muscle group for superset suggestions (compound sets)
const SUPERSET_PAIRS = {
  'Biceps': ['Biceps'],
  'Triceps': ['Triceps'],
  'Chest': ['Chest'],
  'Back': ['Back'],
  'Shoulders': ['Shoulders'],
  'Legs': ['Legs'],
  'Glutes': ['Glutes'],
  'Core': ['Core'],
  'Calves': ['Calves'],
  'Traps': ['Traps'],
  'Cardio': ['Cardio'],
  'Full Body': ['Full Body'],
};

const ExerciseSearchModal = ({ visible, onClose, onSelect, excludeExercises = [], isSuperset = false, currentExercise = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  // Get the muscle group of the current exercise for superset suggestions
  const currentExerciseData = currentExercise ? EXERCISES.find(e => e.name === currentExercise) : null;
  const currentMuscleGroup = currentExerciseData?.muscleGroup;
  const suggestedMuscleGroups = currentMuscleGroup ? SUPERSET_PAIRS[currentMuscleGroup] || [] : [];

  // Get suggested exercises for superset - prioritize different equipment/type for variety
  const suggestedExercises = (() => {
    if (!isSuperset || suggestedMuscleGroups.length === 0) return [];

    const sameMuscleExercises = EXERCISES.filter(ex =>
      suggestedMuscleGroups.includes(ex.muscleGroup) &&
      !excludeExercises.includes(ex.name) &&
      ex.name !== currentExercise
    );

    // If we know the current exercise, prioritize different equipment/type
    if (currentExerciseData) {
      const differentEquipment = sameMuscleExercises.filter(
        ex => ex.equipment !== currentExerciseData.equipment
      );
      const sameEquipment = sameMuscleExercises.filter(
        ex => ex.equipment === currentExerciseData.equipment
      );
      // Show variety first, then same equipment
      return [...differentEquipment.slice(0, 4), ...sameEquipment.slice(0, 2)].slice(0, 6);
    }

    return sameMuscleExercises.slice(0, 6);
  })();

  const filteredExercises = EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
    const notExcluded = !excludeExercises.includes(ex.name);
    return matchesSearch && matchesMuscle && notExcluded;
  });

  const handleSelect = (exercise) => {
    onSelect(exercise.name);
    onClose();
    setSearchQuery('');
    setSelectedMuscle('All');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{isSuperset ? 'Select Superset Exercise' : 'Add Exercise'}</Text>
            <Text style={styles.exerciseCount}>{filteredExercises.length} exercises</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Muscle Group Filter */}
        <FlatList
          horizontal
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedMuscle === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedMuscle(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedMuscle === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Exercise List */}
        <View style={styles.exerciseListContainer}>
          <ScrollView
            style={styles.exerciseList}
            contentContainerStyle={styles.exerciseListContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {/* Suggested Exercises for Superset */}
            {isSuperset && suggestedExercises.length > 0 && searchQuery === '' && (
              <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>SUGGESTED FOR SUPERSET</Text>
              <Text style={styles.suggestedSubtitle}>
                Other {currentMuscleGroup} exercises
              </Text>
              {suggestedExercises.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.exerciseItem, styles.suggestedItem]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={[styles.exerciseIcon, styles.suggestedIcon]}>
                    <Dumbbell size={18} color="#D97706" />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.muscleGroup} • {item.equipment}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={styles.divider}>
                <Text style={styles.dividerText}>ALL EXERCISES</Text>
              </View>
            </View>
          )}

          {/* All Exercises */}
          {filteredExercises.length > 0 ? (
            filteredExercises.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={styles.exerciseItem}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.exerciseIcon}>
                  <Dumbbell size={18} color={COLORS.primary} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {item.muscleGroup} • {item.equipment}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  exerciseCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 10,
  },
  filterList: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.text,
  },
  exerciseListContainer: {
    flex: 1,
    marginTop: 12,
    ...(Platform.OS === 'web' ? {
      overflow: 'hidden',
      position: 'relative',
    } : {}),
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? {
      overflowY: 'scroll',
      height: '100%',
      WebkitOverflowScrolling: 'touch',
    } : {}),
  },
  exerciseListContent: {
    paddingBottom: 40,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  suggestedSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  suggestedTitle: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestedSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  suggestedItem: {
    borderWidth: 1,
    borderColor: '#D97706',
  },
  suggestedIcon: {
    backgroundColor: '#D9770620',
  },
  divider: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default ExerciseSearchModal;
