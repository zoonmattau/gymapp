import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Search, Plus, Utensils } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

// Quick add foods database
const QUICK_FOODS = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, serving: '100g' },
  { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fats: 1.8, serving: '1 cup' },
  { name: 'Eggs (2)', calories: 156, protein: 12, carbs: 1, fats: 10, serving: '2 large' },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fats: 0.7, serving: '170g' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, serving: '1 medium' },
  { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fats: 2.5, serving: '1 cup' },
  { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fats: 13, serving: '100g' },
  { name: 'Sweet Potato', calories: 103, protein: 2.3, carbs: 24, fats: 0.1, serving: '1 medium' },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fats: 14, serving: '28g' },
  { name: 'Protein Shake', calories: 120, protein: 25, carbs: 3, fats: 1, serving: '1 scoop' },
  { name: 'Avocado', calories: 234, protein: 3, carbs: 12, fats: 21, serving: '1 whole' },
  { name: 'Beef Steak', calories: 271, protein: 26, carbs: 0, fats: 18, serving: '100g' },
  { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, serving: '1 cup' },
  { name: 'Whole Wheat Bread', calories: 79, protein: 4, carbs: 15, fats: 1, serving: '1 slice' },
  { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fats: 4.3, serving: '100g' },
];

const AddMealModal = ({ visible, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState('quick');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual entry state
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const filteredFoods = QUICK_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickAdd = (food) => {
    onAdd({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    });
    onClose();
  };

  const handleManualAdd = () => {
    if (!mealName || !calories) return;

    onAdd({
      name: mealName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fats: parseInt(fats) || 0,
    });

    // Reset form
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Meal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'quick' && styles.tabActive]}
              onPress={() => setActiveTab('quick')}
            >
              <Text style={[styles.tabText, activeTab === 'quick' && styles.tabTextActive]}>
                Quick Add
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'quick' ? (
            <>
              {/* Search */}
              <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search foods..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Food List */}
              <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
                {filteredFoods.map((food, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.foodItem}
                    onPress={() => handleQuickAdd(food)}
                  >
                    <View style={styles.foodIcon}>
                      <Utensils size={18} color={COLORS.accent} />
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodServing}>{food.serving}</Text>
                    </View>
                    <View style={styles.foodMacros}>
                      <Text style={styles.foodCalories}>{food.calories} cal</Text>
                      <Text style={styles.foodMacroDetail}>
                        P: {food.protein}g • C: {food.carbs}g • F: {food.fats}g
                      </Text>
                    </View>
                    <Plus size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <ScrollView style={styles.manualForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meal Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Chicken Salad"
                  placeholderTextColor={COLORS.textMuted}
                  value={mealName}
                  onChangeText={setMealName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>

              <View style={styles.macroInputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Fats (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={fats}
                    onChangeText={setFats}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, (!mealName || !calories) && styles.addButtonDisabled]}
                onPress={handleManualAdd}
                disabled={!mealName || !calories}
              >
                <Text style={styles.addButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
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
  foodList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  foodServing: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  foodMacros: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  foodCalories: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  foodMacroDetail: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  manualForm: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMealModal;
