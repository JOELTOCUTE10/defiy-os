"""Notes: create, search, favorite, categorize."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.notes import Note
from app.services.xp import award_xp

router = APIRouter(prefix="/notes", tags=["notes"])


def _note(db: Session, user_id: int, note_id: int) -> Note:
    n = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if not n:
        raise HTTPException(404, "Note not found")
    return n


@router.get("")
def list_notes(q: str | None = None, category: str | None = None,
               favorite: bool | None = None, limit: int = 100,
               user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Note).filter(Note.user_id == user.id)
    if q:
        query = query.filter((Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%")))
    if category:
        query = query.filter(Note.category == category)
    if favorite is not None:
        query = query.filter(Note.favorite == favorite)
    return query.order_by(Note.updated_date.desc()).limit(min(limit, 200)).all()


@router.post("", status_code=201)
def create_note(data: dict, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    n = Note(user_id=user.id, title=data.get("title", "Untitled"),
             content=data.get("content", ""), category=data.get("category", "personal"),
             favorite=bool(data.get("favorite", False)), tags=data.get("tags"))
    db.add(n)
    db.commit()
    db.refresh(n)
    award_xp(db, user.id, "note_created", "note", n.id)
    return n


@router.get("/{note_id}")
def get_note(note_id: int, user: User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    return _note(db, user.id, note_id)


@router.post("/{note_id}/favorite")
def toggle_favorite(note_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    n = _note(db, user.id, note_id)
    n.favorite = not n.favorite
    db.commit()
    db.refresh(n)
    return n


@router.patch("/{note_id}")
def update_note(note_id: int, data: dict, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    n = _note(db, user.id, note_id)
    for k in ("title", "content", "category", "favorite", "tags"):
        if k in data:
            setattr(n, k, data[k])
    db.commit()
    db.refresh(n)
    return n


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    db.delete(_note(db, user.id, note_id))
    db.commit()
