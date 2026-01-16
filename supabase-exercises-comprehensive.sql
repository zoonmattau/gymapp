-- ========================================
-- COMPREHENSIVE EXERCISE DATABASE
-- ========================================
-- 100+ exercises with detailed instructions
-- Run this after the exercises table exists

-- Add new columns for detailed instructions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='video_url') THEN
        ALTER TABLE exercises ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='form_cues') THEN
        ALTER TABLE exercises ADD COLUMN form_cues TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='common_mistakes') THEN
        ALTER TABLE exercises ADD COLUMN common_mistakes TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='difficulty_level') THEN
        ALTER TABLE exercises ADD COLUMN difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='default_sets') THEN
        ALTER TABLE exercises ADD COLUMN default_sets INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='default_reps') THEN
        ALTER TABLE exercises ADD COLUMN default_reps INTEGER DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='default_rest_time') THEN
        ALTER TABLE exercises ADD COLUMN default_rest_time INTEGER DEFAULT 90;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='targeted_heads') THEN
        ALTER TABLE exercises ADD COLUMN targeted_heads TEXT[];
    END IF;
END $$;

-- ========================================
-- CHEST EXERCISES (13 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Barbell Bench Press', 'Chest', 'Barbell', 'compound', 'The king of chest exercises for building mass and strength',
    ARRAY['Lie flat with eyes under bar', 'Grip slightly wider than shoulders', 'Unrack and lower to mid-chest', 'Press bar up in slight arc', 'Keep elbows at 45 degrees'],
    ARRAY['Retract shoulder blades', 'Maintain arch in lower back', 'Drive feet into ground', 'Touch chest at nipple line', 'Control the descent'],
    ARRAY['Flaring elbows to 90 degrees', 'Bouncing off chest', 'Losing shoulder retraction', 'Uneven bar path'],
    ARRAY['Upper Chest', 'Mid Chest', 'Lower Chest', 'Triceps'], 'Intermediate', 4, 6, 180, true),

('Incline Barbell Press', 'Upper Chest', 'Barbell', 'compound', 'Targets upper chest for complete development',
    ARRAY['Set bench to 30-45 degrees', 'Eyes under bar', 'Lower to upper chest near collarbone', 'Press straight up', 'Full lockout at top'],
    ARRAY['Maintain shoulder blade retraction', 'Bar touches collarbone area', 'Vertical forearms at bottom', 'Controlled tempo'],
    ARRAY['Incline too steep over 45 degrees', 'Excessive elbow flare', 'Partial range of motion', 'Arching back too much'],
    ARRAY['Upper Chest', 'Front Delts', 'Triceps'], 'Intermediate', 4, 8, 150, true),

('Decline Bench Press', 'Lower Chest', 'Barbell', 'compound', 'Emphasizes lower chest development',
    ARRAY['Set bench to 15-30 degree decline', 'Secure feet in holds', 'Lower bar to lower chest', 'Press up explosively', 'Control the negative'],
    ARRAY['Keep core tight', 'Bar touches lower sternum', 'Shorter ROM than flat', 'Full extension at top'],
    ARRAY['Decline angle too steep', 'Lowering bar too high', 'Rushing the movement', 'Not using full range'],
    ARRAY['Lower Chest', 'Triceps'], 'Intermediate', 3, 8, 150, true),

('Dumbbell Bench Press', 'Chest', 'Dumbbells', 'compound', 'Greater range of motion than barbell version',
    ARRAY['Sit with dumbbells on thighs', 'Lie back bringing DBs to chest level', 'Press up with natural arc', 'Lower until elbows slightly below bench', 'Maintain control throughout'],
    ARRAY['Neutral wrist position', 'Do not bang DBs together at top', 'Equal tempo both sides', 'Full range of motion', 'Keep shoulder blades retracted'],
    ARRAY['Going too deep causing shoulder strain', 'Twisting dumbbells during press', 'One side moving faster than other', 'Bouncing at bottom'],
    ARRAY['Chest', 'Front Delts', 'Triceps'], 'Beginner', 3, 10, 120, true),

('Incline Dumbbell Press', 'Upper Chest', 'Dumbbells', 'compound', 'Best upper chest isolation exercise',
    ARRAY['Set bench to 30-45 degrees', 'Start with DBs at upper chest', 'Press up and slightly together', 'Lower with control for 2-3 seconds', 'Maintain constant tension'],
    ARRAY['Press in slight arc toward face', 'Control eccentric phase', 'Full range of motion', 'Keep core braced', 'Equal strength both sides'],
    ARRAY['Incline too steep', 'Pressing straight up instead of arc', 'Losing control at bottom', 'Using too much weight'],
    ARRAY['Upper Chest', 'Front Delts'], 'Beginner', 3, 10, 120, true),

('Dumbbell Fly', 'Chest', 'Dumbbells', 'isolation', 'Pure chest stretch and contraction',
    ARRAY['Lie flat with DBs above chest', 'Keep slight bend in elbows throughout', 'Lower in wide arc until deep stretch', 'Squeeze chest to bring DBs back up', 'Maintain constant elbow angle'],
    ARRAY['Same elbow bend entire movement', 'Feel stretch in chest not shoulders', 'Control the weight do not drop', 'Stop when upper arms parallel to floor', 'Squeeze pecs at top'],
    ARRAY['Straightening arms turning into press', 'Using too much weight', 'Going too deep risking shoulder injury', 'Fast uncontrolled motion'],
    ARRAY['Chest'], 'Intermediate', 3, 12, 90, true),

('Incline Dumbbell Fly', 'Upper Chest', 'Dumbbells', 'isolation', 'Isolates upper chest fibers',
    ARRAY['Set bench to 30-45 degrees', 'Start with DBs together above chest', 'Lower in wide arc with elbow bend', 'Feel stretch in upper chest', 'Bring back to starting position'],
    ARRAY['Slightly higher arc than flat fly', 'Really squeeze at the top', 'Slow 2-3 second eccentric', 'Constant tension on chest', 'Do not go too deep'],
    ARRAY['Using too much weight', 'Turning it into a press', 'Going past parallel at bottom', 'Losing control'],
    ARRAY['Upper Chest'], 'Intermediate', 3, 12, 90, true),

('Cable Fly', 'Chest', 'Cable', 'isolation', 'Provides constant tension throughout movement',
    ARRAY['Set cables at shoulder height', 'Step forward into split stance', 'Start with arms out wide slight elbow bend', 'Bring hands together in front of chest', 'Squeeze hard at peak contraction'],
    ARRAY['Maintain forward lean', 'Same elbow angle throughout', 'Focus on chest squeeze', 'Do not let cables pull you backward', 'Slow and controlled tempo'],
    ARRAY['Standing too upright', 'Using momentum', 'Changing elbow angle during movement', 'Partial range of motion'],
    ARRAY['Chest'], 'Beginner', 3, 15, 60, true),

