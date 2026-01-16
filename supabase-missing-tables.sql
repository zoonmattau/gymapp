-- ============================================
-- MISSING TABLES FOR UPREP
-- Run this in Supabase SQL Editor
-- ============================================

-- Workout Ratings
CREATE TABLE IF NOT EXISTS workout_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_id VARCHAR(50) NOT NULL,
    workout_type VARCHAR(20) DEFAULT 'system',
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id, workout_type)
);

-- Workout Stats (aggregated rating/completion data)
CREATE TABLE IF NOT EXISTS workout_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id VARCHAR(50) NOT NULL,
    workout_type VARCHAR(20) DEFAULT 'system',
    completion_count INTEGER DEFAULT 0,
    total_rating INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workout_id, workout_type)
);

-- Published Workouts (community workouts)
CREATE TABLE IF NOT EXISTS published_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    focus VARCHAR(100),
    description TEXT,
    goals TEXT[],
    exercises JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    completion_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Workouts (bookmarked community workouts)
CREATE TABLE IF NOT EXISTS saved_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES published_workouts(id) ON DELETE CASCADE,
    workout_type VARCHAR(20) DEFAULT 'published',
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- Enable RLS on new tables
ALTER TABLE workout_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_ratings
CREATE POLICY "Users can manage own workout ratings" ON workout_ratings FOR ALL USING (user_id = auth.uid());

-- RLS Policies for workout_stats (readable by all, writable by system)
CREATE POLICY "Anyone can view workout stats" ON workout_stats FOR SELECT USING (true);
CREATE POLICY "Users can update workout stats" ON workout_stats FOR ALL USING (true);

-- RLS Policies for published_workouts
CREATE POLICY "Anyone can view public workouts" ON published_workouts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own published workouts" ON published_workouts FOR ALL USING (creator_id = auth.uid());

-- RLS Policies for saved_workouts
CREATE POLICY "Users can manage own saved workouts" ON saved_workouts FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_ratings_user ON workout_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_ratings_workout ON workout_ratings(workout_id);
CREATE INDEX IF NOT EXISTS idx_published_workouts_creator ON published_workouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_saved_workouts_user ON saved_workouts(user_id);
