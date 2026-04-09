# KPK Whistleblowing System Prototype Scenario Test Cases

This document provides detailed manual test scenarios for the current prototype after:

```bash
cd /Users/mbp13m2-003/development/utwente/wbs-thesis/backend
php artisan migrate:fresh --seed
```

The scenarios are written so you can click through the UI directly and copy-paste the prepared values into the prototype.

## Preconditions

- Frontend is running at `http://localhost:3000`
- Backend is running at `http://localhost:8000`
- Swagger UI is available at `http://localhost:8000/api/documentation`
- Public tracking is available at `http://localhost:3000/track`
- The database has been reset with `php artisan migrate:fresh --seed`
- Optional local attachment fixtures are available in:
  - [docs/test-fixtures/scenario-a-procurement-note.txt](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/test-fixtures/scenario-a-procurement-note.txt)
  - [docs/test-fixtures/scenario-a-vendor-comparison.csv](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/test-fixtures/scenario-a-vendor-comparison.csv)
  - [docs/test-fixtures/scenario-b-screening-note.txt](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/test-fixtures/scenario-b-screening-note.txt)

All seeded accounts use password:

```text
Password123
```

## Seeded Account Matrix

| Role | Name | Email | Main route |
| --- | --- | --- | --- |
| Reporter | Laila N | `reporter.1@example.test` | `/submit` |
| Reporter | Fajar Kurniawan | `reporter.2@example.test` | `/submit` |
| Reporter | Rina Maharani | `reporter.3@example.test` | `/submit` |
| Reporter | Teguh Saputra | `reporter.4@example.test` | `/submit` |
| Verification Supervisor | Sinta Pramudita | `supervisor.verificator@kpk-wbs.test` | `/workflow` and `/workflow/approvals` |
| Verification Officer | Aditya Prakoso | `verificator.1@kpk-wbs.test` | `/workflow` |
| Verification Officer | Maya Lestari | `verificator.2@kpk-wbs.test` | `/workflow` |
| Investigation Supervisor | Bagas Santoso | `supervisor.investigator@kpk-wbs.test` | `/workflow` and `/workflow/approvals` |
| Investigator | Ayu Wicaksono | `investigator.1@kpk-wbs.test` | `/workflow` |
| Investigator | Dimas Haryanto | `investigator.2@kpk-wbs.test` | `/workflow` |
| Director | Nadia Prabowo | `director@kpk-wbs.test` | `/workflow/approvals` |
| System Administrator | Raka Mahendra | `sysadmin@kpk-wbs.test` | `/admin` |

## Quick UI Reference

### Reporter form fields

- `Report Title`
- `Report Description`
- `Reported Parties`
  - `Full Name`
  - `Position`
  - `Position Classification`
- `Report Attachments`
- Buttons:
  - `Submit Report`
  - `Save Changes`

### Verification supervisor action labels

- `Verification Screening`
  - `Distribution Target`
  - `Distribution Note`
  - checkbox: reject report during initial screening
  - button: `Save Screening Decision`
- `Verification Approval`
  - `Decision`
  - `Approval Note`
  - optional `Public Message`
  - button: `Record Verification Approval`

### Verification officer action labels

- `Information Summary`
- `Complaint Tagging`
- `Has KPK Authority?`
- `Criminal Assessment`
- `Reason`
- `Recommendation`
- `Forwarding Destination` when recommendation is `Forward`
- button: `Submit Verification Assessment`

### Investigation supervisor action labels

- `Investigation Delegation`
  - `Distribution Target`
  - `Distribution Note`
  - button: `Delegate Investigation`
- `Investigation Approval`
  - `Decision`
  - `Approval Note`
  - optional `Public Message`
  - button: `Record Investigation Approval`

### Investigator action labels

- `Case Name`
- `Reported Parties in Investigation`
- `Complaint Description`
- `Investigation Tagging`
- `Investigation Recommendation`
- `Delict`
- `Article`
- `Start Month`
- `Start Year`
- `End Month`
- `End Year`
- `City`
- `Province`
- `Modus`
- `Related WBS Report`
- `Has Authority?`
- checkbox: `Mark as priority`
- `Additional Information`
- `Conclusion`
- button: `Submit Investigation Assessment`

### Director action labels

- `Decision`
- `Approval Note`
- optional `Public Message`
- button: `Record Director Decision`

