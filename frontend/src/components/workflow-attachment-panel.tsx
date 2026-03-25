"use client";

import { useState, useTransition } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formatFileSize, triggerBlobDownload } from "@/lib/file-utils";
import type { ReportAttachment } from "@/lib/types";

export function WorkflowAttachmentPanel({
  token,
  caseId,
  attachments,
}: {
  token: string;
  caseId: number;
  attachments: ReportAttachment[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownload = (attachment: ReportAttachment) => {
    setMessage(null);

    startTransition(async () => {
      try {
        const blob = await api.downloadWorkflowAttachment(
          token,
          caseId,
          attachment.id,
        );
        triggerBlobDownload(blob, attachment.original_name);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Attachment download failed.",
        );
      }
    });
  };

  return (
    <section className="panel rounded-[1rem] p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Case Attachments</p>
          <h3 className="mt-3 text-3xl">Evidence repository</h3>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            Reporter evidence is stored in private object storage and exposed only
            to authorized workflow roles assigned to this case.
          </p>
        </div>
        <div className="rounded-[0.75rem] border border-[var(--panel-border)] bg-white/72 px-4 py-3 text-sm text-[var(--muted)]">
          Private S3-compatible storage
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <article
              key={attachment.id}
              className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/78 p-5"
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
                <button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  disabled={isPending}
                  className="ghost-button disabled:opacity-60"
                >
                  {isPending ? "Working..." : "Download"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm text-[var(--muted)]">
            No reporter evidence has been uploaded for this case yet.
          </div>
        )}
      </div>

      {message ? (
        <p className="mt-6 rounded-[0.8rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-4 text-sm text-[var(--secondary-strong)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
