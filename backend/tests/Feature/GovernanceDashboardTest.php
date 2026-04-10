<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\GovernanceControl;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GovernanceDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_of_verificator_sees_own_and_verificator_scope_data(): void
    {
        $supervisor = $this->createUser(
            'Supervisor Verificator',
            'supervisor.verificator@example.test',
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'Verification Supervision'
        );
        $verificatorOne = $this->createUser(
            'Verificator One',
            'verificator.one@example.test',
            User::ROLE_VERIFICATOR,
            'Verification Desk'
        );
        $verificatorTwo = $this->createUser(
            'Verificator Two',
            'verificator.two@example.test',
            User::ROLE_VERIFICATOR,
            'Verification Desk'
        );
        $investigationSupervisor = $this->createUser(
            'Supervisor Investigator',
            'supervisor.investigator@example.test',
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'Investigation Supervision'
        );
        $director = $this->createUser(
            'Director',
            'director@example.test',
            User::ROLE_DIRECTOR,
            'Directorate of Public Reports and Complaints'
        );

        GovernanceControl::query()->create([
            'code' => 'SLA-01',
            'name' => 'Workflow timeliness',
            'description' => 'Monitor case timeliness.',
            'owner_role' => 'Supervisor of Verificator',
            'status' => 'warning',
            'target_metric' => 'Under 72 hours',
            'current_metric' => '96 hours',
        ]);

        $reportOne = $this->createReport('Submitted report');
        $reportTwo = $this->createReport('Verification review report');
        $reportThree = $this->createReport('Assigned verification report');

        CaseFile::query()->create([
            'report_id' => $reportOne->id,
            'case_number' => 'CASE-2026-7001',
            'stage' => 'submitted',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'assigned_unit' => 'Verification Supervision',
            'verification_supervisor_id' => $supervisor->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'director_id' => $director->id,
            'sla_due_at' => now()->addDay(),
            'last_activity_at' => now()->subHour(),
            'completed_at' => null,
        ]);

        CaseFile::query()->create([
            'report_id' => $reportTwo->id,
            'case_number' => 'CASE-2026-7002',
            'stage' => 'verification_review',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'assigned_unit' => 'Verification Supervision',
            'verification_supervisor_id' => $supervisor->id,
            'verificator_id' => $verificatorOne->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'director_id' => $director->id,
            'sla_due_at' => now()->addDay(),
            'last_activity_at' => now()->subMinutes(30),
            'completed_at' => null,
        ]);

        CaseFile::query()->create([
            'report_id' => $reportThree->id,
            'case_number' => 'CASE-2026-7003',
            'stage' => 'verification_in_progress',
            'current_role' => User::ROLE_VERIFICATOR,
            'assigned_unit' => 'Verification Desk',
            'verification_supervisor_id' => $supervisor->id,
            'verificator_id' => $verificatorTwo->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'director_id' => $director->id,
            'sla_due_at' => now()->subDay(),
            'last_activity_at' => now()->subMinutes(20),
            'completed_at' => null,
        ]);

        Sanctum::actingAs($supervisor, [$supervisor->role]);

        $response = $this->getJson('/api/governance/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.specific.role', User::ROLE_SUPERVISOR_OF_VERIFICATOR)
            ->assertJsonPath('data.specific.scope_rows.0.is_self', true)
            ->assertJsonCount(3, 'data.specific.scope_rows')
            ->assertJsonPath('data.specific.scope_rows.1.role', User::ROLE_VERIFICATOR)
            ->assertJsonPath('data.specific.scope_rows.2.role', User::ROLE_VERIFICATOR);

        $scopeRows = collect($response->json('data.specific.scope_rows'));

        $this->assertSame(1, $scopeRows->firstWhere('is_self', true)['pending_queue']);
        $this->assertSame(1, $scopeRows->firstWhere('is_self', true)['pending_approvals']);
        $this->assertSame(1, $scopeRows->firstWhere('subject_label', 'Verificator Two')['pending_queue']);
    }

    public function test_director_sees_global_data_and_all_internal_scope_rows(): void
    {
        $director = $this->createUser(
            'Director',
            'director@example.test',
            User::ROLE_DIRECTOR,
            'Directorate of Public Reports and Complaints'
        );
        $supervisor = $this->createUser(
            'Supervisor Verificator',
            'supervisor.verificator@example.test',
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            'Verificator',
            'verificator@example.test',
            User::ROLE_VERIFICATOR,
            'Verification Desk'
        );
        $systemAdministrator = $this->createUser(
            'System Administrator',
            'sysadmin@example.test',
            User::ROLE_SYSTEM_ADMINISTRATOR,
            'System Administration'
        );

        $report = $this->createReport('Director review case');

        CaseFile::query()->create([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-7101',
            'stage' => 'director_review',
            'current_role' => User::ROLE_DIRECTOR,
            'assigned_unit' => 'Directorate of Public Reports and Complaints',
            'verification_supervisor_id' => $supervisor->id,
            'verificator_id' => $verificator->id,
            'director_id' => $director->id,
            'sla_due_at' => now()->addDay(),
            'last_activity_at' => now()->subMinutes(10),
            'completed_at' => null,
        ]);

        Sanctum::actingAs($director, [$director->role]);

        $response = $this->getJson('/api/governance/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.global.metrics.0.label', 'Reports received')
            ->assertJsonPath('data.specific.role', User::ROLE_DIRECTOR)
            ->assertJsonPath('data.specific.scope_rows.0.role', User::ROLE_DIRECTOR)
            ->assertJsonCount(4, 'data.specific.scope_rows');

        $scopeRoles = collect($response->json('data.specific.scope_rows'))->pluck('role');

        $this->assertTrue($scopeRoles->contains(User::ROLE_SUPERVISOR_OF_VERIFICATOR));
        $this->assertTrue($scopeRoles->contains(User::ROLE_VERIFICATOR));
        $this->assertTrue($scopeRoles->contains(User::ROLE_SYSTEM_ADMINISTRATOR));
        $this->assertTrue($scopeRoles->contains(User::ROLE_DIRECTOR));
    }

    private function createUser(string $name, string $email, string $role, string $unit): User
    {
        return User::query()->create([
            'name' => $name,
            'email' => $email,
            'phone' => '+62-812-0000-0001',
            'role' => $role,
            'unit' => $unit,
            'is_active' => true,
            'password' => 'Password123',
        ]);
    }

    private function createReport(string $title): Report
    {
        static $sequence = 7001;

        $report = Report::query()->create([
            'uuid' => sprintf('00000000-0000-0000-0000-%012d', $sequence),
            'public_reference' => sprintf('WBS-2026-%04d', $sequence),
            'tracking_token' => sprintf('TOKEN%04dABCD', $sequence),
            'title' => $title,
            'category' => 'procurement',
            'description' => 'Governance dashboard test case.',
            'severity' => 'high',
            'status' => 'submitted',
            'anonymity_level' => 'anonymous',
            'submitted_at' => now()->subDays(2),
        ]);

        $sequence++;

        return $report;
    }
}
