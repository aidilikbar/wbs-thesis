<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\GovernanceControl;
use App\Models\Report;
use App\Models\User;
use App\Services\OperationalKpiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class GovernanceDashboardController extends Controller
{
    public function __construct(
        private readonly OperationalKpiService $operationalKpiService,
    ) {
    }

    #[OA\Get(
        path: '/api/governance/dashboard',
        operationId: 'getGovernanceDashboard',
        summary: 'Get operational oversight dashboard data',
        description: 'Returns global oversight posture plus role-scoped workload and approval indicators for internal action.',
        tags: ['Operational Oversight'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Governance dashboard returned successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/GovernanceDashboardResponse')
            ),
            new OA\Response(
                response: 403,
                description: 'Internal role access required.',
                content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        abort_unless($user?->isInternalUser(), 403, 'The governance dashboard is restricted to internal roles.');

        $reports = Report::query()->get();
        $caseFiles = CaseFile::query()
            ->with(['report', 'auditLogs'])
            ->get();
        $internalUsers = User::query()
            ->whereIn('role', config('wbs.internal_roles', []))
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        $controls = GovernanceControl::query()->orderBy('code')->get();
        $recentAuditLogs = AuditLog::query()
            ->with(['caseFile.report'])
            ->latest('happened_at')
            ->limit($user->hasRole(User::ROLE_AUDITOR) ? 32 : 8)
            ->get();
        $displayAuditLogs = $user->hasRole(User::ROLE_AUDITOR)
            ? $recentAuditLogs
                ->filter(fn (AuditLog $log) => $log->case_file_id && $log->actor_role !== User::ROLE_REPORTER)
                ->take(8)
                ->values()
            : $recentAuditLogs;

        $triagedCases = $caseFiles->filter(fn (CaseFile $caseFile) => $caseFile->triaged_at && $caseFile->report?->submitted_at);

        $averageTriageHours = $triagedCases->isEmpty()
            ? 0
            : round($triagedCases->avg(fn (CaseFile $caseFile) => $caseFile->report->submitted_at->diffInHours($caseFile->triaged_at)), 1);

        $referenceTime = now();
        $casePhaseKpis = $caseFiles
            ->mapWithKeys(fn (CaseFile $caseFile) => [
                $caseFile->id => $this->operationalKpiService->buildCasePhaseKpis($caseFile, $referenceTime),
            ])
            ->all();
        $globalOverdueCases = $this->countOverdueCases($caseFiles, $casePhaseKpis);
        $scopedUsers = $this->resolveScopedUsers($user, $internalUsers);
        $scopeRows = $scopedUsers
            ->map(fn (User $subject) => $this->buildScopeRow($subject, $caseFiles, $user, $casePhaseKpis))
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'global' => [
                    'metrics' => [
                        [
                            'label' => 'Reports received',
                            'value' => $reports->count(),
                            'detail' => 'Total whistleblowing records registered in the platform.',
                            'tone' => 'normal',
                        ],
                        [
                            'label' => 'Open cases',
                            'value' => $caseFiles->where('stage', '!=', 'completed')->count(),
                            'detail' => 'Cases still active across verification, investigation, or approval stages.',
                            'tone' => 'normal',
                        ],
                        [
                            'label' => 'Overdue cases',
                            'value' => $globalOverdueCases,
                            'detail' => 'Cases that have passed the current SLA due time.',
                            'tone' => $globalOverdueCases > 0 ? 'critical' : 'normal',
                        ],
                        [
                            'label' => 'Anonymous share',
                            'value' => $reports->isEmpty()
                                ? '0%'
                                : round(($reports->where('anonymity_level', 'anonymous')->count() / $reports->count()) * 100, 1).'%',
                            'detail' => 'Share of reports where reporter identity remains masked from case handlers.',
                            'tone' => 'normal',
                        ],
                        [
                            'label' => 'Average triage',
                            'value' => $averageTriageHours.' h',
                            'detail' => 'Average elapsed time between submission and initial triage.',
                            'tone' => $averageTriageHours > 72 ? 'warning' : 'normal',
                        ],
                    ],
                    'queue_snapshot' => [
                        ['label' => 'New intake', 'value' => $caseFiles->where('stage', 'submitted')->count()],
                        ['label' => 'Verification work', 'value' => $caseFiles->where('stage', 'verification_in_progress')->count()],
                        ['label' => 'Verification approvals', 'value' => $caseFiles->where('stage', 'verification_review')->count()],
                        ['label' => 'Investigation intake', 'value' => $caseFiles->where('stage', 'verified')->count()],
                        ['label' => 'Investigation work', 'value' => $caseFiles->where('stage', 'investigation_in_progress')->count()],
                        ['label' => 'Investigation approvals', 'value' => $caseFiles->where('stage', 'investigation_review')->count()],
                        ['label' => 'Director approvals', 'value' => $caseFiles->where('stage', 'director_review')->count()],
                    ],
                    'action_items' => $this->buildGlobalActionItems($caseFiles, $user),
                    'controls' => $controls->map(fn (GovernanceControl $control) => [
                        'code' => $control->code,
                        'name' => $control->name,
                        'description' => $control->description,
                        'owner_role' => $control->owner_role,
                        'status' => $control->status,
                        'target_metric' => $control->target_metric,
                        'current_metric' => $control->current_metric,
                        'notes' => $control->notes,
                    ])->values()->all(),
                    'recent_audit_logs' => $displayAuditLogs
                        ->map(fn (AuditLog $log) => $this->transformAuditLog($log, $user))
                        ->values()
                        ->all(),
                ],
                'specific' => $this->buildSpecificSection(
                    $user,
                    $internalUsers,
                    $scopedUsers,
                    $scopeRows,
                    $caseFiles,
                    $casePhaseKpis,
                    $controls,
                    $displayAuditLogs
                ),
            ],
        ]);
    }

    private function buildGlobalActionItems(Collection $caseFiles, User $viewer): array
    {
        $submitted = $caseFiles->where('stage', 'submitted')->count();
        $verificationReview = $caseFiles->where('stage', 'verification_review')->count();
        $investigationReview = $caseFiles->where('stage', 'investigation_review')->count();
        $directorReview = $caseFiles->where('stage', 'director_review')->count();
        $workflowHref = $viewer->canAccessWorkflow() ? '/workflow' : '/governance';
        $approvalHref = $viewer->canAccessWorkflow() ? '/workflow/approvals' : '/governance';

        return [
            [
                'title' => 'Assign new verification intake',
                'detail' => 'Submitted reports should be delegated to a verification officer without delay.',
                'href' => $workflowHref,
                'count' => $submitted,
                'tone' => $this->toneForCount($submitted, 2, 5),
            ],
            [
                'title' => 'Resolve verification approvals',
                'detail' => 'Supervisor approval is pending before cases can move into investigation.',
                'href' => $approvalHref,
                'count' => $verificationReview,
                'tone' => $this->toneForCount($verificationReview, 2, 4),
            ],
            [
                'title' => 'Resolve investigation approvals',
                'detail' => 'Supervisor approval is blocking the final director decision flow.',
                'href' => $approvalHref,
                'count' => $investigationReview,
                'tone' => $this->toneForCount($investigationReview, 2, 4),
            ],
            [
                'title' => 'Close director review backlog',
                'detail' => 'Final director decisions should not remain pending longer than necessary.',
                'href' => $approvalHref,
                'count' => $directorReview,
                'tone' => $this->toneForCount($directorReview, 1, 3),
            ],
        ];
    }

    private function buildSpecificSection(
        User $user,
        Collection $internalUsers,
        Collection $scopedUsers,
        array $scopeRows,
        Collection $caseFiles,
        array $casePhaseKpis,
        Collection $controls,
        Collection $recentAuditLogs
    ): array {
        $scopeCases = $this->scopeCasesForUser($user, $caseFiles, $scopedUsers);
        $openScopeCases = $scopeCases->where('stage', '!=', 'completed')->count();
        $overdueScopeCases = $this->countOverdueCases($scopeCases, $casePhaseKpis);
        $viewerActionCount = $this->casesAwaitingViewerAction($user, $caseFiles)->count();
        $subordinateRows = collect($scopeRows)->reject(fn (array $row) => $row['is_self']);
        $subordinateBacklog = $subordinateRows->sum(fn (array $row) => $row['pending_queue'] + $row['pending_approvals']);

        if ($user->role === User::ROLE_AUDITOR) {
            return $this->buildAuditorSpecificSection($user, $caseFiles, $casePhaseKpis, $recentAuditLogs);
        }

        if ($user->role === User::ROLE_SYSTEM_ADMINISTRATOR) {
            $inactiveInternalUsers = User::query()
                ->whereIn('role', config('wbs.internal_roles', []))
                ->where('is_active', false)
                ->count();

            $controlWarnings = $controls->where('status', 'warning')->count();
            $recentAuditCount = $recentAuditLogs->filter(
                fn (AuditLog $log) => $log->happened_at && $log->happened_at->isAfter(now()->subDay())
            )->count();

            return [
                'role' => $user->role,
                'role_label' => $user->role_label,
                'scope_label' => 'Platform controls, user readiness, and audit visibility for the whole whistleblowing environment.',
                'metrics' => [
                    [
                        'label' => 'Active internal users',
                        'value' => $internalUsers->count(),
                        'detail' => 'Internal accounts currently enabled for operations.',
                        'tone' => 'normal',
                    ],
                    [
                        'label' => 'Inactive internal users',
                        'value' => $inactiveInternalUsers,
                        'detail' => 'Provisioned accounts that are currently disabled.',
                        'tone' => $this->toneForCount($inactiveInternalUsers, 1, 3),
                    ],
                    [
                        'label' => 'Control warnings',
                        'value' => $controlWarnings,
                        'detail' => 'Governance controls currently flagged with warning status.',
                        'tone' => $this->toneForCount($controlWarnings, 1, 2),
                    ],
                    [
                        'label' => 'Audit events (24h)',
                        'value' => $recentAuditCount,
                        'detail' => 'Recent audit evidence captured in the last 24 hours.',
                        'tone' => 'normal',
                    ],
                ],
                'action_items' => [
                    [
                        'title' => 'Review control exceptions',
                        'detail' => 'Inspect warning controls and coordinate remediation with operational owners.',
                        'href' => '/governance',
                        'count' => $controlWarnings,
                        'tone' => $this->toneForCount($controlWarnings, 1, 2),
                    ],
                    [
                        'title' => 'Manage inactive internal users',
                        'detail' => 'Inactive accounts may block case assignment and approval flow.',
                        'href' => '/admin',
                        'count' => $inactiveInternalUsers,
                        'tone' => $this->toneForCount($inactiveInternalUsers, 1, 3),
                    ],
                    [
                        'title' => 'Inspect recent audit activity',
                        'detail' => 'Operational evidence should remain fresh and queryable.',
                        'href' => '/governance',
                        'count' => $recentAuditCount,
                        'tone' => 'normal',
                    ],
                ],
                'scope_rows' => [],
            ];
        }

        $metrics = [
            [
                'label' => 'Cases in your scope',
                'value' => $openScopeCases,
                'detail' => 'Open cases that fall inside your current operational responsibility.',
                'tone' => 'normal',
            ],
            [
                'label' => 'Awaiting your action',
                'value' => $viewerActionCount,
                'detail' => 'Cases currently blocked on your delegation, analysis, or approval step.',
                'tone' => $this->toneForCount($viewerActionCount, 2, 5),
            ],
            [
                'label' => $subordinateRows->isEmpty() ? 'Completed by you' : 'Team backlog',
                'value' => $subordinateRows->isEmpty()
                    ? $scopeCases->where('stage', 'completed')->count()
                    : $subordinateBacklog,
                'detail' => $subordinateRows->isEmpty()
                    ? 'Cases already completed within your own assignment scope.'
                    : 'Pending queue and approval load currently held by your subordinate scope.',
                'tone' => $subordinateRows->isEmpty()
                    ? 'normal'
                    : $this->toneForCount($subordinateBacklog, 3, 8),
            ],
            [
                'label' => 'Overdue in scope',
                'value' => $overdueScopeCases,
                'detail' => 'Open cases in your scope that have breached the current SLA.',
                'tone' => $this->toneForCount($overdueScopeCases, 1, 3),
            ],
        ];

        return [
            'role' => $user->role,
            'role_label' => $user->role_label,
            'scope_label' => $this->scopeLabelForUser($user),
            'metrics' => $metrics,
            'action_items' => $this->buildSpecificActionItems($user, $caseFiles, $casePhaseKpis, $scopeRows, $controls, $internalUsers, $recentAuditLogs),
            'scope_rows' => $scopeRows,
        ];
    }

    private function buildSpecificActionItems(
        User $user,
        Collection $caseFiles,
        array $casePhaseKpis,
        array $scopeRows,
        Collection $controls,
        Collection $internalUsers,
        Collection $recentAuditLogs
    ): array {
        $subordinateRows = collect($scopeRows)->reject(fn (array $row) => $row['is_self']);
        $subordinateBacklog = $subordinateRows->sum(fn (array $row) => $row['pending_queue'] + $row['pending_approvals']);

        return match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => [
                [
                    'title' => 'Delegate submitted reports',
                    'detail' => 'New reports should be assigned to a verification officer for assessment.',
                    'href' => '/workflow',
                    'count' => $caseFiles->where('stage', 'submitted')->where('current_role', User::ROLE_SUPERVISOR_OF_VERIFICATOR)->count(),
                    'tone' => $this->toneForCount($caseFiles->where('stage', 'submitted')->where('current_role', User::ROLE_SUPERVISOR_OF_VERIFICATOR)->count(), 2, 5),
                ],
                [
                    'title' => 'Approve verification outputs',
                    'detail' => 'Verification packages are waiting for supervisory approval or return.',
                    'href' => '/workflow/approvals',
                    'count' => $caseFiles->where('stage', 'verification_review')->where('current_role', User::ROLE_SUPERVISOR_OF_VERIFICATOR)->count(),
                    'tone' => $this->toneForCount($caseFiles->where('stage', 'verification_review')->where('current_role', User::ROLE_SUPERVISOR_OF_VERIFICATOR)->count(), 2, 4),
                ],
                [
                    'title' => 'Follow up verification officer backlog',
                    'detail' => 'Monitor open workload held by verification officers in your scope.',
                    'href' => '/governance',
                    'count' => $subordinateBacklog,
                    'tone' => $this->toneForCount($subordinateBacklog, 3, 8),
                ],
            ],
            User::ROLE_VERIFICATOR => [
                [
                    'title' => 'Continue verification work',
                    'detail' => 'Assigned cases remain in your verification queue.',
                    'href' => '/workflow',
                    'count' => $this->casesAwaitingViewerAction($user, $caseFiles)->count(),
                    'tone' => $this->toneForCount($this->casesAwaitingViewerAction($user, $caseFiles)->count(), 2, 5),
                ],
                [
                    'title' => 'Resolve overdue verifications',
                    'detail' => 'Focus on assigned verification cases that have breached SLA.',
                    'href' => '/workflow',
                    'count' => $this->countOverdueCases($this->casesForSubject($user, $caseFiles)->where('stage', '!=', 'completed'), $casePhaseKpis),
                    'tone' => $this->toneForCount($this->countOverdueCases($this->casesForSubject($user, $caseFiles)->where('stage', '!=', 'completed'), $casePhaseKpis), 1, 2),
                ],
            ],
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => [
                [
                    'title' => 'Delegate verified reports',
                    'detail' => 'Verified cases are waiting for investigator assignment.',
                    'href' => '/workflow',
                    'count' => $caseFiles->where('stage', 'verified')->where('current_role', User::ROLE_SUPERVISOR_OF_INVESTIGATOR)->count(),
                    'tone' => $this->toneForCount($caseFiles->where('stage', 'verified')->where('current_role', User::ROLE_SUPERVISOR_OF_INVESTIGATOR)->count(), 2, 5),
                ],
                [
                    'title' => 'Approve investigation outputs',
                    'detail' => 'Investigation packages are waiting for supervisory approval or return.',
                    'href' => '/workflow/approvals',
                    'count' => $caseFiles->where('stage', 'investigation_review')->where('current_role', User::ROLE_SUPERVISOR_OF_INVESTIGATOR)->count(),
                    'tone' => $this->toneForCount($caseFiles->where('stage', 'investigation_review')->where('current_role', User::ROLE_SUPERVISOR_OF_INVESTIGATOR)->count(), 2, 4),
                ],
                [
                    'title' => 'Follow up investigator backlog',
                    'detail' => 'Monitor open workload held by investigators in your scope.',
                    'href' => '/governance',
                    'count' => $subordinateBacklog,
                    'tone' => $this->toneForCount($subordinateBacklog, 3, 8),
                ],
            ],
            User::ROLE_INVESTIGATOR => [
                [
                    'title' => 'Continue investigation work',
                    'detail' => 'Assigned cases remain in your investigation queue.',
                    'href' => '/workflow',
                    'count' => $this->casesAwaitingViewerAction($user, $caseFiles)->count(),
                    'tone' => $this->toneForCount($this->casesAwaitingViewerAction($user, $caseFiles)->count(), 2, 5),
                ],
                [
                    'title' => 'Resolve overdue investigations',
                    'detail' => 'Focus on assigned investigation cases that have breached SLA.',
                    'href' => '/workflow',
                    'count' => $this->countOverdueCases($this->casesForSubject($user, $caseFiles)->where('stage', '!=', 'completed'), $casePhaseKpis),
                    'tone' => $this->toneForCount($this->countOverdueCases($this->casesForSubject($user, $caseFiles)->where('stage', '!=', 'completed'), $casePhaseKpis), 1, 2),
                ],
            ],
            User::ROLE_DIRECTOR => [
                [
                    'title' => 'Resolve final approvals',
                    'detail' => 'Director review is the final decision gate before case completion.',
                    'href' => '/workflow/approvals',
                    'count' => $caseFiles->where('stage', 'director_review')->where('current_role', User::ROLE_DIRECTOR)->count(),
                    'tone' => $this->toneForCount($caseFiles->where('stage', 'director_review')->where('current_role', User::ROLE_DIRECTOR)->count(), 1, 3),
                ],
                [
                    'title' => 'Review overdue operational cases',
                    'detail' => 'Escalate cases that have breached SLA anywhere in the internal workflow.',
                    'href' => '/governance',
                    'count' => $this->countOverdueCases($caseFiles, $casePhaseKpis),
                    'tone' => $this->toneForCount($this->countOverdueCases($caseFiles, $casePhaseKpis), 1, 3),
                ],
                [
                    'title' => 'Monitor control warnings',
                    'detail' => 'Use governance control status to intervene before integrity risk grows.',
                    'href' => '/governance',
                    'count' => $controls->where('status', 'warning')->count(),
                    'tone' => $this->toneForCount($controls->where('status', 'warning')->count(), 1, 2),
                ],
            ],
            User::ROLE_SYSTEM_ADMINISTRATOR => [
                [
                    'title' => 'Review control exceptions',
                    'detail' => 'Inspect warning controls and coordinate remediation with operational owners.',
                    'href' => '/governance',
                    'count' => $controls->where('status', 'warning')->count(),
                    'tone' => $this->toneForCount($controls->where('status', 'warning')->count(), 1, 2),
                ],
                [
                    'title' => 'Manage inactive internal users',
                    'detail' => 'Inactive accounts may block case assignment and approval flow.',
                    'href' => '/admin',
                    'count' => User::query()->whereIn('role', config('wbs.internal_roles', []))->where('is_active', false)->count(),
                    'tone' => $this->toneForCount(User::query()->whereIn('role', config('wbs.internal_roles', []))->where('is_active', false)->count(), 1, 3),
                ],
                [
                    'title' => 'Inspect recent audit activity',
                    'detail' => 'Operational evidence should remain fresh and queryable.',
                    'href' => '/governance',
                    'count' => $recentAuditLogs->count(),
                    'tone' => 'normal',
                ],
            ],
            User::ROLE_AUDITOR => [
                [
                    'title' => 'Review overdue operational cases',
                    'detail' => 'Focus on anonymized cases that have exceeded the configured KPI budget.',
                    'href' => '/governance',
                    'count' => $this->countOverdueCases($caseFiles, $casePhaseKpis),
                    'tone' => $this->toneForCount($this->countOverdueCases($caseFiles, $casePhaseKpis), 1, 3),
                ],
                [
                    'title' => 'Inspect verification cycle drift',
                    'detail' => 'Watch cases approaching or breaching the verification working-day budget.',
                    'href' => '/governance',
                    'count' => $this->countCasesByPhaseTone($caseFiles, $casePhaseKpis, 'verification', ['warning', 'critical']),
                    'tone' => $this->toneForCount($this->countCasesByPhaseTone($caseFiles, $casePhaseKpis, 'verification', ['warning', 'critical']), 1, 3),
                ],
                [
                    'title' => 'Inspect recent workflow audit evidence',
                    'detail' => 'Review metadata-only audit events to confirm operational traceability remains current.',
                    'href' => '/governance',
                    'count' => $recentAuditLogs->count(),
                    'tone' => 'normal',
                ],
            ],
            default => [],
        };
    }

    private function resolveScopedUsers(User $user, Collection $internalUsers): Collection
    {
        $scopedUsers = match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => $internalUsers->filter(
                fn (User $subject) => $subject->id === $user->id || $subject->role === User::ROLE_VERIFICATOR
            ),
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $internalUsers->filter(
                fn (User $subject) => $subject->id === $user->id || $subject->role === User::ROLE_INVESTIGATOR
            ),
            User::ROLE_DIRECTOR => $internalUsers->reject(
                fn (User $subject) => $subject->role === User::ROLE_AUDITOR
            ),
            User::ROLE_SYSTEM_ADMINISTRATOR => collect([$user]),
            User::ROLE_AUDITOR => collect([$user]),
            default => $internalUsers->where('id', $user->id),
        };

        return $scopedUsers
            ->sortBy(
                fn (User $subject) => sprintf(
                    '%02d-%s',
                    $subject->id === $user->id ? 0 : $this->roleSortIndex($subject->role),
                    $subject->name
                )
            )
            ->values();
    }

    private function buildScopeRow(User $subject, Collection $caseFiles, User $viewer, array $casePhaseKpis): array
    {
        $subjectCases = $this->casesForSubject($subject, $caseFiles);
        $queueStages = $this->queueStagesForRole($subject->role);
        $approvalStages = $this->approvalStagesForRole($subject->role);
        $lastActivityAt = $subjectCases->pluck('last_activity_at')->filter()->sortDesc()->first();

        return [
            'is_self' => $subject->id === $viewer->id,
            'subject_label' => $subject->id === $viewer->id ? "{$subject->name} (You)" : $subject->name,
            'role' => $subject->role,
            'role_label' => $subject->role_label,
            'unit' => $subject->operationalUnit(),
            'open_cases' => $subjectCases->where('stage', '!=', 'completed')->count(),
            'pending_queue' => $subjectCases
                ->filter(fn (CaseFile $caseFile) => $caseFile->current_role === $subject->role && in_array($caseFile->stage, $queueStages, true))
                ->count(),
            'pending_approvals' => $subjectCases
                ->filter(fn (CaseFile $caseFile) => $caseFile->current_role === $subject->role && in_array($caseFile->stage, $approvalStages, true))
                ->count(),
            'overdue_cases' => $this->countOverdueCases($subjectCases->where('stage', '!=', 'completed'), $casePhaseKpis),
            'completed_cases' => $subjectCases->where('stage', 'completed')->count(),
            'verification_kpi' => $this->aggregatePhaseKpi($subjectCases, $casePhaseKpis, 'verification'),
            'investigation_kpi' => $this->aggregatePhaseKpi($subjectCases, $casePhaseKpis, 'investigation'),
            'last_activity_at' => $lastActivityAt?->toISOString(),
        ];
    }

    private function scopeCasesForUser(User $user, Collection $caseFiles, Collection $scopedUsers): Collection
    {
        return match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => $caseFiles
                ->filter(fn (CaseFile $caseFile) => $caseFile->verification_supervisor_id === $user->id
                    || $scopedUsers->where('role', User::ROLE_VERIFICATOR)->pluck('id')->contains($caseFile->verificator_id))
                ->unique('id')
                ->values(),
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $caseFiles
                ->filter(fn (CaseFile $caseFile) => $caseFile->investigation_supervisor_id === $user->id
                    || $scopedUsers->where('role', User::ROLE_INVESTIGATOR)->pluck('id')->contains($caseFile->investigator_id))
                ->unique('id')
                ->values(),
            User::ROLE_DIRECTOR => $caseFiles->values(),
            User::ROLE_SYSTEM_ADMINISTRATOR => collect(),
            default => $this->casesForSubject($user, $caseFiles)->values(),
        };
    }

    private function casesAwaitingViewerAction(User $user, Collection $caseFiles): Collection
    {
        $stages = array_merge(
            $this->queueStagesForRole($user->role),
            $this->approvalStagesForRole($user->role)
        );

        return $caseFiles->filter(
            fn (CaseFile $caseFile) => $caseFile->current_role === $user->role && in_array($caseFile->stage, $stages, true)
        );
    }

    private function casesForSubject(User $subject, Collection $caseFiles): Collection
    {
        return match ($subject->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => $caseFiles->where('verification_supervisor_id', $subject->id),
            User::ROLE_VERIFICATOR => $caseFiles->where('verificator_id', $subject->id),
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => $caseFiles->where('investigation_supervisor_id', $subject->id),
            User::ROLE_INVESTIGATOR => $caseFiles->where('investigator_id', $subject->id),
            User::ROLE_DIRECTOR => $caseFiles->where('director_id', $subject->id),
            default => collect(),
        };
    }

    private function scopeLabelForUser(User $user): string
    {
        return match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => 'Your verification supervision workload plus all verification officer activity currently under that functional scope.',
            User::ROLE_VERIFICATOR => 'Your own verification workload, timeliness, and completion performance.',
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => 'Your investigation supervision workload plus all investigator activity currently under that functional scope.',
            User::ROLE_INVESTIGATOR => 'Your own investigation workload, timeliness, and completion performance.',
            User::ROLE_DIRECTOR => 'Your final approval responsibilities plus the broader internal workload across the whistleblowing process.',
            User::ROLE_SYSTEM_ADMINISTRATOR => 'Platform readiness, control health, and audit visibility across the whole environment.',
            User::ROLE_AUDITOR => 'Read-only monitoring of operational KPI, SLA utilization, and workflow audit metadata without confidential case content.',
            default => 'Your role-scoped governance indicators.',
        };
    }

    private function queueStagesForRole(string $role): array
    {
        return match ($role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => ['submitted'],
            User::ROLE_VERIFICATOR => ['verification_in_progress'],
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => ['verified'],
            User::ROLE_INVESTIGATOR => ['investigation_in_progress'],
            default => [],
        };
    }

    private function approvalStagesForRole(string $role): array
    {
        return match ($role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => ['verification_review'],
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => ['investigation_review'],
            User::ROLE_DIRECTOR => ['director_review'],
            default => [],
        };
    }

    private function countOverdueCases(Collection $caseFiles, array $casePhaseKpis): int
    {
        return $caseFiles
            ->where('stage', '!=', 'completed')
            ->filter(function (CaseFile $caseFile) use ($casePhaseKpis) {
                $activePhase = $this->activeOperationalPhaseForCase($caseFile);

                if (! $activePhase) {
                    return false;
                }

                $snapshot = $casePhaseKpis[$caseFile->id][$activePhase] ?? null;

                return is_array($snapshot) && ($snapshot['utilization_percent'] ?? 0) > 100;
            })
            ->count();
    }

    private function activeOperationalPhaseForCase(CaseFile $caseFile): ?string
    {
        return match ($caseFile->stage) {
            'submitted', 'verification_in_progress', 'verification_review' => 'verification',
            'verified', 'investigation_in_progress', 'investigation_review', 'director_review' => 'investigation',
            default => null,
        };
    }

    private function aggregatePhaseKpi(Collection $caseFiles, array $casePhaseKpis, string $phase): ?array
    {
        $phaseSnapshots = $caseFiles
            ->map(fn (CaseFile $caseFile) => $casePhaseKpis[$caseFile->id][$phase] ?? null)
            ->filter(fn ($snapshot) => is_array($snapshot))
            ->values();

        if ($phaseSnapshots->isEmpty()) {
            return null;
        }

        $activeSnapshots = $phaseSnapshots->where('status', 'in_progress')->values();
        $completedSnapshots = $phaseSnapshots->where('status', 'completed')->values();
        $focusSnapshot = $activeSnapshots
            ->sortByDesc(fn (array $snapshot) => $snapshot['utilization_percent'] ?? 0)
            ->first()
            ?? $completedSnapshots
                ->sortByDesc(fn (array $snapshot) => strtotime((string) ($snapshot['ended_at'] ?? $snapshot['last_activity_at'] ?? '')))
                ->first()
            ?? $phaseSnapshots->first();
        $averageElapsedHours = round(
            $phaseSnapshots->avg(fn (array $snapshot) => (float) ($snapshot['elapsed_working_hours'] ?? 0)),
            1,
        );

        return [
            'label' => $focusSnapshot['label'],
            'budget_hours' => $focusSnapshot['budget_hours'],
            'case_count' => $phaseSnapshots->count(),
            'active_case_count' => $activeSnapshots->count(),
            'completed_case_count' => $completedSnapshots->count(),
            'at_risk_case_count' => $phaseSnapshots
                ->filter(fn (array $snapshot) => ($snapshot['utilization_percent'] ?? 0) >= 80 && ($snapshot['utilization_percent'] ?? 0) <= 100)
                ->count(),
            'overdue_case_count' => $phaseSnapshots
                ->filter(fn (array $snapshot) => ($snapshot['utilization_percent'] ?? 0) > 100)
                ->count(),
            'average_elapsed_working_hours' => $averageElapsedHours,
            'focus_case_number' => $focusSnapshot['case_number'],
            'focus_case_title' => $focusSnapshot['case_title'],
            'focus_status' => $focusSnapshot['status'],
            'focus_elapsed_working_hours' => $focusSnapshot['elapsed_working_hours'],
            'focus_utilization_percent' => $focusSnapshot['utilization_percent'],
            'tone' => $focusSnapshot['tone'],
            'substeps' => $focusSnapshot['substeps'],
        ];
    }

    private function buildAuditorSpecificSection(
        User $user,
        Collection $caseFiles,
        array $casePhaseKpis,
        Collection $recentAuditLogs,
    ): array {
        $operationalCases = $caseFiles
            ->filter(fn (CaseFile $caseFile) => $caseFile->current_role !== User::ROLE_SYSTEM_ADMINISTRATOR)
            ->values();
        $openOperationalCases = $operationalCases->where('stage', '!=', 'completed');

        return [
            'role' => $user->role,
            'role_label' => $user->role_label,
            'scope_label' => 'Read-only view of anonymized operational workflow KPI, SLA drift, and audit trace metadata across internal officers.',
            'metrics' => [
                [
                    'label' => 'Monitored operational cases',
                    'value' => $openOperationalCases->count(),
                    'detail' => 'Open workflow cases currently monitored in anonymized form.',
                    'tone' => 'normal',
                ],
                [
                    'label' => 'Overdue operational cases',
                    'value' => $this->countOverdueCases($operationalCases, $casePhaseKpis),
                    'detail' => 'Cases whose active operational phase has exceeded the configured KPI budget.',
                    'tone' => $this->toneForCount($this->countOverdueCases($operationalCases, $casePhaseKpis), 1, 3),
                ],
                [
                    'label' => 'Avg verification cycle',
                    'value' => $this->averagePhaseElapsedHours($operationalCases, $casePhaseKpis, 'verification').' h',
                    'detail' => 'Average working-hour elapsed time across verification phase snapshots.',
                    'tone' => 'normal',
                ],
                [
                    'label' => 'Avg investigation cycle',
                    'value' => $this->averagePhaseElapsedHours($operationalCases, $casePhaseKpis, 'investigation').' h',
                    'detail' => 'Average working-hour elapsed time across investigation phase snapshots.',
                    'tone' => 'normal',
                ],
            ],
            'action_items' => $this->buildSpecificActionItems(
                $user,
                $operationalCases,
                $casePhaseKpis,
                [],
                collect(),
                collect(),
                $recentAuditLogs
            ),
            'scope_rows' => [],
            'case_rows' => $operationalCases
                ->sortByDesc(fn (CaseFile $caseFile) => $caseFile->last_activity_at?->getTimestamp() ?? 0)
                ->values()
                ->map(fn (CaseFile $caseFile) => $this->buildAuditorCaseRow($caseFile, $casePhaseKpis))
                ->all(),
        ];
    }

    private function buildAuditorCaseRow(CaseFile $caseFile, array $casePhaseKpis): array
    {
        $milestones = $this->operationalKpiService->buildCaseStageMilestones($caseFile);
        $verificationKpi = $this->transformAuditorPhaseSnapshot($casePhaseKpis[$caseFile->id]['verification'] ?? null, $caseFile);
        $investigationKpi = $this->transformAuditorPhaseSnapshot($casePhaseKpis[$caseFile->id]['investigation'] ?? null, $caseFile);
        [$slaStatus, $slaStatusLabel, $slaTone] = $this->auditorSlaStatus($caseFile, $verificationKpi, $investigationKpi);

        return [
            'audit_case_id' => $caseFile->case_number,
            'stage' => $caseFile->stage,
            'stage_label' => config("wbs.case_stages.{$caseFile->stage}", $caseFile->stage),
            'status' => $caseFile->report?->status,
            'current_role' => $caseFile->current_role,
            'current_role_label' => config("wbs.roles.{$caseFile->current_role}", $caseFile->current_role),
            'assigned_unit' => $caseFile->assigned_unit,
            'submitted_at' => $milestones['submitted_at'],
            'verification_started_at' => $milestones['verification_started_at'],
            'verification_completed_at' => $milestones['verification_completed_at'],
            'investigation_started_at' => $milestones['investigation_started_at'],
            'investigation_completed_at' => $milestones['investigation_completed_at'],
            'director_decided_at' => $milestones['director_decided_at'],
            'last_activity_at' => $caseFile->last_activity_at?->toISOString(),
            'sla_status' => $slaStatus,
            'sla_status_label' => $slaStatusLabel,
            'sla_tone' => $slaTone,
            'verification_kpi' => $verificationKpi,
            'investigation_kpi' => $investigationKpi,
        ];
    }

    private function transformAuditorPhaseSnapshot(?array $snapshot, CaseFile $caseFile): ?array
    {
        if (! is_array($snapshot)) {
            return null;
        }

        $utilizationPercent = (float) ($snapshot['utilization_percent'] ?? 0);

        return [
            'label' => $snapshot['label'] ?? 'Operational KPI',
            'budget_hours' => (float) ($snapshot['budget_hours'] ?? 0),
            'case_count' => 1,
            'active_case_count' => ($snapshot['status'] ?? 'in_progress') === 'in_progress' ? 1 : 0,
            'completed_case_count' => ($snapshot['status'] ?? null) === 'completed' ? 1 : 0,
            'at_risk_case_count' => $utilizationPercent >= 80 && $utilizationPercent <= 100 ? 1 : 0,
            'overdue_case_count' => $utilizationPercent > 100 ? 1 : 0,
            'average_elapsed_working_hours' => (float) ($snapshot['elapsed_working_hours'] ?? 0),
            'focus_case_number' => $caseFile->case_number,
            'focus_case_title' => null,
            'focus_status' => $snapshot['status'] ?? 'in_progress',
            'focus_elapsed_working_hours' => (float) ($snapshot['elapsed_working_hours'] ?? 0),
            'focus_utilization_percent' => $utilizationPercent,
            'tone' => $snapshot['tone'] ?? 'normal',
            'substeps' => $snapshot['substeps'] ?? [],
        ];
    }

    private function transformAuditLog(AuditLog $log, User $viewer): array
    {
        if ($viewer->hasRole(User::ROLE_AUDITOR)) {
            return [
                'id' => $log->id,
                'action' => $log->action,
                'actor_role' => $log->actor_role,
                'actor_name' => null,
                'happened_at' => $log->happened_at?->toISOString(),
                'context' => $this->sanitizeAuditContextForAuditor($log),
            ];
        }

        return [
            'id' => $log->id,
            'action' => $log->action,
            'actor_role' => $log->actor_role,
            'actor_name' => $log->actor_name,
            'happened_at' => $log->happened_at?->toISOString(),
            'context' => $log->context ?? [],
        ];
    }

    private function sanitizeAuditContextForAuditor(AuditLog $log): array
    {
        $caseFile = $log->caseFile;

        return array_filter([
            'case_reference' => $caseFile?->case_number,
            'stage' => $caseFile?->stage,
            'status' => $caseFile?->report?->status,
            'assigned_role' => $caseFile?->current_role,
            'assigned_unit' => $caseFile?->assigned_unit,
        ], fn ($value) => $value !== null && $value !== '');
    }

    /**
     * @param  list<'normal'|'warning'|'critical'>  $tones
     */
    private function countCasesByPhaseTone(Collection $caseFiles, array $casePhaseKpis, string $phase, array $tones): int
    {
        return $caseFiles
            ->filter(function (CaseFile $caseFile) use ($casePhaseKpis, $phase, $tones) {
                $snapshot = $casePhaseKpis[$caseFile->id][$phase] ?? null;

                return is_array($snapshot) && in_array($snapshot['tone'] ?? 'normal', $tones, true);
            })
            ->count();
    }

    private function averagePhaseElapsedHours(Collection $caseFiles, array $casePhaseKpis, string $phase): string
    {
        $phaseSnapshots = $caseFiles
            ->map(fn (CaseFile $caseFile) => $casePhaseKpis[$caseFile->id][$phase] ?? null)
            ->filter(fn ($snapshot) => is_array($snapshot))
            ->values();

        if ($phaseSnapshots->isEmpty()) {
            return '0';
        }

        $average = round(
            $phaseSnapshots->avg(fn (array $snapshot) => (float) ($snapshot['elapsed_working_hours'] ?? 0)),
            1,
        );

        return rtrim(rtrim(number_format($average, 1, '.', ''), '0'), '.');
    }

    /**
     * @return array{0:'on_track'|'at_risk'|'overdue'|'closed', 1:string, 2:'normal'|'warning'|'critical'}
     */
    private function auditorSlaStatus(CaseFile $caseFile, ?array $verificationKpi, ?array $investigationKpi): array
    {
        if ($caseFile->stage === 'completed') {
            return ['closed', 'Closed', 'normal'];
        }

        $activeSnapshot = match ($this->activeOperationalPhaseForCase($caseFile)) {
            'verification' => $verificationKpi,
            'investigation' => $investigationKpi,
            default => null,
        };

        $tone = $activeSnapshot['tone'] ?? 'normal';

        return match ($tone) {
            'critical' => ['overdue', 'Overdue', 'critical'],
            'warning' => ['at_risk', 'At risk', 'warning'],
            default => ['on_track', 'On track', 'normal'],
        };
    }

    private function toneForCount(int $count, int $warningThreshold = 1, int $criticalThreshold = 3): string
    {
        if ($count >= $criticalThreshold) {
            return 'critical';
        }

        if ($count >= $warningThreshold) {
            return 'warning';
        }

        return 'normal';
    }

    private function roleSortIndex(string $role): int
    {
        return match ($role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => 1,
            User::ROLE_VERIFICATOR => 2,
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => 3,
            User::ROLE_INVESTIGATOR => 4,
            User::ROLE_DIRECTOR => 5,
            User::ROLE_SYSTEM_ADMINISTRATOR => 6,
            User::ROLE_AUDITOR => 7,
            default => 99,
        };
    }
}
