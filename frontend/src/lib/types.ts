export type SubmissionPayload = {
  title: string;
  category: string;
  description: string;
  incident_date: string;
  incident_location: string;
  accused_party: string;
  evidence_summary: string;
  anonymity_level: "anonymous" | "confidential" | "identified";
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string;
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
  anonymity_level: string;
  case: {
    case_number: string;
    stage: string;
    stage_label: string;
    assigned_unit: string;
    sla_due_at: string;
  };
  timeline: TrackingTimelineEntry[];
};

export type InvestigatorCase = {
  id: number;
  case_number: string;
  stage: string;
  stage_label: string;
  assigned_to: string | null;
  assigned_unit: string | null;
  severity: string;
  status: string;
  public_reference: string;
  title: string;
  category: string;
  governance_tags: string[];
  escalation_required: boolean;
  sla_due_at: string;
  last_activity_at: string;
  latest_internal_event: string;
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
  actor_name: string;
  happened_at: string;
  context: Record<string, string | boolean | number>;
};

export type GovernanceDashboardData = {
  metrics: {
    total_reports: number;
    open_cases: number;
    resolved_cases: number;
    anonymous_share: number;
    overdue_cases: number;
    average_triage_hours: number;
  };
  risk_distribution: DistributionItem[];
  status_breakdown: DistributionItem[];
  controls: GovernanceControl[];
  recent_audit_logs: AuditLogEntry[];
};
