<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\GovernanceControl;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class GovernanceDashboardController extends Controller
{
    public function index(): JsonResponse
    {
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
                    'open_cases' => $caseFiles->whereNotIn('stage', ['resolved', 'closed'])->count(),
                    'resolved_cases' => $caseFiles->whereIn('stage', ['resolved', 'closed'])->count(),
                    'anonymous_share' => $reports->isEmpty()
                        ? 0
                        : round(($reports->where('anonymity_level', 'anonymous')->count() / $reports->count()) * 100, 1),
                    'overdue_cases' => $caseFiles
                        ->whereNotIn('stage', ['resolved', 'closed'])
                        ->filter(fn (CaseFile $caseFile) => $caseFile->sla_due_at && $caseFile->sla_due_at->isPast())
                        ->count(),
                    'average_triage_hours' => $averageTriageHours,
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
