"""Mental & emotional wellbeing: mood check-ins, journaling. Supportive, never shaming."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.wellness import MoodEntry
from app.services.xp import award_xp

router = APIRouter(prefix="/wellbeing", tags=["wellbeing"])


@router.get("/entries")
def list_entries(limit: int = 60, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    return (db.query(MoodEntry).filter(MoodEntry.user_id == user.id)
            .order_by(MoodEntry.date.desc()).limit(min(limit, 200)).all())


@router.post("/entries", status_code=201)
def create_entry(data: dict, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    m = MoodEntry(user_id=user.id, date=data.get("date") or date.today(),
                  mood=data.get("mood", 3), stress=data.get("stress"),
                  journal=data.get("journal"), tags=data.get("tags"))
    db.add(m)
    db.commit()
    db.refresh(m)
    award_xp(db, user.id, "mood_logged", "mood", m.id)
    return m


@router.get("/trends")
def trends(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = date.today() - timedelta(days=30)
    entries = (db.query(MoodEntry)
               .filter(MoodEntry.user_id == user.id, MoodEntry.date >= since)
               .order_by(MoodEntry.date).all())
    moods = [e.mood for e in entries if e.mood]
    stress = [e.stress for e in entries if e.stress]
    return {
        "trend": [{"date": str(e.date), "mood": e.mood, "stress": e.stress}
                  for e in entries],
        "avg_mood": round(sum(moods) / len(moods), 1) if moods else None,
        "avg_stress": round(sum(stress) / len(stress), 1) if stress else None,
        "note": ("I'm here to support you, not to judge you — and I'm not a therapist. "
                 "If things feel heavy, talking to a trusted person or a professional "
                 "is a strong move. In a crisis (US), call or text 988."),
    }
