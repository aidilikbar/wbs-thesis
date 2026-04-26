<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEndpointRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited(): void
    {
        User::query()->create([
            'name' => 'Reporter Rate Limit',
            'email' => 'rate.limit@example.test',
            'phone' => '+62-812-0000-0900',
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => 'Password123',
        ]);

        $client = $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.40',
        ]);

        foreach (range(1, 5) as $_) {
            $client->postJson('/api/auth/login', [
                'email' => 'rate.limit@example.test',
                'password' => 'WrongPassword123',
            ])->assertStatus(422);
        }

        $client->postJson('/api/auth/login', [
            'email' => 'rate.limit@example.test',
            'password' => 'WrongPassword123',
        ])->assertStatus(429);
    }

    public function test_tracking_is_rate_limited(): void
    {
        $client = $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.41',
        ]);

        foreach (range(1, 15) as $_) {
            $client->postJson('/api/tracking', [
                'reference' => 'WBS-2026-9999',
                'token' => 'INVALIDTRACK1',
            ])->assertStatus(404);
        }

        $client->postJson('/api/tracking', [
            'reference' => 'WBS-2026-9999',
            'token' => 'INVALIDTRACK1',
        ])->assertStatus(429);
    }
}
