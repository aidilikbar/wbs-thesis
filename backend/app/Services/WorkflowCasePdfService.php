<?php

namespace App\Services;

use App\Models\CaseFile;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class WorkflowCasePdfService
{
    public function build(CaseFile $caseFile, User $viewer): array
    {
        $report = $caseFile->report;
        $screeningRecord = $this->arrayValue($caseFile->screening_payload);
        $verificationRecord = $this->arrayValue($caseFile->verification_payload);
        $verificationApprovalRecord = $this->arrayValue($caseFile->verification_approval_payload);
        $reviewDistributionRecord = $this->arrayValue($caseFile->review_distribution_payload);
        $reviewRecord = $this->arrayValue($caseFile->review_payload);
        $reviewApprovalRecord = $this->arrayValue($caseFile->review_approval_payload);
        $directorApprovalRecord = $this->arrayValue($caseFile->director_approval_payload);
        $relatedReportReference = $this->stringValue($reviewRecord['related_report_reference'] ?? null);
        $relatedReport = $relatedReportReference
            ? Report::query()
                ->where('public_reference', $relatedReportReference)
                ->first(['public_reference', 'title', 'description'])
            : null;

        return [
            'document_title' => 'KPK Whistleblowing System Case Report',
            'case_title' => $report?->title ?? 'Untitled case',
            'case_number' => $caseFile->case_number,
            'public_reference' => $report?->public_reference,
            'stage_label' => $this->labelValue($caseFile->stage, 'wbs.case_stages'),
            'status_label' => $this->labelValue($report?->status, 'wbs.case_stages'),
            'severity_label' => $this->headlineValue($report?->severity),
            'exported_at' => $this->dateTimeValue(now()),
            'exported_by' => trim(sprintf(
                '%s · %s',
                $viewer->name,
                $this->labelValue($viewer->role, 'wbs.roles')
            ), ' ·'),
            'overview_rows' => $this->compactRows([
                $this->field('Complaint Title', $report?->title),
                $this->field('Complaint Type', $this->labelValue($report?->category, 'wbs.categories')),
                $this->field('Workflow Stage', $this->labelValue($caseFile->stage, 'wbs.case_stages')),
                $this->field('Report Status', $this->labelValue($report?->status, 'wbs.case_stages')),
                $this->field('Severity', $this->headlineValue($report?->severity)),
                $this->field('Submission Date', $this->dateTimeValue($report?->submitted_at)),
                $this->field('Last Activity', $this->dateTimeValue($caseFile->last_activity_at)),
                $this->field('Completed At', $this->dateTimeValue($caseFile->completed_at)),
                $this->field('Incident Date', $this->dateValue($report?->incident_date)),
                $this->field('Incident Location', $report?->incident_location),
                $this->field('Confidentiality', $this->labelValue($caseFile->confidentiality_level, 'wbs.confidentiality_levels')),
                $this->field('Complaint Description', $report?->description),
                $this->field('Evidence Summary', $report?->evidence_summary),
            ]),
            'reporter_rows' => $this->compactRows([
                $this->field('Reporter Name', $caseFile->confidentiality_level === 'anonymous' ? 'Anonymous' : $report?->reporter_name),
                $this->field('Reporter Email', $caseFile->confidentiality_level === 'anonymous' ? null : $report?->reporter_email),
                $this->field('Reporter Phone', $caseFile->confidentiality_level === 'anonymous' ? null : $report?->reporter_phone),
            ]),
            'workflow_rows' => $this->compactRows([
                $this->field('Verification Supervisor', $caseFile->verificationSupervisor?->name),
                $this->field('Verification Officer', $caseFile->verificator?->name),
                $this->field('Investigation Supervisor', $caseFile->investigationSupervisor?->name),
                $this->field('Investigator', $caseFile->investigator?->name),
                $this->field('Director', $caseFile->director?->name),
                $this->field('Assigned Unit', $caseFile->assigned_unit),
                $this->field('Assigned To', $caseFile->assigned_to),
            ]),
            'attachments' => ($report?->attachments ?? collect())
                ->values()
                ->map(fn ($attachment) => [
                    'name' => $attachment->original_name,
                    'type' => $attachment->mime_type ?: strtoupper((string) $attachment->extension),
                    'size' => $this->fileSizeValue((int) $attachment->size_bytes),
                    'uploaded_at' => $this->dateTimeValue($attachment->created_at),
                ])
                ->all(),
            'timeline' => $caseFile->timelineEvents
                ->sortBy('occurred_at')
                ->values()
                ->map(fn ($event) => [
                    'when' => $this->dateTimeValue($event->occurred_at),
                    'visibility' => Str::headline((string) $event->visibility),
                    'stage' => $this->labelValue($event->stage, 'wbs.case_stages'),
                    'headline' => $event->headline,
                    'detail' => $event->detail,
                    'actor' => trim(sprintf(
                        '%s%s',
                        $this->labelValue($event->actor_role, 'wbs.roles'),
                        $event->actor_name ? " · {$event->actor_name}" : ''
                    ), ' ·'),
                ])
                ->all(),
            'records' => array_values(array_filter([
                $this->section('Screening Record', [
                    $this->field('Screening Outcome', ($screeningRecord['reject_report'] ?? false) ? 'Rejected during preliminary screening' : 'Delegated to verification'),
                    $this->field('Verification Officer', $caseFile->verificator?->name),
                    $this->field(
                        ($screeningRecord['reject_report'] ?? false) ? 'Reason of Rejection' : 'Distribution Note',
                        $screeningRecord['distribution_note'] ?? null
                    ),
                ]),
                $this->section('Verification Record', [
                    $this->field('Information Summary', $verificationRecord['summary'] ?? null),
                    $this->field('Corruption Tags', $this->multiLabelValue($verificationRecord['corruption_aspect_tags'] ?? [], 'wbs.corruption_aspect_tags')),
                    $this->field('Has Authority', $this->booleanValue($verificationRecord['has_authority'] ?? null)),
                    $this->field('Criminal Assessment', $this->headlineValue($verificationRecord['criminal_assessment'] ?? null)),
                    $this->field('Reason', $verificationRecord['reason'] ?? null),
                    $this->field('Recommendation', $this->labelValue($verificationRecord['recommendation'] ?? null, 'wbs.verification_recommendations')),
                    $this->field('Forwarding Destination', $verificationRecord['forwarding_destination'] ?? null),
                ]),
                $this->section('Verification Approval Record', [
                    $this->field('Decision', $this->headlineValue($verificationApprovalRecord['decision'] ?? null)),
                    $this->field('Approval Note', $verificationApprovalRecord['approval_note'] ?? null),
                ]),
                $this->section('Investigation Distribution Record', [
                    $this->field('Investigation Officer', $caseFile->investigator?->name),
                    $this->field('Distribution Note', $reviewDistributionRecord['distribution_note'] ?? null),
                ]),
                $this->section('Investigation Record', [
                    $this->field('Case Name', $reviewRecord['case_name'] ?? null),
                    $this->field('Reported Parties', $this->reportedPartiesValue($reviewRecord['reported_parties'] ?? [])),
                    $this->field('Complaint Description', $reviewRecord['description'] ?? null),
                    $this->field('Corruption Tags', $this->multiLabelValue($reviewRecord['corruption_aspect_tags'] ?? [], 'wbs.corruption_aspect_tags')),
                    $this->field('Recommendation', $this->labelValue($reviewRecord['recommendation'] ?? null, 'wbs.review_recommendations')),
                    $this->field('Delict', $this->labelValue($reviewRecord['delict'] ?? null, 'wbs.delict_tags')),
                    $this->field('Article', $this->labelValue($reviewRecord['article'] ?? null, 'wbs.corruption_articles')),
                    $this->field('Start of Incident', $this->monthYearValue($reviewRecord['start_month'] ?? null, $reviewRecord['start_year'] ?? null)),
                    $this->field('End of Incident', $this->monthYearValue($reviewRecord['end_month'] ?? null, $reviewRecord['end_year'] ?? null)),
                    $this->field('Incident Location', $this->locationValue($reviewRecord['city'] ?? null, $reviewRecord['province'] ?? null)),
                    $this->field('Related WBS Report', $this->relatedReportValue($relatedReport, $relatedReportReference)),
                    $this->field('Has Authority', $this->booleanValue($reviewRecord['has_authority'] ?? null)),
                    $this->field('Priority', $this->booleanValue($reviewRecord['is_priority'] ?? null)),
                    $this->field('Modus', $reviewRecord['modus'] ?? null),
                    $this->field('Additional Information', $reviewRecord['additional_information'] ?? null),
                    $this->field('Conclusion', $reviewRecord['conclusion'] ?? null),
                ]),
                $this->section('Investigation Approval Record', [
                    $this->field('Decision', $this->headlineValue($reviewApprovalRecord['decision'] ?? null)),
                    $this->field('Approval Note', $reviewApprovalRecord['approval_note'] ?? null),
                ]),
                $this->section('Director Decision Record', [
                    $this->field('Decision', $this->headlineValue($directorApprovalRecord['decision'] ?? null)),
                    $this->field('Approval Note', $directorApprovalRecord['approval_note'] ?? null),
                ]),
            ])),
        ];
    }

    private function section(string $title, array $rows): ?array
    {
        $rows = $this->compactRows($rows);

        if ($rows === []) {
            return null;
        }

        return [
            'title' => $title,
            'rows' => $rows,
        ];
    }

    private function compactRows(array $rows): array
    {
        return array_values(array_filter($rows));
    }

    private function field(string $label, mixed $value): ?array
    {
        $value = $this->stringValue($value);

        if ($value === null) {
            return null;
        }

        return [
            'label' => $label,
            'value' => $value,
        ];
    }

    private function arrayValue(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }

    private function stringValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_scalar($value)) {
            $text = trim((string) $value);

            return $text === '' ? null : $text;
        }

        return null;
    }

    private function labelValue(mixed $value, string $configKey): ?string
    {
        $raw = $this->stringValue($value);

        if ($raw === null) {
            return null;
        }

        return config("{$configKey}.{$raw}", Str::headline(str_replace('_', ' ', $raw)));
    }

    private function multiLabelValue(mixed $values, string $configKey): ?string
    {
        if (! is_array($values) || $values === []) {
            return null;
        }

        $labels = collect($values)
            ->filter(fn ($value) => is_scalar($value))
            ->map(fn ($value) => $this->labelValue((string) $value, $configKey))
            ->filter()
            ->values()
            ->all();

        return $labels === [] ? null : implode(', ', $labels);
    }

    private function booleanValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (bool) $value ? 'Yes' : 'No';
    }

    private function headlineValue(mixed $value): ?string
    {
        $raw = $this->stringValue($value);

        if ($raw === null) {
            return null;
        }

        return Str::headline(str_replace('_', ' ', $raw));
    }

    private function monthYearValue(mixed $month, mixed $year): ?string
    {
        $monthLabel = $this->labelValue($month, 'wbs.months');
        $yearLabel = $this->stringValue($year);

        if ($monthLabel === null && $yearLabel === null) {
            return null;
        }

        return trim(implode(' ', array_filter([$monthLabel, $yearLabel])));
    }

    private function locationValue(mixed $city, mixed $province): ?string
    {
        $cityLabel = $this->stringValue($city);
        $provinceLabel = $this->stringValue($province);

        if ($cityLabel === null && $provinceLabel === null) {
            return null;
        }

        return implode(', ', array_filter([$cityLabel, $provinceLabel]));
    }

    private function relatedReportValue(?Report $relatedReport, ?string $reference): ?string
    {
        $reference = $this->stringValue($reference);

        if ($reference === null && ! $relatedReport) {
            return null;
        }

        if (! $relatedReport) {
            return $reference;
        }

        $title = $this->stringValue($relatedReport->title);

        return trim(sprintf(
            '%s%s',
            $relatedReport->public_reference,
            $title ? " · {$title}" : ''
        ), ' ·');
    }

    private function reportedPartiesValue(mixed $value): ?string
    {
        if (! is_array($value) || $value === []) {
            return null;
        }

        $rows = collect($value)
            ->filter(fn ($party) => is_array($party))
            ->map(function (array $party) {
                $name = $this->stringValue($party['full_name'] ?? null);
                $position = $this->stringValue($party['position'] ?? null);
                $classification = $this->labelValue($party['classification'] ?? null, 'wbs.reported_party_classifications');

                return trim(implode(' · ', array_filter([$name, $position, $classification])));
            })
            ->filter()
            ->values()
            ->all();

        return $rows === [] ? null : implode("\n", $rows);
    }

    private function dateValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value)->format('d M Y');
    }

    private function dateTimeValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value)->format('d M Y H:i');
    }

    private function fileSizeValue(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / (1024 * 1024), 1).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024).' KB';
        }

        return $bytes.' B';
    }
}
