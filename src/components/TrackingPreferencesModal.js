import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';

const TrackingPreferencesModal = ({ visible, onClose, preferences, onToggle }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  const TRACKING_OPTIONS = [
    { id: 'calories', label: 'Calories', desc: 'Track daily calorie intake' },
    { id: 'macros', label: 'Macros', desc: 'Track protein, carbs, and fats' },
    { id: 'water', label: 'Water', desc: 'Track daily water intake' },
    { id: 'sleep', label: 'Sleep', desc: 'Track sleep duration and quality' },
    { id: 'supplements', label: 'Supplements', desc: 'Track daily supplement intake' },
  ];

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
            <Text style={styles.title}>Tracking Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose what you want to track. Disabled items won't appear in your dashboard.
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {TRACKING_OPTIONS.map(tracking => {
              const isEnabled = preferences?.[tracking.id] !== false;

              return (
                <View key={tracking.id} style={styles.trackingRow}>
                  <View style={styles.trackingInfo}>
                    <Text style={styles.trackingLabel}>{tracking.label}</Text>
                    <Text style={styles.trackingDesc}>{tracking.desc}</Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => onToggle(tracking.id)}
                    trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
                    thumbColor={COLORS.text}
                  />
                </View>
              );
            })}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Workouts are always tracked. Disabling a category will hide it from your home screen.
              </Text>
            </View>
          </ScrollView>

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

const getStyles = (COLORS) => StyleSheet.create({
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
    maxHeight: '80%',
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
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  trackingDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    color: COLORS.warning,
    fontSize: 13,
    lineHeight: 18,
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
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackingPreferencesModal;
