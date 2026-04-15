export type UserRole =
  | "reporter"
  | "supervisor_of_verificator"
  | "verificator"
  | "supervisor_of_investigator"
  | "investigator"
  | "director"
  | "system_administrator"
  | "auditor";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  role_label: string;
  unit: string | null;
  is_active: boolean;
  created_at: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterReporterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

export type InternalUserPayload = {
  name: string;
  email: string;
  phone: string;
  role: Exclude<UserRole, "reporter">;
  unit: string;
  password: string;
  password_confirmation: string;
};

export type AdminUserUpdatePayload = {
  name: string;
  email: string;
  phone: string;
  unit: string;
  is_active: boolean;
  password?: string;
  password_confirmation?: string;
};

export type OperationalKpiSettings = {
  timezone: string;
  workday_start: string;
  workday_end: string;
  weekend_days: number[];
  non_working_dates: string[];
  verification_screening_hours: number;
  verification_work_hours: number;
  verification_approval_hours: number;
  verification_total_hours: number;
  investigation_delegation_hours: number;
  investigation_work_hours: number;
  investigation_approval_hours: number;
  director_approval_hours: number;
  investigation_total_hours: number;
  updated_at: string | null;
  updated_by_user_id: number | null;
  updated_by_name: string | null;
};

export type OperationalKpiSettingsPayload = {
  timezone?: string;
  workday_start: string;
  workday_end: string;
  weekend_days: number[];
  non_working_dates: string[];
  verification_screening_hours: number;
  verification_work_hours: number;
  verification_approval_hours: number;
  investigation_delegation_hours: number;
  investigation_work_hours: number;
  investigation_approval_hours: number;
  director_approval_hours: number;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type PaginatedData<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type ReportedPartyClassification =
  | "state_official"
  | "civil_servant"
  | "law_enforcement"
  | "other";

export type ReportedParty = {
  full_name: string;
  position: string;
  classification: ReportedPartyClassification | string;
};

export type SubmissionPayload = {
  title: string;
  description: string;
  reported_parties: ReportedParty[];
  category?: string;
  incident_date?: string;
  incident_location?: string;
  accused_party?: string;
  evidence_summary?: string;
  confidentiality_level?: "anonymous" | "identified";
  requested_follow_up?: boolean;
  witness_available?: boolean;
  governance_tags?: string[];
};

export type SubmissionReceipt = {
  report_id: number;
  public_reference: string;
  tracking_token: string;
  case_number: string;
  status: string;
  severity: string;
  submitted_at: string;
  next_steps: string[];
};

export type ReportAttachment = {
  id: number;
  uuid: string;
  original_name: string;
  mime_type: string | null;
  extension: string | null;
  size_bytes: number;
  checksum_sha256: string | null;
  uploaded_at: string | null;
};

export type CaseMessageAttachment = {
  id: number;
  uuid: string;
  original_name: string;
  mime_type: string | null;
  extension: string | null;
  size_bytes: number;
  checksum_sha256: string | null;
  uploaded_at: string | null;
};

export type CaseMessageRecord = {
  id: number;
  sender_role: UserRole;
  sender_role_label: string;
  stage: string;
  stage_label: string;
  body: string | null;
  sent_at: string | null;
  attachments: CaseMessageAttachment[];
};

export type CaseMessageConversation = {
  enabled: boolean;
  active_stage: string | null;
  active_stage_label: string | null;
  counterparty_role: UserRole | null;
  counterparty_role_label: string | null;
  can_send_message: boolean;
  messages: CaseMessageRecord[];
};

export type ReporterReportSummary = {
  id: number;
  public_reference: string;
  tracking_token: string;
  title: string;
  category: string;
  status: string;
  severity: string;
  submitted_at: string;
  updated_at: string;
  last_activity_at: string;
  confidentiality_level: string;
  is_editable: boolean;
  edit_lock_reason: string | null;
  case: {
    case_number: string | null;
    stage: string | null;
    stage_label: string | null;
    assigned_unit: string | null;
    current_role: string | null;
    current_role_label: string | null;
  };
};

export type ReporterReportDetail = ReporterReportSummary & {
  category_label: string;
  description: string;
  incident_date: string | null;
  incident_location: string | null;
  accused_party: string | null;
  reported_parties?: ReportedParty[];
  evidence_summary: string | null;
  last_public_update_at: string | null;
  requested_follow_up: boolean;
  witness_available: boolean;
  governance_tags: string[];
  timeline: TrackingTimelineEntry[];
  attachments: ReportAttachment[];
  reporter: {
    name: string;
    email: string;
    phone: string;
  };
};

export type TrackingTimelineEntry = {
  stage: string;
  stage_label: string;
  headline: string;
  detail: string;
  actor_role: string;
  occurred_at: string;
};

export type TrackingRecord = {
  public_reference: string;
  title: string;
  category: string;
  category_label: string;
  status: string;
  severity: string;
  submitted_at: string;
  confidentiality_level: string;
  case: {
    case_number: string;
    stage: string;
    stage_label: string;
    assigned_unit: string;
    sla_due_at: string;
  };
  timeline: TrackingTimelineEntry[];
};

export type WorkflowAssignee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  role_label: string;
  unit: string | null;
};

export type WorkflowDirectoryView = "all" | "queue" | "approval";

export type WorkflowTimelineEntry = {
  visibility?: "public" | "internal";
  stage: string;
  stage_label: string;
  headline: string;
  detail: string;
  actor_role: string;
  actor_name?: string | null;
  occurred_at: string | null;
};

