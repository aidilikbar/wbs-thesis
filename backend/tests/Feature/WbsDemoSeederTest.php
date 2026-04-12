<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\Report;
use App\Models\User;
use Database\Seeders\WbsDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WbsDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seeder_keeps_only_original_accounts_and_core_cases(): void
    {
        $this->seed(WbsDemoSeeder::class);

        $expectedEmails = [
            'auditor@kpk-wbs.test',
            'director@kpk-wbs.test',
            'investigator.1@kpk-wbs.test',
            'investigator.2@kpk-wbs.test',
            'reporter.1@example.test',
            'reporter.2@example.test',
            'reporter.3@example.test',
            'reporter.4@example.test',
            'supervisor.investigator@kpk-wbs.test',
            'supervisor.verificator@kpk-wbs.test',
            'sysadmin@kpk-wbs.test',
            'verificator.1@kpk-wbs.test',
            'verificator.2@kpk-wbs.test',
        ];

        $this->assertSame($expectedEmails, User::query()->orderBy('email')->pluck('email')->all());
        $this->assertSame(13, User::query()->count());
        $this->assertSame(4, Report::query()->count());
        $this->assertSame(4, CaseFile::query()->count());

        $this->assertDatabaseMissing('users', [
            'email' => 'enterprise.user.01@kpk-wbs.test',
        ]);

        $titles = Report::query()->orderBy('id')->pluck('title')->all();

        $this->assertSame([
            'Request for unofficial payment before vendor evaluation',
            'Possible conflict of interest in evaluation panel',
            'Repeated duplicate reimbursement patterns in finance unit',
            'Retaliation threats after reporting travel expense manipulation',
        ], $titles);

        $stages = CaseFile::query()->orderBy('id')->pluck('stage')->all();

        $this->assertSame([
            'submitted',
            'verification_review',
            'investigation_in_progress',
            'completed',
        ], $stages);
    }
}