## Select List Values Used In The Scenarios

### Position Classification

- `State official`
- `Civil servant`
- `Law enforcement officer`
- `Other`

### Complaint Tagging / Investigation Tagging

- `Bribery`
- `Gratuity`
- `Procurement irregularity`
- `Abuse of authority`
- `Conflict of interest`
- `State financial loss`
- `Obstruction of justice`
- `Other corruption aspect`

### Verification Recommendation

- `Investigation`
- `Forward`
- `Archive`

### Investigation Recommendation

- `Forward internally`
- `Forward externally`
- `Archive`

### Delict

- `State financial loss`
- `Bribery`
- `Embezzlement in office`
- `Extortion`
- `Fraudulent act`
- `Conflict of interest in procurement`
- `Gratification`
- `Obstruction of justice`
- `Other`

## Repeatable End-To-End Scenarios

These scenarios create new reports first, so they remain predictable even if seeded queue records have already been changed by earlier tests.

### SCN-01 Full Investigation Path To Director Completion

**Goal**  
Validate the full happy path across reporter, verification, investigation, and director roles.

**Roles involved**

1. `reporter.1@example.test`
2. `supervisor.verificator@kpk-wbs.test`
3. `verificator.1@kpk-wbs.test`
4. `supervisor.investigator@kpk-wbs.test`
5. `investigator.1@kpk-wbs.test`
6. `director@kpk-wbs.test`

**Reporter submission values**

`Report Title`

```text
SCN-01 Full investigation path: procurement committee favors vendor
```

`Report Description`

```text
During the final procurement evaluation for a facilities maintenance package, the reporting party observed that committee members discussed an unofficial payment request before the technical ranking was finalized. The reporting party also observed that one vendor's score sheet was changed after the scoring session closed. The incident was discussed again two days later in an internal follow-up meeting.
```

`Reported Parties` entry 1

```text
Full Name: Budi Santoso
Position: Head of Procurement Evaluation Team
Position Classification: State official
```

`Reported Parties` entry 2

```text
Full Name: Sari Wulandari
Position: Procurement Committee Secretary
Position Classification: Civil servant
```

`Attachments`

- Upload [docs/test-fixtures/scenario-a-procurement-note.txt](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/test-fixtures/scenario-a-procurement-note.txt)
- Upload [docs/test-fixtures/scenario-a-vendor-comparison.csv](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/test-fixtures/scenario-a-vendor-comparison.csv)

**Steps**

1. Log in as `reporter.1@example.test`
2. Open `http://localhost:3000/submit/create`
3. Fill the reporter form with the values above
4. Click `Submit Report`
5. On the redirect back to `/submit`, copy the issued `Public Reference` and `Tracking Token`
6. Log out
7. Log in as `supervisor.verificator@kpk-wbs.test`
8. Open `/workflow`
9. Search for:

```text
SCN-01 Full investigation path: procurement committee favors vendor
```

10. Open the workflow case
11. In `Verification Screening`, fill:

```text
Distribution Target: Aditya Prakoso · Verification Desk
Distribution Note: Initial screening passed. The allegation contains a concrete procurement context, named officials, and two supporting files. Proceed with formal verification.
```

12. Click `Save Screening Decision`
13. Log out
14. Log in as `verificator.1@kpk-wbs.test`
15. Open `/workflow`
16. Search for the same title and open the case
17. In `Verification Assessment`, fill:

`Information Summary`

```text
The report contains a coherent chronology, two named internal actors, and supporting files that align with the allegation. The described conduct indicates possible procurement manipulation and an attempted unofficial payment before ranking finalization.
```

`Complaint Tagging`

- Click `Procurement irregularity`
- Click `Conflict of interest`
- Click `Bribery`

`Has KPK Authority?`

```text
Yes
```

`Criminal Assessment`

```text
Indicated corruption/crime
```

`Reason`

```text
The allegation concerns public procurement, possible illicit advantage, and manipulation of evaluation results. The issue concerns public officials and falls within corruption control and enforcement scope.
```

`Recommendation`

```text
Investigation
```

`Publish a public-safe update`

- Check the box
- Fill `Public Message`:

```text
Your report has completed the verification assessment stage and is pending supervisory review.
```

18. Click `Submit Verification Assessment`
19. Log out
20. Log in as `supervisor.verificator@kpk-wbs.test`
21. Open `/workflow/approvals`
22. Search for the same title and open the case
23. Fill:

