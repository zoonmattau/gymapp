import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Bell, Play, Flame, Droplets, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { supabase } from '../lib/supabase';

const HomeScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick stats data
  const [caloriesIntake, setCaloriesIntake] = useState(1850);
  const [proteinIntake, setProteinIntake] = useState(120);
  const [waterIntake, setWaterIntake] = useState(2500);

  const nutritionGoals = {
    calories: 2200,
    protein: 150,
    water: 3000,
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.log('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick stats configuration
  const quickStats = [
    {
      id: 'calories',
      label: 'Cal',
      current: caloriesIntake,
      target: nutritionGoals.calories,
      color: COLORS.accent,
    },
    {
      id: 'protein',
      label: 'Protein',
      current: proteinIntake,
      target: nutritionGoals.protein,
      color: COLORS.primary,
    },
    {
      id: 'water',
      label: 'Water',
      current: waterIntake,
      target: nutritionGoals.water,
      color: COLORS.water,
    },
  ];

  const renderProgressCircle = (stat) => {
    const progress = Math.min((stat.current || 0) / (stat.target || 1), 1);
    const isComplete = progress >= 1;
    const percentage = Math.round(progress * 100);

    // Format value for display when complete
    const completeVal = stat.id === 'water'
      ? `${(stat.current / 1000).toFixed(1)}L`
      : stat.current;

    return (
      <TouchableOpacity key={stat.id} style={styles.statItem}>
        <View style={styles.progressCircle}>
          {/* Background circle */}
          <View style={[styles.circleBackground, { borderColor: COLORS.surfaceLight }]} />
          {/* Progress indicator - simplified for now */}
          <View style={styles.circleContent}>
            {isComplete ? (
              <>
                <Check size={12} color={COLORS.success} strokeWidth={3} />
                <Text style={[styles.circleValue, { color: COLORS.success, fontSize: 8 }]}>
                  {completeVal}
                </Text>
              </>
            ) : (
              <Text style={[styles.circleValue, { color: stat.color }]}>
                {percentage}%
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.statLabel, { color: isComplete ? COLORS.success : COLORS.textMuted }]}>
          {stat.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.username}>@username</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Today's Workout Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
          <View style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
              <Text style={styles.workoutName}>Push Day A</Text>
              <Text style={styles.workoutFocus}>Chest, Shoulders, Triceps</Text>
            </View>
            <TouchableOpacity style={styles.startButton}>
              <Play size={18} color={COLORS.text} />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S PROGRESS</Text>
          <View style={styles.statsContainer}>
            {quickStats.map(renderProgressCircle)}
          </View>
        </View>

        {/* Log Food Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOG FOOD</Text>
          <View style={styles.logFoodGrid}>
            <TouchableOpacity style={styles.logFoodCard}>
              <Flame size={24} color={COLORS.accent} />
              <Text style={styles.logFoodText}>Add Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logFoodCard}>
              <Droplets size={24} color={COLORS.water} />
              <Text style={styles.logFoodText}>Log Water</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  username: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationBtn: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  todayBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  todayBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  workoutFocus: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 44,
    height: 44,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
  },
  logFoodGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  logFoodCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  logFoodText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
