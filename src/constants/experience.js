// Experience levels - 4 tiers
export const EXPERIENCE_LEVELS = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    desc: 'New to lifting (0-6 months)',
    icon: '🌱',
    showHeadSpecificity: false,
    workoutComplexity: 'basic',
  },
  novice: {
    id: 'novice',
    label: 'Novice',
    desc: 'Learning the basics (6-18 months)',
    icon: '📈',
    showHeadSpecificity: false,
    workoutComplexity: 'basic',
  },
  experienced: {
    id: 'experienced',
    label: 'Experienced',
    desc: 'Consistent training (1.5-4 years)',
    icon: '💪',
    showHeadSpecificity: true,
    workoutComplexity: 'advanced',
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    desc: 'Advanced lifter (4+ years)',
    icon: '🏆',
    showHeadSpecificity: true,
    workoutComplexity: 'advanced',
  },
};

// Muscle head mappings for advanced users
export const MUSCLE_HEAD_MAPPINGS = {
  'Biceps': ['Long Head Biceps', 'Short Head Biceps'],
  'Triceps': ['Long Head Triceps', 'Lateral Head Triceps', 'Medial Head Triceps'],
  'Back': ['Upper Back', 'Mid Back', 'Lower Back'],
  'Quads': ['Vastus Lateralis', 'Vastus Medialis', 'Rectus Femoris'],
  'Hamstrings': ['Bicep Femoris', 'Semitendinosus'],
  'Glutes': ['Gluteus Maximus', 'Gluteus Medius'],
};
