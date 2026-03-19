<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Report;
use App\Models\User;
use App\Services\CaseWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ReporterReportController extends Controller
{
    #[OA\Get(
        path: '/api/reporter/reports',
        operationId: 'listReporterReports',
        summary: 'List the current reporter reports',
        description: 'Returns the authenticated reporter submissions and their current public-safe status.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Reporter reports returned.', content: new OA\JsonContent(ref: '#/components/schemas/ReporterReportListResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $this->authorizeReporter($request);

        $reports = Report::query()
            ->with('caseFile')
            ->where('reporter_user_id', $user->id)
            ->latest('submitted_at')
            ->get()
            ->map(fn (Report $report) => [
                'id' => $report->id,
                'public_reference' => $report->public_reference,
                'tracking_token' => $report->tracking_token,
                'title' => $report->title,
                'category' => $report->category,
                'status' => $report->status,
                'severity' => $report->severity,
                'submitted_at' => $report->submitted_at?->toISOString(),
                'confidentiality_level' => $report->anonymity_level,
                'case' => [
                    'case_number' => $report->caseFile?->case_number,
                    'stage' => $report->caseFile?->stage,
                    'stage_label' => config("wbs.case_stages.{$report->caseFile?->stage}", $report->caseFile?->stage),
                    'assigned_unit' => $report->caseFile?->assigned_unit,
                    'current_role' => $report->caseFile?->current_role,
                    'current_role_label' => config("wbs.roles.{$report->caseFile?->current_role}", $report->caseFile?->current_role),
                ],
            ]);

        return response()->json([
            'data' => $reports,
        ]);
    }

    #[OA\Post(
        path: '/api/reporter/reports',
        operationId: 'submitReporterReport',
        summary: 'Submit a report as an authenticated reporter',
        description: 'Creates a report from the authenticated reporter account and enters it into the KPK role-based workflow.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionRequest')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Report submitted successfully.', content: new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function store(StoreReportRequest $request, CaseWorkflowService $workflow): JsonResponse
    {
        $user = $this->authorizeReporter($request);
        $result = $workflow->submitReport($user, $request->validated());
        $report = $result['report'];
        $caseFile = $result['caseFile'];

        return response()->json([
            'message' => 'Report submitted successfully.',
            'data' => [
                'public_reference' => $report->public_reference,
                'tracking_token' => $report->tracking_token,
                'case_number' => $caseFile->case_number,
                'status' => $report->status,
                'severity' => $report->severity,
                'submitted_at' => $report->submitted_at?->toISOString(),
                'next_steps' => [
                    'Keep the reference and tracking token in a safe place.',
                    'The supervisor of verificator will receive the submission first.',
                    'Use the tracking page or your reporter account to monitor public updates.',
                ],
            ],
        ], 201);
    }

    private function authorizeReporter(Request $request): User
    {
        $user = $request->user();

        abort_unless($user?->hasRole(User::ROLE_REPORTER), 403, 'Only registered reporters may submit reports.');

        return $user;
    }
}
