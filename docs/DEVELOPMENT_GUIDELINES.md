# IUA DIGITAL CAMPUS — Guidelines de Développement

---

## 1. Organisation du monorepo

```
IUA/
├── backend/          # Django
├── frontend/         # Next.js
├── docs/             # Architecture & specs
├── infra/            # Nginx, scripts deploy
├── scripts/          # Utilitaires dev
├── docker-compose.yml
├── PROJECT_STATUS.md
└── README.md
```

---

## 2. Backend (Django)

- Une app = un bounded context
- Couches : `models` → `services` → `api` (serializers/views) → `tests`
- Logique métier dans `services.py`, pas dans les views
- Événements via `events.services.emit(...)` dans la même transaction
- Permissions : DRF permission classes + checks services
- Pas de secrets en dur
- Type hints Python encouragés
- Tests : `pytest-django` ; couverture minimale socle 80% des chemins critiques

### Naming

- Models : `PascalCase` singulier
- Tables : préfixe app
- Events : `UPPER_SNAKE`
- Permissions : `domain.resource.action`

---

## 3. Frontend (Next.js)

- App Router + TypeScript strict
- Design tokens CSS variables (`--iua-*`)
- Server Components par défaut ; Client seulement si interaction
- Appels API via client typé (`lib/api`)
- Jamais de permission « UI only »
- Accessibilité : labels, focus, contraste
- Pas de données mock présentées comme réelles (badge « demo » si seed)

---

## 4. Git & CI

- Branches : `main`, `develop`, `feature/*`, `fix/*`
- PR petites et reviewables
- CI : lint + tests + build Docker
- Commit messages : style conventionnel (`feat:`, `fix:`, `docs:`)

---

## 5. Definition of Done (module)

1. Modèles + migrations
2. Services + règles métier
3. API documentée OpenAPI
4. Permissions serveur testées
5. UI fonctionnelle (pas de boutons morts)
6. Événements émis/consommés testés
7. Entrée dans `PROJECT_STATUS.md`
8. Doc module à jour

**Interdit :** marquer « terminé » une maquette sans backend.

---

## 6. Données de démo

- Fixtures synthétiques uniquement (`seed_demo`)
- Noms fictifs, emails `@demo.iua.local`
- Bannière visible en environnement non-prod

---

## 7. Revue sécurité (checklist PR)

- [ ] Authz serveur
- [ ] Validation inputs
- [ ] Pas de secret commité
- [ ] Upload sécurisé si fichiers
- [ ] Idempotence si webhook/paiement
