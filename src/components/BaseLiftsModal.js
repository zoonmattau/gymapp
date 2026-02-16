import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const LIFT_GROUPS = [
  {
    category: 'PUSH',
    lifts: [
      { key: 'bench', label: 'Bench Press' },
      { key: 'dbPress', label: 'Dumbbell Press' },
      { key: 'ohp', label: 'Overhead Press' },
    ],
  },
  {
    category: 'PULL',
    lifts: [
      { key: 'deadlift', label: 'Deadlift' },
      { key: 'row', label: 'Barbell Row' },
      { key: 'pullup', label: 'Pull-up / Lat Pulldown' },
    ],
  },
  {
    category: 'LEGS',
    lifts: [
      { key: 'squat', label: 'Squat' },
      { key: 'legPress', label: 'Leg Press' },
      { key: 'rdl', label: 'Romanian Deadlift' },
    ],
  },
  {
    category: 'ARMS',
    lifts: [{ key: 'curl', label: 'Bicep Curl' }],
  },
];

const calculate1RM = (weight, reps) => {
  if (!weight || weight <= 0) return 0;
  if (!reps || reps <= 0) return weight;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

const BaseLiftsModal = ({ visible, onClose, initialData = {}, onSave }) => {
  const [localLifts, setLocalLifts] = useState({
    bench: { weight: '', reps: '' },
    dbPress: { weight: '', reps: '' },
    ohp: { weight: '', reps: '' },
    deadlift: { weight: '', reps: '' },
    row: { weight: '', reps: '' },
    pullup: { weight: '', reps: '' },
    squat: { weight: '', reps: '' },
    legPress: { weight: '', reps: '' },
    rdl: { weight: '', reps: '' },
    curl: { weight: '', reps: '' },
  });

  useEffect(() => {
    if (visible && initialData) {
      setLocalLifts({
        bench: { weight: initialData.bench?.weight || '', reps: initialData.bench?.reps || '' },
        dbPress: { weight: initialData.dbPress?.weight || '', reps: initialData.dbPress?.reps || '' },
        ohp: { weight: initialData.ohp?.weight || '', reps: initialData.ohp?.reps || '' },
        deadlift: { weight: initialData.deadlift?.weight || '', reps: initialData.deadlift?.reps || '' },
        row: { weight: initialData.row?.weight || '', reps: initialData.row?.reps || '' },
        pullup: { weight: initialData.pullup?.weight || '', reps: initialData.pullup?.reps || '' },
        squat: { weight: initialData.squat?.weight || '', reps: initialData.squat?.reps || '' },
        legPress: { weight: initialData.legPress?.weight || '', reps: initialData.legPress?.reps || '' },
        rdl: { weight: initialData.rdl?.weight || '', reps: initialData.rdl?.reps || '' },
        curl: { weight: initialData.curl?.weight || '', reps: initialData.curl?.reps || '' },
      });
    }
  }, [visible, initialData]);

  const updateLift = (key, field, value) => {
    const val = value.replace(/[^0-9.]/g, '');
    setLocalLifts(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: val },
    }));
  };

  const handleSave = () => {
    onSave(localLifts);
    onClose();
  };

  const countLiftsSet = () => {
    let count = 0;
    Object.values(localLifts).forEach(lift => {
      if (lift.weight && lift.reps) count++;
    });
    return count;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Base Lifts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Enter weight and reps to calculate your 1RM for weight suggestions.
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {LIFT_GROUPS.map(group => (
              <View key={group.category} style={styles.groupContainer}>
                <Text style={styles.groupLabel}>{group.category}</Text>
                {group.lifts.map(lift => {
                  const liftData = localLifts[lift.key];
                  const estimated1RM =
                    liftData?.weight && liftData?.reps
                      ? Math.round(
                          calculate1RM(
                            parseFloat(liftData.weight),
                            parseFloat(liftData.reps)
                          )
                        )
                      : null;

                  return (
                    <View key={lift.key} style={styles.liftRow}>
                      <View style={styles.liftHeader}>
                        <Text style={styles.liftLabel}>{lift.label}</Text>
                        {estimated1RM && (
                          <View style={styles.rmBadge}>
                            <Text style={styles.rmText}>~{estimated1RM}kg 1RM</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={styles.input}
                          value={liftData?.weight || ''}
                          onChangeText={val => updateLift(lift.key, 'weight', val)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textMuted}
                          textAlign="center"
                        />
                        <Text style={styles.unitText}>kg</Text>
                        <Text style={styles.timesText}>x</Text>
                        <TextInput
                          style={[styles.input, styles.repsInput]}
                          value={liftData?.reps || ''}
                          onChangeText={val => updateLift(lift.key, 'reps', val)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textMuted}
                          textAlign="center"
                        />
                        <Text style={styles.unitText}>reps</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                Save ({countLiftsSet()} lifts set)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
    maxHeight: 450,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  liftRow: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  liftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liftLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rmBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rmText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    width: 60,
    height: 40,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  repsInput: {
    width: 50,
  },
  unitText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 6,
    marginRight: 10,
  },
  timesText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginRight: 10,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BaseLiftsModal;
