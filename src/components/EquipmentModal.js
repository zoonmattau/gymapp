import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Check,
  Dumbbell,
  Activity,
  Settings,
  User,
  Circle,
  Minus,
  Square,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { EQUIPMENT_OPTIONS } from '../constants/experience';

const ICONS = {
  dumbbell: Dumbbell,
  activity: Activity,
  settings: Settings,
  user: User,
  circle: Circle,
  minus: Minus,
  square: Square,
};

const EquipmentModal = ({ visible, onClose, selectedEquipment = [], onToggle, onSave }) => {
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
            <Text style={styles.title}>Gym Equipment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select equipment you have access to. We'll customize your workouts accordingly.
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {EQUIPMENT_OPTIONS.map(equip => {
              const isSelected = selectedEquipment.includes(equip.id);
              const Icon = ICONS[equip.icon] || Dumbbell;

              return (
                <TouchableOpacity
                  key={equip.id}
                  style={[
                    styles.equipOption,
                    isSelected && styles.equipOptionSelected,
                  ]}
                  onPress={() => onToggle(equip.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                    ]}
                  >
                    <Icon
                      size={22}
                      color={isSelected ? COLORS.warning : COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.equipInfo}>
                    <Text
                      style={[
                        styles.equipName,
                        isSelected && styles.equipNameSelected,
                      ]}
                    >
                      {equip.name}
                    </Text>
                    <Text style={styles.equipDesc}>{equip.desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && <Check size={16} color={COLORS.text} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>
                Save ({selectedEquipment.length} selected)
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
    maxWidth: 400,
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
    maxHeight: 400,
  },
  equipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipOptionSelected: {
    backgroundColor: COLORS.warning + '15',
    borderColor: COLORS.warning,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.warning + '25',
  },
  equipInfo: {
    flex: 1,
  },
  equipName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  equipNameSelected: {
    color: COLORS.warning,
  },
  equipDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
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

export default EquipmentModal;
