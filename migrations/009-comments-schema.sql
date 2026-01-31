-- Workout Comments Table
CREATE TABLE IF NOT EXISTS workout_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES published_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_comments_workout_id ON workout_comments(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_user_id ON workout_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_created_at ON workout_comments(created_at DESC);

-- Workout Ratings Table (if not exists)
CREATE TABLE IF NOT EXISTS workout_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES published_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workout_id)
);

-- Create indexes for ratings
CREATE INDEX IF NOT EXISTS idx_workout_ratings_workout_id ON workout_ratings(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_ratings_user_id ON workout_ratings(user_id);

-- Add target_duration and actual_duration columns to published_workouts if not exists
ALTER TABLE published_workouts ADD COLUMN IF NOT EXISTS target_duration INTEGER DEFAULT 45;
ALTER TABLE published_workouts ADD COLUMN IF NOT EXISTS avg_actual_duration INTEGER;
ALTER TABLE published_workouts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_comments
CREATE POLICY "Anyone can read comments" ON workout_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON workout_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON workout_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON workout_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_ratings
CREATE POLICY "Anyone can read ratings" ON workout_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ratings" ON workout_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON workout_ratings
  FOR UPDATE USING (auth.uid() = user_id);
