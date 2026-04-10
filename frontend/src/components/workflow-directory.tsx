"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowNavigation } from "@/components/workflow-navigation";
import { api } from "@/lib/api";
import { demoWorkflowCases } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import { getRoleLabel, getStageLabel } from "@/lib/labels";
import { isInternalRole } from "@/lib/roles";
import {
  workflowActionPath,
  workflowActionShortLabel,
  workflowAllowedStagesForView,
  workflowHasApprovalMenu,
  workflowMatchesSearch,
  workflowNoticeText,
  workflowStageOptions,
} from "@/lib/workflow";
import type { PaginatedData, WorkflowCase, WorkflowDirectoryView } from "@/lib/types";

const PAGE_SIZE = 10;

type NoticeState =
  | {
      tone: "success" | "error";
      text: string;
    }
  | null;

const emptyDirectory: PaginatedData<WorkflowCase> = {
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

function fallbackDirectory(
  role: string | null | undefined,
  view: WorkflowDirectoryView,
  page: number,
  stage: string,
  search: string,
): PaginatedData<WorkflowCase> {
  const allowedStages = workflowAllowedStagesForView(role, view);
  const filteredItems = demoWorkflowCases.filter((caseItem) => {
    const stageAllowed = allowedStages.includes(caseItem.stage);
    const stageMatches = stage === "all" ? true : caseItem.stage === stage;
    const searchMatches = workflowMatchesSearch(caseItem, search);

    return stageAllowed && stageMatches && searchMatches;
  });
  const start = (page - 1) * PAGE_SIZE;
  const items = filteredItems.slice(start, start + PAGE_SIZE);
  const lastPage = Math.max(Math.ceil(filteredItems.length / PAGE_SIZE), 1);

  return {
    items,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: PAGE_SIZE,
      total: filteredItems.length,
      from: items.length > 0 ? start + 1 : null,
      to: items.length > 0 ? start + items.length : null,
    },
  };
}

