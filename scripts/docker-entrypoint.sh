#!/usr/bin/env bash
set -e

echo "[Docker] HireEase Services Container Starting..."

# Ensure volume directories exist
mkdir -p /app/public/resumes /app/backups /app/logs /app/.wrangler/state

# Initialize database if volume is empty or new
if [ ! -f /app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite ] 2>/dev/null; then
    echo "[Docker] Initializing fresh SQLite / D1 database with 1245 jobs..."
    python3 /app/scripts/setup-database.py
else
    echo "[Docker] Existing database detected. Verifying integrity..."
    python3 /app/scripts/setup-database.py --verify-only || python3 /app/scripts/setup-database.py
fi

echo "[Docker] Starting HireEase production web server..."
exec "$@"
