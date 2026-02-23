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
      // Don't override a positive localStorage result
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

    // If we got a positive result from initial localStorage check, verify it's for this user
    if (onboardingCompleted === true && Platform.OS === 'web') {
      const localValue = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (localValue === 'true') {
        checkedUserIdRef.current = user.id;
        return; // Confirmed for this user
      }
      // Not for this user, need to check further
    }

    // FIRST: Check localStorage immediately (instant, no network) - WEB ONLY
    if (Platform.OS === 'web') {
      const localValue = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (localValue === 'true') {
        console.log('Onboarding check: localStorage says completed');
        setOnboardingCompleted(true);
        checkedUserIdRef.current = user.id;
        return;
      }
    }

    // Check if profile has data indicating user already set up their profile
    if (profile?.onboarding_completed) {
      console.log('Onboarding check: profile.onboarding_completed is true');
      setOnboardingCompleted(true);
      saveOnboardingToStorage(user.id);
      checkedUserIdRef.current = user.id;
      return;
    }

    if (profile && (profile.first_name || profile.height || profile.date_of_birth || profile.username)) {
      console.log('Onboarding check: profile has data, marking as completed');
      setOnboardingCompleted(true);
      saveOnboardingToStorage(user.id);
      checkedUserIdRef.current = user.id;
      return;
    }

    // Profile is null - need to fetch directly (but only once per user)
    if (!profile && user?.id && checkedUserIdRef.current !== user.id) {
      checkedUserIdRef.current = user.id;
      console.log('Onboarding check: profile is null, fetching directly from database');

      try {
        const { profileService } = await import('../services/profileService');
        const { data: freshProfile } = await profileService.getProfile(user.id);

        if (freshProfile) {
          console.log('Onboarding check: fetched fresh profile');
          if (freshProfile.onboarding_completed ||
              freshProfile.first_name ||
              freshProfile.height ||
              freshProfile.date_of_birth ||
              freshProfile.username) {
            console.log('Onboarding check: fresh profile indicates completion');
            setOnboardingCompleted(true);
            saveOnboardingToStorage(user.id);
            return;
          }
        }
      } catch (e) {
        console.log('Failed to fetch profile directly:', e);
      }

      // For native, also check AsyncStorage
      if (Platform.OS !== 'web') {
        try {
          const value = await AsyncStorage.getItem(`@onboarding_completed_${user.id}`);
          if (value === 'true') {
            console.log('Onboarding check: AsyncStorage says completed');
            setOnboardingCompleted(true);
            return;
          }
        } catch (e) {
          console.log('AsyncStorage check failed:', e);
        }
      }

      // Only set false after all checks are done
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