('Incline Cable Fly', 'Upper Chest', 'Cable', 'isolation', 'Upper chest with constant tension',
    ARRAY['Set cables at low position', 'Set bench at 30-45 degrees', 'Grab handles and lie back', 'Start with arms wide cables under bench', 'Bring hands together above chest'],
    ARRAY['Feel constant tension on upper chest', 'Squeeze at top for 1 second', 'Do not let hands travel past midline', 'Maintain slight elbow bend throughout'],
    ARRAY['Using too much weight', 'Not squeezing at contraction', 'Rushing the movement', 'Losing tension'],
    ARRAY['Upper Chest'], 'Beginner', 3, 15, 60, true),

('Push Ups', 'Chest', 'Bodyweight', 'compound', 'Foundational bodyweight movement',
    ARRAY['Start in plank position hands under shoulders', 'Keep body in straight line head to heels', 'Lower chest to ground elbows at 45 degrees', 'Press back up to starting position', 'Maintain core tension throughout'],
    ARRAY['Keep core tight no sagging hips', 'Full range of motion', 'Elbows at 45-degree angle', 'Shoulder blades move naturally', 'Control the descent'],
    ARRAY['Sagging hips', 'Flaring elbows out wide', 'Partial range of motion', 'Head dropping', 'Losing core tension'],
    ARRAY['Chest', 'Triceps', 'Front Delts', 'Core'], 'Beginner', 3, 15, 60, true),

('Decline Push Ups', 'Upper Chest', 'Bodyweight', 'compound', 'Increased difficulty emphasizing upper chest',
    ARRAY['Place feet on bench or box', 'Hands on ground shoulder-width apart', 'Lower chest to ground', 'Press back up', 'Maintain plank position throughout'],
    ARRAY['Higher elevation increases difficulty', 'Keep body straight', 'Full range of motion', 'Control the movement', 'Engage core'],
    ARRAY['Sagging hips', 'Not going low enough', 'Moving too fast', 'Losing form'],
    ARRAY['Upper Chest', 'Front Delts', 'Triceps'], 'Intermediate', 3, 12, 60, true),

('Chest Dips', 'Lower Chest', 'Bodyweight', 'compound', 'Advanced lower chest developer',
    ARRAY['Grip parallel bars or dip station', 'Lean forward 15-20 degrees', 'Lower until upper arms parallel to ground', 'Press back up', 'Keep chest out throughout'],
    ARRAY['Forward lean targets chest more', 'Control the descent', 'Full range but do not go too deep', 'Keep elbows slightly out', 'Squeeze at top'],
    ARRAY['Going too deep risking shoulder injury', 'Staying too upright becomes tricep dip', 'Using momentum', 'Partial range of motion'],
    ARRAY['Lower Chest', 'Triceps', 'Front Delts'], 'Advanced', 3, 8, 120, true),

('Pec Deck Machine', 'Chest', 'Machine', 'isolation', 'Pure chest isolation with constant tension',
    ARRAY['Adjust seat so upper arms parallel to ground', 'Place forearms on pads or grip handles', 'Bring arms together in front of chest', 'Squeeze chest hard at peak', 'Control back to stretch position'],
    ARRAY['Keep shoulder blades back', 'Focus on chest squeeze not arm movement', 'Pause at contraction', 'Do not go too far back at stretch', 'Breathe steadily'],
    ARRAY['Going too far back shoulder injury risk', 'Using momentum', 'Not squeezing at contraction', 'Partial range'],
    ARRAY['Chest'], 'Beginner', 3, 15, 60, true);

-- ========================================
-- BACK EXERCISES (12 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Barbell Row', 'Back', 'Barbell', 'compound', 'King of back thickness exercises',
    ARRAY['Hip hinge to 45 degrees', 'Grip just outside shoulders', 'Pull bar to lower chest', 'Squeeze shoulder blades together', 'Lower with control'],
    ARRAY['Keep back flat throughout', 'Pull with elbows not hands', 'Bar touches lower sternum', 'Controlled eccentric', 'Engage lats'],
    ARRAY['Rounding lower back', 'Using too much momentum', 'Not pulling high enough', 'Standing too upright'],
    ARRAY['Mid Back', 'Upper Back', 'Lats'], 'Intermediate', 4, 8, 150, true),

('Pendlay Row', 'Back', 'Barbell', 'compound', 'Explosive rowing variation for power',
    ARRAY['Torso parallel to ground', 'Bar starts on floor each rep', 'Explosive pull to chest', 'Lower back to floor completely', 'Reset position each rep'],
    ARRAY['Flat back position', 'Explosive concentric', 'Dead stop each rep', 'Pull to lower chest', 'No body English'],
    ARRAY['Not resetting each rep', 'Rounding back', 'Standing too upright', 'Using momentum'],
    ARRAY['Mid Back', 'Upper Back'], 'Advanced', 4, 6, 150, true),

('Deadlift', 'Back', 'Barbell', 'compound', 'King of all exercises for overall back development',
    ARRAY['Feet hip width bar over mid-foot', 'Grip outside legs', 'Chest up back flat', 'Push floor away with legs', 'Stand up fully squeezing glutes'],
    ARRAY['Keep bar close to body', 'Neutral spine throughout', 'Hip hinge not squat', 'Shoulders over bar at start', 'Full lockout at top'],
    ARRAY['Rounding lower back', 'Letting bar drift forward', 'Squatting too much', 'Hyperextending at top', 'Hitching'],
    ARRAY['Lower Back', 'Mid Back', 'Traps', 'Glutes'], 'Advanced', 4, 5, 240, true),

('Romanian Deadlift', 'Hamstrings', 'Barbell', 'compound', 'Best hamstring developer',
    ARRAY['Stand with bar at thighs', 'Hip hinge pushing hips back', 'Lower bar down shins keeping close', 'Feel deep hamstring stretch', 'Drive hips forward to stand'],
    ARRAY['Keep back flat', 'Slight knee bend maintained', 'Bar stays close to body', 'Feel it in hamstrings', 'Squeeze glutes at top'],
    ARRAY['Rounding back', 'Bending knees too much', 'Not feeling hamstrings', 'Bar drifting forward', 'Not going deep enough'],
    ARRAY['Hamstrings', 'Glutes', 'Lower Back'], 'Intermediate', 3, 10, 120, true),

