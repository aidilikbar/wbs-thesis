"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { demoInvestigatorCases } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import type { InvestigatorCase } from "@/lib/types";

const stageFilters = [
  { value: "all", label: "All" },
  { value: "assessment", label: "Assessment" },
  { value: "investigation", label: "Investigation" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

export function InvestigatorWorkbench() {
  const [cases, setCases] = useState<InvestigatorCase[]>([]);
  const [stageFilter, setStageFilter] = useState("all");
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await api.fetchInvestigatorCases();

        if (active) {
          setCases(data);
          setUsingFallback(false);
        }
      } catch {
        if (active) {
          setCases(demoInvestigatorCases);
          setUsingFallback(true);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const visibleCases =
    stageFilter === "all"
      ? cases
      : cases.filter((caseItem) => caseItem.stage === stageFilter);

  return (
    <div className="panel rounded-[2rem] p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Queue Overview</p>
          <h2 className="mt-3 text-3xl">Case ownership, stage, and SLA posture</h2>
          {usingFallback ? (
            <p className="mt-3 rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-900">
              Backend unavailable. Showing a seeded reference queue.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {stageFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStageFilter(filter.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                stageFilter === filter.value
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "border border-[var(--panel-border)] bg-white/55"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {visibleCases.map((caseItem) => (
          <article
            key={caseItem.case_number}
            className="rounded-[1.6rem] border border-[var(--panel-border)] bg-white/65 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {caseItem.case_number}
                </p>
                <h3 className="mt-2 text-2xl">{caseItem.title}</h3>
                <p className="muted mt-2 text-sm">
                  Public ref: {caseItem.public_reference}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={caseItem.stage} label={caseItem.stage_label} />
                <StatusBadge value={caseItem.severity} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Ownership
                </p>
                <p className="mt-2 text-sm">
                  {caseItem.assigned_to ?? "Unassigned"} · {caseItem.assigned_unit}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  SLA due
                </p>
                <p className="mt-2 text-sm">{formatDateTime(caseItem.sla_due_at)}</p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Latest internal event
                </p>
                <p className="mt-2 text-sm">{caseItem.latest_internal_event}</p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Governance flags
                </p>
                <p className="mt-2 text-sm">
                  {caseItem.governance_tags.length > 0
                    ? caseItem.governance_tags.join(", ")
                    : "No additional flags"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