export function WorkflowDirectory({
  view,
  initialNotice,
}: {
  view: WorkflowDirectoryView;
  initialNotice?: string | null;
}) {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [directory, setDirectory] = useState<PaginatedData<WorkflowCase>>(emptyDirectory);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const stageOptions = workflowStageOptions(user?.role, view);
  const [stageFilter, setStageFilter] = useState(stageOptions[0]?.value ?? "all");
  const [notice, setNotice] = useState<NoticeState>(() => {
    const text = workflowNoticeText(initialNotice ?? null);

    return text
      ? {
          tone: "success",
          text,
        }
      : null;
  });
  const [usingFallback, setUsingFallback] = useState(false);

  const isSessionLoading = !isReady;
  const isInternalUser = isInternalRole(user?.role);
  const canViewApprovals = workflowHasApprovalMenu(user?.role);
  const activeStageFilter = stageOptions.some((option) => option.value === stageFilter)
    ? stageFilter
    : (stageOptions[0]?.value ?? "all");

  useEffect(() => {
    if (!token || !isInternalUser) {
      return;
    }

    if (view === "approval" && !canViewApprovals) {
      return;
    }

    let active = true;

    const loadCases = async () => {
      try {
        const data = await api.listWorkflowCases(token, {
          page,
          per_page: PAGE_SIZE,
          search: deferredSearchTerm.trim() || undefined,
          stage: activeStageFilter !== "all" ? activeStageFilter : undefined,
          view,
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

        const fallback = fallbackDirectory(
          user?.role,
          view,
          page,
          activeStageFilter,
          deferredSearchTerm,
        );

        setDirectory(fallback);
        setUsingFallback(true);
        setNotice({
          tone: "error",
          text:
            error instanceof Error
              ? `${error.message} Showing seeded workflow cases instead.`
              : "Backend unavailable. Showing seeded workflow cases instead.",
        });
      }
    };

    loadCases();

    return () => {
      active = false;
    };
  }, [
    token,
    isInternalUser,
    user?.role,
    view,
    page,
    deferredSearchTerm,
    activeStageFilter,
    canViewApprovals,
  ]);

  if (isReady && (!isAuthenticated || !token || !isInternalUser || !user)) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Workflow</p>
          <h2 className="mt-4 text-3xl">Internal role access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            The workflow queue is available only to internal KPK roles that participate in the verification, investigation, and approval swimlanes.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Role Boundary
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Reporter accounts do not access the internal workflow queue.</li>
            <li>Execution and approval steps are separated into dedicated pages.</li>
            <li>Approval views are exposed only to the approving roles in the swimlane.</li>
          </ul>
        </aside>
      </div>
    );
  }

  if (isReady && view === "approval" && !canViewApprovals) {
    return (
      <div className="space-y-6">
        <WorkflowNavigation activeView="queue" role={user?.role} />
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Approval Queue</p>
          <h2 className="mt-4 text-3xl">Approval access is not assigned to this role</h2>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            Approval actions are reserved for verification supervisors, investigation supervisors, directors, and system administrator oversight accounts.
          </p>
        </div>
      </div>
    );
  }

  const heading =
    view === "approval"
      ? "Approval queue"
      : "Operational workflow queue";
  const description =
    view === "approval"
      ? "Review cases awaiting supervisor or director approval before they can progress or close."
      : "Search the active work queue, then open a dedicated case page to delegate, verify, or analyse.";

  return (
    <div className="space-y-6">
      <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
              Workflow Navigation
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
              {description}
            </p>
          </div>
          <WorkflowNavigation activeView={view} role={user?.role} />
        </div>

        {usingFallback ? (
          <p className="mt-5 rounded-[0.75rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary)]">
            Backend unavailable. Showing seeded workflow cases for interface review.
          </p>
        ) : isSessionLoading ? (
          <p className="mt-5 rounded-[0.75rem] border border-[var(--panel-border)] bg-white/12 px-4 py-3 text-sm text-white/72">
            Loading workflow session.
          </p>
        ) : null}
      </aside>

      <div className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{view === "approval" ? "Approval Menu" : "Workflow Menu"}</p>
            <h2 className="mt-4 text-3xl">{heading}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
              Visible cases
            </p>
            <p className="mt-2 text-3xl font-semibold">{directory.meta.total}</p>
          </div>
        </div>

        {notice ? (
          <p className={`mt-5 rounded-[0.65rem] px-4 py-3 text-sm ${noticeClasses(notice.tone)}`}>
            {notice.text}
          </p>
        ) : isSessionLoading ? (
          <p className="mt-5 rounded-[0.65rem] border border-[var(--panel-border)] bg-white/72 px-4 py-3 text-sm text-[var(--muted)]">
            Loading workflow session.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Search</span>
            <input
              className="field"
              value={searchTerm}
              disabled={isSessionLoading}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search case number, title, reference, or assignee"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Stage</span>
            <select
              className="field"
              value={activeStageFilter}
              disabled={isSessionLoading}
              onChange={(event) => {
                setStageFilter(event.target.value);
                setPage(1);
              }}
            >
              {stageOptions.map((option) => (
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
                  Case
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Report
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Stage
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Assignment
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Last Activity
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isSessionLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border-b border-[rgba(19,19,19,0.06)] px-4 py-8 text-sm text-[var(--muted)]"
                  >
                    Loading workflow session.
                  </td>
                </tr>
              ) : directory.items.length > 0 ? (
                directory.items.map((caseItem) => (
                  <tr key={caseItem.id} className="align-top">
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <p className="font-mono text-sm">{caseItem.case_number}</p>
                      <p className="muted mt-2 text-xs uppercase tracking-[0.16em]">
                        {caseItem.public_reference}
                      </p>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <p className="font-semibold">{caseItem.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge value={caseItem.status} />
                        <StatusBadge value={caseItem.severity} />
                      </div>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      <p className="text-sm font-semibold">
                        {getStageLabel(caseItem.stage, caseItem.stage_label)}
                      </p>
                      <p className="muted mt-2 text-sm">
                        {getRoleLabel(caseItem.current_role, caseItem.current_role_label)}
                      </p>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4 text-sm text-[var(--muted)]">
                      <p>{caseItem.assigned_to ?? "Pending assignment"}</p>
                      <p className="mt-2">{caseItem.assigned_unit ?? "Not assigned"}</p>
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4 text-sm text-[var(--muted)]">
                      {caseItem.last_activity_at
                        ? formatDateTime(caseItem.last_activity_at)
                        : "No activity recorded"}
                    </td>
                    <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                      {caseItem.available_actions.length > 0 ? (
                        <Link
                          href={workflowActionPath(
                            caseItem.id,
                            caseItem.available_actions[0],
                          )}
                          className="ghost-button px-3 py-2 text-[0.65rem]"
                        >
                          {workflowActionShortLabel(caseItem.available_actions[0])}
                        </Link>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">No action</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-sm leading-7 text-[var(--muted)]"
                  >
                    No workflow cases match the current search or stage filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>
            Showing {directory.meta.from ?? 0}-{directory.meta.to ?? 0} of {directory.meta.total} cases
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="ghost-button px-3 py-2 text-[0.65rem] disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={directory.meta.current_page <= 1}
            >
              Previous
            </button>
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em]">
              Page {directory.meta.current_page} / {directory.meta.last_page}
            </span>
            <button
              type="button"
              className="ghost-button px-3 py-2 text-[0.65rem] disabled:opacity-50"
              onClick={() =>
                setPage((current) =>
                  Math.min(current + 1, directory.meta.last_page),
                )
              }
              disabled={directory.meta.current_page >= directory.meta.last_page}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
