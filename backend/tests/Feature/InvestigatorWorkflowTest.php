<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            'confidentiality_level' => 'confidential',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['leadership'],
        ])->assertCreated();

        $caseFile = CaseFile::query()->firstOrFail();

        Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);

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
            'internal_note' => 'Verification approved and transferred to the supervisor of investigator.',
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
