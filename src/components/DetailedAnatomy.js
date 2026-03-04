import React from 'react';
import Svg, { Path, G, Ellipse, Line, Rect } from 'react-native-svg';
import { MUSCLE_COLORS, getMuscleColor } from '../constants/muscleColors';

// ─── Body outline (200×440 viewBox) ─────────────────────────────────────────
// Traced from body outline coordinates:
// Right torso edge: X=136 (armpit Y=82) → X=132 (waist Y=138) → X=128 (hip Y=164) → X=130 (Y=184)
// Crotch: (100, 194)
// Right thigh: inner starts (110, 202), outer (132, 200) → (136, 224) → (134, 250) → (132, 284)
// Right arm: outer X=158-164, inner X=142-150
const BODY_OUTLINE =
  'M100 4 ' +
  'C117 4 126 15 123 30 Q120 40 114 48 L108 50 ' +
  'Q118 54 132 60 Q144 64 150 68 ' +
  'C156 72 160 84 160 96 C162 112 162 128 160 140 ' +
  'C160 146 158 148 158 152 C160 160 160 168 158 176 ' +
  'Q156 184 154 190 Q152 196 148 192 Q150 186 150 180 ' +
  'C150 170 148 158 148 148 C148 142 150 140 148 136 ' +
  'C146 124 144 108 142 94 L136 82 ' +
  'C136 100 134 120 132 138 Q130 154 128 164 Q128 174 130 184 ' +
  'C132 200 136 224 134 250 Q132 270 132 284 Q132 292 130 298 ' +
  'C132 312 134 332 130 354 Q128 370 124 382 ' +
  'Q120 392 120 398 L126 410 Q124 416 116 414 L110 410 L112 398 ' +
  'Q114 388 116 376 C116 358 118 338 118 318 Q118 304 116 296 ' +
  'Q116 290 118 282 C118 264 116 240 114 218 L110 202 L100 194 ' +
  'L90 202 C86 218 84 240 82 264 Q82 282 84 290 Q84 296 84 304 ' +
  'C82 318 82 338 84 358 Q86 376 86 388 L88 398 L90 410 ' +
  'L84 414 Q76 416 74 410 L80 398 Q80 392 76 382 ' +
  'Q72 370 68 354 C66 332 68 312 70 298 Q68 292 68 284 Q68 270 66 250 ' +
  'C64 224 68 200 70 184 Q72 174 72 164 Q70 154 68 138 ' +
  'C66 120 64 100 64 82 L58 94 ' +
  'C56 108 54 124 52 136 C50 140 52 142 52 148 ' +
  'C52 158 50 170 50 180 Q50 186 48 192 Q44 196 46 190 Q44 184 42 176 ' +
  'C40 168 40 160 42 152 C42 148 40 146 40 140 ' +
  'C38 128 38 112 40 96 C40 84 44 72 50 68 ' +
  'Q56 64 68 60 Q82 54 92 50 L86 48 Q80 40 77 30 ' +
  'C74 15 83 4 100 4 Z';

