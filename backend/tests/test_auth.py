from tests.conftest import auth_headers


def test_register_login_me(client):
    h = auth_headers(client)
    r = client.get("/api/auth/me", headers=h)
    assert r.status_code == 200
    assert r.json()["email"] == "user@test.io"


def test_login_wrong_password(client):
    auth_headers(client)
    r = client.post("/api/auth/login",
                    json={"email": "user@test.io", "password": "nope12345"})
    assert r.status_code == 401


def test_duplicate_email_rejected(client):
    auth_headers(client)
    r = client.post("/api/auth/register",
                    json={"email": "user@test.io", "password": "password123"})
    assert r.status_code == 409


def test_short_password_rejected(client):
    r = client.post("/api/auth/register",
                    json={"email": "a@b.io", "password": "short"})
    assert r.status_code == 400


def test_no_token_401(client):
    assert client.get("/api/auth/me").status_code == 401
