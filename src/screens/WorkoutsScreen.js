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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Dumbbell,
  Calendar,
  Play,
  ChevronRight,
  ChevronLeft,
  Clock,
  Trophy,
  Settings,
  Coffee,
  Check,
  Plus,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { getPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';
import { workoutService } from '../services/workoutService';

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
      // Start new freeform workout
      navigation.navigate('ActiveWorkout', {
        workoutName: 'Workout',
        workout: null,
      });
    }
  };

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
            workoutHistory.map((workout) => (
              <TouchableOpacity key={workout.id} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Dumbbell size={20} color={COLORS.primary} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{workout.workout_name || 'Workout'}</Text>
                  <Text style={styles.activityTime}>
                    {workout.duration_minutes ? `${workout.duration_minutes} min` : 'Completed'} • {formatActivityDate(workout.ended_at)}
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
});

export default WorkoutsScreen;
