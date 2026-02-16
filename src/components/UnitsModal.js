import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const UNIT_OPTIONS = [
  { id: 'metric', label: 'Metric', desc: 'Kilograms, centimeters' },
  { id: 'imperial', label: 'Imperial', desc: 'Pounds, inches' },
];

const UnitsModal = ({ visible, onClose, currentUnit, onSelect }) => {
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
            <Text style={styles.title}>Units</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose your preferred measurement units
          </Text>

          <View style={styles.content}>
            {UNIT_OPTIONS.map(unit => {
              const isSelected = currentUnit === unit.id;
              return (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.unitOption,
                    isSelected && styles.unitOptionSelected,
                  ]}
                  onPress={() => onSelect(unit.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.unitInfo}>
                    <Text
                      style={[
                        styles.unitLabel,
                        isSelected && styles.unitLabelSelected,
                      ]}
                    >
                      {unit.label}
                    </Text>
                    <Text style={styles.unitDesc}>{unit.desc}</Text>
                  </View>
                  {isSelected && <Check size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Done Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
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
    maxWidth: 340,
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
    paddingBottom: 8,
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  unitInfo: {
    flex: 1,
  },
  unitLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  unitLabelSelected: {
    color: COLORS.primary,
  },
  unitDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UnitsModal;
