# IUA — Runbook ops (staging / production)

## Health probes

| Probe | URL | Expect |
|-------|-----|--------|
| Liveness | `GET /health/live/` | 200 `{status:alive}` |
| Readiness | `GET /health/ready/` | 200 db+cache OK |
| Aggregate | `GET /health/` | 200 / 503 degraded |
| Metrics | `GET /health/metrics/` | Prometheus text |

Wire k8s/compose: liveness → `/health/live/`, readiness → `/health/ready/`.

## Backups

```bash
export DATABASE_URL=postgres://...
./scripts/backup-db.sh
# restore (staging only until verified)
./scripts/restore-db.sh backups/iua-YYYYMMDD.dump
```

Schedule daily via cron/CI; store offsite encrypted. Test restore monthly.

## Retention purge

Celery task `core.purge_expired_records` — seed `DataRetentionPolicy` rows then:

```bash
celery -A config call core.purge_expired_records
```

Suspicious logins: `core.detect_suspicious_logins`.

## Secrets

Never commit `.env`. Production: `IUA_EXPOSE_TOKENS_IN_BODY=false`, `NEXT_PUBLIC_COOKIE_ONLY_AUTH=true`, `IUA_REQUIRE_MFA_ENROLLMENT=true`.
