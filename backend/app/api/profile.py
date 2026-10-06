"""Profile + onboarding."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User, Profile
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_or_create(db: Session, user_id: int) -> Profile:
    p = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not p:
        p = Profile(user_id=user_id, name="Friend")
        db.add(p)
        db.commit()
        db.refresh(p)
    return p


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_or_create(db, user.id)


@router.put("", response_model=ProfileOut)
def update_profile(data: ProfileUpdate, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    p = _get_or_create(db, user.id)
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(p, k, v)
    if p.name and str(p.name).strip():
        p.onboarded = True
    db.commit()
    db.refresh(p)
    return p