('Pull Ups', 'Lats', 'Bodyweight', 'compound', 'Ultimate lat width builder',
    ARRAY['Hang from bar shoulder width or wider', 'Pull chest to bar', 'Lead with chest not chin', 'Squeeze lats at top', 'Control descent fully extended'],
    ARRAY['Full range of motion', 'Squeeze lats at top', 'Avoid swinging or kipping', 'Controlled tempo', 'Depress shoulders at bottom'],
    ARRAY['Partial reps not full extension', 'Using momentum or swinging', 'Not engaging lats pulling with arms', 'Not going to full hang'],
    ARRAY['Lats', 'Upper Back', 'Biceps'], 'Advanced', 4, 8, 150, true),

('Chin Ups', 'Lats', 'Bodyweight', 'compound', 'Lat development with more bicep involvement',
    ARRAY['Hang from bar with supinated grip', 'Pull chest to bar', 'Squeeze lats and biceps', 'Control descent to full hang'],
    ARRAY['Full ROM', 'Lead with chest', 'Squeeze at top', 'No swinging', 'Controlled negative'],
    ARRAY['Using momentum', 'Partial range', 'Not fully extending', 'Pulling with only arms'],
    ARRAY['Lats', 'Biceps', 'Upper Back'], 'Advanced', 4, 8, 150, true),

('Lat Pulldown', 'Lats', 'Cable', 'compound', 'Lat width for all levels',
    ARRAY['Grip bar wider than shoulders', 'Sit with knees secured under pad', 'Pull bar to upper chest', 'Squeeze lats hard', 'Control return to full stretch'],
    ARRAY['Slight lean back 10-15 degrees', 'Pull with elbows down and back', 'Full stretch at top', 'Squeeze at bottom', 'Controlled tempo'],
    ARRAY['Leaning back too much', 'Pulling behind neck', 'Using momentum', 'Partial range', 'Not engaging lats'],
    ARRAY['Lats', 'Upper Back'], 'Beginner', 3, 10, 90, true),

('Dumbbell Row', 'Back', 'Dumbbells', 'compound', 'Unilateral back thickness',
    ARRAY['Place knee and hand on bench', 'DB hangs at arms length', 'Pull DB to hip', 'Squeeze at top', 'Lower with control'],
    ARRAY['Keep back parallel to floor', 'Pull with elbow not hand', 'Minimize torso rotation', 'Feel it in back not arms', 'Full ROM'],
    ARRAY['Rotating torso excessively', 'Pulling with hand bicep only', 'Using momentum', 'Not going full range'],
    ARRAY['Mid Back', 'Lats'], 'Beginner', 3, 10, 90, true),

('Seated Cable Row', 'Back', 'Cable', 'compound', 'Constant tension for back thickness',
    ARRAY['Sit with feet on platform', 'Grip handles or bar', 'Pull to lower abdomen', 'Squeeze shoulder blades together', 'Control return to full stretch'],
    ARRAY['Keep chest up tall posture', 'Pull elbows back behind body', 'Minimal torso movement', 'Squeeze at contraction', 'Full stretch at extension'],
    ARRAY['Rocking back and forth', 'Rounding shoulders forward', 'Partial range of motion', 'Pulling to wrong spot'],
    ARRAY['Mid Back', 'Lats'], 'Beginner', 3, 12, 90, true),

('T-Bar Row', 'Back', 'Barbell', 'compound', 'Thick back development',
    ARRAY['Straddle bar or use T-bar machine', 'Hip hinge at 45 degrees', 'Pull bar to chest', 'Squeeze hard at top', 'Lower with control'],
    ARRAY['Flat back throughout', 'Pull with elbows', 'Bar touches chest or close', 'Controlled tempo', 'Engage entire back'],
    ARRAY['Rounding back', 'Standing too upright', 'Using momentum', 'Partial range'],
    ARRAY['Mid Back', 'Lats'], 'Intermediate', 3, 10, 120, true),

('Face Pulls', 'Rear Delts', 'Cable', 'isolation', 'Rear delt and upper back health',
    ARRAY['Set cable at upper chest height', 'Use rope attachment', 'Pull toward face', 'Spread rope apart at ears', 'Squeeze rear delts'],
    ARRAY['Pull high to face level', 'Externally rotate shoulders', 'Control the movement', 'Squeeze for 1 second', 'Feel in rear delts'],
    ARRAY['Pulling too low', 'Using too much weight', 'Not spreading rope apart', 'Rushing the movement'],
    ARRAY['Rear Delts', 'Upper Back'], 'Beginner', 3, 15, 60, true),

('Straight Arm Pulldown', 'Lats', 'Cable', 'isolation', 'Lat isolation without biceps',
    ARRAY['Stand at high cable', 'Slight forward lean', 'Arms straight pull down to thighs', 'Squeeze lats', 'Control return'],
    ARRAY['Keep arms straight', 'Pull with lats', 'Full stretch at top', 'Squeeze at bottom', 'Minimal arm bend'],
    ARRAY['Bending elbows too much', 'Using momentum', 'Standing too upright', 'Not feeling lats'],
    ARRAY['Lats'], 'Intermediate', 3, 12, 60, true);

-- ========================================
-- SHOULDER EXERCISES (8 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Overhead Press', 'Shoulders', 'Barbell', 'compound', 'King of shoulder exercises',
    ARRAY['Bar at collarbone level', 'Grip just outside shoulders', 'Press straight up past face', 'Finish with bar over mid-foot', 'Lower back to collarbone'],
    ARRAY['Keep core tight', 'Push head through at top', 'Vertical bar path', 'Full lockout overhead', 'Controlled descent'],
    ARRAY['Pressing forward not vertical', 'Excessive back arch', 'Not locking out fully', 'Flaring elbows too much'],
    ARRAY['Front Delts', 'Side Delts', 'Triceps'], 'Intermediate', 4, 6, 180, true),

('Seated Dumbbell Press', 'Shoulders', 'Dumbbells', 'compound', 'Shoulder isolation with stability',
    ARRAY['Sit with back support', 'DBs at shoulder height', 'Press up and slightly together', 'Full lockout at top', 'Lower with control'],
    ARRAY['Keep core braced', 'Do not bang DBs together', 'Full range of motion', 'Controlled tempo', 'Equal strength both sides'],
    ARRAY['Arching back excessively', 'Partial range of motion', 'Using too much weight', 'Bouncing DBs together'],
    ARRAY['Front Delts', 'Side Delts'], 'Beginner', 3, 10, 120, true),

