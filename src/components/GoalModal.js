import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { GOAL_INFO } from '../constants/goals';

const GoalModal = ({ visible, onClose, currentGoal, onSelect }) => {
  const goals = Object.entries(GOAL_INFO);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Goal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select a fitness goal to optimize your training
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {goals.map(([key, goal]) => {
              const isSelected = currentGoal === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                  onPress={() => onSelect(key)}
                >
                  <View style={styles.goalIconBox}>
                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalTitle, isSelected && styles.goalTitleSelected]}>
                      {goal.title}
                    </Text>
                    <Text style={styles.goalOverview} numberOfLines={2}>
                      {goal.overview}
                    </Text>
                    <Text style={styles.goalDays}>
                      {goal.idealDays} days/week
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Check size={20} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>

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
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  goalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  goalTitleSelected: {
    color: COLORS.primary,
  },
  goalOverview: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  goalDays: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  checkIcon: {
    marginLeft: 8,
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

export default GoalModal;
