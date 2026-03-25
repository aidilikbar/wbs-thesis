# KPK Whistleblowing System

KPK Whistleblowing System is a thesis prototype for **Developing a Governance-Oriented Enterprise Architecture for Whistleblowing Systems**. It models the KPK whistleblowing business process with explicit role separation, authenticated reporter submission, public-safe tracking, governance dashboards, audit logging, and private evidence storage.

## Current Release

Current prototype release includes:

- authenticated reporter registration, login, profile access, and protected report ownership
- reporter report directory at `/submit` with search, status filter, and 10-row pagination
- dedicated reporter filing pages at `/submit/create` and `/submit/{reportId}/edit`
- integrated file upload on create and edit forms, validated during form submission
- public-safe tracking at `/track` using the issued reference and tracking token
- internal workflow workbench at `/workflow` for the KPK role-based verification and investigation flow
- system administrator directory at `/admin` with search, filters, pagination, create, edit, activate, deactivate, and delete
- governance dashboard, audit trail visibility, Swagger documentation, PostgreSQL persistence, and MinIO-based attachment storage for development

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
- `backend`: Laravel API for authentication, role-based workflow, governance controls, audit trail management, and attachment storage.
- `docs`: thesis-facing architecture and API notes.
- `docker-compose.yml`: optional supporting services for local MinIO object storage and Redis.

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
- reporter profile management through a dedicated page
- reporter report directory with search, status filters, and 10-row pagination
- authenticated reporter submission only
- separate create and edit pages for report filing
- file upload validation inside the main reporter filing form
- public reference and tracking token based tracking
- role-based workflow actions for verification, investigation, and director review
- internal workflow access to reporter evidence for authorized roles only
- system administrator user provisioning and paginated user management
- governance metrics, controls, and recent audit activity
- private attachment storage with MinIO-compatible S3 APIs in development
- Swagger UI for API exploration
- PostgreSQL-backed local data for thesis analysis

## Technology Stack

- frontend: Next.js 16
- backend: Laravel 13
- database: PostgreSQL on `localhost:5432`
- object storage: MinIO on `localhost:9000` with console on `localhost:9001`
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

### 2. Start MinIO

```bash
docker compose up -d minio minio_init
```

MinIO development settings used by the backend:

- endpoint: `http://127.0.0.1:9000`
- console: `http://127.0.0.1:9001`
- access key: `minioadmin`
- secret key: `minioadmin`
- bucket: `wbs-attachments-dev`

### 3. Start Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

The backend `.env` is already configured for the local MinIO bucket through the `attachments` disk.

### 4. Start Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### 5. Optional Redis

```bash
docker compose --profile cache up -d
```

## Local Endpoints

- frontend UI: `http://localhost:3000`
- backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/api/documentation`
- OpenAPI JSON: `http://localhost:8000/docs`
- MinIO S3 endpoint: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

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
- `GET /api/reporter/reports/{report}`
- `PATCH /api/reporter/reports/{report}`
- `POST /api/reporter/reports/{report}/attachments`
- `DELETE /api/reporter/reports/{report}/attachments/{attachment}`
- `GET /api/reporter/reports/{report}/attachments/{attachment}/download`

`POST /api/reporter/reports` and `PATCH /api/reporter/reports/{report}` accept multipart form submissions so the main filing form can validate and upload attachments in the same save action.

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
- `GET /api/workflow/cases/{caseFile}/attachments/{attachment}/download`

### Administration and Governance

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/governance/dashboard`

## Main Database Tables

- `users`
- `reports`
- `report_attachments`
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
- `docker compose up -d minio minio_init`

## Main User Flows

### Reporter

- register at `/register`
- login at `/login`
- review owned reports at `/submit`
- create a report at `/submit/create`
- edit and track a report at `/submit/{reportId}/edit`
- upload evidence files as part of the create or edit form submit
- use `/track` for public-safe token-based lookup

### Internal Roles

- login at `/login`
- process cases at `/workflow`
- download evidence files if assigned to the case
- review governance indicators at `/governance`

### System Administrator

- login at `/login`
- manage user directory at `/admin`
- create new internal users at `/admin/create`
- edit existing users at `/admin/{userId}/edit`

## Additional Documentation

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/api.md`](docs/api.md)
- [`docs/account-test-cases.md`](docs/account-test-cases.md)
