import React, { useState } from 'react';
import { X, Plus, Minus, Droplets } from 'lucide-react';

const WaterEntryModal = ({ COLORS, onClose, onSave }) => {
  const [amount, setAmount] = React.useState('');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>Add Water</h3>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
            <X size={20} color={COLORS.textMuted} />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[250, 500, 750, 1000, 1500, 2000].map(amt => (
            <button
              key={amt}
              onClick={() => setAmount(amt.toString())}
              className="py-3 rounded-xl text-sm font-semibold"
              style={{ 
                backgroundColor: amount === amt.toString() ? COLORS.water : COLORS.surfaceLight, 
                color: amount === amt.toString() ? COLORS.text : COLORS.water 
              }}
            >
              {amt >= 1000 ? `${amt/1000}L` : `${amt}ml`}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-sm mb-1 block" style={{ color: COLORS.textMuted }}>Custom Amount (ml)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter ml"
            className="w-full p-3 rounded-xl text-center text-xl font-bold"
            style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
          />
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
            onClick={() => onSave(parseInt(amount) || 0)}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.water, color: COLORS.text }}
          >
            Add Water
          </button>
        </div>
      </div>
    </div>
  );
};


export default WaterEntryModal;
