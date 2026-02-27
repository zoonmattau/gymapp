import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Trash2,
  ChevronRight,
  Dumbbell,
  Pencil,
} from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EXERCISES } from '../constants/exercises';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import { saveCustomTemplate } from '../utils/customTemplateStore';

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Calves', 'Traps',
];

// Map chip labels to muscleGroup values in constants/exercises.js
const MUSCLE_GROUP_MAP = {
  Chest: ['Chest'],
  Back: ['Back'],
  Shoulders: ['Shoulders'],
  Biceps: ['Biceps'],
  Triceps: ['Triceps'],
  Legs: ['Hamstrings', 'Quads'],
  Glutes: ['Glutes'],
  Core: ['Core'],
  Calves: ['Calves'],
  Traps: ['Traps'],
};

// Pick exercises for a muscle group from the EXERCISES constant
const pickExercisesForGroup = (group, existingNames) => {
  const mapped = MUSCLE_GROUP_MAP[group] || [group];
  const pool = EXERCISES.filter(
    e => mapped.includes(e.muscleGroup) && !existingNames.has(e.name)
  );

  const compounds = pool.filter(e => e.type === 'Compound');
  const isolations = pool.filter(e => e.type === 'Isolation');

  // Pick up to 3 compounds varying equipment, then up to 2 isolations
  const picked = [];
  const usedEquipment = new Set();

  for (const ex of compounds) {
    if (picked.length >= 3) break;
    if (!usedEquipment.has(ex.equipment)) {
      picked.push({ ...ex, _type: 'compound' });
      usedEquipment.add(ex.equipment);
    }
  }
  // Fill remaining compound slots if needed
  for (const ex of compounds) {
    if (picked.length >= 3) break;
    if (!picked.find(p => p.name === ex.name)) {
      picked.push({ ...ex, _type: 'compound' });
    }
  }

  for (const ex of isolations) {
    if (picked.filter(p => p._type === 'isolation').length >= 2) break;
    if (!picked.find(p => p.name === ex.name)) {
      picked.push({ ...ex, _type: 'isolation' });
    }
  }

  return picked.map(ex => ({
    id: ex.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: ex.name,
    sets: 3,
    targetReps: ex._type === 'compound' ? 8 : 12,
    restTime: ex._type === 'compound' ? 120 : 90,
    muscleGroup: group,
  }));
};

const generateExercises = (selectedGroups) => {
  const existingNames = new Set();
  let all = [];

  for (const group of selectedGroups) {
    const exercises = pickExercisesForGroup(group, existingNames);
    exercises.forEach(e => existingNames.add(e.name));
    all = all.concat(exercises);
  }

  // Cap at 10 exercises - trim proportionally
  if (all.length > 10) {
    const perGroup = Math.max(2, Math.floor(10 / selectedGroups.length));
    const trimmed = [];
    const byGroup = {};
    all.forEach(e => {
      if (!byGroup[e.muscleGroup]) byGroup[e.muscleGroup] = [];
      byGroup[e.muscleGroup].push(e);
    });
    for (const group of selectedGroups) {
      const groupExercises = byGroup[group] || [];
      trimmed.push(...groupExercises.slice(0, perGroup));
    }
    return trimmed.slice(0, 10);
  }

  return all;
};

