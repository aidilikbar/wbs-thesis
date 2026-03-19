<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\CaseTimelineEvent;
use App\Models\GovernanceControl;
use App\Models\Report;
use App\Models\User;
use App\Services\CaseWorkflowService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WbsDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        AuditLog::query()->delete();
        CaseTimelineEvent::query()->delete();
        CaseFile::query()->delete();
        Report::query()->delete();
        GovernanceControl::query()->delete();
        DB::table('personal_access_tokens')->delete();
        User::query()->delete();

        $users = $this->seedUsers();
        $this->seedGovernanceControls();

        /** @var CaseWorkflowService $workflow */
        $workflow = app(CaseWorkflowService::class);

        $submittedCase = $workflow->submitReport($users['reporter_1'], [
            'title' => 'Request for unofficial payment before vendor evaluation',
            'category' => 'procurement',
            'description' => 'A procurement liaison reported that an unofficial payment was requested before the evaluation committee would release the technical scoring outcome.',
            'incident_date' => now()->subDays(9)->toDateString(),
            'incident_location' => 'Bandung Regional Office',
            'accused_party' => 'Procurement Committee Member',
            'evidence_summary' => 'Meeting notes, screenshots, and two witnesses are available.',
            'confidentiality_level' => 'confidential',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement', 'financial-loss'],
        ]);

        $verificationReviewCase = $workflow->submitReport($users['reporter_2'], [
            'title' => 'Possible conflict of interest in evaluation panel',
            'category' => 'conflict_of_interest',
            'description' => 'A reviewer appears to have an undeclared family relationship with one of the shortlisted applicants during an evaluation process.',
            'incident_date' => now()->subDays(6)->toDateString(),
            'incident_location' => 'Integrity Review Unit',
            'accused_party' => 'Evaluation Panel Reviewer',
            'evidence_summary' => 'Public registry extracts and social-media evidence support the allegation.',
            'confidentiality_level' => 'identified',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['conflict-sensitive'],
        ]);

        $workflow->delegateToVerificator(
            CaseFile::query()->findOrFail($verificationReviewCase['caseFile']->id),
            $users['supervisor_of_verificator'],
            $users['verificator_1'],
            [
                'assigned_unit' => 'Verification Desk',
                'due_in_days' => 5,
            ]
        );

        $workflow->submitVerification(
            CaseFile::query()->findOrFail($verificationReviewCase['caseFile']->id),
            $users['verificator_1'],
            [
                'internal_note' => 'Document review is complete and the report is ready for supervisory decision.',
                'publish_update' => true,
                'public_message' => 'Your report has completed the verificator assessment stage and is pending supervisory review.',
            ]
        );

        $investigationCase = $workflow->submitReport($users['reporter_3'], [
            'title' => 'Repeated duplicate reimbursement patterns in finance unit',
            'category' => 'fraud',
            'description' => 'Finance staff observed repeated duplicate reimbursement claims with altered timestamps across two reporting periods.',
            'incident_date' => now()->subDays(18)->toDateString(),
            'incident_location' => 'Finance Directorate',
            'accused_party' => 'Project Accountant',
            'evidence_summary' => 'Ledger extracts and approval screenshots are available.',
            'confidentiality_level' => 'confidential',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['financial-loss', 'data-integrity'],
        ]);

        $workflow->delegateToVerificator(
            CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
            $users['supervisor_of_verificator'],
            $users['verificator_2'],
            [
                'assigned_unit' => 'Verification Desk',
                'due_in_days' => 4,
            ]
        );

        $workflow->submitVerification(
            CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
            $users['verificator_2'],
            [
                'internal_note' => 'The material is sufficiently corroborated and should be escalated for investigation.',
                'publish_update' => false,
            ]
        );

        $workflow->reviewVerification(
            CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
            $users['supervisor_of_verificator'],
            [
                'decision' => 'approved',
                'internal_note' => 'Verification accepted and the report is transferred to the supervisor of investigator.',
                'publish_update' => true,
                'public_message' => 'Your report has passed verification and is proceeding to investigation allocation.',
            ]
        );

        $workflow->delegateToInvestigator(
            CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
            $users['supervisor_of_investigator'],
            $users['investigator_1'],
            [
                'assigned_unit' => 'Investigation Desk',
                'due_in_days' => 8,
            ]
        );

        $completedCase = $workflow->submitReport($users['reporter_4'], [
            'title' => 'Retaliation threats after reporting travel expense manipulation',
            'category' => 'retaliation',
            'description' => 'A staff member reported retaliatory reassignment threats after raising concerns about manipulated travel expense claims by a supervisor.',
            'incident_date' => now()->subDays(12)->toDateString(),
            'incident_location' => 'Head Office',
            'accused_party' => 'Division Supervisor',
            'evidence_summary' => 'Chat transcripts and calendar evidence are available.',
            'confidentiality_level' => 'confidential',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['retaliation-risk', 'leadership'],
        ]);

        $workflow->delegateToVerificator(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['supervisor_of_verificator'],
            $users['verificator_1'],
            [
                'assigned_unit' => 'Protected Verification Desk',
                'due_in_days' => 3,
            ]
        );

        $workflow->submitVerification(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['verificator_1'],
            [
                'internal_note' => 'Retaliation risk is substantiated and the report should move into protected investigation.',
                'publish_update' => false,
            ]
        );

        $workflow->reviewVerification(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['supervisor_of_verificator'],
            [
                'decision' => 'approved',
                'internal_note' => 'Verification approved for protected investigation.',
                'publish_update' => true,
                'public_message' => 'Your report has been verified and forwarded into the investigation stage.',
            ]
        );

        $workflow->delegateToInvestigator(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['supervisor_of_investigator'],
            $users['investigator_2'],
            [
                'assigned_unit' => 'Protected Investigation Desk',
                'due_in_days' => 5,
            ]
        );

        $workflow->submitInvestigation(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['investigator_2'],
            [
                'internal_note' => 'The evidence supports retaliation findings and recommended corrective action.',
                'publish_update' => true,
                'public_message' => 'The investigation file has been completed and is pending supervisory review.',
            ]
        );

        $workflow->reviewInvestigation(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['supervisor_of_investigator'],
            [
                'decision' => 'approved',
                'internal_note' => 'Investigation endorsed and routed to the director for final decision.',
                'publish_update' => false,
            ]
        );

        $workflow->directorDecision(
            CaseFile::query()->findOrFail($completedCase['caseFile']->id),
            $users['director'],
            [
                'decision' => 'approved',
                'internal_note' => 'Final approval granted. The report is completed with follow-up directives.',
                'publish_update' => true,
                'public_message' => 'The report has completed the KPK Whistleblowing System review process.',
            ]
        );

        // Keep one case at the initial submitted queue for the supervisor of verificator.
        CaseFile::query()->findOrFail($submittedCase['caseFile']->id)->forceFill([
            'last_activity_at' => now()->subDays(1),
        ])->save();
    }

    private function seedUsers(): array
    {
        return [
            'system_administrator' => User::query()->create([
                'name' => 'Raka Mahendra',
                'email' => 'sysadmin@kpk-wbs.test',
                'phone' => '+62-812-1000-0001',
                'role' => User::ROLE_SYSTEM_ADMINISTRATOR,
                'unit' => 'System Administration',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'supervisor_of_verificator' => User::query()->create([
                'name' => 'Sinta Pramudita',
                'email' => 'supervisor.verificator@kpk-wbs.test',
                'phone' => '+62-812-1000-0002',
                'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
                'unit' => 'Verification Supervision',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'verificator_1' => User::query()->create([
                'name' => 'Aditya Prakoso',
                'email' => 'verificator.1@kpk-wbs.test',
                'phone' => '+62-812-1000-0003',
                'role' => User::ROLE_VERIFICATOR,
                'unit' => 'Verification Desk',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'verificator_2' => User::query()->create([
                'name' => 'Maya Lestari',
                'email' => 'verificator.2@kpk-wbs.test',
                'phone' => '+62-812-1000-0004',
                'role' => User::ROLE_VERIFICATOR,
                'unit' => 'Verification Desk',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'supervisor_of_investigator' => User::query()->create([
                'name' => 'Bagas Santoso',
                'email' => 'supervisor.investigator@kpk-wbs.test',
                'phone' => '+62-812-1000-0005',
                'role' => User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
                'unit' => 'Investigation Supervision',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'investigator_1' => User::query()->create([
                'name' => 'Ayu Wicaksono',
                'email' => 'investigator.1@kpk-wbs.test',
                'phone' => '+62-812-1000-0006',
                'role' => User::ROLE_INVESTIGATOR,
                'unit' => 'Investigation Desk',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'investigator_2' => User::query()->create([
                'name' => 'Dimas Haryanto',
                'email' => 'investigator.2@kpk-wbs.test',
                'phone' => '+62-812-1000-0007',
                'role' => User::ROLE_INVESTIGATOR,
                'unit' => 'Protected Investigation Desk',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'director' => User::query()->create([
                'name' => 'Nadia Prabowo',
                'email' => 'director@kpk-wbs.test',
                'phone' => '+62-812-1000-0008',
                'role' => User::ROLE_DIRECTOR,
                'unit' => 'Directorate',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'reporter_1' => User::query()->create([
                'name' => 'Laila N',
                'email' => 'reporter.1@example.test',
                'phone' => '+62-812-1000-1001',
                'role' => User::ROLE_REPORTER,
                'unit' => 'Reporter',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'reporter_2' => User::query()->create([
                'name' => 'Fajar Kurniawan',
                'email' => 'reporter.2@example.test',
                'phone' => '+62-812-1000-1002',
                'role' => User::ROLE_REPORTER,
                'unit' => 'Reporter',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'reporter_3' => User::query()->create([
                'name' => 'Rina Maharani',
                'email' => 'reporter.3@example.test',
                'phone' => '+62-812-1000-1003',
                'role' => User::ROLE_REPORTER,
                'unit' => 'Reporter',
                'is_active' => true,
                'password' => 'Password123',
            ]),
            'reporter_4' => User::query()->create([
                'name' => 'Teguh Saputra',
                'email' => 'reporter.4@example.test',
                'phone' => '+62-812-1000-1004',
                'role' => User::ROLE_REPORTER,
                'unit' => 'Reporter',
                'is_active' => true,
                'password' => 'Password123',
            ]),
        ];
    }

    private function seedGovernanceControls(): void
    {
        GovernanceControl::query()->create([
            'code' => 'REG-01',
            'name' => 'Reporter registration control',
            'description' => 'Require reporters to register before a report can be submitted into the whistleblowing workflow.',
            'owner_role' => 'System Administrator',
            'status' => 'active',
            'target_metric' => '100% registered reporter submissions',
            'current_metric' => 'Prototype enforces authenticated reporter submission',
            'notes' => 'Public anonymous submission is disabled. Reporter accounts are created through self-registration.',
        ]);

        GovernanceControl::query()->create([
            'code' => 'SEG-02',
            'name' => 'Segregation of duties',
            'description' => 'Separate verification supervision, verificator review, investigation supervision, investigation work, and director approval.',
            'owner_role' => 'Director',
            'status' => 'active',
            'target_metric' => 'Distinct role owners across the process',
            'current_metric' => 'Seven-role workflow enforced by role-based endpoints',
            'notes' => 'Each workflow transition records both the acting role and the next responsible role.',
        ]);

        GovernanceControl::query()->create([
            'code' => 'SLA-03',
            'name' => 'Workflow timeliness',
            'description' => 'Monitor elapsed time from submission to delegation, investigation, and final approval.',
            'owner_role' => 'Supervisor of Verificator',
            'status' => 'warning',
            'target_metric' => 'Average first delegation under 72 hours',
            'current_metric' => 'Measured from submission and triage timestamps',
            'notes' => 'Dashboard exposes queue volumes and overdue cases for each stage.',
        ]);

        GovernanceControl::query()->create([
            'code' => 'AUD-04',
            'name' => 'Audit trail completeness',
            'description' => 'Log every report submission, delegation, approval, rejection, and completion event.',
            'owner_role' => 'System Administrator',
            'status' => 'active',
            'target_metric' => 'All workflow actions auditable',
            'current_metric' => 'Implemented across all workflow transitions',
            'notes' => 'Audit entries are queryable through the governance dashboard and API documentation.',
        ]);
    }
}
