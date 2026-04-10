"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { attachmentAccept, validateAttachmentSelection } from "@/lib/attachment-validation";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formatFileSize, triggerBlobDownload } from "@/lib/file-utils";
import { getRoleLabel, getStageLabel } from "@/lib/labels";
import type { CaseMessageConversation, CaseMessageRecord } from "@/lib/types";

type ConversationScope =
  | { kind: "reporter"; reportId: number }
  | { kind: "workflow"; caseId: number };

export function CaseMessageBoard({
  token,
  scope,
}: {
  token: string;
  scope: ConversationScope;
}) {
  const reporterId = scope.kind === "reporter" ? scope.reportId : null;
  const caseId = scope.kind === "workflow" ? scope.caseId : null;
  const [conversation, setConversation] = useState<CaseMessageConversation | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const isMountedRef = useRef(true);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadConversation = useCallback(
    async (options?: { background?: boolean }) => {
      if (!options?.background && isMountedRef.current) {
        setIsLoading(true);
      }

      try {
        const data =
          scope.kind === "reporter" && reporterId !== null
            ? await api.fetchReporterConversation(token, reporterId)
            : await api.fetchWorkflowConversation(token, caseId as number);

        if (isMountedRef.current) {
          setConversation(data);
          setMessage(null);
        }

        return data;
      } finally {
        if (!options?.background && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [scope.kind, reporterId, caseId, token],
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const data = await loadConversation();

        if (!active) {
          return;
        }

        setConversation(data);
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Secure communication could not be loaded.",
          );
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [loadConversation]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadConversation({ background: true }).catch(() => null);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadConversation]);

  const handleSelectedFilesChange = (files: File[]) => {
    setSelectedFiles(files);
    setValidationMessage(validateAttachmentSelection(files));
  };

  const handleDownloadAttachment = (messageId: number, attachmentId: number, fileName: string) => {
    setMessage(null);

    startTransition(async () => {
      try {
        const blob =
          scope.kind === "reporter"
            ? await api.downloadReporterConversationAttachment(
                token,
                scope.reportId,
                messageId,
                attachmentId,
              )
            : await api.downloadWorkflowConversationAttachment(
                token,
                scope.caseId,
                messageId,
                attachmentId,
              );
        triggerBlobDownload(blob, fileName);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Attachment download failed.",
        );
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!conversation) {
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const trimmed = String(formData.get("body") ?? "").trim();
    const attachedFiles = formData
      .getAll("attachments")
      .filter(
        (item): item is File => item instanceof File && item.name.trim() !== "",
      );
    const filesError = validateAttachmentSelection(attachedFiles);

    setValidationMessage(filesError);

    if (filesError) {
      return;
    }

    if (trimmed === "" && attachedFiles.length === 0) {
      setMessage("Write a message or attach at least one file before sending.");

      return;
    }

    if (!conversation.can_send_message) {
      setMessage("Secure communication is not open for your role at the current stage.");

      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        const postedMessage =
          scope.kind === "reporter"
            ? await api.sendReporterConversationMessage(
                token,
                scope.reportId,
                trimmed,
                attachedFiles,
              )
            : await api.sendWorkflowConversationMessage(
                token,
                scope.caseId,
                trimmed,
                attachedFiles,
              );

        setConversation((current) =>
          current
            ? {
                ...current,
                messages: [...current.messages, postedMessage],
              }
            : current,
        );
        formElement.reset();
        if (attachmentInputRef.current) {
          attachmentInputRef.current.value = "";
        }
        setSelectedFiles([]);
        setValidationMessage(null);
        await loadConversation({ background: true }).catch(() => null);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Secure message could not be sent.",
        );
      }
    });
  };

  const headerLabel = conversation?.active_stage
    ? getStageLabel(conversation.active_stage, conversation.active_stage_label)
    : "Secure communication is currently inactive";

  const counterpartyRoleLabel = conversation?.counterparty_role
    ? getRoleLabel(conversation.counterparty_role, conversation.counterparty_role_label)
    : null;

  return (
    <section className="panel rounded-[1rem] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Secure Communication</p>
          <h3 className="mt-4 text-3xl">Reporter case discussion board</h3>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            Communication stays inside the case record. The interface shows roles only,
            never personal names, and supports text plus protected file exchange.
          </p>
        </div>
        <div className="rounded-[0.75rem] border border-[var(--panel-border)] bg-white/74 px-4 py-3 text-sm text-[var(--muted)]">
          {counterpartyRoleLabel
            ? `Active counterpart: ${counterpartyRoleLabel}`
            : "Counterpart opens automatically by stage"}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="dark-card rounded-[1rem] border border-white/8 p-6">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
              Communication Window
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/76">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                  Current Stage
                </p>
                <p className="mt-1 text-white">{headerLabel}</p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                  Allowed Roles
                </p>
                <p className="mt-1 text-white">
                  Reporter and {counterpartyRoleLabel ?? "assigned case handler"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                  Status
                </p>
                <p className="mt-1 text-white">
                  {conversation?.enabled
                    ? conversation.can_send_message
                      ? "Message sending is open for this user."
                      : "History remains visible, but sending is closed for this user."
                    : "Communication opens only while verification or investigation is actively handled."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm text-[var(--muted)]">
                Loading secure communication history.
              </div>
            ) : conversation && conversation.messages.length > 0 ? (
              conversation.messages.map((entry) => (
                <MessageCard
                  key={entry.id}
                  entry={entry}
                  onDownloadAttachment={handleDownloadAttachment}
                  isBusy={isPending}
                />
              ))
            ) : (
              <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm text-[var(--muted)]">
                No secure discussion has been recorded for this case yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1rem] border border-[var(--panel-border)] bg-white/76 p-6">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--primary)]">
            New Message
          </p>
          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
            <label className="block" htmlFor={`case-message-body-${scope.kind}-${reporterId ?? caseId}`}>
              <span className="mb-2 block text-sm font-semibold">Message</span>
              <textarea
                id={`case-message-body-${scope.kind}-${reporterId ?? caseId}`}
                name="body"
                aria-label="Message"
                className="field min-h-40"
                placeholder="Request clarification, answer questions, or provide a protected follow-up."
                disabled={!conversation?.can_send_message || isPending}
              />
            </label>

            <div className="rounded-[0.9rem] border border-dashed border-[rgba(239,47,39,0.2)] bg-[rgba(239,47,39,0.04)] p-5">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                File Attachments
              </p>
              <input
                ref={attachmentInputRef}
                type="file"
                name="attachments"
                multiple
                accept={attachmentAccept}
                className="mt-4 block w-full text-sm"
                disabled={!conversation?.can_send_message || isPending}
                onChange={(event) =>
                  handleSelectedFilesChange(Array.from(event.target.files ?? []))
                }
              />
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                PDF, images, office documents, CSV, TXT, and ZIP up to 20 MB each.
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
                  <p>No files selected for this message.</p>
                )}
              </div>
            </div>

            {validationMessage ? (
              <p className="rounded-[0.8rem] border border-amber-200 bg-amber-100 px-4 py-4 text-sm text-amber-900">
                {validationMessage}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-[0.8rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-4 text-sm text-[var(--secondary-strong)]">
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="primary-button disabled:opacity-60"
                disabled={!conversation?.can_send_message || isPending}
              >
                {isPending ? "Sending..." : "Send Secure Message"}
              </button>
              <button
                type="button"
                className="ghost-button disabled:opacity-60"
                disabled={selectedFiles.length === 0 || isPending}
                onClick={() => {
                  setSelectedFiles([]);
                  setValidationMessage(null);
                  if (attachmentInputRef.current) {
                    attachmentInputRef.current.value = "";
                  }
                }}
              >
                Clear Files
              </button>
              <button
                type="button"
                className="ghost-button disabled:opacity-60"
                disabled={isLoading || isPending}
                onClick={() => {
                  setMessage(null);
                  setValidationMessage(null);

                  startTransition(async () => {
                    try {
                      await loadConversation();
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Secure communication could not be refreshed.",
                      );
                    }
                  });
                }}
              >
                Refresh
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function MessageCard({
  entry,
  onDownloadAttachment,
  isBusy,
}: {
  entry: CaseMessageRecord;
  onDownloadAttachment: (messageId: number, attachmentId: number, fileName: string) => void;
  isBusy: boolean;
}) {
  return (
    <article className="rounded-[0.95rem] border border-[var(--panel-border)] bg-white/78 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.08)] px-3 py-1 text-[0.62rem] font-mono uppercase tracking-[0.18em] text-[var(--primary)]">
              {getRoleLabel(entry.sender_role, entry.sender_role_label)}
            </span>
            <span className="rounded-full border border-[var(--panel-border)] px-3 py-1 text-[0.62rem] font-mono uppercase tracking-[0.18em] text-[var(--muted)]">
              {getStageLabel(entry.stage, entry.stage_label)}
            </span>
          </div>
          {entry.body ? (
            <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{entry.body}</p>
          ) : (
            <p className="mt-4 text-sm italic leading-7 text-[var(--muted)]">
              Attachment-only secure message.
            </p>
          )}
        </div>
        <div className="text-right text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {entry.sent_at ? formatDateTime(entry.sent_at) : "No timestamp"}
        </div>
      </div>

      {entry.attachments.length > 0 ? (
        <div className="mt-5 space-y-3">
          {entry.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-[0.8rem] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.72)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {attachment.original_name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {attachment.mime_type ?? "Unknown type"} ·{" "}
                  {formatFileSize(attachment.size_bytes)}
                </p>
              </div>
              <button
                type="button"
                className="ghost-button disabled:opacity-60"
                disabled={isBusy}
                onClick={() =>
                  onDownloadAttachment(entry.id, attachment.id, attachment.original_name)
                }
              >
                Download
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
