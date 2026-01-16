// Injury recovery system constants and functions
export const INJURY_SEVERITY = {
  mild: { label: 'Mild', description: 'Minor discomfort, slight pain', multiplier: 1, color: '#fbbf24' },
  moderate: { label: 'Moderate', description: 'Noticeable pain, limited movement', multiplier: 1.5, color: '#f97316' },
  severe: { label: 'Severe', description: 'Significant pain, major limitation', multiplier: 2.5, color: '#ef4444' },
};

// Recovery phases with descriptions
export const RECOVERY_PHASES = {
  rest: {
    name: 'Rest & Protect',
    description: 'Complete rest for the injured area. Focus on reducing inflammation.',
    icon: '🛌',
    tips: [
      'Apply ice for 15-20 minutes every 2-3 hours',
      'Keep the injured area elevated when possible',
      'Avoid any movements that cause pain',
      'Stay hydrated and eat anti-inflammatory foods',
      'Get plenty of sleep for tissue repair',
    ],
  },
  recovery: {
    name: 'Active Recovery',
    description: 'Gentle movement and stretching to restore mobility.',
    icon: '🧘',
    tips: [
      'Start with gentle range of motion exercises',
      'Light stretching - never push through pain',
      'Consider foam rolling nearby muscles',
      'Short walks to maintain general fitness',
      'Listen to your body and rest if needed',
    ],
  },
  strengthening: {
    name: 'Rebuilding Strength',
    description: 'Progressive loading to restore muscle strength.',
    icon: '💪',
    tips: [
      'Start with bodyweight or very light weights',
      'Focus on controlled movements',
      'Gradually increase resistance over time',
      'Include stability and balance work',
      'Stop immediately if you feel sharp pain',
    ],
  },
  return: {
    name: 'Return to Training',
    description: 'Gradually return to your normal workout routine.',
    icon: '🏋️',
    tips: [
      'Start at 50-70% of your previous intensity',
      'Increase volume before intensity',
      'Include extra warm-up for the affected area',
      'Monitor for any pain or discomfort',
      'Be patient - full recovery takes time',
    ],
  },
};

