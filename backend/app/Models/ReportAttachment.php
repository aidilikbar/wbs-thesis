<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportAttachment extends Model
{
    protected $fillable = [
        'report_id',
        'uploaded_by_user_id',
        'uuid',
        'disk',
        'bucket',
        'object_key',
        'original_name',
        'mime_type',
        'extension',
        'size_bytes',
        'checksum_sha256',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
