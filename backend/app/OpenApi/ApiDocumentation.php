<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'KPK Whistleblowing System API',
    description: 'Interactive API documentation for the governance-oriented whistleblowing backend.'
)]
#[OA\Server(
    url: 'http://localhost:8000',
    description: 'Local Laravel backend'
)]
#[OA\Tag(
    name: 'Reference Data',
    description: 'Lookup values used across the whistleblowing workflow.'
)]
#[OA\Tag(
    name: 'Public Reporting',
    description: 'Endpoints for report submission and public-safe tracking.'
)]
#[OA\Tag(
    name: 'Investigator Portal',
    description: 'Endpoints for investigator and case management operations.'
)]
#[OA\Tag(
    name: 'Governance Dashboard',
    description: 'Oversight metrics, controls, and audit activity.'
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
                new OA\Property(
                    property: 'categories',
                    type: 'object',
                    additionalProperties: new OA\AdditionalProperties(type: 'string')
                ),
                new OA\Property(
                    property: 'governance_tags',
                    type: 'object',
                    additionalProperties: new OA\AdditionalProperties(type: 'string')
                ),
                new OA\Property(
                    property: 'case_stages',
                    type: 'object',
                    additionalProperties: new OA\AdditionalProperties(type: 'string')
                ),
                new OA\Property(
                    property: 'principles',
                    type: 'object',
                    additionalProperties: new OA\AdditionalProperties(type: 'string')
                ),
            ]
        ),
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
    schema: 'ReportSubmissionRequest',
    type: 'object',
    required: ['title', 'category', 'description', 'anonymity_level'],
    properties: [
        new OA\Property(property: 'title', type: 'string', maxLength: 120, example: 'Unusual payment request before vendor evaluation'),
        new OA\Property(
            property: 'category',
            type: 'string',
            enum: ['bribery', 'procurement', 'fraud', 'abuse_of_authority', 'conflict_of_interest', 'harassment', 'retaliation', 'other'],
            example: 'procurement'
        ),
        new OA\Property(property: 'description', type: 'string', minLength: 30, maxLength: 5000, example: 'A procurement officer requested a personal transfer before confirming that a vendor submission would move to the next review stage.'),
        new OA\Property(property: 'incident_date', type: 'string', format: 'date', nullable: true, example: '2026-03-15'),
        new OA\Property(property: 'incident_location', type: 'string', maxLength: 255, nullable: true, example: 'Procurement Unit'),
        new OA\Property(property: 'accused_party', type: 'string', maxLength: 255, nullable: true, example: 'Procurement Officer'),
        new OA\Property(property: 'evidence_summary', type: 'string', maxLength: 1500, nullable: true, example: 'Email excerpts and witness details can be provided on request.'),
        new OA\Property(
            property: 'anonymity_level',
            type: 'string',
            enum: ['anonymous', 'confidential', 'identified'],
            example: 'anonymous'
        ),
        new OA\Property(property: 'reporter_name', type: 'string', maxLength: 120, nullable: true, example: 'Protected Reporter'),
        new OA\Property(property: 'reporter_email', type: 'string', format: 'email', maxLength: 120, nullable: true, example: 'protected@example.test'),
        new OA\Property(property: 'reporter_phone', type: 'string', maxLength: 40, nullable: true, example: '+62-812-0000-0000'),
        new OA\Property(property: 'requested_follow_up', type: 'boolean', example: true),
        new OA\Property(property: 'witness_available', type: 'boolean', example: true),
        new OA\Property(
            property: 'governance_tags',
            type: 'array',
            maxItems: 6,
            items: new OA\Items(
                type: 'string',
                enum: ['retaliation-risk', 'conflict-sensitive', 'procurement', 'leadership', 'financial-loss', 'data-integrity']
            ),
            example: ['procurement', 'financial-loss']
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
                new OA\Property(property: 'public_reference', type: 'string', example: 'WBS-2026-0001'),
                new OA\Property(property: 'tracking_token', type: 'string', example: 'ABCD1234EFGH'),
                new OA\Property(property: 'case_number', type: 'string', example: 'CASE-2026-0001'),
                new OA\Property(property: 'status', type: 'string', enum: ['submitted', 'under_review', 'investigating', 'resolved', 'closed'], example: 'submitted'),
                new OA\Property(property: 'severity', type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high'),
                new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-18T09:00:00Z'),
                new OA\Property(
                    property: 'next_steps',
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'TrackingRequest',
    type: 'object',
    required: ['reference', 'token'],
    properties: [
        new OA\Property(property: 'reference', type: 'string', maxLength: 40, example: 'WBS-2026-0001'),
        new OA\Property(property: 'token', type: 'string', maxLength: 40, example: 'ABCD1234EFGH'),
    ]
)]
#[OA\Schema(
    schema: 'PublicCaseSummary',
    type: 'object',
    properties: [
        new OA\Property(property: 'case_number', type: 'string', nullable: true, example: 'CASE-2026-0001'),
        new OA\Property(property: 'stage', type: 'string', nullable: true, enum: ['intake', 'assessment', 'investigation', 'escalated', 'resolved', 'closed'], example: 'assessment'),
        new OA\Property(property: 'stage_label', type: 'string', nullable: true, example: 'Assessment'),
        new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Integrity Office'),
        new OA\Property(property: 'sla_due_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-28T09:00:00Z'),
    ]
)]
#[OA\Schema(
    schema: 'PublicTimelineEvent',
    type: 'object',
    properties: [
        new OA\Property(property: 'stage', type: 'string', example: 'investigation'),
        new OA\Property(property: 'stage_label', type: 'string', example: 'Investigation'),
        new OA\Property(property: 'headline', type: 'string', example: 'Investigation update'),
        new OA\Property(property: 'detail', type: 'string', nullable: true, example: 'The report has progressed into formal investigation.'),
        new OA\Property(property: 'actor_role', type: 'string', example: 'case_manager'),
        new OA\Property(property: 'occurred_at', type: 'string', format: 'date-time', example: '2026-03-18T11:30:00Z'),
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
                new OA\Property(property: 'status', type: 'string', enum: ['submitted', 'under_review', 'investigating', 'resolved', 'closed'], example: 'investigating'),
                new OA\Property(property: 'severity', type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high'),
                new OA\Property(property: 'submitted_at', type: 'string', format: 'date-time', example: '2026-03-18T09:00:00Z'),
                new OA\Property(property: 'anonymity_level', type: 'string', enum: ['anonymous', 'confidential', 'identified'], example: 'confidential'),
                new OA\Property(property: 'case', ref: '#/components/schemas/PublicCaseSummary'),
                new OA\Property(
                    property: 'timeline',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/PublicTimelineEvent')
                ),
            ]
        ),
    ]
)]
#[OA\Schema(
    schema: 'InvestigatorCase',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'case_number', type: 'string', example: 'CASE-2026-0001'),
        new OA\Property(property: 'stage', type: 'string', enum: ['intake', 'assessment', 'investigation', 'escalated', 'resolved', 'closed'], example: 'assessment'),
        new OA\Property(property: 'stage_label', type: 'string', example: 'Assessment'),
        new OA\Property(property: 'assigned_to', type: 'string', nullable: true, example: 'Ayu Wicaksono'),
        new OA\Property(property: 'assigned_unit', type: 'string', nullable: true, example: 'Integrity Office'),
        new OA\Property(property: 'severity', type: 'string', nullable: true, enum: ['low', 'medium', 'high', 'critical'], example: 'high'),
        new OA\Property(property: 'status', type: 'string', nullable: true, enum: ['submitted', 'under_review', 'investigating', 'resolved', 'closed'], example: 'under_review'),
        new OA\Property(property: 'public_reference', type: 'string', nullable: true, example: 'WBS-2026-0001'),
        new OA\Property(property: 'title', type: 'string', nullable: true, example: 'Potential bribery during permit approval'),
        new OA\Property(property: 'category', type: 'string', nullable: true, example: 'bribery'),
        new OA\Property(
            property: 'governance_tags',
            type: 'array',
            items: new OA\Items(type: 'string'),
            example: ['leadership']
        ),
        new OA\Property(property: 'escalation_required', type: 'boolean', example: false),
        new OA\Property(property: 'sla_due_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-23T09:00:00Z'),
        new OA\Property(property: 'last_activity_at', type: 'string', format: 'date-time', nullable: true, example: '2026-03-18T11:30:00Z'),
        new OA\Property(property: 'latest_internal_event', type: 'string', nullable: true, example: 'Case assigned'),
    ]
)]
#[OA\Schema(
    schema: 'InvestigatorCaseListResponse',
    type: 'object',
    required: ['data'],
    properties: [
        new OA\Property(
            property: 'data',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/InvestigatorCase')
        ),
    ]
)]
#[OA\Schema(
    schema: 'AssignCaseRequest',
    type: 'object',
    required: ['owner_name', 'assigned_unit'],
    properties: [
        new OA\Property(property: 'owner_name', type: 'string', maxLength: 120, example: 'Ayu Wicaksono'),
        new OA\Property(property: 'assigned_unit', type: 'string', maxLength: 120, example: 'Integrity Office'),
        new OA\Property(property: 'due_in_days', type: 'integer', minimum: 1, maximum: 90, nullable: true, example: 5),
    ]
)]
#[OA\Schema(
    schema: 'UpdateCaseStatusRequest',
    type: 'object',
    required: ['stage'],
    properties: [
        new OA\Property(property: 'stage', type: 'string', enum: ['intake', 'assessment', 'investigation', 'escalated', 'resolved', 'closed'], example: 'investigation'),
        new OA\Property(property: 'internal_note', type: 'string', maxLength: 2000, nullable: true, example: 'Preliminary corroboration complete and interviews scheduled.'),
        new OA\Property(property: 'publish_update', type: 'boolean', example: true),
        new OA\Property(property: 'public_message', type: 'string', maxLength: 600, nullable: true, example: 'The report has progressed into formal investigation.'),
        new OA\Property(property: 'actor_name', type: 'string', maxLength: 120, nullable: true, example: 'Ayu Wicaksono'),
    ]
)]
#[OA\Schema(
    schema: 'CaseMutationResponse',
    type: 'object',
    required: ['message', 'data'],
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Case status updated.'),
        new OA\Property(property: 'data', ref: '#/components/schemas/InvestigatorCase'),
    ]
)]
#[OA\Schema(
    schema: 'DistributionItem',
    type: 'object',
    properties: [
        new OA\Property(property: 'label', type: 'string', example: 'high'),
        new OA\Property(property: 'value', type: 'integer', example: 4),
    ]
)]
#[OA\Schema(
    schema: 'GovernanceControl',
    type: 'object',
    properties: [
        new OA\Property(property: 'code', type: 'string', example: 'GOV-001'),
        new OA\Property(property: 'name', type: 'string', example: 'Triage timeliness control'),
        new OA\Property(property: 'description', type: 'string', example: 'Monitor whether cases are assigned and triaged within the defined timeline.'),
        new OA\Property(property: 'owner_role', type: 'string', example: 'Governance Office'),
        new OA\Property(property: 'status', type: 'string', example: 'active'),
        new OA\Property(property: 'target_metric', type: 'string', example: 'Assign 90% of new reports within 3 days'),
        new OA\Property(property: 'current_metric', type: 'string', example: '84% within target'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Backlog pressure increased during the current reporting period.'),
    ]
)]
#[OA\Schema(
    schema: 'AuditLogEntry',
    type: 'object',
    properties: [
        new OA\Property(property: 'action', type: 'string', example: 'case_status_updated'),
        new OA\Property(property: 'actor_role', type: 'string', example: 'investigator'),
        new OA\Property(property: 'actor_name', type: 'string', nullable: true, example: 'Ayu Wicaksono'),
        new OA\Property(property: 'happened_at', type: 'string', format: 'date-time', example: '2026-03-18T11:30:00Z'),
        new OA\Property(
            property: 'context',
            type: 'object',
            additionalProperties: true
        ),
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
                new OA\Property(
                    property: 'metrics',
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'total_reports', type: 'integer', example: 12),
                        new OA\Property(property: 'open_cases', type: 'integer', example: 8),
                        new OA\Property(property: 'resolved_cases', type: 'integer', example: 4),
                        new OA\Property(property: 'anonymous_share', type: 'number', format: 'float', example: 41.7),
                        new OA\Property(property: 'overdue_cases', type: 'integer', example: 2),
                        new OA\Property(property: 'average_triage_hours', type: 'number', format: 'float', example: 18.5),
                    ]
                ),
                new OA\Property(
                    property: 'risk_distribution',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/DistributionItem')
                ),
                new OA\Property(
                    property: 'status_breakdown',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/DistributionItem')
                ),
                new OA\Property(
                    property: 'controls',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/GovernanceControl')
                ),
                new OA\Property(
                    property: 'recent_audit_logs',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/AuditLogEntry')
                ),
            ]
        ),
    ]
)]
final class ApiDocumentation
{
}