const CreateWorkoutScreen = ({ navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [workoutName, setWorkoutName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingExerciseIdx, setEditingExerciseIdx] = useState(null);

  const canProceed = workoutName.trim().length > 0 && selectedGroups.length > 0;

  const toggleGroup = (group) => {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const goToStep2 = () => {
    const prefilled = generateExercises(selectedGroups);
    setExercises(prefilled);
    setStep(2);
  };

  const removeExercise = (idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const moveExercise = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    const updated = [...exercises];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setExercises(updated);
  };

  const adjustSets = (idx, delta) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== idx) return ex;
      const newSets = Math.max(1, Math.min(10, ex.sets + delta));
      return { ...ex, sets: newSets };
    }));
  };

  const adjustReps = (idx, delta) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== idx) return ex;
      const newReps = Math.max(1, Math.min(30, ex.targetReps + delta));
      return { ...ex, targetReps: newReps };
    }));
  };

  const addExercise = (exerciseName) => {
    const newExercise = {
      id: exerciseName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      name: exerciseName,
      sets: 3,
      targetReps: 10,
      restTime: 90,
      muscleGroup: EXERCISES.find(e => e.name === exerciseName)?.muscleGroup || 'Other',
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const saveWorkout = async () => {
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise before saving.');
      return;
    }

    const template = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: workoutName.trim(),
      focus: selectedGroups.join(', '),
      isCustom: true,
      muscleGroups: selectedGroups,
      createdAt: new Date().toISOString(),
      exercises: exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        targetReps: ex.targetReps,
        restTime: ex.restTime,
        muscleGroup: ex.muscleGroup,
      })),
    };

    await saveCustomTemplate(user.id, template);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Design Workout' : 'Review Exercises'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, styles.stepDotActive]} />
        <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
      </View>

      {step === 1 ? (
        /* Step 1: Name + Muscle Groups */
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.label}>WORKOUT NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Chest & Arms Day"
            placeholderTextColor={COLORS.textMuted}
            value={workoutName}
            onChangeText={setWorkoutName}
            autoFocus
          />

          <Text style={[styles.label, { marginTop: 24 }]}>TARGET MUSCLE GROUPS</Text>
          <Text style={styles.sublabel}>Select the muscle groups for your workout</Text>

          <View style={styles.chipGrid}>
            {MUSCLE_GROUPS.map(group => {
              const isSelected = selectedGroups.includes(group);
              return (
                <TouchableOpacity
                  key={group}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {group}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedGroups.length > 0 && (
            <Text style={styles.selectedInfo}>
              {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
            </Text>
          )}
        </ScrollView>
      ) : (
        /* Step 2: Review & Edit Exercises */
        Platform.OS === 'web' ? (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 100,
            WebkitOverflowScrolling: 'touch',
          }}>
            <View style={styles.exerciseListHeader}>
              <Text style={styles.label}>EXERCISES ({exercises.length})</Text>
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => setShowExerciseSearch(true)}
              >
                <Plus size={16} color={COLORS.primary} />
                <Text style={styles.addExerciseBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {exercises.map((exercise, idx) => (
              <View key={exercise.id} style={styles.exerciseRow}>
                <View style={styles.exerciseReorder}>
                  <TouchableOpacity
                    onPress={() => moveExercise(idx, -1)}
                    disabled={idx === 0}
                    style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
                  >
                    <ArrowUp size={16} color={idx === 0 ? COLORS.textMuted : COLORS.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveExercise(idx, 1)}
                    disabled={idx === exercises.length - 1}
                    style={[styles.reorderBtn, idx === exercises.length - 1 && styles.reorderBtnDisabled]}
                  >
                    <ArrowDown size={16} color={idx === exercises.length - 1 ? COLORS.textMuted : COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <View style={styles.muscleBadge}>
                      <Text style={styles.muscleBadgeText}>{exercise.muscleGroup}</Text>
                    </View>
                    <View style={styles.setsRepsRow}>
                      <TouchableOpacity onPress={() => adjustSets(idx, -1)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.setsRepsText}>{exercise.sets}x{exercise.targetReps}</Text>
                      <TouchableOpacity onPress={() => adjustSets(idx, 1)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => removeExercise(idx)}
                  style={styles.removeBtn}
                >
                  <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}

            {exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Dumbbell size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No exercises yet</Text>
                <Text style={styles.emptySubtext}>Tap "Add" to add exercises</Text>
              </View>
            )}
          </div>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.exerciseListHeader}>
              <Text style={styles.label}>EXERCISES ({exercises.length})</Text>
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => setShowExerciseSearch(true)}
              >
                <Plus size={16} color={COLORS.primary} />
                <Text style={styles.addExerciseBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {exercises.map((exercise, idx) => (
              <View key={exercise.id} style={styles.exerciseRow}>
                <View style={styles.exerciseReorder}>
                  <TouchableOpacity
                    onPress={() => moveExercise(idx, -1)}
                    disabled={idx === 0}
                    style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
                  >
                    <ArrowUp size={16} color={idx === 0 ? COLORS.textMuted : COLORS.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveExercise(idx, 1)}
                    disabled={idx === exercises.length - 1}
                    style={[styles.reorderBtn, idx === exercises.length - 1 && styles.reorderBtnDisabled]}
                  >
                    <ArrowDown size={16} color={idx === exercises.length - 1 ? COLORS.textMuted : COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <View style={styles.muscleBadge}>
                      <Text style={styles.muscleBadgeText}>{exercise.muscleGroup}</Text>
                    </View>
                    <View style={styles.setsRepsRow}>
                      <TouchableOpacity onPress={() => adjustSets(idx, -1)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.setsRepsText}>{exercise.sets}x{exercise.targetReps}</Text>
                      <TouchableOpacity onPress={() => adjustSets(idx, 1)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => removeExercise(idx)}
                  style={styles.removeBtn}
                >
                  <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}

            {exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Dumbbell size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No exercises yet</Text>
                <Text style={styles.emptySubtext}>Tap "Add" to add exercises</Text>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        {step === 1 ? (
          <TouchableOpacity
            style={[styles.primaryButton, !canProceed && styles.primaryButtonDisabled]}
            onPress={goToStep2}
            disabled={!canProceed}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
            <ChevronRight size={20} color={canProceed ? COLORS.textOnPrimary : COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, exercises.length === 0 && styles.primaryButtonDisabled]}
            onPress={saveWorkout}
            disabled={exercises.length === 0}
          >
            <Text style={styles.primaryButtonText}>Save Workout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        visible={showExerciseSearch}
        onClose={() => setShowExerciseSearch(false)}
        onSelect={addExercise}
        excludeExercises={exercises.map(e => e.name)}
      />
    </SafeAreaView>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceLight,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.surfaceLight,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sublabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
    marginTop: -4,
  },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedInfo: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  exerciseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
  },
  addExerciseBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseReorder: {
    marginRight: 10,
    gap: 4,
  },
  reorderBtn: {
    padding: 4,
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  muscleBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  setsRepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  setsRepsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    minWidth: 36,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateWorkoutScreen;
