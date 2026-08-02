from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def register_and_token(email: str = "wuser@example.com"):
    client.post("/api/auth/register", json={"email": email, "password": "secret"})
    resp = client.post(
        "/api/auth/login", data={"username": email, "password": "secret"}
    )
    return resp.json().get("access_token")


def test_deposit_withdraw_transactions():
    token = register_and_token()
    # deposit
    resp = client.post(
        "/api/wallet/deposit",
        json={"amount": 50, "description": "Test deposit"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    tx = resp.json()
    assert tx["amount"] == 50 or tx["amount"] == 50.0

    # withdraw
    resp = client.post(
        "/api/wallet/withdraw",
        json={"amount": 20, "description": "Test withdraw"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    tx = resp.json()
    assert tx["amount"] == -20 or tx["amount"] == -20.0

    # transactions list
    resp = client.get(
        "/api/wallet/transactions", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
