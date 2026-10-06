from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

class MealItemCreate(BaseModel):
    name: str
    quantity: float = 1.0
    unit: str = "serving"
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    fiber_g: float = 0.0
    micronutrients: Optional[Any] = None
    is_estimate: bool = False

class MealItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meal_id: int
    name: str
    quantity: float
    unit: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    micronutrients: Optional[Any] = None
    is_estimate: bool

class MealCreate(BaseModel):
    title: str
    meal_type: str  # "breakfast" | "lunch" | "dinner" | "snack"
    date: datetime
    source: Optional[str] = "manual"
    photo_url: Optional[str] = None
    confirmed: bool = True
    notes: Optional[str] = None
    items: Optional[List[MealItemCreate]] = []

class MealUpdate(BaseModel):
    title: Optional[str] = None
    meal_type: Optional[str] = None
    date: Optional[datetime] = None
    confirmed: Optional[bool] = None
    notes: Optional[str] = None
    items: Optional[List[MealItemCreate]] = None

class MealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    meal_type: str
    date: datetime
    source: str
    photo_url: Optional[str] = None
    confirmed: bool
    notes: Optional[str] = None
    created_date: datetime
    items: List[MealItemOut] = []

class HydrationIn(BaseModel):
    date: Optional[datetime] = None
    ml: int

class HydrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: datetime
    ml: int

class DailyNutritionOut(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    total_water_ml: int
    meals: List[MealOut]

class WeeklyNutritionOut(BaseModel):
    average_daily_calories: float
    average_daily_protein: float
    average_daily_water: float
    days_logged: int
    daily_summaries: List[dict]

class PatternOut(BaseModel):
    potential_gaps: List[dict]
    strengths: List[dict]
    disclaimer: str
