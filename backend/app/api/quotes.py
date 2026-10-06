"""Quote of the day."""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User, Profile
from app.schemas.quotes import QuoteOut
from app.services.quotes import pick_quote

router = APIRouter(prefix="/quotes", tags=["quotes"])

GOAL_CATEGORY = {
    "fitness": "fitness", "health": "recovery", "school": "school",
    "money": "money", "personal": "growth", "productivity": "discipline",
    "learning": "growth", "other": "growth",
}


@router.get("/today", response_model=QuoteOut)
def quote_of_day(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    category = None
    if profile and profile.main_goals:
        category = GOAL_CATEGORY.get((profile.main_goals or [])[0].lower())
    q = pick_quote(date.today(), category)
    return QuoteOut(quote=q["text"], author="Defiy", category=q["category"],
                    date=date.today().isoformat())
