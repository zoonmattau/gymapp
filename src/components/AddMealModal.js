import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Search, Plus, Star, Clock } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { nutritionService } from '../services/nutritionService';
import { useAuth } from '../contexts/AuthContext';
import { QUICK_FOODS, FOOD_CATEGORIES } from '../constants/quickFoods';

const AddMealModal = ({ visible, onClose, onAdd }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [frequentMeals, setFrequentMeals] = useState([]);
  const [loadingFrequent, setLoadingFrequent] = useState(false);

  // Serving size editor state
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingMultiplier, setServingMultiplier] = useState('1');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');

  // Load frequent meals when modal opens
  useEffect(() => {
    if (visible && user?.id) {
      loadFrequentMeals();
    }
  }, [visible, user?.id]);

  const loadFrequentMeals = async () => {
    try {
      setLoadingFrequent(true);
      const { data } = await nutritionService.getFrequentMeals(user.id, 8);
      if (data) {
        setFrequentMeals(data);
      }
    } catch (error) {
      console.log('Error loading frequent meals:', error);
    } finally {
      setLoadingFrequent(false);
    }
  };

  // Manual entry state
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const filteredFoods = QUICK_FOODS.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open serving editor for a food
  const openServingEditor = (food) => {
    setSelectedFood(food);
    setServingMultiplier('1');
    setCustomCalories(String(food.calories || 0));
    setCustomProtein(String(food.protein || 0));
    setCustomCarbs(String(food.carbs || 0));
    setCustomFats(String(food.fats || 0));
  };

  // Update macros when serving multiplier changes
  const handleServingChange = (value) => {
    setServingMultiplier(value);
    const mult = parseFloat(value) || 0;
    if (selectedFood) {
      setCustomCalories(String(Math.round((selectedFood.calories || 0) * mult)));
      setCustomProtein(String(Math.round((selectedFood.protein || 0) * mult)));
      setCustomCarbs(String(Math.round((selectedFood.carbs || 0) * mult)));
      setCustomFats(String(Math.round((selectedFood.fats || 0) * mult)));
    }
  };

  // Confirm adding with current values
  const confirmAdd = () => {
    onAdd({
      name: selectedFood.name,
      calories: parseInt(customCalories) || 0,
      protein: parseInt(customProtein) || 0,
      carbs: parseInt(customCarbs) || 0,
      fats: parseInt(customFats) || 0,
    });
    setSelectedFood(null);
    onClose();
  };

  // Close serving editor without adding
  const cancelServingEditor = () => {
    setSelectedFood(null);
  };

  const handleQuickAdd = (food) => {
    openServingEditor(food);
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

  // Serving Editor View
  const renderServingEditor = () => (
    <View style={styles.servingEditor}>
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelServingEditor} style={styles.closeButton}>
          <X size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Adjust Serving</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.servingContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.servingFoodName}>{selectedFood?.name}</Text>
        {selectedFood?.serving && (
          <Text style={styles.servingDescription}>
            Base serving: {selectedFood.serving}
          </Text>
        )}

        {/* Serving Multiplier */}
        <View style={styles.servingRow}>
          <Text style={styles.servingLabel}>Servings</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity
              style={styles.servingBtn}
              onPress={() => {
                const current = parseFloat(servingMultiplier) || 1;
                if (current > 0.25) handleServingChange(String(Math.max(0.25, current - 0.25)));
              }}
            >
              <Text style={styles.servingBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.servingInput}
              value={servingMultiplier}
              onChangeText={handleServingChange}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.servingBtn}
              onPress={() => {
                const current = parseFloat(servingMultiplier) || 1;
                handleServingChange(String(current + 0.25));
              }}
            >
              <Text style={styles.servingBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick serving buttons */}
        <View style={styles.quickServings}>
          {['0.5', '1', '1.5', '2'].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.quickServingBtn,
                servingMultiplier === val && styles.quickServingBtnActive,
              ]}
              onPress={() => handleServingChange(val)}
            >
              <Text
                style={[
                  styles.quickServingText,
                  servingMultiplier === val && styles.quickServingTextActive,
                ]}
              >
                {val}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Editable Macros */}
        <Text style={styles.macroEditLabel}>Nutrition (editable)</Text>

        <View style={styles.macroEditRow}>
          <View style={styles.macroEditItem}>
            <Text style={styles.macroEditName}>Calories</Text>
            <TextInput
              style={styles.macroEditInput}
              value={customCalories}
              onChangeText={setCustomCalories}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        </View>

        <View style={styles.macroEditRow}>
          <View style={styles.macroEditItem}>
            <Text style={styles.macroEditName}>Protein (g)</Text>
            <TextInput
              style={styles.macroEditInput}
              value={customProtein}
              onChangeText={setCustomProtein}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
          <View style={styles.macroEditItem}>
            <Text style={styles.macroEditName}>Carbs (g)</Text>
            <TextInput
              style={styles.macroEditInput}
              value={customCarbs}
              onChangeText={setCustomCarbs}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
          <View style={styles.macroEditItem}>
            <Text style={styles.macroEditName}>Fats (g)</Text>
            <TextInput
              style={styles.macroEditInput}
              value={customFats}
              onChangeText={setCustomFats}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={confirmAdd}>
          <Plus size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.confirmButtonText}>Add to Log</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Show serving editor or main view */}
          {selectedFood ? renderServingEditor() : (
          <>
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
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (text) setSelectedCategory('All');
                  }}
                />
              </View>

              <FlatList
                horizontal
                data={FOOD_CATEGORIES}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                style={styles.filterList}
                contentContainerStyle={styles.filterContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedCategory === item && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === item && styles.filterChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
                {/* Frequent Meals Section */}
                {frequentMeals.length > 0 && !searchQuery && selectedCategory === 'All' && (
                  <View style={styles.frequentSection}>
                    <View style={styles.sectionHeader}>
                      <Clock size={14} color={COLORS.textMuted} />
                      <Text style={styles.sectionTitle}>Frequently Logged</Text>
                    </View>
                    {loadingFrequent ? (
                      <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
                    ) : (
                      frequentMeals.map((meal, index) => (
                        <TouchableOpacity
                          key={`freq-${index}`}
                          style={styles.foodItem}
                          onPress={() => handleQuickAdd({
                            name: meal.name,
                            calories: meal.cal,
                            protein: meal.p,
                            carbs: meal.c,
                            fats: meal.f,
                          })}
                        >
                          <View style={[styles.foodIcon, { backgroundColor: COLORS.primary + '20' }]}>
                            <Star size={18} color={COLORS.primary} fill={COLORS.primary} />
                          </View>
                          <View style={styles.foodInfo}>
                            <Text style={styles.foodName}>{meal.name}</Text>
                            <Text style={styles.foodServing}>Logged {meal.count}x</Text>
                          </View>
                          <View style={styles.foodMacros}>
                            <Text style={styles.foodCalories}>{meal.cal} cal</Text>
                            <Text style={styles.foodMacroDetail}>
                              P: {meal.p}g • C: {meal.c}g • F: {meal.f}g
                            </Text>
                          </View>
                          <Plus size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                {/* Quick Foods Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : selectedCategory !== 'All' ? selectedCategory : 'All Foods'}</Text>
                </View>
                {filteredFoods.map((food, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.foodItem}
                    onPress={() => handleQuickAdd(food)}
                  >
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
          </>
          )}
        </KeyboardAvoidingView>
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
    color: COLORS.textOnPrimary,
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
  filterList: {
    flexGrow: 0,
    marginTop: 12,
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
  foodList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  frequentSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Serving Editor Styles
  servingEditor: {
    flex: 1,
  },
  servingContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  servingFoodName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  servingDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  servingLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingBtnText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '500',
  },
  servingInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    width: 60,
  },
  quickServings: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickServingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  quickServingBtnActive: {
    backgroundColor: COLORS.primary,
  },
  quickServingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  quickServingTextActive: {
    color: COLORS.textOnPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  macroEditLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  macroEditRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  macroEditItem: {
    flex: 1,
  },
  macroEditName: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  macroEditInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  confirmButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMealModal;
