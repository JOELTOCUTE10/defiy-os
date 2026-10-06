from tests.conftest import auth_headers


def test_goals_flow(client):
    h = auth_headers(client)
    r = client.post("/api/goals", json={"name": "Save $500", "category": "money",
                                        "target_value": 500, "unit": "USD"}, headers=h)
    assert r.status_code == 201
    gid = r.json()["id"]

    r = client.post(f"/api/goals/{gid}/progress", json={"delta": 175}, headers=h)
    assert r.status_code == 200
    assert r.json()["current_value"] == 175

    r = client.post(f"/api/goals/{gid}/progress", json={"delta": 325}, headers=h)
    assert r.json()["status"] == "completed"


def test_reminders_flow(client):
    h = auth_headers(client)
    r = client.post("/api/reminders", json={"title": "Study chemistry",
                                            "remind_at": "2026-10-06T19:00:00",
                                            "category": "school"}, headers=h)
    assert r.status_code == 201
    rid = r.json()["id"]
    r = client.post(f"/api/reminders/{rid}/complete", headers=h)
    assert r.json()["completed"] is True
    assert client.get("/api/reminders?status=completed", headers=h).json()


def test_habit_toggle(client):
    h = auth_headers(client)
    hid = client.post("/api/habits", json={"name": "Read"}, headers=h).json()["id"]
    r = client.post(f"/api/habits/{hid}/complete", json={}, headers=h)
    assert r.json()["done"] is True
    # complete again on same day -> still True (idempotent), then remove
    r = client.post(f"/api/habits/{hid}/complete", json={}, headers=h)
    assert r.json()["done"] is True
    from datetime import date as _d
    client.delete(f"/api/habits/{hid}/complete/{_d.today().isoformat()}", headers=h)
    r = client.get("/api/habits/progress", headers=h)
    assert r.json()["done_today"] == 0


def test_meal_logging_and_daily_totals(client):
    h = auth_headers(client)
    r = client.post("/api/nutrition/meals", json={
        "title": "Breakfast", "meal_type": "breakfast",
        "items": [{"name": "chicken breast", "quantity": 150, "unit": "g"}]}, headers=h)
    assert r.status_code == 201
    r = client.get("/api/nutrition/daily", headers=h)
    assert r.status_code == 200
    assert r.json()["calories"] > 0   # from reference table
    assert r.json()["protein_g"] > 25  # 150g chicken ~46g protein


def test_savings_contribution(client):
    h = auth_headers(client)
    gid = client.post("/api/finance/savings-goals", json={"name": "Emergency fund",
                                                  "target_amount": 500}, headers=h).json()["id"]
    r = client.post(f"/api/finance/savings-goals/{gid}/contribute", json={"amount": 175}, headers=h)
    assert r.json()["current_amount"] == 175
    summary = client.get("/api/finance/summary", headers=h).json()
    assert summary["savings"] == 175
