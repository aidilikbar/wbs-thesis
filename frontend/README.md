# WBS Thesis Frontend

Next.js app for the whistleblowing prototype interface.

## Screens

- `/` overview and architecture framing
- `/submit` report submission
- `/track` public case tracking
- `/investigator` investigator portal
- `/governance` oversight dashboard

## Run locally

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Use `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api` for the local Laravel API.
