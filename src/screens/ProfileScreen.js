import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  X,
  Lock,
  Moon,
  Sun,
  Plus,
  Camera,
  Smartphone,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Download,
} from 'lucide-react-native';
import { useColors, useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { EXPERIENCE_LEVELS, EQUIPMENT_OPTIONS } from '../constants/experience';
import { workoutService } from '../services/workoutService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import ExperienceLevelModal from '../components/ExperienceLevelModal';
import EquipmentModal from '../components/EquipmentModal';
import BaseLiftsModal from '../components/BaseLiftsModal';
import UnitsModal from '../components/UnitsModal';
import TrackingPreferencesModal from '../components/TrackingPreferencesModal';
import Toast from '../components/Toast';
import * as XLSX from 'xlsx';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const COLORS = useColors();
  const { isDark, toggleTheme } = useTheme();
  const styles = getStyles(COLORS);

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

  // Notifications & Privacy modals
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    workoutReminders: true,
    progressUpdates: true,
    socialActivity: true,
    weeklyReport: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showActivity: true,
    showProgress: false,
  });
  const [shareWorkoutsEnabled, setShareWorkoutsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null); // { success: true, sessions: X, sets: Y } or { success: false, error: 'msg' }
  const csvInputRef = useRef(null);

  // Template Import
  const [showTemplateImportModal, setShowTemplateImportModal] = useState(false);
  const [templateImportLoading, setTemplateImportLoading] = useState(false);
  const [templateImportResult, setTemplateImportResult] = useState(null);
  const [parsedWorkouts, setParsedWorkouts] = useState(null); // { workouts: {}, names: [], hasWeeks: bool }
  const templateInputRef = useRef(null);

  // Avatar upload
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadAvatar = async (file) => {
    if (!user?.id) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name?.split('.').pop() || 'jpg';
      const filePath = `${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Profile photo updated', 'success');
    } catch (err) {
      console.log('Avatar upload error:', err);
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to upload an avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const ext = asset.uri.split('.').pop() || 'jpg';
        blob.name = `avatar.${ext}`;
        await uploadAvatar(blob);
      }
    }
  };

  const handleWebFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    event.target.value = '';
  };

  // Stats
  const [stats, setStats] = useState({
    workouts: 0,
    weekStreak: 0,
    prs: 0,
    badges: 0,
  });

  // Load real stats from database
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const [workoutCountResult, prsResult, sessionsResult] = await Promise.all([
          workoutService.getWorkoutCount(user.id),
          workoutService.getPersonalRecords(user.id),
          supabase
            .from('workout_sessions')
            .select('started_at')
            .eq('user_id', user.id)
            .not('ended_at', 'is', null)
            .order('started_at', { ascending: false }),
        ]);

        // Calculate week streak: consecutive weeks with at least 1 workout
        let weekStreak = 0;
        const sessions = sessionsResult.data || [];
        if (sessions.length > 0) {
          const getWeekKey = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
            const monday = new Date(d.setDate(diff));
            return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
          };

          const weeksWithWorkouts = new Set(sessions.map(s => getWeekKey(s.started_at)));
          const now = new Date();
          let checkDate = new Date(now);

          // Start from current week, count backwards
          const currentWeekKey = getWeekKey(now);
          if (!weeksWithWorkouts.has(currentWeekKey)) {
            // Check if last week had one (allow 1 week grace)
            checkDate.setDate(checkDate.getDate() - 7);
          }

          while (true) {
            const weekKey = getWeekKey(checkDate);
            if (weeksWithWorkouts.has(weekKey)) {
              weekStreak++;
              checkDate.setDate(checkDate.getDate() - 7);
            } else {
              break;
            }
          }
        }

        setStats({
          workouts: workoutCountResult.count || 0,
          weekStreak,
          prs: prsResult.data?.length || 0,
          badges: 0,
        });
      } catch (error) {
        console.log('Error loading stats:', error);
      }
    };
    loadStats();
  }, [user?.id]);

  // Load private_account from profile
  useEffect(() => {
    if (profile) {
      setPrivateAccount(profile.private_account === true);
    }
  }, [profile]);

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
        const shareWorkouts = await AsyncStorage.getItem('@share_workouts_enabled');
        if (shareWorkouts !== null) {
          setShareWorkoutsEnabled(shareWorkouts === 'true');
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
          .maybeSingle();

        if (error) {
          console.warn('Error loading user goals:', error);
        }
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
        // Try update first (works if user_goals row exists)
        const { data, error: updateError } = await supabase
          .from('user_goals')
          .update({ experience: levelId })
          .eq('user_id', user.id)
          .select()
          .maybeSingle();

        if (updateError) {
          console.warn('Experience update error:', updateError);
          showToast('Failed to save experience level', 'error');
          return;
        }

        if (!data) {
          // No row exists yet, insert with required 'goal' field
          const { error: insertError } = await supabase
            .from('user_goals')
            .insert({ user_id: user.id, experience: levelId, goal: 'fitness' });

          if (insertError) {
            console.warn('Experience insert error:', insertError);
            showToast('Failed to save experience level', 'error');
            return;
          }
        }

        showToast('Experience level updated', 'success');
      } catch (error) {
        console.warn('Error updating experience:', error);
        showToast('Failed to save experience level', 'error');
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
        const { data, error: updateError } = await supabase
          .from('user_goals')
          .update({ equipment: tempEquipment })
          .eq('user_id', user.id)
          .select()
          .maybeSingle();

        if (updateError) {
          console.warn('Equipment save error:', updateError);
          showToast('Failed to save equipment', 'error');
          return;
        }

        if (!data) {
          const { error: insertError } = await supabase
            .from('user_goals')
            .insert({ user_id: user.id, equipment: tempEquipment, goal: 'fitness' });

          if (insertError) {
            console.warn('Equipment insert error:', insertError);
            showToast('Failed to save equipment', 'error');
            return;
          }
        }

        showToast(`${tempEquipment.length} equipment items saved`, 'success');
      } catch (error) {
        console.warn('Error saving equipment:', error);
      }
    }
  };

  // Save base lifts
  const handleBaseLiftsave = async (lifts) => {
    setBaseLifts(lifts);

    if (user?.id) {
      try {
        const liftData = {
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
        };

        const { data, error: updateError } = await supabase
          .from('user_goals')
          .update(liftData)
          .eq('user_id', user.id)
          .select()
          .maybeSingle();

        if (updateError) {
          console.warn('Base lifts save error:', updateError);
          showToast('Failed to save base lifts', 'error');
          return;
        }

        if (!data) {
          const { error: insertError } = await supabase
            .from('user_goals')
            .insert({ user_id: user.id, goal: 'fitness', ...liftData });

          if (insertError) {
            console.warn('Base lifts insert error:', insertError);
            showToast('Failed to save base lifts', 'error');
            return;
          }
        }

        const count = Object.values(lifts).filter(l => l.weight && l.reps).length;
        showToast(`${count} base lifts saved`, 'success');
      } catch (error) {
        console.warn('Error saving base lifts:', error);
      }
    }
  };

  // Handle units change
  const handleUnitsSelect = async (unitId) => {
    setUnits(unitId);
    setShowUnitsModal(false); // Close modal immediately after selection

    try {
      await AsyncStorage.setItem('@units', unitId);

      // Also update in Supabase so it syncs across the app
      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ weight_unit: unitId === 'imperial' ? 'lbs' : 'kg' })
          .eq('id', user.id);

        if (error) {
          console.log('Error updating weight_unit in database:', error);
        }

        // Refresh the profile so the new weight_unit is available app-wide
        await refreshProfile();
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

  const handlePrivateAccountToggle = async (value) => {
    setPrivateAccount(value);
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ private_account: value })
          .eq('id', user.id);

        if (!error) {
          await refreshProfile();
          showToast(value ? 'Account set to private' : 'Account set to public', 'success');
        }
      } catch (error) {
        console.log('Error updating private account:', error);
        setPrivateAccount(!value);
      }
    }
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

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      showToast('Please enter your feedback', 'error');
      return;
    }
    setFeedbackSubmitting(true);
    try {
      // Google Sheets Web App URL - replace with your deployed script URL
      const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

      const data = {
        type: feedbackType,
        message: feedbackMessage,
        username: profile?.username || 'anonymous',
        userId: user?.id || 'unknown',
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      };

      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      showToast('Feedback submitted! Thank you!', 'success');
      setFeedbackMessage('');
      setFeedbackType('suggestion');
      setShowFeedbackModal(false);
    } catch (error) {
      console.log('Error submitting feedback:', error);
      showToast('Failed to submit. Please try again.', 'error');
    } finally {
      setFeedbackSubmitting(false);
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

  // CSV Import Handler - supports many formats and column orderings
  const handleCSVImport = async (csvText) => {
    if (!user?.id) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      // Remove BOM if present
      let cleanText = csvText.replace(/^\uFEFF/, '');

      // Detect delimiter (comma, semicolon, or tab)
      const firstLine = cleanText.split('\n')[0];
      let delimiter = ',';
      if (firstLine.includes('\t') && !firstLine.includes(',')) delimiter = '\t';
      else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

      // Parse CSV with proper handling
      const parseCSVLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            values.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        return values;
      };

      const lines = cleanText.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        setImportResult({ success: false, error: 'CSV file is empty or has no data rows' });
        setImportLoading(false);
        return;
      }

      // Parse header - normalize to lowercase, remove special chars
      const rawHeader = parseCSVLine(lines[0]);
      const header = rawHeader.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      // Flexible column matching with many variations
      const findCol = (patterns) => {
        for (let i = 0; i < header.length; i++) {
          const h = header[i];
          for (const p of patterns) {
            if (h === p || h.includes(p) || p.includes(h)) return i;
          }
        }
        return -1;
      };

      // Column patterns for different app exports and spreadsheet formats
      const dateCol = findCol(['date', 'datetime', 'time', 'timestamp', 'when', 'day', 'workoutdate', 'trainingdate', 'performedat']);
      const exerciseCol = findCol(['exercise', 'exercisename', 'movement', 'lift', 'name', 'activity', 'workout', 'exercisetitle']);
      const weightCol = findCol(['weight', 'load', 'kg', 'lbs', 'lb', 'kgs', 'weightkg', 'weightlbs', 'weightlifted', 'resistance']);
      const repsCol = findCol(['reps', 'rep', 'repetitions', 'repetition', 'repsperformed', 'numreps', 'repcount']);
      const setsCol = findCol(['sets', 'set', 'setcount', 'numsets', 'setnumber', 'setnum']);
      const workoutNameCol = findCol(['workoutname', 'routine', 'program', 'session', 'workouttype', 'sessionname']);
      const notesCol = findCol(['notes', 'note', 'comment', 'comments', 'description']);
      const rpeCol = findCol(['rpe', 'rir', 'intensity', 'effort', 'perceived']);
      const durationCol = findCol(['duration', 'time', 'seconds', 'minutes', 'timeseconds']);

      // Must have at least exercise column
      if (exerciseCol === -1) {
        // Try to find any column that might contain exercise names
        const sampleRow = parseCSVLine(lines[1]);
        let possibleExerciseCol = -1;
        for (let i = 0; i < sampleRow.length; i++) {
          const val = sampleRow[i];
          // Check if it looks like an exercise name (contains letters, reasonable length)
          if (val && /^[a-zA-Z]/.test(val) && val.length > 2 && val.length < 100 && !/^\d+$/.test(val)) {
            possibleExerciseCol = i;
            break;
          }
        }
        if (possibleExerciseCol === -1) {
          setImportResult({ success: false, error: 'Could not identify exercise column. Please ensure your CSV has a column for exercise names.' });
          setImportLoading(false);
          return;
        }
      }

      const finalExerciseCol = exerciseCol >= 0 ? exerciseCol : 0;

      // Parse date in multiple formats
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr.trim() === '') return null;
        const s = dateStr.trim();

        // ISO format: 2024-01-15 or 2024-01-15T10:30:00
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          const d = new Date(s);
          if (!isNaN(d.getTime())) return d;
        }

        // US format: 01/15/2024 or 1/15/2024
        const usMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (usMatch) {
          const year = usMatch[3].length === 2 ? 2000 + parseInt(usMatch[3]) : parseInt(usMatch[3]);
          const d = new Date(year, parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
          if (!isNaN(d.getTime())) return d;
        }

        // EU format: 15/01/2024 or 15-01-2024 or 15.01.2024
        const euMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (euMatch) {
          const day = parseInt(euMatch[1]);
          const month = parseInt(euMatch[2]);
          const year = euMatch[3].length === 2 ? 2000 + parseInt(euMatch[3]) : parseInt(euMatch[3]);
          // If day > 12, it's definitely EU format
          if (day > 12) {
            const d = new Date(year, month - 1, day);
            if (!isNaN(d.getTime())) return d;
          }
        }

        // Try native parsing as fallback
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d;

        return null;
      };

      // Parse weight (handle units in the value like "80kg" or "175 lbs")
      const parseWeight = (weightStr) => {
        if (!weightStr) return 0;
        const s = weightStr.toString().trim().toLowerCase();
        const num = parseFloat(s.replace(/[^0-9.\-]/g, ''));
        if (isNaN(num)) return 0;
        // Convert lbs to kg if specified
        if (s.includes('lb')) return Math.round(num / 2.205 * 10) / 10;
        return num;
      };

      // Group data by date
      const workoutsByDate = {};
      const today = new Date().toISOString().split('T')[0];
      let skippedRows = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);

        const exercise = values[finalExerciseCol]?.trim();
        if (!exercise || exercise.length < 2) {
          skippedRows++;
          continue;
        }

        // Skip header-like rows that might be repeated
        if (exercise.toLowerCase() === 'exercise' || exercise.toLowerCase() === 'name') {
          continue;
        }

        const dateStr = dateCol >= 0 ? values[dateCol] : null;
        const parsedDate = parseDate(dateStr);
        const normalizedDate = parsedDate ? parsedDate.toISOString().split('T')[0] : today;

        const weight = weightCol >= 0 ? parseWeight(values[weightCol]) : 0;
        const reps = repsCol >= 0 ? parseInt(values[repsCol]?.replace(/[^0-9]/g, '')) || 0 : 0;
        const numSets = setsCol >= 0 ? parseInt(values[setsCol]?.replace(/[^0-9]/g, '')) || 1 : 1;
        const workoutName = workoutNameCol >= 0 ? values[workoutNameCol]?.trim() : null;
        const rpe = rpeCol >= 0 ? parseInt(values[rpeCol]?.replace(/[^0-9]/g, '')) || null : null;
        const notes = notesCol >= 0 ? values[notesCol]?.trim() : null;

        const dateKey = workoutName ? `${normalizedDate}|${workoutName}` : normalizedDate;

        if (!workoutsByDate[dateKey]) {
          workoutsByDate[dateKey] = { date: normalizedDate, name: workoutName, sets: [] };
        }

        // Add sets (if numSets > 1, duplicate the entry)
        for (let s = 0; s < Math.min(numSets, 20); s++) { // Cap at 20 sets per entry
          workoutsByDate[dateKey].sets.push({ exercise, weight, reps, rpe, notes });
        }
      }

      if (Object.keys(workoutsByDate).length === 0) {
        setImportResult({ success: false, error: `No valid workout data found. ${skippedRows > 0 ? `${skippedRows} rows were skipped.` : ''} Please check your CSV format.` });
        setImportLoading(false);
        return;
      }

      // Create workout sessions and sets
      let totalSessions = 0;
      let totalSets = 0;

      for (const [key, workout] of Object.entries(workoutsByDate)) {
        // Create session
        const sessionDate = new Date(workout.date);
        const { data: session, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            workout_name: workout.name || 'Imported Workout',
            started_at: sessionDate.toISOString(),
            ended_at: new Date(sessionDate.getTime() + 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          continue;
        }

        totalSessions++;

        // Group by exercise for proper set numbering
        const exerciseSetNumbers = {};

        for (const set of workout.sets) {
          if (!exerciseSetNumbers[set.exercise]) {
            exerciseSetNumbers[set.exercise] = 1;
          }

          const insertData = {
            session_id: session.id,
            exercise_name: set.exercise,
            set_number: exerciseSetNumbers[set.exercise]++,
            weight: set.weight,
            reps: set.reps,
            is_warmup: false,
          };
          if (set.rpe) insertData.rpe = set.rpe;

          const { error: setError } = await supabase
            .from('workout_sets')
            .insert(insertData);

          if (!setError) {
            totalSets++;
          }
        }
      }

      setImportResult({ success: true, sessions: totalSessions, sets: totalSets });
      showToast(`Imported ${totalSessions} workouts with ${totalSets} sets!`, 'success');
    } catch (error) {
      console.error('CSV import error:', error);
      setImportResult({ success: false, error: error.message || 'Failed to import CSV' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csvText = XLSX.utils.sheet_to_csv(firstSheet);
          handleCSVImport(csvText);
        } catch (err) {
          console.error('Excel parse error:', err);
          setImportResult({ success: false, error: 'Failed to read Excel file. Please check the file format.' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          handleCSVImport(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Template Download - generates Excel file with example data
  const handleDownloadTemplate = () => {
    try {
      const exampleData = [
        ['Workout Name', 'Exercise', 'Set', 'Reps', 'Weight (kg)', 'RPE', 'Rest', 'Notes'],
        ['Push Day', 'Bench Press', 1, 12, 60, 6, '2 min', 'Warm up'],
        ['Push Day', 'Bench Press', 2, 10, 70, 7, '2 min', ''],
        ['Push Day', 'Bench Press', 3, 8, 80, 8, '3 min', ''],
        ['Push Day', 'Bench Press', 4, 6, 90, 9, '3 min', 'Last heavy set'],
        ['Push Day', 'Incline DB Press', 1, 12, 24, 7, '90 sec', ''],
        ['Push Day', 'Incline DB Press', 2, 10, 28, 7, '90 sec', ''],
        ['Push Day', 'Incline DB Press', 3, 8, 32, 8, '90 sec', ''],
        ['Push Day', 'Cable Fly', 1, 15, 10, 6, '60 sec', 'Squeeze at peak'],
        ['Push Day', 'Cable Fly', 2, 12, 12.5, 7, '60 sec', ''],
        ['Push Day', 'Cable Fly', 3, 12, 12.5, 7, '60 sec', ''],
        ['Pull Day', 'Barbell Row', 1, 12, 50, 6, '2 min', ''],
        ['Pull Day', 'Barbell Row', 2, 10, 60, 7, '2 min', ''],
        ['Pull Day', 'Barbell Row', 3, 8, 70, 8, '3 min', ''],
        ['Pull Day', 'Pull Ups', 1, 'AMRAP', '', 7, '2 min', 'Bodyweight'],
        ['Pull Day', 'Pull Ups', 2, 'AMRAP', '', 8, '2 min', ''],
        ['Pull Day', 'Pull Ups', 3, 'AMRAP', '', 9, '2 min', ''],
        ['Pull Day', 'Barbell Curl', 1, 12, 20, 7, '60 sec', ''],
        ['Pull Day', 'Barbell Curl', 2, 10, 25, 7, '60 sec', ''],
        ['Pull Day', 'Barbell Curl', 3, 10, 25, 8, '60 sec', ''],
      ];

      const ws = XLSX.utils.aoa_to_sheet(exampleData);
      ws['!cols'] = [
        { wch: 16 }, { wch: 22 }, { wch: 5 }, { wch: 8 }, { wch: 14 }, { wch: 6 }, { wch: 10 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Workout Program');
      XLSX.writeFile(wb, 'UpRep_Workout_Template.xlsx');
      showToast('Template downloaded!', 'success');
    } catch (err) {
      console.error('Template download error:', err);
      showToast('Failed to download template', 'error');
    }
  };

  // Parse CSV text into 2D array
  const parseCSVToRows = (csvText) => {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parseCSVLine = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      values.push(current.trim());
      return values;
    };
    return lines.map(l => parseCSVLine(l));
  };

  // Template Import - smart parser that handles both simple templates and complex program spreadsheets
  // Accepts a 2D array of rows (from Excel sheet_to_json or parsed CSV)
  const handleTemplateImport = async (inputRows) => {
    if (!user?.id) return;
    setTemplateImportLoading(true);
    setTemplateImportResult(null);

    try {
      // Accept either a string (CSV) or a 2D array
      const rawRows = typeof inputRows === 'string' ? parseCSVToRows(inputRows) : inputRows;

      if (!rawRows || rawRows.length < 2) {
        setTemplateImportResult({ success: false, error: 'File is empty or has no data rows.' });
        setTemplateImportLoading(false);
        return;
      }

      // Normalize all cell values to strings (handles nulls, numbers, date serials from Excel)
      const allRows = rawRows.map(row =>
        (Array.isArray(row) ? row : []).map(cell =>
          cell == null ? '' : String(cell)
        )
      );

      // --- Step 1: Auto-detect header row ---
      let headerRowIdx = 0;
      const exerciseKeywords = ['exercise', 'movement', 'lift', 'activity'];
      const setsRepsKeywords = ['set', 'rep', 'repetition'];
      const wordMatch = (cell, keyword) => new RegExp(`\\b${keyword}s?\\b`).test(cell);
      // Score-based detection: scan up to 200 rows to handle spreadsheets with long intros
      // (warm-up protocols, weak point tables, copyright notices, etc.)
      const columnKeywordGroups = [
        exerciseKeywords,
        setsRepsKeywords,
        ['weight', 'load', 'kg', 'lbs'],
        ['rpe', 'intensity'],
        ['rest', 'recovery'],
        ['notes', 'note', 'comment', 'instruction', 'cue'],
      ];
      let bestHeaderScore = 0;
      for (let i = 0; i < Math.min(allRows.length, 200); i++) {
        const rowLower = allRows[i].map(c => (c || '').toLowerCase().trim());
        // Only consider short cells as potential header cells (skip prose paragraphs)
        const hasExercise = rowLower.some(c => c.length < 50 && exerciseKeywords.some(k => wordMatch(c, k)));
        const hasSetsReps = rowLower.some(c => c.length < 50 && setsRepsKeywords.some(k => wordMatch(c, k)));
        if (hasExercise && hasSetsReps) {
          let score = 0;
          for (const group of columnKeywordGroups) {
            if (rowLower.some(c => c.length < 50 && group.some(k => wordMatch(c, k)))) score++;
          }
          if (score > bestHeaderScore) {
            bestHeaderScore = score;
            headerRowIdx = i;
          }
        }
      }

      // --- Step 2: Detect 1RM reference values ---
      const oneRepMaxes = {};
      const ormExerciseMap = {
        squat: ['squat', 'back squat'],
        bench: ['bench', 'bench press'],
        deadlift: ['deadlift', 'dead lift'],
        ohp: ['ohp', 'overhead press', 'shoulder press', 'military press'],
        row: ['row', 'barbell row', 'bent over row'],
      };
      for (let i = 0; i < headerRowIdx; i++) {
        const rowStr = allRows[i].join(' ').toLowerCase();
        if (rowStr.includes('1rm') || rowStr.includes('one rep max') || rowStr.includes('max')) {
          // Check if this row or the next has exercise names with numeric values
          const checkRows = [allRows[i]];
          if (i + 1 < headerRowIdx) checkRows.push(allRows[i + 1]);
          // Try to pair exercise labels with numbers
          for (const row of checkRows) {
            for (let j = 0; j < row.length; j++) {
              const cellLower = (row[j] || '').toLowerCase().replace(/['"]/g, '');
              for (const [key, aliases] of Object.entries(ormExerciseMap)) {
                if (aliases.some(a => cellLower.includes(a))) {
                  // Look for a number in the next cell or same cell after the name
                  const numMatch = cellLower.match(/(\d+(\.\d+)?)\s*(kg|lbs)?/);
                  if (numMatch) {
                    oneRepMaxes[key] = parseFloat(numMatch[1]);
                  } else if (j + 1 < row.length) {
                    const nextVal = parseFloat(row[j + 1]);
                    if (!isNaN(nextVal) && nextVal > 0) {
                      oneRepMaxes[key] = nextVal;
                    }
                  }
                }
              }
            }
          }
          break;
        }
      }

      // Check for 2-row headers (e.g. "Working" / "Sets" split across rows)
      let dataStartIdx = headerRowIdx + 1;
      if (headerRowIdx + 1 < allRows.length) {
        const nextRow = allRows[headerRowIdx + 1];
        const nextLower = nextRow.map(c => (c || '').toLowerCase().trim());
        const nonEmpty = nextLower.filter(c => c.length > 0);
        // Sub-header: short text cells, no pure numbers, at least 2 non-empty cells
        if (nonEmpty.length >= 2 && nonEmpty.every(c => c.length < 30 && isNaN(parseFloat(c)))) {
          // Merge sub-header cells into the main header row
          for (let c = 0; c < Math.max(allRows[headerRowIdx].length, nextRow.length); c++) {
            const main = (allRows[headerRowIdx][c] || '').trim();
            const sub = (nextRow[c] || '').trim();
            if (sub && main) allRows[headerRowIdx][c] = `${main} ${sub}`;
            else if (sub && !main) allRows[headerRowIdx][c] = sub;
          }
          dataStartIdx = headerRowIdx + 2;
        }
      }

      // --- Step 3: Flexible column detection ---
      const headers = allRows[headerRowIdx].map(h => (h || '').toLowerCase().replace(/['"]/g, ''));
      const isHeaderRow = (row) => {
        const lower = row.map(c => (c || '').toLowerCase().trim());
        return lower.some(c => exerciseKeywords.some(k => wordMatch(c, k))) &&
               lower.some(c => setsRepsKeywords.some(k => wordMatch(c, k)));
      };

      const findCol = (keywords) => {
        // Prefer longer/more-specific keyword matches first
        for (const kw of keywords) {
          const idx = headers.findIndex(h => h.includes(kw));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const weekCol = findCol(['week']);
      const nameCol = findCol(['workout', 'day', 'session']);
      const exerciseCol = findCol(['exercise', 'movement', 'lift', 'activity']);
      const warmupSetsCol = findCol(['warmup', 'warm-up', 'warm up']);
      const workingSetsCol = findCol(['working sets']);
      const setsCol = workingSetsCol !== -1 ? workingSetsCol : findCol(['sets', 'set']);
      const repsCol = findCol(['reps', 'rep', 'repetition', 'duration']);
      const weightCol = findCol(['weight', 'load', 'kg', 'lbs']);
      const rpeCol = findCol(['rpe', 'intensity', 'perceived', '%']);
      const restCol = findCol(['rest', 'recovery']);
      const notesCol = findCol(['notes', 'note', 'comment', 'instruction', 'cue']);

      if (exerciseCol === -1) {
        setTemplateImportResult({ success: false, error: 'Could not find an "Exercise" column. Please ensure your spreadsheet has a column with "Exercise" in the header.' });
        setTemplateImportLoading(false);
        return;
      }

      // --- Step 4 & 5: Parse rows with fill-down, week detection, and smart value parsing ---
      const clean = (val) => (val || '').replace(/[\r\n]+/g, ' ').replace(/^['"]|['"]$/g, '').trim();

      const parseReps = (raw) => {
        if (!raw) return null;
        const s = raw.toString().trim().toLowerCase();
        if (s === 'amrap' || s === 'max' || s === 'failure') return null;
        if (s.includes('rpe only') || s === '') return null;
        // "15/15" → 15
        const slashMatch = s.match(/^(\d+)\s*[\/\\]\s*\d+/);
        if (slashMatch) return parseInt(slashMatch[1]);
        // "10+2" → 10
        const plusMatch = s.match(/^(\d+)\s*\+\s*\d+/);
        if (plusMatch) return parseInt(plusMatch[1]);
        // "3-5" → 4, "10-12 (dropset)" → 11, "6-8 per leg" → 7 (midpoint)
        const rangeMatch = s.match(/^(\d+)\s*[-–]\s*(\d+)/);
        if (rangeMatch) return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
        // Plain number
        const num = parseInt(s);
        return isNaN(num) ? null : num;
      };

      const matchExerciseTo1RM = (exerciseName) => {
        const lower = exerciseName.toLowerCase();
        for (const [key, aliases] of Object.entries(ormExerciseMap)) {
          if (aliases.some(a => lower.includes(a)) && oneRepMaxes[key]) {
            return oneRepMaxes[key];
          }
        }
        return null;
      };

      const parseWeightAndRPE = (weightRaw, rpeRaw, exerciseName) => {
        let weight = null;
        let rpe = null;
        let extraNotes = '';

        const wStr = (weightRaw || '').toString().trim();
        const rStr = (rpeRaw || '').toString().trim().toLowerCase();

        // Parse weight
        const wNum = parseFloat(wStr.replace(/[^\d.]/g, ''));
        if (!isNaN(wNum) && wNum > 1) {
          weight = wNum;
        }

        // Parse RPE / percentage from the RPE column
        if (rStr) {
          // "RPE8" or "RPE 8" → 8
          const rpeMatch = rStr.match(/rpe\s*(\d+(\.\d+)?)/);
          if (rpeMatch) {
            rpe = parseFloat(rpeMatch[1]);
          } else {
            const rNum = parseFloat(rStr.replace(/[^\d.]/g, ''));
            if (!isNaN(rNum)) {
              if (rNum > 0 && rNum < 1) {
                // It's a percentage of 1RM (e.g. 0.775 = 77.5%)
                const orm = matchExerciseTo1RM(exerciseName);
                if (orm && weight === null) {
                  weight = Math.round(orm * rNum);
                  extraNotes = `${Math.round(rNum * 100)}% 1RM`;
                } else if (!orm && weight === null) {
                  extraNotes = `${Math.round(rNum * 100)}% 1RM`;
                }
              } else if (rNum >= 1 && rNum <= 10) {
                rpe = rNum;
              } else if (rNum > 10 && rNum <= 100) {
                // Likely a percentage like 77.5
                const orm = matchExerciseTo1RM(exerciseName);
                if (orm && weight === null) {
                  weight = Math.round(orm * (rNum / 100));
                  extraNotes = `${rNum}% 1RM`;
                } else if (!orm && weight === null) {
                  extraNotes = `${rNum}% 1RM`;
                }
              }
            }
          }
        }

        // Also check if weight column itself has a percentage
        if (weight === null && wStr) {
          const pctMatch = wStr.match(/([\d.]+)\s*%/);
          if (pctMatch) {
            const pct = parseFloat(pctMatch[1]);
            const orm = matchExerciseTo1RM(exerciseName);
            if (orm) {
              weight = Math.round(orm * (pct / 100));
              extraNotes = `${pct}% 1RM`;
            } else {
              extraNotes = `${pct}% 1RM`;
            }
          }
        }

        return { weight, rpe, extraNotes };
      };

      const workouts = {};
      let currentWeek = null;
      let currentWorkoutName = '';
      let hasWeeks = false;
      let weekWorkoutSeen = {};

      // Check if the header row itself contains a week number (e.g. "Week 1" in a column)
      for (let c = 0; c < Math.min(allRows[headerRowIdx].length, 3); c++) {
        const hWeek = (allRows[headerRowIdx][c] || '').match(/week\s*(\d+)/i);
        if (hWeek) {
          currentWeek = parseInt(hWeek[1]);
          hasWeeks = true;
          break;
        }
      }

      for (let i = dataStartIdx; i < allRows.length; i++) {
        const row = allRows[i];

        // Skip fully empty rows
        const allEmpty = row.every(c => !(c || '').trim());
        if (allEmpty) continue;

        // Skip rest day rows
        const rowJoined = row.join(' ').toLowerCase();
        if (rowJoined.includes('rest day')) continue;

        // Week detection FIRST — check before skipping header rows
        let weekMatch = null;
        if (weekCol !== -1) {
          weekMatch = clean(row[weekCol] || '').match(/week\s*(\d+)/i);
        }
        if (!weekMatch) {
          for (let c = 0; c < Math.min(row.length, 3); c++) {
            weekMatch = clean(row[c] || '').match(/week\s*(\d+)/i);
            if (weekMatch) break;
          }
        }
        if (weekMatch) {
          currentWeek = parseInt(weekMatch[1]);
          hasWeeks = true;
          weekWorkoutSeen = {};
        }

        // Skip re-appearing header rows (after extracting week)
        if (isHeaderRow(row)) continue;

        // If this row was ONLY a week marker (no exercise), skip it
        if (weekMatch && !clean(row[exerciseCol] || '')) continue;

        // Workout name with fill-down
        let rawWorkoutName = nameCol !== -1 ? clean(row[nameCol] || '') : '';

        // Fallback: if no workout name column, scan early columns for a label
        if (!rawWorkoutName && nameCol === -1) {
          for (let c = 0; c < exerciseCol; c++) {
            const val = clean(row[c] || '');
            if (val && !val.match(/^week\s*\d/i) && !val.match(/^\d+$/) && val.length > 1) {
              rawWorkoutName = val;
              break;
            }
          }
        }

        if (rawWorkoutName) {
          // Track duplicates within same week (e.g. "Upper" appearing twice)
          const countKey = `${currentWeek || 0}-${rawWorkoutName}`;
          weekWorkoutSeen[countKey] = (weekWorkoutSeen[countKey] || 0) + 1;
          if (weekWorkoutSeen[countKey] > 1) {
            currentWorkoutName = `${rawWorkoutName} ${weekWorkoutSeen[countKey]}`;
          } else {
            currentWorkoutName = rawWorkoutName;
          }
        }

        const exerciseName = clean(row[exerciseCol] || '');

        // Skip if no exercise name
        if (!exerciseName) continue;

        // If we still have no workout name, use a default
        if (!currentWorkoutName) {
          currentWorkoutName = hasWeeks && currentWeek ? `Workout` : 'Imported Workout';
        }

        // Parse sets (prefer working sets over warmup)
        let sets = 3;
        if (setsCol !== -1) {
          const setsVal = parseInt(row[setsCol]);
          if (!isNaN(setsVal) && setsVal > 0) sets = setsVal;
        }

        // Parse reps
        const reps = repsCol !== -1 ? parseReps(row[repsCol]) : null;

        // Parse weight & RPE
        const weightRaw = weightCol !== -1 ? row[weightCol] : '';
        const rpeRaw = rpeCol !== -1 ? row[rpeCol] : '';
        const { weight, rpe, extraNotes } = parseWeightAndRPE(weightRaw, rpeRaw, exerciseName);

        // Parse rest and notes
        const rest = restCol !== -1 ? clean(row[restCol] || '') : '';
        let notes = notesCol !== -1 ? clean(row[notesCol] || '') : '';
        if (extraNotes) {
          notes = notes ? `${extraNotes} | ${notes}` : extraNotes;
        }

        // Build workout key
        const workoutKey = hasWeeks && currentWeek
          ? `W${currentWeek} - ${currentWorkoutName}`
          : currentWorkoutName;

        if (!workouts[workoutKey]) workouts[workoutKey] = [];

        // Check if this is another set of the same exercise (consecutive rows)
        const existingExercises = workouts[workoutKey];
        const lastExercise = existingExercises[existingExercises.length - 1];

        if (lastExercise && lastExercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          // Add as another set to the existing exercise
          if (!lastExercise.setDetails) {
            // Convert the first entry into setDetails format
            lastExercise.setDetails = [{
              reps: lastExercise.reps,
              weight: lastExercise.weight,
              rpe: lastExercise.rpe,
              ...(lastExercise.notes && { notes: lastExercise.notes }),
              ...(lastExercise.rest && { rest: lastExercise.rest }),
            }];
          }
          lastExercise.setDetails.push({
            reps, weight, rpe,
            ...(notes && { notes }),
            ...(rest && { rest }),
          });
          lastExercise.sets = lastExercise.setDetails.length;
        } else {
          // New exercise
          const exercise = { name: exerciseName, sets, reps, weight, rpe };
          if (notes) exercise.notes = notes;
          if (rest) exercise.rest = rest;
          existingExercises.push(exercise);
        }
      }

      const workoutNames = Object.keys(workouts);
      if (workoutNames.length === 0) {
        setTemplateImportResult({ success: false, error: 'No valid workout data found. Check that your file has an Exercise column and data rows with exercise names.' });
        setTemplateImportLoading(false);
        return;
      }

      // Show preview — don't save yet
      setParsedWorkouts({ workouts, names: workoutNames, hasWeeks });
    } catch (err) {
      console.error('Template import error:', err);
      setTemplateImportResult({ success: false, error: err.message || 'Failed to import template.' });
    }
    setTemplateImportLoading(false);
  };

  // Save parsed workouts to repertoire
  const handleSaveParsedWorkouts = async () => {
    if (!user?.id || !parsedWorkouts) return;
    setTemplateImportLoading(true);

    try {
      const { workouts, names: workoutNames, hasWeeks } = parsedWorkouts;
      const workoutsArray = workoutNames.map(name => ({
        name,
        exercises: workouts[name],
        is_public: false,
      }));

      const { data, error } = await publishedWorkoutService.publishWorkoutsBatch(user.id, workoutsArray);

      if (error) {
        setTemplateImportResult({ success: false, error: error.message || 'Failed to save workout templates.' });
      } else {
        setTemplateImportResult({ success: true, names: workoutNames, hasWeeks });
        setParsedWorkouts(null);
        showToast(`Created ${workoutNames.length} workout template${workoutNames.length > 1 ? 's' : ''}!`, 'success');
      }
    } catch (err) {
      console.error('Save templates error:', err);
      setTemplateImportResult({ success: false, error: err.message || 'Failed to save templates.' });
    }
    setTemplateImportLoading(false);
  };

  // File select handler for template import
  const handleTemplateFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result);
          const workbook = XLSX.read(data, { type: 'array' });
          // Combine all sheets as 2D arrays using sheet_to_json for proper cell handling
          // (avoids CSV issues with multiline cells and date serial numbers)
          let combinedRows = [];
          workbook.SheetNames.forEach((name, idx) => {
            const sheet = workbook.Sheets[name];
            // header: 1 gives us a 2D array, raw: false gives formatted strings (not date serials)
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
            // Inject a week marker row from sheet name if applicable
            const weekMatch = name.match(/week\s*(\d+)/i);
            if (weekMatch) {
              combinedRows.push([`WEEK ${weekMatch[1]}`]);
            } else if (workbook.SheetNames.length > 1) {
              combinedRows.push([`WEEK ${idx + 1}`]);
            }
            combinedRows = combinedRows.concat(rows);
          });
          handleTemplateImport(combinedRows);
        } catch (err) {
          console.error('Excel parse error:', err);
          setTemplateImportResult({ success: false, error: 'Failed to read Excel file. Please check the file format.' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          handleTemplateImport(text);
        }
      };
      reader.readAsText(file);
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

  // Achievement definitions with unlock conditions - 100 achievements across categories
  const achievementDefinitions = [
    // === WORKOUT MILESTONES (1-20) ===
    { id: 1, category: 'Workouts', name: 'First Steps', icon: Dumbbell, description: 'Complete your first workout', check: () => stats.workouts >= 1 },
    { id: 2, category: 'Workouts', name: 'Getting Started', icon: Dumbbell, description: 'Complete 5 workouts', check: () => stats.workouts >= 5 },
    { id: 3, category: 'Workouts', name: 'Double Digits', icon: Dumbbell, description: 'Complete 10 workouts', check: () => stats.workouts >= 10 },
    { id: 4, category: 'Workouts', name: 'Committed', icon: Dumbbell, description: 'Complete 25 workouts', check: () => stats.workouts >= 25 },
    { id: 5, category: 'Workouts', name: 'Half Century', icon: Dumbbell, description: 'Complete 50 workouts', check: () => stats.workouts >= 50 },
    { id: 6, category: 'Workouts', name: 'Centurion', icon: Award, description: 'Complete 100 workouts', check: () => stats.workouts >= 100 },
    { id: 7, category: 'Workouts', name: 'Dedicated', icon: Award, description: 'Complete 150 workouts', check: () => stats.workouts >= 150 },
    { id: 8, category: 'Workouts', name: 'Iron Will', icon: Award, description: 'Complete 200 workouts', check: () => stats.workouts >= 200 },
    { id: 9, category: 'Workouts', name: 'Gym Rat', icon: Award, description: 'Complete 300 workouts', check: () => stats.workouts >= 300 },
    { id: 10, category: 'Workouts', name: 'Veteran', icon: Award, description: 'Complete 400 workouts', check: () => stats.workouts >= 400 },
    { id: 11, category: 'Workouts', name: 'Half Thousand', icon: Award, description: 'Complete 500 workouts', check: () => stats.workouts >= 500 },
    { id: 12, category: 'Workouts', name: 'Elite', icon: Award, description: 'Complete 750 workouts', check: () => stats.workouts >= 750 },
    { id: 13, category: 'Workouts', name: 'Legendary', icon: Award, description: 'Complete 1000 workouts', check: () => stats.workouts >= 1000 },
    { id: 14, category: 'Workouts', name: 'Immortal', icon: Award, description: 'Complete 1500 workouts', check: () => stats.workouts >= 1500 },
    { id: 15, category: 'Workouts', name: 'Titan', icon: Award, description: 'Complete 2000 workouts', check: () => stats.workouts >= 2000 },

    // === STREAK ACHIEVEMENTS (16-35) ===
    { id: 16, category: 'Streaks', name: 'First Week', icon: RefreshCw, description: 'Maintain a 1 week streak', check: () => stats.weekStreak >= 1 },
    { id: 17, category: 'Streaks', name: 'Two Timer', icon: RefreshCw, description: 'Maintain a 2 week streak', check: () => stats.weekStreak >= 2 },
    { id: 18, category: 'Streaks', name: 'Three-peat', icon: RefreshCw, description: 'Maintain a 3 week streak', check: () => stats.weekStreak >= 3 },
    { id: 19, category: 'Streaks', name: 'Monthly Master', icon: RefreshCw, description: 'Maintain a 4 week streak', check: () => stats.weekStreak >= 4 },
    { id: 20, category: 'Streaks', name: 'Consistent', icon: RefreshCw, description: 'Maintain a 6 week streak', check: () => stats.weekStreak >= 6 },
    { id: 21, category: 'Streaks', name: 'Two Months Strong', icon: RefreshCw, description: 'Maintain an 8 week streak', check: () => stats.weekStreak >= 8 },
    { id: 22, category: 'Streaks', name: 'Quarter Master', icon: RefreshCw, description: 'Maintain a 12 week streak', check: () => stats.weekStreak >= 12 },
    { id: 23, category: 'Streaks', name: 'Unstoppable', icon: RefreshCw, description: 'Maintain a 16 week streak', check: () => stats.weekStreak >= 16 },
    { id: 24, category: 'Streaks', name: 'Half Year Hero', icon: RefreshCw, description: 'Maintain a 26 week streak', check: () => stats.weekStreak >= 26 },
    { id: 25, category: 'Streaks', name: 'Year Round', icon: Award, description: 'Maintain a 52 week streak', check: () => stats.weekStreak >= 52 },
    { id: 26, category: 'Streaks', name: 'Eternal Flame', icon: Award, description: 'Maintain a 78 week streak', check: () => stats.weekStreak >= 78 },
    { id: 27, category: 'Streaks', name: 'Two Year Titan', icon: Award, description: 'Maintain a 104 week streak', check: () => stats.weekStreak >= 104 },

    // === PERSONAL RECORDS (28-47) ===
    { id: 28, category: 'PRs', name: 'First PR', icon: Star, description: 'Set your first personal record', check: () => stats.prs >= 1 },
    { id: 29, category: 'PRs', name: 'PR Beginner', icon: Star, description: 'Set 3 personal records', check: () => stats.prs >= 3 },
    { id: 30, category: 'PRs', name: 'PR Collector', icon: Star, description: 'Set 5 personal records', check: () => stats.prs >= 5 },
    { id: 31, category: 'PRs', name: 'Breaking Through', icon: Star, description: 'Set 10 personal records', check: () => stats.prs >= 10 },
    { id: 32, category: 'PRs', name: 'PR Hunter', icon: Star, description: 'Set 15 personal records', check: () => stats.prs >= 15 },
    { id: 33, category: 'PRs', name: 'Record Breaker', icon: Star, description: 'Set 25 personal records', check: () => stats.prs >= 25 },
    { id: 34, category: 'PRs', name: 'PR Machine', icon: Star, description: 'Set 40 personal records', check: () => stats.prs >= 40 },
    { id: 35, category: 'PRs', name: 'Elite Lifter', icon: Star, description: 'Set 50 personal records', check: () => stats.prs >= 50 },
    { id: 36, category: 'PRs', name: 'Record Destroyer', icon: Star, description: 'Set 75 personal records', check: () => stats.prs >= 75 },
    { id: 37, category: 'PRs', name: 'Century of PRs', icon: Award, description: 'Set 100 personal records', check: () => stats.prs >= 100 },
    { id: 38, category: 'PRs', name: 'PR Legend', icon: Award, description: 'Set 150 personal records', check: () => stats.prs >= 150 },
    { id: 39, category: 'PRs', name: 'Strength Icon', icon: Award, description: 'Set 200 personal records', check: () => stats.prs >= 200 },
    { id: 40, category: 'PRs', name: 'PR Immortal', icon: Award, description: 'Set 300 personal records', check: () => stats.prs >= 300 },

    // === PROFILE & SETUP (41-55) ===
    { id: 41, category: 'Profile', name: 'Hello World', icon: User, description: 'Create your account', check: () => !!user?.id },
    { id: 42, category: 'Profile', name: 'Identity', icon: User, description: 'Set your username', check: () => !!profile?.username },
    { id: 43, category: 'Profile', name: 'Picture Perfect', icon: User, description: 'Upload a profile photo', check: () => !!profile?.avatar_url },
    { id: 44, category: 'Profile', name: 'Experienced', icon: TrendingUp, description: 'Set your experience level', check: () => !!experienceLevel },
    { id: 45, category: 'Profile', name: 'Equipped', icon: Dumbbell, description: 'Select your gym equipment', check: () => selectedEquipment.length > 0 },
    { id: 46, category: 'Profile', name: 'Fully Equipped', icon: Dumbbell, description: 'Select 5+ equipment types', check: () => selectedEquipment.length >= 5 },
    { id: 47, category: 'Profile', name: 'Bio Writer', icon: User, description: 'Add a bio to your profile', check: () => !!profile?.bio },
    { id: 48, category: 'Profile', name: 'Goal Setter', icon: TrendingUp, description: 'Set your fitness goals', check: () => !!profile?.goals },
    { id: 49, category: 'Profile', name: 'Base Builder', icon: Dumbbell, description: 'Set a base lift weight', check: () => Object.keys(baseLifts || {}).length > 0 },
    { id: 50, category: 'Profile', name: 'Foundation', icon: Dumbbell, description: 'Set 3+ base lift weights', check: () => Object.keys(baseLifts || {}).length >= 3 },

    // === COMMUNITY & SOCIAL (51-70) ===
    { id: 51, category: 'Social', name: 'Friendly', icon: User, description: 'Follow your first user', check: () => false },
    { id: 52, category: 'Social', name: 'Social Butterfly', icon: User, description: 'Follow 5 users', check: () => false },
    { id: 53, category: 'Social', name: 'Networker', icon: User, description: 'Follow 10 users', check: () => false },
    { id: 54, category: 'Social', name: 'Connected', icon: User, description: 'Follow 25 users', check: () => false },
    { id: 55, category: 'Social', name: 'Influencer', icon: User, description: 'Follow 50 users', check: () => false },
    { id: 56, category: 'Social', name: 'First Fan', icon: Star, description: 'Get your first follower', check: () => false },
    { id: 57, category: 'Social', name: 'Rising Star', icon: Star, description: 'Get 5 followers', check: () => false },
    { id: 58, category: 'Social', name: 'Popular', icon: Star, description: 'Get 10 followers', check: () => false },
    { id: 59, category: 'Social', name: 'Well Known', icon: Star, description: 'Get 25 followers', check: () => false },
    { id: 60, category: 'Social', name: 'Famous', icon: Award, description: 'Get 50 followers', check: () => false },
    { id: 61, category: 'Social', name: 'Celebrity', icon: Award, description: 'Get 100 followers', check: () => false },
    { id: 62, category: 'Social', name: 'Superstar', icon: Award, description: 'Get 250 followers', check: () => false },
    { id: 63, category: 'Social', name: 'Icon', icon: Award, description: 'Get 500 followers', check: () => false },

    // === CHALLENGES (64-75) ===
    { id: 64, category: 'Challenges', name: 'Challenger', icon: Zap, description: 'Join your first challenge', check: () => false },
    { id: 65, category: 'Challenges', name: 'Competitive', icon: Zap, description: 'Join 3 challenges', check: () => false },
    { id: 66, category: 'Challenges', name: 'Challenge Seeker', icon: Zap, description: 'Join 5 challenges', check: () => false },
    { id: 67, category: 'Challenges', name: 'Challenge Veteran', icon: Zap, description: 'Join 10 challenges', check: () => false },
    { id: 68, category: 'Challenges', name: 'First Victory', icon: Award, description: 'Complete your first challenge', check: () => false },
    { id: 69, category: 'Challenges', name: 'Triple Crown', icon: Award, description: 'Complete 3 challenges', check: () => false },
    { id: 70, category: 'Challenges', name: 'Champion', icon: Award, description: 'Complete 5 challenges', check: () => false },
    { id: 71, category: 'Challenges', name: 'Master Champion', icon: Award, description: 'Complete 10 challenges', check: () => false },
    { id: 72, category: 'Challenges', name: 'Challenge Creator', icon: Zap, description: 'Create your first challenge', check: () => false },
    { id: 73, category: 'Challenges', name: 'Leader', icon: Award, description: 'Win a challenge leaderboard', check: () => false },

    // === NUTRITION & TRACKING (74-85) ===
    { id: 74, category: 'Nutrition', name: 'First Meal', icon: User, description: 'Log your first meal', check: () => false },
    { id: 75, category: 'Nutrition', name: 'Meal Logger', icon: User, description: 'Log 10 meals', check: () => false },
    { id: 76, category: 'Nutrition', name: 'Nutrition Tracker', icon: User, description: 'Log 50 meals', check: () => false },
    { id: 77, category: 'Nutrition', name: 'Meal Master', icon: Award, description: 'Log 100 meals', check: () => false },
    { id: 78, category: 'Nutrition', name: 'Hydrated', icon: User, description: 'Log water intake', check: () => false },
    { id: 79, category: 'Nutrition', name: 'Water Warrior', icon: User, description: 'Hit daily water goal 7 days', check: () => false },
    { id: 80, category: 'Nutrition', name: 'Hydration Hero', icon: Award, description: 'Hit daily water goal 30 days', check: () => false },
    { id: 81, category: 'Nutrition', name: 'Macro Master', icon: Award, description: 'Hit macro goals 7 days', check: () => false },
    { id: 82, category: 'Nutrition', name: 'Calorie Counter', icon: User, description: 'Log calories for a week', check: () => false },

    // === TIME & DEDICATION (83-92) ===
    { id: 83, category: 'Time', name: 'New Member', icon: User, description: 'Be a member for 1 week', check: () => false },
    { id: 84, category: 'Time', name: 'One Month In', icon: User, description: 'Be a member for 1 month', check: () => false },
    { id: 85, category: 'Time', name: 'Three Months', icon: User, description: 'Be a member for 3 months', check: () => false },
    { id: 86, category: 'Time', name: 'Half Year', icon: User, description: 'Be a member for 6 months', check: () => false },
    { id: 87, category: 'Time', name: 'Anniversary', icon: Award, description: 'Be a member for 1 year', check: () => false },
    { id: 88, category: 'Time', name: 'Two Years Strong', icon: Award, description: 'Be a member for 2 years', check: () => false },
    { id: 89, category: 'Time', name: 'Veteran Member', icon: Award, description: 'Be a member for 3 years', check: () => false },
    { id: 90, category: 'Time', name: 'OG Member', icon: Award, description: 'Be a member for 5 years', check: () => false },

    // === SPECIAL & MISC (91-100) ===
    { id: 91, category: 'Special', name: 'Night Owl', icon: Star, description: 'Complete a workout after 10 PM', check: () => false },
    { id: 92, category: 'Special', name: 'Early Bird', icon: Star, description: 'Complete a workout before 6 AM', check: () => false },
    { id: 93, category: 'Special', name: 'Weekend Warrior', icon: Star, description: 'Workout on both Saturday and Sunday', check: () => false },
    { id: 94, category: 'Special', name: 'Explorer', icon: Star, description: 'Try 10 different exercises', check: () => false },
    { id: 95, category: 'Special', name: 'Variety King', icon: Star, description: 'Try 25 different exercises', check: () => false },
    { id: 96, category: 'Special', name: 'Exercise Master', icon: Award, description: 'Try 50 different exercises', check: () => false },
    { id: 97, category: 'Special', name: 'Marathon Session', icon: Star, description: 'Complete a 90+ minute workout', check: () => false },
    { id: 98, category: 'Special', name: 'Quick & Efficient', icon: Star, description: 'Complete 10 workouts under 30 min', check: () => false },
    { id: 99, category: 'Special', name: 'Perfectionist', icon: Award, description: 'Complete all sets in a workout', check: () => false },
    { id: 100, category: 'Special', name: 'Ultimate Achiever', icon: Award, description: 'Unlock 50 achievements', check: () => false },
  ];

  // Group achievements by category
  const achievementCategories = ['Workouts', 'Streaks', 'PRs', 'Profile', 'Social', 'Challenges', 'Nutrition', 'Time', 'Special'];

  // Calculate unlocked achievements
  const unlockedAchievements = achievementDefinitions.filter(a => a.check());
  const achievements = achievementDefinitions.slice(0, 8); // Show first 8 in grid

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7} style={styles.avatarWrapper}>
            <View style={styles.avatarLarge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Image source={require('../../assets/logo.png')} style={styles.avatarFallbackLogo} resizeMode="contain" />
              )}
            </View>
            <View style={styles.avatarPlusBadge}>
              <Text style={styles.avatarPlusBadgeText}>+</Text>
            </View>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleWebFileSelect}
              style={{ display: 'none' }}
            />
          )}

          <Text style={styles.username}>@{profile?.username || 'test'}</Text>
          <Text style={styles.displayName}>{getDisplayName()}</Text>

          {/* Followers / Following */}
          <View style={styles.followRow}>
            <TouchableOpacity style={styles.followItem} onPress={() => navigation.navigate('Community', { initialTab: 'profile' })} activeOpacity={0.7}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>followers</Text>
            </TouchableOpacity>
            <View style={styles.followDivider} />
            <TouchableOpacity style={styles.followItem} onPress={() => navigation.navigate('Community', { initialTab: 'profile' })} activeOpacity={0.7}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>following</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* EXPERIENCE LEVEL Section */}
        <Text style={styles.sectionLabel}>EXPERIENCE LEVEL</Text>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setShowExperienceModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>
              {EXPERIENCE_LEVELS[experienceLevel]?.label || 'Novice'}
            </Text>
            <Text style={styles.menuSubtitle}>
              {EXPERIENCE_LEVELS[experienceLevel]?.desc || 'Learning the basics (6-18 months)'}
            </Text>
            <View style={styles.experienceBars}>
              {['beginner', 'novice', 'experienced', 'expert'].map((level, index) => {
                const levelOrder = { beginner: 0, novice: 1, experienced: 2, expert: 3 };
                const currentLevelIndex = levelOrder[experienceLevel] ?? 1;
                const isFilled = index <= currentLevelIndex;
                return (
                  <View
                    key={level}
                    style={[
                      styles.experienceBar,
                      isFilled && styles.experienceBarFilled,
                    ]}
                  />
                );
              })}
            </View>
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
          <Text style={styles.achievementsCount}>{unlockedAchievements.length}/{achievementDefinitions.length} unlocked</Text>
        </View>
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              const isUnlocked = achievement.check();
              return (
                <TouchableOpacity
                  key={achievement.id}
                  style={styles.achievementItem}
                  onPress={() => setSelectedAchievement(achievement)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.achievementIcon, isUnlocked && styles.achievementIconUnlocked]}>
                    <Icon size={24} color={isUnlocked ? COLORS.primary : COLORS.textMuted} />
                  </View>
                  <Text style={[styles.achievementName, isUnlocked && styles.achievementNameUnlocked]} numberOfLines={1}>{achievement.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => setShowAchievementsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All {achievementDefinitions.length} Achievements</Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS Section */}
        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          {/* Dark Mode Toggle */}
          <View style={styles.settingsItem}>
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Dark Mode</Text>
              <Text style={styles.settingsSubLabel}>{isDark ? 'Dark theme active' : 'Light theme active'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
              thumbColor={COLORS.text}
            />
          </View>

          {/* Units */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowUnitsModal(true)} activeOpacity={0.7}>
            <Text style={styles.settingsLabel}>Units</Text>
            <Text style={styles.settingsValue}>{units === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowNotificationsModal(true)} activeOpacity={0.7}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowPrivacyModal(true)} activeOpacity={0.7}>
            <Text style={styles.settingsLabel}>Privacy</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Tracking Preferences */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowTrackingModal(true)} activeOpacity={0.7}>
            <Text style={styles.settingsLabel}>Tracking Preferences</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Suggested Rest Timer */}
          <View style={styles.settingsItem}>
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
            <View style={styles.settingsLabelContainer}>
              <Text style={styles.settingsLabel}>Base Lifts</Text>
              <Text style={styles.settingsSubLabel}>{countBaseLifts()} lifts set for weight estimation</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

        </View>

        {/* Data & Import Section */}
        <Text style={styles.sectionLabelLarge}>Data & Import</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setShowImportModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingsItemLeft}>
              <Upload size={20} color={COLORS.primary} />
              <Text style={[styles.settingsLabel, { marginLeft: 12 }]}>Import Workout History</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomWidth: 0 }]}
            onPress={() => setShowTemplateImportModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingsItemLeft}>
              <FileText size={20} color={COLORS.primary} />
              <Text style={[styles.settingsLabel, { marginLeft: 12 }]}>Import Workout Templates</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <Text style={styles.sectionLabelLarge}>Support</Text>
        <View style={styles.settingsCard}>
          {/* Help Center */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowHelpModal(true)} activeOpacity={0.7}>
            <Text style={styles.settingsLabel}>Help Center</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Send Feedback */}
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowFeedbackModal(true)} activeOpacity={0.7}>
            <Text style={styles.settingsLabel}>Send Feedback</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('https://www.uprep.com.au/privacy/', '_blank');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsLabel}>Privacy Policy</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('https://www.uprep.com.au/terms/', '_blank');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsLabel}>Terms of Service</Text>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* About UpRep */}
          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={() => setShowAboutModal(true)} activeOpacity={0.7}>
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
              <Smartphone size={18} color={COLORS.text} />
              <Text style={styles.storeBtnText}>iOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storeBtn} onPress={() => showToast('Google Play link coming soon!', 'info')} activeOpacity={0.7}>
              <Smartphone size={18} color={COLORS.text} />
              <Text style={styles.storeBtnText}>Android</Text>
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

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose which notifications you want to receive
            </Text>

            {[
              { id: 'workoutReminders', label: 'Workout Reminders', desc: "Get reminded when it's time to train" },
              { id: 'progressUpdates', label: 'Progress Updates', desc: 'Weekly summaries and milestone alerts' },
              { id: 'socialActivity', label: 'Social Activity', desc: 'Friend requests, likes, and comments' },
              { id: 'weeklyReport', label: 'Weekly Report', desc: 'Detailed weekly performance report' },
            ].map((notif) => (
              <View key={notif.id} style={styles.notifItem}>
                <View style={styles.notifInfo}>
                  <Text style={styles.notifLabel}>{notif.label}</Text>
                  <Text style={styles.notifDesc}>{notif.desc}</Text>
                </View>
                <Switch
                  value={notificationSettings[notif.id]}
                  onValueChange={(value) =>
                    setNotificationSettings((prev) => ({ ...prev, [notif.id]: value }))
                  }
                  trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
                  thumbColor={COLORS.text}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowNotificationsModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Privacy</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Control who can see your profile and activity
            </Text>

            {/* Private Account Toggle */}
            <View style={styles.notifItem}>
              <View style={styles.notifInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} color={COLORS.primary} />
                  <Text style={styles.notifLabel}>Private Account</Text>
                </View>
                <Text style={styles.notifDesc}>When enabled, people must request to follow you</Text>
              </View>
              <Switch
                value={privateAccount}
                onValueChange={handlePrivateAccountToggle}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
                thumbColor={COLORS.text}
              />
            </View>

            <View style={styles.notifItem}>
              <View style={styles.notifInfo}>
                <Text style={styles.notifLabel}>Auto-Share Workouts</Text>
                <Text style={styles.notifDesc}>Default the "Share to Community" toggle on after completing a workout</Text>
              </View>
              <Switch
                value={shareWorkoutsEnabled}
                onValueChange={async (value) => {
                  setShareWorkoutsEnabled(value);
                  try {
                    await AsyncStorage.setItem('@share_workouts_enabled', value.toString());
                  } catch (e) {
                    console.log('Error saving share setting:', e);
                  }
                }}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
                thumbColor={COLORS.text}
              />
            </View>

            {[
              { id: 'profileVisible', label: 'Public Profile', desc: 'Allow others to find and view your profile' },
              { id: 'showActivity', label: 'Show Activity', desc: 'Share your workouts in the activity feed' },
              { id: 'showProgress', label: 'Show Progress', desc: 'Display weight and body stats to friends' },
            ].map((privacy) => (
              <View key={privacy.id} style={styles.notifItem}>
                <View style={styles.notifInfo}>
                  <Text style={styles.notifLabel}>{privacy.label}</Text>
                  <Text style={styles.notifDesc}>{privacy.desc}</Text>
                </View>
                <Switch
                  value={privacySettings[privacy.id]}
                  onValueChange={(value) =>
                    setPrivacySettings((prev) => ({ ...prev, [privacy.id]: value }))
                  }
                  trackColor={{ false: COLORS.surfaceLight, true: COLORS.success }}
                  thumbColor={COLORS.text}
                />
              </View>
            ))}

            <View style={styles.privacyNote}>
              <Lock size={16} color={COLORS.primary} />
              <Text style={styles.privacyNoteText}>
                Your workout data is always private and encrypted. These settings only control what friends can see.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAchievementsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAchievementsModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Achievements</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.achievementsModalSubtitle}>
              {unlockedAchievements.length}/{achievementDefinitions.length} unlocked
            </Text>

            {achievementCategories.map(category => {
              const categoryAchievements = achievementDefinitions.filter(a => a.category === category);
              const unlockedInCategory = categoryAchievements.filter(a => a.check()).length;
              return (
                <View key={category}>
                  <View style={styles.achievementCategoryHeader}>
                    <Text style={styles.achievementCategoryTitle}>{category}</Text>
                    <Text style={styles.achievementCategoryCount}>{unlockedInCategory}/{categoryAchievements.length}</Text>
                  </View>
                  {categoryAchievements.map((achievement) => {
                    const Icon = achievement.icon;
                    const isUnlocked = achievement.check();
                    return (
                      <TouchableOpacity
                        key={achievement.id}
                        style={styles.achievementModalRow}
                        onPress={() => {
                          setShowAchievementsModal(false);
                          setSelectedAchievement(achievement);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.achievementModalIcon, isUnlocked && styles.achievementIconUnlocked]}>
                          <Icon size={24} color={isUnlocked ? COLORS.primary : COLORS.textMuted} />
                        </View>
                        <View style={styles.achievementModalInfo}>
                          <Text style={[styles.achievementModalName, isUnlocked && { color: COLORS.text }]}>
                            {achievement.name}
                          </Text>
                          <Text style={styles.achievementModalDescription}>
                            {achievement.description}
                          </Text>
                        </View>
                        {isUnlocked && (
                          <View style={styles.achievementUnlockedBadge}>
                            <Text style={styles.achievementUnlockedText}>Unlocked</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Single Achievement Detail Modal */}
      <Modal
        visible={!!selectedAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.achievementDetailOverlay}>
          <View style={styles.achievementDetailContent}>
            {selectedAchievement && (() => {
              const Icon = selectedAchievement.icon;
              const isUnlocked = selectedAchievement.check();
              return (
                <>
                  <View style={[styles.achievementDetailIcon, isUnlocked && styles.achievementDetailIconUnlocked]}>
                    <Icon size={40} color={isUnlocked ? COLORS.primary : COLORS.textMuted} />
                  </View>
                  <Text style={styles.achievementDetailName}>{selectedAchievement.name}</Text>
                  <Text style={styles.achievementDetailDescription}>{selectedAchievement.description}</Text>
                  {isUnlocked ? (
                    <View style={styles.achievementDetailUnlockedBadge}>
                      <Text style={styles.achievementDetailUnlockedText}>Unlocked</Text>
                    </View>
                  ) : (
                    <View style={styles.achievementDetailLockedBadge}>
                      <Text style={styles.achievementDetailLockedText}>Locked</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.achievementDetailCloseBtn}
                    onPress={() => setSelectedAchievement(null)}
                  >
                    <Text style={styles.achievementDetailCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalContent}>
            <View style={styles.feedbackModalHeader}>
              <Text style={styles.feedbackModalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.feedbackLabel}>Type</Text>
            <View style={styles.feedbackTypeRow}>
              {['suggestion', 'bug', 'other'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.feedbackTypeBtn, feedbackType === type && styles.feedbackTypeBtnActive]}
                  onPress={() => setFeedbackType(type)}
                >
                  <Text style={[styles.feedbackTypeBtnText, feedbackType === type && styles.feedbackTypeBtnTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.feedbackLabel}>Message</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
            />

            <TouchableOpacity
              style={[styles.feedbackSubmitBtn, feedbackSubmitting && { opacity: 0.6 }]}
              onPress={submitFeedback}
              disabled={feedbackSubmitting}
            >
              <Text style={styles.feedbackSubmitBtnText}>
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help Center Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Help Center</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.helpSectionTitle}>Getting Started</Text>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I start a workout?</Text>
              <Text style={styles.helpAnswer}>Go to the Workouts tab, select a workout template or create a custom workout, then tap "Start Workout".</Text>
            </View>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I track my food?</Text>
              <Text style={styles.helpAnswer}>On the Home screen, tap "Add Meal" to log food with macros, or use "Quick Water" to track hydration.</Text>
            </View>

            <Text style={styles.helpSectionTitle}>Workouts</Text>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I create a custom workout?</Text>
              <Text style={styles.helpAnswer}>In the Workouts tab, tap the "+" button to create a new template. Add exercises, set reps and sets, then save.</Text>
            </View>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>What is a superset?</Text>
              <Text style={styles.helpAnswer}>A superset is two exercises performed back-to-back with no rest. Tap "Add Superset" when building a workout.</Text>
            </View>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I see my workout history?</Text>
              <Text style={styles.helpAnswer}>Go to the Progress tab to see all your past workouts, personal records, and stats.</Text>
            </View>

            <Text style={styles.helpSectionTitle}>Community</Text>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I follow other users?</Text>
              <Text style={styles.helpAnswer}>In the Community tab, search for users or browse suggestions. Tap "Follow" on their profile.</Text>
            </View>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do challenges work?</Text>
              <Text style={styles.helpAnswer}>Join or create challenges in the Community tab. Complete the goal (workouts, volume, etc.) before the deadline to win!</Text>
            </View>

            <Text style={styles.helpSectionTitle}>Account</Text>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I change my units?</Text>
              <Text style={styles.helpAnswer}>Go to Profile → Settings → Units to switch between metric (kg) and imperial (lbs).</Text>
            </View>
            <View style={styles.helpCard}>
              <Text style={styles.helpQuestion}>How do I log out?</Text>
              <Text style={styles.helpAnswer}>Scroll to the bottom of your Profile page and tap "Log Out".</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* About UpRep Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAboutModal(false)}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>About UpRep</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
            <Image source={require('../../assets/logo.png')} style={styles.aboutLogo} resizeMode="contain" />
            <Text style={styles.aboutAppName}>UpRep</Text>
            <Text style={styles.aboutVersion}>Version 5.0.0</Text>

            <Text style={styles.aboutDescription}>
              UpRep is your all-in-one fitness companion. Track workouts, monitor nutrition, set personal records, and connect with a community of fitness enthusiasts.
            </Text>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Features</Text>
              <Text style={styles.aboutFeature}>• Workout tracking with custom templates</Text>
              <Text style={styles.aboutFeature}>• Personal record tracking</Text>
              <Text style={styles.aboutFeature}>• Nutrition and macro logging</Text>
              <Text style={styles.aboutFeature}>• Water intake tracking</Text>
              <Text style={styles.aboutFeature}>• Progress analytics and charts</Text>
              <Text style={styles.aboutFeature}>• Social features and challenges</Text>
              <Text style={styles.aboutFeature}>• 500+ exercise library</Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Built With</Text>
              <Text style={styles.aboutFeature}>React Native & Expo</Text>
              <Text style={styles.aboutFeature}>Supabase Backend</Text>
            </View>

            <Text style={styles.aboutCopyright}>© 2024 UpRep. All rights reserved.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Import CSV Modal */}
      <Modal visible={showImportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.importModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Workout History</Text>
              <TouchableOpacity onPress={() => { setShowImportModal(false); setImportResult(null); }}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.importModalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.importInstructions}>
                <FileText size={48} color={COLORS.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.importTitle}>Upload Your Workout File</Text>
                <Text style={styles.importDescription}>
                  Import your workout history from other apps, Google Sheets, or Excel spreadsheets. Supports CSV, XLSX, and XLS files.
                </Text>
              </View>

              <View style={styles.importFormatSection}>
                <Text style={styles.importFormatTitle}>Supported Formats</Text>
                <Text style={styles.importFormatText}>
                  Works with Excel (.xlsx, .xls), Google Sheets (download as .xlsx or .csv), and exports from Strong, Hevy, JEFIT, and most fitness apps. We auto-detect columns including:
                </Text>
                <View style={styles.importFormatList}>
                  <Text style={styles.importFormatItem}>• <Text style={styles.importFormatBold}>Exercise</Text> - name, movement, lift, activity</Text>
                  <Text style={styles.importFormatItem}>• <Text style={styles.importFormatBold}>Date</Text> - any common format (01/15/2024, 2024-01-15, etc.)</Text>
                  <Text style={styles.importFormatItem}>• <Text style={styles.importFormatBold}>Weight</Text> - kg or lbs (auto-converted)</Text>
                  <Text style={styles.importFormatItem}>• <Text style={styles.importFormatBold}>Reps</Text> - repetitions, rep count</Text>
                  <Text style={styles.importFormatItem}>• <Text style={styles.importFormatBold}>Sets</Text> - number of sets (optional)</Text>
                  <Text style={styles.importFormatItem}>• <Text style={styles.importFormatBold}>RPE</Text> - rate of perceived exertion (optional)</Text>
                </View>
                <Text style={styles.importFormatSubtext}>
                  Columns can be in any order. Extra columns are ignored.
                </Text>
              </View>

              {importLoading && (
                <View style={styles.importLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.importLoadingText}>Importing workouts...</Text>
                </View>
              )}

              {importResult && !importLoading && (
                <View style={[
                  styles.importResultContainer,
                  importResult.success ? styles.importResultSuccess : styles.importResultError
                ]}>
                  {importResult.success ? (
                    <>
                      <Check size={24} color="#10B981" />
                      <Text style={styles.importResultSuccessText}>
                        Successfully imported {importResult.sessions} workouts with {importResult.sets} sets!
                      </Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={24} color="#EF4444" />
                      <Text style={styles.importResultErrorText}>{importResult.error}</Text>
                    </>
                  )}
                </View>
              )}

              {Platform.OS === 'web' && (
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              )}

              <TouchableOpacity
                style={[styles.importButton, importLoading && styles.importButtonDisabled]}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    csvInputRef.current?.click();
                  } else {
                    showToast('CSV import available on web version', 'info');
                  }
                }}
                disabled={importLoading}
              >
                <Upload size={20} color="#FFF" />
                <Text style={styles.importButtonText}>
                  {importLoading ? 'Importing...' : 'Select File (.csv, .xlsx, .xls)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Template Import Modal */}
      <Modal visible={showTemplateImportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.importModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Workout Templates</Text>
              <TouchableOpacity onPress={() => { setShowTemplateImportModal(false); setTemplateImportResult(null); setParsedWorkouts(null); }}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.importModalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.importInstructions}>
                <FileText size={48} color={COLORS.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.importTitle}>Import a Workout Program</Text>
                <Text style={styles.importDescription}>
                  Use our template to build your own program, or upload any gym program spreadsheet (like Jeff Nippard, GZCL, etc.) and we'll try to read it automatically.
                </Text>
              </View>

              <View style={styles.importFormatSection}>
                <Text style={styles.importFormatTitle}>Option 1: Use Our Template</Text>
                <Text style={styles.importFormatText}>
                  Download the template, fill in your exercises (each row is one set with its own weight and reps), then upload it below.
                </Text>
                <TouchableOpacity
                  style={[styles.importButton, { backgroundColor: '#F59E0B', marginBottom: 0, marginTop: 8 }]}
                  onPress={handleDownloadTemplate}
                >
                  <Download size={20} color="#FFF" />
                  <Text style={styles.importButtonText}>Download Template</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.importFormatSection, { marginTop: 16 }]}>
                <Text style={styles.importFormatTitle}>Option 2: Upload Any Program</Text>
                <Text style={styles.importFormatText}>
                  Already have a program spreadsheet? Upload it directly — we'll auto-detect the layout, weeks, exercises, and weights. Supports .xlsx and .csv files.
                </Text>
              </View>

              {templateImportLoading && (
                <View style={styles.importLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.importLoadingText}>
                    {parsedWorkouts ? 'Saving to repertoire...' : 'Reading spreadsheet...'}
                  </Text>
                </View>
              )}

              {/* Preview parsed workouts — user confirms before saving */}
              {parsedWorkouts && !templateImportLoading && !templateImportResult && (
                <View style={[styles.importResultContainer, { backgroundColor: COLORS.surface, borderColor: COLORS.primary, borderWidth: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.importResultSuccessText, { color: COLORS.text, fontWeight: '700', fontSize: 16, marginBottom: 4 }]}>
                      Found {parsedWorkouts.names.length} workout{parsedWorkouts.names.length > 1 ? 's' : ''}
                    </Text>
                    {parsedWorkouts.hasWeeks ? (
                      Object.entries(
                        parsedWorkouts.names.reduce((acc, name) => {
                          const weekMatch = name.match(/^W(\d+)\s*-\s*/);
                          const week = weekMatch ? `Week ${weekMatch[1]}` : 'General';
                          if (!acc[week]) acc[week] = [];
                          acc[week].push(weekMatch ? name.replace(/^W\d+\s*-\s*/, '') : name);
                          return acc;
                        }, {})
                      ).map(([week, names], wi) => (
                        <View key={wi} style={{ marginTop: 6 }}>
                          <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '600' }}>{week}</Text>
                          {names.map((name, ni) => (
                            <Text key={ni} style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 1, marginLeft: 8 }}>
                              {'\u2022'} {name} ({parsedWorkouts.workouts[`W${week.replace('Week ', '')} - ${name}`]?.length || '?'} exercises)
                            </Text>
                          ))}
                        </View>
                      ))
                    ) : (
                      parsedWorkouts.names.map((name, i) => (
                        <Text key={i} style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>
                          {'\u2022'} {name} ({parsedWorkouts.workouts[name]?.length || 0} exercises)
                        </Text>
                      ))
                    )}
                    <TouchableOpacity
                      style={[styles.importButton, { marginTop: 12, marginBottom: 0, backgroundColor: COLORS.success }]}
                      onPress={handleSaveParsedWorkouts}
                    >
                      <Check size={20} color="#FFF" />
                      <Text style={styles.importButtonText}>Save to Repertoire</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 6 }}
                      onPress={() => setParsedWorkouts(null)}
                    >
                      <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Final result after saving */}
              {templateImportResult && !templateImportLoading && (
                <View style={[
                  styles.importResultContainer,
                  templateImportResult.success ? styles.importResultSuccess : styles.importResultError
                ]}>
                  {templateImportResult.success ? (
                    <>
                      <Check size={24} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.importResultSuccessText}>
                          Saved {templateImportResult.names.length} workout template{templateImportResult.names.length > 1 ? 's' : ''} to your repertoire!
                        </Text>
                        {templateImportResult.hasWeeks ? (
                          Object.entries(
                            templateImportResult.names.reduce((acc, name) => {
                              const weekMatch = name.match(/^W(\d+)\s*-\s*/);
                              const week = weekMatch ? `Week ${weekMatch[1]}` : 'General';
                              if (!acc[week]) acc[week] = [];
                              acc[week].push(weekMatch ? name.replace(/^W\d+\s*-\s*/, '') : name);
                              return acc;
                            }, {})
                          ).map(([week, names], wi) => (
                            <View key={wi} style={{ marginTop: 6 }}>
                              <Text style={[styles.importResultSuccessText, { fontSize: 13, fontWeight: '600' }]}>{week}</Text>
                              {names.map((name, ni) => (
                                <Text key={ni} style={[styles.importResultSuccessText, { fontSize: 12, marginTop: 1, marginLeft: 8 }]}>
                                  {'\u2022'} {name}
                                </Text>
                              ))}
                            </View>
                          ))
                        ) : (
                          templateImportResult.names.map((name, i) => (
                            <Text key={i} style={[styles.importResultSuccessText, { fontSize: 13, marginTop: 2 }]}>
                              {'\u2022'} {name}
                            </Text>
                          ))
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={24} color="#EF4444" />
                      <Text style={styles.importResultErrorText}>{templateImportResult.error}</Text>
                    </>
                  )}
                </View>
              )}

              {Platform.OS === 'web' && (
                <input
                  ref={templateInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleTemplateFileSelect}
                  style={{ display: 'none' }}
                />
              )}

              <TouchableOpacity
                style={[styles.importButton, (templateImportLoading || parsedWorkouts) && styles.importButtonDisabled]}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    templateInputRef.current?.click();
                  } else {
                    showToast('Template import available on web version', 'info');
                  }
                }}
                disabled={templateImportLoading || !!parsedWorkouts}
              >
                <Upload size={20} color="#FFF" />
                <Text style={styles.importButtonText}>
                  {templateImportLoading ? 'Processing...' : 'Upload Filled Template'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

const getStyles = (COLORS) => StyleSheet.create({
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
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallbackLogo: {
    width: 60,
    height: 60,
    opacity: 0.7,
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
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
  experienceBars: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  experienceBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceLight,
  },
  experienceBarFilled: {
    backgroundColor: COLORS.primary,
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
  achievementIconUnlocked: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  achievementNameUnlocked: {
    color: COLORS.text,
    fontWeight: '600',
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
  achievementsModalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  achievementCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  achievementCategoryTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  achievementCategoryCount: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  achievementModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  achievementModalIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementModalInfo: {
    flex: 1,
  },
  achievementModalName: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementModalDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  achievementUnlockedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  achievementUnlockedText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  achievementDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  achievementDetailContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  achievementDetailIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementDetailIconUnlocked: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  achievementDetailName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDetailDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  achievementDetailUnlockedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  achievementDetailUnlockedText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  achievementDetailLockedBadge: {
    backgroundColor: COLORS.textMuted + '20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  achievementDetailLockedText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  achievementDetailCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  achievementDetailCloseBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  feedbackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  feedbackLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  feedbackTypeBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  feedbackTypeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  feedbackTypeBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackTypeBtnTextActive: {
    color: COLORS.textOnPrimary,
  },
  feedbackInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 16,
  },
  feedbackSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  feedbackSubmitBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  helpSectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  helpCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  helpQuestion: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  helpAnswer: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    marginTop: 20,
    marginBottom: 16,
  },
  aboutAppName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutVersion: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  aboutDescription: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  aboutSection: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  aboutSectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  aboutFeature: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 6,
  },
  aboutCopyright: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 32,
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
    color: COLORS.textOnPrimary,
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
  // Notification & Privacy Modals
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notifInfo: {
    flex: 1,
    marginRight: 16,
  },
  notifLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  notifDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  privacyNoteText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  modalDoneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Import Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  importModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
  },
  importModalBody: {
    padding: 20,
  },
  importInstructions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  importTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  importDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  importFormatSection: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  importFormatTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  importFormatText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  importFormatList: {
    marginBottom: 12,
  },
  importFormatItem: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 22,
  },
  importFormatBold: {
    color: COLORS.text,
    fontWeight: '600',
  },
  importFormatSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  importLoadingContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  importLoadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  importResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  importResultSuccess: {
    backgroundColor: '#10B98120',
  },
  importResultError: {
    backgroundColor: '#EF444420',
  },
  importResultSuccessText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  importResultErrorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProfileScreen;
