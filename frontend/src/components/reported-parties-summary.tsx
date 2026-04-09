"use client";

import type { ReportedParty } from "@/lib/types";

export function ReportedPartiesSummary({
  parties,
  title = "Reported Parties",
  emptyLabel = "No reported parties recorded.",
}: {
  parties: ReportedParty[];
  title?: string;
  emptyLabel?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
        {title}
      </p>
      <div className="mt-3 space-y-3">
        {parties.length > 0 ? (
          parties.map((party, index) => (
            <article
              key={`${party.full_name}-${party.position}-${index}`}
              className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-4 py-4"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {party.full_name}
              </p>
              <p className="muted mt-1 text-sm">{party.position}</p>
              <p className="mt-2 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--neutral)]">
                {party.classification.replaceAll("_", " ")}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
