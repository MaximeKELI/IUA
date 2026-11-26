# IUA Digital Campus

**ONE UNIVERSITY, ONE DIGITAL ECOSYSTEM**

Système d'information universitaire intégré pour l'[Institut Universitaire d'Abidjan](https://www.iuaci.org/) (Côte d'Ivoire).

> Ce dépôt n'est **pas** un site vitrine : c'est le socle d'un SIU interconnectant 30 modules métier.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | Django 5 · DRF · Celery · Channels |
| Frontend | Next.js 15 · React 19 · TypeScript · Tailwind |
| Données | PostgreSQL (+ PostGIS prévu) · Redis · MinIO |
| Infra | Docker Compose · Nginx |

## Démarrage rapide (local sans Docker)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # USE_SQLITE_FOR_LOCAL=true par défaut
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8001
```

API : http://localhost:8001/api/v1/ (utiliser un port libre si 8000 est déjà pris)  
Docs OpenAPI : http://localhost:8001/api/docs/

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1 npm run dev
```

UI : http://localhost:3000

### Comptes de démonstration (synthétiques)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@demo.iua.local` | `IuaDemoAdmin2026!` | Super admin / Direction |
| `etudiant@demo.iua.local` | `IuaDemoStudent2026!` | Étudiant |
| `enseignant@demo.iua.local` | `IuaDemoTeacher2026!` | Enseignant |

## Docker Compose

```bash
docker compose up --build
```

Services : Postgres/PostGIS, Redis, MinIO, Mailhog, backend, celery, frontend.

## Documentation

Voir le dossier [`docs/`](./docs/) :

- `ARCHITECTURE.md`
- `DATABASE_DESIGN.md`
- `MODULES_SPECIFICATION.md`
- `API_SPECIFICATION.md`
- `SECURITY.md`
- `ROADMAP.md`
- `INTEGRATION_MAP.md`
- `DEVELOPMENT_GUIDELINES.md`

Suivi : [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)

## Tests

```bash
cd backend && source .venv/bin/activate && pytest
```

## Licence / usage

Projet institutionnel IUA — données de démo uniquement hors production.
