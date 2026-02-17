import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { ArrowLeft, Search, Dumbbell } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

// Exercise database
const EXERCISES = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'Compound' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'Compound' },
  { name: 'Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', type: 'Isolation' },
  { name: 'Dumbbell Flyes', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Push Ups', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'Compound' },
  { name: 'Chest Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'Compound' },
  { name: 'Pec Deck', muscleGroup: 'Chest', equipment: 'Machine', type: 'Isolation' },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'Compound' },
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'Compound' },
  { name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', type: 'Compound' },
  { name: 'Pull Ups', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'Compound' },
  { name: 'Chin Ups', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'Compound' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'Compound' },
  { name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'Compound' },
  { name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', type: 'Isolation' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'Compound' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Front Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Upright Rows', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'Compound' },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'Isolation' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Hammer Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Preacher Curls', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'Isolation' },
  { name: 'Cable Curls', muscleGroup: 'Biceps', equipment: 'Cable', type: 'Isolation' },
  { name: 'Concentration Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'Isolation' },

  // Triceps
  { name: 'Tricep Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'Isolation' },
  { name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'Isolation' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'Isolation' },
  { name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'Compound' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'Compound' },

  // Quads
  { name: 'Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'Compound' },
  { name: 'Front Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'Compound' },
  { name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', type: 'Compound' },
  { name: 'Leg Extension', muscleGroup: 'Quads', equipment: 'Machine', type: 'Isolation' },
  { name: 'Lunges', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'Compound' },
  { name: 'Hack Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'Compound' },

  // Hamstrings
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'Compound' },
  { name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', type: 'Isolation' },
  { name: 'Stiff Leg Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'Compound' },
  { name: 'Good Mornings', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'Compound' },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'Compound' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'Bodyweight', type: 'Isolation' },
  { name: 'Cable Kickbacks', muscleGroup: 'Glutes', equipment: 'Cable', type: 'Isolation' },

  // Core
  { name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'Isometric' },
  { name: 'Crunches', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'Isolation' },
  { name: 'Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'Isolation' },
  { name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'Isolation' },
  { name: 'Cable Crunches', muscleGroup: 'Core', equipment: 'Cable', type: 'Isolation' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', equipment: 'Equipment', type: 'Compound' },
  { name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'Isolation' },

  // Calves
  { name: 'Standing Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'Isolation' },
  { name: 'Seated Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'Isolation' },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Core'];

const ExerciseLibraryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  const filteredExercises = EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || ex.muscleGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity style={styles.exerciseCard}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDetails}>{item.muscleGroup} • {item.equipment}</Text>
      </View>
      <View style={styles.exerciseType}>
        <Text style={styles.exerciseTypeText}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Exercise Library</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exercises..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Muscle Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {MUSCLE_GROUPS.map(group => (
          <TouchableOpacity
            key={group}
            style={[
              styles.filterChip,
              selectedGroup === group && styles.filterChipActive
            ]}
            onPress={() => setSelectedGroup(group)}
          >
            <Text style={[
              styles.filterChipText,
              selectedGroup === group && styles.filterChipTextActive
            ]}>
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise Count */}
      <Text style={styles.resultCount}>{filteredExercises.length} exercises</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.exerciseList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  filterScroll: {
    marginTop: 16,
    maxHeight: 40,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
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
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.text,
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  exerciseList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  exerciseType: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exerciseTypeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});

export default ExerciseLibraryScreen;
