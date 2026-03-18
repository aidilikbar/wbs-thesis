<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'auditable_type',
        'auditable_id',
        'report_id',
        'case_file_id',
        'actor_role',
        'actor_name',
        'action',
        'context',
        'happened_at',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'happened_at' => 'datetime',
        ];
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function caseFile(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class);
    }
}
