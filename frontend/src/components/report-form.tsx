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

const filingSteps = [
  "Allegation",
  "Context",
  "Governance",
  "Identity Protection",
];

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
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading reporter session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isReporterUser || !user) {
    return (
      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="panel rounded-[1rem] p-6">
            <p className="eyebrow">Secure Filing Steps</p>
            <div className="mt-5 space-y-3">
              {filingSteps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-[0.7rem] px-4 py-3 ${
                    index === 0
                      ? "bg-[rgba(239,47,39,0.08)] text-[var(--foreground)]"
                      : "bg-white/75 text-[var(--neutral)]"
                  }`}
                >
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.24em]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="accent-card rounded-[1rem] border border-[var(--panel-border)] p-6">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--secondary-strong)]">
              Legal Notice
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Reporter registration is required before a report may enter the system. Internal role accounts are provisioned separately by the system administrator.
            </p>
          </div>
        </aside>

        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Reporter Access Required</p>
          <h2 className="mt-4 text-4xl">Register before starting a secure filing session</h2>
          <p className="muted mt-5 max-w-3xl text-base leading-8">
            The filing flow is reserved for authenticated reporters. Once signed in, the report is routed to the supervisor of verificator and tracked through the formal KPK workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="primary-button">
              Reporter Registration
            </Link>
            <Link href="/login" className="ghost-button">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[250px_1fr]">
      <aside className="space-y-4">
        <div className="panel rounded-[1rem] p-6">
          <p className="eyebrow">Secure Filing Session</p>
          <div className="mt-5 space-y-3">
            {filingSteps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-[0.7rem] border px-4 py-3 ${
                  index === 0
                    ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.08)]"
                    : "border-[var(--panel-border)] bg-white/76"
                }`}
              >
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-[var(--primary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="accent-card rounded-[1rem] border border-[var(--panel-border)] p-6">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary-strong)]">
            Reporter Profile
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Name
              </p>
              <p>{user.name}</p>
            </div>
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Email
              </p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Phone
              </p>
              <p>{user.phone}</p>
            </div>
          </div>
        </div>

        <div className="dark-card rounded-[1rem] border border-[rgba(0,0,0,0.3)] p-6">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
            Encryption Shield
          </p>
          <p className="mt-4 text-sm leading-7 text-white/76">
            Identity handling is protected, while routing and audit controls remain visible to authorized governance roles only.
          </p>
        </div>
      </aside>

      <div className="space-y-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="panel rounded-[1rem] p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Step 01</p>
                <h2 className="mt-3 text-4xl">Allegation Details</h2>
              </div>
              <p className="max-w-sm text-right font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                Report corruption with as much specific detail as possible
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Case Title
                </span>
                <input
                  className="field"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Brief summary of the incident"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Category of Corruption
                </span>
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

              <label className="block">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Incident Date
                </span>
                <input
                  className="field"
                  type="date"
                  value={form.incident_date}
                  onChange={(event) => updateField("incident_date", event.target.value)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Detailed Description
                </span>
                <textarea
                  className="field min-h-48"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Describe who, what, where, when, and how."
                  required
                />
              </label>
            </div>
          </section>

          <section className="panel rounded-[1rem] p-8">
            <div className="mb-6">
              <p className="eyebrow">Step 02</p>
              <h2 className="mt-3 text-4xl">Case Context and Supporting Signals</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Incident Location
                </span>
                <input
                  className="field"
                  value={form.incident_location}
                  onChange={(event) => updateField("incident_location", event.target.value)}
                  placeholder="Office, unit, or process stage"
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Suspected Party
                </span>
                <input
                  className="field"
                  value={form.accused_party}
                  onChange={(event) => updateField("accused_party", event.target.value)}
                  placeholder="Person, team, or role"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Evidence Summary
                </span>
                <input
                  className="field"
                  value={form.evidence_summary}
                  onChange={(event) => updateField("evidence_summary", event.target.value)}
                  placeholder="Documents, witnesses, screenshots, logs"
                />
              </label>
            </div>

            <div className="mt-8">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Governance Flags
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {governanceTagOptions.map((tag) => {
                  const active = form.governance_tags.includes(tag.value);

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleTag(tag.value)}
                      className={`rounded-[0.35rem] border px-4 py-3 text-[0.72rem] font-mono uppercase tracking-[0.22em] transition ${
                        active
                          ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.1)] text-[var(--primary-strong)]"
                          : "border-[var(--panel-border)] bg-white/80 text-[var(--foreground)]"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="outline-panel rounded-[0.8rem] px-5 py-4 text-sm">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.witness_available}
                    onChange={(event) =>
                      updateField("witness_available", event.target.checked)
                    }
                  />
                  Witnesses can corroborate the report
                </span>
              </label>

              <label className="outline-panel rounded-[0.8rem] px-5 py-4 text-sm">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.requested_follow_up}
                    onChange={(event) =>
                      updateField("requested_follow_up", event.target.checked)
                    }
                  />
                  I request protected follow-up
                </span>
              </label>
            </div>
          </section>

          <section className="dark-card rounded-[1rem] border border-[rgba(0,0,0,0.3)] p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="eyebrow text-[var(--secondary)]">Step 03</p>
                <h2 className="mt-3 text-4xl text-white">Identity Protection</h2>
                <p className="mt-5 text-sm leading-8 text-white/72">
                  Choose how your identity is handled in the case record. The account remains authenticated, while public tracking discloses only safe milestones.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em] text-white/56">
                    Confidentiality Mode
                  </span>
                  <select
                    className="field border-white/10 bg-white/10 text-white"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[0.8rem] border border-white/10 bg-white/5 p-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/56">
                      Registered Name
                    </p>
                    <p className="mt-2 text-sm text-white">{user.name}</p>
                  </div>
                  <div className="rounded-[0.8rem] border border-white/10 bg-white/5 p-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/56">
                      Contact Channel
                    </p>
                    <p className="mt-2 text-sm text-white">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {feedback ? (
            <p
              className={`rounded-[0.8rem] px-4 py-4 text-sm ${
                feedback.includes("successfully")
                  ? "border border-emerald-200 bg-emerald-100 text-emerald-900"
                  : "border border-amber-200 bg-amber-100 text-amber-900"
              }`}
            >
              {feedback}
            </p>
          ) : null}

          <div className="flex flex-col gap-5 border-t border-[var(--panel-border)] pt-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              The report is transmitted to the Laravel backend and enters the KPK role-based review process beginning with the supervisor of verificator.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="primary-button disabled:opacity-60"
            >
              {isPending ? "Submitting..." : "Submit Secure Report"}
            </button>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel rounded-[1rem] p-7">
            <p className="eyebrow">Submission Outcome</p>
            {receipt ? (
              <div className="mt-5 space-y-4">
                <div className="signal-card rounded-[0.8rem] border border-[var(--panel-border)] p-5">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                    Public Reference
                  </p>
                  <p className="mt-3 font-mono text-xl">{receipt.public_reference}</p>
                </div>
                <div className="accent-card rounded-[0.8rem] border border-[var(--panel-border)] p-5">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                    Tracking Token
                  </p>
                  <p className="mt-3 font-mono text-xl">{receipt.tracking_token}</p>
                </div>
                <div className="outline-panel rounded-[0.8rem] p-5">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                    Next Steps
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
                After submission, the system issues a public reference and tracking token for public-safe follow-up.
              </p>
            )}
          </div>

          <div className="panel rounded-[1rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Recent Submissions</p>
                <p className="muted mt-3 text-sm leading-7">
                  Reports previously filed from this reporter account.
                </p>
              </div>
              {usingFallback ? (
                <span className="rounded-[0.3rem] bg-amber-100 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-amber-900">
                  Seeded
                </span>
              ) : null}
            </div>
            <div className="mt-5 space-y-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <article
                    key={report.public_reference}
                    className="signal-card rounded-[0.8rem] border border-[var(--panel-border)] p-5"
                  >
                    <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                      {report.public_reference}
                    </p>
                    <h3 className="mt-2 text-2xl">{report.title}</h3>
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
        </div>
      </div>
    </div>
  );
}
