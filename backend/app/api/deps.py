"""Shared dependencies: DB session + current user."""
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import User
from app.security import decode_token


def get_current_user(authorization: str = Header(""), db: Session = Depends(get_db)) -> User:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_token(authorization.split(" ", 1)[1].strip())
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).get(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
