def test_register_login_and_me(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "phone": "+233241234567",
            "password": "secret",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "testuser@example.com"
    assert data["name"] == "Test User"
    assert "hashed_password" not in data
    assert isinstance(data["id"], str)

    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser@example.com", "password": "secret"},
    )
    assert resp.status_code == 200
    token = resp.json().get("access_token")
    assert token

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "testuser@example.com"


def test_login_with_phone(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Phone User",
            "email": "phoneuser@example.com",
            "phone": "+233209998877",
            "password": "secret",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "+233209998877", "password": "secret"},
    )
    assert resp.status_code == 200