`Decision`

```text
Approved
```

`Approval Note`

```text
Verification accepted. The report demonstrates sufficient basis for investigation and should proceed to the investigation supervisor for delegation.
```

`Public Message`

```text
Verification has been completed and your report is moving to the next internal handling stage.
```

24. Click `Record Verification Approval`
25. Log out
26. Log in as `supervisor.investigator@kpk-wbs.test`
27. Open `/workflow`
28. Search for the same title and open the case
29. In `Investigation Delegation`, fill:

```text
Distribution Target: Ayu Wicaksono · Investigation Desk
Distribution Note: Prioritize vendor-evaluation chronology, scoring sheet changes, and any direct or indirect payment request before final ranking confirmation.
```

30. Click `Delegate Investigation`
31. Log out
32. Log in as `investigator.1@kpk-wbs.test`
33. Open `/workflow`
34. Search for the same title and open the case
35. Fill `Investigation Assessment` with:

`Case Name`

```text
Procurement scoring manipulation and unofficial payment allegation
```

`Reported Parties in Investigation`

Entry 1:

```text
Full Name: Budi Santoso
Position: Head of Procurement Evaluation Team
Position Classification: State official
```

Entry 2:

```text
Full Name: Sari Wulandari
Position: Procurement Committee Secretary
Position Classification: Civil servant
```

`Complaint Description`

```text
The investigation file focuses on alleged manipulation of procurement scoring and an unofficial payment request linked to final vendor ranking. Supporting materials indicate that a score sheet changed after the formal evaluation session and that the payment request was discussed before ranking confirmation.
```

`Investigation Tagging`

- Click `Procurement irregularity`
- Click `Conflict of interest`
- Click `Bribery`
- Click `State financial loss`

`Investigation Recommendation`

```text
Forward internally
```

`Delict`

```text
Bribery
```

`Article`

```text
Law 31/1999 Article 5
```

`Start Month`

```text
March
```

`Start Year`

```text
2026
```

`End Month`

```text
March
```

`End Year`

```text
2026
```

`City`

```text
Bandung
```

`Province`

```text
West Java
```

`Modus`

```text
The suspected modus was to influence the final vendor ranking through post-session score adjustments while conditioning favorable treatment on an unofficial payment request.
```

`Related WBS Report`

```text
Leave blank
```

`Has Authority?`

```text
Yes
```

`Mark as priority`

```text
Checked
```

`Additional Information`

```text
The attachment set suggests the chronology can be cross-checked against procurement committee attendance and final ranking records.
```

`Conclusion`

```text
The allegation is sufficiently structured for supervisory review. The available information supports escalation and further internal action on procurement integrity, illicit payment risk, and scoring manipulation.
```

`Public Message`

```text
The investigation file has been completed and is pending supervisory review.
```

36. Click `Submit Investigation Assessment`
37. Log out
38. Log in as `supervisor.investigator@kpk-wbs.test`
39. Open `/workflow/approvals`
40. Search for the same title and open the case
41. Fill:

`Decision`

```text
Approved
```

`Approval Note`

```text
Investigation assessment accepted. The file is complete enough for director-level review and final decision recording.
```

`Public Message`

```text
The investigation has been endorsed and is awaiting final director review.
```

42. Click `Record Investigation Approval`
43. Log out
44. Log in as `director@kpk-wbs.test`
45. Open `/workflow/approvals`
46. Search for the same title and open the case
47. Fill:

`Decision`

```text
Approved
```

`Approval Note`

```text
Director approval granted. The report is completed with sufficient documented basis for closure and downstream action handling.
```

`Public Message`

```text
Your report has completed the current workflow and has been formally closed.
```

48. Click `Record Director Decision`
49. Log out
50. Log back in as `reporter.1@example.test`
51. Open `/submit`
52. Search for the exact report title
53. Confirm the report status is now `completed`
54. Open `/track`, paste the copied `Public Reference` and `Tracking Token`, and confirm the public tracking record shows the report as completed

**Expected result**

- The report progresses through all major roles without route mismatches
- Secure communication stays available on the edit pages
- Public-safe updates appear in tracking only when explicitly published
- The final status is `completed`

### SCN-02 Screening Rejection Path

**Goal**  
Validate that the verification supervisor can reject a report during initial screening and end the case immediately.

