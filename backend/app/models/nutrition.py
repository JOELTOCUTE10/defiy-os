"""Nutrition SQLAlchemy models: Meals, MealItems, HydrationEntries."""
from sqlalchemy import Column, JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(120), nullable=False)
    meal_type = Column(String(20), nullable=False)  # "breakfast" | "lunch" | "dinner" | "snack"
    date = Column(DateTime(timezone=True), nullable=False)
    source = Column(String(20), default="manual")   # "manual" | "photo" | "ai"
    photo_url = Column(Text, nullable=True)
    confirmed = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_date = created_col()
    updated_date = updated_col()


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    meal_id = Column(Integer, ForeignKey("meals.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(120), nullable=False)
    quantity = Column(Float, default=1.0)
    unit = Column(String(30), default="serving")
    calories = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    micronutrients = Column(JSON, nullable=True)
    is_estimate = Column(Boolean, default=False)
    created_date = created_col()
    updated_date = updated_col()


class HydrationEntry(Base):
    __tablename__ = "hydration_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    ml = Column(Integer, nullable=False)
    created_date = created_col()
    updated_date = updated_col()
