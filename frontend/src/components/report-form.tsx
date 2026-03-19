"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  categoryOptions,
  confidentialityOptions,
  demoReporterReports,
  governanceTagOptions,
  initialSubmissionPayload,
} from "@/lib/demo-data";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { isReporter } from "@/lib/roles";
import type {
  ReporterReportSummary,
  SubmissionPayload,
  SubmissionReceipt,
} from "@/lib/types";

export function ReportForm() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [form, setForm] = useState<SubmissionPayload>(initialSubmissionPayload);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reports, setReports] = useState<ReporterReportSummary[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isReporterUser = isReporter(user?.role);

  useEffect(() => {
    if (!token || !isReporterUser) {
      return;
    }

    let active = true;

    const loadReports = async () => {
      try {
        const data = await api.listReporterReports(token);

        if (active) {
          setReports(data);
          setUsingFallback(false);
        }
      } catch {
        if (active) {
          setReports(demoReporterReports);
          setUsingFallback(true);
        }
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, [token, isReporterUser, receipt]);

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

    if (!token) {
      setFeedback("You must be logged in as a reporter before submitting a report.");

      return;
    }

    startTransition(async () => {
      try {
        const data = await api.submitReport(token, form);
        setReceipt(data);
        setForm(initialSubmissionPayload);
        setFeedback("Report submitted successfully.");
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "The report could not be submitted.",
        );
      }
    });
  };

  if (!isReady) {
    return (
      <div className="panel rounded-[2rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading reporter session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isReporterUser || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Reporter Access Required</p>
          <h2 className="mt-4 text-3xl">Register before submitting a report</h2>
          <p className="muted mt-4 max-w-2xl text-sm leading-7">
            In this prototype, the reporter must register and log in before a report can be submitted.
            Internal roles are created separately by the system administrator and cannot self-register.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Reporter registration
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--panel-border)] bg-white px-5 py-3 text-sm font-semibold"
            >
              Login
            </Link>
          </div>
        </div>

        <aside className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Submission Rules</p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
            <li>Reporter identity is established through registration before report intake.</li>
            <li>Confidential or identified reporting modes remain available after login.</li>
            <li>Public tracking still uses the reference and token pair returned after submission.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <form className="panel rounded-[2rem] p-7 sm:p-8" onSubmit={handleSubmit}>
        <div className="rounded-[1.5rem] border border-[var(--panel-border)] bg-white/70 p-5">
          <p className="eyebrow">Reporter Identity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Name</p>
              <p className="mt-2 text-sm">{user.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Email</p>
              <p className="mt-2 text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Phone</p>
              <p className="mt-2 text-sm">{user.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Role</p>
              <p className="mt-2 text-sm">{user.role_label}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
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
              placeholder="Describe the incident, involved parties, chronology, and governance impact."
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
              onChange={(event) => updateField("incident_location", event.target.value)}
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
            <span className="mb-2 block text-sm font-semibold">Evidence summary</span>
            <input
              className="field"
              value={form.evidence_summary}
              onChange={(event) => updateField("evidence_summary", event.target.value)}
              placeholder="Documents, witnesses, screenshots, logs"
            />
          </label>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Confidentiality level</span>
            <select
              className="field"
              value={form.confidentiality_level}
              onChange={(event) =>
                updateField(
                  "confidentiality_level",
                  event.target.value as SubmissionPayload["confidentiality_level"],
                )
              }
            >
              {confidentialityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            I want protected follow-up
          </label>
        </div>

        {feedback ? (
          <p
            className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
              feedback.includes("successfully")
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {feedback}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Submitting..." : "Submit report"}
          </button>
          <p className="muted max-w-xl text-sm leading-7">
            The report is sent directly to the Laravel backend and will be routed first to the supervisor of verificator.
          </p>
        </div>
      </form>

      <aside className="space-y-6">
        <div className="panel rounded-[2rem] p-7">
          <p className="eyebrow">Submission Outcome</p>
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
              Once submitted, the system will return a public reference and tracking token for future tracking.
            </p>
          )}
        </div>

        <div className="panel rounded-[2rem] p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">My Reports</p>
              <p className="muted mt-3 text-sm leading-7">
                Recent reports submitted from this reporter account.
              </p>
            </div>
            {usingFallback ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                Seeded
              </span>
            ) : null}
          </div>
          <div className="mt-5 space-y-4">
            {reports.length > 0 ? (
              reports.map((report) => (
                <article
                  key={report.public_reference}
                  className="rounded-[1.4rem] border border-[var(--panel-border)] bg-white/60 p-5"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    {report.public_reference}
                  </p>
                  <h3 className="mt-2 text-xl">{report.title}</h3>
                  <p className="muted mt-3 text-sm leading-7">
                    {report.case.stage_label ?? "Submitted"} · {formatDateTime(report.submitted_at)}
                  </p>
                </article>
              ))
            ) : (
              <p className="muted text-sm leading-7">
                No reports have been submitted from this account yet.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
