import React, { useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';

const WeightGoalStep = ({ userData, setUserData, COLORS }) => {
  const currentWeightRef = React.useRef(null);
  const goalWeightRef = React.useRef(null);
  
  // Reasonable human weight bounds (in kg)
  const MIN_WEIGHT = 35;
  const MAX_WEIGHT = 250;
  
  const currentW = parseFloat(userData.currentWeight) || 0;
  const goalW = parseFloat(userData.goalWeight) || 0;
  const diff = goalW - currentW;
  const weeks = userData.programWeeks || 16;
  const weeklyChange = currentW && goalW ? (diff / weeks) : 0;
  
  // Weight validation
  const isValidWeight = (w) => w >= MIN_WEIGHT && w <= MAX_WEIGHT;
  const currentWeightValid = !userData.currentWeight || isValidWeight(currentW);
  const goalWeightValid = !userData.goalWeight || isValidWeight(goalW);
  
  const getSuggestedGoal = () => {
    if (!currentW || !isValidWeight(currentW)) return '';
    if (userData.goal === 'lose_fat') return (currentW * 0.9).toFixed(1);
    if (userData.goal === 'build_muscle' || userData.goal === 'strength') return (currentW * 1.05).toFixed(1);
    return currentW.toFixed(1);
  };
  
  const getWarning = () => {
    if (!currentW || !goalW) return null;
    if (!isValidWeight(currentW) || !isValidWeight(goalW)) return null; // Handled separately
    
    const absWeekly = Math.abs(weeklyChange);
    
    if (userData.goal === 'lose_fat') {
      if (diff > 0) return { type: 'error', msg: 'Your goal weight is higher than current. For fat loss, set a lower target.' };
      if (absWeekly > 1) return { type: 'error', msg: `Losing ${absWeekly.toFixed(1)}kg/week is too aggressive. Max recommended: 1kg/week.` };
      if (absWeekly > 0.75) return { type: 'warning', msg: `${absWeekly.toFixed(1)}kg/week is ambitious. Consider a slower pace for sustainability.` };
    } else if (userData.goal === 'build_muscle' || userData.goal === 'strength') {
      if (diff < 0) return { type: 'error', msg: 'Your goal weight is lower than current. For muscle gain, set a higher target.' };
      if (absWeekly > 0.5) return { type: 'error', msg: `Gaining ${absWeekly.toFixed(1)}kg/week may lead to excess fat. Max recommended: 0.5kg/week.` };
      if (absWeekly > 0.35) return { type: 'warning', msg: `${absWeekly.toFixed(1)}kg/week is ambitious. Slower gains = leaner results.` };
    }
    return null;
  };
  
  const warning = getWarning();
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm mb-2 block" style={{ color: COLORS.textMuted }}>Current Weight (kg)</label>
        <input
          ref={currentWeightRef}
          type="text"
          inputMode="decimal"
          defaultValue={userData.currentWeight}
          onBlur={e => {
            const val = e.target.value.replace(/[^0-9.]/g, '');
            setUserData(p => ({...p, currentWeight: val}));
          }}
          placeholder="e.g. 80"
          className="w-full p-4 rounded-xl text-xl font-bold text-center"
          style={{ 
            backgroundColor: COLORS.surface, 
            color: COLORS.text, 
            border: `2px solid ${!currentWeightValid ? COLORS.error : COLORS.surfaceLight}` 
          }}
        />
        {!currentWeightValid && (
          <p className="text-xs mt-1" style={{ color: COLORS.error }}>
            Please enter a realistic weight ({MIN_WEIGHT}-{MAX_WEIGHT}kg)
          </p>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm" style={{ color: COLORS.textMuted }}>Goal Weight (kg)</label>
          {userData.currentWeight && !userData.goalWeight && isValidWeight(currentW) && (
            <button 
              onClick={() => {
                const suggested = getSuggestedGoal();
                if (goalWeightRef.current) goalWeightRef.current.value = suggested;
                setUserData(p => ({...p, goalWeight: suggested}));
              }}
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
            >
              Use Suggested: {getSuggestedGoal()}kg
            </button>
          )}
        </div>
        <input
          ref={goalWeightRef}
          type="text"
          inputMode="decimal"
          defaultValue={userData.goalWeight}
          onBlur={e => {
            const val = e.target.value.replace(/[^0-9.]/g, '');
            setUserData(p => ({...p, goalWeight: val}));
          }}
          placeholder={userData.goal === 'build_muscle' || userData.goal === 'strength' ? 'e.g. 85' : 'e.g. 75'}
          className="w-full p-4 rounded-xl text-xl font-bold text-center"
          style={{ 
            backgroundColor: COLORS.surface, 
            color: COLORS.text, 
            border: `2px solid ${!goalWeightValid ? COLORS.error : COLORS.surfaceLight}` 
          }}
        />
        {!goalWeightValid && (
          <p className="text-xs mt-1" style={{ color: COLORS.error }}>
            Please enter a realistic weight ({MIN_WEIGHT}-{MAX_WEIGHT}kg)
          </p>
        )}
      </div>

      <div>
        <label className="text-sm mb-2 block" style={{ color: COLORS.textMuted }}>Program Duration</label>
        <div className="flex gap-2">
          {[12, 16, 20, 24].map(w => (
            <button
              key={w}
              onClick={() => setUserData(p => ({...p, programWeeks: w}))}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ 
                backgroundColor: userData.programWeeks === w ? COLORS.primary : COLORS.surface,
                color: userData.programWeeks === w ? COLORS.text : COLORS.textMuted,
                border: `2px solid ${userData.programWeeks === w ? COLORS.primary : COLORS.surfaceLight}`
              }}
            >
              {w} weeks
            </button>
          ))}
        </div>
      </div>

      {/* Rest Days Selector */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm" style={{ color: COLORS.textMuted }}>Rest Days</label>
          <button
            onClick={() => {
              // Suggest rest days based on goal (Mon=0, Sun=6 in our system)
              const suggested = userData.goal === 'strength' 
                ? [2, 6] // Wed, Sun for heavy lifting recovery
                : userData.goal === 'build_muscle'
                ? [3, 6] // Thu, Sun
                : [5, 6]; // Sat, Sun for general/fat loss
              setUserData(p => ({...p, restDays: suggested}));
            }}
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: COLORS.accent + '20', color: COLORS.accent }}
          >
            Use Suggested
          </button>
        </div>
        <div className="flex gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const isRestDay = userData.restDays?.includes(index);
            return (
              <button
                key={day}
                onClick={() => {
                  setUserData(p => ({
                    ...p,
                    restDays: isRestDay 
                      ? p.restDays.filter(d => d !== index)
                      : [...(p.restDays || []), index].sort((a, b) => a - b)
                  }));
                }}
                className="flex-1 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1"
                style={{ 
                  backgroundColor: isRestDay ? COLORS.surfaceLight : COLORS.primary,
                  color: isRestDay ? COLORS.textMuted : COLORS.text,
                  border: `2px solid ${isRestDay ? COLORS.surfaceLight : COLORS.primary}`
                }}
              >
                <span>{day}</span>
                <span style={{ fontSize: 10 }}>{isRestDay ? 'Rest' : 'Train'}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            Tap days to toggle
          </p>
          <p className="text-xs font-semibold" style={{ color: COLORS.primary }}>
            {7 - (userData.restDays?.length || 0)} training days/week
          </p>
        </div>
      </div>

      {currentWeightValid && goalWeightValid && currentW > 0 && goalW > 0 && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: COLORS.textMuted }}>Total Change</span>
            <span className="font-bold" style={{ color: diff < 0 ? COLORS.accent : COLORS.success }}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: COLORS.textMuted }}>Weekly Target</span>
            <span className="font-bold" style={{ color: COLORS.text }}>
              {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(2)}kg/week
            </span>
          </div>
        </div>
      )}

      {warning && (
        <div 
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ backgroundColor: warning.type === 'error' ? COLORS.error + '20' : COLORS.warning + '20' }}
        >
          <AlertCircle size={20} color={warning.type === 'error' ? COLORS.error : COLORS.warning} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: warning.type === 'error' ? COLORS.error : COLORS.warning }}>
            {warning.msg}
          </p>
        </div>
      )}

      {!warning && currentWeightValid && goalWeightValid && currentW > 0 && goalW > 0 && (
        <div 
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ backgroundColor: COLORS.success + '20' }}
        >
          <Check size={20} color={COLORS.success} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: COLORS.success }}>
            This is a healthy, sustainable goal. You're set for success!
          </p>
        </div>
      )}
      
      <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
        Tap outside the input to update calculations
      </p>
    </div>
  );
};


export default WeightGoalStep;