('Arnold Press', 'Shoulders', 'Dumbbells', 'compound', 'All three delt heads engaged',
    ARRAY['Start with DBs at face palms toward you', 'Press while rotating palms forward', 'Finish overhead palms forward', 'Reverse rotation on descent', 'Control throughout'],
    ARRAY['Smooth rotation throughout', 'Full range of motion', 'Control the movement', 'Equal tempo both directions', 'Feel all delt heads'],
    ARRAY['Rotating too early or late', 'Partial range of motion', 'Using momentum', 'Too much weight'],
    ARRAY['Front Delts', 'Side Delts'], 'Intermediate', 3, 10, 120, true),

('Lateral Raises', 'Side Delts', 'Dumbbells', 'isolation', 'Best side delt isolation',
    ARRAY['Stand with DBs at sides', 'Slight bend in elbows', 'Raise arms to shoulder height', 'Lead with elbows not hands', 'Control descent slowly'],
    ARRAY['Slight forward lean 10 degrees', 'Pour pitcher motion at top', 'Slow 2-3 second eccentric', 'Feel side delts burning', 'Stop at shoulder height'],
    ARRAY['Going too heavy', 'Using momentum or swinging', 'Not controlling descent', 'Raising too high above shoulders'],
    ARRAY['Side Delts'], 'Beginner', 3, 15, 60, true),

('Front Raises', 'Front Delts', 'Dumbbells', 'isolation', 'Front delt emphasis',
    ARRAY['Stand with DBs in front of thighs', 'Slight elbow bend maintained', 'Raise to shoulder height', 'Control descent', 'Alternate or together'],
    ARRAY['Keep core tight', 'Controlled movement no swinging', 'Stop at shoulder height', 'Squeeze at top', 'Slow negative'],
    ARRAY['Using momentum', 'Going too high above shoulders', 'Swinging weight up', 'Arching back'],
    ARRAY['Front Delts'], 'Beginner', 3, 12, 60, true),

('Rear Delt Fly', 'Rear Delts', 'Dumbbells', 'isolation', 'Rear delt isolation and shoulder balance',
    ARRAY['Bend at hips to 90 degrees', 'DBs hang below chest', 'Raise DBs out to sides', 'Squeeze rear delts at top', 'Lower with control'],
    ARRAY['Keep back flat parallel to ground', 'Lead with elbows', 'Feel rear delts working', 'Slight elbow bend', 'Controlled tempo'],
    ARRAY['Using momentum', 'Not bending over far enough', 'Too much weight', 'Pulling with arms not delts'],
    ARRAY['Rear Delts'], 'Beginner', 3, 15, 60, true),

('Cable Lateral Raises', 'Side Delts', 'Cable', 'isolation', 'Constant tension on side delts',
    ARRAY['Stand sideways to low cable', 'Grab handle with far hand', 'Raise arm to shoulder height', 'Control descent', 'Repeat other side'],
    ARRAY['Slight forward lean', 'Lead with elbow', 'Stop at shoulder height', 'Feel constant tension', 'Slow eccentric'],
    ARRAY['Using too much weight', 'Swinging or momentum', 'Not controlling descent', 'Going too high'],
    ARRAY['Side Delts'], 'Intermediate', 3, 15, 60, true),

('Upright Row', 'Shoulders', 'Barbell', 'compound', 'Traps and shoulder development',
    ARRAY['Stand with bar at thighs', 'Pull bar up along body to chest', 'Elbows high and wide', 'Lower with control'],
    ARRAY['Bar stays close to body', 'Pull to chest level', 'Lead with elbows', 'Control the weight'],
    ARRAY['Pulling too high causing impingement', 'Using too much weight', 'Momentum', 'Elbows not high enough'],
    ARRAY['Side Delts', 'Traps'], 'Intermediate', 3, 10, 90, true);

-- ========================================
-- BICEPS EXERCISES (8 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Barbell Curl', 'Biceps', 'Barbell', 'isolation', 'Classic mass builder for biceps',
    ARRAY['Stand with bar at thighs', 'Grip shoulder width supinated', 'Curl bar up to chest', 'Squeeze biceps at top', 'Lower with control'],
    ARRAY['Keep elbows pinned at sides', 'No swinging or momentum', 'Full range of motion', 'Squeeze hard at peak', 'Control the negative'],
    ARRAY['Swinging weight using momentum', 'Elbows moving forward', 'Partial range of motion', 'Going too heavy'],
    ARRAY['Biceps'], 'Beginner', 3, 10, 90, true),

('Dumbbell Curl', 'Biceps', 'Dumbbells', 'isolation', 'Unilateral bicep development',
    ARRAY['Stand with DBs at sides', 'Curl one or both arms up', 'Rotate to supinated at top', 'Squeeze biceps', 'Lower with control'],
    ARRAY['Keep elbows stationary', 'Full supination at top', 'Control the eccentric', 'No body swing', 'Equal strength both sides'],
    ARRAY['Swinging or cheating', 'Elbows moving forward', 'Not fully supinating', 'Rushing the reps'],
    ARRAY['Biceps'], 'Beginner', 3, 12, 90, true),

('Hammer Curl', 'Biceps', 'Dumbbells', 'isolation', 'Targets brachialis and brachioradialis',
    ARRAY['Stand with DBs at sides neutral grip', 'Curl up keeping thumbs up', 'Squeeze at top', 'Lower with control', 'Alternate or together'],
    ARRAY['Maintain neutral grip throughout', 'Elbows stay pinned', 'Control the weight', 'No momentum', 'Feel forearms working'],
    ARRAY['Rotating wrists during curl', 'Using body English', 'Partial range', 'Going too fast'],
    ARRAY['Biceps', 'Brachialis', 'Forearms'], 'Beginner', 3, 12, 90, true),

('Preacher Curl', 'Biceps', 'Barbell', 'isolation', 'Strict bicep isolation with no cheating',
    ARRAY['Sit at preacher bench', 'Arms extended over pad', 'Curl bar up to chin', 'Squeeze at peak', 'Lower to full extension'],
    ARRAY['Upper arms flat on pad', 'No lifting elbows', 'Full range of motion', 'Controlled tempo', 'Squeeze hard at top'],
    ARRAY['Lifting elbows off pad', 'Not going to full extension', 'Using momentum', 'Too much weight'],
    ARRAY['Biceps'], 'Intermediate', 3, 10, 90, true),

