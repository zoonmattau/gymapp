import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import {
  Trophy,
  Clock,
  Dumbbell,
  Flame,
  Star,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Check,
  Frown,
  Smile,
  Pencil,
  X,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { workoutService } from '../services/workoutService';

const WorkoutSummaryScreen = ({ route, navigation }) => {
  const { summary } = route?.params || {};
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [displayName, setDisplayName] = useState(summary?.workoutName || 'Workout');

  const {
    sessionId = null,
    workoutName = 'Workout',
    duration = 0,
    totalSets = 0,
    completedSets = 0,
    exercises = [],
    totalVolume = 0,
    newPRs = [],
  } = summary || {};

  const handleRenamePress = () => {
    setNewWorkoutName(displayName);
    setRenameModalVisible(true);
  };

  const handleRenameSubmit = async () => {
    if (!sessionId || !newWorkoutName.trim()) {
      setRenameModalVisible(false);
      return;
    }

    try {
      const { error } = await workoutService.renameWorkoutSession(
        sessionId,
        newWorkoutName.trim()
      );

      if (!error) {
        setDisplayName(newWorkoutName.trim());
      }
    } catch (err) {
      console.log('Error renaming workout:', err);
    }

    setRenameModalVisible(false);
    setNewWorkoutName('');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K kg`;
    }
    return `${volume} kg`;
  };

  const feedbackOptions = [
    { id: 'tough', label: 'Tough', color: COLORS.error, emoji: '😵' },
    { id: 'tired', label: 'Tired', color: '#F97316', emoji: '😓' },
    { id: 'okay', label: 'Okay', color: COLORS.warning, emoji: '😐' },
    { id: 'great', label: 'Great', color: '#22C55E', emoji: '💪' },
    { id: 'amazing', label: 'Amazing', color: COLORS.success, emoji: '🔥' },
  ];

  const handleFinish = () => {
    // Could save feedback to database here
    navigation.popToTop();
  };

  // Render content (shared between web and native)
  const renderContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.checkCircle}>
          <Check size={40} color={COLORS.success} strokeWidth={3} />
        </View>
        <Text style={styles.title}>Workout Complete!</Text>
        <View style={styles.nameRow}>
          <Text style={styles.workoutName}>{displayName}</Text>
          {sessionId && (
            <TouchableOpacity
              style={styles.renameButton}
              onPress={handleRenamePress}
              onClick={handleRenamePress}
            >
              <Pencil size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Clock size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Dumbbell size={24} color={COLORS.accent} />
          <Text style={styles.statValue}>{completedSets}/{totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statCard}>
          <Flame size={24} color={COLORS.warning} />
          <Text style={styles.statValue}>{formatVolume(totalVolume)}</Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={24} color={COLORS.success} />
          <Text style={styles.statValue}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
      </View>

      {/* New PRs */}
      {newPRs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Personal Records!</Text>
          {newPRs.map((pr, index) => (
            <View key={index} style={styles.prCard}>
              <Trophy size={24} color={COLORS.warning} />
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exercise}</Text>
                <Text style={styles.prValue}>
                  {pr.weight}kg x {pr.reps} reps
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* How did it feel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How did you feel?</Text>
        <View style={styles.feedbackRow}>
          {feedbackOptions.map((option) => {
            const isSelected = feedback === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.feedbackButton,
                  isSelected && { backgroundColor: option.color + '20', borderColor: option.color },
                ]}
                onPress={() => setFeedback(option.id)}
                onClick={() => setFeedback(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.feedbackEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.feedbackLabel,
                    isSelected && { color: option.color },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rate your workout</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              onClick={() => setRating(star)}
            >
              <Star
                size={36}
                color={star <= (rating || 0) ? COLORS.warning : COLORS.surfaceLight}
                fill={star <= (rating || 0) ? COLORS.warning : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="How was your workout? Any observations..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Exercise Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercise Summary</Text>
        {exercises.map((exercise, index) => {
          const completedSetsCount = exercise.sets?.filter(s => s.completed).length || 0;
          return (
            <View key={index} style={styles.exerciseSummary}>
              <View style={styles.exerciseIcon}>
                <Dumbbell size={16} color={COLORS.primary} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseSets}>
                  {completedSetsCount} sets completed
                </Text>
              </View>
              {completedSetsCount === exercise.sets?.length && (
                <Check size={20} color={COLORS.success} />
              )}
            </View>
          );
        })}
      </View>

      {/* Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleFinish}
        onClick={handleFinish}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Workout</Text>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.renameInput}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Workout name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameSubmitButton}
                onPress={handleRenameSubmit}
              >
                <Text style={styles.renameSubmitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </>
  );

  // For web, we need to use native div elements for proper scrolling
  if (Platform.OS === 'web') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: COLORS.background,
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
        }}>
          {renderContent()}
        </div>
      </div>
    );
  }

  // Native iOS/Android rendering
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  workoutName: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  renameButton: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  prValue: {
    color: COLORS.warning,
    fontSize: 14,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  feedbackEmoji: {
    fontSize: 24,
  },
  feedbackLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 100,
  },
  exerciseSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseSets: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  renameInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  renameSubmitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  renameSubmitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutSummaryScreen;
