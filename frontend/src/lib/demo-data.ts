import type {
  GovernanceDashboardData,
  InternalUserPayload,
  ReporterReportSummary,
  SubmissionPayload,
  TrackingRecord,
  WorkflowCase,
} from "@/lib/types";

export const landingStats = [
  {
    label: "Institutional Roles",
    value: "7",
    detail:
      "Reporter, two supervisors, verificator, investigator, director, and system administrator.",
  },
  {
    label: "Process Gates",
    value: "8",
    detail:
      "Submission, verification, supervisory review, investigation, director review, and completion milestones.",
  },
  {
    label: "Core Controls",
    value: "4",
    detail:
      "Registration, confidentiality, segregation of duties, and audit traceability.",
  },
  {
    label: "Primary Modules",
    value: "5",
    detail:
      "Overview, reporter submission, tracking, workflow operations, and governance administration.",
  },
];

export const moduleCards = [
  {
    href: "/submit",
    kicker: "Reporter Access",
    title: "Registered Submission",
    description:
      "Only authenticated reporters may submit a report into the KPK Whistleblowing System workflow.",
  },
  {
    href: "/track",
    kicker: "Public Tracking",
    title: "Reference and Token Lookup",
    description:
      "Check public-safe milestones through the issued public reference and tracking token.",
  },
  {
    href: "/workflow",
    kicker: "Internal Operations",
    title: "Role-Based Workflow",
    description:
      "Supervisors, verificators, investigators, and director operate from one governed case workbench.",
  },
  {
    href: "/governance",
    kicker: "Oversight",
    title: "Governance Dashboard",
    description:
      "Monitor workload, timeliness, controls, and audit evidence across the whistleblowing process.",
  },
  {
    href: "/admin",
    kicker: "Administration",
    title: "Role Provisioning",
    description:
      "System administrator creates internal role accounts and maintains operational readiness.",
  },
];

export const architectureLayers = [
  {
    kicker: "Frontend",
    title: "Next.js institutional interface",
    description:
      "Provides reporter registration and login, protected submission, workflow screens, and governance views.",
  },
  {
    kicker: "Backend",
    title: "Laravel governance workflow core",
    description:
      "Owns role-controlled case routing, audit logging, public tracking, and system administration APIs.",
  },
  {
    kicker: "Infrastructure",
    title: "Local PostgreSQL deployment",
    description:
      "Persists operational data in native PostgreSQL, with optional Redis and Docker only for supporting services.",
  },
];

export const oversightPillars = [
  {
    kicker: "Registration",
    title: "Reporter identity before submission",
    description:
      "The prototype enforces reporter registration before any report can be accepted into the system.",
  },
  {
    kicker: "Confidentiality",
    title: "Protected reporter handling",
    description:
      "Reporter identity is retained internally while public tracking exposes only safe milestones and case metadata.",
  },
  {
    kicker: "Segregation",
    title: "Role-specific approvals",
    description:
      "Verification, investigation, and director approval are separated into distinct operational roles.",
  },
  {
    kicker: "Traceability",
    title: "Audit-first workflow evidence",
    description:
      "Every submission, delegation, approval, rejection, and completion is written to the audit trail.",
  },
];

export const roleCards = [
  {
    title: "Reporter",
    description:
      "Registers, logs in, submits a report, and monitors public-safe progress through account and tracking token access.",
  },
  {
    title: "Supervisor of Verificator",
    description:
      "Receives new reports, delegates them to verificators, and decides whether verification is accepted or returned.",
  },
  {
    title: "Verificator",
    description:
      "Performs verification of submitted reports and returns documented findings to the supervisor of verificator.",
  },
  {
    title: "Supervisor of Investigator",
    description:
      "Receives verified reports, delegates investigation, and reviews the investigator submission before director review.",
  },
  {
    title: "Investigator",
    description:
      "Analyzes verified reports, documents investigation findings, and submits them to the supervisor of investigator.",
  },
  {
    title: "Director",
    description:
      "Provides the final decision to complete the report or return it for further investigation.",
  },
  {
    title: "System Administrator",
    description:
      "Creates internal user accounts, manages operational readiness, and supports governance administration.",
  },
];

