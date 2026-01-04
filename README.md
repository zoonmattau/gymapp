# UpRep - Personal Fitness Journey App

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/Lucide-Icons-F56565" alt="Lucide Icons">
  <img src="https://img.shields.io/badge/Status-Demo-yellow" alt="Status">
</p>

## Overview

**UpRep** is a comprehensive fitness tracking application designed to help users build muscle, lose fat, gain strength, or improve general fitness. The app provides personalized workout plans, nutrition tracking, progress monitoring, and intelligent schedule management.

This repository contains a fully functional React demo showcasing the app's core user experience and interface design.

---

## ✨ Features

### 🔐 Authentication Flow
- **Welcome Screen** - App introduction with branding
- **Login** - Email/password authentication
- **Registration** - Full signup with profile creation

### 🎯 Personalized Onboarding
- **Goal Selection** - Choose from 4 fitness goals:
  - 💪 Build Muscle & Size
  - 🔥 Lose Fat & Get Lean
  - 🏋️ Get Stronger
  - ❤️ General Fitness & Health
- **Interactive Info Panels** - Tap the ⓘ icon to learn what each goal requires
- **Experience Level** - Beginner, Intermediate, or Advanced

### 🏠 Home Dashboard
- Personalized greeting
- Today's workout card with quick actions
- Streak tracking (workouts, calories, protein, water)
- Daily progress bars for nutrition goals

### 📅 Smart Rescheduling
Flexible workout rescheduling with 6 options:
| Option | Description |
|--------|-------------|
| 📅 Move to Tomorrow | Shift entire schedule by 1 day |
| 📆 Move 2 Days | Shift schedule by 2 days |
| 🗓️ Move 3 Days | Shift schedule by 3 days |
| 🔄 Swap with Tomorrow | Exchange today's workout with tomorrow's |
| ⚡ Move & Compress | Shift by 1 day, remove a rest day |
| ⏭️ Skip Workout | Remove from schedule, continue as planned |

- Visual schedule preview showing affected days
- Color-coded workout types (Push/Pull/Leg/Rest)

### 🏖️ Take a Break (Pause Plan)
- Interactive calendar for selecting return date
- Today highlighted in red, return date in green
- Supportive messaging about rest being part of progress
- Explains what happens when you return:
  - Schedule automatically recalculated
  - Weights and reps adjusted based on break length
  - Streaks preserved
  - Gradual ramp-up for safe return

### 💪 Active Workout Tracking
- Exercise list with expandable details
- Set-by-set logging (weight, reps)
- Completion checkmarks
- Real-time progress tracking

### 📊 Additional Features
- Nutrition tracking (calories, protein, water)
- Streak system with visual indicators
- Bottom navigation (Home, Workouts, Nutrition, Progress, Profile)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Tailwind CSS | Styling (utility classes) |
| Lucide React | Icon library |
| JavaScript ES6+ | Logic & State Management |

---

## 📁 File Structure

```
uprep-demo/
├── uprep-demo-v4.jsx    # Main application component
├── README.md            # This file
```

### Component Architecture

```
UpRepDemo (Main)
├── LoginScreen          # Separate component (has own state)
├── RegisterScreen       # Separate component (has own state)
├── ActiveWorkoutScreen  # Separate component (has own state)
│
└── Internal Components (arrow functions)
    ├── WelcomeScreen
    ├── DashboardScreen
    ├── GoalInfoModal
    ├── OnboardingScreen
    ├── RescheduleModal
    ├── PausePlanModal
    ├── HomeTab
    └── MainScreen
```

> **Note:** Components with their own `useState` hooks are defined as separate function components outside the main component to comply with React's Rules of Hooks.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Running the Demo

This component is designed to run in a React environment with Tailwind CSS configured.

**Option 1: Claude.ai Artifacts**
Simply paste the JSX file into Claude.ai's artifact viewer for instant preview.

**Option 2: Local Development**
```bash
# Create a new React project
npx create-react-app uprep-demo
cd uprep-demo

# Install dependencies
npm install lucide-react

# Replace src/App.js with the uprep-demo-v4.jsx content
# Start development server
npm start
```

**Option 3: Vite**
```bash
npm create vite@latest uprep-demo -- --template react
cd uprep-demo
npm install lucide-react
# Copy component and run
npm run dev
```

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#FF4D4D` | CTAs, highlights, Push Day |
| Accent | `#00D9FF` | Secondary actions, Pull Day |
| Warning | `#FFB300` | Alerts, Leg Day |
| Success | `#00E676` | Completion, Return date |
| Error | `#FF5252` | Errors, Skip actions |
| Background | `#0F0F1A` | App background |
| Surface | `#1A1A2E` | Cards, modals |
| Surface Light | `#252540` | Elevated surfaces |

### Typography
- Headers: Bold, white (`#FFFFFF`)
- Body: Regular, secondary (`#B0B0C0`)
- Muted: Regular, muted (`#6B6B80`)

---

## 📱 Screen Flow

```
Welcome
    ├── Login → Dashboard → Home (returning user)
    │
    └── Register → Onboarding
                      ├── Goal Selection (with info panels)
                      └── Experience Level → Main App

Main App (Tab Navigation)
    ├── Home
    │     ├── Reschedule Modal
    │     ├── Pause Plan Modal (Calendar)
    │     └── Active Workout Screen
    ├── Workouts
    ├── Nutrition
    ├── Progress
    └── Profile
```

---

## 🔮 Future Enhancements

- [ ] Backend integration (API)
- [ ] User authentication (Firebase/Auth0)
- [ ] Real workout database
- [ ] Progress charts and analytics
- [ ] Social features (friends, challenges)
- [ ] Apple Health / Google Fit integration
- [ ] Push notifications
- [ ] Offline support (PWA)
- [ ] Dark/Light theme toggle

---

## 📄 License

This project is a demo/prototype for demonstration purposes.

---

## 👨‍💻 Author

Built with Claude AI as a UX/UI demonstration project.

---

<p align="center">
  <strong>UpRep</strong> — Track workouts, hit goals, transform your body 💪
</p>
