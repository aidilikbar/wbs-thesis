<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\CaseTimelineEvent;
use App\Models\GovernanceControl;
use App\Models\Report;
use App\Models\User;
use App\Services\CaseWorkflowService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

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
        $timelineFaker = fake('id_ID');
        $timelineFaker->seed(20260329);

        $submittedCaseSubmittedAt = CarbonImmutable::now('UTC')->subDays(9)->setTime(8, 45, 0);
        $submittedCase = $this->submitSeededReportAt($workflow, $users['reporter_1'], [
            'title' => 'Request for unofficial payment before vendor evaluation',
            'category' => 'procurement',
            'description' => 'A procurement liaison reported that an unofficial payment was requested before the evaluation committee would release the technical scoring outcome.',
            'incident_date' => $submittedCaseSubmittedAt->subDays(3)->toDateString(),
            'incident_location' => 'Bandung Regional Office',
            'accused_party' => 'Procurement Committee Member',
            'evidence_summary' => 'Meeting notes, screenshots, and two witnesses are available.',
            'confidentiality_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement', 'financial-loss'],
        ], $submittedCaseSubmittedAt);

        $verificationReviewSubmittedAt = CarbonImmutable::now('UTC')->subDays(6)->setTime(9, 20, 0);
        $verificationReviewClock = $this->buildWorkflowClock($verificationReviewSubmittedAt, $timelineFaker);
        $verificationReviewCase = $this->submitSeededReportAt($workflow, $users['reporter_2'], [
            'title' => 'Possible conflict of interest in evaluation panel',
            'category' => 'conflict_of_interest',
            'description' => 'A reviewer appears to have an undeclared family relationship with one of the shortlisted applicants during an evaluation process.',
            'incident_date' => $verificationReviewSubmittedAt->subDays(5)->toDateString(),
            'incident_location' => 'Integrity Review Unit',
            'accused_party' => 'Evaluation Panel Reviewer',
            'evidence_summary' => 'Public registry extracts and social-media evidence support the allegation.',
            'confidentiality_level' => 'identified',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['conflict-sensitive'],
        ], $verificationReviewSubmittedAt);

        $this->executeAt(
            $verificationReviewClock['delegate_verification'],
            fn () => $workflow->delegateToVerificator(
                CaseFile::query()->findOrFail($verificationReviewCase['caseFile']->id),
                $users['supervisor_of_verificator'],
                $users['verificator_1'],
                [
                    'assigned_unit' => 'Verification Desk',
                    'due_in_days' => 5,
                ]
            )
        );

        $this->executeAt(
            $verificationReviewClock['submit_verification'],
            fn () => $workflow->submitVerification(
                CaseFile::query()->findOrFail($verificationReviewCase['caseFile']->id),
                $users['verificator_1'],
                [
                    'internal_note' => 'Document review is complete and the report is ready for supervisory decision.',
                    'publish_update' => true,
                    'public_message' => 'Your report has completed the verification assessment stage and is pending supervisory review.',
                ]
            )
        );

        $investigationSubmittedAt = CarbonImmutable::now('UTC')->subDays(18)->setTime(10, 10, 0);
        $investigationClock = $this->buildWorkflowClock($investigationSubmittedAt, $timelineFaker);
        $investigationCase = $this->submitSeededReportAt($workflow, $users['reporter_3'], [
            'title' => 'Repeated duplicate reimbursement patterns in finance unit',
            'category' => 'fraud',
            'description' => 'Finance staff observed repeated duplicate reimbursement claims with altered timestamps across two reporting periods.',
            'incident_date' => $investigationSubmittedAt->subDays(7)->toDateString(),
            'incident_location' => 'Finance Directorate',
            'accused_party' => 'Project Accountant',
            'evidence_summary' => 'Ledger extracts and approval screenshots are available.',
            'confidentiality_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['financial-loss', 'data-integrity'],
        ], $investigationSubmittedAt);

        $this->executeAt(
            $investigationClock['delegate_verification'],
            fn () => $workflow->delegateToVerificator(
                CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
                $users['supervisor_of_verificator'],
                $users['verificator_2'],
                [
                    'assigned_unit' => 'Verification Desk',
                    'due_in_days' => 4,
                ]
            )
        );

        $this->executeAt(
            $investigationClock['submit_verification'],
            fn () => $workflow->submitVerification(
                CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
                $users['verificator_2'],
                [
                    'internal_note' => 'The material is sufficiently corroborated and should be escalated for investigation.',
                    'publish_update' => true,
                    'public_message' => 'Your report has completed the verification assessment stage and is pending supervisory review.',
                ]
            )
        );

        $this->executeAt(
            $investigationClock['review_verification'],
            fn () => $workflow->reviewVerification(
                CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
                $users['supervisor_of_verificator'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Verification accepted and the report is transferred to the investigation supervisor.',
                    'publish_update' => true,
                    'public_message' => 'Your report has passed verification and is proceeding to investigation allocation.',
                ]
            )
        );

        $this->executeAt(
            $investigationClock['delegate_investigation'],
            fn () => $workflow->delegateToInvestigator(
                CaseFile::query()->findOrFail($investigationCase['caseFile']->id),
                $users['supervisor_of_investigator'],
                $users['investigator_1'],
                [
                    'assigned_unit' => 'Investigation Desk',
                    'due_in_days' => 8,
                ]
            )
        );

        $completedSubmittedAt = CarbonImmutable::now('UTC')->subDays(12)->setTime(7, 50, 0);
        $completedClock = $this->buildWorkflowClock($completedSubmittedAt, $timelineFaker);
        $completedCase = $this->submitSeededReportAt($workflow, $users['reporter_4'], [
            'title' => 'Retaliation threats after reporting travel expense manipulation',
            'category' => 'retaliation',
            'description' => 'A staff member reported retaliatory reassignment threats after raising concerns about manipulated travel expense claims by a supervisor.',
            'incident_date' => $completedSubmittedAt->subDays(4)->toDateString(),
            'incident_location' => 'Head Office',
            'accused_party' => 'Division Supervisor',
            'evidence_summary' => 'Chat transcripts and calendar evidence are available.',
            'confidentiality_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['retaliation-risk', 'leadership'],
        ], $completedSubmittedAt);

        $this->executeAt(
            $completedClock['delegate_verification'],
            fn () => $workflow->delegateToVerificator(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['supervisor_of_verificator'],
                $users['verificator_1'],
                [
                    'assigned_unit' => 'Protected Verification Desk',
                    'due_in_days' => 3,
                ]
            )
        );

        $this->executeAt(
            $completedClock['submit_verification'],
            fn () => $workflow->submitVerification(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['verificator_1'],
                [
                    'internal_note' => 'Retaliation risk is substantiated and the report should move into protected investigation.',
                    'publish_update' => true,
                    'public_message' => 'Your report has completed the verification assessment stage and is pending supervisory review.',
                ]
            )
        );

        $this->executeAt(
            $completedClock['review_verification'],
            fn () => $workflow->reviewVerification(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['supervisor_of_verificator'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Verification approved for protected investigation.',
                    'publish_update' => true,
                    'public_message' => 'Your report has been verified and forwarded into the investigation stage.',
                ]
            )
        );

        $this->executeAt(
            $completedClock['delegate_investigation'],
            fn () => $workflow->delegateToInvestigator(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['supervisor_of_investigator'],
                $users['investigator_2'],
                [
                    'assigned_unit' => 'Protected Investigation Desk',
                    'due_in_days' => 5,
                ]
            )
        );

        $this->executeAt(
            $completedClock['submit_investigation'],
            fn () => $workflow->submitInvestigation(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['investigator_2'],
                [
                    'internal_note' => 'The evidence supports retaliation findings and recommended corrective action.',
                    'publish_update' => true,
                    'public_message' => 'The investigation file has been completed and is pending supervisory review.',
                ]
            )
        );

        $this->executeAt(
            $completedClock['review_investigation'],
            fn () => $workflow->reviewInvestigation(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['supervisor_of_investigator'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Investigation endorsed and routed to the director for final decision.',
                    'publish_update' => true,
                    'public_message' => 'The investigation has been endorsed and is awaiting final director review.',
                ]
            )
        );

        $this->executeAt(
            $completedClock['director_decision'],
            fn () => $workflow->directorDecision(
                CaseFile::query()->findOrFail($completedCase['caseFile']->id),
                $users['director'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Final approval granted. The report is completed with follow-up directives.',
                    'publish_update' => true,
                    'public_message' => 'The report has completed the KPK Whistleblowing System review process.',
                ]
            )
        );

        $this->seedAdditionalReporterTransactions($users, $workflow);
        $this->alignAiAgentRegressionCases($users);
    }

    private function seedUsers(): array
    {
        $users = [
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

        $this->seedAdditionalEnterpriseUsers();

        return $users;
    }

    private function seedAdditionalEnterpriseUsers(): void
    {
        $roles = [
            User::ROLE_REPORTER,
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            User::ROLE_VERIFICATOR,
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            User::ROLE_INVESTIGATOR,
            User::ROLE_DIRECTOR,
            User::ROLE_SYSTEM_ADMINISTRATOR,
        ];

        $faker = fake('id_ID');
        $faker->seed(20260325);

        for ($index = 1; $index <= 30; $index++) {
            $role = $faker->randomElement($roles);

            User::query()->create([
                'name' => $faker->name(),
                'email' => sprintf('enterprise.user.%02d@kpk-wbs.test', $index),
                'phone' => sprintf('+62-812-2000-%04d', $index),
                'role' => $role,
                'unit' => $this->unitForRole($role, $index),
                'is_active' => $index % 7 !== 0,
                'password' => 'Password123',
            ]);
        }
    }

    private function unitForRole(string $role, int $index): string
    {
        return match ($role) {
            User::ROLE_REPORTER => 'Reporter',
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => 'Verification Supervision',
            User::ROLE_VERIFICATOR => $index % 2 === 0 ? 'Verification Desk' : 'Protected Verification Desk',
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => 'Investigation Supervision',
            User::ROLE_INVESTIGATOR => $index % 2 === 0 ? 'Investigation Desk' : 'Protected Investigation Desk',
            User::ROLE_DIRECTOR => 'Directorate',
            User::ROLE_SYSTEM_ADMINISTRATOR => 'System Administration',
            default => 'General Unit',
        };
    }

    private function seedAdditionalReporterTransactions(array $users, CaseWorkflowService $workflow): void
    {
        $faker = fake('id_ID');
        $faker->seed(20260327);

        $reporterKeys = ['reporter_1', 'reporter_2', 'reporter_3', 'reporter_4'];
        $statusTargets = [
            'submitted',
            'verification_in_progress',
            'verification_review',
            'verified',
            'investigation_in_progress',
            'investigation_review',
            'director_review',
            'completed',
        ];
        $categories = array_values(array_filter(
            array_keys(config('wbs.categories')),
            fn (string $category) => $category !== 'kpk_report'
        ));
        $governanceTags = array_keys(config('wbs.governance_tags'));

        foreach ($reporterKeys as $reporterKey) {
            for ($sequence = 1; $sequence <= 10; $sequence++) {
                $targetStatus = $faker->randomElement($statusTargets);
                $category = $faker->randomElement($categories);
                $selectedTags = $faker->randomElements(
                    $governanceTags,
                    $faker->numberBetween(0, 2)
                );
                $submittedAt = CarbonImmutable::now('UTC')
                    ->subDays($faker->numberBetween(2, 45))
                    ->setTime(
                        $faker->numberBetween(7, 16),
                        $faker->randomElement([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]),
                        0
                    );
                $payload = $this->buildAdditionalTransactionPayload(
                    $category,
                    $selectedTags,
                    $sequence,
                    $faker,
                    $submittedAt,
                );

                $result = $this->submitSeededReportAt($workflow, $users[$reporterKey], [
                    ...$payload,
                    'confidentiality_level' => $faker->randomElement(['anonymous', 'identified']),
                    'requested_follow_up' => $faker->boolean(70),
                    'witness_available' => $faker->boolean(50),
                ], $submittedAt);

                $this->advanceSeededCaseToStatus(
                    CaseFile::query()->findOrFail($result['caseFile']->id),
                    $targetStatus,
                    $users,
                    $workflow,
                    $faker,
                    $this->buildWorkflowClock($submittedAt, $faker),
                );
            }
        }
    }

    private function alignAiAgentRegressionCases(array $users): void
    {
        $definitions = [
            'CASE-2026-0002' => [
                'title' => 'Possible conflict of interest in evaluation panel',
                'reporter' => $users['reporter_2'],
                'stage' => 'verification_review',
                'verificator' => $users['verificator_1'],
            ],
            'CASE-2026-0006' => [
                'title' => 'Unofficial donation request tied to access to public service queue',
                'reporter' => $users['reporter_1'],
                'stage' => 'verification_in_progress',
                'verificator' => $users['verificator_2'],
            ],
            'CASE-2026-0009' => [
                'title' => 'Performance score reduced after reporting irregular procurement communication',
                'reporter' => $users['reporter_1'],
                'stage' => 'investigation_review',
                'investigator' => $users['investigator_1'],
            ],
            'CASE-2026-0011' => [
                'title' => 'Threat of reassignment after staff questioned travel expense claims',
                'reporter' => $users['reporter_1'],
                'stage' => 'investigation_in_progress',
                'investigator' => $users['investigator_2'],
            ],
            'CASE-2026-0016' => [
                'title' => 'Performance score reduced after reporting irregular procurement communication',
                'reporter' => $users['reporter_2'],
                'stage' => 'director_review',
                'investigator' => $users['investigator_2'],
            ],
            'CASE-2026-0020' => [
                'title' => 'Meeting minutes altered after objection was formally recorded',
                'reporter' => $users['reporter_2'],
                'stage' => 'verification_in_progress',
                'verificator' => $users['verificator_1'],
            ],
        ];

        foreach ($definitions as $caseNumber => $definition) {
            $this->alignAiAgentRegressionCase($caseNumber, $definition, $users);
        }
    }

    private function alignAiAgentRegressionCase(string $caseNumber, array $definition, array $users): void
    {
        $caseFile = CaseFile::query()
            ->with('report')
            ->where('case_number', $caseNumber)
            ->firstOrFail();
        $report = $caseFile->report;
        $reporter = $definition['reporter'];
        $templateContext = $this->buildTemplateContext($definition['title'], $report);
        $assignedRole = $this->assignedRoleForStage($definition['stage']);
        $assignedUser = $definition['verificator']
            ?? $definition['investigator']
            ?? match ($assignedRole) {
                User::ROLE_SUPERVISOR_OF_VERIFICATOR => $users['supervisor_of_verificator'],
                User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $users['supervisor_of_investigator'],
                User::ROLE_DIRECTOR => $users['director'],
                default => null,
            };

        $report->forceFill([
            'reporter_user_id' => $reporter->id,
            'title' => $definition['title'],
            'category' => $templateContext['category'],
            'description' => $templateContext['description'],
            'incident_location' => $templateContext['incident_location'],
            'accused_party' => $templateContext['accused_party'],
            'reported_parties' => [[
                'full_name' => $templateContext['accused_party'],
                'position' => 'Not specified',
                'classification' => 'other',
            ]],
            'evidence_summary' => $templateContext['evidence_summary'],
            'reporter_name' => $reporter->name,
            'reporter_email' => $reporter->email,
            'reporter_phone' => $reporter->phone,
            'governance_tags' => $templateContext['governance_tags'],
            'status' => $this->reportStatusForStage($definition['stage']),
        ])->save();

        $caseFile->forceFill([
            'stage' => $definition['stage'],
            'current_role' => $assignedRole,
            'disposition' => $this->dispositionForStage($definition['stage']),
            'verification_supervisor_id' => $users['supervisor_of_verificator']->id,
            'investigation_supervisor_id' => $users['supervisor_of_investigator']->id,
            'director_id' => $users['director']->id,
            'verificator_id' => isset($definition['verificator'])
                ? $definition['verificator']->id
                : $caseFile->verificator_id,
            'investigator_id' => isset($definition['investigator'])
                ? $definition['investigator']->id
                : $caseFile->investigator_id,
            'assigned_unit' => $assignedUser?->unit
                ?? match ($assignedRole) {
                    User::ROLE_SUPERVISOR_OF_VERIFICATOR => $users['supervisor_of_verificator']->unit,
                    User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $users['supervisor_of_investigator']->unit,
                    User::ROLE_DIRECTOR => $users['director']->unit,
                    default => $caseFile->assigned_unit,
                },
            'assigned_to' => $assignedUser?->name
                ?? match ($assignedRole) {
                    User::ROLE_SUPERVISOR_OF_VERIFICATOR => $users['supervisor_of_verificator']->name,
                    User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $users['supervisor_of_investigator']->name,
                    User::ROLE_DIRECTOR => $users['director']->name,
                    default => $caseFile->assigned_to,
                },
            'completed_at' => null,
            'last_activity_at' => $report->last_public_update_at ?? $report->submitted_at ?? now(),
            'notes' => $report->description,
        ])->save();
    }

    private function advanceSeededCaseToStatus(
        CaseFile $caseFile,
        string $targetStatus,
        array $users,
        CaseWorkflowService $workflow,
        \Faker\Generator $faker,
        array $clock,
    ): void {
        if ($targetStatus === 'submitted') {
            return;
        }

        $verificator = $this->seededVerificatorForCase($caseFile, $users, $faker);

        $this->executeAt(
            $clock['delegate_verification'],
            fn () => $workflow->delegateToVerificator(
                $caseFile->fresh(),
                $users['supervisor_of_verificator'],
                $verificator,
                [
                    'assigned_unit' => $verificator->unit,
                    'due_in_days' => $faker->numberBetween(3, 7),
                ]
            )
        );

        if ($targetStatus === 'verification_in_progress') {
            return;
        }

        $this->executeAt(
            $clock['submit_verification'],
            fn () => $workflow->submitVerification(
                $caseFile->fresh(),
                $verificator,
                [
                    'internal_note' => 'Seeded verification note for enterprise transaction coverage.',
                    'publish_update' => true,
                    'public_message' => 'Your report has completed the verification assessment stage and is pending supervisory review.',
                ]
            )
        );

        if ($targetStatus === 'verification_review') {
            return;
        }

        $this->executeAt(
            $clock['review_verification'],
            fn () => $workflow->reviewVerification(
                $caseFile->fresh(),
                $users['supervisor_of_verificator'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Seeded verification approval for enterprise transaction coverage.',
                    'publish_update' => true,
                    'public_message' => 'Your report has passed verification and is proceeding to investigation allocation.',
                ]
            )
        );

        if ($targetStatus === 'verified') {
            return;
        }

        $investigator = $this->seededInvestigatorForCase($caseFile, $users, $faker);

        $this->executeAt(
            $clock['delegate_investigation'],
            fn () => $workflow->delegateToInvestigator(
                $caseFile->fresh(),
                $users['supervisor_of_investigator'],
                $investigator,
                [
                    'assigned_unit' => $investigator->unit,
                    'due_in_days' => $faker->numberBetween(5, 10),
                ]
            )
        );

        if ($targetStatus === 'investigation_in_progress') {
            return;
        }

        $this->executeAt(
            $clock['submit_investigation'],
            fn () => $workflow->submitInvestigation(
                $caseFile->fresh(),
                $investigator,
                [
                    'internal_note' => 'Seeded investigation note for enterprise transaction coverage.',
                    'publish_update' => true,
                    'public_message' => 'The investigation file has been completed and is pending supervisory review.',
                ]
            )
        );

        if ($targetStatus === 'investigation_review') {
            return;
        }

        $this->executeAt(
            $clock['review_investigation'],
            fn () => $workflow->reviewInvestigation(
                $caseFile->fresh(),
                $users['supervisor_of_investigator'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Seeded investigation approval for enterprise transaction coverage.',
                    'publish_update' => true,
                    'public_message' => 'The investigation has been endorsed and is awaiting final director review.',
                ]
            )
        );

        if ($targetStatus === 'director_review') {
            return;
        }

        $this->executeAt(
            $clock['director_decision'],
            fn () => $workflow->directorDecision(
                $caseFile->fresh(),
                $users['director'],
                [
                    'decision' => 'approved',
                    'internal_note' => 'Seeded director approval for enterprise transaction coverage.',
                    'publish_update' => true,
                    'public_message' => 'The report has completed the KPK Whistleblowing System review process.',
                ]
            )
        );
    }

    private function buildAdditionalTransactionPayload(
        string $category,
        array $selectedTags,
        int $sequence,
        \Faker\Generator $faker,
        CarbonImmutable $submittedAt,
    ): array {
        $office = $faker->randomElement([
            'Jakarta Head Office',
            'Bandung Regional Office',
            'Surabaya Regional Office',
            'Makassar Coordination Office',
            'Yogyakarta Service Unit',
        ]);
        $month = $faker->randomElement([
            'January 2026',
            'February 2026',
            'March 2026',
            'April 2026',
            'May 2026',
        ]);
        $templates = $this->additionalTransactionTemplates();
        $template = $templates[$category][($sequence - 1) % count($templates[$category])];
        $governanceTags = array_values(array_unique([
            ...($template['governance_tags'] ?? []),
            ...$selectedTags,
        ]));

        return [
            'title' => $template['title'],
            'category' => $category,
            'description' => sprintf(
                $template['description'],
                $office,
                $month,
            ),
            'incident_date' => $submittedAt
                ->subDays($faker->numberBetween(2, 60))
                ->toDateString(),
            'incident_location' => $template['incident_location'] ?? $office,
            'accused_party' => $template['accused_party'],
            'evidence_summary' => sprintf(
                $template['evidence_summary'],
                $month,
            ),
            'governance_tags' => array_slice($governanceTags, 0, 3),
        ];
    }

    private function seededVerificatorForCase(
        CaseFile $caseFile,
        array $users,
        \Faker\Generator $faker,
    ): User {
        return match ($caseFile->case_number) {
            'CASE-2026-0006' => $users['verificator_2'],
            'CASE-2026-0020' => $users['verificator_1'],
            default => $faker->randomElement([
                $users['verificator_1'],
                $users['verificator_2'],
            ]),
        };
    }

    private function seededInvestigatorForCase(
        CaseFile $caseFile,
        array $users,
        \Faker\Generator $faker,
    ): User {
        return match ($caseFile->case_number) {
            'CASE-2026-0009' => $users['investigator_1'],
            'CASE-2026-0011' => $users['investigator_2'],
            'CASE-2026-0016' => $users['investigator_2'],
            default => $faker->randomElement([
                $users['investigator_1'],
                $users['investigator_2'],
            ]),
        };
    }

    private function additionalTransactionTemplates(): array
    {
        return [
            'bribery' => [
                [
                    'title' => 'Request for facilitation payment before inspection report issuance',
                    'description' => 'A field officer in %s allegedly asked the reporting party to transfer money before an inspection report would be signed off. The request was repeated during follow-up calls in %s and was framed as a way to accelerate administrative clearance.',
                    'incident_location' => 'Field Inspection Unit',
                    'accused_party' => 'Inspection Officer',
                    'evidence_summary' => 'Available evidence includes call logs, chat screenshots, and a handwritten payment note dated %s.',
                    'governance_tags' => ['leadership'],
                ],
                [
                    'title' => 'Cash payment requested before monitoring visit findings were closed',
                    'description' => 'During a compliance monitoring process in %s, the reporter was told that adverse findings would be removed if a cash payment was provided through an intermediary. The request was communicated verbally and then repeated over messaging in %s.',
                    'incident_location' => 'Compliance Monitoring Desk',
                    'accused_party' => 'Monitoring Coordinator',
                    'evidence_summary' => 'Supporting material includes screenshots of the intermediary conversation, meeting schedules, and a timeline of the monitoring visit from %s.',
                    'governance_tags' => ['financial-loss'],
                ],
                [
                    'title' => 'Unofficial fee requested to release permit recommendation letter',
                    'description' => 'An administrative officer in %s allegedly delayed release of a recommendation letter until an unofficial fee was paid. The reporter states that the payment request was described as a routine cost even though it was not reflected in any official tariff document in %s.',
                    'incident_location' => 'Permit Recommendation Service',
                    'accused_party' => 'Administrative Officer',
                    'evidence_summary' => 'Evidence consists of service receipts, tariff guidance, and message exchanges documenting the unofficial fee request in %s.',
                    'governance_tags' => ['procurement'],
                ],
            ],
            'procurement' => [
                [
                    'title' => 'Tender committee directed scoring adjustments for a preferred vendor',
                    'description' => 'Members of a procurement committee in %s allegedly revised evaluation scoring after the technical review had closed so that a preferred vendor would move into first rank. The reporting party observed the score changes and preserved the before-and-after worksheets used in %s.',
                    'incident_location' => 'Procurement Evaluation Room',
                    'accused_party' => 'Tender Committee Member',
                    'evidence_summary' => 'Evidence includes comparative scoring sheets, committee attendance records, and emails discussing the revised ranking in %s.',
                    'governance_tags' => ['procurement', 'financial-loss'],
                ],
                [
                    'title' => 'Procurement packages split to stay below approval threshold',
                    'description' => 'The reporter observed a recurring pattern in %s where related procurement needs were divided into smaller packages so they would remain below the approval threshold for a higher-level review. The package descriptions and delivery windows matched closely across purchases logged in %s.',
                    'incident_location' => 'Budget Planning and Procurement Unit',
                    'accused_party' => 'Procurement Planning Official',
                    'evidence_summary' => 'Supporting evidence includes purchase orders, vendor comparison files, and package summaries from %s showing repeated splitting patterns.',
                    'governance_tags' => ['procurement', 'data-integrity'],
                ],
                [
                    'title' => 'Contract handover delayed until supplier agreed to informal payment',
                    'description' => 'A supplier dealing with %s reported that the final contract handover would not be scheduled unless an informal payment was provided to an official associated with the tender secretariat. The same demand was repeated shortly before the signing window in %s.',
                    'incident_location' => 'Tender Secretariat',
                    'accused_party' => 'Tender Secretariat Officer',
                    'evidence_summary' => 'The record contains meeting invitations, vendor correspondence, and notes from the supplier discussion held in %s.',
                    'governance_tags' => ['procurement'],
                ],
            ],
            'fraud' => [
                [
                    'title' => 'Duplicate reimbursement entries recorded under different voucher numbers',
                    'description' => 'Finance staff in %s identified reimbursement claims that appeared twice under different voucher numbers but with identical supporting narratives and amounts. The duplication was noticed during a reconciliation exercise covering transactions from %s.',
                    'incident_location' => 'Finance Reconciliation Unit',
                    'accused_party' => 'Finance Supervisor',
                    'evidence_summary' => 'Supporting material includes reimbursement ledgers, voucher scans, and reconciliation notes prepared during %s.',
                    'governance_tags' => ['financial-loss', 'data-integrity'],
                ],
                [
                    'title' => 'Maintenance invoices submitted for work not performed on site',
                    'description' => 'The reporter states that facility maintenance invoices approved in %s do not match actual work performed at the site. Field conditions remained unchanged despite full payment approval, and follow-up inquiries during %s were not answered satisfactorily.',
                    'incident_location' => 'Facilities Management Unit',
                    'accused_party' => 'Project Accountant',
                    'evidence_summary' => 'Evidence includes invoice copies, photo documentation of the site condition, and work-order records covering %s.',
                    'governance_tags' => ['financial-loss'],
                ],
                [
                    'title' => 'Honorarium list contains names of personnel not assigned to the activity',
                    'description' => 'An honorarium payment list processed in %s allegedly included several names of personnel who were not present and had not been assigned to the related activity. The discrepancy became visible after attendance sheets were cross-checked against payroll support files in %s.',
                    'incident_location' => 'Program Finance Desk',
                    'accused_party' => 'Program Treasurer',
                    'evidence_summary' => 'The supporting file bundle includes attendance sheets, payment recaps, and assignment letters reviewed for %s.',
                    'governance_tags' => ['financial-loss', 'data-integrity'],
                ],
            ],
            'abuse_of_authority' => [
                [
                    'title' => 'Supervisor instructed staff to backdate approval memorandum',
                    'description' => 'A unit supervisor in %s allegedly ordered subordinates to backdate an approval memorandum so that a late transaction would appear compliant with deadline requirements. The instruction was given after the document had already been questioned during %s.',
                    'incident_location' => 'Administrative Control Unit',
                    'accused_party' => 'Unit Supervisor',
                    'evidence_summary' => 'Available evidence includes draft memoranda, tracked document revisions, and chat messages referring to the backdating request in %s.',
                    'governance_tags' => ['leadership', 'data-integrity'],
                ],
                [
                    'title' => 'Official vehicle and budget used for private family travel',
                    'description' => 'The reporter observed that an official vehicle assigned in %s was repeatedly used for private family travel while fuel and driver allowances continued to be charged to the office budget. The trips took place during %s outside the approved operational schedule.',
                    'incident_location' => 'General Affairs Unit',
                    'accused_party' => 'Division Head',
                    'evidence_summary' => 'Evidence consists of vehicle logs, fuel purchase slips, and security gate records covering %s.',
                    'governance_tags' => ['leadership', 'financial-loss'],
                ],
                [
                    'title' => 'Access rights removed from staff who questioned procurement irregularities',
                    'description' => 'After staff raised concerns about irregular procurement documents in %s, a manager allegedly removed their access to the shared evaluation drive without formal justification. The restriction occurred during %s and appears to have impeded ordinary review duties.',
                    'incident_location' => 'Digital Records Administration',
                    'accused_party' => 'Information Systems Manager',
                    'evidence_summary' => 'Supporting evidence includes access logs, email notices, and screenshots of permission changes recorded in %s.',
                    'governance_tags' => ['leadership', 'data-integrity'],
                ],
            ],
            'conflict_of_interest' => [
                [
                    'title' => 'Evaluation panel member has undisclosed family link to shortlisted bidder',
                    'description' => 'The reporter identified that one evaluation panel member in %s appears to have a family relationship with a director of a shortlisted bidder. The connection was not disclosed in the conflict declaration even though both names appear in public records reviewed during %s.',
                    'incident_location' => 'Bid Evaluation Panel',
                    'accused_party' => 'Evaluation Panel Member',
                    'evidence_summary' => 'The evidence set includes corporate registry excerpts, family relation references, and the signed conflict declaration collected in %s.',
                    'governance_tags' => ['conflict-sensitive', 'procurement'],
                ],
                [
                    'title' => 'Reviewer participated in decision involving former consulting client',
                    'description' => 'A reviewer assigned in %s allegedly took part in a decision affecting an entity that had recently been their private consulting client. The prior engagement was not disclosed even after the matter was raised internally during %s.',
                    'incident_location' => 'Policy Review Secretariat',
                    'accused_party' => 'Senior Reviewer',
                    'evidence_summary' => 'Supporting material includes archived consultancy documents, assignment memos, and internal correspondence from %s.',
                    'governance_tags' => ['conflict-sensitive'],
                ],
                [
                    'title' => 'Vendor ownership overlap not declared during selection process',
                    'description' => 'Two vendors competing in a process handled by %s appear to share beneficial ownership through the same holding arrangement, but this overlap was not disclosed in the selection file. The issue became visible when ownership records were compared in %s.',
                    'incident_location' => 'Vendor Qualification Review',
                    'accused_party' => 'Selection Committee Secretary',
                    'evidence_summary' => 'Evidence includes ownership extracts, vendor declarations, and comparison notes prepared during %s.',
                    'governance_tags' => ['conflict-sensitive', 'procurement'],
                ],
            ],
            'harassment' => [
                [
                    'title' => 'Sexual harassment complaint allegedly suppressed by direct supervisor',
                    'description' => 'A staff member in %s reported repeated inappropriate messages and unwanted contact from a direct supervisor, but the formal complaint was allegedly withheld from HR processing. The reporting party states that the matter escalated during %s without any formal protective action.',
                    'incident_location' => 'Human Resources Liaison Desk',
                    'accused_party' => 'Direct Supervisor',
                    'evidence_summary' => 'Evidence includes message screenshots, meeting notes, and copies of the complaint submission filed in %s.',
                    'governance_tags' => ['leadership'],
                ],
                [
                    'title' => 'Witness intimidation reported after misconduct allegation was filed',
                    'description' => 'Following a misconduct allegation in %s, two witnesses were allegedly pressured to withdraw their statements by a senior official. The intimidation took the form of repeated summons and verbal warnings delivered during %s.',
                    'incident_location' => 'Internal Ethics Coordination Unit',
                    'accused_party' => 'Senior Official',
                    'evidence_summary' => 'Supporting files include witness notes, summons records, and message threads documenting the pressure applied in %s.',
                    'governance_tags' => ['retaliation-risk', 'leadership'],
                ],
                [
                    'title' => 'Derogatory conduct during closed-door briefing went unrecorded in official minutes',
                    'description' => 'The reporter states that abusive and degrading remarks were made by a manager during a closed-door briefing in %s, but the official meeting minutes omitted those exchanges entirely. Several attendees recall the statements being made during %s.',
                    'incident_location' => 'Internal Briefing Room',
                    'accused_party' => 'Manager',
                    'evidence_summary' => 'The evidence package includes attendee statements, draft minutes, and follow-up email summaries circulated in %s.',
                    'governance_tags' => ['leadership'],
                ],
            ],
            'retaliation' => [
                [
                    'title' => 'Threat of reassignment after staff questioned travel expense claims',
                    'description' => 'After irregular travel expense claims were questioned in %s, the reporting party was allegedly warned that they would be reassigned to a non-operational post if they continued raising the issue. The warning was repeated during %s in meetings with management.',
                    'incident_location' => 'Directorate Administration Office',
                    'accused_party' => 'Division Supervisor',
                    'evidence_summary' => 'Available evidence includes reassignment drafts, meeting notes, and expense claim files linked to the complaint raised in %s.',
                    'governance_tags' => ['retaliation-risk', 'leadership'],
                ],
                [
                    'title' => 'Performance score reduced after reporting irregular procurement communication',
                    'description' => 'The reporter alleges that their annual performance score in %s was reduced without explanation shortly after they documented irregular communication between procurement officials and a vendor. The sequence of events occurred over %s.',
                    'incident_location' => 'Performance Evaluation Unit',
                    'accused_party' => 'Section Head',
                    'evidence_summary' => 'Supporting evidence includes performance appraisal forms, procurement correspondence, and timeline notes prepared during %s.',
                    'governance_tags' => ['retaliation-risk', 'procurement'],
                ],
                [
                    'title' => 'System access blocked after witness statement was submitted',
                    'description' => 'A staff member who submitted a witness statement in %s reported that their access to operational systems was suspended without prior notice. The access block happened during %s and prevented them from performing normal duties.',
                    'incident_location' => 'Operations Support Unit',
                    'accused_party' => 'Operations Manager',
                    'evidence_summary' => 'Evidence includes access denial screenshots, helpdesk tickets, and the earlier witness statement filed in %s.',
                    'governance_tags' => ['retaliation-risk', 'data-integrity'],
                ],
            ],
            'other' => [
                [
                    'title' => 'Official correspondence archive appears to have been selectively removed',
                    'description' => 'The reporter found that an archive folder in %s no longer contained key correspondence related to a high-value decision process. The missing files were still visible in circulation lists during %s but could not be retrieved afterward.',
                    'incident_location' => 'Records Management Unit',
                    'accused_party' => 'Records Custodian',
                    'evidence_summary' => 'Supporting documents include archive indexes, circulation logs, and screenshots showing the missing correspondence during %s.',
                    'governance_tags' => ['data-integrity'],
                ],
                [
                    'title' => 'Unofficial donation request tied to access to public service queue',
                    'description' => 'Members of the public dealing with %s were allegedly told to provide an unofficial donation to a staff-associated foundation in exchange for priority processing. The request was conveyed repeatedly during %s.',
                    'incident_location' => 'Public Service Counter',
                    'accused_party' => 'Service Counter Officer',
                    'evidence_summary' => 'The evidence bundle contains queue tickets, donation request notes, and witness statements gathered in %s.',
                    'governance_tags' => ['financial-loss'],
                ],
                [
                    'title' => 'Meeting minutes altered after objection was formally recorded',
                    'description' => 'During a governance meeting in %s, the reporter lodged a formal objection to a proposed decision, but the final circulated minutes no longer reflected that objection. The change was noticed when the final version was distributed in %s.',
                    'incident_location' => 'Secretariat Meeting Unit',
                    'accused_party' => 'Meeting Secretariat Officer',
                    'evidence_summary' => 'Evidence includes draft and final meeting minutes, attendee notes, and email circulation records from %s.',
                    'governance_tags' => ['data-integrity', 'leadership'],
                ],
            ],
        ];
    }

    private function buildTemplateContext(string $title, ?Report $fallbackReport = null): array
    {
        $office = 'Jakarta Head Office';
        $month = 'March 2026';

        foreach ($this->additionalTransactionTemplates() as $category => $templates) {
            foreach ($templates as $template) {
                if ($template['title'] !== $title) {
                    continue;
                }

                return [
                    'category' => $category,
                    'description' => sprintf($template['description'], $office, $month),
                    'incident_location' => $template['incident_location'] ?? $office,
                    'accused_party' => $template['accused_party'],
                    'evidence_summary' => sprintf($template['evidence_summary'], $month),
                    'governance_tags' => $template['governance_tags'] ?? [],
                ];
            }
        }

        if ($fallbackReport) {
            return [
                'category' => $fallbackReport->category,
                'description' => $fallbackReport->description,
                'incident_location' => $fallbackReport->incident_location,
                'accused_party' => $fallbackReport->accused_party,
                'evidence_summary' => $fallbackReport->evidence_summary,
                'governance_tags' => $fallbackReport->governance_tags ?? [],
            ];
        }

        throw new \RuntimeException("Seed template not found for title [{$title}].");
    }

    private function assignedRoleForStage(string $stage): string
    {
        return match ($stage) {
            'verification_in_progress' => User::ROLE_VERIFICATOR,
            'verification_review' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'verified', 'investigation_review' => User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'investigation_in_progress' => User::ROLE_INVESTIGATOR,
            'director_review', 'completed' => User::ROLE_DIRECTOR,
            default => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
        };
    }

    private function dispositionForStage(string $stage): string
    {
        return match ($stage) {
            'submitted' => 'submitted',
            'verification_in_progress' => 'verification_in_progress',
            'verification_review' => 'verification_review',
            'verified' => 'awaiting_review_delegation',
            'investigation_in_progress' => 'review_in_progress',
            'investigation_review' => 'review_approval',
            'director_review' => 'director_review',
            'completed' => 'completed',
            default => $stage,
        };
    }

    private function reportStatusForStage(string $stage): string
    {
        return match ($stage) {
            'submitted' => 'submitted',
            'verification_in_progress' => 'verification_in_progress',
            'verification_review' => 'verification_review',
            'verified' => 'verified',
            'investigation_in_progress' => 'investigation_in_progress',
            'investigation_review' => 'investigation_review',
            'director_review' => 'director_review',
            'completed' => 'completed',
            default => 'submitted',
        };
    }

    private function submitSeededReportAt(
        CaseWorkflowService $workflow,
        User $reporter,
        array $payload,
        CarbonImmutable $submittedAt,
    ): array {
        return $this->executeAt(
            $submittedAt,
            fn () => $workflow->submitReport($reporter, $payload)
        );
    }

    private function buildWorkflowClock(
        CarbonImmutable $submittedAt,
        \Faker\Generator $faker,
    ): array {
        $delegateVerificationAt = $submittedAt->addHours($faker->numberBetween(2, 18));
        $submitVerificationAt = $delegateVerificationAt->addHours($faker->numberBetween(8, 48));
        $reviewVerificationAt = $submitVerificationAt->addHours($faker->numberBetween(2, 16));
        $delegateInvestigationAt = $reviewVerificationAt->addHours($faker->numberBetween(4, 20));
        $submitInvestigationAt = $delegateInvestigationAt->addHours($faker->numberBetween(12, 96));
        $reviewInvestigationAt = $submitInvestigationAt->addHours($faker->numberBetween(4, 24));
        $directorDecisionAt = $reviewInvestigationAt->addHours($faker->numberBetween(8, 72));

        return [
            'submitted' => $submittedAt,
            'delegate_verification' => $delegateVerificationAt,
            'submit_verification' => $submitVerificationAt,
            'review_verification' => $reviewVerificationAt,
            'delegate_investigation' => $delegateInvestigationAt,
            'submit_investigation' => $submitInvestigationAt,
            'review_investigation' => $reviewInvestigationAt,
            'director_decision' => $directorDecisionAt,
        ];
    }

    private function executeAt(CarbonImmutable $time, callable $callback): mixed
    {
        $previous = Carbon::getTestNow();
        Carbon::setTestNow($time);

        try {
            return $callback();
        } finally {
            Carbon::setTestNow($previous);
        }
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
            'description' => 'Separate verification supervision, verification officer review, investigation supervision, investigation work, and director approval.',
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
            'owner_role' => 'Verification Supervisor',
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
