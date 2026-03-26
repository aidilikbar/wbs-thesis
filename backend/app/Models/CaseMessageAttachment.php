<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseMessageAttachment extends Model
{
    protected $fillable = [
        'case_message_id',
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

    public function message(): BelongsTo
    {
        return $this->belongsTo(CaseMessage::class, 'case_message_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
