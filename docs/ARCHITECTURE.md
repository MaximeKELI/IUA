# IUA DIGITAL CAMPUS — Architecture Technique

**Vision :** ONE UNIVERSITY, ONE DIGITAL ECOSYSTEM  
**Institution :** Institut Universitaire d'Abidjan (IUA) — Côte d'Ivoire  
**Version :** 1.0 · Phase 1 Conception

---

## 1. Diagnostic de l'existant

| Élément | État |
|---------|------|
| Dépôt Git | `github.com/MaximeKELI/IUA` — commit initial uniquement |
| Code applicatif | Aucun (README placeholder `# IUA`) |
| Site public actuel | WordPress vitrine : [iuaci.org](https://www.iuaci.org/) |
| Stack existante | N/A — greenfield |

**Décision :** architecture neuve professionnelle, monorepo, sans suppression d'existant (rien à préserver hors historique Git).

---

## 2. Style architectural

**Modular Monolith + Event-Driven Integration**

- Un backend Django unique, découpé en **domain apps** (bounded contexts).
- Une API REST versionnée (`/api/v1/`) consommée par Next.js et futures apps mobiles.
- Bus d'événements métier interne (Transactional Outbox → Redis/Celery).
- Pas de microservices dès le jour 1 (complexité opérationnelle injustifiée) ; extraction progressive possible par domaine.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Clients (Web / Mobile)                       │
│              Next.js (App Router) · Future Flutter/RN            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT + Session
┌────────────────────────────▼────────────────────────────────────┐
│                     Nginx (reverse proxy)                        │
└──────────────┬─────────────────────────────┬────────────────────┘
               │                             │
┌──────────────▼──────────────┐  ┌───────────▼────────────────────┐
│  Next.js Frontend           │  │  Django + DRF + Channels        │
│  Public + Portails          │  │  Domain Apps + API v1           │
└─────────────────────────────┘  └───────────┬────────────────────┘
                                             │
         ┌───────────────┬───────────────────┼───────────────┐
         ▼               ▼                   ▼               ▼
   PostgreSQL+      Redis              Celery           MinIO/S3
   PostGIS        Cache/Broker       Workers          Documents
```

---

## 3. Stack retenue

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Backend | Python 3.12+, Django 5, DRF | Productivité, ORM mature, écosystème universitaire |
| Temps réel | Django Channels + Redis | Messagerie, notifications live |
| Async | Celery + Redis | Paiements, emails, outbox, PDF |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind | SSR/SSG, perf mobile Afrique, DX |
| UI | Radix UI + design system IUA | Accessibilité, composants contrôlés |
| DB | PostgreSQL 16 + PostGIS | Intégrité + Digital Twin géospatial |
| Auth | Django custom User + JWT (SimpleJWT) + sessions | SSO interne unifié ; Keycloak optionnel Phase 5+ |
| Stockage | MinIO (dev) / S3 (prod) | Pièces, supports, archives |
| Visio | Jitsi Meet (intégration) | Module 06 sans rebuild WebRTC |
| BI | API + Metabase (Phase 4+) | Module 16 |
| LMS | LMS natif léger + option Moodle LTI | Module 05 — démarrer natif, brancher Moodle si besoin |
| Conteneurs | Docker Compose | Dev/test/prod homogènes |

---

## 4. Découpage des apps Django

| App | Responsabilité | Modules couverts |
|-----|----------------|------------------|
| `identity` | Users, rôles, permissions, MFA, sessions | 30 (partiel), SSO |
| `core` | Mixins, audit, soft-delete, health | Transversal |
| `academic` | Facultés, formations, UE, promotions, années | Référentiels |
| `events` | Outbox, bus, handlers, idempotence | Interconnexion |
| `notifications` | In-app, email, push | Transversal |
| `admissions` | Candidatures, inscriptions | 03 |
| `finance` | Frais, paiements, reçus | 04, 22 |
| `lms` | Cours, devoirs, QCM | 05 |
| `grades` | Notes, délibérations, ECTS | 07 |
| `admin_docs` | Attestations, signatures, QR | 08 |
| `internships` | Stages, entreprises | 09 |
| `alumni` | Réseau anciens | 10 |
| `library` | Catalogue, emprunts | 11 |
| `ai_assistant` | RAG, assistants | 12 |
| `campus` | Infra, parking, accès, maintenance, urgences | 17–21 |
| `digital_twin` | PostGIS, BIM/SIG | 27 |
| `hr` | RH personnel | 28 |
| `quality` | AQ, enquêtes | 29 |
| `student_life` | Clubs, annonces, bourses, mobilité | 24–26 |
| `messaging` | Messagerie, annonces | 15 |
| `bi` | Agrégats décisionnels | 16 |
| `portal` | Agrégation dashboards API | 01, 02 |

---

## 5. Principes d'intégration

1. **Single source of truth** par référentiel (ex. : un seul `StudentProfile`).
2. **Événements métier** pour découpler les modules (pas d'appels directs circulaires).
3. **Transactional Outbox** : écriture DB + outbox dans la même transaction.
4. **Idempotence** des consumers (clé `event_id` + `handler_name`).
5. **Permissions serveur** sur chaque endpoint (jamais UI-only).
6. **API-first** : mobile et web partagent `/api/v1/`.

---

## 6. Identité visuelle (direction)

Inspirée du positionnement institutionnel IUA (site iuaci.org) — sobre, académique, contemporaine :

- **Primaire :** bleu nuit institutionnel `#0B1F3A`
- **Accent :** émeraude Afrique de l'Ouest `#0D9488`
- **Secondaire :** or discret `#C4A35A`
- **Neutres :** `#F7F5F2` (clair) / `#0A0F1A` (sombre)
- **Typo :** Fraunces (titres) + Source Sans 3 (corps)
- Logo officiel : emplacement prévu, **non inventé**

---

## 7. Environnements

| Env | Usage |
|-----|-------|
| `development` | Docker Compose local |
| `test` | CI + fixtures anonymisées |
| `staging` | Préprod isolée |
| `production` | HTTPS, secrets, backups |

---

## 8. Évolutivité multi-établissements

Modèle `Tenant` / `Institution` dès le schéma (IUA = tenant par défaut). Isolation logique Phase 1–4 ; multi-tenant physique Phase 6+ si nécessaire.
