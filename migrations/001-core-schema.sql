-- ============================================
-- UPREP DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    bio TEXT CHECK (char_length(bio) <= 150),
    avatar_url TEXT,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User fitness goals and preferences
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal VARCHAR(20) NOT NULL CHECK (goal IN ('build_muscle', 'lose_fat', 'strength', 'fitness')),
    experience VARCHAR(20) CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
    days_per_week INTEGER CHECK (days_per_week BETWEEN 1 AND 7),
    session_duration INTEGER DEFAULT 60,
    current_weight DECIMAL(5,2),
    goal_weight DECIMAL(5,2),
    starting_weight DECIMAL(5,2),
    program_weeks INTEGER DEFAULT 16,
    rest_days INTEGER[] DEFAULT '{5,6}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    units VARCHAR(10) DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    notification_workout_reminders BOOLEAN DEFAULT TRUE,
    notification_progress_updates BOOLEAN DEFAULT TRUE,
    notification_social_activity BOOLEAN DEFAULT TRUE,
    notification_weekly_report BOOLEAN DEFAULT TRUE,
    privacy_profile_visible BOOLEAN DEFAULT TRUE,
    privacy_show_activity BOOLEAN DEFAULT TRUE,
    privacy_show_progress BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- EXERCISES & WORKOUT TEMPLATES
-- ============================================

-- Exercise library
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    muscle_group VARCHAR(50) NOT NULL,
    equipment VARCHAR(50),
    exercise_type VARCHAR(20) CHECK (exercise_type IN ('compound', 'isolation')),
    description TEXT,
    instructions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout templates
CREATE TABLE workout_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    focus VARCHAR(100),
    description TEXT,
    goals TEXT[],
    is_system_template BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template exercises
CREATE TABLE workout_template_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(50) NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    order_index INTEGER NOT NULL,
    sets INTEGER DEFAULT 3,
    target_reps INTEGER DEFAULT 10,
    suggested_weight DECIMAL(6,2),
    rest_time INTEGER DEFAULT 120,
    UNIQUE(template_id, order_index)
);

-- ============================================
-- TRAINING PROGRAMS & SCHEDULES
-- ============================================

-- User training programs
CREATE TABLE user_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    days_per_week INTEGER NOT NULL,
    current_week INTEGER DEFAULT 1,
    total_weeks INTEGER DEFAULT 16,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout schedule
CREATE TABLE workout_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES user_programs(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    template_id VARCHAR(50) REFERENCES workout_templates(id),
    is_rest_day BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_skipped BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(user_id, scheduled_date)
);

-- ============================================
-- WORKOUT SESSIONS
-- ============================================

-- Completed workouts
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    template_id VARCHAR(50) REFERENCES workout_templates(id),
    schedule_id UUID REFERENCES workout_schedule(id),
    workout_name VARCHAR(100),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    total_volume DECIMAL(10,2),
    total_working_time INTEGER,
    total_rest_time INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual sets
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    exercise_name VARCHAR(100) NOT NULL,
    set_number INTEGER NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INTEGER NOT NULL,
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
    is_warmup BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, exercise_id, set_number)
);

-- Personal records
CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    exercise_name VARCHAR(100) NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INTEGER NOT NULL,
    e1rm DECIMAL(6,2),
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    workout_session_id UUID REFERENCES workout_sessions(id),
    notes TEXT
);

-- ============================================
-- NUTRITION TRACKING
-- ============================================

-- Nutrition goals
CREATE TABLE nutrition_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    calories INTEGER DEFAULT 2200,
    protein INTEGER DEFAULT 150,
    carbs INTEGER DEFAULT 250,
    fats INTEGER DEFAULT 70,
    water INTEGER DEFAULT 2500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Daily nutrition totals
CREATE TABLE daily_nutrition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein INTEGER DEFAULT 0,
    total_carbs INTEGER DEFAULT 0,
    total_fats INTEGER DEFAULT 0,
    water_intake INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

-- Meal entries
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    daily_nutrition_id UUID REFERENCES daily_nutrition(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    meal_time TIME,
    calories INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fats INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water intake
CREATE TABLE water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    amount_ml INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplements
CREATE TABLE user_supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    scheduled_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement logs
CREATE TABLE supplement_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    supplement_id UUID NOT NULL REFERENCES user_supplements(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplement_id, log_date)
);

-- ============================================
-- SLEEP TRACKING
-- ============================================

CREATE TABLE sleep_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    bed_time TIME,
    wake_time TIME,
    hours_slept DECIMAL(3,1),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

CREATE TABLE sleep_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_hours DECIMAL(3,1) DEFAULT 8.0,
    target_bed_time TIME DEFAULT '22:30',
    target_wake_time TIME DEFAULT '06:30',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- WEIGHT TRACKING
-- ============================================

