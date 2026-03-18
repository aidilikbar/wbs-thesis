<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignCaseRequest;
use App\Http\Requests\UpdateCaseStatusRequest;
use App\Models\CaseFile;
use App\Services\CaseWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class InvestigatorCaseController extends Controller
{
    #[OA\Get(
        path: '/api/investigator/cases',
        operationId: 'listInvestigatorCases',
        summary: 'List investigator cases',
        description: 'Returns the investigator work queue with optional filters for case stage and report severity.',
        tags: ['Investigator Portal'],
        parameters: [
            new OA\QueryParameter(
                name: 'stage',
                description: 'Optional filter by current case stage.',
                required: false,
                schema: new OA\Schema(
                    type: 'string',
                    enum: ['intake', 'assessment', 'investigation', 'escalated', 'resolved', 'closed']
                )
            ),
            new OA\QueryParameter(
                name: 'severity',
                description: 'Optional filter by report severity.',
                required: false,
                schema: new OA\Schema(
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical']
                )
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Case list returned successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/InvestigatorCaseListResponse')
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $cases = CaseFile::query()
            ->with(['report', 'timelineEvents'])
            ->when($request->string('stage')->isNotEmpty(), fn ($query) => $query->where('stage', $request->string('stage')))
            ->when($request->string('severity')->isNotEmpty(), fn ($query) => $query->whereHas('report', function ($reportQuery) use ($request) {
                $reportQuery->where('severity', $request->string('severity'));
            }))
            ->orderByDesc('last_activity_at')
            ->get()
            ->map(fn (CaseFile $caseFile) => $this->transformCase($caseFile));

        return response()->json([
            'data' => $cases,
        ]);
    }

    #[OA\Patch(
        path: '/api/investigator/cases/{caseFile}/assign',
        operationId: 'assignCase',
        summary: 'Assign a case',
        description: 'Assigns ownership of a case and transitions intake cases into assessment.',
        tags: ['Investigator Portal'],
        parameters: [
            new OA\PathParameter(
                name: 'caseFile',
                description: 'Numeric case file identifier.',
                required: true,
                schema: new OA\Schema(type: 'integer', example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/AssignCaseRequest')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Case assignment updated.',
                content: new OA\JsonContent(ref: '#/components/schemas/CaseMutationResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Case file was not found.',
                content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Validation failed.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')
            ),
        ]
    )]
    public function assign(
        AssignCaseRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $caseFile = $workflow->assignCase($caseFile->load('report'), $request->validated());

        return response()->json([
            'message' => 'Case assignment updated.',
            'data' => $this->transformCase($caseFile),
        ]);
    }

    #[OA\Patch(
        path: '/api/investigator/cases/{caseFile}/status',
        operationId: 'updateCaseStatus',
        summary: 'Update case status',
        description: 'Moves a case between workflow stages and can optionally publish a public-facing update.',
        tags: ['Investigator Portal'],
        parameters: [
            new OA\PathParameter(
                name: 'caseFile',
                description: 'Numeric case file identifier.',
                required: true,
                schema: new OA\Schema(type: 'integer', example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UpdateCaseStatusRequest')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Case status updated.',
                content: new OA\JsonContent(ref: '#/components/schemas/CaseMutationResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Case file was not found.',
                content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Validation failed.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')
            ),
        ]
    )]
    public function updateStatus(
        UpdateCaseStatusRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $caseFile = $workflow->updateCaseStatus($caseFile->load('report'), $request->validated());

        return response()->json([
            'message' => 'Case status updated.',
            'data' => $this->transformCase($caseFile),
        ]);
    }

    private function transformCase(CaseFile $caseFile): array
    {
        $internalEvents = $caseFile->timelineEvents->where('visibility', 'internal')->values();

        return [
            'id' => $caseFile->id,
            'case_number' => $caseFile->case_number,
            'stage' => $caseFile->stage,
            'stage_label' => config("wbs.case_stages.{$caseFile->stage}", $caseFile->stage),
            'assigned_to' => $caseFile->assigned_to,
            'assigned_unit' => $caseFile->assigned_unit,
            'severity' => $caseFile->report?->severity,
            'status' => $caseFile->report?->status,
            'public_reference' => $caseFile->report?->public_reference,
            'title' => $caseFile->report?->title,
            'category' => $caseFile->report?->category,
            'governance_tags' => $caseFile->report?->governance_tags ?? [],
            'escalation_required' => $caseFile->escalation_required,
            'sla_due_at' => $caseFile->sla_due_at?->toISOString(),
            'last_activity_at' => $caseFile->last_activity_at?->toISOString(),
            'latest_internal_event' => $internalEvents->last()?->headline,
        ];
    }
}
