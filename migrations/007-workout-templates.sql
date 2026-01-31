-- ========================================
-- WORKOUT TEMPLATES MIGRATION
-- ========================================
-- Creates workout_templates and template_exercises tables

-- ========================================
-- 1. WORKOUT TEMPLATES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS workout_templates (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    focus VARCHAR(100),
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    goals TEXT[],
    is_system BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed without them
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT true;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS focus VARCHAR(100);
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS goals TEXT[];
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Set defaults for existing rows
UPDATE workout_templates SET is_system = true WHERE is_system IS NULL;

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

-- Indexes for workout templates
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_template_exercises_exercise ON template_exercises(exercise_id);

-- RLS Policies for workout_templates
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read system templates
DROP POLICY IF EXISTS "Public read access to system templates" ON workout_templates;
CREATE POLICY "Public read access to system templates" ON workout_templates
FOR SELECT USING (is_system = true OR created_by = auth.uid());

-- Users can create their own custom templates
DROP POLICY IF EXISTS "Users can create custom templates" ON workout_templates;
CREATE POLICY "Users can create custom templates" ON workout_templates
FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system = false);

-- Users can update their own custom templates
DROP POLICY IF EXISTS "Users can update own custom templates" ON workout_templates;
CREATE POLICY "Users can update own custom templates" ON workout_templates
FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

-- Users can delete their own custom templates
DROP POLICY IF EXISTS "Users can delete own custom templates" ON workout_templates;
CREATE POLICY "Users can delete own custom templates" ON workout_templates
FOR DELETE USING (created_by = auth.uid() AND is_system = false);

-- RLS Policies for template_exercises
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read system template exercises
DROP POLICY IF EXISTS "Public read access to template exercises" ON template_exercises;
CREATE POLICY "Public read access to template exercises" ON template_exercises
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workout_templates wt
        WHERE wt.id = template_exercises.template_id
        AND (wt.is_system = true OR wt.created_by = auth.uid())
    )
);

-- Users can manage exercises in their own templates
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

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('workout_templates', 'template_exercises');

-- Check counts
SELECT
    (SELECT COUNT(*) FROM workout_templates) as workout_templates_count,
    (SELECT COUNT(*) FROM template_exercises) as template_exercises_count;
