<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\User;

class SystemSettingService
{
    private const OPERATIONAL_KPI_KEY = 'operational_kpis';

    public function getOperationalKpiSettings(): array
    {
        $defaults = config('wbs.operational_kpis', []);
        $record = $this->storedOperationalKpiRecord();
        $stored = $record?->value ?? [];

        $settings = [
            'timezone' => (string) ($stored['timezone'] ?? $defaults['timezone'] ?? config('app.timezone', 'UTC')),
            'workday_start' => (string) ($stored['workday_start'] ?? $defaults['workday_start'] ?? '08:00'),
            'workday_end' => (string) ($stored['workday_end'] ?? $defaults['workday_end'] ?? '16:00'),
            'weekend_days' => array_values(array_unique(array_map(
                'intval',
                $stored['weekend_days'] ?? $defaults['weekend_days'] ?? [6, 7]
            ))),
            'non_working_dates' => array_values(array_unique($stored['non_working_dates'] ?? $defaults['non_working_dates'] ?? [])),
            'verification_screening_hours' => $this->stepBudget($defaults, $stored, 'verification', 'screening', 'verification_screening_hours'),
            'verification_work_hours' => $this->stepBudget($defaults, $stored, 'verification', 'verification', 'verification_work_hours'),
            'verification_approval_hours' => $this->stepBudget($defaults, $stored, 'verification', 'approval', 'verification_approval_hours'),
            'investigation_delegation_hours' => $this->stepBudget($defaults, $stored, 'investigation', 'delegation', 'investigation_delegation_hours'),
            'investigation_work_hours' => $this->stepBudget($defaults, $stored, 'investigation', 'investigation', 'investigation_work_hours'),
            'investigation_approval_hours' => $this->stepBudget($defaults, $stored, 'investigation', 'approval', 'investigation_approval_hours'),
            'director_approval_hours' => $this->stepBudget($defaults, $stored, 'investigation', 'director', 'director_approval_hours'),
        ];

        $settings['verification_total_hours'] = $this->verificationTotalHours($settings);
        $settings['investigation_total_hours'] = $this->investigationTotalHours($settings);
        $settings['updated_at'] = $record?->updated_at?->toIso8601String();
        $settings['updated_by_user_id'] = $record?->updated_by_user_id;
        $settings['updated_by_name'] = $record?->updatedBy?->name;

        return $settings;
    }

    public function getOperationalKpiConfiguration(): array
    {
        $defaults = config('wbs.operational_kpis', []);
        $settings = $this->getOperationalKpiSettings();

        return [
            'timezone' => $settings['timezone'],
            'workday_start' => $settings['workday_start'],
            'workday_end' => $settings['workday_end'],
            'weekend_days' => $settings['weekend_days'],
            'non_working_dates' => $settings['non_working_dates'],
            'phases' => [
                'verification' => [
                    'label' => $defaults['phases']['verification']['label'] ?? 'Verification Time',
                    'budget_hours' => $settings['verification_total_hours'],
                    'steps' => [
                        [
                            'key' => 'screening',
                            'label' => $this->stepLabel($defaults, 'verification', 'screening', 'Screening / Delegation'),
                            'budget_hours' => $settings['verification_screening_hours'],
                        ],
                        [
                            'key' => 'verification',
                            'label' => $this->stepLabel($defaults, 'verification', 'verification', 'Verification Work'),
                            'budget_hours' => $settings['verification_work_hours'],
                        ],
                        [
                            'key' => 'approval',
                            'label' => $this->stepLabel($defaults, 'verification', 'approval', 'Supervisory Approval'),
                            'budget_hours' => $settings['verification_approval_hours'],
                        ],
                    ],
                ],
                'investigation' => [
                    'label' => $defaults['phases']['investigation']['label'] ?? 'Investigation Time',
                    'budget_hours' => $settings['investigation_total_hours'],
                    'steps' => [
                        [
                            'key' => 'delegation',
                            'label' => $this->stepLabel($defaults, 'investigation', 'delegation', 'Delegation'),
                            'budget_hours' => $settings['investigation_delegation_hours'],
                        ],
                        [
                            'key' => 'investigation',
                            'label' => $this->stepLabel($defaults, 'investigation', 'investigation', 'Investigation Work'),
                            'budget_hours' => $settings['investigation_work_hours'],
                        ],
                        [
                            'key' => 'approval',
                            'label' => $this->stepLabel($defaults, 'investigation', 'approval', 'Supervisory Approval'),
                            'budget_hours' => $settings['investigation_approval_hours'],
                        ],
                        [
                            'key' => 'director',
                            'label' => $this->stepLabel($defaults, 'investigation', 'director', 'Director Approval'),
                            'budget_hours' => $settings['director_approval_hours'],
                        ],
                    ],
                ],
            ],
        ];
    }

