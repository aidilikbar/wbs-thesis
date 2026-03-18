# WBS Thesis Backend

Laravel API for the whistleblowing system prototype.

## Responsibilities

- report intake and tracking token issuance
- case creation, assignment, and status transitions
- governance dashboard metrics
- audit logging for key workflow events

## Main endpoints

- `POST /api/reports`
- `POST /api/tracking`
- `GET /api/investigator/cases`
- `PATCH /api/investigator/cases/{case}/assign`
- `PATCH /api/investigator/cases/{case}/status`
- `GET /api/governance/dashboard`

## Run locally

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Start PostgreSQL first with Docker Compose from the repo root.
The provided Docker setup exposes PostgreSQL on host port `5433`.
