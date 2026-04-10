<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\Report;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvestigatorWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_case_moves_from_submission_to_director_approval_through_kpk_roles(): void
    {
        $supervisorOfVerificator = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.verificator@example.test',
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            User::ROLE_VERIFICATOR,
            'verificator@example.test',
            'Verification Desk'
        );
        $supervisorOfInvestigator = $this->createUser(
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'supervisor.investigator@example.test',
            'Investigation Supervision'
        );
        $investigator = $this->createUser(
            User::ROLE_INVESTIGATOR,
            'investigator@example.test',
            'Investigation Desk'
        );
        $director = $this->createUser(
            User::ROLE_DIRECTOR,
            'director@example.test',
            'Directorate'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter@example.test',
            'Reporter'
        );

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->postJson('/api/reporter/reports', [
            'title' => 'Potential bribery during permit approval',
            'category' => 'bribery',
            'description' => 'A staff member allegedly requested an unofficial payment to accelerate a permit approval and threatened to delay the file if the payment was refused.',
            'incident_date' => now()->subDays(2)->toDateString(),
            'incident_location' => 'Permit Approval Desk',
            'accused_party' => 'Permit Officer',
            'evidence_summary' => 'Messaging screenshots and approval timestamps are available.',
            'confidentiality_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['leadership'],
        ])->assertCreated();

        $caseFile = CaseFile::query()->firstOrFail();

        Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);

        $this->getJson('/api/workflow/cases')
            ->assertOk()
            ->assertJsonPath('data.items.0.reporter.name', 'Anonymous')
            ->assertJsonPath('data.items.0.reporter.email', null)
            ->assertJsonPath('data.items.0.reporter.is_protected', true);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-verification", [
            'assignee_user_id' => $verificator->id,
            'assigned_unit' => 'Verification Desk',
            'due_in_days' => 5,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'verification_in_progress');

        Sanctum::actingAs($verificator, [$verificator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/submit-verification", [
            'internal_note' => 'Verification completed and ready for supervisory review.',
            'publish_update' => true,
            'public_message' => 'The report has completed verification and is pending supervisory review.',
        ])->assertOk()
            ->assertJsonPath('data.stage', 'verification_review');

        Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/review-verification", [
            'decision' => 'approved',
            'internal_note' => 'Verification approved and transferred to the investigation supervisor.',
            'publish_update' => true,
            'public_message' => 'The report passed verification and is moving into investigation allocation.',
        ])->assertOk()
            ->assertJsonPath('data.stage', 'verified');

        Sanctum::actingAs($supervisorOfInvestigator, [$supervisorOfInvestigator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-investigation", [
            'assignee_user_id' => $investigator->id,
            'assigned_unit' => 'Investigation Desk',
            'due_in_days' => 7,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'investigation_in_progress');

        Sanctum::actingAs($investigator, [$investigator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/submit-investigation", [
            'internal_note' => 'Investigation findings are documented and ready for supervisory review.',
            'publish_update' => true,
            'public_message' => 'The investigation file has been completed and is pending supervisory review.',
        ])->assertOk()
            ->assertJsonPath('data.stage', 'investigation_review');

        Sanctum::actingAs($supervisorOfInvestigator, [$supervisorOfInvestigator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/review-investigation", [
            'decision' => 'approved',
            'internal_note' => 'Investigation approved and sent to the director.',
            'publish_update' => false,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'director_review');

        Sanctum::actingAs($director, [$director->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/director-review", [
            'decision' => 'approved',
            'internal_note' => 'Final approval granted and the report is completed.',
            'publish_update' => true,
            'public_message' => 'The report has completed the KPK Whistleblowing System process.',
        ])->assertOk()
            ->assertJsonPath('data.stage', 'completed')
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('case_files', [
            'id' => $caseFile->id,
            'stage' => 'completed',
            'current_role' => User::ROLE_DIRECTOR,
            'assigned_to' => $director->name,
        ]);

        $this->assertDatabaseHas('reports', [
            'id' => $caseFile->report_id,
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'case_file_id' => $caseFile->id,
            'action' => 'director_approved',
            'actor_role' => User::ROLE_DIRECTOR,
        ]);

        $this->assertDatabaseHas('case_timeline_events', [
            'case_file_id' => $caseFile->id,
            'visibility' => 'public',
            'headline' => 'Report completed',
        ]);
    }

    public function test_identified_reports_remain_visible_to_internal_case_handlers(): void
    {
        $supervisor = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.visible@example.test',
            'Verification Supervision'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter.visible@example.test',
            'Reporter'
        );

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->postJson('/api/reporter/reports', [
            'title' => 'Identified reporter visibility test',
            'category' => 'bribery',
            'description' => 'The reporter is intentionally identified so internal case handlers can view the registered identity in the workflow workbench.',
            'confidentiality_level' => 'identified',
        ])->assertCreated();

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $this->getJson('/api/workflow/cases')
            ->assertOk()
            ->assertJsonPath('data.items.0.reporter.name', $reporter->name)
            ->assertJsonPath('data.items.0.reporter.email', $reporter->email)
            ->assertJsonPath('data.items.0.reporter.is_protected', false);
    }

    public function test_workflow_directory_supports_queue_and_approval_views_with_pagination(): void
    {
        $supervisor = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.workflow@example.test',
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            User::ROLE_VERIFICATOR,
            'verificator.workflow@example.test',
            'Verification Desk'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter.workflow@example.test',
            'Reporter'
        );

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->postJson('/api/reporter/reports', [
            'title' => 'Queue stage report',
            'category' => 'bribery',
            'description' => 'Queue stage report description.',
            'confidentiality_level' => 'anonymous',
        ])->assertCreated();

        $queuedCase = CaseFile::query()->firstOrFail();

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $this->patchJson("/api/workflow/cases/{$queuedCase->id}/delegate-verification", [
            'assignee_user_id' => $verificator->id,
            'assigned_unit' => 'Verification Desk',
            'due_in_days' => 5,
        ])->assertOk();

        Sanctum::actingAs($verificator, [$verificator->role]);

        $this->patchJson("/api/workflow/cases/{$queuedCase->id}/submit-verification", [
            'internal_note' => 'Ready for approval.',
            'publish_update' => false,
        ])->assertOk();

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $this->getJson('/api/workflow/cases?view=queue&per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.per_page', 10)
            ->assertJsonCount(0, 'data.items');

        $this->getJson('/api/workflow/cases?view=approval&search=Queue')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.stage', 'verification_review')
            ->assertJsonPath('data.items.0.available_actions.0', 'review_verification');

        $this->getJson("/api/workflow/cases/{$queuedCase->id}")
            ->assertOk()
            ->assertJsonPath('data.case_number', $queuedCase->case_number)
            ->assertJsonPath('data.timeline.0.visibility', 'public');
    }

    public function test_public_tracking_history_matches_progressed_workflow_sequence(): void
    {
        $supervisorOfVerificator = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.timeline@example.test',
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            User::ROLE_VERIFICATOR,
            'verificator.timeline@example.test',
            'Verification Desk'
        );
        $supervisorOfInvestigator = $this->createUser(
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'supervisor.investigator.timeline@example.test',
            'Investigation Supervision'
        );
        $investigator = $this->createUser(
            User::ROLE_INVESTIGATOR,
            'investigator.timeline@example.test',
            'Investigation Desk'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter.timeline@example.test',
            'Reporter'
        );

        $submittedAt = CarbonImmutable::parse('2026-03-10 08:00:00', 'UTC');

        try {
            Carbon::setTestNow($submittedAt);
            Sanctum::actingAs($reporter, [$reporter->role]);

            $this->postJson('/api/reporter/reports', [
                'title' => 'Timeline progression validation',
                'category' => 'fraud',
                'description' => 'Timeline validation report for public-safe tracking sequence.',
                'incident_date' => $submittedAt->subDays(2)->toDateString(),
                'incident_location' => 'Finance Bureau',
                'accused_party' => 'Finance Officer',
                'evidence_summary' => 'Screenshots and ledger extracts are available.',
                'confidentiality_level' => 'anonymous',
                'requested_follow_up' => true,
                'witness_available' => true,
                'governance_tags' => ['financial-loss'],
            ])->assertCreated();

            $report = Report::query()->firstOrFail();
            $caseFile = CaseFile::query()->firstOrFail();

            Carbon::setTestNow($submittedAt->addHours(6));
            Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);
            $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-verification", [
                'assignee_user_id' => $verificator->id,
                'assigned_unit' => 'Verification Desk',
                'due_in_days' => 5,
            ])->assertOk();

            Carbon::setTestNow($submittedAt->addDay());
            Sanctum::actingAs($verificator, [$verificator->role]);
            $this->patchJson("/api/workflow/cases/{$caseFile->id}/submit-verification", [
                'internal_note' => 'Ready for supervisory review.',
                'publish_update' => true,
                'public_message' => 'Your report has completed the verification assessment stage and is pending supervisory review.',
            ])->assertOk();

            Carbon::setTestNow($submittedAt->addDay()->addHours(4));
            Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);
            $this->patchJson("/api/workflow/cases/{$caseFile->id}/review-verification", [
                'decision' => 'approved',
                'internal_note' => 'Approved for investigation allocation.',
                'publish_update' => true,
                'public_message' => 'Your report has passed verification and is proceeding to investigation allocation.',
            ])->assertOk();

            Carbon::setTestNow($submittedAt->addDay()->addHours(10));
            Sanctum::actingAs($supervisorOfInvestigator, [$supervisorOfInvestigator->role]);
            $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-investigation", [
                'assignee_user_id' => $investigator->id,
                'assigned_unit' => 'Investigation Desk',
                'due_in_days' => 7,
            ])->assertOk();

            Carbon::setTestNow($submittedAt->addDays(3));
            Sanctum::actingAs($investigator, [$investigator->role]);
            $this->patchJson("/api/workflow/cases/{$caseFile->id}/submit-investigation", [
                'internal_note' => 'Investigation completed and awaiting supervisory review.',
                'publish_update' => true,
                'public_message' => 'The investigation file has been completed and is pending supervisory review.',
            ])->assertOk();

            $tracking = $this->postJson('/api/tracking', [
                'reference' => $report->public_reference,
                'token' => $report->tracking_token,
            ])->assertOk();

            $timeline = $tracking->json('data.timeline');

            $this->assertSame([
                'submitted',
                'verification_in_progress',
                'verification_review',
                'verified',
                'investigation_in_progress',
                'investigation_review',
            ], array_column($timeline, 'stage'));

            for ($index = 1; $index < count($timeline); $index++) {
                $this->assertTrue(
                    CarbonImmutable::parse($timeline[$index - 1]['occurred_at'])->lte(
                        CarbonImmutable::parse($timeline[$index]['occurred_at'])
                    )
                );
            }
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_public_tracking_exposes_screening_closure_as_a_distinct_terminal_stage(): void
    {
        $supervisor = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.screening.timeline@example.test',
            'Verification Supervision'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter.screening.timeline@example.test',
            'Reporter'
        );

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->postJson('/api/reporter/reports', [
            'title' => 'Screening rejection timeline validation',
            'category' => 'other',
            'description' => 'A vague report used to validate the public tracking closure stage after initial screening.',
            'incident_date' => now()->subDay()->toDateString(),
            'incident_location' => 'Public Service Counter',
            'accused_party' => 'Unknown Person',
            'evidence_summary' => 'No corroborating evidence is available.',
            'confidentiality_level' => 'identified',
            'requested_follow_up' => false,
            'witness_available' => false,
            'governance_tags' => [],
        ])->assertCreated();

        $report = Report::query()->firstOrFail();
        $caseFile = CaseFile::query()->firstOrFail();

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-verification", [
            'reject_report' => true,
            'distribution_note' => 'Closed during preliminary screening because the report is not actionable.',
        ])->assertOk()
            ->assertJsonPath('data.stage', 'completed');

        $tracking = $this->postJson('/api/tracking', [
            'reference' => $report->public_reference,
            'token' => $report->tracking_token,
        ])->assertOk();

        $tracking
            ->assertJsonPath('data.status', 'screening_closed')
            ->assertJsonPath('data.case.stage', 'screening_closed')
            ->assertJsonPath('data.case.stage_label', 'Closed during preliminary screening')
            ->assertJsonPath('data.timeline.1.stage', 'screening_closed')
            ->assertJsonPath('data.timeline.1.headline', 'Report closed during preliminary screening');
    }

    private function createUser(string $role, string $email, string $unit): User
    {
        return User::query()->create([
            'name' => str($role)->replace('_', ' ')->headline()->toString(),
            'email' => $email,
            'phone' => '+62-812-0000-1111',
            'role' => $role,
            'unit' => $unit,
            'is_active' => true,
            'password' => 'Password123',
        ]);
    }
}
