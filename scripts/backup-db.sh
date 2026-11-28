#!/usr/bin/env bash
# Postgres logical backup for IUA Digital Campus
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL (postgres://...)}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/iua-$STAMP.dump"
echo "Backing up to $FILE"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" -f "$FILE"
echo "OK $FILE"
