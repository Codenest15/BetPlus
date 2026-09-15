# BetPlus production deployment

Target architecture:

```text
Internet
   │
   ▼
Vercel (Next.js)          https://yourdomain.com
    │  HTTPS  /api/v1/*
    ▼
Heroku (FastAPI/Uvicorn)  https://api.yourdomain.com
    │  PostgreSQL
    ▼
Supabase PostgreSQL
```

The browser talks only to Vercel (Vercel rewrites `/api/v1/*` to FastAPI).
The browser never receives `DATABASE_URL`, payment secrets, or JWT secrets.

Authentication uses an HTTP-only `betplus_access_token` cookie set by FastAPI.
Do not persist JWTs in `localStorage` or `sessionStorage`.

This application is **not real-money ready** until:

- `PAYMENTS_MODE=moolre`
- sandbox then live Moolre credentials are configured
- a real provider transaction has been reconciled
- webhook callback secret verification has been proven in staging
- a database restore test has been run

---

## 1. Supabase PostgreSQL

1. Create a project.
2. Copy the **URI** (direct port 5432 or pooler port 6543).
3. Enable backups on the chosen plan (Point-in-Time Recovery on paid plans).
4. Restore procedure: Supabase Dashboard → Database → Backups → Restore to a
   **staging** project. Confirm `alembic current` and a login + wallet read.
5. Recommended backup settings:
   - Daily backups (plan default)
   - PITR retention per plan
   - Restore test at least once before production traffic

Set on Heroku (never on Vercel):

```text
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

`postgres://` URLs are accepted and normalized. SSL is added in production.

Production schema is created only with Alembic (`python -m app.db.migrate`).
Do **not** use `Base.metadata.create_all()` in production.

---

## 2. Heroku (FastAPI)

Preferred: set the app **root directory** to `backend/` so Heroku uses
`backend/Procfile`, `backend/requirements.txt`, and `backend/runtime.txt`.

```bash
cd backend
heroku create betplus-api
heroku config:set ENVIRONMENT=production
heroku config:set SECRET_KEY="$(python -c "import secrets; print(secrets.token_urlsafe(48))")"
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
heroku config:set SEED_DEMO_DATA=false
heroku config:set SEED_DEMO_USERS=false
heroku config:set ALLOW_DEMO_SEED=false
heroku config:set RATE_LIMIT_ENABLED=true
heroku config:set PAYMENTS_MODE=moolre
heroku config:set MOOLRE_ENV=sandbox
heroku config:set MOOLRE_API_BASE_URL=https://sandbox.moolre.com
heroku config:set MOOLRE_API_USER=...
heroku config:set MOOLRE_PUBLIC_KEY=...
heroku config:set MOOLRE_API_KEY=...
heroku config:set MOOLRE_ACCOUNT_NUMBER=...
heroku config:set MOOLRE_WEBHOOK_SECRET=...
heroku config:set PAYMENT_CURRENCY=GHS
```

Process types:

| Dyno | Command |
|------|---------|
| `web` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1` |
| `release` | `python -m app.db.migrate` |
| `worker` | `python -m app.workers.live_sync_worker` |
| `worker-settlement` | `python -m app.workers.settlement_worker` |

Scale after deploy:

```bash
heroku ps:scale web=1 worker=1 worker-settlement=1
```

Staging (simulated money only):

```bash
heroku config:set ENVIRONMENT=staging
heroku config:set PAYMENTS_MODE=simulated
heroku config:set ALLOW_SIMULATED_PAYMENTS=true
heroku config:set SEED_DEMO_DATA=true
heroku config:set SEED_DEMO_USERS=false
heroku config:set CORS_ORIGINS="https://staging.yourdomain.com,http://localhost:3000"
```

Deploy from repo root with the backend as the app root, or:

```bash
git subtree push --prefix backend heroku main
```

Release phase runs Alembic. Do **not** use `create_all()` in production.

Verify:

```text
GET https://api.yourdomain.com/health/        → {"status":"ok"}
GET https://api.yourdomain.com/health/ready   → database reachable
```

The process binds `0.0.0.0:$PORT`.

---

## 3. Vercel (Next.js)

Environment variables (Production and Preview):

```text
NEXT_PUBLIC_USE_BACKEND=true
BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

