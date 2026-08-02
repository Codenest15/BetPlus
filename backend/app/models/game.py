from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    home = Column(String, nullable=False)
    away = Column(String, nullable=False)
    starts_at = Column(DateTime, nullable=True)
    status = Column(String, default="scheduled")
    created_at = Column(DateTime, server_default=func.now())
