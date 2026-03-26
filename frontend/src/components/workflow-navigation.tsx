"use client";

import Link from "next/link";
import { workflowHasApprovalMenu } from "@/lib/workflow";
import type { WorkflowDirectoryView } from "@/lib/types";

export function WorkflowNavigation({
  activeView,
  role,
}: {
  activeView: WorkflowDirectoryView;
  role?: string | null;
}) {
  const showApprovalMenu = workflowHasApprovalMenu(role);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/workflow"
        className={`rounded-[0.8rem] border px-4 py-3 text-sm font-semibold transition ${
          activeView === "queue"
            ? "border-[var(--primary)] bg-[rgba(239,47,39,0.08)] text-[var(--foreground)]"
            : "border-[var(--panel-border)] bg-white/78 text-[var(--muted)] hover:border-[rgba(239,47,39,0.24)] hover:text-[var(--foreground)]"
        }`}
      >
        Workflow Queue
      </Link>

      {showApprovalMenu ? (
        <Link
          href="/workflow/approvals"
          className={`rounded-[0.8rem] border px-4 py-3 text-sm font-semibold transition ${
            activeView === "approval"
              ? "border-[var(--secondary)] bg-[rgba(197,160,34,0.12)] text-[var(--foreground)]"
              : "border-[var(--panel-border)] bg-white/78 text-[var(--muted)] hover:border-[rgba(197,160,34,0.28)] hover:text-[var(--foreground)]"
          }`}
        >
          Approval Queue
        </Link>
      ) : null}
    </div>
  );
}
