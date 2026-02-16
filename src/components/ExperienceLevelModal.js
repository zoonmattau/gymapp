import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check, Sprout, TrendingUp, Dumbbell, Crown } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { EXPERIENCE_LEVELS } from '../constants/experience';

const ICONS = {
  beginner: Sprout,
  novice: TrendingUp,
  experienced: Dumbbell,
  expert: Crown,
};

const ExperienceLevelModal = ({ visible, onClose, currentLevel, onSelect }) => {
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
            <Text style={styles.title}>Gym Experience Level</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Your experience level affects workout complexity and exercise variations.
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {Object.values(EXPERIENCE_LEVELS).map(level => {
              const isSelected = currentLevel === level.id;
              const Icon = ICONS[level.id] || TrendingUp;

              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelOption,
                    isSelected && styles.levelOptionSelected,
                  ]}
                  onPress={() => onSelect(level.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                    ]}
                  >
                    <Icon
                      size={24}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.levelInfo}>
                    <Text
                      style={[
                        styles.levelLabel,
                        isSelected && styles.levelLabelSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text style={styles.levelDesc}>{level.desc}</Text>
                  </View>
                  {isSelected && <Check size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    maxWidth: 380,
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
    paddingBottom: 20,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelOptionSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary + '30',
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  levelLabelSelected: {
    color: COLORS.primary,
  },
  levelDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});

export default ExperienceLevelModal;
