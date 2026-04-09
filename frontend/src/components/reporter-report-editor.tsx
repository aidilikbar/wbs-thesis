"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { CaseMessageBoard } from "@/components/case-message-board";
import { ReportAttachmentField } from "@/components/report-attachment-field";
import { StatusBadge } from "@/components/status-badge";
import {
  categoryOptions,
  confidentialityOptions,
  governanceTagOptions,
} from "@/lib/demo-data";
import { validateAttachmentSelection } from "@/lib/attachment-validation";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { triggerBlobDownload } from "@/lib/file-utils";
import { getRoleLabel, getStageLabel, normalizeWorkflowCopy } from "@/lib/labels";
import { isReporter } from "@/lib/roles";
import type {
  ReportAttachment,
  ReporterReportDetail,
  SubmissionPayload,
} from "@/lib/types";

const workflowMilestones = [
  {
    label: "Report Received",
    description: "The report has been received and registered in the KPK workflow.",
  },
  {
    label: "Verification Underway",
    description:
      "A verification officer and the supervising reviewer are assessing initial completeness and validity.",
  },
  {
    label: "Follow-up Review",
    description: "The case is moving through investigation, supervisory review, or director decision.",
  },
  {
    label: "Closed",
    description: "KPK has completed the final decision for this report.",
  },
] as const;

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

function readLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
) {
  if (!value) {
    return "Not recorded";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

function milestoneIndex(status: string) {
  if (status === "completed") {
    return 3;
  }

  if (
    ["verified", "investigation_in_progress", "investigation_review", "director_review"].includes(
      status,
    )
  ) {
    return 2;
  }

  if (["verification_in_progress", "verification_review"].includes(status)) {
    return 1;
  }

  return 0;
}

export function ReporterReportEditor({ reportId }: { reportId: number }) {
  const router = useRouter();
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [record, setRecord] = useState<ReporterReportDetail | null>(null);
  const [form, setForm] = useState<SubmissionPayload | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentMessage, setAttachmentMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isReporterUser = isReporter(user?.role);

  const refreshRecord = async () => {
    if (!token || !isReporterUser || Number.isNaN(reportId)) {
      return;
    }

    const data = await api.fetchReporterReport(token, reportId);
    setRecord(data);
    setForm(buildPayloadFromReport(data));
    setMessage(null);
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token || !isReporterUser || Number.isNaN(reportId)) {
      setIsLoading(false);

      return;
    }

    let active = true;

    const loadRecord = async () => {
      try {
        const data = await api.fetchReporterReport(token, reportId);

        if (!active) {
          return;
        }

        setRecord(data);
        setForm(buildPayloadFromReport(data));
        setMessage(null);
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error ? error.message : "The report detail could not be loaded.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRecord();

    return () => {
      active = false;
    };
  }, [isReady, token, isReporterUser, reportId]);

  const updateField = <K extends keyof SubmissionPayload>(
    field: K,
    value: SubmissionPayload[K],
  ) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const toggleTag = (tag: string) => {
    setForm((current) =>
      current
        ? {
            ...current,
            governance_tags: current.governance_tags.includes(tag)
              ? current.governance_tags.filter((item) => item !== tag)
              : [...current.governance_tags, tag],
          }
        : current,
    );
  };

  const handleSelectedFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    setAttachmentMessage(validateAttachmentSelection(files));
  };

  const handleDownloadAttachment = async (attachment: ReportAttachment) => {
    if (!token || !record) {
      return;
    }

    try {
      const blob = await api.downloadReporterAttachment(token, record.id, attachment.id);
      triggerBlobDownload(blob, attachment.original_name);
      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Attachment download failed.",
      );
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!token || !record) {
      return;
    }

    try {
      await api.deleteReporterAttachment(token, record.id, attachmentId);
      await refreshRecord();
      setMessage("Attachment deleted successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Attachment deletion failed.",
      );
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !form || !record) {
      setMessage("Reporter authentication is required before updating this record.");

      return;
    }

    const selectedFilesError = validateAttachmentSelection(selectedFiles);
    setAttachmentMessage(selectedFilesError);

    if (selectedFilesError) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        await api.updateReporterReport(token, reportId, form, selectedFiles);
        router.push("/submit?notice=updated");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "The report could not be updated.",
        );
      }
    });
  };

  if (!isReady || isLoading) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading report detail.</p>
      </div>
    );
  }

  if (!isAuthenticated || !token || !isReporterUser || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Reporter Access Required</p>
          <h2 className="mt-4 text-3xl">Login before opening a report detail</h2>
          <p className="muted mt-4 text-sm leading-7">
            This page is limited to the reporter account that created the report.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="primary-button">
              Login
            </Link>
            <Link href="/register" className="ghost-button">
              Register
            </Link>
          </div>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Reporter Rule
          </p>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Public tracking remains available at `/track`, while this authenticated detail page reveals the report data and public timeline for the owning reporter only.
          </p>
        </aside>
      </div>
    );
  }

  if (!record || !form) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="eyebrow">Report Not Available</p>
        <h2 className="mt-4 text-3xl">The selected report could not be opened</h2>
        <p className="muted mt-4 text-sm leading-7">
          {message ?? "The report detail is unavailable for this reporter account."}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push("/submit")}
            className="ghost-button cursor-pointer"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const editLocked = !record.is_editable;
  const currentMilestone = milestoneIndex(record.status);
  const confidentialityLabel = readLabel(
    confidentialityOptions,
    form.confidentiality_level,
  );

  return (
    <div className="space-y-6">
      <section className="panel rounded-[1rem] p-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="eyebrow">Report Status</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.4rem)]">{record.title}</h2>
            <p className="muted mt-4 max-w-3xl text-sm leading-8">
              This reporter detail page combines the case summary, current tracking
              status, and editable filing content in one authenticated view. Public
              tracking at `/track` remains available for token-based lookup.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="outline-panel rounded-[0.9rem] px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Public Reference
                </p>
                <p className="mt-3 font-mono text-sm text-[var(--foreground)]">
                  {record.public_reference}
                </p>
              </article>
              <article className="outline-panel rounded-[0.9rem] px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Case Number
                </p>
                <p className="mt-3 font-mono text-sm text-[var(--foreground)]">
                  {record.case.case_number ?? "Pending issuance"}
                </p>
              </article>
              <article className="outline-panel rounded-[0.9rem] px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Report Status
                </p>
                <div className="mt-3">
                  <StatusBadge value={record.status} />
                </div>
              </article>
              <article className="outline-panel rounded-[0.9rem] px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Reporter Identity
                </p>
                <p className="mt-3 text-sm text-[var(--foreground)]">
                  {confidentialityLabel}
                </p>
              </article>
              <article className="outline-panel rounded-[0.9rem] px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Submission Date
                </p>
                <p className="mt-3 text-sm text-[var(--foreground)]">
                  {formatDateTime(record.submitted_at)}
                </p>
              </article>
              <article className="outline-panel rounded-[0.9rem] px-5 py-4">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Tracking Token
                </p>
                <p className="mt-3 font-mono text-sm text-[var(--foreground)]">
                  {record.tracking_token}
                </p>
              </article>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="dark-card rounded-[1rem] border border-white/8 p-6">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
                Tracking Snapshot
              </p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-white/76">
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                    Current Stage
                  </p>
                  <p className="mt-1 text-white">
                    {getStageLabel(record.case.stage, record.case.stage_label) ||
                      "Awaiting assignment"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                    Assigned Unit
                  </p>
                  <p className="mt-1 text-white">
                    {record.case.assigned_unit ?? "Protected routing"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                    Last Public Update
                  </p>
                  <p className="mt-1 text-white">
                    {record.last_public_update_at
                      ? formatDateTime(record.last_public_update_at)
                      : "No public update published yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="accent-card rounded-[1rem] border border-[var(--panel-border)] p-6">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary-strong)]">
                Reporter Account
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Identity and contact details are now managed from the top-right profile
                page instead of inside the filing form.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/profile" className="ghost-button">
                  Open Profile
                </Link>
                <Link href="/track" className="primary-button">
                  Public Tracking
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Tracking Status</p>
            <h3 className="mt-3 text-3xl">Reporter-facing case progress</h3>
            <p className="muted mt-4 max-w-3xl text-sm leading-7">
              This timeline mirrors the public-safe milestones already available in the
              tracking portal, but keeps them visible directly inside the report record.
            </p>
          </div>
          <StatusBadge value={record.status} />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {workflowMilestones.map((step, index) => {
            const state =
              index < currentMilestone
                ? "completed"
                : index === currentMilestone
                  ? "current"
                  : "pending";

            return (
              <article
                key={step.label}
                className={`rounded-[0.9rem] border px-5 py-5 ${
                  state === "completed"
                    ? "border-[rgba(197,160,34,0.36)] bg-[rgba(197,160,34,0.14)]"
                    : state === "current"
                      ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.06)]"
                      : "border-[var(--panel-border)] bg-white/76"
                }`}
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h4 className="mt-3 text-lg">{step.label}</h4>
                <p className="muted mt-3 text-sm leading-7">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <form className="panel rounded-[1rem] p-8" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Detail</p>
              <h3 className="mt-3 text-3xl">Report content</h3>
              <p className="muted mt-4 max-w-2xl text-sm leading-7">
                Simplified filing fields for the reporter. The case reference, progress,
                and account identity are handled outside this form.
              </p>
            </div>
            <p className="rounded-[0.7rem] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.72)] px-4 py-3 font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
              {record.category_label}
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                Title
              </span>
              <input
                className="field"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                disabled={editLocked}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                Category
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
                Description
              </span>
              <textarea
                className="field min-h-44"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                disabled={editLocked}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                Location
              </span>
              <input
                className="field"
                value={form.incident_location}
                onChange={(event) => updateField("incident_location", event.target.value)}
                disabled={editLocked}
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                Accused Party
              </span>
              <input
                className="field"
                value={form.accused_party}
                onChange={(event) => updateField("accused_party", event.target.value)}
                disabled={editLocked}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                Evidence Summary
              </span>
              <textarea
                className="field min-h-36"
                value={form.evidence_summary}
                onChange={(event) => updateField("evidence_summary", event.target.value)}
                disabled={editLocked}
              />
            </label>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Protection
              </p>
              <label className="mt-4 block rounded-[0.8rem] border border-[var(--panel-border)] bg-white p-4">
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
                    <span className="block font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                      Anonymous Submission
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-[var(--foreground)]">
                      {form.confidentiality_level === "anonymous"
                        ? "Case handlers cannot view your identity."
                        : "Authorized case handlers can view your identity."}
                    </span>
                    <span className="muted mt-3 block text-sm leading-7">
                      The report still belongs to your authenticated reporter account, so you can continue to access, edit, and track it normally.
                    </span>
                  </span>
                </span>
              </label>

              <div className="mt-5 space-y-3 text-sm">
                <label className="outline-panel flex items-center gap-3 rounded-[0.75rem] px-4 py-4">
                  <input
                    type="checkbox"
                    checked={form.witness_available}
                    onChange={(event) =>
                      updateField("witness_available", event.target.checked)
                    }
                    disabled={editLocked}
                  />
                  Witnesses are available for protected follow-up
                </label>
                <label className="outline-panel flex items-center gap-3 rounded-[0.75rem] px-4 py-4">
                  <input
                    type="checkbox"
                    checked={form.requested_follow_up}
                    onChange={(event) =>
                      updateField("requested_follow_up", event.target.checked)
                    }
                    disabled={editLocked}
                  />
                  Reporter requests secure follow-up
                </label>
              </div>
            </div>

            <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Governance Tags
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
                          : "border-[var(--panel-border)] bg-white text-[var(--foreground)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <ReportAttachmentField
              selectedFiles={selectedFiles}
              existingAttachments={record.attachments}
              canMutate={!editLocked}
              isBusy={isPending}
              validationMessage={attachmentMessage}
              onSelectedFilesChange={handleSelectedFilesChange}
              onDownloadAttachment={handleDownloadAttachment}
              onDeleteAttachment={handleDeleteAttachment}
            />
          </div>

          {message ? (
            <p className="mt-6 rounded-[0.8rem] border border-amber-200 bg-amber-100 px-4 py-4 text-sm text-amber-900">
              {message}
            </p>
          ) : null}

          {editLocked && record.edit_lock_reason ? (
            <p className="mt-6 rounded-[0.8rem] border border-amber-200 bg-amber-100 px-4 py-4 text-sm text-amber-900">
              {record.edit_lock_reason}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--panel-border)] pt-6">
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Saving writes a new reporter update into the existing case audit trail, then
              returns you to the report index.
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
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <section className="panel rounded-[1rem] p-8">
            <p className="eyebrow">DETAIL</p>
            <h3 className="mt-3 text-3xl">Current case snapshot</h3>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/74 px-5 py-4">
                <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Category
                </dt>
                <dd className="mt-2 text-sm text-[var(--foreground)]">
                  {record.category_label}
                </dd>
              </div>
              <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/74 px-5 py-4">
                <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Current Role
                </dt>
                <dd className="mt-2 text-sm text-[var(--foreground)]">
                  {getRoleLabel(record.case.current_role, record.case.current_role_label) ||
                    "Protected routing"}
                </dd>
              </div>
              <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/74 px-5 py-4">
                <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Confidentiality
                </dt>
                <dd className="mt-2 text-sm text-[var(--foreground)]">
                  {confidentialityLabel}
                </dd>
              </div>
              <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/74 px-5 py-4">
                <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Severity
                </dt>
                <dd className="mt-2 text-sm text-[var(--foreground)]">{record.severity}</dd>
              </div>
            </dl>
          </section>

          <section className="panel rounded-[1rem] p-8">
            <p className="eyebrow">TRACKING</p>
            <h3 className="mt-3 text-3xl">Public-safe milestone history</h3>
            {record.timeline.length > 0 ? (
              <div className="mt-6 space-y-4">
                {record.timeline.map((item, index) => (
                  <article
                    key={`${item.headline}-${item.occurred_at}`}
                    className="grid gap-4 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/74 p-5 lg:grid-cols-[auto_1fr]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[0.45rem] bg-[var(--primary)] font-mono text-xs font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                            {getStageLabel(item.stage, item.stage_label)}
                          </p>
                          <h4 className="mt-2 text-xl">{item.headline}</h4>
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
            ) : (
              <p className="muted mt-6 text-sm leading-7">
                No public milestones have been published yet beyond the initial submission.
              </p>
            )}
          </section>
        </div>
      </div>

      <CaseMessageBoard
        token={token}
        scope={{ kind: "reporter", reportId: record.id }}
      />

    </div>
  );
}
