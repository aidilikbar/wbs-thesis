<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            'confidentiality_level' => 'confidential',
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
            'confidentiality_level' => 'confidential',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement', 'financial-loss'],
        ]);

        $submission
            ->assertCreated()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.severity', 'high');

        $this->assertDatabaseHas('reports', [
            'title' => 'Unusual payment request before vendor evaluation',
            'reporter_email' => 'reporter@example.test',
            'anonymity_level' => 'confidential',
            'status' => 'submitted',
        ]);

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
}
