from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.services.bet_service import SettlementService

router = APIRouter()


@router.post("/run")
def run_settlement(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    settled = SettlementService.run_open_bets(db)
    return {
        "settled": len(settled),
        "results": [
            {"bet_id": b.id, "status": b.status, "payout": float(b.payout or 0)}
            for b in settled
        ],
    }
