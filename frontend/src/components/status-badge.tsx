type StatusBadgeProps = {
  value: string;
  label?: string;
};

function badgeClasses(value: string) {
  const normalized = value.toLowerCase();

  if (["critical", "rejected", "danger"].includes(normalized)) {
    return "border border-[rgba(237,28,36,0.18)] bg-[rgba(237,28,36,0.12)] text-[var(--accent-strong)]";
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
    return "border border-[rgba(16,17,20,0.12)] bg-[rgba(16,17,20,0.06)] text-[var(--foreground)]";
  }

  if (
    [
      "completed",
      "active",
      "verification_in_progress",
      "verification_review",
      "verified",
      "submitted",
      "identified",
    ].includes(normalized)
  ) {
    return "border border-[rgba(16,17,20,0.08)] bg-white text-[var(--foreground)]";
  }

  return "border border-[rgba(16,17,20,0.08)] bg-[var(--surface-soft)] text-[var(--muted)]";
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClasses(
        value,
      )}`}
    >
      {label ?? value.replaceAll("_", " ")}
    </span>
  );
}
