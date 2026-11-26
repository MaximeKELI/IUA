# IUA DIGITAL CAMPUS — Feuille de Route

---

## Phase 1 — Audit & Conception ✅ (en cours)

- [x] Audit dépôt (greenfield)
- [x] Analyse site iuaci.org (contexte institutionnel)
- [x] Architecture cible
- [x] Specs modules / API / sécurité / DB / intégration
- [ ] Validation stakeholders (à planifier)

---

## Phase 2 — Socle central (en cours)

Durée cible : 2–3 sprints

1. Docker Compose (Postgres, Redis, MinIO, mailhog)
2. Django project + apps `identity`, `core`, `academic`, `events`, `notifications`
3. Auth JWT + rôles + permissions serveur
4. Référentiels universitaires CRUD
5. Transactional Outbox + Celery relay
6. Notifications in-app
7. Next.js shell : public + login + dashboards rôle
8. OpenAPI + tests socle
9. `PROJECT_STATUS.md` vivant

**Critère de done :** un utilisateur se connecte, voit son portail selon son rôle, les référentiels sont manipulables via API, un événement de test traverse outbox → handler → notification.

---

## Phase 3 — Modules cœur (Vague A)

Ordre : **03 Admissions → 04 Finance → 07 Notes → 08 Documents → 15 Messagerie → 16 BI**

Chaque module : modèles → services → API → UI → permissions → tests → intégration événements.

---

## Phase 4 — Interconnexion & workflows

- Scénarios admission→paiement→inscription
- Délibération→documents→alumni
- Tests E2E Playwright
- Cohérence données cross-modules

---

## Phase 5 — Vague B/C pédagogie & vie étudiante

LMS, Visio Jitsi, Stages, Bibliothèque, Wallet, Réclamations, Bourses, RH, Qualité, Alumni, IA RAG (MVP), Events, Research, Student Life, Mobilité.

---

## Phase 6 — Campus intelligent & Digital Twin

Modules 17–21, 27 (PostGIS), IoT adapters stubs.

---

## Phase 7 — Optimisation & durcissement

Sécurité audit, perf, accessibilité WCAG 2.1 AA, charge, backups.

---

## Phase 8 — Déploiement production

Nginx, HTTPS, CI/CD, monitoring, runbooks, formation admins IUA.

---

## Phase 9 — Mobile

App Android/iOS consommant `/api/v1/` (Flutter ou React Native — décision ultérieure).

---

## Jalons mesurables

| Jalon | Indicateur |
|-------|------------|
| M1 Socle | Auth + référentiels + events opérationnels |
| M2 Inscription | Candidat → étudiant payant inscrit |
| M3 Académie | Notes verrouillables + relevés |
| M4 Portail live | Étudiants/enseignants en usage pilote |
| M5 Production | Go-live contrôlé campus IUA |
