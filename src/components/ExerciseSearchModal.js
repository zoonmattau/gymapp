import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { X, Search, Dumbbell } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

// Common exercises database
const EXERCISES = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbells' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbells' },
  { name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable' },
  { name: 'Dumbbell Flyes', muscleGroup: 'Chest', equipment: 'Dumbbells' },
  { name: 'Push Ups', muscleGroup: 'Chest', equipment: 'Bodyweight' },
  { name: 'Chest Dips', muscleGroup: 'Chest', equipment: 'Bodyweight' },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbells' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable' },
  { name: 'Pull Ups', muscleGroup: 'Back', equipment: 'Bodyweight' },
  { name: 'Chin Ups', muscleGroup: 'Back', equipment: 'Bodyweight' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable' },
  { name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Front Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Upright Rows', muscleGroup: 'Shoulders', equipment: 'Barbell' },

  // Arms
  { name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells' },
  { name: 'Hammer Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells' },
  { name: 'Preacher Curls', muscleGroup: 'Biceps', equipment: 'Barbell' },
  { name: 'Cable Curls', muscleGroup: 'Biceps', equipment: 'Cable' },
  { name: 'Tricep Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable' },
  { name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbells' },
  { name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Triceps', equipment: 'Barbell' },

  // Legs
  { name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Leg Curl', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Leg Extension', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Lunges', muscleGroup: 'Legs', equipment: 'Dumbbells' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbells' },
  { name: 'Calf Raises', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Hip Thrust', muscleGroup: 'Legs', equipment: 'Barbell' },

  // Core
  { name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { name: 'Crunches', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { name: 'Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { name: 'Cable Crunches', muscleGroup: 'Core', equipment: 'Cable' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', equipment: 'Equipment' },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'];

const ExerciseSearchModal = ({ visible, onClose, onSelect, excludeExercises = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  const filteredExercises = EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
    const notExcluded = !excludeExercises.includes(ex.name);
    return matchesSearch && matchesMuscle && notExcluded;
  });

  const handleSelect = (exercise) => {
    onSelect(exercise.name);
    onClose();
    setSearchQuery('');
    setSelectedMuscle('All');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Exercise</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Muscle Group Filter */}
        <FlatList
          horizontal
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedMuscle === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedMuscle(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedMuscle === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.name}
          style={styles.exerciseList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseItem}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.exerciseIcon}>
                <Dumbbell size={18} color={COLORS.primary} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup} • {item.equipment}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
          }
        />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 10,
  },
  filterList: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.text,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});

export default ExerciseSearchModal;