('Incline Dumbbell Curl', 'Biceps', 'Dumbbells', 'isolation', 'Maximum bicep stretch at bottom',
    ARRAY['Set bench to 45-60 degrees', 'Lie back with arms hanging', 'Curl DBs up with supination', 'Squeeze at top', 'Lower to full stretch'],
    ARRAY['Let arms hang fully at start', 'Feel deep stretch at bottom', 'Curl with control', 'Full supination at top', 'No swinging'],
    ARRAY['Not getting full stretch', 'Swinging weights', 'Bench too upright or flat', 'Rushing the movement'],
    ARRAY['Biceps'], 'Intermediate', 3, 12, 90, true),

('Cable Curl', 'Biceps', 'Cable', 'isolation', 'Constant tension on biceps',
    ARRAY['Stand at low cable', 'Grip bar or handles', 'Curl up to chin', 'Squeeze biceps', 'Control return'],
    ARRAY['Elbows pinned at sides', 'Constant tension throughout', 'Full range of motion', 'Squeeze at peak', 'Slow eccentric'],
    ARRAY['Letting elbows drift forward', 'Using momentum', 'Partial reps', 'Not controlling descent'],
    ARRAY['Biceps'], 'Beginner', 3, 15, 60, true),

('Concentration Curl', 'Biceps', 'Dumbbells', 'isolation', 'Peak contraction and mind-muscle connection',
    ARRAY['Sit with elbow braced on inner thigh', 'DB hangs at full extension', 'Curl up to chest', 'Squeeze hard at top', 'Lower slowly'],
    ARRAY['Elbow stays fixed on thigh', 'Focus on bicep contraction', 'Full supination at top', 'Slow controlled reps', 'Feel the burn'],
    ARRAY['Moving elbow during curl', 'Using momentum', 'Not getting full contraction', 'Going too fast'],
    ARRAY['Biceps'], 'Beginner', 3, 12, 60, true),

('Spider Curl', 'Biceps', 'Barbell', 'isolation', 'Eliminates momentum completely',
    ARRAY['Lie face down on incline bench', 'Arms hanging vertical', 'Curl bar up', 'Squeeze biceps at top', 'Lower to full extension'],
    ARRAY['Upper arms stay vertical', 'No body movement possible', 'Full range of motion', 'Squeeze hard', 'Control the negative'],
    ARRAY['Not going full range', 'Moving too fast', 'Using too much weight', 'Partial reps'],
    ARRAY['Biceps'], 'Advanced', 3, 10, 90, true);

-- ========================================
-- TRICEPS EXERCISES (8 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Close Grip Bench Press', 'Triceps', 'Barbell', 'compound', 'Best compound triceps mass builder',
    ARRAY['Lie on bench grip at shoulder width', 'Lower bar to lower chest', 'Keep elbows tucked', 'Press up with triceps', 'Full lockout at top'],
    ARRAY['Tuck elbows close to body', 'Bar touches lower chest', 'Squeeze triceps at top', 'Controlled descent', 'Keep wrists straight'],
    ARRAY['Grip too narrow straining wrists', 'Flaring elbows out', 'Bouncing off chest', 'Partial range'],
    ARRAY['Triceps', 'Chest'], 'Intermediate', 3, 8, 120, true),

('Tricep Dips', 'Triceps', 'Bodyweight', 'compound', 'Bodyweight triceps mass builder',
    ARRAY['Grip parallel bars', 'Keep body upright', 'Lower until upper arms parallel', 'Press back up', 'Full extension at top'],
    ARRAY['Stay upright not leaning forward', 'Elbows back not flared', 'Control the descent', 'Full lockout', 'Engage triceps'],
    ARRAY['Leaning forward engages chest', 'Going too deep', 'Flaring elbows out', 'Using momentum'],
    ARRAY['Triceps'], 'Advanced', 3, 10, 120, true),

('Overhead Tricep Extension', 'Triceps', 'Dumbbells', 'isolation', 'Stretches long head of triceps',
    ARRAY['Hold DB overhead with both hands', 'Lower behind head by bending elbows', 'Feel stretch in triceps', 'Extend back up', 'Keep elbows pointing forward'],
    ARRAY['Keep elbows in do not flare', 'Full stretch at bottom', 'Control the weight', 'Squeeze triceps at top', 'Stable core'],
    ARRAY['Letting elbows flare out', 'Not getting full stretch', 'Arching back', 'Using too much weight'],
    ARRAY['Triceps Long Head'], 'Beginner', 3, 12, 90, true),

('Skull Crushers', 'Triceps', 'Barbell', 'isolation', 'Triceps mass and strength',
    ARRAY['Lie flat holding bar above chest', 'Lower bar to forehead by bending elbows', 'Keep upper arms vertical', 'Extend back up', 'Squeeze triceps'],
    ARRAY['Upper arms stay vertical', 'Control the eccentric', 'Full range of motion', 'Squeeze at lockout', 'Elbows in'],
    ARRAY['Letting elbows flare wide', 'Upper arms moving during rep', 'Not controlling descent', 'Partial range'],
    ARRAY['Triceps'], 'Intermediate', 3, 10, 90, true),

('Tricep Pushdown', 'Triceps', 'Cable', 'isolation', 'Triceps isolation with constant tension',
    ARRAY['Stand at high cable', 'Grip bar or rope', 'Push down to full extension', 'Squeeze triceps', 'Control return'],
    ARRAY['Keep elbows pinned at sides', 'Full lockout at bottom', 'Control the return', 'No body movement', 'Constant tension'],
    ARRAY['Letting elbows drift forward', 'Leaning over cable', 'Using momentum', 'Not fully extending'],
    ARRAY['Triceps'], 'Beginner', 3, 15, 60, true),

('Overhead Cable Extension', 'Triceps', 'Cable', 'isolation', 'Targets long head with cable',
    ARRAY['Face away from high cable', 'Hold rope overhead', 'Extend arms forward', 'Squeeze triceps', 'Control return'],
    ARRAY['Elbows stay high and in', 'Full extension forward', 'Feel stretch at start', 'Squeeze at finish', 'Stable stance'],
    ARRAY['Elbows dropping or flaring', 'Not getting full stretch', 'Using momentum', 'Poor stability'],
    ARRAY['Triceps Long Head'], 'Intermediate', 3, 12, 60, true),

('Diamond Push Ups', 'Triceps', 'Bodyweight', 'compound', 'Bodyweight triceps isolation',
    ARRAY['Hands in diamond shape under chest', 'Body in straight line', 'Lower chest to hands', 'Push back up', 'Full extension'],
    ARRAY['Keep elbows close to body', 'Core tight throughout', 'Full range of motion', 'Control the descent', 'Squeeze triceps'],
    ARRAY['Elbows flaring out', 'Sagging hips', 'Partial range', 'Going too fast'],
    ARRAY['Triceps'], 'Intermediate', 3, 12, 60, true),

