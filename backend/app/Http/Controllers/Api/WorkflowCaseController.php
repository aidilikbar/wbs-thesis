<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewDelegationRequest;
use App\Http\Requests\ReviewSubmissionRequest;
use App\Http\Requests\VerificationDelegationRequest;
use App\Http\Requests\VerificationSubmissionRequest;
use App\Http\Requests\WorkflowApprovalRequest;
use App\Models\CaseFile;
use App\Models\User;
use App\Services\CaseWorkflowService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class WorkflowCaseController extends Controller
{
    #[OA\Get(
        path: '/api/workflow/cases',
        operationId: 'listWorkflowCases',
        summary: 'List workflow cases for the authenticated internal role',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'view', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['queue', 'approval'], default: 'queue')),
            new OA\Parameter(name: 'stage', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Workflow cases returned.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowCaseListResponse')),
            new OA\Response(response: 403, description: 'Internal role access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $this->authorizeInternalUser($request);
        $perPage = min(max($request->integer('per_page', 10), 1), 50);
        $search = trim($request->string('search')->toString());
        $stage = $request->string('stage')->toString();
        $view = $request->string('view')->toString() ?: 'queue';

        $cases = CaseFile::query()
            ->with($this->workflowRelations())
            ->when($stage !== '', fn (Builder $query) => $query->where('stage', $stage))
            ->when($search !== '', fn (Builder $query) => $this->applySearchFilter($query, $search))
            ->when($user->role !== User::ROLE_SYSTEM_ADMINISTRATOR, fn (Builder $query) => $this->scopeCasesForUser($query, $user))
            ->when($view !== '', fn (Builder $query) => $this->scopeCasesForView($query, $user, $view))
            ->orderByDesc('last_activity_at')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => [
                'items' => $cases->getCollection()->map(fn (CaseFile $caseFile) => $this->transformCase($caseFile, $user)),
                'meta' => [
                    'current_page' => $cases->currentPage(),
                    'last_page' => $cases->lastPage(),
                    'per_page' => $cases->perPage(),
                    'total' => $cases->total(),
                    'from' => $cases->firstItem(),
                    'to' => $cases->lastItem(),
                ],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/workflow/cases/{caseFile}',
        operationId: 'showWorkflowCase',
        summary: 'Get a single workflow case for the authenticated internal role',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Workflow case returned.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowCaseRecordResponse')),
            new OA\Response(response: 403, description: 'Internal role access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'Workflow case not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
        ]
    )]
    public function show(Request $request, CaseFile $caseFile): JsonResponse
    {
        $user = $this->authorizeInternalUser($request);
        $caseFile = $this->findVisibleCaseOrFail($caseFile, $user);

        return response()->json([
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Get(
        path: '/api/workflow/assignees',
        operationId: 'listWorkflowAssignees',
        summary: 'List available assignees for workflow delegation',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'role', in: 'query', required: true, schema: new OA\Schema(type: 'string', enum: ['verificator', 'investigator'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Assignee list returned.', content: new OA\JsonContent(ref: '#/components/schemas/AssigneeListResponse')),
            new OA\Response(response: 403, description: 'Supervisor or administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function assignees(Request $request): JsonResponse
    {
        $user = $this->authorizeInternalUser($request);
        $role = $request->string('role')->toString();

        abort_unless(
            in_array($role, [User::ROLE_VERIFICATOR, User::ROLE_INVESTIGATOR], true),
            422,
            'Unsupported assignee role.'
        );

        abort_unless(
            $user->hasRole([
            User::ROLE_SYSTEM_ADMINISTRATOR,
            User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
            ]),
            403,
            'Only supervisors or the system administrator may request assignee lists.'
        );

        $users = User::query()
            ->where('role', $role)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (User $candidate) => [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'email' => $candidate->email,
                'phone' => $candidate->phone,
                'role' => $candidate->role,
                'role_label' => $candidate->role_label,
                'unit' => $candidate->unit,
            ]);

        return response()->json([
            'data' => $users,
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/delegate-verification',
        operationId: 'delegateVerification',
        summary: 'Delegate a submitted case to a verification officer',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/DelegateCaseRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Verification delegated.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function delegateVerification(
        VerificationDelegationRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_VERIFICATOR);
        $assignee = $request->validated('reject_report')
            ? null
            : User::query()->findOrFail($request->integer('assignee_user_id'));
        $caseFile = $workflow->delegateToVerificator($caseFile, $user, $assignee, $request->validated());

        return response()->json([
            'message' => 'Verification screening recorded.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/submit-verification',
        operationId: 'submitVerification',
        summary: 'Submit verification back to the verification supervisor',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/SubmitWorkflowStageRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Verification submitted.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function submitVerification(
        VerificationSubmissionRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_VERIFICATOR);
        $caseFile = $workflow->submitVerification($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Verification assessment submitted to the verification supervisor.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/review-verification',
        operationId: 'reviewVerification',
        summary: 'Approve or reject verification',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/ReviewWorkflowStageRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Verification review recorded.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function reviewVerification(
        WorkflowApprovalRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_VERIFICATOR);
        $caseFile = $workflow->reviewVerification($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Verification review recorded.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/delegate-investigation',
        operationId: 'delegateInvestigation',
        summary: 'Delegate a verified case to an investigator',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/DelegateCaseRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Investigation delegated.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function delegateInvestigation(
        ReviewDelegationRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_INVESTIGATOR);
        $assignee = User::query()->findOrFail($request->integer('assignee_user_id'));
        $caseFile = $workflow->delegateToInvestigator($caseFile, $user, $assignee, $request->validated());

        return response()->json([
            'message' => 'Case delegated to reviewer.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/submit-investigation',
        operationId: 'submitInvestigation',
        summary: 'Submit investigation back to the investigation supervisor',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/SubmitWorkflowStageRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Investigation submitted.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function submitInvestigation(
        ReviewSubmissionRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_INVESTIGATOR);
        $caseFile = $workflow->submitInvestigation($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Review assessment submitted to the review supervisor.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/review-investigation',
        operationId: 'reviewInvestigation',
        summary: 'Approve or reject investigation',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/ReviewWorkflowStageRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Investigation review recorded.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function reviewInvestigation(
        WorkflowApprovalRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_INVESTIGATOR);
        $caseFile = $workflow->reviewInvestigation($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Review approval recorded.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/director-review',
        operationId: 'directorReview',
        summary: 'Record the director decision',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/ReviewWorkflowStageRequest')),
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Director decision recorded.', content: new OA\JsonContent(ref: '#/components/schemas/WorkflowMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function directorReview(
        WorkflowApprovalRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_DIRECTOR);
        $caseFile = $workflow->directorDecision($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Director decision recorded.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    private function authorizeInternalUser(Request $request): User
    {
        $user = $request->user();

        abort_unless($user && $user->isInternalUser(), 403, 'This workflow is restricted to internal roles.');

        return $user;
    }

    private function authorizeRole(Request $request, string $role): User
    {
        $user = $this->authorizeInternalUser($request);

        abort_unless($user->hasRole($role), 403, 'You do not have access to this workflow action.');

        return $user;
    }

    private function scopeCasesForUser($query, User $user)
    {
        return match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => $query->where('verification_supervisor_id', $user->id),
            User::ROLE_VERIFICATOR => $query->where('verificator_id', $user->id),
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $query->where('investigation_supervisor_id', $user->id),
            User::ROLE_INVESTIGATOR => $query->where('investigator_id', $user->id),
            User::ROLE_DIRECTOR => $query->where('director_id', $user->id),
            default => $query->whereRaw('1 = 0'),
        };
    }

    private function scopeCasesForView(Builder $query, User $user, string $view): Builder
    {
        $stages = $this->visibleStagesForView($user, $view);

        if ($stages === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('stage', $stages);
    }

    private function visibleStagesForView(User $user, string $view): array
    {
        $queueStages = match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => ['submitted'],
            User::ROLE_VERIFICATOR => ['verification_in_progress'],
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => ['verified'],
            User::ROLE_INVESTIGATOR => ['investigation_in_progress'],
            User::ROLE_DIRECTOR => [],
            User::ROLE_SYSTEM_ADMINISTRATOR => [
                'submitted',
                'verification_in_progress',
                'verified',
                'investigation_in_progress',
            ],
            default => [],
        };

        $approvalStages = match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => ['verification_review'],
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => ['investigation_review'],
            User::ROLE_DIRECTOR => ['director_review'],
            User::ROLE_SYSTEM_ADMINISTRATOR => [
                'verification_review',
                'investigation_review',
                'director_review',
            ],
            default => [],
        };

        return match ($view) {
            'approval' => $approvalStages,
            default => $queueStages,
        };
    }

    private function applySearchFilter(Builder $query, string $search): Builder
    {
        $like = "%{$search}%";

        return $query->where(function (Builder $nested) use ($like) {
            $nested
                ->where('case_number', 'like', $like)
                ->orWhere('assigned_to', 'like', $like)
                ->orWhere('assigned_unit', 'like', $like)
                ->orWhereHas('report', function (Builder $reportQuery) use ($like) {
                    $reportQuery
                        ->where('title', 'like', $like)
                        ->orWhere('public_reference', 'like', $like)
                        ->orWhere('category', 'like', $like)
                        ->orWhere('accused_party', 'like', $like)
                        ->orWhere('description', 'like', $like);
                });
        });
    }

    private function findVisibleCaseOrFail(CaseFile $caseFile, User $user): CaseFile
    {
        return CaseFile::query()
            ->with($this->workflowRelations())
            ->whereKey($caseFile->getKey())
            ->when($user->role !== User::ROLE_SYSTEM_ADMINISTRATOR, fn (Builder $query) => $this->scopeCasesForUser($query, $user))
            ->firstOrFail();
    }

    private function workflowRelations(): array
    {
        return [
            'report.attachments',
            'timelineEvents',
            'verificationSupervisor',
            'verificator',
            'investigationSupervisor',
            'investigator',
            'director',
        ];
    }

    private function transformCase(CaseFile $caseFile, User $viewer): array
    {
        $internalEvents = $caseFile->timelineEvents->where('visibility', 'internal')->values();
        $publicEvents = $caseFile->timelineEvents->where('visibility', 'public')->values();
        $reporterVisible = $caseFile->confidentiality_level !== 'anonymous';

        return [
            'id' => $caseFile->id,
            'case_number' => $caseFile->case_number,
            'stage' => $caseFile->stage,
            'stage_label' => config("wbs.case_stages.{$caseFile->stage}", $caseFile->stage),
            'status' => $caseFile->report?->status,
            'current_role' => $caseFile->current_role,
            'current_role_label' => config("wbs.roles.{$caseFile->current_role}", $caseFile->current_role),
            'assigned_to' => $caseFile->assigned_to,
            'assigned_unit' => $caseFile->assigned_unit,
            'severity' => $caseFile->report?->severity,
            'public_reference' => $caseFile->report?->public_reference,
            'title' => $caseFile->report?->title,
            'category' => $caseFile->report?->category,
            'category_label' => config("wbs.categories.{$caseFile->report?->category}", $caseFile->report?->category),
            'description' => $caseFile->report?->description,
            'incident_date' => $caseFile->report?->incident_date?->toDateString(),
            'incident_location' => $caseFile->report?->incident_location,
            'accused_party' => $caseFile->report?->accused_party,
            'reported_parties' => array_values($caseFile->report?->reported_parties ?? []),
            'evidence_summary' => $caseFile->report?->evidence_summary,
            'governance_tags' => $caseFile->report?->governance_tags ?? [],
            'confidentiality_level' => $caseFile->confidentiality_level,
            'reporter' => [
                'name' => $reporterVisible ? $caseFile->report?->reporter_name : null,
                'email' => $reporterVisible ? $caseFile->report?->reporter_email : null,
                'phone' => $reporterVisible ? $caseFile->report?->reporter_phone : null,
                'is_protected' => ! $reporterVisible,
            ],
            'workflow' => [
                'verification_supervisor' => $caseFile->verificationSupervisor?->name,
                'verificator' => $caseFile->verificator?->name,
                'investigation_supervisor' => $caseFile->investigationSupervisor?->name,
                'investigator' => $caseFile->investigator?->name,
                'director' => $caseFile->director?->name,
            ],
            'workflow_records' => [
                'screening' => $caseFile->screening_payload,
                'verification' => $caseFile->verification_payload,
                'verification_approval' => $caseFile->verification_approval_payload,
                'review_distribution' => $caseFile->review_distribution_payload,
                'review' => $caseFile->review_payload,
                'review_approval' => $caseFile->review_approval_payload,
                'director_approval' => $caseFile->director_approval_payload,
            ],
            'attachments' => ($caseFile->report?->attachments ?? collect())
                ->values()
                ->map(fn ($attachment) => [
                    'id' => $attachment->id,
                    'uuid' => $attachment->uuid,
                    'original_name' => $attachment->original_name,
                    'mime_type' => $attachment->mime_type,
                    'extension' => $attachment->extension,
                    'size_bytes' => $attachment->size_bytes,
                    'checksum_sha256' => $attachment->checksum_sha256,
                    'uploaded_at' => $attachment->created_at?->toISOString(),
                ]),
            'sla_due_at' => $caseFile->sla_due_at?->toISOString(),
            'last_activity_at' => $caseFile->last_activity_at?->toISOString(),
            'notes' => $caseFile->notes,
            'latest_internal_event' => $internalEvents->last()?->headline,
            'latest_public_event' => $publicEvents->last()?->headline,
            'timeline' => $caseFile->timelineEvents
                ->values()
                ->map(fn ($event) => [
                    'visibility' => $event->visibility,
                    'stage' => $event->stage,
                    'stage_label' => config("wbs.case_stages.{$event->stage}", $event->stage),
                    'headline' => $event->headline,
                    'detail' => $event->detail,
                    'actor_role' => $event->actor_role,
                    'actor_name' => $event->actor_name,
                    'occurred_at' => $event->occurred_at?->toISOString(),
                ]),
            'available_actions' => $this->availableActions($caseFile, $viewer),
        ];
    }

    private function availableActions(CaseFile $caseFile, User $viewer): array
    {
        return match (true) {
            $viewer->hasRole(User::ROLE_SUPERVISOR_OF_VERIFICATOR) && $caseFile->stage === 'submitted' => ['delegate_verification'],
            $viewer->hasRole(User::ROLE_VERIFICATOR) && $caseFile->stage === 'verification_in_progress' && $caseFile->verificator_id === $viewer->id => ['submit_verification'],
            $viewer->hasRole(User::ROLE_SUPERVISOR_OF_VERIFICATOR) && $caseFile->stage === 'verification_review' => ['review_verification'],
            $viewer->hasRole(User::ROLE_SUPERVISOR_OF_INVESTIGATOR) && $caseFile->stage === 'verified' => ['delegate_investigation'],
            $viewer->hasRole(User::ROLE_INVESTIGATOR) && $caseFile->stage === 'investigation_in_progress' && $caseFile->investigator_id === $viewer->id => ['submit_investigation'],
            $viewer->hasRole(User::ROLE_SUPERVISOR_OF_INVESTIGATOR) && $caseFile->stage === 'investigation_review' => ['review_investigation'],
            $viewer->hasRole(User::ROLE_DIRECTOR) && $caseFile->stage === 'director_review' => ['director_review'],
            default => [],
        };
    }
}
