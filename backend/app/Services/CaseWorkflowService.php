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
    private const SUBMITTED_SEVERITY = 'not_available';

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
            $reportedParties = $this->normalizeReportedParties($payload);
            $confidentialityLevel = $payload['confidentiality_level'] ?? 'identified';

            $report = Report::query()->create([
                'reporter_user_id' => $reporter->id,
                'uuid' => (string) Str::uuid(),
                'tracking_token' => Str::upper(Str::random(12)),
                'title' => $payload['title'],
                'category' => $payload['category'] ?? 'kpk_report',
                'description' => $payload['description'],
                'incident_date' => null,
                'incident_location' => null,
                'accused_party' => $this->flattenReportedParties($reportedParties),
                'reported_parties' => $reportedParties,
                'evidence_summary' => null,
                'anonymity_level' => $confidentialityLevel,
                'reporter_name' => $reporter->name,
                'reporter_email' => $reporter->email,
                'reporter_phone' => $reporter->phone,
                'requested_follow_up' => $payload['requested_follow_up'] ?? true,
                'witness_available' => $payload['witness_available'] ?? false,
                'governance_tags' => array_values($payload['governance_tags'] ?? []),
                'severity' => self::SUBMITTED_SEVERITY,
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
                'confidentiality_level' => $confidentialityLevel,
                'escalation_required' => false,
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
                    'reported_party_count' => count($reportedParties),
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
            $reportedParties = $this->normalizeReportedParties($payload);
            $confidentialityLevel = $payload['confidentiality_level'] ?? 'identified';

            $report->forceFill([
                'title' => $payload['title'],
                'category' => $payload['category'] ?? 'kpk_report',
                'description' => $payload['description'],
                'incident_date' => null,
                'incident_location' => null,
                'accused_party' => $this->flattenReportedParties($reportedParties),
                'reported_parties' => $reportedParties,
                'evidence_summary' => null,
                'anonymity_level' => $confidentialityLevel,
                'requested_follow_up' => $payload['requested_follow_up'] ?? true,
                'witness_available' => $payload['witness_available'] ?? false,
                'governance_tags' => array_values($payload['governance_tags'] ?? []),
                'severity' => self::SUBMITTED_SEVERITY,
            ])->save();

            $caseFile->forceFill([
                'confidentiality_level' => $confidentialityLevel,
                'escalation_required' => false,
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
                    'reported_party_count' => count($reportedParties),
                ],
            );

            return $report->fresh(['caseFile']);
        });
    }

    public function delegateToVerificator(
        CaseFile $caseFile,
        User $supervisor,
        ?User $verificator,
        array $payload,
    ): CaseFile {
        $this->ensureCaseStage($caseFile, ['submitted']);
        $this->ensureOwnership($caseFile, $supervisor, 'verification_supervisor_id');

        return DB::transaction(function () use ($caseFile, $supervisor, $verificator, $payload) {
            $assignedAt = now();
            $screeningPayload = [
                'reject_report' => (bool) ($payload['reject_report'] ?? false),
                'distribution_note' => $payload['distribution_note'] ?? null,
            ];

            if ($screeningPayload['reject_report']) {
                $caseFile->forceFill([
                    'stage' => 'completed',
                    'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
                    'disposition' => 'screening_rejected',
                    'assigned_unit' => $supervisor->unit ?: $supervisor->role_label,
                    'assigned_to' => $supervisor->name,
                    'last_activity_at' => $assignedAt,
                    'screening_payload' => $screeningPayload,
                    'notes' => $payload['distribution_note'] ?? $caseFile->notes,
                    'completed_at' => $assignedAt,
                ])->save();

                $caseFile->report->forceFill([
                    'status' => self::REPORT_STATUSES['completed'],
                    'last_public_update_at' => $assignedAt,
                ])->save();

                $this->addTimelineEvent(
                    report: $caseFile->report,
                    caseFile: $caseFile,
                    visibility: 'internal',
                    stage: 'completed',
                    headline: 'Report screened out at verification supervision',
                    detail: $payload['distribution_note']
                        ?? 'The verification supervisor closed the report during initial screening.',
                    actorRole: $supervisor->role,
                    actorName: $supervisor->name,
                    occurredAt: $assignedAt,
                );

                $this->addTimelineEvent(
                    report: $caseFile->report,
                    caseFile: $caseFile,
                    visibility: 'public',
                    stage: 'screening_closed',
                    headline: 'Report closed during preliminary screening',
                    detail: 'The report was closed after an initial screening by the verification supervisor.',
                    actorRole: $supervisor->role,
                    actorName: $supervisor->name,
                    occurredAt: $assignedAt,
                );

                $this->recordAudit(
                    action: 'screening_rejected',
                    auditable: $caseFile,
                    report: $caseFile->report,
                    caseFile: $caseFile,
                    actorRole: $supervisor->role,
                    actorName: $supervisor->name,
                    context: $screeningPayload,
                );

                return $caseFile->fresh($this->workflowRelations());
            }

            if (! $verificator) {
                throw ValidationException::withMessages([
                    'assignee_user_id' => 'A verification officer must be selected unless the report is rejected during screening.',
                ]);
            }

            $this->ensureActiveAssignee($verificator, User::ROLE_VERIFICATOR);

            $caseFile->forceFill([
                'stage' => 'verification_in_progress',
                'current_role' => User::ROLE_VERIFICATOR,
                'disposition' => 'verification_in_progress',
                'assigned_unit' => $payload['assigned_unit']
                    ?? ($verificator->unit ?: $verificator->role_label),
                'assigned_to' => $verificator->name,
                'verificator_id' => $verificator->id,
                'triaged_at' => $caseFile->triaged_at ?? $assignedAt,
                'sla_due_at' => $assignedAt->copy()->addDays(7),
                'last_activity_at' => $assignedAt,
                'screening_payload' => $screeningPayload,
                'completed_at' => null,
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
                detail: ($payload['distribution_note'] ?? null)
                    ?: sprintf('The verification supervisor delegated the report to %s for verification.', $verificator->name),
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
                    'distribution_note' => $payload['distribution_note'] ?? null,
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
            $summary = $payload['summary'] ?? $payload['internal_note'] ?? '';
            $reason = $payload['reason'] ?? $summary;
            $recommendation = $payload['recommendation'] ?? 'review';
            $verificationPayload = [
                'summary' => $summary,
                'corruption_aspect_tags' => array_values($payload['corruption_aspect_tags'] ?? []),
                'has_authority' => (bool) ($payload['has_authority'] ?? true),
                'criminal_assessment' => $payload['criminal_assessment'] ?? 'indicated',
                'reason' => $reason,
                'recommendation' => $recommendation,
                'forwarding_destination' => $payload['forwarding_destination'] ?? null,
            ];

            $caseFile->forceFill([
                'stage' => 'verification_review',
                'current_role' => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
                'disposition' => 'verification_review',
                'assigned_unit' => $caseFile->verificationSupervisor?->unit ?: $caseFile->verificationSupervisor?->role_label,
                'assigned_to' => $caseFile->verificationSupervisor?->name,
                'last_activity_at' => $submittedAt,
                'notes' => $summary,
                'verification_payload' => $verificationPayload,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES['verification_review'],
                'governance_tags' => $verificationPayload['corruption_aspect_tags'],
                'severity' => $this->determineVerificationSeverity($verificationPayload),
                'last_public_update_at' => $submittedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'verification_review',
                headline: 'Verification assessment submitted',
                detail: $summary,
                actorRole: $verificator->role,
                actorName: $verificator->name,
                occurredAt: $submittedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: 'verification_review',
                headline: 'Verification review update',
                payload: $payload,
                defaultMessage: 'Your report has completed the verification assessment and is waiting for supervisory review.',
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
                context: $verificationPayload,
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
            $approvalNote = $payload['approval_note'] ?? $payload['internal_note'] ?? '';
            $approved = $payload['decision'] === 'approved';
            $verificationPayload = $caseFile->verification_payload ?? [];
            $recommendation = $verificationPayload['recommendation'] ?? 'review';
            $reviewSupervisor = $approved && $recommendation === 'review'
                ? $caseFile->investigationSupervisor ?: $this->requireActiveUserByRole(User::ROLE_SUPERVISOR_OF_INVESTIGATOR)
                : null;
            $verificationApprovalPayload = [
                'decision' => $payload['decision'],
                'approval_note' => $approvalNote,
            ];
            $nextStage = match (true) {
                ! $approved => 'verification_in_progress',
                $recommendation === 'review' => 'verified',
                default => 'completed',
            };
            $nextRole = match (true) {
                ! $approved => User::ROLE_VERIFICATOR,
                $recommendation === 'review' => User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
                default => User::ROLE_SUPERVISOR_OF_VERIFICATOR,
            };
            $nextDisposition = match (true) {
                ! $approved => 'verification_rejected',
                $recommendation === 'review' => 'awaiting_review_delegation',
                $recommendation === 'forward' => 'forward_completed',
                default => 'archive_completed',
            };

            $caseFile->forceFill([
                'stage' => $nextStage,
                'current_role' => $nextRole,
                'disposition' => $nextDisposition,
                'assigned_unit' => $approved && $recommendation === 'review'
                    ? ($reviewSupervisor->unit ?: $reviewSupervisor->role_label)
                    : ($approved
                        ? ($caseFile->assigned_unit ?: $supervisor->unit ?: $supervisor->role_label)
                        : ($caseFile->verificator?->unit ?: $caseFile->verificator?->role_label)),
                'assigned_to' => $approved && $recommendation === 'review'
                    ? $reviewSupervisor->name
                    : ($approved ? $supervisor->name : $caseFile->verificator?->name),
                'investigation_supervisor_id' => $approved && $recommendation === 'review'
                    ? $reviewSupervisor->id
                    : $caseFile->investigation_supervisor_id,
                'last_activity_at' => $reviewedAt,
                'notes' => $approvalNote,
                'verification_approval_payload' => $verificationApprovalPayload,
                'completed_at' => $approved && $recommendation !== 'review' ? $reviewedAt : null,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$caseFile->stage],
                'last_public_update_at' => $reviewedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: match (true) {
                    ! $approved => 'Verification returned to verification officer',
                    $recommendation === 'review' => 'Verification approved for review delegation',
                    $recommendation === 'forward' => 'Verification approved for forwarding completion',
                    default => 'Verification approved for archival completion',
                },
                detail: $approvalNote,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: $caseFile->stage,
                headline: match (true) {
                    ! $approved => 'Verification returned for revision',
                    $recommendation === 'review' => 'Verification completed',
                    $recommendation === 'forward' => 'Case forwarded after verification',
                    default => 'Case archived after verification',
                },
                payload: $payload,
                defaultMessage: match (true) {
                    ! $approved => 'Your report has been returned for additional verification before it can move forward.',
                    $recommendation === 'review' => 'Verification has been completed and the report is moving to investigation handling.',
                    $recommendation === 'forward' => 'Verification has been completed and the report has been closed with a forwarding outcome.',
                    default => 'Verification has been completed and the report has been closed.',
                },
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
                    ...$verificationApprovalPayload,
                    'recommendation' => $recommendation,
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
            $reviewDistributionPayload = [
                'distribution_note' => $payload['distribution_note'] ?? null,
            ];

            $caseFile->forceFill([
                'stage' => 'investigation_in_progress',
                'current_role' => User::ROLE_INVESTIGATOR,
                'disposition' => 'review_in_progress',
                'assigned_unit' => $payload['assigned_unit']
                    ?? ($investigator->unit ?: $investigator->role_label),
                'assigned_to' => $investigator->name,
                'investigator_id' => $investigator->id,
                'sla_due_at' => $assignedAt->copy()->addDays(10),
                'last_activity_at' => $assignedAt,
                'review_distribution_payload' => $reviewDistributionPayload,
                'completed_at' => null,
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
                headline: 'Review delegated',
                detail: ($payload['distribution_note'] ?? null)
                    ?: sprintf('The investigation supervisor delegated the case to %s.', $investigator->name),
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $assignedAt,
            );

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'public',
                stage: 'investigation_in_progress',
                headline: 'Review started',
                detail: 'Your report has entered the investigation stage and is now handled by the assigned investigator.',
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $assignedAt,
            );

            $this->recordAudit(
                action: 'review_delegated',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                context: [
                    'investigator_id' => $investigator->id,
                    'assigned_unit' => $caseFile->assigned_unit,
                    'distribution_note' => $payload['distribution_note'] ?? null,
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
            $report = $caseFile->report;
            $incidentDate = $report?->incident_date ?? $submittedAt;
            $legacyNote = $payload['conclusion'] ?? $payload['internal_note'] ?? '';
            $reportedParties = $payload['reported_parties'] ?? $report?->reported_parties ?? [];

            if ($reportedParties === []) {
                $accusedParty = trim((string) ($report?->accused_party ?? ''));
                $reportedParties = $accusedParty === ''
                    ? []
                    : [[
                        'full_name' => $accusedParty,
                        'position' => 'Not specified',
                        'classification' => 'other',
                    ]];
            }

            $reviewPayload = [
                'case_name' => $payload['case_name'] ?? $report?->title ?? 'Untitled case',
                'reported_parties' => array_values($reportedParties),
                'description' => $payload['description'] ?? $report?->description ?? '',
                'corruption_aspect_tags' => array_values($payload['corruption_aspect_tags'] ?? []),
                'recommendation' => $payload['recommendation'] ?? 'internal_forwarding',
                'delict' => $payload['delict'] ?? 'other',
                'article' => $payload['article'] ?? 'article_2_31_1999',
                'start_month' => $payload['start_month'] ?? $incidentDate->format('m'),
                'start_year' => $payload['start_year'] ?? $incidentDate->format('Y'),
                'end_month' => $payload['end_month'] ?? $incidentDate->format('m'),
                'end_year' => $payload['end_year'] ?? $incidentDate->format('Y'),
                'city' => $payload['city'] ?? 'Not specified',
                'province' => $payload['province'] ?? 'Not specified',
                'modus' => $payload['modus'] ?? ($legacyNote !== '' ? $legacyNote : ($report?->description ?? '')),
                'related_report_reference' => $payload['related_report_reference'] ?? $report?->public_reference,
                'has_authority' => (bool) ($payload['has_authority'] ?? true),
                'is_priority' => (bool) ($payload['is_priority'] ?? false),
                'additional_information' => $payload['additional_information'] ?? null,
                'conclusion' => $legacyNote !== '' ? $legacyNote : ($report?->description ?? ''),
            ];

            $caseFile->forceFill([
                'stage' => 'investigation_review',
                'current_role' => User::ROLE_SUPERVISOR_OF_INVESTIGATOR,
                'disposition' => 'review_approval',
                'assigned_unit' => $caseFile->investigationSupervisor?->unit ?: $caseFile->investigationSupervisor?->role_label,
                'assigned_to' => $caseFile->investigationSupervisor?->name,
                'last_activity_at' => $submittedAt,
                'notes' => $reviewPayload['conclusion'],
                'review_payload' => $reviewPayload,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES['investigation_review'],
                'governance_tags' => $reviewPayload['corruption_aspect_tags'],
                'severity' => $this->determineReviewSeverity($reviewPayload),
                'last_public_update_at' => $submittedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: 'investigation_review',
                headline: 'Investigation assessment submitted',
                detail: $reviewPayload['conclusion'],
                actorRole: $investigator->role,
                actorName: $investigator->name,
                occurredAt: $submittedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: 'investigation_review',
                headline: 'Investigation assessment update',
                payload: $payload,
                defaultMessage: 'Your report has completed the investigation assessment and is waiting for supervisory review.',
                actorRole: $investigator->role,
                actorName: $investigator->name,
                occurredAt: $submittedAt,
            );

            $this->recordAudit(
                action: 'review_submitted',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $investigator->role,
                actorName: $investigator->name,
                context: $reviewPayload,
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
            $approvalNote = $payload['approval_note'] ?? $payload['internal_note'] ?? '';
            $approved = $payload['decision'] === 'approved';
            $director = $approved
                ? $caseFile->director ?: $this->requireActiveUserByRole(User::ROLE_DIRECTOR)
                : null;
            $reviewApprovalPayload = [
                'decision' => $payload['decision'],
                'approval_note' => $approvalNote,
            ];

            $caseFile->forceFill([
                'stage' => $approved ? 'director_review' : 'investigation_in_progress',
                'current_role' => $approved ? User::ROLE_DIRECTOR : User::ROLE_INVESTIGATOR,
                'disposition' => $approved ? 'director_review' : 'review_rejected',
                'assigned_unit' => $approved
                    ? ($director->unit ?: $director->role_label)
                    : ($caseFile->investigator?->unit ?: $caseFile->investigator?->role_label),
                'assigned_to' => $approved ? $director->name : $caseFile->investigator?->name,
                'director_id' => $approved ? $director->id : $caseFile->director_id,
                'last_activity_at' => $reviewedAt,
                'notes' => $approvalNote,
                'review_approval_payload' => $reviewApprovalPayload,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$caseFile->stage],
                'last_public_update_at' => $reviewedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: $approved ? 'Review approved for director decision' : 'Investigation returned to investigator',
                detail: $approvalNote,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: $caseFile->stage,
                headline: $approved ? 'Review completed' : 'Investigation returned for revision',
                payload: $payload,
                defaultMessage: $approved
                    ? 'Investigation review has been completed and the report is moving to director decision.'
                    : 'Your report has been returned for additional investigation before final decision.',
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                occurredAt: $reviewedAt,
            );

            $this->recordAudit(
                action: $approved ? 'review_approved' : 'review_rejected',
                auditable: $caseFile,
                report: $caseFile->report,
                caseFile: $caseFile,
                actorRole: $supervisor->role,
                actorName: $supervisor->name,
                context: [
                    ...$reviewApprovalPayload,
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
            $approvalNote = $payload['approval_note'] ?? $payload['internal_note'] ?? '';
            $approved = $payload['decision'] === 'approved';
            $directorApprovalPayload = [
                'decision' => $payload['decision'],
                'approval_note' => $approvalNote,
            ];

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
                'notes' => $approvalNote,
                'director_approval_payload' => $directorApprovalPayload,
            ])->save();

            $caseFile->report->forceFill([
                'status' => self::REPORT_STATUSES[$caseFile->stage],
                'last_public_update_at' => $reviewedAt,
            ])->save();

            $this->addTimelineEvent(
                report: $caseFile->report,
                caseFile: $caseFile,
                visibility: 'internal',
                stage: $caseFile->stage,
                headline: $approved ? 'Director approved report completion' : 'Director returned investigation to investigator',
                detail: $approvalNote,
                actorRole: $director->role,
                actorName: $director->name,
                occurredAt: $reviewedAt,
            );

            $this->maybeAddPublicUpdate(
                caseFile: $caseFile,
                stage: $caseFile->stage,
                headline: $approved ? 'Report completed' : 'Investigation returned after director review',
                payload: $payload,
                defaultMessage: $approved
                    ? 'A final decision has been recorded and the current workflow is complete.'
                    : 'The report has been returned for additional investigation before a final decision can be recorded.',
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
                    ...$directorApprovalPayload,
                    'completed_at' => $caseFile->completed_at?->toISOString(),
                ],
            );

            return $caseFile->fresh($this->workflowRelations());
        });
    }

    private function determineVerificationSeverity(array $verificationPayload): string
    {
        if (($verificationPayload['criminal_assessment'] ?? null) === 'indicated') {
            return 'high';
        }

        return ($verificationPayload['recommendation'] ?? null) === 'review'
            ? 'medium'
            : 'low';
    }

    private function determineReviewSeverity(array $reviewPayload): string
    {
        if (($reviewPayload['is_priority'] ?? false) === true) {
            return 'critical';
        }

        return ($reviewPayload['recommendation'] ?? null) === 'archive'
            ? 'medium'
            : 'high';
    }

    private function normalizeReportedParties(array $payload): array
    {
        $reportedParties = $payload['reported_parties'] ?? [];

        if (! is_array($reportedParties) || $reportedParties === []) {
            $accusedParty = trim((string) ($payload['accused_party'] ?? ''));

            if ($accusedParty === '') {
                return [];
            }

            return [[
                'full_name' => $accusedParty,
                'position' => 'Not specified',
                'classification' => 'other',
            ]];
        }

        return collect($reportedParties)
            ->filter(fn ($party) => is_array($party))
            ->map(function (array $party) {
                return [
                    'full_name' => trim((string) ($party['full_name'] ?? '')),
                    'position' => trim((string) ($party['position'] ?? 'Not specified')),
                    'classification' => $party['classification'] ?? 'other',
                ];
            })
            ->filter(fn (array $party) => $party['full_name'] !== '')
            ->values()
            ->all();
    }

    private function flattenReportedParties(array $reportedParties): ?string
    {
        $names = collect($reportedParties)
            ->pluck('full_name')
            ->filter()
            ->implode(', ');

        return $names !== '' ? $names : null;
    }

    private function maybeAddPublicUpdate(
        CaseFile $caseFile,
        string $stage,
        string $headline,
        array $payload,
        string $defaultMessage,
        string $actorRole,
        string $actorName,
        $occurredAt,
    ): void {
        $detail = trim((string) ($payload['public_message'] ?? ''));

        if ($detail === '') {
            $detail = $defaultMessage;
        }

        $this->addTimelineEvent(
            report: $caseFile->report,
            caseFile: $caseFile,
            visibility: 'public',
            stage: $stage,
            headline: $headline,
            detail: $detail,
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
