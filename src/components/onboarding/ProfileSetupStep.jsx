import React, { useRef } from 'react';
import { User } from 'lucide-react';

const ProfileSetupStep = ({ userData, setUserData, COLORS }) => {
  const usernameRef = React.useRef(null);
  const bioRef = React.useRef(null);

  const genderOptions = [
    { id: 'male', label: 'Male', icon: '♂️' },
    { id: 'female', label: 'Female', icon: '♀️' },
    { id: 'other', label: 'Other', icon: '⚧️' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm mb-2 block" style={{ color: COLORS.textMuted }}>Username</label>
        <input
          ref={usernameRef}
          type="text"
          defaultValue={userData.username}
          onBlur={e => {
            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
            e.target.value = val; // Update displayed value
            setUserData(p => ({...p, username: val}));
          }}
          placeholder="e.g. fitwarrior_23"
          className="w-full p-4 rounded-xl text-lg"
          style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
          maxLength={20}
        />
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Lowercase letters, numbers, and underscores only • Tap outside to confirm
        </p>
      </div>
      <div>
        <label className="text-sm mb-2 block" style={{ color: COLORS.textMuted }}>Gender</label>
        <div className="grid grid-cols-3 gap-2">
          {genderOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => setUserData(p => ({...p, gender: option.id}))}
              className="p-3 rounded-xl flex flex-col items-center gap-1"
              style={{
                backgroundColor: userData.gender === option.id ? COLORS.primary + '20' : COLORS.surface,
                border: `2px solid ${userData.gender === option.id ? COLORS.primary : COLORS.surfaceLight}`
              }}
            >
              <span className="text-xl">{option.icon}</span>
              <span
                className="text-sm font-medium"
                style={{ color: userData.gender === option.id ? COLORS.primary : COLORS.text }}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm mb-2 block" style={{ color: COLORS.textMuted }}>Bio (optional)</label>
        <textarea
          ref={bioRef}
          defaultValue={userData.bio}
          onBlur={e => {
            setUserData(p => ({...p, bio: e.target.value}));
          }}
          placeholder="Tell others about your fitness journey..."
          className="w-full p-4 rounded-xl text-sm resize-none"
          style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
          rows={3}
          maxLength={150}
        />
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.primary + '10' }}>
        <p className="text-sm" style={{ color: COLORS.primary }}>
          💡 Your username will be visible to friends and in challenges. You can change it anytime.
        </p>
      </div>
    </div>
  );
};


export default ProfileSetupStep;
