import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { X, Scale, Plus, Minus } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const WeighInModal = ({ visible, onClose, onSave, unit = 'kg', currentWeight = 0 }) => {
  const [weight, setWeight] = useState('');

  // Set initial weight when modal opens
  useEffect(() => {
    if (visible && currentWeight > 0) {
      setWeight(currentWeight.toString());
    }
  }, [visible, currentWeight]);

  const handleSave = () => {
    const weightValue = parseFloat(weight);
    if (weightValue > 0) {
      onSave(weightValue, unit);
      onClose();
      setWeight('');
    }
  };

  const adjustWeight = (delta) => {
    const current = parseFloat(weight) || 0;
    const newWeight = Math.max(0, current + delta);
    setWeight(newWeight.toFixed(1));
  };

  if (!visible) return null;

  // For web, render as an overlay instead of Modal
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOverlay}>
        <View style={styles.webModalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log Weigh-In</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Scale size={48} color={COLORS.primary} />
            </View>

            {/* Weight Input */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>YOUR WEIGHT ({unit.toUpperCase()})</Text>
              <View style={styles.weightRow}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustWeight(-0.5)}
                >
                  <Minus size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.weightInput}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={COLORS.textMuted}
                    textAlign="center"
                  />
                  <Text style={styles.unitLabel}>{unit}</Text>
                </View>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustWeight(0.5)}
                >
                  <Plus size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Today's Date */}
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>Recording for</Text>
              <Text style={styles.dateValue}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, !weight && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!weight}
            >
              <Scale size={20} color={COLORS.text} />
              <Text style={styles.saveButtonText}>Save Weigh-In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Weigh-In</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Scale size={48} color={COLORS.primary} />
          </View>

          {/* Weight Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>YOUR WEIGHT ({unit.toUpperCase()})</Text>
            <View style={styles.weightRow}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustWeight(-0.5)}
              >
                <Minus size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.weightInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textMuted}
                  textAlign="center"
                />
                <Text style={styles.unitLabel}>{unit}</Text>
              </View>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustWeight(0.5)}
              >
                <Plus size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Date */}
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>Recording for</Text>
            <Text style={styles.dateValue}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, !weight && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!weight}
          >
            <Scale size={20} color={COLORS.text} />
            <Text style={styles.saveButtonText}>Save Weigh-In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  webOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webModalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  weightInput: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
  unitLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  dateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dateLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WeighInModal;
