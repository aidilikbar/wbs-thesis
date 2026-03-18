# WBS Thesis Prototype

Prototype of a whistleblowing system for the thesis **Developing a Governance-Oriented Enterprise Architecture for Whistleblowing Systems**.

## Workspace

```text
wbs-thesis/
├── backend   Laravel API for reporting, case workflow, governance, and audit
├── frontend  Next.js UI for submission, tracking, investigator, and oversight
├── docs      Architecture and API notes
└── infra     Docker Compose for PostgreSQL and optional Redis
```

## Quick Start

1. Start infrastructure:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Use Redis as well:

```bash
docker compose -f infra/docker-compose.yml --profile cache up -d
```

2. Start the backend:

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

3. Start the frontend:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`. Backend runs on `http://localhost:8000`. PostgreSQL is exposed on host port `5433`.

## Prototype Scope

- protected report submission with governance metadata
- public-safe tracking via reference and token
- investigator queue with assignment and stage transitions
- governance dashboard with metrics, controls, and recent audit events
- Docker-backed local persistence using PostgreSQL and optional Redis

## Verification

- Backend tests: `cd backend && php artisan test`
- Frontend lint: `cd frontend && npm run lint`
- Frontend production build: `cd frontend && npm run build:webpack`

The webpack build command is included because some sandboxed environments reject the default Turbopack build path.
