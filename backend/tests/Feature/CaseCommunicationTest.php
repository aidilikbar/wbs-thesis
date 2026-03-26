<?php

namespace Tests\Feature;

use App\Models\CaseMessageAttachment;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CaseCommunicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporter_and_assigned_verificator_can_exchange_secure_messages_during_verification(): void
    {
        Storage::fake('attachments');

        $supervisor = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.chat@example.test',
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            User::ROLE_VERIFICATOR,
            'verificator.chat@example.test',
            'Verification Desk'
        );
        $this->createUser(
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'supervisor.investigation.chat@example.test',
            'Investigation Supervision'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter.chat@example.test',
            'Reporter'
        );

        $report = $this->submitReport($reporter, 'Verification chat case');
        $caseFile = $report->caseFile()->firstOrFail();

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-verification", [
            'assignee_user_id' => $verificator->id,
            'assigned_unit' => 'Verification Desk',
            'due_in_days' => 5,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'verification_in_progress');

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->getJson("/api/reporter/reports/{$report->id}/messages")
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.active_stage', 'verification_in_progress')
            ->assertJsonPath('data.counterparty_role', User::ROLE_VERIFICATOR)
            ->assertJsonPath('data.can_send_message', true);

        $this->post("/api/reporter/reports/{$report->id}/messages", [
            'body' => 'Please review the attached payment advice and advise whether the serial number is sufficient.',
            'attachments' => [
                UploadedFile::fake()->create('payment-advice.pdf', 128, 'application/pdf'),
            ],
        ])->assertCreated()
            ->assertJsonPath('data.sender_role', User::ROLE_REPORTER)
            ->assertJsonPath('data.sender_role_label', 'Reporter')
            ->assertJsonPath('data.attachments.0.original_name', 'payment-advice.pdf');

        $attachment = CaseMessageAttachment::query()->firstOrFail();

        Storage::disk('attachments')->assertExists($attachment->object_key);

        Sanctum::actingAs($verificator, [$verificator->role]);

        $response = $this->getJson("/api/workflow/cases/{$caseFile->id}/messages");

        $response
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.counterparty_role', User::ROLE_REPORTER)
            ->assertJsonPath('data.can_send_message', true)
            ->assertJsonPath('data.messages.0.sender_role_label', 'Reporter');

        $this->assertArrayNotHasKey('sender_name', $response->json('data.messages.0'));

        $this->postJson("/api/workflow/cases/{$caseFile->id}/messages", [
            'body' => 'The serial number is sufficient. Please also upload the approval email thread if available.',
        ])->assertCreated()
            ->assertJsonPath('data.sender_role', User::ROLE_VERIFICATOR)
            ->assertJsonPath('data.sender_role_label', 'Verificator');

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->get("/api/reporter/reports/{$report->id}/messages/{$attachment->case_message_id}/attachments/{$attachment->id}/download")
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=payment-advice.pdf');

        $this->assertDatabaseHas('audit_logs', [
            'case_file_id' => $caseFile->id,
            'action' => 'case_message_posted',
            'actor_role' => User::ROLE_REPORTER,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'case_file_id' => $caseFile->id,
            'action' => 'case_message_posted',
            'actor_role' => User::ROLE_VERIFICATOR,
        ]);
    }

    public function test_communication_is_stage_bound_and_reopens_for_investigation_with_assigned_investigator(): void
    {
        Storage::fake('attachments');

        $supervisorOfVerificator = $this->createUser(
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'supervisor.verification.flow@example.test',
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            User::ROLE_VERIFICATOR,
            'verificator.flow@example.test',
            'Verification Desk'
        );
        $supervisorOfInvestigator = $this->createUser(
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'supervisor.investigation.flow@example.test',
            'Investigation Supervision'
        );
        $investigator = $this->createUser(
            User::ROLE_INVESTIGATOR,
            'investigator.flow@example.test',
            'Investigation Desk'
        );
        $reporter = $this->createUser(
            User::ROLE_REPORTER,
            'reporter.flow@example.test',
            'Reporter'
        );

        $report = $this->submitReport($reporter, 'Investigation chat case');
        $caseFile = $report->caseFile()->firstOrFail();

        Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-verification", [
            'assignee_user_id' => $verificator->id,
            'assigned_unit' => 'Verification Desk',
            'due_in_days' => 5,
        ])->assertOk();

        Sanctum::actingAs($verificator, [$verificator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/submit-verification", [
            'internal_note' => 'Verification completed and returned for supervisory approval.',
            'publish_update' => false,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'verification_review');

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->postJson("/api/reporter/reports/{$report->id}/messages", [
            'body' => 'Can I still add clarification while the case is waiting for supervisor review?',
        ])->assertStatus(422);

        Sanctum::actingAs($supervisorOfVerificator, [$supervisorOfVerificator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/review-verification", [
            'decision' => 'approved',
            'internal_note' => 'Approved and moved to investigation supervision.',
            'publish_update' => false,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'verified');

        Sanctum::actingAs($supervisorOfInvestigator, [$supervisorOfInvestigator->role]);

        $this->patchJson("/api/workflow/cases/{$caseFile->id}/delegate-investigation", [
            'assignee_user_id' => $investigator->id,
            'assigned_unit' => 'Investigation Desk',
            'due_in_days' => 7,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'investigation_in_progress');

        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->getJson("/api/reporter/reports/{$report->id}/messages")
            ->assertOk()
            ->assertJsonPath('data.active_stage', 'investigation_in_progress')
            ->assertJsonPath('data.counterparty_role', User::ROLE_INVESTIGATOR)
            ->assertJsonPath('data.can_send_message', true);

        $this->postJson("/api/reporter/reports/{$report->id}/messages", [
            'body' => 'I have uploaded a second contract version and can answer additional questions.',
        ])->assertCreated()
            ->assertJsonPath('data.sender_role_label', 'Reporter');

        Sanctum::actingAs($investigator, [$investigator->role]);

        $this->getJson("/api/workflow/cases/{$caseFile->id}/messages")
            ->assertOk()
            ->assertJsonPath('data.active_stage', 'investigation_in_progress')
            ->assertJsonPath('data.counterparty_role', User::ROLE_REPORTER)
            ->assertJsonPath('data.can_send_message', true)
            ->assertJsonPath('data.messages.0.sender_role_label', 'Reporter');

        $this->post("/api/workflow/cases/{$caseFile->id}/messages", [
            'attachments' => [
                UploadedFile::fake()->image('annotated-ledger.png')->size(256),
            ],
        ])->assertCreated()
            ->assertJsonPath('data.sender_role_label', 'Investigator')
            ->assertJsonPath('data.attachments.0.original_name', 'annotated-ledger.png');

        $this->assertDatabaseCount('case_messages', 2);
    }

    private function createUser(string $role, string $email, string $unit): User
    {
        return User::query()->create([
            'name' => str($role)->replace('_', ' ')->headline()->toString(),
            'email' => $email,
            'phone' => '+62-812-0000-'.fake()->unique()->numerify('####'),
            'role' => $role,
            'unit' => $unit,
            'is_active' => true,
            'password' => 'Password123',
        ]);
    }

    private function submitReport(User $reporter, string $title): Report
    {
        Sanctum::actingAs($reporter, [$reporter->role]);

        $this->postJson('/api/reporter/reports', [
            'title' => $title,
            'category' => 'bribery',
            'description' => 'A protected report created for secure communication testing across the verification and investigation stages.',
            'incident_date' => now()->subDays(2)->toDateString(),
            'incident_location' => 'Regional Procurement Office',
            'accused_party' => 'Procurement Officer',
            'evidence_summary' => 'Supporting contracts and payment traces are available.',
            'confidentiality_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement'],
        ])->assertCreated();

        return Report::query()->latest('id')->firstOrFail();
    }
}
