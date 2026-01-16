import React, { useState } from 'react';
import { X, Plus, Minus, Search, ChevronDown, ChevronUp } from 'lucide-react';

const FullMealEntryModal = ({ COLORS, onClose, onSave }) => {
  const [name, setName] = React.useState('');
  const [calories, setCalories] = React.useState('');
  const [protein, setProtein] = React.useState('');
  const [carbs, setCarbs] = React.useState('');
  const [fats, setFats] = React.useState('');
  const [time, setTime] = React.useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [showEstimator, setShowEstimator] = React.useState(false);
  const [selectedProtein, setSelectedProtein] = React.useState(null);
  const [selectedCarb, setSelectedCarb] = React.useState(null);
  const [selectedFat, setSelectedFat] = React.useState(null);
  const [portionSize, setPortionSize] = React.useState('medium');
  
  // Portion multipliers
  const portionMultipliers = { small: 0.7, medium: 1, large: 1.4, xl: 1.8 };
  
  // Food database for estimation - EXPANDED
  const proteinSources = [
    { name: 'Chicken Breast', per100g: { cal: 165, p: 31, c: 0, f: 4 } },
    { name: 'Chicken Thigh', per100g: { cal: 209, p: 26, c: 0, f: 11 } },
    { name: 'Beef Steak', per100g: { cal: 250, p: 26, c: 0, f: 15 } },
    { name: 'Beef Mince (lean)', per100g: { cal: 176, p: 20, c: 0, f: 10 } },
    { name: 'Salmon', per100g: { cal: 208, p: 20, c: 0, f: 13 } },
    { name: 'Tuna', per100g: { cal: 132, p: 28, c: 0, f: 1 } },
    { name: 'Prawns', per100g: { cal: 99, p: 24, c: 0, f: 0.3 } },
    { name: 'White Fish', per100g: { cal: 96, p: 21, c: 0, f: 1 } },
    { name: 'Eggs (2)', per100g: { cal: 155, p: 13, c: 1, f: 11 } },
    { name: 'Egg Whites (4)', per100g: { cal: 52, p: 11, c: 1, f: 0 } },
    { name: 'Tofu', per100g: { cal: 76, p: 8, c: 2, f: 4 } },
    { name: 'Tempeh', per100g: { cal: 193, p: 19, c: 9, f: 11 } },
    { name: 'Greek Yogurt', per100g: { cal: 97, p: 9, c: 4, f: 5 } },
    { name: 'Cottage Cheese', per100g: { cal: 98, p: 11, c: 3, f: 4 } },
    { name: 'Protein Shake', per100g: { cal: 120, p: 24, c: 3, f: 1 } },
    { name: 'Turkey Breast', per100g: { cal: 135, p: 30, c: 0, f: 1 } },
    { name: 'Lamb', per100g: { cal: 294, p: 25, c: 0, f: 21 } },
    { name: 'Pork Loin', per100g: { cal: 143, p: 26, c: 0, f: 4 } },
    { name: 'Kangaroo', per100g: { cal: 98, p: 23, c: 0, f: 1 } },
  ];
  
  const carbSources = [
    { name: 'White Rice', per100g: { cal: 130, p: 3, c: 28, f: 0 } },
    { name: 'Brown Rice', per100g: { cal: 112, p: 3, c: 24, f: 1 } },
    { name: 'Basmati Rice', per100g: { cal: 121, p: 3, c: 25, f: 0 } },
    { name: 'Pasta', per100g: { cal: 131, p: 5, c: 25, f: 1 } },
    { name: 'Whole Wheat Pasta', per100g: { cal: 124, p: 5, c: 25, f: 1 } },
    { name: 'Potato', per100g: { cal: 77, p: 2, c: 17, f: 0 } },
    { name: 'Sweet Potato', per100g: { cal: 86, p: 2, c: 20, f: 0 } },
    { name: 'Bread (2 slices)', per100g: { cal: 265, p: 9, c: 49, f: 3 } },
    { name: 'Sourdough (2 slices)', per100g: { cal: 240, p: 8, c: 45, f: 2 } },
    { name: 'Oatmeal', per100g: { cal: 68, p: 2, c: 12, f: 1 } },
    { name: 'Quinoa', per100g: { cal: 120, p: 4, c: 21, f: 2 } },
    { name: 'Couscous', per100g: { cal: 112, p: 4, c: 23, f: 0 } },
    { name: 'Noodles', per100g: { cal: 138, p: 5, c: 25, f: 2 } },
    { name: 'Rice Noodles', per100g: { cal: 109, p: 1, c: 25, f: 0 } },
    { name: 'Wrap/Tortilla', per100g: { cal: 218, p: 6, c: 36, f: 5 } },
    { name: 'Bagel', per100g: { cal: 250, p: 10, c: 48, f: 1 } },
  ];
  
  const fatSources = [
    { name: 'Avocado (half)', per100g: { cal: 160, p: 2, c: 9, f: 15 } },
    { name: 'Olive Oil (tbsp)', per100g: { cal: 119, p: 0, c: 0, f: 14 } },
    { name: 'Coconut Oil (tbsp)', per100g: { cal: 121, p: 0, c: 0, f: 14 } },
    { name: 'Butter (pat)', per100g: { cal: 72, p: 0, c: 0, f: 8 } },
    { name: 'Nuts (handful)', per100g: { cal: 170, p: 5, c: 6, f: 15 } },
    { name: 'Almonds (handful)', per100g: { cal: 164, p: 6, c: 6, f: 14 } },
    { name: 'Cheese (slice)', per100g: { cal: 113, p: 7, c: 0, f: 9 } },
    { name: 'Feta (crumbled)', per100g: { cal: 75, p: 4, c: 1, f: 6 } },
    { name: 'Peanut Butter (tbsp)', per100g: { cal: 94, p: 4, c: 3, f: 8 } },
    { name: 'Almond Butter (tbsp)', per100g: { cal: 98, p: 3, c: 3, f: 9 } },
    { name: 'Seeds (tbsp)', per100g: { cal: 52, p: 2, c: 2, f: 5 } },
    { name: 'None/Minimal', per100g: { cal: 0, p: 0, c: 0, f: 0 } },
  ];

  // NEW: Vegetables
  const vegetableSources = [
    { name: 'Broccoli', per100g: { cal: 35, p: 2, c: 7, f: 0 } },
    { name: 'Spinach', per100g: { cal: 23, p: 3, c: 4, f: 0 } },
    { name: 'Mixed Salad', per100g: { cal: 20, p: 1, c: 4, f: 0 } },
    { name: 'Mushrooms', per100g: { cal: 22, p: 3, c: 3, f: 0 } },
    { name: 'Capsicum', per100g: { cal: 31, p: 1, c: 6, f: 0 } },
    { name: 'Zucchini', per100g: { cal: 17, p: 1, c: 3, f: 0 } },
    { name: 'Asparagus', per100g: { cal: 20, p: 2, c: 4, f: 0 } },
    { name: 'Green Beans', per100g: { cal: 31, p: 2, c: 7, f: 0 } },
    { name: 'Carrots', per100g: { cal: 41, p: 1, c: 10, f: 0 } },
    { name: 'Tomatoes', per100g: { cal: 18, p: 1, c: 4, f: 0 } },
    { name: 'Onion', per100g: { cal: 40, p: 1, c: 9, f: 0 } },
    { name: 'Corn', per100g: { cal: 86, p: 3, c: 19, f: 1 } },
    { name: 'Peas', per100g: { cal: 81, p: 5, c: 14, f: 0 } },
    { name: 'None', per100g: { cal: 0, p: 0, c: 0, f: 0 } },
  ];

  // NEW: Sauces & Toppings
  const toppingSources = [
    { name: 'Soy Sauce', per100g: { cal: 8, p: 1, c: 1, f: 0 } },
    { name: 'Teriyaki Sauce', per100g: { cal: 45, p: 1, c: 9, f: 0 } },
    { name: 'BBQ Sauce (tbsp)', per100g: { cal: 29, p: 0, c: 7, f: 0 } },
    { name: 'Hot Sauce', per100g: { cal: 3, p: 0, c: 1, f: 0 } },
    { name: 'Salsa', per100g: { cal: 17, p: 1, c: 4, f: 0 } },
    { name: 'Hummus (tbsp)', per100g: { cal: 27, p: 1, c: 2, f: 2 } },
    { name: 'Guacamole (tbsp)', per100g: { cal: 25, p: 0, c: 1, f: 2 } },
    { name: 'Tzatziki (tbsp)', per100g: { cal: 18, p: 1, c: 1, f: 1 } },
    { name: 'Mayo (tbsp)', per100g: { cal: 94, p: 0, c: 0, f: 10 } },
    { name: 'Mustard', per100g: { cal: 5, p: 0, c: 0, f: 0 } },
    { name: 'Pesto (tbsp)', per100g: { cal: 80, p: 2, c: 1, f: 8 } },
    { name: 'Tahini (tbsp)', per100g: { cal: 89, p: 3, c: 3, f: 8 } },
    { name: 'Sriracha', per100g: { cal: 15, p: 0, c: 3, f: 0 } },
    { name: 'Gravy (2 tbsp)', per100g: { cal: 25, p: 1, c: 3, f: 1 } },
    { name: 'None', per100g: { cal: 0, p: 0, c: 0, f: 0 } },
  ];

  const [selectedVegetable, setSelectedVegetable] = React.useState(null);
  const [selectedTopping, setSelectedTopping] = React.useState(null);
  
  const commonMeals = [
    { name: 'Chicken & Rice Bowl', cal: 450, p: 35, c: 45, f: 10 },
    { name: 'Burger & Fries', cal: 850, p: 30, c: 70, f: 45 },
    { name: 'Salad with Chicken', cal: 350, p: 30, c: 15, f: 18 },
    { name: 'Pasta with Meat Sauce', cal: 550, p: 25, c: 65, f: 18 },
    { name: 'Sandwich', cal: 400, p: 20, c: 40, f: 16 },
    { name: 'Pizza (2 slices)', cal: 550, p: 22, c: 60, f: 24 },
    { name: 'Sushi Roll (8pc)', cal: 350, p: 15, c: 50, f: 8 },
    { name: 'Stir Fry', cal: 400, p: 28, c: 35, f: 15 },
    { name: 'Omelette (3 egg)', cal: 300, p: 21, c: 3, f: 22 },
    { name: 'Smoothie Bowl', cal: 350, p: 15, c: 55, f: 8 },
    { name: 'Beef Burrito', cal: 680, p: 32, c: 65, f: 28 },
    { name: 'Poke Bowl', cal: 520, p: 35, c: 55, f: 15 },
    { name: 'Caesar Salad', cal: 380, p: 18, c: 20, f: 25 },
    { name: 'Ramen', cal: 550, p: 22, c: 70, f: 18 },
    { name: 'Fish & Chips', cal: 750, p: 28, c: 65, f: 40 },
    { name: 'Pad Thai', cal: 480, p: 20, c: 55, f: 18 },
    { name: 'Butter Chicken & Rice', cal: 620, p: 32, c: 50, f: 32 },
    { name: 'Greek Salad with Chicken', cal: 420, p: 35, c: 12, f: 26 },
    { name: 'Acai Bowl', cal: 420, p: 8, c: 75, f: 12 },
    { name: 'Meat Pie', cal: 480, p: 18, c: 35, f: 28 },
  ];
  
  // Calculate estimated macros
  const calculateEstimate = () => {
    const mult = portionMultipliers[portionSize];
    let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
    
    if (selectedProtein) {
      const p = proteinSources.find(s => s.name === selectedProtein);
      if (p) {
        totalCal += p.per100g.cal * mult;
        totalP += p.per100g.p * mult;
        totalC += p.per100g.c * mult;
        totalF += p.per100g.f * mult;
      }
    }
    if (selectedCarb) {
      const c = carbSources.find(s => s.name === selectedCarb);
      if (c) {
        totalCal += c.per100g.cal * mult;
        totalP += c.per100g.p * mult;
        totalC += c.per100g.c * mult;
        totalF += c.per100g.f * mult;
      }
    }
    if (selectedFat) {
      const f = fatSources.find(s => s.name === selectedFat);
      if (f) {
        totalCal += f.per100g.cal * mult;
        totalP += f.per100g.p * mult;
        totalC += f.per100g.c * mult;
        totalF += f.per100g.f * mult;
      }
    }
    if (selectedVegetable) {
      const v = vegetableSources.find(s => s.name === selectedVegetable);
      if (v) {
        totalCal += v.per100g.cal * mult;
        totalP += v.per100g.p * mult;
        totalC += v.per100g.c * mult;
        totalF += v.per100g.f * mult;
      }
    }
    if (selectedTopping) {
      const t = toppingSources.find(s => s.name === selectedTopping);
      if (t) {
        totalCal += t.per100g.cal;
        totalP += t.per100g.p;
        totalC += t.per100g.c;
        totalF += t.per100g.f;
      }
    }
    
    return {
      cal: Math.round(totalCal),
      p: Math.round(totalP),
      c: Math.round(totalC),
      f: Math.round(totalF)
    };
  };
  
  const applyEstimate = () => {
    const est = calculateEstimate();
    const parts = [];
    if (selectedProtein) parts.push(selectedProtein);
    if (selectedCarb) parts.push(selectedCarb);
    if (selectedVegetable && selectedVegetable !== 'None') parts.push(selectedVegetable);
    if (selectedFat && selectedFat !== 'None/Minimal') parts.push(selectedFat);
    if (selectedTopping && selectedTopping !== 'None') parts.push('w/ ' + selectedTopping);
    
    setName(parts.join(' + ') || 'Custom Meal');
    setCalories(est.cal.toString());
    setProtein(est.p.toString());
    setCarbs(est.c.toString());
    setFats(est.f.toString());
    setShowEstimator(false);
  };
  
  const applyCommonMeal = (meal) => {
    const mult = portionMultipliers[portionSize];
    setName(meal.name);
    setCalories(Math.round(meal.cal * mult).toString());
    setProtein(Math.round(meal.p * mult).toString());
    setCarbs(Math.round(meal.c * mult).toString());
    setFats(Math.round(meal.f * mult).toString());
    setShowEstimator(false);
  };
  
  const estimate = calculateEstimate();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 max-h-[90vh] overflow-auto" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>Add Meal</h3>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
            <X size={20} color={COLORS.textMuted} />
          </button>
        </div>
        
        {!showEstimator ? (
          <>
            {/* Don't know macros button */}
            <button
              onClick={() => setShowEstimator(true)}
              className="w-full p-3 rounded-xl mb-4 flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.accent + '20', border: `1px solid ${COLORS.accent}` }}
            >
              <Info size={16} color={COLORS.accent} />
              <span className="text-sm font-semibold" style={{ color: COLORS.accent }}>Don't know macros? Use estimator</span>
            </button>
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Meal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Chicken & Rice"
                  className="w-full p-3 rounded-xl text-sm"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                />
              </div>
              
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full p-3 rounded-xl text-sm"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none', colorScheme: 'dark' }}
                />
              </div>
              
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Calories</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={calories}
                  onChange={e => setCalories(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full p-3 rounded-xl text-sm"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Protein (g)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={protein}
                    onChange={e => setProtein(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full p-3 rounded-xl text-sm text-center"
                    style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Carbs (g)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={carbs}
                    onChange={e => setCarbs(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full p-3 rounded-xl text-sm text-center"
                    style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Fats (g)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fats}
                    onChange={e => setFats(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full p-3 rounded-xl text-sm text-center"
                    style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}
              >
                Cancel
              </button>
              <button 
                onClick={() => onSave({
                  id: Date.now(),
                  name: name || 'Meal',
                  time,
                  calories: parseInt(calories) || 0,
                  protein: parseInt(protein) || 0,
                  carbs: parseInt(carbs) || 0,
                  fats: parseInt(fats) || 0
                })}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
              >
                Add Meal
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Macro Estimator */}
            <button
              onClick={() => setShowEstimator(false)}
              className="flex items-center gap-2 mb-4"
              style={{ color: COLORS.textMuted }}
            >
              <ChevronLeft size={18} />
              <span className="text-sm">Back to manual entry</span>
            </button>
            
            {/* Portion Size */}
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>PORTION SIZE</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'small', label: 'Small', emoji: '🥄' },
                  { id: 'medium', label: 'Medium', emoji: '🍽️' },
                  { id: 'large', label: 'Large', emoji: '🍲' },
                  { id: 'xl', label: 'XL', emoji: '🍳' },
                ].map(size => (
                  <button
                    key={size.id}
                    onClick={() => setPortionSize(size.id)}
                    className="p-2 rounded-xl text-center"
                    style={{ 
                      backgroundColor: portionSize === size.id ? COLORS.primary : COLORS.surfaceLight,
                      color: portionSize === size.id ? COLORS.text : COLORS.textMuted
                    }}
                  >
                    <span className="text-lg">{size.emoji}</span>
                    <p className="text-xs mt-1">{size.label}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Common Meals */}
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>COMMON MEALS</p>
              <div className="flex flex-wrap gap-2">
                {commonMeals.map((meal, i) => (
                  <button
                    key={i}
                    onClick={() => applyCommonMeal(meal)}
                    className="px-3 py-2 rounded-xl text-xs"
                    style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}
                  >
                    {meal.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="border-t border-b py-3 my-3" style={{ borderColor: COLORS.surfaceLight }}>
              <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>OR build your own meal</p>
            </div>
            
            {/* Protein Source */}
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.primary }}>🍗 PROTEIN SOURCE</p>
              <div className="flex flex-wrap gap-2">
                {proteinSources.map((source, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedProtein(selectedProtein === source.name ? null : source.name)}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: selectedProtein === source.name ? COLORS.primary : COLORS.surfaceLight,
                      color: selectedProtein === source.name ? COLORS.text : COLORS.textSecondary
                    }}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Carb Source */}
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.warning }}>🍚 CARB SOURCE</p>
              <div className="flex flex-wrap gap-2">
                {carbSources.map((source, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCarb(selectedCarb === source.name ? null : source.name)}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: selectedCarb === source.name ? COLORS.warning : COLORS.surfaceLight,
                      color: selectedCarb === source.name ? COLORS.background : COLORS.textSecondary
                    }}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Fat Source */}
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.sleep }}>🥑 FAT SOURCE</p>
              <div className="flex flex-wrap gap-2">
                {fatSources.map((source, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFat(selectedFat === source.name ? null : source.name)}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: selectedFat === source.name ? COLORS.sleep : COLORS.surfaceLight,
                      color: selectedFat === source.name ? COLORS.text : COLORS.textSecondary
                    }}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Vegetables */}
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.protein }}>🥦 VEGETABLES</p>
              <div className="flex flex-wrap gap-2">
                {vegetableSources.map((source, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVegetable(selectedVegetable === source.name ? null : source.name)}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: selectedVegetable === source.name ? COLORS.protein : COLORS.surfaceLight,
                      color: selectedVegetable === source.name ? COLORS.background : COLORS.textSecondary
                    }}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sauces & Toppings */}
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.accent }}>🌶️ SAUCE / TOPPING</p>
              <div className="flex flex-wrap gap-2">
                {toppingSources.map((source, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTopping(selectedTopping === source.name ? null : source.name)}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: selectedTopping === source.name ? COLORS.accent : COLORS.surfaceLight,
                      color: selectedTopping === source.name ? COLORS.background : COLORS.textSecondary
                    }}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Estimate Preview */}
            {(selectedProtein || selectedCarb || selectedFat || selectedVegetable || selectedTopping) && (
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surfaceLight }}>
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>ESTIMATED MACROS</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold" style={{ color: COLORS.accent }}>{estimate.cal}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{estimate.p}g</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: COLORS.warning }}>{estimate.c}g</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>carbs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: COLORS.sleep }}>{estimate.f}g</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>fats</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={applyEstimate}
              disabled={!selectedProtein && !selectedCarb && !selectedFat && !selectedVegetable && !selectedTopping}
              className="w-full py-3 rounded-xl font-semibold"
              style={{ 
                backgroundColor: (selectedProtein || selectedCarb || selectedFat || selectedVegetable || selectedTopping) ? COLORS.primary : COLORS.surfaceLight,
                color: (selectedProtein || selectedCarb || selectedFat || selectedVegetable || selectedTopping) ? COLORS.text : COLORS.textMuted
              }}
            >
              Use This Estimate
            </button>
            
            <p className="text-xs text-center mt-3" style={{ color: COLORS.textMuted }}>
              Estimates are approximate. Adjust manually if needed.
            </p>
          </>
        )}
      </div>
    </div>
  );
};


export default FullMealEntryModal;
