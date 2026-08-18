def register_and_token(client, email: str = "wuser@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Wallet User", "email": email, "password": "secret"},
    )
    resp = client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret"}
    )
    return resp.json().get("access_token")


def test_deposit_withdraw_transactions(client):
    token = register_and_token(client)
    resp = client.post(
        "/api/v1/wallet/deposit",
        json={"amount": 50, "description": "Test deposit"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    tx = resp.json()
    assert tx["amount"] == 50 or tx["amount"] == 50.0
    assert "created_at" in tx

    resp = client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 20, "description": "Test withdraw"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    tx = resp.json()
    assert tx["amount"] == -20 or tx["amount"] == -20.0

    resp = client.get(
        "/api/v1/wallet/transactions", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    txs = resp.json()
    assert isinstance(txs, list)
    assert len(txs) >= 2


def test_insufficient_balance(client):
    token = register_and_token(client, "poor@example.com")
    resp = client.post(
        "/api/v1/wallet/withdraw",
        json={"amount": 10, "description": "Too much"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "Insufficient" in resp.json()["detail"]
