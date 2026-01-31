-- ========================================
-- UPREP FOODS & EXERCISES MIGRATION
-- ========================================
-- This migration adds foods, exercises enhancements, and workout templates tables
-- Total: 67 foods

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========================================
-- 1. FOODS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('Protein', 'Carbs', 'Fats', 'Vegetables', 'Sauces')),
    calories INTEGER NOT NULL DEFAULT 0,
    protein DECIMAL(5,2) NOT NULL DEFAULT 0,
    carbs DECIMAL(5,2) NOT NULL DEFAULT 0,
    fats DECIMAL(5,2) NOT NULL DEFAULT 0,
    default_unit VARCHAR(10) NOT NULL DEFAULT 'g' CHECK (default_unit IN ('g', 'ml', 'units', 'tbsp')),
    default_amount INTEGER NOT NULL DEFAULT 100,
    is_system BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for foods
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING gin(name gin_trgm_ops);

-- RLS Policies for foods
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Everyone can read system foods
CREATE POLICY "Public read access to system foods" ON foods
FOR SELECT USING (is_system = true OR created_by = auth.uid());

-- Users can create their own custom foods
CREATE POLICY "Users can create custom foods" ON foods
FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system = false);

-- Users can update their own custom foods
CREATE POLICY "Users can update own custom foods" ON foods
FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

-- Users can delete their own custom foods
CREATE POLICY "Users can delete own custom foods" ON foods
FOR DELETE USING (created_by = auth.uid() AND is_system = false);

-- ========================================
-- 2. SEED FOODS DATA (77 items)
-- ========================================

-- PROTEIN SOURCES (20 items)
INSERT INTO foods (name, category, calories, protein, carbs, fats, default_unit, default_amount, is_system) VALUES
('Chicken Breast', 'Protein', 165, 31, 0, 4, 'g', 100, true),
('Chicken Thigh', 'Protein', 209, 26, 0, 11, 'g', 100, true),
('Beef Steak', 'Protein', 250, 26, 0, 15, 'g', 100, true),
('Beef Mince (lean)', 'Protein', 176, 20, 0, 10, 'g', 100, true),
('Salmon', 'Protein', 208, 20, 0, 13, 'g', 100, true),
('Tuna', 'Protein', 132, 28, 0, 1, 'g', 100, true),
('Prawns', 'Protein', 99, 24, 0, 0.3, 'g', 100, true),
('White Fish', 'Protein', 96, 21, 0, 1, 'g', 100, true),
('Eggs', 'Protein', 155, 13, 1, 11, 'units', 2, true),
('Egg Whites', 'Protein', 52, 11, 1, 0, 'units', 4, true),
('Tofu', 'Protein', 76, 8, 2, 4, 'g', 100, true),
('Tempeh', 'Protein', 193, 19, 9, 11, 'g', 100, true),
('Greek Yogurt', 'Protein', 97, 9, 4, 5, 'g', 100, true),
('Cottage Cheese', 'Protein', 98, 11, 3, 4, 'g', 100, true),
('Protein Shake', 'Protein', 120, 24, 3, 1, 'g', 100, true),
('Protein Powder', 'Protein', 370, 73, 7, 3, 'g', 100, true),
('Turkey Breast', 'Protein', 135, 30, 0, 1, 'g', 100, true),
('Lamb', 'Protein', 294, 25, 0, 21, 'g', 100, true),
('Pork Loin', 'Protein', 143, 26, 0, 4, 'g', 100, true),
('Kangaroo', 'Protein', 98, 23, 0, 1, 'g', 100, true)
ON CONFLICT (name) DO NOTHING;

-- CARB SOURCES (16 items)
INSERT INTO foods (name, category, calories, protein, carbs, fats, default_unit, default_amount, is_system) VALUES
('White Rice', 'Carbs', 130, 3, 28, 0, 'g', 100, true),
('Brown Rice', 'Carbs', 112, 3, 24, 1, 'g', 100, true),
('Basmati Rice', 'Carbs', 121, 3, 25, 0, 'g', 100, true),
('Pasta', 'Carbs', 131, 5, 25, 1, 'g', 100, true),
('Whole Wheat Pasta', 'Carbs', 124, 5, 25, 1, 'g', 100, true),
('Potato', 'Carbs', 77, 2, 17, 0, 'g', 100, true),
('Sweet Potato', 'Carbs', 86, 2, 20, 0, 'g', 100, true),
('Bread', 'Carbs', 265, 9, 49, 3, 'g', 100, true),
('Sourdough', 'Carbs', 240, 8, 45, 2, 'g', 100, true),
('Oatmeal', 'Carbs', 68, 2, 12, 1, 'g', 100, true),
('Quinoa', 'Carbs', 120, 4, 21, 2, 'g', 100, true),
('Couscous', 'Carbs', 112, 4, 23, 0, 'g', 100, true),
('Noodles', 'Carbs', 138, 5, 25, 2, 'g', 100, true),
('Rice Noodles', 'Carbs', 109, 1, 25, 0, 'g', 100, true),
('Wrap/Tortilla', 'Carbs', 218, 6, 36, 5, 'g', 100, true),
('Bagel', 'Carbs', 250, 10, 48, 1, 'g', 100, true)
ON CONFLICT (name) DO NOTHING;

