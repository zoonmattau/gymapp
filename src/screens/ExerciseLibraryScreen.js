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
import { ArrowLeft, Search, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

import { EXERCISES } from '../constants/exercises';

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Core', 'Calves', 'Traps', 'Forearms', 'Full Body',
];

const ExerciseLibraryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [expandedExercise, setExpandedExercise] = useState(null);

  const filteredExercises = EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || ex.muscleGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleCardPress = (name) => {
    setExpandedExercise(prev => (prev === name ? null : name));
  };

  const renderExerciseItem = ({ item }) => {
    const isExpanded = expandedExercise === item.name;
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => handleCardPress(item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseDetails}>{item.muscleGroup} · {item.equipment}</Text>
          </View>
          <View style={styles.exerciseRight}>
            <View style={styles.exerciseType}>
              <Text style={styles.exerciseTypeText}>{item.type}</Text>
            </View>
            {isExpanded
              ? <ChevronUp size={18} color={COLORS.primary} style={{ marginLeft: 8 }} />
              : <ChevronDown size={18} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
            }
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            {item.description && (
              <Text style={styles.exerciseDescription}>{item.description}</Text>
            )}
            {item.tips && item.tips.length > 0 && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsHeading}>COACHING CUES</Text>
                {item.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>›</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            style={[styles.filterChip, selectedGroup === group && styles.filterChipActive]}
            onPress={() => {
              setSelectedGroup(group);
              setExpandedExercise(null);
            }}
          >
            <Text style={[styles.filterChipText, selectedGroup === group && styles.filterChipTextActive]}>
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise Count */}
      <Text style={styles.resultCount}>
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} · tap to expand
      </Text>
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        backgroundColor: COLORS.background,
      }}>
        {renderContent()}
        {filteredExercises.map((item) => (
          <View key={item.name} style={{ paddingHorizontal: 16 }}>
            {renderExerciseItem({ item })}
          </View>
        ))}
        <View style={{ height: 20 }} />
      </div>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.name}
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
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
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
    ...(Platform.OS === 'web' ? { overflow: 'auto' } : {}),
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
  },
  exerciseHeader: {
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
  exerciseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
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
  // Expanded section
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  exerciseDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tipsContainer: {},
  tipsHeading: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  tipBullet: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    width: 12,
  },
  tipText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default ExerciseLibraryScreen;
