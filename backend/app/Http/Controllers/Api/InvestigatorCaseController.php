<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignCaseRequest;
use App\Http\Requests\UpdateCaseStatusRequest;
use App\Models\CaseFile;
use App\Services\CaseWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvestigatorCaseController extends Controller
{
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
