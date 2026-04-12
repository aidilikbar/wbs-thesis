import type {
  GovernanceDashboardData,
  GovernancePhaseKpiSummary,
  InternalUserPayload,
  ReportedPartyClassification,
  ReporterReportSummary,
  SubmissionPayload,
  TrackingRecord,
  UserRole,
  WorkflowCase,
} from "@/lib/types";
import { roleLabels } from "@/lib/labels";

export const landingStats = [
  {
    label: "Institutional Roles",
    value: "8",
    detail:
      "Reporter, auditor, two supervisors, verification officer, investigator, director, and system administrator.",
  },
  {
    label: "Process Gates",
    value: "8",
    detail:
      "Submission, verification, supervisory approval, investigation, director decision, and completion milestones.",
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
      "Supervisors, verification officers, investigators, and the director operate from one governed case workbench.",
  },
  {
    href: "/governance",
    kicker: "Governance",
    title: "Operational Governance",
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
      "Owns role-controlled case routing, audit logging, public tracking, and governance APIs.",
  },
  {
    kicker: "Infrastructure",
    title: "PostgreSQL plus private object storage",
    description:
      "Persists operational data in native PostgreSQL, with local MinIO object storage and optional Redis for supporting services.",
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
    title: "Verification Supervisor",
    description:
      "Screens new reports, rejects invalid submissions, delegates valid cases to verification officers, and records verification approvals.",
  },
  {
    title: "Verification Officer",
    description:
      "Builds the verification assessment, applies corruption tags, and recommends investigation, forwarding, or archival.",
  },
  {
    title: "Investigation Supervisor",
    description:
      "Receives approved verification results, delegates investigation work, and records investigation approval before director decision.",
  },
  {
    title: "Investigator",
    description:
      "Prepares the structured investigation case file, including delict, article, timing, location, linkage, authority, priority, and conclusion.",
  },
  {
    title: "Director",
    description:
      "Provides the final decision to complete the report or return it for further investigation.",
  },
  {
    title: "System Administrator",
    description:
      "Creates internal user accounts, manages operational readiness, and supports operational oversight.",
  },
  {
    title: "Auditor",
    description:
      "Monitors anonymized KPI, SLA, and workflow audit metadata without access to complaint content or reporter identity.",
  },
];

export const processSteps = [
  "Reporter registers and logs in before creating a report.",
  "The verification supervisor receives the submitted report and assigns it to a verification officer.",
  "The verification officer verifies the report and submits the result back to the verification supervisor.",
  "The verification supervisor approves the verification or returns it for further work.",
  "The investigation supervisor receives an approved verification and assigns it to an investigator.",
  "The investigator analyzes the verified report and submits the investigation to the investigation supervisor.",
  "The investigation supervisor approves the investigation or returns it to the investigator.",
  "Director approves report completion or returns the case for further investigation.",
];

export const categoryOptions = [
  { value: "kpk_report", label: "KPK whistleblowing report" },
];

export const governanceTagOptions = [
  { value: "bribery", label: "Bribery" },
  { value: "gratuity", label: "Gratuity" },
  { value: "procurement_irregularity", label: "Procurement irregularity" },
  { value: "abuse_of_authority", label: "Abuse of authority" },
  { value: "conflict_of_interest", label: "Conflict of interest" },
  { value: "state_financial_loss", label: "State financial loss" },
  { value: "obstruction_of_justice", label: "Obstruction of justice" },
  { value: "other", label: "Other corruption aspect" },
];

export const confidentialityOptions = [
  { value: "anonymous", label: "Anonymous reporter" },
  { value: "identified", label: "Identified reporter" },
] as const;

export const reportedPartyClassificationOptions: Array<{
  value: ReportedPartyClassification;
  label: string;
}> = [
  { value: "state_official", label: "State official" },
  { value: "civil_servant", label: "Civil servant" },
  { value: "law_enforcement", label: "Law enforcement officer" },
  { value: "other", label: "Other" },
];

export const verificationRecommendationOptions = [
  { value: "review", label: "Investigation" },
  { value: "forward", label: "Forward" },
  { value: "archive", label: "Archive" },
];

export const reviewRecommendationOptions = [
  { value: "internal_forwarding", label: "Forward internally" },
  { value: "external_forwarding", label: "Forward externally" },
  { value: "archive", label: "Archive" },
];

export const delictOptions = [
  { value: "state_financial_loss", label: "State financial loss" },
  { value: "bribery", label: "Bribery" },
  { value: "embezzlement_in_office", label: "Embezzlement in office" },
  { value: "extortion", label: "Extortion" },
  { value: "fraudulent_act", label: "Fraudulent act" },
  { value: "procurement_conflict_of_interest", label: "Conflict of interest in procurement" },
  { value: "gratification", label: "Gratification" },
  { value: "obstruction_of_justice", label: "Obstruction of justice" },
  { value: "other", label: "Other" },
];

