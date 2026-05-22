#!/bin/bash
# Database backup script for Personal Resource Activation
# Usage: ./scripts/backup-db.sh [retention_days]
# Requires: Docker Compose running, gzip

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${1:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Dump from Docker Compose PostgreSQL
docker compose exec -T postgres pg_dump -U resource_activation resource_activation 2>/dev/null \
  | gzip > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  echo "[$(date)] Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "[$(date)] ERROR: Backup failed or empty"
  exit 1
fi

# Clean up old backups
DELETED=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "[$(date)] Cleaned $DELETED old backup(s), retaining ${RETENTION_DAYS} days"
echo "[$(date)] Backup complete."

# Optional: upload to S3/R2
# aws s3 cp "$BACKUP_FILE" "s3://your-bucket/backups/$(basename $BACKUP_FILE)" --endpoint-url "$OBJECT_STORAGE_ENDPOINT"
