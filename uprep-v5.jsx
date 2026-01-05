import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight, ChevronLeft, Check, Plus, Minus, Play, X, Droplets, Moon, TrendingUp, User, Home, Dumbbell, Apple, BarChart3, Trophy, Flame, Clock, Target, Info, Calendar, AlertCircle, Zap, Coffee, Utensils, ChevronDown, ChevronUp, Eye, Undo2, Search, Book, History, Award, Edit3, Filter, ArrowLeftRight, GripVertical, Users, Heart, MessageCircle, Share2, Crown, Medal, Loader2 } from 'lucide-react';
import { useAuth } from './src/contexts/AuthContext';
import { workoutService } from './src/services/workoutService';
import { sleepService } from './src/services/sleepService';
import { streakService } from './src/services/streakService';
import { nutritionService } from './src/services/nutritionService';
import { profileService } from './src/services/profileService';
import { generateNutritionTargets, projectWeightProgress, generateWorkoutSchedule } from './src/utils/fitnessCalculations';

// Dark mode color palette
const COLORS_DARK = {
  primary: '#06B6D4',        // Cyan - fresh, energetic, modern
  primaryDark: '#0891B2',    // Darker cyan for hover/pressed
  accent: '#22D3EE',         // Lighter cyan accent
  background: '#0D0F12',     // Dark background
  surface: '#121417',        // Card surface
  surfaceLight: '#1E2024',   // Slightly lighter surface
  text: '#F3F4F6',           // Primary text (slightly brighter)
  textSecondary: '#D1D5DB',  // Secondary text
  textMuted: '#9CA3AF',      // Muted text
  success: '#22C55E',        // Green - ONLY for success, wins, completed
  warning: '#FBBF24',        // Yellow warning
  error: '#EF4444',          // Red error
  border: '#2A2D32',         // Subtle borders
  // Category colors (all visually distinct)
  water: '#60A5FA',          // Blue - water
  sleep: '#C4B5FD',          // Soft lavender - sleep
  fats: '#F59E0B',           // Amber - fats
  protein: '#F472B6',        // Pink - protein
  carbs: '#FB923C',          // Orange - carbs
  supplements: '#FBBF24',    // Yellow - supplements (electric/zap)
};

// Light mode color palette
const COLORS_LIGHT = {
  primary: '#0891B2',        // Cyan 600 - slightly darker for light bg
  primaryDark: '#0E7490',    // Cyan 700
  accent: '#06B6D4',         // Cyan 500
  background: '#F8FAFC',     // Slate 50 - clean white
  surface: '#FFFFFF',        // White card surface
  surfaceLight: '#E2E8F0',   // Slate 200 - dividers
  text: '#0F172A',           // Slate 900 - dark text
  textSecondary: '#475569',  // Slate 600
  textMuted: '#94A3B8',      // Slate 400
  success: '#16A34A',        // Green 600 - success only
  warning: '#EAB308',        // Yellow 500
  error: '#DC2626',          // Red 600
  border: '#E2E8F0',         // Slate 200
  // Category colors
  water: '#3B82F6',          // Blue
  sleep: '#A78BFA',          // Violet
  fats: '#F59E0B',           // Amber
  protein: '#EC4899',        // Pink
  carbs: '#F97316',          // Orange
  supplements: '#EAB308',    // Yellow - supplements
};

// Default to dark mode
const COLORS = COLORS_DARK;

