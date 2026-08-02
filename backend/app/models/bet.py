from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stake = Column(Float, nullable=False)
    odds = Column(Float, nullable=False)
    status = Column(String, default="open")  # open | won | lost | void
    payout = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    settled_at = Column(DateTime, nullable=True)
