import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../contexts/ThemeContext';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { getPausedWorkout, clearPausedWorkout } from '../utils/workoutStore';
import ConfirmModal from './ConfirmModal';

const NUDGE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

const WorkoutBanner = () => {
  const COLORS = useColors();
  const navigation = useNavigation();
  const { isActive, workoutName, backgroundedAt, clearBackgroundWorkout } = useActiveWorkout();
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [isNudge, setIsNudge] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !backgroundedAt) {
      clearInterval(timerRef.current);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - backgroundedAt;
      setBreakSeconds(Math.floor(elapsed / 1000));
      setIsNudge(elapsed >= NUDGE_THRESHOLD_MS);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [isActive, backgroundedAt]);

  if (!isActive) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResume = () => {
    const paused = getPausedWorkout();
    if (paused) {
      navigation.navigate('ActiveWorkout', {
        workoutName: paused.workoutName || 'Workout',
        workout: paused.workout,
        sessionId: paused.sessionId,
        resumedExercises: paused.exercises,
        resumedTime: paused.elapsedTime,
      });
    }
  };

  const handleEnd = () => {
    setShowEndConfirm(true);
  };

  const handleConfirmEnd = () => {
    setShowEndConfirm(false);
    clearPausedWorkout();
    clearBackgroundWorkout();
  };

  const styles = getStyles(COLORS);

  return (
    <>
      <View style={styles.banner}>
        {isNudge ? (
          <>
            <Text style={styles.nudgeText}>Still training?</Text>
            <View style={styles.nudgeButtons}>
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
                <X size={14} color={COLORS.textOnPrimary} />
                <Text style={styles.endButtonText}>End</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.bannerText} numberOfLines={1}>
              {workoutName}  ·  Break: {formatTime(breakSeconds)}
            </Text>
            <TouchableOpacity style={styles.returnButton} onPress={handleResume}>
              <Text style={styles.returnButtonText}>Return</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ConfirmModal
        visible={showEndConfirm}
        title="End Workout"
        message="Are you sure you want to discard this workout? Your progress will be lost."
        confirmText="End Workout"
        cancelText="Keep Going"
        confirmStyle="danger"
        onConfirm={handleConfirmEnd}
        onCancel={() => setShowEndConfirm(false)}
      />
    </>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  returnButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  returnButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  nudgeText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  nudgeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resumeButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default WorkoutBanner;
