<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportAttachmentRequest;
use App\Models\CaseFile;
use App\Models\Report;
use App\Models\ReportAttachment;
use App\Models\User;
use App\Services\ReportAttachmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class ReportAttachmentController extends Controller
{
    #[OA\Post(
        path: '/api/reporter/reports/{report}/attachments',
        operationId: 'uploadReporterAttachment',
        summary: 'Upload a reporter attachment',
        description: 'Uploads an evidence attachment to object storage for a reporter-owned report.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'report', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['file'],
                    properties: [
                        new OA\Property(property: 'file', type: 'string', format: 'binary'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Attachment uploaded.', content: new OA\JsonContent(ref: '#/components/schemas/AttachmentMutationResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function reporterStore(
        StoreReportAttachmentRequest $request,
        Report $report,
        ReportAttachmentService $attachments,
    ): JsonResponse
    {
        $user = $this->authorizeOwnedReport($request, $report);
        abort_if($report->status === 'completed', 422, 'Completed reports can no longer accept new attachments.');
        $attachment = $attachments->storeUploadedFile($report, $user, $request->file('file'));

        return response()->json([
            'message' => 'Attachment uploaded successfully.',
            'data' => $this->transformAttachment($attachment),
        ], 201);
    }

    #[OA\Delete(
        path: '/api/reporter/reports/{report}/attachments/{attachment}',
        operationId: 'deleteReporterAttachment',
        summary: 'Delete a reporter attachment',
        description: 'Deletes a reporter-owned attachment from object storage and metadata storage.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'report', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'attachment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Attachment deleted.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'Attachment not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
            new OA\Response(response: 422, description: 'Deletion blocked.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function reporterDestroy(
        Request $request,
        Report $report,
        ReportAttachment $attachment,
        ReportAttachmentService $attachments,
    ): JsonResponse
    {
        $user = $this->authorizeOwnedReport($request, $report);
        $this->authorizeAttachmentForReport($report, $attachment);
        abort_if($report->status === 'completed', 422, 'Completed reports can no longer remove attachments.');
        $attachments->deleteAttachment($attachment, $user);

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }

    #[OA\Get(
        path: '/api/reporter/reports/{report}/attachments/{attachment}/download',
        operationId: 'downloadReporterAttachment',
        summary: 'Download a reporter attachment',
        description: 'Downloads an attachment belonging to the authenticated reporter report.',
        tags: ['Reporter Workspace'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'report', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'attachment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Attachment download stream.'),
            new OA\Response(response: 403, description: 'Reporter access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'Attachment not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
        ]
    )]
    public function reporterDownload(Request $request, Report $report, ReportAttachment $attachment)
    {
        $this->authorizeOwnedReport($request, $report);
        $this->authorizeAttachmentForReport($report, $attachment);

        return Storage::disk($attachment->disk)->download(
            $attachment->object_key,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    #[OA\Get(
        path: '/api/workflow/cases/{caseFile}/attachments/{attachment}/download',
        operationId: 'downloadWorkflowAttachment',
        summary: 'Download a workflow case attachment',
        description: 'Downloads an attachment for an internal user authorized on the current case.',
        tags: ['Workflow'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'caseFile', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'attachment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Attachment download stream.'),
            new OA\Response(response: 403, description: 'Internal role access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'Attachment not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
        ]
    )]
    public function workflowDownload(Request $request, CaseFile $caseFile, ReportAttachment $attachment)
    {
        $this->authorizeInternalCaseAccess($request, $caseFile);
        $this->authorizeAttachmentForReport($caseFile->report, $attachment);

        return Storage::disk($attachment->disk)->download(
            $attachment->object_key,
            $attachment->original_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    public function transformAttachment(ReportAttachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'uuid' => $attachment->uuid,
            'original_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'extension' => $attachment->extension,
            'size_bytes' => $attachment->size_bytes,
            'checksum_sha256' => $attachment->checksum_sha256,
            'uploaded_at' => $attachment->created_at?->toISOString(),
        ];
    }

    private function authorizeOwnedReport(Request $request, Report $report): User
    {
        $user = $request->user();

        abort_unless($user?->hasRole(User::ROLE_REPORTER), 403, 'Only registered reporters may manage attachments.');
        abort_if((int) $report->reporter_user_id !== (int) $user->id, 404, 'Report not found.');

        return $user;
    }

    private function authorizeAttachmentForReport(Report $report, ReportAttachment $attachment): void
    {
        abort_if((int) $attachment->report_id !== (int) $report->id, 404, 'Attachment not found.');
    }

    private function authorizeInternalCaseAccess(Request $request, CaseFile $caseFile): User
    {
        $user = $request->user();
        abort_unless($user && $user->canAccessWorkflow(), 403, 'This attachment is restricted to workflow roles.');

        if ($user->hasRole(User::ROLE_SYSTEM_ADMINISTRATOR)) {
            return $user;
        }

        $authorized = match ($user->role) {
            User::ROLE_SUPERVISOR_OF_VERIFICATOR => (int) $caseFile->verification_supervisor_id === (int) $user->id,
            User::ROLE_VERIFICATOR => (int) $caseFile->verificator_id === (int) $user->id,
            User::ROLE_SUPERVISOR_OF_INVESTIGATOR => (int) $caseFile->investigation_supervisor_id === (int) $user->id,
            User::ROLE_INVESTIGATOR => (int) $caseFile->investigator_id === (int) $user->id,
            User::ROLE_DIRECTOR => (int) $caseFile->director_id === (int) $user->id,
            default => false,
        };

        abort_unless($authorized, 403, 'You do not have access to this case attachment.');

        return $user;
    }
}
