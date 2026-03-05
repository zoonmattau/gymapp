import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  Dumbbell,
  Moon,
  User,
  Scale,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useColors } from '../contexts/ThemeContext';
import { GOAL_INFO, GOAL_TO_PROGRAM, PROGRAM_TEMPLATES } from '../constants/goals';
import { EXPERIENCE_LEVELS } from '../constants/experience';
import { WORKOUT_TEMPLATES } from '../constants/workoutTemplates';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { workoutService } from '../services/workoutService';
import DetailedAnatomy from '../components/DetailedAnatomy';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 1, title: 'Create your profile', subtitle: 'Choose a username your friends will see' },
  { id: 2, title: "What's your main goal?", subtitle: 'Select a goal, tap to learn more' },
  { id: 3, title: 'Set your weight goals', subtitle: "We'll create a safe, sustainable plan" },
  { id: 4, title: 'Your experience level?', subtitle: 'How long have you been training?' },
  { id: 5, title: 'What can you lift?', subtitle: 'Enter weights for exercises you do (optional)' },
  { id: 6, title: 'What equipment do you have?', subtitle: "We'll customize exercises to match your gym" },
  { id: 7, title: 'Set your sleep goal', subtitle: 'Good sleep is essential for recovery and results' },
];

// Build GOALS array from GOAL_INFO constants
const GOALS = [
  {
    id: 'bulk',
    title: GOAL_INFO.bulk.title,
    subtitle: 'Maximize size & strength',
    icon: TrendingUp,
    color: COLORS.success,
    description: GOAL_INFO.bulk.overview,
    minDays: GOAL_INFO.bulk.minDays,
    idealDays: GOAL_INFO.bulk.idealDays,
  },
  {
    id: 'build_muscle',
    title: GOAL_INFO.build_muscle.title,
    subtitle: 'Build lean muscle',
    icon: Dumbbell,
    color: COLORS.primary,
    description: GOAL_INFO.build_muscle.overview,
    minDays: GOAL_INFO.build_muscle.minDays,
    idealDays: GOAL_INFO.build_muscle.idealDays,
  },
  {
    id: 'strength',
    title: GOAL_INFO.strength.title,
    subtitle: 'Increase your lifts',
    icon: Zap,
    color: COLORS.warning,
    description: GOAL_INFO.strength.overview,
    minDays: GOAL_INFO.strength.minDays,
    idealDays: GOAL_INFO.strength.idealDays,
  },
  {
    id: 'recomp',
    title: GOAL_INFO.recomp.title,
    subtitle: 'Build muscle & lose fat',
    icon: RefreshCw,
    color: '#9333EA',
    description: GOAL_INFO.recomp.overview,
    minDays: GOAL_INFO.recomp.minDays,
    idealDays: GOAL_INFO.recomp.idealDays,
  },
  {
    id: 'lean',
    title: GOAL_INFO.lean.title,
    subtitle: 'Get lean & defined',
    icon: TrendingDown,
    color: COLORS.accent,
    description: GOAL_INFO.lean.overview,
    minDays: GOAL_INFO.lean.minDays,
    idealDays: GOAL_INFO.lean.idealDays,
  },
  {
    id: 'lose_fat',
    title: GOAL_INFO.lose_fat.title,
    subtitle: 'Aggressive fat loss',
    icon: Target,
    color: '#EF4444',
    description: GOAL_INFO.lose_fat.overview,
    minDays: GOAL_INFO.lose_fat.minDays,
    idealDays: GOAL_INFO.lose_fat.idealDays,
  },
];

// Build experience levels from constants
const EXPERIENCE_OPTIONS = Object.values(EXPERIENCE_LEVELS).map(level => ({
  id: level.id,
  title: level.label,
  subtitle: level.desc,
  icon: level.icon,
  description: level.workoutComplexity === 'basic'
    ? 'Focus on learning proper form and building habits with simpler workouts.'
    : 'Advanced techniques and higher training loads with muscle head specificity.',
}));


