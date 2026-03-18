"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { demoTrackingRecord } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import type { TrackingRecord } from "@/lib/types";

export function TrackingWorkbench() {
  const [reference, setReference] = useState("");
  const [token, setToken] = useState("");
  const [record, setRecord] = useState<TrackingRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const data = await api.trackReport({ reference, token });
        setRecord(data);
      } catch (error) {
        setRecord(demoTrackingRecord);
        setMessage(
          error instanceof Error
            ? `${error.message} Showing a reference tracking record instead.`
            : "The API is unavailable. Showing a reference tracking record instead.",
        );
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <form className="panel rounded-[2rem] p-7" onSubmit={handleSubmit}>
        <p className="eyebrow">Reference Pair</p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Public reference</span>
            <input
              className="field"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Example: WBS-2026-0001"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Tracking token</span>
            <input
              className="field font-mono"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Example: TRACK123456"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-6 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Checking..." : "Track case"}
        </button>
        <p className="muted mt-5 text-sm leading-7">
          If the API is offline, the page falls back to a reference case so the
          interface can still be reviewed.
        </p>
        {message ? (
          <p className="mt-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
      </form>

      <div className="panel rounded-[2rem] p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Public Timeline</p>
            <h2 className="mt-3 text-3xl">
              {record?.title ?? "No record loaded yet"}
            </h2>
          </div>
          {record ? <StatusBadge value={record.status} /> : null}
        </div>

        {record ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Reference
                </p>
                <p className="mt-2 font-mono text-sm">{record.public_reference}</p>
              </article>
              <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Stage
                </p>
                <p className="mt-2 text-sm">{record.case.stage_label}</p>
              </article>
              <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Severity
                </p>
                <p className="mt-2 text-sm">{record.severity}</p>
              </article>
              <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Submitted
                </p>
                <p className="mt-2 text-sm">{formatDateTime(record.submitted_at)}</p>
              </article>
            </div>

            <div className="space-y-4">
              {record.timeline.map((item) => (
                <article
                  key={`${item.headline}-${item.occurred_at}`}
                  className="rounded-[1.5rem] border border-[var(--panel-border)] bg-white/60 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow">{item.stage_label}</p>
                      <h3 className="mt-2 text-2xl">{item.headline}</h3>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {formatDateTime(item.occurred_at)}
                    </p>
                  </div>
                  <p className="muted mt-4 text-sm leading-7">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted mt-6 text-sm leading-7">
            Load a case using the public reference and tracking token you
            received after submission.
          </p>
        )}
      </div>
    </div>
  );
}
