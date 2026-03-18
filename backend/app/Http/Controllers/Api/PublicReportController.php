<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\TrackReportRequest;
use App\Models\Report;
use App\Services\CaseWorkflowService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class PublicReportController extends Controller
{
    #[OA\Post(
        path: '/api/reports',
        operationId: 'submitReport',
        summary: 'Submit a whistleblowing report',
        description: 'Registers a report, creates the initial case file, and returns the public reference and tracking token.',
        tags: ['Public Reporting'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionRequest')
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Report submitted successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Validation failed.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')
            ),
        ]
    )]
    public function store(StoreReportRequest $request, CaseWorkflowService $workflow): JsonResponse
    {
        $result = $workflow->submitReport($request->validated());
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
                    'Use the tracking form to check public updates.',
                    'Governance triage will assess the report before assignment.',
                ],
            ],
        ], 201);
    }

    #[OA\Post(
        path: '/api/tracking',
        operationId: 'trackReport',
        summary: 'Track a submitted report',
        description: 'Returns the public case snapshot and timeline for a valid reference and tracking token pair.',
        tags: ['Public Reporting'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/TrackingRequest')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Tracking details returned successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/TrackingResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'Tracking reference or token was not recognised.',
                content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Validation failed.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')
            ),
        ]
    )]
    public function track(TrackReportRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $report = Report::query()
            ->with(['caseFile', 'timelineEvents'])
            ->where('public_reference', $validated['reference'])
            ->where('tracking_token', $validated['token'])
            ->first();

        if (! $report) {
            return response()->json([
                'message' => 'Tracking reference or token was not recognised.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'public_reference' => $report->public_reference,
                'title' => $report->title,
                'category' => $report->category,
                'category_label' => config("wbs.categories.{$report->category}", $report->category),
                'status' => $report->status,
                'severity' => $report->severity,
                'submitted_at' => $report->submitted_at?->toISOString(),
                'anonymity_level' => $report->anonymity_level,
                'case' => [
                    'case_number' => $report->caseFile?->case_number,
                    'stage' => $report->caseFile?->stage,
                    'stage_label' => config("wbs.case_stages.{$report->caseFile?->stage}"),
                    'assigned_unit' => $report->caseFile?->assigned_unit,
                    'sla_due_at' => $report->caseFile?->sla_due_at?->toISOString(),
                ],
                'timeline' => $report->timelineEvents
                    ->where('visibility', 'public')
                    ->values()
                    ->map(fn ($event) => [
                        'stage' => $event->stage,
                        'stage_label' => config("wbs.case_stages.{$event->stage}", $event->stage),
                        'headline' => $event->headline,
                        'detail' => $event->detail,
                        'actor_role' => $event->actor_role,
                        'occurred_at' => $event->occurred_at?->toISOString(),
                    ]),
            ],
        ]);
    }
}
