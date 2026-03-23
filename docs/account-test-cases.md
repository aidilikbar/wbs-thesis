# KPK Whistleblowing System Account Test Cases

This document provides manual test cases for the seeded accounts created by `php artisan migrate:fresh --seed`.

## Preconditions

- Backend is running at `http://localhost:8000`
- Frontend is running at `http://localhost:3000`
- Database has been refreshed with the demo seed:

```bash
cd backend
php artisan migrate:fresh --seed
```

- All seeded accounts use password `Password123`
- Reset the database between workflow scenarios if you want deterministic results

## Account Access Matrix

| ID | Account | Role | Default route after login | Expected seeded state |
| --- | --- | --- | --- | --- |
| ACC-01 | `reporter.1@example.test` | Reporter | `/submit` | Sees one submitted report waiting for verification delegation |
| ACC-02 | `reporter.2@example.test` | Reporter | `/submit` | Sees one report at `verification_review` |
| ACC-03 | `reporter.3@example.test` | Reporter | `/submit` | Sees one report at `investigation_in_progress` |
| ACC-04 | `reporter.4@example.test` | Reporter | `/submit` | Sees one completed report |
| ACC-05 | `sysadmin@kpk-wbs.test` | System Administrator | `/admin` | Can list users and create new internal accounts |
| ACC-06 | `supervisor.verificator@kpk-wbs.test` | Supervisor of Verificator | `/workflow` | Sees all seeded cases under verification supervision; actionable on submitted and verification-review stages |
| ACC-07 | `verificator.1@kpk-wbs.test` | Verificator | `/workflow` | Sees cases historically assigned to Verificator 1; default seed is mostly read-only until a case is returned or delegated |
| ACC-08 | `verificator.2@kpk-wbs.test` | Verificator | `/workflow` | Sees cases historically assigned to Verificator 2; default seed is mostly read-only until a new delegation occurs |
| ACC-09 | `supervisor.investigator@kpk-wbs.test` | Supervisor of Investigator | `/workflow` | Sees all seeded cases under investigation supervision; default seed has visibility but no immediately actionable case |
| ACC-10 | `investigator.1@kpk-wbs.test` | Investigator | `/workflow` | Has one actionable case in `investigation_in_progress` |
| ACC-11 | `investigator.2@kpk-wbs.test` | Investigator | `/workflow` | Sees completed history assigned to Investigator 2; no immediate action in the default seed |
| ACC-12 | `director@kpk-wbs.test` | Director | `/workflow` | Sees director-owned cases; no immediate action in the default seed because no seeded case is at `director_review` |

## Shared Authentication Test

### TC-AUTH-01: Login and role routing for all seeded accounts

**Objective**
Verify that each seeded account can authenticate and is routed to the correct role workspace.

**Accounts**
Use all accounts in `ACC-01` through `ACC-12`.

**Steps**
1. Open `http://localhost:3000/login`
2. Enter the selected email and `Password123`
3. Submit the login form
4. Observe the page route and visible workspace

**Expected result**
- Reporter accounts are redirected to `/submit`
- System Administrator is redirected to `/admin`
- All other internal accounts are redirected to `/workflow`
- No unauthorized or role-mismatch message is displayed

## Reporter Test Cases

### TC-RPT-01: Reporter 1 can view submitted report

**Account**
`reporter.1@example.test`

**Objective**
Verify that a reporter can see the seeded report that is still in the submitted stage.

**Steps**
1. Log in as `reporter.1@example.test`
2. Open `/submit`
3. Review the reporter report list or recent submissions area

**Expected result**
- One seeded report is visible
- Status remains `submitted`
- The report shows a public reference and current workflow ownership under verification supervision

### TC-RPT-02: Reporter 2 can view verification-review status

**Account**
`reporter.2@example.test`

**Objective**
Verify visibility of a report that has already been verified by a verificator and is pending supervisory review.

**Steps**
1. Log in as `reporter.2@example.test`
2. Open `/submit`
3. Inspect the seeded report details

**Expected result**
- One report is visible
- Status is `verification_review`
- The report reflects progress beyond initial submission

### TC-RPT-03: Reporter 3 can view investigation-in-progress status

**Account**
`reporter.3@example.test`

**Objective**
Verify visibility of a report already delegated into investigation.

**Steps**
1. Log in as `reporter.3@example.test`
2. Open `/submit`
3. Inspect the report summary

**Expected result**
- One report is visible
- Status is `investigation_in_progress`
- Current role is aligned to investigator handling

