-- ========================================
-- WORKOUT CHECK-INS TABLE
-- Pre-workout wellness tracking feature
-- ========================================

-- Create workout_checkins table
CREATE TABLE IF NOT EXISTS workout_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Wellness responses (1-5 scale)
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  mood_state INTEGER CHECK (mood_state BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 1 AND 5),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 5),

  -- Calculated readiness score (0-100)
  readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),

  -- Optional sleep data
  sleep_hours DECIMAL(3,1),
  sleep_auto_filled BOOLEAN DEFAULT FALSE,

  -- Workout adjustments applied
  weight_adjustment_percent INTEGER DEFAULT 0,
  rest_adjustment_seconds INTEGER DEFAULT 0,
  suggested_intensity TEXT CHECK (suggested_intensity IN ('full', 'moderate', 'light', 'skip')),
  user_overrode BOOLEAN DEFAULT FALSE,

  -- Ensure one check-in per workout session
  UNIQUE(session_id)
);

-- Create index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_workout_checkins_user_date ON workout_checkins(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE workout_checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own check-ins
DROP POLICY IF EXISTS "Users can manage their own check-ins" ON workout_checkins;
CREATE POLICY "Users can manage their own check-ins"
  ON workout_checkins FOR ALL USING (auth.uid() = user_id);

-- Verify table was created
SELECT 'workout_checkins table created successfully' AS status;
