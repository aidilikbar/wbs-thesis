# API Notes

Base URL: `http://localhost:8000/api`

## Public Endpoints

### `POST /reports`

Creates a report, public reference, tracking token, case file, initial timeline entries, and audit logs.

### `POST /tracking`

Looks up a report by public reference and tracking token and returns only public-safe case information.

### `GET /catalog`

Returns intake categories, governance tags, case stages, and governance principles.

## Investigator Endpoints

### `GET /investigator/cases`

Returns case queue data with report summary, severity, ownership, and SLA information.

Optional query parameters:

- `stage`
- `severity`

### `PATCH /investigator/cases/{case}/assign`

Assigns an owner and unit to the case and records the change in the audit trail.

### `PATCH /investigator/cases/{case}/status`

Updates the case stage and optionally publishes a public-safe timeline update.

## Governance Endpoint

### `GET /governance/dashboard`

Returns:

- aggregate metrics
- severity distribution
- case status breakdown
- governance control status list
- recent audit log events
