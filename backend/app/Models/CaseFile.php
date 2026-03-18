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
        'disposition',
        'assigned_unit',
        'assigned_to',
        'triaged_at',
        'sla_due_at',
        'last_activity_at',
        'confidentiality_level',
        'escalation_required',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'triaged_at' => 'datetime',
            'sla_due_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'escalation_required' => 'boolean',
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
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
