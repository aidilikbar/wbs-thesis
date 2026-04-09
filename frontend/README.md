# KPK Whistleblowing System Frontend

Next.js application for the KPK Whistleblowing System prototype.

## Main Screens

- `/` overview and business process framing
- `/login` shared login for reporters and internal users
- `/register` reporter self-registration
- `/submit` authenticated reporter submission workspace
- `/submit/create` dedicated report creation page
- `/submit/{reportId}/edit` authenticated reporter detail, tracking, and secure communication
- `/track` public reference and token tracking
- `/workflow` internal role-based workflow workspace
- `/workflow/{caseId}/edit` workflow execution page
- `/workflow/{caseId}/approval` workflow approval page
- `/governance` governance dashboard
- `/admin` system administrator user provisioning

`/investigator` redirects to `/workflow`.

## Runtime Expectations

- reporter must register and log in before submitting
- internal roles are created by the system administrator
- frontend authenticates against the Laravel backend using bearer tokens
- user-facing role labels follow the English governance terms `Reporter`, `Verification Supervisor`, `Verification Officer`, `Investigation Supervisor`, and `Investigator`

## Current UX Shape

- reporter detail pages keep a persistent report header, tracking status, report information, tabs, and bottom action buttons
- workflow case pages keep a persistent case header, tabs for details, communication, and timeline, and bottom action buttons
- shared labels are normalized from legacy workflow text into the current investigation-based terminology

## Run Locally

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

For the local Laravel backend:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

## Verification

- `npm run lint`
- `npm run build:webpack`
