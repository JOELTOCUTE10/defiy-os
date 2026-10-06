"""Application configuration. All secrets come from environment variables — never hard-coded."""
import os


class Settings:
    APP_NAME: str = "Defiy OS"
    API_PREFIX: str = "/api"

    # Database. Defaults to a local SQLite file so the app runs anywhere;
    # set DATABASE_URL to a Postgres connection string in production.
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL", "sqlite:///./defiy.db"
    )

    # Auth
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "dev-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_HOURS: int = int(os.environ.get("JWT_EXPIRES_HOURS", "168"))

    # AI engine (Google Gemini). If unset, the chat endpoint says so honestly
    # instead of pretending; explicit command parsing still works.
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    AI_ENABLED: bool = bool(GEMINI_API_KEY)

    # Push notifications: provider is pluggable. None configured = reminders are
    # stored & marked scheduled, and the UI clearly says push is not yet connected.
    PUSH_PROVIDER: str = os.environ.get("PUSH_PROVIDER", "")  # e.g. "expo", "fcm"

    # CORS
    ALLOWED_ORIGINS: list = [
        o.strip()
        for o in os.environ.get(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
        if o.strip()
    ]

    # Password hashing (PBKDF2-HMAC-SHA256, stdlib — no native deps)
    PBKDF2_ITERATIONS: int = 600_000


settings = Settings()
