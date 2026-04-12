<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\GovernanceControl;
use App\Models\Report;
use App\Models\User;
use Carbon\Carbon;
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

    public function test_system_administrator_sees_expected_governance_action_cards(): void
    {
        $systemAdministrator = $this->createUser(
            'System Administrator',
            'sysadmin@example.test',
            User::ROLE_SYSTEM_ADMINISTRATOR,
            'System Administration'
        );

        GovernanceControl::query()->create([
            'code' => 'CTRL-01',
            'name' => 'User readiness',
            'description' => 'Track internal account readiness.',
            'owner_role' => 'System Administrator',
            'status' => 'warning',
            'target_metric' => 'All internal users active',
            'current_metric' => '1 inactive account',
        ]);

        User::query()->create([
            'name' => 'Inactive Investigator',
            'email' => 'inactive.investigator@example.test',
            'phone' => '+62-812-0000-0002',
            'role' => User::ROLE_INVESTIGATOR,
            'unit' => 'Investigation Desk',
            'is_active' => false,
            'password' => 'Password123',
        ]);

        Sanctum::actingAs($systemAdministrator, [$systemAdministrator->role]);

        $response = $this->getJson('/api/governance/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.specific.role', User::ROLE_SYSTEM_ADMINISTRATOR)
            ->assertJsonPath('data.specific.action_items.0.title', 'Review control exceptions')
            ->assertJsonPath('data.specific.action_items.1.title', 'Manage inactive internal users')
            ->assertJsonPath('data.specific.action_items.2.title', 'Inspect recent audit activity')
            ->assertJsonPath('data.specific.action_items.1.href', '/admin');

        $this->assertSame([], $response->json('data.specific.scope_rows'));
    }

    public function test_auditor_sees_only_anonymized_case_monitoring_and_metadata_only_audit_logs(): void
    {
        $auditor = $this->createUser(
            'Internal Auditor',
            'auditor@example.test',
            User::ROLE_AUDITOR,
            'Internal Audit'
        );
        $supervisor = $this->createUser(
            'Supervisor Verificator',
            'supervisor.auditor@example.test',
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            'Verificator',
            'verificator.auditor@example.test',
            User::ROLE_VERIFICATOR,
            'Verification Desk'
        );
        $investigationSupervisor = $this->createUser(
            'Supervisor Investigator',
            'supervisor.investigator.auditor@example.test',
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'Investigation Supervision'
        );
        $investigator = $this->createUser(
            'Investigator',
            'investigator.auditor@example.test',
            User::ROLE_INVESTIGATOR,
            'Investigation Desk'
        );
        $director = $this->createUser(
            'Director',
            'director.auditor@example.test',
            User::ROLE_DIRECTOR,
            'Directorate of Public Reports and Complaints'
        );
        $reporter = $this->createUser(
            'Named Reporter',
            'reporter.auditor@example.test',
            User::ROLE_REPORTER,
            'Reporter'
        );

        $submittedAt = Carbon::parse('2026-04-10 08:00:00', 'UTC');
        $report = Report::query()->create([
            'uuid' => '00000000-0000-0000-0000-000000009101',
            'public_reference' => 'WBS-2026-9101',
            'tracking_token' => 'TRACK9101ABCD',
            'title' => 'Sensitive complaint title',
            'category' => 'procurement',
            'description' => 'Sensitive complaint narrative that must not be exposed to the auditor role.',
            'severity' => 'not_available',
            'status' => 'investigation_in_progress',
            'anonymity_level' => 'identified',
            'reporter_name' => 'Named Reporter',
            'reporter_email' => 'reporter.auditor@example.test',
            'reporter_phone' => '+62-812-0000-0009',
            'reporter_user_id' => $reporter->id,
            'submitted_at' => $submittedAt,
        ]);

        $caseFile = CaseFile::query()->create([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-9101',
            'stage' => 'investigation_in_progress',
            'disposition' => 'investigation_in_progress',
            'assigned_unit' => 'Investigation Desk',
            'assigned_to' => $investigator->name,
            'confidentiality_level' => 'identified',
            'current_role' => User::ROLE_INVESTIGATOR,
            'notes' => 'Internal note that must remain confidential.',
            'verification_supervisor_id' => $supervisor->id,
            'verificator_id' => $verificator->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'investigator_id' => $investigator->id,
            'director_id' => $director->id,
            'last_activity_at' => Carbon::parse('2026-04-11 13:00:00', 'UTC'),
            'completed_at' => null,
        ]);

        $this->recordAudit($report, $caseFile, 'report_submitted', User::ROLE_REPORTER, Carbon::parse('2026-04-10 08:00:00', 'UTC'));
        $this->recordAudit($report, $caseFile, 'verification_delegated', User::ROLE_SUPERVISOR_OF_VERIFICATOR, Carbon::parse('2026-04-10 09:00:00', 'UTC'));
        $this->recordAudit($report, $caseFile, 'review_delegated', User::ROLE_SUPERVISOR_OF_INVESTIGATOR, Carbon::parse('2026-04-11 08:00:00', 'UTC'));

        Sanctum::actingAs($auditor, [$auditor->role]);

        $response = $this->getJson('/api/governance/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.specific.role', User::ROLE_AUDITOR)
            ->assertJsonPath('data.specific.scope_rows', [])
            ->assertJsonPath('data.specific.case_rows.0.audit_case_id', sprintf('AUD-CASE-%04d', $caseFile->id))
            ->assertJsonPath('data.specific.case_rows.0.current_role', User::ROLE_INVESTIGATOR)
            ->assertJsonPath('data.specific.case_rows.0.assigned_unit', 'Investigation Desk')
            ->assertJsonPath('data.global.recent_audit_logs.0.actor_name', null);

        $caseRow = $response->json('data.specific.case_rows.0');
        $recentAuditLogs = collect($response->json('data.global.recent_audit_logs'));

        $this->assertArrayNotHasKey('title', $caseRow);
        $this->assertArrayNotHasKey('description', $caseRow);
        $this->assertArrayNotHasKey('reporter', $caseRow);
        $this->assertArrayNotHasKey('attachments', $caseRow);
        $this->assertArrayNotHasKey('notes', $caseRow);
        $this->assertArrayNotHasKey('assigned_to', $caseRow);

        $this->assertTrue($recentAuditLogs->every(fn (array $log) => $log['actor_name'] === null));
        $this->assertTrue($recentAuditLogs->every(fn (array $log) => ! in_array($log['actor_role'], [User::ROLE_REPORTER], true)));
        $this->assertTrue($recentAuditLogs->every(function (array $log) {
            $allowedKeys = ['case_reference', 'stage', 'status', 'assigned_role', 'assigned_unit'];

            return empty(array_diff(array_keys($log['context']), $allowedKeys));
        }));
    }

    public function test_verification_kpi_counts_only_working_hours_and_honours_holidays(): void
    {
        config()->set('wbs.operational_kpis.timezone', 'UTC');
        config()->set('wbs.operational_kpis.workday_start', '08:00');
        config()->set('wbs.operational_kpis.workday_end', '16:00');
        config()->set('wbs.operational_kpis.non_working_dates', ['2026-04-13']);

        $supervisor = $this->createUser(
            'Supervisor Verificator',
            'supervisor.kpi@example.test',
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'Verification Supervision'
        );
        $investigationSupervisor = $this->createUser(
            'Supervisor Investigator',
            'supervisor.investigator.kpi@example.test',
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'Investigation Supervision'
        );
        $director = $this->createUser(
            'Director',
            'director.kpi@example.test',
            User::ROLE_DIRECTOR,
            'Directorate of Public Reports and Complaints'
        );

        $submittedAt = Carbon::parse('2026-04-10 15:00:00', 'UTC');
        $report = Report::query()->create([
            'uuid' => '00000000-0000-0000-0000-000000009001',
            'public_reference' => 'WBS-2026-9001',
            'tracking_token' => 'TRACK9001TOKN',
            'title' => 'Working-hour KPI check',
            'category' => 'procurement',
            'description' => 'Verification KPI should exclude weekends and configured holidays.',
            'severity' => 'not_available',
            'status' => 'submitted',
            'anonymity_level' => 'anonymous',
            'submitted_at' => $submittedAt,
        ]);

        CaseFile::query()->create([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-9001',
            'stage' => 'submitted',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'assigned_unit' => 'Verification Supervision',
            'verification_supervisor_id' => $supervisor->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'director_id' => $director->id,
            'last_activity_at' => $submittedAt,
            'completed_at' => null,
        ]);

        try {
            Carbon::setTestNow(Carbon::parse('2026-04-14 10:00:00', 'UTC'));
            Sanctum::actingAs($supervisor, [$supervisor->role]);

            $response = $this->getJson('/api/governance/dashboard');

            $response->assertOk()
                ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.label', 'Verification Time')
                ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.focus_elapsed_working_hours', 3)
                ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.substeps.0.label', 'Screening / Delegation')
                ->assertJsonPath('data.specific.scope_rows.0.verification_kpi.substeps.0.tone', 'critical')
                ->assertJsonPath('data.specific.scope_rows.0.investigation_kpi', null);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_overdue_case_metric_uses_operational_kpi_calculation_instead_of_sla_due_at(): void
    {
        config()->set('wbs.operational_kpis.timezone', 'UTC');
        config()->set('wbs.operational_kpis.workday_start', '08:00');
        config()->set('wbs.operational_kpis.workday_end', '16:00');
        config()->set('wbs.operational_kpis.non_working_dates', []);

        $director = $this->createUser(
            'Director',
            'director.overdue@example.test',
            User::ROLE_DIRECTOR,
            'Directorate of Public Reports and Complaints'
        );
        $supervisor = $this->createUser(
            'Supervisor Verificator',
            'supervisor.overdue@example.test',
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'Verification Supervision'
        );
        $verificator = $this->createUser(
            'Verificator',
            'verificator.overdue@example.test',
            User::ROLE_VERIFICATOR,
            'Verification Desk'
        );
        $investigationSupervisor = $this->createUser(
            'Supervisor Investigator',
            'supervisor.investigator.overdue@example.test',
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            'Investigation Supervision'
        );
        $investigator = $this->createUser(
            'Investigator',
            'investigator.overdue@example.test',
            User::ROLE_INVESTIGATOR,
            'Investigation Desk'
        );

        $report = $this->createReport('Overdue operational KPI case');
        $caseFile = CaseFile::query()->create([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-9101',
            'stage' => 'director_review',
            'current_role' => User::ROLE_DIRECTOR,
            'assigned_unit' => 'Directorate of Public Reports and Complaints',
            'verification_supervisor_id' => $supervisor->id,
            'verificator_id' => $verificator->id,
            'investigation_supervisor_id' => $investigationSupervisor->id,
            'investigator_id' => $investigator->id,
            'director_id' => $director->id,
            'verification_payload' => ['recommendation' => 'review'],
            'sla_due_at' => now()->addDays(30),
            'last_activity_at' => Carbon::parse('2026-04-09 09:00:00', 'UTC'),
            'completed_at' => null,
        ]);

        $this->recordAudit($report, $caseFile, 'verification_approved', User::ROLE_SUPERVISOR_OF_VERIFICATOR, Carbon::parse('2026-04-06 08:00:00', 'UTC'));
        $this->recordAudit($report, $caseFile, 'review_delegated', User::ROLE_SUPERVISOR_OF_INVESTIGATOR, Carbon::parse('2026-04-06 09:00:00', 'UTC'));
        $this->recordAudit($report, $caseFile, 'review_submitted', User::ROLE_INVESTIGATOR, Carbon::parse('2026-04-08 09:00:00', 'UTC'));
        $this->recordAudit($report, $caseFile, 'review_approved', User::ROLE_SUPERVISOR_OF_INVESTIGATOR, Carbon::parse('2026-04-09 09:00:00', 'UTC'));

        try {
            Carbon::setTestNow(Carbon::parse('2026-04-15 10:00:00', 'UTC'));
            Sanctum::actingAs($director, [$director->role]);

            $response = $this->getJson('/api/governance/dashboard');

            $response->assertOk()
                ->assertJsonPath('data.global.metrics.2.label', 'Overdue cases')
                ->assertJsonPath('data.global.metrics.2.value', 1)
                ->assertJsonPath('data.specific.action_items.1.title', 'Review overdue operational cases')
                ->assertJsonPath('data.specific.action_items.1.count', 1)
                ->assertJsonPath('data.specific.scope_rows.0.investigation_kpi.overdue_case_count', 1);
        } finally {
            Carbon::setTestNow();
        }
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

    private function recordAudit(
        Report $report,
        CaseFile $caseFile,
        string $action,
        string $actorRole,
        Carbon $happenedAt,
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
