# KPK Whistleblowing System Backend

Laravel API for the role-based KPK Whistleblowing System prototype.

## Responsibilities

- reporter registration and shared authentication
- authenticated report intake
- private attachment intake and download via S3-compatible object storage
- public reference and tracking token lookup
- role-based case workflow orchestration
- system administrator user provisioning
- governance dashboard aggregation
- audit logging across workflow transitions

## Role Model

The backend supports:

- Reporter
- Supervisor of Verificator
- Verificator
- Supervisor of Investigator
- Investigator
- Director
- System Administrator

Reporter accounts register through `POST /api/auth/register`. All internal roles are created by the system administrator through `POST /api/admin/users`.

## Main Endpoint Groups

### Authentication

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

The create and update report endpoints also accept multipart form submissions with `attachments[]`, so the reporter filing screens can validate files during the main form submit.

### Public Tracking

- `POST /api/tracking`

### Workflow

- `GET /api/workflow/cases`
- `GET /api/workflow/cases/{case}`
- `GET /api/workflow/assignees`
- `PATCH /api/workflow/cases/{case}/delegate-verification`
- `PATCH /api/workflow/cases/{case}/submit-verification`
- `PATCH /api/workflow/cases/{case}/review-verification`
- `PATCH /api/workflow/cases/{case}/delegate-investigation`
- `PATCH /api/workflow/cases/{case}/submit-investigation`
- `PATCH /api/workflow/cases/{case}/review-investigation`
- `PATCH /api/workflow/cases/{case}/director-review`
- `GET /api/workflow/cases/{case}/attachments/{attachment}/download`

`GET /api/workflow/cases` supports:

- `view=queue|approval`
- `search=...`
- `stage=...`
- `page=...`
- `per_page=...`

### Administration and Governance

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/governance/dashboard`

## Swagger

- Swagger UI: `http://localhost:8000/api/documentation`
- OpenAPI JSON: `http://localhost:8000/docs`

Regenerate documentation manually if needed:

```bash
php artisan l5-swagger:generate
```

## Local Run

```bash
cp .env.example .env
composer install
docker compose up -d minio minio_init
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

PostgreSQL configuration:

- host: `localhost`
- port: `5432`
- database: `wbs_thesis`
- username: `postgres`
- password: `postgres`

Attachment storage configuration:

- disk: `attachments`
- endpoint: `http://127.0.0.1:9000`
- bucket: `wbs-attachments-dev`
- console: `http://127.0.0.1:9001`

## Seeded Accounts

All seeded accounts use password `Password123`.

- System Administrator: `sysadmin@kpk-wbs.test`
- Supervisor of Verificator: `supervisor.verificator@kpk-wbs.test`
- Verificator: `verificator.1@kpk-wbs.test`
- Verificator: `verificator.2@kpk-wbs.test`
- Supervisor of Investigator: `supervisor.investigator@kpk-wbs.test`
- Investigator: `investigator.1@kpk-wbs.test`
- Investigator: `investigator.2@kpk-wbs.test`
- Director: `director@kpk-wbs.test`
- Reporters: `reporter.1@example.test` through `reporter.4@example.test`

## Verification

- `php artisan test`
- `php artisan migrate:fresh --seed`
- `php artisan l5-swagger:generate`
- `docker compose up -d minio minio_init`
