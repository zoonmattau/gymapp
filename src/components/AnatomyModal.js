import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useColors } from '../contexts/ThemeContext';
import DetailedAnatomy from './DetailedAnatomy';
import { PRIMARY_VIEW } from './MuscleMap';
import { getSecondaryMuscles } from '../constants/secondaryMuscles';
import { MUSCLE_COLORS, getMuscleColor } from '../constants/muscleColors';

const MUSCLE_LABELS = {
  Chest: 'Pectoralis Major',
  Back: 'Latissimus Dorsi',
  Shoulders: 'Deltoids',
  Biceps: 'Biceps Brachii',
  Triceps: 'Triceps Brachii',
  Quads: 'Quadriceps',
  Hamstrings: 'Biceps Femoris',
  Glutes: 'Gluteus Maximus',
  Calves: 'Gastrocnemius',
  Core: 'Rectus Abdominis',
  Traps: 'Trapezius',
  Forearms: 'Brachioradialis',
  'Full Body': 'All Muscle Groups',
};

const SENSITIVITY = 0.007;
const FRICTION = 0.94;
const MIN_VELOCITY = 0.002;
const FIGURE_WIDTH = 220;

const AnatomyModal = ({ visible, onClose, muscleGroup, exerciseName }) => {
  const COLORS = useColors();
  const styles = getStyles(COLORS);

  // Animation refs
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const draggingRef = useRef(false);
  const animFrameRef = useRef(null);
  const containerRef = useRef(null);

  // Render state
  const [renderState, setRenderState] = useState({ scaleX: 1, view: 'front' });
  const [showHint, setShowHint] = useState(true);
  const [tappedMuscle, setTappedMuscle] = useState(null);
  const tappedTimerRef = useRef(null);

  // Compute secondary muscles
  const secondaryMuscles = exerciseName && muscleGroup
    ? getSecondaryMuscles(exerciseName, muscleGroup)
    : [];

  // Primary muscles list (for the chart)
  const primaryMuscles = muscleGroup === 'Full Body'
    ? Object.keys(MUSCLE_COLORS).filter(k => k !== 'Full Body')
    : muscleGroup ? [muscleGroup] : [];

  // Update visuals from angle
  const updateVisuals = useCallback(() => {
    const cos = Math.cos(angleRef.current);
    setRenderState({ scaleX: cos, view: cos >= 0 ? 'front' : 'back' });
  }, []);

  // Momentum decay
  const startDecay = useCallback(() => {
    const tick = () => {
      velocityRef.current *= FRICTION;
      if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
        velocityRef.current = 0;
        animFrameRef.current = null;
        return;
      }
      angleRef.current += velocityRef.current;
      updateVisuals();
      animFrameRef.current = requestAnimationFrame(tick);
    };
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [updateVisuals]);

  // ── Web: pointer events ──────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const timer = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;

      const onPointerDown = (e) => {
        draggingRef.current = true;
        lastXRef.current = e.clientX;
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        velocityRef.current = 0;
        e.preventDefault();
      };
      const onPointerMove = (e) => {
        if (!draggingRef.current) return;
        setShowHint(false);
        const dx = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        angleRef.current += dx * SENSITIVITY;
        velocityRef.current = dx * SENSITIVITY;
        updateVisuals();
      };
      const onPointerUp = () => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        startDecay();
      };

      el.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      el._cleanupDrag = () => {
        el.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
    }, 50);
    return () => {
      clearTimeout(timer);
      const el = containerRef.current;
      if (el && el._cleanupDrag) { el._cleanupDrag(); el._cleanupDrag = null; }
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    };
  }, [visible, updateVisuals, startDecay]);

  // ── Native: PanResponder ─────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 4,
      onPanResponderGrant: () => {
        if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
        velocityRef.current = 0;
        lastXRef.current = 0;
      },
      onPanResponderMove: (_, gs) => {
        const delta = gs.dx - lastXRef.current;
        lastXRef.current = gs.dx;
        angleRef.current += delta * SENSITIVITY;
        velocityRef.current = gs.vx * SENSITIVITY;
        const cos = Math.cos(angleRef.current);
        setRenderState({ scaleX: cos, view: cos >= 0 ? 'front' : 'back' });
        setShowHint(false);
      },
      onPanResponderRelease: () => {
        lastXRef.current = 0;
        const tick = () => {
          velocityRef.current *= FRICTION;
          if (Math.abs(velocityRef.current) < MIN_VELOCITY) { velocityRef.current = 0; animFrameRef.current = null; return; }
          angleRef.current += velocityRef.current;
          const cos = Math.cos(angleRef.current);
          setRenderState({ scaleX: cos, view: cos >= 0 ? 'front' : 'back' });
          animFrameRef.current = requestAnimationFrame(tick);
        };
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(tick);
      },
      onPanResponderTerminate: () => { lastXRef.current = 0; velocityRef.current = 0; },
    })
  ).current;

  // Reset on open
  useEffect(() => {
    if (visible) {
      const primary = muscleGroup ? (PRIMARY_VIEW[muscleGroup] || 'front') : 'front';
      const initial = primary === 'back' ? Math.PI : 0;
      angleRef.current = initial;
      velocityRef.current = 0;
      draggingRef.current = false;
      lastXRef.current = 0;
      setShowHint(true);
      setTappedMuscle(null);
      const cos = Math.cos(initial);
      setRenderState({ scaleX: cos, view: cos >= 0 ? 'front' : 'back' });
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    }
  }, [visible, muscleGroup]);

  // Handle muscle tap (from figure or chart)
  const handleMusclePress = useCallback((group) => {
    setTappedMuscle(group);
    if (tappedTimerRef.current) clearTimeout(tappedTimerRef.current);
    tappedTimerRef.current = setTimeout(() => setTappedMuscle(null), 2500);
  }, []);

  const { scaleX, view: currentView } = renderState;
  const clampedScaleX = Math.abs(scaleX) < 0.05 ? (scaleX < 0 ? -0.05 : 0.05) : scaleX;
  const viewLabel = currentView === 'front' ? 'FRONT' : 'BACK';
  const isWeb = Platform.OS === 'web';
  const dragProps = isWeb ? {} : panResponder.panHandlers;
  const webStyles = isWeb ? { cursor: 'grab', touchAction: 'none', userSelect: 'none' } : {};

  // Build the tapped muscle info
  const tappedInfo = tappedMuscle ? {
    name: tappedMuscle,
    scientific: MUSCLE_LABELS[tappedMuscle] || tappedMuscle,
    color: getMuscleColor(tappedMuscle),
    role: tappedMuscle === muscleGroup ? 'Primary' :
          secondaryMuscles.includes(tappedMuscle) ? 'Secondary' :
          (muscleGroup === 'Full Body') ? 'Primary' : null,
  } : null;

  // Chart row renderer
  const renderChartRow = (group) => (
    <TouchableOpacity
      key={group}
      style={styles.chartRow}
      onPress={() => handleMusclePress(group)}
      activeOpacity={0.5}
    >
      <View style={[styles.chartDot, { backgroundColor: getMuscleColor(group) }]} />
      <Text style={[styles.chartName, { color: COLORS.text }]}>{group}</Text>
      <Text style={[styles.chartSci, { color: COLORS.textMuted }]}>{MUSCLE_LABELS[group]}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{muscleGroup || 'Anatomy'}</Text>
            {exerciseName && (
              <Text style={styles.exerciseSubtitle} numberOfLines={1}>{exerciseName}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Body — drag target */}
          <View
            ref={containerRef}
            style={[styles.body, webStyles]}
            {...dragProps}
          >
            <Text style={styles.viewLabel}>{viewLabel}</Text>

            {/* Scaled figure */}
            <View style={[styles.figureWrapper, { transform: [{ scaleX: clampedScaleX }] }]}>
              <DetailedAnatomy
                view={currentView}
                primaryMuscle={muscleGroup}
                secondaryMuscles={secondaryMuscles}
                width={FIGURE_WIDTH}
                muscleColors={MUSCLE_COLORS}
                outlineColor={COLORS.textMuted + '80'}
                onMusclePress={handleMusclePress}
              />
            </View>

            {/* Tapped muscle tooltip */}
            {tappedInfo && (
              <View style={[styles.tooltip, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: tappedInfo.color }]} />
                  <View>
                    <Text style={[styles.tooltipTitle, { color: COLORS.text }]}>
                      {tappedInfo.name}
                      {tappedInfo.role && (
                        <Text style={{ color: tappedInfo.color, fontSize: 12, fontWeight: '600' }}>
                          {'  '}{tappedInfo.role}
                        </Text>
                      )}
                    </Text>
                    <Text style={[styles.tooltipSub, { color: COLORS.textMuted }]}>{tappedInfo.scientific}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Hint */}
            {showHint && !tappedInfo && (
              <Text style={styles.hint}>Drag to rotate · Tap a muscle for details</Text>
            )}
          </View>

          {/* ── Muscle Legend ──────────────────────────────────── */}
          {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
            <View style={[styles.legendSection, { borderTopColor: COLORS.border }]}>
              {/* Primary */}
              {primaryMuscles.length > 0 && muscleGroup !== 'Full Body' && (
                <View style={styles.legendBlock}>
                  <Text style={[styles.legendHeading, { color: COLORS.textMuted }]}>PRIMARY</Text>
                  {primaryMuscles.map(renderChartRow)}
                </View>
              )}

              {/* Secondary */}
              {secondaryMuscles.length > 0 && (
                <View style={styles.legendBlock}>
                  <Text style={[styles.legendHeading, { color: COLORS.textMuted }]}>SECONDARY</Text>
                  {secondaryMuscles.map(renderChartRow)}
                </View>
              )}

              {/* Full Body */}
              {muscleGroup === 'Full Body' && (
                <View style={styles.legendBlock}>
                  <Text style={[styles.legendHeading, { color: COLORS.textMuted }]}>ALL MUSCLES</Text>
                  {primaryMuscles.map(renderChartRow)}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  exerciseSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  viewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
    opacity: 0.6,
  },
  figureWrapper: {
    alignItems: 'center',
  },
  tooltip: {
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tooltipSub: {
    fontSize: 11,
    marginTop: 1,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    opacity: 0.5,
  },
  // ── Muscle Legend ──
  legendSection: {
    borderTopWidth: 1,
    marginHorizontal: 20,
    paddingTop: 16,
  },
  legendBlock: {
    marginBottom: 14,
  },
  legendHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartName: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartSci: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default AnatomyModal;
