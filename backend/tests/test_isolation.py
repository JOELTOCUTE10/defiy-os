from tests.conftest import auth_headers


def test_user_isolation(client):
    """User B must never see user A's data."""
    ha = auth_headers(client, email="a@test.io")
    hb = auth_headers(client, email="b@test.io")

    r = client.post("/api/notes", json={"title": "A's secret", "content": "hi"},
                    headers=ha)
    assert r.status_code == 201

    r = client.get("/api/notes", headers=hb)
    assert r.status_code == 200
    assert r.json() == []

    r = client.get("/api/notes", headers=ha)
    assert len(r.json()) == 1
