import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Which view best shows each muscle group
export const PRIMARY_VIEW = {
  Chest: 'front',
  Back: 'back',
  Shoulders: 'front',
  Biceps: 'front',
  Triceps: 'back',
  Quads: 'front',
  Hamstrings: 'back',
  Glutes: 'back',
  Calves: 'front',
  Core: 'front',
  Traps: 'front',
  Forearms: 'front',
  'Full Body': 'front',
};

// Human body silhouette — 100×180 coordinate system
const BODY_OUTLINE =
  'M50 4 C58 4 62 9 60 18 L57 25 L75 33 L81 37 L84 52 L82 66 L79 78 ' +
  'L76 84 L73 82 L75 68 L74 54 L71 42 L66 52 L68 74 L70 88 L71 100 ' +
  'L69 118 L67 132 L67 150 L66 164 L70 174 L62 177 L59 168 L59 150 ' +
  'L60 132 L61 118 L58 102 L50 94 L42 102 L39 118 L40 132 L41 150 ' +
  'L41 168 L38 177 L30 174 L34 164 L33 150 L33 132 L31 118 L29 100 ' +
  'L30 88 L32 74 L34 52 L29 42 L26 54 L25 68 L27 82 L24 84 L21 78 ' +
  'L18 66 L16 52 L19 37 L25 33 L43 25 L40 18 C38 9 42 4 50 4 Z';

// Muscle region paths per view — each muscle is an array of path strings
const FRONT_MUSCLES = {
  Chest: [
    'M38 39 Q43 36 48 39 L48 49 Q43 52 38 50 Z',
    'M52 39 Q57 36 62 39 L62 50 Q57 52 52 49 Z',
  ],
  Shoulders: [
    'M25 34 L36 37 L34 43 L22 39 Z',
    'M64 37 L75 34 L78 39 L66 43 Z',
  ],
  Biceps: [
    'M26 48 L29 45 L29 62 L26 64 Z',
    'M71 45 L74 48 L74 64 L71 62 Z',
  ],
  Core: [
    'M44 53 L56 53 L55 84 L45 84 Z',
  ],
  Quads: [
    'M33 102 L42 99 L42 128 L34 129 Z',
    'M58 99 L67 102 L66 129 L58 128 Z',
  ],
  Traps: [
    'M40 26 L50 24 L60 26 L57 34 L50 30 L43 34 Z',
  ],
  Forearms: [
    'M21 68 L25 66 L26 78 L22 80 Z',
    'M75 66 L79 68 L78 80 L74 78 Z',
  ],
  Calves: [
    'M34 140 L40 138 L41 156 L35 158 Z',
    'M60 138 L66 140 L65 158 L59 156 Z',
  ],
};

const BACK_MUSCLES = {
  Back: [
    'M36 42 L46 38 L50 44 L54 38 L64 42 L62 68 L56 74 L50 72 L44 74 L38 68 Z',
  ],
  Shoulders: [
    'M25 34 L36 37 L34 43 L22 39 Z',
    'M64 37 L75 34 L78 39 L66 43 Z',
  ],
  Triceps: [
    'M23 48 L27 45 L27 62 L23 64 Z',
    'M73 45 L77 48 L77 64 L73 62 Z',
  ],
  Glutes: [
    'M36 84 L48 82 L48 94 L37 96 Z',
    'M52 82 L64 84 L63 96 L52 94 Z',
  ],
  Hamstrings: [
    'M33 102 L42 99 L42 128 L34 129 Z',
    'M58 99 L67 102 L66 129 L58 128 Z',
  ],
  Traps: [
    'M40 26 L50 24 L60 26 L57 34 L50 30 L43 34 Z',
  ],
  Forearms: [
    'M21 68 L25 66 L26 78 L22 80 Z',
    'M75 66 L79 68 L78 80 L74 78 Z',
  ],
  Calves: [
    'M34 140 L40 138 L41 156 L35 158 Z',
    'M60 138 L66 140 L65 158 L59 156 Z',
  ],
};

const MuscleMap = ({
  view = 'front',
  highlightedMuscle,
  size = 40,
  highlightColor = '#06B6D4',
  baseColor = '#4A5568',
  outlineColor = '#2D3748',
}) => {
  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

  const isHighlighted = (muscleName) => {
    if (!highlightedMuscle) return false;
    if (highlightedMuscle === 'Full Body') return true;
    return muscleName === highlightedMuscle;
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 180"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path d={BODY_OUTLINE} fill={baseColor} stroke={outlineColor} strokeWidth={0.5} />
      {Object.entries(muscles).map(([name, paths]) =>
        paths.map((d, i) => (
          <Path
            key={`${name}-${i}`}
            d={d}
            fill={isHighlighted(name) ? highlightColor : 'transparent'}
            fillOpacity={isHighlighted(name) ? 0.9 : 0}
          />
        ))
      )}
    </Svg>
  );
};

export default MuscleMap;
