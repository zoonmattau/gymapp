-- Fix check constraints on user_goals table (v2 - handles existing data)
-- Run this in your Supabase SQL Editor

-- First, drop the existing restrictive constraints
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_goal_check;
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_experience_check;

-- See what values currently exist
SELECT DISTINCT goal FROM user_goals WHERE goal IS NOT NULL;
SELECT DISTINCT experience FROM user_goals WHERE experience IS NOT NULL;

-- Fix any invalid goal values (map old values to valid ones)
UPDATE user_goals SET goal = 'fitness' WHERE goal IS NOT NULL AND goal NOT IN ('build_muscle', 'lose_fat', 'strength', 'fitness', 'bulk', 'cut', 'recomp', 'maintenance');

-- Fix any invalid experience values (map old values to valid ones)
UPDATE user_goals SET experience = NULL WHERE experience IS NOT NULL AND experience NOT IN ('beginner', 'novice', 'experienced', 'expert');

-- Now add the constraints
ALTER TABLE user_goals ADD CONSTRAINT user_goals_goal_check
CHECK (goal IN ('build_muscle', 'lose_fat', 'strength', 'fitness', 'bulk', 'cut', 'recomp', 'maintenance'));

ALTER TABLE user_goals ADD CONSTRAINT user_goals_experience_check
CHECK (experience IS NULL OR experience IN ('beginner', 'novice', 'experienced', 'expert'));

-- Verify it worked
SELECT 'Constraints updated successfully!' as status;
