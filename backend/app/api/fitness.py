"""Fitness: exercises, workouts, sets, records, stats, AI generation."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.fitness import Exercise, Workout, WorkoutExercise, WorkoutSet, PersonalRecord
from app.services.xp import award_xp
from app.ai import gemini
from app.ai.prompts import build_context

router = APIRouter(prefix="/fitness", tags=["fitness"])


@router.get("/exercises")
def list_exercises(q: str | None = None, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    query = db.query(Exercise).filter(Exercise.user_id == user.id)
    if q:
        query = query.filter(Exercise.name.ilike(f"%{q}%"))
    return query.order_by(Exercise.name).all()


@router.post("/exercises", status_code=201)
def create_exercise(data: dict, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    e = Exercise(user_id=user.id, name=data.get("name", "Exercise"),
                 muscle_groups=data.get("muscle_groups"), equipment=data.get("equipment"),
                 category=data.get("category", "strength"),
                 instructions=data.get("instructions"),
                 is_ai_generated=bool(data.get("is_ai_generated", False)))
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.get("/workouts")
def list_workouts(status: str | None = None, limit: int = 50, skip: int = 0,
                  user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Workout).filter(Workout.user_id == user.id)
    if status:
        query = query.filter(Workout.status == status)
    return query.order_by(Workout.date.desc()).offset(skip).limit(min(limit, 200)).all()


@router.post("/workouts", status_code=201)
def create_workout(data: dict, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """data: {title, date?, notes?, status?, duration_minutes?, source?,
    exercises: [{exercise_id?, name, sets?, reps?, weight?, rir?, rest_seconds?}]}"""
    exercises = data.get("exercises") or []
    w = Workout(user_id=user.id, title=data.get("title", "Workout"),
                date=data.get("date") or datetime.now(),
                notes=data.get("notes"), status=data.get("status", "planned"),
                source=data.get("source", "manual"),
                duration_minutes=data.get("duration_minutes"))
    db.add(w)
    db.commit()
    db.refresh(w)
    for i, ex in enumerate(exercises):
        we = WorkoutExercise(user_id=user.id, workout_id=w.id,
                             exercise_id=ex.get("exercise_id"),
                             name=ex.get("name", "Exercise"), order_index=i,
                             target_sets=ex.get("sets"), target_reps=ex.get("reps"),
                             target_weight=ex.get("weight"), target_rir=ex.get("rir"),
                             rest_seconds=ex.get("rest_seconds"))
        db.add(we)
    db.commit()
    db.refresh(w)
    return w


def _workout(db: Session, user_id: int, workout_id: int) -> Workout:
    w = db.query(Workout).filter(Workout.id == workout_id,
                                 Workout.user_id == user_id).first()
    if not w:
        raise HTTPException(404, "Workout not found")
    return w


@router.get("/workouts/{workout_id}")
def get_workout(workout_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    w = _workout(db, user.id, workout_id)
    exs = (db.query(WorkoutExercise).filter(WorkoutExercise.workout_id == w.id)
           .order_by(WorkoutExercise.order_index).all())
    out = _workout_dict(w)
    out["exercises"] = []
    for we in exs:
        sets = (db.query(WorkoutSet).filter(WorkoutSet.workout_exercise_id == we.id)
                .order_by(WorkoutSet.set_number).all())
        we_out = {c: getattr(we, c) for c in ("id", "name", "exercise_id", "order_index",
                                              "target_sets", "target_reps", "target_weight",
                                              "target_rir", "rest_seconds")}
        we_out["sets"] = [{c: getattr(s, c) for c in ("id", "set_number", "reps", "weight",
                                                      "rir", "duration_seconds", "completed")}
                          for s in sets]
        out["exercises"].append(we_out)
    return out


def _workout_dict(w: Workout) -> dict:
    return {c: getattr(w, c) for c in ("id", "title", "date", "notes", "status", "source",
                                       "duration_minutes", "created_date", "updated_date")}


@router.patch("/workouts/{workout_id}")
def update_workout(workout_id: int, payload: dict, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """payload may include title/status/duration_minutes/notes and logged sets:
    {"exercises": [{"workout_exercise_id": int, "sets": [{set_number, reps, weight,
    rir, duration_seconds, completed}]}]}"""
    w = _workout(db, user.id, workout_id)
    for k in ("title", "status", "duration_minutes", "notes"):
        if k in payload:
            setattr(w, k, payload[k])
    for ex in (payload.get("exercises") or []):
        we = db.query(WorkoutExercise).filter(
            WorkoutExercise.id == ex.get("workout_exercise_id"),
            WorkoutExercise.user_id == user.id).first()
        if not we:
            continue
        for s in (ex.get("sets") or []):
            existing = (db.query(WorkoutSet)
                        .filter(WorkoutSet.workout_exercise_id == we.id,
                                WorkoutSet.set_number == s.get("set_number", 1)).first())
            values = {k: s[k] for k in ("reps", "weight", "rir", "duration_seconds", "completed") if k in s}
            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
            else:
                db.add(WorkoutSet(user_id=user.id, workout_exercise_id=we.id,
                                  set_number=s.get("set_number", 1), **values))
    if payload.get("status") == "completed" and w.status != "completed":
        award_xp(db, user.id, "workout_completed", "workout", w.id)
        _check_records(db, user.id, w.id)
    db.commit()
    db.refresh(w)
    return _workout_dict(w)


def _check_records(db: Session, user_id: int, workout_id: int):
    """Update personal records from logged sets (best weight per exercise)."""
    for we in db.query(WorkoutExercise).filter(WorkoutExercise.workout_id == workout_id,
                                               WorkoutExercise.user_id == user_id).all():
        sets = db.query(WorkoutSet).filter(WorkoutSet.workout_exercise_id == we.id).all()
        best = max((s.weight or 0 for s in sets), default=0)
        if best <= 0:
            continue
        current = (db.query(PersonalRecord)
                   .filter(PersonalRecord.user_id == user_id,
                           PersonalRecord.exercise_name == we.name,
                           PersonalRecord.metric == "weight").first())
        if not current or best > current.value:
            db.add(PersonalRecord(user_id=user_id, exercise_name=we.name, metric="weight",
                                  value=best, unit="kg", workout_id=workout_id,
                                  date=datetime.now()))


@router.delete("/workouts/{workout_id}", status_code=204)
def delete_workout(workout_id: int, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    db.delete(_workout(db, user.id, workout_id))
    db.commit()


@router.get("/records")
def list_records(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (db.query(PersonalRecord).filter(PersonalRecord.user_id == user.id)
            .order_by(PersonalRecord.date.desc()).all())


@router.get("/stats")
def fitness_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Weekly volume (tonnage), consistency, PR count — real logged data only."""
    since = datetime.now() - timedelta(days=8 * 7)
    workouts = (db.query(Workout)
                .filter(Workout.user_id == user.id, Workout.status == "completed",
                        Workout.date >= since).order_by(Workout.date).all())
    by_week: dict[str, float] = {}
    for w in workouts:
        week = (w.date - timedelta(days=w.date.weekday())).strftime("%Y-%m-%d")
        volume = 0.0
        for we in db.query(WorkoutExercise).filter(WorkoutExercise.workout_id == w.id).all():
            for s in db.query(WorkoutSet).filter(WorkoutSet.workout_exercise_id == we.id).all():
                volume += (s.weight or 0) * (s.reps or 0)
        by_week[week] = by_week.get(week, 0.0) + round(volume, 1)
    prs = db.query(PersonalRecord).filter(PersonalRecord.user_id == user.id).count()
    return {
        "weekly_volume": [{"week": k, "volume": v} for k, v in sorted(by_week.items())],
        "workouts_completed": len(workouts),
        "personal_records": prs,
        "consistency_pct": round(100 * len(workouts) / 56, 1),
    }


@router.post("/workouts/generate")
def generate_workout(payload: dict, user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    """AI-generated session based on goal, experience, equipment, time. Honest 501 without engine."""
    if not gemini.is_configured():
        raise HTTPException(501, "The AI engine is not connected yet — set GEMINI_API_KEY to "
                                 "generate personalized workouts. You can still create workouts "
                                 "manually from the exercise library.")
    context = build_context(db, user.id)
    prompt = (
        f"Design ONE training session as JSON. User context:\n{context}\n\n"
        f"Request: {payload}\n"
        'Return JSON only: {"title": str, "notes": str, "exercises": [{"name": str, "sets": int, '
        '"reps": str, "rest_seconds": int, "muscle_groups": [str]}]}. '
        "Use evidence-based programming appropriate to the experience level; never prescribe "
        "dangerous volume. 4-8 exercises."
    )
    data = gemini.generate_json(prompt)
    if not data:
        raise HTTPException(502, "The AI engine couldn't build a workout just now. Try again.")
    return data