export const corruptionArticleOptions = [
  { value: "article_2_31_1999", label: "Law 31/1999 Article 2" },
  { value: "article_3_31_1999", label: "Law 31/1999 Article 3" },
  { value: "article_5_31_1999", label: "Law 31/1999 Article 5" },
  { value: "article_11_31_1999", label: "Law 31/1999 Article 11" },
  { value: "article_12_31_1999", label: "Law 31/1999 Article 12" },
  { value: "article_12b_20_2001", label: "Law 20/2001 Article 12B" },
  { value: "article_21_31_1999", label: "Law 31/1999 Article 21" },
  { value: "article_22_31_1999", label: "Law 31/1999 Article 22" },
  { value: "article_23_31_1999", label: "Law 31/1999 Article 23" },
  { value: "article_55_criminal_code", label: "Criminal Code Article 55" },
];

export const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const internalRoleOptions: Array<{
  value: InternalUserPayload["role"];
  label: string;
}> = [
  { value: "supervisor_of_verificator", label: roleLabels.supervisor_of_verificator },
  { value: "verificator", label: roleLabels.verificator },
  { value: "supervisor_of_investigator", label: roleLabels.supervisor_of_investigator },
  { value: "investigator", label: roleLabels.investigator },
  { value: "director", label: roleLabels.director },
  { value: "system_administrator", label: roleLabels.system_administrator },
  { value: "auditor", label: roleLabels.auditor },
];

export const initialSubmissionPayload: SubmissionPayload = {
  title: "",
  description: "",
  reported_parties: [
    {
      full_name: "",
      position: "",
      classification: "other",
    },
  ],
  category: "kpk_report",
  confidentiality_level: "identified",
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
    updated_at: "2026-03-18T09:00:00.000Z",
    last_activity_at: "2026-03-18T09:00:00.000Z",
    confidentiality_level: "anonymous",
    is_editable: true,
    edit_lock_reason: null,
    case: {
      case_number: "CASE-2026-0003",
      stage: "investigation_in_progress",
      stage_label: "Investigation in Progress",
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
    stage_label: "Investigation in Progress",
    assigned_unit: "Investigation Desk",
    sla_due_at: "2026-03-22T16:00:00.000Z",
  },
  timeline: [
    {
      stage: "submitted",
      stage_label: "Submitted",
      headline: "Report received",
      detail:
        "The report was received from a registered reporter and routed to the verification supervisor.",
      actor_role: "system",
      occurred_at: "2026-03-04T08:30:00.000Z",
    },
    {
      stage: "verification_review",
      stage_label: "Verification Approval",
      headline: "Verification completed",
      detail:
        "The report passed verification and progressed to the investigation allocation stage.",
      actor_role: "supervisor_of_verificator",
      occurred_at: "2026-03-06T09:15:00.000Z",
    },
    {
      stage: "investigation_in_progress",
      stage_label: "Investigation in Progress",
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
    current_role_label: "Verification Supervisor",
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
    attachments: [
      {
        id: 101,
        uuid: "demo-attachment-101",
        original_name: "vendor_meeting_note.pdf",
        mime_type: "application/pdf",
        extension: "pdf",
        size_bytes: 842112,
        checksum_sha256: null,
        uploaded_at: "2026-03-18T09:10:00.000Z",
      },
    ],
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
    stage_label: "Verification Approval",
    status: "verification_review",
    current_role: "supervisor_of_verificator",
    current_role_label: "Verification Supervisor",
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
    attachments: [
      {
        id: 102,
        uuid: "demo-attachment-102",
        original_name: "panel_attendance.csv",
        mime_type: "text/csv",
        extension: "csv",
        size_bytes: 18432,
        checksum_sha256: null,
        uploaded_at: "2026-03-19T07:50:00.000Z",
      },
      {
        id: 103,
        uuid: "demo-attachment-103",
        original_name: "conflict_declaration_scan.jpg",
        mime_type: "image/jpeg",
        extension: "jpg",
        size_bytes: 512904,
        checksum_sha256: null,
        uploaded_at: "2026-03-19T08:00:00.000Z",
      },
    ],
    sla_due_at: "2026-03-22T10:00:00.000Z",
    last_activity_at: "2026-03-19T07:45:00.000Z",
    latest_internal_event: "Verification submitted to supervisor",
    latest_public_event: "Verification approval update",
    available_actions: ["review_verification"],
  },
  {
    id: 3,
    case_number: "CASE-2026-0003",
    stage: "investigation_in_progress",
    stage_label: "Investigation in Progress",
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
    attachments: [
      {
        id: 104,
        uuid: "demo-attachment-104",
        original_name: "duplicate_reimbursement_bundle.zip",
        mime_type: "application/zip",
        extension: "zip",
        size_bytes: 2842112,
        checksum_sha256: null,
        uploaded_at: "2026-03-18T14:35:00.000Z",
      },
    ],
    sla_due_at: "2026-03-23T10:00:00.000Z",
    last_activity_at: "2026-03-18T14:30:00.000Z",
    latest_internal_event: "Investigation delegated",
    latest_public_event: "Verification completed",
    available_actions: ["submit_investigation"],
  },
];

const demoGovernanceGlobal = {
  metrics: [
    {
      label: "Reports received",
      value: 44,
      detail: "Total whistleblowing records registered in the platform.",
      tone: "normal" as const,
    },
    {
      label: "Open cases",
      value: 31,
      detail: "Cases still active across verification, investigation, or approval stages.",
      tone: "normal" as const,
    },
    {
      label: "Overdue cases",
      value: 3,
      detail: "Cases that have passed the current SLA due time.",
      tone: "critical" as const,
    },
    {
      label: "Anonymous share",
      value: "63.6%",
      detail: "Share of reports where reporter identity remains masked from case handlers.",
      tone: "normal" as const,
    },
    {
      label: "Average triage",
      value: "18 h",
      detail: "Average elapsed time between submission and initial triage.",
      tone: "normal" as const,
    },
  ],
  queue_snapshot: [
    { label: "New intake", value: 4 },
    { label: "Verification work", value: 7 },
    { label: "Verification approvals", value: 3 },
    { label: "Investigation intake", value: 4 },
    { label: "Investigation work", value: 6 },
    { label: "Investigation approvals", value: 3 },
    { label: "Director approvals", value: 2 },
  ],
  action_items: [
    {
      title: "Assign new verification intake",
      detail: "Submitted reports should be delegated to a verification officer without delay.",
      href: "/workflow",
      count: 4,
      tone: "warning" as const,
    },
    {
      title: "Resolve verification approvals",
      detail: "Supervisor approval is pending before cases can move into investigation.",
      href: "/workflow/approvals",
      count: 3,
      tone: "warning" as const,
    },
    {
      title: "Resolve investigation approvals",
      detail: "Supervisor approval is blocking the final director decision flow.",
      href: "/workflow/approvals",
      count: 3,
      tone: "warning" as const,
    },
    {
      title: "Close director review backlog",
      detail: "Final director decisions should not remain pending longer than necessary.",
      href: "/workflow/approvals",
      count: 2,
      tone: "warning" as const,
    },
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
        "Separate verification supervision, verification officer work, investigation supervision, and final approval.",
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
        "Monitor delegation and approval timeliness across verification and investigation stages.",
      owner_role: "Verification Supervisor",
      status: "warning",
      target_metric: "Average first delegation under 72 hours",
      current_metric: "18 hours",
      notes: "Three cases have breached the current SLA target.",
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
      happened_at: "2026-03-28T16:00:00.000Z",
      context: {
        decision: "approved",
        case_number: "CASE-2026-0036",
      } as Record<string, string | number | boolean | null>,
    },
    {
      action: "investigation_delegated",
      actor_role: "supervisor_of_investigator",
      actor_name: "Bagas Santoso",
      happened_at: "2026-03-28T14:00:00.000Z",
      context: {
        assigned_unit: "Investigation Desk",
        case_number: "CASE-2026-0038",
      } as Record<string, string | number | boolean | null>,
    },
    {
      action: "verification_returned",
      actor_role: "supervisor_of_verificator",
      actor_name: "Sinta Pramudita",
      happened_at: "2026-03-28T11:00:00.000Z",
      context: {
        reason: "Missing supporting chronology",
      } as Record<string, string | number | boolean | null>,
    },
    {
      action: "report_submitted",
      actor_role: "reporter",
      actor_name: "Laila N",
      happened_at: "2026-03-28T09:10:00.000Z",
      context: {
        category: "procurement",
        severity: "high",
      } as Record<string, string | number | boolean | null>,
    },
  ],
};

