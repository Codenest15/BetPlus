from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.catalog import router as catalog_router
from app.api.wallet import router as wallet_router

app = FastAPI(title="BetPlus Backend")

app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(catalog_router, prefix="/api/catalog", tags=["catalog"])
app.include_router(wallet_router, prefix="/api/wallet", tags=["wallet"])


@app.on_event("startup")
def on_startup():
    # create tables if they don't exist (simple init)
    from app.db.session import init_db
    from app.seed import seed_demo_data

    init_db()
    seed_demo_data()
