"""XP info, achievements, weekly reviews, recommendations."""
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User, AIRecommendation
from app.models.gamification import Achievement, UserAchievement, WeeklyReview
from app.services.xp import get_xp_info
from app.services.weekly_review import compute_week_stats, generate_review
from app.ai import gemini

router = APIRouter(tags=["gamification"])


@router.get("/xp")
def xp_info(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_xp_info(db, user.id)


@router.get("/achievements")
def achievements(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    all_achievements = db.query(Achievement).all()
    earned = {ua.achievement_id: ua.earned_date
              for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()}
    out = []
    for a in all_achievements:
        out.append({"id": a.id, "code": a.code, "name": a.name, "description": a.description,
                    "icon": a.icon, "points_required": a.points_required,
                    "earned": a.id in earned,
                    "earned_date": earned.get(a.id)})
    xp = get_xp_info(db, user.id)
    for a in out:  # auto-earn points-based achievements
        if not a["earned"] and a["points_required"] and xp["total_points"] >= a["points_required"]:
            ach = db.query(Achievement).get(a["id"])
            db.add(UserAchievement(user_id=user.id, achievement_id=a["id"],
                                    earned_date=datetime.now()))
            a["earned"] = True
            a["earned_date"] = datetime.now()
    db.commit()
    return out


@router.get("/weekly-review")
def get_weekly_review(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week_start = date.today() - timedelta(days=date.today().weekday())
    review = (db.query(WeeklyReview)
              .filter(WeeklyReview.user_id == user.id,
                      WeeklyReview.week_start >= datetime.combine(week_start, datetime.min.time()))
              .order_by(WeeklyReview.week_start.desc()).first())
    return review


@router.post("/weekly-review", status_code=201)
def create_weekly_review(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Compute the week's REAL stats, then summarize — with Gemini when connected,
    clearly-labeled template otherwise."""
    review = generate_review(db, user)
    if gemini.is_configured():
        stats = review.data
        prompt = (
            "Summarize this user's week for their weekly review. Be encouraging but "
            "honest; note their biggest accomplishment, one area to improve, and a "
            "suggested focus for next week. Base everything ONLY on this data:\n"
            f"{stats}\n\nKeep it under 180 words, friendly, no bullet symbols in prose."
        )
        text = gemini.generate(prompt)
        if text:
            review.summary = text
            db.commit()
            db.refresh(review)
    return review


@router.get("/recommendations")
def list_recommendations(status: str | None = "pending",
                         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(AIRecommendation).filter(AIRecommendation.user_id == user.id)
    if status:
        q = q.filter(AIRecommendation.status == status)
    return q.order_by(AIRecommendation.created_date.desc()).limit(20).all()


@router.post("/recommendations/{rec_id}/accept")
def accept_recommendation(rec_id: int, user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == rec_id,
                                            AIRecommendation.user_id == user.id).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")
    rec.status = "accepted"
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/recommendations/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: int, user: User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == rec_id,
                                            AIRecommendation.user_id == user.id).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")
    rec.status = "dismissed"
    db.commit()
    db.refresh(rec)
    return rec
