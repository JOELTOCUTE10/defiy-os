"""XP and leveling. Curve: reaching level n requires 100 * n * (n+1) / 2 total points (cumulative)."""
from sqlalchemy.orm import Session

from app.models.gamification import XPEvent
from app.models.core import Profile

XP_REWARDS = {
    "workout_completed": 25,
    "meal_logged": 10,
    "habit_completed": 5,
    "sleep_logged": 10,
    "study_completed": 15,
    "goal_milestone": 30,
    "goal_completed": 100,
    "savings_contribution": 15,
    "reminder_completed": 5,
    "mood_logged": 5,
    "note_created": 5,
}


def points_for_level(level: int) -> int:
    """Total cumulative points required to reach a given level."""
    return 100 * level * (level + 1) // 2


def level_for_points(total: int) -> int:
    level = 1
    while points_for_level(level + 1) <= total:
        level += 1
    return level


def award_xp(db: Session, user_id: int, reason: str, source_type: str | None = None,
             source_id: int | None = None) -> XPEvent | None:
    """Award XP for an action if the user has XP enabled. Idempotency is the caller's job."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile is not None and not profile.xp_enabled:
        return None
    points = XP_REWARDS.get(reason, 0)
    if points <= 0:
        return None
    event = XPEvent(user_id=user_id, points=points, reason=reason,
                    source_type=source_type, source_id=source_id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_xp_info(db: Session, user_id: int) -> dict:
    events = db.query(XPEvent).filter(XPEvent.user_id == user_id).order_by(XPEvent.created_date.desc()).limit(20).all()
    total = sum(e.points for e in db.query(XPEvent).filter(XPEvent.user_id == user_id).all())
    level = level_for_points(total)
    level_floor = points_for_level(level)
    next_at = points_for_level(level + 1)
    return {
        "level": level,
        "level_points": total - level_floor,
        "next_level_points": next_at - level_floor,
        "total_points": total,
        "recent_events": events,
    }
