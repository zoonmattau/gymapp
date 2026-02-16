import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Dumbbell, Play, User, Star, Clock } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const RepertoireModal = ({
  visible,
  onClose,
  savedWorkouts,
  loading,
  onStartWorkout,
}) => {
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

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
            <Text style={styles.title}>My Rep-Ertoire</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Your saved workouts from the community
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : savedWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Dumbbell size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No saved workouts yet</Text>
              <Text style={styles.emptyText}>
                Browse the Community tab to find and save workouts to your Rep-Ertoire!
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {savedWorkouts.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => onStartWorkout(workout)}
                >
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutIconBox}>
                      <Dumbbell size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                      {workout.creator && (
                        <View style={styles.creatorRow}>
                          <User size={12} color={COLORS.textMuted} />
                          <Text style={styles.creatorText}>
                            @{workout.creator.username}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => onStartWorkout(workout)}
                    >
                      <Play size={16} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  {workout.description && (
                    <Text style={styles.workoutDescription} numberOfLines={2}>
                      {workout.description}
                    </Text>
                  )}

                  <View style={styles.workoutMeta}>
                    {workout.estimated_duration && (
                      <View style={styles.metaItem}>
                        <Clock size={12} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>
                          {formatDuration(workout.estimated_duration)}
                        </Text>
                      </View>
                    )}
                    {workout.averageRating > 0 && (
                      <View style={styles.metaItem}>
                        <Star size={12} color={COLORS.warning} fill={COLORS.warning} />
                        <Text style={styles.metaText}>
                          {workout.averageRating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                    {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                      <View style={styles.tagsRow}>
                        {workout.muscle_groups.slice(0, 3).map((group, idx) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>{group}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}

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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  workoutCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  creatorText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
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

export default RepertoireModal;
