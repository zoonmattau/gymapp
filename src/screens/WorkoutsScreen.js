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
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Star,
  Trophy,
  Bookmark,
} from 'lucide-react-native';
import { WORKOUT_TEMPLATES, AVAILABLE_PROGRAMS, GOAL_TO_PROGRAM } from '../constants/workoutTemplates';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { getPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';
import { getCustomTemplates } from '../utils/customTemplateStore';
import { workoutService } from '../services/workoutService';
import { publishedWorkoutService } from '../services/publishedWorkoutService';
import { supabase } from '../lib/supabase';
import ExerciseLink from '../components/ExerciseLink';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


// Get RPE color on a green to red scale (0-10)
const getRpeColor = (rpe) => {
  const value = parseFloat(rpe) || 0;
  const clamped = Math.min(10, Math.max(0, value));
  const hue = 120 - (clamped / 10) * 120;
  return `hsl(${hue}, 70%, 45%)`;
};

const WorkoutsScreen = () => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { isActive: bannerActive } = useActiveWorkout();
  const weightUnit = profile?.weight_unit || 'kg';
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
  const [exerciseHistoryCache, setExerciseHistoryCache] = useState({}); // { exerciseName: [{ weight, reps, started_at }] }
  const [expandedExerciseGraph, setExpandedExerciseGraph] = useState(null); // exercise name with graph shown

  // History stats
  const [workoutSetCounts, setWorkoutSetCounts] = useState({});
  const [todayPRs, setTodayPRs] = useState([]);
  const [mostActiveDay, setMostActiveDay] = useState(null);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  // Repertoire
  const [repertoireWorkouts, setRepertoireWorkouts] = useState([]);

  // Program setup modal state
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [settingUpProgram, setSettingUpProgram] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedDays, setSelectedDays] = useState([true, false, true, false, true, false, false]);
  // dayAssignments: { [Mon-Sun index 0-6]: templateId }
  const [dayAssignments, setDayAssignments] = useState({});
  const [editingDayIdx, setEditingDayIdx] = useState(null);
  const [draggingAssignDayIdx, setDraggingAssignDayIdx] = useState(null);
  const [dragOverAssignDayIdx, setDragOverAssignDayIdx] = useState(null);

  // Custom templates
  const [customTemplates, setCustomTemplates] = useState([]);

  // Week data cache for seamless scrolling
  const [weekCache, setWeekCache] = useState({});
  const [weekLoading, setWeekLoading] = useState(false);

  // Check for paused workout and load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      const stored = getPausedWorkout();
      if (stored) {
        setPausedWorkoutState(stored);
      }
      if (user?.id) {
        loadWorkoutData();
        getCustomTemplates(user.id).then(setCustomTemplates);
        // Load repertoire
        Promise.all([
          publishedWorkoutService.getUserPublishedWorkouts(user.id),
          publishedWorkoutService.getSavedWorkoutsWithDetails(user.id),
        ]).then(([ownResult, savedResult]) => {
          const seen = new Set();
          const merged = [];
          for (const w of [...(ownResult.data || []), ...(savedResult.data || [])]) {
            if (!seen.has(w.id)) { seen.add(w.id); merged.push(w); }
          }
          setRepertoireWorkouts(merged);
        }).catch(() => {});
      }
    }, [user])
  );

  // Reload data when week changes - use cache for instant feedback
  useEffect(() => {
    if (user?.id) {
      // Check if we have cached data for this week
      if (weekCache[weekOffset]) {
        // Use cached data immediately
        setWeekSchedule(weekCache[weekOffset]);
        // Still refresh in background
        loadWorkoutData(true);
      } else {
        // No cache - show loading indicator but keep current view
        setWeekLoading(true);
        loadWorkoutData(false);
      }
    }
  }, [weekOffset]);

  const formatDateForDB = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Assign program templates to active days, cycling/repeating to fill any number of days
  const buildDefaultAssignments = (days, program) => {
    const assignments = {};
    let templateIdx = 0;
    days.forEach((isActive, dayIdx) => {
      if (isActive) {
        // Cycle through the template list — handles more OR fewer days than the program default
        assignments[dayIdx] = program.schedule[templateIdx % program.schedule.length];
        templateIdx++;
      }
    });
    return assignments;
  };

  // Uses selectedProgram, selectedDays, dayAssignments from state
  const setupProgram = async () => {
    if (!user?.id || settingUpProgram || !selectedProgram) return;
    setSettingUpProgram(true);
    try {
      const today = new Date();
      const todayDow = today.getDay();
      const todayWeekIndex = todayDow === 0 ? 6 : todayDow - 1;
      const optimisticUpdates = {};

      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const scheduleDate = new Date(today);
          scheduleDate.setDate(today.getDate() + (week * 7) + day);
          const dow = scheduleDate.getDay();
          const weekDayIdx = dow === 0 ? 6 : dow - 1;

          const templateId = dayAssignments[weekDayIdx];
          const dateStr = formatDateForDB(scheduleDate);

          if (templateId) {
            const template = WORKOUT_TEMPLATES[templateId];
            if (!template) continue;

            if (week === 0) {
              const weekIdx = (todayWeekIndex + day) % 7;
              optimisticUpdates[weekIdx] = {
                workout: template.name,
                isRest: false,
                completed: false,
                templateId,
                scheduleId: null,
              };
            }

            const { error } = await workoutService.setScheduleForDate(user.id, dateStr, templateId, false);
            if (error) {
              console.log('Schedule save error:', error.message, '| date:', dateStr, '| templateId:', templateId);
            }
          } else {
            // Unassigned day = rest day
            if (week === 0) {
              const weekIdx = (todayWeekIndex + day) % 7;
              optimisticUpdates[weekIdx] = {
                workout: null,
                isRest: true,
                completed: false,
                templateId: null,
                scheduleId: null,
              };
            }

            const { error } = await workoutService.setScheduleForDate(user.id, dateStr, null, true);
            if (error) {
              console.log('Rest day save error:', error.message, '| date:', dateStr);
            }
          }
        }
      }

      setWeekSchedule(prev => ({ ...prev, ...optimisticUpdates }));
      setWeekCache({});

      // Persist program config locally so it survives screen refreshes
      // even if the DB write fails
      try {
        const key = `uprep_program_${user.id}`;
        const config = JSON.stringify({ assignments: dayAssignments, savedAt: Date.now() });
        if (Platform.OS === 'web') {
          localStorage.setItem(key, config);
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(key, config);
        }
      } catch (e) {
        console.log('Could not persist program locally:', e);
      }

      setSelectedProgram(null);
      setDayAssignments({});
      setEditingDayIdx(null);
      setShowProgramModal(false);
    } catch (error) {
      console.log('Error setting up program:', error);
    } finally {
      setSettingUpProgram(false);
    }
  };

  // Returns a [Mon..Sun] boolean array pre-selecting sensible days for numDays
  const getDefaultDays = (numDays) => {
    const presets = {
      1: [true, false, false, false, false, false, false],
      2: [true, false, false, true, false, false, false],
      3: [true, false, true, false, true, false, false],
      4: [true, true, false, true, true, false, false],
      5: [true, true, true, true, true, false, false],
      6: [true, true, true, true, true, true, false],
      7: [true, true, true, true, true, true, true],
    };
    return presets[Math.min(Math.max(numDays, 1), 7)] || presets[4];
  };

  const loadWorkoutData = async (isBackgroundRefresh = false) => {
    // Capture current weekOffset to avoid race conditions
    const currentWeekOffset = weekOffset;

    try {
      // Get workout schedule for the current week
      const weekStart = getWeekStartDate(currentWeekOffset);
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
          const localTemplate = daySchedule.template_id ? (WORKOUT_TEMPLATES[daySchedule.template_id] || customTemplates.find(t => t.id === daySchedule.template_id)) : null;
          newSchedule[i] = {
            workout: daySchedule.is_rest_day ? null : (daySchedule.workout_templates?.name || localTemplate?.name || 'Workout'),
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

      // If DB returned no schedule at all, fall back to locally persisted program config
      const hasAnyDbSchedule = Object.values(newSchedule).some(d => d.workout || d.isRest);
      if (!hasAnyDbSchedule && user?.id) {
        try {
          const key = `uprep_program_${user.id}`;
          const raw = Platform.OS === 'web'
            ? localStorage.getItem(key)
            : await require('@react-native-async-storage/async-storage').default.getItem(key);
          if (raw) {
            const { assignments } = JSON.parse(raw);
            // Apply local template assignments to the week
            for (let i = 0; i < 7; i++) {
              const dayDate = new Date(weekStart);
              dayDate.setDate(dayDate.getDate() + i);
              const dow = dayDate.getDay();
              const weekDayIdx = dow === 0 ? 6 : dow - 1;
              const templateId = assignments[weekDayIdx];
              if (templateId) {
                const t = WORKOUT_TEMPLATES[templateId] || customTemplates.find(ct => ct.id === templateId);
                if (t) {
                  newSchedule[i] = { workout: t.name, isRest: false, completed: false, templateId, scheduleId: null };
                }
              } else {
                newSchedule[i] = { workout: null, isRest: true, completed: false, templateId: null, scheduleId: null };
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Only update if still on the same week (avoid race conditions)
      if (currentWeekOffset === weekOffset) {
        setWeekSchedule(newSchedule);
        // Cache the week data
        setWeekCache(prev => ({ ...prev, [currentWeekOffset]: newSchedule }));
      }

      // Load recent workout history (only on initial load, not background refresh)
      if (!isBackgroundRefresh) {
        const { data: historyData } = await workoutService.getWorkoutHistory(user.id, 30);
        const allHistory = historyData || [];
        const displayHistory = allHistory.slice(0, 5);
        setWorkoutHistory(displayHistory);

        // Compute most active day of week from full history
        const dayCount = {};
        allHistory.forEach(w => {
          const d = new Date(w.started_at).getDay();
          dayCount[d] = (dayCount[d] || 0) + 1;
        });
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let maxDay = null, maxCount = 0;
        Object.entries(dayCount).forEach(([d, c]) => {
          if (c > maxCount) { maxCount = c; maxDay = parseInt(d); }
        });
        setMostActiveDay(maxDay !== null ? dayNames[maxDay] : null);

        // Fetch set/rep counts for displayed sessions
        if (displayHistory.length > 0) {
          const sessionIds = displayHistory.map(w => w.id);
          const { data: setsData } = await supabase
            .from('workout_sets')
            .select('session_id, reps')
            .in('session_id', sessionIds);

          const counts = {};
          (setsData || []).forEach(s => {
            if (!counts[s.session_id]) counts[s.session_id] = { sets: 0, reps: 0 };
            counts[s.session_id].sets += 1;
            counts[s.session_id].reps += (s.reps || 0);
          });
          setWorkoutSetCounts(counts);

          // Find today's workout and fetch its PRs
          const today = new Date().toDateString();
          const todayWorkout = displayHistory.find(w => {
            const workoutDate = new Date(w.ended_at || w.started_at);
            return workoutDate.toDateString() === today;
          });
          if (todayWorkout) {
            const { data: prData } = await supabase
              .from('personal_records')
              .select('exercise_name, weight, reps')
              .eq('workout_session_id', todayWorkout.id);
            setTodayPRs(prData || []);
          } else {
            setTodayPRs([]);
          }
        }
      }

    } catch (error) {
      console.log('Error loading workout data:', error);
    } finally {
      setLoading(false);
      setWeekLoading(false);
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

  const handleDeletePress = (workout, e) => {
    e?.stopPropagation?.();
    setWorkoutToDelete(workout);
  };

  const handleConfirmDelete = async () => {
    if (!workoutToDelete) return;
    const { error } = await workoutService.deleteWorkoutSession(workoutToDelete.id);
    if (!error) {
      setWorkoutHistory(prev => prev.filter(w => w.id !== workoutToDelete.id));
      setWorkoutSetCounts(prev => {
        const next = { ...prev };
        delete next[workoutToDelete.id];
        return next;
      });
      if (selectedWorkout?.id === workoutToDelete.id) {
        setSelectedWorkout(null);
        setWorkoutDetails(null);
      }
    }
    setWorkoutToDelete(null);
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
        .order('set_number', { ascending: true });

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

  // Load exercise history for 1RM graph
  const loadExerciseHistory = async (exerciseName) => {
    if (exerciseHistoryCache[exerciseName]) return;

    try {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('weight, reps, session:workout_sessions!inner(started_at, user_id)')
        .eq('exercise_name', exerciseName)
        .eq('session.user_id', user.id)
        .order('session(started_at)', { ascending: true });

      if (!error && data) {
        setExerciseHistoryCache(prev => ({ ...prev, [exerciseName]: data }));
      }
    } catch (err) {
      console.log('Error loading exercise history:', err);
    }
  };

  // Toggle exercise graph and load history if needed
  const toggleExerciseGraph = (exerciseName) => {
    if (expandedExerciseGraph === exerciseName) {
      setExpandedExerciseGraph(null);
    } else {
      setExpandedExerciseGraph(exerciseName);
      loadExerciseHistory(exerciseName);
    }
  };

  const getWeekHeaderText = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === 1) return 'Next Week';
    if (weekOffset === -1) return 'Last Week';
    return `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`;
  };

  // Get short workout name for mobile display
  const getShortWorkoutName = (workout) => {
    if (!workout) return '';
    // Common mappings
    const mappings = {
      'Upper Body Push': 'Push',
      'Upper Body Pull': 'Pull',
      'Lower Body': 'Legs',
      'Full Body': 'Full',
      'Chest & Back': 'Chest',
      'Arms & Shoulders': 'Arms',
      'Chest & Triceps': 'Chest',
      'Back & Biceps': 'Back',
      'Shoulders & Arms': 'Arms',
      'Legs & Core': 'Legs',
    };
    if (mappings[workout]) return mappings[workout];
    // Otherwise take first word
    return workout.split(' ')[0].replace('&', '').trim();
  };

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (weekOffset * 7));

    // Account creation date check
    const accountCreated = user?.created_at ? new Date(user.created_at) : null;
    const accountCreatedStart = accountCreated ? new Date(accountCreated.toDateString()) : null;

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const isPast = date < todayStart;
      const isBeforeAccount = accountCreatedStart && date < accountCreatedStart;

      dates.push({
        dayIndex: i,
        dayName: DAYS[i],
        dateNum: date.getDate(),
        isToday,
        isPast,
        isFuture: !isPast && !isToday,
        isBeforeAccount,
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

  const handleDrop = async (e, targetDayIndex) => {
    e.preventDefault();
    // Only allow drop on non-completed days
    if (draggedDay !== null && targetDayIndex !== draggedDay && !weekSchedule[targetDayIndex]?.completed) {
      const sourceDay = weekSchedule[draggedDay];
      const targetDay = weekSchedule[targetDayIndex];

      // Swap workouts between dragged and target day in UI
      setWeekSchedule(prev => {
        const newSchedule = { ...prev };
        const temp = { ...newSchedule[draggedDay] };
        newSchedule[draggedDay] = { ...newSchedule[targetDayIndex] };
        newSchedule[targetDayIndex] = temp;
        return newSchedule;
      });

      // Save the swap to the database
      try {
        const weekStart = getWeekStartDate(weekOffset);

        // Calculate the actual dates for both days
        const sourceDate = new Date(weekStart);
        sourceDate.setDate(sourceDate.getDate() + draggedDay);
        const targetDate = new Date(weekStart);
        targetDate.setDate(targetDate.getDate() + targetDayIndex);

        const sourceDateStr = formatDate(sourceDate);
        const targetDateStr = formatDate(targetDate);

        // Update both schedule entries in the database
        if (sourceDay.scheduleId && targetDay.scheduleId) {
          // Both have schedule entries - swap the dates
          await Promise.all([
            supabase.from('workout_schedule').update({ scheduled_date: targetDateStr }).eq('id', sourceDay.scheduleId),
            supabase.from('workout_schedule').update({ scheduled_date: sourceDateStr }).eq('id', targetDay.scheduleId),
          ]);
        } else if (sourceDay.scheduleId) {
          // Only source has a schedule - move it to target date
          await supabase.from('workout_schedule').update({ scheduled_date: targetDateStr }).eq('id', sourceDay.scheduleId);
        } else if (targetDay.scheduleId) {
          // Only target has a schedule - move it to source date
          await supabase.from('workout_schedule').update({ scheduled_date: sourceDateStr }).eq('id', targetDay.scheduleId);
        }

        // Update the cache
        setWeekCache(prev => ({ ...prev, [weekOffset]: undefined }));
      } catch (error) {
        console.log('Error saving schedule swap:', error);
        // Revert the UI change on error
        setWeekSchedule(prev => {
          const newSchedule = { ...prev };
          const temp = { ...newSchedule[targetDayIndex] };
          newSchedule[targetDayIndex] = { ...newSchedule[draggedDay] };
          newSchedule[draggedDay] = temp;
          return newSchedule;
        });
      }
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
    if (!bannerActive && pausedWorkout) {
      // Resume paused workout (only when banner isn't handling it)
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

  const startFromCustomTemplate = (template) => {
    setShowStartModal(false);
    navigation.navigate('ActiveWorkout', {
      workoutName: template.name,
      workout: template,
    });
  };

  const startFromRepertoire = (workout) => {
    setShowStartModal(false);
    const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises;
    navigation.navigate('ActiveWorkout', {
      workoutName: workout.name,
      workout: {
        id: workout.id,
        name: workout.name,
        exercises: (exercises || []).map(ex => ({
          name: ex.name,
          sets: ex.sets || 3,
          targetReps: ex.reps,
          suggestedWeight: ex.weight,
          targetRpe: ex.rpe,
        })),
      },
    });
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

  const filteredCustomTemplates = customTemplates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.focus?.toLowerCase().includes(query) ||
      template.exercises?.some(ex => ex.name.toLowerCase().includes(query))
    );
  });

  const filteredRepertoire = repertoireWorkouts.filter(workout => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises;
    return (
      workout.name?.toLowerCase().includes(query) ||
      exercises?.some(e => e.name?.toLowerCase().includes(query))
    );
  });

  const weekDates = getWeekDates();
  const todaySchedule = weekDates.find(d => d.isToday);

  // Find today's completed workout for stats
  const todayCompletedWorkout = todaySchedule?.completed
    ? workoutHistory.find(w => {
        const workoutDate = new Date(w.ended_at || w.started_at);
        const today = new Date();
        return workoutDate.toDateString() === today.toDateString();
      })
    : null;
  const todayWorkoutCounts = todayCompletedWorkout ? workoutSetCounts[todayCompletedWorkout.id] : null;

  const scrollContent = (
      <>
        {/* Week Section */}
        <View style={styles.section}>
          <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.weekNavBtn}
              onPress={() => setWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.weekTitleContainer}>
              <Text style={styles.sectionLabel}>{getWeekHeaderText().toUpperCase()}</Text>
              {weekLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
              )}
            </View>

            <TouchableOpacity
              style={styles.weekNavBtn}
              onPress={() => setWeekOffset(prev => prev + 1)}
            >
              <ChevronRight size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Week Days */}
          {Platform.OS === 'web' ? (
            <div style={{ display: 'flex', flexDirection: 'row', gap: 6, width: '100%' }}>
              {weekDates.map((day) => {
                const isCompleted = day.completed;
                const isMissed = day.isPast && !day.isRest && !isCompleted && !day.isBeforeAccount;
                const isDragging = draggedDay === day.dayIndex;
                const isDragOver = dragOverDay === day.dayIndex;
                const canDrag = canDragDay(day);
                const isHovered = hoveredDay === day.dayIndex && canDrag;

                const baseStyle = {
                  flex: '1 1 0',
                  minWidth: 0,
                  width: 'calc((100% - 36px) / 7)',
                  backgroundColor: (isDragOver || isHovered) ? COLORS.primary + '30' :
                                   isCompleted ? COLORS.primary + '15' :
                                   isMissed ? COLORS.error + '15' :
                                   day.isToday ? COLORS.primary + '15' : COLORS.surface,
                  borderRadius: 12,
                  paddingTop: 12,
                  paddingBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${
                    isDragOver || isHovered ? COLORS.primary :
                    isCompleted ? COLORS.primary :
                    isMissed ? COLORS.error :
                    day.isToday ? COLORS.primary :
                    'transparent'
                  }`,
                  opacity: isDragging ? 0.5 : 1,
                  transform: (isDragOver || isHovered) ? 'scale(1.05)' : isDragging ? 'scale(0.95)' : 'scale(1)',
                  boxShadow: (isDragOver || isHovered) ? `0 4px 16px ${COLORS.primary}90` : 'none',
                  cursor: canDrag ? 'grab' : 'default',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
                  userSelect: 'none',
                  zIndex: (isDragOver || isHovered) ? 10 : 1,
                  boxSizing: 'border-box',
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
                      {isCompleted ? (
                        <Check size={16} color={COLORS.primary} strokeWidth={3} />
                      ) : (
                        <Text style={[
                          styles.dayWorkout,
                          day.isToday && styles.textToday,
                        ]} numberOfLines={1}>
                          {day.isRest ? 'Rest' : getShortWorkoutName(day.workout)}
                        </Text>
                      )}
                    </View>
                  </div>
                );
              })}
            </div>
          ) : (
            <View style={styles.weekDays}>
              {weekDates.map((day) => {
                const isCompleted = day.completed;
                const isMissed = day.isPast && !day.isRest && !isCompleted && !day.isBeforeAccount;
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
                      {isCompleted ? (
                        <Check size={16} color={COLORS.primary} strokeWidth={3} />
                      ) : (
                        <Text style={[
                          styles.dayWorkout,
                          isMissed && styles.textMissed,
                          day.isToday && styles.textToday,
                        ]} numberOfLines={1}>
                          {day.isRest ? 'Rest' : getShortWorkoutName(day.workout)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.weekHint}>Drag days to swap schedule</Text>

          {/* Weekly Stats Summary */}
          {workoutHistory.length > 0 && (() => {
            const totalSets = Object.values(workoutSetCounts).reduce((a, c) => a + c.sets, 0);
            const totalReps = Object.values(workoutSetCounts).reduce((a, c) => a + c.reps, 0);
            const workoutsCompleted = workoutHistory.length;
            return (
              <View style={styles.weeklyStatsRow}>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatValue}>{workoutsCompleted}</Text>
                  <Text style={styles.weeklyStatLabel}>Workouts</Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatValue}>{totalSets}</Text>
                  <Text style={styles.weeklyStatLabel}>Sets</Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatValue}>{totalReps >= 1000 ? `${(totalReps / 1000).toFixed(1)}k` : totalReps}</Text>
                  <Text style={styles.weeklyStatLabel}>Reps</Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* TODAY'S WORKOUT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>

          <View style={[styles.todayCard, todaySchedule?.completed && styles.todayCardCompleted]}>
            <View style={styles.todayContent}>
              <Text style={styles.todayTitle}>
                {todaySchedule?.completed
                  ? 'Workout Complete'
                  : todaySchedule?.workout
                    ? todaySchedule.workout
                    : todaySchedule?.isRest
                      ? 'Rest Day'
                      : 'No workout scheduled'}
              </Text>
              {todaySchedule?.completed && todayCompletedWorkout ? (
                <View style={styles.todayStatsContainer}>
                  <View style={styles.todayStats}>
                    {todayCompletedWorkout.duration_minutes > 0 && (
                      <View style={styles.todayStatItem}>
                        <Text style={styles.todayStatValue}>{todayCompletedWorkout.duration_minutes}</Text>
                        <Text style={styles.todayStatLabel}>min</Text>
                      </View>
                    )}
                    {todayWorkoutCounts?.sets > 0 && (
                      <View style={styles.todayStatItem}>
                        <Text style={styles.todayStatValue}>{todayWorkoutCounts.sets}</Text>
                        <Text style={styles.todayStatLabel}>sets</Text>
                      </View>
                    )}
                    {todayWorkoutCounts?.reps > 0 && (
                      <View style={styles.todayStatItem}>
                        <Text style={styles.todayStatValue}>{todayWorkoutCounts.reps}</Text>
                        <Text style={styles.todayStatLabel}>reps</Text>
                      </View>
                    )}
                    {todayCompletedWorkout.total_volume > 0 && (
                      <View style={styles.todayStatItem}>
                        <Text style={styles.todayStatValue}>{Math.round(todayCompletedWorkout.total_volume / 1000)}k</Text>
                        <Text style={styles.todayStatLabel}>{weightUnit}</Text>
                      </View>
                    )}
                  </View>
                  {todayPRs.length > 0 && (
                    <View style={styles.todayPRsContainer}>
                      <Text style={styles.todayPRsTitle}>{todayPRs.length} New PR{todayPRs.length > 1 ? 's' : ''}</Text>
                      {todayPRs.map((pr, idx) => {
                        const displayWeight = weightUnit === 'lbs' ? Math.round(pr.weight * 2.205) : pr.weight;
                        return (
                          <View key={idx} style={styles.todayPRRow}>
                            <Text style={styles.todayPRExercise} numberOfLines={1}>{pr.exercise_name}</Text>
                            <Text style={styles.todayPRWeight}>{displayWeight}{weightUnit}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.todaySubtitle}>
                  {todaySchedule?.workout
                    ? 'Ready to train'
                    : todaySchedule?.isRest
                      ? 'Recovery is part of the process'
                      : 'Tap Start to begin'}
                </Text>
              )}
            </View>
          </View>

          {!todaySchedule?.completed && (
            <TouchableOpacity
              style={[styles.startButton, !bannerActive && pausedWorkout && styles.continueButton]}
              onPress={startWorkout}
              onClick={startWorkout}
            >
              <Text style={styles.startButtonText}>
                {!bannerActive && pausedWorkout ? 'Continue Workout' : 'Start Workout'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RECENT ACTIVITY Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>

          {workoutHistory.length > 0 && (() => {
            const totalSets = Object.values(workoutSetCounts).reduce((a, c) => a + c.sets, 0);
            const totalReps = Object.values(workoutSetCounts).reduce((a, c) => a + c.reps, 0);
            return (
              <View style={styles.historyStats}>
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatValue}>{totalSets || '—'}</Text>
                  <Text style={styles.historyStatLabel}>Sets</Text>
                </View>
                <View style={styles.historyStatDivider} />
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatValue}>{totalReps || '—'}</Text>
                  <Text style={styles.historyStatLabel}>Reps</Text>
                </View>
                <View style={styles.historyStatDivider} />
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatValue}>{mostActiveDay || '—'}</Text>
                  <Text style={styles.historyStatLabel}>Best Day</Text>
                </View>
              </View>
            );
          })()}

          {workoutHistory.length === 0 ? (
            <View style={styles.emptyActivityCard}>
              <Text style={styles.emptyActivityTitle}>No workouts yet</Text>
              <Text style={styles.emptyActivityText}>Complete your first workout to see it here</Text>
            </View>
          ) : (
            workoutHistory.map((workout) => {
              const isExpanded = selectedWorkout?.id === workout.id;
              const counts = workoutSetCounts[workout.id];
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.activityCard}
                  onPress={() => handleWorkoutPress(workout)}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityHeader}>
                    <View style={styles.activityInfo}>
                      <View style={styles.activityTitleRow}>
                        <Text style={styles.activityTitle}>{workout.workout_name || 'Workout'}</Text>
                        {workout.rating > 0 && (
                          <View style={styles.ratingDisplay}>
                            <Star size={12} color={COLORS.warning} fill={COLORS.warning} />
                            <Text style={styles.ratingText}>{workout.rating}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.activityTime}>
                        {counts?.sets > 0
                          ? `${counts.sets} sets • ${counts.reps} reps • ${formatActivityDate(workout.ended_at)}`
                          : formatActivityDate(workout.ended_at)}
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
                    <TouchableOpacity
                      style={styles.deleteActivityButton}
                      onPress={(e) => handleDeletePress(workout, e)}
                    >
                      <Trash2 size={16} color={COLORS.error} />
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
                        workoutDetails.map((exercise, idx) => {
                          const workingSets = exercise.sets.filter(s => !s.isWarmup);
                          const weights = workingSets.map(s => parseFloat(s.weight) || 0).filter(w => w > 0);
                          const topWeight = weights.length > 0 ? Math.max(...weights) : 0;
                          const displayWeight = weightUnit === 'lbs' ? Math.round(topWeight * 2.205) : topWeight;

                          // Calculate max weight from this workout
                          const maxWeight = workingSets.reduce((best, s) => {
                            const w = parseFloat(s.weight) || 0;
                            return w > best ? w : best;
                          }, 0);

                          const isGraphExpanded = expandedExerciseGraph === exercise.name;
                          const history = exerciseHistoryCache[exercise.name] || [];

                          return (
                            <View key={idx}>
                              <TouchableOpacity
                                style={styles.exerciseDetailRow}
                                onPress={() => toggleExerciseGraph(exercise.name)}
                              >
                                <View style={styles.exerciseDetailLeft}>
                                  <ExerciseLink exerciseName={exercise.name} style={styles.exerciseDetailName} numberOfLines={1} />
                                  <Text style={styles.exerciseDetailStats}>
                                    {workingSets.length} sets{topWeight > 0 ? ` · ${displayWeight}${weightUnit}` : ''}
                                  </Text>
                                </View>
                                {isGraphExpanded ? (
                                  <ChevronUp size={16} color={COLORS.primary} />
                                ) : (
                                  <ChevronDown size={16} color={COLORS.textMuted} />
                                )}
                              </TouchableOpacity>

                              {/* 1RM History Graph */}
                              {isGraphExpanded && (
                                <View style={styles.exerciseGraphContainer}>
                                  {history.length >= 2 ? (() => {
                                    // Group by session date, find max weight per session
                                    const sessionMaxWeights = {};
                                    history.forEach(h => {
                                      const date = h.session?.started_at?.split('T')[0] || 'unknown';
                                      const w = parseFloat(h.weight) || 0;
                                      if (!sessionMaxWeights[date] || w > sessionMaxWeights[date]) {
                                        sessionMaxWeights[date] = w;
                                      }
                                    });

                                    const sortedDates = Object.keys(sessionMaxWeights).sort();
                                    const chartData = sortedDates.slice(-10).map(d => Math.round(sessionMaxWeights[d]));
                                    const labels = sortedDates.slice(-10).map(d => {
                                      const date = new Date(d);
                                      return `${date.getDate()}/${date.getMonth() + 1}`;
                                    });

                                    if (chartData.length < 2) {
                                      return <Text style={styles.noGraphDataText}>Need more sessions for graph</Text>;
                                    }

                                    const startVal = chartData[0];
                                    const endVal = chartData[chartData.length - 1];
                                    const change = endVal - startVal;

                                    return (
                                      <>
                                        <LineChart
                                          data={{
                                            labels: labels.length > 5 ? labels.filter((_, i) => i % 2 === 0) : labels,
                                            datasets: [{ data: chartData, color: () => COLORS.primary, strokeWidth: 2 }],
                                          }}
                                          width={Dimensions.get('window').width - 80}
                                          height={100}
                                          withVerticalLabels={true}
                                          withHorizontalLabels={true}
                                          withInnerLines={false}
                                          withOuterLines={false}
                                          withDots={true}
                                          fromZero={false}
                                          chartConfig={{
                                            backgroundColor: 'transparent',
                                            backgroundGradientFrom: COLORS.surfaceLight,
                                            backgroundGradientTo: COLORS.surfaceLight,
                                            decimalPlaces: 0,
                                            color: () => COLORS.primary,
                                            labelColor: () => COLORS.textMuted,
                                            propsForDots: { r: '3', strokeWidth: '0', fill: COLORS.primary },
                                            propsForLabels: { fontSize: 9 },
                                          }}
                                          bezier
                                          style={styles.exerciseGraph}
                                        />
                                        <View style={styles.graphStatsRow}>
                                          <Text style={styles.graphStatText}>Start: {startVal}{weightUnit}</Text>
                                          <Text style={styles.graphStatText}>Now: {endVal}{weightUnit}</Text>
                                          <Text style={[styles.graphStatText, { color: change >= 0 ? COLORS.success : COLORS.error }]}>
                                            {change >= 0 ? '+' : ''}{change}{weightUnit}
                                          </Text>
                                        </View>
                                      </>
                                    );
                                  })() : (
                                    <Text style={styles.noGraphDataText}>Complete more sessions to see progress</Text>
                                  )}
                                </View>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.noDetailsText}>No exercise data recorded</Text>
                      )}

                      {/* View Summary Button */}
                      <TouchableOpacity
                        style={styles.viewSummaryButton}
                        onPress={() => {
                          const formattedExercises = (workoutDetails || []).map(ex => ({
                            name: ex.name,
                            sets: ex.sets.map(s => ({
                              weight: s.weight,
                              reps: s.reps,
                              rpe: s.rpe,
                              completed: true,
                              isWarmup: s.isWarmup,
                            })),
                          }));

                          const durationMins = workout.duration_minutes ||
                            (workout.ended_at && workout.started_at
                              ? Math.round((new Date(workout.ended_at) - new Date(workout.started_at)) / 60000)
                              : 0);

                          navigation.navigate('WorkoutSummary', {
                            summary: {
                              sessionId: workout.id,
                              workoutName: workout.workout_name || 'Workout',
                              duration: durationMins * 60,
                              totalSets: formattedExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
                              completedSets: formattedExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
                              exercises: formattedExercises,
                              totalVolume: workout.total_volume || 0,
                              newPRs: [],
                              isFromHistory: true,
                            },
                          });
                        }}
                      >
                        <Text style={styles.viewSummaryButtonText}>View Summary</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* PRs & Design Row */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickRowCard}
            onPress={() => navigation.navigate('PersonalRecords')}
          >
            <Text style={styles.quickRowTitle}>Personal Records</Text>
            <Text style={styles.quickRowSub}>View your PRs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickRowCard}
            onPress={() => navigation.navigate('CreateWorkout')}
          >
            <Text style={styles.quickRowTitle}>Design Workout</Text>
            <Text style={styles.quickRowSub}>Create template</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </>
  );

  const modals = (
      <>
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
                <View style={styles.quickStartInfo}>
                  <Text style={styles.quickStartTitle}>Workout</Text>
                  <Text style={styles.quickStartDesc}>Build your workout as you go</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              {todaySchedule?.workout && (
                <TouchableOpacity style={styles.quickStartOption} onPress={startScheduledWorkout}>
                  <View style={styles.quickStartInfo}>
                    <Text style={styles.quickStartTitle}>Today's Scheduled</Text>
                    <Text style={styles.quickStartDesc}>{todaySchedule.workout}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* MY REP-ERTOIRE */}
            {filteredRepertoire.length > 0 && (
              <View style={styles.customTemplatesSection}>
                <Text style={styles.searchLabel}>MY REP-ERTOIRE</Text>
                {filteredRepertoire.map(workout => {
                  const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises;
                  return (
                    <TouchableOpacity
                      key={workout.id}
                      style={[styles.customTemplateItem, { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}
                      onPress={() => startFromRepertoire(workout)}
                    >
                      <View style={{ marginRight: 12 }}>
                        <Bookmark size={18} color={COLORS.primary} />
                      </View>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{workout.name}</Text>
                        <Text style={styles.templateFocus}>
                          {workout.creator?.username ? `by @${workout.creator.username}` : 'My workout'}
                        </Text>
                        <Text style={styles.templateExercises}>{exercises?.length || 0} exercises</Text>
                      </View>
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* MY WORKOUTS - Custom Templates */}
            {filteredCustomTemplates.length > 0 && (
              <View style={styles.customTemplatesSection}>
                <Text style={styles.searchLabel}>MY WORKOUTS</Text>
                {filteredCustomTemplates.map(template => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.customTemplateItem}
                    onPress={() => startFromCustomTemplate(template)}
                  >
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateFocus}>{template.focus}</Text>
                      <Text style={styles.templateExercises}>{template.exercises?.length || 0} exercises</Text>
                    </View>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
            <ScrollView
              style={styles.templateList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {filteredTemplates.map(([id, template]) => (
                <TouchableOpacity
                  key={id}
                  style={styles.templateItem}
                  onPress={() => startFromTemplate(id)}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateFocus}>{template.focus}</Text>
                    <Text style={styles.templateExercises}>{template.exercises?.length || 0} exercises</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
              {filteredTemplates.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No templates found</Text>
                </View>
              )}
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
        <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
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

      {/* Delete Workout Confirmation Modal */}
      <Modal
        visible={!!workoutToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkoutToDelete(null)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalIconWrap}>
              <Trash2 size={28} color={COLORS.error} />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Workout</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete{'\n'}
              <Text style={styles.deleteModalWorkoutName}>
                {workoutToDelete?.workout_name || 'Workout'}
              </Text>
              {' '}from <Text style={styles.deleteModalWorkoutName}>{formatActivityDate(workoutToDelete?.ended_at)}</Text>
              ?{'\n'}This cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setWorkoutToDelete(null)}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleConfirmDelete}
              >
                <Trash2 size={15} color="#fff" />
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Program Setup Modal */}
      <Modal
        visible={showProgramModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowProgramModal(false); setSelectedProgram(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.programModalContainer}>
            {!selectedProgram ? (
              // Step 1: Choose program
              <>
                <View style={styles.programModalHeader}>
                  <Text style={styles.programModalTitle}>Training Program</Text>
                  <TouchableOpacity onPress={() => setShowProgramModal(false)} style={styles.modalCloseBtn}>
                    <X size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                {(() => {
                  const recommendedId = GOAL_TO_PROGRAM[profile?.fitness_goal];
                  const sorted = recommendedId
                    ? [...AVAILABLE_PROGRAMS].sort((a, b) => (a.id === recommendedId ? -1 : b.id === recommendedId ? 1 : 0))
                    : AVAILABLE_PROGRAMS;
                  return (
                    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 14 }} contentContainerStyle={{ paddingBottom: 8 }}>
                      {sorted.map((program, i) => {
                        const isRecommended = program.id === recommendedId;
                        return (
                          <TouchableOpacity
                            key={program.id}
                            style={[styles.programRow, isRecommended && styles.programRowRecommended]}
                            onPress={() => {
                              const defaults = getDefaultDays(program.days);
                              setSelectedProgram(program);
                              setSelectedDays(defaults);
                              setDayAssignments(buildDefaultAssignments(defaults, program));
                              setEditingDayIdx(null);
                            }}
                          >
                            <View style={styles.programRowLeft}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.programRowName}>{program.name}</Text>
                                {isRecommended && (
                                  <View style={styles.recommendedBadge}>
                                    <Text style={styles.recommendedBadgeText}>For you</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.programRowDesc} numberOfLines={1}>{program.desc}</Text>
                            </View>
                            <View style={styles.programRowRight}>
                              <Text style={styles.programRowMeta}>{program.days}d</Text>
                              <Text style={styles.programRowMetaSub}>{program.weeks}wk</Text>
                            </View>
                            <ChevronRight size={16} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  );
                })()}
              </>
            ) : (
              // Step 2: Pick training days + assign workouts
              <>
                <View style={styles.programModalHeader}>
                  <TouchableOpacity onPress={() => setSelectedProgram(null)} style={styles.modalCloseBtn}>
                    <ChevronLeft size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <Text style={styles.programModalTitle}>{selectedProgram.name}</Text>
                    <Text style={styles.programModalSub}>Toggle days · drag or tap cards to swap</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.startProgramButtonSmall, selectedDays.every(d => !d) && { opacity: 0.4 }]}
                    onPress={setupProgram}
                    disabled={settingUpProgram || selectedDays.every(d => !d)}
                  >
                    <Text style={styles.startProgramButtonSmallText}>Start</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                  <View style={{ height: 8 }} />

                  {/* Day columns: toggle + workout card stacked */}
                  <View style={styles.dayColumnRow}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, idx) => {
                      const assignedId = dayAssignments[idx];
                      const assignedTemplate = assignedId ? WORKOUT_TEMPLATES[assignedId] : null;
                      const isDragging = draggingAssignDayIdx === idx;
                      const isDragOver = dragOverAssignDayIdx === idx;
                      const isEditing = editingDayIdx === idx;

                      return (
                        <View key={label} style={styles.dayColumn}>
                          {/* Day toggle */}
                          <TouchableOpacity
                            style={[styles.dayToggle, selectedDays[idx] && styles.dayToggleActive]}
                            onPress={() => {
                              const next = [...selectedDays];
                              next[idx] = !next[idx];
                              setSelectedDays(next);
                              setDayAssignments(buildDefaultAssignments(next, selectedProgram));
                              setEditingDayIdx(null);
                            }}
                          >
                            <Text style={[styles.dayToggleText, selectedDays[idx] && styles.dayToggleTextActive]}>
                              {label}
                            </Text>
                          </TouchableOpacity>

                          {/* Workout card directly below */}
                          {selectedDays[idx] ? (
                            <div
                              draggable
                              onDragStart={e => {
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggingAssignDayIdx(idx);
                                setEditingDayIdx(null);
                              }}
                              onDragOver={e => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (draggingAssignDayIdx !== null && draggingAssignDayIdx !== idx) {
                                  setDragOverAssignDayIdx(idx);
                                }
                              }}
                              onDragLeave={() => setDragOverAssignDayIdx(null)}
                              onDrop={e => {
                                e.preventDefault();
                                if (draggingAssignDayIdx !== null && draggingAssignDayIdx !== idx) {
                                  setDayAssignments(prev => {
                                    const next = { ...prev };
                                    const tmp = next[draggingAssignDayIdx];
                                    next[draggingAssignDayIdx] = next[idx];
                                    next[idx] = tmp;
                                    return next;
                                  });
                                }
                                setDraggingAssignDayIdx(null);
                                setDragOverAssignDayIdx(null);
                              }}
                              onDragEnd={() => {
                                setDraggingAssignDayIdx(null);
                                setDragOverAssignDayIdx(null);
                              }}
                              onClick={() => setEditingDayIdx(isEditing ? null : idx)}
                              style={{
                                width: '100%',
                                minHeight: 52,
                                backgroundColor: isDragOver
                                  ? COLORS.primary + '25'
                                  : isEditing
                                  ? COLORS.primary + '15'
                                  : COLORS.surfaceLight,
                                borderRadius: 6,
                                border: isDragOver
                                  ? `2px solid ${COLORS.primary}`
                                  : isEditing
                                  ? `1.5px solid ${COLORS.primary}`
                                  : `1px solid ${COLORS.border}`,
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'grab',
                                opacity: isDragging ? 0.35 : 1,
                                userSelect: 'none',
                                boxSizing: 'border-box',
                              }}
                            >
                              <Text style={styles.workoutCardText} numberOfLines={4}>
                                {assignedTemplate?.name || '?'}
                              </Text>
                            </div>
                          ) : (
                            <View style={styles.workoutCardEmpty} />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Program coverage impact */}
                  {(() => {
                    const assigned = Object.values(dayAssignments);
                    const full = selectedProgram.schedule;
                    const notCovered = full.filter(tid => !assigned.includes(tid));
                    const repeating = [...new Set(assigned.filter((tid, i) => assigned.indexOf(tid) !== i))];

                    if (notCovered.length === 0 && repeating.length === 0) return null;

                    return (
                      <View style={styles.programImpactCard}>
                        {notCovered.length > 0 && (
                          <>
                            <Text style={styles.programImpactTitle}>Missing from your schedule</Text>
                            <Text style={styles.programImpactText}>
                              {notCovered.map(tid => WORKOUT_TEMPLATES[tid]?.name || tid).join(' · ')}
                            </Text>
                          </>
                        )}
                        {repeating.length > 0 && (
                          <>
                            <Text style={[styles.programImpactTitle, notCovered.length > 0 && { marginTop: 8 }, { color: COLORS.primary }]}>
                              Repeating workouts
                            </Text>
                            <Text style={styles.programImpactText}>
                              {repeating.map(tid => WORKOUT_TEMPLATES[tid]?.name || tid).join(' · ')}
                            </Text>
                          </>
                        )}
                      </View>
                    );
                  })()}

                  {/* Inline picker for tapped card */}
                  {editingDayIdx !== null && selectedDays[editingDayIdx] && (
                    <View style={styles.templatePicker}>
                      {selectedProgram.schedule.map(tid => {
                        const t = WORKOUT_TEMPLATES[tid];
                        if (!t) return null;
                        const isSelected = dayAssignments[editingDayIdx] === tid;
                        const otherDayIdx = Object.entries(dayAssignments)
                          .find(([k, v]) => v === tid && parseInt(k) !== editingDayIdx)?.[0];
                        const otherDayLabel = otherDayIdx !== undefined
                          ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][parseInt(otherDayIdx)]
                          : null;
                        return (
                          <TouchableOpacity
                            key={tid}
                            style={[styles.templatePickerOption, isSelected && styles.templatePickerOptionActive]}
                            onPress={() => {
                              setDayAssignments(prev => {
                                const next = { ...prev };
                                if (otherDayIdx !== undefined) next[otherDayIdx] = prev[editingDayIdx];
                                next[editingDayIdx] = tid;
                                return next;
                              });
                              setEditingDayIdx(null);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.templatePickerOptionText, isSelected && styles.templatePickerOptionTextActive]}>
                                {t.name}
                              </Text>
                              {otherDayLabel && !isSelected && (
                                <Text style={styles.templatePickerSwapHint}>Swaps with {otherDayLabel}</Text>
                              )}
                            </View>
                            {isSelected && <Check size={14} color={COLORS.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                </ScrollView>
              </>
            )}
            {settingUpProgram && (
              <View style={styles.settingUpOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.text, marginTop: 12 }}>Setting up program...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, position: 'relative', backgroundColor: COLORS.background }}>
        <SafeAreaView style={styles.container}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            backgroundColor: COLORS.background,
          }}>
            <View style={{ paddingHorizontal: 0 }}>
              {scrollContent}
            </View>
          </div>
          {modals}
        </SafeAreaView>
      </View>
    );
  }

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
        {scrollContent}
      </ScrollView>
      {modals}
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
  weekTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: '100%',
  },
  dayCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  dayCardCompleted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  dayCardMissed: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '15',
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '30',
    shadowColor: COLORS.primary,
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
    justifyContent: 'center',
    gap: 2,
    width: '100%',
    paddingHorizontal: 4,
    minHeight: 18,
  },
  dayWorkout: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  textCompleted: {
    color: COLORS.primary,
  },
  textMissed: {
    color: COLORS.error,
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
    alignItems: 'center',
  },
  todayTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  todaySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  todayCardCompleted: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  todayStatsContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  todayStats: {
    flexDirection: 'row',
    gap: 20,
  },
  todayStatItem: {
    alignItems: 'center',
  },
  todayStatValue: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: '700',
  },
  todayStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  todayPRsContainer: {
    marginTop: 12,
    backgroundColor: COLORS.warning + '15',
    borderRadius: 10,
    padding: 12,
  },
  todayPRsTitle: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  todayPRRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  todayPRExercise: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  todayPRWeight: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: COLORS.primary,
  },
  startButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Quick Row (PRs & Design)
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  quickRowCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  quickRowTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  quickRowSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
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
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackDisplay: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  feedbackText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
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
  deleteActivityButton: {
    padding: 8,
    marginLeft: 2,
  },
  // History stats row
  historyStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 14,
  },
  historyStat: {
    flex: 1,
    alignItems: 'center',
  },
  historyStatValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  historyStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  historyStatDivider: {
    width: 1,
    backgroundColor: COLORS.surfaceLight,
    marginVertical: 4,
  },
  // Weekly stats summary (in calendar section)
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  weeklyStat: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  weeklyStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
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
  exerciseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  exerciseDetailName: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  exerciseDetailStats: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  exerciseDetailLeft: {
    flex: 1,
  },
  exerciseGraphContainer: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  exerciseGraph: {
    borderRadius: 8,
    marginLeft: -10,
  },
  graphStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  graphStatText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  noGraphDataText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  noDetailsText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  viewSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  viewSummaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '90%',
    minHeight: '60%',
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
  customTemplatesSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  customTemplateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  customTemplateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
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
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: COLORS.textMuted,
    fontSize: 14,
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
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  recommendedItem: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: COLORS.primary + '10',
  },
  recommendedBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedBadgeText: {
    color: COLORS.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  setupProgramButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  setupProgramButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  programModalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '78%',
    paddingBottom: 16,
  },
  programModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  programModalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  programModalSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: COLORS.surfaceLight,
  },
  programRowRecommended: {
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  programRowLeft: {
    flex: 1,
    marginRight: 8,
  },
  programRowName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  programRowDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  programRowRight: {
    alignItems: 'center',
    marginRight: 8,
  },
  programRowMeta: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  programRowMetaSub: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  startProgramButtonSmall: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  startProgramButtonSmallText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayPickerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dayColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 3,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dayToggle: {
    width: '100%',
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  dayToggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayToggleText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  dayToggleTextActive: {
    color: COLORS.textOnPrimary,
  },
  workoutCard: {
    width: '100%',
    minHeight: 52,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
  },
  workoutCardEditing: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.primary + '15',
  },
  workoutCardDragOver: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '25',
  },
  workoutCardText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  workoutCardEmpty: {
    width: '100%',
    minHeight: 64,
  },
  programImpactCard: {
    backgroundColor: COLORS.primary + '18',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  programImpactTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  programImpactText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    marginBottom: 6,
  },
  assignmentRowEditing: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: COLORS.primary + '10',
  },
  assignmentDay: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    width: 36,
  },
  assignmentRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  assignmentTemplateName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  templatePicker: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
    overflow: 'hidden',
  },
  templatePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  templatePickerOptionActive: {
    backgroundColor: COLORS.primary + '15',
  },
  templatePickerOptionText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  templatePickerOptionTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  templatePickerSwapHint: {
    color: COLORS.primary,
    fontSize: 11,
    marginTop: 2,
  },
  assignmentRowDragOver: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: COLORS.primary + '20',
  },
  startProgramButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  startProgramButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  settingUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background + 'CC',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Delete Confirmation Modal
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '85%',
    maxWidth: 340,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteModalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteModalMessage: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteModalWorkoutName: {
    color: COLORS.text,
    fontWeight: '600',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});

export default WorkoutsScreen;
