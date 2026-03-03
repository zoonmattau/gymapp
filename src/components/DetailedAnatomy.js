import React from 'react';
import Svg, { Path, G, Ellipse, Line } from 'react-native-svg';
import { MUSCLE_COLORS, getMuscleColor } from '../constants/muscleColors';

// ─── Body outline (200×440 viewBox, curves throughout) ──────────────────────
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
// Each entry: { group, mirrored, paths[], fibers?[] }
const FRONT_MUSCLES = [
  // ── Trapezius (upper, from front) ──
  {
    group: 'Traps',
    mirrored: true,
    paths: [
      'M100 50 Q106 48 112 48 Q122 52 132 60 Q126 66 120 68 Q110 60 104 56 Q100 54 100 50 Z',
    ],
    fibers: [
      'M104 52 Q112 54 124 60',
      'M102 50 Q114 52 128 58',
    ],
  },
  // ── Sternocleidomastoid ──
  {
    group: 'Traps',
    mirrored: false,
    paths: [
      'M94 40 Q98 42 100 46 L100 52 Q96 54 92 50 Q90 46 94 40 Z',
      'M106 40 Q102 42 100 46 L100 52 Q104 54 108 50 Q110 46 106 40 Z',
    ],
  },
  // ── Pectoralis Major ──
  {
    group: 'Chest',
    mirrored: true,
    paths: [
      // Upper pec
      'M100 70 Q108 66 120 68 Q128 70 134 76 C136 80 134 86 130 90 Q122 94 112 96 Q106 96 100 92 Z',
      // Lower pec
      'M100 92 Q106 96 112 96 Q122 94 128 96 Q130 100 126 106 Q118 112 108 112 Q100 110 100 104 Z',
    ],
    fibers: [
      // Upper pec fiber direction (fan from sternum toward shoulder)
      'M102 74 Q112 72 128 76', 'M102 80 Q114 78 132 82',
      'M102 86 Q112 86 128 88',
      // Lower pec fibers
      'M102 96 Q112 96 126 98', 'M102 102 Q112 104 124 104',
    ],
  },
  // ── Deltoids ──
  {
    group: 'Shoulders',
    mirrored: true,
    paths: [
      // Anterior delt
      'M128 66 Q136 62 144 66 C148 70 150 76 150 82 Q148 88 142 90 Q136 86 132 80 Q130 74 128 66 Z',
      // Lateral delt
      'M144 66 Q150 64 154 68 C158 74 160 82 158 90 Q154 92 150 88 Q148 82 148 74 Q146 68 144 66 Z',
    ],
    fibers: [
      'M132 70 Q140 72 146 80', 'M134 76 Q142 78 148 86',
      'M148 70 Q154 76 156 84',
    ],
  },
  // ── Biceps ──
  {
    group: 'Biceps',
    mirrored: true,
    paths: [
      // Biceps brachii (main belly)
      'M144 92 Q150 88 154 92 C158 100 160 112 158 124 Q156 132 152 134 Q148 132 146 128 C142 118 142 106 144 92 Z',
      // Brachialis (deeper, peeks out sides)
      'M142 96 Q144 92 146 96 C144 104 142 114 142 124 Q142 130 144 132 Q140 130 140 124 C138 114 138 104 142 96 Z',
    ],
    fibers: [
      'M148 96 L150 110 L150 126', 'M144 98 L146 112 L146 128',
    ],
  },
  // ── Forearms ──
  {
    group: 'Forearms',
    mirrored: true,
    paths: [
      // Brachioradialis
      'M150 132 Q156 130 158 136 C160 146 160 158 158 170 Q156 176 152 174 Q150 166 150 154 Q148 142 150 132 Z',
      // Flexor group
      'M144 134 Q150 132 150 140 C150 150 150 162 148 172 Q146 176 142 174 Q142 164 142 152 Q140 142 144 134 Z',
    ],
    fibers: [
      'M152 136 L154 154 L154 170', 'M146 138 L148 156 L146 172',
    ],
  },
  // ── Serratus Anterior ──
  {
    group: 'Core',
    mirrored: true,
    paths: [
      'M128 90 Q134 92 134 98 L132 104 Q130 98 128 96 Z',
      'M128 96 Q134 98 134 106 L132 112 Q128 106 128 100 Z',
      'M126 104 Q132 106 132 114 L128 118 Q126 112 126 108 Z',
    ],
  },
  // ── Rectus Abdominis ──
  {
    group: 'Core',
    mirrored: false,
    paths: [
      // Upper abs
      'M95 106 Q98 104 100 106 Q102 104 105 106 Q106 112 106 118 Q104 122 100 122 Q96 122 94 118 Q94 112 95 106 Z',
      // Mid abs
      'M95 124 Q98 122 100 124 Q102 122 105 124 Q106 130 106 138 Q104 142 100 142 Q96 142 94 138 Q94 130 95 124 Z',
      // Lower abs
      'M95 144 Q98 142 100 144 Q102 142 105 144 Q106 150 106 160 Q104 164 100 166 Q96 164 94 160 Q94 150 95 144 Z',
      // Lower V
      'M96 166 Q100 164 104 166 Q106 172 106 180 Q104 184 100 186 Q96 184 94 180 Q94 172 96 166 Z',
    ],
  },
  // ── External Obliques ──
  {
    group: 'Core',
    mirrored: true,
    paths: [
      'M106 106 Q116 102 126 104 C128 112 128 124 126 138 Q122 154 116 166 Q110 176 106 182 Q106 160 106 140 Q106 120 106 106 Z',
    ],
    fibers: [
      // Diagonal fibers
      'M124 108 Q116 126 110 146', 'M122 116 Q114 134 108 154',
      'M120 126 Q112 144 108 164',
    ],
  },
  // ── Quadriceps ──
  {
    group: 'Quads',
    mirrored: true,
    paths: [
      // Rectus femoris
      'M108 198 Q114 194 120 198 C122 214 124 234 122 256 Q120 268 116 274 Q112 270 110 258 C108 238 106 218 108 198 Z',
      // Vastus lateralis
      'M120 198 Q128 196 134 200 C136 218 136 240 134 260 Q132 274 128 280 Q122 274 122 264 C122 244 122 224 120 198 Z',
      // Vastus medialis (teardrop)
      'M100 198 Q106 194 108 198 C108 218 108 238 110 258 Q112 270 114 280 Q108 284 104 278 Q100 268 100 250 C100 232 100 214 100 198 Z',
    ],
    fibers: [
      'M114 200 L116 230 L116 264', 'M128 202 L130 234 L128 270',
      'M104 200 L106 234 L108 268',
    ],
  },
  // ── Adductors ──
  {
    group: 'Quads',
    mirrored: true,
    paths: [
      'M100 194 Q104 192 108 198 Q112 208 114 222 Q112 234 106 234 Q100 228 100 216 Z',
    ],
  },
  // ── Calves (front) ──
  {
    group: 'Calves',
    mirrored: true,
    paths: [
      // Tibialis anterior
      'M112 290 Q118 286 122 290 C124 304 124 320 122 336 Q120 344 116 342 Q114 334 112 320 C110 306 110 296 112 290 Z',
      // Gastrocnemius medial
      'M122 286 Q128 282 132 286 C134 300 134 318 132 336 Q130 344 126 342 Q124 334 124 320 C122 306 122 296 122 286 Z',
    ],
    fibers: [
      'M116 294 L118 316 L118 338', 'M128 290 L130 312 L128 338',
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
      'M100 50 Q108 48 114 48 Q124 52 134 62 Q128 68 120 68 Q110 58 104 54 Q100 52 100 50 Z',
      'M100 68 Q108 66 116 70 Q118 80 118 90 Q112 96 100 98 Q100 88 100 78 Z',
      'M100 98 Q108 96 114 92 Q116 100 114 112 Q108 118 100 120 Q100 110 100 98 Z',
    ],
    fibers: [
      'M104 52 Q112 54 126 60',
      'M102 74 Q108 72 116 76', 'M102 84 Q110 82 116 86',
      'M102 102 Q108 98 114 96',
    ],
  },
  // ── Posterior Deltoid ──
  {
    group: 'Shoulders',
    mirrored: true,
    paths: [
      'M130 62 Q140 60 148 66 C152 72 154 80 154 88 Q150 92 144 90 Q138 86 134 78 Q130 70 130 62 Z',
    ],
    fibers: [
      'M134 66 Q142 70 148 80', 'M136 74 Q144 78 150 86',
    ],
  },
  // ── Infraspinatus ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M118 70 Q124 66 130 68 Q136 72 138 80 Q136 88 130 94 Q122 92 118 86 Q116 78 118 70 Z',
    ],
    fibers: ['M120 74 Q128 76 136 82', 'M120 82 Q128 84 134 88'],
  },
  // ── Teres Major ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M118 88 Q126 92 132 94 Q136 98 136 104 Q132 108 126 108 Q120 104 118 98 Q116 94 118 88 Z',
    ],
  },
  // ── Latissimus Dorsi ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M100 98 Q110 100 120 104 Q128 108 136 104 C138 114 138 128 134 144 Q128 158 120 166 Q112 170 106 170 Q100 166 100 156 C100 140 100 120 100 98 Z',
    ],
    fibers: [
      // Lat fibers angle from spine toward armpit
      'M102 104 Q116 108 134 110', 'M102 116 Q118 118 134 120',
      'M102 128 Q116 130 132 132', 'M102 142 Q114 144 126 148',
      'M102 154 Q112 156 120 160',
    ],
  },
  // ── Erector Spinae ──
  {
    group: 'Back',
    mirrored: true,
    paths: [
      'M100 120 Q104 118 108 120 C110 132 110 148 108 164 Q106 172 104 176 Q100 174 100 168 C100 150 100 134 100 120 Z',
    ],
    fibers: [
      'M102 124 L104 148 L102 170', 'M106 122 L108 146 L106 168',
    ],
  },
  // ── Triceps ──
  {
    group: 'Triceps',
    mirrored: true,
    paths: [
      // Long head
      'M142 90 Q148 86 152 90 C156 100 158 114 156 128 Q154 134 150 134 Q146 132 144 126 C142 114 140 102 142 90 Z',
      // Lateral head
      'M150 90 Q156 88 158 92 C162 102 162 116 160 130 Q158 136 154 134 Q152 130 152 122 C150 110 150 100 150 90 Z',
    ],
    fibers: [
      'M146 94 L148 112 L148 130', 'M154 94 L156 112 L156 128',
    ],
  },
  // ── Forearm Extensors ──
  {
    group: 'Forearms',
    mirrored: true,
    paths: [
      'M148 134 Q156 130 158 138 C160 150 160 162 158 174 Q156 180 150 178 Q148 170 148 158 C146 148 146 140 148 134 Z',
    ],
    fibers: ['M150 138 L154 156 L152 174'],
  },
  // ── Gluteus Medius ──
  {
    group: 'Glutes',
    mirrored: true,
    paths: [
      'M120 158 Q128 154 134 160 Q138 168 136 178 Q132 182 126 180 Q120 176 118 168 Q118 162 120 158 Z',
    ],
  },
  // ── Gluteus Maximus ──
  {
    group: 'Glutes',
    mirrored: true,
    paths: [
      'M100 174 Q110 168 120 170 Q128 176 132 186 C132 196 128 202 120 204 Q112 204 106 200 Q100 196 100 188 Z',
    ],
    fibers: [
      'M104 178 Q114 176 126 182', 'M104 186 Q114 184 128 190',
      'M104 194 Q112 194 122 198',
    ],
  },
  // ── Hamstrings ──
  {
    group: 'Hamstrings',
    mirrored: true,
    paths: [
      // Biceps femoris
      'M120 204 Q128 200 134 204 C136 220 136 240 134 260 Q130 274 126 278 Q122 274 120 264 C120 244 118 224 120 204 Z',
      // Semitendinosus
      'M100 200 Q108 198 116 204 C118 220 118 240 116 260 Q114 272 110 276 Q104 274 100 266 C100 248 100 228 100 200 Z',
    ],
    fibers: [
      'M124 208 L128 236 L126 268', 'M106 204 L110 236 L108 268',
    ],
  },
  // ── Calves (back) ──
  {
    group: 'Calves',
    mirrored: true,
    paths: [
      // Gastrocnemius medial
      'M106 278 Q114 274 120 278 C122 292 122 308 120 326 Q118 334 114 332 Q110 328 108 318 C106 304 104 290 106 278 Z',
      // Gastrocnemius lateral
      'M120 278 Q128 274 134 278 C136 292 136 308 134 326 Q132 334 128 332 Q124 328 122 318 C120 304 120 290 120 278 Z',
      // Soleus
      'M110 332 Q118 328 126 332 C130 340 130 352 128 364 Q124 372 118 372 Q112 370 110 362 C108 352 108 342 110 332 Z',
    ],
    fibers: [
      'M110 282 L114 306 L112 328', 'M126 282 L130 306 L128 328',
      'M114 336 L118 352 L116 368',
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
      {/* Body silhouette — solid dark fill like anatomy chart */}
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

      {/* Anatomical guide lines */}
      <Line x1="100" y1="48" x2="100" y2="194" stroke="#2A2E35" strokeWidth={0.3} strokeOpacity={0.5} />
      {view === 'front' && (
        <Path d="M86 60 Q92 56 100 58 Q108 56 114 60" fill="none" stroke="#2A2E35" strokeWidth={0.3} strokeOpacity={0.4} />
      )}
      {view === 'back' && (
        <Path d="M100 48 L100 194" fill="none" stroke="#2A2E35" strokeWidth={0.4} strokeOpacity={0.5} />
      )}

      {/* Muscle regions */}
      {muscles.map((muscle, mi) => {
        const level = getHighlight(muscle.group);
        const isPrimary = level === 'primary';
        const isSecondary = level === 'secondary';
        const isTargeted = isPrimary || isSecondary;

        // Targeted muscles: bright unique color | Base: darker gray with subtle definition
        const color = isTargeted ? getMuscleColor(muscle.group) : '#4A4F58';
        const fillOp = isPrimary ? 0.9 : isSecondary ? 0.55 : 0.7;
        // Targeted muscles get a darker edge for separation; base gets subtle outline
        const strokeCol = isTargeted ? '#1A1D22' : '#363A42';
        const sw = isPrimary ? 0.8 : isSecondary ? 0.6 : 0.35;
        const so = isPrimary ? 0.8 : isSecondary ? 0.7 : 0.6;
        // Fibers: visible on targeted, subtle on base
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

      {/* Knee caps */}
      <Ellipse cx="118" cy="282" rx="7" ry="5" fill="none" stroke="#363A42" strokeWidth={0.4} strokeOpacity={0.5} />
      <Ellipse cx="82" cy="282" rx="7" ry="5" fill="none" stroke="#363A42" strokeWidth={0.4} strokeOpacity={0.5} />

      {/* Navel */}
      {view === 'front' && (
        <Ellipse cx="100" cy="170" rx="1.5" ry="2" fill="none" stroke="#2A2E35" strokeWidth={0.4} strokeOpacity={0.5} />
      )}

      {/* Scapula hints (back view) */}
      {view === 'back' && (
        <>
          <Path d="M110 68 Q118 72 122 84 Q120 92 114 92" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.4} />
          <Path d="M90 68 Q82 72 78 84 Q80 92 86 92" fill="none" stroke="#363A42" strokeWidth={0.3} strokeOpacity={0.4} />
        </>
      )}
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
