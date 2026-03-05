import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Plus, Minus, Trash2, Check } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';

const WaterEntryModal = ({ visible, onClose, onAdd, onDelete, currentIntake = 0, waterGoal = 2500, waterEntries = [] }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const [amount, setAmount] = useState('250');

  const quickAmounts = [100, 200, 250, 300, 400, 500, 750, 1000];
  const progress = Math.min(100, Math.round((currentIntake / waterGoal) * 100));
  const isComplete = currentIntake >= waterGoal;

  const handleAdd = () => {
    const ml = parseInt(amount) || 0;
    if (ml > 0) {
      onAdd(ml);
      onClose();
      setAmount('250');
    }
  };

  const adjustAmount = (delta) => {
    const current = parseInt(amount) || 0;
    const newAmount = Math.max(0, current + delta);
    setAmount(newAmount.toString());
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Water</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Ring and Amount Input Side by Side */}
          <View style={styles.topRow}>
            {/* Progress Ring */}
            <View style={styles.progressCard}>
              <View style={styles.ringWrapper}>
                <View style={[styles.ringBg, { borderColor: COLORS.surfaceLight }]} />
                <View style={[
                  styles.ringProgress,
                  {
                    borderColor: isComplete ? COLORS.success : COLORS.water,
                    opacity: progress > 0 ? 0.3 + (progress / 100) * 0.7 : 0.2,
                  }
                ]} />
                <View style={styles.ringInner}>
                  {isComplete && <Check size={16} color={COLORS.success} strokeWidth={3} />}
                  <Text style={[styles.ringPercent, { color: isComplete ? COLORS.success : COLORS.water }]}>
                    {progress}%
                  </Text>
                </View>
              </View>
              <Text style={styles.progressLabel}>{(currentIntake / 1000).toFixed(1)}L / {(waterGoal / 1000).toFixed(1)}L</Text>
            </View>

            {/* Amount Input */}
            <View style={styles.amountCard}>
              <Text style={styles.progressLabel}>Add amount</Text>
              <View style={styles.amountRow}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustAmount(-50)}
                >
                  <Minus size={20} color={COLORS.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustAmount(50)}
                >
                  <Plus size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickSection}>
            <Text style={styles.sectionLabel}>QUICK ADD</Text>
            <View style={styles.quickGrid}>
              {quickAmounts.map((ml) => (
                <TouchableOpacity
                  key={ml}
                  style={[
                    styles.quickButton,
                    amount === ml.toString() && styles.quickButtonActive,
                  ]}
                  onPress={() => setAmount(ml.toString())}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      amount === ml.toString() && styles.quickButtonTextActive,
                    ]}
                  >
                    {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Today's Entries */}
          {waterEntries.length > 0 && (
            <View style={styles.entriesSection}>
              <Text style={styles.sectionLabel}>TODAY'S ENTRIES</Text>
              {waterEntries.map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryAmount}>{entry.amount}ml</Text>
                    <Text style={styles.entryTime}>
                      {new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      if (onDelete) {
                        Alert.alert(
                          'Delete Entry',
                          `Remove ${entry.amount}ml entry?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry) },
                          ]
                        );
                      }
                    }}
                  >
                    <Trash2 size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Add Button - Fixed at bottom */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add {amount}ml</Text>
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
    paddingTop: 20,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  progressCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
    marginBottom: 8,
  },
  ringBg: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
  },
  ringProgress: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
  },
  ringInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInput: {
    width: 80,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quickSection: {
    marginBottom: 24,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  quickButton: {
    width: 70,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: COLORS.water,
  },
  quickButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  quickButtonTextActive: {
    color: COLORS.textOnPrimary,
  },
  entriesSection: {
    marginBottom: 24,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  entryAmount: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  entryTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  addButton: {
    backgroundColor: COLORS.water,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WaterEntryModal;
