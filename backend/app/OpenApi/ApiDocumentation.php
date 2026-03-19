<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '2.0.0',
    title: 'KPK Whistleblowing System API',
    description: 'Interactive API documentation for the role-based KPK Whistleblowing System prototype.'
)]
#[OA\Server(
    url: 'http://localhost:8000',
    description: 'Local Laravel backend'
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
    name: 'Governance Dashboard',
    description: 'Oversight metrics, governance controls, and audit activity.'
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
    required: ['title', 'category', 'description', 'confidentiality_level'],
    properties: [
        new OA\Property(property: 'title', type: 'string', example: 'Potential bribery during permit approval'),
        new OA\Property(property: 'category', type: 'string', example: 'bribery'),
        new OA\Property(property: 'description', type: 'string', example: 'A staff member allegedly requested an unofficial payment to accelerate a permit approval.'),
        new OA\Property(property: 'incident_date', type: 'string', format: 'date', nullable: true, example: '2026-03-17'),
        new OA\Property(property: 'incident_location', type: 'string', nullable: true, example: 'Permit Approval Desk'),
        new OA\Property(property: 'accused_party', type: 'string', nullable: true, example: 'Permit Officer'),
        new OA\Property(property: 'evidence_summary', type: 'string', nullable: true, example: 'Messaging screenshots and approval timestamps are available.'),
        new OA\Property(property: 'confidentiality_level', type: 'string', enum: ['confidential', 'identified'], example: 'confidential'),
        new OA\Property(property: 'requested_follow_up', type: 'boolean', example: true),
        new OA\Property(property: 'witness_available', type: 'boolean', example: true),
        new OA\Property(property: 'governance_tags', type: 'array', items: new OA\Items(type: 'string'), example: ['leadership', 'financial-loss']),
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
                new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                new OA\Property(property: 'tracking_token', type: 'string', example: 'ABCD1234EFGH'),
                new OA\Property(property: 'case_number', type: 'string', example: 'CASE-2026-0001'),
                new OA\Property(property: 'status', type: 'string', example: 'submitted'),
                new OA\Property(property: 'severity', type: 'string', example: 'high'),
                new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-19T09:00:00Z'),
                new OA\Property(property: 'next_steps', type: 'array', items: new OA\Items(type: 'string')),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'ReporterReportListResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'array',
            items: new OA\Items(
                type: 'object',
                properties: [
                    new OA\Property(property: 'id', type: 'integer', example: 1),
                    new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                    new OA\Property(property: 'tracking_token', type: 'string', example: 'ABCD1234EFGH'),
                    new OA\Property(property: 'title', type: 'string', example: 'Potential bribery during permit approval'),
                    new OA\Property(property: 'status', type: 'string', example: 'submitted'),
                    new OA\Property(property: 'severity', type: 'string', example: 'high'),
                    new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-19T09:00:00Z'),
                ]
            )
        ),
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
                new OA\Property(property: 'confidentiality_level', type: 'string', example: 'confidential'),
                new OA\Property(property: 'case', type: 'object', additionalProperties: true),
                new OA\Property(property: 'timeline', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'DelegateCaseRequest',
    type: 'object',
    required: ['assignee_user_id'],
    properties: [
        new OA\Property(property: 'assignee_user_id', type: 'integer', example: 2),
        new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Verification Desk'),
        new OA\Property(property: 'due_in_days', type: 'integer', nullable: true, example: 7),
    ]
)]
#[OA\Schema(
    schema: 'SubmitWorkflowStageRequest',
    type: 'object',
    required: ['internal_note'],
    properties: [
        new OA\Property(property: 'internal_note', type: 'string', example: 'Verification completed and ready for supervisory review.'),
        new OA\Property(property: 'publish_update', type: 'boolean', example: true),
        new OA\Property(property: 'public_message', type: 'string', nullable: true, example: 'The report has completed verification and is pending supervisory review.'),
    ]
)]
#[OA\Schema(
    schema: 'ReviewWorkflowStageRequest',
    type: 'object',
    required: ['decision', 'internal_note'],
    properties: [
        new OA\Property(property: 'decision', type: 'string', enum: ['approved', 'rejected'], example: 'approved'),
        new OA\Property(property: 'internal_note', type: 'string', example: 'Verification approved and transferred to the supervisor of investigator.'),
        new OA\Property(property: 'publish_update', type: 'boolean', example: true),
        new OA\Property(property: 'public_message', type: 'string', nullable: true, example: 'The report passed verification and is moving into investigation allocation.'),
    ]
)]
#[OA\Schema(
    schema: 'WorkflowCaseListResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
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
                    new OA\Property(property: 'current_role_label', type: 'string', example: 'Supervisor of Verificator'),
                    new OA\Property(property: 'assigned_to', type: 'string', nullable: true, example: 'Sinta Pramudita'),
                    new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Verification Supervision'),
                    new OA\Property(property: 'available_actions', type: 'array', items: new OA\Items(type: 'string'), example: ['delegate_verification']),
                ]
            )
        ),
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
                    new OA\Property(property: 'role_label', type: 'string', example: 'Verificator'),
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
        new OA\Property(property: 'name', type: 'string', example: 'Supervisor Verificator'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'supervisor.verificator@example.test'),
        new OA\Property(property: 'phone', type: 'string', example: '+62-812-0000-0002'),
        new OA\Property(property: 'role', type: 'string', example: 'supervisor_of_verificator'),
        new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'Verification Supervision'),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Password123'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'Password123'),
    ]
)]
#[OA\Schema(
    schema: 'UserListResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'array',
            items: new OA\Items(
                type: 'object',
                properties: [
                    new OA\Property(property: 'id', type: 'integer', example: 1),
                    new OA\Property(property: 'name', type: 'string', example: 'System Administrator'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'sysadmin@example.test'),
                    new OA\Property(property: 'role', type: 'string', example: 'system_administrator'),
                    new OA\Property(property: 'role_label', type: 'string', example: 'System Administrator'),
                    new OA\Property(property: 'unit', type: 'string', nullable: true, example: 'System Administration'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ]
            )
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
                new OA\Property(property: 'metrics', type: 'object', additionalProperties: true),
                new OA\Property(property: 'risk_distribution', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
                new OA\Property(property: 'status_breakdown', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
                new OA\Property(property: 'controls', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
                new OA\Property(property: 'recent_audit_logs', type: 'array', items: new OA\Items(type: 'object', additionalProperties: true)),
            ]
        ),
    ]
)]
final class ApiDocumentation
{
}
