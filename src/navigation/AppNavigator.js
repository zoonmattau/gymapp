import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ActiveWorkoutProvider } from '../contexts/ActiveWorkoutContext';

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
import PublicProfileScreen from '../screens/PublicProfileScreen';
import ExerciseHistoryScreen from '../screens/ExerciseHistoryScreen';

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
  <ActiveWorkoutProvider>
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
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
      />
      <Stack.Screen
        name="ExerciseHistory"
        component={ExerciseHistoryScreen}
      />
    </Stack.Navigator>
  </ActiveWorkoutProvider>
);

const AppNavigator = () => {
  const COLORS = useColors();
  const { user, profile, loading } = useAuth();
  // Start as null — checkOnboarding will resolve the correct value per-user
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  // Tracks which user ID we've made a definitive onboarding decision for
  const decidedUserIdRef = React.useRef(null);
  // Prevents duplicate DB fetches for the same user
  const fetchingForUserRef = React.useRef(null);

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

    // Not logged in - reset everything so next login starts fresh
    if (!user) {
      setOnboardingCompleted(false);
      decidedUserIdRef.current = null;
      fetchingForUserRef.current = null;
      return;
    }

    // If we already confirmed this user completed onboarding, don't re-check
    // (Only lock on true — when false, keep checking so completing onboarding works)
    if (decidedUserIdRef.current === user.id && onboardingCompleted === true) {
      return;
    }

    // STEP 1: Check local storage for THIS specific user (instant, no network)
    if (Platform.OS === 'web') {
      const localValue = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (localValue === 'true') {
        console.log('Onboarding check: localStorage says completed for', user.id);
        setOnboardingCompleted(true);
        decidedUserIdRef.current = user.id;
        return;
      }
    } else {
      try {
        const value = await AsyncStorage.getItem(`@onboarding_completed_${user.id}`);
        if (value === 'true') {
          console.log('Onboarding check: AsyncStorage says completed');
          setOnboardingCompleted(true);
          decidedUserIdRef.current = user.id;
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
      decidedUserIdRef.current = user.id;
      return;
    }

    // STEP 3: If profile loaded but onboarding_completed is false, user needs onboarding
    if (profile && !profile.onboarding_completed) {
      console.log('Onboarding check: profile exists but onboarding_completed is false');
      setOnboardingCompleted(false);
      decidedUserIdRef.current = user.id;
      return;
    }

    // STEP 4: Profile is null - fetch directly from database
    // Use a separate ref to prevent duplicate fetches (don't block re-checks)
    if (!profile && user?.id && fetchingForUserRef.current !== user.id) {
      fetchingForUserRef.current = user.id;
      console.log('Onboarding check: profile is null, fetching directly from database');

      // While fetching, default to showing onboarding (safe default — prevents
      // flashing the main app for users who haven't completed onboarding)
      setOnboardingCompleted(false);

      try {
        const { profileService } = await import('../services/profileService');
        const { data: freshProfile } = await profileService.getProfile(user.id);

        // Guard: user might have changed during the await
        if (fetchingForUserRef.current !== user.id) return;

        if (freshProfile?.onboarding_completed) {
          console.log('Onboarding check: fresh profile indicates completion');
          setOnboardingCompleted(true);
          saveOnboardingToStorage(user.id);
          decidedUserIdRef.current = user.id;
          return;
        }
      } catch (e) {
        console.log('Failed to fetch profile directly:', e);
      }

      console.log('Onboarding check: all checks done, user needs onboarding');
      setOnboardingCompleted(false);
      decidedUserIdRef.current = user.id;
      return;
    }
  };

  if (loading || onboardingCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, paddingBottom: 80 }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 120, height: 120, marginBottom: 24 }}
          resizeMode="contain"
        />
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
