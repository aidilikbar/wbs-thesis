# KPK Whistleblowing System Account Test Cases

This document provides manual test cases for the seeded accounts created by:

```bash
cd backend
php artisan migrate:fresh --seed
```

All seeded accounts use password `Password123`.

## Preconditions

- frontend is running at `http://localhost:3000`
- backend is running at `http://localhost:8000`
- MinIO is running for local attachment scenarios
- database has been reset with the latest seed before formal workflow testing

## Account Access Matrix

| ID | Account | Role | Default route | Current seeded expectation |
| --- | --- | --- | --- | --- |
| ACC-01 | `reporter.1@example.test` | Reporter | `/submit` | Sees a paginated report ledger with multiple seeded reports |
| ACC-02 | `reporter.2@example.test` | Reporter | `/submit` | Sees a paginated report ledger with multiple seeded reports |
| ACC-03 | `reporter.3@example.test` | Reporter | `/submit` | Sees a paginated report ledger with multiple seeded reports |
| ACC-04 | `reporter.4@example.test` | Reporter | `/submit` | Sees a paginated report ledger with multiple seeded reports |
| ACC-05 | `sysadmin@kpk-wbs.test` | System Administrator | `/admin` | Can manage the paginated user directory |
| ACC-06 | `supervisor.verificator@kpk-wbs.test` | Verification Supervisor | `/workflow` | Uses workflow queue and approval queue |
| ACC-07 | `verificator.1@kpk-wbs.test` | Verification Officer | `/workflow` | Uses workflow queue only |
| ACC-08 | `verificator.2@kpk-wbs.test` | Verification Officer | `/workflow` | Uses workflow queue only |
| ACC-09 | `supervisor.investigator@kpk-wbs.test` | Investigation Supervisor | `/workflow` | Uses workflow queue and approval queue |
| ACC-10 | `investigator.1@kpk-wbs.test` | Investigator | `/workflow` | Uses workflow queue only |
| ACC-11 | `investigator.2@kpk-wbs.test` | Investigator | `/workflow` | Uses workflow queue only |
| ACC-12 | `director@kpk-wbs.test` | Director | `/workflow` | Uses approval queue for final decisions |

## Shared Authentication Test

### TC-AUTH-01: Login and role routing

**Objective**  
Verify that each seeded account can authenticate and is routed to the correct workspace.

**Steps**

1. Open `http://localhost:3000/login`
2. Sign in with one seeded account and `Password123`
3. Observe the post-login route

**Expected Result**

- Reporter accounts are redirected to `/submit`
- System Administrator is redirected to `/admin`
- All other internal roles are redirected to `/workflow`

## Reporter Test Cases

### TC-RPT-01: Reporter ledger supports search and pagination

**Accounts**  
Run separately for `reporter.1@example.test` through `reporter.4@example.test`

**Objective**  
Verify the reporter report directory.

**Steps**

1. Log in as a reporter
2. Open `/submit`
3. Confirm the report ledger is rendered as a table
4. Confirm pagination is limited to 10 rows per page
5. Use search and status filter

**Expected Result**

- The reporter sees only their own reports
- The ledger supports search and status filtering
- Pagination is 10 rows per page
- Each row opens a dedicated detail page at `/submit/{reportId}/edit`

### TC-RPT-02: Reporter creates a report with reported parties and attachments

**Objective**  
Verify authenticated report submission from the dedicated create page.

**Steps**

1. Log in as any reporter
2. Open `/submit/create`
3. Complete the form with:
   - title
   - description
   - at least one reported party entry
4. Select valid files in the attachment section
5. Submit the report

**Expected Result**

- Submission succeeds
- A public reference and tracking token are issued
- The new report appears in `/submit`
- Attachments are accepted only when they pass validation

### TC-RPT-03: Reporter views tracking state inside the authenticated detail page

**Objective**  
Verify that authenticated reporters can track their case without leaving the report detail page.

**Steps**

1. Log in as any reporter
2. Open `/submit`
3. Open one report detail page

**Expected Result**

- The page shows tracking status before report information
- Case details and secure communication are separated into tabs
- The reporter can still use `/track` separately if needed

### TC-RPT-04: Reporter uses public tracking

**Objective**  
Verify public-safe token-based tracking.

**Steps**

1. Obtain a report public reference and tracking token from the authenticated workspace
2. Open `/track`
3. Submit the reference and token

**Expected Result**

- Tracking succeeds
- Only public-safe information is displayed
- Internal notes are not disclosed

## Administration Test Cases

### TC-ADM-01: System Administrator uses the paginated user directory

**Account**  
`sysadmin@kpk-wbs.test`

**Objective**  
Verify the administration index.

**Steps**

1. Log in as system administrator
2. Open `/admin`
3. Confirm table rendering, search, filters, and pagination

**Expected Result**

- The user directory is shown as a table
- Pagination is 10 rows per page
- Search, role filter, and status filter work

### TC-ADM-02: System Administrator creates and edits an internal user

