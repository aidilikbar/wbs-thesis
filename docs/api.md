# API Notes

Local base URL: `http://localhost:8000/api`  
Swagger UI: `http://localhost:8000/api/documentation`  
OpenAPI JSON: `http://localhost:8000/docs`

## Terminology

- `Reporter` is the user-facing term for the whistleblower account
- internal role identifiers remain the persisted slugs such as `supervisor_of_verificator` and `supervisor_of_investigator`
- the visible English labels are `Verification Supervisor`, `Verification Officer`, `Investigation Supervisor`, and `Investigator`

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
- confidentiality modes
- case stages
- reported party classifications
- corruption aspect tags
- verification recommendations
- investigation recommendations
- delict tags
- corruption articles
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
- next steps

Reporter-facing responses intentionally do not expose severity. Severity is reserved for internal decision-maker and oversight views.

This endpoint accepts JSON or `multipart/form-data`.

Current payload highlights:

- `title`
- `description`
- `reported_parties[]`
- optional `attachments[]`

Each `reported_parties[]` item contains:

- `full_name`
- `position`
- `classification`

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

`queue` is used for screening, delegation, verification, and investigation work.  
`approval` is used for Verification Supervisor, Investigation Supervisor, and Director approvals.

### `GET /workflow/cases/{case}`

Returns a single visible workflow case with:

- allegation detail
- reporter visibility state
- workflow ownership
- attachments
- timeline
- available actions
- structured workflow records for screening, verification, investigation, and approvals

### `GET /workflow/assignees?role=verificator|investigator`

Returns active assignee candidates for delegation.

### `PATCH /workflow/cases/{case}/delegate-verification`

Verification Supervisor screening and delegation payload:

- `reject_report`
- `assignee_user_id`
- `assigned_unit`
- `distribution_note`

### `PATCH /workflow/cases/{case}/submit-verification`

Verification Officer assessment payload:

- `summary`
- `corruption_aspect_tags[]`
- `has_authority`
- `criminal_assessment`
- `reason`
- `recommendation`
- `forwarding_destination`
- optional public update fields

### `PATCH /workflow/cases/{case}/review-verification`

Verification Supervisor approval payload:

- `decision`
- `approval_note`
- optional public update fields

### `PATCH /workflow/cases/{case}/delegate-investigation`

Investigation Supervisor delegation payload:

- `assignee_user_id`
- `assigned_unit`
- `distribution_note`

### `PATCH /workflow/cases/{case}/submit-investigation`

Investigator assessment payload:

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

### `PATCH /workflow/cases/{case}/review-investigation`

Investigation Supervisor approval payload:

- `decision`
- `approval_note`
- optional public update fields

### `PATCH /workflow/cases/{case}/director-review`

Director decision payload:

- `decision`
- `approval_note`
- optional public update fields

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
- verification, investigation, and director-decision queue counts
- risk and status distribution
- governance controls
- recent audit activity

## Documentation Regeneration

If the Swagger UI or JSON must be refreshed locally:

```bash
cd backend
php artisan l5-swagger:generate
php artisan openapi:sync-server-url
```
