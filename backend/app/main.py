from fastapi import FastAPI, Request
from starlette.responses import Response

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.catalog import router as catalog_router
from app.api.wallet import router as wallet_router
from app.api.admin.settlement import router as admin_settlement_router
from app.api.bets import router as bets_router
from app.core.logging import init_logging

app = FastAPI(title="BetPlus Backend")


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Basic request logging and security headers
    from logging import getLogger

    logger = getLogger("app.middleware")
    logger.info(f"{request.method} {request.url}")
    response: Response = await call_next(request)
    # security headers
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "geolocation=()")
    return response


app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(catalog_router, prefix="/api/catalog", tags=["catalog"])
app.include_router(wallet_router, prefix="/api/wallet", tags=["wallet"])
app.include_router(
    admin_settlement_router,
    prefix="/api/admin/settlement",
    tags=["admin", "settlement"],
)
app.include_router(bets_router, prefix="/api/bets", tags=["bets"])


@app.on_event("startup")
def on_startup():
    # initialize logging
    init_logging()
    # create tables if they don't exist (simple init)
    from app.db.session import init_db
    from app.seed import seed_demo_data

    init_db()
    seed_demo_data()
