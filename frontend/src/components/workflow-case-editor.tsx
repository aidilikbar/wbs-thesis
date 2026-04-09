"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { CaseMessageBoard } from "@/components/case-message-board";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowAttachmentPanel } from "@/components/workflow-attachment-panel";
import { WorkflowNavigation } from "@/components/workflow-navigation";
import { api } from "@/lib/api";
import { demoWorkflowCases } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import { getRoleLabel, getStageLabel, normalizeWorkflowCopy } from "@/lib/labels";
import { isInternalRole } from "@/lib/roles";
import {
  isApprovalAction,
  workflowActionLabels,
  workflowActionPath,
  workflowHasApprovalMenu,
  workflowIdentityLabel,
} from "@/lib/workflow";
import type {
  WorkflowAssignee,
  WorkflowCase,
  WorkflowDirectoryView,
} from "@/lib/types";

type ActionState = {
  assignee_user_id: string;
  assigned_unit: string;
  due_in_days: string;
  decision: "approved" | "rejected";
  internal_note: string;
  publish_update: boolean;
  public_message: string;
};

const actionMeta: Record<
  string,
  {
    title: string;
    description: string;
    button: string;
    mode: WorkflowDirectoryView;
  }
> = {
  delegate_verification: {
    title: "Assign verification officer",
    description:
      "Assign the submitted report to a verification officer so the verification step can begin.",
    button: "Assign Case",
    mode: "queue",
  },
  submit_verification: {
    title: "Submit verification to supervisor",
    description:
      "Finalize the verification assessment and route it back to the verification supervisor for approval.",
    button: "Submit Verification Findings",
    mode: "queue",
  },
  review_verification: {
    title: "Approve verification result",
    description:
      "Approve the verification result to move the case into investigation allocation, or reject it for follow-up.",
    button: "Record Verification Decision",
    mode: "approval",
  },
  delegate_investigation: {
    title: "Delegate to investigator",
    description:
      "Assign the verified case to an investigator so analysis can start in the investigation swimlane.",
    button: "Delegate Investigation",
    mode: "queue",
  },
  submit_investigation: {
    title: "Submit investigation to supervisor",
    description:
      "Finalize the investigator analysis and route the case back to the investigation supervisor for approval.",
    button: "Submit Investigation Findings",
    mode: "queue",
  },
  review_investigation: {
    title: "Approve investigation result",
    description:
      "Approve the investigation result to escalate to the Director, or reject it for additional analysis.",
    button: "Record Investigation Decision",
    mode: "approval",
  },
  director_review: {
    title: "Director final approval",
    description:
      "Record the final director decision to complete the whistleblowing case or send it back for more work.",
    button: "Record Director Decision",
    mode: "approval",
  },
};

function buildActionState(record: WorkflowCase | null): ActionState {
  const currentAction = record?.available_actions[0];

  return {
    assignee_user_id: "",
    assigned_unit: record?.assigned_unit ?? "",
    due_in_days: currentAction === "delegate_investigation" ? "10" : "7",
    decision: "approved",
    internal_note: "",
    publish_update: false,
    public_message: "",
  };
}

