-- Social Features Enhancement Migration
-- Run this migration to add notifications, reactions, competition, and accountability features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PHASE 1: Activity Feed Improvements
-- =====================================================

-- Notifications table (for all notification types)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200),
    message TEXT,
    from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reference_id UUID,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Activity likes table (for liking workout activities)
CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) DEFAULT 'like',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON activity_likes(user_id);

-- Activity comments table
CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at ON activity_comments(activity_id, created_at);

-- =====================================================
-- PHASE 2: Comparisons & Competition
-- =====================================================

-- Weekly leaderboards cache (for performance)
CREATE TABLE IF NOT EXISTS weekly_leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start DATE NOT NULL,
    leaderboard_type VARCHAR(30) NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score DECIMAL(12,2) DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(week_start, leaderboard_type, user_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboards_week ON weekly_leaderboards(week_start, leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboards_rank ON weekly_leaderboards(week_start, leaderboard_type, rank);

-- PR battles tracking (when you beat a friend's PR)
CREATE TABLE IF NOT EXISTS pr_battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_name VARCHAR(100) NOT NULL,
    challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    defender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenger_weight DECIMAL(6,2),
    defender_weight DECIMAL(6,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_battles_exercise ON pr_battles(exercise_name);
CREATE INDEX IF NOT EXISTS idx_pr_battles_challenger ON pr_battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_pr_battles_defender ON pr_battles(defender_id);

-- =====================================================
-- PHASE 3: Accountability Features
-- =====================================================

-- Nudge system (one nudge per user pair per day)
CREATE TABLE IF NOT EXISTS nudges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message VARCHAR(100),
    nudge_type VARCHAR(20) DEFAULT 'workout',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on sender, recipient, and date (one nudge per day per pair)
CREATE UNIQUE INDEX IF NOT EXISTS idx_nudges_daily_limit
ON nudges(from_user_id, to_user_id, DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_nudges_to_user ON nudges(to_user_id);
CREATE INDEX IF NOT EXISTS idx_nudges_created_at ON nudges(created_at DESC);

-- Workout buddies (accountability partners)
CREATE TABLE IF NOT EXISTS workout_buddies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    matched_at TIMESTAMPTZ,
    UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_buddies_user_a ON workout_buddies(user_a_id);
CREATE INDEX IF NOT EXISTS idx_workout_buddies_user_b ON workout_buddies(user_b_id);
CREATE INDEX IF NOT EXISTS idx_workout_buddies_status ON workout_buddies(status);

-- Shared goals (mutual goals between two users)
CREATE TABLE IF NOT EXISTS shared_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type VARCHAR(30) NOT NULL,
    goal_description TEXT,
    target_value DECIMAL(12,2),
    target_unit VARCHAR(20),
    deadline DATE,
    creator_progress DECIMAL(12,2) DEFAULT 0,
    partner_progress DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_goals_creator ON shared_goals(creator_id);
CREATE INDEX IF NOT EXISTS idx_shared_goals_partner ON shared_goals(partner_id);
CREATE INDEX IF NOT EXISTS idx_shared_goals_status ON shared_goals(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_goals ENABLE ROW LEVEL SECURITY;

-- Notifications: users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Activity likes: anyone can see, users can manage their own
CREATE POLICY "Anyone can view likes" ON activity_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create own likes" ON activity_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON activity_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Activity comments: anyone can see, users can manage their own
CREATE POLICY "Anyone can view comments" ON activity_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create own comments" ON activity_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON activity_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON activity_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Weekly leaderboards: anyone can see
CREATE POLICY "Anyone can view leaderboards" ON weekly_leaderboards
    FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboards" ON weekly_leaderboards
    FOR ALL USING (true);

-- PR battles: anyone can see, system manages
CREATE POLICY "Anyone can view pr_battles" ON pr_battles
    FOR SELECT USING (true);

CREATE POLICY "System can manage pr_battles" ON pr_battles
    FOR ALL USING (true);

-- Nudges: users can see sent/received, can create for others
CREATE POLICY "Users can view nudges they sent or received" ON nudges
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send nudges" ON nudges
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received nudges" ON nudges
    FOR UPDATE USING (auth.uid() = to_user_id);

-- Workout buddies: users can see their own buddy relationships
CREATE POLICY "Users can view own buddy relationships" ON workout_buddies
    FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can create buddy requests" ON workout_buddies
    FOR INSERT WITH CHECK (auth.uid() = user_a_id);

CREATE POLICY "Users can update buddy relationships" ON workout_buddies
    FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can delete buddy relationships" ON workout_buddies
    FOR DELETE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Shared goals: users can see goals they're part of
CREATE POLICY "Users can view own shared goals" ON shared_goals
    FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create shared goals" ON shared_goals
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own shared goals" ON shared_goals
    FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = partner_id);

CREATE POLICY "Creators can delete shared goals" ON shared_goals
    FOR DELETE USING (auth.uid() = creator_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get the start of the current week (Monday)
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    RETURN input_date - EXTRACT(DOW FROM input_date)::INT + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update leaderboard score
CREATE OR REPLACE FUNCTION update_leaderboard_score(
    p_user_id UUID,
    p_leaderboard_type VARCHAR(30),
    p_score DECIMAL(12,2)
)
RETURNS VOID AS $$
DECLARE
    v_week_start DATE;
BEGIN
    v_week_start := get_week_start(CURRENT_DATE);

    INSERT INTO weekly_leaderboards (week_start, leaderboard_type, user_id, score, updated_at)
    VALUES (v_week_start, p_leaderboard_type, p_user_id, p_score, NOW())
    ON CONFLICT (week_start, leaderboard_type, user_id)
    DO UPDATE SET score = p_score, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate leaderboard ranks
CREATE OR REPLACE FUNCTION recalculate_leaderboard_ranks(
    p_week_start DATE,
    p_leaderboard_type VARCHAR(30)
)
RETURNS VOID AS $$
BEGIN
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
        FROM weekly_leaderboards
        WHERE week_start = p_week_start AND leaderboard_type = p_leaderboard_type
    )
    UPDATE weekly_leaderboards wl
    SET rank = ranked.new_rank
    FROM ranked
    WHERE wl.id = ranked.id;
END;
$$ LANGUAGE plpgsql;