// Base recovery timelines (in days) for each muscle group by injury type
export const INJURY_RECOVERY_DATA = {
  // Upper Body
  'Chest': { baseDays: 7, restPercent: 30, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Upper Chest', 'Front Delts', 'Triceps'] },
  'Upper Chest': { baseDays: 7, restPercent: 30, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Chest', 'Front Delts'] },
  'Back': { baseDays: 10, restPercent: 35, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Lats', 'Rear Delts', 'Biceps'] },
  'Lats': { baseDays: 8, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Back', 'Biceps'] },
  'Shoulders': { baseDays: 14, restPercent: 40, recoveryPercent: 30, strengthenPercent: 20, relatedMuscles: ['Front Delts', 'Side Delts', 'Rear Delts'] },
  'Front Delts': { baseDays: 10, restPercent: 35, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Shoulders', 'Chest'] },
  'Side Delts': { baseDays: 8, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Shoulders'] },
  'Rear Delts': { baseDays: 8, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Shoulders', 'Back'] },
  'Biceps': { baseDays: 7, restPercent: 25, recoveryPercent: 35, strengthenPercent: 30, relatedMuscles: ['Forearms'] },
  'Triceps': { baseDays: 7, restPercent: 25, recoveryPercent: 35, strengthenPercent: 30, relatedMuscles: ['Chest', 'Shoulders'] },
  'Forearms': { baseDays: 10, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: ['Biceps'] },
  // Lower Body
  'Quads': { baseDays: 10, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Glutes'] },
  'Hamstrings': { baseDays: 14, restPercent: 40, recoveryPercent: 30, strengthenPercent: 20, relatedMuscles: ['Glutes', 'Lower Back'] },
  'Glutes': { baseDays: 10, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Quads', 'Hamstrings'] },
  'Calves': { baseDays: 10, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: [] },
  'Hip Flexors': { baseDays: 12, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: ['Quads', 'Core'] },
  // Core & Back
  'Abs': { baseDays: 7, restPercent: 25, recoveryPercent: 40, strengthenPercent: 25, relatedMuscles: ['Core', 'Obliques'] },
  'Core': { baseDays: 10, restPercent: 30, recoveryPercent: 40, strengthenPercent: 20, relatedMuscles: ['Abs', 'Lower Back'] },
  'Lower Back': { baseDays: 21, restPercent: 45, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Core', 'Glutes', 'Hamstrings'] },
  'Obliques': { baseDays: 7, restPercent: 25, recoveryPercent: 40, strengthenPercent: 25, relatedMuscles: ['Abs', 'Core'] },
  'Traps': { baseDays: 10, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: ['Shoulders', 'Back'] },
  // General
  'Neck': { baseDays: 14, restPercent: 50, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Traps'] },
  'Groin': { baseDays: 14, restPercent: 40, recoveryPercent: 35, strengthenPercent: 15, relatedMuscles: ['Hip Flexors', 'Quads'] },
  'Knee': { baseDays: 21, restPercent: 45, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Quads', 'Hamstrings', 'Calves'] },
  'Ankle': { baseDays: 14, restPercent: 40, recoveryPercent: 35, strengthenPercent: 15, relatedMuscles: ['Calves'] },
  'Wrist': { baseDays: 14, restPercent: 40, recoveryPercent: 35, strengthenPercent: 15, relatedMuscles: ['Forearms'] },
  'Elbow': { baseDays: 21, restPercent: 45, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Biceps', 'Triceps', 'Forearms'] },
};

// Recovery exercises for each muscle group
export const RECOVERY_EXERCISES = {
  'Chest': [
    { name: 'Chest Stretch', duration: '30 sec each side', description: 'Doorway stretch, gentle hold' },
    { name: 'Arm Circles', duration: '1 min', description: 'Small to large circles, both directions' },
    { name: 'Wall Push-ups', duration: '2x10', description: 'Very light, focus on range of motion' },
  ],
  'Back': [
    { name: 'Cat-Cow Stretch', duration: '1 min', description: 'Slow, controlled movements' },
    { name: 'Child\'s Pose', duration: '1 min', description: 'Gentle lat stretch' },
    { name: 'Prone Y Raises', duration: '2x10', description: 'No weight, focus on activation' },
  ],
  'Shoulders': [
    { name: 'Pendulum Swings', duration: '1 min each arm', description: 'Let arm hang and swing gently' },
    { name: 'Wall Slides', duration: '2x10', description: 'Back against wall, slide arms up' },
    { name: 'Band Pull-Aparts', duration: '2x15', description: 'Very light band' },
  ],
  'Biceps': [
    { name: 'Bicep Stretch', duration: '30 sec each arm', description: 'Arm extended, palm on wall' },
    { name: 'Wrist Rotations', duration: '1 min', description: 'Gentle circles both directions' },
    { name: 'Light Curls', duration: '2x15', description: '1-2kg max, full range of motion' },
  ],
  'Triceps': [
    { name: 'Tricep Stretch', duration: '30 sec each arm', description: 'Overhead stretch' },
    { name: 'Arm Extensions', duration: '2x15', description: 'No weight, focus on extension' },
  ],
  'Quads': [
    { name: 'Quad Stretch', duration: '30 sec each leg', description: 'Standing or lying' },
    { name: 'Leg Swings', duration: '1 min each leg', description: 'Front to back, controlled' },
    { name: 'Wall Sits', duration: '3x15 sec', description: 'Shallow angle, no pain' },
  ],
  'Hamstrings': [
    { name: 'Hamstring Stretch', duration: '30 sec each leg', description: 'Seated or lying' },
    { name: 'Good Mornings', duration: '2x10', description: 'No weight, gentle hinge' },
    { name: 'Glute Bridges', duration: '2x12', description: 'Focus on hamstring engagement' },
  ],
  'Glutes': [
    { name: 'Pigeon Stretch', duration: '30 sec each side', description: 'Gentle hip opener' },
    { name: 'Clamshells', duration: '2x15 each side', description: 'Side lying, no band' },
    { name: 'Glute Bridges', duration: '2x12', description: 'Bodyweight only' },
  ],
  'Lower Back': [
    { name: 'Knee to Chest', duration: '30 sec each leg', description: 'Lying on back' },
    { name: 'Pelvic Tilts', duration: '2x15', description: 'Lying on back, gentle movement' },
    { name: 'Bird Dogs', duration: '2x8 each side', description: 'Slow and controlled' },
  ],
  'Core': [
    { name: 'Dead Bug', duration: '2x8 each side', description: 'Slow, controlled movement' },
    { name: 'Diaphragmatic Breathing', duration: '2 min', description: 'Deep belly breaths' },
    { name: 'Gentle Planks', duration: '3x15 sec', description: 'On knees if needed' },
  ],
};

// Restrengthening exercises (progressive loading)
export const RESTRENGTHENING_EXERCISES = {
  'Chest': [
    { name: 'Incline Push-ups', sets: 3, reps: 12, description: 'Hands elevated, controlled tempo' },
    { name: 'Light Dumbbell Press', sets: 3, reps: 12, description: 'Start with 50% usual weight' },
    { name: 'Cable Flyes', sets: 3, reps: 15, description: 'Light weight, full stretch' },
  ],
  'Back': [
    { name: 'Banded Rows', sets: 3, reps: 15, description: 'Focus on squeeze at top' },
    { name: 'Light Lat Pulldowns', sets: 3, reps: 12, description: 'Controlled negative' },
    { name: 'Face Pulls', sets: 3, reps: 15, description: 'Light band, external rotation' },
  ],
  'Shoulders': [
    { name: 'Band External Rotation', sets: 3, reps: 15, description: 'Elbow at side' },
    { name: 'Light Lateral Raises', sets: 3, reps: 15, description: 'Very light, controlled' },
    { name: 'Y-T-W Raises', sets: 2, reps: 10, description: 'Prone position, no weight' },
  ],
  'Quads': [
    { name: 'Bodyweight Squats', sets: 3, reps: 12, description: 'Controlled, pain-free range' },
    { name: 'Step Ups', sets: 3, reps: 10, description: 'Low step, focus on control' },
    { name: 'Leg Extensions', sets: 3, reps: 15, description: 'Light weight, full extension' },
  ],
  'Hamstrings': [
    { name: 'Romanian Deadlifts', sets: 3, reps: 10, description: 'Very light, focus on stretch' },
    { name: 'Stability Ball Curls', sets: 3, reps: 12, description: 'Slow and controlled' },
    { name: 'Single Leg Glute Bridges', sets: 3, reps: 10, description: 'Focus on hamstring' },
  ],
  'Lower Back': [
    { name: 'Superman Holds', sets: 3, reps: '10 sec', description: 'Gentle, don\'t overextend' },
    { name: 'Hip Hinges', sets: 3, reps: 12, description: 'No weight, perfect form' },
    { name: 'Kettlebell Deadlifts', sets: 3, reps: 10, description: 'Very light, controlled' },
  ],
};

// Motivational coaching messages for each phase
export const COACHING_MESSAGES = {
  rest: [
    "Rest is not giving up - it's part of getting stronger. Your body is healing right now.",
    "Every day of proper rest is an investment in your future performance. Trust the process.",
    "The strongest athletes know when to rest. You're making the right choice.",
    "Your muscles are rebuilding right now. Give them the time they need.",
    "Recovery is where the magic happens. You're doing great by listening to your body.",
  ],
  recovery: [
    "You're making progress! Gentle movement is exactly what your body needs right now.",
    "Each small movement is a step toward full recovery. Keep going!",
    "You're in the healing zone now. These exercises are rebuilding your strength foundation.",
    "Moving again feels good, doesn't it? Your body is responding well.",
    "Patience and persistence - you've got both. Recovery is going well!",
  ],
  strengthening: [
    "You're getting stronger every day! Your body has healed and is ready to rebuild.",
    "This is exciting - you're rebuilding better than before. Stay focused!",
    "Controlled progress is smart progress. You're doing this the right way.",
    "Your comeback is happening right now. Each rep is bringing you back stronger.",
    "The finish line is in sight. Keep up the amazing work!",
  ],
  return: [
    "Welcome back! You've earned this through patience and smart training.",
    "You did it the right way - full recovery means you're back for good.",
    "Stronger, smarter, and ready to crush it. Your dedication paid off!",
    "This injury taught you something valuable. Now go show what you've got!",
    "Full strength, full confidence. Time to get after it!",
  ],
};

// Calculate recovery timeline for an injury
export const calculateRecoveryTimeline = (muscleGroup, severity, startDate) => {
  const recoveryData = INJURY_RECOVERY_DATA[muscleGroup] || INJURY_RECOVERY_DATA['Core'];
  const severityData = INJURY_SEVERITY[severity] || INJURY_SEVERITY.moderate;

  const totalDays = Math.round(recoveryData.baseDays * severityData.multiplier);
  const restDays = Math.round(totalDays * (recoveryData.restPercent / 100));
  const recoveryDays = Math.round(totalDays * (recoveryData.recoveryPercent / 100));
  const strengthenDays = Math.round(totalDays * (recoveryData.strengthenPercent / 100));
  const returnDays = totalDays - restDays - recoveryDays - strengthenDays;

  const start = new Date(startDate);

  return {
    totalDays,
    phases: {
      rest: {
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + restDays * 24 * 60 * 60 * 1000).toISOString(),
        days: restDays,
      },
      recovery: {
        startDate: new Date(start.getTime() + restDays * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + (restDays + recoveryDays) * 24 * 60 * 60 * 1000).toISOString(),
        days: recoveryDays,
      },
      strengthening: {
        startDate: new Date(start.getTime() + (restDays + recoveryDays) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + (restDays + recoveryDays + strengthenDays) * 24 * 60 * 60 * 1000).toISOString(),
        days: strengthenDays,
      },
      return: {
        startDate: new Date(start.getTime() + (restDays + recoveryDays + strengthenDays) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString(),
        days: returnDays,
      },
    },
    expectedRecoveryDate: new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString(),
    affectedMuscles: [muscleGroup, ...(recoveryData.relatedMuscles || [])],
  };
};

// Get current recovery phase for an injury
export const getCurrentRecoveryPhase = (injury) => {
  if (!injury || !injury.timeline) return null;

  const now = new Date();
  const { phases } = injury.timeline;

  for (const [phaseName, phaseData] of Object.entries(phases)) {
    const start = new Date(phaseData.startDate);
    const end = new Date(phaseData.endDate);
    if (now >= start && now < end) {
      const daysIntoPhase = Math.floor((now - start) / (24 * 60 * 60 * 1000));
      const daysRemaining = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
      return {
        phase: phaseName,
        ...RECOVERY_PHASES[phaseName],
        daysIntoPhase,
        daysRemaining,
        percentComplete: Math.round((daysIntoPhase / phaseData.days) * 100),
      };
    }
  }

  // If past all phases, return completed
  const recoveryEnd = new Date(injury.timeline.expectedRecoveryDate);
  if (now >= recoveryEnd) {
    return { phase: 'completed', name: 'Fully Recovered', icon: '✅', percentComplete: 100 };
  }

  return null;
};

// Get a random coaching message for the current phase
export const getCoachingMessage = (phase) => {
  const messages = COACHING_MESSAGES[phase] || COACHING_MESSAGES.rest;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Check if a muscle group is injured and should be avoided
export const isMuscleInjured = (muscleGroup, injuries) => {
  if (!injuries || injuries.length === 0) return false;

  return injuries.some(injury => {
    if (!injury.active) return false;
    const phase = getCurrentRecoveryPhase(injury);
    // During rest phase, avoid all related muscles
    if (phase?.phase === 'rest') {
      return injury.timeline.affectedMuscles.includes(muscleGroup);
    }
    // During recovery phase, still avoid direct work on the injured muscle
    if (phase?.phase === 'recovery') {
      return injury.muscleGroup === muscleGroup;
    }
    return false;
  });
};

// Get recovery exercises to add to a workout based on current injuries
export const getRecoveryExercisesForWorkout = (injuries) => {
  const exercises = [];

  injuries.forEach(injury => {
    if (!injury.active) return;
    const phase = getCurrentRecoveryPhase(injury);

    if (phase?.phase === 'recovery') {
      const recoveryExs = RECOVERY_EXERCISES[injury.muscleGroup] || RECOVERY_EXERCISES['Core'];
      exercises.push(...recoveryExs.map(ex => ({
        ...ex,
        isRecovery: true,
        forInjury: injury.muscleGroup,
        phase: 'recovery',
      })));
    } else if (phase?.phase === 'strengthening') {
      const strengthExs = RESTRENGTHENING_EXERCISES[injury.muscleGroup] || [];
      if (strengthExs.length > 0) {
        // Add 1-2 restrengthening exercises
        exercises.push(...strengthExs.slice(0, 2).map(ex => ({
          ...ex,
          isRecovery: true,
          forInjury: injury.muscleGroup,
          phase: 'strengthening',
        })));
      }
    }
  });

  return exercises;
};