const EQUIPMENT = [
  { id: 'dumbbells', name: 'Dumbbells' },
  { id: 'barbells', name: 'Barbells' },
  { id: 'cables', name: 'Cable Machine' },
  { id: 'kettlebells', name: 'Kettlebells' },
  { id: 'bands', name: 'Resistance Bands' },
  { id: 'smith', name: 'Smith Machine' },
  { id: 'pullup_bar', name: 'Pull-up Bar' },
  { id: 'bench', name: 'Adjustable Bench' },
];

const OnboardingScreen = ({ navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, refreshProfile, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showExpInfo, setShowExpInfo] = useState(false);
  const sleepSliderRef = useRef(null);
  const sleepSliderWidth = useRef(0);
  const isDragging = useRef(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Profile
    username: '',
    gender: '',
    bio: '',

    // Step 2: Goal
    goal: '',
    expandedGoal: null,

    // Step 3: Weight
    currentWeight: '',
    goalWeight: '',
    weightUnit: 'kg',

    // Step 4: Experience
    experienceLevel: '',

    // Step 5: Base Lifts (weight and reps)
    lifts: {},

    // Step 6: Equipment
    equipment: ['dumbbells', 'barbells'],

    // Step 7: Sleep
    sleepGoal: 8,
  });

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateLift = (liftId, value) => {
    setFormData(prev => ({
      ...prev,
      lifts: { ...prev.lifts, [liftId]: value },
    }));
  };

  const toggleEquipment = (equipmentId) => {
    setFormData(prev => {
      const current = prev.equipment;
      if (current.includes(equipmentId)) {
        return { ...prev, equipment: current.filter(e => e !== equipmentId) };
      } else {
        return { ...prev, equipment: [...current, equipmentId] };
      }
    });
  };

  const handleSleepSliderTouch = useCallback((e) => {
    if (!sleepSliderRef.current) return;
    sleepSliderRef.current.measure((x, y, width) => {
      const touch = e.nativeEvent.locationX ?? e.nativeEvent.touches?.[0]?.locationX;
      if (touch != null && width > 0) {
        const ratio = Math.max(0, Math.min(1, touch / width));
        const hours = Math.round(5 + ratio * 7);
        updateForm('sleepGoal', Math.min(12, Math.max(5, hours)));
      }
    });
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.username && formData.username.length >= 3;
      case 2:
        return formData.goal !== '';
      case 3:
        return formData.currentWeight !== '' && formData.goalWeight !== '';
      case 4:
        return formData.experienceLevel !== '';
      case 5:
        return true; // Optional - base lifts
      case 6:
        return formData.equipment.length > 0;
      case 7:
        return true; // Sleep has default value
      default:
        return false;
    }
  };

  // Steps that can be skipped entirely (all except step 1 - username required)
  const canSkipStep = () => {
    return currentStep > 1;
  };

  const handleSkip = () => {
    // Move to next step without requiring completion
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateWorkoutSchedule = async (userId, goal, daysPerWeek = 4) => {
    try {
      const program = GOAL_TO_PROGRAM[goal];
      if (!program) {
        console.log('No program found for goal:', goal);
        return;
      }

      const templateIds = PROGRAM_TEMPLATES[program.id];
      if (!templateIds || templateIds.length === 0) {
        console.log('No templates found for program:', program.id);
        return;
      }

      // Generate schedule for the next 4 weeks
      const today = new Date();
      let templateIndex = 0;
      let workoutDayCount = 0;

      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const scheduleDate = new Date(today);
          scheduleDate.setDate(today.getDate() + (week * 7) + day);

          const dayOfWeek = scheduleDate.getDay(); // 0 = Sunday
          // Rest on Sunday (0) by default
          const isRestDay = dayOfWeek === 0 || workoutDayCount >= daysPerWeek;

          if (isRestDay) {
            // Skip - no schedule entry needed for rest days unless explicitly set
            if (dayOfWeek === 0) {
              // Sunday is always rest
              continue;
            }
          } else {
            // Schedule a workout
            const templateId = templateIds[templateIndex % templateIds.length];
            const template = WORKOUT_TEMPLATES[templateId];

            if (template) {
              const dateStr = formatDateForDB(scheduleDate);
              try {
                await workoutService.setScheduleForDate(userId, dateStr, templateId, false);
                templateIndex++;
                workoutDayCount++;
              } catch (e) {
                console.log('Error setting schedule for date:', dateStr, e);
              }
            }
          }

          // Reset workout count at end of week
          if (day === 6) {
            workoutDayCount = 0;
          }
        }
      }

      console.log('Generated workout schedule for', goal, 'with', program.name);
    } catch (error) {
      console.log('Error generating workout schedule:', error);
    }
  };

  const formatDateForDB = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleComplete = async () => {
    console.log('handleComplete called, user:', user?.id);
    if (saving) {
      console.log('Already saving, ignoring');
      return;
    }
    setSaving(true);

    try {
      // Only save fields that exist in the profiles table
      const updateData = {
        username: formData.username,
      };

      // Add optional fields that exist in profiles table
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.bio) updateData.bio = formData.bio;
      if (formData.currentWeight) updateData.current_weight = parseFloat(formData.currentWeight);
      if (formData.goalWeight) updateData.target_weight = parseFloat(formData.goalWeight);
      if (formData.weightUnit) updateData.weight_unit = formData.weightUnit;
      if (formData.experienceLevel) updateData.experience_level = formData.experienceLevel;
      if (formData.goal) updateData.fitness_goal = formData.goal;

      // Include onboarding_completed in the same profile update to avoid split writes
      updateData.onboarding_completed = true;

      console.log('Saving profile with data:', updateData);

      // Save profile data + onboarding flag in a single write
      try {
        const { error } = await profileService.updateProfile(user.id, updateData);
        if (error) {
          console.log('Profile update error:', error);
        }
      } catch (e) {
        console.log('Profile update error:', e);
      }

      // Generate workout schedule based on goal
      if (formData.goal) {
        const program = GOAL_TO_PROGRAM[formData.goal];
        const daysPerWeek = program?.days || 4;
        await generateWorkoutSchedule(user.id, formData.goal, daysPerWeek);
      }

      // Also save to local storage as backup
      const storageKey = Platform.OS === 'web'
        ? `onboarding_completed_${user.id}`
        : `@onboarding_completed_${user.id}`;
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, 'true');
      } else {
        await AsyncStorage.setItem(storageKey, 'true');
      }

      console.log('Onboarding marked complete, refreshing...');

      // Refresh profile to trigger navigation check
      await refreshProfile();

      setSaving(false);
    } catch (error) {
      console.log('Error in handleComplete:', error);
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out and use a different account?')) {
        await signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Sign out and use a different account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', onPress: () => signOut() },
        ]
      );
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <View style={styles.logoWrapper}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 7</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 7) * 100}%` }]} />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Create Your Profile</Text>
        <Text style={styles.stepSubtitle}>Choose a username your friends will see</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. fitwarrior_23"
          placeholderTextColor={COLORS.textMuted}
          value={formData.username}
          onChangeText={(v) => updateForm('username', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          autoCapitalize="none"
          maxLength={20}
        />
        <Text style={styles.inputHint}>Lowercase letters, numbers, and underscores only</Text>

        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {[
            { id: 'male', label: 'Male', icon: '👨' },
            { id: 'female', label: 'Female', icon: '👩' },
            { id: 'other', label: 'Other', icon: '🧑' },
          ].map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.genderButton, formData.gender === g.id && styles.genderButtonActive]}
              onPress={() => updateForm('gender', g.id)}
            >
              <Text style={styles.genderIcon}>{g.icon}</Text>
              <Text style={[styles.genderText, formData.gender === g.id && styles.genderTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Bio (optional)</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell others about your fitness journey..."
          placeholderTextColor={COLORS.textMuted}
          value={formData.bio || ''}
          onChangeText={(v) => updateForm('bio', v)}
          multiline
          maxLength={150}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            Your username will be visible to friends and in challenges. You can change it anytime.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What's Your Goal?</Text>
        <Text style={styles.stepSubtitle}>This helps us customize your program</Text>
      </View>

      <View style={styles.goalsContainer}>
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = formData.goal === goal.id;
          const isExpanded = formData.expandedGoal === goal.id;

          return (
            <View key={goal.id}>
              <TouchableOpacity
                style={[
                  styles.goalCard,
                  { borderLeftColor: goal.color },
                  isSelected && { borderColor: goal.color, backgroundColor: goal.color + '15' }
                ]}
                onPress={() => updateForm('goal', goal.id)}
              >
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.goalCheck, { backgroundColor: goal.color }]}>
                    <Check size={14} color={COLORS.textOnPrimary} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.goalExpandBtn}
                  onPress={() => updateForm('expandedGoal', isExpanded ? null : goal.id)}
                >
                  {isExpanded ? (
                    <ChevronUp size={20} color={COLORS.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.goalExpanded, { borderLeftColor: goal.color }]}>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                  <View style={styles.goalStats}>
                    <Text style={styles.goalStatText}>Min {goal.minDays} days/week</Text>
                    <Text style={styles.goalStatText}>Ideal {goal.idealDays} days/week</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Weight Goals</Text>
        <Text style={styles.stepSubtitle}>Where are you now and where do you want to be?</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>Current Weight ({formData.weightUnit})</Text>
        <TextInput
          style={styles.input}
          placeholder="75.5"
          placeholderTextColor={COLORS.textMuted}
          value={formData.currentWeight}
          onChangeText={(v) => updateForm('currentWeight', v)}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Goal Weight ({formData.weightUnit})</Text>
        <TextInput
          style={styles.input}
          placeholder="80.5"
          placeholderTextColor={COLORS.textMuted}
          value={formData.goalWeight}
          onChangeText={(v) => updateForm('goalWeight', v)}
          keyboardType="numeric"
        />

        {(() => {
          const current = parseFloat(formData.currentWeight) || 75.5;
          const goal = parseFloat(formData.goalWeight) || 80.5;
          const diff = Math.abs(goal - current);
          const isGaining = goal > current;
          const isExample = !formData.currentWeight || !formData.goalWeight;
          // Safe rate: ~0.5-1 kg/week for loss, ~0.5 kg/week for gain
          const weeklyRate = formData.weightUnit === 'kg'
            ? (isGaining ? 0.5 : 0.75)
            : (isGaining ? 1.0 : 1.5);
          const weeks = Math.ceil(diff / weeklyRate);
          // Muscle estimate: ~80% of weight gain, Fat loss: ~95% of weight loss
          const muscleGain = isGaining ? (diff * 0.8).toFixed(1) : null;
          const fatLoss = !isGaining ? (diff * 0.95).toFixed(1) : null;

          return (
            <View style={[styles.weightDiff, isExample && { opacity: 0.6 }]}>
              <Text style={styles.weightDiffText}>
                {diff.toFixed(1)} {formData.weightUnit} {isGaining ? 'to gain' : 'to lose'}
              </Text>
              {diff > 0 && (
                <>
                  <Text style={styles.weightDiffSubtext}>
                    ~{weeklyRate} {formData.weightUnit}/week • ~{weeks} {weeks === 1 ? 'week' : 'weeks'}
                  </Text>
                  {isGaining && (
                    <Text style={styles.weightDiffSubtext}>
                      Est. muscle gain: ~{muscleGain} {formData.weightUnit}
                    </Text>
                  )}
                  {!isGaining && (
                    <Text style={styles.weightDiffSubtext}>
                      Est. fat loss: ~{fatLoss} {formData.weightUnit}
                    </Text>
                  )}
                </>
              )}
            </View>
          );
        })()}

        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, formData.weightUnit === 'kg' && styles.unitButtonActive]}
            onPress={() => updateForm('weightUnit', 'kg')}
          >
            <Text style={[styles.unitText, formData.weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, formData.weightUnit === 'lbs' && styles.unitButtonActive]}
            onPress={() => updateForm('weightUnit', 'lbs')}
          >
            <Text style={[styles.unitText, formData.weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Experience Level</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.stepSubtitle}>How long have you been training?</Text>
          <TouchableOpacity onPress={() => setShowExpInfo(!showExpInfo)} style={styles.infoButton}>
            <Info size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        {showExpInfo && (
          <View style={styles.infoTooltip}>
            <Text style={styles.infoTooltipText}>
              UpRep uses your experience level to customize workout intensity, volume, and exercise selection.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.experienceContainer}>
        {EXPERIENCE_OPTIONS.map((level) => {
          const isSelected = formData.experienceLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[styles.experienceCard, isSelected && styles.experienceCardSelected]}
              onPress={() => updateForm('experienceLevel', level.id)}
            >
              <View style={styles.experienceHeader}>
                <View>
                  <Text style={styles.experienceTitle}>{level.title}</Text>
                  <Text style={styles.experienceSubtitle}>{level.subtitle}</Text>
                </View>
                {isSelected && (
                  <View style={styles.experienceCheck}>
                    <Check size={14} color={COLORS.textOnPrimary} />
                  </View>
                )}
              </View>
              <Text style={styles.experienceDesc}>{level.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What Can You Lift?</Text>
        <Text style={styles.stepSubtitle}>Enter weights for exercises you do (optional)</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.liftSectionLabel}>PUSH</Text>
        {[
          { id: 'bench', name: 'Bench Press', muscle: 'Chest', view: 'front' },
          { id: 'dbPress', name: 'Dumbbell Press', muscle: 'Chest', view: 'front' },
        ].map((lift) => (
          <View key={lift.id} style={styles.liftRow}>
            <View style={styles.liftContent}>
              <Text style={styles.liftLabel}>{lift.name}</Text>
              <View style={styles.liftInputContainer}>
                <TextInput
                  style={styles.liftInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.lifts[lift.id] || ''}
                  onChangeText={(v) => updateLift(lift.id, v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.liftUnit}>{formData.weightUnit} x</Text>
                <TextInput
                  style={styles.liftInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.lifts[lift.id + '_reps'] || ''}
                  onChangeText={(v) => updateLift(lift.id + '_reps', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.liftUnit}>reps</Text>
              </View>
            </View>
            <View style={styles.liftAnatomy}>
              <DetailedAnatomy view={lift.view} primaryMuscle={lift.muscle} width={40} />
            </View>
          </View>
        ))}

        <Text style={styles.liftSectionLabel}>PULL</Text>
        {[
          { id: 'deadlift', name: 'Deadlift', muscle: 'Back', view: 'back' },
          { id: 'row', name: 'Barbell Row', muscle: 'Back', view: 'back' },
        ].map((lift) => (
          <View key={lift.id} style={styles.liftRow}>
            <View style={styles.liftContent}>
              <Text style={styles.liftLabel}>{lift.name}</Text>
              <View style={styles.liftInputContainer}>
                <TextInput
                  style={styles.liftInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.lifts[lift.id] || ''}
                  onChangeText={(v) => updateLift(lift.id, v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.liftUnit}>{formData.weightUnit} x</Text>
                <TextInput
                  style={styles.liftInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.lifts[lift.id + '_reps'] || ''}
                  onChangeText={(v) => updateLift(lift.id + '_reps', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.liftUnit}>reps</Text>
              </View>
            </View>
            <View style={styles.liftAnatomy}>
              <DetailedAnatomy view={lift.view} primaryMuscle={lift.muscle} width={40} />
            </View>
          </View>
        ))}

        <Text style={styles.liftSectionLabel}>LEGS</Text>
        {[
          { id: 'squat', name: 'Squat', muscle: 'Quads', view: 'front' },
          { id: 'legPress', name: 'Leg Press', muscle: 'Quads', view: 'front' },
        ].map((lift) => (
          <View key={lift.id} style={styles.liftRow}>
            <View style={styles.liftContent}>
              <Text style={styles.liftLabel}>{lift.name}</Text>
              <View style={styles.liftInputContainer}>
                <TextInput
                  style={styles.liftInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.lifts[lift.id] || ''}
                  onChangeText={(v) => updateLift(lift.id, v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.liftUnit}>{formData.weightUnit} x</Text>
                <TextInput
                  style={styles.liftInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.lifts[lift.id + '_reps'] || ''}
                  onChangeText={(v) => updateLift(lift.id + '_reps', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
                <Text style={styles.liftUnit}>reps</Text>
              </View>
            </View>
            <View style={styles.liftAnatomy}>
              <DetailedAnatomy view={lift.view} primaryMuscle={lift.muscle} width={40} />
            </View>
          </View>
        ))}

        <View style={styles.liftHintBox}>
          <Text style={styles.liftHint}>
            We'll calculate your estimated 1RM and use it for weight suggestions.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Available Equipment</Text>
        <Text style={styles.stepSubtitle}>Select all that you have access to</Text>
      </View>

      <View style={styles.equipmentGrid}>
        {EQUIPMENT.map((item) => {
          const isSelected = formData.equipment.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.equipmentCard, isSelected && styles.equipmentCardSelected]}
              onPress={() => toggleEquipment(item.id)}
            >
              <Text style={[styles.equipmentName, isSelected && styles.equipmentNameSelected]}>
                {item.name}
              </Text>
              {isSelected && (
                <View style={styles.equipmentCheck}>
                  <Check size={12} color={COLORS.textOnPrimary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep7 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Sleep Goal</Text>
        <Text style={styles.stepSubtitle}>Recovery is essential for progress</Text>
      </View>

      <View style={styles.sleepSection}>
        <View style={styles.sleepDisplay}>
          <Text style={styles.sleepValue}>{formData.sleepGoal}</Text>
          <Text style={styles.sleepUnit}>hours/night</Text>
        </View>

        <View
          style={styles.sleepSliderContainer}
          ref={sleepSliderRef}
          onLayout={(e) => { sleepSliderWidth.current = e.nativeEvent.layout.width; }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const touch = e.nativeEvent.locationX;
            if (touch != null && sleepSliderWidth.current > 0) {
              const ratio = Math.max(0, Math.min(1, touch / sleepSliderWidth.current));
              const hours = Math.round((5 + ratio * 7) * 2) / 2; // Round to nearest 0.5
              setFormData(prev => ({ ...prev, sleepGoal: Math.min(12, Math.max(5, hours)) }));
            }
          }}
          onResponderMove={(e) => {
            const touch = e.nativeEvent.locationX;
            if (touch != null && sleepSliderWidth.current > 0) {
              const ratio = Math.max(0, Math.min(1, touch / sleepSliderWidth.current));
              const hours = Math.round((5 + ratio * 7) * 2) / 2; // Round to nearest 0.5
              setFormData(prev => ({ ...prev, sleepGoal: Math.min(12, Math.max(5, hours)) }));
            }
          }}
        >
          <View style={styles.sleepSliderTrack} />
          <View style={[
            styles.sleepSliderFill,
            { width: `${((formData.sleepGoal - 5) / 7) * 100}%` },
          ]} />
          <View style={[
            styles.sleepSliderThumb,
            { left: `${((formData.sleepGoal - 5) / 7) * 100}%` },
          ]} />
          <View style={styles.sleepSliderTicks}>
            {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12].map((h) => (
              <View key={h} style={[
                styles.sleepSliderTick,
                h % 1 === 0 && styles.sleepSliderTickMajor,
                h <= formData.sleepGoal && styles.sleepSliderTickActive
              ]} />
            ))}
          </View>
        </View>
        <View style={styles.sleepSliderLabels}>
          <Text style={styles.sleepSliderLabel}>5h</Text>
          <Text style={styles.sleepSliderLabel}>12h</Text>
        </View>

        <View style={styles.sleepInfo}>
          <Text style={styles.sleepInfoText}>
            Most adults need 7-9 hours of sleep for optimal recovery and muscle growth.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      <View
        style={styles.scrollArea}
      >
        <View style={styles.scrollContent}>
          {renderCurrentStep()}
        </View>
      </View>
      <View style={styles.navButtonsContainer}>
        {canSkipStep() && (
          <TouchableOpacity style={styles.skipStepButton} onPress={handleSkip}>
            <Text style={styles.skipStepButtonText}>Skip and fill in later</Text>
          </TouchableOpacity>
        )}
        <View style={styles.navButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={20} color={COLORS.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 1 && styles.nextButtonFull,
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {saving ? 'Saving...' : currentStep === 7 ? 'Complete Setup' : 'Continue'}
            </Text>
            {!saving && <ArrowRight size={20} color={COLORS.textOnPrimary} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    height: '100vh',
    maxHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  logoWrapper: {
    width: 80,
    alignItems: 'flex-start',
  },
  logo: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  signOutButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  signOutText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContent: {},
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  stepSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoTooltip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },
  infoTooltipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  formSection: {
    gap: 16,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  inputHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: -8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  genderButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  genderIcon: {
    fontSize: 20,
  },
  genderText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  genderTextActive: {
    color: COLORS.primary,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  infoBox: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  infoBoxText: {
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  // Goals
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  goalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  goalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  goalExpandBtn: {
    padding: 4,
  },
  goalExpanded: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
    borderLeftWidth: 3,
  },
  goalDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  goalStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  goalStatText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  // Weight
  unitToggle: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  unitButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  unitText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  unitTextActive: {
    color: COLORS.primary,
  },
  weightDiff: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  weightDiffText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  weightDiffSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  // Experience
  experienceContainer: {
    gap: 12,
  },
  experienceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  experienceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  experienceTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  experienceSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  experienceCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  // Skip button (in nav area)
  skipStepButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  skipStepButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  // Lifts
  liftSectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  liftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  liftContent: {
    flex: 1,
    paddingLeft: 4,
  },
  liftAnatomy: {
    width: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  liftLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  liftInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liftInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 16,
    width: 60,
    textAlign: 'center',
  },
  liftUnit: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  liftHintBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  liftHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  // Equipment
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  equipmentCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipmentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  equipmentIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  equipmentName: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  equipmentNameSelected: {
    color: COLORS.primary,
  },
  equipmentCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sleep
  sleepSection: {
    alignItems: 'center',
  },
  sleepDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sleepValue: {
    color: COLORS.primary,
    fontSize: 64,
    fontWeight: 'bold',
  },
  sleepUnit: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  sleepSliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {}),
  },
  sleepSliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    pointerEvents: 'none',
  },
  sleepSliderFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    pointerEvents: 'none',
  },
  sleepSliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginLeft: -12,
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    pointerEvents: 'none',
  },
  sleepSliderTicks: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    pointerEvents: 'none',
  },
  sleepSliderTick: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.surfaceLight,
  },
  sleepSliderTickMajor: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sleepSliderTickActive: {
    backgroundColor: COLORS.primary + '60',
  },
  sleepSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  sleepSliderLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sleepInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  sleepInfoText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Navigation
  navButtonsContainer: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
    paddingBottom: 8,
    flexShrink: 0,
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  bottomSafeArea: {
    height: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    gap: 8,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