Do not set `DATABASE_URL`, `SECRET_KEY`, or payment secrets on Vercel.

`BACKEND_URL` is read when Next.js **builds** rewrites. Change it → redeploy.

```bash
npx vercel --prod
```

Verify:

- Homepage loads
- Login hits `/api/v1/auth/login` through the rewrite and sets the HTTP-only cookie
- Catalog loads `/api/v1/catalog/games`
- Wallet deposits go to FastAPI, not localStorage

---

## 4. Moolre

Collection (deposits) uses:

- `POST {base}/open/transact/payment`
- Headers: `X-API-USER`, `X-API-PUBKEY`
- Payer phone in local `0`-prefixed Ghana format
- Channels: `MTN`, `TELECEL`, `AT`

Status uses:

- `POST {base}/open/transact/status`
- Headers: `X-API-USER`, `X-API-PUBKEY` (collections) or `X-API-KEY` (transfers)
- Success is `data.txstatus == 1`, not envelope `status == 1`

Transfers / withdrawals use:

- `POST {base}/open/transact/transfer`
- Headers: `X-API-USER`, `X-API-KEY` (private key)

Callbacks:

- `POST /api/v1/payments/webhook`
- Authenticity is the payload `data.secret` compared to `MOOLRE_WEBHOOK_SECRET`
- Wallet credit happens only after a status API verification

Configure the callback URL in the Moolre dashboard to:

```text
https://api.yourdomain.com/api/v1/payments/webhook
```

### Switching sandbox → live

1. Complete a sandbox deposit, webhook, and withdrawal restore test.
2. Set `MOOLRE_ENV=production`.
3. Set `MOOLRE_API_BASE_URL=https://api.moolre.com`.
4. Replace sandbox `MOOLRE_*` values with live credentials.
5. Redeploy the Heroku API. Do not change frontend env for Moolre secrets.

`MOOLRE_ENV=sandbox` refuses the live API URL.

---

## Required backend environment

| Variable | Production |
|----------|------------|
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | Supabase PostgreSQL |
| `SECRET_KEY` | strong random, unique |
| `CORS_ORIGINS` | exact Vercel/custom origins, no `*` |
| `SEED_DEMO_DATA` | `false` |
| `SEED_DEMO_USERS` | `false` |
| `PAYMENTS_MODE` | `moolre` for live money; `simulated` only with `ALLOW_SIMULATED_PAYMENTS=true` on staging |
| `MOOLRE_ENV` | `sandbox` until go-live, then `production` |
| `MOOLRE_*` | provider keys and callback secret |
| `RATE_LIMIT_ENABLED` | `true` |

---

## Staging checklist

- [ ] Alembic head applied (`007_webhook_events`)
- [ ] Health and ready endpoints 200
- [ ] Register / login / `/me` using the HTTP-only cookie
- [ ] Catalog games from PostgreSQL
- [ ] Bet placement uses server odds (tampered client odds ignored)
- [ ] Concurrent withdrawals/bets against Postgres (`POSTGRES_TEST_URL`)
- [ ] Double settlement does not double-pay
- [ ] Admin/manager 403 for normal users
- [ ] Demo passwords not seeded
- [ ] CORS rejects unknown origins
- [ ] Backup restore tested on a staging database
- [ ] Moolre callback `data.secret` verified with `MOOLRE_WEBHOOK_SECRET`
- [ ] Duplicate callback does not double-credit
- [ ] Worker and settlement dynos are running

## Rollback

1. `heroku rollback` the API release.
2. Do **not** run Alembic downgrades against production unless the downgrade
   is reviewed; prefer a forward fix.
3. Keep the previous Vercel deployment available for instant revert.
