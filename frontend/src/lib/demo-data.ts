import type {
  GovernanceDashboardData,
  InvestigatorCase,
  SubmissionPayload,
  TrackingRecord,
} from "@/lib/types";

export const landingStats = [
  {
    label: "Trust Surface",
    value: "4",
    detail: "Public intake, tracking, investigator workflow, and governance oversight.",
  },
  {
    label: "Core Controls",
    value: "4",
    detail: "Confidentiality, segregation of duties, SLA monitoring, and auditability.",
  },
  {
    label: "Architecture Split",
    value: "3",
    detail: "Frontend, backend, and Docker-backed infrastructure boundaries.",
  },
  {
    label: "Primary Stakeholders",
    value: "5",
    detail: "Reporter, intake officer, investigator, governance office, and audit.",
  },
];

export const moduleCards = [
  {
    href: "/submit",
    kicker: "Public Intake",
    title: "Report Submission",
    description:
      "Structured allegation capture with anonymity level, governance flags, and evidence hints.",
  },
  {
    href: "/track",
    kicker: "Public Transparency",
    title: "Case Tracking",
    description:
      "Token-based progress checks that reveal only public-safe milestones.",
  },
  {
    href: "/investigator",
    kicker: "Operational Control",
    title: "Investigator Portal",
    description:
      "Queue view for ownership, status changes, SLA exposure, and governance escalation.",
  },
  {
    href: "/governance",
    kicker: "Oversight",
    title: "Governance Dashboard",
    description:
      "Metrics and controls for management oversight, timeliness, accountability, and control posture.",
  },
];

export const architectureLayers = [
  {
    kicker: "Frontend",
    title: "Next.js experience layer",
    description:
      "Handles the submission journey, case tracking, investigator screens, and governance views.",
  },
  {
    kicker: "Backend",
    title: "Laravel case and governance core",
    description:
      "Owns report intake, case workflow, risk state, governance controls, and audit logging.",
  },
  {
    kicker: "Infrastructure",
    title: "Docker-backed persistence",
    description:
      "Provides PostgreSQL for transactional data and an optional Redis profile for cache and queue support.",
  },
];

export const oversightPillars = [
  {
    kicker: "Confidentiality",
    title: "Protected identity handling",
    description:
      "Separate public tracking data from internal evidence, ownership, and investigative notes.",
  },
  {
    kicker: "Traceability",
    title: "Audit-first event history",
    description:
      "Capture submission, assignment, escalation, and closure changes as queryable governance evidence.",
  },
  {
    kicker: "Segregation",
    title: "Role-sensitive workflow",
    description:
      "Keep public, investigator, and oversight concerns separated at the application boundary.",
  },
  {
    kicker: "Timeliness",
    title: "SLA and escalation posture",
    description:
      "Track overdue cases, triage lead time, and escalation indicators as control signals.",
  },
];

export const categoryOptions = [
  { value: "bribery", label: "Bribery and gratuities" },
  { value: "procurement", label: "Procurement fraud" },
  { value: "fraud", label: "Financial fraud" },
  { value: "abuse_of_authority", label: "Abuse of authority" },
  { value: "conflict_of_interest", label: "Conflict of interest" },
  { value: "harassment", label: "Harassment or misconduct" },
  { value: "retaliation", label: "Retaliation against reporter" },
  { value: "other", label: "Other governance concern" },
];

export const governanceTagOptions = [
  { value: "retaliation-risk", label: "Retaliation risk" },
  { value: "conflict-sensitive", label: "Conflict-sensitive matter" },
  { value: "procurement", label: "Procurement exposure" },
  { value: "leadership", label: "Leadership escalation" },
  { value: "financial-loss", label: "Potential financial loss" },
  { value: "data-integrity", label: "Data integrity concern" },
];

export const initialSubmissionPayload: SubmissionPayload = {
  title: "",
  category: "procurement",
  description: "",
  incident_date: "",
  incident_location: "",
  accused_party: "",
  evidence_summary: "",
  anonymity_level: "anonymous",
  reporter_name: "",
  reporter_email: "",
  reporter_phone: "",
  requested_follow_up: true,
  witness_available: false,
  governance_tags: [],
};

export const demoTrackingRecord: TrackingRecord = {
  public_reference: "WBS-2026-DEMO",
  title: "Procurement committee requested unofficial facilitation payment",
  category: "procurement",
  category_label: "Procurement fraud",
  status: "investigating",
  severity: "high",
  submitted_at: "2026-03-04T08:30:00.000Z",
  anonymity_level: "confidential",
  case: {
    case_number: "CASE-2026-DEMO",
    stage: "investigation",
    stage_label: "Investigation",
    assigned_unit: "Anti-Corruption Investigation Desk",
    sla_due_at: "2026-03-22T16:00:00.000Z",
  },
  timeline: [
    {
      stage: "intake",
      stage_label: "Intake",
      headline: "Report received",
      detail: "The disclosure was received and registered for triage.",
      actor_role: "system",
      occurred_at: "2026-03-04T08:30:00.000Z",
    },
    {
      stage: "assessment",
      stage_label: "Assessment",
      headline: "Assessment update",
      detail: "Initial evidence was reviewed and the case was assigned for formal assessment.",
      actor_role: "case_manager",
      occurred_at: "2026-03-06T09:15:00.000Z",
    },
    {
      stage: "investigation",
      stage_label: "Investigation",
      headline: "Investigation update",
      detail: "The report advanced into investigation after corroboration checks.",
      actor_role: "investigator",
      occurred_at: "2026-03-08T13:45:00.000Z",
    },
  ],
};

