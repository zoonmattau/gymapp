import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { X, Plus, Minus, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const LogSetModal = ({
  visible,
  onClose,
  onSave,
  exerciseName,
  setNumber,
  initialWeight = '',
  initialReps = '',
  weightUnit = 'kg',
  onSelectSupersetExercise,
  pendingSupersetExercise = null, // Exercise selected from superset flow
  isReturningFromSuperset = false,
  isEdit = false,
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [rpe, setRpe] = useState(null);
  const [setType, setSetType] = useState(null); // null, 'superset', 'dropset'
  const [supersetExercise, setSupersetExercise] = useState(null);
  const [supersetWeight, setSupersetWeight] = useState('');
  const [supersetReps, setSupersetReps] = useState('');
  const [drops, setDrops] = useState([{ weight: '', reps: '' }]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset state when modal opens fresh (not returning from superset)
  useEffect(() => {
    if (visible && !isReturningFromSuperset && !hasInitialized) {
      setWeight(initialWeight);
      setReps(initialReps);
      setRpe(null);
      setSetType(null);
      setSupersetExercise(null);
      setSupersetWeight('');
      setSupersetReps('');
      setDrops([{ weight: '', reps: '' }]);
      setHasInitialized(true);
    }
  }, [visible, initialWeight, initialReps, isReturningFromSuperset, hasInitialized]);

  // Handle returning from superset selection
  useEffect(() => {
    if (visible && isReturningFromSuperset && pendingSupersetExercise) {
      setSupersetExercise(pendingSupersetExercise);
      setSetType('superset');
    }
  }, [visible, isReturningFromSuperset, pendingSupersetExercise]);

  // Reset hasInitialized when modal closes
  useEffect(() => {
    if (!visible) {
      setHasInitialized(false);
    }
  }, [visible]);

  const adjustWeight = (delta) => {
    const current = parseFloat(weight) || 0;
    const newWeight = Math.max(0, current + delta);
    setWeight(newWeight % 1 === 0 ? newWeight.toString() : newWeight.toFixed(1));
  };

  const adjustReps = (delta) => {
    const current = parseInt(reps) || 0;
    const newReps = Math.max(0, current + delta);
    setReps(newReps.toString());
  };

  const adjustDropWeight = (index, delta) => {
    const newDrops = [...drops];
    const current = parseFloat(newDrops[index].weight) || 0;
    const newWeight = Math.max(0, current + delta);
    newDrops[index].weight = newWeight % 1 === 0 ? newWeight.toString() : newWeight.toFixed(1);
    setDrops(newDrops);
  };

  const adjustDropReps = (index, delta) => {
    const newDrops = [...drops];
    const current = parseInt(newDrops[index].reps) || 0;
    const newReps = Math.max(0, current + delta);
    newDrops[index].reps = newReps.toString();
    setDrops(newDrops);
  };

  const adjustSupersetWeight = (delta) => {
    const current = parseFloat(supersetWeight) || 0;
    const newWeight = Math.max(0, current + delta);
    setSupersetWeight(newWeight % 1 === 0 ? newWeight.toString() : newWeight.toFixed(1));
  };

  const adjustSupersetReps = (delta) => {
    const current = parseInt(supersetReps) || 0;
    const newReps = Math.max(0, current + delta);
    setSupersetReps(newReps.toString());
  };

  const updateDropField = (index, field, value) => {
    const newDrops = [...drops];
    newDrops[index][field] = value;
    setDrops(newDrops);
  };

  const addDrop = () => {
    // Calculate suggested values from previous drop (or main set for first drop)
    const lastDrop = drops[drops.length - 1];
    const prevWeight = parseFloat(lastDrop.weight) || parseFloat(weight) || 0;
    const prevReps = lastDrop.reps || reps || '';
    const suggestedWeight = Math.round((prevWeight * 0.75) * 2) / 2; // Round to nearest 0.5
    setDrops([...drops, { weight: suggestedWeight > 0 ? suggestedWeight.toString() : '', reps: prevReps }]);
  };

  const handleSave = () => {
    const setData = {
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe,
      setType,
      supersetExercise: setType === 'superset' ? supersetExercise : null,
      supersetWeight: setType === 'superset' ? (parseFloat(supersetWeight) || 0) : null,
      supersetReps: setType === 'superset' ? (parseInt(supersetReps) || 0) : null,
      drops: setType === 'dropset' ? drops : null,
    };
    onSave(setData);
    onClose();
  };

  const hasValidDrops = setType === 'dropset' && drops.some(d => parseFloat(d.weight) > 0 && parseInt(d.reps) > 0);
  const hasValidMainSet = parseFloat(weight) > 0 && parseInt(reps) > 0;
  const canSave = hasValidMainSet || hasValidDrops;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{exerciseName} - Set {setNumber}</Text>
            <Text style={styles.subtitle}>{isEdit ? 'Edit set details' : 'Log your performance'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* SET DETAILS Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SET DETAILS</Text>

            {/* Weight Input */}
            <Text style={styles.inputLabel}>Weight ({weightUnit})</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustWeight(-2.5)}
              >
                <Minus size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.mainInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  textAlign="center"
                />
              </View>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustWeight(2.5)}
              >
                <Plus size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Reps Input */}
            <Text style={styles.inputLabel}>Reps</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustReps(-1)}
              >
                <Minus size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.mainInput}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  textAlign="center"
                />
              </View>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustReps(1)}
              >
                <Plus size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* RPE Section */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>RPE (Rate of Perceived Exertion)</Text>
            <View style={styles.rpeRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                const rpeDescriptions = {
                  1: 'Very light',
                  2: 'Light',
                  3: 'Light',
                  4: 'Moderate',
                  5: 'Moderate',
                  6: '4+ reps left',
                  7: '3 reps left',
                  8: '2 reps left',
                  9: '1 rep left',
                  10: 'Max effort',
                };
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.rpeButton,
                      rpe === value && styles.rpeButtonSelected,
                    ]}
                    onPress={() => setRpe(rpe === value ? null : value)}
                    onClick={() => setRpe(rpe === value ? null : value)}
                  >
                    <Text style={[
                      styles.rpeText,
                      rpe === value && styles.rpeTextSelected,
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* RPE Description */}
            {rpe && (
              <View style={styles.rpeDescriptionContainer}>
                <Text style={styles.rpeDescriptionText}>
                  {rpe <= 2 && 'Very light effort - Could do many more reps'}
                  {rpe >= 3 && rpe <= 4 && 'Light effort - Comfortable, warm-up weight'}
                  {rpe === 5 && 'Moderate effort - Starting to feel it'}
                  {rpe === 6 && 'Could do 4+ more reps with good form'}
                  {rpe === 7 && 'Could do 3 more reps with good form'}
                  {rpe === 8 && 'Could do 2 more reps with good form'}
                  {rpe === 9 && 'Could do 1 more rep - Near failure'}
                  {rpe === 10 && 'Maximum effort - Could not do another rep'}
                </Text>
              </View>
            )}
          </View>

          {/* Set Type Section */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Set Type (optional)</Text>
            <View style={styles.setTypeRow}>
              <TouchableOpacity
                style={[
                  styles.setTypeButton,
                  setType === 'superset' && styles.setTypeSupersetSelected,
                ]}
                onPress={() => setSetType(setType === 'superset' ? null : 'superset')}
              >
                <Text style={[
                  styles.setTypeText,
                  setType === 'superset' && styles.setTypeTextSelected,
                ]}>
                  Superset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.setTypeButton,
                  setType === 'dropset' && styles.setTypeDropsetSelected,
                ]}
                onPress={() => {
                  if (setType === 'dropset') {
                    setSetType(null);
                  } else {
                    setSetType('dropset');
                    // Pre-populate first drop with 75% weight and same reps
                    const mainWeight = parseFloat(weight) || 0;
                    const mainReps = reps || '';
                    const suggestedWeight = Math.round((mainWeight * 0.75) * 2) / 2;
                    setDrops([{ weight: suggestedWeight > 0 ? suggestedWeight.toString() : '', reps: mainReps }]);
                  }
                }}
              >
                <Text style={[
                  styles.setTypeText,
                  setType === 'dropset' && styles.setTypeTextSelected,
                ]}>
                  Dropset
                </Text>
              </TouchableOpacity>
            </View>

            {/* Superset Exercise Selector */}
            {setType === 'superset' && (
              <View style={styles.supersetContainer}>
                <Text style={styles.supersetLabel}>SUPERSET WITH</Text>
                {Platform.OS === 'web' ? (
                  <div
                    style={{
                      backgroundColor: '#1E2024',
                      borderRadius: 8,
                      padding: 14,
                      cursor: 'pointer',
                      marginBottom: supersetExercise ? 16 : 0,
                    }}
                    onClick={() => onSelectSupersetExercise && onSelectSupersetExercise()}
                  >
                    <Text style={supersetExercise ? styles.supersetExerciseText : styles.supersetPlaceholder}>
                      {supersetExercise || 'Tap to select exercise...'}
                    </Text>
                  </div>
                ) : (
                  <TouchableOpacity
                    style={[styles.supersetSelector, supersetExercise && { marginBottom: 16 }]}
                    onPress={() => onSelectSupersetExercise && onSelectSupersetExercise()}
                  >
                    <Text style={supersetExercise ? styles.supersetExerciseText : styles.supersetPlaceholder}>
                      {supersetExercise || 'Tap to select exercise...'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Superset Weight & Reps - show after exercise is selected */}
                {supersetExercise && (
                  <>
                    <Text style={styles.inputLabel}>Weight ({weightUnit})</Text>
                    <View style={styles.inputRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustSupersetWeight(-2.5)}
                      >
                        <Minus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          value={supersetWeight}
                          onChangeText={setSupersetWeight}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textMuted}
                          textAlign="center"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustSupersetWeight(2.5)}
                      >
                        <Plus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Reps</Text>
                    <View style={styles.inputRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustSupersetReps(-1)}
                      >
                        <Minus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          value={supersetReps}
                          onChangeText={setSupersetReps}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textMuted}
                          textAlign="center"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustSupersetReps(1)}
                      >
                        <Plus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Dropset Entries */}
            {setType === 'dropset' && (
              <View style={styles.dropsetContainer}>
                {drops.map((drop, index) => (
                  <View key={index} style={styles.dropEntry}>
                    <Text style={styles.dropLabel}>DROP {index + 1}</Text>

                    {/* Drop Weight */}
                    <Text style={styles.dropInputLabel}>Weight ({weightUnit})</Text>
                    <View style={styles.inputRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustDropWeight(index, -2.5)}
                      >
                        <Minus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          value={drop.weight}
                          onChangeText={(val) => updateDropField(index, 'weight', val)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textMuted}
                          textAlign="center"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustDropWeight(index, 2.5)}
                      >
                        <Plus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Drop Reps */}
                    <Text style={styles.dropInputLabel}>Reps</Text>
                    <View style={styles.inputRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustDropReps(index, -1)}
                      >
                        <Minus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          value={drop.reps}
                          onChangeText={(val) => updateDropField(index, 'reps', val)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textMuted}
                          textAlign="center"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => adjustDropReps(index, 1)}
                      >
                        <Plus size={24} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add Another Drop Button */}
                <TouchableOpacity style={styles.addDropButton} onPress={addDrop}>
                  <Plus size={18} color={COLORS.error} />
                  <Text style={styles.addDropText}>Add Another Drop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Log Set Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.logButton, !canSave && styles.logButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Check size={20} color={COLORS.text} />
            <Text style={styles.logButtonText}>{isEdit ? 'Update Set' : 'Log Set'}</Text>
          </TouchableOpacity>
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
  webContainer: {
    backgroundColor: COLORS.background,
    marginTop: 50,
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: 500,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
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
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  mainInput: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // RPE
  rpeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rpeButton: {
    width: 30,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpeButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  rpeText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  rpeTextSelected: {
    color: COLORS.text,
  },
  rpeDescriptionContainer: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  rpeDescriptionText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },

  // Set Type
  setTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  setTypeButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setTypeSupersetSelected: {
    backgroundColor: '#D97706', // Darker amber/yellow
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  setTypeDropsetSelected: {
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  setTypeText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  setTypeTextSelected: {
    color: COLORS.text,
  },

  // Superset
  supersetContainer: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D97706', // Darker amber/yellow
  },
  supersetLabel: {
    color: '#D97706', // Darker amber/yellow
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  supersetSelector: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 14,
  },
  supersetPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  supersetExerciseText: {
    color: COLORS.text,
    fontSize: 16,
  },

  // Dropset
  dropsetContainer: {
    marginTop: 16,
  },
  dropEntry: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dropLabel: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dropInputLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  addDropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.error,
    borderStyle: 'dashed',
  },
  addDropText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 16,
  },
  logButtonDisabled: {
    opacity: 0.5,
  },
  logButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LogSetModal;