**Objective**  
Verify dedicated create and edit pages.

**Steps**

1. From `/admin`, open `/admin/create`
2. Create an internal user with a unique email
3. Return to `/admin`
4. Open the new row in `/admin/{userId}/edit`
5. Modify the user and save

**Expected Result**

- Create and edit run on dedicated pages
- Save redirects back to `/admin`
- The user directory reflects the changes

## Workflow Test Cases

### TC-WF-01: Verification Supervisor uses the workflow queue

**Account**  
`supervisor.verificator@kpk-wbs.test`

**Objective**  
Verify the queue page structure.

**Steps**

1. Log in as Verification Supervisor
2. Open `/workflow`
3. Confirm table rendering, search, stage filter, and pagination

**Expected Result**

- The workflow queue is shown as a table
- Pagination is 10 rows per page
- Search and stage filtering work
- Actionable rows open `/workflow/{caseId}/edit`

### TC-WF-02: Verification Supervisor records screening and delegation

**Accounts**

- `supervisor.verificator@kpk-wbs.test`
- `verificator.1@kpk-wbs.test` or `verificator.2@kpk-wbs.test`

**Objective**  
Verify the first workflow gate.

**Steps**

1. Log in as Verification Supervisor
2. Open an actionable queue record from `/workflow`
3. Confirm the page route is `/workflow/{caseId}/edit`
4. Either:
   - reject the report during screening, or
   - assign it to a verification officer and enter a distribution note

**Expected Result**

- Rejected reports move directly to completion
- Delegated reports move to `verification_in_progress`
- Save redirects back to `/workflow`

### TC-WF-03: Verification Officer submits the verification assessment

**Objective**  
Verify verification submission.

**Steps**

1. Log in as the assigned Verification Officer
2. Open `/workflow`
3. Open the actionable case row
4. Complete the verification fields:
   - information summary
   - corruption aspect tags
   - authority assessment
   - criminal assessment
   - reason
   - recommendation
5. Submit the assessment

**Expected Result**

- The route is `/workflow/{caseId}/edit`
- The case moves to `verification_review`
- The case leaves the Verification Officer queue

### TC-WF-04: Verification Supervisor uses the approval queue

**Objective**  
Verify that verification approval is separated from the execution queue.

**Steps**

1. Log in as Verification Supervisor
2. Open `/workflow/approvals`
3. Open a case waiting for verification approval
4. Approve or reject it

**Expected Result**

- Approval cases appear under `/workflow/approvals`
- The case page route is `/workflow/{caseId}/approval`
- Approval or rejection redirects back to `/workflow/approvals`

### TC-WF-05: Investigation Supervisor delegates an approved case

**Account**  
`supervisor.investigator@kpk-wbs.test`

**Objective**  
Verify delegation into investigation.

**Steps**

1. Open `/workflow`
2. Locate a case in `verified`
3. Open its dedicated edit page
4. Delegate it to an Investigator with a distribution note

**Expected Result**

- The case moves to `investigation_in_progress`
- The assigned Investigator can see it in their workflow queue

### TC-WF-06: Investigator submits the structured investigation assessment

**Accounts**

- `investigator.1@kpk-wbs.test` or `investigator.2@kpk-wbs.test`

**Objective**  
Verify investigator submission.

**Steps**

1. Log in as the assigned Investigator
2. Open `/workflow`
3. Open an actionable case
4. Complete the investigation fields, including:
   - case name
   - reported parties
   - recommendation
   - delict
   - article
   - time window
   - place
   - modus
   - authority
   - priority
   - conclusion
5. Submit the investigation assessment

**Expected Result**

- The route is `/workflow/{caseId}/edit`
- The case moves to `investigation_review`

### TC-WF-07: Investigation Supervisor uses the approval queue

**Account**  
`supervisor.investigator@kpk-wbs.test`

**Objective**  
Verify investigation approval handling.

**Steps**

1. Open `/workflow/approvals`
2. Open a case waiting for investigation approval
3. Approve or reject the result

**Expected Result**

- Approval is handled from `/workflow/{caseId}/approval`
- Approved cases move to `director_review`
- Rejected cases return to `investigation_in_progress`

### TC-WF-08: Director completes a case from the approval queue

**Account**  
`director@kpk-wbs.test`

**Objective**  
Verify final approval routing.

**Steps**

1. Log in as Director
2. Open `/workflow/approvals`
3. Open a case in `director_review`
4. Record the final decision

**Expected Result**

- Final decision is handled on `/workflow/{caseId}/approval`
- Approved cases move to `completed`
- Rejected cases return for further investigation

## Notes for Evaluation

- The seed contains multiple report transactions per base reporter account, so reporter table pagination can be evaluated directly.
- Workflow actions change seeded state, so reset the database before repeating a formal scenario.
- Approval roles should validate both `/workflow` and `/workflow/approvals`; non-approval roles should validate that only `/workflow` is relevant to their duties.
