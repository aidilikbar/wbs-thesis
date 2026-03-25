# API Notes

Base URL: `http://localhost:8000/api`

Swagger UI: `http://localhost:8000/api/documentation`

OpenAPI JSON: `http://localhost:8000/docs`

## Authentication

### `POST /auth/register`

Registers a reporter account and immediately returns a bearer token.

This path is only for the `Reporter` role.

### `POST /auth/login`

Shared login for reporter and internal users.

### `GET /auth/me`

Returns the current authenticated user.

### `POST /auth/logout`

Deletes the current personal access token.

## Reference Data

### `GET /catalog`

Returns:

- roles
- internal roles
- categories
- governance tags
- confidentiality levels
- case stages
- governance principles

## Reporter Workspace

### `GET /reporter/reports`

Lists the current reporter's own submissions.

### `POST /reporter/reports`

Creates a report for the authenticated reporter and returns:

- public reference
- tracking token
- case number
- status
- severity
- next steps

Reporter registration is mandatory before this endpoint can be used.

### `GET /reporter/reports/{report}`

Returns the authenticated reporter's full report detail, including:

- current case snapshot
- public-safe timeline
- attachment metadata

### `PATCH /reporter/reports/{report}`

Updates a reporter-owned report while it remains editable.

### Attachment Management

- `POST /reporter/reports/{report}/attachments`
- `DELETE /reporter/reports/{report}/attachments/{attachment}`
- `GET /reporter/reports/{report}/attachments/{attachment}/download`

Attachments are stored in private S3-compatible object storage and linked to the report by metadata in PostgreSQL.

## Public Tracking

### `POST /tracking`

Looks up a report by public reference and tracking token and returns only public-safe case information:

- title and category
- current public status
- confidentiality level
- case snapshot
- public timeline events

## Workflow

All workflow endpoints require authentication and are restricted by role.

### `GET /workflow/cases`

Returns the case list visible to the current internal role.

Optional query parameter:

- `stage`

### `GET /workflow/assignees?role=verificator|investigator`

Returns active assignee candidates for supervisor delegation.

### Verification Stage

- `PATCH /workflow/cases/{case}/delegate-verification`
- `PATCH /workflow/cases/{case}/submit-verification`
- `PATCH /workflow/cases/{case}/review-verification`

### Investigation Stage

- `PATCH /workflow/cases/{case}/delegate-investigation`
- `PATCH /workflow/cases/{case}/submit-investigation`
- `PATCH /workflow/cases/{case}/review-investigation`

### Director Stage

- `PATCH /workflow/cases/{case}/director-review`

### Evidence Download

- `GET /workflow/cases/{case}/attachments/{attachment}/download`

Internal attachment access is restricted to the assigned workflow roles or system administrator.

## Administration

### `GET /admin/users`

Lists users. Restricted to `System Administrator`.

### `POST /admin/users`

Creates internal users for:

- Supervisor of Verificator
- Verificator
- Supervisor of Investigator
- Investigator
- Director
- System Administrator

Reporter creation is excluded from this endpoint.

## Governance

### `GET /governance/dashboard`

Returns:

- total reports
- open cases
- completed cases
- confidential share
- overdue cases
- average triage hours
- verification queue
- investigation queue
- director review queue
- risk distribution
- status breakdown
- governance control catalogue
- recent audit log events
