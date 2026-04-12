<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\Report;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOperationalKpiSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_administrator_can_fetch_default_operational_kpi_settings(): void
    {
        config()->set('wbs.operational_kpis.timezone', 'Asia/Jakarta');
        config()->set('wbs.operational_kpis.workday_start', '08:00');
        config()->set('wbs.operational_kpis.workday_end', '16:00');
        config()->set('wbs.operational_kpis.weekend_days', [6, 7]);
        config()->set('wbs.operational_kpis.non_working_dates', ['2026-04-03']);

        $administrator = $this->createAdministrator();

        Sanctum::actingAs($administrator, [$administrator->role]);

        $this->getJson('/api/admin/settings/operational-kpis')
            ->assertOk()
            ->assertJsonPath('data.timezone', 'Asia/Jakarta')
            ->assertJsonPath('data.workday_start', '08:00')
            ->assertJsonPath('data.workday_end', '16:00')
            ->assertJsonPath('data.weekend_days.0', 6)
            ->assertJsonPath('data.weekend_days.1', 7)
            ->assertJsonPath('data.non_working_dates.0', '2026-04-03')
            ->assertJsonPath('data.verification_total_hours', 8)
            ->assertJsonPath('data.investigation_total_hours', 40)
            ->assertJsonPath('data.updated_at', null)
            ->assertJsonPath('data.updated_by_name', null);
    }

    public function test_system_administrator_can_update_operational_kpi_settings(): void
    {
        $administrator = $this->createAdministrator();

        Sanctum::actingAs($administrator, [$administrator->role]);

        $payload = [
            'timezone' => 'Asia/Jakarta',
            'workday_start' => '07:30',
            'workday_end' => '15:30',
            'weekend_days' => [6, 7],
            'non_working_dates' => ['2026-05-01', '2026-05-14'],
            'verification_screening_hours' => 0.5,
            'verification_work_hours' => 4.5,
            'verification_approval_hours' => 1.5,
            'investigation_delegation_hours' => 3,
            'investigation_work_hours' => 24,
            'investigation_approval_hours' => 5,
            'director_approval_hours' => 6,
        ];

        $this->patchJson('/api/admin/settings/operational-kpis', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Operational KPI settings updated successfully.')
            ->assertJsonPath('data.workday_start', '07:30')
            ->assertJsonPath('data.workday_end', '15:30')
            ->assertJsonPath('data.non_working_dates.0', '2026-05-01')
            ->assertJsonPath('data.verification_total_hours', 6.5)
            ->assertJsonPath('data.investigation_total_hours', 38)
            ->assertJsonPath('data.updated_by_name', 'System Administrator');

        $this->assertDatabaseHas('system_settings', [
            'key' => 'operational_kpis',
            'updated_by_user_id' => $administrator->id,
        ]);

        /** @var SystemSetting $record */
        $record = SystemSetting::query()->where('key', 'operational_kpis')->firstOrFail();

        $this->assertSame([6, 7], $record->value['weekend_days']);
        $this->assertEquals(24.0, $record->value['investigation_work_hours']);
    }

    public function test_non_admin_cannot_manage_operational_kpi_settings(): void
    {
        $investigator = User::query()->create([
            'name' => 'Investigator',
            'email' => 'investigator.settings@example.test',
            'phone' => '+62-812-0000-0011',
            'role' => User::ROLE_INVESTIGATOR,
            'unit' => 'Investigation Desk',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        Sanctum::actingAs($investigator, [$investigator->role]);

        $this->getJson('/api/admin/settings/operational-kpis')->assertForbidden();
        $this->patchJson('/api/admin/settings/operational-kpis', [
            'workday_start' => '08:00',
            'workday_end' => '16:00',
            'verification_screening_hours' => 1,
            'verification_work_hours' => 5,
            'verification_approval_hours' => 2,
            'investigation_delegation_hours' => 4,
            'investigation_work_hours' => 28,
            'investigation_approval_hours' => 4,
            'director_approval_hours' => 4,
        ])->assertForbidden();
    }

    public function test_governance_dashboard_uses_persisted_operational_kpi_settings(): void
    {
        $administrator = $this->createAdministrator();
        $verificationSupervisor = User::query()->create([
            'name' => 'Verification Supervisor',
            'email' => 'verification.supervisor.settings@example.test',
            'phone' => '+62-812-0000-0012',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
            'is_active' => true,
            'password' => 'Password123',
        ]);
        $investigationSupervisor = User::query()->create([
            'name' => 'Investigation Supervisor',
            'email' => 'investigation.supervisor.settings@example.test',
            'phone' => '+62-812-0000-0013',
            'role' => User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'unit' => 'Investigation Supervision',
            'is_active' => true,
            'password' => 'Password123',
        ]);
        $director = User::query()->create([
            'name' => 'Director',
            'email' => 'director.settings@example.test',
            'phone' => '+62-812-0000-0014',
            'role' => User::ROLE_DIRECTOR,
            'unit' => 'Directorate of Public Reports and Complaints',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        Sanctum::actingAs($administrator, [$administrator->role]);
        $this->patchJson('/api/admin/settings/operational-kpis', [
            'timezone' => 'UTC',
            'workday_start' => '08:00',
            'workday_end' => '16:00',
            'weekend_days' => [6, 7],
            'non_working_dates' => [],
            'verification_screening_hours' => 0.5,
            'verification_work_hours' => 2,
            'verification_approval_hours' => 1,
            'investigation_delegation_hours' => 3,
            'investigation_work_hours' => 20,
            'investigation_approval_hours' => 5,
            'director_approval_hours' => 4,
        ])->assertOk();

        $report = Report::query()->create([
            'uuid' => '00000000-0000-0000-0000-000000009301',
            'public_reference' => 'WBS-2026-9301',
            'tracking_token' => 'TRACK9301TOKN',
            'title' => 'Persisted KPI budget case',
            'category' => 'procurement',
            'description' => 'Dashboard should use persisted KPI settings.',
            'severity' => 'not_available',
            'status' => 'submitted',
            'anonymity_level' => 'anonymous',
            'submitted_at' => now()->subDay()->setTime(8, 0),
        ]);

        $caseFile = CaseFile::query()->create([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-9301',
            'stage' => 'completed',
            'current_role' => User::ROLE_DIRECTOR,
            'assigned_unit' => 'Verification Supervision',
            'verification_supervisor_id' => $verificationSupervisor->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'director_id' => $director->id,
            'last_activity_at' => now()->subHours(20),
            'completed_at' => now()->subHours(20),
        ]);

        $this->recordAudit($report, $caseFile, 'verification_delegated', User::ROLE_SUPERVISOR_OF_VERIFICATOR, now()->subDay()->setTime(8, 30));
        $this->recordAudit($report, $caseFile, 'verification_submitted', User::ROLE_VERIFICATOR, now()->subDay()->setTime(10, 30));
        $this->recordAudit($report, $caseFile, 'verification_approved', User::ROLE_SUPERVISOR_OF_VERIFICATOR, now()->subDay()->setTime(11, 30));

        Sanctum::actingAs($verificationSupervisor, [$verificationSupervisor->role]);

        $response = $this->getJson('/api/governance/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.budget_hours', 3.5)
            ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.substeps.0.budget_hours', 0.5)
            ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.substeps.1.budget_hours', 2)
            ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.substeps.2.budget_hours', 1);
    }

    private function createAdministrator(): User
    {
        return User::query()->create([
            'name' => 'System Administrator',
            'email' => 'sysadmin.settings@example.test',
            'phone' => '+62-812-0000-0001',
            'role' => User::ROLE_SYSTEM_ADMINISTRATOR,
            'unit' => 'System Administration',
            'is_active' => true,
            'password' => 'Password123',
        ]);
    }

    private function recordAudit(
        Report $report,
        CaseFile $caseFile,
        string $action,
        string $actorRole,
        \Carbon\Carbon $happenedAt,
    ): void {
        AuditLog::query()->create([
            'auditable_type' => CaseFile::class,
            'auditable_id' => $caseFile->id,
            'report_id' => $report->id,
            'case_file_id' => $caseFile->id,
            'actor_role' => $actorRole,
            'actor_name' => 'Test Actor',
            'action' => $action,
            'context' => [],
            'happened_at' => $happenedAt,
        ]);
    }
}
