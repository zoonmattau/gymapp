-- ========================================
-- WORKOUT TEMPLATES UPDATE
-- ========================================
-- Safely updates existing workout_templates table

-- Add missing columns to workout_templates if they don't exist
DO $$
BEGIN
    -- Add is_system column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='workout_templates' AND column_name='is_system'
    ) THEN
        ALTER TABLE workout_templates ADD COLUMN is_system BOOLEAN DEFAULT true;
        -- Update all existing templates to be system templates
        UPDATE workout_templates SET is_system = true WHERE is_system IS NULL;
        RAISE NOTICE 'Added column: is_system';
    ELSE
        RAISE NOTICE 'Column already exists: is_system';
    END IF;

    -- Add created_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='workout_templates' AND column_name='created_by'
    ) THEN
        ALTER TABLE workout_templates ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added column: created_by';
    ELSE
        RAISE NOTICE 'Column already exists: created_by';
    END IF;

    -- Add difficulty column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='workout_templates' AND column_name='difficulty'
    ) THEN
        ALTER TABLE workout_templates ADD COLUMN difficulty VARCHAR(20) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
        RAISE NOTICE 'Added column: difficulty';
    ELSE
        RAISE NOTICE 'Column already exists: difficulty';
    END IF;

    -- Add goals column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='workout_templates' AND column_name='goals'
    ) THEN
        ALTER TABLE workout_templates ADD COLUMN goals TEXT[];
        RAISE NOTICE 'Added column: goals';
    ELSE
        RAISE NOTICE 'Column already exists: goals';
    END IF;
END $$;

-- Check if template_exercises table exists, if not create it
CREATE TABLE IF NOT EXISTS template_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    target_reps INTEGER NOT NULL DEFAULT 10,
    suggested_weight INTEGER DEFAULT 0,
    rest_time INTEGER NOT NULL DEFAULT 90,
    UNIQUE(template_id, order_index)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_template_exercises_exercise ON template_exercises(exercise_id);

-- Enable RLS on workout_templates (if not already enabled)
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if they exist) and recreate them
DROP POLICY IF EXISTS "Public read access to system templates" ON workout_templates;
CREATE POLICY "Public read access to system templates" ON workout_templates
FOR SELECT USING (is_system = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create custom templates" ON workout_templates;
CREATE POLICY "Users can create custom templates" ON workout_templates
FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system = false);

DROP POLICY IF EXISTS "Users can update own custom templates" ON workout_templates;
CREATE POLICY "Users can update own custom templates" ON workout_templates
FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

DROP POLICY IF EXISTS "Users can delete own custom templates" ON workout_templates;
CREATE POLICY "Users can delete own custom templates" ON workout_templates
FOR DELETE USING (created_by = auth.uid() AND is_system = false);

-- Enable RLS on template_exercises
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_exercises
DROP POLICY IF EXISTS "Public read access to template exercises" ON template_exercises;
CREATE POLICY "Public read access to template exercises" ON template_exercises
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workout_templates wt
        WHERE wt.id = template_exercises.template_id
        AND (wt.is_system = true OR wt.created_by = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can manage own template exercises" ON template_exercises;
CREATE POLICY "Users can manage own template exercises" ON template_exercises
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM workout_templates wt
        WHERE wt.id = template_exercises.template_id
        AND wt.created_by = auth.uid()
        AND wt.is_system = false
    )
);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workout_templates'
ORDER BY ordinal_position;

-- Check if we have any templates
SELECT COUNT(*) as total_templates FROM workout_templates;
SELECT COUNT(*) as total_template_exercises FROM template_exercises;
