import type { UserRole, WorkflowCase, WorkflowDirectoryView } from "@/lib/types";

export const workflowActionLabels: Record<string, string> = {
  delegate_verification: "Delegate to Verificator",
  submit_verification: "Submit Verification",
  review_verification: "Approval Review",
  delegate_investigation: "Delegate to Investigator",
  submit_investigation: "Submit Analysis",
  review_investigation: "Approval Review",
  director_review: "Director Approval",
};

const stageLabels: Record<string, string> = {
  submitted: "Submitted",
  verification_in_progress: "Verification",
  verification_review: "Verification Approval",
  verified: "Verified",
  investigation_in_progress: "Investigation",
  investigation_review: "Investigation Approval",
  director_review: "Director Approval",
};

export function workflowHasApprovalMenu(role?: string | null): boolean {
  return [
    "supervisor_of_verificator",
    "supervisor_of_investigator",
    "director",
    "system_administrator",
  ].includes(role ?? "");
}

export function workflowAllowedStagesForView(
  role?: string | null,
  view: WorkflowDirectoryView = "queue",
): string[] {
  const queueStages = {
    supervisor_of_verificator: ["submitted"],
    verificator: ["verification_in_progress"],
    supervisor_of_investigator: ["verified"],
    investigator: ["investigation_in_progress"],
    director: [],
    system_administrator: [
      "submitted",
      "verification_in_progress",
      "verified",
      "investigation_in_progress",
    ],
  } satisfies Partial<Record<UserRole, string[]>>;

  const approvalStages = {
    supervisor_of_verificator: ["verification_review"],
    supervisor_of_investigator: ["investigation_review"],
    director: ["director_review"],
    system_administrator: [
      "verification_review",
      "investigation_review",
      "director_review",
    ],
  } satisfies Partial<Record<UserRole, string[]>>;

  const map: Partial<Record<UserRole, string[]>> =
    view === "approval" ? approvalStages : queueStages;

  return role ? (map as Record<string, string[]>)[role] ?? [] : [];
}

export function workflowStageOptions(
  role?: string | null,
  view: WorkflowDirectoryView = "queue",
) {
  const stages = workflowAllowedStagesForView(role, view);

  return [
    { value: "all", label: "All stages" },
    ...stages.map((stage) => ({
      value: stage,
      label: stageLabels[stage] ?? stage.replaceAll("_", " "),
    })),
  ];
}

export function workflowNoticeText(notice?: string | null): string | null {
  if (notice === "updated") {
    return "Workflow action completed successfully.";
  }

  return null;
}

export function isApprovalAction(action?: string | null): boolean {
  return [
    "review_verification",
    "review_investigation",
    "director_review",
  ].includes(action ?? "");
}

export function workflowActionPath(caseId: number, action?: string | null): string {
  if (isApprovalAction(action)) {
    return `/workflow/${caseId}/approval`;
  }

  return `/workflow/${caseId}/edit`;
}

export function workflowActionShortLabel(action?: string | null): string {
  return workflowActionLabels[action ?? ""] ?? "Open";
}

export function workflowIdentityLabel(value: string) {
  if (value === "anonymous") {
    return "Anonymous";
  }

  if (value === "identified") {
    return "Identified";
  }

  return value.replaceAll("_", " ");
}

export function workflowMatchesSearch(caseItem: WorkflowCase, term: string): boolean {
  const needle = term.trim().toLowerCase();

  if (needle.length === 0) {
    return true;
  }

  return [
    caseItem.case_number,
    caseItem.public_reference,
    caseItem.title,
    caseItem.category,
    caseItem.assigned_to,
    caseItem.assigned_unit,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}
