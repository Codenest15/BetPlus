from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.sport import Sport
from app.models.league import League
from app.models.user import User


def seed_demo_data():
    db: Session = SessionLocal()
    try:
        # seed sports/leagues if empty
        if db.query(Sport).count() == 0:
            football = Sport(name="Football", slug="football")
            basketball = Sport(name="Basketball", slug="basketball")
            db.add_all([football, basketball])
            db.commit()
            db.refresh(football)
            db.refresh(basketball)
            db.add_all(
                [
                    League(
                        sport_id=football.id, name="English Premier League", slug="epl"
                    ),
                    League(sport_id=football.id, name="La Liga", slug="la-liga"),
                    League(sport_id=basketball.id, name="NBA", slug="nba"),
                ]
            )
            db.commit()

        # seed demo user
        if db.query(User).count() == 0:
            demo = User(
                email="demo@betplus.local",
                hashed_password="$2b$12$KIX0",
                balance=100.0,
                is_admin=True,
            )
            db.add(demo)
            db.commit()
    finally:
        db.close()