### TC-RPT-04: Reporter 4 can view completed report

**Account**
`reporter.4@example.test`

**Objective**
Verify visibility of a fully completed case.

**Steps**
1. Log in as `reporter.4@example.test`
2. Open `/submit`
3. Inspect the report summary

**Expected result**
- One report is visible
- Status is `completed`
- The report shows the final completed state

### TC-RPT-05: Reporter can submit a new report and receive tracking credentials

**Accounts**
Run separately for any reporter account

**Objective**
Verify successful authenticated submission and issuance of tracking credentials.

**Steps**
1. Log in as a reporter
2. Open `/submit`
3. Complete the report form with valid data
4. Submit the report
5. Record the generated public reference and tracking token from the receipt panel

**Expected result**
- Submission succeeds
- A receipt is shown
- Public reference is generated
- Tracking token is generated
- The new case appears in the reporter report list

### TC-RPT-06: Reporter can track a case using the issued reference and token

**Accounts**
Use the reporter account from `TC-RPT-05`

**Objective**
Verify the public tracking workflow.

**Steps**
1. Complete `TC-RPT-05`
2. Open `/track`
3. Enter the public reference and tracking token from the submission receipt
4. Submit the tracking form

**Expected result**
- Tracking record loads successfully
- Public-safe timeline is displayed
- No internal-only workflow note is exposed

## Administration Test Case

### TC-ADM-01: System Administrator can create an internal user

**Account**
`sysadmin@kpk-wbs.test`

**Objective**
Verify internal-user provisioning by the system administrator.

**Steps**
1. Log in as `sysadmin@kpk-wbs.test`
2. Open `/admin`
3. Create a new internal account with a unique email
4. Save the form
5. Verify the new account appears in the user directory

**Expected result**
- User creation succeeds
- New account is listed in the provisioned users panel
- Created account can later log in through `/login`

## Workflow Test Cases

### TC-WF-01: Supervisor of Verificator delegates Reporter 1 case to Verificator 2

**Accounts**
- `supervisor.verificator@kpk-wbs.test`
- `verificator.2@kpk-wbs.test`

**Objective**
Verify delegation from submitted stage into verification work.

**Steps**
1. Log in as `supervisor.verificator@kpk-wbs.test`
2. Open `/workflow`
3. Select Reporter 1 seeded case: `Request for unofficial payment before vendor evaluation`
4. Execute `Delegate to verificator`
5. Choose `verificator.2@kpk-wbs.test`
6. Save the action
7. Log in as `verificator.2@kpk-wbs.test`
8. Confirm the delegated case is now visible and actionable

**Expected result**
- Case stage changes from `submitted` to `verification_in_progress`
- Current role becomes Verificator
- Verificator 2 can see the case and has the `submit_verification` action available

### TC-WF-02: Verificator 2 submits verification for Reporter 1 case

**Accounts**
- `verificator.2@kpk-wbs.test`
- `supervisor.verificator@kpk-wbs.test`

**Precondition**
`TC-WF-01` completed

**Objective**
Verify verification submission back to the supervisor.

**Steps**
1. Stay logged in as `verificator.2@kpk-wbs.test`
2. Open the delegated Reporter 1 case
3. Enter an internal note
4. Optionally publish a public-safe update
5. Submit verification
6. Log in as `supervisor.verificator@kpk-wbs.test`
7. Confirm the same case is now pending review

**Expected result**
- Case stage becomes `verification_review`
- Current role becomes Supervisor of Verificator
- Supervisor can see `review_verification` as the available action

### TC-WF-03: Supervisor rejects Reporter 2 verification and Verificator 1 resubmits

**Accounts**
- `supervisor.verificator@kpk-wbs.test`
- `verificator.1@kpk-wbs.test`

**Objective**
Verify the rejection loop for the verification stage.

**Steps**
1. Log in as `supervisor.verificator@kpk-wbs.test`
2. Open Reporter 2 seeded case: `Possible conflict of interest in evaluation panel`
3. Execute `Review verification`
4. Choose decision `rejected`
5. Save the action
6. Log in as `verificator.1@kpk-wbs.test`
7. Confirm the same case becomes actionable
8. Submit verification again with a revised internal note

**Expected result**
- After supervisor rejection, the case returns to `verification_in_progress`
- Current role becomes Verificator
- Verificator 1 regains `submit_verification`
- After resubmission, the case returns to `verification_review`

### TC-WF-04: Supervisor approves Reporter 2 verification and hands off to investigation supervision