('Tricep Kickbacks', 'Triceps', 'Dumbbells', 'isolation', 'Peak contraction for triceps',
    ARRAY['Hinge forward with DB in hand', 'Upper arm parallel to floor', 'Extend arm back fully', 'Squeeze triceps hard', 'Control return'],
    ARRAY['Upper arm stays stationary', 'Full extension at back', 'Feel peak contraction', 'Control the weight', 'No swinging'],
    ARRAY['Moving upper arm during rep', 'Not fully extending', 'Using too much weight', 'Going too fast'],
    ARRAY['Triceps'], 'Beginner', 3, 15, 60, true);

-- ========================================
-- QUADRICEPS EXERCISES (8 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Barbell Squat', 'Quads', 'Barbell', 'compound', 'King of leg exercises',
    ARRAY['Bar on upper back', 'Feet shoulder width', 'Descend by breaking at hips and knees', 'Go to parallel or below', 'Drive up through heels'],
    ARRAY['Keep chest up', 'Knees track over toes', 'Full depth', 'Drive through whole foot', 'Neutral spine'],
    ARRAY['Knees caving inward', 'Rounding lower back', 'Not hitting depth', 'Coming forward on toes', 'Looking down'],
    ARRAY['Quads', 'Glutes', 'Hamstrings'], 'Advanced', 4, 6, 180, true),

('Front Squat', 'Quads', 'Barbell', 'compound', 'Quad dominant squat variation',
    ARRAY['Bar on front of shoulders', 'Elbows high', 'Descend keeping upright', 'Go to parallel or below', 'Drive straight up'],
    ARRAY['Stay more upright than back squat', 'Elbows high throughout', 'Core braced hard', 'Knees forward', 'Full depth'],
    ARRAY['Elbows dropping', 'Leaning forward', 'Not hitting depth', 'Poor rack position', 'Losing balance'],
    ARRAY['Quads', 'Core'], 'Advanced', 4, 6, 150, true),

('Leg Press', 'Quads', 'Machine', 'compound', 'Quad mass without spinal load',
    ARRAY['Feet shoulder width on platform', 'Lower weight to 90 degrees', 'Press through heels', 'Stop short of lockout', 'Control the descent'],
    ARRAY['Full range to 90 degrees', 'Do not lock knees at top', 'Push through whole foot', 'Control the weight', 'Keep lower back down'],
    ARRAY['Locking knees at top', 'Letting lower back lift', 'Partial range of motion', 'Feet positioned wrong'],
    ARRAY['Quads', 'Glutes'], 'Beginner', 3, 12, 120, true),

('Bulgarian Split Squat', 'Quads', 'Dumbbells', 'compound', 'Unilateral quad and glute builder',
    ARRAY['Rear foot elevated on bench', 'Front foot 2-3 feet forward', 'Descend to 90 degrees', 'Drive through front heel', 'Maintain upright torso'],
    ARRAY['Keep torso upright', 'Front knee tracks over toes', 'Go deep', 'Drive through heel', 'Balance and control'],
    ARRAY['Leaning too far forward', 'Front foot too close', 'Not going deep enough', 'Losing balance'],
    ARRAY['Quads', 'Glutes'], 'Intermediate', 3, 10, 90, true),

('Walking Lunges', 'Quads', 'Dumbbells', 'compound', 'Dynamic quad and glute development',
    ARRAY['Step forward into lunge', 'Both knees to 90 degrees', 'Push off back foot', 'Step through to next lunge', 'Alternate legs'],
    ARRAY['Upright torso', 'Long stride length', 'Both knees 90 degrees', 'Controlled movement', 'Balance each step'],
    ARRAY['Stride too short', 'Leaning forward', 'Knee going past toes excessively', 'Losing balance'],
    ARRAY['Quads', 'Glutes'], 'Beginner', 3, 12, 90, true),

('Leg Extension', 'Quads', 'Machine', 'isolation', 'Quad isolation and definition',
    ARRAY['Sit with back against pad', 'Feet under bottom pad', 'Extend legs to straight', 'Squeeze quads hard', 'Lower with control'],
    ARRAY['Full extension at top', 'Squeeze quads for 1 second', 'Control the negative', 'Keep back against pad', 'Full range'],
    ARRAY['Partial range of motion', 'Using momentum', 'Not squeezing at top', 'Going too heavy'],
    ARRAY['Quads'], 'Beginner', 3, 15, 60, true),

('Goblet Squat', 'Quads', 'Dumbbells', 'compound', 'Beginner friendly quad developer',
    ARRAY['Hold DB at chest', 'Feet shoulder width', 'Descend to parallel or below', 'Elbows inside knees', 'Drive up through heels'],
    ARRAY['Stay upright', 'Elbows push knees out', 'Full depth', 'Chest up', 'Core tight'],
    ARRAY['Not going deep enough', 'Leaning forward', 'Heels lifting', 'Knees caving'],
    ARRAY['Quads', 'Glutes'], 'Beginner', 3, 12, 90, true),

('Hack Squat', 'Quads', 'Machine', 'compound', 'Quad focused machine squat',
    ARRAY['Back against pad feet forward on platform', 'Release safety', 'Lower to 90 degrees or below', 'Press through heels', 'Control ascent'],
    ARRAY['Full range of motion', 'Knees track over toes', 'Keep back against pad', 'Control the weight', 'Do not lock knees'],
    ARRAY['Partial range', 'Locking knees', 'Feet positioned wrong', 'Going too fast'],
    ARRAY['Quads'], 'Intermediate', 3, 12, 120, true);

-- ========================================
-- HAMSTRINGS & GLUTES EXERCISES (8 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Leg Curl', 'Hamstrings', 'Machine', 'isolation', 'Direct hamstring isolation',
    ARRAY['Lie face down on machine', 'Pad on lower calves', 'Curl heels toward glutes', 'Squeeze hamstrings', 'Lower with control'],
    ARRAY['Full range of motion', 'Squeeze at peak', 'Control the descent', 'Keep hips down', 'No swinging'],
    ARRAY['Lifting hips off pad', 'Using momentum', 'Partial range', 'Going too fast'],
    ARRAY['Hamstrings'], 'Beginner', 3, 12, 90, true),

