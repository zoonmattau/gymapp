-- ========================================
-- QUICK FIXES FOR MISSING TABLES/COLUMNS
-- Run this after the main migrations
-- ========================================

-- 1. Create foods table (if you skipped 006)
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30),
    calories INTEGER DEFAULT 0,
    protein DECIMAL(5,2) DEFAULT 0,
    carbs DECIMAL(5,2) DEFAULT 0,
    fats DECIMAL(5,2) DEFAULT 0,
    default_unit VARCHAR(10) DEFAULT 'g',
    default_amount INTEGER DEFAULT 100,
    is_system BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read foods" ON foods;
CREATE POLICY "Anyone can read foods" ON foods FOR SELECT USING (true);

-- 2. Add missing reaction_type column to activity_likes
ALTER TABLE activity_likes ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20) DEFAULT 'like';

-- 3. Create workout_streaks table (missing from migrations)
CREATE TABLE IF NOT EXISTS workout_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_workout_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
ALTER TABLE workout_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own workout streaks" ON workout_streaks;
CREATE POLICY "Users can view own workout streaks" ON workout_streaks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own workout streaks" ON workout_streaks;
CREATE POLICY "Users can manage own workout streaks" ON workout_streaks FOR ALL USING (auth.uid() = user_id);

-- 4. Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('foods', 'activity_likes', 'workout_streaks');
