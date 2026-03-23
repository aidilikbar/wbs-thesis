# KPK Whistleblowing System

KPK Whistleblowing System is a thesis prototype for **Developing a Governance-Oriented Enterprise Architecture for Whistleblowing Systems**. It models the KPK whistleblowing business process with explicit role separation, authenticated reporter submission, public-safe tracking, governance dashboards, and audit logging.

## Repository Structure

```text
wbs-thesis/
├── backend
├── frontend
├── docs
├── docker-compose.yml
└── README.md
```

- `frontend`: Next.js user interface for reporter access, tracking, workflow, governance, and administration.
- `backend`: Laravel API for authentication, role-based workflow, governance controls, and audit trail management.
- `docs`: thesis-facing architecture and API notes.
- `docker-compose.yml`: optional Docker services, currently only Redis.

## Implemented Business Roles

The prototype implements the seven roles used in the adjusted KPK process:

- Reporter
- Supervisor of Verificator
- Verificator
- Supervisor of Investigator
- Investigator
- Director
- System Administrator

Business process implemented in the prototype:

1. Reporter registers and logs in before submission.
2. Supervisor of Verificator receives a submitted report.
3. Supervisor of Verificator delegates the report to a Verificator.
4. Verificator submits verification back to the supervisor.
5. Supervisor of Verificator approves or rejects verification.
6. Supervisor of Investigator receives approved verification and delegates investigation.
7. Investigator submits investigation back to the supervisor.
8. Supervisor of Investigator approves or rejects investigation.
9. Director approves completion or returns the case for further investigation.

## Current Capabilities

- reporter self-registration and shared login
- internal user provisioning by system administrator
- authenticated reporter submission only
- public reference and tracking token based tracking
- role-based workflow actions for verification, investigation, and director review
- governance metrics, controls, and recent audit activity
- Swagger UI for API exploration
- PostgreSQL-backed local data for thesis analysis

## Technology Stack

- frontend: Next.js 16
- backend: Laravel 13
- database: PostgreSQL on `localhost:5432`
- optional cache: Redis via Docker Compose profile `cache`
- API documentation: L5 Swagger / OpenAPI

## Local Setup

### 1. Prepare PostgreSQL

The backend is configured for native PostgreSQL:

- host: `localhost`
- port: `5432`
- database: `wbs_thesis`
- username: `postgres`
- password: `postgres`

Create the database if needed:

```bash
createdb -h localhost -p 5432 -U postgres wbs_thesis
```

Direct database access:

```bash
psql -h localhost -p 5432 -U postgres -d wbs_thesis
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

### 3. Start Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### 4. Optional Redis

```bash
docker compose --profile cache up -d
```

## Local Endpoints

- frontend UI: `http://localhost:3000`
- backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/api/documentation`
- OpenAPI JSON: `http://localhost:8000/docs`

## Seeded Demo Accounts

After `php artisan migrate:fresh --seed`, the following accounts are available. All use password `Password123`.

### Reporter Accounts

- `reporter.1@example.test`
- `reporter.2@example.test`
- `reporter.3@example.test`
- `reporter.4@example.test`

### Internal Accounts

- System Administrator: `sysadmin@kpk-wbs.test`
- Supervisor of Verificator: `supervisor.verificator@kpk-wbs.test`
- Verificator: `verificator.1@kpk-wbs.test`
- Verificator: `verificator.2@kpk-wbs.test`
- Supervisor of Investigator: `supervisor.investigator@kpk-wbs.test`
- Investigator: `investigator.1@kpk-wbs.test`
- Investigator: `investigator.2@kpk-wbs.test`
- Director: `director@kpk-wbs.test`

## Main API Surface

### Reference and Authentication

- `GET /api/catalog`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Reporter Workspace

- `GET /api/reporter/reports`
- `POST /api/reporter/reports`

### Public Tracking

- `POST /api/tracking`

### Workflow

- `GET /api/workflow/cases`
- `GET /api/workflow/assignees`
- `PATCH /api/workflow/cases/{caseFile}/delegate-verification`
- `PATCH /api/workflow/cases/{caseFile}/submit-verification`
- `PATCH /api/workflow/cases/{caseFile}/review-verification`
- `PATCH /api/workflow/cases/{caseFile}/delegate-investigation`
- `PATCH /api/workflow/cases/{caseFile}/submit-investigation`
- `PATCH /api/workflow/cases/{caseFile}/review-investigation`
- `PATCH /api/workflow/cases/{caseFile}/director-review`

### Administration and Governance

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/governance/dashboard`

## Main Database Tables

- `users`
- `reports`
- `case_files`
- `case_timeline_events`
- `audit_logs`
- `governance_controls`
- `personal_access_tokens`

## Verification Commands

- `cd backend && php artisan test`
- `cd backend && php artisan migrate:fresh --seed`
- `cd frontend && npm run lint`
- `cd frontend && npm run build:webpack`

## Additional Documentation

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/api.md`](docs/api.md)
- [`docs/account-test-cases.md`](docs/account-test-cases.md)
