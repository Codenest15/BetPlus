web: sh -c "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1"
release: sh -c "cd backend && python -m app.db.migrate"
worker: sh -c "cd backend && python -m app.workers.live_sync_worker"
worker-settlement: sh -c "cd backend && python -m app.workers.settlement_worker"
