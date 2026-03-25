<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\Report;
use App\Models\ReportAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttachmentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporter_can_upload_download_and_delete_attachment(): void
    {
        Storage::fake('attachments');

        $reporter = $this->createReporter();
        $report = $this->createReporterReport($reporter);

        Sanctum::actingAs($reporter, [$reporter->role]);

        $upload = $this->post("/api/reporter/reports/{$report->id}/attachments", [
            'file' => UploadedFile::fake()->create(
                'supporting-evidence.pdf',
                256,
                'application/pdf',
            ),
        ]);

        $upload
            ->assertCreated()
            ->assertJsonPath('data.original_name', 'supporting-evidence.pdf');

        $attachment = ReportAttachment::query()->firstOrFail();

        Storage::disk('attachments')->assertExists($attachment->object_key);

        $this->get("/api/reporter/reports/{$report->id}/attachments/{$attachment->id}/download")
            ->assertOk()
            ->assertHeader(
                'content-disposition',
                'attachment; filename=supporting-evidence.pdf'
            );

        $this->deleteJson("/api/reporter/reports/{$report->id}/attachments/{$attachment->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Attachment deleted successfully.');

        Storage::disk('attachments')->assertMissing($attachment->object_key);

        $this->assertDatabaseCount('report_attachments', 0);
        $this->assertDatabaseHas('audit_logs', [
            'report_id' => $report->id,
            'action' => 'attachment_uploaded_by_reporter',
            'actor_role' => User::ROLE_REPORTER,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'report_id' => $report->id,
            'action' => 'attachment_deleted_by_reporter',
            'actor_role' => User::ROLE_REPORTER,
        ]);
    }

    public function test_assigned_internal_role_can_download_case_attachment(): void
    {
        Storage::fake('attachments');

        $reporter = $this->createReporter('reporter.assigned@example.test');
        $supervisor = User::query()->create([
            'name' => 'Verification Supervisor',
            'email' => 'supervisor.verificator@example.test',
            'phone' => '+62-812-0000-0901',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $report = $this->createReporterReport($reporter, [], [
            'verification_supervisor_id' => $supervisor->id,
            'assigned_to' => $supervisor->name,
            'assigned_unit' => $supervisor->unit,
        ]);

        $attachment = $report->attachments()->create([
            'uploaded_by_user_id' => $reporter->id,
            'uuid' => (string) Str::uuid(),
            'disk' => 'attachments',
            'bucket' => 'wbs-attachments-dev',
            'object_key' => "reports/{$report->uuid}/attachments/briefing-note.txt",
            'original_name' => 'briefing-note.txt',
            'mime_type' => 'text/plain',
            'extension' => 'txt',
            'size_bytes' => 24,
            'checksum_sha256' => hash('sha256', 'confidential evidence note'),
        ]);

        Storage::disk('attachments')->put(
            $attachment->object_key,
            'confidential evidence note'
        );

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $this->get("/api/workflow/cases/{$report->caseFile->id}/attachments/{$attachment->id}/download")
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=briefing-note.txt');
    }

    private function createReporter(string $email = 'reporter.attachments@example.test'): User
    {
        return User::query()->create([
            'name' => 'Attachment Reporter',
            'email' => $email,
            'phone' => '+62-812-0000-0900',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);
    }

    private function createReporterReport(
        User $reporter,
        array $attributes = [],
        array $caseAttributes = [],
    ): Report {
        $report = Report::query()->create(array_merge([
            'reporter_user_id' => $reporter->id,
            'uuid' => (string) Str::uuid(),
            'public_reference' => 'WBS-2026-A' . fake()->unique()->numerify('####'),
            'tracking_token' => Str::upper(Str::random(12)),
            'title' => 'Attachment evidence case',
            'category' => 'procurement',
            'description' => 'Attachment management test report for the secure evidence flow.',
            'incident_date' => now()->subDays(3)->toDateString(),
            'incident_location' => 'Procurement Unit',
            'accused_party' => 'Procurement Officer',
            'evidence_summary' => 'Initial evidence summary for attachment tests.',
            'anonymity_level' => 'anonymous',
            'reporter_name' => $reporter->name,
            'reporter_email' => $reporter->email,
            'reporter_phone' => $reporter->phone,
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['procurement'],
            'severity' => 'high',
            'status' => 'submitted',
            'submitted_at' => now()->subDay(),
            'last_public_update_at' => now()->subDay(),
        ], $attributes));

        CaseFile::query()->create(array_merge([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-A' . fake()->unique()->numerify('####'),
            'stage' => 'submitted',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'disposition' => 'submitted',
            'assigned_unit' => 'Verification Supervision',
            'assigned_to' => 'Verification Supervisor',
            'confidentiality_level' => 'anonymous',
            'last_activity_at' => now()->subDay(),
            'notes' => $report->description,
        ], $caseAttributes));

        return $report->fresh(['caseFile', 'attachments']);
    }
}
