import React, { useState, useRef } from 'react';
import { X, TrendingUp, TrendingDown, AlertCircle, Plus, Minus, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';

const WeighInModal = ({ COLORS, onClose, onSave, initialWeight, currentWeight, userGoal }) => {
  const [weight, setWeight] = React.useState(initialWeight.toString());
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [bodyFat, setBodyFat] = React.useState('');
  const [muscleMass, setMuscleMass] = React.useState('');
  const [showBodyComp, setShowBodyComp] = React.useState(false);
  
  const weightNum = parseFloat(weight) || 0;
  const isValid = weightNum >= 35 && weightNum <= 250;
  const diff = weightNum - currentWeight;
  
  const bodyFatNum = parseFloat(bodyFat) || 0;
  const muscleMassNum = parseFloat(muscleMass) || 0;
  const bodyFatValid = !bodyFat || (bodyFatNum >= 3 && bodyFatNum <= 60);
  const muscleMassValid = !muscleMass || (muscleMassNum >= 20 && muscleMassNum <= 70);
  
  // Green if: losing weight on lose_fat program, OR gaining weight on build_muscle/strength program
  const isGoodChange = 
    (userGoal === 'lose_fat' && diff < 0) || 
    ((userGoal === 'build_muscle' || userGoal === 'strength') && diff > 0) ||
    (userGoal === 'fitness' && diff === 0);
  const changeColor = diff === 0 ? COLORS.textMuted : isGoodChange ? COLORS.success : COLORS.error;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 max-h-[90vh] overflow-auto" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>Log Weigh-In</h3>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
            <X size={20} color={COLORS.textMuted} />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
            <TrendingUp size={36} color={COLORS.primary} />
          </div>
          <p className="text-sm mb-1" style={{ color: COLORS.textMuted }}>Date</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="font-semibold text-center bg-transparent border-none cursor-pointer"
            style={{ color: COLORS.text, colorScheme: 'dark' }}
          />
        </div>

        <div className="mb-6">
          <label className="text-sm mb-2 block" style={{ color: COLORS.textMuted }}>Your Weight</label>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setWeight(prev => (Math.max(35, (parseFloat(prev) || 0) - 0.1)).toFixed(1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.surfaceLight }}
            >
              <Minus size={20} color={COLORS.text} />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full text-center text-3xl font-bold py-3 rounded-xl"
                style={{ 
                  backgroundColor: COLORS.surfaceLight, 
                  color: COLORS.text, 
                  border: !isValid && weight !== '' ? `2px solid ${COLORS.error}` : 'none' 
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.textMuted }}>kg</span>
            </div>
            <button 
              onClick={() => setWeight(prev => (Math.min(250, (parseFloat(prev) || 0) + 0.1)).toFixed(1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.surfaceLight }}
            >
              <Plus size={20} color={COLORS.text} />
            </button>
          </div>
          {!isValid && weight !== '' && (
            <p className="text-xs mt-2 text-center" style={{ color: COLORS.error }}>
              Please enter a realistic weight (35-250kg)
            </p>
          )}
        </div>

        {/* Body Composition Toggle */}
        <button
          onClick={() => setShowBodyComp(!showBodyComp)}
          className="w-full p-3 rounded-xl mb-4 flex items-center justify-between"
          style={{ backgroundColor: COLORS.surfaceLight }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={18} color={COLORS.accent} />
            <span className="text-sm" style={{ color: COLORS.textSecondary }}>Add Body Composition (optional)</span>
          </div>
          {showBodyComp ? <ChevronUp size={18} color={COLORS.textMuted} /> : <ChevronDown size={18} color={COLORS.textMuted} />}
        </button>

        {/* Body Composition Fields */}
        {showBodyComp && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Body Fat %</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={bodyFat}
                    onChange={e => setBodyFat(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="e.g. 15"
                    className="w-full text-center text-xl font-bold py-2 rounded-xl"
                    style={{ 
                      backgroundColor: COLORS.surface, 
                      color: COLORS.text, 
                      border: !bodyFatValid ? `2px solid ${COLORS.error}` : 'none' 
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: COLORS.textMuted }}>%</span>
                </div>
                {!bodyFatValid && (
                  <p className="text-xs mt-1 text-center" style={{ color: COLORS.error }}>3-60%</p>
                )}
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Muscle Mass %</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={muscleMass}
                    onChange={e => setMuscleMass(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="e.g. 40"
                    className="w-full text-center text-xl font-bold py-2 rounded-xl"
                    style={{ 
                      backgroundColor: COLORS.surface, 
                      color: COLORS.text, 
                      border: !muscleMassValid ? `2px solid ${COLORS.error}` : 'none' 
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: COLORS.textMuted }}>%</span>
                </div>
                {!muscleMassValid && (
                  <p className="text-xs mt-1 text-center" style={{ color: COLORS.error }}>20-70%</p>
                )}
              </div>
            </div>
            <p className="text-xs text-center mt-3" style={{ color: COLORS.textMuted }}>
              💡 Measure with a smart scale or body composition analyzer
            </p>
          </div>
        )}

        <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surfaceLight }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: COLORS.textMuted }}>Last weigh-in</span>
            <span className="font-semibold" style={{ color: COLORS.text }}>{currentWeight}kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: COLORS.textMuted }}>Change</span>
            <span className="font-semibold" style={{ color: changeColor }}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
            </span>
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
            onClick={() => isValid && bodyFatValid && muscleMassValid && onSave({
              weight: weightNum,
              date,
              bodyFat: bodyFat ? parseFloat(bodyFat) : null,
              muscleMass: muscleMass ? parseFloat(muscleMass) : null
            })}
            disabled={!isValid || !bodyFatValid || !muscleMassValid}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ 
              backgroundColor: COLORS.primary, 
              color: COLORS.text,
              opacity: (isValid && bodyFatValid && muscleMassValid) ? 1 : 0.5
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};


export default WeighInModal;
