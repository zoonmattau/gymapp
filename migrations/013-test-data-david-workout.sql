-- Add a completed workout for David Turner (yesterday) with PRs
-- Run this in your Supabase SQL Editor

-- First, find David Turner's user ID and add workout + PRs
DO $$
DECLARE
  david_id UUID;
  session_id UUID;
  yesterday TIMESTAMPTZ := NOW() - INTERVAL '1 day';
BEGIN
  -- Find David Turner's ID
  SELECT id INTO david_id
  FROM profiles
  WHERE first_name ILIKE 'David' AND last_name ILIKE 'Turner'
  LIMIT 1;

  IF david_id IS NULL THEN
    RAISE NOTICE 'David Turner not found in profiles table';
    RETURN;
  END IF;

  RAISE NOTICE 'Found David Turner with ID: %', david_id;

  -- Insert a completed workout session
  INSERT INTO workout_sessions (
    user_id,
    workout_name,
    started_at,
    ended_at,
    duration_minutes,
    total_volume,
    notes
  ) VALUES (
    david_id,
    'Push Day A',
    yesterday - INTERVAL '1 hour',
    yesterday,
    55,
    12500,
    'Great workout! Hit all my targets. New PRs on bench and OHP!'
  )
  RETURNING id INTO session_id;

  RAISE NOTICE 'Added workout session with ID: %', session_id;

  -- Add PRs for David
  -- Bench Press PR
  INSERT INTO personal_records (
    user_id,
    exercise_name,
    weight,
    reps,
    e1rm,
    workout_session_id,
    achieved_at
  ) VALUES (
    david_id,
    'Bench Press',
    100,
    5,
    116.67,  -- Epley formula: 100 * (1 + 5/30)
    session_id,
    yesterday
  );

  -- Overhead Press PR
  INSERT INTO personal_records (
    user_id,
    exercise_name,
    weight,
    reps,
    e1rm,
    workout_session_id,
    achieved_at
  ) VALUES (
    david_id,
    'Overhead Press',
    65,
    6,
    78,  -- Epley formula: 65 * (1 + 6/30)
    session_id,
    yesterday
  );

  -- Incline Dumbbell Press PR
  INSERT INTO personal_records (
    user_id,
    exercise_name,
    weight,
    reps,
    e1rm,
    workout_session_id,
    achieved_at
  ) VALUES (
    david_id,
    'Incline Dumbbell Press',
    36,
    8,
    45.6,  -- Epley formula: 36 * (1 + 8/30)
    session_id,
    yesterday
  );

  RAISE NOTICE 'Successfully added workout and 3 PRs for David Turner';
END $$;

-- Verify the workout was added
SELECT
  ws.id,
  p.first_name,
  p.last_name,
  ws.workout_name,
  ws.ended_at,
  ws.duration_minutes
FROM workout_sessions ws
JOIN profiles p ON p.id = ws.user_id
WHERE p.first_name ILIKE 'David' AND p.last_name ILIKE 'Turner'
ORDER BY ws.ended_at DESC
LIMIT 5;
