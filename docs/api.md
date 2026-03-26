# API Notes

Base URL: `http://localhost:8000/api`  
Swagger UI: `http://localhost:8000/api/documentation`  
OpenAPI JSON: `http://localhost:8000/docs`

## Authentication

### `POST /auth/register`

Registers a `Reporter` account and returns a bearer token.

### `POST /auth/login`

Shared login for reporter and internal users.

### `GET /auth/me`

Returns the current authenticated user and role metadata.

### `POST /auth/logout`

Revokes the current personal access token.

## Reference Data

### `GET /catalog`

Returns:

- roles and internal roles
- categories
- governance tags
- anonymity modes
- case stages
- governance principles

## Reporter Workspace

### `GET /reporter/reports`

Paginated list of the current reporter's own submissions.

Supported query parameters:

- `page`
- `per_page`
- `search`
- `status`

### `POST /reporter/reports`

Creates a report for the authenticated reporter and returns:

- public reference
- tracking token
- case number
- status
- severity
- next steps

Reporter registration is mandatory. This endpoint accepts JSON or `multipart/form-data`. When using multipart form submission, `attachments[]` can be sent in the same request.

### `GET /reporter/reports/{report}`

Returns full reporter detail, including:

- editable report fields
- case snapshot
- public-safe timeline
- attachment metadata

### `PATCH /reporter/reports/{report}`

Updates a reporter-owned report while it remains editable. This endpoint also accepts JSON or `multipart/form-data` with `attachments[]`.

### Attachment Management

- `POST /reporter/reports/{report}/attachments`
- `DELETE /reporter/reports/{report}/attachments/{attachment}`
- `GET /reporter/reports/{report}/attachments/{attachment}/download`

Attachments are stored in private S3-compatible object storage, while metadata remains in PostgreSQL.

## Public Tracking

### `POST /tracking`

Looks up a report by public reference and tracking token and returns only public-safe information:

- report title and category
- current public status
- case snapshot
- public timeline entries

## Workflow

All workflow endpoints require authentication and are restricted to internal roles.

### `GET /workflow/cases`

Paginated workflow directory for the authenticated internal role.

Supported query parameters:

- `view=queue|approval`
- `search`
- `stage`
- `page`
- `per_page`

`queue` is used for delegation, verification, and investigation work.  
`approval` is used for Supervisor of Verificator, Supervisor of Investigator, and Director approvals.

### `GET /workflow/cases/{case}`

Returns a single visible workflow case with:

- allegation detail
- reporter visibility state
- workflow ownership
- attachments
- timeline
- available actions

### `GET /workflow/assignees?role=verificator|investigator`

Returns active assignee candidates for delegation.

### Workflow Actions

- `PATCH /workflow/cases/{case}/delegate-verification`
- `PATCH /workflow/cases/{case}/submit-verification`
- `PATCH /workflow/cases/{case}/review-verification`
- `PATCH /workflow/cases/{case}/delegate-investigation`
- `PATCH /workflow/cases/{case}/submit-investigation`
- `PATCH /workflow/cases/{case}/review-investigation`
- `PATCH /workflow/cases/{case}/director-review`

### Evidence Download

- `GET /workflow/cases/{case}/attachments/{attachment}/download`

Workflow attachment access is limited to visible case handlers and system administrator oversight.

## Administration

Restricted to `System Administrator`.

- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/users/{user}`
- `PATCH /admin/users/{user}`
- `PATCH /admin/users/{user}/deactivate`
- `DELETE /admin/users/{user}`

The user directory supports:

- pagination
- search
- role filter
- status filter

Reporter creation is not allowed through administration; reporters register themselves.

## Governance

### `GET /governance/dashboard`

Returns current governance metrics, including:

- total reports
- open and completed cases
- overdue cases
- verification, investigation, and director-review queue counts
- risk and status distribution
- governance controls
- recent audit activity