('Hip Thrust', 'Glutes', 'Barbell', 'compound', 'Best glute mass builder',
    ARRAY['Upper back on bench', 'Bar over hips', 'Feet flat shoulder width', 'Thrust hips up', 'Squeeze glutes at top'],
    ARRAY['Full hip extension', 'Squeeze glutes hard at top', 'Chin tucked', 'Push through heels', 'Control descent'],
    ARRAY['Not fully extending hips', 'Hyperextending lower back', 'Not squeezing at top', 'Poor bar position'],
    ARRAY['Glutes', 'Hamstrings'], 'Intermediate', 3, 10, 120, true),

('Stiff Leg Deadlift', 'Hamstrings', 'Barbell', 'compound', 'Maximum hamstring stretch',
    ARRAY['Stand with bar at thighs', 'Legs nearly straight slight bend', 'Hip hinge lowering bar', 'Feel hamstring stretch', 'Drive hips forward'],
    ARRAY['Minimal knee bend', 'Keep back flat', 'Feel it in hamstrings', 'Bar close to body', 'Deep stretch'],
    ARRAY['Rounding back', 'Bending knees too much', 'Not feeling hamstrings', 'Bar drifting forward'],
    ARRAY['Hamstrings', 'Lower Back'], 'Intermediate', 3, 10, 120, true),

('Glute Bridge', 'Glutes', 'Bodyweight', 'isolation', 'Glute activation and endurance',
    ARRAY['Lie on back knees bent', 'Feet flat near glutes', 'Thrust hips up', 'Squeeze glutes hard', 'Lower to just above ground'],
    ARRAY['Full hip extension', 'Squeeze glutes 1-2 seconds', 'Push through heels', 'Chin tucked', 'Controlled movement'],
    ARRAY['Not fully extending', 'Arching lower back', 'Not squeezing glutes', 'Going too fast'],
    ARRAY['Glutes'], 'Beginner', 3, 20, 60, true),

('Nordic Hamstring Curl', 'Hamstrings', 'Bodyweight', 'compound', 'Advanced eccentric hamstring strength',
    ARRAY['Kneel with ankles secured', 'Lower body forward slowly', 'Control descent with hamstrings', 'Catch yourself at bottom', 'Push back up'],
    ARRAY['Slow controlled descent', 'Keep body straight', 'Use hamstrings to resist', 'Partner or band assistance', 'Very difficult'],
    ARRAY['Dropping too fast', 'Bending at hips', 'Not using hamstrings', 'Poor setup'],
    ARRAY['Hamstrings'], 'Advanced', 3, 6, 150, true),

('Cable Pull Through', 'Glutes', 'Cable', 'compound', 'Hip hinge pattern for glutes',
    ARRAY['Face away from low cable', 'Hold rope between legs', 'Hip hinge forward', 'Thrust hips forward', 'Squeeze glutes'],
    ARRAY['Hinge at hips not squat', 'Feel stretch in glutes', 'Explosive hip extension', 'Squeeze hard at top', 'Neutral spine'],
    ARRAY['Squatting instead of hinging', 'Not feeling glutes', 'Rounding back', 'Partial range'],
    ARRAY['Glutes', 'Hamstrings'], 'Beginner', 3, 15, 60, true),

('Single Leg Romanian Deadlift', 'Hamstrings', 'Dumbbells', 'compound', 'Unilateral hamstring and balance',
    ARRAY['Hold DB in one hand', 'Stand on opposite leg', 'Hip hinge lowering DB', 'Free leg extends back', 'Feel hamstring stretch'],
    ARRAY['Keep back flat', 'Balance and control', 'Feel working hamstring', 'Full range', 'Squeeze glute at top'],
    ARRAY['Losing balance', 'Rounding back', 'Not feeling hamstring', 'Opening hips'],
    ARRAY['Hamstrings', 'Glutes', 'Core'], 'Advanced', 3, 10, 90, true),

('Good Morning', 'Hamstrings', 'Barbell', 'compound', 'Hamstring and lower back strength',
    ARRAY['Bar on upper back', 'Slight knee bend', 'Hip hinge forward', 'Torso to parallel', 'Drive hips forward to stand'],
    ARRAY['Keep back flat', 'Hinge at hips', 'Feel hamstrings stretch', 'Control the movement', 'Core braced'],
    ARRAY['Rounding lower back', 'Bending knees too much', 'Going too deep', 'Using too much weight'],
    ARRAY['Hamstrings', 'Lower Back', 'Glutes'], 'Advanced', 3, 10, 120, true);

-- ========================================
-- CALVES EXERCISES (3 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Standing Calf Raise', 'Calves', 'Machine', 'isolation', 'Gastrocnemius development',
    ARRAY['Stand on platform toes on edge', 'Shoulders under pads', 'Lower heels below platform', 'Rise up on toes as high as possible', 'Squeeze calves at top'],
    ARRAY['Full stretch at bottom', 'Maximum height at top', 'Squeeze for 1 second', 'Control the movement', 'No bouncing'],
    ARRAY['Bouncing out of bottom', 'Not getting full stretch', 'Partial range', 'Going too fast'],
    ARRAY['Calves Gastrocnemius'], 'Beginner', 4, 15, 60, true),

('Seated Calf Raise', 'Calves', 'Machine', 'isolation', 'Soleus muscle development',
    ARRAY['Sit with toes on platform', 'Pad over knees', 'Lower heels below platform', 'Rise up on toes', 'Squeeze calves'],
    ARRAY['Full range of motion', 'Stretch at bottom', 'Squeeze at top', 'Controlled tempo', 'Feel the burn'],
    ARRAY['Partial range', 'Bouncing', 'Not pausing at top', 'Going too heavy'],
    ARRAY['Calves Soleus'], 'Beginner', 4, 20, 60, true),

('Calf Press on Leg Press', 'Calves', 'Machine', 'isolation', 'Heavy calf training',
    ARRAY['Sit in leg press', 'Balls of feet on bottom of platform', 'Lower heels toward you', 'Press through toes', 'Extend fully'],
    ARRAY['Full range of motion', 'Maximum stretch at bottom', 'Full extension at top', 'Control the weight', 'No bouncing'],
    ARRAY['Bouncing out of stretch', 'Not fully extending', 'Bending knees', 'Partial reps'],
    ARRAY['Calves'], 'Beginner', 4, 15, 60, true);

-- ========================================
-- CORE / ABS EXERCISES (10 exercises)
-- ========================================

