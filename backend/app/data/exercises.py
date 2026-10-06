"""Starter exercise seed database (~40 common exercises across muscle groups)."""

EXERCISES_DATABASE = [
    # Chest
    {"name": "Barbell Bench Press", "category": "strength", "muscle_groups": ["chest", "triceps", "shoulders"], "equipment": ["barbell", "bench"], "instructions": "Lie flat on bench, lower bar to mid-chest, press up firmly."},
    {"name": "Incline Dumbbell Press", "category": "strength", "muscle_groups": ["chest", "shoulders", "triceps"], "equipment": ["dumbbells", "incline bench"], "instructions": "Press dumbbells vertically over upper chest on a 30-45 degree incline."},
    {"name": "Dumbbell Flyes", "category": "strength", "muscle_groups": ["chest"], "equipment": ["dumbbells", "bench"], "instructions": "Lie on bench, hug wide arc with slight elbow bend, squeeze chest at top."},
    {"name": "Push-Up", "category": "bodyweight", "muscle_groups": ["chest", "triceps", "core"], "equipment": ["bodyweight"], "instructions": "Keep rigid plank posture, lower chest to floor and push back up."},
    {"name": "Chest Dip", "category": "bodyweight", "muscle_groups": ["chest", "triceps"], "equipment": ["dip bars"], "instructions": "Lean slightly forward on dip bars, lower until upper arms parallel to floor."},

    # Back
    {"name": "Pull-Up", "category": "bodyweight", "muscle_groups": ["back", "biceps", "forearms"], "equipment": ["pull-up bar"], "instructions": "Overhand grip slightly wider than shoulders, pull chest to bar."},
    {"name": "Chin-Up", "category": "bodyweight", "muscle_groups": ["biceps", "back"], "equipment": ["pull-up bar"], "instructions": "Underhand grip, pull chin over bar engaging biceps and lats."},
    {"name": "Barbell Bent-Over Row", "category": "strength", "muscle_groups": ["back", "biceps", "hamstrings"], "equipment": ["barbell"], "instructions": "Hinge at hips to 45 deg, pull bar to lower ribcage."},
    {"name": "Single-Arm Dumbbell Row", "category": "strength", "muscle_groups": ["back", "biceps"], "equipment": ["dumbbell", "bench"], "instructions": "Support knee and hand on bench, pull dumbbell to hip socket."},
    {"name": "Lat Pulldown", "category": "strength", "muscle_groups": ["back", "biceps"], "equipment": ["cable machine"], "instructions": "Pull wide bar smoothly down to upper chest, squeeze lats."},
    {"name": "Seated Cable Row", "category": "strength", "muscle_groups": ["back", "biceps"], "equipment": ["cable machine"], "instructions": "Keep torso upright, row handle toward lower abdomen."},

    # Legs & Lower Body
    {"name": "Barbell Back Squat", "category": "strength", "muscle_groups": ["quadriceps", "glutes", "core"], "equipment": ["barbell", "squat rack"], "instructions": "Bar across upper back, squat down until thighs parallel or below, drive up through heels."},
    {"name": "Barbell Deadlift", "category": "strength", "muscle_groups": ["hamstrings", "glutes", "lower back", "core"], "equipment": ["barbell"], "instructions": "Hinge hips back with flat back, lift bar keeping close to shins and thighs."},
    {"name": "Goblet Squat", "category": "strength", "muscle_groups": ["quadriceps", "glutes", "core"], "equipment": ["dumbbell"], "instructions": "Hold dumbbell vertically against chest, squat deep keeping spine tall."},
    {"name": "Romanian Deadlift", "category": "strength", "muscle_groups": ["hamstrings", "glutes"], "equipment": ["barbell"], "instructions": "Hinge hips back with soft knees, lower bar to mid-shin until hamstring stretch."},
    {"name": "Walking Lunges", "category": "strength", "muscle_groups": ["quadriceps", "glutes", "hamstrings"], "equipment": ["dumbbells"], "instructions": "Step forward into 90-degree lunges alternating legs smoothly."},
    {"name": "Leg Press", "category": "strength", "muscle_groups": ["quadriceps", "glutes"], "equipment": ["leg press machine"], "instructions": "Lower platform until knees at 90 degrees, press up without locking knees."},
    {"name": "Calf Raises", "category": "strength", "muscle_groups": ["calves"], "equipment": ["bodyweight", "dumbbells"], "instructions": "Rise onto toes slowly, pause at top, stretch down fully."},

    # Shoulders
    {"name": "Overhead Barbell Press", "category": "strength", "muscle_groups": ["shoulders", "triceps", "core"], "equipment": ["barbell"], "instructions": "Press barbell overhead from upper chest to full lockout."},
    {"name": "Seated Dumbbell Shoulder Press", "category": "strength", "muscle_groups": ["shoulders", "triceps"], "equipment": ["dumbbells", "bench"], "instructions": "Press dumbbells overhead from ear height until arms extended."},
    {"name": "Dumbbell Lateral Raise", "category": "strength", "muscle_groups": ["shoulders"], "equipment": ["dumbbells"], "instructions": "Raise arms out to sides until parallel to floor with slight elbow bend."},
    {"name": "Face Pulls", "category": "strength", "muscle_groups": ["rear delts", "upper back"], "equipment": ["cable machine", "rope attachment"], "instructions": "Pull rope toward face separating handles toward ears."},

    # Arms
    {"name": "Barbell Bicep Curl", "category": "strength", "muscle_groups": ["biceps"], "equipment": ["barbell"], "instructions": "Keep elbows tucked, curl bar toward shoulders."},
    {"name": "Dumbbell Hammer Curl", "category": "strength", "muscle_groups": ["biceps", "forearms"], "equipment": ["dumbbells"], "instructions": "Neutral grip (palms facing each other), curl dumbbells vertically."},
    {"name": "Tricep Rope Pushdown", "category": "strength", "muscle_groups": ["triceps"], "equipment": ["cable machine", "rope attachment"], "instructions": "Extend arms down separating rope ends at bottom."},
    {"name": "Skullcrushers (Lying Tricep Extension)", "category": "strength", "muscle_groups": ["triceps"], "equipment": ["EZ bar", "bench"], "instructions": "Lie flat, hinge at elbows to lower bar toward forehead, press back up."},

    # Core
    {"name": "Plank", "category": "bodyweight", "muscle_groups": ["core"], "equipment": ["bodyweight"], "instructions": "Hold straight line from head to heels on forearms and toes."},
    {"name": "Hanging Leg Raise", "category": "bodyweight", "muscle_groups": ["core", "hip flexors"], "equipment": ["pull-up bar"], "instructions": "Hang from bar, raise straight or bent legs to parallel."},
    {"name": "Ab Wheel Rollout", "category": "bodyweight", "muscle_groups": ["core", "lats"], "equipment": ["ab wheel"], "instructions": "Kneel and roll wheel forward maintaining hollow body posture."},
    {"name": "Russian Twists", "category": "bodyweight", "muscle_groups": ["core", "obliques"], "equipment": ["bodyweight", "weight plate"], "instructions": "Seated, lean back 45 degrees, rotate torso side to side."},

    # Cardio & HIIT
    {"name": "Treadmill Running", "category": "cardio", "muscle_groups": ["legs", "cardiovascular"], "equipment": ["treadmill"], "instructions": "Run at steady or interval pace focusing on posture."},
    {"name": "Stationary Cycling", "category": "cardio", "muscle_groups": ["legs", "cardiovascular"], "equipment": ["exercise bike"], "instructions": "Pedal smoothly at target cadence and resistance."},
    {"name": "Rowing Machine", "category": "cardio", "muscle_groups": ["back", "legs", "cardiovascular"], "equipment": ["rowing machine"], "instructions": "Drive with legs, lean back, pull handle to lower ribs."},
    {"name": "Jump Rope", "category": "cardio", "muscle_groups": ["calves", "cardiovascular"], "equipment": ["jump rope"], "instructions": "Jump light on balls of feet with quick wrist rotations."},
    {"name": "Burpees", "category": "cardio", "muscle_groups": ["full body", "cardiovascular"], "equipment": ["bodyweight"], "instructions": "Drop to chest on floor, spring to feet, and jump overhead."},

    # Flexibility & Mobility
    {"name": "Hamstring Stretch", "category": "flexibility", "muscle_groups": ["hamstrings"], "equipment": ["bodyweight"], "instructions": "Extend one leg, hinge forward at hips until stretch in hamstrings."},
    {"name": "World's Greatest Stretch", "category": "flexibility", "muscle_groups": ["hip flexors", "thoracic spine", "glutes"], "equipment": ["bodyweight"], "instructions": "Deep lunge with hand inside front foot, rotate upper arm to ceiling."},
    {"name": "Foam Rolling Quad & IT Band", "category": "flexibility", "muscle_groups": ["quadriceps"], "equipment": ["foam roller"], "instructions": "Roll slowly along front and side of thigh over tight areas."},
]
