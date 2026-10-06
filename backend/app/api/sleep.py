"""Sleep tracking + trends."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.wellness import SleepEntry
from app.services.xp import award_xp

router = APIRouter(prefix="/sleep", tags=["sleep"])


@router.get("/entries")
def list_entries(limit: int = 60, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    return (db.query(SleepEntry).filter(SleepEntry.user_id == user.id)
            .order_by(SleepEntry.date.desc()).limit(min(limit, 200)).all())


@router.post("/entries", status_code=201)
def log_entry(data: dict, user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    e = SleepEntry(user_id=user.id, date=data.get("date") or date.today(),
                   bedtime=data.get("bedtime"), wake_time=data.get("wake_time"),
                   total_minutes=data.get("total_minutes"), quality=data.get("quality"),
                   energy=data.get("energy"), soreness=data.get("soreness"),
                   fatigue=data.get("fatigue"), notes=data.get("notes"))
    db.add(e)
    db.commit()
    db.refresh(e)
    award_xp(db, user.id, "sleep_logged", "sleep", e.id)
    return e


@router.delete("/entries/{e_id}", status_code=204)
def delete_entry(e_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    e = db.query(SleepEntry).filter(SleepEntry.id == e_id,
                                    SleepEntry.user_id == user.id).first()
    if not e:
        raise HTTPException(404, "Sleep entry not found")
    db.delete(e)
    db.commit()


@router.get("/trends")
def trends(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = (db.query(SleepEntry).filter(SleepEntry.user_id == user.id)
               .order_by(SleepEntry.date.desc()).limit(30).all())
    entries.reverse()
    vals = [e.total_minutes for e in entries if e.total_minutes]
    return {
        "entries": entries,
        "average_minutes": round(sum(vals) / len(vals)) if vals else None,
        "trend": [{"date": str(e.date), "minutes": e.total_minutes,
                   "quality": e.quality, "energy": e.energy,
                   "soreness": e.soreness, "fatigue": e.fatigue} for e in entries],
        "note": ("General guidance: most adults do well with 7-9 hours and a consistent "
                 "schedule. I'm not a doctor — for persistent sleep problems, talk to a "
                 "healthcare professional."),
    }
