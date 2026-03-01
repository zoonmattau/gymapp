import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../contexts/ThemeContext';
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
import EditProfileScreen from '../screens/EditProfileScreen';
import CreateWorkoutScreen from '../screens/CreateWorkoutScreen';

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
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
    />
    <Stack.Screen
      name="CreateWorkout"
      component={CreateWorkoutScreen}
    />
  </Stack.Navigator>
);

// Check localStorage synchronously on module load (web only)
const getInitialOnboardingState = () => {
  if (Platform.OS === 'web') {
    // Check all possible user keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('onboarding_completed_') && localStorage.getItem(key) === 'true') {
        return true;
      }
    }
  }
  return null;
};

const AppNavigator = () => {
  const COLORS = useColors();
  const { user, profile, loading } = useAuth();
  // Initialize from localStorage synchronously to prevent flash
  const [onboardingCompleted, setOnboardingCompleted] = useState(getInitialOnboardingState);
  const checkedUserIdRef = React.useRef(null);

  // Helper to save onboarding status to localStorage
  const saveOnboardingToStorage = (userId) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
    } else {
      AsyncStorage.setItem(`@onboarding_completed_${userId}`, 'true').catch(() => {});
    }
  };

  useEffect(() => {
    checkOnboarding();
  }, [user, profile, loading]);

  const checkOnboarding = async () => {
    // Still loading auth - wait, don't change anything
    if (loading) {
      return;
    }

    // Not logged in - only set false if we don't already have a positive result
    if (!user) {
      if (onboardingCompleted !== true) {
        setOnboardingCompleted(false);
      }
      checkedUserIdRef.current = null;
      return;
    }

    // If we already confirmed this user is onboarded, don't re-check
    if (checkedUserIdRef.current === user.id && onboardingCompleted === true) {
      return;
    }

    // STEP 1: Check local storage first (instant, no network dependency)
    // This is the most reliable source because the DB write can silently fail
    if (Platform.OS === 'web') {
      const localValue = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (localValue === 'true') {
        console.log('Onboarding check: localStorage says completed');
        setOnboardingCompleted(true);
        checkedUserIdRef.current = user.id;
        return;
      }
    } else {
      try {
        const value = await AsyncStorage.getItem(`@onboarding_completed_${user.id}`);
        if (value === 'true') {
          console.log('Onboarding check: AsyncStorage says completed');
          setOnboardingCompleted(true);
          checkedUserIdRef.current = user.id;
          return;
        }
      } catch (e) {
        console.log('AsyncStorage check failed:', e);
      }
    }

    // STEP 2: Check profile from AuthContext
    if (profile?.onboarding_completed) {
      console.log('Onboarding check: profile.onboarding_completed is true');
      setOnboardingCompleted(true);
      saveOnboardingToStorage(user.id);
      checkedUserIdRef.current = user.id;
      return;
    }

    // STEP 3: If profile loaded but onboarding_completed is false, user needs onboarding
    if (profile && !profile.onboarding_completed) {
      console.log('Onboarding check: profile exists but onboarding_completed is false');
      checkedUserIdRef.current = user.id;
      setOnboardingCompleted(false);
      return;
    }

    // STEP 4: Profile is null - fetch directly from database (only once per user)
    if (!profile && user?.id && checkedUserIdRef.current !== user.id) {
      checkedUserIdRef.current = user.id;
      console.log('Onboarding check: profile is null, fetching directly from database');

      try {
        const { profileService } = await import('../services/profileService');
        const { data: freshProfile } = await profileService.getProfile(user.id);

        if (freshProfile?.onboarding_completed) {
          console.log('Onboarding check: fresh profile indicates completion');
          setOnboardingCompleted(true);
          saveOnboardingToStorage(user.id);
          return;
        }
      } catch (e) {
        console.log('Failed to fetch profile directly:', e);
      }

      console.log('Onboarding check: all checks done, user needs onboarding');
      setOnboardingCompleted(false);
      return;
    }
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
