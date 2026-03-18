<?php

namespace Tests\Feature;

use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_report_submission_creates_case_timeline_and_audit_trail(): void
    {
        $response = $this->postJson('/api/reports', [
            'title' => 'Unusual payment request before vendor evaluation',
            'category' => 'procurement',
            'description' => 'A procurement officer requested a personal transfer before confirming that a vendor submission would move to the next review stage.',
            'incident_date' => now()->subDay()->toDateString(),
            'incident_location' => 'Procurement Unit',
            'accused_party' => 'Procurement Officer',
            'evidence_summary' => 'Email excerpts and witness details can be provided on request.',
            'anonymity_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement', 'financial-loss'],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.severity', 'high');

        $report = Report::query()->firstOrFail();

        $this->assertNotNull($report->public_reference);
        $this->assertNotNull($report->tracking_token);

        $this->assertDatabaseHas('case_files', [
            'report_id' => $report->id,
            'stage' => 'intake',
            'assigned_unit' => 'Intake & Assessment',
        ]);

        $this->assertDatabaseHas('case_timeline_events', [
            'report_id' => $report->id,
            'visibility' => 'public',
            'headline' => 'Report received',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'report_id' => $report->id,
            'action' => 'report_submitted',
        ]);
    }
}