export const demoInvestigatorCases: InvestigatorCase[] = [
  {
    id: 1,
    case_number: "CASE-2026-0001",
    stage: "investigation",
    stage_label: "Investigation",
    assigned_to: "Rani Putri",
    assigned_unit: "Anti-Corruption Investigation Desk",
    severity: "high",
    status: "investigating",
    public_reference: "WBS-2026-0001",
    title: "Procurement committee requested unofficial facilitation payment",
    category: "procurement",
    governance_tags: ["procurement", "financial-loss"],
    escalation_required: false,
    sla_due_at: "2026-03-22T16:00:00.000Z",
    last_activity_at: "2026-03-10T09:00:00.000Z",
    latest_internal_event: "Case moved to Investigation",
  },
  {
    id: 2,
    case_number: "CASE-2026-0002",
    stage: "escalated",
    stage_label: "Escalated",
    assigned_to: "Bagas Santoso",
    assigned_unit: "Ethics and Protection Desk",
    severity: "critical",
    status: "investigating",
    public_reference: "WBS-2026-0002",
    title: "Supervisor threatened staff after ethics complaint",
    category: "retaliation",
    governance_tags: ["retaliation-risk", "leadership"],
    escalation_required: true,
    sla_due_at: "2026-03-20T16:00:00.000Z",
    last_activity_at: "2026-03-11T11:15:00.000Z",
    latest_internal_event: "Case moved to Escalated",
  },
  {
    id: 3,
    case_number: "CASE-2026-0004",
    stage: "resolved",
    stage_label: "Resolved",
    assigned_to: "Dimas Haryanto",
    assigned_unit: "Forensic Audit Cell",
    severity: "high",
    status: "resolved",
    public_reference: "WBS-2026-0004",
    title: "Repeated duplicate reimbursement claim patterns",
    category: "fraud",
    governance_tags: ["financial-loss", "data-integrity"],
    escalation_required: false,
    sla_due_at: "2026-03-12T16:00:00.000Z",
    last_activity_at: "2026-03-12T17:00:00.000Z",
    latest_internal_event: "Case moved to Resolved",
  },
];

export const demoGovernanceDashboard: GovernanceDashboardData = {
  metrics: {
    total_reports: 4,
    open_cases: 3,
    resolved_cases: 1,
    anonymous_share: 25,
    overdue_cases: 0,
    average_triage_hours: 18,
  },
  risk_distribution: [
    { label: "critical", value: 1 },
    { label: "high", value: 2 },
    { label: "medium", value: 1 },
  ],
  status_breakdown: [
    { label: "assessment", value: 1 },
    { label: "investigation", value: 1 },
    { label: "escalated", value: 1 },
    { label: "resolved", value: 1 },
  ],
  controls: [
    {
      code: "ANON-01",
      name: "Anonymity safeguard",
      description:
        "Protect whistleblower identity across intake, tracking, and escalation flows.",
      owner_role: "Governance Office",
      status: "active",
      target_metric: "100% secure anonymous intake",
      current_metric: "Enabled by design",
      notes: "",
    },
    {
      code: "SEG-02",
      name: "Segregation of duties",
      description:
        "Separate intake handling from investigation execution and oversight monitoring.",
      owner_role: "Chief Compliance Officer",
      status: "active",
      target_metric: "Distinct owners for intake and investigation",
      current_metric: "Operational",
      notes: "",
    },
    {
      code: "SLA-03",
      name: "Triage timeliness",
      description:
        "Monitor elapsed time from intake to assignment and escalation decisions.",
      owner_role: "Case Management Lead",
      status: "warning",
      target_metric: "Average triage under 72 hours",
      current_metric: "18 hours",
      notes: "",
    },
  ],
  recent_audit_logs: [
    {
      action: "case_status_updated",
      actor_role: "investigator",
      actor_name: "Rani Putri",
      happened_at: "2026-03-10T09:00:00.000Z",
      context: { stage: "investigation", published_update: true },
    },
    {
      action: "case_assigned",
      actor_role: "case_manager",
      actor_name: "Bagas Santoso",
      happened_at: "2026-03-09T10:30:00.000Z",
      context: { assigned_unit: "Ethics and Protection Desk", stage: "assessment" },
    },
    {
      action: "report_submitted",
      actor_role: "whistleblower",
      actor_name: "Protected reporter",
      happened_at: "2026-03-04T08:30:00.000Z",
      context: { category: "procurement", severity: "high" },
    },
  ],
};