**Roles involved**

1. `reporter.2@example.test`
2. `supervisor.verificator@kpk-wbs.test`

**Reporter submission values**

`Report Title`

```text
SCN-02 Screening rejection path: malformed non-case submission
```

`Report Description`

```text
This submission intentionally simulates a low-quality or invalid filing for interface testing. It does not contain a verifiable corruption allegation, event chronology, or usable supporting evidence.
```

`Reported Parties` entry 1

```text
Full Name: Unknown Test Actor
Position: Unclear
Position Classification: Other
```

`Attachment`

- Upload [docs/test-fixtures/scenario-b-screening-note.txt](/Users/mbp13m2-003/development/utwente/wbs-thesis/docs/test-fixtures/scenario-b-screening-note.txt)

**Steps**

1. Log in as `reporter.2@example.test`
2. Open `/submit/create`
3. Submit the report using the values above
4. Log out
5. Log in as `supervisor.verificator@kpk-wbs.test`
6. Open `/workflow`
7. Search for:

```text
SCN-02 Screening rejection path: malformed non-case submission
```

8. Open the case
9. In `Verification Screening`, check the rejection checkbox
10. Fill `Distribution Note`:

```text
Closed during screening. The submission does not provide a concrete corruption allegation, lacks a verifiable chronology, and is retained only as a controlled invalid-entry test.
```

11. Click `Save Screening Decision`
12. Return to `/workflow` and confirm the case is no longer in the actionable queue
13. Log in again as `reporter.2@example.test`
14. Open `/submit`
15. Search for the same title and confirm the report is completed

**Expected result**

- The case is closed directly from the verification supervisor screen
- No verification officer assignment is required
- The reporter sees a completed/closed outcome without further workflow stages

### SCN-03 Verification Forward Path

**Goal**  
Validate the `Forward` recommendation path where the case is completed after verification approval and does not proceed to investigation.

**Roles involved**

1. `reporter.3@example.test`
2. `supervisor.verificator@kpk-wbs.test`
3. `verificator.2@kpk-wbs.test`

**Reporter submission values**

`Report Title`

```text
SCN-03 Forward path: complaint should be routed outside the main investigation lane
```

`Report Description`

```text
The reporting party alleges a concerning integrity issue involving service queue access and a requested informal contribution, but the preferred handling path for this scenario is forwarding rather than a full investigation workflow.
```

`Reported Parties` entry 1

```text
Full Name: Rudi Hartono
Position: Front Office Coordinator
Position Classification: Civil servant
```

**Steps**

1. Log in as `reporter.3@example.test`
2. Submit the report at `/submit/create`
3. Log in as `supervisor.verificator@kpk-wbs.test`
4. Search the title in `/workflow`
5. Delegate the case to `Maya Lestari · Verification Desk`
6. Use this `Distribution Note`:

```text
Please confirm whether the allegation should be formally forwarded instead of entering the investigation lane.
```

7. Click `Save Screening Decision`
8. Log in as `verificator.2@kpk-wbs.test`
9. Search the title in `/workflow`
10. Fill:

`Information Summary`

```text
The report contains a narrow allegation with enough detail for verification, but the recommended handling path for this scenario is forwarding completion rather than internal investigation.
```

`Complaint Tagging`

- Click `Abuse of authority`
- Click `Other corruption aspect`

`Has KPK Authority?`

```text
Yes
```

`Criminal Assessment`

```text
Indicated corruption/crime
```

`Reason`

```text
The report merits controlled follow-up, but the proposed route is forwarding to the designated destination rather than opening an investigation file in this prototype scenario.
```

`Recommendation`

```text
Forward
```

`Forwarding Destination`

```text
Inspectorate General Follow-Up Desk
```

`Public Message`

```text
Your report has completed the verification assessment stage and is pending supervisory review.
```

11. Click `Submit Verification Assessment`
12. Log in again as `supervisor.verificator@kpk-wbs.test`
13. Open `/workflow/approvals`, search the title, open the case
14. Fill:

`Decision`

```text
Approved
```

`Approval Note`

```text
Verification accepted. The report is completed through the forwarding path and does not require investigation delegation.
```

`Public Message`

```text
Your report has completed verification and has been forwarded for the designated follow-up route.
```

15. Click `Record Verification Approval`

**Expected result**

