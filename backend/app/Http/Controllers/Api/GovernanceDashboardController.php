<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\GovernanceControl;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class GovernanceDashboardController extends Controller
{
    #[OA\Get(
        path: '/api/governance/dashboard',
        operationId: 'getGovernanceDashboard',
        summary: 'Get governance dashboard data',
        description: 'Returns governance metrics, control monitoring, and recent audit activity for oversight analysis.',
        tags: ['Governance Dashboard'],
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
        abort_unless($request->user()?->isInternalUser(), 403, 'The governance dashboard is restricted to internal roles.');

        $reports = Report::query()->get();
        $caseFiles = CaseFile::query()->get();
        $controls = GovernanceControl::query()->orderBy('code')->get();
        $recentAuditLogs = AuditLog::query()->latest('happened_at')->limit(8)->get();

        $triagedCases = $caseFiles->filter(fn (CaseFile $caseFile) => $caseFile->triaged_at && $caseFile->report?->submitted_at);

        $averageTriageHours = $triagedCases->isEmpty()
            ? 0
            : round($triagedCases->avg(fn (CaseFile $caseFile) => $caseFile->report->submitted_at->diffInHours($caseFile->triaged_at)), 1);

        return response()->json([
            'data' => [
                'metrics' => [
                    'total_reports' => $reports->count(),
                    'open_cases' => $caseFiles->where('stage', '!=', 'completed')->count(),
                    'completed_cases' => $caseFiles->where('stage', 'completed')->count(),
                    'confidential_share' => $reports->isEmpty()
                        ? 0
                        : round(($reports->where('anonymity_level', 'anonymous')->count() / $reports->count()) * 100, 1),
                    'overdue_cases' => $caseFiles
                        ->where('stage', '!=', 'completed')
                        ->filter(fn (CaseFile $caseFile) => $caseFile->sla_due_at && $caseFile->sla_due_at->isPast())
                        ->count(),
                    'average_triage_hours' => $averageTriageHours,
                    'verification_queue' => $caseFiles->whereIn('stage', ['submitted', 'verification_in_progress', 'verification_review'])->count(),
                    'investigation_queue' => $caseFiles->whereIn('stage', ['verified', 'investigation_in_progress', 'investigation_review'])->count(),
                    'director_review_queue' => $caseFiles->where('stage', 'director_review')->count(),
                ],
                'risk_distribution' => $this->summarise($reports, 'severity'),
                'status_breakdown' => $this->summarise($caseFiles, 'stage'),
                'controls' => $controls->map(fn (GovernanceControl $control) => [
                    'code' => $control->code,
                    'name' => $control->name,
                    'description' => $control->description,
                    'owner_role' => $control->owner_role,
                    'status' => $control->status,
                    'target_metric' => $control->target_metric,
                    'current_metric' => $control->current_metric,
                    'notes' => $control->notes,
                ]),
                'recent_audit_logs' => $recentAuditLogs->map(fn (AuditLog $log) => [
                    'action' => $log->action,
                    'actor_role' => $log->actor_role,
                    'actor_name' => $log->actor_name,
                    'happened_at' => $log->happened_at?->toISOString(),
                    'context' => $log->context,
                ]),
            ],
        ]);
    }

    private function summarise(Collection $items, string $field): array
    {
        return $items
            ->groupBy($field)
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'value' => $group->count(),
            ])
            ->values()
            ->all();
    }
}
