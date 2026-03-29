# KPK Whistleblowing System

KPK Whistleblowing System is a thesis prototype for **Developing a Governance-Oriented Enterprise Architecture for Whistleblowing Systems**. It models the KPK whistleblowing process with role separation, authenticated reporter submission, case tracking, workflow approvals, governance controls, audit logging, and private file storage.

Current release: [v0.1.2](https://github.com/aidilikbar/wbs-thesis/releases/tag/v0.1.2)

## Current Scope

- reporter registration, login, profile, and owned report access
- reporter report ledger at `/submit` with search, status filter, and 10-row pagination
- dedicated filing pages at `/submit/create` and `/submit/{reportId}/edit`
- public-safe tracking at `/track`
- workflow queue at `/workflow` and approval queue at `/workflow/approvals`
- dedicated workflow case pages at `/workflow/{caseId}/edit` and `/workflow/{caseId}/approval`
- system administrator user directory at `/admin`
- Swagger UI, PostgreSQL persistence, and MinIO-based attachment storage for development

## Architecture

```text
wbs-thesis/
├── backend
├── frontend
├── docs
├── docker-compose.yml
└── README.md
```

- `frontend`: Next.js 16 application for reporter, workflow, governance, and admin UI
- `backend`: Laravel 13 API for authentication, workflow, governance, audit, and attachments
- `docs`: supporting architecture, API, and test-case documentation
- `docker-compose.yml`: local MinIO and optional Redis services

## Business Roles

- Reporter
- Supervisor of Verificator
- Verificator
- Supervisor of Investigator
- Investigator
- Director
- System Administrator

Implemented workflow:

1. Reporter registers and submits a report.
2. Supervisor of Verificator delegates it to a Verificator.
3. Verificator verifies and submits it back.
4. Supervisor of Verificator approves or rejects verification.
5. Supervisor of Investigator delegates approved cases to an Investigator.
6. Investigator analyses and submits the case back.
7. Supervisor of Investigator approves or rejects investigation.
8. Director gives the final approval or returns the case.

## Local Setup

### PostgreSQL

Default local database:

- host: `localhost`
- port: `5432`
- database: `wbs_thesis`
- username: `postgres`
- password: `postgres`

Create it if needed:

```bash
createdb -h localhost -p 5432 -U postgres wbs_thesis
```

### MinIO

```bash
docker compose up -d minio minio_init
```

Default object storage:

- endpoint: `http://127.0.0.1:9000`
- console: `http://127.0.0.1:9001`
- access key: `minioadmin`
- secret key: `minioadmin`
- bucket: `wbs-attachments-dev`

### Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Optional Redis:

```bash
docker compose --profile cache up -d
```

## Local URLs

- frontend: `http://localhost:3000`
- backend: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/api/documentation`
- OpenAPI JSON: `http://localhost:8000/docs`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

## Seeded Accounts

All seeded accounts use password `Password123`.

Reporter:

- `reporter.1@example.test`
- `reporter.2@example.test`
- `reporter.3@example.test`
- `reporter.4@example.test`

Internal:

- `sysadmin@kpk-wbs.test`
- `supervisor.verificator@kpk-wbs.test`
- `verificator.1@kpk-wbs.test`
- `verificator.2@kpk-wbs.test`
- `supervisor.investigator@kpk-wbs.test`
- `investigator.1@kpk-wbs.test`
- `investigator.2@kpk-wbs.test`
- `director@kpk-wbs.test`

## Main API Areas

- authentication: `/api/auth/*`
- reporter workspace: `/api/reporter/reports*`
- public tracking: `/api/tracking`
- workflow: `/api/workflow/cases*`, `/api/workflow/assignees`
- administration: `/api/admin/users*`
- governance: `/api/governance/dashboard`

## Verification

- `cd backend && php artisan test`
- `cd backend && php artisan l5-swagger:generate`
- `cd frontend && npm run lint`
- `cd frontend && npm run build:webpack`

## Additional Docs

- [backend/README.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/backend/README.md)
- [docs/architecture.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/architecture.md)
- [docs/api.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/api.md)
- [docs/account-test-cases.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/account-test-cases.md)