- The case is completed after verification approval
- The case does not appear in the investigation supervisor queue
- The forwarding destination is preserved in the workflow record

### SCN-04 Verification Archive Path

**Goal**  
Validate the `Archive` recommendation path where the case is closed after verification approval.

**Roles involved**

1. `reporter.4@example.test`
2. `supervisor.verificator@kpk-wbs.test`
3. `verificator.1@kpk-wbs.test`

**Reporter submission values**

`Report Title`

```text
SCN-04 Archive path: insufficient basis after verification
```

`Report Description`

```text
This scenario represents a report that can be screened and verified, but the final verification conclusion should be archival completion rather than further internal escalation.
```

`Reported Parties` entry 1

```text
Full Name: Test Archive Subject
Position: Administrative Liaison
Position Classification: Other
```

**Steps**

1. Submit the report as `reporter.4@example.test`
2. As `supervisor.verificator@kpk-wbs.test`, delegate it to `Aditya Prakoso · Verification Desk`
3. Use this screening note:

```text
Verification is still required, but the case may ultimately be suitable for archival completion depending on the assessment result.
```

4. As `verificator.1@kpk-wbs.test`, fill:

`Information Summary`

```text
The allegation can be documented, but the available information is limited and does not support escalation beyond verification handling in this scenario.
```

`Complaint Tagging`

- Click `Other corruption aspect`

`Has KPK Authority?`

```text
Yes
```

`Criminal Assessment`

```text
Not indicated
```

`Reason`

```text
The report does not provide enough substance for escalation, but it should be formally concluded through the archival path after supervisory approval.
```

`Recommendation`

```text
Archive
```

5. Click `Submit Verification Assessment`
6. As `supervisor.verificator@kpk-wbs.test`, open the case from `/workflow/approvals`
7. Fill:

`Decision`

```text
Approved
```

`Approval Note`

```text
Verification accepted. The case is concluded through archival completion and should not proceed to investigation.
```

8. Click `Record Verification Approval`

**Expected result**

- The case finishes without entering investigation
- The report is completed after the supervisory approval step

## Seeded Quick-Access Role Scenarios

These are useful when you want to validate a role screen quickly after a fresh reseed without creating a new report first.

### Seeded queue targets after fresh reseed

| Scenario use | Case Number | Stage | Current role | Public Reference | Report title |
| --- | --- | --- | --- | --- | --- |
| Verification screening | `CASE-2026-0001` | `submitted` | `supervisor_of_verificator` | `WBS-2026-0001` | Request for unofficial payment before vendor evaluation |
| Verification submission | `CASE-2026-0006` | `verification_in_progress` | `verificator` | `WBS-2026-0006` | Unofficial donation request tied to access to public service queue |
| Verification approval | `CASE-2026-0002` | `verification_review` | `supervisor_of_verificator` | `WBS-2026-0002` | Possible conflict of interest in evaluation panel |
| Investigation delegation | `CASE-2026-0015` | `verified` | `supervisor_of_investigator` | `WBS-2026-0015` | Tender committee directed scoring adjustments for a preferred vendor |
| Investigation submission | `CASE-2026-0003` | `investigation_in_progress` | `investigator` | `WBS-2026-0003` | Repeated duplicate reimbursement patterns in finance unit |
| Investigation approval | `CASE-2026-0009` | `investigation_review` | `supervisor_of_investigator` | `WBS-2026-0009` | Performance score reduced after reporting irregular procurement communication |
| Director decision | `CASE-2026-0016` | `director_review` | `director` | `WBS-2026-0016` | Performance score reduced after reporting irregular procurement communication |

### SCN-05 Verification Approval Rejection Loop Using Seeded Data

**Role**  
`supervisor.verificator@kpk-wbs.test`

**Target case**

```text
CASE-2026-0002 / WBS-2026-0002 / Possible conflict of interest in evaluation panel
```

**Steps**

1. Log in as verification supervisor
2. Open `/workflow/approvals`
3. Search for `WBS-2026-0002`
4. Open the case
5. Fill:

`Decision`

```text
Rejected
```

`Approval Note`

```text
Return to the verification officer. The current assessment needs a clearer explanation of the alleged conflict relationship and a more explicit verification rationale.
```

6. Click `Record Verification Approval`
7. Log out
8. Log in as `verificator.1@kpk-wbs.test`
9. Open `/workflow`
10. Confirm the case has returned to the verification officer queue