    public function updateOperationalKpiSettings(array $payload, User $updatedBy): array
    {
        $normalized = [
            'timezone' => (string) ($payload['timezone'] ?? config('wbs.operational_kpis.timezone', config('app.timezone', 'UTC'))),
            'workday_start' => (string) $payload['workday_start'],
            'workday_end' => (string) $payload['workday_end'],
            'weekend_days' => array_values(array_unique(array_map('intval', $payload['weekend_days'] ?? [6, 7]))),
            'non_working_dates' => array_values(array_unique($payload['non_working_dates'] ?? [])),
            'verification_screening_hours' => (float) $payload['verification_screening_hours'],
            'verification_work_hours' => (float) $payload['verification_work_hours'],
            'verification_approval_hours' => (float) $payload['verification_approval_hours'],
            'investigation_delegation_hours' => (float) $payload['investigation_delegation_hours'],
            'investigation_work_hours' => (float) $payload['investigation_work_hours'],
            'investigation_approval_hours' => (float) $payload['investigation_approval_hours'],
            'director_approval_hours' => (float) $payload['director_approval_hours'],
        ];

        SystemSetting::query()->updateOrCreate(
            ['key' => self::OPERATIONAL_KPI_KEY],
            [
                'value' => $normalized,
                'updated_by_user_id' => $updatedBy->id,
            ],
        );

        return $this->getOperationalKpiSettings();
    }

    private function storedOperationalKpiRecord(): ?SystemSetting
    {
        return SystemSetting::query()
            ->where('key', self::OPERATIONAL_KPI_KEY)
            ->with('updatedBy:id,name')
            ->first();
    }

    private function stepBudget(
        array $defaults,
        array $stored,
        string $phase,
        string $stepKey,
        ?string $storedKey = null,
    ): float
    {
        $storedKey ??= "{$phase}_{$stepKey}_hours";

        if (array_key_exists($storedKey, $stored)) {
            return (float) $stored[$storedKey];
        }

        foreach ($defaults['phases'][$phase]['steps'] ?? [] as $step) {
            if (($step['key'] ?? null) === $stepKey) {
                return (float) ($step['budget_hours'] ?? 0);
            }
        }

        return 0.0;
    }

    private function stepLabel(array $defaults, string $phase, string $stepKey, string $fallback): string
    {
        foreach ($defaults['phases'][$phase]['steps'] ?? [] as $step) {
            if (($step['key'] ?? null) === $stepKey) {
                return (string) ($step['label'] ?? $fallback);
            }
        }

        return $fallback;
    }

    private function verificationTotalHours(array $settings): float
    {
        return (float) (
            $settings['verification_screening_hours']
            + $settings['verification_work_hours']
            + $settings['verification_approval_hours']
        );
    }

    private function investigationTotalHours(array $settings): float
    {
        return (float) (
            $settings['investigation_delegation_hours']
            + $settings['investigation_work_hours']
            + $settings['investigation_approval_hours']
            + $settings['director_approval_hours']
        );
    }
}
