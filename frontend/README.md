# KPK Whistleblowing System Frontend

Next.js application for the KPK Whistleblowing System prototype.

## Main Screens

- `/` overview and business process framing
- `/login` shared login for reporters and internal users
- `/register` reporter self-registration
- `/submit` authenticated reporter submission workspace
- `/track` public reference and token tracking
- `/workflow` internal role-based workflow workspace
- `/governance` governance dashboard
- `/admin` system administrator user provisioning

`/investigator` now redirects to `/workflow`.

## Runtime Expectations

- reporter must register and log in before submitting
- internal roles are created by the system administrator
- frontend authenticates against the Laravel backend using bearer tokens

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
