<?php

namespace Tests\Feature;

use App\Models\CaseFile;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_administrator_can_create_internal_users(): void
    {
        $administrator = User::query()->create([
            'name' => 'System Administrator',
            'email' => 'sysadmin@example.test',
            'phone' => '+62-812-0000-0001',
            'role' => User::ROLE_SYSTEM_ADMINISTRATOR,
            'unit' => 'System Administration',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        Sanctum::actingAs($administrator, [$administrator->role]);

        $this->postJson('/api/admin/users', [
            'name' => 'Supervisor Verificator',
            'email' => 'supervisor.verificator@example.test',
            'phone' => '+62-812-0000-0002',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ])->assertCreated()
            ->assertJsonPath('data.role', User::ROLE_SUPERVISOR_OF_VERIFICATOR);

        $this->assertDatabaseHas('users', [
            'email' => 'supervisor.verificator@example.test',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
        ]);
    }

    public function test_system_administrator_can_list_users_with_pagination(): void
    {
        $administrator = $this->createAdministrator();

        User::factory()->count(10)->create([
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
        ]);

        Sanctum::actingAs($administrator, [$administrator->role]);

        $this->getJson('/api/admin/users?per_page=5')
            ->assertOk()
            ->assertJsonPath('data.meta.per_page', 5)
            ->assertJsonPath('data.meta.current_page', 1)
            ->assertJsonCount(5, 'data.items');
    }

    public function test_system_administrator_can_update_and_deactivate_user(): void
    {
        $administrator = $this->createAdministrator();
        $target = User::query()->create([
            'name' => 'Investigator One',
            'email' => 'investigator.one@example.test',
            'phone' => '+62-812-0000-0003',
            'role' => User::ROLE_INVESTIGATOR,
            'unit' => 'Investigation Desk',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        Sanctum::actingAs($administrator, [$administrator->role]);

        $this->patchJson("/api/admin/users/{$target->id}", [
            'name' => 'Investigator One Updated',
            'email' => 'investigator.one.updated@example.test',
            'phone' => '+62-812-0000-0099',
            'unit' => 'Special Investigation Desk',
            'is_active' => true,
            'password' => 'Updated123',
            'password_confirmation' => 'Updated123',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Investigator One Updated')
            ->assertJsonPath('data.unit', 'Special Investigation Desk');

        $this->patchJson("/api/admin/users/{$target->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'email' => 'investigator.one.updated@example.test',
            'is_active' => false,
        ]);
    }

    public function test_system_administrator_can_delete_user_without_active_workflow_assignments(): void
    {
        $administrator = $this->createAdministrator();
        $reporter = User::query()->create([
            'name' => 'Reporter To Delete',
            'email' => 'reporter.delete@example.test',
            'phone' => '+62-812-0000-0004',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        Sanctum::actingAs($administrator, [$administrator->role]);

        $this->deleteJson("/api/admin/users/{$reporter->id}")
            ->assertOk()
            ->assertJsonPath('message', 'User deleted successfully.');

        $this->assertDatabaseMissing('users', [
            'id' => $reporter->id,
        ]);
    }

    public function test_system_administrator_cannot_delete_user_with_active_workflow_assignments(): void
    {
        $administrator = $this->createAdministrator();
        $supervisor = User::query()->create([
            'name' => 'Verification Supervisor',
            'email' => 'supervisor.active@example.test',
            'phone' => '+62-812-0000-0005',
            'role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'unit' => 'Verification Supervision',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $report = Report::query()->create([
            'uuid' => '11111111-1111-1111-1111-111111111111',
            'public_reference' => 'WBS-2026-9001',
            'tracking_token' => 'TOKEN9001ABCD',
            'title' => 'Active case',
            'category' => 'procurement',
            'description' => 'Active workflow assignment test.',
            'severity' => 'high',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        CaseFile::query()->create([
            'report_id' => $report->id,
            'case_number' => 'CASE-2026-9001',
            'stage' => 'submitted',
            'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            'assigned_to' => $supervisor->name,
            'assigned_unit' => $supervisor->unit,
            'verification_supervisor_id' => $supervisor->id,
            'confidentiality_level' => 'confidential',
        ]);

        Sanctum::actingAs($administrator, [$administrator->role]);

        $this->deleteJson("/api/admin/users/{$supervisor->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'User is assigned to active workflow cases. Reassign or complete those cases before deletion.');
    }

    private function createAdministrator(): User
    {
        return User::query()->create([
            'name' => 'System Administrator',
            'email' => 'sysadmin@example.test',
            'phone' => '+62-812-0000-0001',
            'role' => User::ROLE_SYSTEM_ADMINISTRATOR,
            'unit' => 'System Administration',
            'is_active' => true,
            'password' => 'Password123',
        ]);
    }
}
