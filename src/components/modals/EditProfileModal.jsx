import React, { useState, useRef } from 'react';
import { X, User } from 'lucide-react';

const EditProfileModal = ({ userData, setUserData, COLORS, onClose }) => {
  const usernameRef = React.useRef(null);
  const firstNameRef = React.useRef(null);
  const lastNameRef = React.useRef(null);
  const bioRef = React.useRef(null);
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
        <button onClick={onClose}>
          <X size={24} color={COLORS.text} />
        </button>
        <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Edit Profile</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-3" style={{ backgroundColor: COLORS.primary + '20' }}>
            💪
          </div>
          <button className="text-sm px-4 py-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.primary }}>
            Change Avatar
          </button>
        </div>
        
        {/* Username */}
        <div className="mb-4">
          <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }}>@</span>
            <input
              ref={usernameRef}
              type="text"
              defaultValue={userData.username}
              onBlur={e => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                e.target.value = val;
                setUserData(prev => ({...prev, username: val}));
              }}
              className="w-full p-4 pl-8 rounded-xl"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
              maxLength={20}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            Lowercase letters, numbers, and underscores only
          </p>
        </div>
        
        {/* Display Name */}
        <div className="mb-4">
          <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Display Name</label>
          <div className="flex gap-2">
            <input
              ref={firstNameRef}
              type="text"
              defaultValue={userData.firstName}
              onBlur={e => setUserData(prev => ({...prev, firstName: e.target.value}))}
              placeholder="First"
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
            />
            <input
              ref={lastNameRef}
              type="text"
              defaultValue={userData.lastName}
              onBlur={e => setUserData(prev => ({...prev, lastName: e.target.value}))}
              placeholder="Last"
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
            />
          </div>
        </div>
        
        {/* Gender */}
        <div className="mb-4">
          <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'male', label: 'Male', icon: '♂️' },
              { id: 'female', label: 'Female', icon: '♀️' },
              { id: 'other', label: 'Other', icon: '⚧️' },
            ].map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setUserData(prev => ({...prev, gender: option.id}))}
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

        {/* Bio */}
        <div className="mb-4">
          <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Bio</label>
          <textarea
            ref={bioRef}
            defaultValue={userData.bio}
            onBlur={e => setUserData(prev => ({...prev, bio: e.target.value}))}
            placeholder="Tell others about your fitness journey..."
            className="w-full p-4 rounded-xl resize-none"
            style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
            rows={4}
            maxLength={150}
          />
          <p className="text-xs mt-1 text-right" style={{ color: COLORS.textMuted }}>
            {userData.bio?.length || 0}/150
          </p>
        </div>
        
        {/* Preview */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
          <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>PREVIEW - How others see you</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: COLORS.primary + '20' }}>💪</div>
            <div>
              <p className="font-bold" style={{ color: COLORS.text }}>@{userData.username || 'username'}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{userData.firstName || 'First'} {userData.lastName || 'Last'}</p>
            </div>
          </div>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            {userData.bio || 'No bio yet'}
          </p>
        </div>
      </div>
      
      <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
        <button 
          onClick={onClose}
          className="w-full py-4 rounded-xl font-semibold"
          style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
        >
          Done
        </button>
      </div>
    </div>
  );
};


export default EditProfileModal;
