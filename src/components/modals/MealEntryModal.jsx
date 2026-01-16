import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

const MealEntryModal = ({ COLORS, onClose, onSave }) => {
  const [name, setName] = React.useState('');
  const [calories, setCalories] = React.useState('');
  const [protein, setProtein] = React.useState('');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>Add Meal</h3>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
            <X size={20} color={COLORS.textMuted} />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm mb-1 block" style={{ color: COLORS.textMuted }}>Meal Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chicken & Rice"
              className="w-full p-3 rounded-xl text-sm"
              style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm mb-1 block" style={{ color: COLORS.textMuted }}>Calories</label>
              <input
                type="text"
                inputMode="numeric"
                value={calories}
                onChange={e => setCalories(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full p-3 rounded-xl text-sm text-center"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: COLORS.textMuted }}>Protein (g)</label>
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
            onClick={() => onSave(parseInt(calories) || 0, parseInt(protein) || 0)}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
          >
            Add Meal
          </button>
        </div>
      </div>
    </div>
  );
};


export default MealEntryModal;
