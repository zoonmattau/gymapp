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
import { supabase } from '../lib/supabase';
import { EXPERIENCE_LEVELS, EQUIPMENT_OPTIONS } from '../constants/experience';
import ExperienceLevelModal from '../components/ExperienceLevelModal';
import EquipmentModal from '../components/EquipmentModal';
import BaseLiftsModal from '../components/BaseLiftsModal';
import UnitsModal from '../components/UnitsModal';
import TrackingPreferencesModal from '../components/TrackingPreferencesModal';
import Toast from '../components/Toast';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();

  // Settings states
  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [coreExercisesPosition, setCoreExercisesPosition] = useState('last');

  // Experience and Equipment
  const [experienceLevel, setExperienceLevel] = useState('novice');
  const [selectedEquipment, setSelectedEquipment] = useState(['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight']);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [tempEquipment, setTempEquipment] = useState([]);

  // Base Lifts
  const [baseLifts, setBaseLifts] = useState({});
  const [showBaseLiftsModal, setShowBaseLiftsModal] = useState(false);

  // Units
  const [units, setUnits] = useState('metric');
  const [showUnitsModal, setShowUnitsModal] = useState(false);

  // Tracking Preferences
  const [trackingPreferences, setTrackingPreferences] = useState({
    calories: true,
    macros: true,
    water: true,
    sleep: true,
    supplements: true,
  });
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

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

  // Load experience, equipment, and base lifts from database
  useEffect(() => {
    const loadUserGoals = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('experience, equipment, base_bench, base_bench_reps, base_db_press, base_db_press_reps, base_ohp, base_ohp_reps, base_deadlift, base_deadlift_reps, base_row, base_row_reps, base_pullup, base_pullup_reps, base_squat, base_squat_reps, base_leg_press, base_leg_press_reps, base_rdl, base_rdl_reps, base_curl, base_curl_reps')
          .eq('user_id', user.id)
          .single();

        if (data) {
          if (data.experience) {
            setExperienceLevel(data.experience);
          }
          if (data.equipment) {
            setSelectedEquipment(data.equipment);
          }
          // Load base lifts
          const lifts = {
            bench: { weight: data.base_bench?.toString() || '', reps: data.base_bench_reps?.toString() || '' },
            dbPress: { weight: data.base_db_press?.toString() || '', reps: data.base_db_press_reps?.toString() || '' },
            ohp: { weight: data.base_ohp?.toString() || '', reps: data.base_ohp_reps?.toString() || '' },
            deadlift: { weight: data.base_deadlift?.toString() || '', reps: data.base_deadlift_reps?.toString() || '' },
            row: { weight: data.base_row?.toString() || '', reps: data.base_row_reps?.toString() || '' },
            pullup: { weight: data.base_pullup?.toString() || '', reps: data.base_pullup_reps?.toString() || '' },
            squat: { weight: data.base_squat?.toString() || '', reps: data.base_squat_reps?.toString() || '' },
            legPress: { weight: data.base_leg_press?.toString() || '', reps: data.base_leg_press_reps?.toString() || '' },
            rdl: { weight: data.base_rdl?.toString() || '', reps: data.base_rdl_reps?.toString() || '' },
            curl: { weight: data.base_curl?.toString() || '', reps: data.base_curl_reps?.toString() || '' },
          };
          setBaseLifts(lifts);
        }
      } catch (error) {
        console.log('Error loading user goals:', error);
      }
    };
    loadUserGoals();
  }, [user?.id]);

  // Load units and tracking preferences from AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedUnits = await AsyncStorage.getItem('@units');
        if (storedUnits) setUnits(storedUnits);

        const storedTracking = await AsyncStorage.getItem('@tracking_preferences');
        if (storedTracking) setTrackingPreferences(JSON.parse(storedTracking));
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Handle experience level change
  const handleExperienceSelect = async (levelId) => {
    setExperienceLevel(levelId);
    setShowExperienceModal(false);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_goals')
          .upsert({
            user_id: user.id,
            experience: levelId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (!error) {
          showToast('Experience level updated', 'success');
        }
      } catch (error) {
        console.log('Error updating experience:', error);
      }
    }
  };

  // Handle equipment toggle
  const handleEquipmentToggle = (equipId) => {
    setTempEquipment(prev => {
      if (prev.includes(equipId)) {
        return prev.filter(e => e !== equipId);
      } else {
        return [...prev, equipId];
      }
    });
  };

  // Open equipment modal
  const openEquipmentModal = () => {
    setTempEquipment([...selectedEquipment]);
    setShowEquipmentModal(true);
  };

  // Save equipment selection
  const handleEquipmentSave = async () => {
    setSelectedEquipment(tempEquipment);
    setShowEquipmentModal(false);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_goals')
          .upsert({
            user_id: user.id,
            equipment: tempEquipment,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (!error) {
          showToast(`${tempEquipment.length} equipment items saved`, 'success');
        }
      } catch (error) {
        console.log('Error saving equipment:', error);
      }
    }
  };

  // Save base lifts
  const handleBaseLiftsave = async (lifts) => {
    setBaseLifts(lifts);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_goals')
          .upsert({
            user_id: user.id,
            base_bench: parseInt(lifts.bench?.weight) || null,
            base_bench_reps: parseInt(lifts.bench?.reps) || null,
            base_db_press: parseInt(lifts.dbPress?.weight) || null,
            base_db_press_reps: parseInt(lifts.dbPress?.reps) || null,
            base_ohp: parseInt(lifts.ohp?.weight) || null,
            base_ohp_reps: parseInt(lifts.ohp?.reps) || null,
            base_deadlift: parseInt(lifts.deadlift?.weight) || null,
            base_deadlift_reps: parseInt(lifts.deadlift?.reps) || null,
            base_row: parseInt(lifts.row?.weight) || null,
            base_row_reps: parseInt(lifts.row?.reps) || null,
            base_pullup: parseInt(lifts.pullup?.weight) || null,
            base_pullup_reps: parseInt(lifts.pullup?.reps) || null,
            base_squat: parseInt(lifts.squat?.weight) || null,
            base_squat_reps: parseInt(lifts.squat?.reps) || null,
            base_leg_press: parseInt(lifts.legPress?.weight) || null,
            base_leg_press_reps: parseInt(lifts.legPress?.reps) || null,
            base_rdl: parseInt(lifts.rdl?.weight) || null,
            base_rdl_reps: parseInt(lifts.rdl?.reps) || null,
            base_curl: parseInt(lifts.curl?.weight) || null,
            base_curl_reps: parseInt(lifts.curl?.reps) || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (!error) {
          const count = Object.values(lifts).filter(l => l.weight && l.reps).length;
          showToast(`${count} base lifts saved`, 'success');
        }
      } catch (error) {
        console.log('Error saving base lifts:', error);
      }
    }
  };

  // Handle units change
  const handleUnitsSelect = async (unitId) => {
    setUnits(unitId);
    try {
      await AsyncStorage.setItem('@units', unitId);

      // Also update in Supabase so it syncs across the app
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ weight_unit: unitId === 'imperial' ? 'lbs' : 'kg' })
          .eq('id', user.id);
      }

      showToast(`Units set to ${unitId === 'imperial' ? 'Imperial (lbs)' : 'Metric (kg)'}`, 'success');
    } catch (error) {
      console.log('Error saving units:', error);
    }
  };

  // Handle tracking preference toggle
  const handleTrackingToggle = async (trackingId) => {
    const newPreferences = {
      ...trackingPreferences,
      [trackingId]: !trackingPreferences[trackingId],
    };
    setTrackingPreferences(newPreferences);
    try {
      await AsyncStorage.setItem('@tracking_preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.log('Error saving tracking preferences:', error);
    }
  };

  // Count base lifts set
  const countBaseLifts = () => {
    return Object.values(baseLifts).filter(l => l.weight && l.reps).length;
  };

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
            <TouchableOpacity style={styles.followItem} onPress={() => navigation.navigate('Community', { initialTab: 'followers' })} activeOpacity={0.7}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>followers</Text>
            </TouchableOpacity>
            <View style={styles.followDivider} />
            <TouchableOpacity style={styles.followItem} onPress={() => navigation.navigate('Community', { initialTab: 'following' })} activeOpacity={0.7}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>following</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
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
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setShowExperienceModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#1a237e' }]}>
            <TrendingUp size={20} color={COLORS.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>
              {EXPERIENCE_LEVELS[experienceLevel]?.label || 'Novice'}
            </Text>
            <Text style={styles.menuSubtitle}>
              {EXPERIENCE_LEVELS[experienceLevel]?.desc || 'Learning the basics (6-18 months)'}
            </Text>
          </View>
          <ChevronRight size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* GYM EQUIPMENT Section */}
        <Text style={styles.sectionLabel}>GYM EQUIPMENT</Text>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={openEquipmentModal}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#3d2914' }]}>
            <Dumbbell size={20} color={COLORS.warning} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>{selectedEquipment.length} items selected</Text>
            <Text style={styles.menuSubtitle} numberOfLines={1}>
              {selectedEquipment.slice(0, 3).join(', ')}{selectedEquipment.length > 3 ? '...' : ''}
            </Text>
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
                <TouchableOpacity
                  key={achievement.id}
                  style={styles.achievementItem}
                  onPress={() => alert(`${achievement.name} - Coming soon!`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.achievementIcon}>
                    <Icon size={24} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.achievementName} numberOfLines={1}>{achievement.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => showToast('Achievements coming soon!', 'info')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All 24 Achievements</Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS Section */}
        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          {/* Units */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowUnitsModal(true)} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Settings size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.settingsLabel}>Units</Text>
            <Text style={styles.settingsValue}>{units === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => showToast('Notifications coming soon!', 'info')} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Zap size={18} color={COLORS.success} />
            </View>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => showToast('Privacy settings coming soon!', 'info')} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Eye size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.settingsLabel}>Privacy</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Tracking Preferences */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowTrackingModal(true)} activeOpacity={0.7}>
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
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowBaseLiftsModal(true)} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Dumbbell size={18} color={COLORS.primary} />
            </View>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Base Lifts</Text>
              <Text style={styles.settingsSubLabel}>{countBaseLifts()} lifts set for weight estimation</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Account */}
          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={() => showToast('Account settings coming soon!', 'info')} activeOpacity={0.7}>
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
          <TouchableOpacity style={styles.settingsItem} onPress={() => showToast('Help center coming soon!', 'info')} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textMuted }]}>
              <HelpCircle size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Help Center</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Send Feedback */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => showToast('Feedback coming soon!', 'info')} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textMuted }]}>
              <MessageSquare size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Send Feedback</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* About UpRep */}
          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={() => showToast('UpRep v5.0.0 - Built with React Native', 'info')} activeOpacity={0.7}>
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
            <TouchableOpacity style={styles.storeBtn} onPress={() => showToast('App Store link coming soon!', 'info')} activeOpacity={0.7}>
              <Text style={styles.storeEmoji}>🍎</Text>
              <Text style={styles.storeBtnText}>App Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storeBtn} onPress={() => showToast('Google Play link coming soon!', 'info')} activeOpacity={0.7}>
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

      {/* Experience Level Modal */}
      <ExperienceLevelModal
        visible={showExperienceModal}
        onClose={() => setShowExperienceModal(false)}
        currentLevel={experienceLevel}
        onSelect={handleExperienceSelect}
      />

      {/* Equipment Modal */}
      <EquipmentModal
        visible={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        selectedEquipment={tempEquipment}
        onToggle={handleEquipmentToggle}
        onSave={handleEquipmentSave}
      />

      {/* Base Lifts Modal */}
      <BaseLiftsModal
        visible={showBaseLiftsModal}
        onClose={() => setShowBaseLiftsModal(false)}
        initialData={baseLifts}
        onSave={handleBaseLiftsave}
      />

      {/* Units Modal */}
      <UnitsModal
        visible={showUnitsModal}
        onClose={() => setShowUnitsModal(false)}
        currentUnit={units}
        onSelect={handleUnitsSelect}
      />

      {/* Tracking Preferences Modal */}
      <TrackingPreferencesModal
        visible={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        preferences={trackingPreferences}
        onToggle={handleTrackingToggle}
      />

      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
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
