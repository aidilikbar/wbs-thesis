# KPK Whistleblowing System Backend

Laravel API for the role-based KPK Whistleblowing System prototype.

## Responsibilities

- reporter registration and shared authentication
- authenticated report intake and update
- private attachment intake and download through S3-compatible object storage
- public reference and tracking token lookup
- role-based case workflow orchestration
- system administrator user provisioning
- governance dashboard aggregation
- audit logging across workflow transitions

## Role Model

The backend supports these user-facing labels:

- Reporter
- Verification Supervisor
- Verification Officer
- Investigation Supervisor
- Investigator
- Director
- System Administrator

Implementation note:
- the persisted role keys remain `reporter`, `supervisor_of_verificator`, `verificator`, `supervisor_of_investigator`, `investigator`, `director`, and `system_administrator`
- reporter accounts register through `POST /api/auth/register`
- all internal roles are created by the system administrator through `POST /api/admin/users`

## Current Workflow Payload Model

### Reporter submission

The reporter workspace currently captures:

- `title`
- `description`
- `reported_parties[]`
- `attachments[]`

Each `reported_parties[]` item contains:

- `full_name`
- `position`
- `classification`

### Verification Supervisor screening

`PATCH /api/workflow/cases/{case}/delegate-verification` accepts:

- `reject_report`
- `assignee_user_id`
- `assigned_unit`
- `distribution_note`

### Verification Officer assessment

`PATCH /api/workflow/cases/{case}/submit-verification` accepts:

- `summary`
- `corruption_aspect_tags[]`
- `has_authority`
- `criminal_assessment`
- `reason`
- `recommendation`
- `forwarding_destination`
- optional public update fields

### Verification Supervisor approval

`PATCH /api/workflow/cases/{case}/review-verification` accepts:

- `decision`
- `approval_note`
- optional public update fields

### Investigation Supervisor delegation

`PATCH /api/workflow/cases/{case}/delegate-investigation` accepts:

- `assignee_user_id`
- `assigned_unit`
- `distribution_note`

### Investigator assessment

`PATCH /api/workflow/cases/{case}/submit-investigation` accepts:

- `case_name`
- `reported_parties[]`
- `description`
- `corruption_aspect_tags[]`
- `recommendation`
- `delict`
- `article`
- `start_month`
- `start_year`
- `end_month`
- `end_year`
- `city`
- `province`
- `modus`
- `related_report_reference`
- `has_authority`
- `is_priority`
- `additional_information`
- `conclusion`
- optional public update fields

### Investigation Supervisor and Director approvals

`PATCH /api/workflow/cases/{case}/review-investigation` and `PATCH /api/workflow/cases/{case}/director-review` accept:

- `decision`
- `approval_note`
- optional public update fields

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

The create and update endpoints accept JSON or `multipart/form-data`. When using multipart form submission, `attachments[]` can be sent in the same request.

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
php artisan openapi:sync-server-url
```

## Local Run

```bash
cp .env.example .env
composer install
docker compose up -d minio minio_init
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
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
- Auditor: `auditor@kpk-wbs.test`
- Verification Supervisor: `supervisor.verificator@kpk-wbs.test`
- Verification Officer: `verificator.1@kpk-wbs.test`
- Verification Officer: `verificator.2@kpk-wbs.test`
- Investigation Supervisor: `supervisor.investigator@kpk-wbs.test`
- Investigator: `investigator.1@kpk-wbs.test`
- Investigator: `investigator.2@kpk-wbs.test`
- Director: `director@kpk-wbs.test`
- Reporters: `reporter.1@example.test` through `reporter.4@example.test`

## Verification

- `php artisan test`
- `php artisan migrate:fresh --seed`
- `php artisan l5-swagger:generate`
- `php artisan openapi:sync-server-url`
- `docker compose up -d minio minio_init`
