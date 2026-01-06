import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight, ChevronLeft, Check, Plus, Minus, Play, X, Droplets, Moon, TrendingUp, TrendingDown, User, Home, Dumbbell, Apple, BarChart3, Trophy, Flame, Clock, Target, Info, Calendar, AlertCircle, Zap, Coffee, Utensils, ChevronDown, ChevronUp, Eye, Undo2, Search, Book, History, Award, Edit3, Filter, ArrowLeftRight, GripVertical, Users, Heart, MessageCircle, Share2, Crown, Medal, Loader2, Settings } from 'lucide-react';
import { useAuth } from './src/contexts/AuthContext';
import { workoutService } from './src/services/workoutService';
import { sleepService } from './src/services/sleepService';
import { streakService } from './src/services/streakService';
import { nutritionService } from './src/services/nutritionService';
import { profileService } from './src/services/profileService';
import { injuryService } from './src/services/injuryService';
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

// Suggested supplements with reasons
const SUGGESTED_SUPPLEMENTS = [
  {
    id: 'creatine',
    name: 'Creatine Monohydrate',
    dosage: '5 g',
    reasons: [
      'Most researched supplement for muscle & strength',
      'Improves high-intensity exercise performance',
      'Safe for long-term daily use',
      'Supports brain health and cognitive function',
    ],
    forGoals: ['all'], // Show to everyone
  },
];

// Experience levels - expanded from 3 to 4 tiers
const EXPERIENCE_LEVELS = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    desc: 'New to lifting (0-6 months)',
    icon: '🌱',
    showHeadSpecificity: false,
    workoutComplexity: 'basic',
  },
  novice: {
    id: 'novice',
    label: 'Novice',
    desc: 'Learning the basics (6-18 months)',
    icon: '📈',
    showHeadSpecificity: false,
    workoutComplexity: 'basic',
  },
  experienced: {
    id: 'experienced',
    label: 'Experienced',
    desc: 'Consistent training (1.5-4 years)',
    icon: '💪',
    showHeadSpecificity: true,
    workoutComplexity: 'advanced',
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    desc: 'Advanced lifter (4+ years)',
    icon: '🏆',
    showHeadSpecificity: true,
    workoutComplexity: 'advanced',
  },
};

// Muscle head mappings for advanced users
const MUSCLE_HEAD_MAPPINGS = {
  'Biceps': ['Long Head Biceps', 'Short Head Biceps'],
  'Triceps': ['Long Head Triceps', 'Lateral Head Triceps', 'Medial Head Triceps'],
  'Back': ['Upper Back', 'Mid Back', 'Lower Back'],
  'Quads': ['Vastus Lateralis', 'Vastus Medialis', 'Rectus Femoris'],
  'Hamstrings': ['Bicep Femoris', 'Semitendinosus'],
  'Glutes': ['Gluteus Maximus', 'Gluteus Medius'],
  // Already have specificity:
  // Shoulders -> Front Delts, Side Delts, Rear Delts
  // Chest -> Upper Chest, Lower Chest, Chest
};

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

