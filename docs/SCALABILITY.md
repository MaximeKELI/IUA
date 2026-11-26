# IUA Digital Campus — Performance & Scalabilité (millions d'enregistrements)

## Objectif

Le SIU doit absorber la croissance (étudiants, notes, paiements, logs, notifications)
sans dégrader les temps de réponse des portails.

---

## 1. Principes

| Principe | Application |
|----------|-------------|
| Pagination curseur | Listes massives (`students`, `enrollments`, `notifications`) |
| Pas de `OFFSET` profond | Évite les scans O(n) au-delà de quelques milliers |
| Index ciblés | Filtres métier (`status`, `program`, `academic_year`, dates) |
| Cache court | KPI direction / admin (30s), dashboards individuels (20s) |
| Bulk I/O | Imports via `bulk_create_chunked` / jobs Celery |
| Async | Emails, PDF, outbox, exports hors requête HTTP |
| Lecture seule API | `only()` / `select_related` / `prefetch_related` |

---

## 2. Volumes cibles (ordres de grandeur)

| Entité | Volume réaliste multi-années | Stratégie |
|--------|------------------------------|-----------|
| Users / Students | 10⁵ – 10⁶ | Index + cursor + partition logique par année |
| Enrollments | 10⁶+ | Index composite année/statut + cursor |
| Grades | 10⁶ – 10⁷ | Partition par année académique (Phase notes) |
| Notifications | 10⁶+ | Cursor + TTL / archivage |
| Audit / Outbox | 10⁶+ | Retention + tables chaudes/froides |
| Documents | Go–To | Object storage (MinIO/S3), métadonnées en DB |

---

## 3. Frontend

- Images AVIF/WebP + cache long sur `/brand/*`
- `framer-motion` via `optimizePackageImports`
- Timeout API 12s + cache mémoire court des dashboards
- Compression HTTP Next (`compress: true`)
- Headers sécurité + cache assets

---

## 4. Backend

- Throttling API (anon/user/login)
- Redis cache (prod) / LocMem (dev)
- WhiteNoise compressé en prod
- Connexion DB `CONN_MAX_AGE` via `dj-database-url`
- Helpers `apps.core.bulk`

---

## 5. PostgreSQL (production)

Recommandations :

```sql
-- Exemple : table notes ultra-volumineuse (à appliquer module 07)
-- PARTITION BY RANGE (academic_year_id) ou par date de session
```

- `shared_buffers`, `effective_cache_size`, `work_mem` adaptés à la RAM
- Autovacuum agressif sur tables append-only (events, audit)
- Read replicas pour BI (module 16) si charge lecture élevée
- PgBouncer en transaction pooling devant Django

---

## 6. Horizontal scaling

```
CDN / Nginx  →  Next.js (N replicas)
             →  Gunicorn/Uvicorn (N workers)
             →  PostgreSQL primary (+ replicas lecture)
             →  Redis (cache + broker)
             →  Celery workers (K)
             →  MinIO/S3
```

---

## 7. Ce qui est déjà en place dans le code

- Cursor pagination : étudiants, inscriptions, notifications
- Indexes : StudentProfile, Enrollment, TeachingAssignment
- Cache dashboards portail
- Bulk helpers
- Throttle login / API
- Next.js image/format/cache headers

---

## 8. Prochaines étapes (quand les modules grossissent)

1. Partitionnement notes / paiements / audit
2. Materialized views pour BI
3. OpenSearch pour recherche documentaire / catalogue
4. CDN edge pour assets et pages publiques
5. Load tests (k6/Locust) avant rentrée
