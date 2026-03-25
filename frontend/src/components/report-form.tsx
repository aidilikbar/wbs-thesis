"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  categoryOptions,
  governanceTagOptions,
  initialSubmissionPayload,
} from "@/lib/demo-data";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { isReporter } from "@/lib/roles";
import type { ReporterReportDetail, SubmissionPayload } from "@/lib/types";

const filingSteps = [
  "Allegation",
  "Context",
  "Governance",
  "Identity Protection",
];

function buildPayloadFromReport(report: ReporterReportDetail): SubmissionPayload {
  return {
    title: report.title,
    category: report.category,
    description: report.description,
    incident_date: report.incident_date ?? "",
    incident_location: report.incident_location ?? "",
    accused_party: report.accused_party ?? "",
    evidence_summary: report.evidence_summary ?? "",
    confidentiality_level: report.confidentiality_level as SubmissionPayload["confidentiality_level"],
    requested_follow_up: report.requested_follow_up,
    witness_available: report.witness_available,
    governance_tags: report.governance_tags,
  };
}

export function ReportForm({
  mode,
  reportId,
}: {
  mode: "create" | "edit";
  reportId?: number;
}) {
  const router = useRouter();
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [form, setForm] = useState<SubmissionPayload>(initialSubmissionPayload);
  const [record, setRecord] = useState<ReporterReportDetail | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isPending, startTransition] = useTransition();

  const isReporterUser = isReporter(user?.role);
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!isEditMode) {
      setIsLoading(false);

      return;
    }

    if (!isReady) {
      return;
    }

    if (!token || !isReporterUser || !reportId || Number.isNaN(reportId)) {
      setIsLoading(false);

      return;
    }

    let active = true;

    const loadReport = async () => {
      try {
        const data = await api.fetchReporterReport(token, reportId);

        if (!active) {
          return;
        }

        setRecord(data);
        setForm(buildPayloadFromReport(data));
        setFeedback(null);
      } catch (error) {
        if (active) {
          setFeedback(
            error instanceof Error ? error.message : "Report could not be loaded.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      active = false;
    };
  }, [isEditMode, isReady, token, isReporterUser, reportId]);

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
      setFeedback("You must be logged in as a reporter before continuing.");

      return;
    }

    startTransition(async () => {
      try {
        if (isEditMode && reportId) {
          await api.updateReporterReport(token, reportId, form);
          router.push("/submit?notice=updated");
          router.refresh();

          return;
        }

        const data = await api.submitReport(token, form);
        router.push(
          `/submit?notice=created&reference=${encodeURIComponent(data.public_reference)}&trackingToken=${encodeURIComponent(data.tracking_token)}`,
        );
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : isEditMode
              ? "The report could not be updated."
              : "The report could not be submitted.",
        );
      }
    });
  };

  if (!isReady || isLoading) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">
          {isEditMode ? "Loading reporter record." : "Loading reporter session."}
        </p>
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

  if (isEditMode && !record) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="eyebrow">Record Not Available</p>
        <h2 className="mt-4 text-3xl">The selected report could not be opened</h2>
        <p className="muted mt-4 text-sm leading-7">
          {feedback ?? "The requested record was not found in your reporter account."}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push("/submit")}
            className="primary-button cursor-pointer"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const editLocked = Boolean(isEditMode && record && !record.is_editable);

  return (
    <div className="grid gap-8 xl:grid-cols-[250px_1fr]">
      <aside className="space-y-4">
        <div className="panel rounded-[1rem] p-6">
          <p className="eyebrow">
            {isEditMode ? "Reporter Edit Session" : "Secure Filing Session"}
          </p>
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
            Reporter Account
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Account identity is now managed from the top-right profile page so the filing screen can stay focused on the allegation itself.
          </p>
          <div className="mt-5">
            <Link href="/profile" className="ghost-button">
              Open Profile
            </Link>
          </div>
        </div>

        {record ? (
          <div className="panel rounded-[1rem] p-6">
            <p className="eyebrow">Current Record</p>
            <div className="mt-4 space-y-3 text-sm leading-7">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Reference
                </p>
                <p className="font-mono">{record.public_reference}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Status
                </p>
                <p>{record.case.stage_label ?? record.status}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Submitted
                </p>
                <p>{formatDateTime(record.submitted_at)}</p>
              </div>
            </div>
          </div>
        ) : null}

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
                {isEditMode
                  ? "Revise the report details while preserving the existing workflow record"
                  : "Report corruption with as much specific detail as possible"}
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
                  disabled={editLocked}
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
                  disabled={editLocked}
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
                  disabled={editLocked}
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
                  disabled={editLocked}
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
                  disabled={editLocked}
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
                  disabled={editLocked}
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
                  disabled={editLocked}
                />
              </label>
            </div>

            {!isEditMode ? (
              <div className="mt-6 rounded-[0.85rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.12)] px-5 py-4 text-sm leading-7 text-[var(--secondary-strong)]">
                Evidence files are uploaded after the report is created. Once you submit
                this report, open the report detail page to upload PDFs, images, office
                documents, and other supporting files into private MinIO object storage.
              </div>
            ) : null}

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
                      disabled={editLocked}
                      className={`rounded-[0.35rem] border px-4 py-3 text-[0.72rem] font-mono uppercase tracking-[0.22em] transition ${
                        active
                          ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.1)] text-[var(--primary-strong)]"
                          : "border-[var(--panel-border)] bg-white/80 text-[var(--foreground)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
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
                    disabled={editLocked}
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
                    disabled={editLocked}
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
                <label className="block rounded-[0.85rem] border border-white/10 bg-white/5 p-5 text-white">
                  <span className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={form.confidentiality_level === "anonymous"}
                      onChange={(event) =>
                        updateField(
                          "confidentiality_level",
                          event.target.checked ? "anonymous" : "identified",
                        )
                      }
                      disabled={editLocked}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-mono text-[0.64rem] uppercase tracking-[0.22em] text-white/56">
                        Anonymous Submission
                      </span>
                      <span className="mt-2 block text-sm font-semibold">
                        {form.confidentiality_level === "anonymous"
                          ? "Case handlers cannot view your identity."
                          : "Authorized case handlers can view your identity."}
                      </span>
                      <span className="mt-3 block text-sm leading-7 text-white/72">
                        Your account remains authenticated either way. The reporter can still access, review, and track the report normally from the reporter workspace.
                      </span>
                    </span>
                  </span>
                </label>

                <div className="rounded-[0.8rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/72">
                  Reporter identity data remains confidential in the system. Anonymous mode hides it from internal case handlers, while identified mode allows normal role-based handling.
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

          {editLocked && record?.edit_lock_reason ? (
            <p className="rounded-[0.8rem] border border-amber-200 bg-amber-100 px-4 py-4 text-sm text-amber-900">
              {record.edit_lock_reason}
            </p>
          ) : null}

          <div className="flex flex-col gap-5 border-t border-[var(--panel-border)] pt-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {isEditMode
                ? "Updates remain tied to the original reporter account and are written into the audit trail of the existing case."
                : "The report is transmitted to the Laravel backend and enters the KPK role-based review process beginning with the supervisor of verificator."}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/submit")}
                className="ghost-button cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || editLocked}
                className="primary-button disabled:opacity-60"
              >
                {isPending
                  ? isEditMode
                    ? "Saving..."
                    : "Submitting..."
                  : isEditMode
                    ? "Save Changes"
                    : "Submit Secure Report"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
