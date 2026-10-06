"""School: classes, assignments, study sessions, AI study plans."""
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.school import SchoolClass, Assignment, StudySession
from app.services.xp import award_xp
from app.ai import gemini
from app.ai.prompts import build_context

router = APIRouter(prefix="/school", tags=["school"])


@router.get("/classes")
def list_classes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SchoolClass).filter(SchoolClass.user_id == user.id).all()


@router.post("/classes", status_code=201)
def create_class(data: dict, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    c = SchoolClass(user_id=user.id, name=data.get("name", "Class"),
                    teacher=data.get("teacher"), schedule=data.get("schedule"),
                    color=data.get("color", "#6366f1"))
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/classes/{class_id}", status_code=204)
def delete_class(class_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    c = db.query(SchoolClass).filter(SchoolClass.id == class_id,
                                     SchoolClass.user_id == user.id).first()
    if c:
        db.delete(c)
        db.commit()


def _assignment(db: Session, user_id: int, a_id: int) -> Assignment:
    a = db.query(Assignment).filter(Assignment.id == a_id,
                                    Assignment.user_id == user_id).first()
    if not a:
        raise HTTPException(404, "Assignment not found")
    return a


@router.get("/assignments")
def list_assignments(status: str | None = None, user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    q = db.query(Assignment).filter(Assignment.user_id == user.id)
    if status:
        q = q.filter(Assignment.status == status)
    return q.order_by(Assignment.due_date.is_(None), Assignment.due_date).all()


@router.post("/assignments", status_code=201)
def create_assignment(data: dict, user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    a = Assignment(user_id=user.id, title=data.get("title", "Assignment"),
                   type=data.get("type", "homework"), class_id=data.get("class_id"),
                   due_date=data.get("due_date"), notes=data.get("notes"))
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.patch("/assignments/{a_id}")
def update_assignment(a_id: int, data: dict, user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    a = _assignment(db, user.id, a_id)
    for k in ("title", "type", "class_id", "due_date", "status", "notes"):
        if k in data:
            setattr(a, k, data[k])
    db.commit()
    db.refresh(a)
    return a


@router.delete("/assignments/{a_id}", status_code=204)
def delete_assignment(a_id: int, user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    db.delete(_assignment(db, user.id, a_id))
    db.commit()


@router.get("/sessions")
def list_study_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week_start = date.today() - timedelta(days=date.today().weekday())
    sessions = (db.query(StudySession)
                .filter(StudySession.user_id == user.id, StudySession.date >= week_start)
                .order_by(StudySession.date).all())
    total = sum(s.minutes for s in sessions if s.completed)
    return {"sessions": sessions, "week_minutes": total}


@router.post("/sessions", status_code=201)
def create_session(data: dict, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    s = StudySession(user_id=user.id, topic=data.get("topic", "Study"),
                     assignment_id=data.get("assignment_id"), class_id=data.get("class_id"),
                     date=data.get("date") or date.today(),
                     minutes=data.get("minutes", 30), notes=data.get("notes"),
                     completed=bool(data.get("completed", False)))
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/sessions/{s_id}")
def update_session(s_id: int, data: dict, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    s = db.query(StudySession).filter(StudySession.id == s_id,
                                      StudySession.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Study session not found")
    if data.get("completed") and not s.completed:
        award_xp(db, user.id, "study_completed", "study", s.id)
    for k in ("topic", "date", "minutes", "notes", "completed"):
        if k in data:
            setattr(s, k, data[k])
    db.commit()
    db.refresh(s)
    return s


@router.get("/summary")
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week_start = date.today() - timedelta(days=date.today().weekday())
    pending = (db.query(Assignment)
               .filter(Assignment.user_id == user.id, Assignment.status == "pending")
               .order_by(Assignment.due_date.is_(None), Assignment.due_date).all())
    sessions = (db.query(StudySession)
                .filter(StudySession.user_id == user.id, StudySession.date >= week_start).all())
    return {
        "pending_assignments": pending,
        "upcoming_due": [a for a in pending if a.due_date][:5],
        "week_minutes": sum(s.minutes for s in sessions if s.completed),
        "classes_count": db.query(SchoolClass).filter(SchoolClass.user_id == user.id).count(),
    }


@router.post("/study-plan")
def generate_study_plan(data: dict, user: User = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    """AI study plan. Without the engine, falls back to an even distribution across
    the days left (real sessions, honestly labeled as auto-distributed)."""
    title = data.get("title") or data.get("assignment_title", "Study topic")
    due = data.get("due_date")
    due_date = None
    if due:
        due_date = (datetime.fromisoformat(str(due).replace("Z", "+00:00"))
                    if isinstance(due, str) else due)
    minutes = int(data.get("minutes_per_day", 30) or 30)

    if gemini.is_configured():
        context = build_context(db, user.id)
        prompt = (
            f"Build a study plan as JSON. User context:\n{context}\n\n"
            f"Topic: {title}. Due: {due or 'unknown'}. Minutes per session: {minutes}.\n"
            'Return JSON only: {"sessions": [{"topic": str, "date": "YYYY-MM-DD", '
            '"minutes": int, "focus": str}], "note": str}. Space sessions sensibly across '
            "available days, use evidence-based study techniques (spaced practice, active "
            "recall), and keep it realistic."
        )
        plan = gemini.generate_json(prompt)
        if plan and plan.get("sessions"):
            created = []
            for s in plan["sessions"][:10]:
                try:
                    d = date.fromisoformat(str(s.get("date"))[:10])
                except (TypeError, ValueError):
                    d = date.today()
                row = StudySession(user_id=user.id, topic=s.get("topic", title),
                                   date=d, minutes=int(s.get("minutes", minutes)),
                                   notes=s.get("focus"))
                db.add(row)
                created.append(row)
            db.commit()
            return {"sessions": created, "note": plan.get("note", ""),
                    "generated_by": "gemini"}

    end = due_date.date() if due_date else date.today() + timedelta(days=5)
    days_left = max((end - date.today()).days, 1)
    n = min(days_left, 7)
    created = []
    plan_types = ["overview + key concepts", "practice questions",
                  "weak spots review", "mixed practice", "full review", "light recap",
                  "final review"]
    for i in range(n):
        row = StudySession(user_id=user.id, topic=f"{title} — {plan_types[i % len(plan_types)]}",
                           date=date.today() + timedelta(days=i), minutes=minutes,
                           notes="auto-distributed")
        db.add(row)
        created.append(row)
    db.commit()
    return {"sessions": created,
            "note": (f"{n} sessions of {minutes} min auto-distributed until the due date. "
                     "(AI engine not connected — evenly spaced; connect Gemini for a "
                     "personalized plan.)"),
            "generated_by": "fallback"}
