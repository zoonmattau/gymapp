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
  ScrollView,
} from 'react-native';
import { X, Scale, Plus, Minus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';

// Helper to get local date string (YYYY-MM-DD) - avoids UTC timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WeighInModal = ({ visible, onClose, onSave, unit = 'kg', currentWeight = 0, lastWeighInDate = null, weightHistory = [], weightDirection }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const [weight, setWeight] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Set initial weight and date when modal opens
  useEffect(() => {
    if (visible) {
      console.log('WeighInModal opened with currentWeight:', currentWeight, 'unit:', unit);
      // Always set weight when modal opens (even if 0, user can adjust)
      if (currentWeight > 0) {
        setWeight(currentWeight.toString());
      } else {
        setWeight(''); // Reset to empty if no current weight
      }

      // Always default to today
      setSelectedDate(new Date());
    }
  }, [visible, currentWeight, lastWeighInDate]);

  const handleSave = () => {
    const weightValue = parseFloat(weight);
    if (weightValue > 0) {
      const dateStr = getLocalDateString(selectedDate);
      onSave(weightValue, unit, dateStr);
      onClose();
      setWeight('');
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const formatSelectedDate = () => {
    if (isToday()) {
      return 'Today';
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const adjustWeight = (delta) => {
    const current = parseFloat(weight) || 0;
    const newWeight = Math.max(0, current + delta);
    setWeight(newWeight.toFixed(1));
  };

  if (!visible) return null;

  // Modal content - same for web and native
  const modalContent = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Log Weigh-In</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
              {currentWeight > 0 && weight && parseFloat(weight) !== currentWeight && (() => {
                const gained = parseFloat(weight) > currentWeight;
                const wantToLose = weightDirection === 'lose';
                const isGood = gained ? !wantToLose : wantToLose;
                return (
                  <Text style={[
                    styles.weightDiff,
                    { color: isGood ? COLORS.success : '#EF4444' }
                  ]}>
                    {gained ? '+' : ''}
                    {(parseFloat(weight) - currentWeight).toFixed(1)} {unit}
                  </Text>
                );
              })()}
            </View>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustWeight(0.5)}
            >
              <Plus size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker */}
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Recording for</Text>
          <View style={styles.datePicker}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => changeDate(-1)}
            >
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateValue}>{formatSelectedDate()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.dateArrow, isToday() && styles.dateArrowDisabled]}
              onPress={() => changeDate(1)}
              disabled={isToday()}
            >
              <ChevronRight size={24} color={isToday() ? COLORS.textMuted : COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.dateHint}>Tap arrows to log past weigh-ins</Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !weight && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!weight}
        >
          <Text style={styles.saveButtonText}>Save Weigh-In</Text>
        </TouchableOpacity>

        {/* Recent Weigh-Ins */}
        {weightHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyLabel}>RECENT WEIGH-INS</Text>
            {weightHistory.slice(0, 5).map((entry, index) => {
              const date = new Date(entry.log_date + 'T00:00:00');
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const displayWeight = unit === 'lbs' ? (entry.weight * 2.205).toFixed(1) : entry.weight?.toFixed(1);
              const nextEntry = weightHistory[index + 1];
              const diff = nextEntry ? entry.weight - nextEntry.weight : 0;
              const diffDisplay = unit === 'lbs' ? (diff * 2.205).toFixed(1) : diff.toFixed(1);
              const selectedDateStr = getLocalDateString(selectedDate);
              const isSelected = entry.log_date === selectedDateStr;

              return (
                <View key={entry.id || index} style={[styles.historyRow, isSelected && styles.historyRowSelected]}>
                  <Text style={[styles.historyDate, isSelected && styles.historyTextSelected]}>{dateStr}</Text>
                  <Text style={[styles.historyWeight, isSelected && styles.historyTextSelected]}>{displayWeight} {unit}</Text>
                  {nextEntry && (
                    <Text style={[
                      styles.historyDiff,
                      { color: diff > 0 ? COLORS.success : diff < 0 ? COLORS.primary : COLORS.textMuted },
                      isSelected && styles.historyTextSelected
                    ]}>
                      {diff > 0 ? '+' : ''}{diffDisplay}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );

  // Use Modal for both web and native for consistent behavior
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.webOverlay}>
          <View style={styles.webModalContent}>
            {modalContent}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {modalContent}
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
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
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 12,
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
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 16,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
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
  weightDiff: {
    fontSize: 14,
    fontWeight: '600',
    position: 'absolute',
    bottom: -4,
  },
  dateCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  dateLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrowDisabled: {
    opacity: 0.4,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  dateValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  dateHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  historySection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  historyLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: -8,
  },
  historyRowSelected: {
    backgroundColor: COLORS.primary + '20',
  },
  historyTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 13,
    width: 60,
  },
  historyWeight: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  historyDiff: {
    fontSize: 13,
    fontWeight: '500',
    width: 50,
    textAlign: 'right',
  },
});

export default WeighInModal;
