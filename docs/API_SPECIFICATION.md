# IUA DIGITAL CAMPUS — Spécification API

**Base URL :** `/api/v1/`  
**Format :** JSON  
**Auth :** Bearer JWT (access + refresh) + cookies httpOnly optionnels pour le web  
**Docs :** OpenAPI 3 (`/api/schema/`, `/api/docs/`)

---

## 1. Conventions

| Élément | Règle |
|---------|-------|
| Versioning | Préfixe `/api/v1/` |
| Erreurs | `{ "code", "message", "details?" }` |
| Pagination | `?page=&page_size=` → `{ count, next, previous, results }` |
| Filtres | Query params documentés |
| Idempotence | Header `Idempotency-Key` sur POST financiers |
| Temps | ISO-8601 UTC |
| IDs | UUID |

---

## 2. Auth & Identity

```
POST   /auth/login/
POST   /auth/refresh/
POST   /auth/logout/
POST   /auth/password/reset/
POST   /auth/password/reset/confirm/
POST   /auth/mfa/setup/
POST   /auth/mfa/verify/
GET    /auth/me/
GET    /users/
GET    /users/{id}/
GET    /roles/
GET    /permissions/
```

---

## 3. Référentiels académiques

```
GET|POST     /institutions/
GET|PATCH    /institutions/{id}/
GET|POST     /faculties/
GET|POST     /departments/
GET|POST     /programs/
GET|POST     /academic-years/
GET|POST     /cohorts/
GET|POST     /course-units/
GET|POST     /subjects/
GET|POST     /enrollments/
GET|POST     /teaching-assignments/
GET          /buildings/
GET          /rooms/
```

---

## 4. Portails

```
GET /portal/student/dashboard/
GET /portal/teacher/dashboard/
GET /portal/admin/dashboard/
GET /portal/direction/dashboard/
```

Chaque dashboard agrège des compteurs et liens issus des modules autorisés (pas de données fictives).

---

## 5. Événements (interne / admin)

```
GET  /events/outbox/          # admin
GET  /events/dead-letters/
POST /events/dead-letters/{id}/retry/
```

Les clients métier ne publient pas d'événements directement : ils passent par les services métier.

---

## 6. Notifications

```
GET    /notifications/
POST   /notifications/{id}/read/
POST   /notifications/read-all/
WS     /ws/notifications/     # Channels
```

---

## 7. Modules métier (aperçu — détaillés à l'implémentation)

| Préfixe | Module |
|---------|--------|
| `/admissions/` | 03 |
| `/finance/` | 04 |
| `/lms/` | 05 |
| `/meetings/` | 06 |
| `/grades/` | 07 |
| `/documents/` | 08 |
| `/internships/` | 09 |
| `/alumni/` | 10 |
| `/library/` | 11 |
| `/ai/` | 12 |
| `/calendar/` | 13 |
| `/research/` | 14 |
| `/messaging/` | 15 |
| `/bi/` | 16 |
| `/campus/` | 17–21 |
| `/wallet/` | 22 |
| `/complaints/` | 23 |
| `/student-life/` | 24 |
| `/scholarships/` | 25 |
| `/mobility/` | 26 |
| `/digital-twin/` | 27 |
| `/hr/` | 28 |
| `/quality/` | 29 |
| `/security/` | 30 |

---

## 8. Webhooks entrants

```
POST /webhooks/payments/{provider}/
```

- Signature HMAC obligatoire
- Replay protection (timestamp + nonce)
- Traitement idempotent

---

## 9. Mobile

Mêmes endpoints ; compression gzip ; pagination courte ; endpoints « sync » légers prévus Phase mobile (`/mobile/bootstrap/`).
