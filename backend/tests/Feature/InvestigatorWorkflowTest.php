<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvestigatorWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_case_can_be_assigned_and_moved_into_investigation(): void
    {
        $this->postJson('/api/reports', [
            'title' => 'Potential bribery during permit approval',
            'category' => 'bribery',
            'description' => 'A staff member allegedly requested an unofficial payment to accelerate a permit approval and threatened to delay the file if the payment was refused.',
            'incident_date' => now()->subDays(2)->toDateString(),
            'incident_location' => 'Permit Approval Desk',
            'accused_party' => 'Permit Officer',
            'evidence_summary' => 'Messaging screenshots and approval timestamps are available.',
            'anonymity_level' => 'confidential',
            'reporter_email' => 'protected@example.test',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['leadership'],
        ])->assertCreated();

        $caseFile = CaseFile::query()->firstOrFail();

        $this->patchJson("/api/investigator/cases/{$caseFile->id}/assign", [
            'owner_name' => 'Ayu Wicaksono',
            'assigned_unit' => 'Integrity Office',
            'due_in_days' => 5,
        ])->assertOk()
            ->assertJsonPath('data.stage', 'assessment');

        $this->patchJson("/api/investigator/cases/{$caseFile->id}/status", [
            'stage' => 'investigation',
            'internal_note' => 'Preliminary corroboration complete and interviews scheduled.',
            'publish_update' => true,
            'public_message' => 'The report has progressed into formal investigation.',
            'actor_name' => 'Ayu Wicaksono',
        ])->assertOk()
            ->assertJsonPath('data.stage', 'investigation')
            ->assertJsonPath('data.status', 'investigating');

        $this->assertDatabaseHas('case_files', [
            'id' => $caseFile->id,
            'stage' => 'investigation',
            'assigned_to' => 'Ayu Wicaksono',
        ]);

        $this->assertDatabaseHas('reports', [
            'id' => $caseFile->report_id,
            'status' => 'investigating',
        ]);

        $this->assertDatabaseHas('case_timeline_events', [
            'case_file_id' => $caseFile->id,
            'visibility' => 'public',
            'headline' => 'Investigation update',
        ]);
    }
}
