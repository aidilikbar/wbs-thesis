"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { ReportAttachmentField } from "@/components/report-attachment-field";
import { ReportedPartiesEditor } from "@/components/reported-parties-editor";
import {
  initialSubmissionPayload,
  reportedPartyClassificationOptions,
} from "@/lib/demo-data";
import { validateAttachmentSelection } from "@/lib/attachment-validation";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { triggerBlobDownload } from "@/lib/file-utils";
import { getStageLabel } from "@/lib/labels";
import { isReporter } from "@/lib/roles";
import type { ReportAttachment, ReporterReportDetail, SubmissionPayload } from "@/lib/types";

const filingSteps = [
  "Report Summary",
  "Reported Parties",
  "Attachments",
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentFeedback, setAttachmentFeedback] = useState<string | null>(null);
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

  const handleDownloadAttachment = async (attachment: ReportAttachment) => {
    if (!token || !record) {
      return;
    }

    try {
      const blob = await api.downloadReporterAttachment(token, record.id, attachment.id);
      triggerBlobDownload(blob, attachment.original_name);
      setFeedback(null);
    } catch (error) {
      setFeedback(
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
      const updatedRecord = await api.fetchReporterReport(token, record.id);
      setRecord(updatedRecord);
      setForm(buildPayloadFromReport(updatedRecord));
      setFeedback("Attachment deleted successfully.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Attachment deletion failed.",
      );
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!token) {
      setFeedback("You must be logged in as a reporter before continuing.");

      return;
    }

    if (
      form.title.trim() === "" ||
      form.description.trim() === "" ||
      form.reported_parties.some(
        (party) => party.full_name.trim() === "" || party.position.trim() === "",
      )
    ) {
      setFeedback("Complete the report summary and all reported-party fields.");

      return;
    }

    const attachmentError = validateAttachmentSelection(selectedFiles);
    setAttachmentFeedback(attachmentError);

    if (attachmentError) {
      return;
    }

    startTransition(async () => {
      try {
        if (isEditMode && reportId) {
          await api.updateReporterReport(token, reportId, form, selectedFiles);
          router.push("/submit?notice=updated");
          router.refresh();

          return;
        }

        const data = await api.submitReport(token, form, selectedFiles);
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

  if (!isAuthenticated || !token || !isReporterUser || !user) {
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
        </aside>

        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Reporter Access Required</p>
          <h2 className="mt-4 text-4xl">Register before starting a secure filing session</h2>
          <p className="muted mt-5 max-w-3xl text-base leading-8">
            The filing flow is reserved for authenticated reporters. Once signed in, the report is routed to the verification supervisor and tracked through the formal KPK workflow.
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

        {record ? (
          <div className="panel rounded-[1rem] p-6">
            <p className="eyebrow">Current Record</p>
            <div className="mt-4 space-y-3 text-sm leading-7">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Public Reference
                </p>
                <p className="font-mono">{record.public_reference}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Case Status
                </p>
                <p>{getStageLabel(record.case.stage, record.case.stage_label ?? record.status)}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Submission Date
                </p>
                <p>{formatDateTime(record.submitted_at)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="space-y-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="panel rounded-[1rem] p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Step 01</p>
                <h2 className="mt-3 text-4xl">Report Summary</h2>
              </div>
              <p className="max-w-sm text-right font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                {isEditMode
                  ? "Update the report while keeping the same case reference"
                  : "Capture the whistleblowing allegation in a concise and factual way"}
              </p>
            </div>

            <div className="space-y-6">
              <label className="block">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Report Title
                </span>
                <input
                  className="field"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Enter a concise report title"
                  required
                  disabled={editLocked}
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[0.64rem] uppercase tracking-[0.22em]">
                  Report Description
                </span>
                <textarea
                  className="field min-h-48"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe the allegation, timeline, and supporting context."
                  required
                  disabled={editLocked}
                />
              </label>

              <label className="flex items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-4 text-sm leading-7">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.confidentiality_level === "anonymous"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confidentiality_level: event.target.checked ? "anonymous" : "identified",
                    }))
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
            </div>
          </section>

          <section className="panel rounded-[1rem] p-8">
            <p className="eyebrow">Step 02</p>
            <div className="mt-3">
              <ReportedPartiesEditor
                parties={form.reported_parties}
                options={reportedPartyClassificationOptions}
                disabled={editLocked}
                onChange={(reported_parties) =>
                  setForm((current) => ({ ...current, reported_parties }))
                }
              />
            </div>
          </section>

          <ReportAttachmentField
            selectedFiles={selectedFiles}
            existingAttachments={record?.attachments ?? []}
            canMutate={!editLocked}
            isBusy={isPending}
            validationMessage={attachmentFeedback}
            kicker="Step 03"
            title="Report Attachments"
            onSelectedFilesChange={(files) => {
              setSelectedFiles(files);
              setAttachmentFeedback(validateAttachmentSelection(files));
            }}
            onDownloadAttachment={record ? handleDownloadAttachment : undefined}
            onDeleteAttachment={record ? handleDeleteAttachment : undefined}
          />

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
                ? "Changes are recorded under the same report and case reference and remain tied to the authenticated reporter account."
                : "The report enters the KPK workflow through the verification supervisor after submission."}
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
                    : "Submit Report"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
