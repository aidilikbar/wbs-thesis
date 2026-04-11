# KPK Whistleblowing System

KPK Whistleblowing System is a thesis prototype for **Developing a Governance-Oriented Enterprise Architecture for Whistleblowing Systems**. It models a KPK-inspired operational flow while keeping the user-facing governance terminology aligned to ISO 37002-friendly English labels such as `Reporter`, `Verification Supervisor`, `Verification Officer`, `Investigation Supervisor`, and `Investigator`.

Current release: [v0.2.1](https://github.com/aidilikbar/wbs-thesis/releases/tag/v0.2.1)

## v0.2.1 Highlights

- KPK-inspired workflow data has been aligned more closely with the current prototype flow while keeping user-facing governance terminology in ISO 37002-friendly English.
- Reporter and internal case pages now use dedicated edit screens with persistent headers, tabs, compact top navigation, and consistent breadcrumbs.
- Workflow handling covers screening, verification, investigation, approval, secure communication, and case timeline review from role-specific pages.
- Local testing preparation has been expanded with refreshed seeded data, versioned database dumps, and detailed scenario guidance in [docs/account-test-cases.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/account-test-cases.md).
- Completed cases can now be exported as formatted PDF reports, and director-facing workflow data uses the canonical unit name `Directorate of Public Reports and Complaints`.

## Current Scope

- reporter registration, login, profile, and owned report access
- reporter report ledger at `/submit` with search, status filter, and 10-row pagination
- dedicated filing pages at `/submit/create` and `/submit/{reportId}/edit`
- reporter filing fields for title, description, reported parties, and attachments
- public-safe tracking at `/track`
- workflow queue at `/workflow` and approval queue at `/workflow/approvals`
- dedicated workflow case pages at `/workflow/{caseId}/edit` and `/workflow/{caseId}/approval`
- workflow forms for screening, verification, investigation, and final approval
- system administrator user directory at `/admin`
- Swagger UI, PostgreSQL persistence, and S3-compatible attachment storage for development

## Architecture

```text
wbs-thesis/
├── backend
├── frontend
├── docs
├── docker-compose.yml
└── README.md
```

- `frontend`: Next.js 16 application for reporter, workflow, oversight, and admin UI
- `backend`: Laravel 13 API for authentication, workflow, oversight, audit, and attachments
- `docs`: supporting architecture, API, and test-case documentation
- `docker-compose.yml`: local MinIO and optional Redis services

## Business Roles

- Reporter
- Verification Supervisor
- Verification Officer
- Investigation Supervisor
- Investigator
- Director
- System Administrator

Terminology note:
- `Reporter` is the user-facing term for the whistleblower account.
- Internal role keys remain `reporter`, `supervisor_of_verificator`, `verificator`, `supervisor_of_investigator`, `investigator`, `director`, and `system_administrator`.

## Current Workflow

1. Reporter submits a report with title, description, reported parties, and optional attachments.
2. Verification Supervisor screens the report, rejects invalid submissions, or delegates a valid case to a Verification Officer.
3. Verification Officer records the information summary, corruption aspect tags, authority assessment, criminal assessment, reason, and recommendation.
4. Verification Supervisor approves or rejects the verification outcome.
5. Investigation Supervisor delegates approved cases to an Investigator.
6. Investigator prepares the structured investigation record, including delict, legal article, timing, location, modus, linkage, authority, priority, and conclusion.
7. Investigation Supervisor approves or rejects the investigation outcome.
8. Director records the final decision.

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
php artisan serve --host=127.0.0.1 --port=8000
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
- `cd backend && php artisan openapi:sync-server-url`
- `cd frontend && npm run lint`
- `cd frontend && npm run build:webpack`

## Additional Docs

- [backend/README.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/backend/README.md)
- [docs/architecture.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/architecture.md)
- [docs/api.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/api.md)
- [docs/account-test-cases.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/account-test-cases.md)
