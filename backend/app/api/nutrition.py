"""Nutrition: meals, items, daily/weekly totals, hydration, patterns."""
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.nutrition import Meal, MealItem, HydrationEntry
from app.services.xp import award_xp
from app.services.nutrient_patterns import analyze_patterns
from app.ai.nutrition_lookup import lookup_food

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


def _meal(db: Session, user_id: int, meal_id: int) -> Meal:
    m = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user_id).first()
    if not m:
        raise HTTPException(404, "Meal not found")
    return m


def _items_out(db: Session, meal_id: int) -> list:
    return (db.query(MealItem).filter(MealItem.meal_id == meal_id)
            .order_by(MealItem.id).all())


@router.get("/meals")
def list_meals(limit: int = 50, skip: int = 0, day: date | None = None,
               user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Meal).filter(Meal.user_id == user.id)
    if day:
        q = q.filter(Meal.date == day)
    meals = q.order_by(Meal.date.desc(), Meal.id.desc()).offset(skip).limit(min(limit, 200)).all()
    out = []
    for m in meals:
        d = {c: getattr(m, c) for c in ("id", "title", "meal_type", "date", "source", "confirmed")}
        items = _items_out(db, m.id)
        d["items"] = [{c: getattr(i, c) for c in ("id", "name", "quantity", "unit",
                                                  "calories", "protein_g", "carbs_g", "fat_g",
                                                  "fiber_g", "is_estimate")}
                      for i in items]
        d["totals"] = _totals(items)
        out.append(d)
    return out


def _totals(items) -> dict:
    return {k: round(sum(getattr(i, k) or 0 for i in items), 1)
            for k in ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g")}


@router.post("/meals", status_code=201)
def create_meal(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """data: {title, meal_type, date?, source?, confirmed?,
    items: [{name, quantity, unit, calories?, protein_g?, ...}]}. Items without explicit
    macros get values from the food reference table (flagged as estimates)."""
    m = Meal(user_id=user.id, title=data.get("title", "Meal"),
             meal_type=data.get("meal_type", "lunch"),
             date=data.get("date") or date.today(),
             source=data.get("source", "manual"),
             confirmed=bool(data.get("confirmed", False)))
    db.add(m)
    db.commit()
    db.refresh(m)
    for it in (data.get("items") or []):
        name = it.get("name", "food")
        qty = float(it.get("quantity", 1) or 1)
        unit = it.get("unit", "serving")
        macros = {}
        if not any(it.get(k) is not None for k in ("calories", "protein_g", "carbs_g", "fat_g")):
            found = lookup_food(name)
            if found:
                scale = qty / (found.get("quantity", 1) or 1)
                macros = {k: round((found.get(k) or 0) * scale, 1)
                          for k in ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g")}
        db.add(MealItem(user_id=user.id, meal_id=m.id, name=name, quantity=qty, unit=unit,
                        is_estimate=bool(macros or it.get("is_estimate", False)), **macros))
    db.commit()
    award_xp(db, user.id, "meal_logged", "meal", m.id)
    return {"id": m.id, "title": m.title, "ok": True}


@router.patch("/meals/{meal_id}")
def update_meal(meal_id: int, data: dict, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    """User confirms or corrects an AI estimate: set confirmed=True after edits."""
    m = _meal(db, user.id, meal_id)
    for k in ("title", "meal_type", "confirmed", "source"):
        if k in data:
            setattr(m, k, data[k])
    for it in (data.get("items") or []):
        if it.get("id"):
            item = db.query(MealItem).filter(MealItem.id == it["id"],
                                             MealItem.user_id == user.id).first()
            if item:
                for k in ("name", "quantity", "unit", "calories", "protein_g", "carbs_g",
                          "fat_g", "fiber_g", "is_estimate"):
                    if k in it:
                        setattr(item, k, it[k])
    db.commit()
    db.refresh(m)
    return {"id": m.id, "confirmed": m.confirmed, "ok": True}


@router.delete("/meals/{meal_id}", status_code=204)
def delete_meal(meal_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    db.delete(_meal(db, user.id, meal_id))
    db.commit()


def _day_range(d: date):
    start = datetime.combine(d, datetime.min.time())
    return start, start + timedelta(days=1)


def _day_totals(db: Session, user_id: int, d: date) -> dict:
    start, end = _day_range(d)
    items = (db.query(MealItem).join(Meal).filter(Meal.user_id == user_id,
                                                  Meal.date >= start, Meal.date < end).all())
    water = (db.query(HydrationEntry)
             .filter(HydrationEntry.user_id == user_id, HydrationEntry.date == d).all())
    totals = _totals(items)
    totals["water_ml"] = sum(w.ml for w in water)
    return totals


@router.get("/daily")
def daily_totals(day: date | None = None, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    d = day or date.today()
    return {"date": d, **_day_totals(db, user.id, d)}


@router.get("/weekly")
def weekly_totals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        days.append({"date": d, **_day_totals(db, user.id, d)})
    return days


@router.post("/hydrate")
def hydrate(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ml = int(data.get("ml", 250) or 250)
    db.add(HydrationEntry(user_id=user.id, date=date.today(), ml=ml))
    db.commit()
    total = sum(e.ml for e in db.query(HydrationEntry)
                .filter(HydrationEntry.user_id == user.id,
                        HydrationEntry.date == date.today()).all())
    return {"water_ml_today": total, "ok": True}


@router.get("/patterns")
def patterns(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analyze_patterns(db, user.id)
