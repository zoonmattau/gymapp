import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Moon, Clock, Star } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const SleepEntryModal = ({ visible, onClose, onSave, existingData }) => {
  const [bedTime, setBedTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [hoursSlept, setHoursSlept] = useState('8');
  const [qualityRating, setQualityRating] = useState(3);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingData) {
      setBedTime(existingData.bedTime || '22:00');
      setWakeTime(existingData.wakeTime || '06:00');
      setHoursSlept(existingData.hoursSlept?.toString() || '8');
      setQualityRating(existingData.qualityRating || 3);
      setNotes(existingData.notes || '');
    }
  }, [existingData]);

  // Calculate hours from bed/wake times
  useEffect(() => {
    try {
      const [bedHour, bedMin] = bedTime.split(':').map(Number);
      const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

      let hours = wakeHour - bedHour;
      let mins = wakeMin - bedMin;

      if (hours < 0) hours += 24;
      if (mins < 0) {
        hours -= 1;
        mins += 60;
      }

      const totalHours = hours + mins / 60;
      setHoursSlept(totalHours.toFixed(1));
    } catch (e) {
      // Ignore parse errors
    }
  }, [bedTime, wakeTime]);

  const handleSave = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    onSave({
      date: dateStr,
      bedTime,
      wakeTime,
      hoursSlept: parseFloat(hoursSlept),
      qualityRating,
      notes,
    });
    onClose();
  };

  const renderQualityStars = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setQualityRating(star)}
            style={styles.starButton}
          >
            <Star
              size={32}
              color={star <= qualityRating ? '#F59E0B' : COLORS.surfaceLight}
              fill={star <= qualityRating ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getQualityLabel = () => {
    switch (qualityRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Great';
      case 5: return 'Excellent';
      default: return 'Good';
    }
  };

  const quickTimeOptions = [
    { label: '6h', hours: 6 },
    { label: '7h', hours: 7 },
    { label: '8h', hours: 8 },
    { label: '9h', hours: 9 },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Sleep</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Duration Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUICK LOG</Text>
            <View style={styles.quickButtons}>
              {quickTimeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.quickButton,
                    parseFloat(hoursSlept) === opt.hours && styles.quickButtonActive,
                  ]}
                  onPress={() => setHoursSlept(opt.hours.toString())}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      parseFloat(hoursSlept) === opt.hours && styles.quickButtonTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bed Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BED TIME (last night)</Text>
            <View style={styles.timeInputRow}>
              <View style={styles.timeIcon}>
                <Moon size={20} color={COLORS.sleep} />
              </View>
              <TextInput
                style={styles.timeInput}
                value={bedTime}
                onChangeText={setBedTime}
                placeholder="22:00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Wake Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WAKE TIME (this morning)</Text>
            <View style={styles.timeInputRow}>
              <View style={styles.timeIcon}>
                <Clock size={20} color={COLORS.warning} />
              </View>
              <TextInput
                style={styles.timeInput}
                value={wakeTime}
                onChangeText={setWakeTime}
                placeholder="06:00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Hours Slept */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HOURS SLEPT</Text>
            <View style={styles.hoursDisplay}>
              <Text style={styles.hoursValue}>{hoursSlept}</Text>
              <Text style={styles.hoursUnit}>hours</Text>
            </View>
          </View>

          {/* Sleep Quality */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SLEEP QUALITY</Text>
            {renderQualityStars()}
            <Text style={styles.qualityLabel}>{getQualityLabel()}</Text>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you sleep? Any disruptions?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Log Sleep</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: COLORS.sleep,
  },
  quickButtonText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  quickButtonTextActive: {
    color: COLORS.text,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  timeIcon: {
    marginRight: 12,
  },
  timeInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    paddingVertical: 16,
  },
  hoursDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 24,
    gap: 8,
  },
  hoursValue: {
    color: COLORS.sleep,
    fontSize: 48,
    fontWeight: 'bold',
  },
  hoursUnit: {
    color: COLORS.textMuted,
    fontSize: 18,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  qualityLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.sleep,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SleepEntryModal;
