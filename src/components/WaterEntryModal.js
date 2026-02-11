import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { X, Droplets, Plus, Minus } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const WaterEntryModal = ({ visible, onClose, onAdd, currentIntake = 0 }) => {
  const [amount, setAmount] = useState('250');

  const quickAmounts = [100, 200, 250, 300, 400, 500, 750, 1000];

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

        <View style={styles.content}>
          {/* Current Progress */}
          <View style={styles.progressCard}>
            <Droplets size={24} color={COLORS.water} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Today's intake</Text>
              <Text style={styles.progressValue}>{(currentIntake / 1000).toFixed(1)}L</Text>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>AMOUNT (ML)</Text>
            <View style={styles.amountRow}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => adjustAmount(-50)}
              >
                <Minus size={24} color={COLORS.text} />
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
                <Plus size={24} color={COLORS.text} />
              </TouchableOpacity>
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

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Droplets size={20} color={COLORS.text} />
            <Text style={styles.addButtonText}>Add {amount}ml</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 20,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  progressValue: {
    color: COLORS.water,
    fontSize: 24,
    fontWeight: 'bold',
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
  amountRow: {
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
  amountInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  quickSection: {
    marginBottom: 24,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: {
    width: '23%',
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
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.water,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    marginBottom: 20,
  },
  addButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WaterEntryModal;
