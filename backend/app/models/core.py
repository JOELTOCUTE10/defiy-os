"""Core models: users, profiles, AI conversations, notification architecture."""
from sqlalchemy import Column, JSON, Boolean, DateTime, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(512), nullable=False)
    created_date = created_col()
    updated_date = updated_col()


class Profile(Base):
    """Onboarding answers + preferences. Optional fields can be skipped."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(120), nullable=False)
    age_range = Column(String(20))          # e.g. "13-17", "18-24", "25-34"
    main_goals = Column(JSON)              # list of strings
    fitness_experience = Column(String(30))  # beginner / intermediate / advanced
    equipment = Column(JSON)               # list of strings
    typical_schedule = Column(String(200))
    school_work_info = Column(String(200))
    sleep_preferences = Column(String(200))
    finance_goals = Column(JSON)
    notification_prefs = Column(JSON)
    units = Column(String(10))               # "metric" | "imperial"
    theme = Column(String(10))               # "light" | "dark" | "system"
    xp_enabled = Column(Boolean, default=True)
    smart_reminders_enabled = Column(Boolean, default=True)
    onboarded = Column(Boolean, default=False)
    created_date = created_col()
    updated_date = updated_col()


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(200), default="New conversation")
    created_date = created_col()
    updated_date = updated_col()


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(String(20))      # "user" | "assistant"
    content = Column(Text)        # message text
    actions = Column(JSON)       # [{action, summary, result_id, status}] executed by the AI, for confirmation UI
    source = Column(String(20))    # "text" | "voice"
    created_date = created_col()


class AIRecommendation(Base):
    """Smart-reminder / suggestion candidates proposed by the AI; user accepts or dismisses."""
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    kind = Column(String(40))       # e.g. "workout_reminder", "study_plan"
    text = Column(Text)
    payload = Column(JSON)        # action to run if accepted
    status = Column(String(20))     # "pending" | "accepted" | "dismissed"
    created_date = created_col()


class DeviceToken(Base):
    """Push-notification device registration. Kept ready for a real provider (Expo/FCM/APNs)."""
    __tablename__ = "device_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token = Column(String(512), index=True, nullable=False)
    platform = Column(String(20))   # "web" | "ios" | "android"
    created_date = created_col()
