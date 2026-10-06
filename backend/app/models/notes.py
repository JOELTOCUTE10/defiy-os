"""Notes SQLAlchemy model: Note."""
from sqlalchemy import Column, JSON, Boolean, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    favorite = Column(Boolean, default=False)
    tags = Column(JSON, nullable=True)
    created_date = created_col()
    updated_date = updated_col()
