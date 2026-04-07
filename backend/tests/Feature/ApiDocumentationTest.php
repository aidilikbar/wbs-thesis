<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiDocumentationTest extends TestCase
{
    public function test_swagger_ui_is_available(): void
    {
        $this->get('/api/documentation')
            ->assertOk()
            ->assertSee('KPK Whistleblowing System API', false)
            ->assertSee('url: "/docs"', false)
            ->assertDontSee('/docs?api-docs.json', false);
    }

    public function test_openapi_json_describes_authenticated_reporter_and_workflow_endpoints(): void
    {
        $this->artisan('l5-swagger:generate')->assertSuccessful();

        $this->getJson('/docs')
            ->assertOk()
            ->assertJsonPath('info.title', 'KPK Whistleblowing System API')
            ->assertJsonPath('servers.0.url', '/')
            ->assertJsonPath('paths./api/auth/register.post.operationId', 'registerReporter')
            ->assertJsonPath('paths./api/reporter/reports.post.operationId', 'submitReporterReport')
            ->assertJsonPath('paths./api/workflow/cases.get.operationId', 'listWorkflowCases');
    }
}