export function WorkflowCaseEditor({
  caseId,
  view,
}: {
  caseId: number;
  view: WorkflowDirectoryView;
}) {
  const router = useRouter();
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [record, setRecord] = useState<WorkflowCase | null>(null);
  const [assignees, setAssignees] = useState<WorkflowAssignee[]>([]);
  const [actionState, setActionState] = useState<ActionState>(() =>
    buildActionState(null),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isInternalUser = isInternalRole(user?.role);
  const supportsSecureMessaging =
    user?.role === "verificator" || user?.role === "investigator";
  const canViewApprovals = workflowHasApprovalMenu(user?.role);
  const backPath = view === "approval" ? "/workflow/approvals" : "/workflow";

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token || !isInternalUser || Number.isNaN(caseId)) {
      setIsLoading(false);

      return;
    }

    let active = true;

    const loadCase = async () => {
      try {
        const data = await api.fetchWorkflowCase(token, caseId);

        if (!active) {
          return;
        }

        setRecord(data);
        setActionState(buildActionState(data));
        setMessage(null);
        setUsingFallback(false);
      } catch (error) {
        if (!active) {
          return;
        }

        const fallback = demoWorkflowCases.find((item) => item.id === caseId) ?? null;

        setRecord(fallback);
        setActionState(buildActionState(fallback));
        setUsingFallback(true);
        setMessage(
          error instanceof Error
            ? `${error.message} Showing seeded workflow detail instead.`
            : "Workflow case detail could not be loaded.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadCase();

    return () => {
      active = false;
    };
  }, [isReady, token, isInternalUser, caseId]);

  useEffect(() => {
    const currentAction = record?.available_actions[0];

    if (!record || !currentAction || !token || usingFallback) {
      return;
    }

    if (!["delegate_verification", "delegate_investigation"].includes(currentAction)) {
      setAssignees([]);

      return;
    }

    let active = true;

    const loadAssignees = async () => {
      try {
        const role =
          currentAction === "delegate_verification" ? "verificator" : "investigator";
        const data = await api.fetchAssignees(token, role);

        if (active) {
          setAssignees(data);
        }
      } catch {
        if (active) {
          setAssignees([]);
        }
      }
    };

    loadAssignees();

    return () => {
      active = false;
    };
  }, [record, token, usingFallback]);

  const currentAction = record?.available_actions[0] ?? null;
  const meta = currentAction ? actionMeta[currentAction] : null;
  const currentActionMode = currentAction && isApprovalAction(currentAction) ? "approval" : "queue";

  const updateActionState = <K extends keyof ActionState>(
    field: K,
    value: ActionState[K],
  ) => {
    setActionState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !record || !currentAction || !meta) {
      return;
    }

    if (usingFallback) {
      setMessage("Workflow actions are unavailable while the backend is offline.");

      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        if (currentAction === "delegate_verification") {
          await api.delegateVerification(token, record.id, {
            assignee_user_id: Number(actionState.assignee_user_id),
            assigned_unit: actionState.assigned_unit || undefined,
            due_in_days: Number(actionState.due_in_days),
          });
        }

        if (currentAction === "submit_verification") {
          await api.submitVerification(token, record.id, {
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "review_verification") {
          await api.reviewVerification(token, record.id, {
            decision: actionState.decision,
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "delegate_investigation") {
          await api.delegateInvestigation(token, record.id, {
            assignee_user_id: Number(actionState.assignee_user_id),
            assigned_unit: actionState.assigned_unit || undefined,
            due_in_days: Number(actionState.due_in_days),
          });
        }

        if (currentAction === "submit_investigation") {
          await api.submitInvestigation(token, record.id, {
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "review_investigation") {
          await api.reviewInvestigation(token, record.id, {
            decision: actionState.decision,
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "director_review") {
          await api.directorReview(token, record.id, {
            decision: actionState.decision,
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        router.push(`${backPath}?notice=updated`);
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The workflow action could not be completed.",
        );
      }
    });
  };

  if (!isReady || isLoading) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading workflow case.</p>
      </div>
    );
  }

  if (!isAuthenticated || !token || !isInternalUser || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Workflow</p>
          <h2 className="mt-4 text-3xl">Login before opening workflow cases</h2>
          <p className="muted mt-4 text-sm leading-7">
            Dedicated workflow case pages are available only to internal KPK roles.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Process Boundary
          </p>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Queue work and approval work are now separated into dedicated pages that align to the swimlane hand-offs.
          </p>
        </aside>
      </div>
    );
  }

  if (view === "approval" && !canViewApprovals) {
    return (
      <div className="space-y-6">
        <WorkflowNavigation activeView="queue" role={user.role} />
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Approval Queue</p>
          <h2 className="mt-4 text-3xl">This role does not perform approval decisions</h2>
          <p className="muted mt-4 text-sm leading-7">
            Approval pages are reserved for the approving swimlane roles only.
          </p>
          <div className="mt-6">
            <Link href="/workflow" className="ghost-button">
              Back to Workflow Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <WorkflowNavigation activeView={view} role={user.role} />
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Workflow Case Unavailable</p>
          <h2 className="mt-4 text-3xl">The selected case could not be opened</h2>
          <p className="muted mt-4 text-sm leading-7">
            {message ?? "The selected workflow case is not available for this account."}
          </p>
          <div className="mt-6">
            <Link href={backPath} className="ghost-button">
              Back to Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentAction && currentActionMode !== view) {
    return (
      <div className="space-y-6">
        <WorkflowNavigation activeView={view} role={user.role} />
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Route Adjustment</p>
          <h2 className="mt-4 text-3xl">This case belongs to the other workflow menu</h2>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            The currently available action for this case is <strong>{workflowActionLabels[currentAction]}</strong>, which belongs to the {currentActionMode === "approval" ? "Approval Queue" : "Workflow Queue"}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={workflowActionPath(record.id, currentAction)} className="primary-button">
              Open Correct Page
            </Link>
            <Link href={backPath} className="ghost-button">
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeline = [...(record.timeline ?? [])].reverse();

  return (
    <div className="space-y-6">
      <WorkflowNavigation activeView={view} role={user.role} />

      <section className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">
              {view === "approval" ? "Approval Case" : "Workflow Case"}
            </p>
            <h2 className="mt-4 text-[clamp(2.3rem,5vw,4rem)]">{record.title}</h2>
            <p className="muted mt-4 max-w-4xl text-sm leading-8">
              {meta?.description ??
                "Review the selected case, inspect its protected evidence, and complete the role-specific swimlane step from this dedicated page."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={record.status} />
            <StatusBadge value={record.severity} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="outline-panel rounded-[0.9rem] px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
              Case Number
            </p>
            <p className="mt-3 font-mono text-sm">{record.case_number}</p>
          </article>
          <article className="outline-panel rounded-[0.9rem] px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
              Reference
            </p>
            <p className="mt-3 font-mono text-sm">{record.public_reference}</p>
          </article>
          <article className="outline-panel rounded-[0.9rem] px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
              Stage
            </p>
            <p className="mt-3 text-sm">{getStageLabel(record.stage, record.stage_label)}</p>
          </article>
          <article className="outline-panel rounded-[0.9rem] px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
              Identity Mode
            </p>
            <p className="mt-3 text-sm">{workflowIdentityLabel(record.confidentiality_level)}</p>
          </article>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="panel rounded-[1rem] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Case Record</p>
              <h3 className="mt-4 text-3xl">Protected allegation detail</h3>
            </div>
            <Link href={backPath} className="ghost-button">
              Back to Queue
            </Link>
          </div>

          <dl className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Category
              </dt>
              <dd className="mt-2 text-sm">{record.category_label ?? record.category}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Incident Date
              </dt>
              <dd className="mt-2 text-sm">
                {record.incident_date ? formatDateTime(record.incident_date) : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Incident Location
              </dt>
              <dd className="mt-2 text-sm">{record.incident_location ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Accused Party
              </dt>
              <dd className="mt-2 text-sm">{record.accused_party ?? "Not recorded"}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-5">
            <div>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Allegation Description
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                {record.description ?? "No allegation description recorded."}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Evidence Summary
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                {record.evidence_summary ?? "No evidence summary recorded."}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Governance Tags
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {record.governance_tags.length > 0 ? (
                  record.governance_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--panel-border)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]"
                    >
                      {tag.replaceAll("_", " ")}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted)]">No governance tags.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="dark-card rounded-[1rem] border border-white/8 p-6">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
              Reporter Protection
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/76">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                  Reporter Identity
                </p>
                <p className="mt-1 text-white">
                  {record.reporter.is_protected
                    ? "Protected by anonymous mode"
                    : record.reporter.name ?? "Protected"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                  Email
                </p>
                <p className="mt-1 text-white">
                  {record.reporter.email ?? "Not visible to case handlers"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                  Phone
                </p>
                <p className="mt-1 text-white">
                  {record.reporter.phone ?? "Not visible to case handlers"}
                </p>
              </div>
            </div>
          </div>

          <div className="panel rounded-[1rem] p-6">
            <p className="eyebrow">Workflow Ownership</p>
            <div className="mt-5 space-y-4 text-sm leading-7">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--panel-border)] pb-3">
                <span>Verification Supervisor</span>
                <span className="text-right text-[var(--muted)]">
                  {record.workflow.verification_supervisor ?? "Unassigned"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--panel-border)] pb-3">
                <span>Verification Officer</span>
                <span className="text-right text-[var(--muted)]">
                  {record.workflow.verificator ?? "Unassigned"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--panel-border)] pb-3">
                <span>Investigation Supervisor</span>
                <span className="text-right text-[var(--muted)]">
                  {record.workflow.investigation_supervisor ?? "Unassigned"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--panel-border)] pb-3">
                <span>Investigator</span>
                <span className="text-right text-[var(--muted)]">
                  {record.workflow.investigator ?? "Unassigned"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Director</span>
                <span className="text-right text-[var(--muted)]">
                  {record.workflow.director ?? "Unassigned"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="panel rounded-[1rem] p-8">
          <p className="eyebrow">
            {view === "approval" ? "Approval Action" : "Execution Action"}
          </p>
          <h3 className="mt-4 text-3xl">
            {meta?.title ?? "No action currently assigned"}
          </h3>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            {meta?.description ??
              "This case does not currently expose an actionable step for the authenticated role."}
          </p>

          {message ? (
            <p className="mt-5 rounded-[0.7rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
              {message}
            </p>
          ) : null}

          {currentAction && meta ? (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {["delegate_verification", "delegate_investigation"].includes(currentAction) ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Assignee</span>
                    <select
                      className="field"
                      value={actionState.assignee_user_id}
                      onChange={(event) =>
                        updateActionState("assignee_user_id", event.target.value)
                      }
                      required
                    >
                      <option value="">Select assignee</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name} · {assignee.unit ?? getRoleLabel(assignee.role, assignee.role_label)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Assigned Unit</span>
                      <input
                        className="field"
                        value={actionState.assigned_unit}
                        onChange={(event) =>
                          updateActionState("assigned_unit", event.target.value)
                        }
                        placeholder="Verification Desk"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Due in Days</span>
                      <input
                        className="field"
                        type="number"
                        min={1}
                        max={90}
                        value={actionState.due_in_days}
                        onChange={(event) =>
                          updateActionState("due_in_days", event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>
                </>
              ) : null}

              {["submit_verification", "submit_investigation"].includes(currentAction) ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Internal Note</span>
                  <textarea
                    className="field min-h-40"
                    value={actionState.internal_note}
                    onChange={(event) =>
                      updateActionState("internal_note", event.target.value)
                    }
                    placeholder="Document the verification or investigation result."
                    required
                  />
                </label>
              ) : null}

              {["review_verification", "review_investigation", "director_review"].includes(
                currentAction,
              ) ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Decision</span>
                    <select
                      className="field"
                      value={actionState.decision}
                      onChange={(event) =>
                        updateActionState(
                          "decision",
                          event.target.value as ActionState["decision"],
                        )
                      }
                    >
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Internal Note</span>
                    <textarea
                      className="field min-h-40"
                      value={actionState.internal_note}
                      onChange={(event) =>
                        updateActionState("internal_note", event.target.value)
                      }
                      placeholder="Record the approval rationale or rejection instruction."
                      required
                    />
                  </label>
                </>
              ) : null}

              {currentAction ? (
                <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 p-5">
                  <label className="flex items-start gap-3 text-sm leading-7 text-[var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={actionState.publish_update}
                      onChange={(event) =>
                        updateActionState("publish_update", event.target.checked)
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      Publish a public-safe update so the reporter can see progress in `/track` and on the authenticated report detail page.
                    </span>
                  </label>

                  {actionState.publish_update ? (
                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-semibold">Public Message</span>
                      <textarea
                        className="field min-h-28"
                        value={actionState.public_message}
                        onChange={(event) =>
                          updateActionState("public_message", event.target.value)
                        }
                        placeholder="Write a public-safe status update."
                        required
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="primary-button disabled:opacity-60"
                  disabled={isPending || !currentAction}
                >
                  {isPending ? "Saving..." : meta.button}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => router.push(backPath)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm leading-7 text-[var(--muted)]">
              No workflow action is currently available for this case in the selected menu.
            </div>
          )}
        </section>

        <WorkflowAttachmentPanel
          token={token}
          caseId={record.id}
          attachments={record.attachments}
        />
      </div>

      {supportsSecureMessaging ? (
        <CaseMessageBoard
          token={token}
          scope={{ kind: "workflow", caseId: record.id }}
        />
      ) : null}

      <section className="panel rounded-[1rem] p-8">
        <p className="eyebrow">Case Timeline</p>
        <h3 className="mt-4 text-3xl">Workflow history</h3>
        <div className="mt-6 space-y-4">
          {timeline.length > 0 ? (
            timeline.map((entry, index) => (
              <article
                key={`${entry.stage}-${entry.occurred_at}-${index}`}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/78 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={entry.stage} />
                      <span className="rounded-full border border-[var(--panel-border)] px-3 py-1 text-[0.62rem] font-mono uppercase tracking-[0.18em] text-[var(--muted)]">
                        {entry.visibility ?? "internal"}
                      </span>
                    </div>
                    <h4 className="mt-3 text-lg font-semibold">
                      {normalizeWorkflowCopy(entry.headline)}
                    </h4>
                    <p className="muted mt-2 text-sm leading-7">
                      {normalizeWorkflowCopy(entry.detail)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[var(--muted)]">
                    <p>{getRoleLabel(entry.actor_role)}</p>
                    <p className="mt-2">
                      {entry.occurred_at
                        ? formatDateTime(entry.occurred_at)
                        : "No timestamp"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm text-[var(--muted)]">
              No workflow history is recorded for this case yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