export const processSteps = [
  "Reporter registers and logs in before creating a report.",
  "Supervisor of verificator receives the submitted report and delegates it to a verificator.",
  "Verificator verifies the report and submits the result back to the supervisor of verificator.",
  "Supervisor of verificator approves the verification or returns it for further work.",
  "Supervisor of investigator receives an approved verification and delegates it to an investigator.",
  "Investigator analyzes the verified report and submits the investigation to the supervisor of investigator.",
  "Supervisor of investigator approves the investigation or returns it to the investigator.",
  "Director approves report completion or returns the case for further investigation.",
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

export const confidentialityOptions = [
  { value: "anonymous", label: "Anonymous reporter" },
  { value: "identified", label: "Identified reporter" },
] as const;

export const internalRoleOptions: Array<{
  value: InternalUserPayload["role"];
  label: string;
}> = [
  { value: "supervisor_of_verificator", label: "Supervisor of Verificator" },
  { value: "verificator", label: "Verificator" },
  { value: "supervisor_of_investigator", label: "Supervisor of Investigator" },
  { value: "investigator", label: "Investigator" },
  { value: "director", label: "Director" },
  { value: "system_administrator", label: "System Administrator" },
];

export const initialSubmissionPayload: SubmissionPayload = {
  title: "",
  category: "procurement",
  description: "",
  incident_date: "",
  incident_location: "",
  accused_party: "",
  evidence_summary: "",
  confidentiality_level: "anonymous",
  requested_follow_up: true,
  witness_available: false,
  governance_tags: [],
};

export const demoReporterReports: ReporterReportSummary[] = [
  {
    id: 1,
    public_reference: "WBS-2026-0003",
    tracking_token: "DEMO7788ABCD",
    title: "Repeated duplicate reimbursement patterns in finance unit",
    category: "fraud",
    status: "investigation_in_progress",
    severity: "high",
    submitted_at: "2026-03-11T10:00:00.000Z",
    confidentiality_level: "anonymous",
    is_editable: true,
    edit_lock_reason: null,
    case: {
      case_number: "CASE-2026-0003",
      stage: "investigation_in_progress",
      stage_label: "Investigation In Progress",
      assigned_unit: "Investigation Desk",
      current_role: "investigator",
      current_role_label: "Investigator",
    },
  },
];

export const demoTrackingRecord: TrackingRecord = {
  public_reference: "WBS-2026-DEMO",
  title: "Request for unofficial payment before vendor evaluation",
  category: "procurement",
  category_label: "Procurement fraud",
  status: "investigation_in_progress",
  severity: "high",
  submitted_at: "2026-03-04T08:30:00.000Z",
  confidentiality_level: "anonymous",
  case: {
    case_number: "CASE-2026-DEMO",
    stage: "investigation_in_progress",
    stage_label: "Investigation In Progress",
    assigned_unit: "Investigation Desk",
    sla_due_at: "2026-03-22T16:00:00.000Z",
  },
  timeline: [
    {
      stage: "submitted",
      stage_label: "Submitted",
      headline: "Report received",
      detail:
        "The report was received from a registered reporter and routed to the supervisor of verificator.",
      actor_role: "system",
      occurred_at: "2026-03-04T08:30:00.000Z",
    },
    {
      stage: "verification_review",
      stage_label: "Verification Review",
      headline: "Verification completed",
      detail:
        "The report passed verification and progressed to the investigation allocation stage.",
      actor_role: "supervisor_of_verificator",
      occurred_at: "2026-03-06T09:15:00.000Z",
    },
    {
      stage: "investigation_in_progress",
      stage_label: "Investigation In Progress",
      headline: "Investigation delegated",
      detail:
        "The report is currently being analyzed in the investigation stage.",
      actor_role: "supervisor_of_investigator",
      occurred_at: "2026-03-08T13:45:00.000Z",
    },
  ],
};

export const demoWorkflowCases: WorkflowCase[] = [
  {
    id: 1,
    case_number: "CASE-2026-0001",
    stage: "submitted",
    stage_label: "Submitted",
    status: "submitted",
    current_role: "supervisor_of_verificator",
    current_role_label: "Supervisor of Verificator",
    assigned_to: "Sinta Pramudita",
    assigned_unit: "Verification Supervision",
    severity: "high",
    public_reference: "WBS-2026-0001",
    title: "Request for unofficial payment before vendor evaluation",
    category: "procurement",
    governance_tags: ["procurement", "financial-loss"],
    confidentiality_level: "anonymous",
    reporter: {
      name: null,
      email: null,
      phone: null,
      is_protected: true,
    },
    workflow: {
      verification_supervisor: "Sinta Pramudita",
      verificator: null,
      investigation_supervisor: "Bagas Santoso",
      investigator: null,
      director: "Nadia Prabowo",
    },
    sla_due_at: "2026-03-24T10:00:00.000Z",
    last_activity_at: "2026-03-18T09:00:00.000Z",
    latest_internal_event: "Report submitted by registered reporter",
    latest_public_event: "Report received",
    available_actions: ["delegate_verification"],
  },
  {
    id: 2,
    case_number: "CASE-2026-0002",
    stage: "verification_review",
    stage_label: "Verification Review",
    status: "verification_review",
    current_role: "supervisor_of_verificator",
    current_role_label: "Supervisor of Verificator",
    assigned_to: "Sinta Pramudita",
    assigned_unit: "Verification Supervision",
    severity: "medium",
    public_reference: "WBS-2026-0002",
    title: "Possible conflict of interest in evaluation panel",
    category: "conflict_of_interest",
    governance_tags: ["conflict-sensitive"],
    confidentiality_level: "identified",
    reporter: {
      name: "Fajar Kurniawan",
      email: "reporter.2@example.test",
      phone: "+62-812-1000-1002",
    },
    workflow: {
      verification_supervisor: "Sinta Pramudita",
      verificator: "Aditya Prakoso",
      investigation_supervisor: "Bagas Santoso",
      investigator: null,
      director: "Nadia Prabowo",
    },
    sla_due_at: "2026-03-22T10:00:00.000Z",
    last_activity_at: "2026-03-19T07:45:00.000Z",
    latest_internal_event: "Verification submitted to supervisor",
    latest_public_event: "Verification review update",
    available_actions: ["review_verification"],
  },
  {
    id: 3,
    case_number: "CASE-2026-0003",
    stage: "investigation_in_progress",
    stage_label: "Investigation In Progress",
    status: "investigation_in_progress",
    current_role: "investigator",
    current_role_label: "Investigator",
    assigned_to: "Ayu Wicaksono",
    assigned_unit: "Investigation Desk",
    severity: "high",
    public_reference: "WBS-2026-0003",
    title: "Repeated duplicate reimbursement patterns in finance unit",
    category: "fraud",
    governance_tags: ["financial-loss", "data-integrity"],
    confidentiality_level: "anonymous",
    reporter: {
      name: null,
      email: null,
      phone: null,
      is_protected: true,
    },
    workflow: {
      verification_supervisor: "Sinta Pramudita",
      verificator: "Maya Lestari",
      investigation_supervisor: "Bagas Santoso",
      investigator: "Ayu Wicaksono",
      director: "Nadia Prabowo",
    },
    sla_due_at: "2026-03-23T10:00:00.000Z",
    last_activity_at: "2026-03-18T14:30:00.000Z",
    latest_internal_event: "Investigation delegated",
    latest_public_event: "Verification completed",
    available_actions: ["submit_investigation"],
  },
];

export const demoGovernanceDashboard: GovernanceDashboardData = {
  metrics: {
    total_reports: 4,
    open_cases: 3,
    completed_cases: 1,
    confidential_share: 75,
    overdue_cases: 0,
    average_triage_hours: 12,
    verification_queue: 2,
    investigation_queue: 1,
    director_review_queue: 0,
  },
  risk_distribution: [
    { label: "critical", value: 1 },
    { label: "high", value: 2 },
    { label: "medium", value: 1 },
  ],
  status_breakdown: [
    { label: "submitted", value: 1 },
    { label: "verification_review", value: 1 },
    { label: "investigation_in_progress", value: 1 },
    { label: "completed", value: 1 },
  ],
  controls: [
    {
      code: "REG-01",
      name: "Reporter registration control",
      description:
        "Require reporters to register before submitting a report into the KPK Whistleblowing System.",
      owner_role: "System Administrator",
      status: "active",
      target_metric: "100% registered reporter submissions",
      current_metric: "Enforced",
      notes: "Anonymous public submission is disabled.",
    },
    {
      code: "SEG-02",
      name: "Segregation of duties",
      description:
        "Separate verification supervision, verification work, investigation supervision, and final approval.",
      owner_role: "Director",
      status: "active",
      target_metric: "Distinct accountable role at each stage",
      current_metric: "Operational",
      notes: "Role ownership is visible on every case.",
    },
    {
      code: "SLA-03",
      name: "Workflow timeliness",
      description:
        "Monitor delegation and review timeliness across verification and investigation stages.",
      owner_role: "Supervisor of Verificator",
      status: "warning",
      target_metric: "Average first delegation under 72 hours",
      current_metric: "12 hours",
      notes: "Dashboard exposes overdue cases and queue volumes.",
    },
    {
      code: "AUD-04",
      name: "Audit trail completeness",
      description:
        "Log report submission, delegation, approval, rejection, and completion events.",
      owner_role: "System Administrator",
      status: "active",
      target_metric: "All workflow actions auditable",
      current_metric: "Operational",
      notes: "Recent audit entries are available below.",
    },
  ],
  recent_audit_logs: [
    {
      action: "director_approved",
      actor_role: "director",
      actor_name: "Nadia Prabowo",
      happened_at: "2026-03-18T16:00:00.000Z",
      context: { decision: "approved" },
    },
    {
      action: "investigation_delegated",
      actor_role: "supervisor_of_investigator",
      actor_name: "Bagas Santoso",
      happened_at: "2026-03-18T14:00:00.000Z",
      context: { assigned_unit: "Investigation Desk" },
    },
    {
      action: "report_submitted",
      actor_role: "reporter",
      actor_name: "Laila N",
      happened_at: "2026-03-18T09:00:00.000Z",
      context: { category: "procurement", severity: "high" },
    },
  ],
};
