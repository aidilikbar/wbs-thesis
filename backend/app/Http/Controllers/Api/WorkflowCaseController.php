<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DelegateCaseRequest;
use App\Http\Requests\ReviewWorkflowStageRequest;
use App\Http\Requests\SubmitWorkflowStageRequest;
use App\Models\CaseFile;
use App\Models\User;
use App\Services\CaseWorkflowService;
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

        $cases = CaseFile::query()
            ->with([
                'report.attachments',
                'timelineEvents',
                'verificationSupervisor',
                'verificator',
                'investigationSupervisor',
                'investigator',
                'director',
            ])
            ->when($request->string('stage')->isNotEmpty(), fn ($query) => $query->where('stage', $request->string('stage')))
            ->when(
                $user->role !== User::ROLE_SYSTEM_ADMINISTRATOR,
                fn ($query) => $this->scopeCasesForUser($query, $user)
            )
            ->orderByDesc('last_activity_at')
            ->get()
            ->map(fn (CaseFile $caseFile) => $this->transformCase($caseFile, $user));

        return response()->json([
            'data' => $cases,
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
        summary: 'Delegate a submitted case to a verificator',
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
        DelegateCaseRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_VERIFICATOR);
        $assignee = User::query()->findOrFail($request->integer('assignee_user_id'));
        $caseFile = $workflow->delegateToVerificator($caseFile, $user, $assignee, $request->validated());

        return response()->json([
            'message' => 'Report delegated to verificator.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/submit-verification',
        operationId: 'submitVerification',
        summary: 'Submit verification back to the supervisor of verificator',
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
        SubmitWorkflowStageRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_VERIFICATOR);
        $caseFile = $workflow->submitVerification($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Verification submitted to supervisor.',
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
        ReviewWorkflowStageRequest $request,
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
        DelegateCaseRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_INVESTIGATOR);
        $assignee = User::query()->findOrFail($request->integer('assignee_user_id'));
        $caseFile = $workflow->delegateToInvestigator($caseFile, $user, $assignee, $request->validated());

        return response()->json([
            'message' => 'Verified report delegated to investigator.',
            'data' => $this->transformCase($caseFile, $user),
        ]);
    }

    #[OA\Patch(
        path: '/api/workflow/cases/{caseFile}/submit-investigation',
        operationId: 'submitInvestigation',
        summary: 'Submit investigation back to the supervisor of investigator',
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
        SubmitWorkflowStageRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_INVESTIGATOR);
        $caseFile = $workflow->submitInvestigation($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Investigation submitted to supervisor.',
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
        ReviewWorkflowStageRequest $request,
        CaseFile $caseFile,
        CaseWorkflowService $workflow,
    ): JsonResponse {
        $user = $this->authorizeRole($request, User::ROLE_SUPERVISOR_OF_INVESTIGATOR);
        $caseFile = $workflow->reviewInvestigation($caseFile, $user, $request->validated());

        return response()->json([
            'message' => 'Investigation review recorded.',
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
        ReviewWorkflowStageRequest $request,
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
            'latest_internal_event' => $internalEvents->last()?->headline,
            'latest_public_event' => $publicEvents->last()?->headline,
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
