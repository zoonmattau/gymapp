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
      console.log('Onboarding check: profile.onboarding_completed is true');
      setOnboardingCompleted(true);
      return;
    }

    // Check if profile has data indicating user already set up their profile
    // This handles users who completed onboarding before the flag was added
    if (profile && (profile.first_name || profile.height || profile.date_of_birth || profile.username)) {
      console.log('Onboarding check: profile has data, marking as completed');
      setOnboardingCompleted(true);
      // Also update the database so it's properly tracked going forward
      try {
        const { profileService } = await import('../services/profileService');
        await profileService.updateProfile(user.id, { onboarding_completed: true });
      } catch (e) {
        console.log('Failed to update onboarding flag:', e);
      }
      return;
    }

    // If profile is null (load failed), try to fetch directly from database
    if (!profile && user?.id) {
      console.log('Onboarding check: profile is null, fetching directly from database');
      try {
        const { profileService } = await import('../services/profileService');
        const { data: freshProfile } = await profileService.getProfile(user.id);

        if (freshProfile) {
          console.log('Onboarding check: fetched fresh profile', freshProfile);
          // Check if this profile indicates onboarding was completed
          if (freshProfile.onboarding_completed ||
              freshProfile.first_name ||
              freshProfile.height ||
              freshProfile.date_of_birth ||
              freshProfile.username) {
            console.log('Onboarding check: fresh profile indicates completion');
            setOnboardingCompleted(true);
            // Update the flag if not already set
            if (!freshProfile.onboarding_completed) {
              try {
                await profileService.updateProfile(user.id, { onboarding_completed: true });
              } catch (e) {
                console.log('Failed to update onboarding flag:', e);
              }
            }
            return;
          }
        }
      } catch (e) {
        console.log('Failed to fetch profile directly:', e);
      }
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

    console.log('Onboarding check: localStorage says', completed);

    // If localStorage says completed, sync to database for cross-device
    if (completed && user?.id) {
      try {
        const { profileService } = await import('../services/profileService');
        await profileService.updateProfile(user.id, { onboarding_completed: true });
      } catch (e) {
        console.log('Failed to sync onboarding to database:', e);
      }
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
