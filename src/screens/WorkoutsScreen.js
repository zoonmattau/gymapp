import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Dumbbell, Calendar, Plus } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const WorkoutsScreen = () => {
  const workouts = [
    { id: 1, name: 'Push Day A', focus: 'Chest, Shoulders, Triceps', exercises: 6 },
    { id: 2, name: 'Pull Day A', focus: 'Back, Biceps', exercises: 6 },
    { id: 3, name: 'Legs Day A', focus: 'Quads, Hamstrings, Calves', exercises: 6 },
    { id: 4, name: 'Push Day B', focus: 'Chest, Shoulders, Triceps', exercises: 6 },
    { id: 5, name: 'Pull Day B', focus: 'Back, Biceps', exercises: 6 },
    { id: 6, name: 'Legs Day B', focus: 'Quads, Hamstrings, Calves', exercises: 6 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity style={styles.scheduleCard}>
          <Calendar size={24} color={COLORS.primary} />
          <View style={styles.scheduleText}>
            <Text style={styles.scheduleTitle}>Workout Schedule</Text>
            <Text style={styles.scheduleSubtitle}>Plan your week</Text>
          </View>
        </TouchableOpacity>

        {/* Workout List */}
        <Text style={styles.sectionLabel}>MY WORKOUTS</Text>
        {workouts.map((workout) => (
          <TouchableOpacity key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutIcon}>
              <Dumbbell size={20} color={COLORS.primary} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutFocus}>{workout.focus}</Text>
            </View>
            <Text style={styles.exerciseCount}>{workout.exercises} exercises</Text>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
  },
  scheduleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  scheduleText: {
    flex: 1,
  },
  scheduleTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  workoutFocus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  exerciseCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

export default WorkoutsScreen;
