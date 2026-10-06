from tests.conftest import auth_headers


def test_dashboard_shape(client):
    h = auth_headers(client)
    client.put("/api/profile", json={"name": "Jordan", "onboarded": True}, headers=h)
    r = client.get("/api/dashboard", headers=h)
    assert r.status_code == 200
    d = r.json()
    assert d["greeting_name"] == "Jordan"
    assert d["quote"]["quote"]            # quote of the day present
    assert isinstance(d["focus_list"], list) and d["focus_list"]
    assert "calories_consumed" in d["stats"]


def test_quote_deterministic_per_day(client):
    h = auth_headers(client)
    q1 = client.get("/api/quotes/today", headers=h).json()
    q2 = client.get("/api/quotes/today", headers=h).json()
    assert q1 == q2


def test_xp_awarded_and_leveling(client):
    h = auth_headers(client)
    hid = client.post("/api/habits", json={"name": "Read"}, headers=h).json()["id"]
    for _ in range(3):
        client.post(f"/api/habits/{hid}/complete", json={}, headers=h)
        client.post(f"/api/habits/{hid}/complete", json={}, headers=h)  # toggle on/off keeps XP events
    r = client.get("/api/xp", headers=h)
    assert r.status_code == 200
    xp = r.json()
    assert xp["total_points"] >= 5
    assert xp["level"] >= 1
    assert xp["next_level_points"] > 0


def test_weekly_review_real_numbers(client):
    h = auth_headers(client)
    client.post("/api/habits", json={"name": "Read"}, headers=h)
    hid = client.get("/api/habits", headers=h).json()[0]["id"]
    client.post(f"/api/habits/{hid}/complete", json={}, headers=h)
    client.post("/api/nutrition/meals", json={
        "title": "Lunch", "items": [{"name": "chicken breast", "quantity": 100, "unit": "g"}]},
        headers=h)
    r = client.post("/api/weekly-review", headers=h)
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["habits_completed"] >= 1
    assert data["meals_logged"] >= 1
    assert "auto-computed" in r.json()["summary"]
