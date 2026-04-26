"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { CaseMessageBoard } from "@/components/case-message-board";
import { ReportAttachmentField } from "@/components/report-attachment-field";
import { ReportedPartiesEditor } from "@/components/reported-parties-editor";
import { ReportedPartiesSummary } from "@/components/reported-parties-summary";
import { StatusBadge } from "@/components/status-badge";
import {
  initialSubmissionPayload,
  reportedPartyClassificationOptions,
} from "@/lib/form-options";
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

type ReporterTab = "details" | "communication";

const workflowMilestones = [
  {
    label: "Report Received",
    description: "The report has been received and registered in the KPK workflow.",
  },
  {
    label: "Verification",
    description: "Verification supervision and the verification officer are assessing the report.",
  },
  {
    label: "Investigation",
    description:
      "The case is moving through investigation delegation, investigation approval, or director decision.",
  },
  {
    label: "Closed",
    description: "KPK has completed the final decision for this report.",
  },
] as const;

function buildPayloadFromReport(report: ReporterReportDetail): SubmissionPayload {
  const reportedParties = report.reported_parties ?? [];

  return {
    title: report.title,
    description: report.description,
    confidentiality_level: report.confidentiality_level === "anonymous" ? "anonymous" : "identified",
    reported_parties:
      reportedParties.length > 0 ? reportedParties : initialSubmissionPayload.reported_parties,
  };
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
  const [activeTab, setActiveTab] = useState<ReporterTab>("details");
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

    if (
      form.title.trim() === "" ||
      form.description.trim() === "" ||
      form.reported_parties.some(
        (party) => party.full_name.trim() === "" || party.position.trim() === "",
      )
    ) {
      setMessage("Complete the report summary and all reported-party fields.");

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
      </div>
    );
  }

  const editLocked = !record.is_editable;
  const currentMilestone = milestoneIndex(record.status);
  const tabs: Array<{ id: ReporterTab; label: string }> = [
    { id: "details", label: "Case Details" },
    { id: "communication", label: "Secure Communication" },
  ];

  return (
    <div className="space-y-6">
      <section className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Report</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.4rem)]">{record.title}</h2>
            <p className="muted mt-4 max-w-3xl text-sm leading-8">
              Review the current report state, inspect protected case details, use secure communication when available, and revise the filing from one authenticated workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge value={record.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[1rem] border border-[var(--panel-border)] bg-white/76 p-6">
            <p className="eyebrow">Tracking Status</p>
            <div className="mt-5 space-y-4">
              {workflowMilestones.map((milestone, index) => {
                const completed = index <= currentMilestone;
                const current = index === currentMilestone;

                return (
                  <div
                    key={milestone.label}
                    className={`rounded-[0.9rem] border px-4 py-4 ${
                      completed
                        ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.08)]"
                        : "border-[var(--panel-border)] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {milestone.label}
                      </p>
                      {current ? <StatusBadge value={record.case.stage ?? record.status} /> : null}
                    </div>
                    <p className="muted mt-2 text-sm leading-7">
                      {milestone.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[1rem] border border-[var(--panel-border)] bg-white/76 p-6">
            <p className="eyebrow">Report Information</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Public Reference
                </p>
                <p className="mt-2 font-mono text-sm">{record.public_reference}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Tracking Token
                </p>
                <p className="mt-2 font-mono text-sm">{record.tracking_token}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Case Number
                </p>
                <p className="mt-2 text-sm">{record.case.case_number ?? "Not assigned"}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Current Stage
                </p>
                <p className="mt-2 text-sm">
                  {getStageLabel(record.case.stage, record.case.stage_label ?? record.status)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Current Handler
                </p>
                <p className="mt-2 text-sm">
                  {getRoleLabel(record.case.current_role, record.case.current_role_label)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Submission Date
                </p>
                <p className="mt-2 text-sm">{formatDateTime(record.submitted_at)}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="panel rounded-[1rem] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[0.8rem] border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-[rgba(239,47,39,0.2)] bg-[rgba(239,47,39,0.08)] text-[var(--primary)]"
                    : "border-[var(--panel-border)] bg-white/76 text-[var(--muted)] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "details" ? (
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <article className="panel rounded-[1rem] p-8">
            <p className="eyebrow">Case Record</p>
            <h3 className="mt-4 text-3xl">Protected case details</h3>
            <div className="mt-6 space-y-6">
              <div>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                  Report Description
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                  {record.description}
                </p>
              </div>

              <ReportedPartiesSummary parties={record.reported_parties ?? []} />

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                    Assigned Unit
                  </p>
                  <p className="mt-2 text-sm">{record.case.assigned_unit ?? "Pending assignment"}</p>
                </div>
                <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                    Last Public Update
                  </p>
                  <p className="mt-2 text-sm">
                    {record.last_public_update_at
                      ? formatDateTime(record.last_public_update_at)
                      : "No public update yet"}
                  </p>
                </div>
              </div>

              <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                  Public Timeline
                </p>
                <div className="mt-4 space-y-3">
                  {record.timeline.length > 0 ? (
                    record.timeline.map((entry, index) => (
                      <article
                        key={`${entry.stage}-${entry.occurred_at}-${index}`}
                        className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {normalizeWorkflowCopy(entry.headline)}
                            </p>
                            <p className="muted mt-2 text-sm leading-7">
                              {normalizeWorkflowCopy(entry.detail)}
                            </p>
                          </div>
                          <p className="text-sm text-[var(--muted)]">
                            {formatDateTime(entry.occurred_at)}
                          </p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      No public timeline events have been published yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="panel rounded-[1rem] p-8">
            <p className="eyebrow">Case Attachment</p>
            <div className="mt-6 space-y-4">
              {record.attachments.length > 0 ? (
                record.attachments.map((attachment) => (
                  <article
                    key={attachment.id}
                    className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg">{attachment.original_name}</h4>
                        <p className="muted mt-2 text-sm leading-7">
                          {attachment.uploaded_at
                            ? `Uploaded ${formatDateTime(attachment.uploaded_at)}`
                            : "Stored attachment"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="ghost-button"
                      >
                        Download
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm text-[var(--muted)]">
                  No stored attachments are linked to this report yet.
                </div>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "communication" ? (
        <CaseMessageBoard token={token} scope={{ kind: "reporter", reportId: record.id }} />
      ) : null}

      <section className="panel rounded-[1rem] p-8">
        <p className="eyebrow">Update Report</p>
        <h3 className="mt-4 text-3xl">
          {editLocked ? "View the submitted filing" : "Revise the original filing"}
        </h3>

        {message ? (
          <p className="mt-5 rounded-[0.7rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
            {message}
          </p>
        ) : null}

        {editLocked && record.edit_lock_reason ? (
          <p className="mt-5 rounded-[0.7rem] border border-amber-200 bg-amber-100 px-4 py-3 text-sm text-amber-900">
            {record.edit_lock_reason}
          </p>
        ) : null}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Report Title</span>
            <input
              className="field"
              value={form.title}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, title: event.target.value } : current,
                )
              }
              disabled={editLocked}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Report Description</span>
            <textarea
              className="field min-h-40"
              value={form.description}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, description: event.target.value } : current,
                )
              }
              disabled={editLocked}
              required
            />
          </label>

          <ReportedPartiesEditor
            parties={form.reported_parties}
            options={reportedPartyClassificationOptions}
            disabled={editLocked}
            onChange={(reported_parties) =>
              setForm((current) => (current ? { ...current, reported_parties } : current))
            }
          />

          <ReportAttachmentField
            selectedFiles={selectedFiles}
            existingAttachments={record.attachments}
            canMutate={!editLocked}
            isBusy={isPending}
            validationMessage={attachmentMessage}
            kicker="Attachments"
            title="Case Attachment"
            onSelectedFilesChange={handleSelectedFilesChange}
            onDownloadAttachment={handleDownloadAttachment}
            onDeleteAttachment={handleDeleteAttachment}
          />

          <label className="flex items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-4 text-sm leading-7">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.confidentiality_level === "anonymous"}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        confidentiality_level: event.target.checked ? "anonymous" : "identified",
                      }
                    : current,
                )
              }
              disabled={editLocked}
            />
            <span>
              <span className="block font-semibold text-[var(--foreground)]">
                Submit as anonymous reporter
              </span>
              <span className="mt-1 block text-[var(--muted)]">
                If checked, internal officers will see the reporter as `Anonymous`. If unchecked, internal officers can see your name.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--panel-border)] pt-6">
            <button
              type="button"
              className="ghost-button"
              onClick={() => router.push("/submit")}
            >
              Cancel
            </button>
            {!editLocked ? (
              <button
                type="submit"
                className="primary-button disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
