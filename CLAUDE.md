# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UpRep is a fitness tracking React application built as a single-file JSX component (`uprep-v5.jsx`). It's a mobile-first workout and nutrition tracking app with features for workout scheduling, nutrition logging, progress tracking, and social features.

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server (http://localhost:5173)
npm run build  # Build for production
npm run preview # Preview production build
```

## Tech Stack

- **Vite** for build tooling
- **React 18** with hooks (useState, useRef, useEffect)
- **Recharts** for data visualization (LineChart, ResponsiveContainer)
- **Lucide React** for icons
- **Tailwind CSS** for styling (inline utility classes)

## Architecture

The entire application lives in `uprep-v5.jsx` (~9000 lines). Key structural elements:

### Constants (top of file)
- `COLORS` - Theme color palette
- `GOAL_INFO` - Fitness goal configurations (build_muscle, lose_fat, strength, fitness)
- `ALL_EXERCISES` - Complete exercise database with muscle groups and equipment
- `WORKOUT_TEMPLATES` - Pre-defined workout routines (push_a, pull_a, legs_a, etc.)
- `RPE_SCALE` - Rate of Perceived Exertion scale (1-10)

### Standalone Components (defined outside main component)
- `WeightGoalStep` - Onboarding weight goal input
- `ProfileSetupStep` - Onboarding profile setup
- `EditProfileModal` - Profile editing modal
- `MealEntryModal`, `WaterEntryModal`, `WeighInModal`, `FullMealEntryModal` - Nutrition input modals
- `LoginScreen`, `RegisterScreen`, `ActiveWorkoutScreen` - Full-screen components

### Main App Component: `UpRepDemo`
Contains nested screen/tab components:
- `WelcomeScreen` - Landing page
- `DashboardScreen` - Deprecated dashboard view
- `OnboardingScreen` - Multi-step user setup flow
- `MainScreen` - Primary app container with tab navigation
- `HomeTab` - Daily overview with workout, nutrition, sleep tracking
- Workout tab, Nutrition tab, Friends tab, Progress tab, Profile tab

### Navigation Pattern
- `currentScreen` state controls top-level screens: 'welcome', 'login', 'register', 'dashboard', 'onboarding', 'main'
- `activeTab` state controls bottom navigation: 'home', 'workouts', 'nutrition', 'friends', 'progress', 'profile'
- Various `show*` boolean states control modals (e.g., `showActiveWorkout`, `showReschedule`, `showPausePlan`)

### State Management
All state is managed via React useState within `UpRepDemo`. Major state categories:
- User data (`userData` object with profile, goals, weights)
- Workout state (today's workout, schedule, pause/reschedule status)
- Nutrition tracking (calories, protein, carbs, fats, water, meal log)
- UI state (active modals, selected tabs, expanded sections)

## Development Notes

- This is a prototype/demo app - no backend or persistence
- All data is hardcoded or generated in-memory
- The file is large; search for component names or constants when navigating
- Components use inline styles referencing the `COLORS` constant
- Input components use refs and `onBlur` handlers to prevent focus loss during re-renders
