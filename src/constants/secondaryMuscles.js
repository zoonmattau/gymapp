import { EXERCISES } from './exercises';

// ─── Default secondaries by muscleGroup + exercise type ─────────────────────
const COMPOUND_SECONDARIES = {
  Chest: ['Shoulders', 'Triceps'],
  Back: ['Biceps', 'Forearms'],
  Shoulders: ['Triceps', 'Traps'],
  Quads: ['Glutes', 'Hamstrings'],
  Hamstrings: ['Glutes', 'Back'],
  Glutes: ['Hamstrings', 'Quads'],
  Biceps: ['Forearms'],
  Triceps: ['Chest', 'Shoulders'],
  Core: [],
  Traps: ['Shoulders', 'Forearms'],
  Forearms: ['Biceps'],
  Calves: [],
  'Full Body': ['Quads', 'Glutes', 'Core', 'Shoulders', 'Back'],
};

const ISOLATION_SECONDARIES = {
  Chest: [],
  Back: [],
  Shoulders: [],
  Quads: [],
  Hamstrings: ['Glutes'],
  Glutes: [],
  Biceps: ['Forearms'],
  Triceps: [],
  Core: [],
  Traps: [],
  Forearms: [],
  Calves: [],
  'Full Body': [],
};

// ─── Exercise-specific overrides ────────────────────────────────────────────
// Keys use "name|muscleGroup" for duplicates, plain "name" otherwise.
const OVERRIDES = {
  // ── Chest ──
  'Dumbbell Pullover': ['Back', 'Core'],
  'Close Grip Dumbbell Press': ['Triceps'],
  'Landmine Press': ['Shoulders', 'Triceps', 'Core'],
  'Chest Dips': ['Triceps', 'Shoulders'],
  'Deficit Push Ups': ['Shoulders', 'Triceps', 'Core'],
  'Weighted Push Ups': ['Shoulders', 'Triceps', 'Core'],

  // ── Back ──
  'Deadlift': ['Glutes', 'Hamstrings', 'Core', 'Forearms', 'Traps'],
  'Trap Bar Deadlift': ['Quads', 'Glutes', 'Hamstrings', 'Core', 'Forearms'],
  'Deficit Deadlift': ['Glutes', 'Hamstrings', 'Core', 'Forearms', 'Traps'],
  'Snatch Grip Deadlift': ['Glutes', 'Hamstrings', 'Core', 'Forearms', 'Traps'],
  'Sumo Deadlift|Back': ['Quads', 'Glutes', 'Hamstrings', 'Core', 'Forearms'],
  'Rack Pull': ['Glutes', 'Forearms', 'Traps'],
  'Pull Ups': ['Biceps', 'Forearms', 'Core'],
  'Chin Ups': ['Biceps', 'Forearms', 'Core'],
  'Neutral Grip Pull Ups': ['Biceps', 'Forearms', 'Core'],
  'Inverted Row': ['Biceps', 'Core'],
  'Face Pulls': ['Shoulders', 'Traps'],
  'Dumbbell Pullover (Back)': ['Chest', 'Core'],
  'Cable Pullover': ['Core'],
  'Barbell Pullover': ['Chest', 'Core'],
  'Machine Pullover': ['Core'],

  // ── Shoulders ──
  'Barbell Overhead Press': ['Triceps', 'Core', 'Traps'],
  'Seated Dumbbell Press': ['Triceps', 'Traps'],
  'Arnold Press': ['Triceps', 'Traps'],
  'Push Press': ['Triceps', 'Core', 'Traps', 'Quads'],
  'Z Press': ['Triceps', 'Core', 'Traps'],
  'Viking Press': ['Triceps', 'Core'],
  'Dumbbell Shoulder Press (Standing)': ['Triceps', 'Core', 'Traps'],
  'Behind the Neck Press': ['Triceps', 'Traps'],
  'Smith Machine Shoulder Press': ['Triceps', 'Traps'],
  'Barbell Shoulder Press (Seated)': ['Triceps', 'Traps'],
  'Upright Rows': ['Traps', 'Biceps'],
  'Cable Upright Row': ['Traps', 'Biceps'],
  'Rear Delt Flyes': ['Traps', 'Back'],
  'Dumbbell Rear Delt Fly (Incline)': ['Traps', 'Back'],
  'Single Arm Rear Delt Cable Fly': ['Traps', 'Back'],
  'Rear Delt Cable Fly (Bent Over)': ['Traps', 'Back'],
  'Reverse Pec Deck': ['Traps', 'Back'],
  'Single Arm Reverse Pec Deck': ['Traps', 'Back'],
  'Band Pull Apart': ['Traps', 'Back'],
  'Prone Y-T-W Raises': ['Traps', 'Back'],

  // ── Biceps ──
  'Chin Up (Close Grip)': ['Back', 'Forearms', 'Core'],
  'Hammer Curls': ['Forearms'],
  'Cross Body Hammer Curl': ['Forearms'],
  'Cable Hammer Curl (Rope)': ['Forearms'],
  'Reverse Curl': ['Forearms'],
  'Zottman Curl': ['Forearms'],
  'Fat Grip Curl': ['Forearms'],

  // ── Triceps ──
  'Close Grip Bench Press': ['Chest', 'Shoulders'],
  'Tricep Dips': ['Chest', 'Shoulders'],
  'Diamond Push Ups': ['Chest', 'Shoulders', 'Core'],
  'Bench Dips': ['Chest', 'Shoulders'],
  'JM Press': ['Chest', 'Shoulders'],
  'Tricep Dip Machine': ['Chest', 'Shoulders'],

  // ── Quads ──
  'Barbell Back Squat': ['Glutes', 'Hamstrings', 'Core', 'Back'],
  'Front Squat': ['Core', 'Glutes', 'Back'],
  'Goblet Squat': ['Core', 'Glutes'],
  'Hack Squat': ['Glutes'],
  'Pendulum Squat': ['Glutes'],
  'Belt Squat': ['Glutes', 'Hamstrings'],
  'Safety Bar Squat': ['Glutes', 'Hamstrings', 'Core', 'Back'],
  'Zercher Squat': ['Glutes', 'Hamstrings', 'Core', 'Biceps'],
  'Box Squat': ['Glutes', 'Hamstrings', 'Core'],
  'Smith Machine Squat': ['Glutes', 'Hamstrings'],
  'Landmine Squat': ['Core', 'Glutes'],
  'Dumbbell Squat': ['Core', 'Glutes'],
  'Pistol Squat': ['Glutes', 'Hamstrings', 'Core'],
  'Jump Squat': ['Glutes', 'Calves'],
  'Lunges': ['Glutes', 'Hamstrings'],
  'Walking Lunges': ['Glutes', 'Hamstrings', 'Core'],
  'Reverse Lunges': ['Glutes', 'Hamstrings'],
  'Barbell Lunge': ['Glutes', 'Hamstrings', 'Core'],
  'Smith Machine Lunges': ['Glutes', 'Hamstrings'],
  'Bulgarian Split Squat': ['Glutes', 'Hamstrings'],
  'Split Squat': ['Glutes', 'Hamstrings'],
  'Lateral Lunge': ['Glutes', 'Hamstrings'],
  'Step Ups': ['Glutes', 'Hamstrings'],
  'Dumbbell Step Up': ['Glutes', 'Hamstrings'],
  'Cyclist Squat': ['Glutes'],
  'Spanish Squat': ['Glutes'],

  // ── Hamstrings ──
  'Romanian Deadlift': ['Glutes', 'Back', 'Core', 'Forearms'],
  'Stiff Leg Deadlift': ['Glutes', 'Back', 'Core'],
  'Good Mornings': ['Back', 'Core', 'Glutes'],
  'Nordic Curl': ['Core'],
  'Glute-Ham Raise': ['Glutes', 'Core'],
  'Single-Leg RDL': ['Glutes', 'Core', 'Back'],
  'Dumbbell Romanian Deadlift': ['Glutes', 'Back', 'Core'],
  'Cable Romanian Deadlift': ['Glutes', 'Back', 'Core'],
  'B-Stance RDL': ['Glutes', 'Back', 'Core'],
  'Kettlebell Swing|Hamstrings': ['Glutes', 'Core', 'Shoulders'],
  'Barbell Hip Hinge': ['Glutes', 'Core'],

  // ── Glutes ──
  'Hip Thrust': ['Hamstrings', 'Core'],
  'Glute Bridge': ['Hamstrings', 'Core'],
  'Barbell Glute Bridge': ['Hamstrings', 'Core'],
  'Hip Thrust Machine': ['Hamstrings', 'Core'],
  'Single Leg Hip Thrust': ['Hamstrings', 'Core'],
  'Smith Machine Hip Thrust': ['Hamstrings', 'Core'],
  'Sumo Deadlift|Glutes': ['Hamstrings', 'Quads', 'Core', 'Forearms', 'Back'],
  'Cable Pull-Through': ['Hamstrings', 'Core'],
  'Curtsy Lunge': ['Quads', 'Hamstrings'],
  'Step Down': ['Quads', 'Hamstrings'],
  'Sumo Squat': ['Quads', 'Hamstrings', 'Core'],
  'Goblet Sumo Squat': ['Quads', 'Hamstrings', 'Core'],
  'Reverse Hyperextension': ['Hamstrings', 'Back'],

  // ── Core ──
  'Ab Wheel Rollout': ['Shoulders'],
  'Barbell Rollout': ['Shoulders'],
  'Dragon Flag': ['Back'],
  'Mountain Climbers': ['Shoulders', 'Quads'],
  'Turkish Get Up': ['Shoulders', 'Quads', 'Glutes'],
  'Woodchoppers': ['Shoulders'],
  'Cable Woodchop (High to Low)': ['Shoulders'],
  'Hanging Windshield Wipers': ['Forearms'],
  'Toes to Bar': ['Forearms', 'Back'],
  'Bear Crawl': ['Shoulders', 'Quads'],
  'Landmine Rotation': ['Shoulders'],

  // ── Traps ──
  "Farmer's Walk": ['Forearms', 'Core'],
  'Snatch Grip High Pull': ['Shoulders', 'Back', 'Biceps'],

  // ── Forearms ──
  'Towel Pull Ups': ['Back', 'Biceps', 'Core'],
  'Reverse Curls': ['Biceps'],

  // ── Calves ──
  'Jump Rope Calf Work': ['Core'],

  // ── Full Body (each is unique) ──
  'Power Clean': ['Back', 'Shoulders', 'Traps', 'Quads', 'Glutes', 'Core'],
  'Hang Clean': ['Back', 'Shoulders', 'Traps', 'Core'],
  'Power Snatch': ['Back', 'Shoulders', 'Traps', 'Quads', 'Glutes', 'Core'],
  'Kettlebell Swing|Full Body': ['Hamstrings', 'Glutes', 'Core', 'Shoulders'],
  'Box Jumps': ['Quads', 'Glutes', 'Calves'],
  'Burpees': ['Chest', 'Shoulders', 'Triceps', 'Quads', 'Core'],
  'Battle Ropes': ['Shoulders', 'Core', 'Back'],
  'Jump Rope': ['Calves', 'Core'],
  'Thrusters': ['Quads', 'Shoulders', 'Triceps', 'Core'],
  'Man Makers': ['Chest', 'Shoulders', 'Back', 'Quads', 'Core'],
  'Sled Push': ['Quads', 'Glutes', 'Calves', 'Core'],
  'Sled Pull': ['Back', 'Biceps', 'Core', 'Quads'],
  'Clean and Press': ['Back', 'Shoulders', 'Traps', 'Quads', 'Core', 'Triceps'],
  'Rowing Machine': ['Back', 'Quads', 'Core', 'Biceps'],
  'Assault Bike': ['Quads', 'Hamstrings', 'Core', 'Shoulders'],
  'Ski Erg': ['Back', 'Shoulders', 'Core', 'Triceps'],
  'Tyre Flips': ['Back', 'Quads', 'Glutes', 'Core', 'Shoulders'],
  'Farmers Walk': ['Traps', 'Forearms', 'Core'],
  'Sandbag Carry': ['Core', 'Traps', 'Shoulders', 'Quads'],
  'Devil Press': ['Chest', 'Shoulders', 'Back', 'Quads', 'Core'],
  'Medicine Ball Slam': ['Core', 'Shoulders', 'Back'],
  'Prowler Push': ['Quads', 'Glutes', 'Calves', 'Core'],
  'Dumbbell Complex': ['Shoulders', 'Back', 'Quads', 'Core'],
  'Wall Ball': ['Quads', 'Glutes', 'Shoulders', 'Core'],
  'Barbell Complex': ['Shoulders', 'Back', 'Quads', 'Core'],
  'Broad Jump': ['Quads', 'Glutes', 'Calves'],
  'Versa Climber': ['Quads', 'Shoulders', 'Core', 'Back'],
  'Stair Climber': ['Quads', 'Glutes', 'Calves'],
  'Kettlebell Clean and Press': ['Shoulders', 'Back', 'Core', 'Glutes'],
  'Turkish Get Up (Kettlebell)': ['Shoulders', 'Core', 'Quads', 'Glutes'],
};

