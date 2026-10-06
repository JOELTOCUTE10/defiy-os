"""Defiy OS — FastAPI app entry point."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401 — register all models
from app.api import (auth, profile, quotes, dashboard, chat, goals, fitness, nutrition,
                     sleep, habits, wellbeing, school, notes, finance, reminders,
                     notifications, gamification)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("defiy")

app = FastAPI(title="Defiy OS", version="1.0.0",
              description="One AI that helps you run your life.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = "/api"
for r in (auth.router, profile.router, quotes.router, dashboard.router, chat.router,
          goals.router, fitness.router, nutrition.router, sleep.router, habits.router,
          wellbeing.router, school.router, notes.router, finance.router, reminders.router,
          notifications.router, gamification.router):
    app.include_router(r, prefix=API)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _seed_catalogs()
    logger.info("Defiy OS ready. AI engine: %s",
                "Gemini (connected)" if settings.GEMINI_API_KEY else "not connected")


def _seed_catalogs():
    """Seed global catalogs (exercises, achievements) once — idempotent."""
    from app.data.exercises import EXERCISES_DATABASE
    from app.models.fitness import Exercise
    from app.models.gamification import Achievement

    db = SessionLocal()
    try:
        if db.query(Exercise).count() == 0:
            for e in EXERCISES_DATABASE:
                db.add(Exercise(user_id=None, name=e["name"],
                                muscle_groups=e.get("muscle_groups"),
                                equipment=e.get("equipment"),
                                category=e.get("category", "strength"),
                                instructions=e.get("instructions")))
            db.commit()
        if db.query(Achievement).count() == 0:
            for a in (
                {"code": "first_step", "name": "First Step", "icon": "footprints",
                 "description": "Earn your first 10 XP.", "points_required": 10},
                {"code": "getting_started", "name": "Getting Started", "icon": "sparkles",
                 "description": "Reach 100 XP.", "points_required": 100},
                {"code": "consistent", "name": "Consistency Kid", "icon": "flame",
                 "description": "Reach 500 XP.", "points_required": 500},
                {"code": "high_roller", "name": "Life Runner", "icon": "rocket",
                 "description": "Reach 1000 XP.", "points_required": 1000},
                {"code": "unstoppable", "name": "Unstoppable", "icon": "trophy",
                 "description": "Reach 2500 XP.", "points_required": 2500},
            ):
                db.add(Achievement(**a))
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"app": "Defiy OS", "status": "ok",
            "docs": "/docs"}


@app.get(API + "/health")
def health():
    return {"status": "ok"}
