"""Nutrient pattern analysis over logged meals.

IMPORTANT: this is a pattern observation over food logs, NOT a medical test.
Language rules: "possible gap", "low intake pattern", "worth discussing with a
healthcare professional". Never diagnoses deficiencies.
"""
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.nutrition import Meal, MealItem

FIBER_LOW = 20.0        # g/day reference (adult ~25-30g target; conservative threshold)
PROTEIN_LOW = 40.0      # g/day conservative floor for observation purposes
VITAMIN_C_SOURCES = {"orange", "bell pepper", "strawberr", "broccoli", "citrus", "kiwi", "tomato", "grapefruit"}


def _window_items(db: Session, user_id: int, days: int):
    since = date.today() - timedelta(days=days)
    meals = db.query(Meal).filter(Meal.user_id == user_id, Meal.date >= since).all()
    meal_ids = [m.id for m in meals]
    if not meal_ids:
        return [], 0
    items = db.query(MealItem).filter(MealItem.meal_id.in_(meal_ids)).all()
    return items, len(meals)


def analyze_patterns(db: Session, user_id: int, days: int = 14) -> dict:
    items, meal_count = _window_items(db, user_id, days)
    patterns: list[dict] = []
    if meal_count >= 3:
        per_day = max(1, days)
        fiber = sum(i.fiber_g or 0 for i in items)
        protein = sum(i.protein_g or 0 for i in items)
        if fiber / per_day < FIBER_LOW:
            patterns.append({
                "kind": "fiber",
                "text": (f"Your logged meals over the last {days} days show a relatively low fiber "
                         "intake pattern (a possible gap). Foods like beans, oats, berries, and "
                         "whole grains could help. Worth discussing with a healthcare professional "
                         "if it continues."),
            })
        if protein / per_day < PROTEIN_LOW:
            patterns.append({
                "kind": "protein",
                "text": (f"Your recent food logs are relatively low in protein. If that matches how "
                         "you actually eat, adding a protein source to one or two meals could help "
                         "support your training and energy."),
            })
        names = " ".join((i.name or "").lower() for i in items)
        if not any(source in names for source in VITAMIN_C_SOURCES):
            patterns.append({
                "kind": "vitamin_c",
                "text": ("Your recent food logs don't contain many obvious vitamin C sources "
                         "(a possible gap, not a diagnosis). Citrus, bell peppers, or strawberries "
                         "are easy adds. For anything persistent, a healthcare professional can "
                         "give real answers — food logging is not a medical test."),
            })
    return {
        "days": days,
        "meals_analyzed": meal_count,
        "patterns": patterns,
        "disclaimer": ("These observations come from your own food logs, which may be incomplete. "
                       "They are not a medical test and do not diagnose anything. For persistent "
                       "concerns, talk to a healthcare professional."),
    }