export type WorkflowCase = {
  id: number;
  case_number: string;
  stage: string;
  stage_label: string;
  status: string;
  current_role: string;
  current_role_label: string;
  assigned_to: string | null;
  assigned_unit: string | null;
  severity: string;
  public_reference: string;
  title: string;
  category: string;
  category_label?: string | null;
  description?: string | null;
  incident_date?: string | null;
  incident_location?: string | null;
  accused_party?: string | null;
  reported_parties?: ReportedParty[];
  evidence_summary?: string | null;
  governance_tags: string[];
  confidentiality_level: string;
  reporter: {
    name: string | null;
    email: string | null;
    phone: string | null;
    is_protected?: boolean;
  };
  workflow: {
    verification_supervisor: string | null;
    verificator: string | null;
    investigation_supervisor: string | null;
    investigator: string | null;
    director: string | null;
  };
  workflow_records?: {
    screening?: Record<string, unknown> | null;
    verification?: Record<string, unknown> | null;
    verification_approval?: Record<string, unknown> | null;
    review_distribution?: Record<string, unknown> | null;
    review?: Record<string, unknown> | null;
    review_approval?: Record<string, unknown> | null;
    director_approval?: Record<string, unknown> | null;
  };
  attachments: ReportAttachment[];
  sla_due_at: string | null;
  last_activity_at: string | null;
  notes?: string | null;
  latest_internal_event: string | null;
  latest_public_event: string | null;
  timeline?: WorkflowTimelineEntry[];
  related_reports?: Array<{
    public_reference: string;
    title: string;
    description: string | null;
  }>;
  available_actions: string[];
};

export type DistributionItem = {
  label: string;
  value: number;
};

export type GovernanceControl = {
  code: string;
  name: string;
  description: string;
  owner_role: string;
  status: string;
  target_metric: string | null;
  current_metric: string | null;
  notes: string | null;
};

export type AuditLogEntry = {
  id: number;
  action: string;
  actor_role: string;
  actor_name: string | null;
  happened_at: string;
  context: Record<string, string | boolean | number | null>;
};

export type GovernanceMetricCard = {
  label: string;
  value: number | string;
  detail: string;
  tone: "normal" | "warning" | "critical";
};

export type GovernanceActionItem = {
  title: string;
  detail: string;
  href: string;
  count: number;
  tone: "normal" | "warning" | "critical";
};

export type GovernanceKpiSubstep = {
  key: string;
  label: string;
  budget_hours: number;
  elapsed_working_hours: number;
  utilization_percent: number;
  tone: "normal" | "warning" | "critical";
  status: "pending" | "in_progress" | "completed";
};

export type GovernancePhaseKpiSummary = {
  label: string;
  budget_hours: number;
  case_count: number;
  active_case_count: number;
  completed_case_count: number;
  at_risk_case_count: number;
  overdue_case_count: number;
  average_elapsed_working_hours: number;
  focus_case_number: string | null;
  focus_case_title: string | null;
  focus_status: "in_progress" | "completed";
  focus_elapsed_working_hours: number;
  focus_utilization_percent: number;
  tone: "normal" | "warning" | "critical";
  substeps: GovernanceKpiSubstep[];
};

export type GovernanceAuditorCaseRow = {
  audit_case_id: string;
  stage: string;
  stage_label: string;
  status: string | null;
  current_role: string;
  current_role_label: string;
  assigned_unit: string | null;
  submitted_at: string | null;
  verification_started_at: string | null;
  verification_completed_at: string | null;
  investigation_started_at: string | null;
  investigation_completed_at: string | null;
  director_decided_at: string | null;
  last_activity_at: string | null;
  sla_status: "on_track" | "at_risk" | "overdue" | "closed";
  sla_status_label: string;
  sla_tone: "normal" | "warning" | "critical";
  verification_kpi: GovernancePhaseKpiSummary | null;
  investigation_kpi: GovernancePhaseKpiSummary | null;
};

export type GovernanceScopeRow = {
  is_self: boolean;
  subject_label: string;
  role: string;
  role_label: string;
  unit: string | null;
  open_cases: number;
  pending_queue: number;
  pending_approvals: number;
  overdue_cases: number;
  completed_cases: number;
  verification_kpi: GovernancePhaseKpiSummary | null;
  investigation_kpi: GovernancePhaseKpiSummary | null;
  last_activity_at: string | null;
};

export type GovernanceDashboardData = {
  global: {
    metrics: GovernanceMetricCard[];
    queue_snapshot: DistributionItem[];
    action_items: GovernanceActionItem[];
    controls: GovernanceControl[];
    recent_audit_logs: AuditLogEntry[];
  };
  specific: {
    role: string;
    role_label: string;
    scope_label: string;
    metrics: GovernanceMetricCard[];
    action_items: GovernanceActionItem[];
    scope_rows: GovernanceScopeRow[];
    case_rows?: GovernanceAuditorCaseRow[];
  };
};

export type CatalogData = {
  roles: Record<string, string>;
  internal_roles: string[];
  categories: Record<string, string>;
  governance_tags: Record<string, string>;
  confidentiality_levels: Record<string, string>;
  reported_party_classifications: Record<string, string>;
  corruption_aspect_tags: Record<string, string>;
  verification_recommendations: Record<string, string>;
  review_recommendations: Record<string, string>;
  delict_tags: Record<string, string>;
  corruption_articles: Record<string, string>;
  months: Record<string, string>;
  case_stages: Record<string, string>;
  principles: Record<string, string>;
};

export type MessageResponse = {
  message: string;
};
