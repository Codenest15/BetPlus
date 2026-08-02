from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def register_and_token(email: str = "buser@example.com"):
    client.post("/api/auth/register", json={"email": email, "password": "secret"})
    resp = client.post(
        "/api/auth/login", data={"username": email, "password": "secret"}
    )
    return resp.json().get("access_token")


def test_place_bet_and_list():
    token = register_and_token()
    # deposit to have balance
    client.post(
        "/api/wallet/deposit",
        json={"amount": 100, "description": "seed"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # place bet
    resp = client.post(
        "/api/bets/place",
        json={"stake": 10, "odds": 2.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    bet = resp.json()
    assert bet["stake"] == 10 or bet["stake"] == 10.0

    # list my bets
    resp = client.get("/api/bets/my", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
