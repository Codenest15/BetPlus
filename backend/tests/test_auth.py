from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_register_login_and_me():
    # register
    resp = client.post(
        "/api/auth/register",
        json={"email": "testuser@example.com", "password": "secret"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "testuser@example.com"

    # login
    resp = client.post(
        "/api/auth/login",
        data={"username": "testuser@example.com", "password": "secret"},
    )
    assert resp.status_code == 200
    token = resp.json().get("access_token")
    assert token

    # me
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "testuser@example.com"
