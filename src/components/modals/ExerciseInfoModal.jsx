import React from 'react';
import { X, Info, Zap } from 'lucide-react';
import { getExerciseInstructions } from '../../constants';

const ExerciseInfoModal = ({ COLORS, exerciseName, onClose }) => {
  const instructions = getExerciseInstructions(exerciseName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-auto" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
              <Info size={20} color={COLORS.primary} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>{exerciseName}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
            <X size={20} color={COLORS.textMuted} />
          </button>
        </div>

        {/* Setup Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>1</div>
            <h4 className="font-semibold" style={{ color: COLORS.text }}>Setup</h4>
          </div>
          <div className="space-y-2 pl-8">
            {instructions.setup.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>{idx + 1}.</span>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>2</div>
            <h4 className="font-semibold" style={{ color: COLORS.text }}>Execution</h4>
          </div>
          <div className="space-y-2 pl-8">
            {instructions.execution.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>{idx + 1}.</span>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '20' }}>
              <Zap size={14} color={COLORS.warning} />
            </div>
            <h4 className="font-semibold" style={{ color: COLORS.text }}>Pro Tips</h4>
          </div>
          <div className="space-y-2 pl-8">
            {instructions.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-sm" style={{ color: COLORS.warning }}>•</span>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold mt-2"
          style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default ExerciseInfoModal;
