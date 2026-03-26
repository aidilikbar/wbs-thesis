<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\CaseMessage;
use App\Models\CaseMessageAttachment;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CaseMessageService
{
    public function conversationContext(CaseFile $caseFile): array
    {
        $activeStage = $this->activeConversationStage($caseFile);
        $partnerRole = $activeStage === 'verification_in_progress'
            ? User::ROLE_VERIFICATOR
            : ($activeStage === 'investigation_in_progress'
                ? User::ROLE_INVESTIGATOR
                : null);

        return [
            'enabled' => $activeStage !== null,
            'active_stage' => $activeStage,
            'active_stage_label' => $activeStage
                ? config("wbs.case_stages.{$activeStage}", $activeStage)
                : null,
            'partner_role' => $partnerRole,
            'partner_role_label' => $partnerRole
                ? config("wbs.roles.{$partnerRole}", $partnerRole)
                : null,
        ];
    }

    public function canReporterView(Report $report, User $reporter): bool
    {
        return $reporter->hasRole(User::ROLE_REPORTER)
            && (int) $report->reporter_user_id === (int) $reporter->id;
    }

    public function canReporterSend(CaseFile $caseFile, Report $report, User $reporter): bool
    {
        return $this->canReporterView($report, $reporter)
            && $this->activeConversationStage($caseFile) !== null;
    }

    public function canInternalView(CaseFile $caseFile, User $user): bool
    {
        if ($user->hasRole(User::ROLE_VERIFICATOR)) {
            return (int) $caseFile->verificator_id === (int) $user->id;
        }

        if ($user->hasRole(User::ROLE_INVESTIGATOR)) {
            return (int) $caseFile->investigator_id === (int) $user->id;
        }

        return false;
    }

    public function canInternalSend(CaseFile $caseFile, User $user): bool
    {
        return match ($caseFile->stage) {
            'verification_in_progress' => $user->hasRole(User::ROLE_VERIFICATOR)
                && (int) $caseFile->verificator_id === (int) $user->id,
            'investigation_in_progress' => $user->hasRole(User::ROLE_INVESTIGATOR)
                && (int) $caseFile->investigator_id === (int) $user->id,
            default => false,
        };
    }

    public function storeMessage(Report $report, CaseFile $caseFile, User $sender, array $payload): CaseMessage
    {
        $uploadedPaths = [];

        try {
            return DB::transaction(function () use ($caseFile, $payload, $report, $sender, &$uploadedPaths) {
                $message = $caseFile->messages()->create([
                    'report_id' => $report->id,
                    'sender_user_id' => $sender->id,
                    'sender_role' => $sender->role,
                    'stage' => $caseFile->stage,
                    'body' => trim((string) ($payload['body'] ?? '')) ?: null,
                ]);

                foreach ($payload['attachments'] ?? [] as $file) {
                    $attachment = $this->storeAttachment($message, $sender, $file);
                    $uploadedPaths[] = [
                        'disk' => $attachment->disk,
                        'path' => $attachment->object_key,
                    ];
                }

                $caseFile->forceFill([
                    'last_activity_at' => now(),
                ])->save();

                $this->recordAudit(
                    report: $report,
                    caseFile: $caseFile,
                    message: $message,
                    actor: $sender,
                    action: 'case_message_posted',
                    context: [
                        'stage' => $caseFile->stage,
                        'attachment_count' => $message->attachments()->count(),
                        'body_present' => $message->body !== null,
                    ],
                );

                return $message->fresh(['attachments']);
            });
        } catch (\Throwable $exception) {
            foreach ($uploadedPaths as $uploadedPath) {
                if (! isset($uploadedPath['disk'], $uploadedPath['path'])) {
                    continue;
                }

                Storage::disk($uploadedPath['disk'])->delete($uploadedPath['path']);
            }

            throw $exception;
        }
    }

    private function storeAttachment(CaseMessage $message, User $sender, UploadedFile $file): CaseMessageAttachment
    {
        $diskName = config('wbs.attachments.disk', 'attachments');
        $disk = Storage::disk($diskName);
        $uuid = (string) Str::uuid();
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $path = sprintf(
            'reports/%s/messages/%s/%s%s',
            $message->report->uuid,
            $message->id,
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
            return $message->attachments()->create([
                'uploaded_by_user_id' => $sender->id,
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
        } catch (\Throwable $exception) {
            $disk->delete($path);

            throw $exception;
        }
    }

    private function activeConversationStage(CaseFile $caseFile): ?string
    {
        return in_array($caseFile->stage, ['verification_in_progress', 'investigation_in_progress'], true)
            ? $caseFile->stage
            : null;
    }

    private function recordAudit(
        Report $report,
        CaseFile $caseFile,
        CaseMessage $message,
        User $actor,
        string $action,
        array $context
    ): void {
        AuditLog::query()->create([
            'auditable_type' => CaseMessage::class,
            'auditable_id' => $message->id,
            'report_id' => $report->id,
            'case_file_id' => $caseFile->id,
            'actor_role' => $actor->role,
            'actor_name' => $actor->name,
            'action' => $action,
            'context' => $context,
            'happened_at' => now(),
        ]);
    }
}
