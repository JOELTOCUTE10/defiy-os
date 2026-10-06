"""Chat with NO Gemini key: honest engine-off message + explicit commands still work."""
from tests.conftest import auth_headers


def test_chat_says_engine_not_connected(client):
    h = auth_headers(client)
    conv = client.post("/api/chat/conversations", json={}, headers=h).json()
    r = client.post(f"/api/chat/conversations/{conv['id']}/messages",
                    json={"content": "hey there"}, headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["no_engine"] is True
    assert "AI engine isn't connected" in body["message"]["content"]


def test_chat_creates_reminder_from_command(client):
    h = auth_headers(client)
    conv = client.post("/api/chat/conversations", json={}, headers=h).json()
    r = client.post(f"/api/chat/conversations/{conv['id']}/messages",
                    json={"content": "Remind me to study chemistry at 7 tonight"}, headers=h)
    body = r.json()
    assert body["no_engine"] is True
    assert len(body["actions_executed"]) == 1
    assert "reminder" in body["actions_executed"][0]["summary"].lower()
    assert client.get("/api/reminders?status=upcoming", headers=h).json()


def test_chat_logs_meal_from_command(client):
    h = auth_headers(client)
    conv = client.post("/api/chat/conversations", json={}, headers=h).json()
    r = client.post(f"/api/chat/conversations/{conv['id']}/messages",
                    json={"content": "I ate two eggs, toast and a banana"}, headers=h)
    assert r.status_code == 200
    assert any(a["action"] == "log_meal" for a in r.json()["actions_executed"])
    meals = client.get("/api/nutrition/meals", headers=h).json()
    assert len(meals) == 1


def test_workout_generation_honest_without_engine(client, monkeypatch):
    import app.ai.gemini as g
    monkeypatch.setattr(g, "is_configured", lambda: False)
    from app.api import fitness as f
    monkeypatch.setattr(f.gemini, "is_configured", lambda: False)
    h = auth_headers(client)
    r = client.post("/api/fitness/workouts/generate", json={"goal": "strength"}, headers=h)
    assert r.status_code == 501
    assert "not connected" in r.json()["detail"]


def test_notifications_status_honest(client):
    h = auth_headers(client)
    r = client.get("/api/notifications/status", headers=h)
    assert r.status_code == 200
    assert r.json()["connected"] is False
    assert "not connected" in r.json()["message"]
