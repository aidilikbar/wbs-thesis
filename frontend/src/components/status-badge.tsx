import { getDisplayLabel } from "@/lib/labels";

type StatusBadgeProps = {
  value: string;
  label?: string;
};

function badgeClasses(value: string) {
  const normalized = value.toLowerCase();

  if (["critical", "rejected", "danger"].includes(normalized)) {
    return "border border-[rgba(239,47,39,0.24)] bg-[rgba(239,47,39,0.12)] text-[var(--primary-strong)]";
  }

  if (
    [
      "high",
      "investigation_in_progress",
      "investigation_review",
      "director_review",
      "warning",
    ].includes(normalized)
  ) {
    return "border border-[rgba(197,160,34,0.28)] bg-[rgba(197,160,34,0.16)] text-[var(--secondary-strong)]";
  }

  if (
    [
      "completed",
      "active",
      "verification_in_progress",
      "verification_review",
      "verified",
      "submitted",
      "anonymous",
      "identified",
    ].includes(normalized)
  ) {
    return "border border-[rgba(19,19,19,0.08)] bg-white text-[var(--foreground)]";
  }

  return "border border-[rgba(116,118,121,0.16)] bg-[rgba(116,118,121,0.12)] text-[var(--neutral)]";
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-[0.25rem] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${badgeClasses(
        value,
      )}`}
    >
      {getDisplayLabel(value, label)}
    </span>
  );
}