// ─── Lookup function ────────────────────────────────────────────────────────
// Returns array of secondary muscle group strings for a given exercise.
export function getSecondaryMuscles(exerciseName, muscleGroup) {
  if (!exerciseName) return [];

  // Try composite key first (handles duplicate names like "Sumo Deadlift")
  const compositeKey = `${exerciseName}|${muscleGroup}`;
  if (OVERRIDES[compositeKey]) {
    return OVERRIDES[compositeKey].filter(m => m !== muscleGroup);
  }

  // Try exercise name
  if (OVERRIDES[exerciseName]) {
    return OVERRIDES[exerciseName].filter(m => m !== muscleGroup);
  }

  // Look up exercise type from the EXERCISES array
  const match = EXERCISES.find(e => e.name === exerciseName);
  const type = match?.type || 'Compound';

  // Fall back to defaults
  const defaults = (type === 'Isolation' || type === 'Isometric')
    ? ISOLATION_SECONDARIES
    : COMPOUND_SECONDARIES;

  return (defaults[muscleGroup] || []).filter(m => m !== muscleGroup);
}

// Quick lookup: get both primary + secondaries from just exercise name
export function getExerciseMuscles(exerciseName) {
  if (!exerciseName) return { primary: null, secondary: [] };
  const match = EXERCISES.find(
    e => e.name.toLowerCase() === exerciseName.toLowerCase()
  );
  if (!match) return { primary: null, secondary: [] };
  return {
    primary: match.muscleGroup,
    secondary: getSecondaryMuscles(match.name, match.muscleGroup),
  };
}
