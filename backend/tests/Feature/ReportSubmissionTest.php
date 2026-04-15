<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\CaseTimelineEvent;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ReportSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporter_must_register_and_authenticate_before_submitting(): void
    {
        User::query()->create([
            'name' => 'Verification Supervisor',
            'email' => 'supervisor.verificator@example.test',
            'phone' => '+62-812-0000-0001',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $this->postJson('/api/reporter/reports', [
            'title' => 'Unusual payment request before vendor evaluation',
            'category' => 'procurement',
            'description' => 'A procurement officer requested a personal transfer before confirming that a vendor submission would move to the next review stage.',
            'confidentiality_level' => 'anonymous',
        ])->assertUnauthorized();

        $registration = $this->postJson('/api/auth/register', [
            'name' => 'Registered Reporter',
            'email' => 'reporter@example.test',
            'phone' => '+62-812-0000-0002',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $registration
            ->assertCreated()
            ->assertJsonPath('data.user.role', User::ROLE_REPORTER);

        $token = $registration->json('data.token');

        $submission = $this->withToken($token)->postJson('/api/reporter/reports', [
            'title' => 'Unusual payment request before vendor evaluation',
            'category' => 'procurement',
            'description' => 'A procurement officer requested a personal transfer before confirming that a vendor submission would move to the next review stage.',
            'incident_date' => now()->subDay()->toDateString(),
            'incident_location' => 'Procurement Unit',
            'accused_party' => 'Procurement Officer',
            'evidence_summary' => 'Email excerpts and witness details can be provided on request.',
            'confidentiality_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement', 'financial-loss'],
        ]);

        $submission
            ->assertCreated()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.severity', 'not_available');

        $this->assertDatabaseHas('reports', [
            'title' => 'Unusual payment request before vendor evaluation',
            'anonymity_level' => 'anonymous',
            'status' => 'submitted',
        ]);

        $storedEmail = DB::table('reports')
            ->where('title', 'Unusual payment request before vendor evaluation')
            ->value('reporter_email');

        $this->assertIsString($storedEmail);
        $this->assertNotSame('reporter@example.test', $storedEmail);

        $this->assertDatabaseHas('case_files', [
            'stage' => 'submitted',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'assigned_unit' => 'Verification Supervision',
        ]);

        $this->assertDatabaseHas('case_timeline_events', [
            'visibility' => 'public',
            'headline' => 'Report received',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'report_submitted',
            'actor_role' => User::ROLE_REPORTER,
        ]);
    }

    public function test_reporter_report_directory_returns_api_safe_unauthorized_response(): void
    {
        $this->get('/api/reporter/reports')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_reporter_can_list_reports_with_pagination_and_filters(): void
    {
        $reporter = User::query()->create([
            'name' => 'Reporter One',
            'email' => 'reporter.one@example.test',
            'phone' => '+62-812-0000-0100',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $otherReporter = User::query()->create([
            'name' => 'Reporter Two',
            'email' => 'reporter.two@example.test',
            'phone' => '+62-812-0000-0101',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        foreach (range(1, 12) as $index) {
            $this->createReporterReport(
                $reporter,
                [
                    'title' => $index === 3 ? 'Flagged procurement concern' : "Reporter case {$index}",
                    'status' => $index % 2 === 0 ? 'completed' : 'submitted',
                ],
                [
                    'stage' => $index % 2 === 0 ? 'completed' : 'submitted',
                    'current_role' => $index % 2 === 0 ? User::ROLE_DIRECTOR : User::ROLE_SUPERVISOR_OF_VERIFICATOR,
                ]
            );
        }

        $this->createReporterReport($otherReporter, [
            'title' => 'Other reporter case',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $reporter->email,
            'password' => 'Password123',
        ])->json('data.token');

        $this->withToken($token)
            ->getJson('/api/reporter/reports?per_page=10&search=Flagged&status=submitted')
            ->assertOk()
            ->assertJsonPath('data.meta.per_page', 10)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.title', 'Flagged procurement concern')
            ->assertJsonPath('data.items.0.is_editable', true);
    }

    public function test_reporter_can_view_and_update_owned_report(): void
    {
        $reporter = User::query()->create([
            'name' => 'Reporter Three',
            'email' => 'reporter.three@example.test',
            'phone' => '+62-812-0000-0102',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $report = $this->createReporterReport($reporter);

        $token = $this->postJson('/api/auth/login', [
            'email' => $reporter->email,
            'password' => 'Password123',
        ])->json('data.token');

        $this->withToken($token)
            ->getJson("/api/reporter/reports/{$report->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $report->id)
            ->assertJsonPath('data.is_editable', true)
            ->assertJsonPath('data.category_label', 'Procurement fraud')
            ->assertJsonPath('data.timeline.0.headline', 'Report received');

        $this->withToken($token)
            ->patchJson("/api/reporter/reports/{$report->id}", [
                'title' => 'Updated allegation title',
                'category' => 'fraud',
                'description' => 'The reporter revised the chronology and added more contextual explanation for the suspected corruption transaction.',
                'incident_date' => now()->subDays(2)->toDateString(),
                'incident_location' => 'Finance Unit',
                'accused_party' => 'Finance Supervisor',
                'evidence_summary' => 'Updated evidence summary with invoice references and screenshots.',
                'confidentiality_level' => 'identified',
                'requested_follow_up' => false,
                'witness_available' => true,
                'governance_tags' => ['financial-loss'],
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated allegation title')
            ->assertJsonPath('data.confidentiality_level', 'identified')
            ->assertJsonPath('data.requested_follow_up', false);

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'title' => 'Updated allegation title',
            'category' => 'fraud',
            'anonymity_level' => 'identified',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'report_id' => $report->id,
            'action' => 'report_updated_by_reporter',
            'actor_role' => User::ROLE_REPORTER,
        ]);
    }

    public function test_reporter_cannot_update_completed_report(): void
    {
        $reporter = User::query()->create([
            'name' => 'Reporter Four',
            'email' => 'reporter.four@example.test',
            'phone' => '+62-812-0000-0103',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $report = $this->createReporterReport(
            $reporter,
            ['status' => 'completed'],
            ['stage' => 'completed', 'current_role' => User::ROLE_DIRECTOR]
        );

        $token = $this->postJson('/api/auth/login', [
            'email' => $reporter->email,
            'password' => 'Password123',
        ])->json('data.token');

        $this->withToken($token)
            ->patchJson("/api/reporter/reports/{$report->id}", [
                'title' => 'Completed report update attempt',
                'category' => 'fraud',
                'description' => 'This update attempt should be blocked because the report is already completed and closed.',
                'incident_date' => now()->subDays(2)->toDateString(),
                'incident_location' => 'Finance Unit',
                'accused_party' => 'Finance Supervisor',
                'evidence_summary' => 'Blocked update payload.',
                'confidentiality_level' => 'anonymous',
                'requested_follow_up' => true,
                'witness_available' => false,
                'governance_tags' => ['financial-loss'],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Completed reports can no longer be edited by the reporter.');
    }

    public function test_reporter_can_submit_report_with_multipart_attachments(): void
    {
        Storage::fake('attachments');

        User::query()->create([
            'name' => 'Verification Supervisor',
            'email' => 'supervisor.multipart@example.test',
            'phone' => '+62-812-0000-0200',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $reporter = User::query()->create([
            'name' => 'Multipart Reporter',
            'email' => 'reporter.multipart@example.test',
            'phone' => '+62-812-0000-0201',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => $reporter->email,
            'password' => 'Password123',
        ])->json('data.token');

        $response = $this->withToken($token)->post('/api/reporter/reports', [
            'title' => 'Multipart report submission with attachments',
            'category' => 'procurement',
            'description' => 'A procurement committee member requested an unofficial transfer before the vendor ranking process was finalized and supporting files are attached.',
            'confidentiality_level' => 'anonymous',
            'reported_parties' => [[
                'full_name' => 'Hendra Saptono',
                'position' => 'Procurement Committee Chair',
                'classification' => 'state_official',
            ]],
            'attachments' => [
                UploadedFile::fake()->create('procurement-brief.pdf', 64, 'application/pdf'),
                UploadedFile::fake()->image('site-photo.png')->size(256),
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Report submitted successfully.');

        $report = Report::query()->latest('id')->firstOrFail();

        $this->assertDatabaseCount('report_attachments', 2);
        Storage::disk('attachments')->assertExists("reports/{$report->uuid}/attachments");
    }

    private function createReporterReport(
        User $reporter,
        array $attributes = [],
        array $caseAttributes = [],
    ): Report {
        $report = Report::query()->create(array_merge([
            'reporter_user_id' => $reporter->id,
            'uuid' => (string) Str::uuid(),
            'public_reference' => 'WBS-2026-T' . fake()->unique()->numerify('####'),
            'tracking_token' => Str::upper(Str::random(12)),
            'title' => 'Default report title',
            'category' => 'procurement',
            'description' => 'A sufficiently detailed report description is provided so the record can be used in reporter directory tests.',
            'incident_date' => now()->subDays(5)->toDateString(),
            'incident_location' => 'Procurement Unit',
            'accused_party' => 'Procurement Officer',
            'evidence_summary' => 'Supporting evidence exists for this seeded test record.',
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

        $caseFile = CaseFile::query()->create(array_merge([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-T' . fake()->unique()->numerify('####'),
            'stage' => 'submitted',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'disposition' => 'submitted',
            'assigned_unit' => 'Verification Supervision',
            'assigned_to' => 'Verification Supervisor',
            'confidentiality_level' => 'anonymous',
            'last_activity_at' => now()->subDay(),
            'notes' => $report->description,
        ], $caseAttributes));

        CaseTimelineEvent::query()->create([
            'report_id' => $report->id,
            'case_file_id' => $caseFile->id,
            'visibility' => 'public',
            'stage' => $caseFile->stage,
            'headline' => 'Report received',
            'detail' => 'The submission entered the secure KPK whistleblowing queue and is awaiting workflow handling.',
            'actor_role' => $caseFile->current_role,
            'actor_name' => 'System',
            'occurred_at' => $report->submitted_at,
        ]);

        return $report->fresh(['caseFile', 'timelineEvents']);
    }
}
