"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { demoReporterReports } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import { getDisplayLabel, getStageLabel } from "@/lib/labels";
import { isReporter } from "@/lib/roles";
import type { PaginatedData, ReporterReportSummary } from "@/lib/types";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "verification_in_progress", label: "Verification in Progress" },
  { value: "verification_review", label: "Verification Approval" },
  { value: "verified", label: "Awaiting Investigation Delegation" },
  { value: "investigation_in_progress", label: "Investigation in Progress" },
  { value: "investigation_review", label: "Investigation Approval" },
  { value: "director_review", label: "Director Review" },
  { value: "completed", label: "Completed" },
] as const;

type NoticeProps = {
  initialNotice?: string | null;
  initialReference?: string | null;
  initialTrackingToken?: string | null;
};

type NoticeState =
  | {
      tone: "success" | "error";
      text: string;
      detail?: string | null;
    }
  | null;

const emptyDirectory: PaginatedData<ReporterReportSummary> = {
  items: [],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
    from: null,
    to: null,
  },
};

function noticeClasses(tone: "success" | "error") {
  if (tone === "success") {
    return "border border-[rgba(19,19,19,0.08)] bg-white text-[var(--foreground)]";
  }

  return "border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]";
}

function buildInitialNotice({
  initialNotice,
  initialReference,
  initialTrackingToken,
}: NoticeProps): NoticeState {
  if (initialNotice === "created") {
    return {
      tone: "success",
      text: "Report submitted successfully.",
      detail:
        initialReference && initialTrackingToken
          ? `Reference: ${initialReference} · Tracking Token: ${initialTrackingToken}`
          : null,
    };
  }

  if (initialNotice === "updated") {
    return {
      tone: "success",
      text: "Report updated successfully.",
    };
  }

  return null;
}

export function ReportDirectory(props: NoticeProps) {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [directory, setDirectory] =
    useState<PaginatedData<ReporterReportSummary>>(emptyDirectory);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]["value"]>("all");
  const [notice, setNotice] = useState<NoticeState>(() => buildInitialNotice(props));
  const [usingFallback, setUsingFallback] = useState(false);

  const isReporterUser = isReporter(user?.role);

  useEffect(() => {
    if (!token || !isReporterUser) {
      return;
    }

    let active = true;

    const loadReports = async () => {
      try {
        const data = await api.listReporterReports(token, {
          page,
          per_page: PAGE_SIZE,
          search: deferredSearchTerm.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        });

        if (!active) {
          return;
        }

        if (data.items.length === 0 && page > 1) {
          setPage((current) => Math.max(current - 1, 1));

          return;
        }

        setDirectory(data);
        setUsingFallback(false);
      } catch (error) {
        if (!active) {
          return;
        }

        const fallbackItems = demoReporterReports.filter((item) => {
          const statusMatch =
            statusFilter === "all" ? true : item.status === statusFilter;
          const term = deferredSearchTerm.trim().toLowerCase();
          const searchMatch =
            term.length === 0
              ? true
              : [item.title, item.public_reference, item.category]
                  .join(" ")
                  .toLowerCase()
                  .includes(term);

          return statusMatch && searchMatch;
        });
        const from = fallbackItems.length > 0 ? 1 : null;
        const to = fallbackItems.length > 0 ? Math.min(fallbackItems.length, PAGE_SIZE) : null;

        setDirectory({
          items: fallbackItems.slice(0, PAGE_SIZE),
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: PAGE_SIZE,
            total: fallbackItems.length,
            from,
            to,
          },
        });
        setUsingFallback(true);
        setNotice({
          tone: "error",
          text:
            error instanceof Error
              ? `${error.message} Showing seeded reporter records instead.`
              : "Backend unavailable. Showing seeded reporter records instead.",
        });
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, [token, isReporterUser, page, deferredSearchTerm, statusFilter]);

  if (!isReady) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading reporter session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isReporterUser || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Reporter Access Required</p>
          <h2 className="mt-4 text-3xl">Login before managing reporter transactions</h2>
          <p className="muted mt-4 text-sm leading-7">
            Reporter transaction history and filing screens are available only to authenticated reporter accounts.
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
            Reporter Workspace Rule
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Reporters submit new cases from a dedicated create page.</li>
            <li>Existing transactions remain searchable and paginated from the index.</li>
            <li>Completed reports stay visible in the ledger even when editing is locked.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
              Reporter Transactions
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
              Review your report submissions in table form, search by reference or title, filter by status, and open dedicated create or edit pages without mixing those actions into the index.
            </p>
          </div>
          <Link href="/submit/create" className="primary-button">
            Create Report
          </Link>
        </div>
      </aside>

      <div className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Reporter Ledger</p>
            <h2 className="mt-4 text-3xl">Paginated report transaction directory</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
              Total reports
            </p>
            <p className="mt-2 text-3xl font-semibold">{directory.meta.total}</p>
          </div>
        </div>

        {notice ? (
          <div className={`mt-5 rounded-[0.65rem] px-4 py-3 text-sm ${noticeClasses(notice.tone)}`}>
            <p>{notice.text}</p>
            {notice.detail ? <p className="mt-2 font-mono text-xs">{notice.detail}</p> : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Search</span>
            <input
              className="field"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search title, reference, or category"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Status</span>
            <select
              className="field"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as (typeof statusOptions)[number]["value"]);
                setPage(1);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Reference
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Title
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Status
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Submitted
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {directory.items.length > 0 ? (
                directory.items.map((report) => (
                  <tr key={report.id} className="align-top">
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <p className="font-mono text-sm">{report.public_reference}</p>
                      <p className="muted mt-2 text-xs uppercase tracking-[0.16em]">
                        {report.case.case_number ?? "Case pending"}
                      </p>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <p className="font-semibold">{report.title}</p>
                      <p className="muted mt-2 text-sm">
                        {getDisplayLabel(report.category)} ·{" "}
                        {getStageLabel(report.case.stage, report.case.stage_label ?? "Submitted")}
                      </p>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={report.status} />
                        <StatusBadge value={report.severity} />
                      </div>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4 text-sm text-[var(--muted)]">
                      {formatDateTime(report.submitted_at)}
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/submit/${report.id}/edit`}
                          className={`ghost-button px-3 py-2 text-[0.65rem] ${
                            report.is_editable ? "cursor-pointer" : "pointer-events-none opacity-60"
                          }`}
                          aria-disabled={!report.is_editable}
                          title={report.edit_lock_reason ?? "Edit report"}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-sm leading-7 text-[var(--muted)]"
                  >
                    No reporter transactions match the current search or filter settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--panel-border)] pt-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[var(--muted)]">
              Showing {directory.meta.from ?? 0} to {directory.meta.to ?? 0} of{" "}
              {directory.meta.total} reports
            </p>
            {usingFallback ? (
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--secondary-strong)]">
                Seeded fallback data
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Page {directory.meta.current_page} of {directory.meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={directory.meta.current_page <= 1}
              className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, directory.meta.last_page))
              }
              disabled={directory.meta.current_page >= directory.meta.last_page}
              className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
