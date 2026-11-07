#!/usr/bin/env bash
# ==============================================================================
# HireEase Services - Production Database Backup Script
# Creates WAL-safe timestamped SQLite backups and cleans up old archives.
# Recommended Cron: 0 3 * * * /path/to/hireease-site/scripts/backup-database.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"

mkdir -p "$BACKUP_DIR"

# Locate the active SQLite database
D1_DIR="${PROJECT_ROOT}/.wrangler/state/v3/d1/miniflare-D1DatabaseObject"
DB_FILE=""

if [ -d "$D1_DIR" ]; then
    for f in "$D1_DIR"/*.sqlite; do
        if [[ "$(basename "$f")" != metadata* ]] && [ -s "$f" ]; then
            DB_FILE="$f"
            break
        fi
    done
fi

if [ -z "$DB_FILE" ] || [ ! -f "$DB_FILE" ]; then
    echo "[ERROR] Could not find active database file in: $D1_DIR" >&2
    exit 1
fi

DEST_BACKUP="${BACKUP_DIR}/hireease_${TIMESTAMP}.sqlite"
DEST_GZ="${DEST_BACKUP}.gz"

echo "=================================================="
echo "    HireEase Services - Database Backup           "
echo "=================================================="
echo "Source: $DB_FILE"
echo "Target: $DEST_GZ"

# Safe online backup using SQLite backup API
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_FILE" ".backup '$DEST_BACKUP'"
    # Verify integrity
    INTEGRITY="$(sqlite3 "$DEST_BACKUP" "PRAGMA integrity_check;")"
    if [ "$INTEGRITY" != "ok" ]; then
        echo "[ERROR] Backup integrity check failed: $INTEGRITY" >&2
        rm -f "$DEST_BACKUP"
        exit 1
    fi
else
    # Fallback to file copy if sqlite3 CLI is absent
    cp "$DB_FILE" "$DEST_BACKUP"
fi

# Compress
gzip -f "$DEST_BACKUP"

BACKUP_SIZE="$(du -h "$DEST_GZ" | cut -f1)"
echo "[OK] Backup created successfully: $DEST_GZ ($BACKUP_SIZE)"

# Prune archives older than 14 days
find "$BACKUP_DIR" -name "hireease_*.sqlite.gz" -type f -mtime +14 -delete
echo "[OK] Cleaned up backups older than 14 days."
echo "=================================================="

