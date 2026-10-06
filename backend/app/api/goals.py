"""Goals + milestones + progress."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.goals import Goal, GoalMilestone
from app.schemas.goals import (GoalCreate, GoalUpdate, GoalOut, GoalProgressIn,
                               MilestoneCreate, MilestoneUpdate, MilestoneOut)
from app.services.xp import award_xp

router = APIRouter(prefix="/goals", tags=["goals"])


def _goal(db: Session, user_id: int, goal_id: int) -> Goal:
    g = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not g:
        raise HTTPException(404, "Goal not found")
    return g


@router.get("", response_model=list[GoalOut])
def list_goals(status: str | None = None, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    q = db.query(Goal).filter(Goal.user_id == user.id)
    if status:
        q = q.filter(Goal.status == status)
    return q.order_by(Goal.deadline.is_(None), Goal.deadline).all()


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(data: GoalCreate, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    g = Goal(user_id=user.id, **data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _goal(db, user.id, goal_id)


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, data: GoalUpdate, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    g = _goal(db, user.id, goal_id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return g


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_goal(db, user.id, goal_id))
    db.commit()


@router.post("/{goal_id}/progress", response_model=GoalOut)
def add_progress(goal_id: int, data: GoalProgressIn, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    g = _goal(db, user.id, goal_id)
    g.current_value += data.delta
    for m in g.milestones:
        if not m.completed and g.current_value >= m.target_value:
            m.completed = True
            m.completed_date = datetime.now()
            award_xp(db, user.id, "goal_milestone", "milestone", m.id)
    if g.target_value and g.current_value >= g.target_value:
        g.status = "completed"
        award_xp(db, user.id, "goal_completed", "goal", g.id)
    db.commit()
    db.refresh(g)
    return g


@router.get("/{goal_id}/milestones", response_model=list[MilestoneOut])
def list_milestones(goal_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    _goal(db, user.id, goal_id)
    return (db.query(GoalMilestone).filter(GoalMilestone.goal_id == goal_id)
            .order_by(GoalMilestone.target_value).all())


@router.post("/{goal_id}/milestones", response_model=MilestoneOut, status_code=201)
def create_milestone(goal_id: int, data: MilestoneCreate, user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    _goal(db, user.id, goal_id)
    m = GoalMilestone(user_id=user.id, goal_id=goal_id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.patch("/{goal_id}/milestones/{m_id}", response_model=MilestoneOut)
def update_milestone(goal_id: int, m_id: int, data: MilestoneUpdate,
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _goal(db, user.id, goal_id)
    m = (db.query(GoalMilestone)
         .filter(GoalMilestone.id == m_id, GoalMilestone.goal_id == goal_id,
                 GoalMilestone.user_id == user.id).first())
    if not m:
        raise HTTPException(404, "Milestone not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
        if k == "completed" and v:
            m.completed_date = datetime.now()
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{goal_id}/milestones/{m_id}", status_code=204)
def delete_milestone(goal_id: int, m_id: int, user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    _goal(db, user.id, goal_id)
    m = (db.query(GoalMilestone)
         .filter(GoalMilestone.id == m_id, GoalMilestone.goal_id == goal_id,
                 GoalMilestone.user_id == user.id).first())
    if m:
        db.delete(m)
        db.commit()
