import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Dumbbell,
  Calendar,
  Play,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Trophy,
  Settings,
  Coffee,
  Check,
  Plus,
  Search,
  X,
  FileText,
  Pencil,
} from 'lucide-react-native';
import { WORKOUT_TEMPLATES, AVAILABLE_PROGRAMS } from '../constants/workoutTemplates';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { getPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';
import { workoutService } from '../services/workoutService';
import { supabase } from '../lib/supabase';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WorkoutsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Paused workout state
  const [pausedWorkout, setPausedWorkoutState] = useState(null);

  // Start workout modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Rename workout modal state
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [workoutToRename, setWorkoutToRename] = useState(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');

  // Expandable workout details state
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutDetails, setWorkoutDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Check for paused workout and load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      const stored = getPausedWorkout();
      if (stored) {
        setPausedWorkoutState(stored);
      }
      if (user?.id) {
        loadWorkoutData();
      }
    }, [user])
  );

  // Reload data when week changes - clear schedule immediately for instant feedback
  useEffect(() => {
    if (user?.id) {
      // Clear schedule immediately for instant UI feedback
      setWeekSchedule({
        0: { workout: null, completed: false },
        1: { workout: null, completed: false },
        2: { workout: null, completed: false },
        3: { workout: null, completed: false },
        4: { workout: null, completed: false },
        5: { workout: null, completed: false },
        6: { workout: null, completed: false },
      });
      loadWorkoutData();
    }
  }, [weekOffset]);

  const loadWorkoutData = async () => {
    try {
      // Get workout schedule for the current week
      const weekStart = getWeekStartDate(weekOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = formatDate(weekStart);
      const endStr = formatDate(weekEnd);

      // Fetch both schedule and completed sessions for the week
      const [{ data: scheduleData }, { data: sessionsData }] = await Promise.all([
        workoutService.getSchedule(user.id, startStr, endStr),
        workoutService.getCompletedSessionsForDateRange(user.id, startStr, endStr),
      ]);

      // Group completed sessions by date
      const sessionsByDate = {};
      (sessionsData || []).forEach(session => {
        if (session.ended_at) {
          const sessionDate = formatDate(new Date(session.started_at));
          if (!sessionsByDate[sessionDate]) {
            sessionsByDate[sessionDate] = [];
          }
          sessionsByDate[sessionDate].push(session);
        }
      });

      // Build week schedule from database data
      const newSchedule = {};
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        const dateStr = formatDate(dayDate);

        const daySchedule = scheduleData?.find(s => s.scheduled_date === dateStr);
        const daySessions = sessionsByDate[dateStr] || [];
        const hasCompletedWorkout = daySessions.length > 0;

        if (daySchedule) {
          newSchedule[i] = {
            workout: daySchedule.is_rest_day ? null : (daySchedule.workout_templates?.name || 'Workout'),
            isRest: daySchedule.is_rest_day,
            completed: daySchedule.is_completed || hasCompletedWorkout,
            templateId: daySchedule.template_id,
            scheduleId: daySchedule.id,
          };
        } else if (hasCompletedWorkout) {
          // Freeform workout completed on this day (no schedule entry)
          newSchedule[i] = {
            workout: daySessions[0].workout_name || 'Workout',
            isRest: false,
            completed: true,
            templateId: null,
            scheduleId: null,
          };
        } else {
          newSchedule[i] = { workout: null, isRest: false, completed: false };
        }
      }
      setWeekSchedule(newSchedule);

      // Load recent workout history
      const { data: historyData } = await workoutService.getWorkoutHistory(user.id, 5);
      setWorkoutHistory(historyData || []);

    } catch (error) {
      console.log('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekStartDate = (offset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    return monday;
  };

  const formatActivityDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Drag and drop state
  const [draggedDay, setDraggedDay] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Week schedule - loaded from database, starts empty
  const [weekSchedule, setWeekSchedule] = useState({
    0: { workout: null, completed: false },
    1: { workout: null, completed: false },
    2: { workout: null, completed: false },
    3: { workout: null, completed: false },
    4: { workout: null, completed: false },
    5: { workout: null, completed: false },
    6: { workout: null, completed: false },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkoutData();
    setRefreshing(false);
  };

  const handleRenamePress = (workout) => {
    setWorkoutToRename(workout);
    setNewWorkoutName(workout.workout_name || 'Workout');
    setRenameModalVisible(true);
  };

  const handleRenameSubmit = async () => {
    if (!workoutToRename || !newWorkoutName.trim()) {
      setRenameModalVisible(false);
      return;
    }

    try {
      const { error } = await workoutService.renameWorkoutSession(
        workoutToRename.id,
        newWorkoutName.trim()
      );

      if (!error) {
        // Update local state
        setWorkoutHistory(prev =>
          prev.map(w =>
            w.id === workoutToRename.id ? { ...w, workout_name: newWorkoutName.trim() } : w
          )
        );
      }
    } catch (err) {
      console.log('Error renaming workout:', err);
    }

    setRenameModalVisible(false);
    setWorkoutToRename(null);
    setNewWorkoutName('');
  };

  const handleWorkoutPress = async (workout) => {
    // If already selected, collapse it
    if (selectedWorkout?.id === workout.id) {
      setSelectedWorkout(null);
      setWorkoutDetails(null);
      return;
    }

    setSelectedWorkout(workout);
    setDetailsLoading(true);

    try {
      // Fetch the sets for this workout session
      const { data: sets, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', workout.id)
        .order('completed_at', { ascending: true });

      if (error) {
        console.log('Error fetching workout details:', error);
        setWorkoutDetails([]);
      } else {
        // Group sets by exercise
        const exerciseMap = {};
        (sets || []).forEach(set => {
          const name = set.exercise_name || 'Unknown Exercise';
          if (!exerciseMap[name]) {
            exerciseMap[name] = {
              name,
              sets: [],
            };
          }
          exerciseMap[name].sets.push({
            setNumber: set.set_number,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            isWarmup: set.is_warmup,
          });
        });
        setWorkoutDetails(Object.values(exerciseMap));
      }
    } catch (err) {
      console.log('Error:', err);
      setWorkoutDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getWeekHeaderText = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === 1) return 'Next Week';
    if (weekOffset === -1) return 'Last Week';
    return `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`;
  };

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (weekOffset * 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const isPast = date < todayStart;

      dates.push({
        dayIndex: i,
        dayName: DAYS[i],
        dateNum: date.getDate(),
        isToday,
        isPast,
        isFuture: !isPast && !isToday,
        ...weekSchedule[i],
      });
    }
    return dates;
  };

  // Drag and drop handlers for web
  const handleDragStart = (e, dayIndex) => {
    setDraggedDay(dayIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dayIndex.toString());
  };

  const handleDragOver = (e, dayIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only show drag over effect on non-completed days
    if (draggedDay !== null && dayIndex !== draggedDay && !weekSchedule[dayIndex]?.completed) {
      setDragOverDay(dayIndex);
    }
  };

  const handleDragLeave = (e) => {
    setDragOverDay(null);
  };

  const handleDrop = (e, targetDayIndex) => {
    e.preventDefault();
    // Only allow drop on non-completed days
    if (draggedDay !== null && targetDayIndex !== draggedDay && !weekSchedule[targetDayIndex]?.completed) {
      // Swap workouts between dragged and target day
      setWeekSchedule(prev => {
        const newSchedule = { ...prev };
        const temp = { ...newSchedule[draggedDay] };
        newSchedule[draggedDay] = { ...newSchedule[targetDayIndex] };
        newSchedule[targetDayIndex] = temp;
        return newSchedule;
      });
    }
    setDraggedDay(null);
    setDragOverDay(null);
  };

  const handleDragEnd = () => {
    setDraggedDay(null);
    setDragOverDay(null);
  };

  // Check if a day can be dragged (today and future days)
  const canDragDay = (day) => {
    return !day.completed;
  };

  const startWorkout = () => {
    if (pausedWorkout) {
      // Resume paused workout
      navigation.navigate('ActiveWorkout', {
        workoutName: pausedWorkout.workoutName || 'Workout',
        workout: pausedWorkout.workout,
        sessionId: pausedWorkout.sessionId,
        resumedExercises: pausedWorkout.exercises,
        resumedTime: pausedWorkout.elapsedTime,
      });
      // Clear paused workout after resuming
      clearPausedWorkout();
      setPausedWorkoutState(null);
    } else {
      // Show start workout options modal
      setShowStartModal(true);
    }
  };

  const startFreeformWorkout = () => {
    setShowStartModal(false);
    navigation.navigate('ActiveWorkout', {
      workoutName: 'Workout',
      workout: null,
    });
  };

  const startScheduledWorkout = () => {
    setShowStartModal(false);
    if (todaySchedule?.workout && todaySchedule?.templateId) {
      const template = WORKOUT_TEMPLATES[todaySchedule.templateId];
      if (template) {
        navigation.navigate('ActiveWorkout', {
          workoutName: template.name,
          workout: template,
          templateId: todaySchedule.templateId,
          scheduleId: todaySchedule.scheduleId,
        });
      } else {
        // Fallback to freeform
        navigation.navigate('ActiveWorkout', {
          workoutName: todaySchedule.workout,
          workout: null,
        });
      }
    } else {
      // No scheduled workout, start freeform
      navigation.navigate('ActiveWorkout', {
        workoutName: 'Workout',
        workout: null,
      });
    }
  };

  const startFromTemplate = (templateId) => {
    setShowStartModal(false);
    const template = WORKOUT_TEMPLATES[templateId];
    if (template) {
      navigation.navigate('ActiveWorkout', {
        workoutName: template.name,
        workout: template,
        templateId: templateId,
      });
    }
  };

  // Filter templates based on search
  const filteredTemplates = Object.entries(WORKOUT_TEMPLATES).filter(([id, template]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.focus?.toLowerCase().includes(query) ||
      template.exercises?.some(ex => ex.name.toLowerCase().includes(query))
    );
  });

  const weekDates = getWeekDates();
  const todaySchedule = weekDates.find(d => d.isToday);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* THIS WEEK Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>

          <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.weekNavBtn}
              onPress={() => setWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <Text style={styles.weekTitle}>{getWeekHeaderText()}</Text>

            <View style={styles.weekNavRight}>
              <TouchableOpacity
                style={styles.weekNavBtn}
                onPress={() => setWeekOffset(prev => prev + 1)}
              >
                <ChevronRight size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.weekNavBtn}>
                <Settings size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Days */}
          {Platform.OS === 'web' ? (
            <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
              {weekDates.map((day) => {
                const isCompleted = day.completed;
                const isMissed = day.isPast && !day.isRest && !isCompleted;
                const isDragging = draggedDay === day.dayIndex;
                const isDragOver = dragOverDay === day.dayIndex;
                const canDrag = canDragDay(day);
                const isHovered = hoveredDay === day.dayIndex && canDrag;

                const baseStyle = {
                  flex: 1,
                  backgroundColor: (isDragOver || isHovered) ? 'rgba(155, 89, 182, 0.2)' :
                                   isCompleted ? 'rgba(34, 197, 94, 0.08)' :
                                   isMissed ? 'rgba(239, 68, 68, 0.12)' :
                                   day.isToday ? 'rgba(6, 182, 212, 0.08)' : '#1a1a2e',
                  borderRadius: 12,
                  paddingTop: 12,
                  paddingBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `2px solid ${
                    isDragOver || isHovered ? '#9b59b6' :
                    isCompleted ? '#22c55e' :
                    isMissed ? '#EF4444' :
                    day.isToday ? '#06B6D4' :
                    'transparent'
                  }`,
                  opacity: isDragging ? 0.5 : 1,
                  transform: (isDragOver || isHovered) ? 'scale(1.08)' : isDragging ? 'scale(0.95)' : 'scale(1)',
                  boxShadow: (isDragOver || isHovered) ? '0 4px 16px rgba(155, 89, 182, 0.6)' : 'none',
                  cursor: canDrag ? 'grab' : 'default',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
                  userSelect: 'none',
                  zIndex: (isDragOver || isHovered) ? 10 : 1,
                };

                return (
                  <div
                    key={day.dayIndex}
                    style={baseStyle}
                    draggable={canDrag}
                    onDragStart={(e) => canDrag && handleDragStart(e, day.dayIndex)}
                    onDragOver={(e) => handleDragOver(e, day.dayIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day.dayIndex)}
                    onDragEnd={handleDragEnd}
                    onMouseEnter={() => canDrag && setHoveredDay(day.dayIndex)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <Text style={[
                      styles.dayName,
                      isCompleted && styles.textCompleted,
                      day.isToday && styles.textToday,
                    ]}>
                      {day.dayName}
                    </Text>
                    <Text style={[
                      styles.dayDate,
                      isCompleted && styles.textCompleted,
                      day.isToday && styles.textToday,
                    ]}>
                      {day.dateNum}
                    </Text>
                    <View style={styles.dayWorkoutRow}>
                      {isCompleted && (
                        <Check size={10} color={COLORS.success} strokeWidth={3} />
                      )}
                      <Text style={[
                        styles.dayWorkout,
                        isCompleted && styles.textCompleted,
                        day.isToday && styles.textToday,
                      ]}>
                        {day.isRest ? 'Rest' : day.workout}
                      </Text>
                    </View>
                  </div>
                );
              })}
            </div>
          ) : (
            <View style={styles.weekDays}>
              {weekDates.map((day) => {
                const isCompleted = day.completed;
                const isMissed = day.isPast && !day.isRest && !isCompleted;
                return (
                  <View
                    key={day.dayIndex}
                    style={[
                      styles.dayCard,
                      isCompleted && styles.dayCardCompleted,
                      isMissed && styles.dayCardMissed,
                      day.isToday && styles.dayCardToday,
                    ]}
                  >
                    <Text style={[
                      styles.dayName,
                      isCompleted && styles.textCompleted,
                      isMissed && styles.textMissed,
                      day.isToday && styles.textToday,
                    ]}>
                      {day.dayName}
                    </Text>
                    <Text style={[
                      styles.dayDate,
                      isCompleted && styles.textCompleted,
                      isMissed && styles.textMissed,
                      day.isToday && styles.textToday,
                    ]}>
                      {day.dateNum}
                    </Text>
                    <View style={styles.dayWorkoutRow}>
                      {isCompleted && (
                        <Check size={10} color={COLORS.success} strokeWidth={3} />
                      )}
                      <Text style={[
                        styles.dayWorkout,
                        isCompleted && styles.textCompleted,
                        isMissed && styles.textMissed,
                        day.isToday && styles.textToday,
                      ]}>
                        {day.isRest ? 'Rest' : day.workout}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.weekHint}>Drag days to swap schedule</Text>
        </View>

        {/* TODAY'S WORKOUT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>

          <View style={styles.todayCard}>
            <View style={styles.todayIconContainer}>
              {todaySchedule?.workout ? (
                <Dumbbell size={32} color={COLORS.primary} />
              ) : todaySchedule?.isRest ? (
                <Coffee size={32} color={COLORS.sleep} />
              ) : (
                <Calendar size={32} color={COLORS.textMuted} />
              )}
            </View>
            <View style={styles.todayContent}>
              <Text style={styles.todayTitle}>
                {todaySchedule?.workout ? todaySchedule.workout : todaySchedule?.isRest ? 'Rest Day' : 'No workout scheduled'}
              </Text>
              <Text style={styles.todaySubtitle}>
                {todaySchedule?.workout
                  ? 'Ready to train'
                  : todaySchedule?.isRest
                    ? 'Recovery is part of the process'
                    : 'Set up your training program'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startButton, pausedWorkout && styles.continueButton]}
            onPress={startWorkout}
            onClick={startWorkout}
          >
            <Play size={18} color={COLORS.text} />
            <Text style={styles.startButtonText}>
              {pausedWorkout ? 'Continue Workout' : 'Start Freeform Workout'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ExerciseLibrary')}
            >
              <Dumbbell size={28} color={COLORS.primary} />
              <Text style={styles.quickActionTitle}>Exercise Library</Text>
              <Text style={styles.quickActionSub}>Browse all exercises</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('WorkoutHistory')}
            >
              <Clock size={28} color={COLORS.primary} />
              <Text style={styles.quickActionTitle}>History</Text>
              <Text style={styles.quickActionSub}>View past workouts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PersonalRecords')}
            >
              <Trophy size={28} color={COLORS.warning} />
              <Text style={styles.quickActionTitle}>Personal Records</Text>
              <Text style={styles.quickActionSub}>Your PRs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={startWorkout}>
              <Play size={28} color={COLORS.primary} />
              <Text style={styles.quickActionTitle}>Start Workout</Text>
              <Text style={styles.quickActionSub}>Begin training</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RECENT ACTIVITY Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>

          {workoutHistory.length === 0 ? (
            <View style={styles.emptyActivityCard}>
              <Dumbbell size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyActivityTitle}>No workouts yet</Text>
              <Text style={styles.emptyActivityText}>Complete your first workout to see it here</Text>
            </View>
          ) : (
            workoutHistory.map((workout) => {
              const isExpanded = selectedWorkout?.id === workout.id;
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.activityCard}
                  onPress={() => handleWorkoutPress(workout)}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityHeader}>
                    <View style={styles.activityIcon}>
                      <Dumbbell size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{workout.workout_name || 'Workout'}</Text>
                      <Text style={styles.activityTime}>
                        {workout.duration_minutes ? `${workout.duration_minutes} min` : 'Completed'} • {formatActivityDate(workout.ended_at)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.renameActivityButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRenamePress(workout);
                      }}
                    >
                      <Pencil size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    {isExpanded ? (
                      <ChevronUp size={18} color={COLORS.primary} />
                    ) : (
                      <ChevronDown size={18} color={COLORS.textMuted} />
                    )}
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedDetails}>
                      {detailsLoading ? (
                        <View style={styles.detailsLoading}>
                          <ActivityIndicator size="small" color={COLORS.primary} />
                          <Text style={styles.detailsLoadingText}>Loading exercises...</Text>
                        </View>
                      ) : workoutDetails && workoutDetails.length > 0 ? (
                        workoutDetails.map((exercise, idx) => (
                          <View key={idx} style={styles.exerciseDetail}>
                            <Text style={styles.exerciseDetailName}>{exercise.name}</Text>
                            <View style={styles.exerciseSets}>
                              {exercise.sets.map((set, setIdx) => (
                                <View key={setIdx} style={styles.setDetail}>
                                  <Text style={[styles.setNumber, set.isWarmup && styles.warmupText]}>
                                    {set.isWarmup ? 'W' : setIdx + 1}
                                  </Text>
                                  <Text style={styles.setInfo}>
                                    {set.weight > 0 ? `${set.weight} kg` : 'BW'} × {set.reps}
                                    {set.rpe ? ` @${set.rpe}` : ''}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noDetailsText}>No exercise data recorded</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start Workout Modal */}
      <Modal
        visible={showStartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Workout</Text>
              <TouchableOpacity onPress={() => setShowStartModal(false)} style={styles.modalCloseBtn}>
                <X size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick Start Options */}
            <View style={styles.quickStartOptions}>
              <TouchableOpacity style={styles.quickStartOption} onPress={startFreeformWorkout}>
                <View style={[styles.quickStartIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Play size={24} color={COLORS.primary} />
                </View>
                <View style={styles.quickStartInfo}>
                  <Text style={styles.quickStartTitle}>Freeform Workout</Text>
                  <Text style={styles.quickStartDesc}>Build your workout as you go</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              {todaySchedule?.workout && (
                <TouchableOpacity style={styles.quickStartOption} onPress={startScheduledWorkout}>
                  <View style={[styles.quickStartIcon, { backgroundColor: COLORS.success + '20' }]}>
                    <Calendar size={24} color={COLORS.success} />
                  </View>
                  <View style={styles.quickStartInfo}>
                    <Text style={styles.quickStartTitle}>Today's Scheduled</Text>
                    <Text style={styles.quickStartDesc}>{todaySchedule.workout}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Templates */}
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>BROWSE TEMPLATES</Text>
              <View style={styles.searchInputContainer}>
                <Search size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search workouts..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Template List */}
            <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
              {filteredTemplates.slice(0, 10).map(([id, template]) => (
                <TouchableOpacity
                  key={id}
                  style={styles.templateItem}
                  onPress={() => startFromTemplate(id)}
                >
                  <View style={styles.templateIcon}>
                    <Dumbbell size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateFocus}>{template.focus}</Text>
                    <Text style={styles.templateExercises}>{template.exercises?.length || 0} exercises</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rename Workout Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renameModalContainer}>
            <View style={styles.renameModalHeader}>
              <Text style={styles.renameModalTitle}>Rename Workout</Text>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={styles.renameModalCloseBtn}
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
            <View style={styles.renameModalButtons}>
              <TouchableOpacity
                style={styles.renameCancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.renameCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameSaveButton}
                onPress={handleRenameSubmit}
              >
                <Text style={styles.renameSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  // Week Header
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekNavBtn: {
    padding: 8,
  },
  weekTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  weekNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Week Days
  weekDays: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardCompleted: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '15',
  },
  dayCardMissed: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  dayCardToday: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  dayCardDragging: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  dayCardDragOver: {
    borderColor: '#9b59b6',
    backgroundColor: '#9b59b6' + '30',
    shadowColor: '#9b59b6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  dayName: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayDate: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dayWorkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dayWorkout: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  textCompleted: {
    color: COLORS.success,
  },
  textMissed: {
    color: '#EF4444',
  },
  textToday: {
    color: COLORS.primary,
  },
  weekHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },

  // Today's Workout
  todayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  todayIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayContent: {
    flex: 1,
  },
  todayTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  todaySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  continueButton: {
    backgroundColor: '#D97706',
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  quickActionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  quickActionSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Recent Activity
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  activityTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  renameActivityButton: {
    padding: 8,
    marginLeft: 4,
  },
  // Expanded workout details
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  detailsLoadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  exerciseDetail: {
    marginBottom: 12,
  },
  exerciseDetailName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  exerciseSets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  setNumber: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'center',
  },
  warmupText: {
    color: COLORS.warning,
  },
  setInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  noDetailsText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyActivityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyActivityTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyActivityText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  // Start Workout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  quickStartOptions: {
    padding: 16,
    gap: 12,
  },
  quickStartOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 16,
  },
  quickStartIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickStartInfo: {
    flex: 1,
  },
  quickStartTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  quickStartDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  templateList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: 300,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  templateFocus: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  templateExercises: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  // Rename Modal
  renameModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  renameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  renameModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  renameModalCloseBtn: {
    padding: 4,
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
  renameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  renameCancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  renameSaveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  renameSaveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutsScreen;
