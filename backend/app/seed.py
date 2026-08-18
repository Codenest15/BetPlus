from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.game import Game
from app.models.league import League
from app.models.sport import Sport
from app.models.user import User


def seed_demo_data():
    db: Session = SessionLocal()
    try:
        if db.query(Sport).count() == 0:
            football = Sport(name="Football", slug="football")
            basketball = Sport(name="Basketball", slug="basketball")
            db.add_all([football, basketball])
            db.commit()
            db.refresh(football)
            db.refresh(basketball)
            epl = League(sport_id=football.id, name="English Premier League", slug="epl")
            laliga = League(sport_id=football.id, name="La Liga", slug="la-liga")
            nba = League(sport_id=basketball.id, name="NBA", slug="nba")
            db.add_all([epl, laliga, nba])
            db.commit()
            db.refresh(epl)

            now = datetime.now(timezone.utc)
            db.add_all(
                [
                    Game(
                        external_id="m1",
                        league_id=epl.id,
                        home="Arsenal",
                        away="Chelsea",
                        home_abbr="ARS",
                        away_abbr="CHE",
                        starts_at=now + timedelta(hours=2),
                        status="scheduled",
                        odds_home=2.15,
                        odds_draw=3.40,
                        odds_away=3.20,
                    ),
                    Game(
                        external_id="m2",
                        league_id=epl.id,
                        home="Liverpool",
                        away="Manchester City",
                        home_abbr="LIV",
                        away_abbr="MCI",
                        starts_at=now + timedelta(hours=4),
                        status="scheduled",
                        odds_home=2.80,
                        odds_draw=3.50,
                        odds_away=2.45,
                    ),
                ]
            )
            db.commit()

        if db.query(User).filter(User.email == "demo@betplus.local").count() == 0:
            demo = User(
                name="Demo Admin",
                email="demo@betplus.local",
                phone="+10000000001",
                hashed_password=get_password_hash("demo123"),
                balance=100.0,
                is_admin=True,
            )
            db.add(demo)
            db.commit()
    finally:
        db.close()
