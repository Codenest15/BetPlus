import random
from datetime import datetime
from typing import Tuple

from sqlalchemy.orm import Session

from app.models.bet import Bet
from app.models.user import User
from app.models.platform_ledger import PlatformLedger


def settle_single_bet(db: Session, bet: Bet) -> Tuple[Bet, float]:
    # naive random settle: win with probability 1/odds (not realistic)
    win_prob = min(0.95, max(0.01, 1.0 / max(1.0, bet.odds)))
    won = random.random() < win_prob
    payout = 0.0
    if won:
        payout = bet.stake * bet.odds
        bet.status = "won"
        # credit user
        user = db.query(User).get(bet.user_id)
        user.balance = (user.balance or 0.0) + payout
        db.add(user)
        # platform loses payout
        db.add(PlatformLedger(description=f"Payout bet {bet.id}", amount=-payout))
    else:
        bet.status = "lost"
        # platform gains stake
        db.add(
            PlatformLedger(description=f"Stake revenue bet {bet.id}", amount=bet.stake)
        )

    bet.payout = payout
    bet.settled_at = datetime.utcnow()
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return bet, payout


def run_settlement_pass(db: Session, limit: int = 50):
    open_bets = (
        db.query(Bet)
        .filter(Bet.status == "open")
        .order_by(Bet.created_at)
        .limit(limit)
        .all()
    )
    results = []
    for bet in open_bets:
        settled, payout = settle_single_bet(db, bet)
        results.append(
            {"bet_id": settled.id, "status": settled.status, "payout": payout}
        )
    return results
