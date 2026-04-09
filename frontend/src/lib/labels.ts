import type { UserRole } from "@/lib/types";

export const roleLabels: Record<UserRole, string> = {
  reporter: "Reporter",
  supervisor_of_verificator: "Verification Supervisor",
  verificator: "Verification Officer",
  supervisor_of_investigator: "Review Supervisor",
  investigator: "Reviewer",
  director: "Director",
  system_administrator: "System Administrator",
};

export const stageLabels: Record<string, string> = {
  submitted: "Submitted",
  verification_in_progress: "Verification in Progress",
  verification_review: "Verification Approval",
  verified: "Awaiting Review Delegation",
  investigation_in_progress: "Review in Progress",
  investigation_review: "Review Approval",
  director_review: "Director Review",
  completed: "Completed",
};

const legacyTextReplacements: Array<[RegExp, string]> = [
  [/Supervisor of Verificator/g, "Verification Supervisor"],
  [/supervisor of verificator/g, "verification supervisor"],
  [/Supervisor of Investigator/g, "Review Supervisor"],
  [/supervisor of investigator/g, "review supervisor"],
  [/Supervisor Verificator/g, "Verification Supervisor"],
  [/Supervisor Investigator/g, "Review Supervisor"],
  [/Verificators/g, "Verification Officers"],
  [/verificators/g, "verification officers"],
  [/Verificator/g, "Verification Officer"],
  [/verificator/g, "verification officer"],
  [/Verification In Progress/g, "Verification in Progress"],
  [/Investigation In Progress/g, "Review in Progress"],
  [/Investigation Supervisor/g, "Review Supervisor"],
  [/investigation supervisor/g, "review supervisor"],
  [/Investigator/g, "Reviewer"],
  [/investigator/g, "reviewer"],
  [/Verification Review/g, "Verification Approval"],
  [/Investigation Review/g, "Review Approval"],
];

function titleCase(value: string): string {
  return value
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeWorkflowCopy(value?: string | null): string {
  if (!value) {
    return "";
  }

  return legacyTextReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

export function getRoleLabel(
  role?: string | null,
  fallbackLabel?: string | null,
): string {
  if (role && role in roleLabels) {
    return roleLabels[role as UserRole];
  }

  if (fallbackLabel) {
    return normalizeWorkflowCopy(fallbackLabel);
  }

  return normalizeWorkflowCopy(role ? titleCase(role) : "Unknown Role");
}

export function getStageLabel(
  stage?: string | null,
  fallbackLabel?: string | null,
): string {
  if (stage && stage in stageLabels) {
    return stageLabels[stage];
  }

  if (fallbackLabel) {
    return normalizeWorkflowCopy(fallbackLabel);
  }

  return normalizeWorkflowCopy(stage ? titleCase(stage) : "Unknown Stage");
}

export function getDisplayLabel(
  value?: string | null,
  fallbackLabel?: string | null,
): string {
  if (value && value in roleLabels) {
    return getRoleLabel(value, fallbackLabel);
  }

  if (value && value in stageLabels) {
    return getStageLabel(value, fallbackLabel);
  }

  if (fallbackLabel) {
    return normalizeWorkflowCopy(fallbackLabel);
  }

  return normalizeWorkflowCopy(value ? titleCase(value) : "");
}