CREATE TABLE weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    body_fat_percent DECIMAL(4,1),
    muscle_mass_percent DECIMAL(4,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

-- ============================================
-- STREAKS
-- ============================================

CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    streak_type VARCHAR(30) NOT NULL CHECK (streak_type IN ('workout', 'nutrition', 'protein', 'water', 'sleep', 'supplements')),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- ============================================
-- INJURY TRACKING
-- ============================================

CREATE TABLE user_injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    muscle_group VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    notes TEXT,
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Recovery timeline stored as JSONB for flexibility
    timeline JSONB NOT NULL,
    -- Current phase for quick filtering
    current_phase VARCHAR(20) DEFAULT 'rest' CHECK (current_phase IN ('rest', 'recovery', 'strengthening', 'return', 'healed')),
    -- Expected recovery date for queries
    expected_recovery_date DATE,
    -- When injury was marked as healed
    healed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active injuries lookup
CREATE INDEX idx_user_injuries_active ON user_injuries(user_id, current_phase) WHERE current_phase != 'healed';

-- ============================================
-- ACHIEVEMENTS
-- ============================================

CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    category VARCHAR(30),
    requirement_type VARCHAR(30),
    requirement_value INTEGER
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('workout', 'pr', 'milestone', 'achievement', 'streak')),
    title VARCHAR(200),
    description TEXT,
    metadata JSONB,
    workout_session_id UUID REFERENCES workout_sessions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

CREATE TABLE activity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHALLENGES
-- ============================================

CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(30) NOT NULL CHECK (challenge_type IN ('workouts', 'streak', 'volume', 'custom')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score DECIMAL(12,2) DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id),
    invited_user_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, invited_user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_personal_records_user ON personal_records(user_id);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_workout_sets_session ON workout_sets(session_id);
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, log_date);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date);
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);
CREATE INDEX idx_workout_schedule_user_date ON workout_schedule(user_id, scheduled_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_injuries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- User goals policies
CREATE POLICY "Users can manage own goals" ON user_goals FOR ALL USING (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (user_id = auth.uid());

-- Workout sessions policies
CREATE POLICY "Users can manage own workout sessions" ON workout_sessions FOR ALL USING (user_id = auth.uid());

-- Workout sets policies
CREATE POLICY "Users can manage own workout sets" ON workout_sets FOR ALL USING (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);

-- Personal records policies
CREATE POLICY "Users can manage own personal records" ON personal_records FOR ALL USING (user_id = auth.uid());

-- Nutrition policies
CREATE POLICY "Users can manage own daily nutrition" ON daily_nutrition FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own meals" ON meal_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own water logs" ON water_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own nutrition goals" ON nutrition_goals FOR ALL USING (user_id = auth.uid());

-- Sleep policies
CREATE POLICY "Users can manage own sleep logs" ON sleep_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own sleep goals" ON sleep_goals FOR ALL USING (user_id = auth.uid());

-- Weight policies
CREATE POLICY "Users can manage own weight logs" ON weight_logs FOR ALL USING (user_id = auth.uid());

-- Schedule policies
CREATE POLICY "Users can manage own schedule" ON workout_schedule FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own programs" ON user_programs FOR ALL USING (user_id = auth.uid());

-- Streaks policies
CREATE POLICY "Users can manage own streaks" ON user_streaks FOR ALL USING (user_id = auth.uid());

-- Achievements policies
CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL USING (user_id = auth.uid());

-- Supplement policies
CREATE POLICY "Users can manage own supplements" ON user_supplements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own supplement logs" ON supplement_logs FOR ALL USING (user_id = auth.uid());

-- Injury policies
CREATE POLICY "Users can manage own injuries" ON user_injuries FOR ALL USING (user_id = auth.uid());

-- Activity feed policies (can see own and friends')
CREATE POLICY "Users can view activity from friends" ON activity_feed FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
        AND ((f.user_id = auth.uid() AND f.friend_id = activity_feed.user_id)
            OR (f.friend_id = auth.uid() AND f.user_id = activity_feed.user_id))
    )
);
CREATE POLICY "Users can create own activity" ON activity_feed FOR INSERT WITH CHECK (user_id = auth.uid());

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can request friendships" ON friendships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update friendships they're part of" ON friendships FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Activity likes policies
CREATE POLICY "Users can manage activity likes" ON activity_likes FOR ALL USING (user_id = auth.uid());

-- Activity comments policies
CREATE POLICY "Users can manage activity comments" ON activity_comments FOR ALL USING (user_id = auth.uid());

-- Challenges policies
CREATE POLICY "Users can view public challenges or their own" ON challenges FOR SELECT USING (
    is_public = TRUE OR created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (created_by = auth.uid());

-- Challenge participants policies
CREATE POLICY "Users can manage own challenge participation" ON challenge_participants FOR ALL USING (user_id = auth.uid());

-- Exercises are public (read-only for users)
CREATE POLICY "Anyone can view exercises" ON exercises FOR SELECT USING (true);

-- Workout templates are public (read-only for users)
CREATE POLICY "Anyone can view workout templates" ON workout_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can view template exercises" ON workout_template_exercises FOR SELECT USING (true);

-- Achievements are public
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_')),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );

    -- Also create default settings
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

    -- Create default nutrition goals
    INSERT INTO public.nutrition_goals (user_id) VALUES (NEW.id);

    -- Create default sleep goals
    INSERT INTO public.sleep_goals (user_id) VALUES (NEW.id);

    -- Initialize streaks
    INSERT INTO public.user_streaks (user_id, streak_type) VALUES
        (NEW.id, 'workout'),
        (NEW.id, 'nutrition'),
        (NEW.id, 'protein'),
        (NEW.id, 'water'),
        (NEW.id, 'sleep'),
        (NEW.id, 'supplements');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
