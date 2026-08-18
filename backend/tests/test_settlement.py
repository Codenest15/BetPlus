def test_settlement_requires_admin(client):
    token_register = client.post(
        "/api/v1/auth/register",
        json={"name": "User", "email": "user@example.com", "password": "secret"},
    )
    assert token_register.status_code == 201
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "user@example.com", "password": "secret"},
    )
    token = login.json()["access_token"]
    resp = client.post(
        "/api/v1/admin/settlement/run",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
