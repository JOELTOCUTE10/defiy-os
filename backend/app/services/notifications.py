"""Notification backend interface.

Reminders are fully modeled (schedule, recurrence, pre-event timing, device
tokens) and delivered through a NotificationBackend. Until a real provider
(Expo / FCM / APNs) is configured, NotConnectedBackend is used: it stores
nothing as "sent" and the API reports push as not connected — the UI tells the
user the truth instead of pretending.

To add a provider later:
    1. Implement `send()` calling your provider's API (server-side).
    2. Register it in `get_backend()` based on settings.PUSH_PROVIDER.
Device tokens are already collected and stored via /api/notifications/register-token.
"""
from app.config import settings


class NotificationPayload:
    def __init__(self, token: str, title: str, body: str, data: dict | None = None):
        self.token = token
        self.title = title
        self.body = body
        self.data = data or {}


class NotificationBackend:
    name = "none"

    def send(self, payload: NotificationPayload) -> bool:
        raise NotImplementedError


class NotConnectedBackend(NotificationBackend):
    """Honest default: no provider wired yet. Nothing is marked as sent."""
    name = "not_connected"

    def send(self, payload: NotificationPayload) -> bool:
        return False


def get_backend() -> NotificationBackend:
    provider = settings.PUSH_PROVIDER.strip().lower()
    if not provider:
        return NotConnectedBackend()
    # Future: if provider == "expo": return ExpoBackend() etc.
    return NotConnectedBackend()


def is_connected() -> bool:
    return isinstance(get_backend(), NotConnectedBackend) is False
