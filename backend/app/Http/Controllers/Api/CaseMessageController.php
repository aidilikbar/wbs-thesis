<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCaseMessageRequest;
use App\Models\CaseFile;
use App\Models\CaseMessage;
use App\Models\CaseMessageAttachment;
use App\Models\Report;
use App\Models\User;
use App\Services\CaseMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CaseMessageController extends Controller
{
    public function reporterIndex(
        Request $request,
        Report $report,
        CaseMessageService $messages,
    ): JsonResponse {
        $reporter = $this->authorizeReporterOwner($request, $report);
        $caseFile = $report->caseFile()->with(['messages.attachments'])->firstOrFail();

        return response()->json([
            'data' => $this->transformConversation(
                report: $report->fresh(),
                caseFile: $caseFile,
                viewer: $reporter,
                messages: $messages
            ),
        ]);
    }

    public function reporterStore(
        StoreCaseMessageRequest $request,
        Report $report,
        CaseMessageService $messages,
    ): JsonResponse {
        $reporter = $this->authorizeReporterOwner($request, $report);
        $caseFile = $report->caseFile()->firstOrFail();

        abort_unless(
            $messages->canReporterSend($caseFile, $report, $reporter),
            422,
            'Secure communication is available only during active verification or investigation handling.'
        );

        $message = $messages->storeMessage($report, $caseFile, $reporter, [
            ...$request->validated(),
            'attachments' => $request->file('attachments', []),
        ]);

        return response()->json([
            'message' => 'Secure message sent successfully.',
            'data' => $this->transformMessage($message),
        ], 201);
    }

    public function reporterDownload(
        Request $request,
        Report $report,
        CaseMessage $message,
        CaseMessageAttachment $attachment,
    ): StreamedResponse {
        $this->authorizeReporterOwner($request, $report);
        $this->authorizeMessageForReport($report, $message, $attachment);

        return Storage::disk($attachment->disk)->download(
            $attachment->object_key,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    public function workflowIndex(
        Request $request,
        CaseFile $caseFile,
        CaseMessageService $messages,
    ): JsonResponse {
        $viewer = $this->authorizeInternalViewer($request, $caseFile, $messages);
        $caseFile->load(['report', 'messages.attachments']);

        return response()->json([
            'data' => $this->transformConversation(
                report: $caseFile->report,
                caseFile: $caseFile,
                viewer: $viewer,
                messages: $messages
            ),
        ]);
    }

    public function workflowStore(
        StoreCaseMessageRequest $request,
        CaseFile $caseFile,
        CaseMessageService $messages,
    ): JsonResponse {
        $sender = $this->authorizeInternalSender($request, $caseFile, $messages);
        $caseFile->load('report');
        $message = $messages->storeMessage($caseFile->report, $caseFile, $sender, [
            ...$request->validated(),
            'attachments' => $request->file('attachments', []),
        ]);

        return response()->json([
            'message' => 'Secure message sent successfully.',
            'data' => $this->transformMessage($message),
        ], 201);
    }

    public function workflowDownload(
        Request $request,
        CaseFile $caseFile,
        CaseMessage $message,
        CaseMessageAttachment $attachment,
        CaseMessageService $messages,
    ): StreamedResponse {
        $this->authorizeInternalViewer($request, $caseFile, $messages);
        $this->authorizeMessageForCase($caseFile, $message, $attachment);

        return Storage::disk($attachment->disk)->download(
            $attachment->object_key,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    private function authorizeReporterOwner(Request $request, Report $report): User
    {
        $user = $request->user();

        abort_unless($user?->hasRole(User::ROLE_REPORTER), 403, 'Reporter access required.');
        abort_if((int) $report->reporter_user_id !== (int) $user->id, 404, 'Report not found.');

        return $user;
    }

    private function authorizeInternalViewer(
        Request $request,
        CaseFile $caseFile,
        CaseMessageService $messages,
    ): User {
        $user = $request->user();

        abort_unless($user && $user->isInternalUser(), 403, 'Internal role access required.');
        abort_unless($messages->canInternalView($caseFile, $user), 403, 'You do not have access to this secure communication channel.');

        return $user;
    }

    private function authorizeInternalSender(
        Request $request,
        CaseFile $caseFile,
        CaseMessageService $messages,
    ): User {
        $user = $this->authorizeInternalViewer($request, $caseFile, $messages);

        abort_unless(
            $messages->canInternalSend($caseFile, $user),
            422,
            'Only the assigned verification officer or investigator may send messages during the active communication stage.'
        );

        return $user;
    }

    private function authorizeMessageForReport(
        Report $report,
        CaseMessage $message,
        CaseMessageAttachment $attachment,
    ): void {
        abort_if((int) $message->report_id !== (int) $report->id, 404, 'Message not found.');
        abort_if((int) $attachment->case_message_id !== (int) $message->id, 404, 'Attachment not found.');
    }

    private function authorizeMessageForCase(
        CaseFile $caseFile,
        CaseMessage $message,
        CaseMessageAttachment $attachment,
    ): void {
        abort_if((int) $message->case_file_id !== (int) $caseFile->id, 404, 'Message not found.');
        abort_if((int) $attachment->case_message_id !== (int) $message->id, 404, 'Attachment not found.');
    }

    private function transformConversation(
        Report $report,
        CaseFile $caseFile,
        User $viewer,
        CaseMessageService $messages,
    ): array {
        $context = $messages->conversationContext($caseFile);
        $viewerIsReporter = $viewer->hasRole(User::ROLE_REPORTER);

        return [
            'enabled' => $context['enabled'],
            'active_stage' => $context['active_stage'],
            'active_stage_label' => $context['active_stage_label'],
            'counterparty_role' => $viewerIsReporter ? $context['partner_role'] : User::ROLE_REPORTER,
            'counterparty_role_label' => $viewerIsReporter
                ? $context['partner_role_label']
                : config('wbs.roles.'.User::ROLE_REPORTER),
            'can_send_message' => $viewerIsReporter
                ? $messages->canReporterSend($caseFile, $report, $viewer)
                : $messages->canInternalSend($caseFile, $viewer),
            'messages' => $caseFile->messages
                ->loadMissing('attachments')
                ->map(fn (CaseMessage $message) => $this->transformMessage($message)),
        ];
    }

    private function transformMessage(CaseMessage $message): array
    {
        return [
            'id' => $message->id,
            'sender_role' => $message->sender_role,
            'sender_role_label' => config("wbs.roles.{$message->sender_role}", $message->sender_role),
            'stage' => $message->stage,
            'stage_label' => config("wbs.case_stages.{$message->stage}", $message->stage),
            'body' => $message->body,
            'sent_at' => $message->created_at?->toISOString(),
            'attachments' => $message->attachments
                ->values()
                ->map(fn (CaseMessageAttachment $attachment) => [
                    'id' => $attachment->id,
                    'uuid' => $attachment->uuid,
                    'original_name' => $attachment->original_name,
                    'mime_type' => $attachment->mime_type,
                    'extension' => $attachment->extension,
                    'size_bytes' => $attachment->size_bytes,
                    'checksum_sha256' => $attachment->checksum_sha256,
                    'uploaded_at' => $attachment->created_at?->toISOString(),
                ]),
        ];
    }
}
