"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getStageLabel, normalizeWorkflowCopy } from "@/lib/labels";
import type { TrackingRecord } from "@/lib/types";

export function TrackingWorkbench() {
  const [record, setRecord] = useState<TrackingRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setRecord(null);
    const formData = new FormData(event.currentTarget);
    const reference = String(formData.get("reference") ?? "");
    const token = String(formData.get("token") ?? "");

    startTransition(async () => {
      try {
        const data = await api.trackReport({ reference, token });
        setRecord(data);
      } catch (error) {
        setRecord(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "The tracking service is currently unavailable. Please try again.",
        );
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
      <div className="space-y-6">
        <form className="panel rounded-[1rem] p-7" onSubmit={handleSubmit}>
          <p className="eyebrow">Tracking Gateway</p>
          <h2 className="mt-3 text-3xl">Secure public status lookup</h2>
          <p className="muted mt-4 text-sm leading-7">
            Enter the public reference and private tracking token issued after submission. This workspace discloses only public-safe milestones.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block" htmlFor="tracking-reference">
              <span className="mb-2 block text-sm font-semibold">Public reference</span>
              <input
                id="tracking-reference"
                name="reference"
                aria-label="Public reference"
                className="field"
                placeholder="Example: WBS-2026-0001"
                required
              />
            </label>
            <label className="block" htmlFor="tracking-token">
              <span className="mb-2 block text-sm font-semibold">Tracking token</span>
              <input
                id="tracking-token"
                name="token"
                aria-label="Tracking token"
                className="field font-mono"
                placeholder="Example: TRACK123456"
                required
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={isPending} className="primary-button">
              {isPending ? "Checking..." : "Track Case"}
            </button>
          </div>

          {message ? (
            <p className="mt-5 rounded-[0.65rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
              {message}
            </p>
          ) : null}
        </form>

        <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Public Tracking Rules
          </p>
          <ul className="mt-5 space-y-4 text-sm leading-7 text-white/72">
            <li>Only public-safe stage changes are visible in this channel.</li>
            <li>Reporter identity, internal notes, and assignment details remain protected.</li>
            <li>Use the reporter workspace for authenticated submission and evidence follow-up.</li>
          </ul>
        </aside>
      </div>

      <div className="space-y-6">
        <section className="panel rounded-[1rem] p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Public Timeline</p>
              <h2 className="mt-3 text-3xl">
                {record?.title ?? "No record loaded yet"}
              </h2>
              <p className="muted mt-4 text-sm leading-7">
                Reporter-facing visibility into approved milestones only.
              </p>
            </div>
            {record ? <StatusBadge value={record.status} /> : null}
          </div>

          {record ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="signal-card rounded-[0.85rem] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Reference
                </p>
                <p className="mt-2 font-mono text-sm">{record.public_reference}</p>
              </article>
              <article className="outline-panel rounded-[0.85rem] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Stage
                </p>
                <p className="mt-2 text-sm">
                  {getStageLabel(record.case.stage, record.case.stage_label)}
                </p>
              </article>
              <article className="outline-panel rounded-[0.85rem] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Submitted
                </p>
                <p className="mt-2 text-sm">{formatDateTime(record.submitted_at)}</p>
              </article>
            </div>
          ) : (
            <p className="muted mt-6 text-sm leading-7">
              Load a case using the public reference and tracking token you received after submission.
            </p>
          )}
        </section>

        {record ? (
          <section className="panel rounded-[1rem] p-7">
            <p className="eyebrow">Milestone Ledger</p>
            <div className="mt-6 space-y-4">
              {record.timeline.map((item, index) => (
                <article
                  key={`${item.headline}-${item.occurred_at}`}
                  className="grid gap-4 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 p-5 lg:grid-cols-[auto_1fr]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[0.45rem] bg-[var(--primary)] font-mono text-xs font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="eyebrow">{getStageLabel(item.stage, item.stage_label)}</p>
                        <h3 className="mt-2 text-2xl">{normalizeWorkflowCopy(item.headline)}</h3>
                      </div>
                      <p className="text-sm text-[var(--muted)]">
                        {formatDateTime(item.occurred_at)}
                      </p>
                    </div>
                    <p className="muted mt-4 text-sm leading-7">
                      {normalizeWorkflowCopy(item.detail)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
