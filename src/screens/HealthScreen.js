import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Flame, Droplets, Utensils, Check, Trash2, Scale } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { nutritionService } from '../services/nutritionService';
import AddMealModal from '../components/AddMealModal';
import WaterEntryModal from '../components/WaterEntryModal';

const HealthScreen = () => {
  const { user } = useAuth();

  // Nutrition state
  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [proteinIntake, setProteinIntake] = useState(0);
  const [carbsIntake, setCarbsIntake] = useState(0);
  const [fatsIntake, setFatsIntake] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0);
  const [meals, setMeals] = useState([]);

  // Modals
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showWaterEntry, setShowWaterEntry] = useState(false);

  // Goals
  const nutritionGoals = {
    calories: 2200,
    protein: 150,
    carbs: 280,
    fats: 70,
    water: 3000,
  };

  useEffect(() => {
    if (user?.id) {
      loadTodayNutrition();
    }
  }, [user]);

  const loadTodayNutrition = async () => {
    try {
      const { data } = await nutritionService.getTodaySummary(user.id);
      if (data) {
        setCaloriesIntake(data.calories || 0);
        setProteinIntake(data.protein || 0);
        setCarbsIntake(data.carbs || 0);
        setFatsIntake(data.fats || 0);
        setWaterIntake(data.water || 0);
      }

      const { data: mealsData } = await nutritionService.getTodayMeals(user.id);
      if (mealsData) {
        setMeals(mealsData);
      }
    } catch (error) {
      console.log('Error loading nutrition:', error);
    }
  };

  const handleAddMeal = async (meal) => {
    // Optimistic update
    setCaloriesIntake(prev => prev + meal.calories);
    setProteinIntake(prev => prev + meal.protein);
    setCarbsIntake(prev => prev + meal.carbs);
    setFatsIntake(prev => prev + meal.fats);

    const newMeal = {
      id: Date.now().toString(),
      ...meal,
      logged_at: new Date().toISOString(),
    };
    setMeals(prev => [...prev, newMeal]);

    // Save to database
    if (user?.id) {
      try {
        await nutritionService.logMeal(user.id, meal);
      } catch (error) {
        console.log('Error saving meal:', error);
      }
    }
  };

  const handleDeleteMeal = (meal) => {
    Alert.alert('Delete Meal', `Remove ${meal.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setCaloriesIntake(prev => prev - meal.calories);
          setProteinIntake(prev => prev - meal.protein);
          setCarbsIntake(prev => prev - meal.carbs);
          setFatsIntake(prev => prev - meal.fats);
          setMeals(prev => prev.filter(m => m.id !== meal.id));

          if (user?.id && meal.id) {
            await nutritionService.deleteMeal(meal.id, user.id);
          }
        },
      },
    ]);
  };

  const handleAddWater = async (amount) => {
    setWaterIntake(prev => Math.min(prev + amount, 10000));

    if (user?.id) {
      try {
        await nutritionService.logWater(user.id, amount);
      } catch (error) {
        console.log('Error saving water:', error);
      }
    }
  };

  const quickAddWater = (amount) => {
    handleAddWater(amount);
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
            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: COLORS.accent + '20', borderColor: COLORS.accent + '40' }]}
              onPress={() => setShowAddMeal(true)}
            >
              <Text style={[styles.logButtonText, { color: COLORS.accent }]}>Log Meal</Text>
            </TouchableOpacity>
            {/* Macro rings */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={[styles.macroValue, { color: COLORS.primary }]}>
                  {Math.round((proteinIntake / nutritionGoals.protein) * 100)}%
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={[styles.macroValue, { color: COLORS.warning }]}>
                  {Math.round((carbsIntake / nutritionGoals.carbs) * 100)}%
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={[styles.macroValue, { color: COLORS.fats }]}>
                  {Math.round((fatsIntake / nutritionGoals.fats) * 100)}%
                </Text>
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
                  onPress={() => opt.amount ? quickAddWater(opt.amount) : setShowWaterEntry(true)}
                >
                  <Text style={[styles.waterButtonText, { color: opt.amount ? COLORS.water : COLORS.textMuted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Recent Meals */}
        {meals.length > 0 && (
          <View style={styles.mealsSection}>
            <Text style={styles.sectionLabel}>TODAY'S MEALS</Text>
            {meals.slice().reverse().map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealIcon}>
                  <Utensils size={16} color={COLORS.accent} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMacros}>
                    P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                  </Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                <TouchableOpacity
                  style={styles.deleteMealBtn}
                  onPress={() => handleDeleteMeal(meal)}
                >
                  <Trash2 size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <AddMealModal
        visible={showAddMeal}
        onClose={() => setShowAddMeal(false)}
        onAdd={handleAddMeal}
      />
      <WaterEntryModal
        visible={showWaterEntry}
        onClose={() => setShowWaterEntry(false)}
        onAdd={handleAddWater}
        currentIntake={waterIntake}
      />
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
    marginTop: 8,
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
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: 'bold',
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
  mealsSection: {
    marginTop: 20,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  mealMacros: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  mealCalories: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  deleteMealBtn: {
    padding: 6,
  },
});

export default HealthScreen;
