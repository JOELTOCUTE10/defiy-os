"""Fitness SQLAlchemy models: Exercises, Workouts, WorkoutExercises, WorkoutSets, PersonalRecords."""
from sqlalchemy import Column, JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    name = Column(String(120), nullable=False)
    muscle_groups = Column(JSON)  # list of strings e.g. ["chest", "triceps"]
    equipment = Column(JSON)      # list of strings e.g. ["barbell", "bench"]
    category = Column(String(50))   # strength / cardio / flexibility / bodyweight
    instructions = Column(Text)
    is_ai_generated = Column(Boolean, default=False)
    created_date = created_col()
    updated_date = updated_col()


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="planned")  # "planned" | "completed" | "skipped"
    duration_minutes = Column(Integer)
    source = Column(String(20), default="manual")   # "manual" | "ai"
    plan_data = Column(JSON)
    notes = Column(Text)
    created_date = created_col()
    updated_date = updated_col()


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), index=True, nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(120), nullable=False)
    order_index = Column(Integer, default=0)
    target_sets = Column(Integer, default=3)
    target_reps = Column(Integer, default=10)
    target_weight = Column(Float)
    target_rir = Column(Integer)
    rest_seconds = Column(Integer, default=60)
    notes = Column(Text)
    created_date = created_col()
    updated_date = updated_col()


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    workout_exercise_id = Column(Integer, ForeignKey("workout_exercises.id", ondelete="CASCADE"), index=True, nullable=False)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer)
    weight = Column(Float)
    rir = Column(Integer)
    duration_seconds = Column(Integer)
    completed = Column(Boolean, default=False)
    created_date = created_col()
    updated_date = updated_col()


class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    exercise_name = Column(String(120), nullable=False)
    metric = Column(String(20), nullable=False)  # "weight" | "reps" | "duration"
    value = Column(Float, nullable=False)
    unit = Column(String(20))
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="SET NULL"), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    created_date = created_col()
    updated_date = updated_col()