-- FAT SOURCES (11 items, excluding "None/Minimal")
INSERT INTO foods (name, category, calories, protein, carbs, fats, default_unit, default_amount, is_system) VALUES
('Avocado', 'Fats', 160, 2, 9, 15, 'g', 15, true),
('Olive Oil', 'Fats', 119, 0, 0, 14, 'tbsp', 1, true),
('Coconut Oil', 'Fats', 121, 0, 0, 14, 'tbsp', 1, true),
('Butter', 'Fats', 72, 0, 0, 8, 'g', 15, true),
('Nuts', 'Fats', 170, 5, 6, 15, 'g', 15, true),
('Almonds', 'Fats', 164, 6, 6, 14, 'g', 15, true),
('Cheese', 'Fats', 113, 7, 0, 9, 'g', 15, true),
('Feta', 'Fats', 75, 4, 1, 6, 'g', 15, true),
('Peanut Butter', 'Fats', 94, 4, 3, 8, 'tbsp', 1, true),
('Almond Butter', 'Fats', 98, 3, 3, 9, 'tbsp', 1, true),
('Seeds', 'Fats', 52, 2, 2, 5, 'g', 15, true)
ON CONFLICT (name) DO NOTHING;

-- VEGETABLE SOURCES (13 items, excluding "None")
INSERT INTO foods (name, category, calories, protein, carbs, fats, default_unit, default_amount, is_system) VALUES
('Broccoli', 'Vegetables', 35, 2, 7, 0, 'g', 100, true),
('Spinach', 'Vegetables', 23, 3, 4, 0, 'g', 100, true),
('Mixed Salad', 'Vegetables', 20, 1, 4, 0, 'g', 100, true),
('Mushrooms', 'Vegetables', 22, 3, 3, 0, 'g', 100, true),
('Capsicum', 'Vegetables', 31, 1, 6, 0, 'g', 100, true),
('Zucchini', 'Vegetables', 17, 1, 3, 0, 'g', 100, true),
('Asparagus', 'Vegetables', 20, 2, 4, 0, 'g', 100, true),
('Green Beans', 'Vegetables', 31, 2, 7, 0, 'g', 100, true),
('Carrots', 'Vegetables', 41, 1, 10, 0, 'g', 100, true),
('Tomatoes', 'Vegetables', 18, 1, 4, 0, 'g', 100, true),
('Onion', 'Vegetables', 40, 1, 9, 0, 'g', 100, true),
('Corn', 'Vegetables', 86, 3, 19, 1, 'g', 100, true),
('Peas', 'Vegetables', 81, 5, 14, 0, 'g', 100, true)
ON CONFLICT (name) DO NOTHING;

-- SAUCE/TOPPING SOURCES (14 items, excluding "None")
INSERT INTO foods (name, category, calories, protein, carbs, fats, default_unit, default_amount, is_system) VALUES
('Soy Sauce', 'Sauces', 8, 1, 1, 0, 'g', 15, true),
('Teriyaki Sauce', 'Sauces', 45, 1, 9, 0, 'g', 15, true),
('BBQ Sauce', 'Sauces', 29, 0, 7, 0, 'tbsp', 1, true),
('Hot Sauce', 'Sauces', 3, 0, 1, 0, 'g', 15, true),
('Salsa', 'Sauces', 17, 1, 4, 0, 'g', 15, true),
('Hummus', 'Sauces', 27, 1, 2, 2, 'tbsp', 1, true),
('Guacamole', 'Sauces', 25, 0, 1, 2, 'tbsp', 1, true),
('Tzatziki', 'Sauces', 18, 1, 1, 1, 'tbsp', 1, true),
('Mayo', 'Sauces', 94, 0, 0, 10, 'tbsp', 1, true),
('Mustard', 'Sauces', 5, 0, 0, 0, 'g', 15, true),
('Pesto', 'Sauces', 80, 2, 1, 8, 'tbsp', 1, true),
('Tahini', 'Sauces', 89, 3, 3, 8, 'tbsp', 1, true),
('Sriracha', 'Sauces', 15, 0, 3, 0, 'g', 15, true),
('Gravy', 'Sauces', 25, 1, 3, 1, 'tbsp', 1, true)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 3. EXERCISES TABLE ENHANCEMENTS
-- ========================================
-- The exercises table already exists, we're adding new columns

ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS default_sets INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS default_reps INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS default_rest_time INTEGER DEFAULT 90,
    ADD COLUMN IF NOT EXISTS targeted_heads TEXT[],
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Additional indexes for exercises
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);

-- ========================================
-- 4. WORKOUT TEMPLATES TABLES
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
CREATE POLICY "Public read access to system templates" ON workout_templates
FOR SELECT USING (is_system = true OR created_by = auth.uid());

-- Users can create their own custom templates
CREATE POLICY "Users can create custom templates" ON workout_templates
FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system = false);

-- Users can update their own custom templates
CREATE POLICY "Users can update own custom templates" ON workout_templates
FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

-- Users can delete their own custom templates
CREATE POLICY "Users can delete own custom templates" ON workout_templates
FOR DELETE USING (created_by = auth.uid() AND is_system = false);

-- RLS Policies for template_exercises
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read system template exercises
CREATE POLICY "Public read access to template exercises" ON template_exercises
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workout_templates wt
        WHERE wt.id = template_exercises.template_id
        AND (wt.is_system = true OR wt.created_by = auth.uid())
    )
);

-- Users can manage exercises in their own templates
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
-- MIGRATION COMPLETE
-- ========================================
-- Next steps:
-- 1. Run this migration on Supabase
-- 2. Seed exercises data (existing exercises table should have ~218 exercises)
-- 3. Seed workout templates (manually or via separate script)
-- 4. Create and deploy service layer (foodService, exerciseService)
-- 5. Update frontend to load from database

-- Verify with:
-- SELECT 'foods' as table_name, COUNT(*) as count FROM foods
-- UNION ALL
-- SELECT 'exercises', COUNT(*) FROM exercises
-- UNION ALL
-- SELECT 'workout_templates', COUNT(*) FROM workout_templates
-- UNION ALL
-- SELECT 'template_exercises', COUNT(*) FROM template_exercises;
