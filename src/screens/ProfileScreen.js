import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  LogOut,
  ChevronRight,
  Bell,
  Target,
  Edit2,
  Trophy,
  Eye,
  Info,
  HelpCircle,
  MessageSquare,
  Star,
  TrendingUp,
  Dumbbell,
  Timer,
  BarChart3,
  Zap,
  Settings,
  Award,
  Crosshair,
  RefreshCw,
  Flame,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();

  // Settings states
  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [coreExercisesPosition, setCoreExercisesPosition] = useState('last');

  // Stats
  const [stats, setStats] = useState({
    workouts: 31,
    weekStreak: 0,
    prs: 0,
    badges: 0,
  });

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const restTimer = await AsyncStorage.getItem('@rest_timer_enabled');
        if (restTimer !== null) {
          setRestTimerEnabled(restTimer === 'true');
        }
        const corePos = await AsyncStorage.getItem('@core_exercises_position');
        if (corePos !== null) {
          setCoreExercisesPosition(corePos);
        }
      } catch (error) {
        console.log('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleRestTimerToggle = async (value) => {
    setRestTimerEnabled(value);
    try {
      await AsyncStorage.setItem('@rest_timer_enabled', value.toString());
    } catch (error) {
      console.log('Error saving rest timer setting:', error);
    }
  };

  const handleCoreExercisesToggle = async (position) => {
    setCoreExercisesPosition(position);
    try {
      await AsyncStorage.setItem('@core_exercises_position', position);
    } catch (error) {
      console.log('Error saving core exercises setting:', error);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('onboarding_completed');
        await signOut();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('@onboarding_completed');
          await signOut();
        }},
      ]);
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'User Last';
  };

  const getMemberSince = () => {
    if (user?.created_at) {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'December 2025';
  };

  // Achievement icons (placeholder)
  const achievements = [
    { id: 1, name: 'First Steps', icon: Crosshair },
    { id: 2, name: 'Getting Se...', icon: Dumbbell },
    { id: 3, name: 'Dedicated', icon: User },
    { id: 4, name: 'Centurion', icon: Award },
    { id: 5, name: 'Week War...', icon: RefreshCw },
    { id: 6, name: 'Monthly M...', icon: Zap },
    { id: 7, name: 'Unstoppa...', icon: Star },
    { id: 8, name: 'Personal ...', icon: Award },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <User size={50} color={COLORS.primary} />
          </View>

          <Text style={styles.username}>@{profile?.username || 'test'}</Text>
          <Text style={styles.displayName}>{getDisplayName()}</Text>

          {/* Followers / Following */}
          <View style={styles.followRow}>
            <TouchableOpacity style={styles.followItem}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>followers</Text>
            </TouchableOpacity>
            <View style={styles.followDivider} />
            <TouchableOpacity style={styles.followItem}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>following</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileBtn}>
            <Edit2 size={16} color={COLORS.text} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* STATS Section */}
        <Text style={styles.sectionLabel}>STATS</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.workouts}</Text>
            <Text style={styles.statLabel}>workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.weekStreak}</Text>
            <Text style={styles.statLabel}>week streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.prs}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.badges}</Text>
            <Text style={styles.statLabel}>badges</Text>
          </View>
        </View>

        {/* EXPERIENCE LEVEL Section */}
        <Text style={styles.sectionLabel}>EXPERIENCE LEVEL</Text>
        <TouchableOpacity style={styles.menuCard}>
          <View style={[styles.menuIcon, { backgroundColor: '#1a237e' }]}>
            <TrendingUp size={20} color={COLORS.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Novice</Text>
            <Text style={styles.menuSubtitle}>Learning the basics (6-18 months)</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* GYM EQUIPMENT Section */}
        <Text style={styles.sectionLabel}>GYM EQUIPMENT</Text>
        <TouchableOpacity style={styles.menuCard}>
          <View style={[styles.menuIcon, { backgroundColor: '#3d2914' }]}>
            <Dumbbell size={20} color={COLORS.warning} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>8 items selected</Text>
            <Text style={styles.menuSubtitle}>Barbell, Dumbbells, Cable...</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* ACHIEVEMENTS Section */}
        <View style={styles.achievementsHeader}>
          <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
          <Text style={styles.achievementsCount}>0/24 unlocked</Text>
        </View>
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Icon size={24} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.achievementName} numberOfLines={1}>{achievement.name}</Text>
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All 24 Achievements</Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS Section */}
        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          {/* Units */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Settings size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.settingsLabel}>Units</Text>
            <Text style={styles.settingsValue}>Metric (kg)</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Zap size={18} color={COLORS.success} />
            </View>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Eye size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.settingsLabel}>Privacy</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Tracking Preferences */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.success + '20' }]}>
              <BarChart3 size={18} color={COLORS.success} />
            </View>
            <Text style={styles.settingsLabel}>Tracking Preferences</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Core Exercises */}
          <View style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Dumbbell size={18} color={COLORS.warning} />
            </View>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Core Exercises</Text>
              <Text style={styles.settingsSubLabel}>Position in workout</Text>
            </View>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleBtn, coreExercisesPosition === 'first' && styles.toggleBtnActive]}
                onPress={() => handleCoreExercisesToggle('first')}
              >
                <Text style={[styles.toggleText, coreExercisesPosition === 'first' && styles.toggleTextActive]}>First</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, coreExercisesPosition === 'last' && styles.toggleBtnActive]}
                onPress={() => handleCoreExercisesToggle('last')}
              >
                <Text style={[styles.toggleText, coreExercisesPosition === 'last' && styles.toggleTextActive]}>Last</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Suggested Rest Timer */}
          <View style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Timer size={18} color={COLORS.warning} />
            </View>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Suggested Rest Timer</Text>
              <Text style={styles.settingsSubLabel}>Show rest timer between sets</Text>
            </View>
            <Switch
              value={restTimerEnabled}
              onValueChange={handleRestTimerToggle}
              trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
              thumbColor={COLORS.text}
            />
          </View>

          {/* Base Lifts */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Dumbbell size={18} color={COLORS.primary} />
            </View>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Base Lifts</Text>
              <Text style={styles.settingsSubLabel}>0 lifts set for weight estimation</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Account */}
          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.surfaceLight }]}>
              <User size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Account</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <Text style={styles.sectionLabelLarge}>Support</Text>
        <View style={styles.settingsCard}>
          {/* Help Center */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textMuted }]}>
              <HelpCircle size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Help Center</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Send Feedback */}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textMuted }]}>
              <MessageSquare size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Send Feedback</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* About UpRep */}
          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.settingsIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textMuted }]}>
              <Info size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>About UpRep</Text>
            <Text style={styles.settingsValue}>v5.0.0</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Enjoying UpRep Section */}
        <Text style={styles.sectionLabelLarge}>Enjoying UpRep?</Text>
        <View style={styles.rateCard}>
          <View style={styles.rateCardContent}>
            <View style={styles.rateStarIcon}>
              <Star size={28} color={COLORS.warning} fill={COLORS.warning} />
            </View>
            <View style={styles.rateInfo}>
              <Text style={styles.rateTitle}>Rate us on the App Store</Text>
              <Text style={styles.rateSubtitle}>Your feedback helps us improve and reach more fitness enthusiasts!</Text>
            </View>
          </View>
          <View style={styles.storeButtons}>
            <TouchableOpacity style={styles.storeBtn}>
              <Text style={styles.storeEmoji}>🍎</Text>
              <Text style={styles.storeBtnText}>App Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storeBtn}>
              <Text style={styles.storeEmoji}>🤖</Text>
              <Text style={styles.storeBtnText}>Google Play</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Member Since */}
        <Text style={styles.memberSince}>Member since {getMemberSince()}</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  displayName: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  followItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  followCount: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  followLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.textMuted,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
  },
  editProfileText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionLabelLarge: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementsCount: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  achievementsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  achievementName: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingTop: 8,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  settingsLabelContainer: {
    flex: 1,
  },
  settingsSubLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  settingsValue: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginRight: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.text,
  },
  rateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  rateCardContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rateStarIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rateInfo: {
    flex: 1,
  },
  rateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rateSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  storeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 12,
  },
  storeEmoji: {
    fontSize: 18,
  },
  storeBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: COLORS.error + '20',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  memberSince: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default ProfileScreen;
