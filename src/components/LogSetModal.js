import React, { useState, useEffect, useRef } from 'react';
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
import { X, Plus, Minus, Check, Play, Square, RotateCcw } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { EXERCISES } from '../constants/exercises';

// Exercises that can have assisted or added weight
const ASSISTED_WEIGHT_EXERCISES = [
  'Pull Ups', 'Chin Ups', 'Neutral Grip Pull Ups', 'Chin Up (Close Grip)',
  'Chest Dips', 'Tricep Dips', 'Bench Dips', 'Towel Pull Ups',
  'Dips', 'Wide Grip Pull Ups', 'Muscle Ups',
];

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
  editData = null, // { rpe, setType, supersetExercise, supersetWeight, supersetReps, drops, weightMode }
  isTimedExercise = false,
}) => {
  const supportsAssistedWeight = ASSISTED_WEIGHT_EXERCISES.some(
    ex => exerciseName?.toLowerCase().includes(ex.toLowerCase()) || ex.toLowerCase().includes(exerciseName?.toLowerCase() || '')
  );
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);
  const [rpe, setRpe] = useState(null);
  const [setType, setSetType] = useState(null); // null, 'warmup', 'superset', 'dropset'
  const [supersetExercise, setSupersetExercise] = useState(null);
  const [supersetWeight, setSupersetWeight] = useState('');
  const [supersetReps, setSupersetReps] = useState('');
  const [drops, setDrops] = useState([{ weight: '', reps: '' }]);
  const [isAmrap, setIsAmrap] = useState(false);
  const [weightMode, setWeightMode] = useState(null); // 'added' or 'assisted' for bodyweight exercises
  const [hasInitialized, setHasInitialized] = useState(false);
  const [supersetTimerRunning, setSupersetTimerRunning] = useState(false);
  const [supersetElapsedSeconds, setSupersetElapsedSeconds] = useState(0);
  const supersetTimerRef = useRef(null);

  // Check if superset exercise is timed (isometric)
  const isSupersetTimed = supersetExercise
    ? EXERCISES.find(e => e.name.toLowerCase() === supersetExercise.toLowerCase())?.type === 'Isometric'
    : false;

  // Reset state when modal opens fresh (not returning from superset)
  useEffect(() => {
    if (visible && !isReturningFromSuperset && !hasInitialized) {
      setWeight(initialWeight);
      setReps(initialReps);
      if (isEdit && editData) {
        // Restore all fields from the set being edited
        setRpe(editData.rpe || null);
        setSetType(editData.setType || null);
        setSupersetExercise(editData.supersetExercise || null);
        setSupersetWeight(editData.supersetWeight?.toString() || '');
        setSupersetReps(editData.supersetReps?.toString() || '');
        setDrops(editData.drops?.length > 0 ? editData.drops : [{ weight: '', reps: '' }]);
        setWeightMode(editData.weightMode || null);
        setIsAmrap(editData.isAmrap || false);
      } else {
        setRpe(null);
        setSetType(setNumber === 1 ? 'warmup' : null);
        setSupersetExercise(null);
        setSupersetWeight('');
        setSupersetReps('');
        setDrops([{ weight: '', reps: '' }]);
        setWeightMode(null);
        setIsAmrap(false);
      }
      setHasInitialized(true);
    }
  }, [visible, initialWeight, initialReps, isReturningFromSuperset, hasInitialized, isEdit, editData]);

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
      // Stop and reset stopwatch when modal closes
      setTimerRunning(false);
      setElapsedSeconds(0);
      clearInterval(timerIntervalRef.current);
    }
  }, [visible]);

  // Initialize elapsedSeconds from initialReps when editing a timed exercise
  useEffect(() => {
    if (visible && isTimedExercise && isEdit && initialReps) {
      setElapsedSeconds(parseInt(initialReps) || 0);
    }
  }, [visible, isTimedExercise, isEdit, initialReps]);

  // Stopwatch interval
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  // Sync elapsedSeconds to reps for timed exercises (so handleSave sends it)
  useEffect(() => {
    if (isTimedExercise) {
      setReps(elapsedSeconds.toString());
    }
  }, [elapsedSeconds, isTimedExercise]);

  // Superset timer interval
  useEffect(() => {
    if (supersetTimerRunning) {
      supersetTimerRef.current = setInterval(() => {
        setSupersetElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(supersetTimerRef.current);
    }
    return () => clearInterval(supersetTimerRef.current);
  }, [supersetTimerRunning]);

  // Sync supersetElapsedSeconds to supersetReps for timed superset exercises
  useEffect(() => {
    if (isSupersetTimed) {
      setSupersetReps(supersetElapsedSeconds.toString());
    }
  }, [supersetElapsedSeconds, isSupersetTimed]);

  // Reset superset timer when superset exercise changes
  useEffect(() => {
    setSupersetTimerRunning(false);
    setSupersetElapsedSeconds(0);
    clearInterval(supersetTimerRef.current);
  }, [supersetExercise]);

  // Clean up superset timer when modal closes
  useEffect(() => {
    if (!visible) {
      setSupersetTimerRunning(false);
      setSupersetElapsedSeconds(0);
      clearInterval(supersetTimerRef.current);
    }
  }, [visible]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustDuration = (delta) => {
    setElapsedSeconds(prev => Math.max(0, prev + delta));
  };

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
      weight: weight === 'BW' ? 'BW' : (parseFloat(weight) || 0),
      isBodyweight: weight === 'BW',
      weightMode: supportsAssistedWeight ? weightMode : null, // 'added' or 'assisted'
      reps: parseInt(reps) || 0,
      rpe,
      setType,
      isWarmup: setType === 'warmup',
      supersetExercise: setType === 'superset' ? supersetExercise : null,
      supersetWeight: setType === 'superset' ? (supersetWeight === 'BW' ? 'BW' : (parseFloat(supersetWeight) || 0)) : null,
      supersetReps: setType === 'superset' ? (parseInt(supersetReps) || 0) : null,
      drops: setType === 'dropset' ? drops : null,
      isAmrap,
    };
    onSave(setData);
    onClose();
  };

  const hasValidDrops = setType === 'dropset' && drops.some(d => parseFloat(d.weight) > 0 && parseInt(d.reps) > 0);
  const hasValidMainSet = isTimedExercise
    ? elapsedSeconds > 0
    : (parseFloat(weight) > 0 || weight === 'BW') && parseInt(reps) > 0;
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
            {/* Bodyweight Option */}
            <TouchableOpacity
              style={[
                styles.bodyweightButton,
                weight === 'BW' && styles.bodyweightButtonSelected,
              ]}
              onPress={() => setWeight(weight === 'BW' ? '' : 'BW')}
            >
              <Text style={[
                styles.bodyweightText,
                weight === 'BW' && styles.bodyweightTextSelected,
              ]}>
                Bodyweight
              </Text>
            </TouchableOpacity>

            {/* Assisted/Added Weight Toggle for bodyweight exercises */}
            {supportsAssistedWeight && weight !== 'BW' && parseFloat(weight) > 0 && (
              <View style={styles.weightModeContainer}>
                <Text style={styles.weightModeLabel}>Weight Type</Text>
                <View style={styles.weightModeRow}>
                  <TouchableOpacity
                    style={[
                      styles.weightModeButton,
                      weightMode === 'added' && styles.weightModeButtonActive,
                    ]}
                    onPress={() => setWeightMode(weightMode === 'added' ? null : 'added')}
                  >
                    <Text style={[
                      styles.weightModeText,
                      weightMode === 'added' && styles.weightModeTextActive,
                    ]}>
                      + Added
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.weightModeButton,
                      weightMode === 'assisted' && styles.weightModeAssistedActive,
                    ]}
                    onPress={() => setWeightMode(weightMode === 'assisted' ? null : 'assisted')}
                  >
                    <Text style={[
                      styles.weightModeText,
                      weightMode === 'assisted' && styles.weightModeTextActive,
                    ]}>
                      − Assisted
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reps or Duration Input */}
            {isTimedExercise ? (
              <>
                <Text style={styles.inputLabel}>Duration</Text>
                {/* Stopwatch Display */}
                <View style={styles.stopwatchDisplay}>
                  <Text style={styles.stopwatchTime}>{formatDuration(elapsedSeconds)}</Text>
                </View>
                {/* Stopwatch Controls */}
                <View style={styles.stopwatchControls}>
                  <TouchableOpacity
                    style={[styles.stopwatchButton, timerRunning ? styles.stopwatchButtonStop : styles.stopwatchButtonStart]}
                    onPress={() => setTimerRunning(!timerRunning)}
                  >
                    {timerRunning ? (
                      <Square size={20} color={COLORS.textOnPrimary} />
                    ) : (
                      <Play size={20} color={COLORS.textOnPrimary} />
                    )}
                    <Text style={styles.stopwatchButtonText}>{timerRunning ? 'Stop' : 'Start'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stopwatchResetButton}
                    onPress={() => {
                      setTimerRunning(false);
                      setElapsedSeconds(0);
                    }}
                  >
                    <RotateCcw size={20} color={COLORS.textMuted} />
                    <Text style={styles.stopwatchResetText}>Reset</Text>
                  </TouchableOpacity>
                </View>
                {/* Manual +/- adjustment */}
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => adjustDuration(-5)}
                  >
                    <Minus size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.mainInput}>{elapsedSeconds}s</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => adjustDuration(5)}
                  >
                    <Plus size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.inputLabel, { textAlign: 'center', marginTop: -4 }]}>Adjust by 5 seconds</Text>
              </>
            ) : (
              <>
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
                {/* AMRAP Toggle */}
                <TouchableOpacity
                  style={[
                    styles.amrapButton,
                    isAmrap && styles.amrapButtonSelected,
                  ]}
                  onPress={() => setIsAmrap(!isAmrap)}
                >
                  <Text style={[
                    styles.amrapText,
                    isAmrap && styles.amrapTextSelected,
                  ]}>
                    AMRAP
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
                // Light-to-dark blue scale per RPE value
                const t = Math.min(1, Math.max(0, (value - 1) / 9));
                const lightness = 75 - t * 55;
                const rpeColor = `hsl(195, 65%, ${lightness}%)`;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.rpeButton,
                      rpe === value && { backgroundColor: rpeColor },
                    ]}
                    onPress={() => setRpe(rpe === value ? null : value)}
                    onClick={() => setRpe(rpe === value ? null : value)}
                  >
                    <Text style={[
                      styles.rpeText,
                      rpe === value && { color: lightness < 45 ? '#fff' : '#0C3547' },
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
                  setType === 'warmup' && styles.setTypeWarmupSelected,
                ]}
                onPress={() => setSetType(setType === 'warmup' ? null : 'warmup')}
              >
                <Text style={[
                  styles.setTypeText,
                  setType === 'warmup' && styles.setTypeTextSelected,
                ]}>
                  Warmup
                </Text>
              </TouchableOpacity>
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
                      backgroundColor: COLORS.surfaceLight,
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

                {/* Superset Weight & Reps/Duration - show after exercise is selected */}
                {supersetExercise && (
                  <>
                    {!isSupersetTimed && (
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
                        {/* Bodyweight Option for Superset */}
                        <TouchableOpacity
                          style={[
                            styles.bodyweightButton,
                            supersetWeight === 'BW' && styles.bodyweightButtonSelected,
                          ]}
                          onPress={() => setSupersetWeight(supersetWeight === 'BW' ? '' : 'BW')}
                        >
                          <Text style={[
                            styles.bodyweightText,
                            supersetWeight === 'BW' && styles.bodyweightTextSelected,
                          ]}>
                            Bodyweight
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {isSupersetTimed ? (
                      <>
                        <Text style={styles.inputLabel}>Duration</Text>
                        <View style={styles.stopwatchDisplay}>
                          <Text style={styles.stopwatchTime}>{formatDuration(supersetElapsedSeconds)}</Text>
                        </View>
                        <View style={styles.stopwatchControls}>
                          <TouchableOpacity
                            style={[styles.stopwatchButton, supersetTimerRunning ? styles.stopwatchButtonStop : styles.stopwatchButtonStart]}
                            onPress={() => setSupersetTimerRunning(!supersetTimerRunning)}
                          >
                            {supersetTimerRunning ? (
                              <Square size={20} color={COLORS.textOnPrimary} />
                            ) : (
                              <Play size={20} color={COLORS.textOnPrimary} />
                            )}
                            <Text style={styles.stopwatchButtonText}>{supersetTimerRunning ? 'Stop' : 'Start'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.stopwatchResetButton}
                            onPress={() => {
                              setSupersetTimerRunning(false);
                              setSupersetElapsedSeconds(0);
                            }}
                          >
                            <RotateCcw size={20} color={COLORS.textMuted} />
                            <Text style={styles.stopwatchResetText}>Reset</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.inputRow}>
                          <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={() => setSupersetElapsedSeconds(prev => Math.max(0, prev - 5))}
                          >
                            <Minus size={24} color={COLORS.text} />
                          </TouchableOpacity>
                          <View style={styles.inputWrapper}>
                            <Text style={styles.mainInput}>{supersetElapsedSeconds}s</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.adjustButton}
                            onPress={() => setSupersetElapsedSeconds(prev => prev + 5)}
                          >
                            <Plus size={24} color={COLORS.text} />
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.inputLabel, { textAlign: 'center', marginTop: -4 }]}>Adjust by 5 seconds</Text>
                      </>
                    ) : (
                      <>
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
            <Check size={20} color={COLORS.textOnPrimary} />
            <Text style={styles.logButtonText}>{isEdit ? 'Update Set' : 'Log Set'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
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

  // Stopwatch
  stopwatchDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stopwatchTime: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  stopwatchControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stopwatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stopwatchButtonStart: {
    backgroundColor: COLORS.success,
  },
  stopwatchButtonStop: {
    backgroundColor: COLORS.error,
  },
  stopwatchButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stopwatchResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  stopwatchResetText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },

  // Bodyweight
  bodyweightButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  bodyweightButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  bodyweightText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  bodyweightTextSelected: {
    color: COLORS.textOnPrimary,
  },

  // AMRAP
  amrapButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  amrapButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  amrapText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  amrapTextSelected: {
    color: '#FFFFFF',
  },

  // Weight Mode (assisted/added)
  weightModeContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  weightModeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  weightModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  weightModeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    minWidth: 100,
    alignItems: 'center',
  },
  weightModeButtonActive: {
    backgroundColor: COLORS.success,
  },
  weightModeAssistedActive: {
    backgroundColor: COLORS.info || '#3B82F6',
  },
  weightModeText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  weightModeTextActive: {
    color: COLORS.textOnPrimary,
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
    color: COLORS.textOnPrimary,
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
  setTypeWarmupSelected: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  setTypeSupersetSelected: {
    backgroundColor: '#D97706',
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
    color: COLORS.textOnPrimary,
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
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LogSetModal;
