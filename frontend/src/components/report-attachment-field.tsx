"use client";

import { formatDateTime } from "@/lib/format";
import { formatFileSize } from "@/lib/file-utils";
import { attachmentAccept } from "@/lib/attachment-validation";
import type { ReportAttachment } from "@/lib/types";

export function ReportAttachmentField({
  selectedFiles,
  existingAttachments = [],
  canMutate,
  isBusy,
  validationMessage,
  onSelectedFilesChange,
  onDownloadAttachment,
  onDeleteAttachment,
}: {
  selectedFiles: File[];
  existingAttachments?: ReportAttachment[];
  canMutate: boolean;
  isBusy: boolean;
  validationMessage?: string | null;
  onSelectedFilesChange: (files: File[]) => void;
  onDownloadAttachment?: (attachment: ReportAttachment) => void;
  onDeleteAttachment?: (attachmentId: number) => void;
}) {
  return (
    <section className="panel rounded-[1rem] p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Step 03</p>
          <h2 className="mt-3 text-4xl">Supporting Evidence Files</h2>
        </div>
        <p className="max-w-sm text-right font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
          PDF, images, office documents, CSV, TXT, and ZIP up to 20 MB each
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="rounded-[0.95rem] border border-dashed border-[rgba(239,47,39,0.2)] bg-[rgba(239,47,39,0.04)] p-5">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--primary)]">
            Submission Queue
          </p>
          <input
            type="file"
            multiple
            accept={attachmentAccept}
            className="mt-4 block w-full text-sm"
            disabled={!canMutate || isBusy}
            onChange={(event) =>
              onSelectedFilesChange(Array.from(event.target.files ?? []))
            }
          />
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Selected files will be validated and uploaded when you submit this form.
          </p>

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
              <p>No new files selected yet.</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSelectedFilesChange([])}
              disabled={selectedFiles.length === 0 || isBusy}
              className="ghost-button disabled:opacity-60"
            >
              Clear Selection
            </button>
          </div>

          {!canMutate ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Completed reports are locked and no longer accept attachment changes.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          {existingAttachments.length > 0 ? (
            existingAttachments.map((attachment) => (
              <article
                key={attachment.id}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg">{attachment.original_name}</h4>
                    <p className="muted mt-2 text-sm leading-7">
                      {attachment.mime_type ?? "Unknown type"} ·{" "}
                      {formatFileSize(attachment.size_bytes)}
                      {attachment.uploaded_at
                        ? ` · Uploaded ${formatDateTime(attachment.uploaded_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {onDownloadAttachment ? (
                      <button
                        type="button"
                        onClick={() => onDownloadAttachment(attachment)}
                        disabled={isBusy}
                        className="ghost-button disabled:opacity-60"
                      >
                        Download
                      </button>
                    ) : null}
                    {canMutate && onDeleteAttachment ? (
                      <button
                        type="button"
                        onClick={() => onDeleteAttachment(attachment.id)}
                        disabled={isBusy}
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
              No stored attachments are linked to this report yet.
            </div>
          )}
        </div>
      </div>

      {validationMessage ? (
        <p className="mt-6 rounded-[0.8rem] border border-amber-200 bg-amber-100 px-4 py-4 text-sm text-amber-900">
          {validationMessage}
        </p>
      ) : null}
    </section>
  );
}
