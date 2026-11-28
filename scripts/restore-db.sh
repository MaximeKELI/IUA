#!/usr/bin/env bash
# Restore from pg_dump custom format. DESTRUCTIVE — confirm target DB.
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
DUMP=${1:?Usage: restore-db.sh path/to/iua-*.dump}
echo "Restoring $DUMP into $DATABASE_URL"
pg_restore --clean --if-exists --no-owner --no-acl -d "$DATABASE_URL" "$DUMP"
echo "OK restore complete — run migrate if needed"
