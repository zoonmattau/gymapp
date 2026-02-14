-- Add onboarding_completed column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Update any existing users who have completed onboarding (optional - run if needed)
-- UPDATE profiles SET onboarding_completed = true WHERE id IN (SELECT id FROM profiles WHERE username IS NOT NULL);
