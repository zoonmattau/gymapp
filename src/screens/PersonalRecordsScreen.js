import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ArrowLeft, Trophy, Dumbbell } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';

const PersonalRecordsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [personalRecords, setPersonalRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonalRecords();
  }, []);

  const loadPersonalRecords = async () => {
    try {
      // Try to load PRs from the workout service
      const { data } = await workoutService.getPersonalRecords(user?.id);
      if (data && data.length > 0) {
        // Map database fields to display format
        const formattedPRs = data.map(pr => ({
          exercise: pr.exercise_name || pr.exercise || 'Unknown Exercise',
          weight: pr.weight || 0,
          reps: pr.reps || 1,
          date: pr.achieved_at
            ? new Date(pr.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : pr.date || 'Recently',
          e1rm: pr.e1rm || calculateE1RM(pr.weight || 0, pr.reps || 1),
        }));
        setPersonalRecords(formattedPRs);
      } else {
        // Use demo data if no real data
        setPersonalRecords([]);
      }
    } catch (error) {
      console.log('Error loading PRs:', error);
      setPersonalRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated 1RM using Epley formula
  const calculateE1RM = (weight, reps) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const renderPRItem = ({ item }) => (
    <TouchableOpacity style={styles.prCard}>
      <View style={styles.prLeft}>
        <View style={styles.prIcon}>
          <Trophy size={18} color={COLORS.warning} />
        </View>
        <View style={styles.prInfo}>
          <Text style={styles.prExercise}>{item.exercise}</Text>
          <Text style={styles.prDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.prRight}>
        <Text style={styles.prWeight}>{item.weight}kg</Text>
        <Text style={styles.prReps}>x {item.reps} reps</Text>
      </View>
      {item.weight > 0 && item.reps > 0 && (
        <View style={styles.prE1RM}>
          <Text style={styles.prE1RMLabel}>Est. 1RM</Text>
          <Text style={styles.prE1RMValue}>{calculateE1RM(item.weight, item.reps)}kg</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Trophy size={48} color={COLORS.warning} />
      </View>
      <Text style={styles.emptyTitle}>No PRs Yet</Text>
      <Text style={styles.emptyText}>
        Complete workouts and lift heavier to set your first personal records. Every new best becomes a PR!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Workouts' })}
      >
        <Text style={styles.emptyButtonText}>Start Training</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Records</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Records</Text>
        <View style={{ width: 24 }} />
      </View>

      {personalRecords.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Trophy size={20} color={COLORS.warning} />
              <Text style={styles.summaryValue}>{personalRecords.length}</Text>
              <Text style={styles.summaryLabel}>Total PRs</Text>
            </View>
          </View>

          {/* PR List */}
          <FlatList
            data={personalRecords}
            keyExtractor={(item, index) => `${item.exercise}-${index}`}
            renderItem={renderPRItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  prCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  prLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  prRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  prWeight: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  prReps: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  prE1RM: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  prE1RMLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  prE1RMValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalRecordsScreen;
