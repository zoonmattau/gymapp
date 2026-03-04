import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { EXERCISES } from '../constants/exercises';
import MuscleMap, { PRIMARY_VIEW } from './MuscleMap';
import { getMuscleColor } from '../constants/muscleColors';

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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Reset state every time modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setDebouncedQuery('');
      setSelectedMuscle('All');
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [visible]);

  // Debounce search input
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 200);
  }, []);

  // Get the muscle group of the current exercise for superset suggestions
  const currentExerciseData = currentExercise ? EXERCISES.find(e => e.name === currentExercise) : null;
  const currentMuscleGroup = currentExerciseData?.muscleGroup;
  const suggestedMuscleGroups = currentMuscleGroup ? SUPERSET_PAIRS[currentMuscleGroup] || [] : [];

  // Get suggested exercises for superset
  const suggestedExercises = useMemo(() => {
    if (!isSuperset || suggestedMuscleGroups.length === 0) return [];

    const sameMuscleExercises = EXERCISES.filter(ex =>
      suggestedMuscleGroups.includes(ex.muscleGroup) &&
      !excludeExercises.includes(ex.name) &&
      ex.name !== currentExercise
    );

    if (currentExerciseData) {
      const differentEquipment = sameMuscleExercises.filter(
        ex => ex.equipment !== currentExerciseData.equipment
      );
      const sameEquipment = sameMuscleExercises.filter(
        ex => ex.equipment === currentExerciseData.equipment
      );
      return [...differentEquipment.slice(0, 4), ...sameEquipment.slice(0, 2)].slice(0, 6);
    }

    return sameMuscleExercises.slice(0, 6);
  }, [isSuperset, currentExercise, excludeExercises]);

  // Filter exercises using debounced query — fuzzy/smart search
  const filteredExercises = useMemo(() => {
    const queryWords = debouncedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length === 0) {
      return EXERCISES.filter(ex => {
        const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
        return matchesMuscle && !excludeExercises.includes(ex.name);
      });
    }

    // Common synonyms/aliases — map search terms to also match these
    const SYNONYMS = {
      'bench': ['bench', 'chest press', 'floor press'],
      'chest': ['chest', 'bench', 'pec', 'fly', 'flye'],
      'squat': ['squat', 'leg press'],
      'pull up': ['pull up', 'pullup', 'chin up', 'chinup'],
      'pullup': ['pull up', 'pullup', 'chin up', 'chinup'],
      'chinup': ['chin up', 'chinup', 'pull up', 'pullup'],
      'curl': ['curl', 'bicep'],
      'row': ['row', 'pull'],
      'press': ['press', 'push'],
      'deadlift': ['deadlift', 'dead lift'],
      'ohp': ['overhead press', 'shoulder press', 'military press'],
      'rdl': ['romanian deadlift'],
      'db': ['dumbbell'],
      'bb': ['barbell'],
      'ez': ['ez bar', 'ez-bar'],
      'lat': ['lat', 'pulldown', 'pull down', 'pull-down'],
      'tri': ['tricep', 'triceps'],
      'bi': ['bicep', 'biceps'],
      'abs': ['abs', 'core', 'crunch', 'sit up'],
      'rear delt': ['rear delt', 'reverse fly', 'face pull'],
      'ham': ['hamstring', 'hamstrings'],
      'glute': ['glute', 'glutes', 'hip thrust'],
      'calf': ['calf', 'calves', 'calf raise'],
      'trap': ['trap', 'traps', 'shrug'],
    };

    // Expand query words with synonyms
    const expandedTermSets = queryWords.map(word => {
      const terms = new Set([word]);
      for (const [key, synonyms] of Object.entries(SYNONYMS)) {
        if (word === key || synonyms.some(s => s === word)) {
          terms.add(key);
          synonyms.forEach(s => terms.add(s));
        }
      }
      return terms;
    });

    // Score each exercise
    const scored = EXERCISES
      .filter(ex => {
        const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
        return matchesMuscle && !excludeExercises.includes(ex.name);
      })
      .map(ex => {
        const name = ex.name.toLowerCase();
        const group = ex.muscleGroup.toLowerCase();
        const equip = (ex.equipment || '').toLowerCase();
        const searchable = `${name} ${group} ${equip}`;

        let score = 0;
        let allMatch = true;

        for (const termSet of expandedTermSets) {
          let termMatched = false;
          for (const term of termSet) {
            if (name.includes(term)) {
              score += 10; // Strong: name match
              termMatched = true;
              break;
            }
          }
          if (!termMatched) {
            for (const term of termSet) {
              if (searchable.includes(term)) {
                score += 3; // Weaker: group/equipment match
                termMatched = true;
                break;
              }
            }
          }
          if (!termMatched) allMatch = false;
        }

        // Bonus for exact substring match of the full query
        if (name.includes(debouncedQuery.toLowerCase())) {
          score += 20;
        }

        return { ex, score, allMatch };
      })
      .filter(item => item.score > 0 && item.allMatch)
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.ex);
  }, [debouncedQuery, selectedMuscle, excludeExercises]);

  const handleSelect = useCallback((exercise) => {
    onSelect(exercise.name);
    onClose();
  }, [onSelect, onClose]);

  // Memoized exercise row
  const renderExerciseItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.exerciseIcon}>
        <MuscleMap
          view={PRIMARY_VIEW[item.muscleGroup] || 'front'}
          highlightedMuscle={item.muscleGroup}
          highlightColor={getMuscleColor(item.muscleGroup)}
          size={32}
        />
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.muscleGroup} • {item.equipment}
        </Text>
      </View>
    </TouchableOpacity>
  ), [styles, handleSelect]);

  const exerciseKeyExtractor = useCallback((item, index) => `${item.name}-${index}`, []);

  // Build the superset header
  const ListHeader = useMemo(() => {
    if (!isSuperset || suggestedExercises.length === 0 || debouncedQuery !== '') return null;
    return (
      <View style={styles.suggestedSection}>
        <Text style={styles.suggestedTitle}>SUGGESTED FOR SUPERSET</Text>
        <Text style={styles.suggestedSubtitle}>
          Other {currentMuscleGroup} exercises
        </Text>
        {suggestedExercises.map((item, i) => (
          <TouchableOpacity
            key={`suggested-${item.name}-${i}`}
            style={[styles.exerciseItem, styles.suggestedItem]}
            onPress={() => handleSelect(item)}
          >
            <View style={[styles.exerciseIcon, styles.suggestedIcon]}>
              <MuscleMap
                view={PRIMARY_VIEW[item.muscleGroup] || 'front'}
                highlightedMuscle={item.muscleGroup}
                highlightColor={getMuscleColor(item.muscleGroup)}
                size={32}
              />
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
    );
  }, [isSuperset, suggestedExercises, debouncedQuery, currentMuscleGroup, styles, handleSelect]);

  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No exercises found</Text>
    </View>
  ), [styles]);

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
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setDebouncedQuery(''); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
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

        {/* Exercise List — virtualized FlatList */}
        <FlatList
          data={filteredExercises}
          keyExtractor={exerciseKeyExtractor}
          renderItem={renderExerciseItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          style={styles.exerciseList}
          contentContainerStyle={styles.exerciseListContent}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== 'web'}
          keyboardShouldPersistTaps="handled"
        />
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
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
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
  exerciseList: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 16,
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
    marginBottom: 8,
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
