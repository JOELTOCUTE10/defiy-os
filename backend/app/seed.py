"""Demo seed: demo@defiy.os / demo1234 — CLEARLY LABELED demo data so the UI can be
explored. Real accounts start empty. Idempotent: safe to run multiple times."""
from datetime import date, datetime, timedelta
import random

from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401
from app.models.core import User, Profile, Conversation, Message
from app.models.goals import Goal
from app.models.fitness import Workout, WorkoutExercise, WorkoutSet
from app.models.nutrition import Meal, MealItem, HydrationEntry
from app.models.wellness import SleepEntry, Habit, HabitCompletion, MoodEntry
from app.models.school import Assignment, StudySession
from app.models.finance import FinanceEntry, SavingsGoal
from app.models.reminders import Reminder
from app.security import hash_password

random.seed(42)  # stable demo data


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.main import _seed_catalogs
        _seed_catalogs()

        if db.query(User).filter(User.email == "demo@defiy.os").first():
            print("Demo account already exists — nothing to do.")
            return

        print("Seeding DEMO account (demo@defiy.os / demo1234)...")
        user = User(email="demo@defiy.os", password_hash=hash_password("demo1234"))
        db.add(user)
        db.commit()
        db.refresh(user)

        db.add(Profile(
            user_id=user.id, name="Jordan", age_range="18-24",
            main_goals=["fitness", "school", "money"],
            fitness_experience="intermediate", equipment=["dumbbells", "pull-up bar"],
            typical_schedule="Classes until 3 PM, evenings free",
            school_work_info="Full-time student", sleep_preferences="Night owl",
            onboarded=True, units="metric"))
        db.commit()

        today = date.today()

        # Goals
        g1 = Goal(user_id=user.id, name="Do 10 pull-ups", category="fitness",
                  target_value=10, current_value=6, unit="reps",
                  deadline=datetime.now() + timedelta(days=45))
        g2 = Goal(user_id=user.id, name="Save $500", category="money",
                  target_value=500, current_value=175, unit="USD",
                  deadline=datetime.now() + timedelta(days=60))
        g3 = Goal(user_id=user.id, name="Study 30 min daily", category="school",
                  target_value=30, current_value=18, unit="days")
        db.add_all([g1, g2, g3])
        db.commit()

        # Workouts: 3/week for the last 2 weeks
        for week in range(2):
            for dow in (1, 3, 5):
                d = datetime.combine(today - timedelta(days=7 * (1 - week) - today.weekday() + dow
                                                        if today.weekday() >= dow else dow - today.weekday() + 7 * (1 - week)),
                                     datetime.min.time()) + timedelta(hours=18)
                if d > datetime.now():
                    continue
                w = Workout(user_id=user.id, title=["Push Day", "Pull Day", "Leg Day"][dow % 3],
                             date=d, status="completed", duration_minutes=random.randint(40, 65),
                             source="manual")
                db.add(w)
                db.commit()
                db.refresh(w)
                for name, sets, reps in (("Push-Up", 3, "12-15"), ("Dumbbell Row", 4, "10"),
                                          ("Goblet Squat", 4, "10"), ("Plank", 3, "60s")):
                    we = WorkoutExercise(user_id=user.id, workout_id=w.id, name=name,
                                         order_index=0, target_sets=sets, target_reps=reps)
                    db.add(we)
                    db.commit()
                    db.refresh(we)
                    for sn in range(sets):
                        db.add(WorkoutSet(user_id=user.id, workout_exercise_id=we.id,
                                          set_number=sn + 1, reps=random.randint(8, 15),
                                          weight=random.choice([0, 20, 25, 30]),
                                          completed=True))

        # Nutrition: meals on most days
        from app.ai.nutrition_lookup import lookup_food
        meal_templates = [
            ("breakfast", [("Large Egg (whole, cooked)", 2, "large egg"), ("Whole Wheat Bread (slice)", 2, "slice")]),
            ("lunch", [("Chicken Breast (cooked, skinless)", 150, "g"), ("White Rice (cooked)", 200, "g")]),
            ("dinner", [("Salmon Fillet (baked/grilled)", 140, "g"), ("Broccoli (steamed)", 100, "g")]),
        ]
        for i in range(13):
            d = today - timedelta(days=i)
            if random.random() < 0.25:
                continue
            for title, foods in meal_templates:
                m = Meal(user_id=user.id, title=title.title(), meal_type=title,
                         date=d, source="manual", confirmed=True)
                db.add(m)
                db.commit()
                db.refresh(m)
                for name, qty, unit in foods:
                    found = lookup_food(name)
                    macros = {}
                    if found:
                        scale = qty / (found.get("quantity", 1) or 1)
                        macros = {k: round((found.get(k) or 0) * scale, 1)
                                  for k in ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g")}
                    db.add(MealItem(user_id=user.id, meal_id=m.id, name=name,
                                    quantity=qty, unit=unit, is_estimate=False, **macros))
                db.add(HydrationEntry(user_id=user.id, date=d, ml=random.choice([250, 500, 500, 750])))

        # Sleep
        for i in range(13):
            d = today - timedelta(days=i)
            db.add(SleepEntry(user_id=user.id, date=d,
                              total_minutes=random.randint(360, 500),
                              quality=random.randint(2, 5), energy=random.randint(2, 5),
                              soreness=random.randint(1, 3), fatigue=random.randint(1, 4)))

        # Habits
        habits = []
        for name in ("Workout", "Study", "Read", "Drink water"):
            h = Habit(user_id=user.id, name=name, target_per_week=7)
            habits.append(h)
            db.add(h)
        db.commit()
        for h in habits:
            for i in range(13):
                if random.random() < 0.7:
                    db.add(HabitCompletion(user_id=user.id, habit_id=h.id,
                                           date=today - timedelta(days=i)))

        # School
        db.add(Assignment(user_id=user.id, title="Chemistry test", type="test",
                          due_date=datetime.now() + timedelta(days=4)))
        db.add(Assignment(user_id=user.id, title="History essay", type="project",
                          due_date=datetime.now() + timedelta(days=9)))
        for i, focus in enumerate(("overview", "practice questions", "weak spots review")):
            db.add(StudySession(user_id=user.id, topic=f"Chemistry — {focus}",
                                date=today + timedelta(days=i), minutes=30))

        # Finance
        sg = SavingsGoal(user_id=user.id, name="Emergency fund", target_amount=500,
                        current_amount=175)
        db.add(sg)
        db.commit()
        for i in range(4):
            db.add(FinanceEntry(user_id=user.id, kind="expense", amount=random.uniform(8, 45),
                                category=random.choice(["food", "transport", "fun", "school"]),
                                date=today - timedelta(days=i * 3)))
        db.add(FinanceEntry(user_id=user.id, kind="income", amount=300,
                            category="job", date=today - timedelta(days=10)))
        for amt, days in ((50, 12), (75, 6), (50, 2)):
            db.add(FinanceEntry(user_id=user.id, kind="savings", amount=amt,
                                category="savings", date=today - timedelta(days=days)))

        # Reminders
        db.add(Reminder(user_id=user.id, title="Chemistry study session",
                        remind_at=datetime.now().replace(hour=19, minute=0, second=0),
                        category="school", notification_status="not_connected"))
        db.add(Reminder(user_id=user.id, title="Plan my week",
                        remind_at=datetime.now() + timedelta(days=1),
                        repeat="weekly", repeat_day=0, category="personal",
                        notification_status="not_connected"))

        # Mood
        for i in range(6):
            db.add(MoodEntry(user_id=user.id, date=today - timedelta(days=i),
                             mood=random.randint(3, 5), stress=random.randint(1, 4)))

        db.commit()
        print("Done. Log in as demo@defiy.os / demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
