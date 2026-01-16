// Equipment options for workout generation
export const EQUIPMENT_OPTIONS = {
  barbell: { id: 'barbell', label: 'Barbell & Plates', icon: '🏋️', key: 'Barbell' },
  dumbbells: { id: 'dumbbells', label: 'Dumbbells', icon: '💪', key: 'Dumbbells' },
  cable: { id: 'cable', label: 'Cable Machine', icon: '🔗', key: 'Cable' },
  machines: { id: 'machines', label: 'Gym Machines', icon: '🎰', key: 'Machine' },
  bodyweight: { id: 'bodyweight', label: 'Bodyweight', icon: '🤸', key: 'Bodyweight' },
  kettlebell: { id: 'kettlebell', label: 'Kettlebells', icon: '🔔', key: 'Kettlebell' },
  specialty: { id: 'specialty', label: 'Specialty Equipment', icon: '⚙️', key: 'Equipment', desc: 'Pull-up bar, dip station, ab wheel, etc.' },
};

// Equipment presets for quick selection
export const EQUIPMENT_PRESETS = {
  full_gym: {
    id: 'full_gym',
    label: 'Full Gym',
    icon: '🏢',
    desc: 'Commercial gym with all equipment',
    equipment: ['barbell', 'dumbbells', 'cable', 'machines', 'bodyweight', 'kettlebell', 'specialty'],
  },
  home_gym: {
    id: 'home_gym',
    label: 'Home Gym',
    icon: '🏠',
    desc: 'Basic home setup with essential equipment',
    equipment: ['barbell', 'dumbbells', 'bodyweight', 'specialty'],
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal Setup',
    icon: '📦',
    desc: 'Dumbbells and bodyweight only',
    equipment: ['dumbbells', 'bodyweight'],
  },
  bodyweight_only: {
    id: 'bodyweight_only',
    label: 'Bodyweight Only',
    icon: '🤸',
    desc: 'No equipment needed',
    equipment: ['bodyweight'],
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    icon: '⚙️',
    desc: 'Select your own equipment',
    equipment: [],
  },
};

// Helper to get equipment keys from user's selected equipment IDs
export const getEquipmentKeys = (selectedEquipmentIds) => {
  return selectedEquipmentIds.map(id => EQUIPMENT_OPTIONS[id]?.key).filter(Boolean);
};