INSERT INTO exercises (name, muscle_group, equipment, exercise_type, description, instructions, form_cues, common_mistakes, targeted_heads, difficulty_level, default_sets, default_reps, default_rest_time, is_system) VALUES
('Plank', 'Core', 'Bodyweight', 'isolation', 'Core stability and endurance',
    ARRAY['Forearms on ground elbows under shoulders', 'Body in straight line', 'Hold position', 'Engage entire core', 'Breathe steadily'],
    ARRAY['Straight line head to heels', 'Squeeze glutes', 'No sagging hips', 'Brace core hard', 'Hold as long as possible'],
    ARRAY['Hips sagging', 'Hips too high', 'Not engaging core', 'Holding breath'],
    ARRAY['Abs', 'Core Stabilizers'], 'Beginner', 3, 60, 60, true),

('Crunches', 'Abs', 'Bodyweight', 'isolation', 'Upper ab development',
    ARRAY['Lie on back knees bent', 'Hands behind head or crossed', 'Curl shoulders off ground', 'Squeeze abs', 'Lower with control'],
    ARRAY['Curl up using abs', 'Squeeze at top', 'Do not pull neck', 'Control the descent', 'Feel abs working'],
    ARRAY['Pulling on neck', 'Using momentum', 'Not squeezing abs', 'Partial range'],
    ARRAY['Upper Abs'], 'Beginner', 3, 20, 60, true),

('Leg Raises', 'Abs', 'Bodyweight', 'isolation', 'Lower ab emphasis',
    ARRAY['Lie flat hands under glutes', 'Legs straight or slightly bent', 'Raise legs to vertical', 'Lower with control', 'Stop before touching ground'],
    ARRAY['Keep lower back down', 'Control the descent', 'Raise to vertical', 'Engage lower abs', 'No swinging'],
    ARRAY['Lower back arching', 'Using momentum', 'Partial range', 'Going too fast'],
    ARRAY['Lower Abs', 'Hip Flexors'], 'Intermediate', 3, 15, 60, true),

('Russian Twists', 'Obliques', 'Bodyweight', 'isolation', 'Oblique development and rotation',
    ARRAY['Sit with knees bent feet off ground', 'Lean back slightly', 'Rotate torso side to side', 'Touch ground each side', 'Control the movement'],
    ARRAY['Keep feet elevated', 'Rotate from core', 'Touch ground each side', 'Controlled twisting', 'Balance maintained'],
    ARRAY['Feet on ground', 'Going too fast', 'Not rotating fully', 'Poor balance'],
    ARRAY['Obliques', 'Core'], 'Beginner', 3, 30, 60, true),

('Hanging Leg Raises', 'Abs', 'Bodyweight', 'compound', 'Advanced lower ab developer',
    ARRAY['Hang from pull up bar', 'Keep legs together', 'Raise knees to chest', 'Control the descent', 'Minimize swinging'],
    ARRAY['Raise knees high', 'Control the movement', 'No swinging', 'Squeeze abs at top', 'Full range'],
    ARRAY['Swinging excessively', 'Not raising high enough', 'Using momentum', 'Grip failing first'],
    ARRAY['Lower Abs', 'Hip Flexors'], 'Advanced', 3, 12, 90, true),

('Cable Crunch', 'Abs', 'Cable', 'isolation', 'Weighted ab development',
    ARRAY['Kneel at high cable', 'Hold rope behind head', 'Crunch down bringing elbows to knees', 'Squeeze abs', 'Control return'],
    ARRAY['Curl spine crunch down', 'Squeeze abs at bottom', 'Hips stationary', 'Feel abs working', 'Control the weight'],
    ARRAY['Using hips not abs', 'Going too heavy', 'Not crunching enough', 'Pulling with arms'],
    ARRAY['Upper Abs'], 'Intermediate', 3, 15, 60, true),

('Dead Bug', 'Core', 'Bodyweight', 'isolation', 'Core stability and coordination',
    ARRAY['Lie on back arms up legs up', 'Lower opposite arm and leg', 'Return to start', 'Alternate sides', 'Keep lower back down'],
    ARRAY['Lower back stays flat', 'Controlled movement', 'Opposite limbs move', 'Core stays braced', 'Breathe steadily'],
    ARRAY['Lower back arching', 'Moving too fast', 'Not keeping core tight', 'Improper breathing'],
    ARRAY['Core Stabilizers'], 'Beginner', 3, 20, 60, true),

('Bicycle Crunches', 'Obliques', 'Bodyweight', 'isolation', 'Obliques and ab combination',
    ARRAY['Lie on back hands behind head', 'Bring opposite elbow to opposite knee', 'Alternate sides in cycling motion', 'Control the movement', 'Squeeze obliques'],
    ARRAY['Rotate torso fully', 'Control the movement', 'Touch elbow to knee', 'Full range', 'Feel obliques'],
    ARRAY['Going too fast', 'Not rotating enough', 'Pulling on neck', 'No control'],
    ARRAY['Obliques', 'Abs'], 'Beginner', 3, 30, 60, true),

('Pallof Press', 'Core', 'Cable', 'isolation', 'Anti-rotation core strength',
    ARRAY['Stand sideways to cable at chest height', 'Hold handle at chest', 'Press straight out', 'Resist rotation', 'Return to chest'],
    ARRAY['Resist cable pulling you', 'Core braced hard', 'No rotation of torso', 'Controlled movement', 'Feel core working'],
    ARRAY['Allowing rotation', 'Not bracing core', 'Standing too close or far', 'Arms doing work'],
    ARRAY['Core Stabilizers', 'Obliques'], 'Intermediate', 3, 12, 60, true),

('Mountain Climbers', 'Core', 'Bodyweight', 'compound', 'Dynamic core and cardio',
    ARRAY['Start in plank position', 'Drive one knee toward chest', 'Quickly switch legs', 'Maintain plank position', 'Move at steady pace'],
    ARRAY['Keep hips level', 'Core stays tight', 'Controlled leg movement', 'Steady breathing', 'No sagging'],
    ARRAY['Hips bouncing', 'Going too fast losing form', 'Not bringing knees far enough', 'Poor plank position'],
    ARRAY['Core', 'Hip Flexors'], 'Beginner', 3, 30, 60, true);

-- ========================================
-- VERIFICATION
-- ========================================

SELECT COUNT(*) as total_exercises FROM exercises WHERE is_system = true;
SELECT muscle_group, COUNT(*) as count FROM exercises WHERE is_system = true GROUP BY muscle_group ORDER BY count DESC;

-- Expected counts:
-- Chest: 13
-- Back: 12
-- Shoulders: 8
-- Biceps: 8
-- Triceps: 8
-- Quads: 8
-- Hamstrings/Glutes: 8
-- Calves: 3
-- Core/Abs: 10
-- TOTAL: 78+ exercises (not counting duplicates across muscle groups like Romanian Deadlift)
