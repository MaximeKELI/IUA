# IUA Digital Campus — État du Projet

**Dernière mise à jour :** 2026-11-26  
**Phase active :** Phase 2 — Socle central

---

## Diagnostic initial

| Élément | Résultat |
|---------|----------|
| Dépôt | Greenfield (README `# IUA` uniquement) |
| Site public | WordPress vitrine [iuaci.org](https://www.iuaci.org/) |
| Décision | Architecture neuve monorepo Django + Next.js |

---

## Modules (30)

| # | Module | Statut |
|---|--------|--------|
| 01 | Portail étudiant | **En cours** — dashboard API + UI branchés |
| 02 | Portail enseignant | **En cours** — dashboard API + UI branchés |
| 03–29 | Autres modules métier | Non commencés (roadmap Vague A→D) |
| 30 | Cybersécurité & gouvernance | **En cours** — auth JWT, RBAC, audit, rate-limit login |

### Socle transversal

| Composant | Statut |
|-----------|--------|
| Authentification JWT | Opérationnel |
| Rôles système (17) | Opérationnel |
| Permissions serveur | Opérationnel (baseline) |
| Référentiels académiques | Opérationnel (CRUD API) |
| Transactional Outbox | Opérationnel |
| Notifications in-app | Opérationnel |
| Dashboards admin / direction | Opérationnel (KPI réels) |
| OpenAPI | Opérationnel (`/api/docs/`) |

---

## Tests

| Suite | Résultat |
|-------|----------|
| `test_identity_auth` | ✅ |
| `test_events_outbox` | ✅ |
| `test_permissions_isolation` | ✅ |
| **Total** | **7 passed** |

---

## Intégrations

| Intégration | État |
|-------------|------|
| Outbox → notification (USER_ROLE_ASSIGNED, STUDENT_REGISTERED) | Opérationnelle |
| Celery beat relay | Configuré (Docker) |
| Mobile Money / cartes | En attente (module 04) |
| Jitsi | En attente (module 06) |
| MinIO | Infra prête, branchement fichiers à venir |
| Keycloak | Optionnel Phase 5+ |
| PostGIS Digital Twin | Schéma prévu, activation module 27 |

---

## Dépendances externes nécessaires (plus tard)

- Compte(s) PSP Mobile Money / carte (CI)
- SMTP institutionnel
- Clés FCM/APNs (mobile)
- Instance Jitsi
- Logo officiel IUA (emplacement prévu, non inventé)

---

## Prochaines tâches

1. Module **03 Admissions** (workflow candidature + événements)
2. Module **04 Finance** (échéanciers + webhooks signés idempotents)
3. Durcir permissions académiques (lecture publique catalogue)
4. Channels WebSocket notifications
5. CI GitHub Actions (lint + pytest + build)

---

## Comptes démo

Voir `README.md` — emails `@demo.iua.local` uniquement.
