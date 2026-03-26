<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Report extends Model
{
    protected $fillable = [
        'reporter_user_id',
        'uuid',
        'public_reference',
        'tracking_token',
        'title',
        'category',
        'description',
        'incident_date',
        'incident_location',
        'accused_party',
        'evidence_summary',
        'anonymity_level',
        'reporter_name',
        'reporter_email',
        'reporter_phone',
        'requested_follow_up',
        'witness_available',
        'governance_tags',
        'severity',
        'status',
        'submitted_at',
        'last_public_update_at',
    ];

    protected function casts(): array
    {
        return [
            'incident_date' => 'date',
            'reporter_name' => 'encrypted',
            'reporter_email' => 'encrypted',
            'reporter_phone' => 'encrypted',
            'requested_follow_up' => 'boolean',
            'witness_available' => 'boolean',
            'governance_tags' => 'array',
            'submitted_at' => 'datetime',
            'last_public_update_at' => 'datetime',
        ];
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function caseFile(): HasOne
    {
        return $this->hasOne(CaseFile::class);
    }

    public function timelineEvents(): HasMany
    {
        return $this->hasMany(CaseTimelineEvent::class)->orderBy('occurred_at');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class)->orderByDesc('happened_at');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ReportAttachment::class)->orderByDesc('created_at');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CaseMessage::class)->orderBy('created_at');
    }
}
