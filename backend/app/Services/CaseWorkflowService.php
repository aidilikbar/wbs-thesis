<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\CaseTimelineEvent;
use App\Models\Report;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CaseWorkflowService
{
    private const REPORT_STATUSES = [
        'intake' => 'submitted',
        'assessment' => 'under_review',
        'investigation' => 'investigating',
        'escalated' => 'investigating',
        'resolved' => 'resolved',
        'closed' => 'closed',
    ];

    public function submitReport(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $submittedAt = now();

            $report = Report::query()->create([
                'uuid' => (string) Str::uuid(),
                'tracking_token' => Str::upper(Str::random(12)),
                'title' => $payload['title'],
                'category' => $payload['category'],
                'description' => $payload['description'],
                'incident_date' => $payload['incident_date'] ?? null,
                'incident_location' => $payload['incident_location'] ?? null,
                'accused_party' => $payload['accused_party'] ?? null,
                'evidence_summary' => $payload['evidence_summary'] ?? null,
                'anonymity_level' => $payload['anonymity_level'],
                'reporter_name' => $payload['reporter_name'] ?? null,
                'reporter_email' => $payload['reporter_email'] ?? null,
                'reporter_phone' => $payload['reporter_phone'] ?? null,
                'requested_follow_up' => $payload['requested_follow_up'] ?? true,
                'witness_available' => $payload['witness_available'] ?? false,
                'governance_tags' => array_values($payload['governance_tags'] ?? []),
                'severity' => $this->determineSeverity(
                    $payload['category'],
                    $payload['governance_tags'] ?? [],
                    $payload['witness_available'] ?? false,
                ),
                'status' => self::REPORT_STATUSES['intake'],
                'submitted_at' => $submittedAt,
                'last_public_update_at' => $submittedAt,
            ]);

            $report->forceFill([
                'public_reference' => $this->formatSequence('WBS', $report->id),
            ])->save();

            $caseFile = $report->caseFile()->create([
                'case_number' => $this->formatSequence('CASE', $report->id),
                'stage' => 'intake',
                'disposition' => 'new',
                'assigned_unit' => 'Intake & Assessment',
                'triaged_at' => null,
                'sla_due_at' => $submittedAt->copy()->addDays(14),
                'last_activity_at' => $submittedAt,
                'confidentiality_level' => $payload['anonymity_level'],
                'escalation_required' => in_array('retaliation-risk', $payload['governance_tags'] ?? [], true),
            ]);

            $this->addTimelineEvent(
                report: $report,
                caseFile: $caseFile,
                visibility: 'public',
                stage: 'intake',
                headline: 'Report received',
                detail: 'Your disclosure has been registered and queued for governance triage.',
                actorRole: 'system',
                actorName: 'WBS Intake',
                occurredAt: $submittedAt,
            );

            $this->addTimelineEvent(
                report: $report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'intake',
                headline: 'Case created for intake',
                detail: 'The case was opened and is awaiting assessment ownership.',
                actorRole: 'intake_officer',
                actorName: 'WBS Intake',
                occurredAt: $submittedAt,
            );

            $this->recordAudit(
                action: 'report_submitted',
                auditable: $report,
                report: $report,
                caseFile: $caseFile,
                actorRole: 'whistleblower',
                actorName: $payload['anonymity_level'] === 'identified'
                    ? ($payload['reporter_name'] ?? 'Identified reporter')
                    : 'Protected reporter',
                context: [
                    'category' => $report->category,
                    'severity' => $report->severity,
                    'anonymity_level' => $report->anonymity_level,
                ],
            );

            $this->recordAudit(
                action: 'case_created',
                auditable: $caseFile,
                report: $report,
                caseFile: $caseFile,
                actorRole: 'system',
                actorName: 'WBS Intake',
                context: [
                    'stage' => $caseFile->stage,
                    'assigned_unit' => $caseFile->assigned_unit,
                ],
            );

            return [
                'report' => $report->fresh(['caseFile', 'timelineEvents']),
                'caseFile' => $caseFile->fresh(),
            ];
        });
    }

    public function assignCase(CaseFile $caseFile, array $payload): CaseFile
    {
        return DB::transaction(function () use ($caseFile, $payload) {
            $assignedAt = now();
            $stage = $caseFile->stage === 'intake' ? 'assessment' : $caseFile->stage;

            $caseFile->forceFill([
                'stage' => $stage,
                'assigned_unit' => $payload['assigned_unit'],
                'assigned_to' => $payload['owner_name'],
                'triaged_at' => $caseFile->triaged_at ?? $assignedAt,
                'sla_due_at' => $assignedAt->copy()->addDays($payload['due_in_days'] ?? 14),
                'last_activity_at' => $assignedAt,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$stage],
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $stage,
                headline: 'Case assigned',
                detail: sprintf(
                    'Assigned to %s within %s for structured assessment.',
                    $payload['owner_name'],
                    $payload['assigned_unit'],
                ),
                actorRole: 'case_manager',
                actorName: $payload['owner_name'],
                occurredAt: $assignedAt,
            );

            $this->recordAudit(
                action: 'case_assigned',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: 'case_manager',
                actorName: $payload['owner_name'],
                context: [
                    'assigned_unit' => $payload['assigned_unit'],
                    'stage' => $stage,
                ],
            );

            return $caseFile->fresh(['report', 'timelineEvents']);
        });
    }

    public function updateCaseStatus(CaseFile $caseFile, array $payload): CaseFile
    {
        return DB::transaction(function () use ($caseFile, $payload) {
            $updatedAt = now();
            $stage = $payload['stage'];
            $actorName = $payload['actor_name'] ?? $caseFile->assigned_to ?? 'Investigation Desk';

            $caseFile->forceFill([
                'stage' => $stage,
                'disposition' => in_array($stage, ['resolved', 'closed'], true) ? $stage : $caseFile->disposition,
                'last_activity_at' => $updatedAt,
                'triaged_at' => $caseFile->triaged_at ?? ($stage !== 'intake' ? $updatedAt : null),
                'escalation_required' => $stage === 'escalated' ? true : $caseFile->escalation_required,
                'notes' => $payload['internal_note'] ?? $caseFile->notes,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$stage] ?? 'under_review',
                'last_public_update_at' => ($payload['publish_update'] ?? false)
                    ? $updatedAt
                    : $caseFile->report->last_public_update_at,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $stage,
                headline: sprintf('Case moved to %s', $this->labelForStage($stage)),
                detail: $payload['internal_note'] ?? 'Status updated through investigator workflow.',
                actorRole: 'investigator',
                actorName: $actorName,
                occurredAt: $updatedAt,
            );

            if (($payload['publish_update'] ?? false) && ! empty($payload['public_message'])) {
                $this->addTimelineEvent(
                    report: $caseFile->report,
                    caseFile: $caseFile,
                    visibility: 'public',
                    stage: $stage,
                    headline: sprintf('%s update', $this->labelForStage($stage)),
                    detail: $payload['public_message'],
                    actorRole: 'case_manager',
                    actorName: $actorName,
                    occurredAt: $updatedAt,
                );
            }

            $this->recordAudit(
                action: 'case_status_updated',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: 'investigator',
                actorName: $actorName,
                context: [
                    'stage' => $stage,
                    'published_update' => $payload['publish_update'] ?? false,
                ],
            );

            return $caseFile->fresh(['report', 'timelineEvents']);
        });
    }

    private function determineSeverity(string $category, array $governanceTags, bool $witnessAvailable): string
    {
        if (in_array('retaliation-risk', $governanceTags, true)) {
            return 'critical';
        }

        $baseSeverity = match ($category) {
            'bribery', 'procurement', 'fraud' => 'high',
            'abuse_of_authority', 'conflict_of_interest', 'retaliation' => 'medium',
            default => 'low',
        };

        if ($baseSeverity === 'medium' && $witnessAvailable) {
            return 'high';
        }

        return $baseSeverity;
    }

    private function formatSequence(string $prefix, int $id): string
    {
        return sprintf('%s-%s-%04d', $prefix, now()->format('Y'), $id);
    }

    private function labelForStage(string $stage): string
    {
        return config("wbs.case_stages.{$stage}", Str::headline($stage));
    }

    private function addTimelineEvent(
        Report $report,
        CaseFile $caseFile,
        string $visibility,
        string $stage,
        string $headline,
        string $detail,
        string $actorRole,
        string $actorName,
        $occurredAt,
    ): void {
        CaseTimelineEvent::query()->create([
            'report_id' => $report->id,
            'case_file_id' => $caseFile->id,
            'visibility' => $visibility,
            'stage' => $stage,
            'headline' => $headline,
            'detail' => $detail,
            'actor_role' => $actorRole,
            'actor_name' => $actorName,
            'occurred_at' => $occurredAt,
        ]);
    }

    private function recordAudit(
        string $action,
        Model $auditable,
        Report $report,
        CaseFile $caseFile,
        string $actorRole,
        string $actorName,
        array $context = [],
    ): void {
        AuditLog::query()->create([
            'auditable_type' => $auditable::class,
            'auditable_id' => $auditable->getKey(),
            'report_id' => $report->id,
            'case_file_id' => $caseFile->id,
            'actor_role' => $actorRole,
            'actor_name' => $actorName,
            'action' => $action,
            'context' => $context,
            'happened_at' => now(),
        ]);
    }
}