function createDemoPhaseKpi(
  label: string,
  budgetHours: number,
  tone: GovernancePhaseKpiSummary["tone"],
  focusCaseNumber: string,
  focusStatus: GovernancePhaseKpiSummary["focus_status"],
  focusElapsedHours: number,
  activeCaseCount: number,
  completedCaseCount: number,
  atRiskCaseCount: number,
  overdueCaseCount: number,
  substeps: GovernancePhaseKpiSummary["substeps"],
): GovernancePhaseKpiSummary {
  return {
    label,
    budget_hours: budgetHours,
    case_count: activeCaseCount + completedCaseCount,
    active_case_count: activeCaseCount,
    completed_case_count: completedCaseCount,
    at_risk_case_count: atRiskCaseCount,
    overdue_case_count: overdueCaseCount,
    average_elapsed_working_hours: focusElapsedHours,
    focus_case_number: focusCaseNumber,
    focus_case_title: null,
    focus_status: focusStatus,
    focus_elapsed_working_hours: focusElapsedHours,
    focus_utilization_percent: Number(((focusElapsedHours / budgetHours) * 100).toFixed(1)),
    tone,
    substeps,
  };
}

function verificationDemoKpi(
  focusCaseNumber: string,
  focusElapsedHours: number,
  tone: GovernancePhaseKpiSummary["tone"],
  activeCaseCount: number,
  completedCaseCount: number,
  atRiskCaseCount: number,
  overdueCaseCount: number,
): GovernancePhaseKpiSummary {
  return createDemoPhaseKpi(
    "Verification Time",
    8,
    tone,
    focusCaseNumber,
    activeCaseCount > 0 ? "in_progress" : "completed",
    focusElapsedHours,
    activeCaseCount,
    completedCaseCount,
    atRiskCaseCount,
    overdueCaseCount,
    [
      {
        key: "screening",
        label: "Screening / Delegation",
        budget_hours: 1,
        elapsed_working_hours: 0.8,
        utilization_percent: 80,
        tone: "warning",
        status: "completed",
      },
      {
        key: "verification",
        label: "Verification Work",
        budget_hours: 5,
        elapsed_working_hours: Math.max(Math.min(focusElapsedHours - 1.4, 5), 0),
        utilization_percent: Number(
          ((Math.max(Math.min(focusElapsedHours - 1.4, 5), 0) / 5) * 100).toFixed(1),
        ),
        tone:
          focusElapsedHours - 1.4 > 5 ? "critical" : focusElapsedHours - 1.4 >= 4 ? "warning" : "normal",
        status: activeCaseCount > 0 ? "in_progress" : "completed",
      },
      {
        key: "approval",
        label: "Supervisory Approval",
        budget_hours: 2,
        elapsed_working_hours: activeCaseCount > 0 ? 0 : 1.2,
        utilization_percent: activeCaseCount > 0 ? 0 : 60,
        tone: "normal",
        status: activeCaseCount > 0 ? "pending" : "completed",
      },
    ],
  );
}

