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
import { X, Moon, Clock, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';

const SleepEntryModal = ({ visible, onClose, onSave, existingData }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  const [bedTime, setBedTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [hoursSlept, setHoursSlept] = useState('8');
  const [qualityRating, setQualityRating] = useState(3);
  const [notes, setNotes] = useState('');

  // Default to yesterday (last night's sleep)
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  };
  const [selectedDate, setSelectedDate] = useState(getYesterday());

  useEffect(() => {
    if (visible) {
      // Reset to yesterday when opening
      setSelectedDate(getYesterday());
    }
  }, [visible]);

  useEffect(() => {
    if (existingData) {
      setBedTime(existingData.bedTime || '22:00');
      setWakeTime(existingData.wakeTime || '06:00');
      setHoursSlept(existingData.hoursSlept?.toString() || '8');
      setQualityRating(existingData.qualityRating || 3);
      setNotes(existingData.notes || '');
    }
  }, [existingData]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Don't allow today or future dates (can only log past sleep)
    if (newDate < today) {
      setSelectedDate(newDate);
    }
  };

  const isYesterday = () => {
    const yesterday = getYesterday();
    return selectedDate.toDateString() === yesterday.toDateString();
  };

  const formatSelectedDate = () => {
    const yesterday = getYesterday();
    if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Last Night';
    }
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    if (selectedDate.toDateString() === twoDaysAgo.toDateString()) {
      return '2 Nights Ago';
    }
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

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
    const dateStr = selectedDate.toISOString().split('T')[0];

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
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = qualityRating >= star;
          const isHalf = qualityRating === star - 0.5;

          return (
            <TouchableOpacity
              key={star}
              style={styles.starButton}
              onPress={() => {
                // Toggle between full and half on tap
                if (qualityRating === star) {
                  setQualityRating(star - 0.5);
                } else {
                  setQualityRating(star);
                }
              }}
            >
              <Star
                size={32}
                color={isFull || isHalf ? '#F59E0B' : COLORS.textMuted}
                fill={isFull ? '#F59E0B' : 'transparent'}
                strokeWidth={isHalf ? 2 : 1.5}
              />
              {isHalf && (
                <View style={styles.halfStarOverlay}>
                  <Star
                    size={32}
                    color="#F59E0B"
                    fill="#F59E0B"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getQualityLabel = () => {
    if (qualityRating <= 1) return 'Poor';
    if (qualityRating <= 2) return 'Fair';
    if (qualityRating <= 3) return 'Good';
    if (qualityRating <= 4) return 'Great';
    return 'Excellent';
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
          {/* Date Picker */}
          <View style={styles.dateSection}>
            <Text style={styles.sectionLabel}>LOG SLEEP FOR</Text>
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
                style={[styles.dateArrow, isYesterday() && styles.dateArrowDisabled]}
                onPress={() => changeDate(1)}
                disabled={isYesterday()}
              >
                <ChevronRight size={24} color={isYesterday() ? COLORS.textMuted : COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

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
            <View style={styles.timePickerRow}>
              <Text style={styles.timeDisplay}>{bedTime}</Text>
            </View>
            <View style={styles.timeButtonsRow}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = bedTime.split(':').map(Number);
                  const newH = h === 0 ? 23 : h - 1;
                  setBedTime(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>-1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = bedTime.split(':').map(Number);
                  const newH = h === 23 ? 0 : h + 1;
                  setBedTime(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>+1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = bedTime.split(':').map(Number);
                  const newM = m < 15 ? 60 + m - 15 : m - 15;
                  const newH = m < 15 ? (h === 0 ? 23 : h - 1) : h;
                  setBedTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>-15m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = bedTime.split(':').map(Number);
                  const newM = m >= 45 ? m - 45 : m + 15;
                  const newH = m >= 45 ? (h === 23 ? 0 : h + 1) : h;
                  setBedTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>+15m</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wake Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WAKE TIME (this morning)</Text>
            <View style={styles.timePickerRow}>
              <Text style={styles.timeDisplay}>{wakeTime}</Text>
            </View>
            <View style={styles.timeButtonsRow}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = wakeTime.split(':').map(Number);
                  const newH = h === 0 ? 23 : h - 1;
                  setWakeTime(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>-1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = wakeTime.split(':').map(Number);
                  const newH = h === 23 ? 0 : h + 1;
                  setWakeTime(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>+1h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = wakeTime.split(':').map(Number);
                  const newM = m < 15 ? 60 + m - 15 : m - 15;
                  const newH = m < 15 ? (h === 0 ? 23 : h - 1) : h;
                  setWakeTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>-15m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => {
                  const [h, m] = wakeTime.split(':').map(Number);
                  const newM = m >= 45 ? m - 45 : m + 15;
                  const newH = m >= 45 ? (h === 23 ? 0 : h + 1) : h;
                  setWakeTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
                }}
              >
                <Text style={styles.timeBtnText}>+15m</Text>
              </TouchableOpacity>
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

const getStyles = (COLORS) => StyleSheet.create({
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
  dateSection: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
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
    color: COLORS.textOnPrimary,
  },
  timePickerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
  },
  timeDisplay: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  timeBtn: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
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
    position: 'relative',
  },
  halfStarOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 16,
    overflow: 'hidden',
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
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SleepEntryModal;
