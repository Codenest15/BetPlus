"""Import all models so SQLAlchemy metadata and Alembic see every table."""

from app.models.bet import Bet, BetSelection
from app.models.game import Game
from app.models.league import League
from app.models.platform_ledger import PlatformLedger
from app.models.sport import Sport
from app.models.transaction import Transaction
from app.models.user import User

__all__ = [
    "Bet",
    "BetSelection",
    "Game",
    "League",
    "PlatformLedger",
    "Sport",
    "Transaction",
    "User",
]
