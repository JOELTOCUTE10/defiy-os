"""Registration, login, me."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import User, Profile
from app.api.deps import get_current_user
from app.schemas.auth import RegisterIn, LoginIn, TokenOut, UserOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _ensure_profile(db: Session, user_id: int, email: str):
    if not db.query(Profile).filter(Profile.user_id == user_id).first():
        db.add(Profile(user_id=user_id, name=email.split("@")[0].title(), onboarded=False))
        db.commit()


@router.post("/register", response_model=TokenOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if not data.email or "@" not in data.email:
        raise HTTPException(400, "Enter a valid email address")
    if len(data.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(409, "An account with that email already exists")
    user = User(email=data.email.lower(), password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    _ensure_profile(db, user.id, user.email)
    return TokenOut(token=create_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return TokenOut(token=create_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
