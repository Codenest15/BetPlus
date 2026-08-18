def register_and_token(client, email: str = "buser@example.com"):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Bet User",
            "email": email,
            "password": "secret",
        },
    )
    resp = client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret"}
    )
    return resp.json().get("access_token")


def test_place_bet_and_list(client):
    token = register_and_token(client)
    resp = client.post(
        "/api/v1/wallet/deposit",
        json={"amount": 100, "description": "seed"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    resp = client.post(
        "/api/v1/bets/place/simple",
        json={"stake": 10, "odds": 2.5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    bet = resp.json()
    assert bet["stake"] == 10 or bet["stake"] == 10.0
    assert bet["booking_code"].startswith("BP")
    assert "placed_at" in bet

    resp = client.get("/api/v1/bets/my", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_place_multi_leg_bet(client):
    token = register_and_token(client, "multi@example.com")
    client.post(
        "/api/v1/wallet/deposit",
        json={"amount": 200, "description": "seed"},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = client.post(
        "/api/v1/bets/place",
        json={
            "stake": 25,
            "selections": [
                {
                    "match_id": "m1",
                    "home_team": "Arsenal",
                    "away_team": "Chelsea",
                    "selection": "home",
                    "selection_label": "Home",
                    "odds": 2.1,
                    "league": "Premier League",
                },
                {
                    "match_id": "m2",
                    "home_team": "Liverpool",
                    "away_team": "Manchester City",
                    "selection": "draw",
                    "selection_label": "Draw",
                    "odds": 3.5,
                    "league": "Premier League",
                },
                {
                    "match_id": "m3",
                    "home_team": "Real Madrid",
                    "away_team": "Barcelona",
                    "selection": "away",
                    "selection_label": "Away",
                    "odds": 2.8,
                    "league": "La Liga",
                },
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    bet = resp.json()
    assert len(bet["selections"]) == 3
    assert bet["bonus"] > 0