**Accounts**
- `supervisor.verificator@kpk-wbs.test`
- `supervisor.investigator@kpk-wbs.test`

**Precondition**
`TC-WF-03` completed through re-submission

**Objective**
Verify approval from verification review into the verified state.

**Steps**
1. Log in as `supervisor.verificator@kpk-wbs.test`
2. Open Reporter 2 case
3. Execute `Review verification`
4. Choose decision `approved`
5. Save the action
6. Log in as `supervisor.investigator@kpk-wbs.test`
7. Confirm the same case is now visible as a verified case

**Expected result**
- Case stage becomes `verified`
- Current role becomes Supervisor of Investigator
- Supervisor of Investigator has `delegate_investigation` available

### TC-WF-05: Supervisor of Investigator delegates Reporter 2 case to Investigator 2

**Accounts**
- `supervisor.investigator@kpk-wbs.test`
- `investigator.2@kpk-wbs.test`

**Precondition**
`TC-WF-04` completed

**Objective**
Verify delegation from verified stage into active investigation.

**Steps**
1. Log in as `supervisor.investigator@kpk-wbs.test`
2. Open Reporter 2 case
3. Execute `Delegate to investigator`
4. Choose `investigator.2@kpk-wbs.test`
5. Save the action
6. Log in as `investigator.2@kpk-wbs.test`
7. Confirm the case is actionable

**Expected result**
- Case stage becomes `investigation_in_progress`
- Current role becomes Investigator
- Investigator 2 has `submit_investigation` available

### TC-WF-06: Investigator 2 submits, supervisor rejects, investigator resubmits

**Accounts**
- `investigator.2@kpk-wbs.test`
- `supervisor.investigator@kpk-wbs.test`

**Precondition**
`TC-WF-05` completed

**Objective**
Verify the rejection loop for the investigation stage.

**Steps**
1. Log in as `investigator.2@kpk-wbs.test`
2. Submit investigation for Reporter 2 case
3. Log in as `supervisor.investigator@kpk-wbs.test`
4. Review the investigation with decision `rejected`
5. Log in again as `investigator.2@kpk-wbs.test`
6. Confirm the case is returned and actionable
7. Resubmit the investigation

**Expected result**
- First submission changes stage to `investigation_review`
- Rejection returns the case to `investigation_in_progress`
- Investigator 2 regains `submit_investigation`
- Re-submission changes stage back to `investigation_review`

### TC-WF-07: Investigator 1 submits seeded investigation case

**Account**
`investigator.1@kpk-wbs.test`

**Objective**
Verify action on the seeded investigation case that is already in progress.

**Steps**
1. Log in as `investigator.1@kpk-wbs.test`
2. Open Reporter 3 seeded case: `Repeated duplicate reimbursement patterns in finance unit`
3. Confirm `submit_investigation` is available
4. Submit the investigation note

**Expected result**
- Case stage changes to `investigation_review`
- Current role becomes Supervisor of Investigator

### TC-WF-08: Supervisor approves Reporter 3 investigation and sends to director

**Accounts**
- `supervisor.investigator@kpk-wbs.test`
- `director@kpk-wbs.test`

**Precondition**
`TC-WF-07` completed

**Objective**
Verify approval from investigation review into director review.

**Steps**
1. Log in as `supervisor.investigator@kpk-wbs.test`
2. Open Reporter 3 case
3. Execute `Review investigation`
4. Choose decision `approved`
5. Save the action
6. Log in as `director@kpk-wbs.test`
7. Confirm the case is now actionable for director review

**Expected result**
- Case stage becomes `director_review`
- Current role becomes Director
- Director has `director_review` available

### TC-WF-09: Director completes Reporter 3 case

**Account**
`director@kpk-wbs.test`

**Precondition**
`TC-WF-08` completed

**Objective**
Verify final approval and completion of a case.

**Steps**
1. Log in as `director@kpk-wbs.test`
2. Open Reporter 3 case
3. Execute `Director review`
4. Choose decision `approved`
5. Save the action
6. Optionally publish a public-safe completion message

**Expected result**
- Case stage becomes `completed`
- Report status becomes `completed`
- Reporter 3 can later observe the completed state in reporter and tracking views

## Notes for Thesis Evaluation

- The default seed intentionally distributes cases across multiple stages, so not every internal role has an immediately actionable item after seeding.
- Use the seeded-state reporter tests for visibility validation.
- Use the workflow scenarios for action validation and segregation-of-duties analysis.
- Re-run `php artisan migrate:fresh --seed` before each formal test cycle to reset the reference state.
