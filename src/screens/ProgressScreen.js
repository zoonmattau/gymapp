import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, Flame, Dumbbell, Trophy } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const ProgressScreen = () => {
  const stats = {
    totalWorkouts: 47,
    currentStreak: 5,
    bestStreak: 12,
    totalVolume: '125,450 kg',
  };

  const personalRecords = [
    { exercise: 'Bench Press', weight: '100kg', date: 'Feb 8' },
    { exercise: 'Squat', weight: '140kg', date: 'Feb 5' },
    { exercise: 'Deadlift', weight: '160kg', date: 'Jan 28' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Dumbbell size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Flame size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{stats.totalVolume}</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>
        </View>

        {/* Personal Records */}
        <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
        {personalRecords.map((pr, index) => (
          <View key={index} style={styles.prCard}>
            <View style={styles.prIcon}>
              <Trophy size={18} color={COLORS.warning} />
            </View>
            <View style={styles.prInfo}>
              <Text style={styles.prExercise}>{pr.exercise}</Text>
              <Text style={styles.prDate}>{pr.date}</Text>
            </View>
            <Text style={styles.prWeight}>{pr.weight}</Text>
          </View>
        ))}

        {/* Trends Section - Placeholder */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TRENDS</Text>
        <View style={styles.trendsPlaceholder}>
          <TrendingUp size={40} color={COLORS.textMuted} />
          <Text style={styles.trendsText}>Workout trends coming soon</Text>
        </View>

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
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
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
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  prCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  prDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  prWeight: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendsPlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
});

export default ProgressScreen;
