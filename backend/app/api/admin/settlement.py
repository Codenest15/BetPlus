from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.settlement import run_settlement_pass

router = APIRouter()


@router.post("/run")
def run_settlement(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    # simple admin gate
    if not getattr(current_user, "is_admin", False):
        return {"error": "admin required"}
    results = run_settlement_pass(db)
    return {"settled": len(results), "results": results}