// Programs ordered from weight gain to weight loss
const GOAL_INFO = {
  bulk: {
    title: 'Mass Building (Bulk)',
    icon: '🦍',
    overview: "Maximize muscle and size gains with a calorie surplus.",
    requirements: [
      { icon: '🍽️', title: 'Calorie Surplus', desc: 'Eat 300-500 calories above maintenance.' },
      { icon: '🏋️', title: 'Heavy Training', desc: 'Focus on compound lifts with progressive overload.' },
      { icon: '🍗', title: 'High Protein', desc: 'Aim for 1.8-2.2g protein per kg bodyweight.' },
      { icon: '😴', title: 'Recovery', desc: 'Sleep 7-9 hours for optimal muscle growth.' },
    ],
    minDays: 4,
    idealDays: '4-6',
    weightDirection: 'gain',
  },
  build_muscle: {
    title: 'Lean Muscle Building',
    icon: '💪',
    overview: "Build muscle while minimizing fat gain with a slight surplus.",
    requirements: [
      { icon: '🏋️', title: 'Progressive Overload', desc: 'Gradually increase weight, reps, or sets.' },
      { icon: '📅', title: 'Consistency', desc: 'Results come from stacking sessions week after week.' },
      { icon: '🍗', title: 'Protein-Rich Diet', desc: 'Aim for 1.6-2.2g protein per kg bodyweight.' },
      { icon: '😴', title: 'Quality Sleep', desc: '7-9 hours per night for muscle repair.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'gain',
  },
  strength: {
    title: 'Strength & Power',
    icon: '🏋️',
    overview: "Maximize strength through heavy compound lifts.",
    requirements: [
      { icon: '🎯', title: 'Heavy Compounds', desc: 'Focus on squat, bench, deadlift, overhead press.' },
      { icon: '📈', title: 'Low Reps, High Weight', desc: '1-6 rep range with heavy loads.' },
      { icon: '⏰', title: 'Rest Periods', desc: 'Take 3-5 minutes rest between heavy sets.' },
    ],
    minDays: 3,
    idealDays: '3-4',
    weightDirection: 'maintain',
  },
  recomp: {
    title: 'Body Recomposition',
    icon: '🔄',
    overview: "Build muscle and lose fat simultaneously at maintenance calories.",
    requirements: [
      { icon: '⚖️', title: 'Maintenance Calories', desc: 'Eat at or slightly below TDEE.' },
      { icon: '🍗', title: 'Very High Protein', desc: 'Aim for 2.0-2.4g protein per kg bodyweight.' },
      { icon: '🏋️', title: 'Heavy Training', desc: 'Prioritize strength training to preserve muscle.' },
      { icon: '⏱️', title: 'Patience', desc: 'This approach is slower but sustainable.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'maintain',
  },
  fitness: {
    title: 'General Fitness',
    icon: '❤️',
    overview: "Overall fitness combining strength, cardio, and mobility.",
    requirements: [
      { icon: '🔄', title: 'Variety', desc: 'Mix resistance training, cardio, and flexibility.' },
      { icon: '❤️', title: 'Heart Health', desc: '150 mins moderate cardio per week minimum.' },
      { icon: '🧘', title: 'Mobility', desc: 'Include stretching and mobility work.' },
    ],
    minDays: 2,
    idealDays: '3-5',
    weightDirection: 'maintain',
  },
  athletic: {
    title: 'Athletic Performance',
    icon: '⚡',
    overview: "Optimize for sports performance, speed, and agility.",
    requirements: [
      { icon: '🏃', title: 'Conditioning', desc: 'Mix strength with sport-specific cardio.' },
      { icon: '💨', title: 'Speed & Power', desc: 'Include plyometrics and explosive movements.' },
      { icon: '🔄', title: 'Mobility', desc: 'Prioritize flexibility and injury prevention.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'maintain',
  },
  lean: {
    title: 'Getting Lean (Cut)',
    icon: '✂️',
    overview: "Shed fat while preserving muscle with a moderate deficit.",
    requirements: [
      { icon: '🍽️', title: 'Moderate Deficit', desc: 'Eat 300-400 calories below maintenance.' },
      { icon: '🍗', title: 'High Protein', desc: 'Keep protein at 2.0g+ per kg to preserve muscle.' },
      { icon: '🏋️', title: 'Maintain Intensity', desc: 'Keep lifting heavy to signal muscle retention.' },
    ],
    minDays: 3,
    idealDays: '4-5',
    weightDirection: 'lose',
  },
  lose_fat: {
    title: 'Fat Loss',
    icon: '🔥',
    overview: "Aggressive fat loss with a larger calorie deficit.",
    requirements: [
      { icon: '🍽️', title: 'Calorie Deficit', desc: 'Eat 500-750 calories below maintenance.' },
      { icon: '🏃', title: 'Cardio + Weights', desc: 'Combine resistance training with cardio.' },
      { icon: '🍗', title: 'Very High Protein', desc: 'Maximize protein to preserve muscle mass.' },
    ],
    minDays: 3,
    idealDays: '4-6',
    weightDirection: 'lose',
  },
};

// Weight Goal Step Component - defined outside main component to prevent recreation
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

// Profile Setup Step - separate component to prevent input focus loss
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

// Edit Profile Modal - separate component to prevent input focus loss
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

// Meal Entry Modal - separate component to prevent input focus loss
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

// Water Entry Modal - separate component to prevent input focus loss
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

// Weigh-In Modal - separate component to prevent input focus loss
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

// Full Meal Entry Modal - with all macros and estimator
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

// Comprehensive Exercise Database
const ALL_EXERCISES = [
  // CHEST
  { name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Incline Barbell Press', muscleGroup: 'Upper Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Upper Chest', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Decline Bench Press', muscleGroup: 'Lower Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Machine Chest Press', muscleGroup: 'Chest', equipment: 'Machine', type: 'compound' },
  { name: 'Cable Fly', muscleGroup: 'Chest', equipment: 'Cable', type: 'isolation' },
  { name: 'Incline Cable Fly', muscleGroup: 'Upper Chest', equipment: 'Cable', type: 'isolation' },
  { name: 'Pec Deck', muscleGroup: 'Chest', equipment: 'Machine', type: 'isolation' },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Push Ups', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Landmine Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Floor Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', type: 'compound' },
  
  // BACK
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Pendlay Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Chest Supported Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'compound' },
  { name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound' },
  { name: 'Lat Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'compound' },
  { name: 'Close Grip Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'compound' },
  { name: 'Wide Grip Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'compound' },
  { name: 'Pull Ups', muscleGroup: 'Lats', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Chin Ups', muscleGroup: 'Lats', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Neutral Grip Pull Ups', muscleGroup: 'Lats', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Machine Row', muscleGroup: 'Back', equipment: 'Machine', type: 'compound' },
  { name: 'Meadows Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Seal Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Straight Arm Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'isolation' },
  { name: 'Rack Pulls', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  { name: 'Snatch Grip Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound' },
  
  // SHOULDERS
  { name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Seated Dumbbell Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Machine', type: 'compound' },
  { name: 'Push Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Lateral Raises', muscleGroup: 'Side Delts', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Lateral Raises', muscleGroup: 'Side Delts', equipment: 'Cable', type: 'isolation' },
  { name: 'Machine Lateral Raises', muscleGroup: 'Side Delts', equipment: 'Machine', type: 'isolation' },
  { name: 'Front Raises', muscleGroup: 'Front Delts', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Front Raises', muscleGroup: 'Front Delts', equipment: 'Cable', type: 'isolation' },
  { name: 'Face Pulls', muscleGroup: 'Rear Delts', equipment: 'Cable', type: 'isolation' },
  { name: 'Reverse Pec Deck', muscleGroup: 'Rear Delts', equipment: 'Machine', type: 'isolation' },
  { name: 'Rear Delt Fly', muscleGroup: 'Rear Delts', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Rear Delt Fly', muscleGroup: 'Rear Delts', equipment: 'Cable', type: 'isolation' },
  { name: 'Upright Rows', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Lu Raises', muscleGroup: 'Side Delts', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Y Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'isolation' },
  
  // TRICEPS
  { name: 'Tricep Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Rope Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Dumbbell Skull Crushers', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Diamond Push Ups', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound' },
  { name: 'JM Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'compound' },
  { name: 'Tricep Kickbacks', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Single Arm Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
  
  // BICEPS
  { name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'EZ Bar Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Hammer Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Spider Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Drag Curls', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Reverse Curls', muscleGroup: 'Forearms', equipment: 'Barbell', type: 'isolation' },
  { name: 'Wrist Curls', muscleGroup: 'Forearms', equipment: 'Barbell', type: 'isolation' },
  
  // QUADS
  { name: 'Barbell Back Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'compound' },
  { name: 'Front Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'compound' },
  { name: 'Goblet Squat', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Hack Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound' },
  { name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Walking Lunges', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Reverse Lunges', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Step Ups', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Leg Extension', muscleGroup: 'Quads', equipment: 'Machine', type: 'isolation' },
  { name: 'Sissy Squat', muscleGroup: 'Quads', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Pendulum Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound' },
  { name: 'Belt Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound' },
  { name: 'Smith Machine Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound' },
  
  // HAMSTRINGS & GLUTES
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'compound' },
  { name: 'Stiff Leg Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell RDL', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Single Leg RDL', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Good Mornings', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'compound' },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', type: 'isolation' },
  { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', type: 'isolation' },
  { name: 'Nordic Curls', muscleGroup: 'Hamstrings', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound' },
  { name: 'Cable Pull Through', muscleGroup: 'Glutes', equipment: 'Cable', type: 'compound' },
  { name: 'Glute Kickback', muscleGroup: 'Glutes', equipment: 'Cable', type: 'isolation' },
  { name: 'Hip Abduction', muscleGroup: 'Glutes', equipment: 'Machine', type: 'isolation' },
  { name: 'Sumo Deadlift', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound' },
  
  // CALVES
  { name: 'Standing Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Seated Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Leg Press Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Donkey Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  { name: 'Single Leg Calf Raise', muscleGroup: 'Calves', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Smith Machine Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', type: 'isolation' },
  
  // CORE
  { name: 'Hanging Leg Raises', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Hanging Knee Raises', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Cable Crunches', muscleGroup: 'Abs', equipment: 'Cable', type: 'isolation' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Abs', equipment: 'Equipment', type: 'isolation' },
  { name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Pallof Press', muscleGroup: 'Core', equipment: 'Cable', type: 'isolation' },
  { name: 'Wood Chops', muscleGroup: 'Core', equipment: 'Cable', type: 'isolation' },
  { name: 'Russian Twists', muscleGroup: 'Obliques', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Side Plank', muscleGroup: 'Obliques', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Decline Sit Ups', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Bicycle Crunches', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Mountain Climbers', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'compound' },
  { name: 'V-Ups', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Toe Touches', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Flutter Kicks', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Dragon Flags', muscleGroup: 'Abs', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'L-Sit', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Hollow Body Hold', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },
  { name: 'Bird Dog', muscleGroup: 'Core', equipment: 'Bodyweight', type: 'isolation' },

  // TRAPS
  { name: 'Barbell Shrugs', muscleGroup: 'Traps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Dumbbell Shrugs', muscleGroup: 'Traps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Shrugs', muscleGroup: 'Traps', equipment: 'Cable', type: 'isolation' },
  { name: 'Farmers Walk', muscleGroup: 'Traps', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Rack Pulls (High)', muscleGroup: 'Traps', equipment: 'Barbell', type: 'compound' },

  // CARDIO & CONDITIONING
  { name: 'Treadmill Run', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Treadmill Walk (Incline)', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Stationary Bike', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Rowing Machine', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Stair Climber', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Elliptical', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Battle Ropes', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'cardio' },
  { name: 'Box Jumps', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'compound' },
  { name: 'Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Jump Rope', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'cardio' },
  { name: 'Sled Push', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'compound' },
  { name: 'Sled Pull', muscleGroup: 'Cardio', equipment: 'Equipment', type: 'compound' },
  { name: 'Kettlebell Swings', muscleGroup: 'Cardio', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Assault Bike', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },
  { name: 'Ski Erg', muscleGroup: 'Cardio', equipment: 'Machine', type: 'cardio' },

  // OLYMPIC LIFTS & VARIATIONS
  { name: 'Power Clean', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Hang Clean', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Clean and Jerk', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Snatch', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Hang Snatch', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Clean High Pull', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Snatch', muscleGroup: 'Full Body', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Kettlebell Clean', muscleGroup: 'Full Body', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Thruster', muscleGroup: 'Full Body', equipment: 'Barbell', type: 'compound' },
  { name: 'Dumbbell Thruster', muscleGroup: 'Full Body', equipment: 'Dumbbells', type: 'compound' },

  // FUNCTIONAL & STABILITY
  { name: 'Turkish Get Up', muscleGroup: 'Full Body', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Landmine Rotation', muscleGroup: 'Core', equipment: 'Barbell', type: 'compound' },
  { name: 'Medicine Ball Slam', muscleGroup: 'Full Body', equipment: 'Equipment', type: 'compound' },
  { name: 'Wall Ball', muscleGroup: 'Full Body', equipment: 'Equipment', type: 'compound' },
  { name: 'Cable Woodchop (Low to High)', muscleGroup: 'Core', equipment: 'Cable', type: 'compound' },
  { name: 'Bosu Ball Squat', muscleGroup: 'Quads', equipment: 'Equipment', type: 'compound' },
  { name: 'Single Leg Deadlift', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Pistol Squat', muscleGroup: 'Quads', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Box Step Up', muscleGroup: 'Quads', equipment: 'Equipment', type: 'compound' },
  { name: 'Reverse Lunge', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Walking Lunge', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Curtsy Lunge', muscleGroup: 'Glutes', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Step Through Lunge', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound' },

  // ADVANCED BODYWEIGHT
  { name: 'Muscle Up', muscleGroup: 'Full Body', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Ring Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Ring Rows', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Handstand Push Up', muscleGroup: 'Shoulders', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Archer Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Pike Push Up', muscleGroup: 'Shoulders', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Decline Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Inverted Row', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Typewriter Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Archer Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', type: 'compound' },

  // ADDITIONAL SHOULDER EXERCISES
  { name: 'Seated Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', type: 'compound' },
  { name: 'Bradford Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Z Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Behind the Neck Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Bottoms Up Press', muscleGroup: 'Shoulders', equipment: 'Kettlebell', type: 'compound' },
  { name: 'Javelin Press', muscleGroup: 'Shoulders', equipment: 'Barbell', type: 'compound' },
  { name: 'Crucifix Hold', muscleGroup: 'Side Delts', equipment: 'Dumbbells', type: 'isolation' },

  // ADDITIONAL ARM EXERCISES
  { name: '21s (Bicep)', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation' },
  { name: 'Zottman Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Waiter Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cable Hammer Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'Overhead Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation' },
  { name: 'California Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'compound' },
  { name: 'Tate Press', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Bench Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Overhead Dumbbell Extension', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation' },
  { name: 'Cross Body Tricep Extension', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation' },
];

// Workout Templates Database
const WORKOUT_TEMPLATES = {
  push_a: {
    id: 'push_a',
    name: 'Push Day A',
    focus: 'Chest, Shoulders & Triceps',
    description: 'This workout emphasizes chest development with heavy compound pressing, followed by shoulder and tricep work. Focus on controlled negatives and full range of motion.',
    goals: ['Build pressing strength', 'Develop chest mass', 'Progressive overload'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 6, suggestedWeight: 80, lastWeight: 77.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Chest' },
      { id: 'incline_db', name: 'Incline Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 30, lastWeight: 28, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, targetReps: 8, suggestedWeight: 50, lastWeight: 47.5, lastReps: [8, 7, 6], restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, suggestedWeight: 12, lastWeight: 10, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, targetReps: 12, suggestedWeight: 30, lastWeight: 27.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  push_b: {
    id: 'push_b',
    name: 'Push Day B',
    focus: 'Shoulders, Chest & Triceps',
    description: 'A shoulder-focused push day that develops overhead strength and shoulder stability. Includes chest work and tricep isolation for complete pushing development.',
    goals: ['Overhead strength', 'Shoulder hypertrophy', 'Tricep development'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 6, suggestedWeight: 55, lastWeight: 52.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'incline_bb', name: 'Incline Barbell Press', sets: 3, targetReps: 8, suggestedWeight: 65, lastWeight: 62.5, lastReps: [8, 7, 7], restTime: 150, muscleGroup: 'Upper Chest' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 26, lastWeight: 24, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'cable_fly', name: 'Cable Fly', sets: 3, targetReps: 12, suggestedWeight: 15, lastWeight: 12.5, lastReps: [12, 12, 10], restTime: 60, muscleGroup: 'Chest' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, targetReps: 10, suggestedWeight: 30, lastWeight: 27.5, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Triceps' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 20, lastWeight: 17.5, lastReps: [15, 15, 12], restTime: 60, muscleGroup: 'Rear Delts' },
    ]
  },
  pull_a: {
    id: 'pull_a',
    name: 'Pull Day A',
    focus: 'Back Width & Biceps',
    description: 'This workout targets lat width and back thickness through vertical and horizontal pulling. Bicep work is included to maximize arm development.',
    goals: ['Build back width', 'Increase pulling strength', 'Bicep hypertrophy'],
    exercises: [
      { id: 'pullup', name: 'Pull Ups', sets: 4, targetReps: 8, suggestedWeight: 0, lastWeight: 0, lastReps: [8, 7, 6, 5], restTime: 150, muscleGroup: 'Lats' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, suggestedWeight: 80, lastWeight: 77.5, lastReps: [8, 8, 7, 6], restTime: 150, muscleGroup: 'Back' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, suggestedWeight: 60, lastWeight: 57.5, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Lats' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 22.5, lastWeight: 20, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'curl', name: 'Barbell Curl', sets: 3, targetReps: 10, suggestedWeight: 35, lastWeight: 32.5, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, suggestedWeight: 14, lastWeight: 12, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  pull_b: {
    id: 'pull_b',
    name: 'Pull Day B',
    focus: 'Back Thickness & Biceps',
    description: 'A back thickness-focused session emphasizing rowing movements and horizontal pulls. Develops the mid-back and creates that dense, powerful look.',
    goals: ['Back thickness', 'Rowing strength', 'Complete back development'],
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 4, targetReps: 5, suggestedWeight: 140, lastWeight: 135, lastReps: [5, 5, 5, 4], restTime: 240, muscleGroup: 'Back' },
      { id: 'db_row', name: 'Dumbbell Row', sets: 3, targetReps: 10, suggestedWeight: 36, lastWeight: 34, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Back' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, suggestedWeight: 65, lastWeight: 60, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Back' },
      { id: 'straight_arm', name: 'Straight Arm Pulldown', sets: 3, targetReps: 12, suggestedWeight: 30, lastWeight: 27.5, lastReps: [12, 12, 10], restTime: 60, muscleGroup: 'Lats' },
      { id: 'preacher', name: 'Preacher Curl', sets: 3, targetReps: 10, suggestedWeight: 25, lastWeight: 22.5, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'reverse_curl', name: 'Reverse Curls', sets: 2, targetReps: 15, suggestedWeight: 20, lastWeight: 17.5, lastReps: [15, 12], restTime: 60, muscleGroup: 'Forearms' },
    ]
  },
  legs_a: {
    id: 'legs_a',
    name: 'Leg Day A',
    focus: 'Quad Dominant',
    description: 'A quad-focused leg workout built around the squat pattern. Develops leg strength, size and athletic power through heavy compound movements.',
    goals: ['Quad development', 'Squat strength', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, suggestedWeight: 120, lastWeight: 115, lastReps: [6, 6, 5, 5], restTime: 240, muscleGroup: 'Quads' },
      { id: 'leg_press', name: 'Leg Press', sets: 3, targetReps: 10, suggestedWeight: 200, lastWeight: 180, lastReps: [10, 9, 8], restTime: 150, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, suggestedWeight: 90, lastWeight: 85, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, suggestedWeight: 50, lastWeight: 45, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 40, lastWeight: 37.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, suggestedWeight: 80, lastWeight: 70, lastReps: [15, 14, 12, 10], restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  legs_b: {
    id: 'legs_b',
    name: 'Leg Day B',
    focus: 'Posterior Chain & Glutes',
    description: 'A hamstring and glute-focused session that develops the posterior chain. Great for athletic performance, injury prevention, and building a strong foundation.',
    goals: ['Hamstring development', 'Glute strength', 'Posterior chain power'],
    exercises: [
      { id: 'rdl', name: 'Romanian Deadlift', sets: 4, targetReps: 8, suggestedWeight: 100, lastWeight: 95, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, suggestedWeight: 100, lastWeight: 90, lastReps: [10, 10, 9, 8], restTime: 120, muscleGroup: 'Glutes' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, suggestedWeight: 24, lastWeight: 22, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Seated Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 45, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'abduct', name: 'Hip Abduction', sets: 3, targetReps: 15, suggestedWeight: 50, lastWeight: 45, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Glutes' },
      { id: 'calf', name: 'Seated Calf Raises', sets: 4, targetReps: 15, suggestedWeight: 40, lastWeight: 35, lastReps: [15, 14, 12, 10], restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  upper_a: {
    id: 'upper_a',
    name: 'Upper Body A',
    focus: 'Horizontal Push/Pull',
    description: 'A balanced upper body session focusing on horizontal pressing and rowing. Develops chest and back equally for a proportional, powerful upper body.',
    goals: ['Upper body balance', 'Horizontal strength', 'Muscle symmetry'],
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 82.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, suggestedWeight: 82.5, lastWeight: 80, lastReps: [8, 7, 7, 6], restTime: 150, muscleGroup: 'Back' },
      { id: 'db_press', name: 'Seated Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 28, lastWeight: 26, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'lat_pull', name: 'Lat Pulldown', sets: 3, targetReps: 10, suggestedWeight: 62.5, lastWeight: 60, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Lats' },
      { id: 'curl', name: 'EZ Bar Curl', sets: 3, targetReps: 10, suggestedWeight: 32.5, lastWeight: 30, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Rope Pushdowns', sets: 3, targetReps: 12, suggestedWeight: 25, lastWeight: 22.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  upper_b: {
    id: 'upper_b',
    name: 'Upper Body B',
    focus: 'Vertical Push/Pull',
    description: 'An upper body session emphasizing vertical movements. Builds impressive shoulders and lats while developing pulling and pressing strength overhead.',
    goals: ['Vertical strength', 'Shoulder & lat width', 'Overhead power'],
    exercises: [
      { id: 'ohp', name: 'Overhead Press', sets: 4, targetReps: 6, suggestedWeight: 57.5, lastWeight: 55, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Shoulders' },
      { id: 'pullup', name: 'Chin Ups', sets: 4, targetReps: 8, suggestedWeight: 0, lastWeight: 0, lastReps: [8, 7, 6, 5], restTime: 150, muscleGroup: 'Lats' },
      { id: 'incline', name: 'Incline Dumbbell Press', sets: 3, targetReps: 10, suggestedWeight: 32, lastWeight: 30, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Upper Chest' },
      { id: 'cable_row', name: 'Seated Cable Row', sets: 3, targetReps: 12, suggestedWeight: 67.5, lastWeight: 65, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Back' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, suggestedWeight: 12, lastWeight: 10, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, suggestedWeight: 16, lastWeight: 14, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'overhead_ext', name: 'Overhead Tricep Extension', sets: 3, targetReps: 12, suggestedWeight: 27.5, lastWeight: 25, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  lower: {
    id: 'lower',
    name: 'Lower Body',
    focus: 'Full Leg Development',
    description: 'A comprehensive lower body session hitting all major leg muscles. Combines heavy compound lifts with isolation work for complete leg development.',
    goals: ['Overall leg strength', 'Quad & hamstring balance', 'Lower body power'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, suggestedWeight: 125, lastWeight: 120, lastReps: [6, 6, 5, 5], restTime: 240, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, suggestedWeight: 95, lastWeight: 90, lastReps: [10, 9, 8], restTime: 150, muscleGroup: 'Hamstrings' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 10, suggestedWeight: 26, lastWeight: 24, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 42.5, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, suggestedWeight: 52.5, lastWeight: 50, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Quads' },
      { id: 'calf', name: 'Standing Calf Raises', sets: 4, targetReps: 15, suggestedWeight: 85, lastWeight: 80, lastReps: [15, 14, 12, 10], restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  full_body_a: {
    id: 'full_body_a',
    name: 'Full Body A',
    focus: 'Compound Strength',
    description: 'A full body strength session built around the big three lifts. Efficient and effective for building overall strength and muscle when time is limited.',
    goals: ['Full body strength', 'Efficient training', 'Compound lift focus'],
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 5, suggestedWeight: 110, lastWeight: 105, lastReps: [5, 5, 5, 4], restTime: 240, muscleGroup: 'Quads' },
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 5, suggestedWeight: 82.5, lastWeight: 80, lastReps: [5, 5, 5, 4], restTime: 180, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 6, suggestedWeight: 77.5, lastWeight: 75, lastReps: [6, 6, 5, 5], restTime: 150, muscleGroup: 'Back' },
      { id: 'ohp', name: 'Overhead Press', sets: 3, targetReps: 8, suggestedWeight: 47.5, lastWeight: 45, lastReps: [8, 7, 6], restTime: 120, muscleGroup: 'Shoulders' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 10, suggestedWeight: 85, lastWeight: 80, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Hamstrings' },
    ]
  },
  full_body_b: {
    id: 'full_body_b',
    name: 'Full Body B',
    focus: 'Hypertrophy & Accessories',
    description: 'A full body session with higher rep ranges and more isolation work. Complements Full Body A for balanced muscle development.',
    goals: ['Muscle hypertrophy', 'Accessory work', 'Balanced development'],
    exercises: [
      { id: 'front_squat', name: 'Front Squat', sets: 3, targetReps: 8, suggestedWeight: 80, lastWeight: 75, lastReps: [8, 7, 6], restTime: 180, muscleGroup: 'Quads' },
      { id: 'db_bench', name: 'Dumbbell Bench Press', sets: 3, targetReps: 10, suggestedWeight: 34, lastWeight: 32, lastReps: [10, 9, 8], restTime: 120, muscleGroup: 'Chest' },
      { id: 'pullup', name: 'Pull Ups', sets: 3, targetReps: 8, suggestedWeight: 0, lastWeight: 0, lastReps: [8, 7, 6], restTime: 120, muscleGroup: 'Lats' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 3, targetReps: 12, suggestedWeight: 90, lastWeight: 85, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Glutes' },
      { id: 'lateral', name: 'Lateral Raises', sets: 3, targetReps: 15, suggestedWeight: 10, lastWeight: 8, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Side Delts' },
      { id: 'curl', name: 'Dumbbell Curl', sets: 2, targetReps: 12, suggestedWeight: 14, lastWeight: 12, lastReps: [12, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 2, targetReps: 12, suggestedWeight: 27.5, lastWeight: 25, lastReps: [12, 10], restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  arms: {
    id: 'arms',
    name: 'Arms Day',
    focus: 'Biceps & Triceps',
    description: 'A dedicated arm session for maximum bicep and tricep development. High volume with varied angles to target all heads of each muscle.',
    goals: ['Arm size', 'Peak development', 'Tricep horseshoe'],
    exercises: [
      { id: 'close_grip', name: 'Close Grip Bench Press', sets: 4, targetReps: 8, suggestedWeight: 65, lastWeight: 62.5, lastReps: [8, 8, 7, 6], restTime: 150, muscleGroup: 'Triceps' },
      { id: 'curl', name: 'Barbell Curl', sets: 4, targetReps: 8, suggestedWeight: 37.5, lastWeight: 35, lastReps: [8, 8, 7, 6], restTime: 90, muscleGroup: 'Biceps' },
      { id: 'skull', name: 'Skull Crushers', sets: 3, targetReps: 10, suggestedWeight: 32.5, lastWeight: 30, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Triceps' },
      { id: 'incline_curl', name: 'Incline Dumbbell Curl', sets: 3, targetReps: 10, suggestedWeight: 12, lastWeight: 10, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'pushdown', name: 'Rope Pushdowns', sets: 3, targetReps: 12, suggestedWeight: 27.5, lastWeight: 25, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'hammer', name: 'Hammer Curls', sets: 3, targetReps: 12, suggestedWeight: 16, lastWeight: 14, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Biceps' },
      { id: 'overhead_ext', name: 'Overhead Tricep Extension', sets: 2, targetReps: 15, suggestedWeight: 25, lastWeight: 22.5, lastReps: [15, 12], restTime: 60, muscleGroup: 'Triceps' },
      { id: 'conc_curl', name: 'Concentration Curl', sets: 2, targetReps: 12, suggestedWeight: 10, lastWeight: 8, lastReps: [12, 10], restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  // ADVANCED WORKOUT TEMPLATES
  chest_specialization: {
    id: 'chest_specialization',
    name: 'Chest Specialization',
    focus: 'Chest Hypertrophy',
    description: 'An advanced chest-focused workout with high volume across multiple angles. For experienced lifters looking to bring up lagging chest development.',
    goals: ['Maximum chest development', 'Upper/lower chest balance', 'Mind-muscle connection'],
    difficulty: 'Advanced',
    muscleFrequency: { chest: 3, shoulders: 1, triceps: 2 },
    exercises: [
      { id: 'incline_bb', name: 'Incline Barbell Press', sets: 4, targetReps: 8, suggestedWeight: 70, lastWeight: 67.5, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Upper Chest' },
      { id: 'bench', name: 'Barbell Bench Press', sets: 4, targetReps: 8, suggestedWeight: 85, lastWeight: 82.5, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Chest' },
      { id: 'db_fly', name: 'Dumbbell Fly', sets: 3, targetReps: 12, suggestedWeight: 18, lastWeight: 16, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Chest' },
      { id: 'cable_fly_high', name: 'Cable Fly', sets: 3, targetReps: 15, suggestedWeight: 15, lastWeight: 12.5, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Chest' },
      { id: 'incline_fly', name: 'Incline Cable Fly', sets: 3, targetReps: 15, suggestedWeight: 12.5, lastWeight: 10, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Upper Chest' },
      { id: 'dips', name: 'Dips', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 90, muscleGroup: 'Lower Chest' },
      { id: 'pushdown', name: 'Tricep Pushdowns', sets: 3, targetReps: 15, suggestedWeight: 25, lastWeight: 22.5, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  back_specialization: {
    id: 'back_specialization',
    name: 'Back Specialization',
    focus: 'Back Width & Thickness',
    description: 'An advanced back workout combining width and thickness movements. High volume training for experienced lifters seeking maximum back development.',
    goals: ['Lat width', 'Mid-back thickness', 'Complete V-taper'],
    difficulty: 'Advanced',
    muscleFrequency: { back: 3, biceps: 2, rear_delts: 1 },
    exercises: [
      { id: 'weighted_pullup', name: 'Pull Ups', sets: 4, targetReps: 8, suggestedWeight: 15, lastWeight: 12.5, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Lats' },
      { id: 'pendlay_row', name: 'Pendlay Row', sets: 4, targetReps: 6, suggestedWeight: 90, lastWeight: 87.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Back' },
      { id: 'wide_pulldown', name: 'Wide Grip Pulldown', sets: 3, targetReps: 10, suggestedWeight: 65, lastWeight: 62.5, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Lats' },
      { id: 'chest_row', name: 'Chest Supported Row', sets: 3, targetReps: 10, suggestedWeight: 32, lastWeight: 30, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Back' },
      { id: 'straight_arm', name: 'Straight Arm Pulldown', sets: 3, targetReps: 12, suggestedWeight: 32.5, lastWeight: 30, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Lats' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 22.5, lastWeight: 20, lastReps: [15, 15, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'shrugs', name: 'Barbell Shrugs', sets: 3, targetReps: 12, suggestedWeight: 100, lastWeight: 95, lastReps: [12, 11, 10], restTime: 90, muscleGroup: 'Traps' },
      { id: 'curl', name: 'EZ Bar Curl', sets: 3, targetReps: 10, suggestedWeight: 35, lastWeight: 32.5, lastReps: [10, 9, 8], restTime: 60, muscleGroup: 'Biceps' },
    ]
  },
  leg_specialization: {
    id: 'leg_specialization',
    name: 'Leg Specialization',
    focus: 'Complete Leg Development',
    description: 'An intense leg session targeting quads, hamstrings, glutes and calves equally. For advanced lifters committed to balanced lower body development.',
    goals: ['Quad sweep', 'Hamstring tie-in', 'Glute development', 'Calf growth'],
    difficulty: 'Advanced',
    muscleFrequency: { quads: 3, hamstrings: 2, glutes: 2, calves: 2 },
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 4, targetReps: 6, suggestedWeight: 130, lastWeight: 125, lastReps: [6, 6, 5, 5], restTime: 240, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 4, targetReps: 8, suggestedWeight: 105, lastWeight: 100, lastReps: [8, 8, 7, 6], restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'hack_squat', name: 'Hack Squat', sets: 3, targetReps: 10, suggestedWeight: 120, lastWeight: 110, lastReps: [10, 9, 8], restTime: 150, muscleGroup: 'Quads' },
      { id: 'hip_thrust', name: 'Hip Thrust', sets: 4, targetReps: 10, suggestedWeight: 110, lastWeight: 100, lastReps: [10, 10, 9, 8], restTime: 120, muscleGroup: 'Glutes' },
      { id: 'leg_ext', name: 'Leg Extension', sets: 3, targetReps: 12, suggestedWeight: 55, lastWeight: 50, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Quads' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 45, lastWeight: 42.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'calf_standing', name: 'Standing Calf Raises', sets: 4, targetReps: 12, suggestedWeight: 90, lastWeight: 85, lastReps: [12, 12, 10, 10], restTime: 60, muscleGroup: 'Calves' },
      { id: 'calf_seated', name: 'Seated Calf Raises', sets: 3, targetReps: 15, suggestedWeight: 45, lastWeight: 40, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Calves' },
    ]
  },
  powerlifting_squat: {
    id: 'powerlifting_squat',
    name: 'Squat Focus (Powerlifting)',
    focus: 'Squat Strength',
    description: 'A powerlifting-style squat-focused session with competition-style training. Heavy singles, doubles and triples with accessory work.',
    goals: ['Squat 1RM improvement', 'Competition prep', 'Technical refinement'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'squat', name: 'Barbell Back Squat', sets: 5, targetReps: 3, suggestedWeight: 145, lastWeight: 140, lastReps: [3, 3, 3, 2, 2], restTime: 300, muscleGroup: 'Quads' },
      { id: 'pause_squat', name: 'Front Squat', sets: 3, targetReps: 5, suggestedWeight: 100, lastWeight: 95, lastReps: [5, 5, 4], restTime: 180, muscleGroup: 'Quads' },
      { id: 'bss', name: 'Bulgarian Split Squat', sets: 3, targetReps: 8, suggestedWeight: 30, lastWeight: 28, lastReps: [8, 8, 7], restTime: 120, muscleGroup: 'Quads' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, targetReps: 8, suggestedWeight: 95, lastWeight: 90, lastReps: [8, 8, 7], restTime: 120, muscleGroup: 'Hamstrings' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 42.5, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'core', name: 'Ab Wheel Rollout', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 8, 8], restTime: 60, muscleGroup: 'Core' },
    ]
  },
  powerlifting_bench: {
    id: 'powerlifting_bench',
    name: 'Bench Focus (Powerlifting)',
    focus: 'Bench Press Strength',
    description: 'A powerlifting-style bench press-focused session. Heavy work with pauses and accessory movements for maximum pressing strength.',
    goals: ['Bench 1RM improvement', 'Lockout strength', 'Chest drive'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', sets: 5, targetReps: 3, suggestedWeight: 105, lastWeight: 100, lastReps: [3, 3, 3, 2, 2], restTime: 300, muscleGroup: 'Chest' },
      { id: 'close_grip', name: 'Close Grip Bench Press', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 82.5, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Triceps' },
      { id: 'db_bench', name: 'Dumbbell Bench Press', sets: 3, targetReps: 8, suggestedWeight: 38, lastWeight: 36, lastReps: [8, 8, 7], restTime: 120, muscleGroup: 'Chest' },
      { id: 'row', name: 'Barbell Row', sets: 4, targetReps: 8, suggestedWeight: 82.5, lastWeight: 80, lastReps: [8, 8, 7, 6], restTime: 120, muscleGroup: 'Back' },
      { id: 'face_pull', name: 'Face Pulls', sets: 3, targetReps: 15, suggestedWeight: 22.5, lastWeight: 20, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Rear Delts' },
      { id: 'tricep_ext', name: 'Overhead Tricep Extension', sets: 3, targetReps: 12, suggestedWeight: 30, lastWeight: 27.5, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Triceps' },
    ]
  },
  powerlifting_deadlift: {
    id: 'powerlifting_deadlift',
    name: 'Deadlift Focus (Powerlifting)',
    focus: 'Deadlift Strength',
    description: 'A powerlifting-style deadlift-focused session. Heavy pulls with variations and back accessories for maximum pulling power.',
    goals: ['Deadlift 1RM improvement', 'Floor speed', 'Lockout strength'],
    difficulty: 'Advanced',
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 5, targetReps: 2, suggestedWeight: 175, lastWeight: 170, lastReps: [2, 2, 2, 2, 1], restTime: 300, muscleGroup: 'Back' },
      { id: 'deficit_dl', name: 'Romanian Deadlift', sets: 3, targetReps: 6, suggestedWeight: 115, lastWeight: 110, lastReps: [6, 6, 5], restTime: 180, muscleGroup: 'Hamstrings' },
      { id: 'row', name: 'Pendlay Row', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 82.5, lastReps: [6, 6, 5, 5], restTime: 150, muscleGroup: 'Back' },
      { id: 'pullup', name: 'Pull Ups', sets: 3, targetReps: 8, suggestedWeight: 10, lastWeight: 7.5, lastReps: [8, 7, 6], restTime: 120, muscleGroup: 'Lats' },
      { id: 'leg_curl', name: 'Lying Leg Curl', sets: 3, targetReps: 12, suggestedWeight: 42.5, lastWeight: 40, lastReps: [12, 11, 10], restTime: 60, muscleGroup: 'Hamstrings' },
      { id: 'shrugs', name: 'Barbell Shrugs', sets: 3, targetReps: 10, suggestedWeight: 110, lastWeight: 105, lastReps: [10, 9, 8], restTime: 90, muscleGroup: 'Traps' },
    ]
  },
  athletic_power: {
    id: 'athletic_power',
    name: 'Athletic Power',
    focus: 'Explosive Power & Conditioning',
    description: 'An athletic-focused workout combining strength with explosive power movements. Great for sports performance and functional fitness.',
    goals: ['Explosive power', 'Athletic performance', 'Conditioning'],
    difficulty: 'Intermediate',
    exercises: [
      { id: 'power_clean', name: 'Power Clean', sets: 5, targetReps: 3, suggestedWeight: 70, lastWeight: 65, lastReps: [3, 3, 3, 3, 2], restTime: 180, muscleGroup: 'Full Body' },
      { id: 'box_jump', name: 'Box Jumps', sets: 4, targetReps: 5, suggestedWeight: 0, lastWeight: 0, lastReps: [5, 5, 5, 5], restTime: 120, muscleGroup: 'Quads' },
      { id: 'front_squat', name: 'Front Squat', sets: 4, targetReps: 6, suggestedWeight: 85, lastWeight: 80, lastReps: [6, 6, 5, 5], restTime: 180, muscleGroup: 'Quads' },
      { id: 'push_press', name: 'Push Press', sets: 4, targetReps: 5, suggestedWeight: 60, lastWeight: 57.5, lastReps: [5, 5, 5, 4], restTime: 150, muscleGroup: 'Shoulders' },
      { id: 'kb_swing', name: 'Kettlebell Swings', sets: 3, targetReps: 15, suggestedWeight: 24, lastWeight: 20, lastReps: [15, 15, 12], restTime: 90, muscleGroup: 'Glutes' },
      { id: 'plank', name: 'Plank', sets: 3, targetReps: 60, suggestedWeight: 0, lastWeight: 0, lastReps: [60, 45, 45], restTime: 60, muscleGroup: 'Core' },
    ]
  }
};

// Current workout - would be determined by program/schedule
const CURRENT_WORKOUT = WORKOUT_TEMPLATES.push_a;
const WORKOUT_EXERCISES = CURRENT_WORKOUT.exercises.map(ex => ({
  ...ex,
  history: [
    { date: 'Jan 1', weight: ex.lastWeight * 0.9, reps: ex.lastReps, e1rm: Math.round(ex.lastWeight * 0.9 * 1.1) },
    { date: 'Jan 3', weight: ex.lastWeight * 0.95, reps: ex.lastReps, e1rm: Math.round(ex.lastWeight * 0.95 * 1.1) },
    { date: 'Jan 6', weight: ex.lastWeight, reps: ex.lastReps, e1rm: Math.round(ex.lastWeight * 1.1) },
  ],
  alternatives: ALL_EXERCISES.filter(e => e.muscleGroup === ex.muscleGroup).slice(0, 5).map(e => e.name)
}));

// Helper function for workout type colors
const getWorkoutColor = (type, COLORS) => {
  if (!type) return COLORS.textMuted;
  const t = type.toLowerCase();
  if (t.includes('push')) return COLORS.primary;
  if (t.includes('pull')) return COLORS.accent;
  if (t.includes('leg') || t.includes('lower')) return COLORS.warning;
  if (t.includes('upper')) return COLORS.sleep;
  if (t.includes('arm')) return COLORS.water;
  if (t.includes('full')) return COLORS.protein;
  if (t.includes('rest')) return COLORS.textMuted;
  return COLORS.primary;
};

const RPE_SCALE = [
  { value: 1, label: '1', desc: 'Warm up - very light' },
  { value: 2, label: '2', desc: 'Light - easy effort' },
  { value: 3, label: '3', desc: 'Light - could do many more' },
  { value: 4, label: '4', desc: 'Moderate - comfortable pace' },
  { value: 5, label: '5', desc: 'Moderate - starting to work' },
  { value: 6, label: '6', desc: 'Moderate-hard - 4+ reps left' },
  { value: 7, label: '7', desc: 'Hard - 3 reps left' },
  { value: 8, label: '8', desc: 'Very hard - 2 reps left' },
  { value: 9, label: '9', desc: 'Near max - 1 rep left' },
  { value: 10, label: '10', desc: 'Failure - no more reps possible' },
];

// LoginScreen as separate component
function LoginScreen({ onBack, onLogin, COLORS }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await signIn({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <button onClick={onBack} className="mb-6" disabled={loading}>
        <ChevronLeft size={24} color={COLORS.text} />
      </button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>Welcome Back</h1>
        <p className="mb-8" style={{ color: COLORS.textSecondary }}>Log in to continue your fitness journey</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: COLORS.error + '20' }}>
            <AlertCircle size={18} color={COLORS.error} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Email</label>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Password</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          </div>
        </div>
      </div>
      <button onClick={handleLogin} disabled={!email || !password || loading}
        className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
        style={{ backgroundColor: COLORS.primary, color: COLORS.text, opacity: email && password && !loading ? 1 : 0.5 }}>
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Logging in...
          </>
        ) : (
          'Log In'
        )}
      </button>
    </div>
  );
}

// RegisterScreen as separate component
function RegisterScreen({ onBack, onRegister, COLORS }) {
  const [regData, setRegData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', dob: '', weight: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signUp } = useAuth();

  const isValid = regData.firstName && regData.lastName && regData.email &&
    regData.password && regData.password.length >= 6 && regData.password === regData.confirmPassword;

  const handleRegister = async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await signUp({
      email: regData.email,
      password: regData.password,
      firstName: regData.firstName,
      lastName: regData.lastName,
      dob: regData.dob || null,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Pass user data to continue to onboarding
      onRegister(regData);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
        <button onClick={onBack} disabled={loading}><ChevronLeft size={24} color={COLORS.text} /></button>
        <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Create Account</h2>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: COLORS.error + '20' }}>
            <AlertCircle size={18} color={COLORS.error} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>First Name</label>
              <input type="text" placeholder="First name" value={regData.firstName}
                onChange={e => setRegData(p => ({...p, firstName: e.target.value}))}
                disabled={loading}
                className="w-full p-4 rounded-xl outline-none"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            </div>
            <div className="flex-1">
              <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Last Name</label>
              <input type="text" placeholder="Last name" value={regData.lastName}
                onChange={e => setRegData(p => ({...p, lastName: e.target.value}))}
                disabled={loading}
                className="w-full p-4 rounded-xl outline-none"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            </div>
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Email</label>
            <input type="email" placeholder="your@email.com" value={regData.email}
              onChange={e => setRegData(p => ({...p, email: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Password</label>
            <input type="password" placeholder="••••••••" value={regData.password}
              onChange={e => setRegData(p => ({...p, password: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            {regData.password && regData.password.length < 6 && (
              <p className="text-xs mt-1" style={{ color: COLORS.warning }}>Password must be at least 6 characters</p>
            )}
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={regData.confirmPassword}
              onChange={e => setRegData(p => ({...p, confirmPassword: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text,
                border: `1px solid ${regData.confirmPassword && regData.password !== regData.confirmPassword ? COLORS.error : COLORS.surfaceLight}` }} />
            {regData.confirmPassword && regData.password !== regData.confirmPassword && (
              <p className="text-xs mt-1" style={{ color: COLORS.error }}>Passwords don't match</p>
            )}
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: COLORS.textSecondary }}>Date of Birth</label>
            <input type="date" value={regData.dob}
              onChange={e => setRegData(p => ({...p, dob: e.target.value}))}
              disabled={loading}
              className="w-full p-4 rounded-xl outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Used to calculate your fitness metrics</p>
          </div>
        </div>
      </div>
      <div className="p-6 border-t" style={{ borderColor: COLORS.surfaceLight }}>
        <button onClick={handleRegister} disabled={!isValid || loading}
          className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.primary, color: COLORS.text, opacity: isValid && !loading ? 1 : 0.5 }}>
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </div>
    </div>
  );
}

// ActiveWorkoutScreen as separate component
function ActiveWorkoutScreen({ onClose, onComplete, COLORS, availableTime = 60, userGoal = 'build_muscle', userId = null, workoutName = 'Workout' }) {
  const [sessionId, setSessionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phase, setPhase] = useState('overview'); // 'overview', 'workout', 'workoutOverview', 'complete'
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);
  const [currentSetData, setCurrentSetData] = useState({ weight: 0, reps: 0, rpe: 5 });
  const [showExerciseHistory, setShowExerciseHistory] = useState(null);
  const [showSwapExercise, setShowSwapExercise] = useState(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [exercises, setExercises] = useState([...WORKOUT_EXERCISES]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [showFullWorkoutList, setShowFullWorkoutList] = useState(false);
  const [editingSet, setEditingSet] = useState(null); // { exerciseId, setIndex }
  const [editSetData, setEditSetData] = useState({ weight: 0, reps: 0, rpe: 5 });
  const [showEndWorkoutConfirm, setShowEndWorkoutConfirm] = useState(false);

  // Workout media (photos/videos)
  const [workoutMedia, setWorkoutMedia] = useState([]);
  const fileInputRef = React.useRef(null);
  
  // Time tracking
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutEndTime, setWorkoutEndTime] = useState(null);
  const [setStartTime, setSetStartTime] = useState(null);
  const [totalWorkingTime, setTotalWorkingTime] = useState(0); // Time actually doing sets (in seconds)
  const [totalRestTime, setTotalRestTime] = useState(0); // Time spent resting (in seconds)

  // Optimize exercise order based on user's goal
  const optimizeExerciseOrder = (exerciseList) => {
    if (!exerciseList || exerciseList.length <= 1) return exerciseList;
    
    const sorted = [...exerciseList];
    
    // Define muscle group priorities based on goal
    const getPriority = (muscleGroup) => {
      if (userGoal === 'build_muscle') {
        // Prioritize larger muscle groups first for maximum hypertrophy
        const priorities = { 'Chest': 1, 'Back': 2, 'Quads': 3, 'Hamstrings/Glutes': 4, 'Shoulders': 5, 'Triceps': 6, 'Biceps': 7, 'Calves': 8, 'Core': 9 };
        return priorities[muscleGroup] || 10;
      } else if (userGoal === 'strength') {
        // Prioritize compound movements and powerlifting muscles
        const priorities = { 'Quads': 1, 'Back': 2, 'Chest': 3, 'Hamstrings/Glutes': 4, 'Shoulders': 5, 'Core': 6, 'Triceps': 7, 'Biceps': 8, 'Calves': 9 };
        return priorities[muscleGroup] || 10;
      } else if (userGoal === 'lose_fat') {
        // Prioritize larger muscle groups for more calorie burn, then circuits
        const priorities = { 'Quads': 1, 'Back': 2, 'Chest': 3, 'Hamstrings/Glutes': 4, 'Shoulders': 5, 'Core': 6, 'Triceps': 7, 'Biceps': 8, 'Calves': 9 };
        return priorities[muscleGroup] || 10;
      } else {
        // General fitness - balanced approach
        const priorities = { 'Chest': 1, 'Back': 2, 'Quads': 3, 'Shoulders': 4, 'Hamstrings/Glutes': 5, 'Core': 6, 'Triceps': 7, 'Biceps': 8, 'Calves': 9 };
        return priorities[muscleGroup] || 10;
      }
    };
    
    // Also consider compound vs isolation - compounds first
    const getTypeBonus = (exercise) => {
      const compoundExercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Dip', 'Lunge', 'Romanian Deadlift'];
      const isCompound = compoundExercises.some(c => exercise.name.toLowerCase().includes(c.toLowerCase()));
      return isCompound ? 0 : 100; // Compounds get priority
    };
    
    sorted.sort((a, b) => {
      const priorityA = getPriority(a.muscleGroup) + getTypeBonus(a);
      const priorityB = getPriority(b.muscleGroup) + getTypeBonus(b);
      return priorityA - priorityB;
    });
    
    return sorted;
  };

  // Use all exercises (no time-based filtering - user controls via add/remove)
  const exercisesForTime = exercises;
  
  const totalSets = exercisesForTime.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSetsCount = completedSets.length;
  const progressPercent = (completedSetsCount / totalSets) * 100;
  const currentExercise = exercisesForTime[currentExerciseIndex];

  useEffect(() => {
    if (currentExercise) {
      setCurrentSetData({ weight: currentExercise.suggestedWeight, reps: currentExercise.targetReps, rpe: 5 });
    }
  }, [currentExerciseIndex, currentSetIndex]);

  useEffect(() => {
    let interval;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => setRestTimeLeft(prev => prev - 1), 1000);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
      setSetStartTime(Date.now()); // Start timing the next set
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  const formatDuration = (ms) => {
    const totalSeconds = Math.round(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSet = () => {
    // Track working time for this set
    if (setStartTime) {
      const setDuration = Math.round((Date.now() - setStartTime) / 1000);
      setTotalWorkingTime(prev => prev + setDuration);
    }
    
    setCompletedSets(prev => [...prev, { 
      exerciseId: currentExercise.id, 
      setIndex: currentSetIndex, 
      weight: currentSetData.weight, 
      reps: currentSetData.reps,
      rpe: currentSetData.rpe 
    }]);
    
    if (currentSetIndex < currentExercise.sets - 1) {
      const restDuration = currentExercise.restTime;
      setRestTimeLeft(restDuration);
      setTotalRestTime(prev => prev + restDuration);
      setIsResting(true);
      setCurrentSetIndex(prev => prev + 1);
    } else if (currentExerciseIndex < exercisesForTime.length - 1) {
      const restDuration = currentExercise.restTime;
      setRestTimeLeft(restDuration);
      setTotalRestTime(prev => prev + restDuration);
      setIsResting(true);
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
    } else {
      setWorkoutEndTime(Date.now());
      setPhase('complete');
    }
  };
  
  const updateCompletedSet = (exerciseId, setIndex, newData) => {
    setCompletedSets(prev => prev.map(s => 
      s.exerciseId === exerciseId && s.setIndex === setIndex 
        ? { ...s, ...newData }
        : s
    ));
    setEditingSet(null);
  };
  
  const skipToExercise = (exerciseIndex, setIndex = 0) => {
    setCurrentExerciseIndex(exerciseIndex);
    setCurrentSetIndex(setIndex);
    setIsResting(false);
    setSetStartTime(Date.now()); // Start timing the new set
    setShowFullWorkoutList(false);
  };
  
  const endWorkoutEarly = () => {
    // Track any remaining working time from current set
    if (setStartTime && !isResting) {
      const setDuration = Math.round((Date.now() - setStartTime) / 1000);
      setTotalWorkingTime(prev => prev + setDuration);
    }
    setWorkoutEndTime(Date.now());
    setPhase('complete');
    setShowEndWorkoutConfirm(false);
  };

  const swapExercise = (exerciseIndex, newExerciseName) => {
    const existingExercise = ALL_EXERCISES.find(e => e.name === newExerciseName);
    const newExercise = { 
      ...exercises[exerciseIndex], 
      name: newExerciseName, 
      id: newExerciseName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now(),
      muscleGroup: existingExercise?.muscleGroup || exercises[exerciseIndex].muscleGroup
    };
    setExercises(prev => {
      const updated = prev.map((ex, i) => i === exerciseIndex ? newExercise : ex);
      return optimizeExerciseOrder(updated);
    });
    setShowSwapExercise(null);
    setSwapSearch('');
  };

  const addExercise = (exerciseName) => {
    const existingExercise = ALL_EXERCISES.find(e => e.name === exerciseName);
    const newEx = {
      id: exerciseName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now(),
      name: exerciseName,
      sets: 3,
      targetReps: existingExercise?.type === 'compound' ? 8 : 12,
      suggestedWeight: 20,
      lastWeight: 0,
      lastReps: [0, 0, 0],
      restTime: existingExercise?.type === 'compound' ? 180 : 90,
      muscleGroup: existingExercise?.muscleGroup || 'Other',
      history: [],
      alternatives: []
    };
    
    setExercises(prev => {
      const updated = [...prev, newEx];
      return optimizeExerciseOrder(updated);
    });
    setShowAddExercise(false);
    setAddExerciseSearch('');
  };
  
  const removeExercise = (exerciseIndex) => {
    // Don't remove if it's the only exercise
    if (exercises.length <= 1) return;
    
    // Check if any sets completed for this exercise
    const exerciseId = exercises[exerciseIndex].id;
    const hasCompletedSets = completedSets.some(s => s.exerciseId === exerciseId);
    
    setExercises(prev => {
      const updated = prev.filter((_, i) => i !== exerciseIndex);
      return optimizeExerciseOrder(updated);
    });
    
    // Adjust current index if needed
    if (currentExerciseIndex >= exerciseIndex && currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const addSetToExercise = (exerciseIndex) => {
    setExercises(prev => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: ex.sets + 1, lastReps: [...ex.lastReps, ex.targetReps] } : ex));
  };

  const getCompletedForExercise = (exId) => completedSets.filter(s => s.exerciseId === exId);
  const getUpcomingExercises = () => exercisesForTime.slice(currentExerciseIndex + 1);
  const filteredSwapExercises = ALL_EXERCISES.filter(ex => ex.name.toLowerCase().includes(swapSearch.toLowerCase()));
  const filteredAddExercises = ALL_EXERCISES.filter(ex => {
    // Filter by search
    const matchesSearch = ex.name.toLowerCase().includes(addExerciseSearch.toLowerCase());
    // Exclude already added exercises (by name, since IDs might differ)
    const alreadyAdded = exercises.some(e => e.name === ex.name);
    return matchesSearch && !alreadyAdded;
  });

  // EXERCISE HISTORY MODAL
  if (showExerciseHistory !== null) {
    const exercise = exercisesForTime[showExerciseHistory];
    const maxE1rm = Math.max(...(exercise.history?.map(h => h.e1rm) || [0]));
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => setShowExerciseHistory(null)}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{exercise.name} History</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>Estimated 1RM Progress</p>
            <div className="h-32 flex items-end gap-2">
              {exercise.history?.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t" style={{ backgroundColor: COLORS.primary, height: `${(h.e1rm / maxE1rm) * 100}%`, minHeight: 8 }} />
                  <p className="text-xs mt-1 font-bold" style={{ color: COLORS.text }}>{h.e1rm}kg</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{h.date}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="font-semibold mb-3" style={{ color: COLORS.text }}>Previous Sessions</p>
          <div className="space-y-3">
            {exercise.history?.map((session, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold" style={{ color: COLORS.text }}>{session.date}</p>
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.accent + '20', color: COLORS.accent }}>e1RM: {session.e1rm}kg</span>
                </div>
                <p style={{ color: COLORS.textSecondary }}>{session.weight}kg × {session.reps.join(', ')} reps</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4"><button onClick={() => setShowExerciseHistory(null)} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Back to Workout</button></div>
      </div>
    );
  }

  // SWAP EXERCISE MODAL
  if (showSwapExercise !== null) {
    const exercise = exercisesForTime[showSwapExercise];
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setShowSwapExercise(null); setSwapSearch(''); }}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Swap {exercise.name}</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <input type="text" placeholder="Search exercises..." value={swapSearch} onChange={e => setSwapSearch(e.target.value)}
            className="w-full p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
          <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Suggested Alternatives</p>
          <div className="space-y-2 mb-4">
            {exercise.alternatives?.map(alt => (
              <button key={alt} onClick={() => swapExercise(showSwapExercise, alt)} className="w-full p-4 rounded-xl text-left flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                <span style={{ color: COLORS.text }}>{alt}</span>
                <ChevronRight size={18} color={COLORS.textMuted} />
              </button>
            ))}
          </div>
          {swapSearch && (
            <>
              <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Search Results</p>
              <div className="space-y-2">
                {filteredSwapExercises.slice(0, 8).map(ex => (
                  <button key={ex.name} onClick={() => swapExercise(showSwapExercise, ex.name)} className="w-full p-4 rounded-xl text-left flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                    <div>
                      <p style={{ color: COLORS.text }}>{ex.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.muscleGroup}</p>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ADD EXERCISE MODAL
  if (showAddExercise) {
    // Group exercises by muscle group for easier browsing
    const groupedExercises = filteredAddExercises.reduce((acc, ex) => {
      if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
      acc[ex.muscleGroup].push(ex);
      return acc;
    }, {});
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setShowAddExercise(false); setAddExerciseSearch(''); }}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Add Exercise</h2>
        </div>
        <div className="p-4 pb-2" style={{ backgroundColor: COLORS.primary + '10' }}>
          <p className="text-xs" style={{ color: COLORS.primary }}>
            💡 Exercises will be automatically reordered to optimize for your {userGoal === 'build_muscle' ? 'muscle building' : userGoal === 'strength' ? 'strength' : userGoal === 'lose_fat' ? 'fat loss' : 'fitness'} goal
          </p>
        </div>
        <div className="p-4 pt-2">
          <input type="text" placeholder="Search exercises..." value={addExerciseSearch} onChange={e => setAddExerciseSearch(e.target.value)}
            className="w-full p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }} />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          {filteredAddExercises.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: COLORS.textMuted }}>No exercises found</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                {addExerciseSearch ? 'Try a different search term' : 'All exercises already added'}
              </p>
            </div>
          ) : (
            Object.entries(groupedExercises).map(([muscleGroup, exs]) => (
              <div key={muscleGroup} className="mb-4">
                <p className="text-xs font-semibold mb-2 px-1" style={{ color: COLORS.textMuted }}>{muscleGroup.toUpperCase()}</p>
                <div className="space-y-2">
                  {exs.map(ex => (
                    <button key={ex.name} onClick={() => addExercise(ex.name)} className="w-full p-4 rounded-xl text-left flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                      <div>
                        <p style={{ color: COLORS.text }}>{ex.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.equipment} • {ex.type}</p>
                      </div>
                      <Plus size={18} color={COLORS.primary} />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // WORKOUT OVERVIEW (during workout)
  if (phase === 'workoutOverview') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setPhase('workout')}><ChevronLeft size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout Overview</h2>
          </div>
          <span className="text-sm" style={{ color: COLORS.textMuted }}>{completedSetsCount}/{totalSets} sets</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {exercisesForTime.map((exercise, exIdx) => {
            const exCompletedSets = getCompletedForExercise(exercise.id);
            const isCurrentEx = exIdx === currentExerciseIndex;
            const isCompleted = exCompletedSets.length === exercise.sets;
            return (
              <div key={exercise.id} className="mb-3 p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, border: isCurrentEx ? `2px solid ${COLORS.primary}` : 'none' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isCompleted ? <Check size={18} color={COLORS.success} /> : isCurrentEx ? <Play size={18} color={COLORS.primary} /> : <div className="w-4.5 h-4.5" />}
                    <p className="font-semibold" style={{ color: isCompleted ? COLORS.success : COLORS.text }}>{exercise.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => addSetToExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => setShowSwapExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight }}><Undo2 size={14} color={COLORS.textMuted} /></button>
                    {exercises.length > 1 && (
                      <button onClick={() => removeExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.error + '20' }}><X size={14} color={COLORS.error} /></button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {Array(exercise.sets).fill(0).map((_, setIdx) => {
                    const completedSet = exCompletedSets[setIdx];
                    return (
                      <div key={setIdx} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: completedSet ? COLORS.success + '20' : COLORS.surfaceLight, color: completedSet ? COLORS.success : COLORS.textMuted }}>
                        {completedSet ? `${completedSet.weight}×${completedSet.reps}` : `Set ${setIdx + 1}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAddExercise(true)} className="w-full p-4 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.surfaceLight, border: `2px dashed ${COLORS.textMuted}` }}>
            <Plus size={18} color={COLORS.textMuted} /><span style={{ color: COLORS.textMuted }}>Add Exercise</span>
          </button>
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="h-full rounded-full" style={{ backgroundColor: COLORS.primary, width: `${progressPercent}%` }} />
          </div>
          <button onClick={() => {
            // Make sure set timer is running if not resting
            if (!isResting && !setStartTime) {
              setSetStartTime(Date.now());
            }
            setPhase('workout');
          }} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Continue Workout</button>
        </div>
      </div>
    );
  }

  // INITIAL OVERVIEW PHASE
  if (phase === 'overview') {
    // Get workout purpose from template
    const workoutPurpose = {
      title: CURRENT_WORKOUT.name,
      focus: CURRENT_WORKOUT.focus,
      description: CURRENT_WORKOUT.description,
      goals: CURRENT_WORKOUT.goals
    };
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={onClose}><X size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{workoutPurpose.title}</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="text-center mb-4">
            <span className="text-5xl">💪</span>
            <h3 className="text-2xl font-bold mt-3" style={{ color: COLORS.text }}>Today's Workout</h3>
            <p style={{ color: COLORS.textSecondary }}>{exercisesForTime.length} exercises • ~{availableTime} mins</p>
          </div>
          
          {/* Workout Purpose Section */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.primary + '15', border: `1px solid ${COLORS.primary}40` }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} color={COLORS.primary} />
              <span className="font-semibold" style={{ color: COLORS.primary }}>{workoutPurpose.focus}</span>
            </div>
            <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>{workoutPurpose.description}</p>
            <div className="flex flex-wrap gap-2">
              {workoutPurpose.goals.map((goal, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.surface, color: COLORS.text }}>
                  ✓ {goal}
                </span>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            {exercisesForTime.map((exercise, i) => (
              <div key={exercise.id} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setShowExerciseHistory(i)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                      <span className="font-bold" style={{ color: COLORS.primary }}>{i + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.muscleGroup} • Tap to view history</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.sets} × {exercise.targetReps}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</p>
                    </div>
                    <button onClick={() => setShowSwapExercise(i)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <Undo2 size={16} color={COLORS.textMuted} />
                    </button>
                    {exercises.length > 1 && (
                      <button onClick={() => removeExercise(i)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '20' }}>
                        <X size={16} color={COLORS.error} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Last: {exercise.lastWeight}kg × {exercise.lastReps.join(', ')}</p>
                  {exercise.suggestedWeight > exercise.lastWeight && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>+{(exercise.suggestedWeight - exercise.lastWeight).toFixed(1)}kg</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAddExercise(true)} className="w-full p-4 rounded-xl flex items-center justify-center gap-2 mb-4" style={{ backgroundColor: COLORS.surfaceLight, border: `2px dashed ${COLORS.textMuted}` }}>
            <Plus size={18} color={COLORS.textMuted} /><span style={{ color: COLORS.textMuted }}>Add Exercise</span>
          </button>
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>💡 <strong style={{ color: COLORS.text }}>Tip:</strong> Exercises are auto-ordered for your goal. Tap any exercise to view history, swap to substitute, or remove with the X button.</p>
          </div>
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={async () => {
            const now = Date.now();
            setWorkoutStartTime(now);
            setSetStartTime(now);

            // Start workout session in Supabase
            if (userId) {
              try {
                const { data: session } = await workoutService.startWorkout(userId, null, null, workoutName);
                if (session) {
                  setSessionId(session.id);
                }
              } catch (err) {
                console.error('Error starting workout session:', err);
              }
            }

            setPhase('workout');
          }} className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Start Workout <Play size={20} /></button>
        </div>
      </div>
    );
  }

  // COMPLETE PHASE
  if (phase === 'complete') {
    // Calculate workout stats
    const totalVolume = completedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
    const totalReps = completedSets.reduce((acc, set) => acc + set.reps, 0);
    const avgRPE = completedSets.length > 0 
      ? (completedSets.reduce((acc, set) => acc + (set.rpe || 5), 0) / completedSets.length).toFixed(1)
      : 5;
    
    // Actual workout duration (start to end)
    const actualEndTime = workoutEndTime || Date.now();
    const totalDurationMs = workoutStartTime ? (actualEndTime - workoutStartTime) : 0;
    const totalDurationMins = Math.round(totalDurationMs / 60000);
    
    // Working time (time actually doing sets, excluding rest)
    const workingTimeMins = Math.round(totalWorkingTime / 60);
    
    // Rest time in minutes
    const restTimeMins = Math.round(totalRestTime / 60);
    
    // Estimate calories burned based on actual working time and intensity
    // Formula: ~8-12 cal/min for active weight training, adjusted by RPE
    const intensityMultiplier = avgRPE / 7;
    const caloriesBurned = Math.round(workingTimeMins * 10 * intensityMultiplier + restTimeMins * 2);
    
    // Check for PRs - compare each exercise's best set to their history
    const prsAchieved = [];
    exercisesForTime.forEach(exercise => {
      const exerciseSets = completedSets.filter(s => s.exerciseId === exercise.id);
      if (exerciseSets.length === 0) return;
      
      // Find best set by estimated 1RM (Epley formula: weight * (1 + reps/30))
      const bestSet = exerciseSets.reduce((best, set) => {
        const e1rm = set.weight * (1 + set.reps / 30);
        const bestE1rm = best.weight * (1 + best.reps / 30);
        return e1rm > bestE1rm ? set : best;
      });
      
      const currentE1rm = bestSet.weight * (1 + bestSet.reps / 30);
      
      // Compare to history (if available)
      const historyMax = exercise.history?.length > 0 
        ? Math.max(...exercise.history.map(h => h.e1rm || 0))
        : 0;
      
      // Also check against last workout
      const lastMax = exercise.lastWeight * (1 + Math.max(...(exercise.lastReps || [0])) / 30);
      const previousBest = Math.max(historyMax, lastMax);
      
      if (currentE1rm > previousBest && previousBest > 0) {
        prsAchieved.push({
          exercise: exercise.name,
          type: 'E1RM',
          value: `${currentE1rm.toFixed(1)}kg`,
          improvement: `+${(currentE1rm - previousBest).toFixed(1)}kg`
        });
      }
      
      // Check for weight PR
      if (bestSet.weight > exercise.lastWeight && exercise.lastWeight > 0) {
        // Only add if not already captured by E1RM
        if (!prsAchieved.find(pr => pr.exercise === exercise.name)) {
          prsAchieved.push({
            exercise: exercise.name,
            type: 'Weight',
            value: `${bestSet.weight}kg`,
            improvement: `+${(bestSet.weight - exercise.lastWeight).toFixed(1)}kg`
          });
        }
      }
    });
    
    // Group sets by exercise for breakdown
    const exerciseBreakdown = exercisesForTime.map(exercise => {
      const sets = completedSets.filter(s => s.exerciseId === exercise.id);
      const volume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
      return { name: exercise.name, sets: sets.length, targetSets: exercise.sets, volume };
    }).filter(e => e.sets > 0);
    
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={onClose}><X size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout Summary</h2>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {/* Hero Section */}
          <div className="text-center mb-6">
            <span className="text-6xl mb-2 block">🎉</span>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>Workout Complete!</h2>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{CURRENT_WORKOUT.name} • {totalDurationMins} mins</p>
          </div>
          
          {/* Time Breakdown */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} color={COLORS.primary} />
                <span className="font-semibold" style={{ color: COLORS.text }}>Time Breakdown</span>
              </div>
              <span className="text-lg font-bold" style={{ color: COLORS.primary }}>{totalDurationMins} min total</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.success + '15' }}>
                <p className="text-lg font-bold" style={{ color: COLORS.success }}>{workingTimeMins}m</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Working</p>
              </div>
              <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.accent + '15' }}>
                <p className="text-lg font-bold" style={{ color: COLORS.accent }}>{restTimeMins}m</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Resting</p>
              </div>
              <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                <p className="text-lg font-bold" style={{ color: COLORS.text }}>{Math.round((workingTimeMins / Math.max(totalDurationMins, 1)) * 100)}%</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Efficiency</p>
              </div>
            </div>
          </div>
          
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-3xl font-bold" style={{ color: COLORS.accent }}>🔥 {caloriesBurned}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Calories Burned</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>{(totalVolume / 1000).toFixed(1)}k</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>kg Volume</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xl font-bold" style={{ color: COLORS.text }}>{completedSetsCount}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Sets</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xl font-bold" style={{ color: COLORS.text }}>{totalReps}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Reps</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xl font-bold" style={{ color: COLORS.text }}>{avgRPE}</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Avg RPE</p>
            </div>
          </div>
          
          {/* PRs Achieved Section */}
          {prsAchieved.length > 0 && (
            <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: COLORS.warning + '15', border: `1px solid ${COLORS.warning}40` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏆</span>
                <h3 className="font-bold" style={{ color: COLORS.warning }}>Personal Records!</h3>
              </div>
              <div className="space-y-2">
                {prsAchieved.map((pr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{pr.exercise}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{pr.type} PR</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: COLORS.warning }}>{pr.value}</p>
                      <p className="text-xs" style={{ color: COLORS.success }}>{pr.improvement}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Exercise Breakdown */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <Dumbbell size={16} /> Exercise Breakdown
            </h3>
            <div className="space-y-2">
              {exerciseBreakdown.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b" style={{ borderColor: COLORS.surfaceLight }}>
                  <div className="flex items-center gap-2">
                    {ex.sets === ex.targetSets ? (
                      <Check size={16} color={COLORS.success} />
                    ) : (
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.warning + '40' }} />
                    )}
                    <span className="text-sm" style={{ color: COLORS.text }}>{ex.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold" style={{ color: ex.sets === ex.targetSets ? COLORS.success : COLORS.warning }}>
                      {ex.sets}/{ex.targetSets} sets
                    </span>
                    <span className="text-xs ml-2" style={{ color: COLORS.textMuted }}>{ex.volume}kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Workout Media Section */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
              <Eye size={16} /> Add Photos/Videos
            </h3>
            <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
              Document your workout with progress photos or form check videos
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const newMedia = files.map(file => ({
                  id: Date.now() + Math.random(),
                  file,
                  url: URL.createObjectURL(file),
                  type: file.type.startsWith('video') ? 'video' : 'image',
                  name: file.name,
                }));
                setWorkoutMedia(prev => [...prev, ...newMedia]);
                e.target.value = ''; // Reset input
              }}
            />

            {/* Media Preview Grid */}
            {workoutMedia.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {workoutMedia.map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                    {media.type === 'image' ? (
                      <img src={media.url} alt="Workout" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={24} color={COLORS.text} />
                        <video src={media.url} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(media.url);
                        setWorkoutMedia(prev => prev.filter(m => m.id !== media.id));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.error }}
                    >
                      <X size={12} color={COLORS.text} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}
            >
              <Plus size={18} />
              <span className="font-medium">Add Photo or Video</span>
            </button>
          </div>

          {/* Success Message */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.success + '15' }}>
            <p className="text-sm text-center" style={{ color: COLORS.success }}>
              ✓ Progress saved! {prsAchieved.length > 0 ? `Amazing work on ${prsAchieved.length} PR${prsAchieved.length > 1 ? 's' : ''}!` : 'Keep pushing for those PRs!'}
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button
            disabled={isSaving}
            onClick={async () => {
              // Save workout to Supabase
              if (userId && sessionId) {
                setIsSaving(true);
                try {
                  // Save each set
                  for (const set of completedSets) {
                    const exercise = exercisesForTime.find(e => e.id === set.exerciseId);
                    await workoutService.logSet(sessionId, null, exercise?.name || 'Unknown', {
                      setNumber: set.setIndex + 1,
                      weight: set.weight,
                      reps: set.reps,
                      rpe: set.rpe,
                    });

                    // Check for PRs
                    if (exercise) {
                      await workoutService.checkAndCreatePR(
                        userId,
                        null,
                        exercise.name,
                        set.weight,
                        set.reps,
                        sessionId
                      );
                    }
                  }

                  // Complete the session
                  await workoutService.completeWorkout(sessionId, {
                    durationMinutes: totalDurationMins,
                    totalVolume,
                    workingTime: totalWorkingTime,
                    restTime: totalRestTime,
                  });
                } catch (err) {
                  console.error('Error saving workout:', err);
                } finally {
                  setIsSaving(false);
                }
              }

              if (onComplete) onComplete();
              onClose();
            }}
            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.success, color: COLORS.text, opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : 'Done'}
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE WORKOUT PHASE (rest timer now inline)
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose}><X size={24} color={COLORS.text} /></button>
          <div><h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{currentExercise.name}</h2><p className="text-xs" style={{ color: COLORS.textMuted }}>{currentExercise.muscleGroup}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSwapExercise(currentExerciseIndex)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}><Undo2 size={16} color={COLORS.textMuted} /></button>
          <button onClick={() => setPhase('workoutOverview')} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}>Overview</button>
          <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>Set {currentSetIndex + 1}/{currentExercise.sets}</span>
        </div>
      </div>
      
      {/* Inline Rest Timer Banner */}
      {isResting && (
        <div className="p-4" style={{ backgroundColor: COLORS.accent + '15' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.accent + '30', border: `3px solid ${COLORS.accent}` }}
              >
                <p className="text-xl font-bold" style={{ color: COLORS.accent }}>{formatTime(restTimeLeft)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Rest Time</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Next: {currentExercise.name} - Set {currentSetIndex + 1}</p>
              </div>
            </div>
            <button 
              onClick={() => { 
                // Adjust rest time - subtract skipped time
                setTotalRestTime(prev => prev - restTimeLeft);
                setIsResting(false); 
                setRestTimeLeft(0);
                setSetStartTime(Date.now()); // Start timing next set
              }} 
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: COLORS.accent, color: COLORS.text }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4">
        <div className="p-6 rounded-2xl mb-4 text-center" style={{ backgroundColor: COLORS.surface }}>
          <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Target for this set</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div><p className="text-4xl font-bold" style={{ color: COLORS.primary }}>{currentExercise.suggestedWeight}</p><p className="text-sm" style={{ color: COLORS.textMuted }}>kg</p></div>
            <span className="text-2xl" style={{ color: COLORS.textMuted }}>×</span>
            <div><p className="text-4xl font-bold" style={{ color: COLORS.primary }}>{currentExercise.targetReps}</p><p className="text-sm" style={{ color: COLORS.textMuted }}>reps</p></div>
          </div>
          <div className="pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Last: {currentExercise.lastWeight}kg × {currentExercise.lastReps[currentSetIndex] || currentExercise.lastReps[0]} reps
              {currentExercise.suggestedWeight > currentExercise.lastWeight && <span style={{ color: COLORS.success }}> (+{(currentExercise.suggestedWeight - currentExercise.lastWeight).toFixed(1)}kg)</span>}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
          <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Log your actual performance:</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Weight (kg)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentSetData(prev => ({...prev, weight: Math.max(0, prev.weight - 2.5)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                <input type="number" value={currentSetData.weight} onChange={e => setCurrentSetData(prev => ({...prev, weight: parseFloat(e.target.value) || 0}))} className="flex-1 p-3 rounded-lg text-center text-xl font-bold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }} />
                <button onClick={() => setCurrentSetData(prev => ({...prev, weight: prev.weight + 2.5}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Reps</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentSetData(prev => ({...prev, reps: Math.max(0, prev.reps - 1)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                <input type="number" value={currentSetData.reps} onChange={e => setCurrentSetData(prev => ({...prev, reps: parseInt(e.target.value) || 0}))} className="flex-1 p-3 rounded-lg text-center text-xl font-bold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }} />
                <button onClick={() => setCurrentSetData(prev => ({...prev, reps: prev.reps + 1}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
              </div>
            </div>
          </div>
          
          {/* RPE Selector */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: COLORS.textMuted }}>RPE (Rate of Perceived Exertion)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                <button
                  key={rpe}
                  onClick={() => setCurrentSetData(prev => ({...prev, rpe}))}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{ 
                    backgroundColor: currentSetData.rpe === rpe ? COLORS.accent : COLORS.surfaceLight,
                    color: currentSetData.rpe === rpe ? COLORS.text : COLORS.textMuted
                  }}
                >
                  {rpe}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1 text-center" style={{ color: COLORS.textMuted }}>
              {currentSetData.rpe === 1 && 'Warm up - very light'}
              {currentSetData.rpe === 2 && 'Light - easy effort'}
              {currentSetData.rpe === 3 && 'Light - could do many more'}
              {currentSetData.rpe === 4 && 'Moderate - comfortable pace'}
              {currentSetData.rpe === 5 && 'Moderate - starting to work'}
              {currentSetData.rpe === 6 && 'Moderate-hard - 4+ reps left'}
              {currentSetData.rpe === 7 && 'Hard - 3 reps left'}
              {currentSetData.rpe === 8 && 'Very hard - 2 reps left'}
              {currentSetData.rpe === 9 && 'Near max - 1 rep left'}
              {currentSetData.rpe === 10 && 'Failure - no more reps possible'}
            </p>
          </div>
        </div>
        
        <div className="p-3 rounded-xl mb-4 flex items-center gap-3" style={{ backgroundColor: COLORS.accent + '15' }}><Clock size={18} color={COLORS.accent} /><p className="text-sm" style={{ color: COLORS.textSecondary }}><strong style={{ color: COLORS.accent }}>{formatTime(currentExercise.restTime)}</strong> rest after this set</p></div>
        
        {/* Completed Sets - Clickable to edit */}
        {completedSets.filter(s => s.exerciseId === currentExercise.id).length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Completed Sets <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>(tap to edit)</span></p>
            <div className="flex gap-2 flex-wrap">
              {completedSets.filter(s => s.exerciseId === currentExercise.id).map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => { setEditingSet({ exerciseId: s.exerciseId, setIndex: s.setIndex }); setEditSetData({ weight: s.weight, reps: s.reps, rpe: s.rpe || 5 }); }}
                  className="px-3 py-2 rounded-lg" 
                  style={{ backgroundColor: COLORS.success + '20' }}
                >
                  <p className="text-xs font-semibold" style={{ color: COLORS.success }}>Set {i + 1}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{s.weight}kg × {s.reps}</p>
                  {s.rpe && <p className="text-xs" style={{ color: COLORS.accent }}>RPE {s.rpe}</p>}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Full Workout List Button */}
        <button 
          onClick={() => setShowFullWorkoutList(true)}
          className="w-full p-3 rounded-xl mb-4 flex items-center justify-between"
          style={{ backgroundColor: COLORS.surfaceLight }}
        >
          <div className="flex items-center gap-2">
            <Book size={18} color={COLORS.textMuted} />
            <span className="text-sm" style={{ color: COLORS.text }}>View Full Workout</span>
          </div>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </button>
        
        {/* Up Next Preview */}
        {getUpcomingExercises().length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Up Next</p>
            <div className="space-y-2">
              {getUpcomingExercises().slice(0, 2).map((ex, i) => (
                <button 
                  key={ex.id} 
                  onClick={() => skipToExercise(currentExerciseIndex + 1 + i)}
                  className="w-full p-3 rounded-lg flex items-center justify-between" 
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>{currentExerciseIndex + 2 + i}.</span>
                    <span className="text-sm" style={{ color: COLORS.text }}>{ex.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>{ex.sets} × {ex.targetReps}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
        <div className="flex items-center justify-between mb-2"><span className="text-sm" style={{ color: COLORS.textMuted }}>Progress</span><span className="text-sm font-semibold" style={{ color: COLORS.text }}>{completedSetsCount}/{totalSets} sets</span></div>
        <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: COLORS.surfaceLight }}><div className="h-full rounded-full transition-all" style={{ backgroundColor: COLORS.primary, width: `${progressPercent}%` }} /></div>
        <div className="flex gap-3">
          <button onClick={() => setShowEndWorkoutConfirm(true)} className="px-4 py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.error }}>End</button>
          <button onClick={completeSet} className="flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.success, color: COLORS.text }}><Check size={20} /> Complete Set</button>
        </div>
      </div>
      
      {/* Full Workout List Modal */}
      {showFullWorkoutList && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFullWorkoutList(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Full Workout</h3>
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted }}>{completedSetsCount}/{totalSets} sets</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {exercisesForTime.map((ex, exIndex) => {
              const completedForEx = completedSets.filter(s => s.exerciseId === ex.id);
              const isCurrentExercise = exIndex === currentExerciseIndex;
              
              return (
                <div key={ex.id} className="mb-4">
                  <div 
                    className="p-3 rounded-t-xl flex items-center justify-between"
                    style={{ 
                      backgroundColor: isCurrentExercise ? COLORS.primary + '20' : COLORS.surface,
                      borderLeft: isCurrentExercise ? `3px solid ${COLORS.primary}` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: isCurrentExercise ? COLORS.primary : COLORS.textMuted }}>{exIndex + 1}.</span>
                      <span className="font-semibold" style={{ color: COLORS.text }}>{ex.name}</span>
                      {isCurrentExercise && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Current</span>}
                    </div>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{ex.suggestedWeight}kg</span>
                  </div>
                  <div className="rounded-b-xl overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                    {Array.from({ length: ex.sets }).map((_, setIdx) => {
                      const completedSet = completedForEx.find(s => s.setIndex === setIdx);
                      const isCurrentSet = isCurrentExercise && setIdx === currentSetIndex;
                      const isPastSet = exIndex < currentExerciseIndex || (isCurrentExercise && setIdx < currentSetIndex);
                      
                      return (
                        <button
                          key={setIdx}
                          onClick={() => {
                            if (!completedSet) skipToExercise(exIndex, setIdx);
                          }}
                          disabled={completedSet}
                          className="w-full p-3 flex items-center justify-between border-b last:border-b-0"
                          style={{ 
                            borderColor: COLORS.surface,
                            backgroundColor: completedSet ? COLORS.success + '10' : isCurrentSet ? COLORS.primary + '10' : 'transparent'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {completedSet ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success }}>
                                <Check size={14} color={COLORS.text} />
                              </div>
                            ) : isCurrentSet ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                                <Play size={12} color={COLORS.text} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.surface }}>
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>{setIdx + 1}</span>
                              </div>
                            )}
                            <span className="text-sm" style={{ color: completedSet ? COLORS.success : COLORS.text }}>Set {setIdx + 1}</span>
                          </div>
                          <div className="text-right">
                            {completedSet ? (
                              <div>
                                <span className="text-sm font-semibold" style={{ color: COLORS.success }}>{completedSet.weight}kg × {completedSet.reps}</span>
                                {completedSet.rpe && <span className="text-xs ml-2" style={{ color: COLORS.accent }}>RPE {completedSet.rpe}</span>}
                              </div>
                            ) : (
                              <span className="text-sm" style={{ color: COLORS.textMuted }}>{ex.suggestedWeight}kg × {ex.targetReps}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {/* Rest indicator after exercise */}
                    {exIndex < exercisesForTime.length - 1 && (
                      <div className="p-2 flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.accent + '10' }}>
                        <Clock size={12} color={COLORS.accent} />
                        <span className="text-xs" style={{ color: COLORS.accent }}>{formatTime(ex.restTime)} rest</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowFullWorkoutList(false)} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Back to Workout</button>
          </div>
        </div>
      )}
      
      {/* Edit Set Modal */}
      {editingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Edit Set</h3>
              <button onClick={() => setEditingSet(null)} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}><X size={20} color={COLORS.textMuted} /></button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Weight (kg)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditSetData(prev => ({...prev, weight: Math.max(0, prev.weight - 2.5)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                  <input type="number" value={editSetData.weight} onChange={e => setEditSetData(prev => ({...prev, weight: parseFloat(e.target.value) || 0}))} className="flex-1 p-3 rounded-lg text-center text-xl font-bold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }} />
                  <button onClick={() => setEditSetData(prev => ({...prev, weight: prev.weight + 2.5}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Reps</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditSetData(prev => ({...prev, reps: Math.max(0, prev.reps - 1)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                  <input type="number" value={editSetData.reps} onChange={e => setEditSetData(prev => ({...prev, reps: parseInt(e.target.value) || 0}))} className="flex-1 p-3 rounded-lg text-center text-xl font-bold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }} />
                  <button onClick={() => setEditSetData(prev => ({...prev, reps: prev.reps + 1}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
                </div>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: COLORS.textMuted }}>RPE</label>
                <div className="flex gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                    <button
                      key={rpe}
                      onClick={() => setEditSetData(prev => ({...prev, rpe}))}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold min-w-[28px]"
                      style={{ 
                        backgroundColor: editSetData.rpe === rpe ? COLORS.accent : COLORS.surfaceLight,
                        color: editSetData.rpe === rpe ? COLORS.text : COLORS.textMuted
                      }}
                    >
                      {rpe}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setEditingSet(null)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>Cancel</button>
              <button onClick={() => updateCompletedSet(editingSet.exerciseId, editingSet.setIndex, editSetData)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* End Workout Confirmation */}
      {showEndWorkoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.error + '20' }}>
                <X size={32} color={COLORS.error} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>End Workout Early?</h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                You've completed {completedSetsCount} of {totalSets} sets. Your progress will be saved.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndWorkoutConfirm(false)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}>Continue</button>
              <button onClick={endWorkoutEarly} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: COLORS.error, color: COLORS.text }}>End Workout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component
export default function UpRepDemo() {
  // Auth state
  const { user, profile, loading: authLoading, isAuthenticated, signOut, updateProfile, updateGoals } = useAuth();

  // Determine initial screen based on auth state
  const getInitialScreen = () => {
    if (isAuthenticated) {
      // Check if user has completed onboarding (has goals set)
      if (profile?.user_goals?.goal) {
        return 'main';
      }
      return 'onboarding';
    }
    return 'welcome';
  };

  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [activeTab, setActiveTab] = useState('home');

  // Update screen when auth state changes
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        if (profile?.user_goals?.goal) {
          setCurrentScreen('main');
        } else if (currentScreen === 'welcome' || currentScreen === 'login') {
          // User just logged in but hasn't completed onboarding
          setCurrentScreen('onboarding');
        }
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [authLoading, isAuthenticated, profile]);

  // Sync profile data from Supabase to local state
  useEffect(() => {
    if (profile) {
      // Update userData from profile
      setUserData(prev => ({
        ...prev,
        username: profile.username || prev.username,
        bio: profile.bio || prev.bio,
        gender: profile.gender || prev.gender,
        firstName: profile.first_name || prev.firstName,
        lastName: profile.last_name || prev.lastName,
        email: user?.email || prev.email,
        // From user_goals
        goal: profile.user_goals?.goal || prev.goal,
        experience: profile.user_goals?.experience || prev.experience,
        currentWeight: profile.user_goals?.current_weight?.toString() || prev.currentWeight,
        goalWeight: profile.user_goals?.goal_weight?.toString() || prev.goalWeight,
        programWeeks: profile.user_goals?.program_weeks || prev.programWeeks,
        daysPerWeek: profile.user_goals?.days_per_week || prev.daysPerWeek,
        sessionDuration: profile.user_goals?.session_duration || prev.sessionDuration,
        restDays: profile.user_goals?.rest_days || prev.restDays,
      }));

      // Sync allow_subscribers from profile to settings
      if (profile.allow_subscribers !== undefined) {
        setSettings(prev => ({
          ...prev,
          social: { ...prev.social, allowSubscribers: profile.allow_subscribers }
        }));
      }

      // Update overview stats if goals exist
      if (profile.user_goals) {
        const goals = profile.user_goals;
        const currentW = goals.current_weight || 80;
        const goalW = goals.goal_weight || 75;
        const startW = goals.starting_weight || currentW;
        const weeks = goals.program_weeks || 16;
        const weeklyTarget = (goalW - currentW) / weeks;

        // Calculate program start date from goals created_at or use a reasonable default
        const startDate = goals.created_at ? new Date(goals.created_at) : new Date();

        setOverviewStats(prev => ({
          ...prev,
          startingWeight: startW,
          currentWeight: currentW,
          targetWeight: goalW,
          weeklyTarget: parseFloat(weeklyTarget.toFixed(2)),
          programLength: weeks,
          programStartDate: startDate.toISOString().split('T')[0],
        }));

        // Calculate personalized nutrition targets
        const nutritionTargets = generateNutritionTargets({
          weight: currentW,
          height: profile.height || 175,
          age: profile.age || 25,
          gender: profile.gender || 'other',
          goal: goals.goal || 'fitness',
          workoutsPerWeek: goals.days_per_week || 4,
          goalWeight: goalW,
        });

        setNutritionGoals({
          calories: nutritionTargets.calories,
          protein: nutritionTargets.protein,
          carbs: nutritionTargets.carbs,
          fats: nutritionTargets.fat,
          water: nutritionTargets.water,
          tdee: nutritionTargets.tdee,
          weeklyWeightChange: nutritionTargets.weeklyWeightChange,
        });
      }
    }
  }, [profile, user]);

  // Load streaks from Supabase
  useEffect(() => {
    let isMounted = true;

    const loadStreaks = async () => {
      if (user?.id && isAuthenticated) {
        try {
          const result = await streakService.refreshAllStreaks(user.id);
          if (isMounted && result) {
            setStreaks({
              weeklyWorkouts: { weeksCompleted: result.workout?.streak || 0 },
              calories: { daysInRow: result.nutrition?.streak || 0 },
              protein: { daysInRow: result.nutrition?.streak || 0 },
              water: { daysInRow: result.water?.streak || 0 },
              sleep: { daysInRow: result.sleep?.streak || 0 },
              supplements: { daysInRow: 0 }, // Not tracked yet
            });
          }
        } catch (err) {
          console.warn('Error loading streaks:', err?.message || err);
        }
      }
    };

    loadStreaks();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated]);

  // Dynamic today's date - defined early for use in useEffects
  const today = new Date();
  const TODAY_DATE_KEY = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Load today's nutrition data from database
  useEffect(() => {
    let isMounted = true;

    const loadTodayNutrition = async () => {
      if (!user?.id || !isAuthenticated) return;

      try {
        // Load today's daily nutrition totals
        const { data: dailyData, error: dailyError } = await nutritionService.getDailyNutrition(user.id, TODAY_DATE_KEY);
        if (dailyError) console.warn('Daily nutrition error:', dailyError?.message);
        if (isMounted && dailyData) {
          setCaloriesIntake(dailyData.total_calories || 0);
          setProteinIntake(dailyData.total_protein || 0);
          setCarbsIntake(dailyData.total_carbs || 0);
          setFatsIntake(dailyData.total_fats || 0);
          setWaterIntake(dailyData.water_intake || 0);
        }

        // Load today's meals
        const { data: meals, error: mealsError } = await nutritionService.getMeals(user.id, TODAY_DATE_KEY);
        if (mealsError) console.warn('Meals error:', mealsError?.message);
        if (isMounted && meals) {
          setMealLog(meals.map(meal => ({
            id: meal.id,
            name: meal.meal_name,
            time: meal.meal_time,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
          })));
        }

        // Load user supplements
        const { data: userSupplements, error: suppError } = await nutritionService.getSupplements(user.id);
        if (suppError) console.warn('Supplements error:', suppError?.message);
        if (isMounted && userSupplements) {
          // Load today's supplement logs to check which are taken
          const { data: supplementLogs } = await nutritionService.getSupplementLogs(user.id, TODAY_DATE_KEY);
          const takenIds = new Set(supplementLogs?.map(log => log.supplement_id) || []);

          setSupplements(userSupplements.map(supp => ({
            id: supp.id,
            name: supp.name,
            dosage: supp.dosage,
            time: supp.scheduled_time,
            taken: takenIds.has(supp.id),
          })));
        }
      } catch (err) {
        console.warn('Error loading nutrition data:', err?.message || err);
      }
    };

    loadTodayNutrition();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated, TODAY_DATE_KEY]);

  // Load chart data from database
  useEffect(() => {
    let isMounted = true;

    const loadChartData = async () => {
      if (!user?.id || !isAuthenticated || !profile?.user_goals) return;

      const goals = profile.user_goals;
      const startWeight = goals.starting_weight || goals.current_weight || 80;
      const goalWeight = goals.goal_weight || startWeight;
      const programWeeks = goals.program_weeks || 16;
      const workoutsPerWeek = goals.days_per_week || 4;

      try {
        // Load weight history
        const { data: weightData, error: weightError } = await profileService.getWeightHistory(user.id, programWeeks * 7);
        if (weightError) console.warn('Weight history error:', weightError?.message);

        // Group weight data by week
        const weightByWeek = {};
        if (weightData && weightData.length > 0) {
          weightData.forEach(entry => {
            if (!entry?.log_date || entry?.weight == null) return;
            const weekNum = Math.ceil(
              (new Date(entry.log_date) - new Date(weightData[weightData.length - 1].log_date)) / (7 * 24 * 60 * 60 * 1000)
            ) + 1;
            if (!weightByWeek[weekNum] || entry.log_date > weightByWeek[weekNum].date) {
              weightByWeek[weekNum] = { weight: entry.weight, date: entry.log_date };
            }
          });
        }

        // Generate weight chart data with projections
        const weightChartData = [];
        const weeklyChange = programWeeks > 0 ? (goalWeight - startWeight) / programWeeks : 0;
        for (let week = 1; week <= Math.min(programWeeks, 16); week++) {
          const expectedWeight = startWeight + (weeklyChange * week);
          const actualWeight = weightByWeek[week]?.weight;
          weightChartData.push({
            week: week.toString(),
            value: actualWeight || null,
            expected: parseFloat(expectedWeight.toFixed(1)),
          });
        }

        // Load workout history
        const { data: workoutData, error: workoutError } = await workoutService.getWorkoutHistory(user.id, 100);
        if (workoutError) console.warn('Workout history error:', workoutError?.message);

        // Group workouts by week
        const workoutsByWeek = {};
        if (workoutData && workoutData.length > 0) {
          workoutData.forEach(session => {
            if (!session?.started_at) return;
            const sessionDate = new Date(session.started_at);
            const weekNum = Math.ceil(
              (new Date() - sessionDate) / (7 * 24 * 60 * 60 * 1000)
            );
            const displayWeek = Math.min(16, Math.max(1, 16 - weekNum + 1));
            workoutsByWeek[displayWeek] = (workoutsByWeek[displayWeek] || 0) + 1;
          });
        }

        // Generate workout chart data
        const workoutChartData = [];
        for (let week = 1; week <= 16; week++) {
          workoutChartData.push({
            week: week.toString(),
            value: workoutsByWeek[week] || 0,
            expected: workoutsPerWeek,
          });
        }

        // Load sleep history
        const { data: sleepData, error: sleepError } = await sleepService.getRecentSleep(user.id, 84); // 12 weeks
        if (sleepError) console.warn('Sleep history error:', sleepError?.message);

        // Group sleep by week
        const sleepByWeek = {};
        if (sleepData && sleepData.length > 0) {
          sleepData.forEach(entry => {
            if (!entry?.log_date || entry?.hours_slept == null) return;
            const weekNum = Math.ceil(
              (new Date() - new Date(entry.log_date)) / (7 * 24 * 60 * 60 * 1000)
            );
            const displayWeek = Math.min(12, Math.max(1, 12 - weekNum + 1));
            if (!sleepByWeek[displayWeek]) {
              sleepByWeek[displayWeek] = { total: 0, count: 0 };
            }
            sleepByWeek[displayWeek].total += entry.hours_slept;
            sleepByWeek[displayWeek].count++;
          });
        }

        // Generate sleep chart data
        const sleepChartDataNew = [];
        for (let week = 1; week <= 12; week++) {
          const weekData = sleepByWeek[week];
          sleepChartDataNew.push({
            week: week.toString(),
            value: weekData ? parseFloat((weekData.total / weekData.count).toFixed(1)) : null,
            goal: 8,
          });
        }

        if (isMounted) {
          setChartData(prev => ({
            ...prev,
            weight: weightChartData,
            workouts: workoutChartData,
          }));
          setSleepChartData(sleepChartDataNew);
        }

      } catch (err) {
        console.warn('Error loading chart data:', err?.message || err);
      }
    };

    loadChartData();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated, profile?.user_goals]);

  // Load weekly weight averages for dynamic goals
  useEffect(() => {
    let isMounted = true;

    const loadWeeklyWeightData = async () => {
      if (!user?.id || !isAuthenticated) return;

      try {
        const result = await profileService.getWeeklyWeightAverages(user.id, 8);
        if (isMounted && result?.data) {
          setWeeklyWeightData({
            actualWeeklyRate: result.data.actualWeeklyRate ?? 0,
            weeklyAverages: result.data.weeklyAverages ?? [],
            latestAverage: result.data.latestAverage ?? null,
          });
        }
      } catch (err) {
        // Fail silently - this feature is optional
        console.warn('Weekly weight data unavailable:', err?.message || err);
      }
    };

    loadWeeklyWeightData();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated]);

  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(60);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showPausePlan, setShowPausePlan] = useState(false);
  const [rescheduleOption, setRescheduleOption] = useState(null);

  // Track if today's workout is completed
  const [todayWorkoutCompleted, setTodayWorkoutCompleted] = useState(false);

  // Get today's workout from masterSchedule - will be set after masterSchedule is initialized
  const [todayWorkout, setTodayWorkout] = useState({
    type: 'Rest',
    name: 'Rest Day',
    exercises: 0,
    duration: 0,
    focus: ''
  });
  const [showStreakCalendar, setShowStreakCalendar] = useState(null);
  const [streakCalendarMonth, setStreakCalendarMonth] = useState(currentMonth);
  const [streakCalendarYear, setStreakCalendarYear] = useState(currentYear);
  const [selectedStreakDay, setSelectedStreakDay] = useState(null);
  const [draggedDay, setDraggedDay] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [pauseDuration, setPauseDuration] = useState(null);
  const [pauseCalendarMonth, setPauseCalendarMonth] = useState(currentMonth);
  const [pauseCalendarYear, setPauseCalendarYear] = useState(currentYear);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showGoalInfo, setShowGoalInfo] = useState(null);
  const [hoveredGoal, setHoveredGoal] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [proteinIntake, setProteinIntake] = useState(0);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [lastNightBedTime, setLastNightBedTime] = useState('23:00');
  const [lastNightWakeTime, setLastNightWakeTime] = useState('06:30');
  const [lastNightConfirmed, setLastNightConfirmed] = useState(false);
  
  // Local editing refs for sleep (prevents scroll on each keystroke)
  const sleepEditRefs = {
    lastBedH: React.useRef(null),
    lastBedM: React.useRef(null),
    lastWakeH: React.useRef(null),
    lastWakeM: React.useRef(null),
    bedH: React.useRef(null),
    bedM: React.useRef(null),
    wakeH: React.useRef(null),
    wakeM: React.useRef(null),
  };
  
  // Pause/Reschedule status
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReturnDate, setPauseReturnDate] = useState(null);
  const [isRescheduled, setIsRescheduled] = useState(false);
  const [originalWorkout, setOriginalWorkout] = useState(null);
  
  // Supplements - start empty, load from database
  const [supplements, setSupplements] = useState([]);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState('');
  const [newSupplementDosage, setNewSupplementDosage] = useState('');

  // Extended Nutrition State - start at 0, load from database
  const [carbsIntake, setCarbsIntake] = useState(0);
  const [fatsIntake, setFatsIntake] = useState(0);
  const [showAddMealFull, setShowAddMealFull] = useState(false);
  const [nutritionTab, setNutritionTab] = useState('overview'); // overview, meals, supplements

  // Meal Log - start empty, load from database
  const [mealLog, setMealLog] = useState([]);
  
  // Nutrition Goals (calculated from user stats)
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2200,
    protein: 150,
    carbs: 250,
    fats: 70,
    water: 2500,
    tdee: 2200,
    weeklyWeightChange: 0,
  });
  
  // Weekly Nutrition History (for charts) - loaded from database
  const [weeklyNutrition, setWeeklyNutrition] = useState([]);
  
  // Supplement History - loaded from database
  const [supplementHistory, setSupplementHistory] = useState([]);
  
  // Friends & Social
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [friendsTab, setFriendsTab] = useState('feed'); // feed, friends, challenges
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [expandedActivity, setExpandedActivity] = useState(null);
  
  // Friends list - loaded from database
  const [friends, setFriends] = useState([]);
  
  // Suggested friends - loaded from database
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  
  // Activity feed - loaded from database
  const [activityFeed, setActivityFeed] = useState([]);
  
  // Challenges - loaded from database
  const [challenges, setChallenges] = useState([]);
  
  // Challenge creation state
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    type: 'workouts',
    duration: 7, // days
    invitedFriends: []
  });
  
  // Profile editing state
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Profile settings state
  const [settings, setSettings] = useState({
    units: 'metric', // 'metric' or 'imperial'
    notifications: {
      workoutReminders: true,
      progressUpdates: true,
      socialActivity: true,
      weeklyReport: true,
    },
    privacy: {
      profileVisible: true,
      showActivity: true,
      showProgress: false,
    },
    tracking: {
      calories: true,
      macros: true,
      water: true,
      sleep: true,
      supplements: true,
    },
    social: {
      allowSubscribers: false, // false = friend requests only, true = anyone can subscribe
    },
  });
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Achievements - will be calculated/loaded from database
  const [achievements] = useState([
    { id: 'first_workout', name: 'First Steps', desc: 'Complete your first workout', icon: '🎯', unlocked: false },
    { id: 'week_streak', name: 'Week Warrior', desc: '7-day workout streak', icon: '🔥', unlocked: false },
    { id: 'month_streak', name: 'Monthly Master', desc: '30-day workout streak', icon: '⚡', unlocked: false },
    { id: 'first_pr', name: 'Personal Best', desc: 'Set your first PR', icon: '🏆', unlocked: false },
    { id: 'five_prs', name: 'PR Collector', desc: 'Set 5 personal records', icon: '🥇', unlocked: false },
    { id: 'ten_workouts', name: 'Getting Serious', desc: 'Complete 10 workouts', icon: '💪', unlocked: false },
    { id: 'fifty_workouts', name: 'Dedicated', desc: 'Complete 50 workouts', icon: '🏅', unlocked: false },
    { id: 'early_bird', name: 'Early Bird', desc: 'Workout before 7am', icon: '🌅', unlocked: false },
    { id: 'night_owl', name: 'Night Owl', desc: 'Workout after 9pm', icon: '🌙', unlocked: false },
    { id: 'volume_king', name: 'Volume King', desc: 'Lift 100,000kg total', icon: '👑', unlocked: false },
    { id: 'consistency', name: 'Consistency', desc: 'Hit calorie goal 7 days straight', icon: '📊', unlocked: false },
    { id: 'hydrated', name: 'Hydration Hero', desc: 'Hit water goal 7 days straight', icon: '💧', unlocked: false },
  ]);

  const [showFriendProfile, setShowFriendProfile] = useState(null);
  const [showFriendStreakCalendar, setShowFriendStreakCalendar] = useState(null);
  const [friendStreakMonth, setFriendStreakMonth] = useState(currentMonth);
  const [friendStreakYear, setFriendStreakYear] = useState(currentYear);
  const [likedPosts, setLikedPosts] = useState([]);
  
  const [userData, setUserData] = useState({
    firstName: '', lastName: '', email: '', goal: null, experience: null,
    daysPerWeek: 4, sessionDuration: 60, dob: '', weight: '',
    currentWeight: '', goalWeight: '', programWeeks: 16,
    restDays: [5, 6], // Saturday = 5, Sunday = 6 (Mon=0 based, default weekend rest)
    username: '',
    bio: '',
    gender: null // 'male', 'female', or 'other'
  });

  // Overview stats - will be populated from database
  const [overviewStats, setOverviewStats] = useState({
    startingWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
    weeklyTarget: 0, // kg per week (negative = loss, positive = gain)
    totalWorkouts: 0,
    programWeek: 1,
    programLength: 16,
    programStartDate: null, // Date when user started tracking
  });

  const [showWeighIn, setShowWeighIn] = useState(false);
  const [showWeightDetails, setShowWeightDetails] = useState(false);

  // Dynamic weight tracking based on weekly averages
  const [weeklyWeightData, setWeeklyWeightData] = useState({
    actualWeeklyRate: 0,      // Actual kg change per week based on averages
    weeklyAverages: [],       // Array of weekly average weights
    latestAverage: null,      // Most recent weekly average
  });

  // Friend search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Meal and water tracking modals
  const [showMealEntry, setShowMealEntry] = useState(false);
  const [showWaterEntry, setShowWaterEntry] = useState(false);

  const [selectedChart, setSelectedChart] = useState('weight');
  const [chartData, setChartData] = useState({
    weight: [],
    workouts: [],
    bench: [],
    squat: [],
  });
  const chartLabels = { weight: 'kg', workouts: 'sessions', bench: 'kg', squat: 'kg' };

  // Sleep chart data
  const [sleepChartData, setSleepChartData] = useState([]);

  const [streaks, setStreaks] = useState({
    weeklyWorkouts: { weeksCompleted: 0 },
    calories: { daysInRow: 0 },
    protein: { daysInRow: 0 },
    water: { daysInRow: 0 },
    sleep: { daysInRow: 0 },
    supplements: { daysInRow: 0 },
  });

  // Workout Tab State
  const [showWorkoutPreview, setShowWorkoutPreview] = useState(null); // workout template id
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  const [showPersonalRecords, setShowPersonalRecords] = useState(false);
  const [showCustomWorkout, setShowCustomWorkout] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [fullScheduleMonth, setFullScheduleMonth] = useState(currentMonth);
  const [fullScheduleYear, setFullScheduleYear] = useState(currentYear);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [exerciseFilterGroup, setExerciseFilterGroup] = useState('All');
  
  // Current program state
  const [currentProgram, setCurrentProgram] = useState({
    id: 'ppl',
    name: 'Push/Pull/Legs',
    description: '6-day split for maximum muscle growth',
    daysPerWeek: 6,
    currentWeek: 5,
    totalWeeks: 16,
  });
  
  // Schedule state - dynamic schedule that can be edited
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [editingScheduleDay, setEditingScheduleDay] = useState(null);
  const [showWorkoutTimeEditor, setShowWorkoutTimeEditor] = useState(false);
  const scheduleScrollRef = useRef(null);
  
  // Master schedule - editable workout plan
  const [masterSchedule, setMasterSchedule] = useState(() => {
    // Generate 52 weeks of schedule (1 year)
    const schedule = {};
    const workoutRotation = [
      WORKOUT_TEMPLATES.push_a,
      WORKOUT_TEMPLATES.pull_a,
      WORKOUT_TEMPLATES.legs_a,
      null, // Rest
      WORKOUT_TEMPLATES.push_b,
      WORKOUT_TEMPLATES.pull_b,
      WORKOUT_TEMPLATES.legs_b,
    ];
    
    // Generate schedule starting 30 days ago to 365 days in future
    const scheduleStart = new Date(today);
    scheduleStart.setDate(today.getDate() - 30);
    for (let i = 0; i < 395; i++) {
      const date = new Date(scheduleStart);
      date.setDate(scheduleStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isPast = date < today;

      // Rest on Sunday (getDay()=0) and Saturday (getDay()=6)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        schedule[dateKey] = { workout: null, completed: false };
      } else {
        const rotationIndex = i % 7;
        const workout = workoutRotation[rotationIndex % workoutRotation.length];
        schedule[dateKey] = {
          workout,
          completed: false // Will be loaded from database
        };
      }
    }
    return schedule;
  });

  // Sync todayWorkout with masterSchedule on mount
  useEffect(() => {
    const todayEntry = masterSchedule[TODAY_DATE_KEY];
    if (todayEntry) {
      setTodayWorkoutCompleted(todayEntry.completed);
      if (todayEntry.workout) {
        setTodayWorkout({
          type: todayEntry.workout.name.replace(' Day ', ' ').replace('Day ', ''),
          name: todayEntry.workout.name,
          exercises: todayEntry.workout.exercises?.length || 0,
          duration: 60,
          focus: todayEntry.workout.focus || ''
        });
      } else {
        setTodayWorkout({
          type: 'Rest',
          name: 'Rest Day',
          exercises: 0,
          duration: 0,
          focus: ''
        });
      }
    }
  }, []);

  // Mark today's workout as complete
  const completeTodayWorkout = () => {
    setTodayWorkoutCompleted(true);
    setMasterSchedule(prev => ({
      ...prev,
      [TODAY_DATE_KEY]: { ...prev[TODAY_DATE_KEY], completed: true }
    }));
  };

  // Get week dates for display
  const getWeekDates = (weekOffset) => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Monday

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const scheduleEntry = masterSchedule[dateKey] || { workout: null, completed: false };
      const isPast = date < todayStart;

      days.push({
        day: dayNames[i],
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateKey,
        workout: scheduleEntry.workout,
        completed: scheduleEntry.completed,
        isToday: date.toDateString() === today.toDateString(),
        isPast
      });
    }
    return days;
  };
  
  const currentWeekDates = getWeekDates(scheduleWeekOffset);
  
  // Swap workouts between two days
  const swapWorkoutDays = (fromDateKey, toDateKey) => {
    setMasterSchedule(prev => {
      const newSchedule = { ...prev };
      const fromWorkout = newSchedule[fromDateKey]?.workout;
      const toWorkout = newSchedule[toDateKey]?.workout;
      
      newSchedule[fromDateKey] = { ...newSchedule[fromDateKey], workout: toWorkout };
      newSchedule[toDateKey] = { ...newSchedule[toDateKey], workout: fromWorkout };
      
      return newSchedule;
    });
  };
  
  // Change workout for a specific day
  const setWorkoutForDay = (dateKey, workout) => {
    setMasterSchedule(prev => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], workout }
    }));
  };
  
  // Get month name for week header
  const getWeekHeaderText = (weekOffset) => {
    const days = getWeekDates(weekOffset);
    const firstDay = days[0];
    const lastDay = days[6];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === 1) return 'Next Week';
    if (weekOffset === -1) return 'Last Week';
    
    if (firstDay.month === lastDay.month) {
      return `${monthNames[firstDay.month]} ${firstDay.date}-${lastDay.date}`;
    }
    return `${monthNames[firstDay.month]} ${firstDay.date} - ${monthNames[lastDay.month]} ${lastDay.date}`;
  };
  
  // Upcoming workouts (next 3)
  const upcomingWorkouts = (() => {
    const upcoming = [];
    for (let i = 1; i <= 14 && upcoming.length < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const entry = masterSchedule[dateKey];
      if (entry?.workout) {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        upcoming.push({
          date: `${dayNames[(date.getDay() + 6) % 7]}, ${monthNames[date.getMonth()]} ${date.getDate()}`,
          dateKey,
          workout: entry.workout
        });
      }
    }
    return upcoming;
  })();
  
  // Completed workouts history - will be loaded from database
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Personal records - will be loaded from database
  const [personalRecords, setPersonalRecords] = useState([]);

  // Welcome Screen
  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6" style={{ backgroundColor: COLORS.surface }}>
        <Dumbbell size={48} color={COLORS.primary} />
      </div>
      <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>UpRep</h1>
      <p className="text-lg mb-2" style={{ color: COLORS.textSecondary }}>Your Personal Fitness Journey</p>
      <p className="text-sm mb-8" style={{ color: COLORS.textMuted }}>Track workouts, hit goals, transform your body</p>
      <button onClick={() => setCurrentScreen('register')}
        className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 mb-3"
        style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>
        Get Started <ChevronRight size={20} />
      </button>
      <button onClick={() => setCurrentScreen('login')}
        className="w-full py-4 rounded-xl font-semibold text-lg mb-6"
        style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}` }}>
        Log In
      </button>
    </div>
  );

  // Dashboard Screen
  const DashboardScreen = () => {
    const userName = userData.firstName || 'Matt';
    const hasProgress = userData.goal !== null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
              <Dumbbell size={18} color={COLORS.text} />
            </div>
            <span className="text-xl font-bold" style={{ color: COLORS.text }}>UpRep</span>
          </div>
          <div className="text-center mb-6">
            <p className="text-lg mb-1" style={{ color: COLORS.textSecondary }}>Welcome back,</p>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.text }}>{userName}! 👋</h1>
          </div>
          
          {!hasProgress && (
            <>
              <div className="p-6 rounded-2xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                <div className="text-center mb-4"><span className="text-4xl">🚀</span></div>
                <h2 className="text-xl font-bold mb-2 text-center" style={{ color: COLORS.text }}>
                  Ready to Transform with UpRep?
                </h2>
                <p className="text-center mb-4" style={{ color: COLORS.textSecondary }}>
                  Your personalized fitness journey is just a few taps away
                </p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { icon: Target, label: 'Personalized Plans', desc: 'Workouts tailored to your goals', color: COLORS.primary },
                  { icon: TrendingUp, label: 'Progress Tracking', desc: 'Watch your PRs climb', color: COLORS.accent },
                  { icon: Apple, label: 'Nutrition Tracking', desc: 'Hit your macros', color: COLORS.protein },
                  { icon: Flame, label: 'Stay Motivated', desc: 'Streaks & achievements', color: COLORS.warning },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: COLORS.surface }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                      <item.icon size={24} color={item.color} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>{item.label}</p>
                      <p className="text-sm" style={{ color: COLORS.textSecondary }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {!hasProgress && (
          <div className="p-6 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setCurrentScreen('onboarding')}
              className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>
              Start Your UpRep Journey <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Goal Info Modal
  const GoalInfoModal = ({ goal, onClose, onSelect }) => {
    const info = GOAL_INFO[goal];
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={onClose}><ChevronLeft size={24} color={COLORS.text} /></button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{info.title}</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="text-center mb-6">
            <span className="text-6xl">{info.icon}</span>
            <p className="mt-4" style={{ color: COLORS.textSecondary }}>{info.overview}</p>
          </div>
          <div className="space-y-3">
            {info.requirements.map((req, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{req.icon}</span>
                  <div>
                    <p className="font-semibold" style={{ color: COLORS.text }}>{req.title}</p>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>{req.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => onSelect(goal)} className="w-full py-4 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>
            Select This Goal
          </button>
        </div>
      </div>
    );
  };

  // Onboarding Screen
  const OnboardingScreen = () => {
    const steps = [
      {
        title: "Create your profile",
        subtitle: "Choose a username your friends will see",
        content: null // Will be rendered separately using ProfileSetupStep component
      },
      {
        title: "What's your main goal?",
        subtitle: "Select a goal, tap ⓘ to learn more",
        content: (
          <div className="space-y-3">
            {Object.entries(GOAL_INFO).map(([id, goal]) => (
              <div key={id}>
                <div
                  className="w-full p-4 rounded-xl flex items-center gap-4 text-left cursor-pointer"
                  style={{ backgroundColor: userData.goal === id ? COLORS.primary + '20' : COLORS.surface,
                    border: `2px solid ${userData.goal === id ? COLORS.primary : COLORS.surfaceLight}`,
                    borderRadius: hoveredGoal === id ? '12px 12px 0 0' : '12px' }}
                  onClick={() => { setUserData(p => ({...p, goal: id})); setHoveredGoal(id); }}
                >
                  <span className="text-3xl">{goal.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: userData.goal === id ? COLORS.primary : COLORS.text }}>{goal.title}</p>
                  </div>
                  {userData.goal === id && <Check size={20} color={COLORS.primary} />}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setHoveredGoal(hoveredGoal === id ? null : id); }}
                    className="p-2 rounded-full"
                    style={{ backgroundColor: hoveredGoal === id ? COLORS.primary : COLORS.surfaceLight }}
                  >
                    <Info size={18} color={hoveredGoal === id ? COLORS.text : COLORS.textMuted} />
                  </button>
                </div>
                
                {/* Info Panel - Inline, pushes content down */}
                {hoveredGoal === id && (
                  <div 
                    className="p-4 rounded-b-xl"
                    style={{ backgroundColor: COLORS.surfaceLight, borderTop: `1px solid ${COLORS.surface}` }}
                  >
                    <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>{goal.overview}</p>
                    <div className="space-y-2">
                      {goal.requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-sm">{req.icon}</span>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{req.title}</p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>{req.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between text-xs" style={{ borderColor: COLORS.surface }}>
                      <span style={{ color: COLORS.textMuted }}>Min: {goal.minDays} days/week</span>
                      <span style={{ color: COLORS.accent }}>Ideal: {goal.idealDays} days/week</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      },
      {
        title: "Set your weight goals",
        subtitle: "We'll create a safe, sustainable plan",
        content: null // Will be rendered separately to avoid re-creation
      },
      {
        title: "Your experience level?",
        content: (
          <div className="space-y-3">
            {[
              { id: 'beginner', label: 'Beginner', desc: 'New to working out' },
              { id: 'intermediate', label: 'Intermediate', desc: '1-3 years experience' },
              { id: 'advanced', label: 'Advanced', desc: '3+ years experience' },
            ].map(level => (
              <button key={level.id} onClick={() => setUserData(p => ({...p, experience: level.id}))}
                className="w-full p-4 rounded-xl text-left"
                style={{ backgroundColor: userData.experience === level.id ? COLORS.primary + '20' : COLORS.surface,
                  border: `2px solid ${userData.experience === level.id ? COLORS.primary : COLORS.surfaceLight}` }}>
                <p className="font-semibold" style={{ color: userData.experience === level.id ? COLORS.primary : COLORS.text }}>{level.label}</p>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>{level.desc}</p>
              </button>
            ))}
          </div>
        )
      },
    ];

    const step = steps[onboardingStep];
    
    // Weight bounds
    const MIN_WEIGHT = 35;
    const MAX_WEIGHT = 250;
    const isValidWeight = (w) => w >= MIN_WEIGHT && w <= MAX_WEIGHT;
    
    // Check for weight step errors
    const getWeightError = () => {
      if (onboardingStep !== 2) return false;
      const currentW = parseFloat(userData.currentWeight) || 0;
      const goalW = parseFloat(userData.goalWeight) || 0;
      if (!currentW || !goalW) return false;
      
      // Check bounds
      if (!isValidWeight(currentW) || !isValidWeight(goalW)) return true;
      
      const diff = goalW - currentW;
      const weeks = userData.programWeeks || 16;
      const weeklyChange = Math.abs(diff / weeks);
      
      if (userData.goal === 'lose_fat' && diff > 0) return true;
      if ((userData.goal === 'build_muscle' || userData.goal === 'strength') && diff < 0) return true;
      if (userData.goal === 'lose_fat' && weeklyChange > 1) return true;
      if ((userData.goal === 'build_muscle' || userData.goal === 'strength') && weeklyChange > 0.5) return true;
      return false;
    };
    
    const canProceed = 
      onboardingStep === 0 ? (userData.username && userData.username.length >= 3) : 
      onboardingStep === 1 ? userData.goal : 
      onboardingStep === 2 ? (userData.currentWeight && userData.goalWeight && !getWeightError()) :
      userData.experience;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => onboardingStep > 0 ? setOnboardingStep(onboardingStep - 1) : setCurrentScreen('dashboard')}>
            <ChevronLeft size={24} color={COLORS.text} />
          </button>
          <div className="flex-1 flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" 
                style={{ backgroundColor: i <= onboardingStep ? COLORS.primary : COLORS.surfaceLight }} />
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-4">
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text }}>{step.title}</h2>
          {step.subtitle && <p className="mb-6" style={{ color: COLORS.textSecondary }}>{step.subtitle}</p>}
          {onboardingStep === 0 ? (
            <ProfileSetupStep 
              userData={userData} 
              setUserData={setUserData} 
              COLORS={COLORS} 
            />
          ) : onboardingStep === 2 ? (
            <WeightGoalStep 
              userData={userData} 
              setUserData={setUserData} 
              COLORS={COLORS} 
            />
          ) : step.content}
        </div>
        <div className="p-6">
          <button onClick={async () => {
            if (onboardingStep < steps.length - 1) {
              setOnboardingStep(onboardingStep + 1);
            } else {
              // Set up program based on user-entered weights
              const currentW = parseFloat(userData.currentWeight) || 80;
              const goalW = parseFloat(userData.goalWeight) || 75;
              const weeks = userData.programWeeks || 16;
              const weeklyTarget = (goalW - currentW) / weeks;

              // Save profile and goals to Supabase
              if (user) {
                try {
                  // Update profile (username, bio, gender)
                  await updateProfile({
                    username: userData.username,
                    bio: userData.bio || '',
                    gender: userData.gender,
                    first_name: userData.firstName || '',
                    last_name: userData.lastName || '',
                  });

                  // Update goals
                  await updateGoals({
                    goal: userData.goal,
                    experience: userData.experience,
                    current_weight: currentW,
                    goal_weight: goalW,
                    starting_weight: currentW,
                    program_weeks: weeks,
                    days_per_week: userData.daysPerWeek || 4,
                    session_duration: userData.sessionDuration || 60,
                    rest_days: userData.restDays || [5, 6],
                  });

                  // Calculate and save nutrition goals
                  const nutritionTargets = generateNutritionTargets({
                    weight: currentW,
                    height: 175, // Could add to onboarding
                    age: 25, // Could add to onboarding
                    gender: userData.gender || 'other',
                    goal: userData.goal || 'fitness',
                    workoutsPerWeek: userData.daysPerWeek || 4,
                    goalWeight: goalW,
                  });

                  await nutritionService.updateNutritionGoals(user.id, {
                    calories: nutritionTargets.calories,
                    protein: nutritionTargets.protein,
                    carbs: nutritionTargets.carbs,
                    fats: nutritionTargets.fat,
                    water: nutritionTargets.water,
                  });

                  // Update local state
                  setNutritionGoals({
                    calories: nutritionTargets.calories,
                    protein: nutritionTargets.protein,
                    carbs: nutritionTargets.carbs,
                    fats: nutritionTargets.fat,
                    water: nutritionTargets.water,
                    tdee: nutritionTargets.tdee,
                    weeklyWeightChange: nutritionTargets.weeklyWeightChange,
                  });

                  // Log initial weight
                  await profileService.logWeight(user.id, currentW);

                } catch (err) {
                  console.error('Error saving onboarding data:', err);
                }
              }

              // Set program start date to today
              const programStartDate = new Date().toISOString().split('T')[0];

              setOverviewStats(prev => ({
                ...prev,
                startingWeight: currentW,
                currentWeight: currentW,
                targetWeight: goalW,
                weeklyTarget: parseFloat(weeklyTarget.toFixed(2)),
                programWeek: 1,
                programLength: weeks,
                programStartDate,
              }));
              setCurrentScreen('main');
            }
          }}
            disabled={!canProceed} className="w-full py-4 rounded-xl font-semibold text-lg"
            style={{ backgroundColor: COLORS.primary, color: COLORS.text, opacity: canProceed ? 1 : 0.5 }}>
            {onboardingStep < steps.length - 1 ? 'Continue' : 'Start Training'}
          </button>
        </div>
      </div>
    );
  };

  // Reschedule Modal
  const RescheduleModal = () => {
    // Base schedule for the next 14 days - using Push/Pull/Legs split
    const baseSchedule = [
      { day: 'Wed', date: 'Jan 8', type: 'Push A', isToday: true },
      { day: 'Thu', date: 'Jan 9', type: 'Pull A' },
      { day: 'Fri', date: 'Jan 10', type: 'Legs A' },
      { day: 'Sat', date: 'Jan 11', type: 'Rest' },
      { day: 'Sun', date: 'Jan 12', type: 'Rest' },
      { day: 'Mon', date: 'Jan 13', type: 'Push B' },
      { day: 'Tue', date: 'Jan 14', type: 'Pull B' },
      { day: 'Wed', date: 'Jan 15', type: 'Legs B' },
      { day: 'Thu', date: 'Jan 16', type: 'Rest' },
      { day: 'Fri', date: 'Jan 17', type: 'Upper A' },
      { day: 'Sat', date: 'Jan 18', type: 'Lower' },
      { day: 'Sun', date: 'Jan 19', type: 'Rest' },
      { day: 'Mon', date: 'Jan 20', type: 'Upper B' },
      { day: 'Tue', date: 'Jan 21', type: 'Arms' },
    ];
    
    // Workout type colors
    const getWorkoutColor = (type) => {
      if (type.includes('Push')) return COLORS.primary;
      if (type.includes('Pull')) return COLORS.accent;
      if (type.includes('Leg') || type.includes('Lower')) return COLORS.warning;
      if (type.includes('Upper')) return COLORS.sleep;
      if (type.includes('Arms')) return COLORS.water;
      if (type.includes('Full')) return COLORS.protein;
      return COLORS.textMuted;
    };

    const dayNames = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
    const dates = ['Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20', 'Jan 21'];

    const getUpdatedSchedule = () => {
      if (!rescheduleOption) return baseSchedule;

      const workouts = baseSchedule.map(d => d.type);
      let newSchedule = [];

      if (rescheduleOption === 'shift1') {
        // Shift all workouts by 1 day, today becomes rest
        newSchedule = dates.map((date, i) => ({
          day: dayNames[i % 7],
          date,
          type: i === 0 ? 'Rest' : workouts[i - 1],
          isToday: i === 0,
          changed: i <= workouts.findIndex((w, idx) => idx > 0 && workouts[idx] !== workouts[idx-1]) + 1
        }));
        // Mark first few as changed
        for (let i = 0; i < 5; i++) newSchedule[i].changed = true;
      } else if (rescheduleOption === 'shift2') {
        // Shift all workouts by 2 days
        newSchedule = dates.map((date, i) => ({
          day: dayNames[i % 7],
          date,
          type: i < 2 ? 'Rest' : workouts[i - 2],
          isToday: i === 0,
          changed: i < 6
        }));
      } else if (rescheduleOption === 'shift3') {
        // Shift all workouts by 3 days
        newSchedule = dates.map((date, i) => ({
          day: dayNames[i % 7],
          date,
          type: i < 3 ? 'Rest' : workouts[i - 3],
          isToday: i === 0,
          changed: i < 7
        }));
      } else if (rescheduleOption === 'swap') {
        // Swap today with tomorrow
        newSchedule = dates.map((date, i) => ({
          day: dayNames[i % 7],
          date,
          type: i === 0 ? workouts[1] : i === 1 ? workouts[0] : workouts[i],
          isToday: i === 0,
          changed: i < 2
        }));
      } else if (rescheduleOption === 'compress') {
        // Move to tomorrow but remove the next rest day to keep schedule tight
        const workoutsOnly = workouts.filter(w => w !== 'Rest');
        let restCount = 0;
        let workoutIdx = 0;
        newSchedule = dates.map((date, i) => {
          let type;
          if (i === 0) {
            type = 'Rest'; // Today becomes rest
          } else {
            // Insert workouts, skipping one rest day
            const originalType = workouts[i];
            if (originalType === 'Rest' && restCount === 0 && i > 0 && i < 6) {
              // Skip first rest day after today to compress
              restCount++;
              type = workouts[i + 1] || 'Rest';
            } else {
              type = i === 0 ? 'Rest' : workouts[i - 1 + restCount];
            }
          }
          return {
            day: dayNames[i % 7],
            date,
            type: type || 'Rest',
            isToday: i === 0,
            changed: i < 5
          };
        });
        // Simplified compress: shift by 1 but show compressed schedule note
        newSchedule = dates.map((date, i) => ({
          day: dayNames[i % 7],
          date,
          type: i === 0 ? 'Rest' : i === 1 ? 'Push Day' : i === 2 ? 'Pull Day' : i === 3 ? 'Leg Day' : i === 4 ? 'Push Day' : i === 5 ? 'Rest' : workouts[i],
          isToday: i === 0,
          changed: i < 5
        }));
      } else if (rescheduleOption === 'skip') {
        // Skip today's workout entirely, continue with rest of schedule
        newSchedule = dates.map((date, i) => ({
          day: dayNames[i % 7],
          date,
          type: i === 0 ? 'Skipped' : workouts[i],
          isToday: i === 0,
          changed: i === 0,
          skipped: i === 0
        }));
      }

      return newSchedule.slice(0, 10);
    };

    const schedule = getUpdatedSchedule();

    const options = [
      { id: 'shift1', label: 'Move to Tomorrow', desc: 'Shift entire schedule by 1 day', icon: '📅' },
      { id: 'shift2', label: 'Move 2 Days', desc: 'Shift entire schedule by 2 days', icon: '📆' },
      { id: 'shift3', label: 'Move 3 Days', desc: 'Shift entire schedule by 3 days', icon: '🗓️' },
      { id: 'swap', label: 'Swap with Tomorrow', desc: 'Do Pull Day today, Push Day tomorrow', icon: '🔄' },
      { id: 'compress', label: 'Move & Compress', desc: 'Shift by 1 day, remove a rest day', icon: '⚡' },
      { id: 'skip', label: 'Skip This Workout', desc: 'Remove from schedule, continue as planned', icon: '⏭️' },
    ];

    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setRescheduleOption(null); setShowReschedule(false); }}>
            <ChevronLeft size={24} color={COLORS.text} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Reschedule Workout</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="p-3 rounded-xl mb-4 flex items-center gap-3" style={{ backgroundColor: COLORS.primary + '20' }}>
            <Dumbbell size={20} color={COLORS.primary} />
            <div>
              <p className="font-semibold" style={{ color: COLORS.text }}>Today: Push Day</p>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>Bench Press, OHP, Incline Press + 2 more</p>
            </div>
          </div>

          <p className="mb-3 font-semibold" style={{ color: COLORS.text }}>How would you like to reschedule?</p>
          <div className="space-y-2 mb-6">
            {options.map(option => (
              <button key={option.id} onClick={() => setRescheduleOption(option.id)}
                className="w-full p-4 rounded-xl flex items-center gap-3 text-left"
                style={{ backgroundColor: rescheduleOption === option.id ? COLORS.primary + '20' : COLORS.surface,
                  border: `2px solid ${rescheduleOption === option.id ? COLORS.primary : COLORS.surfaceLight}` }}>
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: rescheduleOption === option.id ? COLORS.primary : COLORS.text }}>{option.label}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{option.desc}</p>
                </div>
                {rescheduleOption === option.id && <Check size={20} color={COLORS.primary} />}
              </button>
            ))}
          </div>

          {rescheduleOption && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: COLORS.text }}>Updated Schedule</h3>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.accent + '20', color: COLORS.accent }}>
                  {schedule.filter(d => d.changed).length} days affected
                </span>
              </div>
              <div className="space-y-1">
                {schedule.map((day, i) => (
                  <div key={i} className="p-3 rounded-xl flex items-center justify-between"
                    style={{ 
                      backgroundColor: day.skipped ? COLORS.error + '15' : day.changed ? COLORS.accent + '15' : COLORS.surface,
                      border: day.isToday ? `2px solid ${COLORS.primary}` : '1px solid transparent'
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12">
                        <p className="font-bold text-sm" style={{ color: day.isToday ? COLORS.primary : COLORS.text }}>{day.day}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{day.date.split(' ')[1]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {day.type === 'Push Day' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
                        {day.type === 'Pull Day' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.accent }} />}
                        {day.type === 'Leg Day' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />}
                        {day.type === 'Rest' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.textMuted }} />}
                        {day.type === 'Skipped' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.error }} />}
                        <p style={{ color: day.skipped ? COLORS.error : day.type === 'Rest' ? COLORS.textMuted : COLORS.text }}>{day.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.changed && !day.skipped && !day.isToday && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.accent + '30', color: COLORS.accent }}>
                          shifted
                        </span>
                      )}
                      {day.isToday && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {rescheduleOption === 'compress' && (
                <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ backgroundColor: COLORS.warning + '15' }}>
                  <AlertCircle size={16} color={COLORS.warning} className="mt-0.5" />
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    <strong style={{ color: COLORS.warning }}>Compressed schedule:</strong> A rest day has been removed to keep your program on track. Make sure you're recovering well!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { 
            // Save original workout if not already saved
            if (!originalWorkout) {
              setOriginalWorkout({...todayWorkout});
            }
            if (rescheduleOption === 'skip') {
              setTodayWorkout({ type: 'Skipped', name: 'Workout Skipped', exercises: 0, duration: 0 });
            } else if (rescheduleOption === 'swap') {
              setTodayWorkout({ type: 'Pull Day', name: 'Pull Day A', exercises: 5, duration: 55 });
            } else {
              setTodayWorkout({ type: 'Rest', name: 'Rest Day', exercises: 0, duration: 0 });
            }
            setIsRescheduled(true);
            setRescheduleOption(null); 
            setShowReschedule(false); 
          }}
            disabled={!rescheduleOption} className="w-full py-4 rounded-xl font-semibold"
            style={{ backgroundColor: rescheduleOption === 'skip' ? COLORS.error : COLORS.primary, color: COLORS.text, opacity: rescheduleOption ? 1 : 0.5 }}>
            {rescheduleOption === 'skip' ? 'Skip Workout' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    );
  };

  // Pause Plan Modal with Calendar
  const PausePlanModal = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => {
      const day = new Date(year, month, 1).getDay();
      return (day + 6) % 7; // Convert Sunday=0 to Monday=0 based
    };
    
    const daysInMonth = getDaysInMonth(pauseCalendarMonth, pauseCalendarYear);
    const firstDay = getFirstDayOfMonth(pauseCalendarMonth, pauseCalendarYear);
    
    const isToday = (day) => {
      return day === today.getDate() && pauseCalendarMonth === today.getMonth() && pauseCalendarYear === today.getFullYear();
    };
    
    const isSelected = (day) => {
      if (!pauseDuration) return false;
      const selected = new Date(pauseDuration);
      return day === selected.getDate() && pauseCalendarMonth === selected.getMonth() && pauseCalendarYear === selected.getFullYear();
    };
    
    const isPast = (day) => {
      const date = new Date(pauseCalendarYear, pauseCalendarMonth, day);
      return date <= today;
    };
    
    const handleDateSelect = (day) => {
      if (isPast(day)) return;
      const selectedDate = new Date(pauseCalendarYear, pauseCalendarMonth, day);
      setPauseDuration(selectedDate.toISOString());
    };
    
    const formatSelectedDate = () => {
      if (!pauseDuration) return '';
      const date = new Date(pauseDuration);
      const days = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${days} days)`;
    };
    
    const changeMonth = (delta) => {
      let newMonth = pauseCalendarMonth + delta;
      let newYear = pauseCalendarYear;
      if (newMonth > 11) { newMonth = 0; newYear++; }
      if (newMonth < 0) { newMonth = 11; newYear--; }
      setPauseCalendarMonth(newMonth);
      setPauseCalendarYear(newYear);
    };
    
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }

    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setPauseDuration(null); setShowPausePlan(false); }}>
            <ChevronLeft size={24} color={COLORS.text} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Take a Break</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {/* Supportive Message */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🌴</span>
              <div>
                <h3 className="font-bold mb-1" style={{ color: COLORS.text }}>Rest is Part of Progress</h3>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Taking breaks is completely okay and often necessary! Whether it's a holiday, busy period, or you just need time off — your body and mind will thank you.
                </p>
              </div>
            </div>
          </div>

          <p className="font-semibold mb-3" style={{ color: COLORS.text }}>When will you be back?</p>
          
          {/* Calendar */}
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.surface }}>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                <ChevronLeft size={20} color={COLORS.text} />
              </button>
              <h4 className="font-bold" style={{ color: COLORS.text }}>{monthNames[pauseCalendarMonth]} {pauseCalendarYear}</h4>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                <ChevronRight size={20} color={COLORS.text} />
              </button>
            </div>
            
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold py-1" style={{ color: COLORS.textMuted }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => day && handleDateSelect(day)}
                  disabled={!day || isPast(day)}
                  className="aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: isSelected(day) ? COLORS.success : isToday(day) ? COLORS.primary : 'transparent',
                    color: !day ? 'transparent' : isPast(day) ? COLORS.textMuted : isSelected(day) || isToday(day) ? COLORS.text : COLORS.text,
                    opacity: !day ? 0 : isPast(day) ? 0.4 : 1,
                    cursor: !day || isPast(day) ? 'default' : 'pointer'
                  }}
                >
                  {day || ''}
                </button>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.primary }} />
                <span className="text-xs" style={{ color: COLORS.textMuted }}>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.success }} />
                <span className="text-xs" style={{ color: COLORS.textMuted }}>Return Date</span>
              </div>
            </div>
          </div>

          {/* Selected Date Display */}
          {pauseDuration && (
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.success + '15', border: `1px solid ${COLORS.success}40` }}>
              <div className="flex items-center gap-3">
                <Calendar size={20} color={COLORS.success} />
                <div>
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>Returning on</p>
                  <p className="font-bold" style={{ color: COLORS.success }}>{formatSelectedDate()}</p>
                </div>
              </div>
            </div>
          )}

          {/* What happens during break */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>What happens when you're back:</p>
            <div className="space-y-2">
              {[
                { icon: '🔄', text: 'Your schedule will be automatically recalculated' },
                { icon: '💪', text: 'Weights and reps adjusted based on your break length' },
                { icon: '🔥', text: 'Streaks preserved — we know life happens!' },
                { icon: '📈', text: 'Gradual ramp-up to get you back on track safely' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { 
            setIsPaused(true);
            setPauseReturnDate(pauseDuration);
            setPauseDuration(null); 
            setShowPausePlan(false); 
          }}
            disabled={!pauseDuration} className="w-full py-4 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.success, color: COLORS.background, opacity: pauseDuration ? 1 : 0.5 }}>
            {pauseDuration ? `Pause Until ${new Date(pauseDuration).getDate()} ${monthNames[new Date(pauseDuration).getMonth()]}` : 'Select a Return Date'}
          </button>
        </div>
      </div>
    );
  };

  // Home Tab scroll ref
  const homeScrollRef = React.useRef(null);
  const homeScrollPos = React.useRef(0);

  // Home Tab
  const HomeTab = () => {
    React.useEffect(() => {
      if (homeScrollRef.current) {
        homeScrollRef.current.scrollTop = homeScrollPos.current;
      }
    }, []);
    
    const handleScroll = (e) => {
      homeScrollPos.current = e.target.scrollTop;
    };
    
    return (
    <div ref={homeScrollRef} onScroll={handleScroll} className="p-4 overflow-auto h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p style={{ color: COLORS.textSecondary }}>Good evening,</p>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>{userData.firstName || 'Matt'}</h2>
        </div>
        <button
          onClick={() => setActiveTab('profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary }}
        >
          <span className="font-bold" style={{ color: COLORS.text }}>
            {userData.firstName ? userData.firstName[0].toUpperCase() : 'M'}
          </span>
        </button>
      </div>

      {/* Paused Banner */}
      {isPaused && pauseReturnDate && (
        <div className="p-4 rounded-xl mb-4 flex items-center justify-between" style={{ backgroundColor: COLORS.warning + '20', border: `1px solid ${COLORS.warning}40` }}>
          <div className="flex items-center gap-3">
            <Moon size={20} color={COLORS.warning} />
            <div>
              <p className="font-semibold" style={{ color: COLORS.warning }}>Plan Paused</p>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                Returning {new Date(pauseReturnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: 'Push A', name: 'Push Day A', focus: CURRENT_WORKOUT.focus, exercises: 5, duration: 60 }); }}
            className="px-4 py-2 rounded-lg font-semibold text-sm"
            style={{ backgroundColor: COLORS.warning, color: COLORS.background }}>
            Resume Now
          </button>
        </div>
      )}

      {/* Rescheduled Banner */}
      {isRescheduled && originalWorkout && (
        <div className="p-4 rounded-xl mb-4 flex items-center justify-between" style={{ backgroundColor: COLORS.accent + '20', border: `1px solid ${COLORS.accent}40` }}>
          <div className="flex items-center gap-3">
            <Calendar size={20} color={COLORS.accent} />
            <div>
              <p className="font-semibold" style={{ color: COLORS.accent }}>Schedule Modified</p>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>Originally: {originalWorkout.type}</p>
            </div>
          </div>
          <button onClick={() => { setIsRescheduled(false); setTodayWorkout(originalWorkout); setOriginalWorkout(null); }}
            className="px-4 py-2 rounded-lg font-semibold text-sm"
            style={{ backgroundColor: COLORS.accent, color: COLORS.background }}>
            Undo
          </button>
        </div>
      )}

      {/* Goal Overview Section */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
              <Target size={24} color={COLORS.primary} />
            </div>
            <div>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Your Goal</p>
              <p className="font-bold text-lg" style={{ color: COLORS.text }}>
                {userData.goal === 'lose_fat' ? 'Lose Weight' : userData.goal === 'build_muscle' ? 'Build Muscle' : userData.goal === 'strength' ? 'Get Stronger' : userData.goal === 'fitness' ? 'General Fitness' : 'Set a Goal'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Week {overviewStats.programWeek}/{overviewStats.programLength}</p>
            <div className="w-20 h-2 rounded-full overflow-hidden mt-1" style={{ backgroundColor: COLORS.surfaceLight }}>
              <div className="h-full rounded-full" style={{ backgroundColor: COLORS.primary, width: `${(overviewStats.programWeek / overviewStats.programLength) * 100}%` }} />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Starting</p>
            <p className="text-lg font-bold" style={{ color: COLORS.text }}>{overviewStats.startingWeight}kg</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.primary + '20' }}>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Current</p>
            <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{overviewStats.currentWeight}kg</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Target</p>
            <p className="text-lg font-bold" style={{ color: COLORS.success }}>{overviewStats.targetWeight}kg</p>
          </div>
        </div>

        {(() => {
          const weightChange = overviewStats.currentWeight - overviewStats.startingWeight;
          const isLoss = weightChange < 0;
          const isGain = weightChange > 0;
          const isGoodProgress = 
            (userData.goal === 'lose_fat' && isLoss) || 
            ((userData.goal === 'build_muscle' || userData.goal === 'strength') && isGain) ||
            (userData.goal === 'fitness');
          const progressColor = isGoodProgress ? COLORS.success : COLORS.warning;
          return (
            <div className="flex items-center justify-between p-3 rounded-lg mb-3" style={{ backgroundColor: progressColor + '15' }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} color={progressColor} />
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>Total Progress</span>
              </div>
              <span className="font-bold" style={{ color: progressColor }}>
                {isLoss ? '↓' : isGain ? '↑' : '→'} {Math.abs(weightChange).toFixed(1)}kg
              </span>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '20' }}>
              <Dumbbell size={18} color={COLORS.warning} />
            </div>
            <div>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Workouts</p>
              <p className="font-bold" style={{ color: COLORS.text }}>{overviewStats.totalWorkouts}</p>
            </div>
          </div>
          <button
            onClick={() => setShowWeightDetails(true)}
            className="p-3 rounded-lg flex items-center gap-3 text-left"
            style={{ backgroundColor: COLORS.surfaceLight }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.water + '20' }}>
              <TrendingUp size={18} color={COLORS.water} />
            </div>
            <div className="flex-1">
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Weekly Rate</p>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: COLORS.text }}>
                  {weeklyWeightData?.actualWeeklyRate !== 0
                    ? `${weeklyWeightData?.actualWeeklyRate > 0 ? '+' : ''}${weeklyWeightData?.actualWeeklyRate || 0}kg`
                    : `${overviewStats.weeklyTarget > 0 ? '+' : ''}${overviewStats.weeklyTarget}kg`}
                </span>
                {weeklyWeightData?.actualWeeklyRate !== 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    backgroundColor: COLORS.surfaceLight,
                    color: COLORS.textMuted
                  }}>
                    target: {overviewStats.weeklyTarget > 0 ? '+' : ''}{overviewStats.weeklyTarget}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </button>
        </div>
        
        <button 
          onClick={() => setShowWeighIn(true)}
          className="w-full mt-3 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
        >
          <Plus size={18} /> Log Weigh-In
        </button>
      </div>

      {/* Weigh-In Modal */}
      {showWeighIn && (
        <WeighInModal
          COLORS={COLORS}
          onClose={() => setShowWeighIn(false)}
          onSave={async (data) => {
            const { weight: val, date } = data;
            // Save to Supabase
            if (user?.id) {
              try {
                await profileService.logWeight(user.id, val, date);

                // Recalculate nutrition targets with new weight
                const nutritionTargets = generateNutritionTargets({
                  weight: val,
                  height: profile?.height || 175,
                  age: profile?.age || 25,
                  gender: userData.gender || 'other',
                  goal: userData.goal || 'fitness',
                  workoutsPerWeek: userData.daysPerWeek || 4,
                  goalWeight: parseFloat(userData.goalWeight) || val,
                });

                setNutritionGoals({
                  calories: nutritionTargets.calories,
                  protein: nutritionTargets.protein,
                  carbs: nutritionTargets.carbs,
                  fats: nutritionTargets.fat,
                  water: nutritionTargets.water,
                  tdee: nutritionTargets.tdee,
                  weeklyWeightChange: nutritionTargets.weeklyWeightChange,
                });
              } catch (err) {
                console.error('Error saving weight:', err);
              }
            }
            setOverviewStats(prev => ({ ...prev, currentWeight: val }));
            setShowWeighIn(false);
          }}
          initialWeight={overviewStats.currentWeight}
          currentWeight={overviewStats.currentWeight}
          userGoal={userData.goal}
        />
      )}

      {/* Weight Details Modal */}
      {showWeightDetails && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowWeightDetails(false)}><X size={24} color={COLORS.text} /></button>
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Weight Progress</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Starting Weight</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{overviewStats.startingWeight}kg</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Current Weight</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{overviewStats.currentWeight}kg</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Target Weight</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{overviewStats.targetWeight}kg</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Remaining</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
                  {Math.abs(overviewStats.targetWeight - overviewStats.currentWeight).toFixed(1)}kg
                </p>
              </div>
            </div>

            {/* Weekly Change Comparison - Dynamic Based on Weekly Averages */}
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Weekly Rate (Based on Averages)</p>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Target Rate</p>
                  <p className="text-lg font-bold" style={{ color: COLORS.textSecondary }}>
                    {overviewStats.weeklyTarget > 0 ? '+' : ''}{overviewStats.weeklyTarget}kg/wk
                  </p>
                </div>
                <div className="flex-1 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Actual Rate</p>
                  <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
                    {(weeklyWeightData?.actualWeeklyRate || 0) > 0 ? '+' : ''}{weeklyWeightData?.actualWeeklyRate || 0}kg/wk
                  </p>
                </div>
              </div>

              {/* Progress Status */}
              {(() => {
                const targetRate = overviewStats.weeklyTarget;
                const actualRate = weeklyWeightData?.actualWeeklyRate || 0;
                const isOnTrack =
                  (targetRate >= 0 && actualRate >= targetRate * 0.8) ||
                  (targetRate < 0 && actualRate <= targetRate * 0.8);
                const isClose =
                  (targetRate >= 0 && actualRate >= targetRate * 0.5 && actualRate < targetRate * 0.8) ||
                  (targetRate < 0 && actualRate <= targetRate * 0.5 && actualRate > targetRate * 0.8);

                const statusColor = isOnTrack ? COLORS.success : isClose ? COLORS.warning : COLORS.error;
                const statusText = isOnTrack ? 'On Track' : isClose ? 'Slightly Behind' : 'Needs Adjustment';
                const statusIcon = isOnTrack ? '✓' : isClose ? '↗' : '!';

                return (weeklyWeightData?.weeklyAverages?.length || 0) >= 2 ? (
                  <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: statusColor + '15' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{statusIcon}</span>
                      <span className="text-sm font-medium" style={{ color: statusColor }}>{statusText}</span>
                    </div>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      Based on {weeklyWeightData?.weeklyAverages?.length || 0} weeks
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      Log weights for 2+ weeks to see your actual rate
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Weekly Averages Chart */}
            {(weeklyWeightData?.weeklyAverages?.length || 0) > 0 && (
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Weekly Averages</p>
                <div className="space-y-2">
                  {(weeklyWeightData?.weeklyAverages || []).slice(-4).map((week, index, arr) => (
                    <div key={week.week} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>
                        Week of {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-bold" style={{ color: index === arr.length - 1 ? COLORS.primary : COLORS.text }}>
                        {week.average}kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Chart */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Weight Trend</p>
              <div style={{ height: 200 }}>
                {chartData.weight?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.weight}>
                      <XAxis
                        dataKey="week"
                        tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `W${val}`}
                      />
                      <YAxis
                        tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickFormatter={(val) => `${val}kg`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div style={{
                                backgroundColor: COLORS.surface,
                                border: `1px solid ${COLORS.surfaceLight}`,
                                borderRadius: 8,
                                padding: '8px 12px',
                              }}>
                                <p style={{ color: COLORS.textMuted, fontSize: 11 }}>Week {label}</p>
                                <p style={{ color: COLORS.primary, fontSize: 14, fontWeight: 'bold' }}>Actual: {payload[0]?.value}kg</p>
                                <p style={{ color: COLORS.textMuted, fontSize: 12 }}>Expected: {payload[1]?.value}kg</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={{ fill: COLORS.primary, r: 3 }}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="expected"
                        stroke={COLORS.textMuted}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Expected"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>Log weigh-ins to see your trend</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-center mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5" style={{ backgroundColor: COLORS.primary }}></div>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5" style={{ backgroundColor: COLORS.textMuted, borderStyle: 'dashed' }}></div>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>Projected</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <button
              onClick={() => { setShowWeightDetails(false); setShowWeighIn(true); }}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
            >
              <Plus size={18} /> Log Weigh-In
            </button>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {[
            { id: 'weight', label: 'Weight' },
            { id: 'workouts', label: 'Workouts' },
            { id: 'bench', label: 'Bench 1RM' },
            { id: 'squat', label: 'Squat 1RM' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedChart(tab.id)}
              className="px-3 py-1 rounded-full text-xs whitespace-nowrap"
              style={{
                backgroundColor: selectedChart === tab.id ? COLORS.primary : COLORS.surfaceLight,
                color: selectedChart === tab.id ? COLORS.text : COLORS.textMuted
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ height: 100 }}>
          {chartData[selectedChart]?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData[selectedChart]}>
                <XAxis
                  dataKey="week"
                  tick={{ fill: COLORS.textMuted, fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                  tickFormatter={(val) => `W${val}`}
                />
                <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} width={30} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{
                          backgroundColor: COLORS.surface,
                          border: `1px solid ${COLORS.surfaceLight}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}>
                          <p style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }}>Week {label}</p>
                          <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 'bold' }}>{payload[0].value} {chartLabels[selectedChart]}</p>
                          <p style={{ color: COLORS.textMuted, fontSize: 11 }}>Expected: {payload[1]?.value} {chartLabels[selectedChart]}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: COLORS.primary, r: 5, stroke: COLORS.text, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke={COLORS.textMuted}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm" style={{ color: COLORS.textMuted }}>No data yet - start tracking to see progress!</p>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ backgroundColor: COLORS.primary }}></div>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ backgroundColor: COLORS.textMuted, borderStyle: 'dashed' }}></div>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Expected</span>
            </div>
          </div>
          <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>
            {chartData[selectedChart]?.length > 0
              ? `${chartData[selectedChart][chartData[selectedChart].length - 1]?.value || '-'} ${chartLabels[selectedChart]}`
              : `- ${chartLabels[selectedChart]}`}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Streaks</h3>
        {(() => {
          // Build streak items based on tracking settings
          const allStreakItems = [
            { id: 'workouts', icon: Dumbbell, value: streaks.weeklyWorkouts.weeksCompleted, label: 'weeks', color: COLORS.warning, title: 'Workout Streak', unit: 'workouts', target: 4, enabled: true },
            settings.tracking.calories && { id: 'calories', icon: Flame, value: streaks.calories.daysInRow, label: 'calories', color: COLORS.accent, title: 'Calorie Goal', unit: 'kcal', target: nutritionGoals.calories || 2200, enabled: true },
            settings.tracking.macros && { id: 'protein', icon: Target, value: streaks.protein.daysInRow, label: 'protein', color: COLORS.protein, title: 'Protein Goal', unit: 'g', target: nutritionGoals.protein || 150, enabled: true },
            settings.tracking.water && { id: 'water', icon: Droplets, value: streaks.water.daysInRow, label: 'water', color: COLORS.water, title: 'Water Goal', unit: 'ml', target: nutritionGoals.water || 2500, enabled: true },
            settings.tracking.sleep && { id: 'sleep', icon: Moon, value: streaks.sleep.daysInRow, label: 'sleep', color: COLORS.sleep, title: 'Sleep Goal', unit: 'hrs', target: 8, enabled: true },
            settings.tracking.supplements && { id: 'supplements', icon: Zap, value: streaks.supplements.daysInRow, label: 'supps', color: COLORS.supplements, title: 'Supplements', unit: 'taken', target: 4, enabled: true },
          ].filter(Boolean);

          // Split into rows of 3
          const firstRow = allStreakItems.slice(0, 3);
          const secondRow = allStreakItems.slice(3, 6);

          return (
            <>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {firstRow.map((s, i) => (
                  <button key={s.id} onClick={() => setShowStreakCalendar(s)} className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                    <s.icon size={20} color={s.color} className="mx-auto mb-1" />
                    <p className="text-lg font-bold" style={{ color: COLORS.text }}>{s.value}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>{s.label}</p>
                  </button>
                ))}
              </div>
              {secondRow.length > 0 && (
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(secondRow.length, 3)}, 1fr)` }}>
                  {secondRow.map((s, i) => (
                    <button key={s.id} onClick={() => setShowStreakCalendar(s)} className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                      <s.icon size={20} color={s.color} className="mx-auto mb-1" />
                      <p className="text-lg font-bold" style={{ color: COLORS.text }}>{s.value}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{s.label}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Friend Activity Preview - only if social enabled */}
      {socialEnabled && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: COLORS.text }}>Friend Activity</h3>
            <button 
              onClick={() => setActiveTab('friends')}
              className="text-xs flex items-center gap-1"
              style={{ color: COLORS.primary }}
            >
              See All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {activityFeed.slice(0, 2).map(activity => {
              const friend = friends.find(f => f.id === activity.friendId);
              if (!friend) return null;
              
              return (
                <button 
                  key={activity.id}
                  onClick={() => setActiveTab('friends')}
                  className="w-full p-3 rounded-xl flex items-center gap-3 text-left"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: COLORS.surfaceLight }}
                  >
                    {friend.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: COLORS.text }}>{friend.name.split(' ')[0]}</span>
                      {activity.type === 'workout' && (
                        <span className="text-xs" style={{ color: COLORS.primary }}>completed {activity.workoutName}</span>
                      )}
                      {activity.type === 'pr' && (
                        <span className="text-xs" style={{ color: COLORS.success }}>🏆 new {activity.exercise} PR</span>
                      )}
                      {activity.type === 'milestone' && (
                        <span className="text-xs" style={{ color: COLORS.accent }}>🎉 {activity.milestone}</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>{activity.time}</p>
                  </div>
                  {friend.streak >= 7 && (
                    <div className="flex items-center gap-1">
                      <Flame size={12} color={COLORS.warning} />
                      <span className="text-xs font-bold" style={{ color: COLORS.warning }}>{friend.streak}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Streak Calendar Modal with detailed data */}
      {showStreakCalendar && (() => {
        const streak = showStreakCalendar;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
        const getFirstDayOfMonth = (month, year) => {
          const day = new Date(year, month, 1).getDay();
          return (day + 6) % 7; // Convert to Monday=0 based
        };
        const daysInMonth = getDaysInMonth(streakCalendarMonth, streakCalendarYear);
        const firstDay = getFirstDayOfMonth(streakCalendarMonth, streakCalendarYear);
        
        // Streak data - empty until user logs data
        const streakData = {};
        const [selectedDay, setSelectedDay] = [selectedStreakDay, setSelectedStreakDay];
        const isToday = (day) => day === today.getDate() && streakCalendarMonth === today.getMonth() && streakCalendarYear === today.getFullYear();
        const isFuture = (day) => new Date(streakCalendarYear, streakCalendarMonth, day) > today;
        const changeMonth = (delta) => {
          let newMonth = streakCalendarMonth + delta;
          let newYear = streakCalendarYear;
          if (newMonth > 11) { newMonth = 0; newYear++; }
          if (newMonth < 0) { newMonth = 11; newYear--; }
          setStreakCalendarMonth(newMonth);
          setStreakCalendarYear(newYear);
        };
        
        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) calendarDays.push(null);
        for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
        
        const achievedCount = Object.values(streakData).filter(v => v.achieved).length;
        const missedCount = Object.values(streakData).filter(v => v.achieved === false).length;
        const avgPercent = Object.values(streakData).length > 0 
          ? Math.round(Object.values(streakData).reduce((acc, v) => acc + (v.actual / v.target) * 100, 0) / Object.values(streakData).length)
          : 0;

        return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => { setShowStreakCalendar(null); setStreakCalendarMonth(currentMonth); setStreakCalendarYear(currentYear); setSelectedStreakDay(null); }}><ChevronLeft size={24} color={COLORS.text} /></button>
              <streak.icon size={24} color={streak.color} />
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{streak.title}</h2>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="p-4 rounded-xl mb-4 text-center" style={{ backgroundColor: streak.color + '20' }}>
                <p className="text-4xl font-bold mb-1" style={{ color: streak.color }}>{streak.value}</p>
                <p style={{ color: COLORS.textSecondary }}>{streak.id === 'workouts' ? 'weeks in a row' : 'days in a row'}</p>
              </div>
              
              {/* Calendar */}
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}><ChevronLeft size={20} color={COLORS.text} /></button>
                  <h4 className="font-bold" style={{ color: COLORS.text }}>{monthNames[streakCalendarMonth]} {streakCalendarYear}</h4>
                  <button onClick={() => changeMonth(1)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}><ChevronRight size={20} color={COLORS.text} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (<div key={day} className="text-center text-xs font-semibold py-1" style={{ color: COLORS.textMuted }}>{day}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    const dayData = streakData[day];
                    const future = day && isFuture(day);
                    const todayDate = isToday(day);
                    const percent = dayData ? Math.round((dayData.actual / dayData.target) * 100) : 0;
                    
                    // Format display values with units
                    const formatValue = (val, unit) => {
                      if (unit === 'ml') return (val / 1000).toFixed(1) + 'L';
                      if (unit === 'kcal') return (val / 1000).toFixed(1) + 'k';
                      if (unit === 'g') return val + 'g';
                      if (unit === 'hrs') return (typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val) + 'h';
                      if (unit === 'taken' || unit === 'workouts') return val;
                      return val;
                    };
                    
                    const actualDisplay = dayData ? formatValue(dayData.actual, streak.unit) : '';
                    const targetDisplay = dayData ? formatValue(dayData.target, streak.unit) : '';
                    
                    return (
                      <button key={i} onClick={() => day && dayData && setSelectedDay(selectedDay === day ? null : day)} disabled={!day || future || !dayData}
                        className="rounded-lg flex flex-col items-center justify-center font-medium relative p-1"
                        style={{ 
                          backgroundColor: !day ? 'transparent' : future ? 'transparent' : dayData?.achieved ? COLORS.success + '30' : dayData ? COLORS.error + '20' : 'transparent',
                          border: todayDate ? `2px solid ${streak.color}` : selectedDay === day ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                          color: !day ? 'transparent' : future ? COLORS.textMuted : COLORS.text,
                          opacity: !day ? 0 : future ? 0.4 : 1,
                          minHeight: '70px'
                        }}>
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>{day || ''}</span>
                        {day && !future && dayData && (
                          <>
                            <span className="text-xs font-bold leading-tight" style={{ color: COLORS.text }}>{actualDisplay}/{targetDisplay}</span>
                            <span className="text-xs" style={{ color: dayData.achieved ? COLORS.success : COLORS.error, fontSize: '9px' }}>{percent}% of goal</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.success + '30' }} /><span className="text-xs" style={{ color: COLORS.textMuted }}>≥100%</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.error + '20' }} /><span className="text-xs" style={{ color: COLORS.textMuted }}>&lt;100%</span></div>
                </div>

                {/* Empty state message */}
                {Object.keys(streakData).length === 0 && (
                  <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>
                      No tracking data for this month yet.
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Data will appear here as you log your progress.
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Day Detail */}
              {selectedDay && streakData[selectedDay] && (
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.accent + '15', border: `1px solid ${COLORS.accent}40` }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>{monthNames[streakCalendarMonth]} {selectedDay}, {streakCalendarYear}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Actual</p>
                      <p className="text-xl font-bold" style={{ color: COLORS.text }}>{typeof streakData[selectedDay].actual === 'number' && streakData[selectedDay].actual % 1 !== 0 ? streakData[selectedDay].actual.toFixed(1) : streakData[selectedDay].actual} {streak.unit}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Target</p>
                      <p className="text-xl font-bold" style={{ color: COLORS.textMuted }}>{streakData[selectedDay].target} {streak.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Achieved</p>
                      <p className="text-xl font-bold" style={{ color: streakData[selectedDay].achieved ? COLORS.success : COLORS.error }}>
                        {Math.round((streakData[selectedDay].actual / streakData[selectedDay].target) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.success + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{achievedCount}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Days Hit</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.error + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.error }}>{missedCount}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Days Missed</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: streak.color + '15' }}>
                  <p className="text-2xl font-bold" style={{ color: streak.color }}>{avgPercent}%</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Avg</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => { setShowStreakCalendar(null); setStreakCalendarMonth(currentMonth); setStreakCalendarYear(currentYear); setSelectedStreakDay(null); }} className="w-full py-4 rounded-xl font-semibold" style={{ backgroundColor: streak.color, color: COLORS.text }}>Close</button>
            </div>
          </div>
        );
      })()}

      {/* Today's Progress - only show if any nutrition tracking is enabled */}
      {(settings.tracking.calories || settings.tracking.macros || settings.tracking.water) && (
      <>
      <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Today's Progress</h3>
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
        {[
          settings.tracking.calories && { label: 'Calories', current: caloriesIntake, target: nutritionGoals.calories || 2200, color: COLORS.accent, type: 'meal', trackingKey: 'calories' },
          settings.tracking.macros && { label: 'Protein', current: proteinIntake, target: nutritionGoals.protein || 150, unit: 'g', color: COLORS.protein, type: 'meal', trackingKey: 'macros' },
          settings.tracking.water && { label: 'Water', current: waterIntake, target: nutritionGoals.water || 2500, unit: 'ml', color: COLORS.water, type: 'water', trackingKey: 'water' },
        ].filter(Boolean).map(item => {
          const remaining = item.target - item.current;
          const isComplete = item.current >= item.target;
          return (
            <div key={item.label} className="mb-4 last:mb-0">
              <div 
                className="flex justify-between mb-1 cursor-pointer"
                onClick={() => item.type === 'water' ? setShowWaterEntry(true) : setShowMealEntry(true)}
              >
                <span className="flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
                  {item.label} <Plus size={12} />
                </span>
                <span style={{ color: isComplete ? COLORS.success : COLORS.text }}>
                  {item.current}{item.unit || ''} / {item.target}{item.unit || ''}
                </span>
              </div>
              <div 
                className="h-3 rounded-full overflow-hidden mb-1 cursor-pointer" 
                style={{ backgroundColor: COLORS.surfaceLight }}
                onClick={() => item.type === 'water' ? setShowWaterEntry(true) : setShowMealEntry(true)}
              >
                <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${Math.min((item.current / item.target) * 100, 100)}%` }} />
              </div>
              <p className="text-xs" style={{ color: isComplete ? COLORS.success : item.color }}>
                {isComplete ? '✓ Goal reached!' : `${remaining}${item.unit || ''} to go`}
              </p>
              {item.type === 'water' && (
                <div className="flex gap-2 mt-2">
                  {[
                    { label: '1 Cup', amount: 250 },
                    { label: '500ml', amount: 500 },
                    { label: '1L', amount: 1000 },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      onClick={() => setWaterIntake(prev => Math.min(prev + btn.amount, 5000))}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.water }}
                    >
                      + {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* Meal Entry Modal */}
      {showMealEntry && (
        <MealEntryModal 
          COLORS={COLORS}
          onClose={() => setShowMealEntry(false)}
          onSave={(calories, protein) => {
            setCaloriesIntake(prev => prev + calories);
            setProteinIntake(prev => prev + protein);
            setShowMealEntry(false);
          }}
        />
      )}

      {/* Water Entry Modal */}
      {showWaterEntry && (
        <WaterEntryModal 
          COLORS={COLORS}
          onClose={() => setShowWaterEntry(false)}
          onSave={(amount) => {
            setWaterIntake(prev => Math.min(prev + amount, 10000));
            setShowWaterEntry(false);
          }}
        />
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold" style={{ color: COLORS.text }}>Today's Workout</h3>
          <div className="flex gap-2">
            {!isPaused ? (
              <button onClick={() => setShowPausePlan(true)} className="text-sm px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}>
                <Moon size={14} /> Pause
              </button>
            ) : (
              <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: 'Push A', name: 'Push Day A', focus: CURRENT_WORKOUT.focus, exercises: 5, duration: 60 }); }}
                className="text-sm px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: COLORS.warning, color: COLORS.background }}>
                <Play size={14} /> Resume
              </button>
            )}
            {todayWorkout.type !== 'Rest' && todayWorkout.type !== 'Skipped' && !isPaused && (
              <button onClick={() => setShowReschedule(true)} className="text-sm px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}>
                <Calendar size={14} /> Reschedule
              </button>
            )}
          </div>
        </div>
        
        {/* Paused Card */}
        {isPaused && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.warning}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>PAUSED</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🏖️</span>
              <div>
                <h4 className="text-lg font-bold" style={{ color: COLORS.text }}>Enjoying Your Break</h4>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Plan resumes {pauseReturnDate ? new Date(pauseReturnDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'soon'}
                </p>
              </div>
            </div>
            <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: 'Push A', name: 'Push Day A', focus: CURRENT_WORKOUT.focus, exercises: 5, duration: 60 }); }}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.warning, color: COLORS.background }}>
              Resume Plan Early <Play size={16} />
            </button>
          </div>
        )}
        
        {/* Rest Day Card */}
        {!isPaused && todayWorkout.type === 'Rest' && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.textMuted}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>REST DAY</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">😴</span>
              <div>
                <h4 className="text-lg font-bold" style={{ color: COLORS.text }}>Rest Day</h4>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>Recovery is part of progress</p>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                💡 <strong style={{ color: COLORS.text }}>Tip:</strong> Focus on stretching, mobility work, or light walking today. Your muscles grow during rest!
              </p>
            </div>
          </div>
        )}
        
        {/* Skipped Workout Card */}
        {!isPaused && todayWorkout.type === 'Skipped' && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.error}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: COLORS.error + '20', color: COLORS.error }}>SKIPPED</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">⏭️</span>
              <div>
                <h4 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout Skipped</h4>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>No workout scheduled for today</p>
              </div>
            </div>
            <button onClick={() => { setTodayWorkout({ type: 'Push A', name: 'Push Day A', focus: CURRENT_WORKOUT.focus, exercises: 5, duration: 60 }); setIsRescheduled(false); setOriginalWorkout(null); }} 
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}>
              Undo Skip
            </button>
          </div>
        )}
        
        {/* Workout Day Card - Completed State */}
        {!isPaused && todayWorkout.type !== 'Rest' && todayWorkout.type !== 'Skipped' && todayWorkoutCompleted && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.success}` }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs px-2 py-1 rounded font-semibold flex items-center gap-1"
                  style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                  <Check size={12} /> COMPLETED
                </span>
                <h4 className="text-xl font-bold mt-2" style={{ color: COLORS.text }}>{todayWorkout.name}</h4>
                <p className="text-sm" style={{ color: COLORS.success }}>Great work today!</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                <Check size={24} color={COLORS.success} />
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.success + '10' }}>
              <p className="text-sm text-center" style={{ color: COLORS.success }}>
                You've crushed your workout for today. Rest up and come back stronger tomorrow!
              </p>
            </div>
          </div>
        )}

        {/* Workout Day Card - Not Completed */}
        {!isPaused && todayWorkout.type !== 'Rest' && todayWorkout.type !== 'Skipped' && !todayWorkoutCompleted && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${getWorkoutColor(todayWorkout.type, COLORS)}` }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs px-2 py-1 rounded font-semibold"
                  style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS) + '20', color: getWorkoutColor(todayWorkout.type, COLORS) }}>
                  TODAY
                </span>
                <h4 className="text-xl font-bold mt-2" style={{ color: COLORS.text }}>{todayWorkout.name}</h4>
                <p className="text-sm" style={{ color: getWorkoutColor(todayWorkout.type, COLORS) }}>{todayWorkout.focus}</p>
              </div>
              <button
                onClick={() => setShowWorkoutPreview(CURRENT_WORKOUT.id)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: COLORS.surfaceLight }}
              >
                <Eye size={18} color={COLORS.textMuted} />
              </button>
            </div>

            {/* Time Editor */}
            <button
              onClick={() => setShowTimeEditor(!showTimeEditor)}
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg w-full justify-between"
              style={{ backgroundColor: COLORS.surfaceLight }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} color={COLORS.textSecondary} />
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {workoutTime} min • {Math.max(2, Math.floor(workoutTime / 12))} exercises
                </span>
              </div>
              <ChevronDown size={16} color={COLORS.textMuted} style={{ transform: showTimeEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showTimeEditor && (() => {
              const exerciseCount = Math.max(2, Math.floor(workoutTime / 12));
              const exercisesForTime = CURRENT_WORKOUT.exercises.slice(0, exerciseCount);

              return (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>How much time do you have?</p>
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {[20, 30, 45, 60, 75, 90].map(time => (
                      <button
                        key={time}
                        onClick={() => setWorkoutTime(time)}
                        className="py-2 rounded-lg text-sm font-semibold"
                        style={{
                          backgroundColor: workoutTime === time ? COLORS.primary : COLORS.surface,
                          color: workoutTime === time ? COLORS.text : COLORS.textMuted
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {/* Exercise Overview */}
                  <div className="border-t pt-3" style={{ borderColor: COLORS.surfaceLight }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>
                      EXERCISES FOR {workoutTime} MIN ({exercisesForTime.length})
                    </p>
                    <div className="space-y-2">
                      {exercisesForTime.map((exercise, i) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: COLORS.surface }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS) + '20', color: getWorkoutColor(todayWorkout.type, COLORS) }}
                            >
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: COLORS.text }}>{exercise.name}</p>
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.muscleGroup}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{exercise.sets}×{exercise.targetReps}</p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {CURRENT_WORKOUT.exercises.length > exerciseCount && (
                      <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                        +{CURRENT_WORKOUT.exercises.length - exerciseCount} more exercises with more time
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            <button onClick={() => setShowActiveWorkout(true)} className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS), color: COLORS.text }}>
              Start Workout <Play size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Sleep Section */}
      {settings.tracking.sleep && (
      <>
      <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Sleep</h3>
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
        {/* Last Night */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>LAST NIGHT</p>
          {lastNightConfirmed && (
            <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
              <Check size={12} /> Confirmed
            </span>
          )}
        </div>
        
        {!lastNightConfirmed ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.sleep }}>
                    <Clock size={12} color="#fff" />
                  </div>
                  <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Went to bed</p>
                </div>
                <div className="flex items-center gap-1">
                  <input 
                    ref={sleepEditRefs.lastBedH}
                    type="text" 
                    inputMode="numeric"
                    defaultValue={lastNightBedTime.split(':')[0]}
                    onBlur={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      const h = Math.min(23, parseInt(val) || 0);
                      e.target.value = h.toString().padStart(2, '0');
                      setLastNightBedTime(prev => `${h.toString().padStart(2, '0')}:${prev.split(':')[1]}`);
                    }}
                    className="w-14 text-2xl font-bold text-center rounded-lg"
                    style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
                  />
                  <span className="text-2xl font-bold" style={{ color: COLORS.text }}>:</span>
                  <input 
                    ref={sleepEditRefs.lastBedM}
                    type="text"
                    inputMode="numeric"
                    defaultValue={lastNightBedTime.split(':')[1]}
                    onBlur={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      const m = Math.min(59, parseInt(val) || 0);
                      e.target.value = m.toString().padStart(2, '0');
                      setLastNightBedTime(prev => `${prev.split(':')[0]}:${m.toString().padStart(2, '0')}`);
                    }}
                    className="w-14 text-2xl font-bold text-center rounded-lg"
                    style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.sleep }}>
                    <Clock size={12} color="#fff" />
                  </div>
                  <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Woke up</p>
                </div>
                <div className="flex items-center gap-1">
                  <input 
                    ref={sleepEditRefs.lastWakeH}
                    type="text" 
                    inputMode="numeric"
                    defaultValue={lastNightWakeTime.split(':')[0]}
                    onBlur={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      const h = Math.min(23, parseInt(val) || 0);
                      e.target.value = h.toString().padStart(2, '0');
                      setLastNightWakeTime(prev => `${h.toString().padStart(2, '0')}:${prev.split(':')[1]}`);
                    }}
                    className="w-14 text-2xl font-bold text-center rounded-lg"
                    style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
                  />
                  <span className="text-2xl font-bold" style={{ color: COLORS.text }}>:</span>
                  <input 
                    ref={sleepEditRefs.lastWakeM}
                    type="text"
                    inputMode="numeric"
                    defaultValue={lastNightWakeTime.split(':')[1]}
                    onBlur={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      const m = Math.min(59, parseInt(val) || 0);
                      e.target.value = m.toString().padStart(2, '0');
                      setLastNightWakeTime(prev => `${prev.split(':')[0]}:${m.toString().padStart(2, '0')}`);
                    }}
                    className="w-14 text-2xl font-bold text-center rounded-lg"
                    style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
                  />
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg mb-3 flex items-center justify-between" style={{ backgroundColor: COLORS.sleep + '15' }}>
              <span className="text-sm" style={{ color: COLORS.textMuted }}>Total sleep</span>
              {(() => {
                const [bedH, bedM] = lastNightBedTime.split(':').map(Number);
                const [wakeH, wakeM] = lastNightWakeTime.split(':').map(Number);
                let hours = wakeH - bedH;
                let mins = wakeM - bedM;
                if (hours < 0) hours += 24;
                if (mins < 0) { mins += 60; hours--; }
                const total = hours + mins / 60;
                return (
                  <span className="font-bold text-lg" style={{ color: total >= 8 ? COLORS.success : total >= 6 ? COLORS.warning : COLORS.error }}>
                    {hours}h {mins}m {total >= 8 ? '✓' : total < 6 ? '⚠️' : ''}
                  </span>
                );
              })()}
            </div>
            <button
              onClick={async () => {
                // Calculate sleep hours
                const [bedH, bedM] = lastNightBedTime.split(':').map(Number);
                const [wakeH, wakeM] = lastNightWakeTime.split(':').map(Number);
                let hours = wakeH - bedH;
                let mins = wakeM - bedM;
                if (hours < 0) hours += 24;
                if (mins < 0) { mins += 60; hours--; }
                const totalHours = hours + mins / 60;

                // Save to Supabase
                if (user?.id) {
                  try {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    await sleepService.logSleep(user.id, {
                      date: yesterday.toISOString().split('T')[0],
                      bedTime: lastNightBedTime,
                      wakeTime: lastNightWakeTime,
                      hoursSlept: parseFloat(totalHours.toFixed(2)),
                    });
                  } catch (err) {
                    console.error('Error logging sleep:', err);
                  }
                }

                setLastNightConfirmed(true);
              }}
              className="w-full py-3 rounded-xl font-semibold mb-3"
              style={{ backgroundColor: COLORS.sleep, color: '#fff' }}
            >
              Confirm Last Night's Sleep
            </button>
          </>
        ) : (
          <div className="p-3 rounded-lg mb-3 flex items-center justify-between" style={{ backgroundColor: COLORS.sleep + '15' }}>
            <div>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>Slept {lastNightBedTime} → {lastNightWakeTime}</p>
              {(() => {
                const [bedH, bedM] = lastNightBedTime.split(':').map(Number);
                const [wakeH, wakeM] = lastNightWakeTime.split(':').map(Number);
                let hours = wakeH - bedH;
                let mins = wakeM - bedM;
                if (hours < 0) hours += 24;
                if (mins < 0) { mins += 60; hours--; }
                const total = hours + mins / 60;
                return (
                  <p className="font-bold text-lg" style={{ color: total >= 8 ? COLORS.success : total >= 6 ? COLORS.warning : COLORS.error }}>
                    {hours}h {mins}m {total >= 8 ? '✓ Goal!' : ''}
                  </p>
                );
              })()}
            </div>
            <button 
              onClick={() => setLastNightConfirmed(false)}
              className="px-3 py-1 rounded-lg text-sm"
              style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Tonight */}
        <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>TONIGHT'S PLAN</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.sleep + '20' }}>
            <Moon size={20} color={COLORS.sleep} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Recommended</p>
            <p className="text-xl font-bold" style={{ color: COLORS.text }}>8 hours</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.sleep }}>
                <Clock size={12} color="#fff" />
              </div>
              <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Bed Time</p>
            </div>
            <div className="flex items-center gap-1">
              <input 
                ref={sleepEditRefs.bedH}
                type="text" 
                inputMode="numeric"
                defaultValue={bedTime.split(':')[0]}
                onBlur={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  const h = Math.min(23, parseInt(val) || 0);
                  e.target.value = h.toString().padStart(2, '0');
                  setBedTime(prev => `${h.toString().padStart(2, '0')}:${prev.split(':')[1]}`);
                }}
                className="w-14 text-2xl font-bold text-center rounded-lg"
                style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
              />
              <span className="text-2xl font-bold" style={{ color: COLORS.text }}>:</span>
              <input 
                ref={sleepEditRefs.bedM}
                type="text"
                inputMode="numeric"
                defaultValue={bedTime.split(':')[1]}
                onBlur={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  const m = Math.min(59, parseInt(val) || 0);
                  e.target.value = m.toString().padStart(2, '0');
                  setBedTime(prev => `${prev.split(':')[0]}:${m.toString().padStart(2, '0')}`);
                }}
                className="w-14 text-2xl font-bold text-center rounded-lg"
                style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
              />
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.sleep }}>
                <Clock size={12} color="#fff" />
              </div>
              <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Wake Time</p>
            </div>
            <div className="flex items-center gap-1">
              <input 
                ref={sleepEditRefs.wakeH}
                type="text" 
                inputMode="numeric"
                defaultValue={wakeTime.split(':')[0]}
                onBlur={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  const h = Math.min(23, parseInt(val) || 0);
                  e.target.value = h.toString().padStart(2, '0');
                  setWakeTime(prev => `${h.toString().padStart(2, '0')}:${prev.split(':')[1]}`);
                }}
                className="w-14 text-2xl font-bold text-center rounded-lg"
                style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
              />
              <span className="text-2xl font-bold" style={{ color: COLORS.text }}>:</span>
              <input 
                ref={sleepEditRefs.wakeM}
                type="text"
                inputMode="numeric"
                defaultValue={wakeTime.split(':')[1]}
                onBlur={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  const m = Math.min(59, parseInt(val) || 0);
                  e.target.value = m.toString().padStart(2, '0');
                  setWakeTime(prev => `${prev.split(':')[0]}:${m.toString().padStart(2, '0')}`);
                }}
                className="w-14 text-2xl font-bold text-center rounded-lg"
                style={{ color: COLORS.text, backgroundColor: COLORS.surface, border: 'none', padding: '8px 4px' }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
          <span className="text-sm" style={{ color: COLORS.textMuted }}>Planned sleep</span>
          {(() => {
            const [bedH, bedM] = bedTime.split(':').map(Number);
            const [wakeH, wakeM] = wakeTime.split(':').map(Number);
            let hours = wakeH - bedH;
            let mins = wakeM - bedM;
            if (hours < 0) hours += 24;
            if (mins < 0) { mins += 60; hours--; }
            const total = hours + mins / 60;
            return (
              <span className="font-semibold" style={{ color: total >= 7 ? COLORS.success : total >= 6 ? COLORS.warning : COLORS.error }}>
                {hours}h {mins}m {total >= 8 ? '✓' : total < 6 ? '⚠️' : ''}
              </span>
            );
          })()}
        </div>
        
        {/* Sleep Weekly Chart */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>WEEKLY AVERAGE</p>
          <div style={{ height: 80 }}>
            {sleepChartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepChartData}>
                  <XAxis
                    dataKey="week"
                    tick={{ fill: COLORS.textMuted, fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                    tickFormatter={(val) => `W${val}`}
                  />
                  <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} width={25} domain={[5, 10]} tickFormatter={(val) => `${val}h`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{
                            backgroundColor: COLORS.surface,
                            border: `1px solid ${COLORS.surfaceLight}`,
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}>
                            <p style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }}>Week {label}</p>
                            <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 'bold' }}>{payload[0].value} hrs avg</p>
                            <p style={{ color: COLORS.textMuted, fontSize: 11 }}>Goal: {payload[1]?.value} hrs</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.sleep}
                    strokeWidth={2}
                    dot={{ fill: COLORS.sleep, r: 2, strokeWidth: 0 }}
                    activeDot={{ fill: COLORS.sleep, r: 4, stroke: COLORS.text, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="goal"
                    stroke={COLORS.textMuted}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Log sleep to see trends</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ backgroundColor: COLORS.sleep }}></div>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Avg Sleep</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ backgroundColor: COLORS.success, borderStyle: 'dashed' }}></div>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Goal (8h)</span>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Supplements Tracker */}
      {settings.tracking.supplements && (
      <>
      <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Supplements</h3>
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
        <div className="space-y-2 mb-3">
          {supplements.map(supp => (
            <div 
              key={supp.id} 
              className="w-full p-3 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: supp.taken ? COLORS.supplements + '15' : COLORS.surfaceLight }}>
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={(e) => { e.preventDefault(); setSupplements(prev => prev.map(s => s.id === supp.id ? {...s, taken: !s.taken} : s)); }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: supp.taken ? COLORS.supplements : COLORS.surfaceLight, border: supp.taken ? 'none' : `2px solid ${COLORS.textMuted}` }}>
                  {supp.taken && <Check size={14} color={COLORS.background} />}
                </div>
                <div className="text-left">
                  <p className="font-medium" style={{ color: COLORS.text }}>{supp.name}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{supp.dosage}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {supp.taken && <span className="text-xs" style={{ color: COLORS.supplements }}>Taken</span>}
                <button 
                  onClick={(e) => { e.stopPropagation(); setSupplements(prev => prev.filter(s => s.id !== supp.id)); }}
                  className="p-1 rounded-full"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <X size={14} color={COLORS.textMuted} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {showAddSupplement ? (
          <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Supplement name" value={newSupplementName} onChange={e => setNewSupplementName(e.target.value)}
                className="flex-1 p-2 rounded text-sm" style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none' }} />
              <input type="text" placeholder="Dosage" value={newSupplementDosage} onChange={e => setNewSupplementDosage(e.target.value)}
                className="w-24 p-2 rounded text-sm" style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none' }} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={(e) => { e.preventDefault(); setShowAddSupplement(false); setNewSupplementName(''); setNewSupplementDosage(''); }}
                className="flex-1 py-2 rounded text-sm" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted }}>Cancel</button>
              <button type="button" onClick={(e) => {
                e.preventDefault();
                if (newSupplementName) {
                  setSupplements(prev => [...prev, { id: Date.now().toString(), name: newSupplementName, dosage: newSupplementDosage || 'As needed', taken: false }]);
                  setShowAddSupplement(false); setNewSupplementName(''); setNewSupplementDosage('');
                }
              }} className="flex-1 py-2 rounded text-sm font-semibold" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Add</button>
            </div>
          </div>
        ) : (
          <div onClick={(e) => { e.preventDefault(); setShowAddSupplement(true); }} className="w-full p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: COLORS.surfaceLight, border: `1px dashed ${COLORS.textMuted}` }}>
            <Plus size={16} color={COLORS.textMuted} /><span style={{ color: COLORS.textMuted }}>Add Supplement</span>
          </div>
        )}
        <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: COLORS.surfaceLight }}>
          <span className="text-sm" style={{ color: COLORS.textMuted }}>{supplements.filter(s => s.taken).length}/{supplements.length} taken</span>
          <div className="h-2 w-24 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
            <div className="h-full rounded-full" style={{ backgroundColor: COLORS.supplements, width: `${(supplements.filter(s => s.taken).length / supplements.length) * 100}%` }} />
          </div>
        </div>
      </div>
      </>
      )}

      {showActiveWorkout && <ActiveWorkoutScreen onClose={() => setShowActiveWorkout(false)} onComplete={completeTodayWorkout} COLORS={COLORS} availableTime={workoutTime} userGoal={userData.goal || 'build_muscle'} userId={user?.id} workoutName={todayWorkout?.name || 'Workout'} />}
    </div>
  );
  };

  // Main Screen with tabs
  const MainScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'workouts' && (
          <div className="p-4 h-full overflow-auto">
            {/* Scrollable Week Schedule */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <button 
                  onClick={() => setScheduleWeekOffset(prev => prev - 1)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <ChevronLeft size={18} color={COLORS.text} />
                </button>
                <h3 className="font-semibold" style={{ color: COLORS.text }}>{getWeekHeaderText(scheduleWeekOffset)}</h3>
                <button 
                  onClick={() => setScheduleWeekOffset(prev => prev + 1)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <ChevronRight size={18} color={COLORS.text} />
                </button>
              </div>
              <div className="flex gap-2">
                {(() => {
                  // Drag handlers for week schedule
                  const handleDragStart = (day, isBeforeProgram) => {
                    if (day.isPast || !day.workout || isBeforeProgram) return;
                    setDraggedDay(day);
                  };
                  const handleDragOver = (day) => {
                    if (!draggedDay || day.dateKey === draggedDay.dateKey || day.isPast) return;
                    setDragOverDay(day);
                  };
                  const handleDragEnd = () => {
                    if (draggedDay && dragOverDay && draggedDay.dateKey !== dragOverDay.dateKey) {
                      swapWorkoutDays(draggedDay.dateKey, dragOverDay.dateKey);
                    }
                    setDraggedDay(null);
                    setDragOverDay(null);
                  };

                  return currentWeekDates.map((day, i) => {
                    const isBeforeProgram = overviewStats.programStartDate && day.dateKey < overviewStats.programStartDate;
                    const isMissed = day.isPast && day.workout && !day.completed && !isBeforeProgram;
                    const isDragging = draggedDay?.dateKey === day.dateKey;
                    const isDragOver = dragOverDay?.dateKey === day.dateKey;
                    const canDrag = !day.isPast && day.workout && !isBeforeProgram;

                    return (
                      <button
                        key={day.dateKey}
                        onClick={() => !day.isPast && !draggedDay && setEditingScheduleDay(day)}
                        onPointerDown={() => handleDragStart(day, isBeforeProgram)}
                        onPointerEnter={() => draggedDay && handleDragOver(day)}
                        onPointerUp={handleDragEnd}
                        onPointerLeave={() => setDragOverDay(null)}
                        onPointerCancel={handleDragEnd}
                        className="flex-1 p-2 rounded-xl text-center"
                        style={{
                          backgroundColor: day.isToday ? COLORS.primary + '20' : COLORS.surface,
                          border: day.isToday ? `2px solid ${COLORS.primary}` : isDragOver ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                          opacity: (day.isPast && !day.completed && !isBeforeProgram) ? 0.6 : 1,
                          transform: isDragging ? 'scale(1.08)' : 'scale(1)',
                          boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                          cursor: canDrag ? 'grab' : 'default',
                          transition: 'transform 0.15s, box-shadow 0.15s, border 0.15s',
                          touchAction: 'none',
                          zIndex: isDragging ? 10 : 1,
                        }}
                      >
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{day.day}</p>
                      <p className="font-bold" style={{ color: day.isToday ? COLORS.primary : COLORS.text }}>{day.date}</p>
                      {isBeforeProgram ? (
                        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>-</p>
                      ) : isMissed ? (
                        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Missed</p>
                      ) : day.workout ? (
                        <p className="text-xs mt-1 truncate" style={{ color: getWorkoutColor(day.workout.name, COLORS) }}>
                          {day.workout.name.split(' ')[0]}
                        </p>
                      ) : (
                        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Rest</p>
                      )}
                      {day.completed && (
                        <Check size={10} color={COLORS.success} className="mx-auto" />
                      )}
                    </button>
                    );
                  });
                })()}
              </div>
              {scheduleWeekOffset !== 0 && (
                <button 
                  onClick={() => setScheduleWeekOffset(0)}
                  className="w-full mt-2 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.primary }}
                >
                  Back to This Week
                </button>
              )}
              <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                Tap any day to edit • Swipe weeks with arrows
              </p>
            </div>

            {/* Today's Workout Card */}
            {scheduleWeekOffset === 0 && (
              <>
                {/* Paused Card */}
                {isPaused && (
                  <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.warning}` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>PAUSED</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">🏖️</span>
                      <div>
                        <h4 className="text-lg font-bold" style={{ color: COLORS.text }}>Enjoying Your Break</h4>
                        <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                          Plan resumes {pauseReturnDate ? new Date(pauseReturnDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'soon'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: 'Push A', name: 'Push Day A', focus: CURRENT_WORKOUT.focus, exercises: 5, duration: 60 }); }}
                      className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                      style={{ backgroundColor: COLORS.warning, color: COLORS.background }}>
                      Resume Plan Early <Play size={16} />
                    </button>
                  </div>
                )}

                {/* Rescheduled Banner */}
                {isRescheduled && originalWorkout && !isPaused && (
                  <div className="p-3 rounded-xl mb-4 flex items-center justify-between" style={{ backgroundColor: COLORS.primary + '15', border: `1px solid ${COLORS.primary}40` }}>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} color={COLORS.primary} />
                      <p className="text-sm" style={{ color: COLORS.primary }}>
                        <strong>{originalWorkout}</strong> rescheduled
                      </p>
                    </div>
                    <button 
                      onClick={() => { setIsRescheduled(false); setOriginalWorkout(null); }}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                    >
                      Undo
                    </button>
                  </div>
                )}

                {/* Active Workout Card - Completed */}
                {todayWorkout.type !== 'Rest' && !isPaused && todayWorkoutCompleted && (
                  <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.success}` }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs px-2 py-1 rounded font-semibold flex items-center gap-1"
                          style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                          <Check size={12} /> COMPLETED
                        </span>
                        <h4 className="text-xl font-bold mt-2" style={{ color: COLORS.text }}>{todayWorkout.name}</h4>
                        <p className="text-sm" style={{ color: COLORS.success }}>Great work today!</p>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                        <Check size={24} color={COLORS.success} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.success + '10' }}>
                      <p className="text-sm text-center" style={{ color: COLORS.success }}>
                        You've crushed your workout for today. Rest up and come back stronger tomorrow!
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Workout Card - Not Completed */}
                {todayWorkout.type !== 'Rest' && !isPaused && !todayWorkoutCompleted && (
                  <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${getWorkoutColor(todayWorkout.type, COLORS)}` }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs px-2 py-1 rounded font-semibold"
                          style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS) + '20', color: getWorkoutColor(todayWorkout.type, COLORS) }}>
                          TODAY
                        </span>
                        <h4 className="text-xl font-bold mt-2" style={{ color: COLORS.text }}>{todayWorkout.name}</h4>
                        <p className="text-sm" style={{ color: getWorkoutColor(todayWorkout.type, COLORS) }}>{todayWorkout.focus}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowPausePlan(true)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }} title="Pause Plan">
                          <Moon size={16} color={COLORS.textMuted} />
                        </button>
                        <button onClick={() => setShowReschedule(true)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }} title="Reschedule">
                          <Calendar size={16} color={COLORS.textMuted} />
                        </button>
                        <button
                          onClick={() => setShowWorkoutPreview(CURRENT_WORKOUT.id)}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: COLORS.surfaceLight }}
                          title="Preview"
                        >
                          <Eye size={16} color={COLORS.textMuted} />
                        </button>
                      </div>
                    </div>

                {/* Time Editor */}
                <button
                  onClick={() => setShowWorkoutTimeEditor(!showWorkoutTimeEditor)}
                  className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg w-full justify-between"
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} color={COLORS.textSecondary} />
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                      {workoutTime} min • {Math.max(2, Math.floor(workoutTime / 12))} exercises
                    </span>
                  </div>
                  <ChevronDown size={16} color={COLORS.textMuted} style={{ transform: showWorkoutTimeEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {showWorkoutTimeEditor && (() => {
                  const exerciseCount = Math.max(2, Math.floor(workoutTime / 12));
                  const exercisesForTime = CURRENT_WORKOUT.exercises.slice(0, exerciseCount);

                  return (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                      <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>How much time do you have?</p>
                      <div className="grid grid-cols-6 gap-2 mb-3">
                        {[20, 30, 45, 60, 75, 90].map(time => (
                          <button
                            key={time}
                            onClick={() => setWorkoutTime(time)}
                            className="py-2 rounded-lg text-sm font-semibold"
                            style={{
                              backgroundColor: workoutTime === time ? COLORS.primary : COLORS.surface,
                              color: workoutTime === time ? COLORS.text : COLORS.textMuted
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>

                      {/* Exercise Overview */}
                      <div className="border-t pt-3" style={{ borderColor: COLORS.surfaceLight }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>
                          EXERCISES FOR {workoutTime} MIN ({exercisesForTime.length})
                        </p>
                        <div className="space-y-2">
                          {exercisesForTime.map((exercise, i) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between p-2 rounded-lg"
                              style={{ backgroundColor: COLORS.surface }}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS) + '20', color: getWorkoutColor(todayWorkout.type, COLORS) }}
                                >
                                  {i + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium" style={{ color: COLORS.text }}>{exercise.name}</p>
                                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.muscleGroup}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{exercise.sets}×{exercise.targetReps}</p>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {CURRENT_WORKOUT.exercises.length > exerciseCount && (
                          <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                            +{CURRENT_WORKOUT.exercises.length - exerciseCount} more exercises with more time
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={() => setShowActiveWorkout(true)}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS), color: COLORS.text }}
                >
                  Start Workout <Play size={18} />
                </button>
              </div>
            )}

                {/* Rest Day Card */}
                {!isPaused && todayWorkout.type === 'Rest' && (
                  <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface, borderLeft: `4px solid ${COLORS.textMuted}` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>REST DAY</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowPausePlan(true)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }} title="Pause Plan">
                          <Moon size={16} color={COLORS.textMuted} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">😴</span>
                      <div>
                        <h4 className="text-lg font-bold" style={{ color: COLORS.text }}>Recovery Day</h4>
                        <p className="text-sm" style={{ color: COLORS.textSecondary }}>Rest is essential for muscle growth</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>💡 <strong style={{ color: COLORS.text }}>Tip:</strong> Stay active with light stretching or a walk. Stay hydrated!</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Current Program */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>CURRENT PROGRAM</p>
                  <h4 className="font-bold" style={{ color: COLORS.text }}>{currentProgram.name}</h4>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>{currentProgram.description}</p>
                </div>
                <button 
                  onClick={() => setShowProgramSelector(true)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                >
                  Change
                </button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS.primary, width: `${(currentProgram.currentWeek / currentProgram.totalWeeks) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  Week {currentProgram.currentWeek}/{currentProgram.totalWeeks}
                </span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
                <span>{currentProgram.daysPerWeek} days/week</span>
                <button 
                  onClick={() => setShowFullSchedule(true)}
                  className="flex items-center gap-1"
                  style={{ color: COLORS.primary }}
                >
                  <Calendar size={12} /> View Full Schedule
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => setShowExerciseLibrary(true)}
                className="p-4 rounded-xl flex flex-col items-center gap-2"
                style={{ backgroundColor: COLORS.surface }}
              >
                <Book size={24} color={COLORS.accent} />
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Exercise Library</span>
              </button>
              <button 
                onClick={() => setShowWorkoutHistory(true)}
                className="p-4 rounded-xl flex flex-col items-center gap-2"
                style={{ backgroundColor: COLORS.surface }}
              >
                <History size={24} color={COLORS.warning} />
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Workout History</span>
              </button>
              <button 
                onClick={() => setShowPersonalRecords(true)}
                className="p-4 rounded-xl flex flex-col items-center gap-2"
                style={{ backgroundColor: COLORS.surface }}
              >
                <Trophy size={24} color={COLORS.success} />
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Personal Records</span>
              </button>
              <button 
                onClick={() => setShowCustomWorkout(true)}
                className="p-4 rounded-xl flex flex-col items-center gap-2"
                style={{ backgroundColor: COLORS.surface }}
              >
                <Edit3 size={24} color={COLORS.primary} />
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Custom Workout</span>
              </button>
            </div>

            {/* Upcoming Workouts */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Upcoming</h3>
              <div className="space-y-2">
                {upcomingWorkouts.map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => setShowWorkoutPreview(item.workout.id)}
                    className="w-full p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-1 h-10 rounded-full"
                        style={{ backgroundColor: getWorkoutColor(item.workout.name, COLORS) }}
                      />
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{item.workout.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{item.date} • {item.workout.exercises.length} exercises</p>
                      </div>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Recent Activity</h3>
              <div className="space-y-2">
                {workoutHistory.slice(0, 3).map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setShowWorkoutSummary(item)}
                    className="w-full p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                        <Check size={18} color={COLORS.success} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{item.workout.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{item.date} • {item.duration} min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{(item.totalVolume / 1000).toFixed(1)}k kg</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>volume</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Records Preview */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold" style={{ color: COLORS.text }}>Personal Records</h3>
                <button 
                  onClick={() => setShowPersonalRecords(true)}
                  className="text-xs"
                  style={{ color: COLORS.primary }}
                >
                  View All
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {personalRecords.slice(0, 4).map((pr, i) => (
                  <button 
                    key={i}
                    onClick={() => setShowExerciseDetail(pr.exercise)}
                    className="flex-shrink-0 p-3 rounded-xl text-center"
                    style={{ backgroundColor: COLORS.surface, minWidth: '120px' }}
                  >
                    <Trophy size={16} color={COLORS.warning} className="mx-auto mb-1" />
                    <p className="text-lg font-bold" style={{ color: COLORS.text }}>{pr.weight}kg</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>× {pr.reps}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: COLORS.textSecondary }}>{pr.exercise.split(' ')[0]}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'nutrition' && (
          <div className="p-4 h-full overflow-auto">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'meals', label: 'Meals' },
                { id: 'supplements', label: 'Supplements' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setNutritionTab(tab.id)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ 
                    backgroundColor: nutritionTab === tab.id ? COLORS.primary : COLORS.surface,
                    color: nutritionTab === tab.id ? COLORS.text : COLORS.textMuted
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {nutritionTab === 'overview' && (
              <>
                {/* Goal Overview Banner */}
                <div className="p-4 rounded-xl mb-4" style={{ 
                  backgroundColor: userData.goal === 'lose_fat' ? COLORS.error + '15' : 
                                   userData.goal === 'build_muscle' ? COLORS.success + '15' : 
                                   userData.goal === 'strength' ? COLORS.primary + '15' : COLORS.accent + '15',
                  border: `1px solid ${userData.goal === 'lose_fat' ? COLORS.error + '40' : 
                                       userData.goal === 'build_muscle' ? COLORS.success + '40' : 
                                       userData.goal === 'strength' ? COLORS.primary + '40' : COLORS.accent + '40'}`
                }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ 
                      backgroundColor: userData.goal === 'lose_fat' ? COLORS.error + '30' : 
                                       userData.goal === 'build_muscle' ? COLORS.success + '30' : 
                                       userData.goal === 'strength' ? COLORS.primary + '30' : COLORS.accent + '30'
                    }}>
                      {userData.goal === 'lose_fat' ? '🔥' : 
                       userData.goal === 'build_muscle' ? '💪' : 
                       userData.goal === 'strength' ? '🏋️' : '❤️'}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: COLORS.text }}>
                        {userData.goal === 'lose_fat' ? 'Fat Loss Mode' : 
                         userData.goal === 'build_muscle' ? 'Muscle Building Mode' : 
                         userData.goal === 'strength' ? 'Strength Building Mode' : 'General Fitness'}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        {userData.goal === 'lose_fat' ? 'Stay in a calorie deficit to lose fat' : 
                         userData.goal === 'build_muscle' ? 'Eat in a surplus to support muscle growth' : 
                         userData.goal === 'strength' ? 'Fuel your training with adequate calories' : 'Maintain balanced nutrition'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.background + '50' }}>
                    <div>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Daily Target</p>
                      <p className="text-lg font-bold" style={{ color: COLORS.text }}>{nutritionGoals.calories} kcal</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Remaining</p>
                      <p className="text-lg font-bold" style={{ 
                        color: (nutritionGoals.calories - caloriesIntake) < 0 
                          ? (userData.goal === 'lose_fat' ? COLORS.error : COLORS.success)
                          : (userData.goal === 'lose_fat' ? COLORS.success : COLORS.warning)
                      }}>
                        {nutritionGoals.calories - caloriesIntake} kcal
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full" style={{ 
                      backgroundColor: userData.goal === 'lose_fat' 
                        ? (caloriesIntake <= nutritionGoals.calories ? COLORS.success + '30' : COLORS.error + '30')
                        : (caloriesIntake >= nutritionGoals.calories * 0.9 ? COLORS.success + '30' : COLORS.warning + '30')
                    }}>
                      <p className="text-xs font-semibold" style={{ 
                        color: userData.goal === 'lose_fat' 
                          ? (caloriesIntake <= nutritionGoals.calories ? COLORS.success : COLORS.error)
                          : (caloriesIntake >= nutritionGoals.calories * 0.9 ? COLORS.success : COLORS.warning)
                      }}>
                        {userData.goal === 'lose_fat' 
                          ? (caloriesIntake <= nutritionGoals.calories ? '✓ On Track' : '⚠️ Over')
                          : (caloriesIntake >= nutritionGoals.calories * 0.9 ? '✓ On Track' : '⚠️ Eat More')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Today's Macros */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Today's Nutrition</h3>

                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setShowMealEntry(true)}
                      className="p-3 rounded-xl flex items-center gap-3"
                      style={{ backgroundColor: COLORS.surface }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.accent + '20' }}>
                        <Utensils size={18} color={COLORS.accent} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm" style={{ color: COLORS.text }}>Add Meal</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowWaterEntry(true)}
                      className="p-3 rounded-xl flex items-center gap-3"
                      style={{ backgroundColor: COLORS.surface }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.water + '20' }}>
                        <Droplets size={18} color={COLORS.water} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm" style={{ color: COLORS.text }}>Add Water</p>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Calories Circle */}
                    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex items-center justify-center mb-2">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke={COLORS.surfaceLight} strokeWidth="8" fill="none" />
                            <circle 
                              cx="48" cy="48" r="40" 
                              stroke={COLORS.accent} 
                              strokeWidth="8" 
                              fill="none"
                              strokeDasharray={`${(caloriesIntake / nutritionGoals.calories) * 251} 251`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Flame size={16} color={COLORS.accent} />
                            <span className="text-lg font-bold" style={{ color: COLORS.text }}>{caloriesIntake}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-sm font-semibold" style={{ color: COLORS.text }}>Calories</p>
                      <p className="text-center text-xs" style={{ color: COLORS.textMuted }}>{nutritionGoals.calories - caloriesIntake} remaining</p>
                    </div>

                    {/* Water Circle */}
                    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex items-center justify-center mb-2">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke={COLORS.surfaceLight} strokeWidth="8" fill="none" />
                            <circle
                              cx="48" cy="48" r="40"
                              stroke={COLORS.water}
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(waterIntake / nutritionGoals.water) * 251} 251`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Droplets size={16} color={COLORS.water} />
                            <span className="text-lg font-bold" style={{ color: COLORS.text }}>{(waterIntake / 1000).toFixed(1)}L</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-sm font-semibold" style={{ color: COLORS.text }}>Water</p>
                      <p className="text-center text-xs" style={{ color: COLORS.textMuted }}>{((nutritionGoals.water - waterIntake) / 1000).toFixed(1)}L remaining</p>
                    </div>
                  </div>
                </div>

                {/* Macro Breakdown */}
                <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Macros</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Protein', current: proteinIntake, target: nutritionGoals.protein, unit: 'g', color: COLORS.primary },
                      { name: 'Carbs', current: carbsIntake, target: nutritionGoals.carbs, unit: 'g', color: COLORS.warning },
                      { name: 'Fats', current: fatsIntake, target: nutritionGoals.fats, unit: 'g', color: COLORS.sleep },
                    ].map(macro => (
                      <div key={macro.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm" style={{ color: COLORS.textSecondary }}>{macro.name}</span>
                          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
                            {macro.current}{macro.unit} / {macro.target}{macro.unit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              backgroundColor: macro.color, 
                              width: `${Math.min(100, (macro.current / macro.target) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Calorie Chart */}
                <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Weekly Calorie Average</h4>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyNutrition}>
                        <XAxis dataKey="week" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 200', 'dataMax + 200']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: COLORS.surface, border: 'none', borderRadius: 8 }}
                          labelStyle={{ color: COLORS.text }}
                          formatter={(value, name) => [value + ' kcal', name === 'calories' ? 'Actual' : 'Goal']}
                        />
                        <Line type="monotone" dataKey="goal" stroke={COLORS.textMuted} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="calories" stroke={COLORS.accent} strokeWidth={2} dot={{ fill: COLORS.accent, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.accent }} />
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Actual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.textMuted, opacity: 0.5 }} />
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Goal ({nutritionGoals.calories})</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Water Chart */}
                <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Weekly Water Intake</h4>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyNutrition}>
                        <XAxis dataKey="week" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 300', 'dataMax + 300']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: COLORS.surface, border: 'none', borderRadius: 8 }}
                          labelStyle={{ color: COLORS.text }}
                          formatter={(value, name) => [(value / 1000).toFixed(1) + 'L', name === 'water' ? 'Actual' : 'Goal']}
                        />
                        <Line type="monotone" dataKey="waterGoal" stroke={COLORS.textMuted} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="water" stroke={COLORS.water} strokeWidth={2} dot={{ fill: COLORS.water, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.water }} />
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Actual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.textMuted, opacity: 0.5 }} />
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Goal ({(nutritionGoals.water / 1000).toFixed(1)}L)</span>
                    </div>
                  </div>
                </div>

              </>
            )}

            {/* MEALS TAB */}
            {nutritionTab === 'meals' && (
              <>
                {/* Remaining Summary - Prominent */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xs font-semibold mb-3 text-center" style={{ color: COLORS.textMuted }}>REMAINING TODAY</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.accent + '15' }}>
                      <p className="text-3xl font-bold" style={{ color: nutritionGoals.calories - caloriesIntake >= 0 ? COLORS.accent : COLORS.error }}>
                        {nutritionGoals.calories - caloriesIntake}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>calories left</p>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                      <p className="text-3xl font-bold" style={{ color: nutritionGoals.protein - proteinIntake >= 0 ? COLORS.primary : COLORS.error }}>
                        {nutritionGoals.protein - proteinIntake}g
                      </p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>protein left</p>
                    </div>
                  </div>
                  
                  {/* Current intake row */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{caloriesIntake}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>eaten</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{proteinIntake}g</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>protein</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{carbsIntake}g</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>carbs</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{fatsIntake}g</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>fats</p>
                    </div>
                  </div>
                </div>

                {/* Add Meal Button */}
                <button 
                  onClick={() => setShowAddMealFull(true)}
                  className="w-full p-4 rounded-xl mb-4 flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Plus size={20} color={COLORS.text} />
                  <span className="font-semibold" style={{ color: COLORS.text }}>Add Meal with Macros</span>
                </button>

                {/* Meal Log */}
                <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Today's Meals</h4>
                <div className="space-y-3">
                  {mealLog.map(meal => (
                    <div key={meal.id} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold" style={{ color: COLORS.text }}>{meal.name}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{meal.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: COLORS.accent }}>{meal.calories}</span>
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>kcal</span>
                        </div>
                      </div>
                      <div className="flex gap-4 pt-2 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                          <span className="text-xs" style={{ color: COLORS.textSecondary }}>{meal.protein}g P</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                          <span className="text-xs" style={{ color: COLORS.textSecondary }}>{meal.carbs}g C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.sleep }} />
                          <span className="text-xs" style={{ color: COLORS.textSecondary }}>{meal.fats}g F</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SUPPLEMENTS TAB */}
            {nutritionTab === 'supplements' && (
              <>
                {/* Today's Progress */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold" style={{ color: COLORS.text }}>Today's Supplements</h4>
                    <span className="text-sm font-semibold" style={{ color: COLORS.supplements }}>
                      {supplements.filter(s => s.taken).length}/{supplements.length}
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: COLORS.supplements,
                        width: `${(supplements.filter(s => s.taken).length / supplements.length) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
                    {supplements.filter(s => s.taken).length === supplements.length 
                      ? '🎉 All supplements taken!' 
                      : `${supplements.length - supplements.filter(s => s.taken).length} remaining`
                    }
                  </p>
                </div>

                {/* Supplement List */}
                <div className="space-y-2 mb-4">
                  {supplements.map(supp => (
                    <div 
                      key={supp.id}
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{ backgroundColor: supp.taken ? COLORS.supplements + '15' : COLORS.surface }}
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => setSupplements(prev => prev.map(s => s.id === supp.id ? {...s, taken: !s.taken} : s))}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: supp.taken ? COLORS.supplements : COLORS.surfaceLight,
                            border: supp.taken ? 'none' : `2px solid ${COLORS.textMuted}`
                          }}
                        >
                          {supp.taken && <Check size={16} color={COLORS.background} />}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: COLORS.text }}>{supp.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>{supp.dosage}</span>
                            {supp.time && (
                              <>
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>•</span>
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>{supp.time}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSupplements(prev => prev.filter(s => s.id !== supp.id))}
                        className="p-2 rounded-full"
                        style={{ backgroundColor: COLORS.surfaceLight }}
                      >
                        <X size={14} color={COLORS.textMuted} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Supplement */}
                {showAddSupplement ? (
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-semibold mb-3" style={{ color: COLORS.text }}>Add New Supplement</p>
                    <div className="space-y-3 mb-3">
                      <input 
                        type="text" 
                        placeholder="Supplement name" 
                        value={newSupplementName} 
                        onChange={e => setNewSupplementName(e.target.value)}
                        className="w-full p-3 rounded-xl text-sm"
                        style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Dosage (e.g., 5g, 1000mg)" 
                        value={newSupplementDosage} 
                        onChange={e => setNewSupplementDosage(e.target.value)}
                        className="w-full p-3 rounded-xl text-sm"
                        style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setShowAddSupplement(false); setNewSupplementName(''); setNewSupplementDosage(''); }}
                        className="flex-1 py-3 rounded-xl font-semibold"
                        style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          if (newSupplementName) {
                            setSupplements(prev => [...prev, { 
                              id: Date.now().toString(), 
                              name: newSupplementName, 
                              dosage: newSupplementDosage || 'As needed', 
                              taken: false,
                              time: ''
                            }]);
                            setShowAddSupplement(false); 
                            setNewSupplementName(''); 
                            setNewSupplementDosage('');
                          }
                        }}
                        className="flex-1 py-3 rounded-xl font-semibold"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAddSupplement(true)}
                    className="w-full p-4 rounded-xl flex items-center justify-center gap-2 mb-4"
                    style={{ backgroundColor: COLORS.surface, border: `1px dashed ${COLORS.textMuted}` }}
                  >
                    <Plus size={18} color={COLORS.textMuted} />
                    <span style={{ color: COLORS.textMuted }}>Add Supplement</span>
                  </button>
                )}

                {/* Supplement Streak */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold" style={{ color: COLORS.text }}>Consistency</h4>
                    <div className="flex items-center gap-1">
                      <Flame size={16} color={COLORS.warning} />
                      <span className="font-bold" style={{ color: COLORS.warning }}>{streaks.supplements.daysInRow} day streak</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {supplementHistory.slice(0, 7).map((day, i) => (
                      <div 
                        key={i}
                        className="flex-1 aspect-square rounded-lg flex flex-col items-center justify-center"
                        style={{ backgroundColor: day.completed === day.total ? COLORS.success + '20' : COLORS.surfaceLight }}
                      >
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>{day.date.split(' ')[1]}</span>
                        {day.completed === day.total ? (
                          <Check size={14} color={COLORS.success} />
                        ) : (
                          <span className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>{day.completed}/{day.total}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div className="flex items-start gap-3">
                    <Info size={18} color={COLORS.accent} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Supplement Tip</p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        Take creatine daily at the same time for best results. Vitamin D is best absorbed with a meal containing fats.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'friends' && (
          <div className="p-4 h-full overflow-auto">
            {/* Social Opt-Out Banner */}
            {!socialEnabled && (
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surfaceLight }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: COLORS.text }}>Social Features Disabled</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Your activity is private</p>
                  </div>
                  <button 
                    onClick={() => setSocialEnabled(true)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                  >
                    Enable
                  </button>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'feed', label: 'Activity' },
                { id: 'friends', label: 'Friends' },
                { id: 'challenges', label: 'Challenges' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFriendsTab(tab.id)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ 
                    backgroundColor: friendsTab === tab.id ? COLORS.primary : COLORS.surface,
                    color: friendsTab === tab.id ? COLORS.text : COLORS.textMuted
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ACTIVITY FEED TAB */}
            {friendsTab === 'feed' && (
              <>
                {/* Your Stats Card */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: COLORS.primary + '20' }}>
                        💪
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: COLORS.text }}>@{userData.username || 'username'}</p>
                        <p className="text-xs" style={{ color: COLORS.textSecondary }}>{userData.firstName} {userData.lastName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Flame size={12} color={COLORS.warning} />
                          <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>12 day streak</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <Share2 size={14} color={COLORS.text} />
                      <span style={{ color: COLORS.text }}>Share</span>
                    </button>
                  </div>
                  {userData.bio && (
                    <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>{userData.bio}</p>
                  )}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <p className="font-bold" style={{ color: COLORS.text }}>47</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>workouts</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <p className="font-bold" style={{ color: COLORS.text }}>6</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>PRs</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <p className="font-bold" style={{ color: COLORS.text }}>12</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>day streak</p>
                    </div>
                  </div>
                </div>

                {/* Privacy Toggle */}
                <button 
                  onClick={() => setSocialEnabled(!socialEnabled)}
                  className="w-full p-3 rounded-xl mb-4 flex items-center justify-between"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <div className="flex items-center gap-2">
                    <Eye size={16} color={COLORS.textMuted} />
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>Share my activity with friends</span>
                  </div>
                  <div 
                    className="w-10 h-6 rounded-full p-0.5 transition-colors"
                    style={{ backgroundColor: socialEnabled ? COLORS.success : COLORS.surfaceLight }}
                  >
                    <div 
                      className="w-5 h-5 rounded-full transition-transform"
                      style={{ 
                        backgroundColor: COLORS.text,
                        transform: socialEnabled ? 'translateX(16px)' : 'translateX(0)'
                      }}
                    />
                  </div>
                </button>

                {/* Activity Feed */}
                <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Friend Activity</h4>
                <div className="space-y-3">
                  {activityFeed.map(activity => {
                    const friend = friends.find(f => f.id === activity.friendId);
                    if (!friend) return null;
                    const isExpanded = expandedActivity === activity.id;
                    
                    return (
                      <div 
                        key={activity.id} 
                        className="rounded-xl overflow-hidden"
                        style={{ backgroundColor: COLORS.surface }}
                      >
                        {/* Workout Activity Card */}
                        {activity.type === 'workout' && (
                          <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <button 
                                onClick={() => setShowFriendProfile(friend)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                                style={{ backgroundColor: COLORS.surfaceLight }}
                              >
                                {friend.avatar}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setShowFriendProfile(friend)}
                                    className="font-semibold"
                                    style={{ color: COLORS.text }}
                                  >
                                    {friend.name}
                                  </button>
                                  {friend.streak >= 7 && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setShowFriendStreakCalendar(friend); }}
                                      className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" 
                                      style={{ backgroundColor: COLORS.warning + '20' }}>
                                      <Flame size={10} color={COLORS.warning} />
                                      <span style={{ color: COLORS.warning }}>{friend.streak}</span>
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{activity.time}</p>
                              </div>
                            </div>
                            
                            {/* Workout Summary */}
                            <div 
                              className="p-3 rounded-lg mb-3"
                              style={{ backgroundColor: COLORS.primary + '10', borderLeft: `3px solid ${COLORS.primary}` }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Dumbbell size={16} color={COLORS.primary} />
                                  <span className="font-semibold" style={{ color: COLORS.text }}>{activity.workoutName}</span>
                                </div>
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>{activity.duration} min</span>
                              </div>
                              
                              {/* Exercise Preview */}
                              <div className="space-y-1">
                                {activity.exercises.slice(0, isExpanded ? undefined : 3).map((ex, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span style={{ color: COLORS.textSecondary }}>{ex.name}</span>
                                    <span style={{ color: COLORS.textMuted }}>{ex.sets}×{ex.reps} @ {ex.weight}kg</span>
                                  </div>
                                ))}
                              </div>
                              
                              {activity.exercises.length > 3 && (
                                <button 
                                  onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                                  className="text-xs mt-2 font-semibold"
                                  style={{ color: COLORS.primary }}
                                >
                                  {isExpanded ? 'Show less' : `+${activity.exercises.length - 3} more exercises`}
                                </button>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => setLikedPosts(prev => 
                                  prev.includes(activity.id) 
                                    ? prev.filter(id => id !== activity.id)
                                    : [...prev, activity.id]
                                )}
                                className="flex items-center gap-1"
                              >
                                <Heart 
                                  size={18} 
                                  color={likedPosts.includes(activity.id) ? COLORS.error : COLORS.textMuted}
                                  fill={likedPosts.includes(activity.id) ? COLORS.error : 'none'}
                                />
                                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                                  {activity.likes + (likedPosts.includes(activity.id) ? 1 : 0)}
                                </span>
                              </button>
                              <button className="flex items-center gap-1">
                                <MessageCircle size={18} color={COLORS.textMuted} />
                                <span className="text-sm" style={{ color: COLORS.textMuted }}>Comment</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PR Activity Card */}
                        {activity.type === 'pr' && (
                          <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <button 
                                onClick={() => setShowFriendProfile(friend)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                                style={{ backgroundColor: COLORS.surfaceLight }}
                              >
                                {friend.avatar}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setShowFriendProfile(friend)}
                                    className="font-semibold"
                                    style={{ color: COLORS.text }}
                                  >
                                    {friend.name}
                                  </button>
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                                    🏆 NEW PR
                                  </span>
                                </div>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{activity.time}</p>
                              </div>
                            </div>
                            
                            {/* PR Details */}
                            <button 
                              onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                              className="w-full p-3 rounded-lg mb-3 text-left"
                              style={{ backgroundColor: COLORS.success + '10', borderLeft: `3px solid ${COLORS.success}` }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold" style={{ color: COLORS.text }}>{activity.exercise}</span>
                                <ChevronDown 
                                  size={16} 
                                  color={COLORS.textMuted} 
                                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold" style={{ color: COLORS.success }}>{activity.newWeight}kg</span>
                                <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                                  +{activity.newWeight - activity.previousWeight}kg
                                </span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                                Tap to see progress journey →
                              </p>
                            </button>
                            
                            {/* PR Progress Graph */}
                            {isExpanded && activity.prHistory && (
                              <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: COLORS.surfaceLight }}>
                                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>
                                  {friend.name.split(' ')[0]}'s {activity.exercise} Journey
                                </p>
                                <div style={{ height: 120 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={activity.prHistory}>
                                      <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                      <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={30} domain={['dataMin - 10', 'dataMax + 10']} />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: COLORS.surface, border: 'none', borderRadius: 8 }}
                                        formatter={(value) => [`${value}kg`, 'Weight']}
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="weight" 
                                        stroke={COLORS.success} 
                                        strokeWidth={2} 
                                        dot={{ fill: COLORS.success, r: 4 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-center mt-2" style={{ color: COLORS.success }}>
                                  +{activity.prHistory[activity.prHistory.length - 1].weight - activity.prHistory[0].weight}kg total progress 💪
                                </p>
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => setLikedPosts(prev => 
                                  prev.includes(activity.id) 
                                    ? prev.filter(id => id !== activity.id)
                                    : [...prev, activity.id]
                                )}
                                className="flex items-center gap-1"
                              >
                                <Heart 
                                  size={18} 
                                  color={likedPosts.includes(activity.id) ? COLORS.error : COLORS.textMuted}
                                  fill={likedPosts.includes(activity.id) ? COLORS.error : 'none'}
                                />
                                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                                  {activity.likes + (likedPosts.includes(activity.id) ? 1 : 0)}
                                </span>
                              </button>
                              <button className="flex items-center gap-1">
                                <MessageCircle size={18} color={COLORS.textMuted} />
                                <span className="text-sm" style={{ color: COLORS.textMuted }}>Congratulate</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Milestone Activity Card */}
                        {activity.type === 'milestone' && (
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => setShowFriendProfile(friend)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                                style={{ backgroundColor: COLORS.surfaceLight }}
                              >
                                {friend.avatar}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button 
                                    onClick={() => setShowFriendProfile(friend)}
                                    className="font-semibold"
                                    style={{ color: COLORS.text }}
                                  >
                                    {friend.name}
                                  </button>
                                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>reached</span>
                                  <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.accent + '20', color: COLORS.accent }}>
                                    🎉 {activity.milestone}
                                  </span>
                                </div>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{activity.time}</p>
                              </div>
                              <button 
                                onClick={() => setLikedPosts(prev => 
                                  prev.includes(activity.id) 
                                    ? prev.filter(id => id !== activity.id)
                                    : [...prev, activity.id]
                                )}
                              >
                                <Heart 
                                  size={18} 
                                  color={likedPosts.includes(activity.id) ? COLORS.error : COLORS.textMuted}
                                  fill={likedPosts.includes(activity.id) ? COLORS.error : 'none'}
                                />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* FRIENDS LIST TAB */}
            {friendsTab === 'friends' && (
              <>
                {/* Add Friends Button */}
                <button 
                  onClick={() => setShowAddFriendModal(true)}
                  className="w-full p-4 rounded-xl mb-4 flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Plus size={20} color={COLORS.text} />
                  <span className="font-semibold" style={{ color: COLORS.text }}>Add Friends</span>
                </button>

                {/* Online Friends */}
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>ONLINE NOW</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {friends.filter(f => f.isOnline).map(friend => (
                      <button 
                        key={friend.id}
                        onClick={() => setShowFriendProfile(friend)}
                        className="flex flex-col items-center flex-shrink-0"
                      >
                        <div className="relative">
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: COLORS.surface }}
                          >
                            {friend.avatar}
                          </div>
                          <div 
                            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                            style={{ backgroundColor: COLORS.success, borderColor: COLORS.background }}
                          />
                        </div>
                        <p className="text-xs mt-1 max-w-[60px] truncate" style={{ color: COLORS.textSecondary }}>
                          {friend.name.split(' ')[0]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* All Friends */}
                <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>All Friends ({friends.length})</h4>
                
                <div className="space-y-2">
                  {friends.map(friend => (
                    <button 
                      key={friend.id}
                      onClick={() => setShowFriendProfile(friend)}
                      className="w-full p-4 rounded-xl flex items-center justify-between"
                      style={{ backgroundColor: COLORS.surface }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: COLORS.surfaceLight }}
                          >
                            {friend.avatar}
                          </div>
                          {friend.isOnline && (
                            <div 
                              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                              style={{ backgroundColor: COLORS.success, borderColor: COLORS.surface }}
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold" style={{ color: COLORS.text }}>{friend.name}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{friend.program}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowFriendStreakCalendar(friend); }}
                          className="flex items-center gap-1 justify-end px-2 py-1 rounded-lg mb-1"
                          style={{ backgroundColor: COLORS.warning + '15' }}
                        >
                          <Flame size={14} color={COLORS.warning} />
                          <span className="font-bold" style={{ color: COLORS.warning }}>{friend.streak}</span>
                        </button>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{friend.lastActive}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* CHALLENGES TAB */}
            {friendsTab === 'challenges' && (
              <>
                {/* Active Challenges */}
                <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Your Challenges</h4>
                <div className="space-y-4 mb-6">
                  {challenges.filter(c => c.joined).map(challenge => (
                    <div key={challenge.id} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Trophy size={18} color={COLORS.warning} />
                            <h5 className="font-bold" style={{ color: COLORS.text }}>{challenge.name}</h5>
                          </div>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{challenge.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Ends</p>
                          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{challenge.endDate}</p>
                        </div>
                      </div>
                      
                      {/* Leaderboard */}
                      <div className="space-y-2">
                        {challenge.participants.slice(0, 4).map((participant, index) => (
                          <div 
                            key={participant.id}
                            className="flex items-center justify-between p-2 rounded-lg"
                            style={{ 
                              backgroundColor: participant.id === 'you' ? COLORS.primary + '20' : COLORS.surfaceLight 
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ 
                                  backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : COLORS.surface,
                                  color: index < 3 ? COLORS.background : COLORS.text
                                }}
                              >
                                {index + 1}
                              </div>
                              <span className="text-lg">{participant.avatar}</span>
                              <span 
                                className="text-sm font-medium"
                                style={{ color: participant.id === 'you' ? COLORS.primary : COLORS.text }}
                              >
                                {participant.name}
                              </span>
                            </div>
                            <span className="font-bold" style={{ color: COLORS.text }}>
                              {challenge.type === 'volume' ? `${(participant.score / 1000).toFixed(1)}k` : participant.score}
                              {challenge.type === 'workouts' && ' workouts'}
                              {challenge.type === 'streak' && ' days'}
                              {challenge.type === 'volume' && ' kg'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Available Challenges */}
                <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Join a Challenge</h4>
                <div className="space-y-3">
                  {challenges.filter(c => !c.joined).map(challenge => (
                    <div key={challenge.id} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Trophy size={16} color={COLORS.textMuted} />
                            <h5 className="font-semibold" style={{ color: COLORS.text }}>{challenge.name}</h5>
                          </div>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{challenge.description}</p>
                          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
                            {challenge.participants.length} friends participating
                          </p>
                        </div>
                        <button 
                          className="px-4 py-2 rounded-xl text-sm font-semibold"
                          style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create Challenge */}
                <button 
                  onClick={() => setShowCreateChallenge(true)}
                  className="w-full mt-4 p-4 rounded-xl flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.surfaceLight, border: `1px dashed ${COLORS.textMuted}` }}
                >
                  <Plus size={18} color={COLORS.textMuted} />
                  <span style={{ color: COLORS.textMuted }}>Create New Challenge</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>Share Your Progress</h3>
                <button onClick={() => setShowShareModal(false)} className="p-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <X size={20} color={COLORS.textMuted} />
                </button>
              </div>
              
              {/* Preview Card */}
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.background }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: COLORS.primary + '20' }}>
                    💪
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: COLORS.text }}>Your Fitness Journey</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>12 day streak • 47 workouts</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-bold" style={{ color: COLORS.warning }}>🔥 12</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>streak</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-bold" style={{ color: COLORS.primary }}>47</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>workouts</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-bold" style={{ color: COLORS.success }}>6</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>PRs</p>
                  </div>
                </div>
              </div>
              
              {/* Share Options */}
              <div className="space-y-2 mb-4">
                <button className="w-full p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#25D366' }}>
                    <span className="text-lg">📱</span>
                  </div>
                  <span className="font-medium" style={{ color: COLORS.text }}>Share to Messages</span>
                </button>
                <button className="w-full p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1DA1F2' }}>
                    <span className="text-lg">🐦</span>
                  </div>
                  <span className="font-medium" style={{ color: COLORS.text }}>Share to Twitter</span>
                </button>
                <button className="w-full p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E4405F' }}>
                    <span className="text-lg">📸</span>
                  </div>
                  <span className="font-medium" style={{ color: COLORS.text }}>Share to Instagram</span>
                </button>
                <button className="w-full p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                    <Share2 size={18} color={COLORS.text} />
                  </div>
                  <span className="font-medium" style={{ color: COLORS.text }}>Copy Link</span>
                </button>
              </div>
              
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Create Challenge Modal */}
        {showCreateChallenge && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => { setShowCreateChallenge(false); setNewChallenge({ name: '', type: 'workouts', duration: 7, invitedFriends: [] }); }}>
                <X size={24} color={COLORS.text} />
              </button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Create Challenge</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {/* Challenge Name */}
              <div className="mb-6">
                <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Challenge Name</label>
                <input
                  type="text"
                  value={newChallenge.name}
                  onChange={e => setNewChallenge(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g. January Grind, Push-up Masters"
                  className="w-full p-4 rounded-xl"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.surfaceLight}` }}
                  maxLength={30}
                />
              </div>
              
              {/* Challenge Type */}
              <div className="mb-6">
                <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Challenge Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'workouts', label: 'Most Workouts', icon: '🏋️', desc: 'Complete the most workouts' },
                    { id: 'streak', label: 'Longest Streak', icon: '🔥', desc: 'Maintain the longest streak' },
                    { id: 'volume', label: 'Total Volume', icon: '💪', desc: 'Lift the most total weight' },
                    { id: 'reps', label: 'Total Reps', icon: '🔄', desc: 'Complete the most reps' },
                    { id: 'calories', label: 'Calories Burned', icon: '🔥', desc: 'Burn the most calories' },
                    { id: 'custom', label: 'Custom Goal', icon: '🎯', desc: 'Set your own metric' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewChallenge(prev => ({...prev, type: type.id}))}
                      className="p-3 rounded-xl text-left"
                      style={{ 
                        backgroundColor: newChallenge.type === type.id ? COLORS.primary + '20' : COLORS.surface,
                        border: `2px solid ${newChallenge.type === type.id ? COLORS.primary : COLORS.surfaceLight}`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{type.icon}</span>
                        <span className="font-semibold text-sm" style={{ color: newChallenge.type === type.id ? COLORS.primary : COLORS.text }}>{type.label}</span>
                      </div>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Duration */}
              <div className="mb-6">
                <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Duration</label>
                <div className="flex gap-2">
                  {[
                    { days: 7, label: '1 Week' },
                    { days: 14, label: '2 Weeks' },
                    { days: 30, label: '1 Month' },
                    { days: 90, label: '3 Months' },
                  ].map(duration => (
                    <button
                      key={duration.days}
                      onClick={() => setNewChallenge(prev => ({...prev, duration: duration.days}))}
                      className="flex-1 p-3 rounded-xl text-center"
                      style={{ 
                        backgroundColor: newChallenge.duration === duration.days ? COLORS.primary + '20' : COLORS.surface,
                        border: `2px solid ${newChallenge.duration === duration.days ? COLORS.primary : COLORS.surfaceLight}`
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color: newChallenge.duration === duration.days ? COLORS.primary : COLORS.text }}>
                        {duration.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Invite Friends */}
              <div className="mb-6">
                <label className="text-sm mb-2 block font-semibold" style={{ color: COLORS.text }}>Invite Friends</label>
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div
                      key={friend.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewChallenge(prev => ({
                          ...prev,
                          invitedFriends: prev.invitedFriends.includes(friend.id)
                            ? prev.invitedFriends.filter(id => id !== friend.id)
                            : [...prev.invitedFriends, friend.id]
                        }));
                      }}
                      className="w-full p-3 rounded-xl flex items-center justify-between cursor-pointer"
                      style={{ 
                        backgroundColor: newChallenge.invitedFriends.includes(friend.id) ? COLORS.primary + '20' : COLORS.surface,
                        border: `2px solid ${newChallenge.invitedFriends.includes(friend.id) ? COLORS.primary : 'transparent'}`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{friend.avatar}</span>
                        <div className="text-left">
                          <p className="font-semibold" style={{ color: COLORS.text }}>{friend.name}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>@{friend.name.toLowerCase().replace(' ', '_')}</p>
                        </div>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: newChallenge.invitedFriends.includes(friend.id) ? COLORS.primary : COLORS.surfaceLight 
                        }}
                      >
                        {newChallenge.invitedFriends.includes(friend.id) && <Check size={14} color={COLORS.text} />}
                      </div>
                    </div>
                  ))}
                </div>
                {newChallenge.invitedFriends.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: COLORS.primary }}>
                    {newChallenge.invitedFriends.length} friend{newChallenge.invitedFriends.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              
              {/* Preview */}
              {newChallenge.name && (
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>PREVIEW</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={18} color={COLORS.warning} />
                    <h5 className="font-bold" style={{ color: COLORS.text }}>{newChallenge.name}</h5>
                  </div>
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                    {newChallenge.type === 'workouts' && 'Complete the most workouts'}
                    {newChallenge.type === 'streak' && 'Maintain the longest streak'}
                    {newChallenge.type === 'volume' && 'Lift the most total weight'}
                    {newChallenge.type === 'reps' && 'Complete the most reps'}
                    {newChallenge.type === 'calories' && 'Burn the most calories'}
                    {newChallenge.type === 'custom' && 'Custom challenge goal'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    {newChallenge.duration} days • {newChallenge.invitedFriends.length + 1} participants
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button 
                onClick={() => {
                  if (newChallenge.name && newChallenge.invitedFriends.length > 0) {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + newChallenge.duration);
                    const newChallengeObj = {
                      id: Date.now(),
                      name: newChallenge.name,
                      description: newChallenge.type === 'workouts' ? 'Most workouts completed' :
                                   newChallenge.type === 'streak' ? 'Longest active streak' :
                                   newChallenge.type === 'volume' ? 'Most total weight lifted' :
                                   newChallenge.type === 'reps' ? 'Most total reps' :
                                   newChallenge.type === 'calories' ? 'Most calories burned' : 'Custom goal',
                      type: newChallenge.type,
                      endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      participants: [
                        { id: 'you', name: 'You', avatar: '💪', score: 0 },
                        ...newChallenge.invitedFriends.map(friendId => {
                          const friend = friends.find(f => f.id === friendId);
                          return { id: friendId, name: friend.name, avatar: friend.avatar, score: 0 };
                        })
                      ],
                      yourRank: 1,
                      joined: true,
                      createdBy: 'You'
                    };
                    setChallenges(prev => [...prev, newChallengeObj]);
                    setNewChallenge({ name: '', type: 'workouts', duration: 7, invitedFriends: [] });
                    setShowCreateChallenge(false);
                  }
                }}
                disabled={!newChallenge.name || newChallenge.invitedFriends.length === 0}
                className="w-full py-4 rounded-xl font-semibold"
                style={{ 
                  backgroundColor: (newChallenge.name && newChallenge.invitedFriends.length > 0) ? COLORS.primary : COLORS.surfaceLight, 
                  color: (newChallenge.name && newChallenge.invitedFriends.length > 0) ? COLORS.text : COLORS.textMuted 
                }}
              >
                Create & Send Invites
              </button>
              {(!newChallenge.name || newChallenge.invitedFriends.length === 0) && (
                <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                  {!newChallenge.name ? 'Add a challenge name' : 'Invite at least 1 friend'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <EditProfileModal
            userData={userData}
            setUserData={setUserData}
            COLORS={COLORS}
            onClose={() => setShowEditProfile(false)}
          />
        )}

        {/* Units Modal */}
        {showUnitsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="w-full max-w-sm rounded-2xl" style={{ backgroundColor: COLORS.surface }}>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
                <button onClick={() => setShowUnitsModal(false)}><X size={24} color={COLORS.text} /></button>
                <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Units</h3>
              </div>
              <div className="p-4">
                <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>Choose your preferred measurement units</p>
                <div className="space-y-2">
                  {[
                    { id: 'metric', label: 'Metric', desc: 'Kilograms, centimeters' },
                    { id: 'imperial', label: 'Imperial', desc: 'Pounds, inches' },
                  ].map(unit => (
                    <button
                      key={unit.id}
                      onClick={() => setSettings(prev => ({ ...prev, units: unit.id }))}
                      className="w-full p-4 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: settings.units === unit.id ? COLORS.primary + '20' : COLORS.surfaceLight,
                        border: `2px solid ${settings.units === unit.id ? COLORS.primary : 'transparent'}`
                      }}
                    >
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{unit.label}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{unit.desc}</p>
                      </div>
                      {settings.units === unit.id && <Check size={20} color={COLORS.primary} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                <button
                  onClick={() => setShowUnitsModal(false)}
                  className="w-full py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowNotificationsModal(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Notifications</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>Choose which notifications you want to receive</p>
              <div className="space-y-3">
                {[
                  { id: 'workoutReminders', label: 'Workout Reminders', desc: 'Get reminded when it\'s time to train' },
                  { id: 'progressUpdates', label: 'Progress Updates', desc: 'Weekly summaries and milestone alerts' },
                  { id: 'socialActivity', label: 'Social Activity', desc: 'Friend requests, likes, and comments' },
                  { id: 'weeklyReport', label: 'Weekly Report', desc: 'Detailed weekly performance report' },
                ].map(notif => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>{notif.label}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{notif.desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, [notif.id]: !prev.notifications[notif.id] }
                      }))}
                      className="w-12 h-7 rounded-full p-0.5 transition-colors"
                      style={{ backgroundColor: settings.notifications[notif.id] ? COLORS.success : COLORS.surfaceLight }}
                    >
                      <div
                        className="w-6 h-6 rounded-full transition-transform"
                        style={{
                          backgroundColor: COLORS.text,
                          transform: settings.notifications[notif.id] ? 'translateX(20px)' : 'translateX(0)'
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Privacy Modal */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowPrivacyModal(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Privacy & Social</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>Control who can see your profile and activity</p>
              <div className="space-y-3">
                {[
                  { id: 'profileVisible', label: 'Public Profile', desc: 'Allow others to find and view your profile' },
                  { id: 'showActivity', label: 'Show Activity', desc: 'Share your workouts in the activity feed' },
                  { id: 'showProgress', label: 'Show Progress', desc: 'Display weight and body stats to friends' },
                ].map(privacy => (
                  <div
                    key={privacy.id}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>{privacy.label}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{privacy.desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, [privacy.id]: !prev.privacy[privacy.id] }
                      }))}
                      className="w-12 h-7 rounded-full p-0.5 transition-colors"
                      style={{ backgroundColor: settings.privacy[privacy.id] ? COLORS.success : COLORS.surfaceLight }}
                    >
                      <div
                        className="w-6 h-6 rounded-full transition-transform"
                        style={{
                          backgroundColor: COLORS.text,
                          transform: settings.privacy[privacy.id] ? 'translateX(20px)' : 'translateX(0)'
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Followers / Subscribers Section */}
              <h4 className="font-semibold mt-6 mb-3" style={{ color: COLORS.text }}>Profile Visibility</h4>
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.surface }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: COLORS.text }}>Public Profile</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: settings.social.allowSubscribers ? COLORS.textMuted : COLORS.text }}>
                      Private
                    </span>
                    <button
                      onClick={async () => {
                        const newValue = !settings.social.allowSubscribers;
                        setSettings(prev => ({
                          ...prev,
                          social: { ...prev.social, allowSubscribers: newValue }
                        }));
                        // Save to database
                        if (user?.id) {
                          try {
                            const { error } = await profileService.updateProfile(user.id, { allow_subscribers: newValue });
                            if (error) {
                              // Revert on error
                              console.warn('Settings update error:', error?.message);
                              setSettings(prev => ({
                                ...prev,
                                social: { ...prev.social, allowSubscribers: !newValue }
                              }));
                            }
                          } catch (err) {
                            console.warn('Settings update failed:', err?.message || err);
                            // Revert on error
                            setSettings(prev => ({
                              ...prev,
                              social: { ...prev.social, allowSubscribers: !newValue }
                            }));
                          }
                        }
                      }}
                      className="w-12 h-7 rounded-full p-0.5 transition-colors"
                      style={{ backgroundColor: settings.social.allowSubscribers ? COLORS.success : COLORS.surfaceLight }}
                    >
                      <div
                        className="w-6 h-6 rounded-full transition-transform"
                        style={{
                          backgroundColor: COLORS.text,
                          transform: settings.social.allowSubscribers ? 'translateX(20px)' : 'translateX(0)'
                        }}
                      />
                    </button>
                    <span className="text-xs font-medium" style={{ color: settings.social.allowSubscribers ? COLORS.text : COLORS.textMuted }}>
                      Public
                    </span>
                  </div>
                </div>

                {/* Clear explanation of current state */}
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: settings.social.allowSubscribers ? COLORS.success + '20' : COLORS.surfaceLight }}>
                  {settings.social.allowSubscribers ? (
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.success }}>
                        ✓ PUBLIC - Anyone can see your progress
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                        Anyone can subscribe to you without approval. They'll see your workouts and achievements.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                        🔒 PRIVATE - Only friends can see your progress
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                        People must send a friend request and be approved to see your activity.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: COLORS.primary + '10' }}>
                <p className="text-sm" style={{ color: COLORS.primary }}>
                  Your workout data is always private and encrypted. These settings only control what others can see.
                </p>
              </div>
            </div>
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tracking Preferences Modal */}
        {showTrackingModal && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowTrackingModal(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Tracking Preferences</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>Choose what you want to track. Disabled items won't appear in your dashboard or count towards streaks.</p>
              <div className="space-y-3">
                {[
                  { id: 'calories', label: 'Calories', desc: 'Track daily calorie intake', icon: Flame, color: COLORS.warning },
                  { id: 'macros', label: 'Macros', desc: 'Track protein, carbs, and fats', icon: Apple, color: COLORS.protein },
                  { id: 'water', label: 'Water', desc: 'Track daily water intake', icon: Droplets, color: COLORS.water },
                  { id: 'sleep', label: 'Sleep', desc: 'Track sleep duration and quality', icon: Moon, color: COLORS.sleep },
                  { id: 'supplements', label: 'Supplements', desc: 'Track daily supplement intake', icon: Zap, color: COLORS.supplements },
                ].map(tracking => (
                  <div
                    key={tracking.id}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tracking.color + '20' }}>
                        <tracking.icon size={20} color={tracking.color} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: COLORS.text }}>{tracking.label}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{tracking.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        tracking: { ...prev.tracking, [tracking.id]: !prev.tracking[tracking.id] }
                      }))}
                      className="w-12 h-7 rounded-full p-0.5 transition-colors"
                      style={{ backgroundColor: settings.tracking[tracking.id] ? COLORS.success : COLORS.surfaceLight }}
                    >
                      <div
                        className="w-6 h-6 rounded-full transition-transform"
                        style={{
                          backgroundColor: COLORS.text,
                          transform: settings.tracking[tracking.id] ? 'translateX(20px)' : 'translateX(0)'
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: COLORS.warning + '10' }}>
                <p className="text-sm" style={{ color: COLORS.warning }}>
                  Workouts are always tracked. Disabling a category will hide it from your home screen and exclude it from streak calculations.
                </p>
              </div>
            </div>
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Account Modal */}
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowAccountModal(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Account</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3">
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Email</p>
                  <p className="font-semibold" style={{ color: COLORS.text }}>{userData.email || 'user@example.com'}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Username</p>
                  <p className="font-semibold" style={{ color: COLORS.text }}>@{userData.username || 'username'}</p>
                </div>
                <button className="w-full p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surface }}>
                  <span style={{ color: COLORS.text }}>Change Password</span>
                  <ChevronRight size={18} color={COLORS.textMuted} />
                </button>
                <button className="w-full p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surface }}>
                  <span style={{ color: COLORS.text }}>Export My Data</span>
                  <ChevronRight size={18} color={COLORS.textMuted} />
                </button>
              </div>
              <div className="mt-6 pt-6 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                <h4 className="font-semibold mb-3" style={{ color: COLORS.error }}>Danger Zone</h4>
                <button className="w-full p-4 rounded-xl mb-2" style={{ backgroundColor: COLORS.error + '15' }}>
                  <span style={{ color: COLORS.error }}>Deactivate Account</span>
                </button>
                <button className="w-full p-4 rounded-xl" style={{ backgroundColor: COLORS.error + '15' }}>
                  <span style={{ color: COLORS.error }}>Delete Account</span>
                </button>
              </div>
            </div>
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button
                onClick={() => setShowAccountModal(false)}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Goal Editor Modal */}
        {showGoalEditor && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowGoalEditor(false)}><X size={24} color={COLORS.text} /></button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Change Goal</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>Select your new fitness goal</p>
              <div className="space-y-3">
                {Object.entries(GOAL_INFO).map(([id, goal]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setUserData(prev => ({ ...prev, goal: id }));
                      setShowGoalEditor(false);
                    }}
                    className="w-full p-4 rounded-xl flex items-center gap-4 text-left"
                    style={{
                      backgroundColor: userData.goal === id ? COLORS.primary + '20' : COLORS.surface,
                      border: `2px solid ${userData.goal === id ? COLORS.primary : COLORS.surfaceLight}`
                    }}
                  >
                    <span className="text-3xl">{goal.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: userData.goal === id ? COLORS.primary : COLORS.text }}>
                        {goal.title}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{goal.overview}</p>
                    </div>
                    {userData.goal === id && <Check size={20} color={COLORS.primary} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirm Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.surface }}>
              <h3 className="text-xl font-bold mb-2 text-center" style={{ color: COLORS.text }}>Log Out?</h3>
              <p className="text-sm text-center mb-6" style={{ color: COLORS.textMuted }}>
                Are you sure you want to log out? Your data will be saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowLogoutConfirm(false);
                    await signOut();
                    setCurrentScreen('welcome');
                    setActiveTab('home');
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: COLORS.error, color: COLORS.text }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Friend Modal */}
        {showAddFriendModal && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => { setShowAddFriendModal(false); setFriendSearchQuery(''); setSearchResults([]); }}>
                <X size={24} color={COLORS.text} />
              </button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Find People</h3>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search size={18} color={COLORS.textMuted} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by username or name..."
                  value={friendSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setFriendSearchQuery(query);

                    if (query.length >= 2) {
                      setSearchLoading(true);
                      // Wrap in async IIFE to handle errors gracefully
                      (async () => {
                        try {
                          const { data } = await profileService.searchUsers(query, user?.id);
                          setSearchResults(data || []);
                        } catch (err) {
                          console.error('Search error:', err);
                          setSearchResults([]);
                        } finally {
                          setSearchLoading(false);
                        }
                      })();
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none' }}
                />
                {searchLoading && (
                  <Loader2 size={18} color={COLORS.textMuted} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {friendSearchQuery.length >= 2 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>
                    {searchResults.length > 0 ? `Found ${searchResults.length} users` : 'No results'}
                  </h4>
                  <div className="space-y-2">
                    {searchResults.map(person => (
                      <div
                        key={person.id}
                        className="p-4 rounded-xl flex items-center justify-between"
                        style={{ backgroundColor: COLORS.surface }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: COLORS.surfaceLight }}
                          >
                            {person.avatar_url || (person.first_name ? person.first_name[0].toUpperCase() : '?')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold" style={{ color: COLORS.text }}>
                                {person.first_name} {person.last_name}
                              </p>
                              {person.allow_subscribers && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                                  Public
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>@{person.username || 'user'}</p>
                              {person.subscriber_count > 0 && (
                                <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                                  · {person.subscriber_count} {person.subscriber_count === 1 ? 'subscriber' : 'subscribers'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {person.allow_subscribers ? (
                          <button
                            onClick={async () => {
                              if (user?.id) {
                                try {
                                  const { error } = await profileService.subscribeToUser(user.id, person.id);
                                  if (!error) {
                                    setSearchResults(prev => prev.filter(p => p.id !== person.id));
                                  } else {
                                    console.warn('Subscribe error:', error?.message);
                                  }
                                } catch (err) {
                                  console.warn('Subscribe failed:', err?.message || err);
                                }
                              }
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{ backgroundColor: COLORS.accent, color: COLORS.background }}
                          >
                            Subscribe
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (user?.id) {
                                try {
                                  const { error } = await profileService.sendFriendRequest(user.id, person.id);
                                  if (!error) {
                                    setSearchResults(prev => prev.map(p =>
                                      p.id === person.id ? { ...p, requestSent: true } : p
                                    ));
                                  } else {
                                    console.warn('Friend request error:', error?.message);
                                  }
                                } catch (err) {
                                  console.warn('Friend request failed:', err?.message || err);
                                }
                              }
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{
                              backgroundColor: person.requestSent ? COLORS.surfaceLight : COLORS.primary,
                              color: person.requestSent ? COLORS.textMuted : COLORS.text
                            }}
                            disabled={person.requestSent}
                          >
                            {person.requestSent ? 'Requested' : 'Add Friend'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Only show these sections if not actively searching */}
              {friendSearchQuery.length < 2 && (
                <>
                  {/* Invite Friends */}
                  <button
                    className="w-full p-4 rounded-xl mb-6 flex items-center gap-3"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.text + '20' }}>
                      <Share2 size={20} color={COLORS.text} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold" style={{ color: COLORS.text }}>Invite Friends</p>
                      <p className="text-xs" style={{ color: COLORS.text + 'CC' }}>Share your invite link</p>
                    </div>
                  </button>

                  {/* Suggested Friends */}
                  {suggestedFriends.length > 0 && (
                    <>
                      <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Suggested for You</h4>
                      <div className="space-y-2 mb-6">
                        {suggestedFriends.map(friend => (
                          <div
                            key={friend.id}
                            className="p-4 rounded-xl flex items-center justify-between"
                            style={{ backgroundColor: COLORS.surface }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                                style={{ backgroundColor: COLORS.surfaceLight }}
                              >
                                {friend.avatar}
                              </div>
                              <div>
                                <p className="font-semibold" style={{ color: COLORS.text }}>{friend.name}</p>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{friend.mutualFriends} mutual friends</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setFriends(prev => [...prev, { ...friend, streak: 0, isOnline: false, lastActive: 'Just added', weeklyWorkouts: 0, goal: 'fitness', stats: { workouts: 0, prs: 0, streak: 0 } }]);
                              }}
                              className="px-4 py-2 rounded-xl text-sm font-semibold"
                              style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* From Contacts */}
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Find from Contacts</h4>
                  <button
                    className="w-full p-4 rounded-xl flex items-center gap-3"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <Users size={20} color={COLORS.textMuted} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium" style={{ color: COLORS.text }}>Sync Contacts</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Find friends already on the app</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Friend Profile Modal */}
        {showFriendProfile && !showFriendStreakCalendar && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowFriendProfile(null)}>
                <X size={24} color={COLORS.text} />
              </button>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Profile</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-5xl"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  {showFriendProfile.avatar}
                </div>
                <h4 className="text-xl font-bold" style={{ color: COLORS.text }}>{showFriendProfile.name}</h4>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{showFriendProfile.program}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {showFriendProfile.isOnline ? (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                      Online now
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      Active {showFriendProfile.lastActive}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats - Clickable */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <Dumbbell size={20} color={COLORS.primary} className="mx-auto mb-1" />
                  <p className="text-xl font-bold" style={{ color: COLORS.text }}>{showFriendProfile.stats.workouts}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Workouts</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <Trophy size={20} color={COLORS.warning} className="mx-auto mb-1" />
                  <p className="text-xl font-bold" style={{ color: COLORS.text }}>{showFriendProfile.stats.prs}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>PRs</p>
                </div>
                <button
                  onClick={() => setShowFriendStreakCalendar(showFriendProfile)}
                  className="p-4 rounded-xl text-center relative"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <Flame size={20} color={COLORS.error} className="mx-auto mb-1" />
                  <p className="text-xl font-bold" style={{ color: COLORS.text }}>{showFriendProfile.stats.streak}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Workout Streak</p>
                  <ChevronRight size={14} color={COLORS.textMuted} className="absolute right-2 top-1/2 -translate-y-1/2" />
                </button>
              </div>

              {/* Current Goal */}
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                <h5 className="font-semibold mb-2" style={{ color: COLORS.text }}>Current Goal</h5>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary + '20' }}
                  >
                    <Target size={20} color={COLORS.primary} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: COLORS.text }}>
                      {showFriendProfile.goal === 'build_muscle' && 'Build Muscle'}
                      {showFriendProfile.goal === 'lose_fat' && 'Lose Fat'}
                      {showFriendProfile.goal === 'strength' && 'Get Stronger'}
                      {showFriendProfile.goal === 'fitness' && 'General Fitness'}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>{showFriendProfile.weeklyWorkouts}x per week</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <h5 className="font-semibold mb-3" style={{ color: COLORS.text }}>Recent Activity</h5>
                <div className="space-y-2">
                  {activityFeed.filter(a => a.friendId === showFriendProfile.id).slice(0, 3).map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <div className="text-lg">
                        {activity.type === 'workout' && '🏋️'}
                        {activity.type === 'pr' && '🏆'}
                        {activity.type === 'milestone' && '🎉'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: COLORS.text }}>
                          {activity.type === 'workout' && `Completed ${activity.workoutName}`}
                          {activity.type === 'pr' && `New ${activity.exercise} PR: ${activity.newWeight}kg`}
                          {activity.type === 'milestone' && `Reached ${activity.milestone}`}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Friend Streak Calendar Modal */}
        {showFriendStreakCalendar && (() => {
          const friend = showFriendStreakCalendar;
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
          const getFirstDayOfMonth = (month, year) => {
            const day = new Date(year, month, 1).getDay();
            return (day + 6) % 7; // Convert to Monday=0 based
          };
          const daysInMonth = getDaysInMonth(friendStreakMonth, friendStreakYear);
          const firstDay = getFirstDayOfMonth(friendStreakMonth, friendStreakYear);
          
          // Generate friend's workout data based on their streak
          const generateFriendWorkoutData = () => {
            const data = {};
            const streakDays = friend.stats.streak;
            
            // Work backwards from today to create workout history
            for (let i = 1; i <= 31; i++) {
              if (i <= 8) { // Days in current month up to today
                // More likely to have worked out if they have a high streak
                const daysSinceToday = 8 - i;
                if (daysSinceToday < streakDays) {
                  // Within their streak - they worked out
                  data[i] = { 
                    workedOut: true, 
                    workout: ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body', 'Full Body'][Math.floor(Math.random() * 6)],
                    duration: 45 + Math.floor(Math.random() * 30)
                  };
                } else {
                  // Before their streak started - random
                  data[i] = { 
                    workedOut: Math.random() > 0.4,
                    workout: Math.random() > 0.4 ? ['Push Day', 'Pull Day', 'Leg Day'][Math.floor(Math.random() * 3)] : null,
                    duration: Math.random() > 0.4 ? 45 + Math.floor(Math.random() * 30) : 0
                  };
                }
              }
            }
            return data;
          };
          
          const workoutData = generateFriendWorkoutData();
          
          const calendarDays = [];
          for (let i = 0; i < firstDay; i++) calendarDays.push(null);
          for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
          
          const isToday = (day) => day === today.getDate() && friendStreakMonth === today.getMonth() && friendStreakYear === today.getFullYear();
          const isFuture = (day) => new Date(friendStreakYear, friendStreakMonth, day) > today;
          
          const changeMonth = (delta) => {
            let newMonth = friendStreakMonth + delta;
            let newYear = friendStreakYear;
            if (newMonth > 11) { newMonth = 0; newYear++; }
            if (newMonth < 0) { newMonth = 11; newYear--; }
            setFriendStreakMonth(newMonth);
            setFriendStreakYear(newYear);
          };
          
          const workoutDays = Object.values(workoutData).filter(d => d.workedOut).length;
          const restDays = Object.values(workoutData).filter(d => !d.workedOut).length;
          const avgDuration = Math.round(Object.values(workoutData).filter(d => d.workedOut).reduce((acc, d) => acc + d.duration, 0) / workoutDays) || 0;
          
          return (
            <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
                <button onClick={() => { setShowFriendStreakCalendar(null); setFriendStreakMonth(currentMonth); setFriendStreakYear(currentYear); }}>
                  <ChevronLeft size={24} color={COLORS.text} />
                </button>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  {friend.avatar}
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: COLORS.text }}>{friend.name.split(' ')[0]}'s Streak</h2>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>{friend.program}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {/* Streak Banner */}
                <div className="p-4 rounded-xl mb-4 text-center" style={{ backgroundColor: COLORS.warning + '20' }}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame size={28} color={COLORS.warning} />
                    <p className="text-4xl font-bold" style={{ color: COLORS.warning }}>{friend.stats.streak}</p>
                  </div>
                  <p style={{ color: COLORS.textSecondary }}>day workout streak</p>
                  {friend.stats.streak >= 30 && (
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: COLORS.warning + '30' }}>
                      <Trophy size={14} color={COLORS.warning} />
                      <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>On fire! 🔥</span>
                    </div>
                  )}
                </div>
                
                {/* Calendar */}
                <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <ChevronLeft size={20} color={COLORS.text} />
                    </button>
                    <h4 className="font-bold" style={{ color: COLORS.text }}>{monthNames[friendStreakMonth]} {friendStreakYear}</h4>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <ChevronRight size={20} color={COLORS.text} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-xs font-semibold py-1" style={{ color: COLORS.textMuted }}>{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      const dayData = workoutData[day];
                      const future = day && isFuture(day);
                      const todayDate = isToday(day);
                      
                      return (
                        <div 
                          key={i}
                          className="rounded-lg flex flex-col items-center justify-center p-2 relative"
                          style={{ 
                            backgroundColor: !day ? 'transparent' : future ? 'transparent' : dayData?.workedOut ? COLORS.success + '30' : COLORS.surfaceLight,
                            border: todayDate ? `2px solid ${COLORS.warning}` : '2px solid transparent',
                            opacity: !day ? 0 : future ? 0.4 : 1,
                            minHeight: '50px'
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: COLORS.text }}>{day || ''}</span>
                          {day && !future && dayData && (
                            <div className="mt-1">
                              {dayData.workedOut ? (
                                <Dumbbell size={12} color={COLORS.success} />
                              ) : (
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>Rest</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: COLORS.success + '30' }}>
                        <Dumbbell size={10} color={COLORS.success} />
                      </div>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Workout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.surfaceLight }} />
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Rest Day</span>
                    </div>
                  </div>
                </div>
                
                {/* Stats Summary */}
                <h5 className="font-semibold mb-3" style={{ color: COLORS.text }}>This Month</h5>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.success + '15' }}>
                    <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{workoutDays}</p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary }}>Workouts</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{restDays}</p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary }}>Rest Days</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                    <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{avgDuration}m</p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary }}>Avg Duration</p>
                  </div>
                </div>
                
                {/* Weekly Breakdown */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                  <h5 className="font-semibold mb-3" style={{ color: COLORS.text }}>Weekly Average</h5>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.primary + '20' }}
                    >
                      <span className="text-lg font-bold" style={{ color: COLORS.primary }}>{friend.weeklyWorkouts}</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: COLORS.text }}>workouts per week</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {friend.weeklyWorkouts >= 5 ? 'Very consistent! 💪' : friend.weeklyWorkouts >= 3 ? 'Solid routine!' : 'Building the habit'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                <button 
                  onClick={() => { setShowFriendStreakCalendar(null); setFriendStreakMonth(currentMonth); setFriendStreakYear(currentYear); }}
                  className="w-full py-4 rounded-xl font-semibold"
                  style={{ backgroundColor: COLORS.warning, color: COLORS.background }}
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}

        {activeTab === 'progress' && (
          <div className="p-4 h-full overflow-auto">
            {/* Progress Overview */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} color={COLORS.primary} />
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Current</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{userData.currentWeight || 80}kg</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  {userData.goal === 'lose_fat' ? 'Goal: ' : 'Target: '}{userData.goalWeight || 75}kg
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={18} color={COLORS.success} />
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>Progress</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
                  {(() => {
                    const start = parseFloat(userData.currentWeight) || 80;
                    const goal = parseFloat(userData.goalWeight) || 75;
                    const current = start; // Would be dynamic in real app
                    const totalChange = Math.abs(goal - start);
                    const currentChange = Math.abs(current - start);
                    return totalChange > 0 ? Math.round((currentChange / totalChange) * 100) : 0;
                  })()}%
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>to goal</p>
              </div>
            </div>

            {/* Weight Chart */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold" style={{ color: COLORS.text }}>Weight Trend</h4>
                <div className="flex gap-2">
                  {['1M', '3M', '6M', 'All'].map(period => (
                    <button
                      key={period}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: period === '3M' ? COLORS.primary + '20' : 'transparent', color: period === '3M' ? COLORS.primary : COLORS.textMuted }}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { date: 'Week 1', weight: 82, bodyFat: 22, muscle: 38 },
                    { date: 'Week 2', weight: 81.5, bodyFat: 21.5, muscle: 38.2 },
                    { date: 'Week 3', weight: 81.2, bodyFat: 21.2, muscle: 38.5 },
                    { date: 'Week 4', weight: 80.8, bodyFat: 20.8, muscle: 38.8 },
                    { date: 'Week 5', weight: 80.3, bodyFat: 20.3, muscle: 39 },
                    { date: 'Week 6', weight: 80, bodyFat: 20, muscle: 39.2 },
                  ]}>
                    <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: COLORS.surface, border: 'none', borderRadius: 8 }}
                      labelStyle={{ color: COLORS.text }}
                      formatter={(value, name) => [value + (name === 'weight' ? 'kg' : '%'), name === 'weight' ? 'Weight' : name === 'bodyFat' ? 'Body Fat' : 'Muscle']}
                    />
                    <Line type="monotone" dataKey="weight" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.primary }} />
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>Weight</span>
                </div>
              </div>
            </div>

            {/* Body Composition Chart */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold" style={{ color: COLORS.text }}>Body Composition</h4>
              </div>
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: COLORS.textMuted }}>Track body fat and muscle mass</p>
                <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Coming soon</p>
              </div>
            </div>

            {/* Current Stats */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
              <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Latest Measurements</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                      <TrendingUp size={16} color={COLORS.primary} />
                    </div>
                    <span style={{ color: COLORS.textSecondary }}>Current Weight</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold" style={{ color: COLORS.text }}>{userData.currentWeight || '--'} kg</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.accent + '20' }}>
                      <Target size={16} color={COLORS.accent} />
                    </div>
                    <span style={{ color: COLORS.textSecondary }}>Goal Weight</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold" style={{ color: COLORS.text }}>{userData.goalWeight || '--'} kg</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                      <TrendingDown size={16} color={COLORS.success} />
                    </div>
                    <span style={{ color: COLORS.textSecondary }}>To Go</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold" style={{ color: COLORS.text }}>
                      {userData.currentWeight && userData.goalWeight
                        ? `${Math.abs(parseFloat(userData.currentWeight) - parseFloat(userData.goalWeight)).toFixed(1)} kg`
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Log New Weigh-In Button */}
            <button 
              onClick={() => setShowWeighIn(true)}
              className="w-full p-4 rounded-xl flex items-center justify-center gap-2 mb-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Plus size={20} color={COLORS.text} />
              <span className="font-semibold" style={{ color: COLORS.text }}>Log Weigh-In</span>
            </button>

            {/* Weigh-In History */}
            <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Recent Weigh-Ins</h4>
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                Log your weigh-ins to track progress
              </p>
            </div>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="h-full overflow-auto">
            {/* Profile Header */}
            <div className="p-6 text-center" style={{ backgroundColor: COLORS.surface }}>
              <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl" style={{ backgroundColor: COLORS.primary + '20' }}>
                💪
              </div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.text }}>
                @{userData.username || 'username'}
              </h2>
              <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>
                {userData.firstName || 'First'} {userData.lastName || 'Last'}
              </p>
              {userData.bio && (
                <p className="text-sm mb-3 px-4" style={{ color: COLORS.textMuted }}>{userData.bio}</p>
              )}
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}
              >
                <Edit3 size={14} />
                Edit Profile
              </button>
            </div>

            {/* Quick Stats */}
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.primary }}>{overviewStats.totalWorkouts}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>workouts</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.warning }}>{streaks.weeklyWorkouts.weeksCompleted}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>week streak</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.success }}>{personalRecords.length}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>PRs</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.accent }}>{achievements.filter(a => a.unlocked).length}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>badges</p>
                </div>
              </div>

              {/* Current Goal */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>Current Goal</h3>
                  <button
                    onClick={() => setShowGoalEditor(true)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}
                  >
                    Change
                  </button>
                </div>
                {userData.goal && GOAL_INFO[userData.goal] ? (
                  <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{GOAL_INFO[userData.goal].icon}</span>
                      <div>
                        <p className="font-semibold" style={{ color: COLORS.text }}>{GOAL_INFO[userData.goal].title}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>
                          {userData.experience === 'beginner' ? 'Beginner' : userData.experience === 'intermediate' ? 'Intermediate' : 'Advanced'}
                        </p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: COLORS.textMuted }}>Progress to goal</span>
                        <span style={{ color: COLORS.primary }}>
                          {(() => {
                            const start = parseFloat(userData.currentWeight) || overviewStats.startingWeight;
                            const goal = parseFloat(userData.goalWeight) || overviewStats.targetWeight;
                            const current = overviewStats.currentWeight;
                            const totalChange = Math.abs(goal - start);
                            const currentChange = Math.abs(current - start);
                            return totalChange > 0 ? Math.min(100, Math.round((currentChange / totalChange) * 100)) : 0;
                          })()}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: COLORS.primary,
                            width: `${(() => {
                              const start = parseFloat(userData.currentWeight) || overviewStats.startingWeight;
                              const goal = parseFloat(userData.goalWeight) || overviewStats.targetWeight;
                              const current = overviewStats.currentWeight;
                              const totalChange = Math.abs(goal - start);
                              const currentChange = Math.abs(current - start);
                              return totalChange > 0 ? Math.min(100, Math.round((currentChange / totalChange) * 100)) : 0;
                            })()}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.textMuted }}>Start: {overviewStats.startingWeight}kg</span>
                      <span style={{ color: COLORS.text }}>Now: {overviewStats.currentWeight}kg</span>
                      <span style={{ color: COLORS.success }}>Goal: {overviewStats.targetWeight}kg</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGoalEditor(true)}
                    className="w-full p-4 rounded-xl text-center"
                    style={{ backgroundColor: COLORS.surface, border: `2px dashed ${COLORS.surfaceLight}` }}
                  >
                    <Target size={24} color={COLORS.textMuted} className="mx-auto mb-2" />
                    <p style={{ color: COLORS.textMuted }}>Set your fitness goal</p>
                  </button>
                )}
              </div>

              {/* Current Program */}
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                      <Dumbbell size={20} color={COLORS.primary} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>{currentProgram.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{currentProgram.daysPerWeek} days/week</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: COLORS.textMuted }}>Week {currentProgram.currentWeek} of {currentProgram.totalWeeks}</span>
                  <span style={{ color: COLORS.primary }}>{Math.round((currentProgram.currentWeek / currentProgram.totalWeeks) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS.primary, width: `${(currentProgram.currentWeek / currentProgram.totalWeeks) * 100}%` }}
                  />
                </div>
              </div>

              {/* Achievements */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>Achievements</h3>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>
                    {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {achievements.slice(0, 8).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-3 rounded-xl text-center"
                      style={{
                        backgroundColor: COLORS.surface,
                        opacity: achievement.unlocked ? 1 : 0.4
                      }}
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <p className="text-xs mt-1 truncate" style={{ color: achievement.unlocked ? COLORS.text : COLORS.textMuted }}>
                        {achievement.name}
                      </p>
                    </div>
                  ))}
                </div>
                {achievements.length > 8 && (
                  <button
                    className="w-full py-2 rounded-xl text-sm"
                    style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted }}
                  >
                    View All Achievements
                  </button>
                )}
              </div>

              {/* Settings */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Settings</h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.surface }}>
                  <button
                    onClick={() => setShowUnitsModal(true)}
                    className="w-full p-4 flex items-center justify-between border-b"
                    style={{ borderColor: COLORS.surfaceLight }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.accent + '20' }}>
                        <ArrowLeftRight size={16} color={COLORS.accent} />
                      </div>
                      <span style={{ color: COLORS.text }}>Units</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: COLORS.textMuted }}>
                        {settings.units === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}
                      </span>
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </div>
                  </button>

                  <button
                    onClick={() => setShowNotificationsModal(true)}
                    className="w-full p-4 flex items-center justify-between border-b"
                    style={{ borderColor: COLORS.surfaceLight }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '20' }}>
                        <Zap size={16} color={COLORS.warning} />
                      </div>
                      <span style={{ color: COLORS.text }}>Notifications</span>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>

                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="w-full p-4 flex items-center justify-between border-b"
                    style={{ borderColor: COLORS.surfaceLight }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                        <Eye size={16} color={COLORS.primary} />
                      </div>
                      <span style={{ color: COLORS.text }}>Privacy</span>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>

                  <button
                    onClick={() => setShowTrackingModal(true)}
                    className="w-full p-4 flex items-center justify-between border-b"
                    style={{ borderColor: COLORS.surfaceLight }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                        <BarChart3 size={16} color={COLORS.success} />
                      </div>
                      <span style={{ color: COLORS.text }}>Tracking Preferences</span>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>

                  <button
                    onClick={() => setShowAccountModal(true)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <User size={16} color={COLORS.textSecondary} />
                      </div>
                      <span style={{ color: COLORS.text }}>Account</span>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>
                </div>
              </div>

              {/* Support */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Support</h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.surface }}>
                  <button className="w-full p-4 flex items-center justify-between border-b" style={{ borderColor: COLORS.surfaceLight }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <Book size={16} color={COLORS.textSecondary} />
                      </div>
                      <span style={{ color: COLORS.text }}>Help Center</span>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between border-b" style={{ borderColor: COLORS.surfaceLight }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <MessageCircle size={16} color={COLORS.textSecondary} />
                      </div>
                      <span style={{ color: COLORS.text }}>Send Feedback</span>
                    </div>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <Info size={16} color={COLORS.textSecondary} />
                      </div>
                      <span style={{ color: COLORS.text }}>About UpRep</span>
                    </div>
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>v5.0.0</span>
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full p-4 rounded-xl mb-6"
                style={{ backgroundColor: COLORS.error + '15' }}
              >
                <span className="font-semibold" style={{ color: COLORS.error }}>Log Out</span>
              </button>

              {/* Member since */}
              <p className="text-center text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Member since December 2025
              </p>
            </div>
          </div>
        )}
      </div>

      {/* WORKOUT TAB MODALS */}
      
      {/* Workout Preview Modal */}
      {showWorkoutPreview && (() => {
        const workout = Object.values(WORKOUT_TEMPLATES).find(w => w.id === showWorkoutPreview);
        if (!workout) return null;
        return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowWorkoutPreview(null)}><X size={24} color={COLORS.text} /></button>
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{workout.name}</h2>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: getWorkoutColor(workout.name, COLORS) + '15', border: `1px solid ${getWorkoutColor(workout.name, COLORS)}40` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={18} color={getWorkoutColor(workout.name, COLORS)} />
                  <span className="font-semibold" style={{ color: getWorkoutColor(workout.name, COLORS) }}>{workout.focus}</span>
                </div>
                <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>{workout.description}</p>
                <div className="flex flex-wrap gap-2">
                  {workout.goals.map((goal, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.surface, color: COLORS.text }}>
                      ✓ {goal}
                    </span>
                  ))}
                </div>
              </div>
              
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Exercises ({workout.exercises.length})</h3>
              <div className="space-y-3">
                {workout.exercises.map((exercise, i) => (
                  <div key={exercise.id} className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: getWorkoutColor(workout.name, COLORS) + '20' }}>
                        <span className="font-bold text-sm" style={{ color: getWorkoutColor(workout.name, COLORS) }}>{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.muscleGroup}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.sets} × {exercise.targetReps}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
              <button 
                onClick={() => { setShowWorkoutPreview(null); setShowActiveWorkout(true); }}
                className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ backgroundColor: getWorkoutColor(workout.name, COLORS), color: COLORS.text }}
              >
                Start This Workout <Play size={20} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Exercise Library Modal */}
      {showExerciseLibrary && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b" style={{ borderColor: COLORS.surfaceLight }}>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setShowExerciseLibrary(false)}><X size={24} color={COLORS.text} /></button>
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Exercise Library</h2>
            </div>
            <div className="relative mb-3">
              <Search size={18} color={COLORS.textMuted} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={exerciseSearchQuery}
                onChange={e => setExerciseSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none' }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Core'].map(group => (
                <button
                  key={group}
                  onClick={() => setExerciseFilterGroup(group)}
                  className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ 
                    backgroundColor: exerciseFilterGroup === group ? COLORS.primary : COLORS.surface,
                    color: exerciseFilterGroup === group ? COLORS.text : COLORS.textMuted
                  }}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {ALL_EXERCISES
                .filter(ex => {
                  const matchesSearch = ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase());
                  const matchesGroup = exerciseFilterGroup === 'All' || ex.muscleGroup.includes(exerciseFilterGroup);
                  return matchesSearch && matchesGroup;
                })
                .map((exercise, i) => (
                  <button 
                    key={i}
                    onClick={() => { setShowExerciseDetail(exercise.name); setShowExerciseLibrary(false); }}
                    className="w-full p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <div className="text-left">
                      <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.muscleGroup} • {exercise.equipment}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}>
                      {exercise.type}
                    </span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Workout History Modal */}
      {showWorkoutHistory && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowWorkoutHistory(false)}><X size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout History</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {workoutHistory.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { setShowWorkoutSummary(item); setShowWorkoutHistory(false); }}
                  className="w-full p-4 rounded-xl"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: getWorkoutColor(item.workout.name, COLORS) + '20' }}>
                        <Dumbbell size={18} color={getWorkoutColor(item.workout.name, COLORS)} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{item.workout.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{item.date}</p>
                      </div>
                    </div>
                    <Check size={18} color={COLORS.success} />
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                    <span style={{ color: COLORS.textSecondary }}>{item.duration} min</span>
                    <span style={{ color: COLORS.textSecondary }}>{item.exercises} exercises</span>
                    <span style={{ color: COLORS.text, fontWeight: 600 }}>{(item.totalVolume / 1000).toFixed(1)}k kg</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Personal Records Modal */}
      {showPersonalRecords && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowPersonalRecords(false)}><X size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Personal Records</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {personalRecords.map((pr, i) => (
                <button 
                  key={i}
                  onClick={() => { setShowExerciseDetail(pr.exercise); setShowPersonalRecords(false); }}
                  className="w-full p-4 rounded-xl"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '20' }}>
                        <Trophy size={18} color={COLORS.warning} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{pr.exercise}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{pr.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: COLORS.text }}>{pr.weight}kg</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>× {pr.reps} reps</p>
                    </div>
                  </div>
                  {pr.e1rm > 0 && (
                    <div className="mt-2 pt-2 border-t flex justify-between" style={{ borderColor: COLORS.surfaceLight }}>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>Estimated 1RM</span>
                      <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>{pr.e1rm}kg</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Workout Modal */}
      {showCustomWorkout && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowCustomWorkout(false)}><X size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Custom Workout</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="text-center py-12">
              <Edit3 size={48} color={COLORS.primary} className="mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Build Your Own</h3>
              <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
                Create a custom workout from scratch or modify an existing template.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => { setShowExerciseLibrary(true); setShowCustomWorkout(false); }}
                  className="w-full p-4 rounded-xl flex items-center gap-3"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <Plus size={20} color={COLORS.primary} />
                  <span style={{ color: COLORS.text }}>Start from scratch</span>
                </button>
                <button 
                  className="w-full p-4 rounded-xl flex items-center gap-3"
                  style={{ backgroundColor: COLORS.surface }}
                >
                  <Book size={20} color={COLORS.accent} />
                  <span style={{ color: COLORS.text }}>Copy from template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Selector Modal */}
      {showProgramSelector && (() => {
        // Calculate program end date
        const programStartDate = new Date(); // Would come from database in production
        const programEndDate = new Date(programStartDate);
        programEndDate.setDate(programEndDate.getDate() + (overviewStats.programLength * 7));
        const endDateStr = programEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const weeksRemaining = Math.max(0, overviewStats.programLength - overviewStats.programWeek);

        return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowProgramSelector(false)}><X size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Training Programs</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {/* Current Program Info */}
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.primary + '15', border: `1px solid ${COLORS.primary}40` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>CURRENT PROGRAM</span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                  Week {overviewStats.programWeek} of {overviewStats.programLength}
                </span>
              </div>
              <h3 className="font-bold mb-1" style={{ color: COLORS.text }}>{currentProgram.name || 'No Program'}</h3>
              <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.textMuted }}>
                <span>Ends: {endDateStr}</span>
                <span>{weeksRemaining} weeks remaining</span>
              </div>
            </div>

            {/* Next Program (for program cycling) */}
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>QUEUE NEXT PROGRAM</p>
              <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>
                Set up your next program to automatically start when your current one ends.
              </p>
              <button
                className="w-full py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}
              >
                + Add Next Program
              </button>
            </div>

            <p className="text-xs font-semibold mb-3" style={{ color: COLORS.textMuted }}>AVAILABLE PROGRAMS</p>
            <div className="space-y-3">
              {[
                { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'High volume split for maximum muscle growth', level: 'Intermediate', goal: 'build_muscle' },
                { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach with optimal recovery', level: 'All Levels', goal: 'build_muscle' },
                { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Efficient training for busy schedules', level: 'Beginner', goal: 'fitness' },
                { id: 'bro_split', name: 'Body Part Split', days: 5, weeks: 16, desc: 'One muscle group per day focus', level: 'Advanced', goal: 'build_muscle' },
                { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Powerlifting-style for max strength', level: 'Intermediate', goal: 'strength' },
                { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements', level: 'All Levels', goal: 'lose_fat' },
                { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'Speed, agility, and power focus', level: 'Intermediate', goal: 'athletic' },
              ].map(program => {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + (program.weeks * 7));
                const progEndStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                <button
                  key={program.id}
                  onClick={() => {
                    setCurrentProgram({ ...currentProgram, id: program.id, name: program.name, description: program.desc, daysPerWeek: program.days });
                    setShowProgramSelector(false);
                  }}
                  className="w-full p-4 rounded-xl text-left"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: currentProgram.id === program.id ? `2px solid ${COLORS.primary}` : '2px solid transparent'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold" style={{ color: COLORS.text }}>{program.name}</h4>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>
                      {program.weeks} weeks
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>{program.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: COLORS.primary }}>{program.level}</span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>• {program.days} days/week</span>
                    </div>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>Ends {progEndStr}</span>
                  </div>
                  {currentProgram.id === program.id && (
                    <div className="mt-2 flex items-center gap-1" style={{ color: COLORS.success }}>
                      <Check size={14} /> <span className="text-xs">Current Program</span>
                    </div>
                  )}
                </button>
              );
              })}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Full Schedule Modal */}
      {showFullSchedule && (() => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
        const getFirstDayOfMonth = (month, year) => {
          const day = new Date(year, month, 1).getDay();
          return (day + 6) % 7; // Convert to Monday=0 based
        };
        
        const daysInMonth = getDaysInMonth(fullScheduleMonth, fullScheduleYear);
        const firstDay = getFirstDayOfMonth(fullScheduleMonth, fullScheduleYear);
        
        return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowFullSchedule(false)}><X size={24} color={COLORS.text} /></button>
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Full Schedule</h2>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => {
                    if (fullScheduleMonth === 0) { setFullScheduleMonth(11); setFullScheduleYear(fullScheduleYear - 1); }
                    else setFullScheduleMonth(fullScheduleMonth - 1);
                  }}
                  className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}
                >
                  <ChevronLeft size={18} color={COLORS.text} />
                </button>
                <h3 className="font-bold" style={{ color: COLORS.text }}>{monthNames[fullScheduleMonth]} {fullScheduleYear}</h3>
                <button 
                  onClick={() => {
                    if (fullScheduleMonth === 11) { setFullScheduleMonth(0); setFullScheduleYear(fullScheduleYear + 1); }
                    else setFullScheduleMonth(fullScheduleMonth + 1);
                  }}
                  className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}
                >
                  <ChevronRight size={18} color={COLORS.text} />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-xs py-2" style={{ color: COLORS.textMuted }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {/* Days of month */}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const date = new Date(fullScheduleYear, fullScheduleMonth, day);
                  const dateKey = date.toISOString().split('T')[0];
                  const entry = masterSchedule[dateKey];
                  const isToday = fullScheduleYear === currentYear && fullScheduleMonth === currentMonth && day === today.getDate();
                  const isPast = date < today;

                  // Check if this date is before user's program start date
                  const isBeforeProgram = overviewStats.programStartDate && dateKey < overviewStats.programStartDate;

                  const getShortName = (workout) => {
                    if (!workout) return null;
                    const name = workout.name;
                    if (name.includes('Push')) return 'Push';
                    if (name.includes('Pull')) return 'Pull';
                    if (name.includes('Leg')) return 'Legs';
                    if (name.includes('Upper')) return 'Upper';
                    if (name.includes('Lower')) return 'Lower';
                    if (name.includes('Full')) return 'Full';
                    if (name.includes('Arm')) return 'Arms';
                    return name.split(' ')[0];
                  };

                  const shortName = isBeforeProgram ? null : getShortName(entry?.workout);
                  const isMissed = isPast && entry?.workout && !entry?.completed && !isBeforeProgram;

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (!isBeforeProgram && !isPast) {
                          setEditingScheduleDay({
                            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(date.getDay() + 6) % 7],
                            date: day,
                            month: fullScheduleMonth,
                            year: fullScheduleYear,
                            dateKey,
                            workout: entry?.workout || null,
                            completed: entry?.completed || false,
                            isToday,
                            isPast
                          });
                        }
                      }}
                      disabled={isBeforeProgram || isPast}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center p-1"
                      style={{
                        backgroundColor: isToday ? COLORS.primary + '30' : isBeforeProgram ? COLORS.surfaceLight : COLORS.surface,
                        border: isToday ? `2px solid ${COLORS.primary}` : 'none',
                        opacity: isBeforeProgram || (isPast && !entry?.completed) ? 0.5 : 1
                      }}
                    >
                      <span className="text-xs" style={{ color: isToday ? COLORS.primary : isBeforeProgram ? COLORS.textMuted : COLORS.text }}>{day}</span>
                      {isBeforeProgram ? (
                        <span className="text-xs mt-0.5" style={{ color: COLORS.textMuted, fontSize: '7px' }}>-</span>
                      ) : isMissed ? (
                        <span className="text-xs mt-0.5" style={{ color: COLORS.textMuted, fontSize: '7px' }}>Missed</span>
                      ) : shortName ? (
                        <span
                          className="text-xs font-semibold mt-0.5 truncate w-full text-center"
                          style={{ color: getWorkoutColor(shortName, COLORS), fontSize: '8px' }}
                        >
                          {shortName}
                        </span>
                      ) : (
                        <span className="text-xs mt-0.5" style={{ color: COLORS.textMuted, fontSize: '8px' }}>Rest</span>
                      )}
                      {entry?.completed && isPast && !isBeforeProgram && (
                        <Check size={8} color={COLORS.success} />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <p className="text-xs text-center mt-4" style={{ color: COLORS.textMuted }}>
                Tap any day to edit workout
              </p>
            </div>
          </div>
        );
      })()}

      {/* Schedule Day Editor Modal */}
      {editingScheduleDay && (() => {
        const editDate = new Date(editingScheduleDay.year, editingScheduleDay.month, editingScheduleDay.date);
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        editDate.setHours(0, 0, 0, 0);
        const isPastDate = editDate < todayStart;

        return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setEditingScheduleDay(null)}><X size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>
              {editingScheduleDay.day}, {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][editingScheduleDay.month]} {editingScheduleDay.date}
            </h2>
            {isPastDate && (
              <span className="text-xs px-2 py-1 rounded-full ml-auto" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}>
                Past
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {/* Current Workout */}
            <div className="mb-6">
              <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>{isPastDate ? 'WORKOUT' : 'CURRENT WORKOUT'}</p>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                {editingScheduleDay.workout ? (
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: getWorkoutColor(editingScheduleDay.workout.name, COLORS) + '20' }}
                    >
                      <Dumbbell size={24} color={getWorkoutColor(editingScheduleDay.workout.name, COLORS)} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>{editingScheduleDay.workout.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{editingScheduleDay.workout.focus}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <Moon size={24} color={COLORS.textMuted} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>Rest Day</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Recovery and restoration</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Change Workout - only for future/today */}
            {!isPastDate && (
              <div className="mb-6">
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>CHANGE TO</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setWorkoutForDay(editingScheduleDay.dateKey, null);
                      setEditingScheduleDay({ ...editingScheduleDay, workout: null });
                    }}
                    className="w-full p-3 rounded-xl flex items-center gap-3"
                    style={{
                      backgroundColor: !editingScheduleDay.workout ? COLORS.primary + '20' : COLORS.surface,
                      border: !editingScheduleDay.workout ? `2px solid ${COLORS.primary}` : '2px solid transparent'
                    }}
                  >
                    <Moon size={18} color={COLORS.textMuted} />
                    <span style={{ color: COLORS.text }}>Rest Day</span>
                  </button>
                  {Object.values(WORKOUT_TEMPLATES).map(workout => (
                    <button
                      key={workout.id}
                      onClick={() => {
                        setWorkoutForDay(editingScheduleDay.dateKey, workout);
                        setEditingScheduleDay({ ...editingScheduleDay, workout });
                      }}
                      className="w-full p-3 rounded-xl flex items-center gap-3"
                      style={{
                        backgroundColor: editingScheduleDay.workout?.id === workout.id ? COLORS.primary + '20' : COLORS.surface,
                        border: editingScheduleDay.workout?.id === workout.id ? `2px solid ${COLORS.primary}` : '2px solid transparent'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getWorkoutColor(workout.name, COLORS) + '20' }}
                      >
                        <Dumbbell size={14} color={getWorkoutColor(workout.name, COLORS)} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{workout.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{workout.focus}</p>
                      </div>
                      {editingScheduleDay.workout?.id === workout.id && (
                        <Check size={18} color={COLORS.primary} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Swap with Another Day - only for future/today */}
            {!isPastDate && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight size={14} color={COLORS.textMuted} />
                  <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>SWAP WITH NEARBY DAY</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[-3, -2, -1, 1, 2, 3].map(offset => {
                    const date = new Date(editingScheduleDay.year, editingScheduleDay.month, editingScheduleDay.date + offset);
                    const dateKey = date.toISOString().split('T')[0];
                    const entry = masterSchedule[dateKey];
                    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                    return (
                      <button
                        key={offset}
                        onClick={() => {
                          swapWorkoutDays(editingScheduleDay.dateKey, dateKey);
                          setEditingScheduleDay(null);
                        }}
                        className="flex-shrink-0 p-3 rounded-xl text-center"
                        style={{ backgroundColor: COLORS.surface, minWidth: '80px' }}
                      >
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{dayNames[(date.getDay() + 6) % 7]}</p>
                        <p className="font-bold" style={{ color: COLORS.text }}>{date.getDate()}</p>
                        {entry?.workout ? (
                          <p className="text-xs mt-1" style={{ color: getWorkoutColor(entry.workout.name, COLORS) }}>
                            {entry.workout.name.split(' ')[0]}
                          </p>
                        ) : (
                          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Rest</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past workout notice */}
            {isPastDate && (
              <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surfaceLight }}>
                <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
                  Past workouts cannot be rescheduled or changed.
                </p>
              </div>
            )}
          </div>
          <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
            <button
              onClick={() => setEditingScheduleDay(null)}
              className="w-full py-4 rounded-xl font-semibold"
              style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
            >
              Done
            </button>
          </div>
        </div>
        );
      })()}

      {/* Workout Summary Modal */}
      {showWorkoutSummary && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button onClick={() => setShowWorkoutSummary(null)}><X size={24} color={COLORS.text} /></button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Workout Summary</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: COLORS.success + '20' }}>
                <Check size={32} color={COLORS.success} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>{showWorkoutSummary.workout.name}</h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>{showWorkoutSummary.date}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{showWorkoutSummary.duration}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>minutes</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-2xl font-bold" style={{ color: COLORS.accent }}>{showWorkoutSummary.exercises}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>exercises</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{(showWorkoutSummary.totalVolume / 1000).toFixed(1)}k</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>kg volume</p>
              </div>
            </div>

            <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Exercises Completed</h4>
            <div className="space-y-2">
              {showWorkoutSummary.workout.exercises.map((ex, i) => (
                <div key={i} className="p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                      <Check size={14} color={COLORS.success} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{ex.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.muscleGroup}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{ex.sets} × {ex.targetReps}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.suggestedWeight}kg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {showExerciseDetail && (() => {
        const exerciseInfo = ALL_EXERCISES.find(e => e.name === showExerciseDetail);
        const pr = personalRecords.find(p => p.exercise === showExerciseDetail);
        return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
              <button onClick={() => setShowExerciseDetail(null)}><X size={24} color={COLORS.text} /></button>
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{showExerciseDetail}</h2>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {exerciseInfo && (
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>Muscle Group</span>
                    <span className="font-semibold" style={{ color: COLORS.text }}>{exerciseInfo.muscleGroup}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>Equipment</span>
                    <span className="font-semibold" style={{ color: COLORS.text }}>{exerciseInfo.equipment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>Type</span>
                    <span className="font-semibold capitalize" style={{ color: COLORS.text }}>{exerciseInfo.type}</span>
                  </div>
                </div>
              )}

              {pr && (
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.warning + '15', border: `1px solid ${COLORS.warning}40` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={18} color={COLORS.warning} />
                    <span className="font-semibold" style={{ color: COLORS.warning }}>Personal Record</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{pr.weight}kg × {pr.reps}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{pr.date}</p>
                    </div>
                    {pr.e1rm > 0 && (
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{pr.e1rm}kg</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>Est. 1RM</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Progress Chart</h4>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { week: 'W1', weight: 60 },
                      { week: 'W2', weight: 62.5 },
                      { week: 'W3', weight: 65 },
                      { week: 'W4', weight: 67.5 },
                      { week: 'W5', weight: 70 },
                      { week: 'W6', weight: pr?.weight || 72.5 },
                    ]}>
                      <XAxis dataKey="week" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: COLORS.surface, border: 'none', borderRadius: 8 }}
                        labelStyle={{ color: COLORS.text }}
                      />
                      <Line type="monotone" dataKey="weight" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <h4 className="font-semibold mt-4 mb-3" style={{ color: COLORS.text }}>Recent Sessions</h4>
              <div className="space-y-2">
                {[
                  { date: 'Jan 6', sets: '4×6', weight: pr?.weight || 70, volume: 1680 },
                  { date: 'Jan 3', sets: '4×6', weight: (pr?.weight || 70) - 2.5, volume: 1620 },
                  { date: 'Jan 1', sets: '4×5', weight: (pr?.weight || 70) - 5, volume: 1300 },
                ].map((session, i) => (
                  <div key={i} className="p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surface }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{session.date}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{session.sets} @ {session.weight}kg</p>
                    </div>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>{session.volume}kg vol</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Active Workout Screen - rendered at MainScreen level for access from all tabs */}
      {showActiveWorkout && <ActiveWorkoutScreen onClose={() => setShowActiveWorkout(false)} onComplete={completeTodayWorkout} COLORS={COLORS} availableTime={workoutTime} userGoal={userData.goal || 'build_muscle'} userId={user?.id} workoutName={todayWorkout?.name || 'Workout'} />}

      {/* Reschedule Modal - rendered at MainScreen level for access from all tabs */}
      {showReschedule && <RescheduleModal />}
      
      {/* Pause Plan Modal - rendered at MainScreen level for access from all tabs */}
      {showPausePlan && <PausePlanModal />}

      {/* Full Meal Entry Modal */}
      {showAddMealFull && (
        <FullMealEntryModal 
          COLORS={COLORS}
          onClose={() => setShowAddMealFull(false)}
          onSave={(meal) => {
            setMealLog(prev => [...prev, meal]);
            setCaloriesIntake(prev => prev + meal.calories);
            setProteinIntake(prev => prev + meal.protein);
            setCarbsIntake(prev => prev + meal.carbs);
            setFatsIntake(prev => prev + meal.fats);
            setShowAddMealFull(false);
          }}
        />
      )}

      <div className="flex justify-around py-2 border-t" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.surfaceLight }}>
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
          { id: 'friends', icon: Users, label: 'Friends' },
          { id: 'nutrition', icon: Apple, label: 'Nutrition' },
          { id: 'progress', icon: BarChart3, label: 'Progress' },
          { id: 'profile', icon: User, label: 'Profile' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-0.5">
            <tab.icon size={18} color={activeTab === tab.id ? COLORS.primary : COLORS.textMuted} />
            <span style={{ fontSize: 9, color: activeTab === tab.id ? COLORS.primary : COLORS.textMuted }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="w-full max-w-md mx-auto h-screen flex flex-col items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <Loader2 size={48} color={COLORS.primary} className="animate-spin mb-4" />
        <p style={{ color: COLORS.textSecondary }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col" style={{ backgroundColor: COLORS.background }}>
      <div className="flex-1 overflow-hidden relative">
        {currentScreen === 'welcome' && <WelcomeScreen />}
        {currentScreen === 'login' && <LoginScreen onBack={() => setCurrentScreen('welcome')} onLogin={() => setCurrentScreen('main')} COLORS={COLORS} />}
        {currentScreen === 'register' && <RegisterScreen onBack={() => setCurrentScreen('welcome')}
          onRegister={(data) => { setUserData(p => ({...p, ...data})); setCurrentScreen('onboarding'); }} COLORS={COLORS} />}
        {currentScreen === 'dashboard' && <DashboardScreen />}
        {currentScreen === 'onboarding' && <OnboardingScreen />}
        {currentScreen === 'main' && <MainScreen />}
      </div>
    </div>
  );
}
