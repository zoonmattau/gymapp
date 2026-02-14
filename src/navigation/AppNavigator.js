import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Main App
import TabNavigator from './TabNavigator';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/WorkoutSummaryScreen';
import WorkoutScheduleScreen from '../screens/WorkoutScheduleScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import PersonalRecordsScreen from '../screens/PersonalRecordsScreen';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    <Stack.Screen
      name="ActiveWorkout"
      component={ActiveWorkoutScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen
      name="WorkoutSummary"
      component={WorkoutSummaryScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen
      name="WorkoutSchedule"
      component={WorkoutScheduleScreen}
    />
    <Stack.Screen
      name="ExerciseLibrary"
      component={ExerciseLibraryScreen}
    />
    <Stack.Screen
      name="PersonalRecords"
      component={PersonalRecordsScreen}
    />
    <Stack.Screen
      name="WorkoutHistory"
      component={WorkoutHistoryScreen}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, profile, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, [user, profile]);

  const checkOnboarding = async () => {
    if (!user) {
      setOnboardingCompleted(false);
      return;
    }

    // First check Supabase profile (syncs across devices)
    if (profile?.onboarding_completed) {
      setOnboardingCompleted(true);
      return;
    }

    // Fall back to local storage for onboarding completion (keyed by user id)
    const storageKey = Platform.OS === 'web'
      ? `onboarding_completed_${user.id}`
      : `@onboarding_completed_${user.id}`;

    let completed = false;

    if (Platform.OS === 'web') {
      completed = localStorage.getItem(storageKey) === 'true';
    } else {
      const value = await AsyncStorage.getItem(storageKey);
      completed = value === 'true';
    }

    setOnboardingCompleted(completed);
  };

  if (loading || onboardingCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthStack />;
  }

  // Logged in but hasn't completed onboarding
  if (!onboardingCompleted) {
    return <OnboardingStack />;
  }

  // Fully authenticated and onboarded
  return <MainStack />;
};

export default AppNavigator;
