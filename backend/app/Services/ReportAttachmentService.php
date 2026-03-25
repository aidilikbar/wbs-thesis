<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Report;
use App\Models\ReportAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportAttachmentService
{
    public function storeUploadedFile(Report $report, User $user, UploadedFile $file): ReportAttachment
    {
        $diskName = config('wbs.attachments.disk', 'attachments');
        $disk = Storage::disk($diskName);
        $uuid = (string) Str::uuid();
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $path = sprintf(
            'reports/%s/attachments/%s%s',
            $report->uuid,
            $uuid,
            $extension !== '' ? ".{$extension}" : ''
        );

        $stream = fopen($file->getRealPath(), 'r');
        $disk->writeStream($path, $stream, [
            'visibility' => 'private',
            'ContentType' => $file->getMimeType(),
        ]);
        if (is_resource($stream)) {
            fclose($stream);
        }

        try {
            $attachment = $report->attachments()->create([
                'uploaded_by_user_id' => $user->id,
                'uuid' => $uuid,
                'disk' => $diskName,
                'bucket' => config("filesystems.disks.{$diskName}.bucket"),
                'object_key' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'extension' => $extension !== '' ? $extension : null,
                'size_bytes' => $file->getSize(),
                'checksum_sha256' => hash_file('sha256', $file->getRealPath()),
            ]);

            $this->recordAudit(
                action: 'attachment_uploaded_by_reporter',
                report: $report,
                actor: $user,
                auditableId: $attachment->id,
                context: [
                    'attachment_id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'size_bytes' => $attachment->size_bytes,
                ],
            );

            return $attachment;
        } catch (\Throwable $exception) {
            $disk->delete($path);

            throw $exception;
        }
    }

    public function deleteAttachment(ReportAttachment $attachment, User $actor): void
    {
        $report = $attachment->report()->with('caseFile')->firstOrFail();

        Storage::disk($attachment->disk)->delete($attachment->object_key);
        $attachmentId = $attachment->id;
        $attachmentName = $attachment->original_name;
        $attachment->delete();

        $this->recordAudit(
            action: 'attachment_deleted_by_reporter',
            report: $report,
            actor: $actor,
            auditableId: $attachmentId,
            context: [
                'attachment_id' => $attachmentId,
                'original_name' => $attachmentName,
            ],
        );
    }

    private function recordAudit(
        string $action,
        Report $report,
        User $actor,
        int $auditableId,
        array $context
    ): void {
        AuditLog::query()->create([
            'auditable_type' => ReportAttachment::class,
            'auditable_id' => $auditableId,
            'report_id' => $report->id,
            'case_file_id' => $report->caseFile?->id,
            'actor_role' => $actor->role,
            'actor_name' => $actor->name,
            'action' => $action,
            'context' => $context,
            'happened_at' => now(),
        ]);
    }
}
