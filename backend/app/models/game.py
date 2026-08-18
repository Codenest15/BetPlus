from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.sql import func

from app.db.base import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(64), unique=True, index=True, nullable=False)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    home = Column(String, nullable=False)
    away = Column(String, nullable=False)
    home_abbr = Column(String(8), nullable=True)
    away_abbr = Column(String(8), nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="scheduled")
    is_live = Column(Integer, default=0)
    live_minute = Column(Integer, nullable=True)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    odds_home = Column(Numeric(12, 4), nullable=True)
    odds_draw = Column(Numeric(12, 4), nullable=True)
    odds_away = Column(Numeric(12, 4), nullable=True)
    manager_status = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
