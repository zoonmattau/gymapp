import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Plus,
  X,
  Check,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workoutService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const WORKOUT_TEMPLATES = [
  { id: 'push_a', name: 'Push Day A', focus: 'Chest, Shoulders, Triceps', color: COLORS.primary },
  { id: 'pull_a', name: 'Pull Day A', focus: 'Back, Biceps', color: COLORS.success },
  { id: 'legs_a', name: 'Legs Day A', focus: 'Quads, Hamstrings, Calves', color: COLORS.warning },
  { id: 'push_b', name: 'Push Day B', focus: 'Chest, Shoulders, Triceps', color: COLORS.primary },
  { id: 'pull_b', name: 'Pull Day B', focus: 'Back, Biceps', color: COLORS.success },
  { id: 'legs_b', name: 'Legs Day B', focus: 'Quads, Hamstrings, Calves', color: COLORS.warning },
  { id: 'upper', name: 'Upper Body', focus: 'Chest, Back, Shoulders, Arms', color: COLORS.accent },
  { id: 'lower', name: 'Lower Body', focus: 'Quads, Hamstrings, Glutes', color: COLORS.error },
  { id: 'rest', name: 'Rest Day', focus: 'Recovery', color: COLORS.textMuted, isRest: true },
];

const WorkoutScheduleScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSchedule();
    }
  }, [user, currentDate]);

  const loadSchedule = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data } = await workoutService.getSchedule(user.id, startDate, endDate);

      if (data) {
        const scheduleMap = {};
        data.forEach(item => {
          scheduleMap[item.scheduled_date] = {
            templateId: item.template_id,
            templateName: item.workout_templates?.name || 'Workout',
            isRestDay: item.is_rest_day,
            isCompleted: item.is_completed,
          };
        });
        setSchedule(scheduleMap);
      }
    } catch (error) {
      console.log('Error loading schedule:', error);
    }
  };

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date });
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayPress = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = async (template) => {
    if (!selectedDate || !user?.id) return;

    try {
      await workoutService.setScheduleForDate(
        user.id,
        selectedDate,
        template.id,
        template.isRest || false
      );

      setSchedule(prev => ({
        ...prev,
        [selectedDate]: {
          templateId: template.id,
          templateName: template.name,
          isRestDay: template.isRest || false,
          isCompleted: false,
        },
      }));

      setShowTemplateSelector(false);
      setSelectedDate(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to set workout');
    }
  };

  const clearScheduledWorkout = async () => {
    if (!selectedDate || !user?.id) return;

    try {
      // For now, set as rest day to clear
      await workoutService.setScheduleForDate(user.id, selectedDate, null, true);

      const newSchedule = { ...schedule };
      delete newSchedule[selectedDate];
      setSchedule(newSchedule);

      setShowTemplateSelector(false);
      setSelectedDate(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear workout');
    }
  };

  const isToday = (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const days = getMonthData();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout Schedule</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((day) => (
            <Text key={day} style={styles.dayHeader}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((item, index) => {
            const scheduled = item.date ? schedule[item.date] : null;
            const today = isToday(item.date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  today && styles.todayCell,
                  scheduled && !scheduled.isRestDay && styles.scheduledCell,
                ]}
                onPress={() => handleDayPress(item.date)}
                disabled={!item.day}
              >
                {item.day && (
                  <>
                    <Text style={[
                      styles.dayNumber,
                      today && styles.todayNumber,
                      scheduled && !scheduled.isRestDay && styles.scheduledNumber,
                    ]}>
                      {item.day}
                    </Text>
                    {scheduled && !scheduled.isRestDay && (
                      <View style={[styles.workoutDot, { backgroundColor: COLORS.primary }]} />
                    )}
                    {scheduled?.isCompleted && (
                      <Check size={12} color={COLORS.success} style={styles.completedIcon} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <Check size={14} color={COLORS.success} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>

        {/* Upcoming Workouts */}
        <Text style={styles.sectionLabel}>UPCOMING WORKOUTS</Text>
        {Object.entries(schedule)
          .filter(([date, workout]) => new Date(date) >= new Date() && !workout.isRestDay)
          .slice(0, 5)
          .map(([date, workout]) => (
            <View key={date} style={styles.upcomingCard}>
              <View style={styles.upcomingDate}>
                <Text style={styles.upcomingDay}>
                  {new Date(date).getDate()}
                </Text>
                <Text style={styles.upcomingMonth}>
                  {MONTHS[new Date(date).getMonth()].slice(0, 3)}
                </Text>
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>{workout.templateName}</Text>
                {workout.isCompleted && (
                  <Text style={styles.completedText}>Completed</Text>
                )}
              </View>
              <Dumbbell size={20} color={COLORS.primary} />
            </View>
          ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowTemplateSelector(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.templateList}>
              {WORKOUT_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={[styles.templateColor, { backgroundColor: template.color }]} />
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateFocus}>{template.focus}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {schedule[selectedDate] && (
              <TouchableOpacity style={styles.clearButton} onPress={clearScheduledWorkout}>
                <Text style={styles.clearButtonText}>Clear Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: COLORS.accent + '20',
  },
  scheduledCell: {
    backgroundColor: COLORS.primary + '15',
  },
  dayNumber: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  todayNumber: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  scheduledNumber: {
    color: COLORS.primary,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  completedIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  upcomingDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingDay: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  upcomingMonth: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  templateList: {
    padding: 16,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  templateColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  templateFocus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    backgroundColor: COLORS.error + '15',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutScheduleScreen;