// ─── FRONT MUSCLES ──────────────────────────────────────────────────────────
// All paths constrained within body outline coordinates
const FRONT_MUSCLES = [
  // ── Trapezius (upper, visible from front) ──
  {
    group: 'Traps',
    mirrored: true,
    paths: [
      'M100 50 Q106 48 112 49 Q120 52 128 58 Q132 62 128 66 Q122 64 114 58 Q106 54 100 52 Z',
    ],
    fibers: [
      'M104 52 Q112 54 124 60',
    ],
  },
  // ── Sternocleidomastoid ──
  {
    group: 'Traps',
    mirrored: false,
    paths: [
      'M96 42 Q98 44 100 48 L100 52 Q97 54 94 50 Q92 46 96 42 Z',
      'M104 42 Q102 44 100 48 L100 52 Q103 54 106 50 Q108 46 104 42 Z',
    ],
  },
  // ── Pectoralis Major ──
  {
    group: 'Chest',
    mirrored: true,
    paths: [
      // Upper pec - fan from sternum toward armpit
      'M101 68 Q110 66 120 68 Q128 72 134 78 Q136 82 134 86 Q130 90 122 92 Q112 94 104 92 Q101 88 101 78 Z',
      // Lower pec
      'M101 92 Q106 94 112 94 Q122 92 128 94 Q130 98 126 104 Q118 108 110 108 Q104 106 101 102 Z',
    ],
    fibers: [
      'M103 72 Q114 70 130 76',
      'M103 80 Q114 78 132 84',
      'M103 86 Q114 86 128 90',
      'M103 96 Q112 96 126 98',
    ],
  },
  // ── Deltoids ──
  {
    group: 'Shoulders',
    mirrored: true,
    paths: [
      // Anterior + lateral delt as one clean cap shape
      'M130 64 Q138 60 146 64 Q152 68 156 76 Q158 84 156 90 Q152 92 148 90 Q142 86 138 80 Q134 72 130 64 Z',
    ],
    fibers: [
      'M134 68 Q142 72 150 80',
      'M136 74 Q144 78 154 86',
    ],
  },
  // ── Biceps ──
  {
    group: 'Biceps',
    mirrored: true,
    paths: [
      // Biceps brachii (main belly)
      'M146 90 Q152 88 156 92 Q158 100 158 112 Q158 122 156 130 Q154 134 150 132 Q148 130 146 124 Q144 116 144 106 Q144 96 146 90 Z',
      // Brachialis (deeper, visible on outer edge)
      'M142 96 Q146 92 148 96 Q148 106 148 116 Q148 126 146 130 Q142 128 140 122 Q138 114 138 106 Q140 98 142 96 Z',
    ],
    fibers: [
      'M148 94 L152 112 L150 128',
      'M142 100 L144 114 L144 126',
    ],
  },
  // ── Forearms ──
  {
    group: 'Forearms',
    mirrored: true,
    paths: [
      // Brachioradialis (outer forearm)
      'M150 130 Q156 128 158 134 Q160 144 160 156 Q160 166 158 174 Q156 178 152 176 Q150 170 150 158 Q148 146 150 130 Z',
      // Flexor group (inner forearm)
      'M144 132 Q150 130 150 138 Q150 148 150 160 Q148 170 146 174 Q142 176 140 170 Q140 160 140 150 Q140 140 144 132 Z',
    ],
    fibers: [
      'M152 134 L154 156 L154 172',
      'M144 136 L146 156 L144 170',
    ],
  },
  // ── Serratus Anterior (finger-like projections on ribs) ──
  {
    group: 'Core',
    mirrored: true,
    paths: [
      'M126 86 Q132 88 132 94 Q130 98 126 96 Z',
      'M124 96 Q130 98 130 104 Q128 108 124 106 Z',
      'M122 106 Q128 108 128 114 Q126 118 122 116 Z',
      'M120 116 Q126 118 126 124 Q124 128 120 126 Z',
    ],
  },
  // ── Rectus Abdominis (8-pack: 4 rows × 2 columns, separated by linea alba) ──
  {
    group: 'Core',
    mirrored: false,
    paths: [
      // Row 1 — LEFT block
      'M94 106 L99 106 L99 116 L94 116 Q93 111 94 106 Z',
      // Row 1 — RIGHT block
      'M101 106 L106 106 Q107 111 106 116 L101 116 Z',
      // Row 2 — LEFT
      'M94 120 L99 120 L99 132 L94 132 Z',
      // Row 2 — RIGHT
      'M101 120 L106 120 L106 132 L101 132 Z',
      // Row 3 — LEFT
      'M94 136 L99 136 L99 150 L94 150 Z',
      // Row 3 — RIGHT
      'M101 136 L106 136 L106 150 L101 150 Z',
      // Row 4 (lower, tapers inward) — LEFT
      'M95 154 L99 154 L99 168 Q97 172 95 168 Z',
      // Row 4 — RIGHT
      'M101 154 L105 154 Q105 168 103 172 L101 168 Z',
    ],
  },
  // ── External Obliques (diagonal strips from ribs to hip) ──
  {
    group: 'Core',
    mirrored: true,
    paths: [
      // Upper oblique
      'M106 106 Q112 104 118 108 Q120 116 120 126 Q118 132 114 134 Q110 130 108 124 Q106 118 106 110 Z',
      // Lower oblique
      'M108 134 Q114 132 118 136 Q120 144 118 154 Q116 162 112 168 Q108 170 106 166 Q106 156 106 146 Q106 138 108 134 Z',
    ],
    fibers: [
      'M116 110 Q112 122 108 130',
      'M116 138 Q112 150 108 162',
    ],
  },
  // ── Quadriceps ──
  // Thigh bounds: inner edge starts at (110,202), outer edge at (132,200)
  // At Y=240: inner ~X=116, outer ~X=135
  // At Y=280: inner ~X=118, outer ~X=132
  {
    group: 'Quads',
    mirrored: true,
    paths: [
      // Rectus femoris (center of thigh)
      'M118 200 Q122 196 126 200 Q128 214 128 232 Q128 250 126 264 Q124 274 122 276 Q118 274 118 266 Q116 250 116 232 Q116 214 118 200 Z',
      // Vastus lateralis (outer thigh)
      'M126 198 Q130 194 134 198 Q136 214 136 232 Q136 250 134 266 Q132 276 130 278 Q126 276 126 268 Q126 250 126 232 Q126 214 126 198 Z',
      // Vastus medialis (inner teardrop) — well inside thigh
      'M112 206 Q116 202 120 206 Q120 222 120 238 Q120 254 118 268 Q116 276 114 278 Q112 274 110 266 Q110 250 110 234 Q110 218 112 206 Z',
      // Sartorius (thin diagonal band across thigh)
      'M128 192 Q130 190 132 192 Q130 210 126 230 Q122 250 118 268 Q116 274 114 272 Q118 254 122 236 Q126 216 128 192 Z',
    ],
    fibers: [
      'M122 204 L124 236 L124 270',
      'M130 202 L132 236 L132 270',
      'M114 210 L116 240 L116 270',
    ],
  },
  // ── Adductors (inner thigh, well within the leg) ──
  {
    group: 'Quads',
    mirrored: true,
    paths: [
      'M110 206 Q114 204 116 208 Q118 218 116 232 Q114 240 112 240 Q110 236 108 226 Q108 214 110 206 Z',
    ],
  },
  // ── Calves (front — tibialis anterior + peroneal + gastrocnemius showing) ──
  {
    group: 'Calves',
    mirrored: true,
    paths: [
      // Tibialis anterior (front/inner shin)
      'M116 292 Q120 288 124 292 Q126 306 126 320 Q126 334 124 346 Q122 350 120 348 Q118 340 116 326 Q114 312 116 292 Z',
      // Peroneal / fibularis (outer shin)
      'M124 290 Q128 286 132 290 Q134 304 134 318 Q134 332 132 344 Q130 348 128 346 Q126 340 126 326 Q124 312 124 290 Z',
      // Gastrocnemius medial head (visible from front, inner calf bulge)
      'M116 288 Q120 284 122 288 Q124 298 122 310 Q120 318 116 316 Q114 310 114 300 Q114 292 116 288 Z',
    ],
    fibers: [
      'M120 296 L122 318 L120 342',
      'M128 294 L130 316 L130 340',
    ],
  },
];

