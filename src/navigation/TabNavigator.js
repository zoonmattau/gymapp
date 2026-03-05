import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Dumbbell, Apple, User, TrendingUp, Users } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { socialService } from '../services/socialService';
import WorkoutBanner from '../components/WorkoutBanner';

// Screens
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import HealthScreen from '../screens/HealthScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CommunityScreen from '../screens/CommunityScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const COLORS = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isActive } = useActiveWorkout();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchPendingCount = async () => {
      const { data } = await socialService.getPendingFollowRequests(user.id);
      setPendingCount(data ? data.length : 0);
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // For web, use compact height with minimal padding
  // For native, use safe area insets
  const tabBarHeight = Platform.OS === 'web' ? 64 : (56 + insets.bottom);

  return (
    <View style={{ flex: 1 }}>
    {isActive && <WorkoutBanner />}
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'web' ? 4 : insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{
          tabBarIcon: ({ color }) => <Dumbbell size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Health"
        component={HealthScreen}
        options={{
          tabBarIcon: ({ color }) => <Apple size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => <TrendingUp size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color }) => <Users size={20} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
    </View>
  );
};

export default TabNavigator;
