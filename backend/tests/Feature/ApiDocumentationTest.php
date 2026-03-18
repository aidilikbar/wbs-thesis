<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiDocumentationTest extends TestCase
{
    public function test_swagger_ui_is_available(): void
    {
        $this->get('/api/documentation')
            ->assertOk()
            ->assertSee('KPK Whistleblowing System API', false);
    }

    public function test_openapi_json_describes_public_reporting_endpoint(): void
    {
        $this->artisan('l5-swagger:generate')->assertSuccessful();

        $this->getJson('/docs')
            ->assertOk()
            ->assertJsonPath('info.title', 'KPK Whistleblowing System API')
            ->assertJsonPath('paths./api/reports.post.operationId', 'submitReport');
    }
}
