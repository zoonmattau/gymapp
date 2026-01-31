-- Add missing columns to user_goals table
-- Run this in your Supabase SQL Editor

-- Add program_id column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS program_id TEXT;

-- Add equipment column if it doesn't exist (array of equipment IDs)
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS equipment TEXT[];

-- Add experience column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add goal_weight column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS goal_weight NUMERIC;

-- Add current_weight column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS current_weight NUMERIC;

-- Add starting_weight column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS starting_weight NUMERIC;

-- Add days_per_week column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS days_per_week INTEGER;

-- Add program_weeks column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS program_weeks INTEGER;

-- Add session_duration column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS session_duration INTEGER;

-- Add rest_days column if it doesn't exist (array of day numbers 0-6)
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS rest_days INTEGER[];

-- Add activity_level column if it doesn't exist
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS activity_level TEXT;

-- Verify the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_goals'
ORDER BY ordinal_position;
