<?php

namespace Tests\Feature;

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
}
