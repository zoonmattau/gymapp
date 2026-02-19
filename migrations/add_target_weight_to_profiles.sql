-- Add target_weight column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2);

-- Also ensure user_goals has target_weight column
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2);
