"use client";

import { useState, useTransition } from "react";
import { api } from "@/lib/api";
import {
  categoryOptions,
  governanceTagOptions,
  initialSubmissionPayload,
} from "@/lib/demo-data";
import type { SubmissionPayload, SubmissionReceipt } from "@/lib/types";

function buildFallbackReceipt(form: SubmissionPayload): SubmissionReceipt {
  const year = new Date().getFullYear();
  const suffix = `${Math.floor(Math.random() * 9000) + 1000}`;

  return {
    public_reference: `WBS-${year}-${suffix}`,
    tracking_token: `TRACK${Math.floor(Math.random() * 900000 + 100000)}`,
    case_number: `CASE-${year}-${suffix}`,
    status: "submitted",
    severity:
      form.category === "bribery" || form.category === "procurement"
        ? "high"
        : "medium",
    submitted_at: new Date().toISOString(),
    next_steps: [
      "This is a temporary receipt because the backend service could not be reached.",
      "Keep the reference and token to explore the tracking screen.",
      "Start the Laravel API to receive persistent case numbers.",
    ],
  };
}

export function ReportForm() {
  const [form, setForm] = useState<SubmissionPayload>(initialSubmissionPayload);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateField = <K extends keyof SubmissionPayload>(
    field: K,
    value: SubmissionPayload[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      governance_tags: current.governance_tags.includes(tag)
        ? current.governance_tags.filter((item) => item !== tag)
        : [...current.governance_tags, tag],
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const data = await api.submitReport(form);
        setReceipt(data);
      } catch (error) {
        setReceipt(buildFallbackReceipt(form));
        setFeedback(
          error instanceof Error
            ? `${error.message} Showing a temporary local receipt.`
            : "The API is unavailable. Showing a temporary local receipt.",
        );
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form className="panel rounded-[2rem] p-7 sm:p-8" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Report title</span>
            <input
              className="field"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Concise statement of the allegation"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Category</span>
            <select
              className="field"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold">Narrative</span>
            <textarea
              className="field min-h-40"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe the incident, who was involved, what happened, and why it matters."
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Incident date</span>
            <input
              className="field"
              type="date"
              value={form.incident_date}
              onChange={(event) => updateField("incident_date", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Location</span>
            <input
              className="field"
              value={form.incident_location}
              onChange={(event) =>
                updateField("incident_location", event.target.value)
              }
              placeholder="Office, unit, or process stage"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Accused party</span>
            <input
              className="field"
              value={form.accused_party}
              onChange={(event) => updateField("accused_party", event.target.value)}
              placeholder="Person, team, or role"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Evidence summary
            </span>
            <input
              className="field"
              value={form.evidence_summary}
              onChange={(event) =>
                updateField("evidence_summary", event.target.value)
              }
              placeholder="Documents, logs, screenshots, witnesses"
            />
          </label>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Disclosure mode</span>
            <select
              className="field"
              value={form.anonymity_level}
              onChange={(event) =>
                updateField(
                  "anonymity_level",
                  event.target.value as SubmissionPayload["anonymity_level"],
                )
              }
            >
              <option value="anonymous">Anonymous</option>
              <option value="confidential">Confidential</option>
              <option value="identified">Identified</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Reporter name</span>
            <input
              className="field"
              value={form.reporter_name}
              onChange={(event) => updateField("reporter_name", event.target.value)}
              placeholder="Optional unless identified"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Reporter email</span>
            <input
              className="field"
              type="email"
              value={form.reporter_email}
              onChange={(event) => updateField("reporter_email", event.target.value)}
              placeholder="For protected follow-up"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Reporter phone</span>
            <input
              className="field"
              value={form.reporter_phone}
              onChange={(event) => updateField("reporter_phone", event.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold">Governance flags</p>
          <div className="flex flex-wrap gap-3">
            {governanceTagOptions.map((tag) => {
              const active = form.governance_tags.includes(tag.value);

              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "border border-[var(--panel-border)] bg-white/60 text-[var(--foreground)]"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.witness_available}
              onChange={(event) =>
                updateField("witness_available", event.target.checked)
              }
            />
            Witnesses can corroborate the report
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.requested_follow_up}
              onChange={(event) =>
                updateField("requested_follow_up", event.target.checked)
              }
            />
            I want follow-up through protected channels
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Submitting..." : "Submit disclosure"}
          </button>
          <p className="muted max-w-xl text-sm leading-7">
            The form sends data to the Laravel API when available and falls back
            to a temporary local receipt otherwise.
          </p>
        </div>
      </form>

      <aside className="space-y-6">
        <div className="panel rounded-[2rem] p-7">
          <p className="eyebrow">Intake Guarantees</p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
            <li>Every submission receives a case reference and tracking token.</li>
            <li>Governance tags help prioritise retaliation, procurement, and data risks.</li>
            <li>Only public-safe milestones are exposed to the reporter later.</li>
          </ul>
        </div>

        <div className="panel rounded-[2rem] p-7">
          <p className="eyebrow">Receipt</p>
          {feedback ? (
            <p className="mt-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
              {feedback}
            </p>
          ) : null}
          {receipt ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.4rem] bg-[var(--surface-soft)]/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Public reference
                </p>
                <p className="mt-2 font-mono text-lg">{receipt.public_reference}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-soft)]/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Tracking token
                </p>
                <p className="mt-2 font-mono text-lg">{receipt.tracking_token}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--surface-soft)]/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Next steps
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
                  {receipt.next_steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted mt-4 text-sm leading-7">
              Submit the form to receive the reference and token pair used by the
              tracking screen.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
