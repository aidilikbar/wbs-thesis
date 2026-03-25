<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Report;
use App\Models\User;
use App\Services\CaseWorkflowService;
use App\Services\ReportAttachmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class ReporterReportController extends Controller
{
    #[OA\Get(
        path: '/api/reporter/reports',
        operationId: 'listReporterReports',
        summary: 'List the current reporter reports',
        description: 'Returns the authenticated reporter submissions and their current public-safe status with pagination and filtering.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Reporter reports returned.', content: new OA\JsonContent(ref: '#/components/schemas/ReporterReportDirectoryResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $this->authorizeReporter($request);
        $perPage = min(max($request->integer('per_page', 10), 1), 50);
        $search = trim($request->string('search')->toString());
        $status = $request->string('status')->toString();

        $reports = Report::query()
            ->with('caseFile')
            ->where('reporter_user_id', $user->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $like = "%{$search}%";

                    $nested
                        ->where('title', 'like', $like)
                        ->orWhere('public_reference', 'like', $like)
                        ->orWhere('category', 'like', $like)
                        ->orWhere('accused_party', 'like', $like);
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest('submitted_at')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => [
                'items' => $reports->getCollection()->map(fn (Report $report) => $this->transformSummary($report)),
                'meta' => [
                    'current_page' => $reports->currentPage(),
                    'last_page' => $reports->lastPage(),
                    'per_page' => $reports->perPage(),
                    'total' => $reports->total(),
                    'from' => $reports->firstItem(),
                    'to' => $reports->lastItem(),
                ],
            ],
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
            content: [
                new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionRequest'),
                new OA\MediaType(
                    mediaType: 'multipart/form-data',
                    schema: new OA\Schema(ref: '#/components/schemas/ReportSubmissionRequest')
                ),
            ]
        ),
        responses: [
            new OA\Response(response: 201, description: 'Report submitted successfully.', content: new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function store(
        StoreReportRequest $request,
        CaseWorkflowService $workflow,
        ReportAttachmentService $attachments,
    ): JsonResponse
    {
        $user = $this->authorizeReporter($request);
        $uploadedPaths = [];

        try {
            $result = DB::transaction(function () use ($attachments, $request, $user, $workflow, &$uploadedPaths) {
                $result = $workflow->submitReport($user, $request->safe()->except('attachments'));
                $report = $result['report'];

                foreach ($request->file('attachments', []) as $file) {
                    $attachment = $attachments->storeUploadedFile($report, $user, $file);
                    $uploadedPaths[] = ['disk' => $attachment->disk, 'path' => $attachment->object_key];
                }

                return $result;
            });
        } catch (\Throwable $exception) {
            $this->cleanupUploadedObjects($uploadedPaths);

            throw $exception;
        }

        $report = $result['report']->fresh(['attachments']);
        $caseFile = $result['caseFile'];

        return response()->json([
            'message' => 'Report submitted successfully.',
            'data' => [
                'report_id' => $report->id,
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

    #[OA\Get(
        path: '/api/reporter/reports/{report}',
        operationId: 'showReporterReport',
        summary: 'Get a single reporter report',
        description: 'Returns the authenticated reporter report with editable details and current case status.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'report', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Reporter report returned.', content: new OA\JsonContent(ref: '#/components/schemas/ReporterReportRecordResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'Report not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
        ]
    )]
    public function show(Request $request, Report $report): JsonResponse
    {
        $user = $this->authorizeOwnedReport($request, $report);

        return response()->json([
            'data' => $this->transformDetail($report->fresh(['caseFile', 'timelineEvents', 'attachments']), $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/reporter/reports/{report}',
        operationId: 'updateReporterReport',
        summary: 'Update a reporter-owned report',
        description: 'Updates the authenticated reporter report details while preserving the existing workflow case.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'report', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: [
                new OA\JsonContent(ref: '#/components/schemas/ReportSubmissionRequest'),
                new OA\MediaType(
                    mediaType: 'multipart/form-data',
                    schema: new OA\Schema(ref: '#/components/schemas/ReportSubmissionRequest')
                ),
            ]
        ),
        responses: [
            new OA\Response(response: 200, description: 'Reporter report updated.', content: new OA\JsonContent(ref: '#/components/schemas/ReporterReportMutationResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'Report not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function update(
        StoreReportRequest $request,
        Report $report,
        CaseWorkflowService $workflow,
        ReportAttachmentService $attachments,
    ): JsonResponse {
        $user = $this->authorizeOwnedReport($request, $report);
        $uploadedPaths = [];

        try {
            $updatedReport = DB::transaction(function () use ($attachments, $report, $request, $user, $workflow, &$uploadedPaths) {
                $updatedReport = $workflow->updateReporterReport(
                    $report->fresh(['caseFile', 'attachments']),
                    $user,
                    $request->safe()->except('attachments')
                );

                foreach ($request->file('attachments', []) as $file) {
                    $attachment = $attachments->storeUploadedFile($updatedReport, $user, $file);
                    $uploadedPaths[] = ['disk' => $attachment->disk, 'path' => $attachment->object_key];
                }

                return $updatedReport->fresh(['caseFile', 'timelineEvents', 'attachments']);
            });
        } catch (\Throwable $exception) {
            $this->cleanupUploadedObjects($uploadedPaths);

            throw $exception;
        }

        return response()->json([
            'message' => 'Reporter report updated successfully.',
            'data' => $this->transformDetail($updatedReport, $user),
        ]);
    }

    private function authorizeReporter(Request $request): User
    {
        $user = $request->user();

        abort_unless($user?->hasRole(User::ROLE_REPORTER), 403, 'Only registered reporters may submit reports.');

        return $user;
    }

    private function authorizeOwnedReport(Request $request, Report $report): User
    {
        $user = $this->authorizeReporter($request);

        abort_if((int) $report->reporter_user_id !== (int) $user->id, 404, 'Report not found.');

        return $user;
    }

    private function editLockReason(Report $report): ?string
    {
        return $report->status === 'completed'
            ? 'Completed reports can no longer be edited by the reporter.'
            : null;
    }

    private function cleanupUploadedObjects(array $uploadedPaths): void
    {
        foreach ($uploadedPaths as $uploadedPath) {
            if (! isset($uploadedPath['disk'], $uploadedPath['path'])) {
                continue;
            }

            Storage::disk($uploadedPath['disk'])->delete($uploadedPath['path']);
        }
    }

    private function transformSummary(Report $report): array
    {
        return [
            'id' => $report->id,
            'public_reference' => $report->public_reference,
            'tracking_token' => $report->tracking_token,
            'title' => $report->title,
            'category' => $report->category,
            'status' => $report->status,
            'severity' => $report->severity,
            'submitted_at' => $report->submitted_at?->toISOString(),
            'confidentiality_level' => $report->anonymity_level,
            'is_editable' => $this->editLockReason($report) === null,
            'edit_lock_reason' => $this->editLockReason($report),
            'case' => [
                'case_number' => $report->caseFile?->case_number,
                'stage' => $report->caseFile?->stage,
                'stage_label' => config("wbs.case_stages.{$report->caseFile?->stage}", $report->caseFile?->stage),
                'assigned_unit' => $report->caseFile?->assigned_unit,
                'current_role' => $report->caseFile?->current_role,
                'current_role_label' => config("wbs.roles.{$report->caseFile?->current_role}", $report->caseFile?->current_role),
            ],
        ];
    }

    private function transformDetail(Report $report, User $user): array
    {
        return [
            ...$this->transformSummary($report),
            'category_label' => config("wbs.categories.{$report->category}", $report->category),
            'description' => $report->description,
            'incident_date' => $report->incident_date?->toDateString(),
            'incident_location' => $report->incident_location,
            'accused_party' => $report->accused_party,
            'evidence_summary' => $report->evidence_summary,
            'last_public_update_at' => $report->last_public_update_at?->toISOString(),
            'requested_follow_up' => $report->requested_follow_up,
            'witness_available' => $report->witness_available,
            'governance_tags' => array_values($report->governance_tags ?? []),
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
            'attachments' => $report->attachments
                ->values()
                ->map(fn ($attachment) => $this->transformAttachment($attachment)),
            'reporter' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ];
    }

    private function transformAttachment($attachment): array
    {
        return [
            'id' => $attachment->id,
            'uuid' => $attachment->uuid,
            'original_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'extension' => $attachment->extension,
            'size_bytes' => $attachment->size_bytes,
            'checksum_sha256' => $attachment->checksum_sha256,
            'uploaded_at' => $attachment->created_at?->toISOString(),
        ];
    }
}
