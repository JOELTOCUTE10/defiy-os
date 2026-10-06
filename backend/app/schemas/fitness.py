from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

class ExerciseCreate(BaseModel):
    name: str
    muscle_groups: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    category: Optional[str] = "strength"
    instructions: Optional[str] = None

class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    name: str
    muscle_groups: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    category: Optional[str] = None
    instructions: Optional[str] = None
    is_ai_generated: bool = False

class WorkoutSetIn(BaseModel):
    set_number: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    rir: Optional[int] = None
    duration_seconds: Optional[int] = None
    completed: bool = False

class WorkoutSetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_exercise_id: int
    set_number: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    rir: Optional[int] = None
    duration_seconds: Optional[int] = None
    completed: bool = False

class WorkoutExerciseIn(BaseModel):
    exercise_id: Optional[int] = None
    name: str
    order_index: int = 0
    target_sets: int = 3
    target_reps: int = 10
    target_weight: Optional[float] = None
    target_rir: Optional[int] = None
    rest_seconds: Optional[int] = 60
    notes: Optional[str] = None
    sets: Optional[List[WorkoutSetIn]] = []

class WorkoutExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_id: int
    exercise_id: Optional[int] = None
    name: str
    order_index: int
    target_sets: int
    target_reps: int
    target_weight: Optional[float] = None
    target_rir: Optional[int] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    sets: List[WorkoutSetOut] = []

class WorkoutCreate(BaseModel):
    title: str
    date: datetime
    duration_minutes: Optional[int] = None
    source: Optional[str] = "manual"
    notes: Optional[str] = None
    exercises: Optional[List[WorkoutExerciseIn]] = []

class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[str] = None  # "planned" | "completed" | "skipped"
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    exercises: Optional[List[WorkoutExerciseIn]] = None

class WorkoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    date: datetime
    status: str
    duration_minutes: Optional[int] = None
    source: str
    plan_data: Optional[Any] = None
    notes: Optional[str] = None
    created_date: datetime
    exercises: List[WorkoutExerciseOut] = []

class WorkoutGenerateIn(BaseModel):
    goal: str
    experience: str
    equipment: List[str]
    minutes: int = 45
    days_per_week: int = 4

class PersonalRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    exercise_name: str
    metric: str
    value: float
    unit: str
    workout_id: Optional[int] = None
    date: datetime

class FitnessStatsOut(BaseModel):
    volume_by_week: List[dict]
    pr_count: int
    workouts_completed_this_month: int
    consistency_score: float
