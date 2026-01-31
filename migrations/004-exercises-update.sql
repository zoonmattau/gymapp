-- ========================================
-- EXERCISES TABLE UPDATE
-- ========================================
-- Safely add new columns to existing exercises table

-- First, check what columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;

-- Add new columns if they don't exist
DO $$
BEGIN
    -- Add default_sets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='exercises' AND column_name='default_sets'
    ) THEN
        ALTER TABLE exercises ADD COLUMN default_sets INTEGER DEFAULT 3;
        RAISE NOTICE 'Added column: default_sets';
    ELSE
        RAISE NOTICE 'Column already exists: default_sets';
    END IF;

    -- Add default_reps
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='exercises' AND column_name='default_reps'
    ) THEN
        ALTER TABLE exercises ADD COLUMN default_reps INTEGER DEFAULT 10;
        RAISE NOTICE 'Added column: default_reps';
    ELSE
        RAISE NOTICE 'Column already exists: default_reps';
    END IF;

    -- Add default_rest_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='exercises' AND column_name='default_rest_time'
    ) THEN
        ALTER TABLE exercises ADD COLUMN default_rest_time INTEGER DEFAULT 90;
        RAISE NOTICE 'Added column: default_rest_time';
    ELSE
        RAISE NOTICE 'Column already exists: default_rest_time';
    END IF;

    -- Add targeted_heads
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='exercises' AND column_name='targeted_heads'
    ) THEN
        ALTER TABLE exercises ADD COLUMN targeted_heads TEXT[];
        RAISE NOTICE 'Added column: targeted_heads';
    ELSE
        RAISE NOTICE 'Column already exists: targeted_heads';
    END IF;

    -- Add is_system
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='exercises' AND column_name='is_system'
    ) THEN
        ALTER TABLE exercises ADD COLUMN is_system BOOLEAN DEFAULT true;
        -- Update all existing exercises to be system exercises
        UPDATE exercises SET is_system = true WHERE is_system IS NULL;
        RAISE NOTICE 'Added column: is_system';
    ELSE
        RAISE NOTICE 'Column already exists: is_system';
    END IF;

    -- Add created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='exercises' AND column_name='created_by'
    ) THEN
        ALTER TABLE exercises ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added column: created_by';
    ELSE
        RAISE NOTICE 'Column already exists: created_by';
    END IF;
END $$;

-- Add indexes for exercises
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;

-- Count exercises
SELECT COUNT(*) as total_exercises FROM exercises;
