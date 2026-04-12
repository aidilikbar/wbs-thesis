<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
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
        $this->artisan('openapi:sync-server-url')->assertSuccessful();

        $path = storage_path('api-docs/api-docs.json');
        $this->assertTrue(File::exists($path));

        $openApi = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame('KPK Whistleblowing System API', $openApi['info']['title']);
        $this->assertSame('0.2.2', $openApi['info']['version']);
        $this->assertSame(rtrim((string) config('app.url'), '/'), $openApi['servers'][0]['url']);
        $this->assertSame('registerReporter', $openApi['paths']['/api/auth/register']['post']['operationId']);
        $this->assertSame('submitReporterReport', $openApi['paths']['/api/reporter/reports']['post']['operationId']);
        $this->assertSame('listWorkflowCases', $openApi['paths']['/api/workflow/cases']['get']['operationId']);
        $this->assertSame('exportWorkflowCasePdf', $openApi['paths']['/api/workflow/cases/{caseFile}/export-pdf']['get']['operationId']);
        $this->assertSame('listReporterCaseMessages', $openApi['paths']['/api/reporter/reports/{report}/messages']['get']['operationId']);
        $this->assertSame('listWorkflowCaseMessages', $openApi['paths']['/api/workflow/cases/{caseFile}/messages']['get']['operationId']);
        $this->assertSame('getOperationalKpiSettings', $openApi['paths']['/api/admin/settings/operational-kpis']['get']['operationId']);
        $this->assertSame('updateOperationalKpiSettings', $openApi['paths']['/api/admin/settings/operational-kpis']['patch']['operationId']);
        $this->assertArrayHasKey('reported_parties', $openApi['components']['schemas']['ReportSubmissionRequest']['properties']);
        $this->assertArrayHasKey('OperationalKpiSettings', $openApi['components']['schemas']);
        $this->assertArrayHasKey('weekend_days', $openApi['components']['schemas']['OperationalKpiSettings']['properties']);
        $this->assertArrayHasKey('GovernancePhaseKpiSummary', $openApi['components']['schemas']);
        $this->assertArrayHasKey('verification_kpi', $openApi['components']['schemas']['GovernanceScopeRow']['properties']);
        $this->assertArrayHasKey('GovernanceAuditorCaseRow', $openApi['components']['schemas']);
        $this->assertArrayHasKey('case_rows', $openApi['components']['schemas']['GovernanceDashboardSpecific']['properties']);
        $this->assertArrayNotHasKey('publish_update', $openApi['components']['schemas']['VerificationSubmissionRequest']['properties']);
        $this->assertArrayNotHasKey('public_message', $openApi['components']['schemas']['ReviewWorkflowStageRequest']['properties']);
    }
}
