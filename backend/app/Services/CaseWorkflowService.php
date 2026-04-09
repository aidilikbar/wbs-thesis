<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\CaseTimelineEvent;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CaseWorkflowService
{
    private const REPORT_STATUSES = [
        'submitted' => 'submitted',
        'verification_in_progress' => 'verification_in_progress',
        'verification_review' => 'verification_review',
        'verified' => 'verified',
        'investigation_in_progress' => 'investigation_in_progress',
        'investigation_review' => 'investigation_review',
        'director_review' => 'director_review',
        'completed' => 'completed',
    ];

    public function submitReport(User $reporter, array $payload): array
    {
        return DB::transaction(function () use ($reporter, $payload) {
            $submittedAt = now();
            $verificationSupervisor = $this->requireActiveUserByRole(User::ROLE_SUPERVISOR_OF_VERIFICATOR);

            $report = Report::query()->create([
                'reporter_user_id' => $reporter->id,
                'uuid' => (string) Str::uuid(),
                'tracking_token' => Str::upper(Str::random(12)),
                'title' => $payload['title'],
                'category' => $payload['category'],
                'description' => $payload['description'],
                'incident_date' => $payload['incident_date'] ?? null,
                'incident_location' => $payload['incident_location'] ?? null,
                'accused_party' => $payload['accused_party'] ?? null,
                'evidence_summary' => $payload['evidence_summary'] ?? null,
                'anonymity_level' => $payload['confidentiality_level'],
                'reporter_name' => $reporter->name,
                'reporter_email' => $reporter->email,
                'reporter_phone' => $reporter->phone,
                'requested_follow_up' => $payload['requested_follow_up'] ?? true,
                'witness_available' => $payload['witness_available'] ?? false,
                'governance_tags' => array_values($payload['governance_tags'] ?? []),
                'severity' => $this->determineSeverity(
                    $payload['category'],
                    $payload['governance_tags'] ?? [],
                    $payload['witness_available'] ?? false,
                ),
                'status' => self::REPORT_STATUSES['submitted'],
                'submitted_at' => $submittedAt,
                'last_public_update_at' => $submittedAt,
            ]);

            $report->forceFill([
                'public_reference' => $this->formatSequence('WBS', $report->id),
            ])->save();

            $caseFile = $report->caseFile()->create([
                'case_number' => $this->formatSequence('CASE', $report->id),
                'stage' => 'submitted',
                'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
                'disposition' => 'submitted',
                'assigned_unit' => $verificationSupervisor->unit ?: $verificationSupervisor->role_label,
                'assigned_to' => $verificationSupervisor->name,
                'verification_supervisor_id' => $verificationSupervisor->id,
                'investigation_supervisor_id' => $this->findActiveUserByRole(User::ROLE_SUPERVISOR_OF_INVESTIGATOR)?->id,
                'director_id' => $this->findActiveUserByRole(User::ROLE_DIRECTOR)?->id,
                'sla_due_at' => $submittedAt->copy()->addDays(14),
                'last_activity_at' => $submittedAt,
                'confidentiality_level' => $payload['confidentiality_level'],
                'escalation_required' => in_array('retaliation-risk', $payload['governance_tags'] ?? [], true),
                'notes' => $payload['description'],
            ]);

            $this->addTimelineEvent(
                report: $report,
                caseFile: $caseFile,
                visibility: 'public',
                stage: 'submitted',
                headline: 'Report received',
                detail: 'Your report has been registered and forwarded to the verification supervisor.',
                actorRole: 'system',
                actorName: 'KPK Whistleblowing System',
                occurredAt: $submittedAt,
            );

            $this->addTimelineEvent(
                report: $report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'submitted',
                headline: 'Report submitted by registered reporter',
                detail: sprintf(
                    'Reporter %s submitted the case and it is now waiting for delegation by the verification supervisor.',
                    $reporter->name
                ),
                actorRole: User::ROLE_REPORTER,
                actorName: $reporter->name,
                occurredAt: $submittedAt,
            );

            $this->recordAudit(
                action: 'report_submitted',
                auditable: $report,
                report: $report,
                caseFile: $caseFile,
                actorRole: $reporter->role,
                actorName: $reporter->name,
                context: [
                    'category' => $report->category,
                    'severity' => $report->severity,
                    'confidentiality_level' => $report->anonymity_level,
                    'verification_supervisor_id' => $verificationSupervisor->id,
                ],
            );

            $this->recordAudit(
                action: 'case_created',
                auditable: $caseFile,
                report: $report,
                caseFile: $caseFile,
                actorRole: 'system',
                actorName: 'KPK Whistleblowing System',
                context: [
                    'stage' => $caseFile->stage,
                    'current_role' => $caseFile->current_role,
                    'assigned_unit' => $caseFile->assigned_unit,
                ],
            );

            return [
                'report' => $report->fresh(['caseFile', 'timelineEvents']),
                'caseFile' => $caseFile->fresh(),
            ];
        });
    }

    public function updateReporterReport(Report $report, User $reporter, array $payload): Report
    {
        if ((int) $report->reporter_user_id !== (int) $reporter->id) {
            throw ValidationException::withMessages([
                'report' => 'You may update only your own reports.',
            ]);
        }

        if ($report->status === self::REPORT_STATUSES['completed']) {
            throw ValidationException::withMessages([
                'report' => 'Completed reports can no longer be edited by the reporter.',
            ]);
        }

        return DB::transaction(function () use ($report, $reporter, $payload) {
            $updatedAt = now();
            $caseFile = $report->caseFile()->firstOrFail();
            $nextSeverity = $this->determineSeverity(
                $payload['category'],
                $payload['governance_tags'] ?? [],
                $payload['witness_available'] ?? false,
            );

            $report->forceFill([
                'title' => $payload['title'],
                'category' => $payload['category'],
                'description' => $payload['description'],
                'incident_date' => $payload['incident_date'] ?? null,
                'incident_location' => $payload['incident_location'] ?? null,
                'accused_party' => $payload['accused_party'] ?? null,
                'evidence_summary' => $payload['evidence_summary'] ?? null,
                'anonymity_level' => $payload['confidentiality_level'],
                'requested_follow_up' => $payload['requested_follow_up'] ?? true,
                'witness_available' => $payload['witness_available'] ?? false,
                'governance_tags' => array_values($payload['governance_tags'] ?? []),
                'severity' => $nextSeverity,
            ])->save();

            $caseFile->forceFill([
                'confidentiality_level' => $payload['confidentiality_level'],
                'escalation_required' => in_array('retaliation-risk', $payload['governance_tags'] ?? [], true),
                'notes' => $payload['description'],
                'last_activity_at' => $updatedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: 'Reporter updated report details',
                detail: 'The reporter revised the allegation details and supporting context after submission.',
                actorRole: $reporter->role,
                actorName: $reporter->name,
                occurredAt: $updatedAt,
            );

            $this->recordAudit(
                action: 'report_updated_by_reporter',
                auditable: $report,
                report: $report,
                caseFile: $caseFile,
                actorRole: $reporter->role,
                actorName: $reporter->name,
                context: [
                    'status' => $report->status,
                    'category' => $report->category,
                    'severity' => $report->severity,
                    'confidentiality_level' => $report->anonymity_level,
                ],
            );

            return $report->fresh(['caseFile']);
        });
    }

    public function delegateToVerificator(
        CaseFile $caseFile,
        User $supervisor,
        User $verificator,
        array $payload,
    ): CaseFile {
        $this->ensureCaseStage($caseFile, ['submitted']);
        $this->ensureActiveAssignee($verificator, User::ROLE_VERIFICATOR);
        $this->ensureOwnership($caseFile, $supervisor, 'verification_supervisor_id');

        return DB::transaction(function () use ($caseFile, $supervisor, $verificator, $payload) {
            $assignedAt = now();

            $caseFile->forceFill([
                'stage' => 'verification_in_progress',
                'current_role' => User::ROLE_VERIFICATOR,
                'disposition' => 'verification_in_progress',
                'assigned_unit' => $payload['assigned_unit']
                    ?? ($verificator->unit ?: $verificator->role_label),
                'assigned_to' => $verificator->name,
                'verificator_id' => $verificator->id,
                'triaged_at' => $caseFile->triaged_at ?? $assignedAt,
                'sla_due_at' => $assignedAt->copy()->addDays($payload['due_in_days'] ?? 7),
                'last_activity_at' => $assignedAt,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES['verification_in_progress'],
                'last_public_update_at' => $assignedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'verification_in_progress',
                headline: 'Verification delegated',
                detail: sprintf(
                    'The verification supervisor delegated the report to %s for verification.',
                    $verificator->name
                ),
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $assignedAt,
            );

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'public',
                stage: 'verification_in_progress',
                headline: 'Verification started',
                detail: 'Your report has entered the verification stage and is being assessed by the KPK verification function.',
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $assignedAt,
            );

            $this->recordAudit(
                action: 'verification_delegated',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                context: [
                    'verificator_id' => $verificator->id,
                    'assigned_unit' => $caseFile->assigned_unit,
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    public function submitVerification(CaseFile $caseFile, User $verificator, array $payload): CaseFile
    {
        $this->ensureCaseStage($caseFile, ['verification_in_progress']);
        $this->ensureOwnership($caseFile, $verificator, 'verificator_id');

        return DB::transaction(function () use ($caseFile, $verificator, $payload) {
            $submittedAt = now();

            $caseFile->forceFill([
                'stage' => 'verification_review',
                'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
                'disposition' => 'verification_review',
                'assigned_unit' => $caseFile->verificationSupervisor?->unit ?: $caseFile->verificationSupervisor?->role_label,
                'assigned_to' => $caseFile->verificationSupervisor?->name,
                'last_activity_at' => $submittedAt,
                'notes' => $payload['internal_note'],
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES['verification_review'],
                'last_public_update_at' => ($payload['publish_update'] ?? false) ? $submittedAt : $caseFile->report->last_public_update_at,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'verification_review',
                headline: 'Verification submitted to supervisor',
                detail: $payload['internal_note'],
                actorRole: $verificator->role,
                actorName: $verificator->name,
                occurredAt: $submittedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: 'verification_review',
                headline: 'Verification review update',
                payload: $payload,
                actorRole: $verificator->role,
                actorName: $verificator->name,
                occurredAt: $submittedAt,
            );

            $this->recordAudit(
                action: 'verification_submitted',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $verificator->role,
                actorName: $verificator->name,
                context: [
                    'stage' => 'verification_review',
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    public function reviewVerification(CaseFile $caseFile, User $supervisor, array $payload): CaseFile
    {
        $this->ensureCaseStage($caseFile, ['verification_review']);
        $this->ensureOwnership($caseFile, $supervisor, 'verification_supervisor_id');

        return DB::transaction(function () use ($caseFile, $supervisor, $payload) {
            $reviewedAt = now();
            $approved = $payload['decision'] === 'approved';
            $investigationSupervisor = $approved
                ? $caseFile->investigationSupervisor ?: $this->requireActiveUserByRole(User::ROLE_SUPERVISOR_OF_INVESTIGATOR)
                : null;

            $caseFile->forceFill([
                'stage' => $approved ? 'verified' : 'verification_in_progress',
                'current_role' => $approved ? User::ROLE_SUPERVISOR_OF_INVESTIGATOR : User::ROLE_VERIFICATOR,
                'disposition' => $approved ? 'verified' : 'verification_rejected',
                'assigned_unit' => $approved
                    ? ($investigationSupervisor->unit ?: $investigationSupervisor->role_label)
                    : ($caseFile->verificator?->unit ?: $caseFile->verificator?->role_label),
                'assigned_to' => $approved
                    ? $investigationSupervisor->name
                    : $caseFile->verificator?->name,
                'investigation_supervisor_id' => $approved ? $investigationSupervisor->id : $caseFile->investigation_supervisor_id,
                'last_activity_at' => $reviewedAt,
                'notes' => $payload['internal_note'],
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$caseFile->stage],
                'last_public_update_at' => ($payload['publish_update'] ?? false) ? $reviewedAt : $caseFile->report->last_public_update_at,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: $approved ? 'Verification approved' : 'Verification returned for revision',
                detail: $payload['internal_note'],
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: $caseFile->stage,
                headline: $approved ? 'Verification completed' : 'Verification requires follow-up',
                payload: $payload,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->recordAudit(
                action: $approved ? 'verification_approved' : 'verification_rejected',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                context: [
                    'decision' => $payload['decision'],
                    'current_role' => $caseFile->current_role,
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    public function delegateToInvestigator(
        CaseFile $caseFile,
        User $supervisor,
        User $investigator,
        array $payload,
    ): CaseFile {
        $this->ensureCaseStage($caseFile, ['verified']);
        $this->ensureActiveAssignee($investigator, User::ROLE_INVESTIGATOR);
        $this->ensureOwnership($caseFile, $supervisor, 'investigation_supervisor_id');

        return DB::transaction(function () use ($caseFile, $supervisor, $investigator, $payload) {
            $assignedAt = now();

            $caseFile->forceFill([
                'stage' => 'investigation_in_progress',
                'current_role' => User::ROLE_INVESTIGATOR,
                'disposition' => 'investigation_in_progress',
                'assigned_unit' => $payload['assigned_unit']
                    ?? ($investigator->unit ?: $investigator->role_label),
                'assigned_to' => $investigator->name,
                'investigator_id' => $investigator->id,
                'sla_due_at' => $assignedAt->copy()->addDays($payload['due_in_days'] ?? 10),
                'last_activity_at' => $assignedAt,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES['investigation_in_progress'],
                'last_public_update_at' => $assignedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'investigation_in_progress',
                headline: 'Investigation delegated',
                detail: sprintf(
                    'The investigation supervisor delegated the verified report to %s.',
                    $investigator->name
                ),
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $assignedAt,
            );

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'public',
                stage: 'investigation_in_progress',
                headline: 'Investigation started',
                detail: 'Your report has entered the investigation stage and is being handled by the KPK investigation function.',
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $assignedAt,
            );

            $this->recordAudit(
                action: 'investigation_delegated',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                context: [
                    'investigator_id' => $investigator->id,
                    'assigned_unit' => $caseFile->assigned_unit,
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    public function submitInvestigation(CaseFile $caseFile, User $investigator, array $payload): CaseFile
    {
        $this->ensureCaseStage($caseFile, ['investigation_in_progress']);
        $this->ensureOwnership($caseFile, $investigator, 'investigator_id');

        return DB::transaction(function () use ($caseFile, $investigator, $payload) {
            $submittedAt = now();

            $caseFile->forceFill([
                'stage' => 'investigation_review',
                'current_role' => User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
                'disposition' => 'investigation_review',
                'assigned_unit' => $caseFile->investigationSupervisor?->unit ?: $caseFile->investigationSupervisor?->role_label,
                'assigned_to' => $caseFile->investigationSupervisor?->name,
                'last_activity_at' => $submittedAt,
                'notes' => $payload['internal_note'],
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES['investigation_review'],
                'last_public_update_at' => ($payload['publish_update'] ?? false) ? $submittedAt : $caseFile->report->last_public_update_at,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'investigation_review',
                headline: 'Investigation submitted to supervisor',
                detail: $payload['internal_note'],
                actorRole: $investigator->role,
                actorName: $investigator->name,
                occurredAt: $submittedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: 'investigation_review',
                headline: 'Investigation review update',
                payload: $payload,
                actorRole: $investigator->role,
                actorName: $investigator->name,
                occurredAt: $submittedAt,
            );

            $this->recordAudit(
                action: 'investigation_submitted',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $investigator->role,
                actorName: $investigator->name,
                context: [
                    'stage' => 'investigation_review',
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    public function reviewInvestigation(CaseFile $caseFile, User $supervisor, array $payload): CaseFile
    {
        $this->ensureCaseStage($caseFile, ['investigation_review']);
        $this->ensureOwnership($caseFile, $supervisor, 'investigation_supervisor_id');

        return DB::transaction(function () use ($caseFile, $supervisor, $payload) {
            $reviewedAt = now();
            $approved = $payload['decision'] === 'approved';
            $director = $approved
                ? $caseFile->director ?: $this->requireActiveUserByRole(User::ROLE_DIRECTOR)
                : null;

            $caseFile->forceFill([
                'stage' => $approved ? 'director_review' : 'investigation_in_progress',
                'current_role' => $approved ? User::ROLE_DIRECTOR : User::ROLE_INVESTIGATOR,
                'disposition' => $approved ? 'director_review' : 'investigation_rejected',
                'assigned_unit' => $approved
                    ? ($director->unit ?: $director->role_label)
                    : ($caseFile->investigator?->unit ?: $caseFile->investigator?->role_label),
                'assigned_to' => $approved ? $director->name : $caseFile->investigator?->name,
                'director_id' => $approved ? $director->id : $caseFile->director_id,
                'last_activity_at' => $reviewedAt,
                'notes' => $payload['internal_note'],
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$caseFile->stage],
                'last_public_update_at' => ($payload['publish_update'] ?? false) ? $reviewedAt : $caseFile->report->last_public_update_at,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: $approved ? 'Investigation approved' : 'Investigation returned for further analysis',
                detail: $payload['internal_note'],
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: $caseFile->stage,
                headline: $approved ? 'Investigation completed' : 'Investigation requires further analysis',
                payload: $payload,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->recordAudit(
                action: $approved ? 'investigation_approved' : 'investigation_rejected',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                context: [
                    'decision' => $payload['decision'],
                    'current_role' => $caseFile->current_role,
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    public function directorDecision(CaseFile $caseFile, User $director, array $payload): CaseFile
    {
        $this->ensureCaseStage($caseFile, ['director_review']);
        $this->ensureOwnership($caseFile, $director, 'director_id');

        return DB::transaction(function () use ($caseFile, $director, $payload) {
            $reviewedAt = now();
            $approved = $payload['decision'] === 'approved';

            $caseFile->forceFill([
                'stage' => $approved ? 'completed' : 'investigation_in_progress',
                'current_role' => $approved ? User::ROLE_DIRECTOR : User::ROLE_INVESTIGATOR,
                'disposition' => $approved ? 'completed' : 'director_rejected',
                'assigned_unit' => $approved
                    ? ($director->unit ?: $director->role_label)
                    : ($caseFile->investigator?->unit ?: $caseFile->investigator?->role_label),
                'assigned_to' => $approved ? $director->name : $caseFile->investigator?->name,
                'completed_at' => $approved ? $reviewedAt : null,
                'last_activity_at' => $reviewedAt,
                'notes' => $payload['internal_note'],
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$caseFile->stage],
                'last_public_update_at' => ($payload['publish_update'] ?? false) ? $reviewedAt : $caseFile->report->last_public_update_at,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: $approved ? 'Director approved report completion' : 'Director returned report for additional investigation',
                detail: $payload['internal_note'],
                actorRole: $director->role,
                actorName: $director->name,
                occurredAt: $reviewedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: $caseFile->stage,
                headline: $approved ? 'Report completed' : 'Report requires further investigation',
                payload: $payload,
                actorRole: $director->role,
                actorName: $director->name,
                occurredAt: $reviewedAt,
            );

            $this->recordAudit(
                action: $approved ? 'director_approved' : 'director_rejected',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $director->role,
                actorName: $director->name,
                context: [
                    'decision' => $payload['decision'],
                    'completed_at' => $caseFile->completed_at?->toISOString(),
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
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

        return $witnessAvailable && $baseSeverity !== 'critical'
            ? match ($baseSeverity) {
                'low' => 'medium',
                'medium' => 'high',
                default => $baseSeverity,
            }
            : $baseSeverity;
    }

    private function maybeAddPublicUpdate(
        CaseFile $caseFile,
        string $stage,
        string $headline,
        array $payload,
        string $actorRole,
        string $actorName,
        $occurredAt,
    ): void {
        if (! ($payload['publish_update'] ?? false) || empty($payload['public_message'])) {
            return;
        }

        $this->addTimelineEvent(
            report: $caseFile->report,
            caseFile: $caseFile,
            visibility: 'public',
            stage: $stage,
            headline: $headline,
            detail: $payload['public_message'],
            actorRole: $actorRole,
            actorName: $actorName,
            occurredAt: $occurredAt,
        );
    }

    private function ensureCaseStage(CaseFile $caseFile, array $allowedStages): void
    {
        if (! in_array($caseFile->stage, $allowedStages, true)) {
            throw ValidationException::withMessages([
                'case' => 'The case is not in the expected workflow stage for this action.',
            ]);
        }
    }

    private function ensureOwnership(CaseFile $caseFile, User $user, string $field): void
    {
        if ((int) $caseFile->{$field} !== (int) $user->id) {
            throw ValidationException::withMessages([
                'case' => 'This case is not assigned to your role instance.',
            ]);
        }
    }

    private function ensureActiveAssignee(User $user, string $role): void
    {
        if (! $user->is_active || ! $user->hasRole($role)) {
            throw ValidationException::withMessages([
                'assignee_user_id' => sprintf(
                    'The selected user must be an active %s.',
                    config("wbs.roles.{$role}", str($role)->replace('_', ' '))
                ),
            ]);
        }
    }

    private function requireActiveUserByRole(string $role): User
    {
        $user = $this->findActiveUserByRole($role);

        if (! $user) {
            throw ValidationException::withMessages([
                'workflow' => sprintf(
                    'At least one active %s must be configured by the system administrator.',
                    config("wbs.roles.{$role}", str($role)->replace('_', ' '))
                ),
            ]);
        }

        return $user;
    }

    private function findActiveUserByRole(string $role): ?User
    {
        return User::query()
            ->where('role', $role)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();
    }

    private function addTimelineEvent(
        Report $report,
        CaseFile $caseFile,
        string $visibility,
        string $stage,
        string $headline,
        ?string $detail,
        string $actorRole,
        ?string $actorName,
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
        ?string $actorName,
        array $context,
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

    private function formatSequence(string $prefix, int $id): string
    {
        return sprintf('%s-%s-%04d', $prefix, now()->year, $id);
    }

    private function workflowRelations(): array
    {
        return [
            'report.reporter',
            'timelineEvents',
            'verificationSupervisor',
            'verificator',
            'investigationSupervisor',
            'investigator',
            'director',
        ];
    }
}
