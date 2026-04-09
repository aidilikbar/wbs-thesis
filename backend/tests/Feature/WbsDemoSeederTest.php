<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use Database\Seeders\WbsDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WbsDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seeder_pins_ai_agent_regression_cases_to_expected_state(): void
    {
        $this->seed(WbsDemoSeeder::class);

        $expectations = [
            'CASE-2026-0002' => [
                'stage' => 'verification_review',
                'current_role' => 'supervisor_of_verificator',
                'title' => 'Possible conflict of interest in evaluation panel',
                'reporter_email' => 'reporter.2@example.test',
                'verificator_email' => 'verificator.1@kpk-wbs.test',
            ],
            'CASE-2026-0006' => [
                'stage' => 'verification_in_progress',
                'current_role' => 'verificator',
                'title' => 'Unofficial donation request tied to access to public service queue',
                'reporter_email' => 'reporter.1@example.test',
                'verificator_email' => 'verificator.2@kpk-wbs.test',
            ],
            'CASE-2026-0009' => [
                'stage' => 'investigation_review',
                'current_role' => 'supervisor_of_investigator',
                'title' => 'Performance score reduced after reporting irregular procurement communication',
                'reporter_email' => 'reporter.1@example.test',
                'investigator_email' => 'investigator.1@kpk-wbs.test',
            ],
            'CASE-2026-0011' => [
                'stage' => 'investigation_in_progress',
                'current_role' => 'investigator',
                'title' => 'Threat of reassignment after staff questioned travel expense claims',
                'reporter_email' => 'reporter.1@example.test',
                'investigator_email' => 'investigator.2@kpk-wbs.test',
            ],
            'CASE-2026-0016' => [
                'stage' => 'director_review',
                'current_role' => 'director',
                'title' => 'Performance score reduced after reporting irregular procurement communication',
                'reporter_email' => 'reporter.2@example.test',
                'investigator_email' => 'investigator.2@kpk-wbs.test',
            ],
            'CASE-2026-0020' => [
                'stage' => 'verification_in_progress',
                'current_role' => 'verificator',
                'title' => 'Meeting minutes altered after objection was formally recorded',
                'reporter_email' => 'reporter.2@example.test',
                'verificator_email' => 'verificator.1@kpk-wbs.test',
            ],
        ];

        foreach ($expectations as $caseNumber => $expected) {
            $caseFile = CaseFile::query()
                ->with(['report.reporter', 'verificator', 'investigator'])
                ->where('case_number', $caseNumber)
                ->firstOrFail();

            $this->assertSame($expected['stage'], $caseFile->stage, "{$caseNumber} stage mismatch.");
            $this->assertSame($expected['current_role'], $caseFile->current_role, "{$caseNumber} role mismatch.");
            $this->assertSame($expected['title'], $caseFile->report?->title, "{$caseNumber} title mismatch.");
            $this->assertSame($expected['reporter_email'], $caseFile->report?->reporter?->email, "{$caseNumber} reporter mismatch.");

            if (isset($expected['verificator_email'])) {
                $this->assertSame($expected['verificator_email'], $caseFile->verificator?->email, "{$caseNumber} verificator mismatch.");
            }

            if (isset($expected['investigator_email'])) {
                $this->assertSame($expected['investigator_email'], $caseFile->investigator?->email, "{$caseNumber} investigator mismatch.");
            }
        }
    }
}