// Map goals to recommended programs - program is auto-selected based on user's goal
const GOAL_TO_PROGRAM = {
  bulk: { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'High volume split for maximum muscle growth' },
  build_muscle: { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach with optimal recovery' },
  strength: { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Powerlifting-style for max strength' },
  recomp: { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Balanced approach for body recomposition' },
  fitness: { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Efficient training for overall fitness' },
  athletic: { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'Speed, agility, and power focus' },
  lean: { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements' },
  lose_fat: { id: 'fat_loss', name: 'Fat Loss Circuit', days: 4, weeks: 8, desc: 'High intensity with cardio elements' },
};

// Suggested next programs based on current program completion
const NEXT_PROGRAM_SUGGESTIONS = {
  ppl: [
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Build on your muscle with raw strength', reason: 'Great for converting muscle gains to strength' },
    { id: 'fat_loss_cut', name: 'Cutting Phase', days: 5, weeks: 8, desc: 'Reveal your hard-earned muscle', reason: 'Time to shred and show off your gains' },
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'More recovery, continued growth', reason: 'Allows recovery while maintaining gains' },
  ],
  upper_lower: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Increase volume for more growth', reason: 'Take your gains to the next level' },
    { id: 'fat_loss_cut', name: 'Cutting Phase', days: 4, weeks: 10, desc: 'Define your physique', reason: 'Reveal the muscle you\'ve built' },
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Focus on getting stronger', reason: 'Convert your muscle to strength' },
  ],
  strength: [
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Add muscle to your frame', reason: 'Build muscle on your strength base' },
    { id: 'fat_loss_cut', name: 'Cutting Phase', days: 4, weeks: 8, desc: 'Get lean and defined', reason: 'Show off your strength with less body fat' },
    { id: 'athlete', name: 'Athletic Performance', days: 5, weeks: 12, desc: 'Apply your strength athletically', reason: 'Develop power and explosiveness' },
  ],
  full_body: [
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Progress to a split routine', reason: 'More volume per muscle group' },
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Maximize your training', reason: 'For serious muscle building' },
  ],
  fat_loss: [
    { id: 'upper_lower', name: 'Upper/Lower', days: 4, weeks: 16, desc: 'Build lean muscle', reason: 'Now focus on building muscle' },
    { id: 'full_body', name: 'Full Body', days: 3, weeks: 12, desc: 'Maintain with less time', reason: 'Efficient maintenance training' },
  ],
  athlete: [
    { id: 'strength', name: 'Strength Focus', days: 4, weeks: 12, desc: 'Maximize your strength', reason: 'Build a stronger foundation' },
    { id: 'ppl', name: 'Push/Pull/Legs', days: 6, weeks: 12, desc: 'Add muscle mass', reason: 'Increase your power potential' },
  ],
};

// Break duration options between programs
const BREAK_OPTIONS = [
  { id: '1week', label: '1 Week', days: 7, desc: 'Quick refresh' },
  { id: '2weeks', label: '2 Weeks', days: 14, desc: 'Standard deload' },
  { id: '1month', label: '1 Month', days: 30, desc: 'Full recovery' },
];

// Exercise instructions - step by step guides for each exercise
const EXERCISE_INSTRUCTIONS = {
  // CHEST
  'Barbell Bench Press': {
    setup: ['Lie flat on the bench with your eyes under the bar', 'Plant your feet firmly on the floor', 'Grip the bar slightly wider than shoulder width', 'Arch your upper back slightly, squeeze shoulder blades together', 'Unrack the bar with arms fully extended'],
    execution: ['Lower the bar slowly to your mid-chest', 'Keep elbows at about 45 degrees from your body', 'Touch your chest lightly (don\'t bounce)', 'Press the bar back up in a slight arc toward your face', 'Lock out your arms at the top'],
    tips: ['Grip width affects emphasis: wider = more chest, narrower = more triceps', 'The bar should touch your chest at nipple line or slightly below', 'If your shoulders hurt, try a slightly narrower grip or reduce arch']
  },
  'Dumbbell Bench Press': {
    setup: ['Sit on the bench with dumbbells on your thighs', 'Lie back and use your knees to help lift dumbbells to chest level', 'Position dumbbells at chest height, palms facing forward', 'Plant feet firmly on the floor'],
    execution: ['Press dumbbells up until arms are extended', 'Bring dumbbells together at the top (don\'t clang them)', 'Lower slowly with control to chest level', 'Keep elbows at 45 degrees from your body'],
    tips: ['Dumbbells allow deeper stretch than barbell - use it for more muscle activation', 'Rotate palms inward at top for extra chest squeeze', 'Stabilizer muscles work harder here - expect to lift 15-20% less than barbell']
  },
  'Incline Barbell Press': {
    setup: ['Set bench to 30-45 degree incline', 'Lie back with eyes under the bar', 'Grip slightly wider than shoulder width', 'Unrack with arms fully extended'],
    execution: ['Lower bar to upper chest (just below collarbone)', 'Keep elbows at 45 degrees', 'Press back up to starting position', 'Lock out at the top'],
    tips: ['30 degrees targets upper chest best - 45 degrees shifts more to front delts', 'If you feel it more in shoulders, lower the incline angle', 'Touch point should be higher on chest than flat bench']
  },
  'Incline Dumbbell Press': {
    setup: ['Set bench to 30-45 degree incline', 'Sit with dumbbells on thighs, lie back', 'Position dumbbells at upper chest level', 'Feet flat on floor'],
    execution: ['Press dumbbells up and slightly together', 'Lower with control to upper chest', 'Keep elbows at 45 degrees throughout', 'Full range of motion - stretch at bottom'],
    tips: ['Angle dumbbells slightly inward to maximize upper chest contraction', 'Go lighter than flat bench - upper chest is a smaller muscle', 'This is arguably the best upper chest builder - prioritize it if lagging']
  },
  'Cable Fly': {
    setup: ['Set pulleys to shoulder height or slightly above', 'Grab handles and step forward into a staggered stance', 'Start with arms out wide, slight bend in elbows', 'Lean slightly forward from the hips'],
    execution: ['Bring hands together in a hugging motion', 'Squeeze your chest at the center', 'Slowly return to the starting position', 'Maintain the slight bend in elbows throughout'],
    tips: ['High cables target lower chest, low cables target upper chest', 'Cross hands over each other at the end for extra squeeze', 'This is an isolation move - save it for after your heavy pressing']
  },
  'Push Ups': {
    setup: ['Place hands slightly wider than shoulder width', 'Extend legs back, balance on toes', 'Body should form a straight line from head to heels', 'Engage your core'],
    execution: ['Lower your body until chest nearly touches floor', 'Keep elbows at 45 degrees from body', 'Push back up to starting position', 'Lock out arms at top'],
    tips: ['Elevate feet on a bench to make it harder and target upper chest', 'Diamond hand position shifts focus to triceps', 'If too easy, try pause reps or add a weight vest']
  },
  'Dips': {
    setup: ['Grip parallel bars and lift yourself up', 'Arms fully extended, shoulders down', 'Lean slightly forward for chest focus', 'Cross ankles if needed for stability'],
    execution: ['Lower your body by bending elbows', 'Go down until upper arms are parallel to floor', 'Push back up to starting position', 'Don\'t lock out aggressively at top'],
    tips: ['More forward lean = chest focus, upright = triceps focus', 'Stop at parallel if you have shoulder issues', 'Add weight with a dip belt once bodyweight becomes easy']
  },
  // BACK
  'Barbell Row': {
    setup: ['Stand with feet shoulder width apart', 'Hinge at hips, keep back flat', 'Grip bar slightly wider than shoulder width', 'Let bar hang at arm\'s length'],
    execution: ['Pull bar to lower chest/upper abs', 'Drive elbows back, squeeze shoulder blades', 'Lower bar with control', 'Keep torso angle constant throughout'],
    tips: ['Pull to lower chest for lats, pull higher for upper back/traps', 'Underhand grip increases bicep involvement and allows more lat stretch', 'Your torso angle determines difficulty - more upright = easier']
  },
  'Pull Ups': {
    setup: ['Grip bar slightly wider than shoulder width', 'Hang with arms fully extended', 'Engage your lats before pulling', 'Cross ankles if desired'],
    execution: ['Pull yourself up until chin clears the bar', 'Drive elbows down and back', 'Lower yourself with control', 'Full extension at the bottom'],
    tips: ['Wider grip emphasizes lats, closer grip hits mid-back more', 'Add weight with a belt once you can do 10+ clean reps', 'Can\'t do one? Start with negatives - jump up and lower slowly']
  },
  'Lat Pulldown': {
    setup: ['Sit at the machine, secure thighs under pads', 'Grip bar wider than shoulder width', 'Lean back slightly from the hips', 'Arms fully extended at start'],
    execution: ['Pull bar down to upper chest', 'Drive elbows down and slightly back', 'Squeeze your lats at the bottom', 'Slowly return to start position'],
    tips: ['Behind-the-neck pulldowns are not recommended - injury risk for minimal benefit', 'Try different grip attachments - each hits your back differently', 'Imagine pulling with your elbows, not your hands']
  },
  'Seated Cable Row': {
    setup: ['Sit at the machine, feet on footpads', 'Knees slightly bent', 'Grasp the handle with both hands', 'Sit upright with slight forward lean'],
    execution: ['Pull handle to your lower chest/upper abs', 'Drive elbows straight back', 'Squeeze shoulder blades together at end', 'Slowly extend arms back to start'],
    tips: ['V-bar grip targets mid-back, wide bar hits lats more', 'Let your shoulders protract forward at the stretch - increases range of motion', 'Don\'t lean back excessively - this becomes a lower back exercise']
  },
  'Deadlift': {
    setup: ['Stand with feet hip-width apart, bar over mid-foot', 'Bend at hips and knees to grip bar', 'Hands just outside knees, mixed or overhand grip', 'Chest up, back flat, shoulders over the bar'],
    execution: ['Drive through your heels to stand up', 'Keep the bar close to your body', 'Stand tall at the top, squeeze glutes', 'Lower by hinging at hips first, then bend knees'],
    tips: ['Mixed grip prevents bar rolling but can cause imbalances - switch hands or use straps', 'Wear flat shoes or go barefoot - running shoes are unstable', 'This is the most taxing exercise - save it for when you\'re fresh']
  },
  'Dumbbell Row': {
    setup: ['Place one knee and hand on bench', 'Keep back flat and parallel to floor', 'Hold dumbbell in opposite hand, arm hanging', 'Feet staggered for balance'],
    execution: ['Pull dumbbell to your hip/lower rib', 'Drive elbow up and back', 'Squeeze your lat at the top', 'Lower with control'],
    tips: ['Pulling to hip hits lats more, pulling to chest hits upper back', 'Let the dumbbell hang low and stretch your lat between reps', 'You can go heavier here than most back exercises - lats are strong']
  },
  'Face Pull': {
    setup: ['Set cable to face height', 'Use rope attachment', 'Step back to create tension', 'Arms extended in front'],
    execution: ['Pull the rope toward your face', 'Separate hands and pull to ears', 'Squeeze shoulder blades together', 'Slowly return to start'],
    tips: ['External rotate at the end - thumbs should point behind you', 'This is a rear delt and rotator cuff exercise - keep it light', 'Do these regularly for shoulder health - especially if you bench a lot']
  },
  // SHOULDERS
  'Overhead Press': {
    setup: ['Stand with feet shoulder width apart', 'Grip bar just outside shoulder width', 'Bar rests on front delts/upper chest', 'Elbows slightly in front of bar'],
    execution: ['Press bar straight up overhead', 'Move your head back slightly as bar passes', 'Lock out arms at the top', 'Lower bar with control to starting position'],
    tips: ['Strict form builds more muscle - save push press for strength goals', 'Narrower grip = more front delt, wider = more side delt', 'If lower back arches excessively, sit down or brace harder']
  },
  'Lateral Raises': {
    setup: ['Stand with feet hip width apart', 'Hold dumbbells at your sides', 'Slight bend in elbows', 'Lean very slightly forward'],
    execution: ['Raise arms out to the sides', 'Lift until arms are parallel to floor', 'Lead with your elbows, not hands', 'Lower with control'],
    tips: ['Tilt the dumbbells like you\'re pouring water - pinky higher than thumb', 'Going heavier usually means worse form - this is a finesse exercise', 'Side delts respond well to high volume - 15-20 reps work great']
  },
  'Front Raises': {
    setup: ['Stand with feet shoulder width apart', 'Hold dumbbells in front of thighs', 'Palms facing your body', 'Slight bend in elbows'],
    execution: ['Raise one or both arms straight in front', 'Lift to shoulder height', 'Lower with control', 'Alternate arms or do both together'],
    tips: ['Front delts get hit by all pressing movements - you may not need these', 'Thumbs up position is easier on shoulders than palms down', 'If doing these, do them after your pressing work']
  },
  'Rear Delt Fly': {
    setup: ['Bend over at hips until torso is nearly parallel to floor', 'Hold dumbbells hanging below chest', 'Slight bend in elbows', 'Keep back flat'],
    execution: ['Raise arms out to sides in an arc', 'Squeeze shoulder blades together at top', 'Lower with control', 'Maintain bent-over position'],
    tips: ['Rear delts are often neglected - train them as much as front/side delts', 'Face pulls and rows also hit rear delts - count those in your volume', 'Try the reverse pec deck machine for a more stable alternative']
  },
  // ARMS - BICEPS
  'Barbell Curl': {
    setup: ['Stand with feet shoulder width apart', 'Grip barbell at shoulder width', 'Arms fully extended, bar at thighs', 'Elbows close to your sides'],
    execution: ['Curl the bar up toward your shoulders', 'Keep elbows stationary at your sides', 'Squeeze biceps at the top', 'Lower with control'],
    tips: ['EZ bar is easier on wrists - straight bar hits biceps slightly differently', 'Strict form with controlled tempo builds more muscle than heavy cheating', 'Narrower grip emphasizes outer bicep (long head), wider grip hits inner']
  },
  'Dumbbell Curl': {
    setup: ['Stand or sit with dumbbells at sides', 'Palms facing forward', 'Arms fully extended', 'Elbows close to body'],
    execution: ['Curl dumbbells up toward shoulders', 'Can alternate arms or do both together', 'Squeeze at the top', 'Lower with control'],
    tips: ['Supinating (rotating pinky up) during the curl increases bicep activation', 'Incline bench curls put biceps in stretched position - great for growth', 'Alternating allows you to focus on each arm individually']
  },
  'Hammer Curl': {
    setup: ['Stand with dumbbells at sides', 'Palms facing each other (neutral grip)', 'Arms fully extended', 'Feet shoulder width apart'],
    execution: ['Curl dumbbells up keeping neutral grip', 'Bring dumbbells to shoulder level', 'Squeeze at the top', 'Lower with control'],
    tips: ['Builds brachialis (under bicep) which pushes bicep up for better peak', 'Also strengthens forearms significantly', 'Cross-body hammer curls emphasize brachialis even more']
  },
  'Preacher Curl': {
    setup: ['Sit at preacher bench', 'Rest upper arms flat on the pad', 'Grip barbell or dumbbells', 'Arms extended but not locked'],
    execution: ['Curl weight up toward shoulders', 'Keep upper arms pressed into pad', 'Squeeze biceps at top', 'Lower slowly - this is where growth happens'],
    tips: ['The stretch at the bottom is what makes this exercise special - control it', 'Don\'t fully lock out at bottom - keeps tension on biceps', 'Great for building the lower part of the bicep near elbow']
  },
  'Cable Curl': {
    setup: ['Set cable to lowest position', 'Stand facing the machine', 'Grip bar or rope attachment', 'Arms extended, slight forward lean'],
    execution: ['Curl handle up toward shoulders', 'Keep elbows stationary', 'Squeeze at the top', 'Slowly return to start'],
    tips: ['Cables provide constant tension throughout - dumbbells lose tension at top', 'Try high cable curls facing away for an incredible peak contraction', 'Great finisher after heavy barbell/dumbbell work']
  },
  // ARMS - TRICEPS
  'Tricep Pushdowns': {
    setup: ['Set cable to high position', 'Grip bar or rope attachment', 'Elbows pinned to sides', 'Start with forearms parallel to floor'],
    execution: ['Push handle down until arms are straight', 'Squeeze triceps at the bottom', 'Slowly return to starting position', 'Don\'t let elbows flare out'],
    tips: ['Rope allows you to split at the bottom for extra contraction', 'Straight bar allows more weight - use both in your program', 'Reverse grip (underhand) emphasizes the medial head more']
  },
  'Overhead Tricep Extension': {
    setup: ['Stand or sit with dumbbell or cable overhead', 'Arms extended above head', 'Grip dumbbell with both hands or use rope', 'Elbows pointing forward'],
    execution: ['Lower weight behind your head by bending elbows', 'Keep upper arms stationary and close to head', 'Extend arms back to starting position', 'Squeeze triceps at the top'],
    tips: ['This exercise stretches the long head - essential for complete tricep development', 'The long head makes up 2/3 of your tricep - prioritize overhead work', 'Cable version provides constant tension throughout the movement']
  },
  'Skull Crushers': {
    setup: ['Lie on bench with barbell or dumbbells', 'Arms extended straight up', 'Grip shoulder width or narrower', 'Feet flat on floor'],
    execution: ['Bend elbows to lower weight toward forehead', 'Keep upper arms stationary', 'Extend arms back to start', 'Don\'t lock out aggressively'],
    tips: ['Lowering behind your head (not to forehead) stretches long head more', 'EZ bar is easier on wrists than straight bar', 'If elbows hurt, switch to cable overhead extensions']
  },
  'Close Grip Bench Press': {
    setup: ['Lie on bench like regular bench press', 'Grip bar with hands shoulder width or narrower', 'Unrack with arms extended', 'Keep elbows close to body'],
    execution: ['Lower bar to lower chest', 'Keep elbows tucked close to sides', 'Press back up to starting position', 'Lock out at the top'],
    tips: ['This is the best heavy tricep exercise - you can load it heavy', 'Shoulder width grip is fine - too narrow stresses wrists', 'Great to superset with regular bench press']
  },
  // LEGS - QUADS
  'Squat': {
    setup: ['Bar on upper back (high bar) or rear delts (low bar)', 'Feet shoulder width apart, toes slightly out', 'Chest up, core braced', 'Take a breath and hold'],
    execution: ['Push hips back and bend knees', 'Descend until thighs are at least parallel', 'Keep knees tracking over toes', 'Drive up through your heels'],
    tips: ['High bar is more quad dominant, low bar is more hip/glute dominant', 'Squat shoes with raised heel allow deeper squats and more quad activation', 'Breathing and bracing is crucial - take a big breath before each rep']
  },
  'Leg Press': {
    setup: ['Sit in machine with back flat against pad', 'Feet shoulder width on platform', 'Toes slightly pointed out', 'Release safety handles'],
    execution: ['Lower platform by bending knees', 'Go until knees are at 90 degrees or more', 'Press through heels to extend legs', 'Don\'t lock out knees completely'],
    tips: ['High and wide foot placement targets glutes and hamstrings more', 'Low and narrow targets quads more - experiment with positions', 'This is safer than squats for going to failure']
  },
  'Leg Extension': {
    setup: ['Sit in machine with back against pad', 'Adjust pad to sit on lower shins', 'Grip handles for stability', 'Feet slightly flexed'],
    execution: ['Extend legs until straight', 'Squeeze quads hard at the top', 'Lower with control', 'Don\'t let weight stack touch'],
    tips: ['Point toes outward to emphasize inner quad (VMO)', 'Point toes inward to emphasize outer quad', 'Great for pre-exhaust before squats or finishing quads after']
  },
  'Lunges': {
    setup: ['Stand with feet hip width apart', 'Hold dumbbells at sides or barbell on back', 'Core engaged', 'Look straight ahead'],
    execution: ['Step forward with one leg', 'Lower until both knees are at 90 degrees', 'Push through front heel to return', 'Alternate legs or do all reps on one side'],
    tips: ['Shorter steps emphasize quads, longer steps hit glutes more', 'Walking lunges are more functional, stationary are more quad-focused', 'Reverse lunges are easier on knees than forward lunges']
  },
  'Bulgarian Split Squat': {
    setup: ['Stand about 2 feet in front of a bench', 'Place one foot on bench behind you', 'Hold dumbbells at sides', 'Most of weight on front foot'],
    execution: ['Lower your body by bending front knee', 'Descend until front thigh is parallel to floor', 'Push through front heel to stand', 'Complete all reps then switch legs'],
    tips: ['Leaning forward targets glutes more, upright targets quads more', 'This builds single-leg strength and fixes imbalances', 'Start with bodyweight to learn balance before adding weight']
  },
  // LEGS - HAMSTRINGS
  'Romanian Deadlift': {
    setup: ['Hold barbell or dumbbells in front of thighs', 'Feet hip width apart', 'Slight bend in knees (keep this constant)', 'Shoulders back, chest up'],
    execution: ['Hinge at hips, pushing them back', 'Lower weight along legs until you feel hamstring stretch', 'Keep back flat throughout', 'Drive hips forward to stand'],
    tips: ['This is a hip hinge, not a squat - knees barely bend', 'Go only as low as your hamstring flexibility allows with flat back', 'Squeeze glutes at the top but don\'t hyperextend your back']
  },
  'Leg Curl': {
    setup: ['Lie face down on leg curl machine', 'Pad should be on lower calves', 'Grip handles for stability', 'Legs fully extended'],
    execution: ['Curl your heels toward your glutes', 'Squeeze hamstrings at the top', 'Lower with control', 'Don\'t let weight stack touch'],
    tips: ['Pointing toes down (plantarflexion) increases hamstring activation', 'Lying curls hit the lateral hamstring more than seated', 'Don\'t let your hips lift - this is cheating']
  },
  'Seated Leg Curl': {
    setup: ['Sit with back against pad', 'Adjust leg pad to sit above your heels', 'Grip handles', 'Legs extended in front'],
    execution: ['Curl your heels down and back', 'Squeeze hamstrings at the bottom', 'Return with control', 'Don\'t use momentum'],
    tips: ['Seated position pre-stretches hamstrings at the hip for more range', 'This hits the medial hamstrings more than lying version', 'Great to superset with leg extensions']
  },
  // LEGS - GLUTES
  'Hip Thrust': {
    setup: ['Sit on floor with upper back against bench', 'Roll barbell over hips (use pad)', 'Feet flat on floor, hip width apart', 'Knees bent at 90 degrees'],
    execution: ['Drive through heels to lift hips', 'Squeeze glutes hard at the top', 'Lower with control', 'Don\'t hyperextend at the top'],
    tips: ['This is the king of glute exercises - prioritize it if glute growth is a goal', 'Wider stance hits outer glutes, narrower hits more inner glutes', 'Feet further out targets more hamstring, closer hits more quads']
  },
  'Glute Bridge': {
    setup: ['Lie on back, knees bent', 'Feet flat on floor, hip width apart', 'Arms at sides for stability', 'Weight on heels'],
    execution: ['Push through heels to lift hips', 'Squeeze glutes at the top', 'Lower with control', 'Don\'t let lower back hyperextend'],
    tips: ['Great warmup exercise before squats or hip thrusts', 'Single leg version is great for fixing glute imbalances', 'If you feel it in hamstrings, move feet closer to body']
  },
  'Cable Kickback': {
    setup: ['Attach ankle strap to low cable', 'Face the machine, hold for support', 'Stand on one leg', 'Slight bend in standing leg'],
    execution: ['Kick working leg straight back', 'Squeeze glute at the top', 'Return with control', 'Complete all reps then switch legs'],
    tips: ['Keep your hips square - don\'t rotate to kick higher', 'Small range of motion with perfect squeeze beats big swinging kicks', 'This isolates glutes - do it after heavy compound movements']
  },
  // CORE
  'Plank': {
    setup: ['Get in push-up position', 'Lower to forearms', 'Body forms straight line from head to heels', 'Core engaged, glutes squeezed'],
    execution: ['Hold this position', 'Don\'t let hips sag or pike up', 'Breathe normally', 'Maintain neutral spine'],
    tips: ['Once you can hold 60 seconds, add difficulty instead of time', 'Try weighted planks, plank reaches, or ab wheel for progression', 'Squeeze your glutes - most people forget this and sag']
  },
  'Crunches': {
    setup: ['Lie on back, knees bent', 'Feet flat on floor', 'Hands behind head or across chest', 'Lower back pressed into floor'],
    execution: ['Curl shoulders off the floor', 'Squeeze abs at the top', 'Lower with control', 'Don\'t pull on your neck'],
    tips: ['Think about bringing your ribs to your pelvis, not just sitting up', 'If your neck hurts, place tongue on roof of mouth - sounds weird, works', 'Cable crunches are more progressive - easier to add weight']
  },
  'Hanging Leg Raise': {
    setup: ['Hang from pull-up bar', 'Arms fully extended', 'Legs straight down', 'Core engaged'],
    execution: ['Raise legs until parallel to floor (or higher)', 'Control the movement, don\'t swing', 'Lower with control', 'Keep legs as straight as possible'],
    tips: ['Curling pelvis up at top increases lower ab activation significantly', 'If you swing, you\'re using momentum - slow down', 'Bring legs all the way to the bar for the hardest version']
  },
  'Russian Twist': {
    setup: ['Sit on floor with knees bent', 'Lean back slightly, feet can be on floor or elevated', 'Hold weight at chest', 'Keep back straight'],
    execution: ['Rotate torso to one side', 'Touch weight to floor beside hip', 'Rotate to other side', 'Control the movement'],
    tips: ['Keep the weight close to your body - extending arms makes it harder', 'Feet elevated increases difficulty significantly', 'This trains rotational core strength - important for sports and daily life']
  },
  'Cable Crunch': {
    setup: ['Kneel facing cable machine', 'Hold rope attachment behind head', 'Start with torso upright', 'Keep hips stationary'],
    execution: ['Crunch down, bringing elbows toward knees', 'Focus on flexing your spine', 'Squeeze abs at the bottom', 'Return with control'],
    tips: ['Hips shouldn\'t move - if they do, you\'re just bowing, not crunching', 'This is one of the few ab exercises you can progressively overload', 'Great for building thicker, more visible abs']
  },
  // CALVES
  'Standing Calf Raise': {
    setup: ['Stand on calf raise machine or step', 'Balls of feet on platform, heels hanging off', 'Legs straight', 'Hold onto supports for balance'],
    execution: ['Rise up onto toes as high as possible', 'Squeeze calves at the top', 'Lower heels below platform for stretch', 'Control the negative'],
    tips: ['Straight legs emphasize gastrocnemius (the visible calf muscle)', '2-second pause at top and full stretch at bottom is key', 'Calves respond well to high reps - try sets of 15-20']
  },
  'Seated Calf Raise': {
    setup: ['Sit at seated calf machine', 'Knees under pad', 'Balls of feet on platform', 'Heels hanging off'],
    execution: ['Push through balls of feet', 'Raise heels as high as possible', 'Lower with control for full stretch', 'Squeeze at the top'],
    tips: ['Bent knee position targets soleus (under the gastrocnemius)', 'The soleus gives your calf width when viewed from the front', 'Do both seated and standing for complete calf development']
  },
  // ADDITIONAL CHEST EXERCISES
  'Decline Bench Press': {
    setup: ['Set bench to 15-30 degree decline', 'Secure feet under pads', 'Lie back and grip bar slightly wider than shoulders', 'Unrack with arms extended'],
    execution: ['Lower bar to lower chest with control', 'Keep elbows at 45 degrees', 'Press back up to starting position', 'Lock out at the top'],
    tips: ['Targets lower chest fibers that flat bench misses', 'Don\'t go too steep - 15-30 degrees is optimal', 'Blood rushing to head is normal but don\'t stay inverted too long']
  },
  'Machine Chest Press': {
    setup: ['Adjust seat height so handles are at mid-chest', 'Sit with back flat against pad', 'Grip handles with palms facing down', 'Plant feet firmly on floor'],
    execution: ['Press handles forward until arms extended', 'Squeeze chest at the end', 'Return slowly to starting position', 'Keep shoulder blades retracted'],
    tips: ['Great for beginners or as a finishing exercise after free weights', 'The fixed path means safer failure - push to true failure here', 'Adjust seat height to change emphasis: lower = lower chest, higher = upper']
  },
  'Incline Cable Fly': {
    setup: ['Set bench to 30-45 degree incline between cable stations', 'Low pulley position', 'Grab handles, lie back on bench', 'Start with arms out wide, slight elbow bend'],
    execution: ['Bring hands together in arc over upper chest', 'Squeeze and hold at the top', 'Lower with control back to starting position', 'Maintain constant tension'],
    tips: ['Excellent upper chest isolation with constant cable tension', 'The low-to-high angle maximizes upper chest activation', 'Go lighter than dumbbell flies - the constant tension makes it harder']
  },
  'Pec Deck': {
    setup: ['Adjust seat so handles are at chest height', 'Sit with back flat against pad', 'Place forearms on pads or grip handles', 'Start with arms open wide'],
    execution: ['Bring arms together in front of chest', 'Squeeze and hold briefly at the center', 'Return slowly to starting position', 'Keep slight bend in elbows'],
    tips: ['Fixed machine path allows you to focus purely on the squeeze', 'The stretched position is where most chest growth happens - control it', 'Great finisher after heavy pressing movements']
  },
  'Dumbbell Fly': {
    setup: ['Lie flat on bench with dumbbells above chest', 'Arms extended with slight bend in elbows', 'Palms facing each other', 'Feet flat on floor'],
    execution: ['Lower dumbbells out to sides in wide arc', 'Stop when you feel chest stretch', 'Bring dumbbells back together in hugging motion', 'Squeeze chest at the top'],
    tips: ['Go lighter than you think - this is a stretch and squeeze exercise', 'Don\'t let dumbbells drop below shoulder level - protects shoulders', 'The stretched position builds muscle - don\'t rush through it']
  },
  'Landmine Press': {
    setup: ['Place barbell in landmine attachment or corner', 'Stand facing the end of the barbell', 'Hold end of bar at shoulder height', 'Stagger stance for stability'],
    execution: ['Press barbell up and forward', 'Full arm extension at top', 'Lower with control back to shoulder', 'Keep core braced throughout'],
    tips: ['The arc path is easier on shoulders than straight pressing', 'Can do single arm for more core engagement', 'Great alternative if overhead pressing hurts your shoulders']
  },
  'Floor Press': {
    setup: ['Lie on floor with barbell in rack or have partner hand off', 'Grip shoulder width or slightly wider', 'Legs can be flat or bent at knees', 'Upper back and head on floor'],
    execution: ['Lower bar until upper arms touch floor', 'Pause briefly on floor', 'Press bar back up explosively', 'Lock out at the top'],
    tips: ['The floor limits range of motion - protecting shoulders while building lockout strength', 'The pause eliminates stretch reflex - builds pure pressing power', 'Great for triceps development and bench press lockout strength']
  },
  // ADDITIONAL BACK EXERCISES
  'Pendlay Row': {
    setup: ['Stand over barbell with feet hip-width apart', 'Bend over until torso is parallel to floor', 'Grip bar shoulder width or wider', 'Bar starts on floor each rep'],
    execution: ['Explosively row bar to lower chest', 'Keep torso parallel to floor throughout', 'Lower bar back to floor with control', 'Reset between each rep'],
    tips: ['Each rep starts from a dead stop - builds explosive power', 'Stricter than regular rows since torso stays parallel', 'Great for building a thick, powerful back']
  },
  'Chest Supported Row': {
    setup: ['Set incline bench to 30-45 degrees', 'Lie face down with chest on bench', 'Hold dumbbells hanging below', 'Feet on floor for stability'],
    execution: ['Row dumbbells up to sides', 'Squeeze shoulder blades together', 'Lower with control', 'Keep chest pressed into bench'],
    tips: ['Eliminates momentum and lower back strain completely', 'You can\'t cheat - whatever weight you use, your back is doing the work', 'Great for feeling the mind-muscle connection with lats']
  },
  'T-Bar Row': {
    setup: ['Stand over T-bar machine or landmine', 'Bend at hips, keep back flat', 'Use close or wide grip handle', 'Slight bend in knees'],
    execution: ['Pull handle toward lower chest', 'Drive elbows back and squeeze', 'Lower with control', 'Maintain hip hinge throughout'],
    tips: ['Close grip hits lats more, wide grip emphasizes upper back', 'One of the best exercises for back thickness', 'Don\'t round your lower back - keep it flat throughout']
  },
  'Close Grip Pulldown': {
    setup: ['Attach V-bar or close grip handle', 'Sit with thighs secured under pads', 'Grip handle with palms facing each other', 'Arms fully extended overhead'],
    execution: ['Pull handle down toward upper chest', 'Lean back slightly as you pull', 'Squeeze lats at the bottom', 'Control the return'],
    tips: ['Close grip increases range of motion and lat stretch', 'Neutral grip is often easier on shoulders', 'Great for building lat width and lower lat development']
  },
  'Wide Grip Pulldown': {
    setup: ['Grip bar wider than shoulder width', 'Sit with thighs under pads', 'Lean back slightly', 'Arms fully extended'],
    execution: ['Pull bar down to upper chest', 'Drive elbows down and back', 'Squeeze lats at bottom', 'Control the return to full stretch'],
    tips: ['Wide grip emphasizes the outer lats for that V-taper', 'Don\'t go behind the neck - injury risk with minimal benefit', 'Think about pulling with your elbows, not your hands']
  },
  'Chin Ups': {
    setup: ['Grip bar with palms facing you, shoulder width', 'Hang with arms fully extended', 'Engage lats before pulling', 'Cross ankles or keep legs straight'],
    execution: ['Pull yourself up until chin clears bar', 'Lead with your chest', 'Lower with full control', 'Full extension at bottom'],
    tips: ['Underhand grip recruits more biceps than pull ups', 'Generally easier than pull ups - good progression step', 'If you can do 10+ clean reps, add weight with a belt']
  },
  'Neutral Grip Pull Ups': {
    setup: ['Grip parallel handles with palms facing each other', 'Hang with arms fully extended', 'Engage core and lats', 'Keep body straight'],
    execution: ['Pull yourself up until chin clears handles', 'Focus on driving elbows down', 'Lower with control', 'Full stretch at bottom'],
    tips: ['Neutral grip is easiest on shoulders and wrists', 'Great for those with shoulder issues on regular pull ups', 'Hits both lats and mid-back effectively']
  },
  'Machine Row': {
    setup: ['Adjust chest pad height appropriately', 'Sit with chest against pad', 'Grip handles with chosen grip', 'Arms fully extended forward'],
    execution: ['Pull handles back toward torso', 'Squeeze shoulder blades together', 'Return with control', 'Don\'t let weight stack touch'],
    tips: ['The chest support eliminates lower back involvement', 'Focus purely on the squeeze - this is a mind-muscle exercise', 'Great for higher reps since form stays consistent']
  },
  'Meadows Row': {
    setup: ['Barbell in landmine setup', 'Stand perpendicular to bar', 'Stagger stance, front foot near bar end', 'Grip end of bar with one hand'],
    execution: ['Row bar up toward hip', 'Drive elbow back and up', 'Lower with control', 'Complete all reps, then switch sides'],
    tips: ['The angled pull hits lats differently than other rows', 'Created by John Meadows for complete back development', 'Allows heavier loading with good stretch at bottom']
  },
  'Seal Row': {
    setup: ['Lie face down on elevated bench', 'Dumbbells or barbell hang below', 'Chest on bench, feet off ground', 'Arms fully extended down'],
    execution: ['Row weight up toward chest', 'Squeeze shoulder blades at top', 'Lower with full control', 'Get full stretch at bottom'],
    tips: ['Zero momentum possible - extremely strict rowing movement', 'The name comes from looking like a seal on a rock', 'Excellent for building mind-muscle connection with back']
  },
  'Straight Arm Pulldown': {
    setup: ['Stand facing high cable with bar attachment', 'Step back to create tension', 'Arms extended in front, slight bend in elbows', 'Hinge slightly at hips'],
    execution: ['Pull bar down in arc toward thighs', 'Keep arms straight throughout', 'Squeeze lats at the bottom', 'Return with control to start'],
    tips: ['Isolates lats without bicep involvement', 'Great as a lat activation exercise before pull ups or rows', 'Can also use rope attachment for different feel']
  },
  'Rack Pulls': {
    setup: ['Set safety pins at knee height or just below', 'Bar rests on pins', 'Stand with feet hip width, bar over mid-foot', 'Grip outside knees, chest up'],
    execution: ['Drive through heels to stand', 'Lockout with glutes squeezed', 'Lower bar back to pins with control', 'Reset between reps'],
    tips: ['Allows much heavier loading than full deadlifts', 'Great for building upper back thickness and grip strength', 'Primarily trains lockout portion of deadlift']
  },
  'Snatch Grip Deadlift': {
    setup: ['Very wide grip - hands near collars', 'Feet hip width apart', 'Get into deep hinge position', 'Chest up, back flat'],
    execution: ['Drive through floor to stand', 'Keep arms straight throughout', 'Stand tall at top', 'Lower with control'],
    tips: ['Wide grip forces deeper starting position - more quad and upper back', 'Excellent for building upper back width', 'Use straps - grip will be the limiting factor']
  },
  'Wide Grip Cable Row': {
    setup: ['Attach long bar to low cable', 'Sit at cable row station', 'Grip bar wider than shoulder width', 'Arms extended, slight lean forward'],
    execution: ['Pull bar to lower chest/upper abs', 'Drive elbows out to sides', 'Squeeze upper back and rear delts', 'Return with control'],
    tips: ['Wide grip shifts focus to upper back and rear delts', 'Different stimulus than close grip rowing', 'Great for building upper back thickness']
  },
  'High Cable Row': {
    setup: ['Set cable at face height or higher', 'Use rope or bar attachment', 'Step back to create tension', 'Arms extended toward cable'],
    execution: ['Pull toward face/upper chest', 'Drive elbows back and out', 'Squeeze upper back at contraction', 'Return with control'],
    tips: ['Targets upper back and rear delts simultaneously', 'Great alternative to face pulls with more range of motion', 'Keep the pulling angle high for best results']
  },
  'Back Extension': {
    setup: ['Position hips on pad', 'Anchor feet under lower pads', 'Start bent over at hips', 'Arms crossed over chest or behind head'],
    execution: ['Extend torso until body is straight', 'Squeeze glutes and lower back at top', 'Don\'t hyperextend beyond neutral', 'Lower with control'],
    tips: ['Great for building lower back endurance and strength', 'Holding weight adds resistance as you progress', 'Can also emphasize glutes by squeezing them hard at top']
  },
  'Hyperextension': {
    setup: ['Similar to back extension on 45-degree bench', 'Hips on pad, feet anchored', 'Start hanging down', 'Hands across chest or behind head'],
    execution: ['Raise torso until body is straight', 'Squeeze glutes and lower back', 'Hold briefly at top', 'Lower with control'],
    tips: ['The 45-degree angle changes the resistance curve', 'Add a plate to chest for increased difficulty', 'Don\'t round your lower back at the bottom']
  },
  // ADDITIONAL SHOULDER EXERCISES
  'Seated Dumbbell Press': {
    setup: ['Sit on bench with back support', 'Clean dumbbells to shoulder height', 'Palms facing forward', 'Feet flat on floor'],
    execution: ['Press dumbbells overhead', 'Bring dumbbells together at top', 'Lower with control to shoulder level', 'Keep core tight throughout'],
    tips: ['Dumbbells allow more natural arm path than barbell', 'Seated position prevents leg drive - stricter shoulder work', 'Don\'t let the dumbbells drift too far forward']
  },
  'Arnold Press': {
    setup: ['Sit with dumbbells at shoulder height', 'Palms start facing you', 'Elbows in front of body', 'Back against bench support'],
    execution: ['Press up while rotating palms to face forward', 'Full extension at top', 'Reverse the rotation on the way down', 'Control throughout'],
    tips: ['The rotation hits front delts through longer range of motion', 'Created by Arnold Schwarzenegger himself', 'Go lighter than regular press - the rotation makes it harder']
  },
  'Machine Shoulder Press': {
    setup: ['Adjust seat so handles are at shoulder height', 'Sit with back flat against pad', 'Grip handles with palms forward', 'Feet flat on floor'],
    execution: ['Press handles overhead', 'Full arm extension at top', 'Lower with control', 'Keep back against pad'],
    tips: ['Great for going to failure safely', 'The fixed path lets you focus on pushing hard', 'Adjust seat height to change emphasis on different delt heads']
  },
  'Push Press': {
    setup: ['Bar in front rack position on front delts', 'Feet shoulder width apart', 'Elbows slightly in front of bar', 'Core braced'],
    execution: ['Dip slightly by bending knees', 'Explosively extend legs while pressing bar', 'Lock out overhead', 'Lower with control'],
    tips: ['The leg drive lets you use heavier weights than strict press', 'Great for building overhead strength and power', 'Dip should be quick - don\'t pause at the bottom']
  },
  'Cable Lateral Raises': {
    setup: ['Set cable at lowest position', 'Stand sideways to machine', 'Grab handle with far hand', 'Arm at side, slight elbow bend'],
    execution: ['Raise arm out to side until parallel to floor', 'Lead with elbow, not hand', 'Lower with control', 'Complete all reps, then switch sides'],
    tips: ['Cable provides constant tension unlike dumbbells', 'Resistance curve is different - hardest at top', 'Great for side delt isolation and mind-muscle connection']
  },
  'Machine Lateral Raises': {
    setup: ['Adjust seat so arms are at sides', 'Sit with arms against pads', 'Grip handles lightly', 'Keep elbows slightly bent'],
    execution: ['Raise arms out to sides', 'Stop when arms are parallel to floor', 'Lower with control', 'Maintain constant tension'],
    tips: ['The machine path prevents cheating with body swing', 'Great for high reps and burning out side delts', 'Focus on squeezing the side delts, not gripping hard']
  },
  'Cable Front Raises': {
    setup: ['Set cable at lowest position', 'Face away from machine', 'Grab handle between legs', 'Stand with feet shoulder width'],
    execution: ['Raise arm straight in front to shoulder height', 'Keep slight bend in elbow', 'Lower with control', 'Can do one arm or both'],
    tips: ['Cables provide constant tension through full range', 'Front delts usually get enough work from pressing', 'Good finisher if front delts are a weak point']
  },
  'Face Pulls': {
    setup: ['Set cable at face height', 'Attach rope handle', 'Step back to create tension', 'Arms extended toward cable'],
    execution: ['Pull rope toward face', 'Separate hands as you pull to ears', 'Externally rotate at the end', 'Return with control'],
    tips: ['Essential for shoulder health - do these regularly', 'Thumbs should point behind you at the end', 'Targets rear delts and rotator cuff together']
  },
  'Reverse Pec Deck': {
    setup: ['Sit facing the pad on pec deck machine', 'Adjust handles to be in front of you', 'Grip handles with arms extended forward', 'Chest against pad'],
    execution: ['Open arms back in reverse fly motion', 'Squeeze rear delts at the end', 'Return with control', 'Don\'t let weight stack touch'],
    tips: ['Great isolation for rear delts with consistent resistance', 'The machine path ensures strict form', 'Keep the motion controlled - no swinging']
  },
  'Cable Rear Delt Fly': {
    setup: ['Set cables at shoulder height', 'Cross cables - right hand grabs left, left grabs right', 'Step back to create tension', 'Arms in front, slight elbow bend'],
    execution: ['Pull cables back and out', 'Open arms until in line with shoulders', 'Squeeze rear delts', 'Return with control'],
    tips: ['The cross pattern provides unique resistance angle', 'Keep elbows slightly bent throughout', 'Great for rear delt isolation with constant tension']
  },
  'Upright Rows': {
    setup: ['Stand with feet shoulder width', 'Grip barbell or dumbbells in front of thighs', 'Hands closer than shoulder width', 'Shoulders back, chest up'],
    execution: ['Pull weight up along body', 'Lead with elbows going up and out', 'Raise until elbows are at shoulder height', 'Lower with control'],
    tips: ['Controversial exercise - can impinge shoulders if done wrong', 'Keep hands wider and don\'t raise past shoulder level', 'Dumbbells or cables are safer than barbell']
  },
  'Lu Raises': {
    setup: ['Stand with dumbbells at sides', 'Arms straight, palms facing back', 'Slight lean forward', 'Feet shoulder width'],
    execution: ['Raise arms up and out at 45-degree angle', 'Thumbs point up throughout', 'Lift to shoulder height', 'Lower with control'],
    tips: ['Named after Olympic lifter Lu Xiaojun', 'The angle hits both front and side delts', 'Great warmup exercise before pressing']
  },
  'Y Raises': {
    setup: ['Lie face down on incline bench or stand bent over', 'Hold light dumbbells', 'Arms hanging down', 'Thumbs pointing up'],
    execution: ['Raise arms up and out forming a Y shape', 'Squeeze upper back at top', 'Lower with control', 'Keep thumbs pointing up'],
    tips: ['Excellent for lower trap and shoulder stability', 'Go very light - this is a small muscle group', 'Great for shoulder health and posture']
  },
  // ADDITIONAL TRICEP EXERCISES
  'Rope Pushdowns': {
    setup: ['Attach rope to high cable', 'Stand facing machine', 'Grip rope with palms facing each other', 'Elbows pinned to sides'],
    execution: ['Push rope down until arms straight', 'Spread rope at bottom for extra contraction', 'Return with control', 'Keep elbows stationary'],
    tips: ['The rope allows you to spread at the bottom for better squeeze', 'Spreading the rope hits the lateral head more', 'Keep elbows pinned - no flaring']
  },
  'Dumbbell Skull Crushers': {
    setup: ['Lie on bench holding dumbbells', 'Arms extended straight up', 'Palms facing each other', 'Feet flat on floor'],
    execution: ['Bend elbows to lower dumbbells toward head', 'Keep upper arms stationary', 'Extend arms back to start', 'Control the descent'],
    tips: ['Dumbbells allow more natural wrist position than bar', 'Can rotate palms at different points for variety', 'If elbows hurt, try lowering behind head instead']
  },
  'Tricep Dips': {
    setup: ['Grip parallel bars', 'Lift yourself to full arm extension', 'Keep body as upright as possible', 'Cross ankles behind you'],
    execution: ['Lower by bending elbows', 'Go down until upper arms parallel to floor', 'Press back up to start', 'Keep body upright for tricep focus'],
    tips: ['Stay upright to target triceps - leaning forward shifts to chest', 'Go to parallel only - deeper can stress shoulders', 'Add weight when bodyweight becomes easy']
  },
  'Diamond Push Ups': {
    setup: ['Get in push up position', 'Place hands together forming diamond shape', 'Thumbs and index fingers touching', 'Body in straight line'],
    execution: ['Lower chest toward hands', 'Keep elbows close to body', 'Push back up', 'Squeeze triceps at top'],
    tips: ['One of the best bodyweight tricep exercises', 'Harder than regular push ups - scale reps accordingly', 'Great for medial head tricep development']
  },
  'JM Press': {
    setup: ['Lie on bench with barbell', 'Grip narrower than shoulder width', 'Start with bar over upper chest', 'Elbows pointed forward'],
    execution: ['Lower bar toward throat/chin by bending elbows', 'Bar path goes forward as you lower', 'Press back up in reverse arc', 'Lock out over upper chest'],
    tips: ['A hybrid of close grip bench and skull crushers', 'Named after JM Blakley who popularized it', 'Excellent for building tricep mass and bench lockout']
  },
  'Tricep Kickbacks': {
    setup: ['Bend over with one hand on bench', 'Hold dumbbell in other hand', 'Pin upper arm parallel to floor', 'Elbow bent at 90 degrees'],
    execution: ['Extend arm straight back', 'Squeeze tricep at full extension', 'Return to 90 degrees', 'Complete all reps, switch sides'],
    tips: ['Despite reputation, this is effective when done correctly', 'Key is keeping upper arm stationary and parallel', 'Light weight with perfect form beats heavy cheating']
  },
  'Single Arm Pushdown': {
    setup: ['Set cable to high position', 'Stand facing machine', 'Grip handle with one hand', 'Elbow pinned to side'],
    execution: ['Push handle down until arm straight', 'Squeeze tricep at bottom', 'Return with control', 'Complete all reps, switch sides'],
    tips: ['Great for fixing tricep imbalances between arms', 'Can rotate body for different angles', 'Focus on the mind-muscle connection']
  },
  'V-Bar Pushdown': {
    setup: ['Attach V-bar to high cable', 'Stand facing machine', 'Grip V-bar with palms facing each other', 'Elbows at sides'],
    execution: ['Push bar down until arms straight', 'Squeeze triceps at bottom', 'Return with control', 'Keep elbows stationary'],
    tips: ['V-bar puts wrists in neutral position - easier on joints', 'Allows heavier loading than rope', 'Great for overall tricep development']
  },
  'Reverse Grip Pushdown': {
    setup: ['Attach straight bar to high cable', 'Stand facing machine', 'Grip bar with palms facing up', 'Elbows at sides'],
    execution: ['Push bar down until arms straight', 'Squeeze triceps', 'Return with control', 'Keep wrists straight'],
    tips: ['Underhand grip emphasizes the medial head', 'Feels awkward at first but builds well-rounded triceps', 'Go lighter than regular pushdowns']
  },
  'French Press': {
    setup: ['Sit or stand holding EZ bar or barbell overhead', 'Arms fully extended', 'Grip slightly narrower than shoulder width', 'Elbows pointing forward'],
    execution: ['Lower bar behind head by bending elbows', 'Keep upper arms stationary', 'Extend back to start', 'Full lockout at top'],
    tips: ['The overhead position stretches the long head fully', 'Essential for complete tricep development', 'Can do seated for more stability']
  },
  'Incline Skull Crushers': {
    setup: ['Set bench to 30-45 degree incline', 'Lie back with barbell or dumbbells', 'Arms extended up', 'Start with weight over face'],
    execution: ['Lower weight toward forehead/behind head', 'Keep upper arms in fixed position', 'Extend back to start', 'Control throughout'],
    tips: ['The incline increases long head stretch even more', 'Lower behind head rather than to forehead', 'Great alternative if flat skull crushers bother elbows']
  },
  'Overhead Dumbbell Extension': {
    setup: ['Sit or stand holding dumbbell with both hands', 'Press dumbbell overhead', 'Grip the inside of top weight plate', 'Elbows pointing up'],
    execution: ['Lower dumbbell behind head', 'Keep upper arms close to head', 'Extend back to start', 'Full lockout at top'],
    tips: ['Great long head tricep builder', 'Can also do single arm for more isolation', 'Keep elbows from flaring out']
  },
  // ADDITIONAL BICEP EXERCISES
  'EZ Bar Curl': {
    setup: ['Stand holding EZ bar at angled grips', 'Feet shoulder width apart', 'Arms extended, bar at thighs', 'Elbows at sides'],
    execution: ['Curl bar up toward shoulders', 'Keep elbows stationary', 'Squeeze at the top', 'Lower with control'],
    tips: ['The angled grip is easier on wrists than straight bar', 'Inner grip targets outer bicep, outer grip hits inner bicep', 'Just as effective as straight bar with less joint stress']
  },
  'Hammer Curls': {
    setup: ['Stand with dumbbells at sides', 'Neutral grip - palms facing thighs', 'Arms fully extended', 'Feet shoulder width'],
    execution: ['Curl dumbbells up keeping neutral grip', 'Bring to shoulder level', 'Squeeze at the top', 'Lower with control'],
    tips: ['Builds the brachialis which pushes the bicep up', 'Also hits forearms significantly', 'Can do across body for more brachialis emphasis']
  },
  'Incline Dumbbell Curl': {
    setup: ['Set bench to 45-60 degree incline', 'Lie back with dumbbells hanging down', 'Arms fully extended behind torso', 'Palms facing forward'],
    execution: ['Curl dumbbells up toward shoulders', 'Keep upper arms stationary', 'Squeeze at the top', 'Lower to full stretch'],
    tips: ['The incline puts biceps in stretched position - great for growth', 'You\'ll use less weight but feel it more', 'One of the best bicep exercises for long head']
  },
  'Concentration Curl': {
    setup: ['Sit on bench with legs spread', 'Rest elbow against inner thigh', 'Hold dumbbell with arm extended down', 'Lean slightly forward'],
    execution: ['Curl dumbbell up toward shoulder', 'Focus on squeezing the bicep', 'Lower with full control', 'Complete all reps, switch arms'],
    tips: ['The braced position prevents cheating completely', 'Great for building the bicep peak', 'Focus on the squeeze more than the weight']
  },
  'Spider Curls': {
    setup: ['Lie face down on incline bench', 'Let arms hang straight down', 'Hold dumbbells or EZ bar', 'Upper arms perpendicular to floor'],
    execution: ['Curl weight up without moving upper arms', 'Squeeze hard at top', 'Lower with control', 'Get full extension at bottom'],
    tips: ['The position eliminates all momentum', 'Great for building the short head (inner bicep)', 'You\'ll use lighter weight but feel every rep']
  },
  'Drag Curls': {
    setup: ['Stand holding barbell at thighs', 'Grip shoulder width', 'Arms extended', 'Elbows will move back during movement'],
    execution: ['Curl bar up while dragging it along body', 'Drive elbows back as bar rises', 'Bar stays in contact with body', 'Lower while dragging back down'],
    tips: ['Eliminates front delt involvement completely', 'The movement pattern is unusual but highly effective', 'Great for building bicep peak and long head']
  },
  'Reverse Curls': {
    setup: ['Stand holding barbell with overhand grip', 'Arms extended, bar at thighs', 'Grip shoulder width', 'Elbows at sides'],
    execution: ['Curl bar up keeping overhand grip', 'Bring bar to shoulder level', 'Lower with control', 'Keep wrists straight'],
    tips: ['Targets brachioradialis (forearm) and brachialis', 'Great for building forearm size', 'Use lighter weight than regular curls']
  },
  'Wrist Curls': {
    setup: ['Sit with forearms on thighs or bench', 'Wrists hanging over edge', 'Hold barbell or dumbbells', 'Palms facing up'],
    execution: ['Curl wrists up', 'Squeeze forearms at top', 'Lower with control', 'Full stretch at bottom'],
    tips: ['Targets the forearm flexors', 'Can also do with palms down for extensors', 'High reps (15-20) work well for forearms']
  },
  'Bayesian Cable Curl': {
    setup: ['Set cable at lowest position', 'Face away from machine', 'Grab handle behind you', 'Step forward, arm behind torso'],
    execution: ['Curl handle up toward shoulder', 'Keep upper arm behind you throughout', 'Squeeze at the top', 'Lower with control'],
    tips: ['Puts biceps in maximum stretched position', 'One of the best exercises for long head', 'The stretch at the bottom is what makes this special']
  },
  'High Cable Curl': {
    setup: ['Set cables at head height or above', 'Stand between cable stations', 'Grip handles with palms up', 'Arms extended out to sides'],
    execution: ['Curl handles toward your head', 'Squeeze biceps at peak contraction', 'Extend arms back to start', 'Maintain tension throughout'],
    tips: ['The unique angle gives an incredible peak contraction', 'Great for building the bicep peak', 'This is a finishing exercise - do it last']
  },
  'Machine Preacher Curl': {
    setup: ['Sit at preacher machine', 'Adjust pad height for upper arms', 'Grip handles', 'Arms on pad, slightly bent'],
    execution: ['Curl handles up toward shoulders', 'Squeeze biceps at top', 'Lower with control', 'Don\'t fully lock out at bottom'],
    tips: ['Machine provides consistent resistance through range', 'Great for mind-muscle connection', 'Safe for going to failure']
  },
  'Wide Grip Barbell Curl': {
    setup: ['Stand holding barbell with grip wider than shoulders', 'Arms extended at thighs', 'Elbows close to body', 'Chest up'],
    execution: ['Curl bar toward shoulders', 'Keep elbows stationary', 'Squeeze at top', 'Lower with control'],
    tips: ['Wide grip emphasizes the short head (inner bicep)', 'Good for building bicep width', 'Rotate with narrow grip work for complete development']
  },
  'Narrow Grip EZ Curl': {
    setup: ['Stand holding EZ bar at inner grips', 'Arms extended', 'Elbows at sides', 'Feet shoulder width'],
    execution: ['Curl bar up toward shoulders', 'Keep elbows pinned', 'Squeeze at top', 'Lower with control'],
    tips: ['Narrow grip emphasizes the long head (outer bicep)', 'Great for building the bicep peak', 'Part of a complete bicep routine with wide grip work']
  },
  // ADDITIONAL QUAD EXERCISES
  'Barbell Back Squat': {
    setup: ['Bar on upper traps (high bar) or rear delts (low bar)', 'Feet shoulder width, toes slightly out', 'Chest up, core braced', 'Unrack and step back'],
    execution: ['Push hips back and bend knees', 'Descend until thighs at least parallel', 'Keep knees over toes', 'Drive up through heels'],
    tips: ['High bar is more quad dominant, low bar shifts to glutes/hips', 'Squat shoes with raised heels help achieve depth', 'The king of leg exercises - prioritize it']
  },
  'Front Squat': {
    setup: ['Bar rests on front delts, not hands', 'Elbows high, upper arms parallel to floor', 'Feet shoulder width', 'Core very tight'],
    execution: ['Descend by pushing knees forward and down', 'Stay upright - elbows up', 'Go as deep as mobility allows', 'Drive up keeping chest high'],
    tips: ['More quad dominant than back squats', 'Requires good thoracic mobility', 'Great for core strength and athletic performance']
  },
  'Goblet Squat': {
    setup: ['Hold dumbbell or kettlebell at chest', 'Elbows pointing down', 'Feet slightly wider than shoulders', 'Toes pointed slightly out'],
    execution: ['Squat down between your legs', 'Keep chest up and elbows inside knees', 'Go as deep as possible', 'Drive up through heels'],
    tips: ['The front load forces upright posture', 'Great for learning squat mechanics', 'Excellent warmup before back squats']
  },
  'Hack Squat': {
    setup: ['Stand on platform with back against pad', 'Shoulders under pads', 'Feet shoulder width on platform', 'Release safety handles'],
    execution: ['Lower by bending knees', 'Go as deep as comfortable', 'Drive back up through heels', 'Don\'t lock out knees completely'],
    tips: ['The machine path allows focusing purely on quads', 'Low foot position targets quads more, high targets glutes', 'Great for quad hypertrophy without lower back stress']
  },
  'Walking Lunges': {
    setup: ['Stand with dumbbells at sides or barbell on back', 'Feet together', 'Core engaged', 'Look straight ahead'],
    execution: ['Step forward into lunge position', 'Lower until both knees at 90 degrees', 'Step through to next lunge', 'Continue walking pattern'],
    tips: ['The continuous motion is more metabolically demanding', 'Great for building functional leg strength', 'Shorter steps target quads, longer steps hit glutes']
  },
  'Reverse Lunges': {
    setup: ['Stand with feet together', 'Hold dumbbells at sides or barbell on back', 'Core engaged', 'Chest up'],
    execution: ['Step backward into lunge', 'Lower until both knees at 90 degrees', 'Push through front heel to return', 'Alternate legs or do all reps on one side'],
    tips: ['Easier on knees than forward lunges', 'Great for quad and glute development', 'The step back makes balance easier to maintain']
  },
  'Step Ups': {
    setup: ['Stand facing box or bench', 'Hold dumbbells at sides', 'One foot on box', 'Core engaged'],
    execution: ['Drive through front foot to step up', 'Bring other foot to box', 'Step down with control', 'Complete all reps then switch legs'],
    tips: ['Don\'t push off back leg - use the front leg only', 'Higher box increases glute involvement', 'Great unilateral exercise for fixing imbalances']
  },
  'Sissy Squat': {
    setup: ['Stand holding something for balance', 'Feet hip width apart', 'Rise up on toes', 'Lean back from the knees'],
    execution: ['Bend knees and lean back simultaneously', 'Lower until feeling deep quad stretch', 'Keep hips forward - don\'t sit back', 'Rise back up to start'],
    tips: ['Extreme quad isolation - prepare for soreness', 'Start with bodyweight only', 'Targets the rectus femoris uniquely']
  },
  'Pendulum Squat': {
    setup: ['Stand on platform with shoulders under pads', 'Feet in the center or slightly forward', 'Grip handles', 'Release safety'],
    execution: ['Lower by bending knees', 'The machine swings in a pendulum arc', 'Go as deep as comfortable', 'Drive back up'],
    tips: ['The arc path is easier on the lower back than hack squat', 'Constant tension through the entire range', 'Great machine for quad hypertrophy']
  },
  'Belt Squat': {
    setup: ['Attach belt around hips', 'Stand on elevated platforms', 'Weight hangs from belt between legs', 'Feet shoulder width or wider'],
    execution: ['Squat down between platforms', 'Keep chest up', 'Go as deep as possible', 'Drive up through heels'],
    tips: ['Zero spinal loading - amazing for back issues', 'Can go very heavy and very deep safely', 'One of the best leg exercises if your gym has one']
  },
  // ADDITIONAL HAMSTRING EXERCISES
  'Lying Leg Curl': {
    setup: ['Lie face down on leg curl machine', 'Ankles under pad', 'Grip handles', 'Hips pressed into pad'],
    execution: ['Curl heels toward glutes', 'Squeeze hamstrings at top', 'Lower with control', 'Don\'t let weight stack touch'],
    tips: ['Point toes away for more hamstring activation', 'Don\'t let hips rise up - that\'s cheating', 'Great for building hamstring mass']
  },
  'Nordic Curls': {
    setup: ['Kneel on pad with feet anchored', 'Partner holds ankles or use machine', 'Body straight from knees to head', 'Arms ready to catch yourself'],
    execution: ['Lower body forward with control', 'Resist with hamstrings as long as possible', 'Catch yourself and push back up', 'Use hamstrings to return if possible'],
    tips: ['One of the most effective hamstring exercises', 'Start with negatives only if too hard', 'Great for preventing hamstring injuries']
  },
  'Good Mornings': {
    setup: ['Bar on upper back like squat position', 'Feet shoulder width', 'Slight bend in knees', 'Core braced'],
    execution: ['Hinge at hips pushing them back', 'Lower torso until nearly parallel to floor', 'Keep back flat throughout', 'Drive hips forward to stand'],
    tips: ['Excellent for hamstring and lower back development', 'Keep the weight light and form strict', 'The stretch in hamstrings should be intense']
  },
  'Sumo Deadlift': {
    setup: ['Very wide stance, toes pointed out', 'Grip bar with hands inside knees', 'Chest up, hips low', 'Back flat'],
    execution: ['Drive through floor spreading knees', 'Keep bar close to body', 'Stand tall at top', 'Lower by pushing hips back'],
    tips: ['More hip and inner thigh dominant than conventional', 'Better for those with long torsos', 'The wide stance reduces range of motion']
  },
  // ADDITIONAL GLUTE EXERCISES
  'Hip Abduction Machine': {
    setup: ['Sit in machine with back against pad', 'Legs inside pads', 'Start with legs together', 'Grip handles'],
    execution: ['Push legs apart against resistance', 'Squeeze glutes at full extension', 'Return with control', 'Don\'t let weight stack touch'],
    tips: ['Targets gluteus medius and minimus', 'Great for building hip stability', 'Can lean forward for different glute emphasis']
  },
  'Cable Pull Through': {
    setup: ['Set cable at lowest position', 'Face away, straddle the cable', 'Grab rope between legs', 'Step forward to create tension'],
    execution: ['Hinge at hips pushing them back', 'Let hands go between legs', 'Drive hips forward powerfully', 'Squeeze glutes at top'],
    tips: ['Great hip hinge teaching exercise', 'Constant tension makes it great for glute activation', 'Keep your back flat throughout']
  },
  'Frog Pumps': {
    setup: ['Lie on back', 'Soles of feet together, knees out', 'Arms at sides for stability', 'Heels close to glutes'],
    execution: ['Drive hips up by squeezing glutes', 'Hold at top briefly', 'Lower with control', 'Keep feet pressed together'],
    tips: ['The position isolates glutes from hamstrings', 'Great for glute activation before heavy compounds', 'High reps (20-30) work well here']
  },
  'Single Leg Hip Thrust': {
    setup: ['Upper back on bench', 'One foot on floor, other leg extended', 'Hips starting low', 'Arms out for balance'],
    execution: ['Drive through planted foot to raise hips', 'Squeeze glute hard at top', 'Lower with control', 'Complete all reps, switch legs'],
    tips: ['Fixes glute imbalances between sides', 'Much harder than bilateral - use bodyweight first', 'Great for runners and athletes']
  },
  'Donkey Kicks': {
    setup: ['Get on all fours', 'Hands under shoulders, knees under hips', 'Core engaged', 'One knee stays on ground'],
    execution: ['Kick one leg back and up', 'Drive heel toward ceiling', 'Squeeze glute at top', 'Lower with control, repeat'],
    tips: ['Keep the motion controlled - no swinging', 'Focus on feeling the glute contract', 'Can add ankle weights for resistance']
  },
  'Fire Hydrants': {
    setup: ['On all fours position', 'Core tight', 'Back flat', 'Head neutral'],
    execution: ['Lift one knee out to the side', 'Keep 90-degree knee bend', 'Raise until thigh is parallel to floor', 'Lower with control'],
    tips: ['Great for gluteus medius activation', 'Perfect warmup exercise before squats', 'Can add band for increased resistance']
  }
};

// Helper to get exercise instructions (returns default if not found)
const getExerciseInstructions = (exerciseName) => {
  return EXERCISE_INSTRUCTIONS[exerciseName] || {
    setup: ['Position yourself at the equipment', 'Adjust settings for your body size', 'Grip handles or bar with proper hand placement', 'Engage your core before starting'],
    execution: ['Perform the movement with control', 'Focus on the target muscle', 'Use full range of motion', 'Breathe out during exertion, in during release'],
    tips: ['Start with lighter weight to learn the movement', 'Focus on form over weight', 'If unsure, ask a trainer for guidance']
  };
};

// Exercise Info Modal - shows step-by-step instructions for exercises
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

// Helper to get program for a goal
const getProgramForGoal = (goal) => {
  return GOAL_TO_PROGRAM[goal] || GOAL_TO_PROGRAM.fitness;
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
  
  // BACK - with muscle region targeting
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Mid Back', 'Upper Back'] },
  { name: 'Pendlay Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Mid Back', 'Upper Back'] },
  { name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Mid Back'] },
  { name: 'Chest Supported Row', muscleGroup: 'Back', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Upper Back', 'Mid Back'] },
  { name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Mid Back'] },
  { name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound', targetedHeads: ['Mid Back'] },
  { name: 'Lat Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'compound' },
  { name: 'Close Grip Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'compound' },
  { name: 'Wide Grip Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'compound' },
  { name: 'Pull Ups', muscleGroup: 'Lats', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Chin Ups', muscleGroup: 'Lats', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Neutral Grip Pull Ups', muscleGroup: 'Lats', equipment: 'Bodyweight', type: 'compound' },
  { name: 'Machine Row', muscleGroup: 'Back', equipment: 'Machine', type: 'compound', targetedHeads: ['Mid Back'] },
  { name: 'Meadows Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Mid Back'] },
  { name: 'Seal Row', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Mid Back', 'Upper Back'] },
  { name: 'Straight Arm Pulldown', muscleGroup: 'Lats', equipment: 'Cable', type: 'isolation' },
  { name: 'Rack Pulls', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Lower Back'] },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Lower Back', 'Mid Back'] },
  { name: 'Snatch Grip Deadlift', muscleGroup: 'Back', equipment: 'Barbell', type: 'compound', targetedHeads: ['Upper Back', 'Mid Back'] },
  { name: 'Wide Grip Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound', targetedHeads: ['Upper Back'] },
  { name: 'High Cable Row', muscleGroup: 'Back', equipment: 'Cable', type: 'compound', targetedHeads: ['Upper Back'] },
  { name: 'Back Extension', muscleGroup: 'Back', equipment: 'Equipment', type: 'isolation', targetedHeads: ['Lower Back'] },
  { name: 'Hyperextension', muscleGroup: 'Back', equipment: 'Equipment', type: 'isolation', targetedHeads: ['Lower Back'] },
  
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
  
  // TRICEPS - with muscle head targeting
  { name: 'Tricep Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Lateral Head Triceps'] },
  { name: 'Rope Pushdowns', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Lateral Head Triceps', 'Medial Head Triceps'] },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Long Head Triceps'] },
  { name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Triceps'] },
  { name: 'Dumbbell Skull Crushers', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Long Head Triceps'] },
  { name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound', targetedHeads: ['Lateral Head Triceps', 'Medial Head Triceps'] },
  { name: 'Diamond Push Ups', muscleGroup: 'Triceps', equipment: 'Bodyweight', type: 'compound', targetedHeads: ['Medial Head Triceps'] },
  { name: 'JM Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'compound', targetedHeads: ['Long Head Triceps', 'Lateral Head Triceps'] },
  { name: 'Tricep Kickbacks', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Lateral Head Triceps'] },
  { name: 'Single Arm Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Lateral Head Triceps'] },
  { name: 'V-Bar Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Lateral Head Triceps'] },
  { name: 'Reverse Grip Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Medial Head Triceps'] },
  { name: 'French Press', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Triceps'] },
  { name: 'Incline Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Triceps'] },
  { name: 'Overhead Dumbbell Extension', muscleGroup: 'Triceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Long Head Triceps'] },
  
  // BICEPS - with muscle head targeting
  { name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Biceps', 'Short Head Biceps'] },
  { name: 'EZ Bar Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Biceps', 'Short Head Biceps'] },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Long Head Biceps', 'Short Head Biceps'] },
  { name: 'Hammer Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Long Head Biceps'] },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Long Head Biceps'] },
  { name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Short Head Biceps'] },
  { name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Long Head Biceps', 'Short Head Biceps'] },
  { name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Short Head Biceps'] },
  { name: 'Spider Curls', muscleGroup: 'Biceps', equipment: 'Dumbbells', type: 'isolation', targetedHeads: ['Short Head Biceps'] },
  { name: 'Drag Curls', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Biceps'] },
  { name: 'Reverse Curls', muscleGroup: 'Forearms', equipment: 'Barbell', type: 'isolation' },
  { name: 'Wrist Curls', muscleGroup: 'Forearms', equipment: 'Barbell', type: 'isolation' },
  { name: 'Bayesian Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Long Head Biceps'] },
  { name: 'High Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', type: 'isolation', targetedHeads: ['Short Head Biceps'] },
  { name: 'Machine Preacher Curl', muscleGroup: 'Biceps', equipment: 'Machine', type: 'isolation', targetedHeads: ['Short Head Biceps'] },
  { name: 'Wide Grip Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Short Head Biceps'] },
  { name: 'Narrow Grip EZ Curl', muscleGroup: 'Biceps', equipment: 'Barbell', type: 'isolation', targetedHeads: ['Long Head Biceps'] },
  
  // QUADS - with muscle head targeting
  { name: 'Barbell Back Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'compound', targetedHeads: ['Vastus Lateralis', 'Vastus Medialis', 'Rectus Femoris'] },
  { name: 'Front Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'compound', targetedHeads: ['Rectus Femoris', 'Vastus Medialis'] },
  { name: 'Goblet Squat', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Vastus Medialis', 'Rectus Femoris'] },
  { name: 'Hack Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Rectus Femoris', 'Vastus Lateralis'] },
  { name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Vastus Lateralis', 'Vastus Medialis'] },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Vastus Medialis', 'Rectus Femoris'] },
  { name: 'Walking Lunges', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Vastus Lateralis', 'Rectus Femoris'] },
  { name: 'Reverse Lunges', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Vastus Medialis', 'Rectus Femoris'] },
  { name: 'Step Ups', muscleGroup: 'Quads', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Vastus Medialis', 'Rectus Femoris'] },
  { name: 'Leg Extension', muscleGroup: 'Quads', equipment: 'Machine', type: 'isolation', targetedHeads: ['Rectus Femoris'] },
  { name: 'Sissy Squat', muscleGroup: 'Quads', equipment: 'Bodyweight', type: 'isolation', targetedHeads: ['Vastus Medialis', 'Rectus Femoris'] },
  { name: 'Pendulum Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Rectus Femoris'] },
  { name: 'Belt Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Vastus Lateralis', 'Vastus Medialis'] },
  { name: 'Smith Machine Squat', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Vastus Lateralis', 'Vastus Medialis'] },
  { name: 'Heels Elevated Squat', muscleGroup: 'Quads', equipment: 'Barbell', type: 'compound', targetedHeads: ['Vastus Medialis'] },
  { name: 'Narrow Stance Leg Press', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Vastus Medialis'] },
  { name: 'Wide Stance Leg Press', muscleGroup: 'Quads', equipment: 'Machine', type: 'compound', targetedHeads: ['Vastus Lateralis'] },

  // HAMSTRINGS & GLUTES - with muscle head targeting
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'compound', targetedHeads: ['Bicep Femoris'] },
  { name: 'Stiff Leg Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'compound', targetedHeads: ['Bicep Femoris'] },
  { name: 'Dumbbell RDL', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Bicep Femoris'] },
  { name: 'Single Leg RDL', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Bicep Femoris'] },
  { name: 'Good Mornings', muscleGroup: 'Hamstrings', equipment: 'Barbell', type: 'compound', targetedHeads: ['Bicep Femoris'] },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', type: 'isolation', targetedHeads: ['Bicep Femoris'] },
  { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', type: 'isolation', targetedHeads: ['Semitendinosus'] },
  { name: 'Nordic Curls', muscleGroup: 'Hamstrings', equipment: 'Bodyweight', type: 'isolation', targetedHeads: ['Semitendinosus', 'Bicep Femoris'] },
  { name: 'Glute Ham Raise', muscleGroup: 'Hamstrings', equipment: 'Equipment', type: 'isolation', targetedHeads: ['Semitendinosus', 'Bicep Femoris'] },
  { name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound', targetedHeads: ['Gluteus Maximus'] },
  { name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound', targetedHeads: ['Gluteus Maximus'] },
  { name: 'Cable Pull Through', muscleGroup: 'Glutes', equipment: 'Cable', type: 'compound', targetedHeads: ['Gluteus Maximus'] },
  { name: 'Glute Kickback', muscleGroup: 'Glutes', equipment: 'Cable', type: 'isolation', targetedHeads: ['Gluteus Maximus', 'Gluteus Medius'] },
  { name: 'Hip Abduction', muscleGroup: 'Glutes', equipment: 'Machine', type: 'isolation', targetedHeads: ['Gluteus Medius'] },
  { name: 'Sumo Deadlift', muscleGroup: 'Glutes', equipment: 'Barbell', type: 'compound', targetedHeads: ['Gluteus Maximus'] },
  { name: 'Single Leg Hip Thrust', muscleGroup: 'Glutes', equipment: 'Bodyweight', type: 'isolation', targetedHeads: ['Gluteus Maximus'] },
  { name: 'Cable Hip Abduction', muscleGroup: 'Glutes', equipment: 'Cable', type: 'isolation', targetedHeads: ['Gluteus Medius'] },
  { name: 'Curtsy Lunge', muscleGroup: 'Glutes', equipment: 'Dumbbells', type: 'compound', targetedHeads: ['Gluteus Medius', 'Gluteus Maximus'] },
  
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

// ============================================
// DYNAMIC WORKOUT GENERATION SYSTEM
// ============================================

// Goal-based training parameters
const GOAL_TRAINING_PARAMS = {
  bulk: { setsPerExercise: [4, 5], repsPerSet: [6, 10], restTime: [90, 150], compoundFirst: true },
  build_muscle: { setsPerExercise: [3, 4], repsPerSet: [8, 12], restTime: [60, 120], compoundFirst: true },
  strength: { setsPerExercise: [4, 5], repsPerSet: [3, 6], restTime: [180, 300], compoundFirst: true },
  recomp: { setsPerExercise: [3, 4], repsPerSet: [8, 12], restTime: [60, 90], compoundFirst: true },
  fitness: { setsPerExercise: [2, 3], repsPerSet: [12, 15], restTime: [45, 60], compoundFirst: false },
  athletic: { setsPerExercise: [3, 4], repsPerSet: [6, 10], restTime: [60, 120], compoundFirst: true },
  lean: { setsPerExercise: [3, 4], repsPerSet: [10, 15], restTime: [30, 60], compoundFirst: false },
  lose_fat: { setsPerExercise: [3, 4], repsPerSet: [12, 15], restTime: [30, 45], compoundFirst: false },
};

// Complementary muscle pairings for supersets (antagonist muscles only)
// These muscles can be safely supersetted as they don't interfere with each other
const SUPERSET_PAIRINGS = {
  // Arms - biceps and triceps are perfect antagonists
  'Biceps': ['Triceps'],
  'Triceps': ['Biceps'],
  // Chest and Back - classic push/pull antagonists
  'Chest': ['Back', 'Lats', 'Rear Delts'],
  'Upper Chest': ['Back', 'Lats', 'Rear Delts'],
  'Back': ['Chest', 'Upper Chest'],
  'Lats': ['Chest', 'Upper Chest'],
  // Shoulders - front and rear delts are antagonists
  'Shoulders': ['Rear Delts'],
  'Front Delts': ['Rear Delts'],
  'Rear Delts': ['Shoulders', 'Front Delts', 'Chest', 'Upper Chest'],
  'Side Delts': ['Rear Delts'], // Side delts can pair with rear delts
  // Legs - quads and hamstrings are antagonists
  'Quads': ['Hamstrings'],
  'Hamstrings': ['Quads'],
  // Core - abs and lower back are antagonists
  'Abs': ['Lower Back'],
  'Core': ['Lower Back'],
  'Lower Back': ['Abs', 'Core'],
};

// Muscles that should NEVER be supersetted together (synergists)
// These muscles assist each other and supersetting would cause fatigue issues
const INVALID_SUPERSET_PAIRINGS = {
  'Biceps': ['Back', 'Lats', 'Rear Delts'], // Biceps assist in pulling movements
  'Triceps': ['Chest', 'Upper Chest', 'Shoulders', 'Front Delts'], // Triceps assist in pressing
  'Front Delts': ['Chest', 'Upper Chest'], // Front delts assist in chest pressing
  'Glutes': ['Quads', 'Hamstrings'], // Glutes work with both in compound leg movements
};

// Check if two exercises can be supersetted
const canSuperset = (exercise1, exercise2) => {
  const muscle1 = exercise1.muscleGroup;
  const muscle2 = exercise2.muscleGroup;

  // Check if they're in the valid pairings
  const validPairs = SUPERSET_PAIRINGS[muscle1] || [];
  if (!validPairs.includes(muscle2)) return false;

  // Double-check they're not in invalid pairings
  const invalidPairs1 = INVALID_SUPERSET_PAIRINGS[muscle1] || [];
  const invalidPairs2 = INVALID_SUPERSET_PAIRINGS[muscle2] || [];
  if (invalidPairs1.includes(muscle2) || invalidPairs2.includes(muscle1)) return false;

  // Don't superset two compound exercises (too fatiguing)
  if (exercise1.type === 'compound' && exercise2.type === 'compound') return false;

  return true;
};

// Create supersets from exercise list when time is limited
const createSupersets = (exercises, targetTimeSavingMinutes = 0) => {
  if (targetTimeSavingMinutes <= 0 || exercises.length < 2) {
    return { exercises, supersets: [], timeSaved: 0 };
  }

  const result = [...exercises];
  const supersets = [];
  let timeSaved = 0;
  const usedIndices = new Set();

  // Try to create supersets to save time
  // Each superset saves approximately the rest time between the two exercises
  for (let i = 0; i < result.length && timeSaved < targetTimeSavingMinutes * 60; i++) {
    if (usedIndices.has(i)) continue;

    for (let j = i + 1; j < result.length; j++) {
      if (usedIndices.has(j)) continue;

      if (canSuperset(result[i], result[j])) {
        // Create a superset
        const exercise1 = result[i];
        const exercise2 = result[j];

        // Mark both as part of a superset
        const supersetId = `superset_${Date.now()}_${i}`;
        result[i] = {
          ...exercise1,
          supersetId,
          supersetOrder: 1,
          supersetWith: exercise2.name,
          // No rest after first exercise in superset
          restTime: 0,
        };
        result[j] = {
          ...exercise2,
          supersetId,
          supersetOrder: 2,
          supersetWith: exercise1.name,
          // Normal rest after completing both exercises
          restTime: exercise2.restTime || 60,
        };

        supersets.push({
          id: supersetId,
          exercise1: exercise1.name,
          exercise2: exercise2.name,
          muscle1: exercise1.muscleGroup,
          muscle2: exercise2.muscleGroup,
        });

        // Time saved is the rest period we eliminated
        timeSaved += (exercise1.restTime || 60);
        usedIndices.add(i);
        usedIndices.add(j);
        break;
      }
    }
  }

  // Reorder exercises to keep superset pairs together
  const reordered = [];
  const supersetExercises = result.filter(ex => ex.supersetId);
  const regularExercises = result.filter(ex => !ex.supersetId);

  // Group superset exercises together
  const supersetGroups = {};
  supersetExercises.forEach(ex => {
    if (!supersetGroups[ex.supersetId]) supersetGroups[ex.supersetId] = [];
    supersetGroups[ex.supersetId].push(ex);
  });

  // Sort each group by supersetOrder
  Object.values(supersetGroups).forEach(group => {
    group.sort((a, b) => a.supersetOrder - b.supersetOrder);
  });

  // Interleave: compound exercises first, then supersets, then isolation
  const compounds = regularExercises.filter(ex => ex.type === 'compound');
  const isolations = regularExercises.filter(ex => ex.type !== 'compound');

  reordered.push(...compounds);
  Object.values(supersetGroups).forEach(group => reordered.push(...group));
  reordered.push(...isolations);

  return {
    exercises: reordered,
    supersets,
    timeSaved: Math.round(timeSaved / 60) // Return in minutes
  };
};

// Related muscle groups that shouldn't be trained back-to-back (synergists)
// These muscles assist each other and need recovery time between exercises
const RELATED_MUSCLE_GROUPS = {
  'Chest': ['Upper Chest', 'Front Delts', 'Triceps'],
  'Upper Chest': ['Chest', 'Front Delts', 'Triceps'],
  'Back': ['Lats', 'Rear Delts', 'Biceps', 'Traps'],
  'Lats': ['Back', 'Rear Delts', 'Biceps'],
  'Shoulders': ['Front Delts', 'Side Delts', 'Upper Chest'],
  'Front Delts': ['Shoulders', 'Chest', 'Upper Chest', 'Triceps'],
  'Side Delts': ['Shoulders', 'Rear Delts'],
  'Rear Delts': ['Back', 'Lats', 'Side Delts'],
  'Triceps': ['Chest', 'Upper Chest', 'Shoulders', 'Front Delts'],
  'Biceps': ['Back', 'Lats'],
  'Quads': ['Glutes'],
  'Hamstrings': ['Glutes', 'Lower Back'],
  'Glutes': ['Quads', 'Hamstrings', 'Lower Back'],
  'Calves': [],
  'Abs': ['Core', 'Obliques'],
  'Core': ['Abs', 'Obliques', 'Lower Back'],
  'Traps': ['Back', 'Rear Delts'],
  'Forearms': ['Biceps'],
};

// Check if two muscle groups are related (synergists)
const areMusclesRelated = (muscle1, muscle2) => {
  if (muscle1 === muscle2) return true;
  const related1 = RELATED_MUSCLE_GROUPS[muscle1] || [];
  const related2 = RELATED_MUSCLE_GROUPS[muscle2] || [];
  return related1.includes(muscle2) || related2.includes(muscle1);
};

// Reorder exercises to avoid same/related muscle groups back-to-back
// This allows for better recovery between exercises targeting the same muscles
const reorderExercisesForRecovery = (exercises) => {
  if (exercises.length <= 2) return exercises;

  const reordered = [];
  const remaining = [...exercises];

  // Start with compounds first (they're usually more important)
  remaining.sort((a, b) => {
    if (a.exerciseType === 'compound' && b.exerciseType !== 'compound') return -1;
    if (a.exerciseType !== 'compound' && b.exerciseType === 'compound') return 1;
    return 0;
  });

  // Take the first exercise (usually a primary compound)
  reordered.push(remaining.shift());

  // Greedily select exercises that don't target related muscles
  while (remaining.length > 0) {
    const lastExercise = reordered[reordered.length - 1];
    const lastMuscle = lastExercise.muscleGroup;

    // Find the best next exercise (not targeting related muscles)
    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const candidateMuscle = candidate.muscleGroup;

      // Score based on how unrelated the muscle is
      let score = 0;
      if (!areMusclesRelated(lastMuscle, candidateMuscle)) {
        score = 10; // Great - completely unrelated
      } else if (lastMuscle !== candidateMuscle) {
        score = 5; // OK - related but not the same
      } else {
        score = 1; // Same muscle - least preferred
      }

      // Bonus for compounds early in the workout
      if (candidate.exerciseType === 'compound' && reordered.length < 3) {
        score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    // Take the best candidate (or first remaining if all are related)
    const nextIndex = bestIndex >= 0 ? bestIndex : 0;
    reordered.push(remaining.splice(nextIndex, 1)[0]);
  }

  return reordered;
};

// Get all target muscle groups from a workout structure
const getTargetMuscleGroups = (workoutType) => {
  const structure = WORKOUT_STRUCTURES[workoutType];
  if (!structure) return [];
  return [
    ...structure.primaryMuscles,
    ...structure.secondaryMuscles,
    ...structure.tertiaryMuscles
  ];
};

// Check which target muscles are covered by the current exercise list
const getMusclesCovered = (exercises) => {
  const covered = new Set();
  exercises.forEach(ex => {
    if (ex.muscleGroup && ex.muscleGroup !== 'Cardio') {
      covered.add(ex.muscleGroup);
    }
  });
  return covered;
};

// Find a compound exercise that covers multiple of the missing muscles
const findCompoundForMuscles = (targetMuscles, usedExerciseIds = []) => {
  // Look for compounds that hit any of the target muscles
  const compounds = ALL_EXERCISES.filter(ex =>
    ex.type === 'compound' &&
    targetMuscles.includes(ex.muscleGroup) &&
    !usedExerciseIds.includes(ex.id || ex.name)
  );

  // Sort by how many target muscles they help with (via related muscles)
  compounds.sort((a, b) => {
    const aRelated = RELATED_MUSCLE_GROUPS[a.muscleGroup] || [];
    const bRelated = RELATED_MUSCLE_GROUPS[b.muscleGroup] || [];
    const aHits = targetMuscles.filter(m => m === a.muscleGroup || aRelated.includes(m)).length;
    const bHits = targetMuscles.filter(m => m === b.muscleGroup || bRelated.includes(m)).length;
    return bHits - aHits; // Higher hits first
  });

  return compounds[0] || null;
};

// Ensure all target muscle groups are covered when shortening a workout
// May swap isolation exercises for compounds to maintain coverage
const ensureMuscleGroupCoverage = (exercises, workoutType, fullExercisePool) => {
  const targetMuscles = getTargetMuscleGroups(workoutType);
  if (targetMuscles.length === 0) return exercises;

  let result = [...exercises];
  const covered = getMusclesCovered(result);
  const missing = targetMuscles.filter(m => !covered.has(m));

  if (missing.length === 0) return result; // All covered

  // Try to add compounds that cover missing muscles
  const usedIds = result.map(ex => ex.id);

  for (const missingMuscle of missing) {
    // First, check if we can find a compound in the pool that covers this
    const compound = findCompoundForMuscles([missingMuscle], usedIds);
    if (compound) {
      // Find an isolation exercise we can swap out (preferably targeting a muscle we have multiple exercises for)
      const muscleCount = {};
      result.forEach(ex => {
        if (ex.exerciseType !== 'compound') {
          muscleCount[ex.muscleGroup] = (muscleCount[ex.muscleGroup] || 0) + 1;
        }
      });

      // Find an isolation with duplicate muscle coverage
      const swapIndex = result.findIndex(ex =>
        ex.exerciseType !== 'compound' &&
        muscleCount[ex.muscleGroup] > 1 &&
        ex.muscleGroup !== missingMuscle
      );

      if (swapIndex >= 0) {
        // Swap the isolation for the compound
        result[swapIndex] = {
          id: compound.id || compound.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: compound.name,
          sets: result[swapIndex].sets,
          targetReps: result[swapIndex].targetReps,
          suggestedWeight: 0,
          lastWeight: 0,
          lastReps: Array(result[swapIndex].sets).fill(result[swapIndex].targetReps),
          restTime: result[swapIndex].restTime + 30, // Compounds need more rest
          muscleGroup: compound.muscleGroup,
          equipment: compound.equipment,
          exerciseType: 'compound',
        };
        usedIds.push(compound.id || compound.name);
      }
    }
  }

  return result;
};

// Workout structure definitions (muscle groups to target, not specific exercises)
const WORKOUT_STRUCTURES = {
  push: {
    name: 'Push Day',
    primaryMuscles: ['Chest', 'Upper Chest'],
    secondaryMuscles: ['Shoulders', 'Side Delts'],
    tertiaryMuscles: ['Triceps'],
    exerciseCounts: { primary: 2, secondary: 2, tertiary: 1 },
    focus: 'Chest, Shoulders & Triceps',
  },
  pull: {
    name: 'Pull Day',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Rear Delts', 'Traps'],
    tertiaryMuscles: ['Biceps'],
    exerciseCounts: { primary: 3, secondary: 1, tertiary: 2 },
    focus: 'Back & Biceps',
  },
  legs_quad: {
    name: 'Leg Day (Quad Focus)',
    primaryMuscles: ['Quads'],
    secondaryMuscles: ['Hamstrings', 'Glutes'],
    tertiaryMuscles: ['Calves'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 1 },
    focus: 'Quads, Hamstrings & Glutes',
  },
  legs_posterior: {
    name: 'Leg Day (Posterior Focus)',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Quads'],
    tertiaryMuscles: ['Calves'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 1 },
    focus: 'Hamstrings, Glutes & Quads',
  },
  upper: {
    name: 'Upper Body',
    primaryMuscles: ['Chest', 'Back', 'Lats'],
    secondaryMuscles: ['Shoulders', 'Side Delts'],
    tertiaryMuscles: ['Biceps', 'Triceps'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 2 },
    focus: 'Chest, Back & Shoulders',
  },
  lower: {
    name: 'Lower Body',
    primaryMuscles: ['Quads', 'Hamstrings'],
    secondaryMuscles: ['Glutes'],
    tertiaryMuscles: ['Calves'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 1 },
    focus: 'Full Leg Development',
  },
  full_body: {
    name: 'Full Body',
    primaryMuscles: ['Quads', 'Chest', 'Back'],
    secondaryMuscles: ['Shoulders', 'Hamstrings'],
    tertiaryMuscles: ['Biceps', 'Triceps'],
    exerciseCounts: { primary: 3, secondary: 2, tertiary: 2 },
    focus: 'Complete Body Training',
  },
  arms: {
    name: 'Arms Day',
    primaryMuscles: ['Biceps', 'Triceps'],
    secondaryMuscles: ['Forearms'],
    tertiaryMuscles: [],
    exerciseCounts: { primary: 4, secondary: 1, tertiary: 0 },
    focus: 'Biceps & Triceps',
  },
};

// Core/Ab exercises for finishers
const CORE_MUSCLE_GROUPS = ['Abs', 'Core', 'Obliques'];

// Cardio exercises for weight loss goals
const CARDIO_EXERCISES = [
  { name: 'Treadmill Intervals', duration: 15, description: '30s sprint / 60s walk intervals', type: 'cardio', caloriesBurned: 200 },
  { name: 'Rowing Machine', duration: 10, description: 'Moderate intensity, focus on full strokes', type: 'cardio', caloriesBurned: 150 },
  { name: 'Stair Climber', duration: 12, description: 'Steady state, level 6-8', type: 'cardio', caloriesBurned: 180 },
  { name: 'Jump Rope', duration: 10, description: '30s on / 15s rest intervals', type: 'cardio', caloriesBurned: 160 },
  { name: 'Stationary Bike HIIT', duration: 15, description: '20s max effort / 40s recovery', type: 'cardio', caloriesBurned: 190 },
  { name: 'Battle Ropes', duration: 8, description: '20s work / 20s rest', type: 'cardio', caloriesBurned: 120 },
  { name: 'Burpees', duration: 10, description: '10 reps x 5 sets with 30s rest', type: 'cardio', caloriesBurned: 150 },
  { name: 'Mountain Climbers', duration: 8, description: '30s on / 30s rest', type: 'cardio', caloriesBurned: 100 },
];

// ============================================
// INJURY RECOVERY SYSTEM
// ============================================

// Injury severity levels with recovery time multipliers
const INJURY_SEVERITY = {
  mild: { label: 'Mild', description: 'Minor discomfort, slight pain', multiplier: 1, color: '#fbbf24' },
  moderate: { label: 'Moderate', description: 'Noticeable pain, limited movement', multiplier: 1.5, color: '#f97316' },
  severe: { label: 'Severe', description: 'Significant pain, major limitation', multiplier: 2.5, color: '#ef4444' },
};

// Recovery phases with descriptions
const RECOVERY_PHASES = {
  rest: {
    name: 'Rest & Protect',
    description: 'Complete rest for the injured area. Focus on reducing inflammation.',
    icon: '🛌',
    tips: [
      'Apply ice for 15-20 minutes every 2-3 hours',
      'Keep the injured area elevated when possible',
      'Avoid any movements that cause pain',
      'Stay hydrated and eat anti-inflammatory foods',
      'Get plenty of sleep for tissue repair',
    ],
  },
  recovery: {
    name: 'Active Recovery',
    description: 'Gentle movement and stretching to restore mobility.',
    icon: '🧘',
    tips: [
      'Start with gentle range of motion exercises',
      'Light stretching - never push through pain',
      'Consider foam rolling nearby muscles',
      'Short walks to maintain general fitness',
      'Listen to your body and rest if needed',
    ],
  },
  strengthening: {
    name: 'Rebuilding Strength',
    description: 'Progressive loading to restore muscle strength.',
    icon: '💪',
    tips: [
      'Start with bodyweight or very light weights',
      'Focus on controlled movements',
      'Gradually increase resistance over time',
      'Include stability and balance work',
      'Stop immediately if you feel sharp pain',
    ],
  },
  return: {
    name: 'Return to Training',
    description: 'Gradually return to your normal workout routine.',
    icon: '🏋️',
    tips: [
      'Start at 50-70% of your previous intensity',
      'Increase volume before intensity',
      'Include extra warm-up for the affected area',
      'Monitor for any pain or discomfort',
      'Be patient - full recovery takes time',
    ],
  },
};

// Base recovery timelines (in days) for each muscle group by injury type
const INJURY_RECOVERY_DATA = {
  // Upper Body
  'Chest': { baseDays: 7, restPercent: 30, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Upper Chest', 'Front Delts', 'Triceps'] },
  'Upper Chest': { baseDays: 7, restPercent: 30, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Chest', 'Front Delts'] },
  'Back': { baseDays: 10, restPercent: 35, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Lats', 'Rear Delts', 'Biceps'] },
  'Lats': { baseDays: 8, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Back', 'Biceps'] },
  'Shoulders': { baseDays: 14, restPercent: 40, recoveryPercent: 30, strengthenPercent: 20, relatedMuscles: ['Front Delts', 'Side Delts', 'Rear Delts'] },
  'Front Delts': { baseDays: 10, restPercent: 35, recoveryPercent: 30, strengthenPercent: 25, relatedMuscles: ['Shoulders', 'Chest'] },
  'Side Delts': { baseDays: 8, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Shoulders'] },
  'Rear Delts': { baseDays: 8, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Shoulders', 'Back'] },
  'Biceps': { baseDays: 7, restPercent: 25, recoveryPercent: 35, strengthenPercent: 30, relatedMuscles: ['Forearms'] },
  'Triceps': { baseDays: 7, restPercent: 25, recoveryPercent: 35, strengthenPercent: 30, relatedMuscles: ['Chest', 'Shoulders'] },
  'Forearms': { baseDays: 10, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: ['Biceps'] },
  // Lower Body
  'Quads': { baseDays: 10, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Glutes'] },
  'Hamstrings': { baseDays: 14, restPercent: 40, recoveryPercent: 30, strengthenPercent: 20, relatedMuscles: ['Glutes', 'Lower Back'] },
  'Glutes': { baseDays: 10, restPercent: 30, recoveryPercent: 35, strengthenPercent: 25, relatedMuscles: ['Quads', 'Hamstrings'] },
  'Calves': { baseDays: 10, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: [] },
  'Hip Flexors': { baseDays: 12, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: ['Quads', 'Core'] },
  // Core & Back
  'Abs': { baseDays: 7, restPercent: 25, recoveryPercent: 40, strengthenPercent: 25, relatedMuscles: ['Core', 'Obliques'] },
  'Core': { baseDays: 10, restPercent: 30, recoveryPercent: 40, strengthenPercent: 20, relatedMuscles: ['Abs', 'Lower Back'] },
  'Lower Back': { baseDays: 21, restPercent: 45, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Core', 'Glutes', 'Hamstrings'] },
  'Obliques': { baseDays: 7, restPercent: 25, recoveryPercent: 40, strengthenPercent: 25, relatedMuscles: ['Abs', 'Core'] },
  'Traps': { baseDays: 10, restPercent: 35, recoveryPercent: 35, strengthenPercent: 20, relatedMuscles: ['Shoulders', 'Back'] },
  // General
  'Neck': { baseDays: 14, restPercent: 50, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Traps'] },
  'Groin': { baseDays: 14, restPercent: 40, recoveryPercent: 35, strengthenPercent: 15, relatedMuscles: ['Hip Flexors', 'Quads'] },
  'Knee': { baseDays: 21, restPercent: 45, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Quads', 'Hamstrings', 'Calves'] },
  'Ankle': { baseDays: 14, restPercent: 40, recoveryPercent: 35, strengthenPercent: 15, relatedMuscles: ['Calves'] },
  'Wrist': { baseDays: 14, restPercent: 40, recoveryPercent: 35, strengthenPercent: 15, relatedMuscles: ['Forearms'] },
  'Elbow': { baseDays: 21, restPercent: 45, recoveryPercent: 30, strengthenPercent: 15, relatedMuscles: ['Biceps', 'Triceps', 'Forearms'] },
};

// Recovery exercises for each muscle group
const RECOVERY_EXERCISES = {
  'Chest': [
    { name: 'Chest Stretch', duration: '30 sec each side', description: 'Doorway stretch, gentle hold' },
    { name: 'Arm Circles', duration: '1 min', description: 'Small to large circles, both directions' },
    { name: 'Wall Push-ups', duration: '2x10', description: 'Very light, focus on range of motion' },
  ],
  'Back': [
    { name: 'Cat-Cow Stretch', duration: '1 min', description: 'Slow, controlled movements' },
    { name: 'Child\'s Pose', duration: '1 min', description: 'Gentle lat stretch' },
    { name: 'Prone Y Raises', duration: '2x10', description: 'No weight, focus on activation' },
  ],
  'Shoulders': [
    { name: 'Pendulum Swings', duration: '1 min each arm', description: 'Let arm hang and swing gently' },
    { name: 'Wall Slides', duration: '2x10', description: 'Back against wall, slide arms up' },
    { name: 'Band Pull-Aparts', duration: '2x15', description: 'Very light band' },
  ],
  'Biceps': [
    { name: 'Bicep Stretch', duration: '30 sec each arm', description: 'Arm extended, palm on wall' },
    { name: 'Wrist Rotations', duration: '1 min', description: 'Gentle circles both directions' },
    { name: 'Light Curls', duration: '2x15', description: '1-2kg max, full range of motion' },
  ],
  'Triceps': [
    { name: 'Tricep Stretch', duration: '30 sec each arm', description: 'Overhead stretch' },
    { name: 'Arm Extensions', duration: '2x15', description: 'No weight, focus on extension' },
  ],
  'Quads': [
    { name: 'Quad Stretch', duration: '30 sec each leg', description: 'Standing or lying' },
    { name: 'Leg Swings', duration: '1 min each leg', description: 'Front to back, controlled' },
    { name: 'Wall Sits', duration: '3x15 sec', description: 'Shallow angle, no pain' },
  ],
  'Hamstrings': [
    { name: 'Hamstring Stretch', duration: '30 sec each leg', description: 'Seated or lying' },
    { name: 'Good Mornings', duration: '2x10', description: 'No weight, gentle hinge' },
    { name: 'Glute Bridges', duration: '2x12', description: 'Focus on hamstring engagement' },
  ],
  'Glutes': [
    { name: 'Pigeon Stretch', duration: '30 sec each side', description: 'Gentle hip opener' },
    { name: 'Clamshells', duration: '2x15 each side', description: 'Side lying, no band' },
    { name: 'Glute Bridges', duration: '2x12', description: 'Bodyweight only' },
  ],
  'Lower Back': [
    { name: 'Knee to Chest', duration: '30 sec each leg', description: 'Lying on back' },
    { name: 'Pelvic Tilts', duration: '2x15', description: 'Lying on back, gentle movement' },
    { name: 'Bird Dogs', duration: '2x8 each side', description: 'Slow and controlled' },
  ],
  'Core': [
    { name: 'Dead Bug', duration: '2x8 each side', description: 'Slow, controlled movement' },
    { name: 'Diaphragmatic Breathing', duration: '2 min', description: 'Deep belly breaths' },
    { name: 'Gentle Planks', duration: '3x15 sec', description: 'On knees if needed' },
  ],
};

// Restrengthening exercises (progressive loading)
const RESTRENGTHENING_EXERCISES = {
  'Chest': [
    { name: 'Incline Push-ups', sets: 3, reps: 12, description: 'Hands elevated, controlled tempo' },
    { name: 'Light Dumbbell Press', sets: 3, reps: 12, description: 'Start with 50% usual weight' },
    { name: 'Cable Flyes', sets: 3, reps: 15, description: 'Light weight, full stretch' },
  ],
  'Back': [
    { name: 'Banded Rows', sets: 3, reps: 15, description: 'Focus on squeeze at top' },
    { name: 'Light Lat Pulldowns', sets: 3, reps: 12, description: 'Controlled negative' },
    { name: 'Face Pulls', sets: 3, reps: 15, description: 'Light band, external rotation' },
  ],
  'Shoulders': [
    { name: 'Band External Rotation', sets: 3, reps: 15, description: 'Elbow at side' },
    { name: 'Light Lateral Raises', sets: 3, reps: 15, description: 'Very light, controlled' },
    { name: 'Y-T-W Raises', sets: 2, reps: 10, description: 'Prone position, no weight' },
  ],
  'Quads': [
    { name: 'Bodyweight Squats', sets: 3, reps: 12, description: 'Controlled, pain-free range' },
    { name: 'Step Ups', sets: 3, reps: 10, description: 'Low step, focus on control' },
    { name: 'Leg Extensions', sets: 3, reps: 15, description: 'Light weight, full extension' },
  ],
  'Hamstrings': [
    { name: 'Romanian Deadlifts', sets: 3, reps: 10, description: 'Very light, focus on stretch' },
    { name: 'Stability Ball Curls', sets: 3, reps: 12, description: 'Slow and controlled' },
    { name: 'Single Leg Glute Bridges', sets: 3, reps: 10, description: 'Focus on hamstring' },
  ],
  'Lower Back': [
    { name: 'Superman Holds', sets: 3, reps: '10 sec', description: 'Gentle, don\'t overextend' },
    { name: 'Hip Hinges', sets: 3, reps: 12, description: 'No weight, perfect form' },
    { name: 'Kettlebell Deadlifts', sets: 3, reps: 10, description: 'Very light, controlled' },
  ],
};

// Motivational coaching messages for each phase
const COACHING_MESSAGES = {
  rest: [
    "Rest is not giving up - it's part of getting stronger. Your body is healing right now.",
    "Every day of proper rest is an investment in your future performance. Trust the process.",
    "The strongest athletes know when to rest. You're making the right choice.",
    "Your muscles are rebuilding right now. Give them the time they need.",
    "Recovery is where the magic happens. You're doing great by listening to your body.",
  ],
  recovery: [
    "You're making progress! Gentle movement is exactly what your body needs right now.",
    "Each small movement is a step toward full recovery. Keep going!",
    "You're in the healing zone now. These exercises are rebuilding your strength foundation.",
    "Moving again feels good, doesn't it? Your body is responding well.",
    "Patience and persistence - you've got both. Recovery is going well!",
  ],
  strengthening: [
    "You're getting stronger every day! Your body has healed and is ready to rebuild.",
    "This is exciting - you're rebuilding better than before. Stay focused!",
    "Controlled progress is smart progress. You're doing this the right way.",
    "Your comeback is happening right now. Each rep is bringing you back stronger.",
    "The finish line is in sight. Keep up the amazing work!",
  ],
  return: [
    "Welcome back! You've earned this through patience and smart training.",
    "You did it the right way - full recovery means you're back for good.",
    "Stronger, smarter, and ready to crush it. Your dedication paid off!",
    "This injury taught you something valuable. Now go show what you've got!",
    "Full strength, full confidence. Time to get after it!",
  ],
};

// Calculate recovery timeline for an injury
const calculateRecoveryTimeline = (muscleGroup, severity, startDate) => {
  const recoveryData = INJURY_RECOVERY_DATA[muscleGroup] || INJURY_RECOVERY_DATA['Core'];
  const severityData = INJURY_SEVERITY[severity] || INJURY_SEVERITY.moderate;

  const totalDays = Math.round(recoveryData.baseDays * severityData.multiplier);
  const restDays = Math.round(totalDays * (recoveryData.restPercent / 100));
  const recoveryDays = Math.round(totalDays * (recoveryData.recoveryPercent / 100));
  const strengthenDays = Math.round(totalDays * (recoveryData.strengthenPercent / 100));
  const returnDays = totalDays - restDays - recoveryDays - strengthenDays;

  const start = new Date(startDate);

  return {
    totalDays,
    phases: {
      rest: {
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + restDays * 24 * 60 * 60 * 1000).toISOString(),
        days: restDays,
      },
      recovery: {
        startDate: new Date(start.getTime() + restDays * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + (restDays + recoveryDays) * 24 * 60 * 60 * 1000).toISOString(),
        days: recoveryDays,
      },
      strengthening: {
        startDate: new Date(start.getTime() + (restDays + recoveryDays) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + (restDays + recoveryDays + strengthenDays) * 24 * 60 * 60 * 1000).toISOString(),
        days: strengthenDays,
      },
      return: {
        startDate: new Date(start.getTime() + (restDays + recoveryDays + strengthenDays) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString(),
        days: returnDays,
      },
    },
    expectedRecoveryDate: new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString(),
    affectedMuscles: [muscleGroup, ...(recoveryData.relatedMuscles || [])],
  };
};

// Get current recovery phase for an injury
const getCurrentRecoveryPhase = (injury) => {
  if (!injury || !injury.timeline) return null;

  const now = new Date();
  const { phases } = injury.timeline;

  for (const [phaseName, phaseData] of Object.entries(phases)) {
    const start = new Date(phaseData.startDate);
    const end = new Date(phaseData.endDate);
    if (now >= start && now < end) {
      const daysIntoPhase = Math.floor((now - start) / (24 * 60 * 60 * 1000));
      const daysRemaining = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
      return {
        phase: phaseName,
        ...RECOVERY_PHASES[phaseName],
        daysIntoPhase,
        daysRemaining,
        percentComplete: Math.round((daysIntoPhase / phaseData.days) * 100),
      };
    }
  }

  // If past all phases, return completed
  const recoveryEnd = new Date(injury.timeline.expectedRecoveryDate);
  if (now >= recoveryEnd) {
    return { phase: 'completed', name: 'Fully Recovered', icon: '✅', percentComplete: 100 };
  }

  return null;
};

// Get a random coaching message for the current phase
const getCoachingMessage = (phase) => {
  const messages = COACHING_MESSAGES[phase] || COACHING_MESSAGES.rest;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Check if a muscle group is injured and should be avoided
const isMuscleInjured = (muscleGroup, injuries) => {
  if (!injuries || injuries.length === 0) return false;

  return injuries.some(injury => {
    if (!injury.active) return false;
    const phase = getCurrentRecoveryPhase(injury);
    // During rest phase, avoid all related muscles
    if (phase?.phase === 'rest') {
      return injury.timeline.affectedMuscles.includes(muscleGroup);
    }
    // During recovery phase, still avoid direct work on the injured muscle
    if (phase?.phase === 'recovery') {
      return injury.muscleGroup === muscleGroup;
    }
    return false;
  });
};

// Get recovery exercises to add to a workout based on current injuries
const getRecoveryExercisesForWorkout = (injuries) => {
  const exercises = [];

  injuries.forEach(injury => {
    if (!injury.active) return;
    const phase = getCurrentRecoveryPhase(injury);

    if (phase?.phase === 'recovery') {
      const recoveryExs = RECOVERY_EXERCISES[injury.muscleGroup] || RECOVERY_EXERCISES['Core'];
      exercises.push(...recoveryExs.map(ex => ({
        ...ex,
        isRecovery: true,
        forInjury: injury.muscleGroup,
        phase: 'recovery',
      })));
    } else if (phase?.phase === 'strengthening') {
      const strengthExs = RESTRENGTHENING_EXERCISES[injury.muscleGroup] || [];
      if (strengthExs.length > 0) {
        // Add 1-2 restrengthening exercises
        exercises.push(...strengthExs.slice(0, 2).map(ex => ({
          ...ex,
          isRecovery: true,
          forInjury: injury.muscleGroup,
          phase: 'strengthening',
        })));
      }
    }
  });

  return exercises;
};

// Helper: Get random element from array
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Get random number in range (inclusive)
const getRandomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Shuffle array (Fisher-Yates)
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate a unique exercise ID
const generateExerciseId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);

// Select exercises for a muscle group, avoiding recently used ones
const selectExercisesForMuscleGroup = (muscleGroups, count, usedExercises = [], preferCompound = true) => {
  // Get all exercises for these muscle groups
  let available = ALL_EXERCISES.filter(ex => muscleGroups.includes(ex.muscleGroup));

  // Filter out recently used exercises
  available = available.filter(ex => !usedExercises.includes(ex.name));

  // Sort: compounds first if preferred
  if (preferCompound) {
    available.sort((a, b) => {
      if (a.type === 'compound' && b.type !== 'compound') return -1;
      if (a.type !== 'compound' && b.type === 'compound') return 1;
      return 0;
    });
  }

  // Shuffle within type groups for variety
  const compounds = shuffleArray(available.filter(ex => ex.type === 'compound'));
  const isolations = shuffleArray(available.filter(ex => ex.type === 'isolation'));

  // Take the required count, preferring compounds for first exercises
  const selected = [];
  const pool = preferCompound ? [...compounds, ...isolations] : shuffleArray(available);

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    selected.push(pool[i]);
  }

  return selected;
};

// Generate a complete dynamic workout
const generateDynamicWorkout = (workoutType, userGoal = 'build_muscle', recentlyUsedExercises = [], userExperience = 'beginner') => {
  const structure = WORKOUT_STRUCTURES[workoutType];
  if (!structure) return null;

  const params = GOAL_TRAINING_PARAMS[userGoal] || GOAL_TRAINING_PARAMS.build_muscle;
  const usedInThisWorkout = [...recentlyUsedExercises];
  const exercises = [];
  const isAdvanced = ['experienced', 'expert'].includes(userExperience);

  // Generate exercises for primary muscle groups
  const primaryExercises = selectExercisesForMuscleGroup(
    structure.primaryMuscles,
    structure.exerciseCounts.primary,
    usedInThisWorkout,
    params.compoundFirst
  );
  primaryExercises.forEach(ex => usedInThisWorkout.push(ex.name));

  // Generate exercises for secondary muscle groups
  const secondaryExercises = selectExercisesForMuscleGroup(
    structure.secondaryMuscles,
    structure.exerciseCounts.secondary,
    usedInThisWorkout,
    false
  );
  secondaryExercises.forEach(ex => usedInThisWorkout.push(ex.name));

  // Generate exercises for tertiary muscle groups
  const tertiaryExercises = selectExercisesForMuscleGroup(
    structure.tertiaryMuscles,
    structure.exerciseCounts.tertiary,
    usedInThisWorkout,
    false
  );
  tertiaryExercises.forEach(ex => usedInThisWorkout.push(ex.name));

  // Combine and format exercises
  const allSelected = [...primaryExercises, ...secondaryExercises, ...tertiaryExercises];

  allSelected.forEach((ex, index) => {
    const sets = getRandomInRange(params.setsPerExercise[0], params.setsPerExercise[1]);
    const reps = getRandomInRange(params.repsPerSet[0], params.repsPerSet[1]);
    const rest = getRandomInRange(params.restTime[0], params.restTime[1]);

    // Compounds get longer rest, isolations get shorter
    const adjustedRest = ex.type === 'compound' ? rest + 30 : rest - 15;

    exercises.push({
      id: generateExerciseId(ex.name),
      name: ex.name,
      sets: sets,
      targetReps: reps,
      suggestedWeight: 0, // Will be calculated based on user history
      lastWeight: 0,
      lastReps: Array(sets).fill(reps),
      restTime: Math.max(30, adjustedRest),
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      exerciseType: ex.type,
      targetedHeads: isAdvanced && ex.targetedHeads ? ex.targetedHeads : null, // Show for advanced users
    });
  });

  // Add a core/ab finisher
  const coreExercises = selectExercisesForMuscleGroup(
    CORE_MUSCLE_GROUPS,
    1,
    usedInThisWorkout,
    false
  );

  if (coreExercises.length > 0) {
    const coreEx = coreExercises[0];
    const isHold = coreEx.name.includes('Plank') || coreEx.name.includes('Hold') || coreEx.name.includes('L-Sit');
    exercises.push({
      id: generateExerciseId(coreEx.name),
      name: coreEx.name,
      sets: 3,
      targetReps: isHold ? 45 : 15, // Seconds for holds, reps for movements
      suggestedWeight: 0,
      lastWeight: 0,
      lastReps: isHold ? [45, 40, 35] : [15, 12, 10],
      restTime: 45,
      muscleGroup: coreEx.muscleGroup,
      equipment: coreEx.equipment,
      exerciseType: coreEx.type,
    });
  }

  // Add cardio for weight loss / lean goals
  let cardioExercise = null;
  if (['lose_fat', 'lean', 'fitness'].includes(userGoal)) {
    const cardio = getRandomElement(CARDIO_EXERCISES);
    cardioExercise = {
      id: generateExerciseId(cardio.name),
      name: cardio.name,
      sets: 1,
      targetReps: cardio.duration, // Duration in minutes
      isCardio: true,
      duration: cardio.duration,
      description: cardio.description,
      caloriesBurned: cardio.caloriesBurned,
      restTime: 0,
      muscleGroup: 'Cardio',
      exerciseType: 'cardio',
    };
    exercises.push(cardioExercise);
  }

  // Generate goal-specific workout explanation
  const goalExplanations = {
    bulk: `High-volume training with moderate reps to maximize muscle growth. Compounds first for strength, followed by isolation work for detail.`,
    build_muscle: `Balanced hypertrophy focus with 8-12 rep ranges. Exercise selection targets all heads of each muscle group for complete development.`,
    strength: `Lower rep ranges with longer rest periods to maximize neural adaptation. Heavy compounds prioritized for strength gains.`,
    recomp: `Moderate volume with compound movements to build muscle while burning calories. Balanced approach for body composition.`,
    fitness: `Higher rep ranges with shorter rest to improve muscular endurance and cardiovascular health. Full body engagement.`,
    athletic: `Power-focused movements with moderate reps. Exercises selected for functional strength and explosive power.`,
    lean: `Higher reps with minimal rest to elevate heart rate. Compound movements maximize calorie burn while preserving muscle.`,
    lose_fat: `Circuit-style training with cardio finisher. Shorter rest keeps heart rate elevated for maximum fat burning while maintaining muscle.`,
  };

  const explanation = goalExplanations[userGoal] || goalExplanations.build_muscle;

  // Create detailed workout reasoning
  const primaryMuscleNames = structure.primaryMuscles.join(', ');
  const todaysFocus = `Today's focus is ${structure.focus.toLowerCase()}, targeting ${primaryMuscleNames} as the primary muscle groups.`;
  const goalRationale = explanation;
  const exerciseRationale = `${exercises.length} exercises selected to ensure complete ${workoutType} development while avoiding overtraining.`;

  // Reorder exercises to avoid same/related muscle groups back-to-back
  // This provides better recovery between exercises
  // Keep cardio at the end
  const cardioInList = exercises.filter(ex => ex.isCardio || ex.muscleGroup === 'Cardio');
  const nonCardioInList = exercises.filter(ex => !ex.isCardio && ex.muscleGroup !== 'Cardio');
  const reorderedExercises = [...reorderExercisesForRecovery(nonCardioInList), ...cardioInList];

  return {
    id: `${workoutType}_${Date.now()}`,
    name: structure.name,
    focus: structure.focus,
    description: `${todaysFocus} ${goalRationale}`,
    todaysFocus: todaysFocus,
    goalRationale: goalRationale,
    exerciseRationale: exerciseRationale,
    goals: [`${structure.focus} development`, 'Progressive overload', 'Balanced training'],
    exercises: reorderedExercises,
    generatedAt: new Date().toISOString(),
    workoutType: workoutType,
    userGoal: userGoal,
    hasCardio: cardioExercise !== null,
  };
};

// Map old template IDs to workout types for backwards compatibility
const TEMPLATE_TO_WORKOUT_TYPE = {
  push_a: 'push', push_b: 'push',
  pull_a: 'pull', pull_b: 'pull',
  legs_a: 'legs_quad', legs_b: 'legs_posterior',
  upper_a: 'upper', upper_b: 'upper',
  lower: 'lower',
  full_body_a: 'full_body', full_body_b: 'full_body',
  arms: 'arms',
  chest_specialization: 'push',
  back_specialization: 'pull',
  leg_specialization: 'lower',
  powerlifting_squat: 'legs_quad',
  powerlifting_bench: 'push',
  powerlifting_deadlift: 'pull',
  athletic_power: 'full_body',
};

// ============================================
// END DYNAMIC WORKOUT GENERATION
// ============================================

// Workout Templates Database (kept for reference/fallback)
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
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 60, muscleGroup: 'Abs' },
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
      { id: 'cable_crunch', name: 'Cable Crunches', sets: 3, targetReps: 15, suggestedWeight: 0, lastWeight: 0, lastReps: [15, 14, 12], restTime: 60, muscleGroup: 'Abs' },
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
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
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
      { id: 'hanging_knee_raise', name: 'Hanging Knee Raises', sets: 3, targetReps: 15, suggestedWeight: 0, lastWeight: 0, lastReps: [15, 12, 10], restTime: 60, muscleGroup: 'Abs' },
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
      { id: 'plank', name: 'Plank', sets: 3, targetReps: 45, suggestedWeight: 0, lastWeight: 0, lastReps: [45, 45, 40], restTime: 45, muscleGroup: 'Core' },
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
      { id: 'ab_wheel', name: 'Ab Wheel Rollout', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 8, 8], restTime: 60, muscleGroup: 'Core' },
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
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 60, muscleGroup: 'Abs' },
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
      { id: 'v_ups', name: 'V-Ups', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 45, muscleGroup: 'Abs' },
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
      { id: 'bicycle_crunch', name: 'Bicycle Crunches', sets: 3, targetReps: 20, suggestedWeight: 0, lastWeight: 0, lastReps: [20, 18, 15], restTime: 45, muscleGroup: 'Abs' },
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
      { id: 'hanging_knee_raise', name: 'Hanging Knee Raises', sets: 3, targetReps: 15, suggestedWeight: 0, lastWeight: 0, lastReps: [15, 12, 10], restTime: 60, muscleGroup: 'Abs' },
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
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
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
      { id: 'plank', name: 'Plank', sets: 3, targetReps: 45, suggestedWeight: 0, lastWeight: 0, lastReps: [45, 40, 35], restTime: 45, muscleGroup: 'Core' },
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
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', sets: 3, targetReps: 12, suggestedWeight: 0, lastWeight: 0, lastReps: [12, 10, 8], restTime: 60, muscleGroup: 'Abs' },
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
      { id: 'ab_wheel', name: 'Ab Wheel Rollout', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 8, 8], restTime: 60, muscleGroup: 'Core' },
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
      { id: 'hollow_hold', name: 'Hollow Body Hold', sets: 3, targetReps: 30, suggestedWeight: 0, lastWeight: 0, lastReps: [30, 25, 20], restTime: 45, muscleGroup: 'Core' },
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
      { id: 'dead_bug', name: 'Dead Bug', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
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
      { id: 'pallof_press', name: 'Pallof Press', sets: 3, targetReps: 10, suggestedWeight: 0, lastWeight: 0, lastReps: [10, 10, 8], restTime: 45, muscleGroup: 'Core' },
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

// Workout time calculation constants and helpers (outside component for initialization)
const WORKOUT_TIMING = {
  AVG_SET_DURATION: 45, // Average time to complete one set (seconds)
  WARMUP_TIME: 180, // 3 minutes warmup
  COOLDOWN_TIME: 120, // 2 minutes cooldown
  TRANSITION_TIME: 30, // Time to move between exercises
};

const calculateWorkoutDuration = (exerciseList) => {
  if (!exerciseList || exerciseList.length === 0) return 0;
  let totalSeconds = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME;
  exerciseList.forEach((ex, exIndex) => {
    const sets = ex.sets || 3;
    const restTime = ex.restTime || 90;
    totalSeconds += sets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalSeconds += (sets - 1) * restTime;
    if (exIndex < exerciseList.length - 1) totalSeconds += WORKOUT_TIMING.TRANSITION_TIME;
  });
  return totalSeconds;
};

const optimizeExercisesForTime = (exerciseList, targetMinutes) => {
  if (!exerciseList || exerciseList.length === 0) return exerciseList;
  const targetSeconds = targetMinutes * 60;

  // Calculate fixed time components
  const fixedTime = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME +
    (exerciseList.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;

  // Start with base exercises
  let optimized = exerciseList.map(ex => ({ ...ex, sets: ex.sets || 3 }));

  // Calculate total sets and working time
  let totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
  let workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;

  // Calculate total rest periods needed (sets - exercises, since no rest after last set of each exercise)
  let totalRestPeriods = totalSets - optimized.length;

  // Available time for rest
  let availableRestTime = targetSeconds - fixedTime - workingTime;

  // If we have negative rest time, we need to reduce sets
  while (availableRestTime < totalRestPeriods * 30 && optimized.some(ex => ex.sets > 2)) {
    // Reduce sets from exercise with most sets
    const maxSetsEx = optimized.reduce((max, ex) => (ex.sets > max.sets) ? ex : max, optimized[0]);
    if (maxSetsEx.sets <= 2) break;
    const idx = optimized.findIndex(ex => ex.id === maxSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets - 1 };

    // Recalculate
    totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalRestPeriods = totalSets - optimized.length;
    availableRestTime = targetSeconds - fixedTime - workingTime;
  }

  // If we have too much time, add sets
  while (availableRestTime > totalRestPeriods * 180 && optimized.some(ex => ex.sets < 5)) {
    const minSetsEx = optimized.reduce((min, ex) => (ex.sets < min.sets && ex.sets < 5) ? ex : min, optimized[0]);
    if (minSetsEx.sets >= 5) break;
    const idx = optimized.findIndex(ex => ex.id === minSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets + 1 };

    // Recalculate
    totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    totalRestPeriods = totalSets - optimized.length;
    availableRestTime = targetSeconds - fixedTime - workingTime;
  }

  // Now distribute rest time EVENLY across all rest periods
  const restPerPeriod = totalRestPeriods > 0
    ? Math.max(30, Math.min(180, Math.round(availableRestTime / totalRestPeriods)))
    : 90;

  // Apply the same rest time to ALL exercises (even distribution)
  optimized = optimized.map(ex => ({
    ...ex,
    restTime: restPerPeriod
  }));

  return optimized;
};

const getWorkoutTimeBreakdown = (exerciseList) => {
  if (!exerciseList || exerciseList.length === 0) {
    return { workingTime: 0, restTime: 0, totalTime: 0, warmupCooldown: WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME };
  }
  let workingSeconds = 0, restSeconds = 0;
  exerciseList.forEach((ex) => {
    workingSeconds += (ex.sets || 3) * WORKOUT_TIMING.AVG_SET_DURATION;
    restSeconds += ((ex.sets || 3) - 1) * (ex.restTime || 90);
  });
  const transitionTime = (exerciseList.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;
  const warmupCooldown = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME;
  return { workingTime: workingSeconds, restTime: restSeconds, transitionTime, warmupCooldown, totalTime: workingSeconds + restSeconds + transitionTime + warmupCooldown };
};

// Optimize exercises for a specific time AND exercise count
// This allows users to have more or fewer exercises while keeping the same total time
// workoutType is optional - if provided, ensures all target muscle groups are covered
const optimizeExercisesForTimeAndCount = (baseExerciseList, fullExercisePool, targetMinutes, targetExerciseCount, workoutType = null) => {
  if (!baseExerciseList || baseExerciseList.length === 0) return baseExerciseList;
  const targetSeconds = targetMinutes * 60;

  let exercises = [...baseExerciseList];
  const defaultCount = Math.max(2, Math.floor(targetMinutes / 12));
  const targetCount = targetExerciseCount || defaultCount;
  const isShortening = targetCount < baseExerciseList.length;

  // If we need more exercises, add from the pool
  if (targetCount > exercises.length && fullExercisePool.length > exercises.length) {
    const currentIds = exercises.map(ex => ex.id);
    const additionalExercises = fullExercisePool
      .filter(ex => !currentIds.includes(ex.id))
      .slice(0, targetCount - exercises.length);
    exercises = [...exercises, ...additionalExercises];
  }

  // If we need fewer exercises, intelligently select which to keep
  if (targetCount < exercises.length) {
    // Prioritize keeping compounds and ensuring muscle group coverage
    const compounds = exercises.filter(ex => ex.exerciseType === 'compound');
    const isolations = exercises.filter(ex => ex.exerciseType !== 'compound');

    // Keep all compounds first (up to target count)
    const toKeep = compounds.slice(0, targetCount);

    // Fill remaining slots with isolations, prioritizing variety
    if (toKeep.length < targetCount) {
      const musclesCovered = new Set(toKeep.map(ex => ex.muscleGroup));
      // First add isolations targeting muscles not yet covered
      const uncoveredIsolations = isolations.filter(ex => !musclesCovered.has(ex.muscleGroup));
      const coveredIsolations = isolations.filter(ex => musclesCovered.has(ex.muscleGroup));
      const orderedIsolations = [...uncoveredIsolations, ...coveredIsolations];
      toKeep.push(...orderedIsolations.slice(0, targetCount - toKeep.length));
    }

    exercises = toKeep;
  }

  // Ensure muscle group coverage if we shortened the workout
  if (isShortening && workoutType) {
    exercises = ensureMuscleGroupCoverage(exercises, workoutType, fullExercisePool);
  }

  // Calculate fixed time components
  const fixedTime = WORKOUT_TIMING.WARMUP_TIME + WORKOUT_TIMING.COOLDOWN_TIME +
    (exercises.length - 1) * WORKOUT_TIMING.TRANSITION_TIME;

  // Start with base sets
  let optimized = exercises.map(ex => ({ ...ex, sets: ex.sets || 3 }));

  // Helper function to recalculate timing values
  const recalculate = () => {
    const totalSets = optimized.reduce((sum, ex) => sum + ex.sets, 0);
    const workingTime = totalSets * WORKOUT_TIMING.AVG_SET_DURATION;
    const totalRestPeriods = totalSets - optimized.length;
    const availableRestTime = targetSeconds - fixedTime - workingTime;
    return { totalSets, workingTime, totalRestPeriods, availableRestTime };
  };

  let timing = recalculate();

  // First pass: If more exercises than default, reduce sets to fit
  if (targetCount > defaultCount) {
    while (timing.availableRestTime < timing.totalRestPeriods * 30 && optimized.some(ex => ex.sets > 2)) {
      const maxSetsEx = optimized.reduce((max, ex) => (ex.sets > max.sets) ? ex : max, optimized[0]);
      if (maxSetsEx.sets <= 2) break;
      const idx = optimized.findIndex(ex => ex.id === maxSetsEx.id);
      optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets - 1 };
      timing = recalculate();
    }
  }

  // Second pass: ALWAYS try to fill remaining time by adding sets
  // If rest per period would exceed 120 seconds (2 min), add more sets to use the time productively
  // Max 6 sets per exercise to prevent excessive volume
  const MAX_SETS_PER_EXERCISE = 6;
  const IDEAL_REST_TIME = 90; // Target ~90 seconds rest between sets

  while (timing.totalRestPeriods > 0 &&
         timing.availableRestTime / timing.totalRestPeriods > IDEAL_REST_TIME + 30 &&
         optimized.some(ex => ex.sets < MAX_SETS_PER_EXERCISE)) {
    // Find exercise with fewest sets that's under max
    const minSetsEx = optimized
      .filter(ex => ex.sets < MAX_SETS_PER_EXERCISE)
      .reduce((min, ex) => (ex.sets < min.sets) ? ex : min, optimized.find(ex => ex.sets < MAX_SETS_PER_EXERCISE));

    if (!minSetsEx) break;

    const idx = optimized.findIndex(ex => ex.id === minSetsEx.id);
    optimized[idx] = { ...optimized[idx], sets: optimized[idx].sets + 1 };
    timing = recalculate();

    // Safety check: if we've maxed all exercises, stop
    if (optimized.every(ex => ex.sets >= MAX_SETS_PER_EXERCISE)) break;
  }

  // Final recalculation
  timing = recalculate();

  // Distribute rest evenly (min 30s, max 180s)
  const restPerPeriod = timing.totalRestPeriods > 0
    ? Math.max(30, Math.min(180, Math.round(timing.availableRestTime / timing.totalRestPeriods)))
    : 90;

  optimized = optimized.map(ex => ({
    ...ex,
    restTime: restPerPeriod
  }));

  // Reorder exercises to avoid same muscle groups back-to-back
  // This provides better recovery between exercises for the same muscles
  // Skip cardio exercises in reordering (keep them at the end)
  const cardioExercises = optimized.filter(ex => ex.isCardio || ex.muscleGroup === 'Cardio');
  const nonCardioExercises = optimized.filter(ex => !ex.isCardio && ex.muscleGroup !== 'Cardio');
  const reorderedNonCardio = reorderExercisesForRecovery(nonCardioExercises);
  optimized = [...reorderedNonCardio, ...cardioExercises];

  // Check if workout still exceeds target time - if so, try to create supersets
  const currentTotalTime = getWorkoutTimeBreakdown(optimized).totalTime;
  const timeOverTarget = (currentTotalTime - targetSeconds) / 60; // in minutes

  if (timeOverTarget > 2) { // Only superset if we're more than 2 minutes over
    const supersetResult = createSupersets(optimized, timeOverTarget);
    if (supersetResult.supersets.length > 0) {
      return supersetResult.exercises;
    }
  }

  return optimized;
};

// ActiveWorkoutScreen as separate component
function ActiveWorkoutScreen({ onClose, onComplete, COLORS, availableTime = 60, userGoal = 'build_muscle', userExperience = 'beginner', userId = null, workoutName = 'Workout', workoutTemplate = null, injuries = [] }) {
  // Use passed workout template or fall back to CURRENT_WORKOUT
  const activeWorkout = workoutTemplate || CURRENT_WORKOUT;
  const isAdvancedUser = ['experienced', 'expert'].includes(userExperience);
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
  // Initialize exercises from workout template, optimized for available time
  const [exercises, setExercises] = useState(() => {
    const baseExercises = activeWorkout?.exercises || WORKOUT_EXERCISES;
    const exerciseCount = Math.max(2, Math.floor(availableTime / 12));
    const selectedExercises = baseExercises.slice(0, exerciseCount).map(ex => ({
      ...ex,
      history: [],
      alternatives: ALL_EXERCISES.filter(e => e.muscleGroup === ex.muscleGroup).slice(0, 5).map(e => e.name)
    }));
    return optimizeExercisesForTime(selectedExercises, availableTime);
  });
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [showFullWorkoutList, setShowFullWorkoutList] = useState(false);
  const [editingSet, setEditingSet] = useState(null); // { exerciseId, setIndex }
  const [editSetData, setEditSetData] = useState({ weight: 0, reps: 0, rpe: 5 });
  const [showEndWorkoutConfirm, setShowEndWorkoutConfirm] = useState(false);
  const [showExerciseInfoModal, setShowExerciseInfoModal] = useState(null); // exercise name to show info for

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

  // Use exercises and calculate time breakdown
  const exercisesForTime = exercises;
  const timeBreakdown = getWorkoutTimeBreakdown(exercisesForTime);

  const totalSets = exercisesForTime.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSetsCount = completedSets.length;
  const progressPercent = (completedSetsCount / totalSets) * 100;
  const currentExercise = exercisesForTime[currentExerciseIndex];

  useEffect(() => {
    if (currentExercise) {
      // Get completed sets for this exercise
      const exerciseCompletedSets = completedSets.filter(s => s.exerciseId === currentExercise.id);
      const lastCompletedSet = exerciseCompletedSets[exerciseCompletedSets.length - 1];

      // If we have a previous set for this exercise, use that data as suggestion
      if (lastCompletedSet) {
        setCurrentSetData({
          weight: lastCompletedSet.weight,
          reps: lastCompletedSet.reps,
          rpe: lastCompletedSet.rpe || 5
        });
      } else {
        // Otherwise use exercise defaults
        setCurrentSetData({
          weight: currentExercise.suggestedWeight || currentExercise.lastWeight || 0,
          reps: currentExercise.targetReps,
          rpe: 5
        });
      }
    }
  }, [currentExerciseIndex, currentSetIndex, currentExercise?.id]);

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

  // Move exercise up or down in the list
  const moveExercise = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    setExercises(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
    // Adjust current exercise index if needed
    if (currentExerciseIndex === index) {
      setCurrentExerciseIndex(newIndex);
    } else if (currentExerciseIndex === newIndex) {
      setCurrentExerciseIndex(index);
    }
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

  const removeSetFromExercise = (exerciseIndex) => {
    const exercise = exercises[exerciseIndex];
    // Don't allow removing if only 1 set left
    if (exercise.sets <= 1) return;
    // Remove the last set
    setExercises(prev => prev.map((ex, i) => i === exerciseIndex ? { ...ex, sets: ex.sets - 1, lastReps: ex.lastReps.slice(0, -1) } : ex));
    // If we're on the last set of this exercise and removing it, adjust set index
    if (exerciseIndex === currentExerciseIndex && currentSetIndex >= exercise.sets - 1) {
      setCurrentSetIndex(Math.max(0, exercise.sets - 2));
    }
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
              <div key={alt} className="w-full p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: COLORS.text }}>{alt}</span>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(alt); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                </div>
                <button onClick={() => swapExercise(showSwapExercise, alt)} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Select</button>
              </div>
            ))}
          </div>
          {swapSearch && (
            <>
              <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>Search Results</p>
              <div className="space-y-2">
                {filteredSwapExercises.slice(0, 8).map(ex => (
                  <div key={ex.name} className="w-full p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                    <div className="flex items-center gap-2">
                      <div>
                        <p style={{ color: COLORS.text }}>{ex.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.muscleGroup}</p>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(ex.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                    </div>
                    <button onClick={() => swapExercise(showSwapExercise, ex.name)} className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: COLORS.text }}>Select</button>
                  </div>
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
                    <div key={ex.name} className="w-full p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: COLORS.surface }}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p style={{ color: COLORS.text }}>{ex.name}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{ex.equipment} • {ex.type}</p>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(ex.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                      </div>
                      <button onClick={() => addExercise(ex.name)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}><Plus size={18} color={COLORS.text} /></button>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold" style={{ color: isCompleted ? COLORS.success : COLORS.text }}>{exercise.name}</p>
                        {isAdvancedUser && exercise.targetedHeads && exercise.targetedHeads.length > 0 && (
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.targetedHeads.join(', ')}</p>
                        )}
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(exercise.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <button onClick={() => moveExercise(exIdx, 'up')} disabled={exIdx === 0} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, opacity: exIdx === 0 ? 0.4 : 1 }}><ChevronUp size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => moveExercise(exIdx, 'down')} disabled={exIdx === exercises.length - 1} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, opacity: exIdx === exercises.length - 1 ? 0.4 : 1 }}><ChevronDown size={14} color={COLORS.textMuted} /></button>
                    {/* Add/Remove set buttons */}
                    <button onClick={() => removeSetFromExercise(exIdx)} disabled={exercise.sets <= 1} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight, opacity: exercise.sets <= 1 ? 0.4 : 1 }}><Minus size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => addSetToExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={14} color={COLORS.textMuted} /></button>
                    <button onClick={() => setShowSwapExercise(exIdx)} className="p-1 rounded" style={{ backgroundColor: COLORS.surfaceLight }}><ArrowLeftRight size={14} color={COLORS.textMuted} /></button>
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
      title: activeWorkout.name,
      focus: activeWorkout.focus,
      description: activeWorkout.description,
      goals: activeWorkout.goals || []
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

          {/* Injury Recovery Coaching */}
          {injuries.length > 0 && (() => {
            const primaryInjury = injuries[0];
            const currentPhase = getCurrentRecoveryPhase(primaryInjury);
            const phaseInfo = RECOVERY_PHASES[currentPhase];
            const coachingMessage = getCoachingMessage(currentPhase, primaryInjury.muscleGroup);
            const hasRecoveryExercises = exercisesForTime.some(ex => ex.isRecoveryExercise);

            return (
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.warning + '10', border: `1px solid ${COLORS.warning}30` }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{phaseInfo.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: COLORS.text }}>Recovery Mode Active</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: INJURY_SEVERITY[primaryInjury.severity].color + '20', color: INJURY_SEVERITY[primaryInjury.severity].color }}>
                        {primaryInjury.muscleGroup}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>{coachingMessage}</p>
                    {hasRecoveryExercises && (
                      <p className="text-xs" style={{ color: COLORS.success }}>
                        ✓ Rehab exercises included • Listen to your body and stop if you feel pain
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="space-y-3 mb-6">
            {exercisesForTime.map((exercise, i) => {
              const isSuperset = exercise.supersetId;
              const isFirstInSuperset = isSuperset && exercise.supersetOrder === 1;
              const isSecondInSuperset = isSuperset && exercise.supersetOrder === 2;

              return (
                <div key={exercise.id}>
                  {/* Superset header - show before first exercise in superset */}
                  {isFirstInSuperset && (
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Zap size={14} color={COLORS.warning} />
                      <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>SUPERSET</span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>— No rest between these exercises</span>
                    </div>
                  )}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: COLORS.surface,
                      ...(isSuperset && {
                        borderLeft: `3px solid ${COLORS.warning}`,
                        borderRadius: isFirstInSuperset ? '12px 12px 0 0' : isSecondInSuperset ? '0 0 12px 12px' : '12px',
                        marginTop: isSecondInSuperset ? '-1px' : 0
                      })
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setShowExerciseHistory(i)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                          <span className="font-bold" style={{ color: COLORS.primary }}>{i + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.name}</p>
                            {exercise.isRecoveryExercise && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                                Rehab
                              </span>
                            )}
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(exercise.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
                          </div>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            {isAdvancedUser && exercise.targetedHeads && exercise.targetedHeads.length > 0
                              ? exercise.targetedHeads.join(', ')
                              : exercise.muscleGroup} • {exercise.isRecoveryExercise ? 'Focus on form' : 'Tap to view history'}
                            {isSuperset && <span style={{ color: COLORS.warning }}> — Paired with {exercise.supersetWith}</span>}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.sets} × {exercise.targetReps}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</p>
                        </div>
                        {/* Reorder buttons */}
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveExercise(i, 'up')}
                            disabled={i === 0}
                            className="p-1 rounded-t-lg"
                            style={{ backgroundColor: COLORS.surfaceLight, opacity: i === 0 ? 0.4 : 1 }}
                          >
                            <ChevronUp size={14} color={COLORS.textMuted} />
                          </button>
                          <button
                            onClick={() => moveExercise(i, 'down')}
                            disabled={i === exercises.length - 1}
                            className="p-1 rounded-b-lg"
                            style={{ backgroundColor: COLORS.surfaceLight, opacity: i === exercises.length - 1 ? 0.4 : 1 }}
                          >
                            <ChevronDown size={14} color={COLORS.textMuted} />
                          </button>
                        </div>
                        <button onClick={() => setShowSwapExercise(i)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                          <ArrowLeftRight size={16} color={COLORS.textMuted} />
                        </button>
                        {exercises.length > 1 && (
                          <button onClick={() => removeExercise(i)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.error + '20' }}>
                            <X size={16} color={COLORS.error} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: COLORS.surfaceLight }}>
                      <div className="flex items-center gap-3">
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>Last: {exercise.lastWeight}kg × {exercise.lastReps?.join(', ') || '-'}</p>
                        {isSuperset && exercise.restTime === 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                            No rest
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                            {Math.floor((exercise.restTime || 90) / 60)}:{((exercise.restTime || 90) % 60).toString().padStart(2, '0')} rest
                          </span>
                        )}
                      </div>
                      {exercise.suggestedWeight > (exercise.lastWeight || 0) && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>+{(exercise.suggestedWeight - (exercise.lastWeight || 0)).toFixed(1)}kg</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowAddExercise(true)} className="w-full p-4 rounded-xl flex items-center justify-center gap-2 mb-4" style={{ backgroundColor: COLORS.surfaceLight, border: `2px dashed ${COLORS.textMuted}` }}>
            <Plus size={18} color={COLORS.textMuted} /><span style={{ color: COLORS.textMuted }}>Add Exercise</span>
          </button>

          {/* Time Breakdown Overview */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} color={COLORS.primary} />
              <span className="font-semibold" style={{ color: COLORS.text }}>Workout Time Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                <p className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {Math.floor(timeBreakdown.workingTime / 60)}:{(timeBreakdown.workingTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Working Time</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.warning + '15' }}>
                <p className="text-xl font-bold" style={{ color: COLORS.warning }}>
                  {Math.floor(timeBreakdown.restTime / 60)}:{(timeBreakdown.restTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Rest Time</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.text }}>Total Duration</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  Incl. {Math.floor(WORKOUT_TIMING.WARMUP_TIME / 60)} min warmup + {Math.floor(WORKOUT_TIMING.COOLDOWN_TIME / 60)} min cooldown
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
                  ~{Math.round(timeBreakdown.totalTime / 60)} min
                </p>
                {Math.abs(timeBreakdown.totalTime / 60 - availableTime) <= 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                    ✓ On target
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs space-y-1" style={{ color: COLORS.textMuted }}>
              <div className="flex justify-between">
                <span>• {totalSets} total sets × ~{WORKOUT_TIMING.AVG_SET_DURATION}s avg</span>
                <span>{Math.floor(timeBreakdown.workingTime / 60)}m working</span>
              </div>
              <div className="flex justify-between">
                <span>• Rest periods adjusted for {availableTime} min target</span>
                <span>~{Math.round((timeBreakdown.restTime / (totalSets - exercisesForTime.length)) || 0)}s/set</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>💡 <strong style={{ color: COLORS.text }}>Tip:</strong> Exercises are auto-ordered for your goal. Rest times and sets have been adjusted to fit your {availableTime} min target.</p>
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
    
    // Group sets by exercise for breakdown - include actual set data
    const exerciseBreakdown = exercisesForTime.map(exercise => {
      const sets = completedSets.filter(s => s.exerciseId === exercise.id);
      const volume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
      return {
        name: exercise.name,
        sets: sets.length,
        targetSets: exercise.sets,
        volume,
        setDetails: sets.map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe }))
      };
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
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{activeWorkout.name} • {totalDurationMins} mins</p>
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
            <div className="space-y-3">
              {exerciseBreakdown.map((ex, idx) => (
                <div key={idx} className="pb-3 border-b" style={{ borderColor: COLORS.surfaceLight }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ex.sets === ex.targetSets ? (
                        <Check size={16} color={COLORS.success} />
                      ) : (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.warning + '40' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: COLORS.text }}>{ex.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{ex.volume}kg vol</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {ex.setDetails.map((set, setIdx) => (
                      <div key={setIdx} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <span style={{ color: COLORS.text }}>{set.weight}kg × {set.reps}</span>
                        {set.rpe && <span style={{ color: COLORS.textMuted }}> @{set.rpe}</span>}
                      </div>
                    ))}
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
            {isSaving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><Check size={20} /> Return to App</>}
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
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{currentExercise.name}</h2>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(currentExercise.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={14} color={COLORS.primary} /></button>
            </div>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>{currentExercise.muscleGroup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSwapExercise(currentExerciseIndex)} className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}><Undo2 size={16} color={COLORS.textMuted} /></button>
          <button onClick={() => setPhase('workoutOverview')} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}>Overview</button>
          <div className="flex items-center">
            <button onClick={() => removeSetFromExercise(currentExerciseIndex)} disabled={currentExercise.sets <= 1} className="p-1 rounded-l-lg" style={{ backgroundColor: COLORS.surfaceLight, opacity: currentExercise.sets <= 1 ? 0.4 : 1 }}><Minus size={14} color={COLORS.textMuted} /></button>
            <span className="px-3 py-1 text-sm font-semibold" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>Set {currentSetIndex + 1}/{currentExercise.sets}</span>
            <button onClick={() => addSetToExercise(currentExerciseIndex)} className="p-1 rounded-r-lg" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={14} color={COLORS.textMuted} /></button>
          </div>
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
                <input
                  type="number"
                  value={currentSetData.weight || ''}
                  onChange={e => setCurrentSetData(prev => ({...prev, weight: parseFloat(e.target.value) || 0}))}
                  onBlur={e => setCurrentSetData(prev => ({...prev, weight: Number(prev.weight) || 0}))}
                  className="flex-1 p-3 rounded-lg text-center text-xl font-bold"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                />
                <button onClick={() => setCurrentSetData(prev => ({...prev, weight: prev.weight + 2.5}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Plus size={16} color={COLORS.text} /></button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: COLORS.textMuted }}>Reps</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentSetData(prev => ({...prev, reps: Math.max(0, prev.reps - 1)}))} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}><Minus size={16} color={COLORS.text} /></button>
                <input
                  type="number"
                  value={currentSetData.reps || ''}
                  onChange={e => setCurrentSetData(prev => ({...prev, reps: parseInt(e.target.value) || 0}))}
                  onBlur={e => setCurrentSetData(prev => ({...prev, reps: Number(prev.reps) || 0}))}
                  className="flex-1 p-3 rounded-lg text-center text-xl font-bold"
                  style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                />
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
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfoModal(ex.name); }} className="p-1 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={12} color={COLORS.primary} /></button>
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

      {/* Exercise Info Modal */}
      {showExerciseInfoModal && (
        <ExerciseInfoModal
          COLORS={COLORS}
          exerciseName={showExerciseInfoModal}
          onClose={() => setShowExerciseInfoModal(null)}
        />
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

        // Calculate current program week based on start date
        const now = new Date();
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksSinceStart = Math.floor((now - startDate) / msPerWeek) + 1;
        const currentProgramWeek = Math.min(weeksSinceStart, weeks);

        setOverviewStats(prev => ({
          ...prev,
          startingWeight: startW,
          currentWeight: currentW,
          targetWeight: goalW,
          weeklyTarget: parseFloat(weeklyTarget.toFixed(2)),
          programLength: weeks,
          programStartDate: startDate.toISOString().split('T')[0],
          programWeek: Math.max(1, currentProgramWeek),
        }));

        // Also update currentProgram to stay in sync
        setCurrentProgram(prev => ({
          ...prev,
          currentWeek: Math.max(1, currentProgramWeek),
          totalWeeks: weeks,
          daysPerWeek: goals.days_per_week || prev.daysPerWeek,
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

  // Load injuries from database
  useEffect(() => {
    let isMounted = true;

    const loadInjuries = async () => {
      if (!user?.id || !isAuthenticated) return;

      try {
        // Sync injury phases based on current date and get active injuries
        const { data: activeInjuries, error } = await injuryService.syncInjuryPhases(user.id);
        if (error) {
          console.warn('Injuries error:', error?.message);
          return;
        }

        if (isMounted && activeInjuries) {
          // Convert database format to app format
          setInjuries(activeInjuries.map(injury => ({
            id: injury.id,
            muscleGroup: injury.muscle_group,
            severity: injury.severity,
            notes: injury.notes,
            reportedDate: injury.reported_date,
            timeline: injury.timeline,
          })));
        }
      } catch (err) {
        console.warn('Error loading injuries:', err?.message || err);
      }
    };

    loadInjuries();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated]);

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

        // Group sleep by week - Week 1 = start of program (current), Week 12 = end (future)
        // Calculate weeks since program start based on current program week
        const sleepByWeek = {};
        const now = new Date();
        if (sleepData && sleepData.length > 0) {
          sleepData.forEach(entry => {
            if (!entry?.log_date || entry?.hours_slept == null) return;
            const entryDate = new Date(entry.log_date);
            const daysDiff = Math.floor((now - entryDate) / (24 * 60 * 60 * 1000));
            const weeksAgo = Math.floor(daysDiff / 7); // 0 = current week
            // Week 1 = current week, Week 2 = next week (future), etc.
            // But we can only have data for past/current weeks
            const displayWeek = 1 - weeksAgo; // This gives us: current=1, 1 week ago=0, etc.
            // We want: current week = Week 1, last week would be before program started
            // So only current week (weeksAgo=0) maps to Week 1
            const programWeek = 1 - weeksAgo;

            if (programWeek >= 1 && programWeek <= 12) {
              if (!sleepByWeek[programWeek]) {
                sleepByWeek[programWeek] = { total: 0, count: 0 };
              }
              sleepByWeek[programWeek].total += entry.hours_slept;
              sleepByWeek[programWeek].count++;
            }
          });
        }

        // Generate sleep chart data - Week 1 (current/start) on left, Week 12 (future/end) on right
        const sleepChartDataNew = [];
        for (let week = 1; week <= 12; week++) {
          const weekData = sleepByWeek[week];
          sleepChartDataNew.push({
            week: week.toString(),
            value: weekData ? parseFloat((weekData.total / weekData.count).toFixed(1)) : null,
            goal: 8,
          });
        }

        // Generate volume chart data (total weight lifted per week)
        const volumeByWeek = {};
        if (workoutData && workoutData.length > 0) {
          workoutData.forEach(session => {
            if (!session?.started_at) return;
            const sessionDate = new Date(session.started_at);
            const weekNum = Math.ceil((now - sessionDate) / (7 * 24 * 60 * 60 * 1000));
            const displayWeek = Math.min(16, Math.max(1, 16 - weekNum + 1));

            // Sum volume from all sets in this session
            let sessionVolume = 0;
            if (session.workout_sets) {
              session.workout_sets.forEach(set => {
                if (!set.is_warmup && set.weight && set.reps) {
                  sessionVolume += set.weight * set.reps;
                }
              });
            }
            volumeByWeek[displayWeek] = (volumeByWeek[displayWeek] || 0) + sessionVolume;
          });
        }
        const volumeChartData = [];
        for (let week = 1; week <= 16; week++) {
          volumeChartData.push({
            week: week.toString(),
            value: volumeByWeek[week] ? Math.round(volumeByWeek[week]) : null,
            expected: null,
          });
        }

        // Generate lift PR charts (bench, squat, deadlift, ohp)
        const liftPRsByWeek = { bench: {}, squat: {}, deadlift: {}, ohp: {} };
        const liftPatterns = {
          bench: /bench press/i,
          squat: /squat/i,
          deadlift: /deadlift/i,
          ohp: /overhead press|ohp|shoulder press/i,
        };

        if (workoutData && workoutData.length > 0) {
          workoutData.forEach(session => {
            if (!session?.started_at || !session.workout_sets) return;
            const sessionDate = new Date(session.started_at);
            const weekNum = Math.ceil((now - sessionDate) / (7 * 24 * 60 * 60 * 1000));
            const displayWeek = Math.min(16, Math.max(1, 16 - weekNum + 1));

            session.workout_sets.forEach(set => {
              if (set.is_warmup || !set.weight || !set.reps) return;
              const e1rm = set.weight * (1 + set.reps / 30); // Epley formula

              Object.entries(liftPatterns).forEach(([lift, pattern]) => {
                if (pattern.test(set.exercise_name)) {
                  if (!liftPRsByWeek[lift][displayWeek] || e1rm > liftPRsByWeek[lift][displayWeek]) {
                    liftPRsByWeek[lift][displayWeek] = Math.round(e1rm);
                  }
                }
              });
            });
          });
        }

        const liftChartData = {};
        ['bench', 'squat', 'deadlift', 'ohp'].forEach(lift => {
          liftChartData[lift] = [];
          for (let week = 1; week <= 16; week++) {
            liftChartData[lift].push({
              week: week.toString(),
              value: liftPRsByWeek[lift][week] || null,
              expected: null,
            });
          }
        });

        // Load nutrition data for calories/protein charts
        let caloriesChartData = [];
        let proteinChartData = [];
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 112); // 16 weeks

          const { data: nutritionData } = await nutritionService.getNutritionHistory(
            user.id,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );

          if (nutritionData && nutritionData.length > 0) {
            const caloriesByWeek = {};
            const proteinByWeek = {};

            nutritionData.forEach(entry => {
              if (!entry?.log_date) return;
              const entryDate = new Date(entry.log_date);
              const weekNum = Math.ceil((now - entryDate) / (7 * 24 * 60 * 60 * 1000));
              const displayWeek = Math.min(16, Math.max(1, 16 - weekNum + 1));

              if (!caloriesByWeek[displayWeek]) {
                caloriesByWeek[displayWeek] = { total: 0, count: 0 };
                proteinByWeek[displayWeek] = { total: 0, count: 0 };
              }
              if (entry.total_calories) {
                caloriesByWeek[displayWeek].total += entry.total_calories;
                caloriesByWeek[displayWeek].count++;
              }
              if (entry.total_protein) {
                proteinByWeek[displayWeek].total += entry.total_protein;
                proteinByWeek[displayWeek].count++;
              }
            });

            for (let week = 1; week <= 16; week++) {
              const calData = caloriesByWeek[week];
              const proData = proteinByWeek[week];
              caloriesChartData.push({
                week: week.toString(),
                value: calData ? Math.round(calData.total / calData.count) : null,
                expected: 2500, // Default target
              });
              proteinChartData.push({
                week: week.toString(),
                value: proData ? Math.round(proData.total / proData.count) : null,
                expected: 150, // Default target
              });
            }
          }
        } catch (err) {
          console.warn('Error loading nutrition chart data:', err);
        }

        // Generate sleep chart for main chart selector (different format)
        const sleepMainChartData = [];
        for (let week = 1; week <= 16; week++) {
          // Map from 12-week sleep data to 16-week display
          const sleepWeek = Math.min(12, week);
          const weekData = sleepByWeek[sleepWeek];
          sleepMainChartData.push({
            week: week.toString(),
            value: weekData ? parseFloat((weekData.total / weekData.count).toFixed(1)) : null,
            expected: 8,
          });
        }

        if (isMounted) {
          // Update total workouts count from actual data
          const totalCompletedWorkouts = workoutData?.length || 0;
          setOverviewStats(prev => ({
            ...prev,
            totalWorkouts: totalCompletedWorkouts,
          }));

          setChartData(prev => ({
            ...prev,
            weight: weightChartData,
            workouts: workoutChartData,
            volume: volumeChartData,
            bench: liftChartData.bench,
            squat: liftChartData.squat,
            deadlift: liftChartData.deadlift,
            ohp: liftChartData.ohp,
            sleep: sleepMainChartData,
            calories: caloriesChartData.length > 0 ? caloriesChartData : [],
            protein: proteinChartData.length > 0 ? proteinChartData : [],
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

  // Load yesterday's sleep entry to check if already logged
  useEffect(() => {
    let isMounted = true;

    const loadYesterdaySleep = async () => {
      if (!user?.id || !isAuthenticated) return;

      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: sleepEntry } = await sleepService.getSleepLog(user.id, yesterdayStr);

        if (isMounted && sleepEntry) {
          setLastNightConfirmed(true);
          if (sleepEntry.bed_time) setLastNightBedTime(sleepEntry.bed_time);
          if (sleepEntry.wake_time) setLastNightWakeTime(sleepEntry.wake_time);
        }
      } catch (err) {
        console.warn('Error loading yesterday sleep:', err?.message || err);
      }
    };

    loadYesterdaySleep();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated]);

  // Function to refresh sleep chart data (called after saving sleep)
  const refreshSleepChartData = async () => {
    if (!user?.id) return;

    try {
      const { data: sleepData } = await sleepService.getRecentSleep(user.id, 84);

      if (!sleepData) return;

      // Group sleep by week - Week 1 = start of program (current), Week 12 = end (future)
      const sleepByWeek = {};
      const now = new Date();

      sleepData.forEach(entry => {
        if (!entry?.log_date || entry?.hours_slept == null) return;
        const entryDate = new Date(entry.log_date);
        const daysDiff = Math.floor((now - entryDate) / (24 * 60 * 60 * 1000));
        const weeksAgo = Math.floor(daysDiff / 7); // 0 = current week
        const programWeek = 1 - weeksAgo; // Week 1 = current, data before program start is ignored

        if (programWeek >= 1 && programWeek <= 12) {
          if (!sleepByWeek[programWeek]) {
            sleepByWeek[programWeek] = { total: 0, count: 0 };
          }
          sleepByWeek[programWeek].total += entry.hours_slept;
          sleepByWeek[programWeek].count++;
        }
      });

      // Generate chart data - Week 1 (current/start) on left, Week 12 (future/end) on right
      const newSleepChartData = [];
      for (let week = 1; week <= 12; week++) {
        const weekData = sleepByWeek[week];
        newSleepChartData.push({
          week: week.toString(),
          value: weekData ? parseFloat((weekData.total / weekData.count).toFixed(1)) : null,
          goal: 8,
        });
      }

      setSleepChartData(newSleepChartData);
    } catch (err) {
      console.warn('Error refreshing sleep chart:', err);
    }
  };

  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(60);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [exerciseListCollapsed, setExerciseListCollapsed] = useState(true); // Start collapsed by default
  const [customizedExercises, setCustomizedExercises] = useState(null); // null = use default, array = customized
  const [customExerciseCount, setCustomExerciseCount] = useState(null); // null = use default (workoutTime / 12), number = override
  const workoutTabScrollRef = useRef(null);

  // Wrapper to preserve scroll when updating workout time/count
  const updateWorkoutTimeWithScroll = (time) => {
    const scrollTop = workoutTabScrollRef.current?.scrollTop;
    setWorkoutTime(time);
    setCustomExerciseCount(null);
    requestAnimationFrame(() => {
      if (workoutTabScrollRef.current && scrollTop !== undefined) {
        workoutTabScrollRef.current.scrollTop = scrollTop;
      }
    });
  };

  const updateExerciseCountWithScroll = (countOrUpdater) => {
    const scrollTop = workoutTabScrollRef.current?.scrollTop;
    setCustomExerciseCount(countOrUpdater);
    requestAnimationFrame(() => {
      if (workoutTabScrollRef.current && scrollTop !== undefined) {
        workoutTabScrollRef.current.scrollTop = scrollTop;
      }
    });
  };

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
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
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

  // Injury tracking
  const [injuries, setInjuries] = useState([]);
  const [showReportInjury, setShowReportInjury] = useState(false);
  const [showInjuryRecovery, setShowInjuryRecovery] = useState(null); // injury object or null
  const [selectedInjuryMuscle, setSelectedInjuryMuscle] = useState(null);
  const [injurySeverity, setInjurySeverity] = useState('mild');
  const [injuryNotes, setInjuryNotes] = useState('');

  // Supplements - start empty, load from database
  const [supplements, setSupplements] = useState([]);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]); // Track dismissed supplement suggestions
  const supplementNameRef = useRef(null);
  const supplementDosageRef = useRef(null);
  const supplementUnitRef = useRef(null);
  const SUPPLEMENT_UNITS = ['mg', 'g', 'mcg', 'IU', 'ml', 'capsule(s)', 'tablet(s)', 'scoop(s)', 'drop(s)'];

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
  const friendSearchInputRef = useRef(null);
  const friendSearchTimeoutRef = useRef(null);
  
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
  const [showExerciseInfo, setShowExerciseInfo] = useState(null); // exercise name to show info for

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
  const [hasSearched, setHasSearched] = useState(false);

  // Meal and water tracking modals
  const [showMealEntry, setShowMealEntry] = useState(false);
  const [showWaterEntry, setShowWaterEntry] = useState(false);

  const [selectedChart, setSelectedChart] = useState('weight');
  const [chartData, setChartData] = useState({
    weight: [],
    workouts: [],
    bench: [],
    squat: [],
    deadlift: [],
    ohp: [],
    volume: [],
    sleep: [],
    calories: [],
    protein: [],
  });
  const chartLabels = {
    weight: 'kg',
    workouts: 'sessions',
    bench: 'kg',
    squat: 'kg',
    deadlift: 'kg',
    ohp: 'kg',
    volume: 'kg',
    sleep: 'hrs',
    calories: 'kcal',
    protein: 'g',
  };

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
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [fullScheduleMonth, setFullScheduleMonth] = useState(currentMonth);
  const [fullScheduleYear, setFullScheduleYear] = useState(currentYear);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [exerciseFilterGroup, setExerciseFilterGroup] = useState('All');
  
  // Current program state - auto-set based on user's goal
  const [currentProgram, setCurrentProgram] = useState(() => {
    const program = getProgramForGoal(userData.goal);
    return {
      id: program.id,
      name: program.name,
      description: program.desc,
      daysPerWeek: program.days,
      currentWeek: 1,
      totalWeeks: program.weeks,
    };
  });

  // Auto-update program when goal changes
  useEffect(() => {
    if (userData.goal) {
      const program = getProgramForGoal(userData.goal);
      setCurrentProgram(prev => ({
        ...prev,
        id: program.id,
        name: program.name,
        description: program.desc,
        daysPerWeek: program.days,
        totalWeeks: program.weeks,
      }));
    }
  }, [userData.goal]);

  // State for next program selection
  const [selectedBreakDuration, setSelectedBreakDuration] = useState('2weeks');
  const [showNextProgramModal, setShowNextProgramModal] = useState(false);

  // Schedule state - dynamic schedule that can be edited
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [editingScheduleDay, setEditingScheduleDay] = useState(null);
  const [showWorkoutTimeEditor, setShowWorkoutTimeEditor] = useState(false);
  const scheduleScrollRef = useRef(null);

  // Get workout rotation based on days per week
  // Returns workout type identifiers for dynamic generation (not full templates)
  const getWorkoutTypeRotation = (daysPerWeek) => {
    switch(daysPerWeek) {
      case 3: // Full body 3x
        return ['full_body', 'full_body', 'full_body'];
      case 4: // Upper/Lower split
        return ['upper', 'lower', 'upper', 'lower'];
      case 5: // PPL + Upper/Lower
        return ['push', 'pull', 'legs_quad', 'upper', 'lower'];
      case 6: // PPL x2
      default:
        return ['push', 'pull', 'legs_quad', 'push', 'pull', 'legs_posterior'];
    }
  };

  // Cache for generated workouts (keyed by date to ensure consistency within a day)
  const [generatedWorkoutsCache, setGeneratedWorkoutsCache] = useState({});

  // Track recently used exercises for variety
  const [recentlyUsedExercises, setRecentlyUsedExercises] = useState([]);

  // Get user's current goal
  const userGoal = userData.goal || 'build_muscle';

  // Master schedule - stores workout TYPE (not full workout) for dynamic generation
  const [masterSchedule, setMasterSchedule] = useState(() => {
    // Use user's rest days or default to Sat/Sun
    const userRestDays = userData.restDays || [5, 6]; // 0=Mon, 6=Sun
    const daysPerWeek = userData.daysPerWeek || (7 - userRestDays.length);
    const workoutTypeRotation = getWorkoutTypeRotation(daysPerWeek);

    const schedule = {};
    let workoutIndex = 0;

    // Generate schedule starting 30 days ago to 365 days in future
    const scheduleStart = new Date(today);
    scheduleStart.setDate(today.getDate() - 30);
    for (let i = 0; i < 395; i++) {
      const date = new Date(scheduleStart);
      date.setDate(scheduleStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      // Convert to Monday=0 format: (getDay() + 6) % 7
      const dayOfWeek = (date.getDay() + 6) % 7;

      // Check if this day is a rest day
      if (userRestDays.includes(dayOfWeek)) {
        schedule[dateKey] = { workoutType: null, completed: false };
      } else {
        schedule[dateKey] = {
          workoutType: workoutTypeRotation[workoutIndex % workoutTypeRotation.length],
          completed: false // Will be loaded from database
        };
        workoutIndex++;
      }
    }
    return schedule;
  });

  // Calculate program progress - total workouts completed vs total in program
  const programProgress = React.useMemo(() => {
    const totalWorkoutsInProgram = currentProgram.totalWeeks * currentProgram.daysPerWeek;
    const workoutsCompletedThisWeek = Object.entries(masterSchedule).filter(([dateKey, entry]) => {
      const date = new Date(dateKey);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      return date >= weekStart && entry.completed;
    }).length;

    // Calculate completed workouts based on weeks completed
    const completedWeeks = Math.max(0, currentProgram.currentWeek - 1);
    const workoutsFromCompletedWeeks = completedWeeks * currentProgram.daysPerWeek;
    const totalCompletedWorkouts = workoutsFromCompletedWeeks + workoutsCompletedThisWeek;
    const workoutsRemaining = Math.max(0, totalWorkoutsInProgram - totalCompletedWorkouts);
    const progressPercent = Math.min(100, (totalCompletedWorkouts / totalWorkoutsInProgram) * 100);
    const weeksRemaining = Math.max(0, currentProgram.totalWeeks - currentProgram.currentWeek);
    const isComplete = currentProgram.currentWeek >= currentProgram.totalWeeks && workoutsCompletedThisWeek >= currentProgram.daysPerWeek;

    return {
      totalWorkouts: totalWorkoutsInProgram,
      completedWorkouts: totalCompletedWorkouts,
      workoutsRemaining,
      progressPercent,
      weeksRemaining,
      isComplete,
      currentWeek: currentProgram.currentWeek,
      totalWeeks: currentProgram.totalWeeks,
    };
  }, [currentProgram, masterSchedule]);

  // Get suggested next programs
  const suggestedNextPrograms = NEXT_PROGRAM_SUGGESTIONS[currentProgram.id] || NEXT_PROGRAM_SUGGESTIONS.upper_lower;

  // Generate or retrieve cached workout for a date
  const getWorkoutForDate = (dateKey) => {
    const scheduleEntry = masterSchedule[dateKey];
    if (!scheduleEntry || !scheduleEntry.workoutType) return null;

    // Check cache first
    if (generatedWorkoutsCache[dateKey]) {
      return generatedWorkoutsCache[dateKey];
    }

    // Generate new workout (pass experience level for advanced users)
    const workout = generateDynamicWorkout(scheduleEntry.workoutType, userGoal, recentlyUsedExercises, userData.experience);

    // Cache it for consistency
    setGeneratedWorkoutsCache(prev => ({ ...prev, [dateKey]: workout }));

    // Update recently used exercises (keep last 20)
    if (workout) {
      const newUsed = workout.exercises.map(ex => ex.name);
      setRecentlyUsedExercises(prev => [...newUsed, ...prev].slice(0, 20));
    }

    return workout;
  };

  // Regenerate schedule when rest days or days per week changes
  const regenerateSchedule = (newRestDays, newDaysPerWeek) => {
    const workoutTypeRotation = getWorkoutTypeRotation(newDaysPerWeek);
    const newSchedule = {};
    let workoutIndex = 0;

    const scheduleStart = new Date(today);
    scheduleStart.setDate(today.getDate() - 30);

    for (let i = 0; i < 395; i++) {
      const date = new Date(scheduleStart);
      date.setDate(scheduleStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = (date.getDay() + 6) % 7; // Monday=0

      // Preserve completed workouts from old schedule
      const existingEntry = masterSchedule[dateKey];
      if (existingEntry?.completed) {
        newSchedule[dateKey] = existingEntry;
        if (existingEntry.workoutType) workoutIndex++; // Keep rotation in sync
        continue;
      }

      if (newRestDays.includes(dayOfWeek)) {
        newSchedule[dateKey] = { workoutType: null, completed: false };
      } else {
        newSchedule[dateKey] = {
          workoutType: workoutTypeRotation[workoutIndex % workoutTypeRotation.length],
          completed: false
        };
        workoutIndex++;
      }
    }

    setMasterSchedule(newSchedule);
    // Clear cache to regenerate workouts with new schedule
    setGeneratedWorkoutsCache({});

    // Update userData
    setUserData(prev => ({
      ...prev,
      restDays: newRestDays,
      daysPerWeek: newDaysPerWeek,
    }));

    // Save to database
    if (updateGoals) {
      updateGoals({
        rest_days: newRestDays,
        days_per_week: newDaysPerWeek,
      });
    }
  };

  // Auto-regenerate schedule when rest days change (e.g., during onboarding)
  const prevRestDaysRef = useRef(userData.restDays);
  useEffect(() => {
    const prevRestDays = prevRestDaysRef.current;
    const currentRestDays = userData.restDays || [5, 6];
    const currentDaysPerWeek = 7 - currentRestDays.length;

    // Check if rest days actually changed (not just on mount)
    if (prevRestDays && JSON.stringify(prevRestDays) !== JSON.stringify(currentRestDays)) {
      regenerateSchedule(currentRestDays, currentDaysPerWeek);
    }
    prevRestDaysRef.current = currentRestDays;
  }, [userData.restDays]);

  // Sync todayWorkout with masterSchedule (on mount and when today's workout type changes)
  const todayWorkoutType = masterSchedule[TODAY_DATE_KEY]?.workoutType;
  useEffect(() => {
    const todayEntry = masterSchedule[TODAY_DATE_KEY];
    if (todayEntry) {
      setTodayWorkoutCompleted(todayEntry.completed);
      if (todayEntry.workoutType) {
        // Get the dynamically generated workout for today
        const generatedWorkout = getWorkoutForDate(TODAY_DATE_KEY);
        if (generatedWorkout) {
          setTodayWorkout({
            type: generatedWorkout.name.replace(' Day ', ' ').replace('Day ', ''),
            name: generatedWorkout.name,
            exercises: generatedWorkout.exercises?.length || 0,
            duration: 60,
            focus: generatedWorkout.focus || ''
          });
        }
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
  }, [todayWorkoutType]);

  // Get today's dynamically generated workout (cached for consistency within the day)
  const todayWorkoutTemplate = getWorkoutForDate(TODAY_DATE_KEY) || CURRENT_WORKOUT;

  // Get the current exercises (either customized or from template)
  const getCurrentExercises = () => {
    let exercises = customizedExercises || todayWorkoutTemplate?.exercises || [];

    // Filter out exercises targeting injured muscles
    if (injuries.length > 0) {
      exercises = exercises.filter(ex => {
        // Check if this exercise targets any injured muscle
        for (const injury of injuries) {
          if (isMuscleInjured(ex.muscleGroup, injuries)) {
            return false;
          }
          // Also check secondary muscles if defined
          if (ex.secondaryMuscles) {
            for (const secondary of ex.secondaryMuscles) {
              if (isMuscleInjured(secondary, injuries)) {
                return false;
              }
            }
          }
        }
        return true;
      });
    }

    return exercises;
  };

  // Get recovery exercises to add based on current injuries
  const getInjuryRecoveryExercisesToAdd = () => {
    if (injuries.length === 0) return [];
    return getRecoveryExercisesForWorkout(injuries);
  };

  // Find alternative exercise from same muscle group
  const getAlternativeExercise = (currentExercise, excludeIds = []) => {
    const alternatives = ALL_EXERCISES.filter(ex =>
      ex.muscleGroup === currentExercise.muscleGroup &&
      ex.name !== currentExercise.name &&
      !excludeIds.includes(ex.id)
    );
    if (alternatives.length === 0) return null;
    const randomAlt = alternatives[Math.floor(Math.random() * alternatives.length)];
    return {
      ...currentExercise,
      id: randomAlt.id || randomAlt.name.toLowerCase().replace(/\s+/g, '_'),
      name: randomAlt.name,
      muscleGroup: randomAlt.muscleGroup,
    };
  };

  // Swap exercise with alternative
  const swapExercise = (exerciseIndex) => {
    const exercises = getCurrentExercises();
    const currentExercise = exercises[exerciseIndex];
    const excludeIds = exercises.map(ex => ex.id);
    const alternative = getAlternativeExercise(currentExercise, excludeIds);

    if (alternative) {
      const newExercises = [...exercises];
      newExercises[exerciseIndex] = alternative;
      setCustomizedExercises(newExercises);
      setExpandedExerciseId(null);
    }
  };

  // Remove exercise and redistribute sets
  const removeExercise = (exerciseIndex) => {
    const exercises = getCurrentExercises();
    if (exercises.length <= 2) return; // Don't allow removing if only 2 exercises left

    const removedExercise = exercises[exerciseIndex];
    const removedSets = removedExercise.sets;
    const newExercises = exercises.filter((_, i) => i !== exerciseIndex);

    // Distribute removed sets among remaining exercises
    const setsToAdd = Math.ceil(removedSets / newExercises.length);
    const redistributedExercises = newExercises.map((ex, i) => ({
      ...ex,
      sets: ex.sets + (i < removedSets ? 1 : 0) // Add 1 set to first N exercises
    }));

    setCustomizedExercises(redistributedExercises);
    setExpandedExerciseId(null);
  };

  // Move exercise up or down in the list (for Home Tab)
  const moveExerciseInHome = (exerciseIndex, direction) => {
    const exercises = getCurrentExercises();
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const newExercises = [...exercises];
    [newExercises[exerciseIndex], newExercises[newIndex]] = [newExercises[newIndex], newExercises[exerciseIndex]];
    setCustomizedExercises(newExercises);
  };

  // Reset customizations
  const resetCustomizations = () => {
    setCustomizedExercises(null);
    setExpandedExerciseId(null);
  };

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
      const scheduleEntry = masterSchedule[dateKey] || { workoutType: null, completed: false };
      const isPast = date < todayStart;
      // Generate workout if there's a workout type scheduled
      const workout = scheduleEntry.workoutType ? getWorkoutForDate(dateKey) : null;

      days.push({
        day: dayNames[i],
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateKey,
        workout: workout,
        workoutType: scheduleEntry.workoutType,
        completed: scheduleEntry.completed,
        isToday: date.toDateString() === today.toDateString(),
        isPast
      });
    }
    return days;
  };

  const currentWeekDates = getWeekDates(scheduleWeekOffset);

  // Swap workout types between two days
  const swapWorkoutDays = (fromDateKey, toDateKey) => {
    setMasterSchedule(prev => {
      const newSchedule = { ...prev };
      const fromType = newSchedule[fromDateKey]?.workoutType;
      const toType = newSchedule[toDateKey]?.workoutType;

      newSchedule[fromDateKey] = { ...newSchedule[fromDateKey], workoutType: toType };
      newSchedule[toDateKey] = { ...newSchedule[toDateKey], workoutType: fromType };

      return newSchedule;
    });
    // Clear cache for swapped days to regenerate workouts
    setGeneratedWorkoutsCache(prev => {
      const newCache = { ...prev };
      delete newCache[fromDateKey];
      delete newCache[toDateKey];
      return newCache;
    });
  };

  // Change workout type for a specific day
  const setWorkoutForDay = (dateKey, workoutType) => {
    setMasterSchedule(prev => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], workoutType }
    }));
    // Clear cache for this day to regenerate workout
    setGeneratedWorkoutsCache(prev => {
      const newCache = { ...prev };
      delete newCache[dateKey];
      return newCache;
    });
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
      if (entry?.workoutType) {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Generate workout for display
        const workout = getWorkoutForDate(dateKey);
        if (workout) {
          upcoming.push({
            date: `${dayNames[(date.getDay() + 6) % 7]}, ${monthNames[date.getMonth()]} ${date.getDate()}`,
            dateKey,
            workout: workout
          });
        }
      }
    }
    return upcoming;
  })();
  
  // Completed workouts history - loaded from database
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Personal records - loaded from database
  const [personalRecords, setPersonalRecords] = useState([]);

  // Load workout history and personal records from database
  useEffect(() => {
    let isMounted = true;

    const loadWorkoutData = async () => {
      if (!user?.id || !isAuthenticated) return;

      try {
        // Load workout history (all completed workouts across all programs)
        const { data: historyData, error: historyError } = await workoutService.getWorkoutHistory(user.id, 100);
        if (historyError) console.warn('Error loading workout history:', historyError?.message);

        if (isMounted && historyData) {
          setWorkoutHistory(historyData);
        }

        // Load personal records
        const { data: prData, error: prError } = await workoutService.getPersonalRecords(user.id);
        if (prError) console.warn('Error loading PRs:', prError?.message);

        if (isMounted && prData) {
          setPersonalRecords(prData);
        }
      } catch (err) {
        console.warn('Error loading workout data:', err?.message || err);
      }
    };

    loadWorkoutData();

    return () => { isMounted = false; };
  }, [user?.id, isAuthenticated]);

  // Sync completed workouts from history into masterSchedule
  useEffect(() => {
    if (!workoutHistory || workoutHistory.length === 0) return;

    // Build a map of completed dates from workout history
    const completedDates = {};
    workoutHistory.forEach(session => {
      if (session.started_at) {
        const dateKey = session.started_at.split('T')[0];
        completedDates[dateKey] = {
          sessionId: session.id,
          workoutName: session.workout_name,
          duration: session.duration_minutes,
          volume: session.total_volume,
        };
      }
    });

    // Update masterSchedule with completed status
    setMasterSchedule(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.keys(completedDates).forEach(dateKey => {
        if (updated[dateKey] && !updated[dateKey].completed) {
          updated[dateKey] = {
            ...updated[dateKey],
            completed: true,
            sessionData: completedDates[dateKey],
          };
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [workoutHistory]);

  // Helper to get last weight/reps used for an exercise from history
  const getLastPerformance = (exerciseName) => {
    if (!workoutHistory || workoutHistory.length === 0) return null;

    // Search through workout history for this exercise
    for (const session of workoutHistory) {
      if (session.workout_sets) {
        const exerciseSets = session.workout_sets
          .filter(set => set.exercise_name === exerciseName && !set.is_warmup)
          .sort((a, b) => b.set_number - a.set_number);

        if (exerciseSets.length > 0) {
          // Return the heaviest set from this session
          const bestSet = exerciseSets.reduce((best, current) =>
            (current.weight > best.weight) ? current : best
          , exerciseSets[0]);

          return {
            weight: bestSet.weight,
            reps: bestSet.reps,
            date: session.started_at,
          };
        }
      }
    }
    return null;
  };

  // Helper to get PR for an exercise
  const getExercisePR = (exerciseName) => {
    if (!personalRecords || personalRecords.length === 0) return null;

    const exercisePRs = personalRecords
      .filter(pr => pr.exercise_name === exerciseName)
      .sort((a, b) => b.e1rm - a.e1rm);

    return exercisePRs.length > 0 ? exercisePRs[0] : null;
  };

  // Function to refresh workout data (call after completing workout)
  const refreshWorkoutData = async () => {
    if (!user?.id) return;

    try {
      const { data: historyData } = await workoutService.getWorkoutHistory(user.id, 100);
      if (historyData) setWorkoutHistory(historyData);

      const { data: prData } = await workoutService.getPersonalRecords(user.id);
      if (prData) setPersonalRecords(prData);
    } catch (err) {
      console.warn('Error refreshing workout data:', err);
    }
  };

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
            {Object.values(EXPERIENCE_LEVELS).map(level => (
              <button key={level.id} onClick={() => setUserData(p => ({...p, experience: level.id}))}
                className="w-full p-4 rounded-xl text-left flex items-center gap-3"
                style={{ backgroundColor: userData.experience === level.id ? COLORS.primary + '20' : COLORS.surface,
                  border: `2px solid ${userData.experience === level.id ? COLORS.primary : COLORS.surfaceLight}` }}>
                <span className="text-2xl">{level.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: userData.experience === level.id ? COLORS.primary : COLORS.text }}>{level.label}</p>
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>{level.desc}</p>
                </div>
                {userData.experience === level.id && <Check size={20} color={COLORS.primary} />}
              </button>
            ))}

            {/* Info callout for experienced/expert */}
            {['experienced', 'expert'].includes(userData.experience) && (
              <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: COLORS.primary + '10' }}>
                <Info size={16} color={COLORS.primary} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Your workouts will include targeted muscle head selection for optimal development (e.g., long head vs short head biceps).
                </p>
              </div>
            )}
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

  // Report Injury Modal
  const ReportInjuryModal = () => {
    const muscleGroups = Object.keys(INJURY_RECOVERY_DATA);

    const handleReportInjury = async () => {
      if (!selectedInjuryMuscle) return;

      const timeline = calculateRecoveryTimeline(selectedInjuryMuscle, injurySeverity, new Date());

      const injuryData = {
        muscleGroup: selectedInjuryMuscle,
        severity: injurySeverity,
        notes: injuryNotes,
        reportedDate: new Date().toISOString().split('T')[0],
        timeline: timeline,
      };

      // Save to database if user is authenticated
      if (user?.id) {
        try {
          const { data: savedInjury, error } = await injuryService.reportInjury(user.id, injuryData);
          if (error) {
            console.error('Error saving injury:', error?.message);
          } else if (savedInjury) {
            // Use the database ID
            const newInjury = {
              id: savedInjury.id,
              muscleGroup: savedInjury.muscle_group,
              severity: savedInjury.severity,
              notes: savedInjury.notes,
              reportedDate: savedInjury.reported_date,
              timeline: savedInjury.timeline,
            };
            setInjuries(prev => [...prev, newInjury]);
            setSelectedInjuryMuscle(null);
            setInjurySeverity('mild');
            setInjuryNotes('');
            setShowReportInjury(false);
            setShowInjuryRecovery(newInjury);
            return;
          }
        } catch (err) {
          console.error('Error saving injury:', err);
        }
      }

      // Fallback for non-authenticated users
      const newInjury = {
        id: Date.now(),
        ...injuryData,
      };

      setInjuries(prev => [...prev, newInjury]);
      setSelectedInjuryMuscle(null);
      setInjurySeverity('mild');
      setInjuryNotes('');
      setShowReportInjury(false);
      setShowInjuryRecovery(newInjury);
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => { setSelectedInjuryMuscle(null); setInjurySeverity('mild'); setInjuryNotes(''); setShowReportInjury(false); }}>
            <ChevronLeft size={24} color={COLORS.text} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>Report Injury</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {/* Supportive Message */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">💙</span>
              <div>
                <h3 className="font-bold mb-1" style={{ color: COLORS.text }}>We're Here to Help You Heal</h3>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Injuries happen to everyone. Let's work together to get you back to your best safely. We'll adjust your workouts and guide you through recovery.
                </p>
              </div>
            </div>
          </div>

          {/* Select Muscle Group */}
          <p className="font-semibold mb-3" style={{ color: COLORS.text }}>Which area is affected?</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {muscleGroups.map(muscle => (
              <button
                key={muscle}
                onClick={() => setSelectedInjuryMuscle(muscle)}
                className="p-3 rounded-xl text-center text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedInjuryMuscle === muscle ? COLORS.primary : COLORS.surface,
                  color: selectedInjuryMuscle === muscle ? '#fff' : COLORS.text,
                  border: selectedInjuryMuscle === muscle ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.surfaceLight}`
                }}
              >
                {muscle}
              </button>
            ))}
          </div>

          {/* Severity Selection */}
          <p className="font-semibold mb-3" style={{ color: COLORS.text }}>How severe is it?</p>
          <div className="space-y-2 mb-6">
            {Object.entries(INJURY_SEVERITY).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setInjurySeverity(key)}
                className="w-full p-4 rounded-xl flex items-center gap-4 transition-all"
                style={{
                  backgroundColor: injurySeverity === key ? val.color + '20' : COLORS.surface,
                  border: injurySeverity === key ? `2px solid ${val.color}` : `2px solid ${COLORS.surfaceLight}`
                }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: val.color }} />
                <div className="text-left flex-1">
                  <p className="font-semibold" style={{ color: COLORS.text }}>{val.label}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    {key === 'mild' && 'Minor discomfort, can do most activities'}
                    {key === 'moderate' && 'Noticeable pain, need to limit activities'}
                    {key === 'severe' && 'Significant pain, need medical attention'}
                  </p>
                </div>
                {injurySeverity === key && <Check size={20} color={val.color} />}
              </button>
            ))}
          </div>

          {/* Notes */}
          <p className="font-semibold mb-3" style={{ color: COLORS.text }}>Additional notes (optional)</p>
          <textarea
            value={injuryNotes}
            onChange={(e) => setInjuryNotes(e.target.value)}
            placeholder="Describe how it happened, symptoms, etc..."
            className="w-full p-4 rounded-xl mb-4"
            style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.surfaceLight}`, minHeight: '100px' }}
          />

          {/* What to expect */}
          {selectedInjuryMuscle && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
              <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>What happens next:</p>
              <div className="space-y-2">
                {[
                  { icon: '🛡️', text: 'Workouts will avoid the injured area' },
                  { icon: '📋', text: 'Personalized recovery plan created' },
                  { icon: '🏥', text: 'Rehab exercises added when appropriate' },
                  { icon: '💪', text: 'Gradual return to full training' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <p className="text-xs" style={{ color: COLORS.textSecondary }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceLight }}>
          <button
            onClick={handleReportInjury}
            disabled={!selectedInjuryMuscle}
            className="w-full py-4 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.primary, color: '#fff', opacity: selectedInjuryMuscle ? 1 : 0.5 }}
          >
            {selectedInjuryMuscle ? `Start ${selectedInjuryMuscle} Recovery Plan` : 'Select Affected Area'}
          </button>
        </div>
      </div>
    );
  };

  // Injury Recovery Screen
  const InjuryRecoveryScreen = ({ injury }) => {
    if (!injury) return null;

    const currentPhase = getCurrentRecoveryPhase(injury);
    const phaseInfo = RECOVERY_PHASES[currentPhase];
    const timeline = injury.timeline;
    const coachingMessage = getCoachingMessage(currentPhase, injury.muscleGroup);

    const recoveryExercises = currentPhase === 'recovery' || currentPhase === 'strengthening'
      ? (currentPhase === 'recovery'
          ? RECOVERY_EXERCISES[injury.muscleGroup]
          : RESTRENGTHENING_EXERCISES[injury.muscleGroup]) || []
      : [];

    const daysUntilRecovery = Math.ceil((new Date(timeline.return.end) - new Date()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((new Date(timeline.return.end) - new Date(injury.reportedDate)) / (1000 * 60 * 60 * 24));
    const progressPercent = Math.max(0, Math.min(100, ((totalDays - daysUntilRecovery) / totalDays) * 100));

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleMarkHealed = async () => {
      // Update in database if user is authenticated
      if (user?.id && injury.id) {
        try {
          const { error } = await injuryService.markAsHealed(injury.id);
          if (error) {
            console.error('Error marking injury as healed:', error?.message);
          }
        } catch (err) {
          console.error('Error marking injury as healed:', err);
        }
      }

      setInjuries(prev => prev.filter(i => i.id !== injury.id));
      setShowInjuryRecovery(null);
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
          <button onClick={() => setShowInjuryRecovery(null)}>
            <ChevronLeft size={24} color={COLORS.text} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>{injury.muscleGroup} Recovery</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {/* Coaching Message */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.primary + '15', border: `1px solid ${COLORS.primary}30` }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{phaseInfo.icon}</span>
              <div>
                <p className="font-bold mb-1" style={{ color: COLORS.primary }}>Coach's Note</p>
                <p className="text-sm" style={{ color: COLORS.text }}>{coachingMessage}</p>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: COLORS.text }}>Recovery Progress</h3>
              <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-3 rounded-full mb-3" style={{ backgroundColor: COLORS.surfaceLight }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%`, backgroundColor: COLORS.primary }}
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
              <span>Started {formatDate(injury.reportedDate)}</span>
              <span>Est. recovery: {formatDate(timeline.return.end)}</span>
            </div>
          </div>

          {/* Current Phase */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: phaseInfo.color || COLORS.primary, color: '#fff' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{phaseInfo.icon}</span>
              <div>
                <p className="text-xs opacity-80">Current Phase</p>
                <h3 className="font-bold text-lg">{phaseInfo.name}</h3>
              </div>
            </div>
            <p className="text-sm opacity-90">{phaseInfo.description}</p>
          </div>

          {/* Phase Timeline */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
            <h3 className="font-bold mb-4" style={{ color: COLORS.text }}>Your Recovery Timeline</h3>
            <div className="space-y-4">
              {['rest', 'recovery', 'strengthening', 'return'].map((phase, i) => {
                const isActive = phase === currentPhase;
                const isPast = ['rest', 'recovery', 'strengthening', 'return'].indexOf(currentPhase) > i;
                const phaseData = timeline[phase];
                const info = RECOVERY_PHASES[phase];

                return (
                  <div key={phase} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: isPast ? COLORS.success : isActive ? COLORS.primary : COLORS.surfaceLight,
                          color: isPast || isActive ? '#fff' : COLORS.textMuted
                        }}
                      >
                        {isPast ? <Check size={16} /> : <span className="text-sm">{info.icon}</span>}
                      </div>
                      {i < 3 && (
                        <div
                          className="w-0.5 flex-1 mt-1"
                          style={{ backgroundColor: isPast ? COLORS.success : COLORS.surfaceLight }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold" style={{ color: isActive ? COLORS.primary : isPast ? COLORS.success : COLORS.text }}>
                          {info.name}
                        </p>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                            Now
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                        {formatDate(phaseData.start)} - {formatDate(phaseData.end)}
                      </p>
                      {isActive && info.tips && info.tips.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {info.tips.slice(0, 2).map((tip, j) => (
                            <p key={j} className="text-xs" style={{ color: COLORS.textSecondary }}>
                              • {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery Exercises */}
          {recoveryExercises.length > 0 && (
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
              <h3 className="font-bold mb-3" style={{ color: COLORS.text }}>
                {currentPhase === 'recovery' ? 'Rehab Exercises' : 'Strengthening Exercises'}
              </h3>
              <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>
                {currentPhase === 'recovery'
                  ? 'Gentle exercises to promote healing and mobility'
                  : 'Progressive exercises to rebuild strength safely'}
              </p>
              <div className="space-y-2">
                {recoveryExercises.map((exercise, i) => (
                  <div key={i} className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                      <span className="text-sm">{currentPhase === 'recovery' ? '🧘' : '💪'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: COLORS.text }}>{exercise.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.sets} sets × {exercise.reps} reps</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips for Current Phase */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surfaceLight }}>
            <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Tips for {phaseInfo.name}</h3>
            <div className="space-y-2">
              {(phaseInfo.tips || []).map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check size={14} color={COLORS.success} className="mt-0.5" />
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Info */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: INJURY_SEVERITY[injury.severity].color }} />
              <p className="font-semibold" style={{ color: COLORS.text }}>{INJURY_SEVERITY[injury.severity].label} Injury</p>
            </div>
            {injury.notes && (
              <p className="text-sm" style={{ color: COLORS.textMuted }}>Notes: {injury.notes}</p>
            )}
          </div>
        </div>
        <div className="p-4 border-t space-y-2" style={{ borderColor: COLORS.surfaceLight }}>
          {currentPhase === 'return' && (
            <button
              onClick={handleMarkHealed}
              className="w-full py-4 rounded-xl font-semibold"
              style={{ backgroundColor: COLORS.success, color: '#fff' }}
            >
              Mark as Healed
            </button>
          )}
          <button
            onClick={() => setShowInjuryRecovery(null)}
            className="w-full py-3 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text }}
          >
            Close
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
          <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: todayWorkoutTemplate?.name?.replace(' Day ', ' ').replace('Day ', '') || 'Workout', name: todayWorkoutTemplate?.name || 'Workout', focus: todayWorkoutTemplate?.focus || '', exercises: todayWorkoutTemplate?.exercises?.length || 5, duration: 60 }); }}
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

      {/* Active Injuries Banner */}
      {injuries.length > 0 && (
        <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface, border: `1px solid ${INJURY_SEVERITY[injuries[0].severity].color}40` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🩹</span>
              <h3 className="font-bold" style={{ color: COLORS.text }}>Recovery in Progress</h3>
            </div>
            <button
              onClick={() => setShowReportInjury(true)}
              className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textSecondary }}
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {injuries.map(injury => {
              const currentPhase = getCurrentRecoveryPhase(injury);
              const phaseInfo = RECOVERY_PHASES[currentPhase];
              const daysLeft = Math.ceil((new Date(injury.timeline.return.end) - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <button
                  key={injury.id}
                  onClick={() => setShowInjuryRecovery(injury)}
                  className="w-full p-3 rounded-lg flex items-center gap-3 text-left"
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: INJURY_SEVERITY[injury.severity].color + '20' }}>
                    <span>{phaseInfo.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{injury.muscleGroup}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>{phaseInfo.name} • {daysLeft > 0 ? `~${daysLeft} days left` : 'Ready to heal'}</p>
                  </div>
                  <ChevronRight size={18} color={COLORS.textMuted} />
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-3" style={{ color: COLORS.textSecondary }}>
            {getCoachingMessage(getCurrentRecoveryPhase(injuries[0]), injuries[0].muscleGroup)}
          </p>
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
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                {weeklyWeightData?.actualWeeklyRate !== 0 ? 'Actual Weekly Change' : 'Target Weekly Rate'}
              </p>
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
                    goal: {overviewStats.weeklyTarget > 0 ? '+' : ''}{overviewStats.weeklyTarget}
                  </span>
                )}
                {weeklyWeightData?.actualWeeklyRate === 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    backgroundColor: COLORS.primary + '20',
                    color: COLORS.primary
                  }}>
                    expected
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
        <div className="flex gap-2 mb-3">
          {[
            { id: 'weight', label: 'Weight' },
            { id: 'workouts', label: 'Workouts' },
            { id: 'volume', label: 'Volume' },
            { id: 'sleep', label: 'Sleep' },
            { id: 'protein', label: 'Protein' },
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
        <div style={{ height: 125 }}>
          {(() => {
            // Generate placeholder data if no real data exists
            const defaults = { weight: 100, workouts: 7, volume: 25000, sleep: 10, protein: 200 };
            const hasRealData = chartData[selectedChart]?.length > 0 && chartData[selectedChart].some(d => d.value !== null);
            const hasExpectedData = chartData[selectedChart]?.length > 0 && chartData[selectedChart].some(d => d.expected !== null);

            // For weight chart, generate expected trajectory if not present
            let data;
            if (hasRealData || hasExpectedData) {
              data = chartData[selectedChart];
            } else if (selectedChart === 'weight' && userData.currentWeight && userData.goalWeight) {
              // Generate expected weight trajectory based on user goals
              const startWeight = parseFloat(userData.currentWeight);
              const goalWeight = parseFloat(userData.goalWeight);
              const weeks = currentProgram?.totalWeeks || 12;
              const weeklyChange = (goalWeight - startWeight) / weeks;
              data = Array.from({ length: weeks }, (_, i) => ({
                week: (i + 1).toString(),
                value: null,
                expected: parseFloat((startWeight + (weeklyChange * (i + 1))).toFixed(1)),
              }));
            } else {
              data = Array.from({ length: 12 }, (_, i) => ({ week: (i + 1).toString(), value: 0, expected: null }));
            }

            return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis
                  dataKey="week"
                  tick={{ fill: COLORS.textMuted, fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                  tickFormatter={(val) => `W${val}`}
                />
                <YAxis
                  tick={{ fill: COLORS.textMuted, fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  domain={selectedChart === 'weight'
                    ? [(dataMin) => Math.floor((dataMin || userData.currentWeight || 60) * 0.95),
                       (dataMax) => Math.ceil((dataMax || userData.goalWeight || 80) * 1.05)]
                    : hasRealData ? [0, 'auto'] : [0, defaults[selectedChart] || 100]}
                  tickFormatter={(val) => selectedChart === 'volume' ? `${Math.round(val/1000)}k` : Math.round(val)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const actualVal = payload.find(p => p.dataKey === 'value')?.value;
                      const expectedVal = payload.find(p => p.dataKey === 'expected')?.value;
                      return (
                        <div style={{
                          backgroundColor: COLORS.surface,
                          border: `1px solid ${COLORS.surfaceLight}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}>
                          <p style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }}>Week {label}</p>
                          {actualVal !== null && actualVal !== undefined && (
                            <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 'bold' }}>{actualVal} {chartLabels[selectedChart]}</p>
                          )}
                          {expectedVal !== null && expectedVal !== undefined && (
                            <p style={{ color: COLORS.textMuted, fontSize: 11 }}>Target: {expectedVal} {chartLabels[selectedChart]}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {hasRealData && (
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: COLORS.primary, r: 5, stroke: COLORS.text, strokeWidth: 2 }}
                    connectNulls
                  />
                )}
                {(hasExpectedData || (selectedChart === 'weight' && userData.currentWeight && userData.goalWeight)) && (
                  <Line
                    type="monotone"
                    dataKey="expected"
                    stroke={COLORS.textMuted}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            );
          })()}
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
            {friends.length > 0 && (
              <button
                onClick={() => setActiveTab('friends')}
                className="text-xs flex items-center gap-1"
                style={{ color: COLORS.primary }}
              >
                See All <ChevronRight size={14} />
              </button>
            )}
          </div>
          {friends.length === 0 ? (
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex flex-col items-center justify-center py-4">
                <Users size={40} color={COLORS.textMuted} style={{ opacity: 0.5 }} />
                <p className="text-sm mt-3 font-medium" style={{ color: COLORS.text }}>No friends yet</p>
                <p className="text-xs text-center mt-1 mb-4" style={{ color: COLORS.textMuted }}>
                  Add friends to see their workouts and stay motivated together
                </p>
                <button
                  onClick={() => setActiveTab('friends')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                >
                  <Search size={16} />
                  Find Friends
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {friends.slice(0, 3).map(friend => (
                <button
                  key={friend.id}
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
                    <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{friend.name}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {friend.streak > 0 ? `🔥 ${friend.streak} day streak` : 'No recent activity'}
                    </p>
                  </div>
                  {friend.isOnline && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
                  )}
                </button>
              ))}
            </div>
          )}
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
              <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: todayWorkoutTemplate?.name?.replace(' Day ', ' ').replace('Day ', '') || 'Workout', name: todayWorkoutTemplate?.name || 'Workout', focus: todayWorkoutTemplate?.focus || '', exercises: todayWorkoutTemplate?.exercises?.length || 5, duration: 60 }); }}
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
            <button onClick={() => setShowReportInjury(true)} className="text-sm px-2 py-1 rounded flex items-center gap-1"
              style={{ backgroundColor: injuries.length > 0 ? COLORS.warning + '20' : COLORS.surfaceLight, color: injuries.length > 0 ? COLORS.warning : COLORS.textSecondary }}>
              <Heart size={14} /> {injuries.length > 0 ? `${injuries.length} Injury` : 'Injury'}
            </button>
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
            <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: todayWorkoutTemplate?.name?.replace(' Day ', ' ').replace('Day ', '') || 'Workout', name: todayWorkoutTemplate?.name || 'Workout', focus: todayWorkoutTemplate?.focus || '', exercises: todayWorkoutTemplate?.exercises?.length || 5, duration: 60 }); }}
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
            <button onClick={() => { setTodayWorkout({ type: todayWorkoutTemplate?.name?.replace(' Day ', ' ').replace('Day ', '') || 'Workout', name: todayWorkoutTemplate?.name || 'Workout', focus: todayWorkoutTemplate?.focus || '', exercises: todayWorkoutTemplate?.exercises?.length || 5, duration: 60 }); setIsRescheduled(false); setOriginalWorkout(null); }} 
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
                onClick={() => todayWorkoutTemplate && setShowWorkoutPreview(todayWorkoutTemplate)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: COLORS.surfaceLight }}
              >
                <Eye size={18} color={COLORS.textMuted} />
              </button>
            </div>

            {/* Workout Explanation */}
            {todayWorkoutTemplate?.description && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                <p className="text-xs leading-relaxed" style={{ color: COLORS.textSecondary }}>
                  {todayWorkoutTemplate.description}
                </p>
                {todayWorkoutTemplate.hasCardio && (
                  <p className="text-xs mt-1 font-medium" style={{ color: COLORS.primary }}>
                    Includes cardio finisher for your weight loss goal
                  </p>
                )}
              </div>
            )}

            {/* Injury Adaptation Notice */}
            {injuries.length > 0 && (() => {
              const affectedMuscles = injuries.map(i => i.muscleGroup);
              const recoveryExercises = getInjuryRecoveryExercisesToAdd();
              return (
                <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.warning + '15', border: `1px solid ${COLORS.warning}30` }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🩹</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Workout Adapted for Recovery</p>
                      <p className="text-xs mb-2" style={{ color: COLORS.textSecondary }}>
                        Exercises targeting {affectedMuscles.join(', ')} will be skipped. {recoveryExercises.length > 0 ? `${recoveryExercises.length} rehab exercise${recoveryExercises.length > 1 ? 's' : ''} added.` : ''}
                      </p>
                      {recoveryExercises.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recoveryExercises.map((ex, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
                              + {ex.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowInjuryRecovery(injuries[0])}
                      className="text-xs underline"
                      style={{ color: COLORS.warning }}
                    >
                      View Plan
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Time Editor */}
            <button
              onClick={() => setShowTimeEditor(!showTimeEditor)}
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg w-full justify-between"
              style={{ backgroundColor: COLORS.surfaceLight }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} color={COLORS.textSecondary} />
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {workoutTime} min • {customExerciseCount || Math.max(2, Math.floor(workoutTime / 12))} exercises
                </span>
              </div>
              <ChevronDown size={16} color={COLORS.textMuted} style={{ transform: showTimeEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showTimeEditor && (() => {
              const defaultExerciseCount = Math.max(2, Math.floor(workoutTime / 12));
              const exerciseCount = customExerciseCount || defaultExerciseCount;
              const allExercises = getCurrentExercises();
              const fullPool = todayWorkoutTemplate?.exercises || allExercises;
              // Min: 2 exercises, Max: pool size or time-based max (allowing more exercises with less rest)
              const minExercises = 2;
              const maxExercises = Math.min(fullPool.length, Math.floor(workoutTime / 5)); // ~5min minimum per exercise
              // Optimize exercises for the selected time AND count
              const workoutTypeForCoverage = todayWorkoutTemplate?.workoutType || todayWorkout?.type || null;
              const exercisesForTime = optimizeExercisesForTimeAndCount(allExercises, fullPool, workoutTime, exerciseCount, workoutTypeForCoverage);
              const timeBreakdown = getWorkoutTimeBreakdown(exercisesForTime);
              const totalSetsPreview = exercisesForTime.reduce((acc, ex) => acc + (ex.sets || 3), 0);

              const handleDecreaseExercises = () => {
                const newCount = Math.max(minExercises, exerciseCount - 1);
                setCustomExerciseCount(newCount === defaultExerciseCount ? null : newCount);
              };

              const handleIncreaseExercises = () => {
                const newCount = Math.min(maxExercises, exerciseCount + 1);
                setCustomExerciseCount(newCount === defaultExerciseCount ? null : newCount);
              };

              return (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                  <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>How much time do you have?</p>
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {[20, 30, 45, 60, 75, 90].map(time => (
                      <button
                        key={time}
                        onClick={() => {
                          setWorkoutTime(time);
                          setCustomExerciseCount(null); // Reset to default when time changes
                        }}
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

                  {/* Exercise Count Adjuster */}
                  <div className="flex items-center justify-between mb-3 p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>Number of exercises</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDecreaseExercises}
                        disabled={exerciseCount <= minExercises}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: exerciseCount <= minExercises ? COLORS.surfaceLight : COLORS.primary + '20',
                          color: exerciseCount <= minExercises ? COLORS.textMuted : COLORS.primary,
                          opacity: exerciseCount <= minExercises ? 0.5 : 1
                        }}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-lg font-bold w-8 text-center" style={{ color: COLORS.text }}>
                        {exerciseCount}
                      </span>
                      <button
                        onClick={handleIncreaseExercises}
                        disabled={exerciseCount >= maxExercises}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: exerciseCount >= maxExercises ? COLORS.surfaceLight : COLORS.primary + '20',
                          color: exerciseCount >= maxExercises ? COLORS.textMuted : COLORS.primary,
                          opacity: exerciseCount >= maxExercises ? 0.5 : 1
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {customExerciseCount && customExerciseCount !== defaultExerciseCount && (
                    <p className="text-xs text-center mb-2" style={{ color: COLORS.warning }}>
                      {customExerciseCount > defaultExerciseCount
                        ? 'More exercises = shorter rest periods'
                        : 'Fewer exercises = longer rest periods & more sets'}
                    </p>
                  )}

                  {/* Time Breakdown Summary */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                      <p className="text-sm font-bold" style={{ color: COLORS.primary }}>
                        {Math.floor(timeBreakdown.workingTime / 60)}m
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Working</p>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.warning + '15' }}>
                      <p className="text-sm font-bold" style={{ color: COLORS.warning }}>
                        {Math.floor(timeBreakdown.restTime / 60)}m
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Rest</p>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.success + '15' }}>
                      <p className="text-sm font-bold" style={{ color: COLORS.success }}>
                        ~{Math.round(timeBreakdown.totalTime / 60)}m
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Total</p>
                    </div>
                  </div>
                  <p className="text-xs text-center mb-3" style={{ color: COLORS.textMuted }}>
                    Rest time evenly distributed between all sets
                  </p>

                  {/* Exercise Overview - Collapsible */}
                  <div className="border-t pt-3" style={{ borderColor: COLORS.surfaceLight }}>
                    <button
                      onClick={() => setExerciseListCollapsed(!exerciseListCollapsed)}
                      className="w-full flex items-center justify-between mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          size={16}
                          color={COLORS.textMuted}
                          style={{ transform: exerciseListCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        />
                        <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                          {exercisesForTime.length} EXERCISES • {totalSetsPreview} SETS
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(customizedExercises || customExerciseCount) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resetCustomizations();
                              setCustomExerciseCount(null);
                            }}
                            className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                            style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}
                          >
                            <Undo2 size={10} /> Reset
                          </button>
                        )}
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>
                          {exerciseListCollapsed ? 'Show' : 'Hide'}
                        </span>
                      </div>
                    </button>

                    {!exerciseListCollapsed && (
                      <>
                        {/* Warm-up Preview */}
                        <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: COLORS.warning + '10', border: `1px solid ${COLORS.warning}20` }}>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>W</span>
                            <span className="text-xs font-medium" style={{ color: COLORS.warning }}>Warm-up</span>
                            <span className="text-xs ml-auto" style={{ color: COLORS.textMuted }}>3 min</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {exercisesForTime.map((exercise, i) => {
                        const isExpanded = expandedExerciseId === exercise.id;
                        const originalIndex = allExercises.findIndex(ex => ex.id === exercise.id);
                        const isSuperset = exercise.supersetId;
                        const isFirstInSuperset = isSuperset && exercise.supersetOrder === 1;
                        const isSecondInSuperset = isSuperset && exercise.supersetOrder === 2;

                        return (
                          <div key={exercise.id}>
                            {/* Superset header - show before first exercise in superset */}
                            {isFirstInSuperset && (
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <Zap size={12} color={COLORS.warning} />
                                <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>SUPERSET</span>
                              </div>
                            )}
                            <div
                              className="rounded-lg overflow-hidden"
                              style={{
                                backgroundColor: COLORS.surface,
                                ...(isSuperset && {
                                  borderLeft: `3px solid ${COLORS.warning}`,
                                  borderRadius: isFirstInSuperset ? '8px 8px 0 0' : isSecondInSuperset ? '0 0 8px 8px' : '8px',
                                  marginTop: isSecondInSuperset ? '-2px' : 0
                                })
                              }}
                            >
                            <button
                              onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                              className="w-full flex items-center justify-between p-2"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS) + '20', color: getWorkoutColor(todayWorkout.type, COLORS) }}
                                >
                                  {i + 1}
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-1">
                                    <p className="text-sm font-medium" style={{ color: COLORS.text }}>{exercise.name}</p>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfo(exercise.name); }} className="p-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={12} color={COLORS.primary} /></button>
                                  </div>
                                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                    {['experienced', 'expert'].includes(userData.experience) && exercise.targetedHeads && exercise.targetedHeads.length > 0
                                      ? exercise.targetedHeads.join(', ')
                                      : exercise.muscleGroup}
                                    {isSuperset && <span style={{ color: COLORS.warning }}> — {exercise.supersetWith}</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{exercise.sets}×{exercise.targetReps}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</span>
                                    {isSuperset && exercise.restTime === 0 ? (
                                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                                        No rest
                                      </span>
                                    ) : (
                                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                                        {Math.floor((exercise.restTime || 90) / 60)}:{((exercise.restTime || 90) % 60).toString().padStart(2, '0')} rest
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronDown
                                  size={16}
                                  color={COLORS.textMuted}
                                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                />
                              </div>
                            </button>

                            {/* Expanded Options */}
                            {isExpanded && (
                              <div className="px-2 pb-2 pt-1 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                                {/* Reorder buttons */}
                                <div className="flex gap-2 mb-2">
                                  <button
                                    onClick={() => moveExerciseInHome(originalIndex, 'up')}
                                    disabled={originalIndex === 0}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                    style={{
                                      backgroundColor: originalIndex === 0 ? COLORS.surfaceLight : COLORS.surfaceLight,
                                      color: originalIndex === 0 ? COLORS.textMuted : COLORS.text,
                                      opacity: originalIndex === 0 ? 0.5 : 1
                                    }}
                                  >
                                    <ChevronUp size={14} />
                                    Move Up
                                  </button>
                                  <button
                                    onClick={() => moveExerciseInHome(originalIndex, 'down')}
                                    disabled={originalIndex === allExercises.length - 1}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                    style={{
                                      backgroundColor: originalIndex === allExercises.length - 1 ? COLORS.surfaceLight : COLORS.surfaceLight,
                                      color: originalIndex === allExercises.length - 1 ? COLORS.textMuted : COLORS.text,
                                      opacity: originalIndex === allExercises.length - 1 ? 0.5 : 1
                                    }}
                                  >
                                    <ChevronDown size={14} />
                                    Move Down
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => swapExercise(originalIndex)}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                    style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                                  >
                                    <ArrowLeftRight size={14} />
                                    Swap Exercise
                                  </button>
                                  <button
                                    onClick={() => removeExercise(originalIndex)}
                                    disabled={allExercises.length <= 2}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                    style={{
                                      backgroundColor: allExercises.length <= 2 ? COLORS.surfaceLight : COLORS.error + '20',
                                      color: allExercises.length <= 2 ? COLORS.textMuted : COLORS.error,
                                      opacity: allExercises.length <= 2 ? 0.5 : 1
                                    }}
                                  >
                                    <X size={14} />
                                    Remove
                                  </button>
                                </div>
                                {allExercises.length <= 2 && (
                                  <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                                    Minimum 2 exercises required
                                  </p>
                                )}
                                <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                                  Removing adds sets to remaining exercises
                                </p>
                              </div>
                            )}
                            </div>
                          </div>
                        );
                      })}
                        </div>
                        {allExercises.length > exerciseCount && (
                          <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                            +{allExercises.length - exerciseCount} more exercises with more time
                          </p>
                        )}

                        {/* Cool-down Preview */}
                        <div className="p-2 rounded-lg mt-2" style={{ backgroundColor: COLORS.info + '10', border: `1px solid ${COLORS.info}20` }}>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.info + '20', color: COLORS.info }}>C</span>
                            <span className="text-xs font-medium" style={{ color: COLORS.info }}>Cool-down</span>
                            <span className="text-xs ml-auto" style={{ color: COLORS.textMuted }}>2 min</span>
                          </div>
                        </div>
                      </>
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
                    // Refresh sleep chart to show new data
                    refreshSleepChartData();
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
          <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }} onMouseDown={e => e.stopPropagation()}>
            <div className="mb-2">
              <input
                type="text"
                placeholder="Supplement name"
                ref={supplementNameRef}
                autoFocus
                onMouseDown={e => e.stopPropagation()}
                className="w-full p-2 rounded text-sm mb-2"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none', outline: 'none' }}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  ref={supplementDosageRef}
                  onMouseDown={e => e.stopPropagation()}
                  className="flex-1 p-2 rounded text-sm"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none', outline: 'none' }}
                />
                <select
                  ref={supplementUnitRef}
                  defaultValue="mg"
                  onMouseDown={e => e.stopPropagation()}
                  className="p-2 rounded text-sm"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none', outline: 'none' }}
                >
                  {SUPPLEMENT_UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={(e) => {
                e.preventDefault();
                setShowAddSupplement(false);
                if (supplementNameRef.current) supplementNameRef.current.value = '';
                if (supplementDosageRef.current) supplementDosageRef.current.value = '';
                if (supplementUnitRef.current) supplementUnitRef.current.value = 'mg';
              }}
                className="flex-1 py-2 rounded text-sm" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted }}>Cancel</button>
              <button type="button" onClick={async (e) => {
                e.preventDefault();
                const name = supplementNameRef.current?.value?.trim();
                const amount = supplementDosageRef.current?.value?.trim();
                const unit = supplementUnitRef.current?.value || 'mg';
                const dosage = amount ? `${amount} ${unit}` : 'As needed';
                if (name && user?.id) {
                  const { data, error } = await nutritionService.addSupplement(user.id, { name, dosage });
                  if (!error && data) {
                    setSupplements(prev => [...prev, { id: data.id, name: data.name, dosage: data.dosage, taken: false }]);
                  } else {
                    setSupplements(prev => [...prev, { id: Date.now().toString(), name, dosage, taken: false }]);
                  }
                  setShowAddSupplement(false);
                  if (supplementNameRef.current) supplementNameRef.current.value = '';
                  if (supplementDosageRef.current) supplementDosageRef.current.value = '';
                  if (supplementUnitRef.current) supplementUnitRef.current.value = 'mg';
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
          <span className="text-sm" style={{ color: COLORS.textMuted }}>
            {supplements.length === 0 ? 'No supplements added' : `${supplements.filter(s => s.taken).length}/${supplements.length} taken`}
          </span>
          {supplements.length > 0 && (
            <div className="h-2 w-24 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
              <div className="h-full rounded-full" style={{ backgroundColor: COLORS.supplements, width: `${(supplements.filter(s => s.taken).length / supplements.length) * 100}%` }} />
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {showActiveWorkout && (() => {
        const filteredExercises = getCurrentExercises();
        const recoveryExercises = getInjuryRecoveryExercisesToAdd();
        const allExercises = [...filteredExercises, ...recoveryExercises];
        const template = { ...todayWorkoutTemplate, exercises: allExercises };
        return (
          <ActiveWorkoutScreen
            onClose={() => setShowActiveWorkout(false)}
            onComplete={completeTodayWorkout}
            COLORS={COLORS}
            availableTime={workoutTime}
            userGoal={userData.goal || 'build_muscle'}
            userExperience={userData.experience || 'beginner'}
            userId={user?.id}
            workoutName={todayWorkout?.name || 'Workout'}
            workoutTemplate={template}
            injuries={injuries}
          />
        );
      })()}
    </div>
  );
  };

  // Main Screen with tabs
  const MainScreen = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'workouts' && (
          <div ref={workoutTabScrollRef} className="p-4 h-full overflow-auto">
            {/* Scrollable Week Schedule */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setScheduleWeekOffset(prev => prev - 1)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <ChevronLeft size={18} color={COLORS.text} />
                  </button>
                </div>
                <h3 className="font-semibold" style={{ color: COLORS.text }}>{getWeekHeaderText(scheduleWeekOffset)}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setScheduleWeekOffset(prev => prev + 1)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <ChevronRight size={18} color={COLORS.text} />
                  </button>
                  <button
                    onClick={() => setShowScheduleSettings(true)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <Settings size={18} color={COLORS.textMuted} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {(() => {
                  // Drag handlers for week schedule (works for both workouts and rest days)
                  const handleDragStart = (day, isBeforeProgram) => {
                    if (day.isPast || isBeforeProgram) return;
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
                    const canDrag = !day.isPast && !isBeforeProgram;

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
                Tap to edit • Drag and drop workouts to reschedule
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
                    <button onClick={() => { setIsPaused(false); setPauseReturnDate(null); setTodayWorkout({ type: todayWorkoutTemplate?.name?.replace(' Day ', ' ').replace('Day ', '') || 'Workout', name: todayWorkoutTemplate?.name || 'Workout', focus: todayWorkoutTemplate?.focus || '', exercises: todayWorkoutTemplate?.exercises?.length || 5, duration: 60 }); }}
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
                          onClick={() => todayWorkoutTemplate && setShowWorkoutPreview(todayWorkoutTemplate)}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: COLORS.surfaceLight }}
                          title="Preview"
                        >
                          <Eye size={16} color={COLORS.textMuted} />
                        </button>
                      </div>
                    </div>

                    {/* Workout Explanation */}
                    {todayWorkoutTemplate?.description && (
                      <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                        <p className="text-xs leading-relaxed" style={{ color: COLORS.textSecondary }}>
                          {todayWorkoutTemplate.description}
                        </p>
                        {todayWorkoutTemplate.hasCardio && (
                          <p className="text-xs mt-1 font-medium" style={{ color: COLORS.primary }}>
                            Includes cardio finisher for your weight loss goal
                          </p>
                        )}
                      </div>
                    )}

                {/* Time Editor */}
                <button
                  onClick={() => setShowWorkoutTimeEditor(!showWorkoutTimeEditor)}
                  className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg w-full justify-between"
                  style={{ backgroundColor: COLORS.surfaceLight }}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} color={COLORS.textSecondary} />
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                      {workoutTime} min • {customExerciseCount || Math.max(2, Math.floor(workoutTime / 12))} exercises
                    </span>
                  </div>
                  <ChevronDown size={16} color={COLORS.textMuted} style={{ transform: showWorkoutTimeEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {showWorkoutTimeEditor && (() => {
                  const defaultExerciseCount = Math.max(2, Math.floor(workoutTime / 12));
                  const exerciseCount = customExerciseCount || defaultExerciseCount;
                  const allExercises = getCurrentExercises();
                  const fullPool = todayWorkoutTemplate?.exercises || allExercises;
                  // Min: 2 exercises, Max: pool size or time-based max (allowing more exercises with less rest)
                  const minExercises = 2;
                  const maxExercises = Math.min(fullPool.length, Math.floor(workoutTime / 5)); // ~5min minimum per exercise
                  // Optimize exercises for the selected time AND count
                  const workoutTypeForCoverage = todayWorkoutTemplate?.workoutType || todayWorkout?.type || null;
                  const exercisesForTime = optimizeExercisesForTimeAndCount(allExercises, fullPool, workoutTime, exerciseCount, workoutTypeForCoverage);
                  const timeBreakdown = getWorkoutTimeBreakdown(exercisesForTime);
                  const totalSetsPreview = exercisesForTime.reduce((acc, ex) => acc + (ex.sets || 3), 0);

                  return (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.background }}>
                      <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>How much time do you have?</p>
                      <div className="grid grid-cols-6 gap-2 mb-3">
                        {[20, 30, 45, 60, 75, 90].map(time => (
                          <button
                            key={time}
                            onClick={() => updateWorkoutTimeWithScroll(time)}
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

                      {/* Exercise Count Adjuster */}
                      <div className="flex items-center justify-between mb-3 p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                        <span className="text-sm" style={{ color: COLORS.textSecondary }}>Number of exercises</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newCount = Math.max(minExercises, exerciseCount - 1);
                              updateExerciseCountWithScroll(newCount === defaultExerciseCount ? null : newCount);
                            }}
                            disabled={exerciseCount <= minExercises}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: exerciseCount <= minExercises ? COLORS.surfaceLight : COLORS.primary + '20',
                              color: exerciseCount <= minExercises ? COLORS.textMuted : COLORS.primary,
                              opacity: exerciseCount <= minExercises ? 0.5 : 1
                            }}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-lg font-bold w-8 text-center" style={{ color: COLORS.text }}>
                            {exerciseCount}
                          </span>
                          <button
                            onClick={() => {
                              const newCount = Math.min(maxExercises, exerciseCount + 1);
                              updateExerciseCountWithScroll(newCount === defaultExerciseCount ? null : newCount);
                            }}
                            disabled={exerciseCount >= maxExercises}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: exerciseCount >= maxExercises ? COLORS.surfaceLight : COLORS.primary + '20',
                              color: exerciseCount >= maxExercises ? COLORS.textMuted : COLORS.primary,
                              opacity: exerciseCount >= maxExercises ? 0.5 : 1
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      {customExerciseCount && customExerciseCount !== defaultExerciseCount && (
                        <p className="text-xs text-center mb-2" style={{ color: COLORS.warning }}>
                          {customExerciseCount > defaultExerciseCount
                            ? 'More exercises = shorter rest periods'
                            : 'Fewer exercises = longer rest periods & more sets'}
                        </p>
                      )}

                      {/* Time Breakdown Summary */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                          <p className="text-sm font-bold" style={{ color: COLORS.primary }}>
                            {Math.floor(timeBreakdown.workingTime / 60)}m
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Working</p>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.warning + '15' }}>
                          <p className="text-sm font-bold" style={{ color: COLORS.warning }}>
                            {Math.floor(timeBreakdown.restTime / 60)}m
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Rest</p>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.success + '15' }}>
                          <p className="text-sm font-bold" style={{ color: COLORS.success }}>
                            ~{Math.round(timeBreakdown.totalTime / 60)}m
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Total</p>
                        </div>
                      </div>
                      <p className="text-xs text-center mb-3" style={{ color: COLORS.textMuted }}>
                        Rest time evenly distributed between all sets
                      </p>

                      {/* Exercise Overview - Collapsible */}
                      <div className="border-t pt-3" style={{ borderColor: COLORS.surfaceLight }}>
                        <button
                          onClick={() => setExerciseListCollapsed(!exerciseListCollapsed)}
                          className="w-full flex items-center justify-between mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              size={16}
                              color={COLORS.textMuted}
                              style={{ transform: exerciseListCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            />
                            <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                              {exercisesForTime.length} EXERCISES • {totalSetsPreview} SETS
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(customizedExercises || customExerciseCount) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const scrollTop = workoutTabScrollRef.current?.scrollTop;
                                  resetCustomizations();
                                  setCustomExerciseCount(null);
                                  requestAnimationFrame(() => {
                                    if (workoutTabScrollRef.current && scrollTop !== undefined) {
                                      workoutTabScrollRef.current.scrollTop = scrollTop;
                                    }
                                  });
                                }}
                                className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}
                              >
                                <Undo2 size={10} /> Reset
                              </button>
                            )}
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>
                              {exerciseListCollapsed ? 'Show' : 'Hide'}
                            </span>
                          </div>
                        </button>

                        {!exerciseListCollapsed && (
                          <>
                            {/* Warm-up Preview */}
                            <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: COLORS.warning + '10', border: `1px solid ${COLORS.warning}20` }}>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>W</span>
                                <span className="text-xs font-medium" style={{ color: COLORS.warning }}>Warm-up</span>
                                <span className="text-xs ml-auto" style={{ color: COLORS.textMuted }}>3 min</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {exercisesForTime.map((exercise, i) => {
                            const isExpanded = expandedExerciseId === exercise.id;
                            const originalIndex = allExercises.findIndex(ex => ex.id === exercise.id);
                            const isSuperset = exercise.supersetId;
                            const isFirstInSuperset = isSuperset && exercise.supersetOrder === 1;
                            const isSecondInSuperset = isSuperset && exercise.supersetOrder === 2;

                            return (
                              <div key={exercise.id}>
                                {/* Superset header - show before first exercise in superset */}
                                {isFirstInSuperset && (
                                  <div className="flex items-center gap-2 mb-1 px-1">
                                    <Zap size={12} color={COLORS.warning} />
                                    <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>SUPERSET</span>
                                  </div>
                                )}
                                <div
                                  className="rounded-lg overflow-hidden"
                                  style={{
                                    backgroundColor: COLORS.surface,
                                    ...(isSuperset && {
                                      borderLeft: `3px solid ${COLORS.warning}`,
                                      borderRadius: isFirstInSuperset ? '8px 8px 0 0' : isSecondInSuperset ? '0 0 8px 8px' : '8px',
                                      marginTop: isSecondInSuperset ? '-2px' : 0
                                    })
                                  }}
                                >
                                <button
                                  onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                                  className="w-full flex items-center justify-between p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: getWorkoutColor(todayWorkout.type, COLORS) + '20', color: getWorkoutColor(todayWorkout.type, COLORS) }}
                                    >
                                      {i + 1}
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium" style={{ color: COLORS.text }}>{exercise.name}</p>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowExerciseInfo(exercise.name); }} className="p-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}><Info size={12} color={COLORS.primary} /></button>
                                      </div>
                                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                        {['experienced', 'expert'].includes(userData.experience) && exercise.targetedHeads && exercise.targetedHeads.length > 0
                                          ? exercise.targetedHeads.join(', ')
                                          : exercise.muscleGroup}
                                        {isSuperset && <span style={{ color: COLORS.warning }}> — {exercise.supersetWith}</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{exercise.sets}×{exercise.targetReps}</p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight}kg</span>
                                        {isSuperset && exercise.restTime === 0 ? (
                                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                                            No rest
                                          </span>
                                        ) : (
                                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                                            {Math.floor((exercise.restTime || 90) / 60)}:{((exercise.restTime || 90) % 60).toString().padStart(2, '0')} rest
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <ChevronDown
                                      size={16}
                                      color={COLORS.textMuted}
                                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                    />
                                  </div>
                                </button>

                                {/* Expanded Options */}
                                {isExpanded && (
                                  <div className="px-2 pb-2 pt-1 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                                    {/* Reorder buttons */}
                                    <div className="flex gap-2 mb-2">
                                      <button
                                        onClick={() => moveExerciseInHome(originalIndex, 'up')}
                                        disabled={originalIndex === 0}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: COLORS.surfaceLight,
                                          color: originalIndex === 0 ? COLORS.textMuted : COLORS.text,
                                          opacity: originalIndex === 0 ? 0.5 : 1
                                        }}
                                      >
                                        <ChevronUp size={14} />
                                        Move Up
                                      </button>
                                      <button
                                        onClick={() => moveExerciseInHome(originalIndex, 'down')}
                                        disabled={originalIndex === allExercises.length - 1}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: COLORS.surfaceLight,
                                          color: originalIndex === allExercises.length - 1 ? COLORS.textMuted : COLORS.text,
                                          opacity: originalIndex === allExercises.length - 1 ? 0.5 : 1
                                        }}
                                      >
                                        <ChevronDown size={14} />
                                        Move Down
                                      </button>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => swapExercise(originalIndex)}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                        style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                                      >
                                        <ArrowLeftRight size={14} />
                                        Swap Exercise
                                      </button>
                                      <button
                                        onClick={() => removeExercise(originalIndex)}
                                        disabled={allExercises.length <= 2}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: allExercises.length <= 2 ? COLORS.surfaceLight : COLORS.error + '20',
                                          color: allExercises.length <= 2 ? COLORS.textMuted : COLORS.error,
                                          opacity: allExercises.length <= 2 ? 0.5 : 1
                                        }}
                                      >
                                        <X size={14} />
                                        Remove
                                      </button>
                                    </div>
                                    {allExercises.length <= 2 && (
                                      <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                                        Minimum 2 exercises required
                                      </p>
                                    )}
                                    <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                                      Removing adds sets to remaining exercises
                                    </p>
                                  </div>
                                )}
                                </div>
                              </div>
                            );
                          })}
                            </div>
                            {allExercises.length > exerciseCount && (
                              <p className="text-xs text-center mt-2" style={{ color: COLORS.textMuted }}>
                                +{allExercises.length - exerciseCount} more exercises with more time
                              </p>
                            )}

                            {/* Cool-down Preview */}
                            <div className="p-2 rounded-lg mt-2" style={{ backgroundColor: COLORS.info + '10', border: `1px solid ${COLORS.info}20` }}>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.info + '20', color: COLORS.info }}>C</span>
                                <span className="text-xs font-medium" style={{ color: COLORS.info }}>Cool-down</span>
                                <span className="text-xs ml-auto" style={{ color: COLORS.textMuted }}>2 min</span>
                              </div>
                            </div>
                          </>
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

            {/* Current Program - auto-selected based on goal */}
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>CURRENT PROGRAM</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                    Based on your goal
                  </span>
                </div>
                <h4 className="font-bold" style={{ color: COLORS.text }}>{currentProgram.name}</h4>
                <p className="text-xs" style={{ color: COLORS.textSecondary }}>{currentProgram.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ backgroundColor: programProgress.isComplete ? COLORS.success : COLORS.primary, width: `${programProgress.progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  {Math.round(programProgress.progressPercent)}%
                </span>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <p className="text-lg font-bold" style={{ color: COLORS.success }}>{programProgress.completedWorkouts}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Completed</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <p className="text-lg font-bold" style={{ color: COLORS.warning }}>{programProgress.workoutsRemaining}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Remaining</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <p className="text-lg font-bold" style={{ color: COLORS.primary }}>{programProgress.totalWorkouts}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Total</p>
                </div>
              </div>

              {/* Week Progress */}
              <div className="flex justify-between items-center text-sm mb-2">
                <span style={{ color: COLORS.textMuted }}>
                  Week {programProgress.currentWeek} of {programProgress.totalWeeks}
                </span>
                <span style={{ color: COLORS.textSecondary }}>
                  {programProgress.weeksRemaining} week{programProgress.weeksRemaining !== 1 ? 's' : ''} to go
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
                {upcomingWorkouts.map((item, i) => {
                  const workoutTime = Math.round(getWorkoutTimeBreakdown(item.workout.exercises).totalTime / 60);
                  return (
                    <button
                      key={i}
                      onClick={() => setShowWorkoutPreview(item.workout)}
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
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{item.date} • {item.workout.exercises.length} exercises • {workoutTime} min</p>
                        </div>
                      </div>
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Recent Activity</h3>
              {workoutHistory.length === 0 ? (
                <div className="p-6 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <Dumbbell size={24} color={COLORS.textMuted} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: COLORS.text }}>No workouts yet</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Complete your first workout to see your activity here</p>
                </div>
              ) : (
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
              )}
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

            {/* What's Next - Program Suggestions */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} color={COLORS.accent} />
                <h4 className="font-semibold" style={{ color: COLORS.text }}>What's Next?</h4>
              </div>

              {programProgress.isComplete ? (
                <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: COLORS.success + '15' }}>
                  <p className="text-sm font-semibold" style={{ color: COLORS.success }}>🎉 Program Complete!</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Choose your next challenge below</p>
                </div>
              ) : (
                <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                  After completing your current program, we recommend:
                </p>
              )}

              {/* Suggested Programs */}
              <div className="space-y-2 mb-4">
                {suggestedNextPrograms.map((program, idx) => (
                  <div
                    key={program.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: idx === 0 ? COLORS.primary + '10' : COLORS.surfaceLight, border: idx === 0 ? `1px solid ${COLORS.primary}30` : 'none' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{program.name}</p>
                          {idx === 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>Recommended</span>}
                        </div>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{program.days} days/week • {program.weeks} weeks</p>
                        <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{program.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Break Duration Options */}
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>TAKE A BREAK BETWEEN PROGRAMS</p>
                <div className="flex gap-2">
                  {BREAK_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedBreakDuration(option.id)}
                      className="flex-1 py-2 px-3 rounded-lg text-center"
                      style={{
                        backgroundColor: selectedBreakDuration === option.id ? COLORS.primary + '20' : COLORS.surfaceLight,
                        border: selectedBreakDuration === option.id ? `1px solid ${COLORS.primary}` : '1px solid transparent'
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: selectedBreakDuration === option.id ? COLORS.primary : COLORS.text }}>{option.label}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Up Suggestion */}
              <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: COLORS.accent + '10', border: `1px solid ${COLORS.accent}30` }}>
                <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                  🎯 After completing this program, you may be ready to level up your experience! If you feel comfortable, consider moving to the next tier.
                </p>
              </div>

              {/* Comeback Message */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                <p className="text-xs text-center" style={{ color: COLORS.textSecondary }}>
                  💪 Remember, you can come back anytime. Rest is part of the journey!
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'nutrition' && (
          <div className="p-4 h-full overflow-auto">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'meals', label: 'Meals' },
                { id: 'supplements', label: 'Supps' },
                { id: 'sleep', label: 'Sleep' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setNutritionTab(tab.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
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
                        width: supplements.length > 0 ? `${(supplements.filter(s => s.taken).length / supplements.length) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
                    {supplements.length === 0
                      ? 'Add supplements to start tracking'
                      : supplements.filter(s => s.taken).length === supplements.length
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

                {/* Suggested Supplements */}
                {SUGGESTED_SUPPLEMENTS.filter(suggestion =>
                  !dismissedSuggestions.includes(suggestion.id) &&
                  !supplements.some(s => s.name.toLowerCase().includes(suggestion.name.toLowerCase().split(' ')[0]))
                ).map(suggestion => (
                  <div key={suggestion.id} className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.primary + '15', border: `1px solid ${COLORS.primary}40` }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.primary + '30' }}>
                        <Zap size={20} color={COLORS.primary} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: COLORS.primary }}>Recommended for you</p>
                        <p className="font-semibold" style={{ color: COLORS.text }}>{suggestion.name}</p>
                        <p className="text-sm" style={{ color: COLORS.textMuted }}>{suggestion.dosage} daily</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {suggestion.reasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={14} color={COLORS.success} className="flex-shrink-0 mt-0.5" />
                          <p className="text-sm" style={{ color: COLORS.textSecondary }}>{reason}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDismissedSuggestions(prev => [...prev, suggestion.id])}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={async () => {
                          if (user?.id) {
                            const { data, error } = await nutritionService.addSupplement(user.id, { name: suggestion.name, dosage: suggestion.dosage });
                            if (!error && data) {
                              setSupplements(prev => [...prev, { id: data.id, name: data.name, dosage: data.dosage, taken: false, time: '' }]);
                            } else {
                              setSupplements(prev => [...prev, { id: Date.now().toString(), name: suggestion.name, dosage: suggestion.dosage, taken: false, time: '' }]);
                            }
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                      >
                        Add to My Supps
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Supplement */}
                {showAddSupplement ? (
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }} onMouseDown={e => e.stopPropagation()}>
                    <p className="font-semibold mb-3" style={{ color: COLORS.text }}>Add New Supplement</p>
                    <div className="space-y-3 mb-3">
                      <input
                        type="text"
                        placeholder="Supplement name"
                        ref={supplementNameRef}
                        autoFocus
                        onMouseDown={e => e.stopPropagation()}
                        className="w-full p-3 rounded-xl text-sm"
                        style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none', outline: 'none' }}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          ref={supplementDosageRef}
                          onMouseDown={e => e.stopPropagation()}
                          className="flex-1 p-3 rounded-xl text-sm"
                          style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none', outline: 'none' }}
                        />
                        <select
                          ref={supplementUnitRef}
                          defaultValue="mg"
                          onMouseDown={e => e.stopPropagation()}
                          className="p-3 rounded-xl text-sm"
                          style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none', outline: 'none' }}
                        >
                          {SUPPLEMENT_UNITS.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAddSupplement(false);
                          if (supplementNameRef.current) supplementNameRef.current.value = '';
                          if (supplementDosageRef.current) supplementDosageRef.current.value = '';
                          if (supplementUnitRef.current) supplementUnitRef.current.value = 'mg';
                        }}
                        className="flex-1 py-3 rounded-xl font-semibold"
                        style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.textMuted }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          const name = supplementNameRef.current?.value?.trim();
                          const amount = supplementDosageRef.current?.value?.trim();
                          const unit = supplementUnitRef.current?.value || 'mg';
                          const dosage = amount ? `${amount} ${unit}` : 'As needed';
                          if (name && user?.id) {
                            const { data, error } = await nutritionService.addSupplement(user.id, { name, dosage });
                            if (!error && data) {
                              setSupplements(prev => [...prev, { id: data.id, name: data.name, dosage: data.dosage, taken: false, time: '' }]);
                            } else {
                              setSupplements(prev => [...prev, { id: Date.now().toString(), name, dosage, taken: false, time: '' }]);
                            }
                            setShowAddSupplement(false);
                            if (supplementNameRef.current) supplementNameRef.current.value = '';
                            if (supplementDosageRef.current) supplementDosageRef.current.value = '';
                            if (supplementUnitRef.current) supplementUnitRef.current.value = 'mg';
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

            {/* SLEEP TAB */}
            {nutritionTab === 'sleep' && (
              <>
                {/* Last Night's Sleep */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold" style={{ color: COLORS.text }}>Last Night</h4>
                    <div className="flex items-center gap-1">
                      <Moon size={16} color={COLORS.sleep} />
                      <span className="font-bold" style={{ color: COLORS.sleep }}>
                        {(() => {
                          const [bedH, bedM] = lastNightBedTime.split(':').map(Number);
                          const [wakeH, wakeM] = lastNightWakeTime.split(':').map(Number);
                          let hours = wakeH - bedH + (wakeM - bedM) / 60;
                          if (hours < 0) hours += 24;
                          return hours.toFixed(1);
                        })()} hrs
                      </span>
                    </div>
                  </div>

                  {!lastNightConfirmed ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Bed Time</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            defaultValue={lastNightBedTime.split(':')[0]}
                            onBlur={(e) => {
                              const h = e.target.value.padStart(2, '0');
                              setLastNightBedTime(prev => `${h}:${prev.split(':')[1]}`);
                            }}
                            className="w-16 p-3 rounded-xl text-center text-lg font-bold"
                            style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                          />
                          <span style={{ color: COLORS.textMuted, fontSize: 20 }}>:</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            step="5"
                            defaultValue={lastNightBedTime.split(':')[1]}
                            onBlur={(e) => {
                              const m = e.target.value.padStart(2, '0');
                              setLastNightBedTime(prev => `${prev.split(':')[0]}:${m}`);
                            }}
                            className="w-16 p-3 rounded-xl text-center text-lg font-bold"
                            style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>Wake Time</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            defaultValue={lastNightWakeTime.split(':')[0]}
                            onBlur={(e) => {
                              const h = e.target.value.padStart(2, '0');
                              setLastNightWakeTime(prev => `${h}:${prev.split(':')[1]}`);
                            }}
                            className="w-16 p-3 rounded-xl text-center text-lg font-bold"
                            style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                          />
                          <span style={{ color: COLORS.textMuted, fontSize: 20 }}>:</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            step="5"
                            defaultValue={lastNightWakeTime.split(':')[1]}
                            onBlur={(e) => {
                              const m = e.target.value.padStart(2, '0');
                              setLastNightWakeTime(prev => `${prev.split(':')[0]}:${m}`);
                            }}
                            className="w-16 p-3 rounded-xl text-center text-lg font-bold"
                            style={{ backgroundColor: COLORS.surfaceLight, color: COLORS.text, border: 'none' }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const [bedH, bedM] = lastNightBedTime.split(':').map(Number);
                          const [wakeH, wakeM] = lastNightWakeTime.split(':').map(Number);
                          let hours = wakeH - bedH + (wakeM - bedM) / 60;
                          if (hours < 0) hours += 24;
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          const yesterdayStr = yesterday.toISOString().split('T')[0];
                          await sleepService.logSleep(user.id, yesterdayStr, hours, 3, lastNightBedTime, lastNightWakeTime);
                          setLastNightConfirmed(true);
                        }}
                        className="w-full py-3 rounded-xl font-semibold"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.text }}
                      >
                        Log Sleep
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Check size={32} color={COLORS.success} className="mx-auto mb-2" />
                      <p className="font-semibold" style={{ color: COLORS.text }}>Sleep Logged!</p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>{lastNightBedTime} → {lastNightWakeTime}</p>
                    </div>
                  )}
                </div>

                {/* Sleep Goal */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold" style={{ color: COLORS.text }}>Sleep Goal</h4>
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>{sleepHours} hrs / night</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSleepHours(prev => Math.max(5, prev - 0.5))}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.surfaceLight }}
                    >
                      <Minus size={18} color={COLORS.text} />
                    </button>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: COLORS.sleep, width: `${((sleepHours - 5) / 5) * 100}%` }}
                      />
                    </div>
                    <button
                      onClick={() => setSleepHours(prev => Math.min(10, prev + 0.5))}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.surfaceLight }}
                    >
                      <Plus size={18} color={COLORS.text} />
                    </button>
                  </div>
                </div>

                {/* Sleep Streak */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold" style={{ color: COLORS.text }}>Sleep Streak</h4>
                    <div className="flex items-center gap-1">
                      <Flame size={16} color={COLORS.warning} />
                      <span className="font-bold" style={{ color: COLORS.warning }}>{streaks.sleep.daysInRow} days</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    Hit your sleep goal {streaks.sleep.daysInRow} nights in a row!
                  </p>
                </div>

                {/* Weekly Chart */}
                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>This Week</h4>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sleepChartData.slice(-7)}>
                        <XAxis
                          dataKey="day"
                          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={25}
                          domain={[0, 12]}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke={COLORS.sleep}
                          strokeWidth={2}
                          dot={{ fill: COLORS.sleep, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sleep Tips */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceLight }}>
                  <div className="flex items-start gap-3">
                    <Info size={18} color={COLORS.sleep} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>Sleep Tip</p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        Maintain a consistent sleep schedule, even on weekends. This helps regulate your body's internal clock.
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
                          <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>{streaks.weeklyWorkouts.weeksCompleted} week streak</span>
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
                      <p className="font-bold" style={{ color: COLORS.text }}>{overviewStats.totalWorkouts}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>workouts</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <p className="font-bold" style={{ color: COLORS.text }}>{personalRecords.length}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>PRs</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surfaceLight }}>
                      <p className="font-bold" style={{ color: COLORS.text }}>{streaks.weeklyWorkouts.weeksCompleted}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>week streak</p>
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
                    <p className="font-bold" style={{ color: COLORS.text }}>{userData.firstName ? `${userData.firstName}'s` : 'My'} Fitness Journey</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {streaks.weeklyWorkouts.weeksCompleted} week streak • {overviewStats.totalWorkouts} workouts
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-bold" style={{ color: COLORS.warning }}>🔥 {streaks.weeklyWorkouts.weeksCompleted}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>week streak</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-bold" style={{ color: COLORS.primary }}>{overviewStats.totalWorkouts}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>workouts</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                    <p className="font-bold" style={{ color: COLORS.success }}>{personalRecords.length}</p>
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

        {/* Exercise Info Modal */}
        {showExerciseInfo && (
          <ExerciseInfoModal
            COLORS={COLORS}
            exerciseName={showExerciseInfo}
            onClose={() => setShowExerciseInfo(null)}
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
              <button onClick={() => { setShowAddFriendModal(false); setFriendSearchQuery(''); setSearchResults([]); setHasSearched(false); }}>
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
                  autoComplete="off"
                  autoFocus
                  onChange={(e) => {
                    const query = e.target.value;

                    // Clear previous timeout
                    if (friendSearchTimeoutRef.current) {
                      clearTimeout(friendSearchTimeoutRef.current);
                    }

                    if (query.length < 2) {
                      // Only clear results if we had some before
                      if (searchResults.length > 0 || searchLoading || hasSearched) {
                        setSearchResults([]);
                        setSearchLoading(false);
                        setHasSearched(false);
                      }
                      return;
                    }

                    // Debounce the search - only set loading after a small delay
                    friendSearchTimeoutRef.current = setTimeout(async () => {
                      setSearchLoading(true);
                      try {
                        const { data } = await profileService.searchUsers(query, user?.id);
                        setSearchResults(data || []);
                        setHasSearched(true);
                      } catch (err) {
                        console.error('Search error:', err);
                        setSearchResults([]);
                        setHasSearched(true);
                      } finally {
                        setSearchLoading(false);
                      }
                    }, 400);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: 'none' }}
                />
                {searchLoading && (
                  <Loader2 size={18} color={COLORS.textMuted} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {(searchResults.length > 0 || searchLoading || hasSearched) && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>
                    {searchLoading ? 'Searching...' : searchResults.length > 0 ? `Found ${searchResults.length} users` : 'No users found'}
                  </h4>
                  {hasSearched && searchResults.length === 0 && !searchLoading && (
                    <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.surface }}>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>
                        No users match your search. Try a different name or username.
                      </p>
                    </div>
                  )}
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
              {!searchLoading && searchResults.length === 0 && (
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
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Contact sync is not available in web version
                      alert('Contact sync is available in the mobile app');
                    }}
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

            {/* Program Progress */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.surface }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Dumbbell size={18} color={COLORS.primary} />
                  <h4 className="font-semibold" style={{ color: COLORS.text }}>Program Progress</h4>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: programProgress.isComplete ? COLORS.success + '20' : COLORS.primary + '20', color: programProgress.isComplete ? COLORS.success : COLORS.primary }}>
                  {programProgress.isComplete ? 'Complete!' : `${Math.round(programProgress.progressPercent)}%`}
                </span>
              </div>

              <div className="mb-3">
                <p className="font-medium mb-1" style={{ color: COLORS.text }}>{currentProgram.name}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: COLORS.surfaceLight }}>
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: programProgress.isComplete ? COLORS.success : COLORS.primary, width: `${programProgress.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: COLORS.success }}>{programProgress.completedWorkouts}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Done</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: COLORS.warning }}>{programProgress.workoutsRemaining}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Left</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
                    {programProgress.currentWeek}/{programProgress.totalWeeks}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Week</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: COLORS.accent }}>{programProgress.weeksRemaining}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Wks left</p>
                </div>
              </div>

              {programProgress.isComplete && (
                <div className="mt-3 p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '10' }}>
                  <p className="text-xs text-center" style={{ color: COLORS.success }}>
                    🎉 Congratulations! Check the Workouts tab to choose your next program.
                  </p>
                </div>
              )}
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
                {chartData.weight.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.weight.map(d => ({ date: `Week ${d.week}`, weight: d.value, expected: d.expected }))}>
                      <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: COLORS.surface, border: 'none', borderRadius: 8 }}
                        labelStyle={{ color: COLORS.text }}
                        formatter={(value, name) => [value ? value + 'kg' : 'No data', name === 'weight' ? 'Actual' : 'Target']}
                      />
                      <Line type="monotone" dataKey="expected" stroke={COLORS.textMuted} strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="weight" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Scale size={32} color={COLORS.textMuted} className="mx-auto mb-2" />
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>No weigh-in data yet</p>
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Log your first weigh-in to start tracking</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.primary }} />
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>Actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.textMuted, borderStyle: 'dashed' }} />
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>Target</span>
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
                          {EXPERIENCE_LEVELS[userData.experience]?.label || 'Unknown'}
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

              {/* Experience Level */}
              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: COLORS.accent + '20' }}>
                      {EXPERIENCE_LEVELS[userData.experience]?.icon || '🏋️'}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.text }}>
                        {EXPERIENCE_LEVELS[userData.experience]?.label || 'Not Set'}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {EXPERIENCE_LEVELS[userData.experience]?.desc || 'Set your experience level'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.accent + '15', color: COLORS.accent }}>
                    Gym Level
                  </span>
                </div>
              </div>

              {/* Current Program - auto-selected based on goal */}
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
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                    Auto
                  </span>
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

              {/* Rate Us */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Enjoying UpRep?</h3>
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.primary + '10', border: `1px solid ${COLORS.primary}30` }}>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">⭐</div>
                    <div className="flex-1">
                      <p className="font-semibold mb-1" style={{ color: COLORS.text }}>Rate us on the App Store</p>
                      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                        Your feedback helps us improve and reach more fitness enthusiasts!
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open('https://apps.apple.com', '_blank')}
                          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                        >
                          <span>🍎</span> App Store
                        </button>
                        <button
                          onClick={() => window.open('https://play.google.com', '_blank')}
                          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
                        >
                          <span>🤖</span> Google Play
                        </button>
                      </div>
                    </div>
                  </div>
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
        // Support both workout object directly or legacy ID lookup
        const workout = typeof showWorkoutPreview === 'object'
          ? showWorkoutPreview
          : Object.values(WORKOUT_TEMPLATES).find(w => w.id === showWorkoutPreview);
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
              
              {/* Warm-up Section */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}>W</span>
                  Warm-up (3 min)
                </h3>
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.warning + '10', border: `1px solid ${COLORS.warning}30` }}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>Light cardio (jumping jacks, jogging in place)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>Dynamic stretches for target muscle groups</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>1-2 light warm-up sets of first exercise</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercises Section */}
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>Exercises ({workout.exercises.length})</h3>
              <div className="space-y-3 mb-4">
                {workout.exercises.map((exercise, i) => {
                  const isSuperset = exercise.supersetId;
                  const isFirstInSuperset = isSuperset && exercise.supersetOrder === 1;
                  const isSecondInSuperset = isSuperset && exercise.supersetOrder === 2;

                  return (
                    <div key={exercise.id}>
                      {/* Superset header - show before first exercise in superset */}
                      {isFirstInSuperset && (
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Zap size={14} color={COLORS.warning} />
                          <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>SUPERSET</span>
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>— No rest between these exercises</span>
                        </div>
                      )}
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: exercise.isCardio ? COLORS.primary + '10' : COLORS.surface,
                          ...(isSuperset && {
                            borderLeft: `3px solid ${COLORS.warning}`,
                            marginLeft: isFirstInSuperset ? 0 : 0,
                            borderRadius: isFirstInSuperset ? '12px 12px 0 0' : isSecondInSuperset ? '0 0 12px 12px' : '12px',
                            marginTop: isSecondInSuperset ? '-1px' : 0
                          })
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: exercise.isCardio ? COLORS.primary + '20' : getWorkoutColor(workout.name, COLORS) + '20' }}>
                            <span className="font-bold text-sm" style={{ color: exercise.isCardio ? COLORS.primary : getWorkoutColor(workout.name, COLORS) }}>{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.name}</p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>
                              {exercise.isCardio ? exercise.description : exercise.muscleGroup}
                              {isSuperset && <span style={{ color: COLORS.warning }}> — Paired with {exercise.supersetWith}</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            {exercise.isCardio ? (
                              <>
                                <p className="font-semibold" style={{ color: COLORS.primary }}>{exercise.duration} min</p>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>~{exercise.caloriesBurned} cal</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold" style={{ color: COLORS.text }}>{exercise.sets} × {exercise.targetReps}</p>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.suggestedWeight > 0 ? `${exercise.suggestedWeight}kg` : 'Bodyweight'}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cool-down Section */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.text }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: COLORS.info + '20', color: COLORS.info }}>C</span>
                  Cool-down (2 min)
                </h3>
                <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.info + '10', border: `1px solid ${COLORS.info}30` }}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>Light walking or slow movements</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>Static stretches for worked muscles</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                      <p className="text-sm" style={{ color: COLORS.text }}>Deep breathing to lower heart rate</p>
                    </div>
                  </div>
                </div>
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

                  // Get short name from workout type
                  const getShortNameFromType = (type) => {
                    if (!type) return null;
                    const typeMap = {
                      push: 'Push', pull: 'Pull', legs_quad: 'Legs', legs_posterior: 'Legs',
                      upper: 'Upper', lower: 'Lower', full_body: 'Full', arms: 'Arms'
                    };
                    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
                  };

                  const shortName = isBeforeProgram ? null : getShortNameFromType(entry?.workoutType);
                  const isMissed = isPast && entry?.workoutType && !entry?.completed && !isBeforeProgram;
                  // Get full workout for editing modal
                  const workout = entry?.workoutType ? getWorkoutForDate(dateKey) : null;

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
                            workout: workout,
                            workoutType: entry?.workoutType || null,
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
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: getWorkoutColor(editingScheduleDay.workout.name, COLORS) + '20' }}
                      >
                        <Dumbbell size={24} color={getWorkoutColor(editingScheduleDay.workout.name, COLORS)} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{editingScheduleDay.workout.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{editingScheduleDay.workout.focus} • {editingScheduleDay.workout.exercises?.length || 0} exercises</p>
                      </div>
                    </div>
                    {/* Exercise List */}
                    {editingScheduleDay.workout.exercises && editingScheduleDay.workout.exercises.length > 0 && (
                      <div className="space-y-2 pt-3 border-t" style={{ borderColor: COLORS.surfaceLight }}>
                        {editingScheduleDay.workout.exercises.slice(0, 6).map((exercise, idx) => (
                          <div key={exercise.id || idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: getWorkoutColor(editingScheduleDay.workout.name, COLORS) + '20', color: getWorkoutColor(editingScheduleDay.workout.name, COLORS) }}>{idx + 1}</span>
                              <div>
                                <p className="text-sm" style={{ color: COLORS.text }}>{exercise.name}</p>
                                <p className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.muscleGroup}</p>
                              </div>
                            </div>
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>{exercise.sets}×{exercise.targetReps}</span>
                          </div>
                        ))}
                        {editingScheduleDay.workout.exercises.length > 6 && (
                          <p className="text-xs text-center pt-2" style={{ color: COLORS.textMuted }}>
                            +{editingScheduleDay.workout.exercises.length - 6} more exercises
                          </p>
                        )}
                      </div>
                    )}
                  </>
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

            {/* Quick Actions - only for future/today with workout */}
            {!isPastDate && editingScheduleDay.workout && (
              <div className="mb-6">
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>QUICK ACTIONS</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowWorkoutPreview(editingScheduleDay.workout);
                      setEditingScheduleDay(null);
                    }}
                    className="p-3 rounded-xl flex items-center gap-2"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <Eye size={16} color={COLORS.primary} />
                    <span className="text-sm" style={{ color: COLORS.text }}>Preview</span>
                  </button>
                  <button
                    onClick={() => {
                      setWorkoutForDay(editingScheduleDay.dateKey, null);
                      setEditingScheduleDay({ ...editingScheduleDay, workout: null, workoutType: null });
                    }}
                    className="p-3 rounded-xl flex items-center gap-2"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <X size={16} color={COLORS.error} />
                    <span className="text-sm" style={{ color: COLORS.text }}>Skip Day</span>
                  </button>
                </div>
              </div>
            )}

            {/* Change Workout - only for future/today */}
            {!isPastDate && (
              <div className="mb-6">
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.textMuted }}>CHANGE TO</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setWorkoutForDay(editingScheduleDay.dateKey, null);
                      setEditingScheduleDay({ ...editingScheduleDay, workout: null, workoutType: null });
                    }}
                    className="w-full p-3 rounded-xl flex items-center gap-3"
                    style={{
                      backgroundColor: !editingScheduleDay.workoutType ? COLORS.primary + '20' : COLORS.surface,
                      border: !editingScheduleDay.workoutType ? `2px solid ${COLORS.primary}` : '2px solid transparent'
                    }}
                  >
                    <Moon size={18} color={COLORS.textMuted} />
                    <span style={{ color: COLORS.text }}>Rest Day</span>
                  </button>
                  {Object.entries(WORKOUT_STRUCTURES).map(([typeId, structure]) => (
                    <button
                      key={typeId}
                      onClick={() => {
                        setWorkoutForDay(editingScheduleDay.dateKey, typeId);
                        const newWorkout = generateDynamicWorkout(typeId, userGoal, recentlyUsedExercises, userData.experience);
                        setEditingScheduleDay({ ...editingScheduleDay, workout: newWorkout, workoutType: typeId });
                      }}
                      className="w-full p-3 rounded-xl flex items-center gap-3"
                      style={{
                        backgroundColor: editingScheduleDay.workoutType === typeId ? COLORS.primary + '20' : COLORS.surface,
                        border: editingScheduleDay.workoutType === typeId ? `2px solid ${COLORS.primary}` : '2px solid transparent'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getWorkoutColor(structure.name, COLORS) + '20' }}
                      >
                        <Dumbbell size={14} color={getWorkoutColor(structure.name, COLORS)} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{structure.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{structure.focus}</p>
                      </div>
                      {editingScheduleDay.workoutType === typeId && (
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
                        {entry?.workoutType ? (
                          <p className="text-xs mt-1" style={{ color: getWorkoutColor(WORKOUT_STRUCTURES[entry.workoutType]?.name || 'Workout', COLORS) }}>
                            {WORKOUT_STRUCTURES[entry.workoutType]?.name?.split(' ')[0] || entry.workoutType}
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
                <div className="h-32 flex flex-col items-center justify-center">
                  <TrendingUp size={32} color={COLORS.textMuted} style={{ opacity: 0.5 }} />
                  <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>No progress data yet</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Complete workouts to track your progress</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4 mb-3" style={{ color: COLORS.text }}>Recent Sessions</h4>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
                <div className="flex flex-col items-center justify-center py-4">
                  <Dumbbell size={32} color={COLORS.textMuted} style={{ opacity: 0.5 }} />
                  <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>No sessions recorded</p>
                  <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>Your workout history for this exercise will appear here</p>
                </div>
              </div>

              <h4 className="font-semibold mt-4 mb-3" style={{ color: COLORS.text }}>Tips</h4>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.primary + '10', border: `1px solid ${COLORS.primary}20` }}>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: COLORS.primary }} />
                    <p className="text-sm" style={{ color: COLORS.text }}>Start with a weight you can control for all reps</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: COLORS.primary }} />
                    <p className="text-sm" style={{ color: COLORS.text }}>Focus on form before increasing weight</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: COLORS.primary }} />
                    <p className="text-sm" style={{ color: COLORS.text }}>Log your sets to track progressive overload</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Active Workout Screen - rendered at MainScreen level for access from all tabs */}
      {showActiveWorkout && (() => {
        // Get exercises filtered for injuries plus recovery exercises
        const filteredExercises = getCurrentExercises();
        const recoveryExercises = getInjuryRecoveryExercisesToAdd();
        const allExercises = [...filteredExercises, ...recoveryExercises];
        const template = { ...todayWorkoutTemplate, exercises: allExercises };
        return (
          <ActiveWorkoutScreen
            onClose={() => setShowActiveWorkout(false)}
            onComplete={completeTodayWorkout}
            COLORS={COLORS}
            availableTime={workoutTime}
            userGoal={userData.goal || 'build_muscle'}
            userExperience={userData.experience || 'beginner'}
            userId={user?.id}
            workoutName={todayWorkout?.name || 'Workout'}
            workoutTemplate={template}
            injuries={injuries}
          />
        );
      })()}

      {/* Reschedule Modal - rendered at MainScreen level for access from all tabs */}
      {showReschedule && <RescheduleModal />}
      
      {/* Pause Plan Modal - rendered at MainScreen level for access from all tabs */}
      {showPausePlan && <PausePlanModal />}

      {/* Report Injury Modal */}
      {showReportInjury && <ReportInjuryModal />}

      {/* Injury Recovery Screen */}
      {showInjuryRecovery && <InjuryRecoveryScreen injury={showInjuryRecovery} />}

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

      {/* Schedule Settings Modal */}
      {showScheduleSettings && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: COLORS.background }}>
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: COLORS.surfaceLight }}>
            <button
              onClick={() => setShowScheduleSettings(false)}
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.surface }}
            >
              <ChevronLeft size={24} color={COLORS.text} />
            </button>
            <h2 className="text-xl font-bold" style={{ color: COLORS.text }}>Schedule Settings</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Rest Days - Free Toggle */}
            <div>
              <h4 className="font-semibold mb-2" style={{ color: COLORS.text }}>Select Your Rest Days</h4>
              <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                Tap days to toggle between training and rest
              </p>
              <div className="flex gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const isRestDay = (userData.restDays || [5, 6]).includes(i);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setUserData(prev => {
                          const currentRestDays = prev.restDays || [5, 6];
                          const newRestDays = isRestDay
                            ? currentRestDays.filter(d => d !== i)
                            : [...currentRestDays, i].sort((a, b) => a - b);
                          const newDaysPerWeek = 7 - newRestDays.length;
                          return { ...prev, restDays: newRestDays, daysPerWeek: newDaysPerWeek };
                        });
                      }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium flex flex-col items-center gap-1"
                      style={{
                        backgroundColor: isRestDay ? COLORS.surfaceLight : COLORS.primary,
                        color: isRestDay ? COLORS.textMuted : '#fff'
                      }}
                    >
                      <span>{day}</span>
                      <span style={{ fontSize: 10 }}>{isRestDay ? 'Rest' : 'Train'}</span>
                    </button>
                  );
                })}
              </div>

              {/* Training Days Summary */}
              {(() => {
                const trainingDays = 7 - (userData.restDays || [5, 6]).length;
                const isTooFew = trainingDays < 3;
                const isTooMany = trainingDays > 6;
                const isOptimal = trainingDays >= 3 && trainingDays <= 6;

                return (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: COLORS.textMuted }}>Training days per week:</span>
                      <span className="font-bold text-lg" style={{ color: isOptimal ? COLORS.primary : COLORS.warning }}>
                        {trainingDays}
                      </span>
                    </div>

                    {/* Warning Messages */}
                    {isTooFew && (
                      <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: COLORS.warning + '20' }}>
                        <AlertCircle size={18} color={COLORS.warning} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: COLORS.warning }}>Too few training days</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            We recommend at least 3 training days per week for optimal progress.
                          </p>
                        </div>
                      </div>
                    )}
                    {isTooMany && (
                      <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: COLORS.warning + '20' }}>
                        <AlertCircle size={18} color={COLORS.warning} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: COLORS.warning }}>No rest days selected</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            Rest is essential for recovery. We recommend at least 1 rest day per week.
                          </p>
                        </div>
                      </div>
                    )}
                    {isOptimal && (
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>
                        {trainingDays === 3 && 'Full body workouts, great for beginners'}
                        {trainingDays === 4 && 'Upper/Lower split, balanced approach'}
                        {trainingDays === 5 && 'Push/Pull/Legs + extras, intermediate level'}
                        {trainingDays === 6 && 'Push/Pull/Legs x2, advanced training'}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Weekly Preview */}
            <div>
              <h4 className="font-semibold mb-3" style={{ color: COLORS.text }}>Weekly Preview</h4>
              <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: COLORS.surface }}>
                {(() => {
                  const restDays = userData.restDays || [5, 6];
                  const trainingDays = 7 - restDays.length;
                  const previewRotation = getWorkoutRotation(trainingDays);
                  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  let workoutIndex = 0;

                  return days.map((day, i) => {
                    const isRest = restDays.includes(i);
                    const workout = isRest ? null : previewRotation[workoutIndex % previewRotation.length];
                    if (!isRest) workoutIndex++;

                    return (
                      <div key={day} className="flex justify-between items-center py-2">
                        <span style={{ color: COLORS.text }}>{day}</span>
                        <span
                          className="text-sm px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: isRest ? COLORS.surfaceLight : COLORS.primary + '20',
                            color: isRest ? COLORS.textMuted : COLORS.primary
                          }}
                        >
                          {isRest ? 'Rest' : workout?.name || 'Workout'}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="p-4" style={{ backgroundColor: COLORS.surface }}>
            <button
              onClick={() => {
                const restDays = userData.restDays || [5, 6];
                const trainingDays = 7 - restDays.length;
                regenerateSchedule(restDays, trainingDays);
                setShowScheduleSettings(false);
              }}
              className="w-full py-4 rounded-xl font-semibold"
              style={{ backgroundColor: COLORS.primary, color: '#fff' }}
            >
              Apply & Regenerate Schedule
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-around py-2 border-t" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.surfaceLight }}>
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
          { id: 'friends', icon: Users, label: 'Friends' },
          { id: 'nutrition', icon: Heart, label: 'Health' },
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
