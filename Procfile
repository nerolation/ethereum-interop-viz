web: mkdir -p /app/data/mainnet /app/data/sepolia /app/data/holesky && gunicorn app:app
worker: mkdir -p /app/data/mainnet /app/data/sepolia /app/data/holesky && python -m backend.scheduler 