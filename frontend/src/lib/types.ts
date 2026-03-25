export type UserRole =
  | "reporter"
  | "supervisor_of_verificator"
  | "verificator"
  | "supervisor_of_investigator"
  | "investigator"
  | "director"
  | "system_administrator";

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

export type SubmissionPayload = {
  title: string;
  category: string;
  description: string;
  incident_date: string;
  incident_location: string;
  accused_party: string;
  evidence_summary: string;
  confidentiality_level: "confidential" | "identified";
  requested_follow_up: boolean;
  witness_available: boolean;
  governance_tags: string[];
};

export type SubmissionReceipt = {
  public_reference: string;
  tracking_token: string;
  case_number: string;
  status: string;
  severity: string;
  submitted_at: string;
  next_steps: string[];
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
  confidentiality_level: string;
  case: {
    case_number: string | null;
    stage: string | null;
    stage_label: string | null;
    assigned_unit: string | null;
    current_role: string | null;
    current_role_label: string | null;
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
  governance_tags: string[];
  confidentiality_level: string;
  reporter: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  workflow: {
    verification_supervisor: string | null;
    verificator: string | null;
    investigation_supervisor: string | null;
    investigator: string | null;
    director: string | null;
  };
  sla_due_at: string | null;
  last_activity_at: string | null;
  latest_internal_event: string | null;
  latest_public_event: string | null;
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
  action: string;
  actor_role: string;
  actor_name: string | null;
  happened_at: string;
  context: Record<string, string | boolean | number | null>;
};

export type GovernanceDashboardData = {
  metrics: {
    total_reports: number;
    open_cases: number;
    completed_cases: number;
    confidential_share: number;
    overdue_cases: number;
    average_triage_hours: number;
    verification_queue: number;
    investigation_queue: number;
    director_review_queue: number;
  };
  risk_distribution: DistributionItem[];
  status_breakdown: DistributionItem[];
  controls: GovernanceControl[];
  recent_audit_logs: AuditLogEntry[];
};

export type CatalogData = {
  roles: Record<string, string>;
  internal_roles: string[];
  categories: Record<string, string>;
  governance_tags: Record<string, string>;
  confidentiality_levels: Record<string, string>;
  case_stages: Record<string, string>;
  principles: Record<string, string>;
};

export type MessageResponse = {
  message: string;
};