// ─── BACK MUSCLES ───────────────────────────────────────────────────────────
const BACK_MUSCLES = [
  // ── Trapezius ──
  {
    group: 'Traps',
    mirrored: true,
    paths: [
      // Upper trap
      'M100 50 Q108 48 114 50 Q122 54 130 60 Q126 66 120 66 Q112 60 106 56 Q102 52 100 50 Z',
      // Middle trap
      'M100 66 Q108 64 116 68 Q118 78 118 88 Q112 92 100 94 Q100 84 100 74 Z',
      // Lower trap
      'M100 94 Q108 92 114 90 Q116 96 114 106 Q108 112 100 114 Q100 106 100 94 Z',
    ],
    fibers: [
      'M104 52 Q112 56 126 62',
      'M102 72 Q110 70 116 74',
      'M102 82 Q110 80 116 84',
      'M102 98 Q108 96 114 94',
    ],
  },
  // ── Posterior Deltoid ──
  {
    group: 'Shoulders',
    mirrored: true,
    paths: [
      'M128 62 Q138 58 146 64 Q152 70 154 80 Q154 88 148 90 Q142 88 138 82 Q132 74 128 62 Z',
    ],
    fibers: [
      'M132 66 Q142 70 150 80',
      'M134 72 Q144 76 150 86',
    ],
  },
  // ── Infraspinatus ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M116 68 Q122 64 128 66 Q134 70 136 78 Q134 86 128 90 Q120 88 116 82 Q114 76 116 68 Z',
    ],
    fibers: [
      'M118 72 Q126 74 134 80',
      'M118 80 Q126 82 132 86',
    ],
  },
  // ── Teres Major ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M116 86 Q124 90 130 92 Q134 96 134 102 Q130 106 124 104 Q118 100 116 94 Q114 90 116 86 Z',
    ],
  },
  // ── Latissimus Dorsi ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M100 94 Q108 96 118 100 Q126 104 134 102 Q136 112 136 124 Q134 138 128 152 Q122 162 114 166 Q108 168 102 166 Q100 160 100 148 Q100 130 100 112 Z',
    ],
    fibers: [
      'M102 100 Q116 104 132 108',
      'M102 114 Q118 116 134 118',
      'M102 126 Q116 128 132 132',
      'M102 140 Q114 142 126 148',
      'M102 152 Q112 154 120 160',
    ],
  },
  // ── Erector Spinae ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M100 114 Q104 112 108 114 Q110 126 110 142 Q110 156 108 168 Q106 174 104 176 Q100 174 100 166 Q100 148 100 130 Z',
    ],
    fibers: [
      'M102 118 L104 144 L102 170',
      'M106 116 L108 142 L106 168',
    ],
  },
  // ── Triceps ──
  {
    group: 'Triceps',
    mirrored: true,
    paths: [
      // Long head
      'M144 88 Q150 86 154 90 Q156 100 156 112 Q156 124 154 132 Q152 134 148 132 Q146 128 144 120 Q142 110 142 100 Q142 94 144 88 Z',
      // Lateral head
      'M152 88 Q158 86 160 92 Q162 102 162 114 Q162 126 160 132 Q158 136 154 134 Q154 128 154 118 Q152 106 152 96 Z',
    ],
    fibers: [
      'M148 92 L150 112 L150 130',
      'M156 92 L158 112 L158 128',
    ],
  },
  // ── Forearm Extensors ──
  {
    group: 'Forearms',
    mirrored: true,
    paths: [
      'M148 132 Q156 130 158 136 Q160 148 160 160 Q160 170 158 176 Q154 178 150 176 Q148 170 146 160 Q144 148 148 132 Z',
    ],
    fibers: [
      'M150 136 L154 156 L152 174',
    ],
  },
  // ── Gluteus Medius ──
  {
    group: 'Glutes',
    mirrored: true,
    paths: [
      'M118 156 Q126 152 132 158 Q136 164 134 174 Q130 178 124 176 Q118 172 116 164 Q116 160 118 156 Z',
    ],
  },
  // ── Gluteus Maximus ──
  {
    group: 'Glutes',
    mirrored: true,
    paths: [
      'M100 172 Q108 166 118 168 Q126 174 130 184 Q130 194 126 200 Q120 204 112 202 Q106 198 102 192 Q100 186 100 178 Z',
    ],
    fibers: [
      'M104 176 Q114 174 124 180',
      'M104 184 Q114 182 128 188',
      'M104 192 Q112 192 122 196',
    ],
  },
  // ── Hamstrings ──
  {
    group: 'Hamstrings',
    mirrored: true,
    paths: [
      // Biceps femoris (outer)
      'M122 204 Q128 200 134 204 Q136 218 136 236 Q136 254 134 268 Q130 276 126 278 Q122 274 122 266 Q120 248 120 230 Q120 214 122 204 Z',
      // Semitendinosus / semimembranosus (inner)
      'M112 202 Q118 198 122 204 Q122 218 120 236 Q118 254 116 268 Q114 276 110 276 Q106 272 106 264 Q106 248 108 230 Q110 214 112 202 Z',
    ],
    fibers: [
      'M126 208 L130 238 L128 270',
      'M114 206 L116 238 L114 270',
    ],
  },
  // ── Calves (back — gastrocnemius + soleus) ──
  {
    group: 'Calves',
    mirrored: true,
    paths: [
      // Gastrocnemius medial
      'M110 278 Q116 274 122 278 Q124 292 124 308 Q122 322 120 330 Q118 334 114 332 Q110 328 108 318 Q106 304 108 290 Z',
      // Gastrocnemius lateral
      'M122 278 Q128 274 134 278 Q136 292 136 308 Q134 322 132 330 Q130 334 126 332 Q122 328 122 318 Q120 304 122 290 Z',
      // Soleus (lower)
      'M112 332 Q118 328 126 332 Q130 340 130 352 Q128 362 124 368 Q118 370 114 368 Q110 362 108 352 Q108 342 112 332 Z',
    ],
    fibers: [
      'M114 282 L116 306 L114 328',
      'M128 282 L130 306 L128 328',
      'M116 336 L120 352 L118 366',
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────
const DetailedAnatomy = React.memo(({
  view = 'front',
  primaryMuscle,
  secondaryMuscles = [],
  width = 240,
  muscleColors = MUSCLE_COLORS,
  outlineColor = '#2D3748',
  onMusclePress,
  // Legacy prop support
  highlightedMuscle,
  highlightColor,
  baseColor,
}) => {
  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;
  const height = width * (440 / 200);

  // Support both old prop (highlightedMuscle) and new prop (primaryMuscle)
  const primary = primaryMuscle || highlightedMuscle;

  const getHighlight = (group) => {
    if (!primary) return 'none';
    if (primary === 'Full Body') return 'primary';
    if (group === primary) return 'primary';
    if (secondaryMuscles.includes(group)) return 'secondary';
    return 'none';
  };

  const handlePress = (group) => {
    if (onMusclePress) onMusclePress(group);
  };

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 200 440"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Body silhouette */}
      <Path
        d={BODY_OUTLINE}
        fill="#3A3F47"
        fillOpacity={0.9}
        stroke="#2A2E35"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* Head */}
      <Ellipse cx="100" cy="22" rx="15" ry="19" fill="#3A3F47" fillOpacity={0.9} stroke="#2A2E35" strokeWidth={0.6} />

      {/* Structural lines */}
      {/* Center line (linea alba) */}
      <Line x1="100" y1="50" x2="100" y2="170" stroke="#2A2E35" strokeWidth={0.4} strokeOpacity={0.4} />

      {/* Collarbones */}
      {view === 'front' && (
        <>
          <Path d="M90 58 Q96 54 100 56 Q104 54 110 58" fill="none" stroke="#2A2E35" strokeWidth={0.3} strokeOpacity={0.35} />
          {/* Rib hints */}
          <Path d="M104 108 Q112 106 118 110" fill="none" stroke="#363A42" strokeWidth={0.25} strokeOpacity={0.3} />
          <Path d="M96 108 Q88 106 82 110" fill="none" stroke="#363A42" strokeWidth={0.25} strokeOpacity={0.3} />
          {/* Inguinal crease */}
          <Path d="M104 170 Q114 174 126 180" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.35} />
          <Path d="M96 170 Q86 174 74 180" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.35} />
          {/* Navel */}
          <Ellipse cx="100" cy="158" rx="1.2" ry="1.8" fill="none" stroke="#2A2E35" strokeWidth={0.4} strokeOpacity={0.5} />
        </>
      )}

      {view === 'back' && (
        <>
          {/* Spine line */}
          <Line x1="100" y1="48" x2="100" y2="180" stroke="#2A2E35" strokeWidth={0.4} strokeOpacity={0.4} />
          {/* Scapula hints */}
          <Path d="M108 66 Q116 70 120 82 Q118 90 112 90" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.35} />
          <Path d="M92 66 Q84 70 80 82 Q82 90 88 90" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.35} />
          {/* Lower back dimples */}
          <Ellipse cx="106" cy="172" rx="2" ry="1.5" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.3} />
          <Ellipse cx="94" cy="172" rx="2" ry="1.5" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.3} />
        </>
      )}

      {/* Kneecaps */}
      <Ellipse cx="122" cy="284" rx="6" ry="4" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.4} />
      <Ellipse cx="78" cy="284" rx="6" ry="4" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.4} />

      {/* Muscle regions */}
      {muscles.map((muscle, mi) => {
        const level = getHighlight(muscle.group);
        const isPrimary = level === 'primary';
        const isSecondary = level === 'secondary';
        const isTargeted = isPrimary || isSecondary;

        const color = isTargeted ? getMuscleColor(muscle.group) : '#4A4F58';
        const fillOp = isPrimary ? 0.9 : isSecondary ? 0.55 : 0.7;
        const strokeCol = isTargeted ? '#1A1D22' : '#363A42';
        const sw = isPrimary ? 0.8 : isSecondary ? 0.6 : 0.35;
        const so = isPrimary ? 0.8 : isSecondary ? 0.7 : 0.6;
        const fiberCol = isTargeted ? '#FFFFFF' : '#5A5F68';
        const fiberOp = isPrimary ? 0.2 : isSecondary ? 0.12 : 0.15;
        const fiberW = isPrimary ? 0.5 : isSecondary ? 0.4 : 0.25;

        return (
          <G key={`m-${mi}`}>
            {/* Right side */}
            {muscle.paths.map((d, pi) => (
              <Path
                key={`r-${mi}-${pi}`}
                d={d}
                fill={color}
                fillOpacity={fillOp}
                stroke={strokeCol}
                strokeWidth={sw}
                strokeOpacity={so}
                strokeLinejoin="round"
                onPress={onMusclePress ? () => handlePress(muscle.group) : undefined}
              />
            ))}
            {muscle.fibers && muscle.fibers.map((d, fi) => (
              <Path
                key={`rf-${mi}-${fi}`}
                d={d}
                fill="none"
                stroke={fiberCol}
                strokeWidth={fiberW}
                strokeOpacity={fiberOp}
                strokeLinecap="round"
              />
            ))}
            {/* Left side (mirrored) */}
            {muscle.mirrored && (
              <G transform="translate(200,0) scale(-1,1)">
                {muscle.paths.map((d, pi) => (
                  <Path
                    key={`l-${mi}-${pi}`}
                    d={d}
                    fill={color}
                    fillOpacity={fillOp}
                    stroke={strokeCol}
                    strokeWidth={sw}
                    strokeOpacity={so}
                    strokeLinejoin="round"
                    onPress={onMusclePress ? () => handlePress(muscle.group) : undefined}
                  />
                ))}
                {muscle.fibers && muscle.fibers.map((d, fi) => (
                  <Path
                    key={`lf-${mi}-${fi}`}
                    d={d}
                    fill="none"
                    stroke={fiberCol}
                    strokeWidth={fiberW}
                    strokeOpacity={fiberOp}
                    strokeLinecap="round"
                  />
                ))}
              </G>
            )}
          </G>
        );
      })}
    </Svg>
  );
}, (prev, next) =>
  prev.view === next.view &&
  prev.primaryMuscle === next.primaryMuscle &&
  prev.highlightedMuscle === next.highlightedMuscle &&
  prev.width === next.width &&
  prev.muscleColors === next.muscleColors &&
  prev.secondaryMuscles === next.secondaryMuscles
);

DetailedAnatomy.displayName = 'DetailedAnatomy';

export default DetailedAnatomy;
