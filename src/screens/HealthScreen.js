import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Flame, Droplets, Utensils, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const HealthScreen = () => {
  const [caloriesIntake, setCaloriesIntake] = useState(1850);
  const [waterIntake, setWaterIntake] = useState(2500);
  const [proteinIntake, setProteinIntake] = useState(120);
  const [carbsIntake, setCarbsIntake] = useState(200);

  const nutritionGoals = {
    calories: 2200,
    water: 3000,
    protein: 150,
    carbs: 280,
  };

  const caloriesComplete = caloriesIntake >= nutritionGoals.calories;
  const waterComplete = waterIntake >= nutritionGoals.water;

  const waterOptions = [
    { label: '100ml', amount: 100 },
    { label: '250ml', amount: 250 },
    { label: '400ml', amount: 400 },
    { label: '500ml', amount: 500 },
    { label: '1L', amount: 1000 },
    { label: '+', amount: null },
  ];

  const addWater = (amount) => {
    if (amount) {
      setWaterIntake(prev => Math.min(prev + amount, 10000));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
        </View>

        <Text style={styles.sectionLabel}>TODAY'S NUTRITION</Text>

        {/* Calories & Water Circles */}
        <View style={styles.circlesRow}>
          {/* Calories Circle */}
          <View style={styles.circleCard}>
            <View style={styles.circleContainer}>
              <View style={[styles.progressRing, { borderColor: caloriesComplete ? COLORS.success : COLORS.accent }]}>
                <View style={styles.circleInner}>
                  {caloriesComplete ? (
                    <Check size={14} color={COLORS.success} strokeWidth={3} />
                  ) : (
                    <Flame size={16} color={COLORS.accent} />
                  )}
                  <Text style={[styles.circleValue, { color: caloriesComplete ? COLORS.success : COLORS.text }]}>
                    {caloriesIntake}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.circleLabel, { color: caloriesComplete ? COLORS.success : COLORS.text }]}>
              {caloriesComplete ? '✓ Calories' : 'Calories'}
            </Text>
            <Text style={[styles.circleSubtext, { color: caloriesComplete ? COLORS.success : COLORS.textMuted }]}>
              {caloriesComplete ? 'Goal reached!' : `${nutritionGoals.calories - caloriesIntake} remaining`}
            </Text>
          </View>

          {/* Water Circle */}
          <View style={styles.circleCard}>
            <View style={styles.circleContainer}>
              <View style={[styles.progressRing, { borderColor: waterComplete ? COLORS.success : COLORS.water }]}>
                <View style={styles.circleInner}>
                  {waterComplete ? (
                    <Check size={14} color={COLORS.success} strokeWidth={3} />
                  ) : (
                    <Droplets size={16} color={COLORS.water} />
                  )}
                  <Text style={[styles.circleValue, { color: waterComplete ? COLORS.success : COLORS.text }]}>
                    {(waterIntake / 1000).toFixed(1)}L
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.circleLabel, { color: waterComplete ? COLORS.success : COLORS.text }]}>
              {waterComplete ? '✓ Water' : 'Water'}
            </Text>
            <Text style={[styles.circleSubtext, { color: waterComplete ? COLORS.success : COLORS.textMuted }]}>
              {waterComplete ? 'Goal reached!' : `${((nutritionGoals.water - waterIntake) / 1000).toFixed(1)}L remaining`}
            </Text>
          </View>
        </View>

        {/* Quick Add Section */}
        <View style={styles.quickAddRow}>
          {/* Add Meal */}
          <View style={styles.quickAddCard}>
            <View style={styles.quickAddHeader}>
              <View style={[styles.quickAddIcon, { backgroundColor: COLORS.accent + '20' }]}>
                <Utensils size={14} color={COLORS.accent} />
              </View>
              <Text style={styles.quickAddTitle}>Add Meal</Text>
            </View>
            <TouchableOpacity style={[styles.logButton, { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent + '40' }]}>
              <Text style={[styles.logButtonText, { color: COLORS.accent }]}>Log Meal</Text>
            </TouchableOpacity>
            {/* Macro rings */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.round((proteinIntake / nutritionGoals.protein) * 100)}%</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.round((carbsIntake / nutritionGoals.carbs) * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Quick Water */}
          <View style={styles.quickAddCard}>
            <View style={styles.quickAddHeader}>
              <View style={[styles.quickAddIcon, { backgroundColor: COLORS.water + '20' }]}>
                <Droplets size={14} color={COLORS.water} />
              </View>
              <Text style={styles.quickAddTitle}>Quick Water</Text>
            </View>
            <View style={styles.waterGrid}>
              {waterOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.waterButton,
                    { backgroundColor: opt.amount ? COLORS.water + '15' : COLORS.surfaceLight }
                  ]}
                  onPress={() => addWater(opt.amount)}
                >
                  <Text style={[styles.waterButtonText, { color: opt.amount ? COLORS.water : COLORS.textMuted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    paddingVertical: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  circlesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  circleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  circleContainer: {
    marginBottom: 8,
  },
  progressRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    alignItems: 'center',
    gap: 2,
  },
  circleValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  circleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  circleSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quickAddIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  logButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroValue: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  waterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  waterButton: {
    width: '30%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  waterButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default HealthScreen;
