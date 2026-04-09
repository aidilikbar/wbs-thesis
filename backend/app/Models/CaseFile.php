<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CaseFile extends Model
{
    protected $fillable = [
        'report_id',
        'case_number',
        'stage',
        'current_role',
        'disposition',
        'assigned_unit',
        'assigned_to',
        'verification_supervisor_id',
        'verificator_id',
        'investigation_supervisor_id',
        'investigator_id',
        'director_id',
        'triaged_at',
        'sla_due_at',
        'last_activity_at',
        'confidentiality_level',
        'escalation_required',
        'notes',
        'screening_payload',
        'verification_payload',
        'verification_approval_payload',
        'review_distribution_payload',
        'review_payload',
        'review_approval_payload',
        'director_approval_payload',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'triaged_at' => 'datetime',
            'sla_due_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'escalation_required' => 'boolean',
            'screening_payload' => 'array',
            'verification_payload' => 'array',
            'verification_approval_payload' => 'array',
            'review_distribution_payload' => 'array',
            'review_payload' => 'array',
            'review_approval_payload' => 'array',
            'director_approval_payload' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function verificationSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verification_supervisor_id');
    }

    public function verificator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verificator_id');
    }

    public function investigationSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'investigation_supervisor_id');
    }

    public function investigator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'investigator_id');
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_id');
    }

    public function timelineEvents(): HasMany
    {
        return $this->hasMany(CaseTimelineEvent::class)->orderBy('occurred_at');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class)->orderByDesc('happened_at');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CaseMessage::class)->orderBy('created_at');
    }
}
