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
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'triaged_at' => 'datetime',
            'sla_due_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'escalation_required' => 'boolean',
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
}
