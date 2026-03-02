import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { X, Search, Dumbbell } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { EXERCISES } from '../constants/exercises';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Traps', 'Forearms', 'Full Body'];

// Same muscle group for superset suggestions (compound sets)
const SUPERSET_PAIRS = {
  'Biceps': ['Biceps'],
  'Triceps': ['Triceps'],
  'Chest': ['Chest'],
  'Back': ['Back'],
  'Shoulders': ['Shoulders'],
  'Quads': ['Quads'],
  'Hamstrings': ['Hamstrings'],
  'Glutes': ['Glutes'],
  'Core': ['Core'],
  'Calves': ['Calves'],
  'Traps': ['Traps'],
  'Forearms': ['Forearms'],
  'Full Body': ['Full Body'],
};

const ExerciseSearchModal = ({ visible, onClose, onSelect, excludeExercises = [], isSuperset = false, currentExercise = null }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  // Get the muscle group of the current exercise for superset suggestions
  const currentExerciseData = currentExercise ? EXERCISES.find(e => e.name === currentExercise) : null;
  const currentMuscleGroup = currentExerciseData?.muscleGroup;
  const suggestedMuscleGroups = currentMuscleGroup ? SUPERSET_PAIRS[currentMuscleGroup] || [] : [];

  // Get suggested exercises for superset - prioritize different equipment/type for variety
  const suggestedExercises = (() => {
    if (!isSuperset || suggestedMuscleGroups.length === 0) return [];

    const sameMuscleExercises = EXERCISES.filter(ex =>
      suggestedMuscleGroups.includes(ex.muscleGroup) &&
      !excludeExercises.includes(ex.name) &&
      ex.name !== currentExercise
    );

    // If we know the current exercise, prioritize different equipment/type
    if (currentExerciseData) {
      const differentEquipment = sameMuscleExercises.filter(
        ex => ex.equipment !== currentExerciseData.equipment
      );
      const sameEquipment = sameMuscleExercises.filter(
        ex => ex.equipment === currentExerciseData.equipment
      );
      // Show variety first, then same equipment
      return [...differentEquipment.slice(0, 4), ...sameEquipment.slice(0, 2)].slice(0, 6);
    }

    return sameMuscleExercises.slice(0, 6);
  })();

  const filteredExercises = EXERCISES.filter(ex => {
    const name = ex.name.toLowerCase();
    const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const matchesSearch = queryWords.length === 0 || queryWords.every(word => name.includes(word));
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
          <View>
            <Text style={styles.title}>{isSuperset ? 'Select Superset Exercise' : 'Add Exercise'}</Text>
            <Text style={styles.exerciseCount}>{filteredExercises.length} exercises</Text>
          </View>
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
        <View style={styles.exerciseListContainer}>
          <ScrollView
            style={styles.exerciseList}
            contentContainerStyle={styles.exerciseListContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {/* Suggested Exercises for Superset */}
            {isSuperset && suggestedExercises.length > 0 && searchQuery === '' && (
              <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>SUGGESTED FOR SUPERSET</Text>
              <Text style={styles.suggestedSubtitle}>
                Other {currentMuscleGroup} exercises
              </Text>
              {suggestedExercises.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.exerciseItem, styles.suggestedItem]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={[styles.exerciseIcon, styles.suggestedIcon]}>
                    <Dumbbell size={18} color="#D97706" />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.muscleGroup} • {item.equipment}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={styles.divider}>
                <Text style={styles.dividerText}>ALL EXERCISES</Text>
              </View>
            </View>
          )}

          {/* All Exercises */}
          {filteredExercises.length > 0 ? (
            filteredExercises.map((item) => (
              <TouchableOpacity
                key={item.name}
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
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
            )}
          </ScrollView>
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
    alignItems: 'flex-start',
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
  exerciseCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
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
    color: COLORS.textOnPrimary,
  },
  exerciseListContainer: {
    flex: 1,
    marginTop: 12,
    ...(Platform.OS === 'web' ? {
      overflow: 'hidden',
      position: 'relative',
    } : {}),
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? {
      overflowY: 'scroll',
      height: '100%',
      WebkitOverflowScrolling: 'touch',
    } : {}),
  },
  exerciseListContent: {
    paddingBottom: 40,
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
  suggestedSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  suggestedTitle: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestedSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  suggestedItem: {
    borderWidth: 1,
    borderColor: '#D97706',
  },
  suggestedIcon: {
    backgroundColor: '#D9770620',
  },
  divider: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default ExerciseSearchModal;
