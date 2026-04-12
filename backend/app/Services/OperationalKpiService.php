<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CaseFile;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class OperationalKpiService
{
    private readonly array $phaseConfig;

    private readonly array $weekendDays;

    private readonly array $nonWorkingDates;

    private readonly string $calendarTimezone;

    private readonly int $workdayStartHour;

    private readonly int $workdayStartMinute;

    private readonly int $workdayEndHour;

    private readonly int $workdayEndMinute;

    public function __construct()
    {
        $config = config('wbs.operational_kpis', []);
        [$startHour, $startMinute] = $this->parseTime((string) ($config['workday_start'] ?? '08:00'));
        [$endHour, $endMinute] = $this->parseTime((string) ($config['workday_end'] ?? '16:00'));

        $this->phaseConfig = $config['phases'] ?? [];
        $this->weekendDays = array_map('intval', $config['weekend_days'] ?? [6, 7]);
        $this->nonWorkingDates = array_fill_keys($config['non_working_dates'] ?? [], true);
        $this->calendarTimezone = (string) ($config['timezone'] ?? config('app.timezone', 'UTC'));
        $this->workdayStartHour = $startHour;
        $this->workdayStartMinute = $startMinute;
        $this->workdayEndHour = $endHour;
        $this->workdayEndMinute = $endMinute;
    }

    public function buildCasePhaseKpis(CaseFile $caseFile, ?CarbonInterface $referenceTime = null): array
    {
        $referenceTime ??= now();

        return [
            'verification' => $this->buildVerificationKpi($caseFile, $referenceTime),
            'investigation' => $this->buildInvestigationKpi($caseFile, $referenceTime),
        ];
    }

    private function buildVerificationKpi(CaseFile $caseFile, CarbonInterface $referenceTime): ?array
    {
        $reportSubmittedAt = $caseFile->report?->submitted_at;

        if (! $reportSubmittedAt) {
            return null;
        }

        $totals = [
            'screening' => 0,
            'verification' => 0,
            'approval' => 0,
        ];
        $completedSteps = [];
        $openStepStarts = [
            'screening' => $reportSubmittedAt,
            'verification' => null,
            'approval' => null,
        ];
        $logs = $this->orderedAuditLogs($caseFile, [
            'screening_rejected',
            'verification_delegated',
            'verification_submitted',
            'verification_rejected',
            'verification_approved',
        ]);
        $phaseCompletedAt = null;
        $screeningRejectedAt = null;

        foreach ($logs as $log) {
            $happenedAt = $log->happened_at;

            if (! $happenedAt) {
                continue;
            }

            switch ($log->action) {
                case 'screening_rejected':
                    $totals['screening'] += $this->workingMinutesBetween($openStepStarts['screening'], $happenedAt);
                    $openStepStarts['screening'] = null;
                    $completedSteps['screening'] = true;
                    $screeningRejectedAt = $happenedAt;
                    break;

                case 'verification_delegated':
                    $totals['screening'] += $this->workingMinutesBetween($openStepStarts['screening'], $happenedAt);
                    $openStepStarts['screening'] = null;
                    $completedSteps['screening'] = true;
                    $openStepStarts['verification'] = $happenedAt;
                    break;

                case 'verification_submitted':
                    $totals['verification'] += $this->workingMinutesBetween($openStepStarts['verification'], $happenedAt);
                    $openStepStarts['verification'] = null;
                    $completedSteps['verification'] = true;
                    $openStepStarts['approval'] = $happenedAt;
                    break;

                case 'verification_rejected':
                    $totals['approval'] += $this->workingMinutesBetween($openStepStarts['approval'], $happenedAt);
                    $openStepStarts['approval'] = null;
                    $completedSteps['approval'] = true;
                    $openStepStarts['verification'] = $happenedAt;
                    break;

                case 'verification_approved':
                    $totals['approval'] += $this->workingMinutesBetween($openStepStarts['approval'], $happenedAt);
                    $openStepStarts['approval'] = null;
                    $completedSteps['approval'] = true;
                    $phaseCompletedAt = $happenedAt;
                    break;
            }
        }

        if ($screeningRejectedAt && ! $phaseCompletedAt) {
            return null;
        }

        $activeStep = null;

        if (! $phaseCompletedAt) {
            foreach (['screening', 'verification', 'approval'] as $stepKey) {
                if ($openStepStarts[$stepKey] instanceof CarbonInterface) {
                    $totals[$stepKey] += $this->workingMinutesBetween($openStepStarts[$stepKey], $referenceTime);
                    $activeStep = $stepKey;
                    break;
                }
            }
        }

        $phaseMinutes = array_sum($totals);

        if ($phaseMinutes === 0 && ! $phaseCompletedAt) {
            return null;
        }

        return $this->formatPhaseSnapshot(
            phase: 'verification',
            caseFile: $caseFile,
            totalMinutes: $phaseMinutes,
            status: $phaseCompletedAt ? 'completed' : 'in_progress',
            startedAt: $reportSubmittedAt,
            endedAt: $phaseCompletedAt,
            activeStep: $activeStep,
            completedSteps: array_keys($completedSteps),
            elapsedStepMinutes: $totals,
        );
    }

    private function buildInvestigationKpi(CaseFile $caseFile, CarbonInterface $referenceTime): ?array
    {
        $verificationPayload = $caseFile->verification_payload ?? [];

        if (($verificationPayload['recommendation'] ?? null) !== 'review') {
            return null;
        }

        $phaseStartedAt = $this->findFirstActionTimestamp($caseFile, 'verification_approved');

        if (! $phaseStartedAt) {
            return null;
        }

        $totals = [
            'delegation' => 0,
            'investigation' => 0,
            'approval' => 0,
            'director' => 0,
        ];
        $completedSteps = [];
        $openStepStarts = [
            'delegation' => $phaseStartedAt,
            'investigation' => null,
            'approval' => null,
            'director' => null,
        ];
        $logs = $this->orderedAuditLogs($caseFile, [
            'review_delegated',
            'review_submitted',
            'review_rejected',
            'review_approved',
            'director_rejected',
            'director_approved',
        ]);
        $phaseCompletedAt = null;

        foreach ($logs as $log) {
            $happenedAt = $log->happened_at;

            if (! $happenedAt) {
                continue;
            }

            switch ($log->action) {
                case 'review_delegated':
                    $totals['delegation'] += $this->workingMinutesBetween($openStepStarts['delegation'], $happenedAt);
                    $openStepStarts['delegation'] = null;
                    $completedSteps['delegation'] = true;
                    $openStepStarts['investigation'] = $happenedAt;
                    break;

                case 'review_submitted':
                    $totals['investigation'] += $this->workingMinutesBetween($openStepStarts['investigation'], $happenedAt);
                    $openStepStarts['investigation'] = null;
                    $completedSteps['investigation'] = true;
                    $openStepStarts['approval'] = $happenedAt;
                    break;

                case 'review_rejected':
                    $totals['approval'] += $this->workingMinutesBetween($openStepStarts['approval'], $happenedAt);
                    $openStepStarts['approval'] = null;
                    $completedSteps['approval'] = true;
                    $openStepStarts['investigation'] = $happenedAt;
                    break;

                case 'review_approved':
                    $totals['approval'] += $this->workingMinutesBetween($openStepStarts['approval'], $happenedAt);
                    $openStepStarts['approval'] = null;
                    $completedSteps['approval'] = true;
                    $openStepStarts['director'] = $happenedAt;
                    break;

                case 'director_rejected':
                    $totals['director'] += $this->workingMinutesBetween($openStepStarts['director'], $happenedAt);
                    $openStepStarts['director'] = null;
                    $completedSteps['director'] = true;
                    $openStepStarts['investigation'] = $happenedAt;
                    break;

                case 'director_approved':
                    $totals['director'] += $this->workingMinutesBetween($openStepStarts['director'], $happenedAt);
                    $openStepStarts['director'] = null;
                    $completedSteps['director'] = true;
                    $phaseCompletedAt = $happenedAt;
                    break;
            }
        }

        $activeStep = null;

        if (! $phaseCompletedAt) {
            foreach (['delegation', 'investigation', 'approval', 'director'] as $stepKey) {
                if ($openStepStarts[$stepKey] instanceof CarbonInterface) {
                    $totals[$stepKey] += $this->workingMinutesBetween($openStepStarts[$stepKey], $referenceTime);
                    $activeStep = $stepKey;
                    break;
                }
            }
        }

        $phaseMinutes = array_sum($totals);

        if ($phaseMinutes === 0 && ! $phaseCompletedAt) {
            return null;
        }

        return $this->formatPhaseSnapshot(
            phase: 'investigation',
            caseFile: $caseFile,
            totalMinutes: $phaseMinutes,
            status: $phaseCompletedAt ? 'completed' : 'in_progress',
            startedAt: $phaseStartedAt,
            endedAt: $phaseCompletedAt,
            activeStep: $activeStep,
            completedSteps: array_keys($completedSteps),
            elapsedStepMinutes: $totals,
        );
    }

    /**
     * @param  array<string>  $completedSteps
     * @param  array<string, int>  $elapsedStepMinutes
     */
    private function formatPhaseSnapshot(
        string $phase,
        CaseFile $caseFile,
        int $totalMinutes,
        string $status,
        CarbonInterface $startedAt,
        ?CarbonInterface $endedAt,
        ?string $activeStep,
        array $completedSteps,
        array $elapsedStepMinutes,
    ): array {
        $phaseConfig = $this->phaseConfig[$phase] ?? [];
        $budgetHours = (float) ($phaseConfig['budget_hours'] ?? 0);
        $elapsedHours = $this->hoursFromMinutes($totalMinutes);
        $utilizationPercent = $this->utilizationPercent($elapsedHours, $budgetHours);

        return [
            'phase' => $phase,
            'label' => (string) ($phaseConfig['label'] ?? ucfirst($phase).' Time'),
            'case_number' => $caseFile->case_number,
            'case_title' => $caseFile->report?->title,
            'status' => $status,
            'budget_hours' => $budgetHours,
            'elapsed_working_hours' => $elapsedHours,
            'utilization_percent' => $utilizationPercent,
            'tone' => $this->toneForPercent($utilizationPercent),
            'started_at' => $startedAt->toISOString(),
            'ended_at' => $endedAt?->toISOString(),
            'last_activity_at' => $caseFile->last_activity_at?->toISOString(),
            'substeps' => collect($phaseConfig['steps'] ?? [])
                ->map(function (array $stepConfig) use ($activeStep, $completedSteps, $elapsedStepMinutes) {
                    $stepKey = (string) ($stepConfig['key'] ?? '');
                    $budgetHours = (float) ($stepConfig['budget_hours'] ?? 0);
                    $elapsedHours = $this->hoursFromMinutes($elapsedStepMinutes[$stepKey] ?? 0);

                    return [
                        'key' => $stepKey,
                        'label' => (string) ($stepConfig['label'] ?? ucfirst(str_replace('_', ' ', $stepKey))),
                        'budget_hours' => $budgetHours,
                        'elapsed_working_hours' => $elapsedHours,
                        'utilization_percent' => $this->utilizationPercent($elapsedHours, $budgetHours),
                        'tone' => $this->toneForPercent(
                            $this->utilizationPercent($elapsedHours, $budgetHours)
                        ),
                        'status' => $activeStep === $stepKey
                            ? 'in_progress'
                            : (in_array($stepKey, $completedSteps, true) ? 'completed' : 'pending'),
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  list<string>  $actions
     * @return Collection<int, AuditLog>
     */
    private function orderedAuditLogs(CaseFile $caseFile, array $actions): Collection
    {
        return $caseFile->auditLogs
            ->filter(fn (AuditLog $log) => in_array($log->action, $actions, true))
            ->sortBy(fn (AuditLog $log) => $log->happened_at?->getTimestamp() ?? 0)
            ->values();
    }

    private function findFirstActionTimestamp(CaseFile $caseFile, string $action): ?CarbonInterface
    {
        /** @var AuditLog|null $log */
        $log = $caseFile->auditLogs
            ->filter(fn (AuditLog $entry) => $entry->action === $action && $entry->happened_at)
            ->sortBy(fn (AuditLog $entry) => $entry->happened_at?->getTimestamp() ?? 0)
            ->first();

        return $log?->happened_at;
    }

    private function workingMinutesBetween(?CarbonInterface $start, ?CarbonInterface $end): int
    {
        if (! $start || ! $end) {
            return 0;
        }

        $startAt = Carbon::parse($start)->setTimezone($this->calendarTimezone);
        $endAt = Carbon::parse($end)->setTimezone($this->calendarTimezone);

        if ($endAt->lte($startAt)) {
            return 0;
        }

        $cursor = $startAt->copy()->startOfDay();
        $minutes = 0;

        while ($cursor->lte($endAt)) {
            if ($this->isWorkingDate($cursor)) {
                $dayStart = $cursor->copy()->setTime($this->workdayStartHour, $this->workdayStartMinute);
                $dayEnd = $cursor->copy()->setTime($this->workdayEndHour, $this->workdayEndMinute);
                $segmentStart = $startAt->gt($dayStart) ? $startAt->copy() : $dayStart;
                $segmentEnd = $endAt->lt($dayEnd) ? $endAt->copy() : $dayEnd;

                if ($segmentEnd->gt($segmentStart)) {
                    $minutes += $segmentStart->diffInMinutes($segmentEnd);
                }
            }

            $cursor->addDay()->startOfDay();
        }

        return $minutes;
    }

    private function isWorkingDate(CarbonInterface $day): bool
    {
        if (in_array($day->isoWeekday(), $this->weekendDays, true)) {
            return false;
        }

        return ! isset($this->nonWorkingDates[$day->toDateString()]);
    }

    private function hoursFromMinutes(int $minutes): float
    {
        return round($minutes / 60, 1);
    }

    private function utilizationPercent(float $elapsedHours, float $budgetHours): float
    {
        if ($budgetHours <= 0) {
            return 0.0;
        }

        return round(($elapsedHours / $budgetHours) * 100, 1);
    }

    private function toneForPercent(float $percent): string
    {
        if ($percent > 100) {
            return 'critical';
        }

        if ($percent >= 80) {
            return 'warning';
        }

        return 'normal';
    }

    /**
     * @return array{0:int, 1:int}
     */
    private function parseTime(string $value): array
    {
        [$hour, $minute] = array_pad(explode(':', $value, 2), 2, '00');

        return [(int) $hour, (int) $minute];
    }
}
