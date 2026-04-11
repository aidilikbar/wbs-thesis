# KPK Whistleblowing System Test Index

This document is the public-facing testing index for the prototype. It is intentionally brief and high-level.

Detailed operational walkthroughs, AI-agent packs, and local result archives are maintained separately in local-only workspaces and are not part of the committed project documentation.

## Recommended Baseline

Reset the local prototype before structured testing:

```bash
cd /Users/mbp13m2-003/development/utwente/wbs-thesis/backend
php artisan migrate:fresh --seed
```

Run the local services:

```bash
cd /Users/mbp13m2-003/development/utwente/wbs-thesis/backend
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
cd /Users/mbp13m2-003/development/utwente/wbs-thesis/frontend
npm run dev
```

## Public Test Scope

The current prototype should be validated across these areas:

- reporter registration, login, profile, report submission, report editing, and attachments
- public tracking using `Public Reference` and `Tracking Token`
- internal workflow handling across screening, verification, investigation, approval, and final decision
- secure communication between reporter and assigned internal officer during active handling stages
- governance dashboard visibility by role
- system administrator account management
- PDF export for completed cases

## Core Validation Themes

- access control:
  only the correct role can perform each workflow action
- confidentiality:
  public tracking must not expose protected internal notes, handler identity details, or secure communication contents
- workflow integrity:
  cases must move to the correct next stage, including rejection loops and terminal outcomes
- auditability:
  timeline and visible status updates should stay coherent across reporter, workflow, and tracking views
- attachment handling:
  upload, list, download, and deletion flows should behave consistently
- usability:
  labels, navigation, tables, pagination, and status wording should remain consistent across pages

## Seeded Account Groups

All seeded accounts use password `Password123`.

- reporters:
  `reporter.1@example.test`, `reporter.2@example.test`, `reporter.3@example.test`, `reporter.4@example.test`
- workflow roles:
  `supervisor.verificator@kpk-wbs.test`, `verificator.1@kpk-wbs.test`, `verificator.2@kpk-wbs.test`, `supervisor.investigator@kpk-wbs.test`, `investigator.1@kpk-wbs.test`, `investigator.2@kpk-wbs.test`, `director@kpk-wbs.test`
- administration:
  `sysadmin@kpk-wbs.test`

## Local-Only Detailed Packs

When detailed scripted testing is needed, use the local-only workspaces under `docs/`:

- `docs/ai-agent-test-pack/`
- `docs/ai-agent-test-result/`
- `docs/human-test-pack/`

These folders are intentionally ignored by Git and can evolve independently from the committed public documentation.

## Related Documentation

- [README.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/README.md)
- [docs/architecture.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/architecture.md)
- [docs/api.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/api.md)
- [backend/README.md](/Users/mbp13m2-003/development/utwente/wbs-thesis/backend/README.md)
