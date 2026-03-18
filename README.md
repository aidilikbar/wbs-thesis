# KPK Whistleblowing System

KPK Whistleblowing System is a governance-oriented whistleblowing platform developed for the thesis **Developing a Governance-Oriented Enterprise Architecture for Whistleblowing Systems**. The repository contains a modular prototype with separate frontend and backend applications, institutional branding, case workflow support, and a local PostgreSQL setup for direct schema and data analysis.

## System overview

- `frontend` is a Next.js application for public reporting, case tracking, investigator access, and governance dashboards.
- `backend` is a Laravel API for data management, workflow enforcement, governance control, case handling, and audit logging.
- `docs` contains architecture and API notes for the thesis artefacts.
- `infra` contains optional Docker services for local Redis only.

```text
wbs-thesis/
├── backend
├── frontend
├── docs
└── infra
```

## Core capabilities

- public whistleblowing report submission with governance metadata
- reference and token based case tracking for protected follow-up
- investigator work queue with assignment and stage transitions
- governance dashboard with operational metrics and control monitoring
- audit logging for report intake, case creation, assignment, and workflow changes
- local PostgreSQL persistence to support database inspection and thesis analysis

## Technology stack

- frontend: Next.js 16
- backend: Laravel 13 with PHP 8.3+
- database: PostgreSQL on `localhost:5432`
- optional cache: Redis via Docker Compose profile `cache`
- API documentation: Swagger UI and generated OpenAPI JSON

## Local development setup

### 1. Prepare PostgreSQL

Expected to have a local database connection. Create the database if it does not already exist:

```bash
createdb -h localhost -p 5432 -U postgres wbs_thesis
```

For direct inspection:

```bash
psql -h localhost -p 5432 -U postgres -d wbs_thesis
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 3. Start the frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### 4. Optional Redis

Redis is not required for the default setup. If needed for local experimentation:

```bash
docker compose -f infra/docker-compose.yml --profile cache up -d
```

## Local service endpoints

- frontend UI: `http://localhost:3000`
- backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/api/documentation`
- OpenAPI JSON: `http://localhost:8000/docs`

## Backend data model

The Laravel migrations create the main analysis tables below in PostgreSQL:

- `reports`
- `case_files`
- `case_timeline_events`
- `audit_logs`
- `governance_controls`
- Laravel support tables: `users`, `cache`, `jobs`

## Main backend API routes

- `GET /api/catalog`
- `POST /api/reports`
- `POST /api/tracking`
- `GET /api/investigator/cases`
- `PATCH /api/investigator/cases/{caseFile}/assign`
- `PATCH /api/investigator/cases/{caseFile}/status`
- `GET /api/governance/dashboard`

## Verification

- backend tests: `cd backend && php artisan test`
- frontend lint: `cd frontend && npm run lint`
- frontend production build: `cd frontend && npm run build:webpack`

The webpack build command is kept because some environments reject the default Turbopack production build path.

## Additional documentation

- backend notes: [`backend/README.md`](backend/README.md)
- frontend notes: [`frontend/README.md`](frontend/README.md)
- architecture notes: [`docs/architecture.md`](docs/architecture.md)
- API notes: [`docs/api.md`](docs/api.md)