function investigationDemoKpi(
  focusCaseNumber: string,
  focusElapsedHours: number,
  tone: GovernancePhaseKpiSummary["tone"],
  activeCaseCount: number,
  completedCaseCount: number,
  atRiskCaseCount: number,
  overdueCaseCount: number,
): GovernancePhaseKpiSummary {
  return createDemoPhaseKpi(
    "Investigation Time",
    40,
    tone,
    focusCaseNumber,
    activeCaseCount > 0 ? "in_progress" : "completed",
    focusElapsedHours,
    activeCaseCount,
    completedCaseCount,
    atRiskCaseCount,
    overdueCaseCount,
    [
      {
        key: "delegation",
        label: "Delegation",
        budget_hours: 4,
        elapsed_working_hours: 2,
        utilization_percent: 50,
        tone: "normal",
        status: "completed",
      },
      {
        key: "investigation",
        label: "Investigation Work",
        budget_hours: 28,
        elapsed_working_hours: Math.max(Math.min(focusElapsedHours - 6, 28), 0),
        utilization_percent: Number(
          ((Math.max(Math.min(focusElapsedHours - 6, 28), 0) / 28) * 100).toFixed(1),
        ),
        tone:
          focusElapsedHours - 6 > 28 ? "critical" : focusElapsedHours - 6 >= 22.4 ? "warning" : "normal",
        status: activeCaseCount > 0 ? "in_progress" : "completed",
      },
      {
        key: "approval",
        label: "Supervisory Approval",
        budget_hours: 4,
        elapsed_working_hours: activeCaseCount > 0 ? 0 : 3,
        utilization_percent: activeCaseCount > 0 ? 0 : 75,
        tone: "normal",
        status: activeCaseCount > 0 ? "pending" : "completed",
      },
      {
        key: "director",
        label: "Director Approval",
        budget_hours: 4,
        elapsed_working_hours: activeCaseCount > 0 ? 0 : 2.5,
        utilization_percent: activeCaseCount > 0 ? 0 : 62.5,
        tone: "normal",
        status: activeCaseCount > 0 ? "pending" : "completed",
      },
    ],
  );
}

