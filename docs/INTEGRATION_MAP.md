# IUA DIGITAL CAMPUS — Cartographie d'Interconnexion

---

## 1. Bus d'événements

**Pattern :** Transactional Outbox

```
Service métier ──(même TX)──► Domain tables + events_outbox(PENDING)
                                      │
                            Celery beat/worker
                                      │
                                      ▼
                            Publish Redis/channel
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Handler A         Handler B         Handler C
              (idempotent)      (idempotent)      (idempotent)
```

Champs outbox : `id`, `event_type`, `aggregate_type`, `aggregate_id`, `payload`, `source`, `created_at`, `status`, `attempts`.

---

## 2. Catalogue d'événements (socle + cœur)

| Event | Source | Consumers typiques |
|-------|--------|--------------------|
| `STUDENT_REGISTERED` | admissions | identity, portal, finance, notifications |
| `APPLICATION_SUBMITTED` | admissions | notifications, admin_docs |
| `APPLICATION_APPROVED` | admissions | finance, notifications, academic |
| `APPLICATION_REJECTED` | admissions | notifications |
| `PAYMENT_INITIATED` | finance | notifications |
| `PAYMENT_CONFIRMED` | finance | admissions, portal, wallet, notifications, bi |
| `PAYMENT_FAILED` | finance | notifications |
| `COURSE_PUBLISHED` | lms | notifications, portal |
| `GRADE_SUBMITTED` | grades | notifications |
| `RESULT_VALIDATED` | grades | portal, admin_docs, bi, notifications |
| `DOCUMENT_GENERATED` | admin_docs | notifications, portal |
| `INTERNSHIP_APPROVED` | internships | portal, notifications |
| `DIPLOMA_ISSUED` | grades/admin | alumni, notifications, bi |
| `ALUMNI_PROFILE_CREATED` | alumni | notifications |
| `EMERGENCY_REPORTED` | campus | notifications (prioritaire), security |
| `BUILDING_REGISTERED` | campus | digital_twin, access, maintenance |
| `USER_ROLE_ASSIGNED` | identity | notifications, audit |

---

## 3. Workflows obligatoires

### 3.1 Admission → Inscription

```
APPLICATION_APPROVED
  → finance.create_fee_schedule(candidate)
  → notify(candidate, "Dossier accepté — procéder au paiement")
PAYMENT_CONFIRMED (frais inscription)
  → admissions.activate_enrollment()
  → identity.ensure_student_role()
  → academic.link_cohort_program()
  → STUDENT_REGISTERED
  → notify + prepare LMS spaces
```

### 3.2 Paiement

```
Webhook PSP signé
  → verify signature + idempotency
  → PAYMENT_CONFIRMED
  → receipt PDF
  → update balance
  → refresh student portal cache
```

### 3.3 Année académique

```
ACADEMIC_YEAR_OPENED
  → prepare cohorts
  → attach course units
  → sync teaching assignments
  → schedule scaffolds
  → LMS term spaces
```

### 3.4 Diplomation

```
RESULT_VALIDATED (final) → DIPLOMA_ISSUED
  → update academic record
  → queue documents
  → invite Alumni
  → BI refresh
```

### 3.5 Digital Twin

```
BUILDING_REGISTERED
  → twin.upsert_feature(PostGIS)
  → rooms → booking registry
  → equipment → maintenance inventory
  → access control zones
```

---

## 4. Règles anti-couplage

- ❌ Module A n'importe pas les modèles internes de B pour écrire
- ✅ A appelle un **service public** de B ou publie un événement
- Les lectures cross-module passent par query services / API interne documentée
- Transactions distribuées évitées : saga/événements + compensation

---

## 5. Notifications intermodules

Canal unifié `notifications` :
- in-app (DB + WebSocket)
- email (Celery)
- push (FCM/APNs — Phase mobile)

Priorités : `low | normal | high | emergency`
