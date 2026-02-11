import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const WorkoutSummaryScreen = ({ route, navigation }) => {
  const { summary } = route?.params || {};
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');

  const {
    workoutName = 'Workout',
    duration = 0,
    totalSets = 0,
    completedSets = 0,
    exercises = [],
    totalVolume = 0,
    newPRs = [],
  } = summary || {};

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
    { id: 'great', icon: ThumbsUp, label: 'Great', color: COLORS.success },
    { id: 'okay', icon: Meh, label: 'Okay', color: COLORS.warning },
    { id: 'tough', icon: ThumbsDown, label: 'Tough', color: COLORS.error },
  ];

  const handleFinish = () => {
    // Could save feedback to database here
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.checkCircle}>
            <Check size={40} color={COLORS.success} strokeWidth={3} />
          </View>
          <Text style={styles.title}>Workout Complete!</Text>
          <Text style={styles.workoutName}>{workoutName}</Text>
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
              const Icon = option.icon;
              const isSelected = feedback === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.feedbackButton,
                    isSelected && { backgroundColor: option.color + '20', borderColor: option.color },
                  ]}
                  onPress={() => setFeedback(option.id)}
                >
                  <Icon size={28} color={isSelected ? option.color : COLORS.textMuted} />
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
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
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
        <TouchableOpacity style={styles.doneButton} onPress={handleFinish}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
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
  workoutName: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: 4,
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
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  feedbackLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
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
});

export default WorkoutSummaryScreen;
