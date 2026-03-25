"use client";

import { useState, useTransition } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formatFileSize, triggerBlobDownload } from "@/lib/file-utils";
import type { ReportAttachment } from "@/lib/types";

export function ReporterAttachmentManager({
  token,
  reportId,
  attachments,
  canMutate,
  onRefresh,
}: {
  token: string;
  reportId: number;
  attachments: ReportAttachment[];
  canMutate: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setMessage("Choose one or more files before uploading.");

      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        for (const file of selectedFiles) {
          await api.uploadReporterAttachment(token, reportId, file);
        }

        setSelectedFiles([]);
        await onRefresh();
        setMessage(
          `${selectedFiles.length} attachment${selectedFiles.length > 1 ? "s" : ""} uploaded successfully.`,
        );
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Attachment upload failed.",
        );
      }
    });
  };

  const handleDelete = (attachmentId: number) => {
    setMessage(null);

    startTransition(async () => {
      try {
        await api.deleteReporterAttachment(token, reportId, attachmentId);
        await onRefresh();
        setMessage("Attachment deleted successfully.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Attachment deletion failed.",
        );
      }
    });
  };

  const handleDownload = (attachment: ReportAttachment) => {
    setMessage(null);

    startTransition(async () => {
      try {
        const blob = await api.downloadReporterAttachment(token, reportId, attachment.id);
        triggerBlobDownload(blob, attachment.original_name);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Attachment download failed.",
        );
      }
    });
  };

  return (
    <section className="panel rounded-[1rem] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Attachments</p>
          <h3 className="mt-3 text-3xl">Evidence files</h3>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            Files are stored in private object storage and remain attached to this
            report record for reporter access and authorized internal review.
          </p>
        </div>
        <div className="rounded-[0.75rem] border border-[var(--panel-border)] bg-white/72 px-4 py-3 text-sm text-[var(--muted)]">
          PDF, images, office documents, CSV, TXT, ZIP up to 20 MB each
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[0.95rem] border border-dashed border-[rgba(239,47,39,0.2)] bg-[rgba(239,47,39,0.04)] p-5">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--primary)]">
            Upload Queue
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip"
            className="mt-4 block w-full text-sm"
            disabled={!canMutate || isPending}
            onChange={(event) =>
              setSelectedFiles(Array.from(event.target.files ?? []))
            }
          />
          <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="rounded-[0.7rem] border border-[var(--panel-border)] bg-white px-4 py-3"
                >
                  <p className="font-semibold text-[var(--foreground)]">{file.name}</p>
                  <p className="mt-1">{formatFileSize(file.size)}</p>
                </div>
              ))
            ) : (
              <p>No files selected yet.</p>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!canMutate || selectedFiles.length === 0 || isPending}
              className="primary-button disabled:opacity-60"
            >
              {isPending ? "Working..." : "Upload Files"}
            </button>
          </div>
          {!canMutate ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Completed reports are locked and no longer accept attachment changes.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          {attachments.length > 0 ? (
            attachments.map((attachment) => (
              <article
                key={attachment.id}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg">{attachment.original_name}</h4>
                    <p className="muted mt-2 text-sm leading-7">
                      {attachment.mime_type ?? "Unknown type"} · {formatFileSize(attachment.size_bytes)}
                      {attachment.uploaded_at
                        ? ` · Uploaded ${formatDateTime(attachment.uploaded_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(attachment)}
                      disabled={isPending}
                      className="ghost-button disabled:opacity-60"
                    >
                      Download
                    </button>
                    {canMutate ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(attachment.id)}
                        disabled={isPending}
                        className="dark-button disabled:opacity-60"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm text-[var(--muted)]">
              No attachments have been uploaded for this report yet.
            </div>
          )}
        </div>
      </div>

      {message ? (
        <p className="mt-6 rounded-[0.8rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-4 text-sm text-[var(--secondary-strong)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
