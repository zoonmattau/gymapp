import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Platform,
  Modal,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import {
  Trophy,
  Dumbbell,
  Star,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Frown,
  Smile,
  Pencil,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import { workoutService } from '../services/workoutService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { profileService } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { socialService } from '../services/socialService';
import MuscleMap, { PRIMARY_VIEW } from '../components/MuscleMap';
import { EXERCISES } from '../constants/exercises';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExerciseLink from '../components/ExerciseLink';

const WorkoutSummaryScreen = ({ route, navigation }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const { user, profile } = useAuth();
  const weightUnit = profile?.weight_unit || 'kg';
  const { summary } = route?.params || {};
  const [rating, setRating] = useState(null);
  const [notes, setNotes] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [displayName, setDisplayName] = useState(summary?.workoutName || 'Workout');
  const [sharePublic, setSharePublic] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem('@share_workouts_enabled').then(val => {
      if (val !== null) setSharePublic(val === 'true');
    }).catch(() => {});
  }, []);
  const [showShareChoiceModal, setShowShareChoiceModal] = useState(false);
  const [showFriendPickerModal, setShowFriendPickerModal] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [showRenameBeforeShare, setShowRenameBeforeShare] = useState(false);
  const [shareRenameValue, setShareRenameValue] = useState('');
  const [pendingShareAction, setPendingShareAction] = useState(null); // 'share_button' or 'community'
  const shareCardRef = useRef(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [exerciseSummaryExpanded, setExerciseSummaryExpanded] = useState(true);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);
  const [exerciseChartPeriod, setExerciseChartPeriod] = useState({});
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [heroStatIndex, setHeroStatIndex] = useState({});  // Track per-exercise
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [userBodyweight, setUserBodyweight] = useState(70); // Default 70kg

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const fetchBodyweight = async () => {
      if (!user?.id) return;
      const { data } = await profileService.getLatestWeight(user.id);
      if (data?.weight) setUserBodyweight(data.weight);
    };
    fetchBodyweight();
  }, [user?.id]);

  const {
    sessionId = null,
    workoutName = 'Workout',
    duration = 0,
    totalSets = 0,
    completedSets = 0,
    exercises = [],
    totalVolume = 0,
    newPRs = [],
    isFromHistory = false,
    startTime = null,
    saveError = false,
  } = summary || {};

  // Use startTime from workout, fallback to current time only if not available
  const workoutStartDate = startTime ? new Date(startTime) : new Date();

  // Build array of shareable cards
  const shareCards = [
    { type: 'summary', title: 'Workout Summary' },
    ...(newPRs.length > 0 ? [{ type: 'prs', title: 'Personal Records' }] : []),
    ...exercises.map((ex, i) => ({ type: 'exercise', exercise: ex, index: i })),
  ];

  const handleSharePress = () => {
    setShareRenameValue(displayName);
    setPendingShareAction('share_button');
    setShowRenameBeforeShare(true);
  };

  const handleCommunityToggle = () => {
    if (!sharePublic) {
      // Turning ON — prompt rename first
      setShareRenameValue(displayName);
      setPendingShareAction('community');
      setShowRenameBeforeShare(true);
    } else {
      // Turning OFF — just toggle
      setSharePublic(false);
    }
  };

  const handleShareRenameConfirm = async () => {
    const trimmed = shareRenameValue.trim();
    if (trimmed && trimmed !== displayName) {
      setDisplayName(trimmed);
      if (sessionId) {
        try {
          await workoutService.renameWorkoutSession(sessionId, trimmed);
        } catch (err) {
          console.log('Error renaming workout:', err);
        }
      }
    }
    setShowRenameBeforeShare(false);
    if (pendingShareAction === 'share_button') {
      setShowShareChoiceModal(true);
    } else if (pendingShareAction === 'community') {
      setSharePublic(true);
    }
    setPendingShareAction(null);
  };

  const handleShareRenameSkip = () => {
    setShowRenameBeforeShare(false);
    if (pendingShareAction === 'share_button') {
      setShowShareChoiceModal(true);
    } else if (pendingShareAction === 'community') {
      setSharePublic(true);
    }
    setPendingShareAction(null);
  };

  const handleShareToFriends = async () => {
    setShowShareChoiceModal(false);
    setFriendsLoading(true);
    setSelectedFriends([]);
    setShowFriendPickerModal(true);
    const { data } = await socialService.getFriendsList(user?.id);
    setFriendsList(data || []);
    setFriendsLoading(false);
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSendToFriends = async () => {
    if (!selectedFriends.length || !sessionId) {
      console.log('Share blocked - selectedFriends:', selectedFriends.length, 'sessionId:', sessionId);
      return;
    }
    setShareSubmitting(true);
    const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.username || 'Someone';
    console.log('Sharing workout:', { userId: user.id, userName, sessionId, friendIds: selectedFriends });
    const { error } = await socialService.shareWorkoutToFriends(user.id, userName, sessionId, selectedFriends);
    setShareSubmitting(false);
    if (error) {
      console.error('Share failed:', error);
      alert('Failed to share workout: ' + (error?.message || 'Unknown error'));
    } else {
      console.log('Share succeeded!');
    }
    setShowFriendPickerModal(false);
    setSelectedFriends([]);
  };

  const handleOSShare = async () => {
    setShowShareChoiceModal(false);
    const currentCard = shareCards[activeCardIndex];
    let shareText = '';

    if (currentCard.type === 'summary') {
      shareText = `Just crushed my ${displayName} workout!\n\n` +
        `⏱️ ${formatDuration(summary?.duration || 0)}\n` +
        `💪 ${summary?.completedSets || 0} sets\n` +
        `🏋️ ${formatVolume(summary?.totalVolume || 0)} lifted\n` +
        `${(summary?.newPRs?.length || 0) > 0 ? `🏆 ${summary.newPRs.length} new PR${summary.newPRs.length > 1 ? 's' : ''}!\n` : ''}` +
        `\n#UPrep #Fitness #Workout`;
    } else if (currentCard.type === 'prs') {
      shareText = `New Personal Records! 🏆\n\n` +
        newPRs.map(pr => `${pr.exercise}: ${weightUnit === 'lbs' ? Math.round(pr.weight * 2.205) : pr.weight}${weightUnit} × ${pr.reps}`).join('\n') +
        `\n\n#UPrep #PR #Gains`;
    } else if (currentCard.type === 'exercise') {
      const ex = currentCard.exercise;
      const completedSets = ex.sets?.filter(s => s.completed) || [];
      const maxWeight = Math.max(...completedSets.map(s => parseFloat(s.weight) || 0));
      shareText = `${ex.name} 💪\n\n` +
        completedSets.map((s, i) => `Set ${i + 1}: ${s.weight}${weightUnit} × ${s.reps}`).join('\n') +
        `\n\nMax: ${maxWeight}${weightUnit}\n#UPrep #Fitness`;
    }

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Workout Complete!',
            text: shareText,
          });
        } catch (err) {
          // User cancelled or error
          console.log('Share cancelled');
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          alert('Copied to clipboard!');
        } catch (err) {
          console.log('Copy failed');
        }
      }
    } else {
      try {
        await Share.share({
          message: shareText,
        });
      } catch (err) {
        console.log('Share error:', err);
      }
    }
  };

  const handleRenamePress = () => {
    setNewWorkoutName(displayName);
    setRenameModalVisible(true);
  };

  const handleRenameSubmit = async () => {
    if (!sessionId || !newWorkoutName.trim()) {
      setRenameModalVisible(false);
      return;
    }

    try {
      const { error } = await workoutService.renameWorkoutSession(
        sessionId,
        newWorkoutName.trim()
      );

      if (!error) {
        setDisplayName(newWorkoutName.trim());
      }
    } catch (err) {
      console.log('Error renaming workout:', err);
    }

    setRenameModalVisible(false);
    setNewWorkoutName('');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}min`;
    }
    return `${mins} min`;
  };

  const formatVolume = (volume, compact = false) => {
    const displayVolume = weightUnit === 'lbs' ? Math.round(volume * 2.205) : volume;
    if (displayVolume >= 1000) {
      return compact
        ? `${(displayVolume / 1000).toFixed(1)}K`
        : `${(displayVolume / 1000).toFixed(1)}K ${weightUnit}`;
    }
    return compact ? `${displayVolume}` : `${displayVolume} ${weightUnit}`;
  };

  const loadExerciseHistory = async (exerciseName, period = '1M') => {
    if (!user?.id) return;
    const now = new Date();
    let startDate;
    if (period === '1M') startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    else if (period === '6M') startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    else if (period === '1Y') startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    else startDate = new Date('2020-01-01');

    // Get current workout's best value (e1RM for weighted, volume for bodyweight)
    const currentExercise = exercises.find(ex => ex.name === exerciseName);
    let currentBestValue = 0;
    let isBW = true;
    if (currentExercise?.sets) {
      currentExercise.sets.filter(s => s.completed).forEach(set => {
        const w = parseFloat(set.weight) || 0, r = parseInt(set.reps) || 0;
        if (w > 0) {
          isBW = false;
          const e1rm = r === 1 ? w : w * (1 + r / 30);
          if (e1rm > currentBestValue) currentBestValue = e1rm;
        } else if (r > 0) {
          // Bodyweight: use volume (reps * bodyweight)
          const vol = r * userBodyweight;
          if (vol > currentBestValue) currentBestValue = vol;
        }
      });
    }
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      const { data } = await supabase.from('workout_sets').select('weight, reps, completed_at')
        .eq('exercise_name', exerciseName).gte('completed_at', startDate.toISOString()).order('completed_at');
      const valueByDate = {};
      if (data?.length > 0) {
        data.forEach(set => {
          const w = parseFloat(set.weight) || 0, r = parseInt(set.reps) || 0;
          const date = set.completed_at?.split('T')[0];
          if (w > 0) {
            const e1rm = r === 1 ? w : w * (1 + r / 30);
            if (!valueByDate[date] || e1rm > valueByDate[date]) valueByDate[date] = e1rm;
          } else if (r > 0) {
            // Bodyweight: track volume (reps * bodyweight)
            const vol = r * userBodyweight;
            if (!valueByDate[date] || vol > valueByDate[date]) valueByDate[date] = vol;
          }
        });
      }
      // Add current workout's value (take max if today already exists)
      if (currentBestValue > 0) {
        if (!valueByDate[todayStr] || currentBestValue > valueByDate[todayStr]) {
          valueByDate[todayStr] = currentBestValue;
        }
      }
      const sortedDates = Object.keys(valueByDate).sort();
      setExerciseHistory(prev => ({ ...prev, [exerciseName]: { data: sortedDates.map(d => valueByDate[d]), labels: sortedDates.map(d => d.slice(5)), period, loaded: true, isBodyweight: isBW } }));
    } catch (err) {
      console.log('Error loading exercise history:', err);
      // Still set loaded state even on error
      if (currentBestValue > 0) {
        setExerciseHistory(prev => ({ ...prev, [exerciseName]: { data: [currentBestValue], labels: [todayStr.slice(5)], period, loaded: true, isBodyweight: isBW } }));
      } else {
        setExerciseHistory(prev => ({ ...prev, [exerciseName]: { data: [], labels: [], period, loaded: true, isBodyweight: isBW } }));
      }
    }
  };

  const handleFinish = async () => {
    // Save rating and notes to workout session (allow for both new and historical workouts)
    if (sessionId) {
      try {
        const updates = {};
        if (rating) updates.rating = rating;
        if (notes) updates.notes = notes;

        if (Object.keys(updates).length > 0) {
          console.log('Saving workout updates - sessionId:', sessionId, 'type:', typeof sessionId, 'updates:', updates);
          const result = await workoutService.updateWorkoutSession(sessionId, updates);
          console.log('Save result:', result);
          if (result.error) {
            console.error('Update error details:', result.error);
          }
        }
      } catch (err) {
        console.log('Error saving workout rating:', err);
      }
    } else {
      console.log('Not saving - no sessionId');
    }

    // Only publish if not viewing from history and share is enabled
    if (!isFromHistory && sharePublic && user?.id && sessionId) {
      try {
        const durationMin = Math.floor(duration / 60);
        await publishedWorkoutService.publishWorkout(user.id, {
          name: displayName,
          exercises: exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets?.filter(s => s.completed).length || 0,
          })),
          description: `${durationMin} min • ${exercises.length} exercises`,
        });
      } catch (err) {
        console.log('Error publishing workout:', err);
      }
    }
    navigation.goBack();
  };

  // Render a single share card
  const renderShareCard = (card, index) => {
    if (card.type === 'summary') {
      // Get ALL unique muscles worked
      const allMuscles = [...new Set(exercises.map(ex => {
        const exData = EXERCISES.find(e => e.name === ex.name);
        return exData?.muscleGroup || ex.muscleGroup;
      }).filter(Boolean))];

      // Build summary hero stat options (these are the "impressive" numbers to cycle)
      const displayVol = weightUnit === 'lbs' ? Math.round(totalVolume * 2.205) : Math.round(totalVolume);
      const totalReps = exercises.reduce((sum, ex) => {
        return sum + (ex.sets?.filter(s => s.completed !== false) || []).reduce((s, set) => s + (parseInt(set.reps) || 0), 0);
      }, 0);
      const summaryHeroStats = [
        { value: displayVol >= 1000 ? `${(displayVol/1000).toFixed(1)}K` : displayVol, unit: displayVol >= 1000 ? '' : weightUnit, sublabel: 'Volume' },
        { value: totalReps, unit: '', sublabel: 'Total Reps' },
        { value: formatDuration(duration), unit: '', sublabel: 'Duration' },
      ];
      const currentSummaryHeroIndex = heroStatIndex['summary'] || 0;
      const currentSummaryHero = summaryHeroStats[currentSummaryHeroIndex % summaryHeroStats.length];

      return (
        <View key="summary" style={[styles.shareCard, { minWidth: 300 }]}>
          <View style={styles.cardWithTitleLayout}>
            {/* Title row spanning full width */}
            <Text style={styles.cardTitleFull}>{displayName}</Text>

            {/* Content row: logo left, stats center, muscle right */}
            <View style={styles.cardContentRow}>
              {/* Left: Logo */}
              <View style={styles.cardSideLarge}>
                <View style={styles.logoContainerLarge}>
                  <Image source={require('../../assets/logo.png')} style={styles.logoLarge} resizeMode="contain" />
                </View>
              </View>

              {/* Center: Content */}
              <View style={styles.cardCenterContent}>
                {/* Hero Stat - Tappable to cycle */}
                {Platform.OS === 'web' ? (
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      paddingTop: 8,
                      paddingBottom: 8,
                      cursor: 'pointer',
                    }}
                    onClick={() => setHeroStatIndex(prev => ({ ...prev, summary: (currentSummaryHeroIndex + 1) % summaryHeroStats.length }))}
                  >
                    <Text style={styles.summaryHeroValueCompact}>
                      {currentSummaryHero.value}
                      {currentSummaryHero.unit && <Text style={styles.heroStatUnitSmall}> {currentSummaryHero.unit}</Text>}
                    </Text>
                    {currentSummaryHero.label && <Text style={styles.summaryHeroLabelCompact}>{currentSummaryHero.label}</Text>}
                    <Text style={styles.summaryHeroLabelCompact}>{currentSummaryHero.sublabel}</Text>
                  </div>
                ) : (
                  <TouchableOpacity
                    style={styles.summaryHeroStatCompact}
                    onPress={() => setHeroStatIndex(prev => ({ ...prev, summary: (currentSummaryHeroIndex + 1) % summaryHeroStats.length }))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.summaryHeroValueCompact}>
                      {currentSummaryHero.value}
                      {currentSummaryHero.unit && <Text style={styles.heroStatUnitSmall}> {currentSummaryHero.unit}</Text>}
                    </Text>
                    {currentSummaryHero.label && <Text style={styles.summaryHeroLabelCompact}>{currentSummaryHero.label}</Text>}
                    <Text style={styles.summaryHeroLabelCompact}>{currentSummaryHero.sublabel}</Text>
                  </TouchableOpacity>
                )}

                {/* Stats Row */}
                <View style={styles.quickStatsRowTight}>
                  <View style={styles.quickStatItemTight}>
                    <Text style={styles.quickStatValueTight}>{formatDuration(duration)}</Text>
                    <Text style={styles.quickStatLabelTight}>Time</Text>
                  </View>
                  <View style={styles.quickStatDividerTight} />
                  <View style={styles.quickStatItemTight}>
                    <Text style={styles.quickStatValueTight}>{completedSets}</Text>
                    <Text style={styles.quickStatLabelTight}>Sets</Text>
                  </View>
                  <View style={styles.quickStatDividerTight} />
                  <View style={styles.quickStatItemTight}>
                    <Text style={styles.quickStatValueTight}>{exercises.length}</Text>
                    <Text style={styles.quickStatLabelTight}>Exercises</Text>
                  </View>
                </View>

                {newPRs.length > 0 && (
                  <View style={styles.prBadgeSmallInline}>
                    <Text style={styles.prBadgeSmallText}>🏆 {newPRs.length} PR{newPRs.length > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>

              {/* Right: Muscle Map showing ALL muscles */}
              <View style={styles.cardSideRight}>
                {allMuscles.length > 0 ? (
                  <MuscleMap
                    view="front"
                    highlightedMuscles={allMuscles}
                    size={80}
                    highlightColor={COLORS.primary}
                    baseColor={COLORS.textMuted + '30'}
                    outlineColor={COLORS.textMuted + '40'}
                  />
                ) : <View style={{ width: 80 }} />}
              </View>
            </View>

            {/* Date at bottom */}
            <Text style={styles.dateTextBottom}>
              {workoutStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {workoutStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
          </View>
        </View>
      );
    } else if (card.type === 'prs') {
      return (
        <View key="prs" style={[styles.shareCard, { minWidth: 300 }]}>
          <View style={styles.shareCardContentCompact}>
            {/* Header row: logo left, title center, trophy right */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.logoContainerSmall}>
                <Image source={require('../../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
              </View>
              <Text style={styles.workoutNameCompact}>{newPRs.length} New PR{newPRs.length > 1 ? 's' : ''}</Text>
              <Text style={{ fontSize: 28 }}>🏆</Text>
            </View>

            {/* PR List */}
            <View style={styles.prCardList}>
              {newPRs.map((pr, i) => {
                const w = parseFloat(pr.weight) || 0;
                const r = parseInt(pr.reps) || 0;
                const e1rm = w > 0 && r > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0;
                const displayWeight = weightUnit === 'lbs' ? Math.round(w * 2.205) : w;
                const displayE1rm = weightUnit === 'lbs' ? Math.round(e1rm * 2.205) : Math.round(e1rm);
                return (
                  <View key={i} style={styles.prCardItem}>
                    <Text style={styles.prCardExercise}>{pr.exercise}</Text>
                    <Text style={styles.prCardWeight}>
                      {displayWeight} {weightUnit} × {r} {e1rm > 0 ? `(e1RM: ${displayE1rm})` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.dateText}>
              {workoutStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      );
    } else if (card.type === 'exercise') {
      const ex = card.exercise;
      // For history workouts, sets may not have 'completed' flag - treat all as completed
      const completedSetsArr = ex.sets?.filter(s => s.completed !== false) || [];
      const exerciseData = EXERCISES.find(e => e.name === ex.name);
      const muscle = exerciseData?.muscleGroup || ex.muscleGroup;

      // Find the best set (highest estimated 1RM using Epley formula)
      const setsWithE1RM = completedSetsArr.map((s, i) => {
        const weight = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps) || 0;
        const e1rm = reps === 1 ? weight : weight * (1 + reps / 30);
        return { ...s, index: i, e1rm, weight, reps };
      });
      const bestSet = setsWithE1RM.length > 0
        ? setsWithE1RM.reduce((best, s) => s.e1rm > (best?.e1rm || 0) ? s : best, setsWithE1RM[0])
        : { weight: 0, reps: 0, e1rm: 0 };
      const estimated1RM = bestSet?.e1rm || 0;

      // Get weight range
      const weights = completedSetsArr.map(s => parseFloat(s.weight) || 0).filter(w => w > 0);
      const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
      const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
      const displayMin = weightUnit === 'lbs' ? Math.round(minWeight * 2.205) : minWeight;
      const displayMax = weightUnit === 'lbs' ? Math.round(maxWeight * 2.205) : maxWeight;
      const weightRange = minWeight === maxWeight ? `${displayMax}` : `${displayMin}-${displayMax}`;

      const totalVolume = completedSetsArr.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
      const totalReps = completedSetsArr.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
      const hasPR = newPRs.some(pr => pr.exercise === ex.name);

      // Build hero stat options (impressive numbers to cycle - sets/reps/range shown in stats row)
      const heroStats = [];
      if (maxWeight > 0) {
        const displayWeight = weightUnit === 'lbs' ? Math.round((bestSet?.weight || 0) * 2.205) : bestSet?.weight;
        heroStats.push({ value: displayWeight, unit: weightUnit, label: `× ${bestSet?.reps} reps`, sublabel: 'Top Set' });
        const display1RM = weightUnit === 'lbs' ? Math.round(estimated1RM * 2.205) : Math.round(estimated1RM);
        heroStats.push({ value: display1RM, unit: weightUnit, sublabel: 'Est. 1RM' });
        const displayVol = weightUnit === 'lbs' ? Math.round(totalVolume * 2.205) : Math.round(totalVolume);
        heroStats.push({
          value: displayVol >= 1000 ? `${(displayVol/1000).toFixed(1)}K` : displayVol,
          unit: displayVol >= 1000 ? '' : weightUnit,
          sublabel: 'Volume'
        });
      } else {
        // Bodyweight exercise - just show reps as hero
        heroStats.push({ value: totalReps, unit: '', sublabel: 'Total Reps' });
      }

      const currentHeroIndex = heroStatIndex[card.index] || 0;
      const currentHero = heroStats[currentHeroIndex % heroStats.length];

      return (
        <View key={`ex-${card.index}`} style={[styles.shareCard, { minWidth: 300 }]}>
          <View style={styles.cardWithTitleLayout}>
            {/* Title row spanning full width */}
            <View style={styles.exerciseTitleRow}>
              <Text style={styles.cardTitleFull}>{ex.name}</Text>
              {hasPR && <Text style={styles.prBadgeInline}>🏆 PR</Text>}
            </View>

            {/* Content row: logo left, stats center, muscle right */}
            <View style={styles.cardContentRow}>
              {/* Left: Logo */}
              <View style={styles.cardSideLarge}>
                <View style={styles.logoContainerLarge}>
                  <Image source={require('../../assets/logo.png')} style={styles.logoLarge} resizeMode="contain" />
                </View>
              </View>

              {/* Center: Hero Stat - Tappable to cycle */}
              <View style={styles.cardCenterContent}>
                {Platform.OS === 'web' ? (
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      paddingTop: 4,
                      paddingBottom: 4,
                      cursor: 'pointer',
                    }}
                    onClick={() => setHeroStatIndex(prev => ({ ...prev, [card.index]: (currentHeroIndex + 1) % heroStats.length }))}
                  >
                    <Text style={styles.heroStatValueSmall}>
                      {currentHero.value}
                      {currentHero.unit && <Text style={styles.heroStatUnitSmall}> {currentHero.unit}</Text>}
                    </Text>
                    <Text style={styles.heroStatRepsSmall}>{currentHero.label}</Text>
                    <Text style={styles.heroStatSublabelSmall}>{currentHero.sublabel}</Text>
                  </div>
                ) : (
                  <TouchableOpacity
                    style={styles.heroStatContainerSmall}
                    onPress={() => setHeroStatIndex(prev => ({ ...prev, [card.index]: (currentHeroIndex + 1) % heroStats.length }))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.heroStatValueSmall}>
                      {currentHero.value}
                      {currentHero.unit && <Text style={styles.heroStatUnitSmall}> {currentHero.unit}</Text>}
                    </Text>
                    <Text style={styles.heroStatRepsSmall}>{currentHero.label}</Text>
                    <Text style={styles.heroStatSublabelSmall}>{currentHero.sublabel}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Right: Muscle Map */}
              <View style={styles.cardSideRight}>
                {muscle ? (
                  <MuscleMap
                    view={PRIMARY_VIEW[muscle] || 'front'}
                    highlightedMuscle={muscle}
                    size={80}
                    highlightColor={COLORS.primary}
                    baseColor={COLORS.textMuted + '30'}
                    outlineColor={COLORS.textMuted + '40'}
                  />
                ) : <View style={{ width: 80 }} />}
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.quickStatsRowTight}>
              <View style={styles.quickStatItemTight}>
                <Text style={styles.quickStatValueTight}>{completedSetsArr.length}</Text>
                <Text style={styles.quickStatLabelTight}>Sets</Text>
              </View>
              <View style={styles.quickStatDividerTight} />
              <View style={styles.quickStatItemTight}>
                <Text style={styles.quickStatValueTight}>{totalReps}</Text>
                <Text style={styles.quickStatLabelTight}>Reps</Text>
              </View>
              <View style={styles.quickStatDividerTight} />
              <View style={styles.quickStatItemTight}>
                <Text style={styles.quickStatValueTight}>{weightRange}</Text>
                <Text style={styles.quickStatLabelTight}>{weightUnit}</Text>
              </View>
            </View>

            {/* Date at bottom */}
            <Text style={styles.dateTextBottom}>
              {workoutStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const handleCarouselScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageWidth = Dimensions.get('window').width;
    const index = Math.round(offsetX / pageWidth);
    setActiveCardIndex(index);
  };

  // Render content (shared between web and native)
  const renderContent = () => (
    <>
      {/* Save Error Warning */}
      {saveError && (
        <View style={styles.saveErrorBanner}>
          <Text style={styles.saveErrorText}>
            Some workout data may not have saved. Check your connection and try again later.
          </Text>
        </View>
      )}
      {/* Card Carousel */}
      {Platform.OS === 'web' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            marginTop: 16,
            marginBottom: 8,
          }}
          onScroll={(e) => {
            const offsetX = e.target.scrollLeft;
            const index = Math.round(offsetX / screenWidth);
            setActiveCardIndex(index);
          }}
        >
          {shareCards.map((card, index) => (
            <div
              key={card.type === 'exercise' ? `ex-${card.index}` : card.type}
              style={{
                minWidth: screenWidth,
                width: screenWidth,
                scrollSnapAlign: 'start',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingLeft: 24,
                paddingRight: 24,
                boxSizing: 'border-box',
              }}
            >
              {renderShareCard(card, index)}
            </div>
          ))}
        </div>
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          style={styles.carouselContainer}
          snapToInterval={screenWidth}
          snapToAlignment="center"
          decelerationRate="fast"
        >
          {shareCards.map((card, index) => (
            <View key={card.type === 'exercise' ? `ex-${card.index}` : card.type} style={[styles.carouselPage, { width: screenWidth }]}>
              {renderShareCard(card, index)}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Carousel Indicators */}
      <View style={styles.carouselIndicators}>
        {shareCards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.carouselDot,
              activeCardIndex === index && styles.carouselDotActive
            ]}
          />
        ))}
      </View>

      {/* Share Button */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleSharePress}
        onClick={handleSharePress}
      >
        <Text style={styles.shareButtonText}>Share Workout</Text>
      </TouchableOpacity>

      {/* Exercise Summary - Collapsible */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExerciseSummaryExpanded(!exerciseSummaryExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Exercise Summary ({exercises.length})</Text>
        {exerciseSummaryExpanded ? (
          <ChevronUp size={20} color={COLORS.textMuted} />
        ) : (
          <ChevronDown size={20} color={COLORS.textMuted} />
        )}
      </TouchableOpacity>
      {exerciseSummaryExpanded && (
        <View style={styles.section}>
          {exercises.map((exercise, index) => {
            const completedSets = exercise.sets?.filter(s => s.completed !== false) || [];
            const exerciseData = EXERCISES.find(e => e.name === exercise.name);
            const muscle = exerciseData?.muscleGroup || exercise.muscleGroup;
            const isExpanded = expandedExerciseIndex === index;
            const topWeight = Math.max(...completedSets.map(s => parseFloat(s.weight) || 0), 0);
            const displayTopWeight = weightUnit === 'lbs' ? Math.round(topWeight * 2.205) : topWeight;
            const hasPR = newPRs.some(pr => pr.exercise === exercise.name);
            return (
              <View key={index}>
                <TouchableOpacity style={[styles.exerciseSummary, hasPR && styles.exerciseSummaryPR]} onPress={() => { setExpandedExerciseIndex(isExpanded ? null : index); if (!isExpanded && !exerciseHistory[exercise.name]) loadExerciseHistory(exercise.name, '1M'); }} activeOpacity={0.7}>
                  <View style={styles.exerciseIcon}>
                    {muscle ? (
                      <MuscleMap
                        view={PRIMARY_VIEW[muscle] || 'front'}
                        highlightedMuscle={muscle}
                        size={32}
                        highlightColor={hasPR ? COLORS.primary : COLORS.primary}
                        baseColor={COLORS.textMuted + '40'}
                        outlineColor={COLORS.textMuted + '60'}
                      />
                    ) : (
                      <Dumbbell size={16} color={hasPR ? COLORS.primary : COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.exerciseInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ExerciseLink exerciseName={exercise.name} style={[styles.exerciseName, hasPR && { color: COLORS.primary }]} />
                      {hasPR && <Trophy size={14} color="COLORS.primary" />}
                    </View>
                    <Text style={styles.exerciseSets}>{completedSets.length} sets{topWeight > 0 ? ` · Top: ${displayTopWeight}${weightUnit}` : ''}</Text>
                  </View>
                  {isExpanded ? <ChevronUp size={18} color={COLORS.textMuted} /> : <ChevronDown size={18} color={COLORS.textMuted} />}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={[styles.exerciseSetsList, hasPR && styles.exerciseSetsListPR]}>
                    <View style={styles.expandedContent}>
                      <View style={styles.setsColumn}>
                        {completedSets.map((set, setIdx) => {
                          const w = parseFloat(set.weight) || 0;
                          const r = parseInt(set.reps) || 0;
                          const e1rm = w > 0 && r > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0;
                          const displayE1rm = weightUnit === 'lbs' ? Math.round(e1rm * 2.205) : Math.round(e1rm);
                          const displayW = w > 0 ? (weightUnit === 'lbs' ? Math.round(w * 2.205) : w) : 'BW';
                          return (
                            <View key={setIdx} style={styles.setRow}>
                              <Text style={styles.setWeight}>{displayW}{w > 0 ? weightUnit : ''}</Text>
                              <Text style={styles.setReps}>×{r}</Text>
                              {e1rm > 0 && <Text style={styles.setE1rm}>e1RM {displayE1rm}</Text>}
                              {set.rpe && <Text style={styles.setRpe}>@{set.rpe}</Text>}
                            </View>
                          );
                        })}
                      </View>
                      <View style={styles.chartColumn}>
                        {exerciseHistory[exercise.name]?.data?.length > 1 ? (
                          <View style={styles.chartBox}>
                            <View style={styles.chartPeriodToggleInner}>
                              {['1M', '6M', '1Y', 'All'].map(p => (
                                <TouchableOpacity key={p} style={[styles.periodBtnSmall, (exerciseChartPeriod[exercise.name] || '1M') === p && styles.periodBtnActive]}
                                  onPress={() => { setExerciseChartPeriod(prev => ({ ...prev, [exercise.name]: p })); loadExerciseHistory(exercise.name, p); }}>
                                  <Text style={[styles.periodBtnTextSmall, (exerciseChartPeriod[exercise.name] || '1M') === p && styles.periodBtnTextActive]}>{p}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            <LineChart
                              data={(() => {
                                const chartData = exerciseHistory[exercise.name].data.map(v => weightUnit === 'lbs' ? Math.round(v * 2.205) : Math.round(v));
                                const minVal = Math.min(...chartData);
                                const maxVal = Math.max(...chartData);
                                const padding = Math.max(3, Math.round(maxVal * 0.05));
                                return {
                                  labels: exerciseHistory[exercise.name].labels.length <= 3
                                    ? exerciseHistory[exercise.name].labels
                                    : [exerciseHistory[exercise.name].labels[0], '', exerciseHistory[exercise.name].labels[exerciseHistory[exercise.name].labels.length - 1]],
                                  datasets: [{ data: chartData }, { data: [minVal - padding], color: () => 'transparent' }, { data: [maxVal + padding], color: () => 'transparent' }]
                                };
                              })()}
                              width={190} height={Math.max(95, completedSets.length * 28)}
                              withDots={true}
                              withInnerLines={false}
                              withOuterLines={true}
                              withHorizontalLabels={true}
                              withVerticalLabels={true}
                              segments={2}
                              fromZero={false}
                              yAxisInterval={1}
                              yLabelsOffset={25}
                              chartConfig={{
                                backgroundGradientFrom: COLORS.cardBg || COLORS.surface,
                                backgroundGradientTo: COLORS.cardBg || COLORS.surface,
                                color: () => COLORS.primary,
                                labelColor: () => COLORS.textMuted,
                                strokeWidth: 2,
                                decimalPlaces: 0,
                                paddingLeft: 0,
                                propsForDots: { r: '3' },
                                propsForLabels: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
                                propsForBackgroundLines: { strokeDasharray: '', stroke: COLORS.border },
                              }}
                              bezier
                              style={{ marginLeft: -30, marginRight: -10 }}
                            />
                          </View>
                        ) : (
                          <View style={styles.chartBox}>
                            <Text style={styles.e1rmLabel}>Best e1RM</Text>
                            <Text style={styles.e1rmValue}>
                              {exerciseHistory[exercise.name]?.data?.[0]
                                ? `${weightUnit === 'lbs' ? Math.round(exerciseHistory[exercise.name].data[0] * 2.205) : Math.round(exerciseHistory[exercise.name].data[0])}${weightUnit}`
                                : (exerciseHistory[exercise.name]?.loaded ? '—' : '...')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* New PRs Details */}
      {newPRs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          {newPRs.map((pr, index) => {
            const w = parseFloat(pr.weight) || 0;
            const r = parseInt(pr.reps) || 0;
            const e1rm = w > 0 && r > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0;
            const displayWeight = weightUnit === 'lbs' ? Math.round(w * 2.205) : w;
            const displayE1rm = weightUnit === 'lbs' ? Math.round(e1rm * 2.205) : Math.round(e1rm);
            return (
              <View key={index} style={styles.prCard}>
                <Trophy size={24} color={COLORS.warning} />
                <View style={styles.prInfo}>
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                  <View style={styles.prValueRow}>
                    <Text style={styles.prValue}>
                      {displayWeight}{weightUnit} x {r} reps
                    </Text>
                    {e1rm > 0 && <Text style={styles.prE1rm}>e1RM: {displayE1rm}{weightUnit}</Text>}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}


      {/* Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rate your workout</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              onClick={() => setRating(star)}
            >
              <Star
                size={36}
                color={star <= (rating || 0) ? COLORS.warning : COLORS.surfaceLight}
                fill={star <= (rating || 0) ? COLORS.warning : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="How was your workout? Any observations..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Share Toggle - only show for new workouts */}
      {!isFromHistory && (
        <TouchableOpacity
          style={styles.shareToggle}
          onPress={handleCommunityToggle}
          onClick={handleCommunityToggle}
          activeOpacity={0.7}
        >
          <View style={styles.shareToggleInfo}>
            <Text style={styles.shareToggleTitle}>Share to Community</Text>
            <Text style={styles.shareToggleDesc}>Let others see your workout</Text>
          </View>
          <View style={[styles.toggleTrack, sharePublic && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, sharePublic && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Continue Editing Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          navigation.replace('ActiveWorkout', {
            workoutName: displayName,
            sessionId: sessionId,
            resumedExercises: exercises.map(ex => ({
              id: ex.id || Date.now().toString() + Math.random(),
              name: ex.name,
              sets: ex.sets || [],
              muscleGroup: ex.muscleGroup,
            })),
            resumedTime: duration,
            isFromHistory: isFromHistory,
          });
        }}
        onClick={() => {
          navigation.replace('ActiveWorkout', {
            workoutName: displayName,
            sessionId: sessionId,
            resumedExercises: exercises.map(ex => ({
              id: ex.id || Date.now().toString() + Math.random(),
              name: ex.name,
              sets: ex.sets || [],
              muscleGroup: ex.muscleGroup,
            })),
            resumedTime: duration,
            isFromHistory: isFromHistory,
          });
        }}
      >
        <Text style={styles.continueButtonText}>{isFromHistory ? 'Edit Workout' : 'Continue Editing'}</Text>
      </TouchableOpacity>

      {/* Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleFinish}
        onClick={handleFinish}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Workout</Text>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.renameInput}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Workout name"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameSubmitButton}
                onPress={handleRenameSubmit}
              >
                <Text style={styles.renameSubmitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Before Share Modal */}
      <Modal
        visible={showRenameBeforeShare}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowRenameBeforeShare(false); setPendingShareAction(null); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowRenameBeforeShare(false); setPendingShareAction(null); }}
        >
          <View style={styles.modalContainer} {...(Platform.OS === 'web' ? { onClick: e => e.stopPropagation() } : {})}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rename Before Sharing?</Text>
                <TouchableOpacity onPress={() => { setShowRenameBeforeShare(false); setPendingShareAction(null); }} style={styles.modalCloseButton}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.shareRenameHint}>Give your workout a memorable name so others know what it's about</Text>
              <TextInput
                style={styles.renameInput}
                value={shareRenameValue}
                onChangeText={setShareRenameValue}
                placeholder="Workout name"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleShareRenameSkip}
                >
                  <Text style={styles.cancelButtonText}>Keep Name</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.renameSubmitButton}
                  onPress={handleShareRenameConfirm}
                >
                  <Text style={styles.renameSubmitButtonText}>Save & Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share Choice Modal */}
      <Modal
        visible={showShareChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareChoiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowShareChoiceModal(false)}
        >
          <View style={styles.modalContainer} {...(Platform.OS === 'web' ? { onClick: e => e.stopPropagation() } : {})}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Workout</Text>
                <TouchableOpacity onPress={() => setShowShareChoiceModal(false)} style={styles.modalCloseButton}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.shareChoiceButton}
                onPress={() => { handleOSShare(); }}
              >
                <Text style={styles.shareChoiceButtonText}>Share via...</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareChoiceButton, { marginTop: 10 }]}
                onPress={handleShareToFriends}
              >
                <Users size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.shareChoiceButtonText}>Share to Friends</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Friend Picker Modal */}
      <Modal
        visible={showFriendPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFriendPickerModal(false)}
        >
          <View style={[styles.modalContainer, { maxHeight: 480 }]} {...(Platform.OS === 'web' ? { onClick: e => e.stopPropagation() } : {})}>
            <View>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send to Friends</Text>
                <TouchableOpacity onPress={() => setShowFriendPickerModal(false)} style={styles.modalCloseButton}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {friendsLoading ? (
                  <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 }}>Loading friends...</Text>
                ) : friendsList.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 24 }}>No friends yet</Text>
                ) : (
                  friendsList.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.friendPickerItem}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <View style={styles.friendPickerAvatar}>
                        <Text style={styles.friendPickerAvatarText}>{friend.first_name?.[0] || friend.username?.[0] || '?'}</Text>
                      </View>
                      <Text style={styles.friendPickerName}>{friend.name}</Text>
                      <View style={[styles.friendPickerCheckbox, selectedFriends.includes(friend.id) && styles.friendPickerCheckboxActive]}>
                        {selectedFriends.includes(friend.id) && <Check size={14} color={COLORS.textOnPrimary} />}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              {selectedFriends.length > 0 && (
                <TouchableOpacity
                  style={[styles.doneButton, { marginTop: 12 }]}
                  onPress={handleSendToFriends}
                  disabled={shareSubmitting}
                >
                  <Text style={styles.doneButtonText}>
                    {shareSubmitting ? 'Sending...' : `Send to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 100 }} />
    </>
  );

  // For web, we need to use native div elements for proper scrolling
  if (Platform.OS === 'web') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: COLORS.background,
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
        }}>
          {renderContent()}
        </div>
      </div>
    );
  }

  // Native iOS/Android rendering
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  saveErrorBanner: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  saveErrorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Share Card Styles
  shareCard: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    marginHorizontal: 20,
    maxWidth: 340,
    alignSelf: 'center',
  },
  shareCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  shareCardContentCompact: {
    padding: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  summaryCardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  summaryCardSide: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  summaryCardCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  logoContainerLarge: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: -10,
  },
  logoLarge: {
    width: 60,
    height: 60,
  },
  quickStatsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  prBadgeSmallInline: {
    backgroundColor: COLORS.warning + '20',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  prBadgeSmallText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  // New card layout with title on top
  cardWithTitleLayout: {
    padding: 12,
  },
  cardTitleFull: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  exerciseTitleRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSideLarge: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  cardSideRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
    paddingRight: 5,
  },
  cardCenterContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryHeroStatCompact: {
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryHeroValueCompact: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  summaryHeroLabelCompact: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  quickStatsRowTight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  quickStatItemTight: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  quickStatValueTight: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  quickStatLabelTight: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  quickStatDividerTight: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.surfaceLight,
  },
  dateTextBottom: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  workoutNameCompact: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  logoContainerMed: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoMed: {
    width: 36,
    height: 36,
  },
  exerciseHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  exerciseCardNameCompact: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  prBadgeInline: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  brandingRow: {
    marginBottom: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 32,
    height: 32,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  workoutNameLarge: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  renameButton: {
    padding: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValueLarge: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabelLight: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  prBadgeText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  carouselContainer: {
    flexGrow: 0,
    marginTop: 16,
    marginBottom: 8,
  },
  carouselPage: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  carouselContent: {
    paddingVertical: 16,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
  },
  carouselDotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  prDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  prExerciseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  prWeightReps: {
    color: COLORS.warning,
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseSetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exerciseSetPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  exerciseSetText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  maxSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  maxSetLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  maxSetValue: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  // Exercise card styles
  exerciseSetsList: {
    width: '100%',
    marginBottom: 16,
  },
  exerciseSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: COLORS.background,
  },
  exerciseSetRowBest: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  exerciseSetNumber: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    width: 24,
  },
  exerciseSetNumberBest: {
    color: COLORS.primary,
  },
  exerciseSetValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseSetValueBest: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  exerciseStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  exerciseStatBox: {
    alignItems: 'center',
  },
  exerciseStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  exerciseStatValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseStatValueHighlight: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  prBadgeSmall: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  // Exercise Card - Social Media Ready
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  exerciseCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    gap: 12,
  },
  logoContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoSmall: {
    width: 28,
    height: 28,
  },
  prBadgePill: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prBadgePillText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseCardMuscle: {
    marginBottom: 8,
  },
  exerciseCardName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroStatContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  heroStatValue: {
    color: COLORS.primary,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
  },
  heroStatUnit: {
    fontSize: 24,
    fontWeight: '600',
  },
  heroStatReps: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  heroStatSublabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heroStatTapHint: {
    color: COLORS.textMuted + '80',
    fontSize: 10,
    marginTop: 8,
  },
  // Smaller hero stat for exercise cards
  heroStatContainerSmall: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  heroStatValueSmall: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroStatUnitSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
  heroStatRepsSmall: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatSublabelSmall: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  heroStatTapHintSmall: {
    color: COLORS.textMuted + '80',
    fontSize: 9,
    marginTop: 4,
  },
  dateTextSmall: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  heroStatDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  heroStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceLight,
  },
  heroStatDotActive: {
    backgroundColor: COLORS.primary,
    width: 16,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  quickStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.surfaceLight,
  },
  // Summary card hero
  summaryHeroStat: {
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryHeroValue: {
    color: COLORS.primary,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  summaryHeroLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  // PR Card styles
  prCardTitle: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 8,
  },
  prCardSubtitle: {
    color: COLORS.warning,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  prCardList: {
    width: '100%',
    marginBottom: 16,
  },
  prCardItem: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prCardExercise: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  prCardWeight: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    marginBottom: 24,
  },
  shareButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Legacy styles kept for other parts
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  workoutName: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  prValue: {
    color: COLORS.warning,
    fontSize: 14,
  },
  prValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prE1rm: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  feelingValue: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {}),
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    top: 9,
    borderWidth: 3,
    borderColor: COLORS.background,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' } : { elevation: 3 }),
  },
  sliderTicks: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    top: 17,
  },
  sliderTick: {
    width: 3,
    height: 6,
    borderRadius: 1.5,
    backgroundColor: COLORS.surface,
  },
  feelingLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  feelingEndLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  feelingDescription: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 100,
  },
  exerciseSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseSets: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  exerciseSetsList: {
    marginBottom: 8,
    marginTop: 4,
    marginHorizontal: 4,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  setNumber: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    width: 20,
    textAlign: 'center',
  },
  setWeight: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  setReps: {
    color: COLORS.text,
    fontSize: 12,
    marginRight: 6,
  },
  setRpe: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  setE1rm: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 6,
  },
  exerciseSummaryPR: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  exerciseSetsListPR: {
    backgroundColor: COLORS.primary + '08',
    borderRadius: 8,
    padding: 8,
  },
  expandedContent: {
    flexDirection: 'row',
  },
  setsColumn: {
    flex: 1,
    maxWidth: 150,
    alignItems: 'stretch',
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  chartPeriodToggle: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  chartPeriodToggleInner: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 2,
    zIndex: 10,
  },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
  },
  periodBtnSmall: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: COLORS.background,
  },
  periodBtnTextSmall: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '600',
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  periodBtnText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  periodBtnTextActive: {
    color: COLORS.textOnPrimary,
  },
  noChartText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartBox: {
    position: 'relative',
    backgroundColor: COLORS.cardBg || COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  e1rmLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  e1rmValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  shareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  shareToggleInfo: {
    flex: 1,
  },
  shareToggleTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  shareToggleDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textMuted,
  },
  toggleThumbActive: {
    backgroundColor: COLORS.textOnPrimary,
    alignSelf: 'flex-end',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    marginBottom: 12,
  },
  continueButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  shareRenameHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  renameInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  renameSubmitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  renameSubmitButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  shareChoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareChoiceButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  friendPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  friendPickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendPickerAvatarText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  friendPickerName: {
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
  },
  friendPickerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendPickerCheckboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});

export default WorkoutSummaryScreen;
