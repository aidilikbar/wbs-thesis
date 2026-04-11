<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '0.2.1',
    title: 'KPK Whistleblowing System API',
    description: 'Interactive API documentation for the role-based KPK Whistleblowing System prototype.'
)]
#[OA\Server(
    url: '/',
    description: 'Current deployment origin'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Token'
)]
#[OA\Tag(
    name: 'Reference Data',
    description: 'Lookup values used by the frontend and operational workflow.'
)]
#[OA\Tag(
    name: 'Authentication',
    description: 'Reporter registration and shared login/logout endpoints.'
)]
#[OA\Tag(
    name: 'Reporter Workspace',
    description: 'Authenticated reporter APIs for report submission and personal report listing.'
)]
#[OA\Tag(
    name: 'Public Tracking',
    description: 'Public-safe case tracking by reference and token.'
)]
#[OA\Tag(
    name: 'Workflow',
    description: 'Role-based internal case workflow endpoints.'
)]
#[OA\Tag(
    name: 'Administration',
    description: 'System administrator endpoints for internal user provisioning.'
)]
#[OA\Tag(
    name: 'Operational Oversight',
    description: 'Oversight metrics, control status, and audit activity.'
)]
#[OA\Schema(
    schema: 'ReportedPartyObject',
    type: 'object',
    required: ['full_name', 'position', 'classification'],
    properties: [
        new OA\Property(property: 'full_name', type: 'string', example: 'Hendra Saptono'),
        new OA\Property(property: 'position', type: 'string', example: 'Procurement Committee Chair'),
        new OA\Property(property: 'classification', type: 'string', enum: ['state_official', 'civil_servant', 'law_enforcement', 'other'], example: 'state_official'),
    ]
)]
#[OA\Schema(
    schema: 'ValidationErrorResponse',
    type: 'object',
    required: ['message', 'errors'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'The given data was invalid.'),
        new OA\Property(
            property: 'errors',
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(
                type: 'array',
                items: new OA\Items(type: 'string')
            )
        ),
    ]
)]
#[OA\Schema(
    schema: 'MessageResponse',
    type: 'object',
    required: ['message'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Operation completed successfully.'),
    ]
)]
#[OA\Schema(
    schema: 'NotFoundResponse',
    type: 'object',
    required: ['message'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Tracking reference or token was not recognised.'),
    ]
)]
#[OA\Schema(
    schema: 'CatalogResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'roles', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'string')),
                new OA\Property(property: 'internal_roles', type: 'array', items: new OA\Items(type: 'string')),
                new OA\Property(property: 'categories', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'string')),
                new OA\Property(property: 'governance_tags', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'string')),
                new OA\Property(property: 'confidentiality_levels', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'string')),
                new OA\Property(property: 'case_stages', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'string')),
                new OA\Property(property: 'principles', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'string')),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'ReporterRegistrationRequest',
    type: 'object',
    required: ['name', 'email', 'phone', 'password', 'password_confirmation'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'Registered Reporter'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'reporter@example.test'),
        new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0001'),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Password123'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'Password123'),
    ]
)]
#[OA\Schema(
    schema: 'LoginRequest',
    type: 'object',
    required: ['email', 'password'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'reporter@example.test'),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Password123'),
    ]
)]
#[OA\Schema(
    schema: 'AuthSessionResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Login successful.'),
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'token', type: 'string', example: '1|plain-text-token'),
                new OA\Property(
                    property: 'user',
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 1),
                        new OA\Property(property: 'name', type: 'string', example: 'Registered Reporter'),
                        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'reporter@example.test'),
                        new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0001'),
                        new OA\Property(property: 'role', type: 'string', example: 'reporter'),
                        new OA\Property(property: 'role_label', type: 'string', example: 'Reporter'),
                        new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'Reporter'),
                        new OA\Property(property: 'is_active', type: 'boolean', example: true),
                    ]
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'CurrentUserResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(
                    property: 'user',
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 1),
                        new OA\Property(property: 'name', type: 'string', example: 'Registered Reporter'),
                        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'reporter@example.test'),
                        new OA\Property(property: 'role', type: 'string', example: 'reporter'),
                        new OA\Property(property: 'role_label', type: 'string', example: 'Reporter'),
                    ]
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'ReportSubmissionRequest',
    type: 'object',
    required: ['title', 'description'],
    properties: [
        new OA\Property(property: 'title', type: 'string', example: 'Possible manipulation in procurement scoring review'),
        new OA\Property(property: 'category', type: 'string', nullable: true, example: 'kpk_report'),
        new OA\Property(property: 'description', type: 'string', example: 'The reporter observed a score adjustment after the technical review had already closed and preserved supporting evidence.'),
        new OA\Property(property: 'reported_parties', type: 'array', nullable: true, items: new OA\Items(ref: '#/components/schemas/ReportedPartyObject')),
        new OA\Property(property: 'incident_date', type: 'string', format: 'date', nullable: true, example: '2026-03-17'),
        new OA\Property(property: 'incident_location', type: 'string', nullable: true, example: 'Permit Approval Desk'),
        new OA\Property(property: 'accused_party', type: 'string', nullable: true, example: 'Permit Officer'),
        new OA\Property(property: 'evidence_summary', type: 'string', nullable: true, example: 'Messaging screenshots and approval timestamps are available.'),
        new OA\Property(property: 'confidentiality_level', type: 'string', nullable: true, enum: ['anonymous', 'identified'], example: 'anonymous'),
        new OA\Property(property: 'requested_follow_up', type: 'boolean', example: true),
        new OA\Property(property: 'witness_available', type: 'boolean', example: true),
        new OA\Property(property: 'governance_tags', type: 'array', items: new OA\Items(type: 'string'), example: ['procurement', 'financial-loss']),
        new OA\Property(
            property: 'attachments',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'binary')
        ),
    ]
)]
#[OA\Schema(
    schema: 'ReportSubmissionResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Report submitted successfully.'),
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'report_id', type: 'integer', example: 1),
                new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                new OA\Property(property: 'tracking_token', type: 'string', example: 'ABCD1234EFGH'),
                new OA\Property(property: 'case_number', type: 'string', example: 'CASE-2026-0001'),
                new OA\Property(property: 'status', type: 'string', example: 'submitted'),
                new OA\Property(property: 'severity', type: 'string', example: 'not_available'),
                new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-19T09:00:00Z'),
                new OA\Property(property: 'next_steps', type: 'array', items: new OA\Items(type: 'string')),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'AttachmentObject',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'uuid', type: 'string', example: '1f296e68-d509-4c86-8b74-86b6cd4b48f0'),
        new OA\Property(property: 'original_name', type: 'string', example: 'invoice-comparison.pdf'),
        new OA\Property(property: 'mime_type', type: 'string', example: 'application/pdf'),
        new OA\Property(property: 'extension', type: 'string', nullable: true, example: 'pdf'),
        new OA\Property(property: 'size_bytes', type: 'integer', example: 248331),
        new OA\Property(property: 'checksum_sha256', type: 'string', nullable: true, example: 'd7f0f35ad8f4d43ff1b3ddc6dcf4d4ea174740a456f7f6d8fa8c7308c0c34437'),
        new OA\Property(property: 'uploaded_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-25T14:15:00Z'),
    ]
)]
#[OA\Schema(
    schema: 'AttachmentMutationResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Attachment uploaded successfully.'),
        new OA\Property(property: 'data', ref: '#/components/schemas/AttachmentObject'),
    ]
)]
#[OA\Schema(
    schema: 'CaseMessageStoreRequest',
    type: 'object',
    properties: [
        new OA\Property(property: 'body', type: 'string', nullable: true, example: 'Please confirm whether the verbal payment request happened before or after the spreadsheet was reopened.'),
        new OA\Property(property: 'attachments', type: 'array', items: new OA\Items(type: 'string', format: 'binary')),
    ]
)]
#[OA\Schema(
    schema: 'CaseMessageRecord',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 5),
        new OA\Property(property: 'sender_role', type: 'string', example: 'verificator'),
        new OA\Property(property: 'sender_role_label', type: 'string', example: 'Verification Officer'),
        new OA\Property(property: 'stage', type: 'string', example: 'verification_in_progress'),
        new OA\Property(property: 'stage_label', type: 'string', example: 'Verification in Progress'),
        new OA\Property(property: 'body', type: 'string', nullable: true, example: 'Verification note received. Please confirm whether the verbal payment request was made before the scoring spreadsheet was reopened.'),
        new OA\Property(property: 'sent_at', type: 'string', format: 'date-time', nullable: true, example: '2026-04-10T12:30:00Z'),
        new OA\Property(property: 'attachments', type: 'array', items: new OA\Items(ref: '#/components/schemas/AttachmentObject')),
    ]
)]
#[OA\Schema(
    schema: 'CaseMessageConversationResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'enabled', type: 'boolean', example: true),
                new OA\Property(property: 'active_stage', type: 'string', nullable: true, example: 'verification_in_progress'),
                new OA\Property(property: 'active_stage_label', type: 'string', nullable: true, example: 'Verification in Progress'),
                new OA\Property(property: 'counterparty_role', type: 'string', nullable: true, example: 'verificator'),
                new OA\Property(property: 'counterparty_role_label', type: 'string', nullable: true, example: 'Verification Officer'),
                new OA\Property(property: 'can_send_message', type: 'boolean', example: true),
                new OA\Property(property: 'messages', type: 'array', items: new OA\Items(ref: '#/components/schemas/CaseMessageRecord')),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'CaseMessageMutationResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Secure message sent successfully.'),
        new OA\Property(property: 'data', ref: '#/components/schemas/CaseMessageRecord'),
    ]
)]
#[OA\Schema(
    schema: 'ReporterReportDirectoryResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(
                    property: 'items',
                    type: 'array',
                    items: new OA\Items(
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'id', type: 'integer', example: 1),
                            new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                            new OA\Property(property: 'tracking_token', type: 'string', example: 'ABCD1234EFGH'),
                            new OA\Property(property: 'title', type: 'string', example: 'Potential bribery during permit approval'),
                            new OA\Property(property: 'category', type: 'string', example: 'bribery'),
                            new OA\Property(property: 'status', type: 'string', example: 'submitted'),
                            new OA\Property(property: 'severity', type: 'string', example: 'not_available'),
                            new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-19T09:00:00Z'),
                            new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-19T10:00:00Z'),
                            new OA\Property(property: 'last_activity_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-19T10:30:00Z'),
                            new OA\Property(property: 'confidentiality_level', type: 'string', example: 'anonymous'),
                            new OA\Property(property: 'is_editable', type: 'boolean', example: true),
                            new OA\Property(property: 'edit_lock_reason', type: 'string', nullable: true, example: null),
                            new OA\Property(property: 'case', type: 'object', additionalProperties: true),
                        ]
                    )
                ),
                new OA\Property(
                    property: 'meta',
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 5),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 42),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                    ]
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'ReporterReportRecordResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 1),
                new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                new OA\Property(property: 'tracking_token', type: 'string', example: 'ABCD1234EFGH'),
                new OA\Property(property: 'title', type: 'string', example: 'Potential bribery during permit approval'),
                new OA\Property(property: 'category', type: 'string', example: 'bribery'),
                new OA\Property(property: 'category_label', type: 'string', example: 'Bribery and gratuities'),
                new OA\Property(property: 'description', type: 'string', example: 'A staff member allegedly requested an unofficial payment to accelerate a permit approval.'),
                new OA\Property(property: 'incident_date', type: 'string', format: 'date', nullable: true, example: '2026-03-17'),
                new OA\Property(property: 'incident_location', type: 'string', nullable: true, example: 'Permit Approval Desk'),
                new OA\Property(property: 'accused_party', type: 'string', nullable: true, example: 'Permit Officer'),
                new OA\Property(property: 'evidence_summary', type: 'string', nullable: true, example: 'Messaging screenshots and approval timestamps are available.'),
                new OA\Property(property: 'confidentiality_level', type: 'string', example: 'anonymous'),
                new OA\Property(property: 'last_public_update_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-20T10:30:00Z'),
                new OA\Property(property: 'requested_follow_up', type: 'boolean', example: true),
                new OA\Property(property: 'witness_available', type: 'boolean', example: true),
                new OA\Property(property: 'governance_tags', type: 'array', items: new OA\Items(type: 'string'), example: ['procurement', 'financial-loss']),
                new OA\Property(property: 'status', type: 'string', example: 'verification_review'),
                new OA\Property(property: 'severity', type: 'string', example: 'high'),
                new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-19T09:00:00Z'),
                new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-19T10:00:00Z'),
                new OA\Property(property: 'last_activity_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-19T10:30:00Z'),
                new OA\Property(property: 'is_editable', type: 'boolean', example: true),
                new OA\Property(property: 'edit_lock_reason', type: 'string', nullable: true, example: null),
                new OA\Property(property: 'reported_parties', type: 'array', items: new OA\Items(ref: '#/components/schemas/ReportedPartyObject')),
                new OA\Property(property: 'case', type: 'object', additionalProperties: true),
                new OA\Property(property: 'timeline', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
                new OA\Property(property: 'attachments', type: 'array', items: new OA\Items(ref: '#/components/schemas/AttachmentObject')),
                new OA\Property(property: 'reporter', type: 'object', additionalProperties: true),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'ReporterReportMutationResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Reporter report updated successfully.'),
        new OA\Property(property: 'data', type: 'object', additionalProperties: true),
    ]
)]
#[OA\Schema(
    schema: 'TrackingRequest',
    type: 'object',
    required: ['reference', 'token'],
    properties: [
        new OA\Property(property: 'reference', type: 'string', example: 'WBS-2026-0001'),
        new OA\Property(property: 'token', type: 'string', example: 'ABCD1234EFGH'),
    ]
)]
#[OA\Schema(
    schema: 'TrackingResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                new OA\Property(property: 'title', type: 'string', example: 'Potential bribery during permit approval'),
                new OA\Property(property: 'category', type: 'string', example: 'bribery'),
                new OA\Property(property: 'category_label', type: 'string', example: 'Bribery and gratuities'),
                new OA\Property(property: 'status', type: 'string', example: 'investigation_in_progress'),
                new OA\Property(property: 'severity', type: 'string', example: 'high'),
                new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-19T09:00:00Z'),
                new OA\Property(property: 'confidentiality_level', type: 'string', example: 'anonymous'),
                new OA\Property(property: 'case', type: 'object', additionalProperties: true),
                new OA\Property(property: 'timeline', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'VerificationDelegationRequest',
    type: 'object',
    properties: [
        new OA\Property(property: 'reject_report', type: 'boolean', example: false),
        new OA\Property(property: 'distribution_note', type: 'string', nullable: true, example: 'Assign to verification officer with procurement background.'),
        new OA\Property(property: 'assignee_user_id', type: 'integer', nullable: true, example: 2),
        new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Verification Desk'),
    ]
)]
#[OA\Schema(
    schema: 'InvestigationDelegationRequest',
    type: 'object',
    required: ['assignee_user_id'],
    properties: [
        new OA\Property(property: 'assignee_user_id', type: 'integer', example: 6),
        new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Investigation Desk'),
        new OA\Property(property: 'distribution_note', type: 'string', nullable: true, example: 'Focus on chronology, linked reports, and authority assessment.'),
    ]
)]
#[OA\Schema(
    schema: 'VerificationSubmissionRequest',
    type: 'object',
    required: ['summary', 'has_authority', 'criminal_assessment', 'reason', 'recommendation'],
    properties: [
        new OA\Property(property: 'summary', type: 'string', example: 'Verification indicates the report concerns procurement scoring irregularities and should continue to investigation.'),
        new OA\Property(property: 'corruption_aspect_tags', type: 'array', items: new OA\Items(type: 'string'), example: ['procurement_irregularity', 'conflict_of_interest']),
        new OA\Property(property: 'has_authority', type: 'boolean', example: true),
        new OA\Property(property: 'criminal_assessment', type: 'string', enum: ['indicated', 'not_indicated'], example: 'indicated'),
        new OA\Property(property: 'reason', type: 'string', example: 'The reopened spreadsheet and verbal request indicate a corruption-related concern within KPK scope.'),
        new OA\Property(property: 'recommendation', type: 'string', enum: ['review', 'forward', 'archive'], example: 'review'),
        new OA\Property(property: 'forwarding_destination', type: 'string', nullable: true, example: 'Local Police'),
    ]
)]
#[OA\Schema(
    schema: 'InvestigationSubmissionRequest',
    type: 'object',
    required: ['case_name', 'reported_parties', 'description', 'recommendation', 'delict', 'article', 'start_month', 'start_year', 'end_month', 'end_year', 'city', 'province', 'modus', 'has_authority', 'is_priority', 'conclusion'],
    properties: [
        new OA\Property(property: 'case_name', type: 'string', example: 'Possible procurement score manipulation and payment request'),
        new OA\Property(property: 'reported_parties', type: 'array', items: new OA\Items(ref: '#/components/schemas/ReportedPartyObject')),
        new OA\Property(property: 'description', type: 'string', example: 'The investigation reconstructs the chronology, related parties, and supporting observations from the reporter submission.'),
        new OA\Property(property: 'corruption_aspect_tags', type: 'array', items: new OA\Items(type: 'string'), example: ['procurement_irregularity', 'bribery']),
        new OA\Property(property: 'recommendation', type: 'string', enum: ['internal_forwarding', 'external_forwarding', 'archive'], example: 'internal_forwarding'),
        new OA\Property(property: 'delict', type: 'string', example: 'bribery'),
        new OA\Property(property: 'article', type: 'string', example: 'article_5_31_1999'),
        new OA\Property(property: 'start_month', type: 'string', example: '03'),
        new OA\Property(property: 'start_year', type: 'string', example: '2026'),
        new OA\Property(property: 'end_month', type: 'string', example: '03'),
        new OA\Property(property: 'end_year', type: 'string', example: '2026'),
        new OA\Property(property: 'city', type: 'string', example: 'Jakarta Selatan'),
        new OA\Property(property: 'province', type: 'string', example: 'DKI Jakarta'),
        new OA\Property(property: 'modus', type: 'string', example: 'The ranking sheet was reopened after closure and the parties discussed an unofficial payment requirement before final circulation.'),
        new OA\Property(property: 'related_report_reference', type: 'string', nullable: true, example: 'WBS-2026-0003'),
        new OA\Property(property: 'has_authority', type: 'boolean', example: true),
        new OA\Property(property: 'is_priority', type: 'boolean', example: false),
        new OA\Property(property: 'additional_information', type: 'string', nullable: true, example: 'A comparison sheet and chronology note were supplied through secure communication.'),
        new OA\Property(property: 'conclusion', type: 'string', example: 'The report should proceed through the internal corruption handling path.'),
    ]
)]
#[OA\Schema(
    schema: 'ReviewWorkflowStageRequest',
    type: 'object',
    required: ['decision', 'approval_note'],
    properties: [
        new OA\Property(property: 'decision', type: 'string', enum: ['approved', 'rejected'], example: 'approved'),
        new OA\Property(property: 'approval_note', type: 'string', example: 'Approved for the next operational stage.'),
    ]
)]
#[OA\Schema(
    schema: 'WorkflowCaseListResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(
                    property: 'items',
                    type: 'array',
                    items: new OA\Items(
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'id', type: 'integer', example: 1),
                            new OA\Property(property: 'case_number', type: 'string', example: 'CASE-2026-0001'),
                            new OA\Property(property: 'stage', type: 'string', example: 'submitted'),
                            new OA\Property(property: 'stage_label', type: 'string', example: 'Submitted'),
                            new OA\Property(property: 'status', type: 'string', example: 'submitted'),
                            new OA\Property(property: 'current_role', type: 'string', example: 'supervisor_of_verificator'),
                            new OA\Property(property: 'current_role_label', type: 'string', example: 'Verification Supervisor'),
                            new OA\Property(property: 'assigned_to', type: 'string', nullable: true, example: 'Sinta Pramudita'),
                            new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Verification Supervision'),
                            new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                            new OA\Property(property: 'title', type: 'string', example: 'Potential bribery during permit approval'),
                            new OA\Property(property: 'category', type: 'string', example: 'bribery'),
                            new OA\Property(property: 'category_label', type: 'string', example: 'Bribery'),
                            new OA\Property(property: 'available_actions', type: 'array', items: new OA\Items(type: 'string'), example: ['delegate_verification']),
                            new OA\Property(property: 'attachments', type: 'array', items: new OA\Items(ref: '#/components/schemas/AttachmentObject')),
                        ]
                    )
                ),
                new OA\Property(
                    property: 'meta',
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 2),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 15),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                    ]
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'WorkflowCaseRecordResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(property: 'data', type: 'object', additionalProperties: true),
    ]
)]
#[OA\Schema(
    schema: 'WorkflowMutationResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Workflow action completed.'),
        new OA\Property(property: 'data', type: 'object', additionalProperties: true),
    ]
)]
#[OA\Schema(
    schema: 'AssigneeListResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'array',
            items: new OA\Items(
                type: 'object',
                properties: [
                    new OA\Property(property: 'id', type: 'integer', example: 2),
                    new OA\Property(property: 'name', type: 'string', example: 'Aditya Prakoso'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'verificator@example.test'),
                    new OA\Property(property: 'role', type: 'string', example: 'verificator'),
                    new OA\Property(property: 'role_label', type: 'string', example: 'Verification Officer'),
                ]
            )
        ),
    ]
)]
#[OA\Schema(
    schema: 'CreateUserRequest',
    type: 'object',
    required: ['name', 'email', 'phone', 'role', 'password', 'password_confirmation'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'Verification Supervisor'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'supervisor.verificator@example.test'),
        new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0002'),
        new OA\Property(property: 'role', type: 'string', example: 'supervisor_of_verificator'),
        new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'Verification Supervision'),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Password123'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'Password123'),
    ]
)]
#[OA\Schema(
    schema: 'UpdateUserRequest',
    type: 'object',
    required: ['name', 'email', 'phone', 'is_active'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'Investigator One Updated'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'investigator.one.updated@example.test'),
        new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0099'),
        new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'Special Investigation Desk'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'password', type: 'string', format: 'password', nullable: true, example: 'Updated123'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', nullable: true, example: 'Updated123'),
    ]
)]
#[OA\Schema(
    schema: 'UserDirectoryResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(
                    property: 'items',
                    type: 'array',
                    items: new OA\Items(
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'id', type: 'integer', example: 1),
                            new OA\Property(property: 'name', type: 'string', example: 'System Administrator'),
                            new OA\Property(property: 'email', type: 'string', format: 'email', example: 'sysadmin@example.test'),
                            new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0001'),
                            new OA\Property(property: 'role', type: 'string', example: 'system_administrator'),
                            new OA\Property(property: 'role_label', type: 'string', example: 'System Administrator'),
                            new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'System Administration'),
                            new OA\Property(property: 'is_active', type: 'boolean', example: true),
                            new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-25T08:15:00Z'),
                        ]
                    )
                ),
                new OA\Property(
                    property: 'meta',
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'current_page', type: 'integer', example: 1),
                        new OA\Property(property: 'last_page', type: 'integer', example: 2),
                        new OA\Property(property: 'per_page', type: 'integer', example: 10),
                        new OA\Property(property: 'total', type: 'integer', example: 12),
                        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
                        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 10),
                    ]
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'UserRecordResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'id', type: 'integer', example: 1),
                new OA\Property(property: 'name', type: 'string', example: 'System Administrator'),
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'sysadmin@example.test'),
                new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0001'),
                new OA\Property(property: 'role', type: 'string', example: 'system_administrator'),
                new OA\Property(property: 'role_label', type: 'string', example: 'System Administrator'),
                new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'System Administration'),
                new OA\Property(property: 'is_active', type: 'boolean', example: true),
                new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-25T08:15:00Z'),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'UserMutationResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Internal user created successfully.'),
        new OA\Property(property: 'data', type: 'object', additionalProperties: true),
    ]
)]
#[OA\Schema(
    schema: 'GovernanceDashboardResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'object',
            properties: [
                new OA\Property(property: 'global', type: 'object', additionalProperties: true),
                new OA\Property(property: 'specific', type: 'object', additionalProperties: true),
            ]
        ),
    ]
)]
final class ApiDocumentation
{
}