export function demoGovernanceDashboardForRole(
  role?: UserRole | null,
): GovernanceDashboardData {
  const specific = {
    supervisor_of_verificator: {
      role: "supervisor_of_verificator",
      role_label: "Verification Supervisor",
      scope_label:
        "Your verification supervision workload plus all verification officer activity currently under that functional scope.",
      metrics: [
        {
          label: "Cases in your scope",
          value: 12,
          detail: "Open cases that fall inside your current operational responsibility.",
          tone: "normal" as const,
        },
        {
          label: "Awaiting your action",
          value: 3,
          detail: "Cases currently blocked on your delegation or approval step.",
          tone: "warning" as const,
        },
        {
          label: "Team backlog",
          value: 5,
          detail: "Pending queue and approval load currently held by verification officers in scope.",
          tone: "warning" as const,
        },
        {
          label: "Overdue in scope",
          value: 1,
          detail: "Open cases in your scope that have breached the current SLA.",
          tone: "warning" as const,
        },
      ],
      action_items: [
        {
          title: "Delegate submitted reports",
          detail: "New reports should be assigned to a verification officer for assessment.",
          href: "/workflow",
          count: 2,
          tone: "warning" as const,
        },
        {
          title: "Approve verification outputs",
          detail: "Verification packages are waiting for supervisory approval or return.",
          href: "/workflow/approvals",
          count: 1,
          tone: "warning" as const,
        },
        {
          title: "Follow up verification officer backlog",
          detail: "Monitor open workload held by verification officers in your scope.",
          href: "/governance",
          count: 5,
          tone: "warning" as const,
        },
      ],
      scope_rows: [
        {
          is_self: true,
          subject_label: "Sinta Pramudita (You)",
          role: "supervisor_of_verificator",
          role_label: "Verification Supervisor",
          unit: "Verification Supervision",
          open_cases: 7,
          pending_queue: 2,
          pending_approvals: 1,
          overdue_cases: 1,
          completed_cases: 5,
          verification_kpi: verificationDemoKpi("CASE-2026-0031", 6.8, "warning", 3, 5, 1, 0),
          investigation_kpi: null,
          last_activity_at: "2026-03-28T11:00:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Aditya Prakoso",
          role: "verificator",
          role_label: "Verification Officer",
          unit: "Verification Desk",
          open_cases: 3,
          pending_queue: 2,
          pending_approvals: 0,
          overdue_cases: 0,
          completed_cases: 4,
          verification_kpi: verificationDemoKpi("CASE-2026-0034", 4.7, "normal", 2, 4, 0, 0),
          investigation_kpi: null,
          last_activity_at: "2026-03-28T10:20:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Nabila Kartika",
          role: "verificator",
          role_label: "Verification Officer",
          unit: "Verification Desk",
          open_cases: 2,
          pending_queue: 1,
          pending_approvals: 0,
          overdue_cases: 0,
          completed_cases: 3,
          verification_kpi: verificationDemoKpi("CASE-2026-0035", 3.6, "normal", 1, 3, 0, 0),
          investigation_kpi: null,
          last_activity_at: "2026-03-28T09:35:00.000Z",
        },
      ],
    },
    verificator: {
      role: "verificator",
      role_label: "Verification Officer",
      scope_label: "Your own verification workload, timeliness, and completion performance.",
      metrics: [
        {
          label: "Cases in your scope",
          value: 4,
          detail: "Open cases that fall inside your current operational responsibility.",
          tone: "normal" as const,
        },
        {
          label: "Awaiting your action",
          value: 3,
          detail: "Cases currently blocked on your verification step.",
          tone: "warning" as const,
        },
        {
          label: "Completed by you",
          value: 6,
          detail: "Cases already completed within your own assignment scope.",
          tone: "normal" as const,
        },
        {
          label: "Overdue in scope",
          value: 1,
          detail: "Open cases in your scope that have breached the current SLA.",
          tone: "warning" as const,
        },
      ],
      action_items: [
        {
          title: "Continue verification work",
          detail: "Assigned cases remain in your verification queue.",
          href: "/workflow",
          count: 3,
          tone: "warning" as const,
        },
        {
          title: "Resolve overdue verifications",
          detail: "Focus on assigned verification cases that have breached SLA.",
          href: "/workflow",
          count: 1,
          tone: "warning" as const,
        },
      ],
      scope_rows: [
        {
          is_self: true,
          subject_label: "Aditya Prakoso (You)",
          role: "verificator",
          role_label: "Verification Officer",
          unit: "Verification Desk",
          open_cases: 4,
          pending_queue: 3,
          pending_approvals: 0,
          overdue_cases: 1,
          completed_cases: 6,
          verification_kpi: verificationDemoKpi("CASE-2026-0028", 8.6, "critical", 3, 6, 1, 1),
          investigation_kpi: null,
          last_activity_at: "2026-03-28T10:20:00.000Z",
        },
      ],
    },
    supervisor_of_investigator: {
      role: "supervisor_of_investigator",
      role_label: "Investigation Supervisor",
      scope_label:
        "Your investigation supervision workload plus all investigator activity currently under that functional scope.",
      metrics: [
        {
          label: "Cases in your scope",
          value: 11,
          detail: "Open cases that fall inside your current operational responsibility.",
          tone: "normal" as const,
        },
        {
          label: "Awaiting your action",
          value: 3,
          detail: "Cases currently blocked on your delegation or approval step.",
          tone: "warning" as const,
        },
        {
          label: "Team backlog",
          value: 4,
          detail: "Pending queue and approval load currently held by investigators in scope.",
          tone: "warning" as const,
        },
        {
          label: "Overdue in scope",
          value: 1,
          detail: "Open cases in your scope that have breached the current SLA.",
          tone: "warning" as const,
        },
      ],
      action_items: [
        {
          title: "Delegate verified reports",
          detail: "Approved verification cases are waiting for investigator assignment.",
          href: "/workflow",
          count: 2,
          tone: "warning" as const,
        },
        {
          title: "Approve investigation outputs",
          detail: "Investigation packages are waiting for supervisory approval or return.",
          href: "/workflow/approvals",
          count: 1,
          tone: "warning" as const,
        },
        {
          title: "Follow up investigator backlog",
          detail: "Monitor open workload held by investigators in your scope.",
          href: "/governance",
          count: 4,
          tone: "warning" as const,
        },
      ],
      scope_rows: [
        {
          is_self: true,
          subject_label: "Bagas Santoso (You)",
          role: "supervisor_of_investigator",
          role_label: "Investigation Supervisor",
          unit: "Investigation Supervision",
          open_cases: 6,
          pending_queue: 2,
          pending_approvals: 1,
          overdue_cases: 1,
          completed_cases: 4,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0036", 33.5, "warning", 3, 4, 1, 0),
          last_activity_at: "2026-03-28T14:00:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Ayu Wicaksono",
          role: "investigator",
          role_label: "Investigator",
          unit: "Investigation Desk",
          open_cases: 3,
          pending_queue: 2,
          pending_approvals: 0,
          overdue_cases: 0,
          completed_cases: 5,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0038", 26.4, "normal", 2, 5, 0, 0),
          last_activity_at: "2026-03-28T12:25:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Rizky Mahendra",
          role: "investigator",
          role_label: "Investigator",
          unit: "Investigation Desk",
          open_cases: 2,
          pending_queue: 0,
          pending_approvals: 0,
          overdue_cases: 0,
          completed_cases: 2,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0032", 18.2, "normal", 0, 2, 0, 0),
          last_activity_at: "2026-03-27T16:10:00.000Z",
        },
      ],
    },
    investigator: {
      role: "investigator",
      role_label: "Investigator",
      scope_label: "Your own investigation workload, timeliness, and completion performance.",
      metrics: [
        {
          label: "Cases in your scope",
          value: 5,
          detail: "Open cases that fall inside your current operational responsibility.",
          tone: "normal" as const,
        },
        {
          label: "Awaiting your action",
          value: 4,
          detail: "Cases currently blocked on your investigation step.",
          tone: "warning" as const,
        },
        {
          label: "Completed by you",
          value: 5,
          detail: "Cases already completed within your own assignment scope.",
          tone: "normal" as const,
        },
        {
          label: "Overdue in scope",
          value: 1,
          detail: "Open cases in your scope that have breached the current SLA.",
          tone: "warning" as const,
        },
      ],
      action_items: [
        {
          title: "Continue investigation work",
          detail: "Assigned cases remain in your investigation queue.",
          href: "/workflow",
          count: 4,
          tone: "warning" as const,
        },
        {
          title: "Resolve overdue investigations",
          detail: "Focus on assigned investigation cases that have breached SLA.",
          href: "/workflow",
          count: 1,
          tone: "warning" as const,
        },
      ],
      scope_rows: [
        {
          is_self: true,
          subject_label: "Ayu Wicaksono (You)",
          role: "investigator",
          role_label: "Investigator",
          unit: "Investigation Desk",
          open_cases: 5,
          pending_queue: 4,
          pending_approvals: 0,
          overdue_cases: 1,
          completed_cases: 5,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0038", 41.6, "critical", 4, 5, 1, 1),
          last_activity_at: "2026-03-28T12:25:00.000Z",
        },
      ],
    },
    director: {
      role: "director",
      role_label: "Director",
      scope_label:
        "Your final approval responsibilities plus the broader internal workload across the whistleblowing process.",
      metrics: [
        {
          label: "Cases in your scope",
          value: 31,
          detail: "Open cases that fall inside your current operational responsibility.",
          tone: "normal" as const,
        },
        {
          label: "Awaiting your action",
          value: 2,
          detail: "Cases currently blocked on your final approval step.",
          tone: "warning" as const,
        },
        {
          label: "Team backlog",
          value: 12,
          detail: "Pending queue and approval load currently held by internal workflow roles.",
          tone: "warning" as const,
        },
        {
          label: "Overdue in scope",
          value: 3,
          detail: "Open cases in your scope that have breached the current SLA.",
          tone: "critical" as const,
        },
      ],
      action_items: [
        {
          title: "Resolve final approvals",
          detail: "Director review is the final decision gate before case completion.",
          href: "/workflow/approvals",
          count: 2,
          tone: "warning" as const,
        },
        {
          title: "Review overdue operational cases",
          detail: "Escalate cases that have breached SLA anywhere in the internal workflow.",
          href: "/governance",
          count: 3,
          tone: "critical" as const,
        },
        {
          title: "Monitor control warnings",
          detail: "Use governance control status to intervene before integrity risk grows.",
          href: "/governance",
          count: 1,
          tone: "warning" as const,
        },
      ],
      scope_rows: [
        {
          is_self: false,
          subject_label: "Sinta Pramudita",
          role: "supervisor_of_verificator",
          role_label: "Verification Supervisor",
          unit: "Verification Supervision",
          open_cases: 7,
          pending_queue: 2,
          pending_approvals: 1,
          overdue_cases: 1,
          completed_cases: 5,
          verification_kpi: verificationDemoKpi("CASE-2026-0031", 6.8, "warning", 3, 5, 1, 0),
          investigation_kpi: null,
          last_activity_at: "2026-03-28T11:00:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Aditya Prakoso",
          role: "verificator",
          role_label: "Verification Officer",
          unit: "Verification Desk",
          open_cases: 4,
          pending_queue: 3,
          pending_approvals: 0,
          overdue_cases: 1,
          completed_cases: 6,
          verification_kpi: verificationDemoKpi("CASE-2026-0028", 8.6, "critical", 3, 6, 1, 1),
          investigation_kpi: null,
          last_activity_at: "2026-03-28T10:20:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Bagas Santoso",
          role: "supervisor_of_investigator",
          role_label: "Investigation Supervisor",
          unit: "Investigation Supervision",
          open_cases: 6,
          pending_queue: 2,
          pending_approvals: 1,
          overdue_cases: 1,
          completed_cases: 4,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0036", 33.5, "warning", 3, 4, 1, 0),
          last_activity_at: "2026-03-28T14:00:00.000Z",
        },
        {
          is_self: false,
          subject_label: "Ayu Wicaksono",
          role: "investigator",
          role_label: "Investigator",
          unit: "Investigation Desk",
          open_cases: 5,
          pending_queue: 4,
          pending_approvals: 0,
          overdue_cases: 1,
          completed_cases: 5,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0038", 41.6, "critical", 4, 5, 1, 1),
          last_activity_at: "2026-03-28T12:25:00.000Z",
        },
        {
          is_self: true,
          subject_label: "Nadia Prabowo (You)",
          role: "director",
          role_label: "Director",
          unit: "Directorate of Public Reports and Complaints",
          open_cases: 2,
          pending_queue: 0,
          pending_approvals: 2,
          overdue_cases: 0,
          completed_cases: 9,
          verification_kpi: null,
          investigation_kpi: investigationDemoKpi("CASE-2026-0036", 35.5, "warning", 2, 9, 1, 0),
          last_activity_at: "2026-03-28T16:00:00.000Z",
        },
        {
          is_self: false,
          subject_label: "System Administration Team",
          role: "system_administrator",
          role_label: "System Administrator",
          unit: "System Administration",
          open_cases: 0,
          pending_queue: 0,
          pending_approvals: 0,
          overdue_cases: 0,
          completed_cases: 0,
          verification_kpi: null,
          investigation_kpi: null,
          last_activity_at: "2026-03-28T15:15:00.000Z",
        },
      ],
    },
    system_administrator: {
      role: "system_administrator",
      role_label: "System Administrator",
      scope_label:
        "Platform controls, user readiness, and audit visibility across the whole whistleblowing environment.",
      metrics: [
        {
          label: "Active internal users",
          value: 38,
          detail: "Internal accounts currently enabled for operations.",
          tone: "normal" as const,
        },
        {
          label: "Inactive internal users",
          value: 2,
          detail: "Provisioned accounts that are currently disabled.",
          tone: "warning" as const,
        },
        {
          label: "Control warnings",
          value: 1,
          detail: "Governance controls currently flagged with warning status.",
          tone: "warning" as const,
        },
        {
          label: "Audit events (24h)",
          value: 18,
          detail: "Recent audit evidence captured in the last 24 hours.",
          tone: "normal" as const,
        },
      ],
      action_items: [
        {
          title: "Review control exceptions",
          detail: "Inspect warning controls and coordinate remediation with operational owners.",
          href: "/governance",
          count: 1,
          tone: "warning" as const,
        },
        {
          title: "Manage inactive internal users",
          detail: "Inactive accounts may block case assignment and approval flow.",
          href: "/admin",
          count: 2,
          tone: "warning" as const,
        },
        {
          title: "Inspect recent audit activity",
          detail: "Operational evidence should remain fresh and queryable.",
          href: "/governance",
          count: 18,
          tone: "normal" as const,
        },
      ],
      scope_rows: [],
    },
    auditor: {
      role: "auditor",
      role_label: "Auditor",
      scope_label:
        "Read-only monitoring of anonymized workflow KPI, SLA utilization, and audit trace metadata across internal officers.",
      metrics: [
        {
          label: "Monitored operational cases",
          value: 31,
          detail: "Open workflow cases currently monitored in anonymized form.",
          tone: "normal" as const,
        },
        {
          label: "Overdue operational cases",
          value: 3,
          detail: "Cases whose active operational phase has exceeded the configured KPI budget.",
          tone: "critical" as const,
        },
        {
          label: "Avg verification cycle",
          value: "6.2 h",
          detail: "Average working-hour elapsed time across verification phase snapshots.",
          tone: "normal" as const,
        },
        {
          label: "Avg investigation cycle",
          value: "27.8 h",
          detail: "Average working-hour elapsed time across investigation phase snapshots.",
          tone: "normal" as const,
        },
      ],
      action_items: [
        {
          title: "Review overdue operational cases",
          detail: "Focus on anonymized cases that have exceeded the configured KPI budget.",
          href: "/governance",
          count: 3,
          tone: "critical" as const,
        },
        {
          title: "Inspect verification cycle drift",
          detail: "Watch cases approaching or breaching the verification working-day budget.",
          href: "/governance",
          count: 2,
          tone: "warning" as const,
        },
        {
          title: "Inspect recent workflow audit evidence",
          detail: "Review metadata-only audit events to confirm operational traceability remains current.",
          href: "/governance",
          count: 8,
          tone: "normal" as const,
        },
      ],
      scope_rows: [],
      case_rows: [
        {
          audit_case_id: "AUD-CASE-0031",
          stage: "verification_in_progress",
          stage_label: "Verification in Progress",
          status: "verification_in_progress",
          current_role: "verificator",
          current_role_label: "Verification Officer",
          assigned_unit: "Verification Desk",
          submitted_at: "2026-03-27T08:10:00.000Z",
          verification_started_at: "2026-03-27T08:40:00.000Z",
          verification_completed_at: null,
          investigation_started_at: null,
          investigation_completed_at: null,
          director_decided_at: null,
          last_activity_at: "2026-03-28T10:20:00.000Z",
          sla_status: "at_risk",
          sla_status_label: "At risk",
          sla_tone: "warning",
          verification_kpi: verificationDemoKpi("AUD-CASE-0031", 6.8, "warning", 3, 5, 1, 0),
          investigation_kpi: null,
        },
        {
          audit_case_id: "AUD-CASE-0038",
          stage: "investigation_in_progress",
          stage_label: "Investigation in Progress",
          status: "investigation_in_progress",
          current_role: "investigator",
          current_role_label: "Investigator",
          assigned_unit: "Investigation Desk",
          submitted_at: "2026-03-21T09:00:00.000Z",
          verification_started_at: "2026-03-21T10:00:00.000Z",
          verification_completed_at: "2026-03-24T12:30:00.000Z",
          investigation_started_at: "2026-03-25T08:00:00.000Z",
          investigation_completed_at: null,
          director_decided_at: null,
          last_activity_at: "2026-03-28T12:25:00.000Z",
          sla_status: "overdue",
          sla_status_label: "Overdue",
          sla_tone: "critical",
          verification_kpi: verificationDemoKpi("AUD-CASE-0038", 7.3, "warning", 0, 1, 0, 0),
          investigation_kpi: investigationDemoKpi("AUD-CASE-0038", 41.6, "critical", 4, 5, 1, 1),
        },
        {
          audit_case_id: "AUD-CASE-0036",
          stage: "director_review",
          stage_label: "Director Review",
          status: "director_review",
          current_role: "director",
          current_role_label: "Director",
          assigned_unit: "Directorate of Public Reports and Complaints",
          submitted_at: "2026-03-18T07:30:00.000Z",
          verification_started_at: "2026-03-18T09:00:00.000Z",
          verification_completed_at: "2026-03-19T14:10:00.000Z",
          investigation_started_at: "2026-03-20T08:00:00.000Z",
          investigation_completed_at: "2026-03-27T15:20:00.000Z",
          director_decided_at: null,
          last_activity_at: "2026-03-28T16:00:00.000Z",
          sla_status: "on_track",
          sla_status_label: "On track",
          sla_tone: "normal",
          verification_kpi: verificationDemoKpi("AUD-CASE-0036", 5.2, "normal", 0, 1, 0, 0),
          investigation_kpi: investigationDemoKpi("AUD-CASE-0036", 35.5, "warning", 2, 9, 1, 0),
        },
      ],
    },
  } satisfies Record<Exclude<UserRole, "reporter">, GovernanceDashboardData["specific"]>;

  const selectedRole =
    role && role !== "reporter" ? role : "director";
  const global =
    selectedRole === "auditor"
      ? {
          ...demoGovernanceGlobal,
          action_items: demoGovernanceGlobal.action_items.map((item) => ({
            ...item,
            href: "/governance",
          })),
          recent_audit_logs: demoGovernanceGlobal.recent_audit_logs.map((log, index) => ({
            ...log,
            actor_name: null,
            context: {
              case_reference: `AUD-CASE-00${index + 31}`,
              stage:
                index === 0
                  ? "director_review"
                  : index === 1
                    ? "investigation_in_progress"
                    : index === 2
                      ? "verification_review"
                      : "submitted",
              status:
                index === 0
                  ? "director_review"
                  : index === 1
                    ? "investigation_in_progress"
                    : index === 2
                      ? "verification_review"
                      : "submitted",
              assigned_role:
                index === 0
                  ? "director"
                  : index === 1
                    ? "supervisor_of_investigator"
                    : "supervisor_of_verificator",
              assigned_unit:
                index === 0
                  ? "Directorate of Public Reports and Complaints"
                  : index === 1
                    ? "Investigation Supervision"
                    : "Verification Supervision",
            },
          })),
        }
      : demoGovernanceGlobal;

  return {
    global,
    specific: specific[selectedRole],
  };
}

export const demoGovernanceDashboard = demoGovernanceDashboardForRole("director");