**Expected result**

- The case leaves `/workflow/approvals`
- The case returns to `verification_in_progress`
- The verification officer becomes the current handler again

### SCN-06 Investigation Approval Rejection Loop Using Seeded Data

**Role**  
`supervisor.investigator@kpk-wbs.test`

**Target case**

```text
CASE-2026-0009 / WBS-2026-0009 / Performance score reduced after reporting irregular procurement communication
```

**Steps**

1. Log in as investigation supervisor
2. Open `/workflow/approvals`
3. Search for `WBS-2026-0009`
4. Open the case
5. Fill:

`Decision`

```text
Rejected
```

`Approval Note`

```text
Return to the investigator. The chronology is not yet strong enough and should include a clearer link between the reported retaliation and the procurement communication concern.
```

6. Click `Record Investigation Approval`
7. Log out
8. Log in as `investigator.1@kpk-wbs.test` or `investigator.2@kpk-wbs.test`
9. Open `/workflow`
10. Confirm the case returned to the investigator queue

**Expected result**

- The case returns to `investigation_in_progress`
- The current role becomes `investigator`

### SCN-07 Director Rejection Loop Using Seeded Data

**Role**  
`director@kpk-wbs.test`

**Target case**

```text
CASE-2026-0016 / WBS-2026-0016 / Performance score reduced after reporting irregular procurement communication
```

**Steps**

1. Log in as director
2. Open `/workflow/approvals`
3. Search for `WBS-2026-0016`
4. Open the case
5. Fill:

`Decision`

```text
Rejected
```

`Approval Note`

```text
The investigation must return to the investigator for additional corroboration and a stronger evidentiary bridge between the alleged retaliation and the triggering report.
```

6. Click `Record Director Decision`
7. Log out
8. Log in as the relevant investigator and confirm the case is back in the workflow queue

**Expected result**

- The case returns from `director_review` to `investigation_in_progress`
- The investigator becomes the current role again

## Public Tracking Scenario

### SCN-08 Public Tracking Using A Newly Submitted Report

**Goal**  
Validate the anonymous/public-safe tracking page independently from the authenticated reporter workspace.

**Recommended source report**

- Reuse the report created in `SCN-01`, `SCN-02`, `SCN-03`, or `SCN-04`

**Steps**

1. While logged in as the reporter, open `/submit`
2. Copy the `Public Reference`
3. Copy the `Tracking Token`
4. Log out
5. Open `http://localhost:3000/track`
6. Paste the copied `Public Reference`
7. Paste the copied `Tracking Token`
8. Submit the tracking form

**Expected result**

- Public tracking succeeds without authentication
- The page shows only public-safe status and milestone information
- Internal notes, workflow payloads, and secure messages are not exposed

## Administration Scenario

### SCN-09 System Administrator Creates And Edits An Internal User

**Role**  
`sysadmin@kpk-wbs.test`

**Create values**

```text
Name: Stage Two Verification User
Phone: +62-812-7000-0001
Email: stage2.verification.user.20260409@kpk-wbs.test
Role: Verification Officer
Unit: Verification Desk
Password: Password123
Confirm password: Password123
```

**Edit values**

```text
Name: Stage Two Verification User Updated
Phone: +62-812-7000-0011
Unit: Protected Verification Desk
Account is active: checked
```

**Steps**

1. Log in as `sysadmin@kpk-wbs.test`
2. Open `/admin/create`
3. Fill the create form with the values above
4. Click `Create Internal User`
5. Back on `/admin`, search for:

```text
stage2.verification.user.20260409@kpk-wbs.test
```

6. Open the row for editing
7. Change the fields to the edit values above
8. Click `Save Changes`
9. Return to `/admin`
10. Confirm the updated name, phone, and unit appear in the directory

**Expected result**

- The create page and edit page both work on their own dedicated routes
- The record appears immediately in the directory after creation
- The updated data is reflected after editing

## Notes

- The most repeatable workflow scenarios are `SCN-01` through `SCN-04` because they create their own fresh report records.
- The seeded quick-access scenarios are faster, but they mutate local seeded data. Run `php artisan migrate:fresh --seed` before repeating them in a clean state.
- Attachment validation currently allows up to 10 files and 20 MB per file, with these extensions: `pdf`, `jpg`, `jpeg`, `png`, `webp`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `csv`, `txt`, `zip`.
