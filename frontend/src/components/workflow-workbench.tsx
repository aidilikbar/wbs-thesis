"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { demoWorkflowCases } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import { isInternalRole } from "@/lib/roles";
import type { WorkflowAssignee, WorkflowCase } from "@/lib/types";

const stageFilters = [
  { value: "all", label: "All stages" },
  { value: "submitted", label: "Submitted" },
  { value: "verification_in_progress", label: "Verification" },
  { value: "verification_review", label: "Verification Review" },
  { value: "verified", label: "Verified" },
  { value: "investigation_in_progress", label: "Investigation" },
  { value: "investigation_review", label: "Investigation Review" },
  { value: "director_review", label: "Director Review" },
  { value: "completed", label: "Completed" },
];

const actionLabels: Record<string, string> = {
  delegate_verification: "Delegate to verificator",
  submit_verification: "Submit verification",
  review_verification: "Review verification",
  delegate_investigation: "Delegate to investigator",
  submit_investigation: "Submit investigation",
  review_investigation: "Review investigation",
  director_review: "Director review",
};

function buildInitialActionState(selectedCase: WorkflowCase | null) {
  const nextAction = selectedCase?.available_actions[0];

  return {
    assignee_user_id: "",
    assigned_unit: selectedCase?.assigned_unit ?? "",
    due_in_days: nextAction === "delegate_investigation" ? "10" : "7",
    decision: "approved",
    internal_note: "",
    publish_update: false,
    public_message: "",
  };
}

export function WorkflowWorkbench() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [cases, setCases] = useState<WorkflowCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [stageFilter, setStageFilter] = useState("all");
  const [usingFallback, setUsingFallback] = useState(false);
  const [assignees, setAssignees] = useState<WorkflowAssignee[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState({
    assignee_user_id: "",
    assigned_unit: "",
    due_in_days: "7",
    decision: "approved",
    internal_note: "",
    publish_update: false,
    public_message: "",
  });
  const [isPending, startTransition] = useTransition();
  const selectedCaseIdRef = useRef<number | null>(null);

  const isInternalUser = isInternalRole(user?.role);

  useEffect(() => {
    selectedCaseIdRef.current = selectedCaseId;
  }, [selectedCaseId]);

  useEffect(() => {
    if (!token || !isInternalUser) {
      return;
    }

    let active = true;

    const loadCases = async () => {
      try {
        const data = await api.fetchWorkflowCases(
          token,
          stageFilter === "all" ? undefined : stageFilter,
        );

        if (!active) {
          return;
        }

        const nextSelectedId = data.some((item) => item.id === selectedCaseIdRef.current)
          ? selectedCaseIdRef.current
          : (data[0]?.id ?? null);
        const nextSelectedCase =
          data.find((item) => item.id === nextSelectedId) ?? null;

        setCases(data);
        setSelectedCaseId(nextSelectedId);
        setActionState(buildInitialActionState(nextSelectedCase));
        setAssignees([]);
        setMessage(null);
        setUsingFallback(false);
      } catch {
        if (!active) {
          return;
        }

        const fallback =
          stageFilter === "all"
            ? demoWorkflowCases
            : demoWorkflowCases.filter((item) => item.stage === stageFilter);

        const nextSelectedId = fallback.some(
          (item) => item.id === selectedCaseIdRef.current,
        )
          ? selectedCaseIdRef.current
          : (fallback[0]?.id ?? null);
        const nextSelectedCase =
          fallback.find((item) => item.id === nextSelectedId) ?? null;

        setCases(fallback);
        setSelectedCaseId(nextSelectedId);
        setActionState(buildInitialActionState(nextSelectedCase));
        setAssignees([]);
        setMessage(null);
        setUsingFallback(true);
      }
    };

    loadCases();

    return () => {
      active = false;
    };
  }, [token, isInternalUser, stageFilter]);

  useEffect(() => {
    const selectedCase = cases.find((item) => item.id === selectedCaseId);
    const action = selectedCase?.available_actions[0];

    if (!selectedCase || !action || !token || usingFallback) {
      return;
    }

    if (!["delegate_verification", "delegate_investigation"].includes(action)) {
      return;
    }

    let active = true;

    const loadAssignees = async () => {
      try {
        const role = action === "delegate_verification" ? "verificator" : "investigator";
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
  }, [cases, selectedCaseId, token, usingFallback]);

  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? null;
  const currentAction = selectedCase?.available_actions[0] ?? null;

  const selectCase = (caseItem: WorkflowCase) => {
    setSelectedCaseId(caseItem.id);
    setActionState(buildInitialActionState(caseItem));
    setAssignees([]);
    setMessage(null);
  };

  const refreshCases = async () => {
    if (!token || !isInternalUser) {
      return;
    }

    const data = await api.fetchWorkflowCases(
      token,
      stageFilter === "all" ? undefined : stageFilter,
    );
    const nextSelectedId = data.some((item) => item.id === selectedCaseIdRef.current)
      ? selectedCaseIdRef.current
      : (data[0]?.id ?? null);
    const nextSelectedCase =
      data.find((item) => item.id === nextSelectedId) ?? null;

    setCases(data);
    setSelectedCaseId(nextSelectedId);
    setActionState(buildInitialActionState(nextSelectedCase));
    setAssignees([]);
    setUsingFallback(false);
  };

  const handleAction = () => {
    if (!token || !selectedCase || !currentAction) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        if (currentAction === "delegate_verification") {
          await api.delegateVerification(token, selectedCase.id, {
            assignee_user_id: Number(actionState.assignee_user_id),
            assigned_unit: actionState.assigned_unit || undefined,
            due_in_days: Number(actionState.due_in_days),
          });
        }

        if (currentAction === "submit_verification") {
          await api.submitVerification(token, selectedCase.id, {
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "review_verification") {
          await api.reviewVerification(token, selectedCase.id, {
            decision: actionState.decision as "approved" | "rejected",
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "delegate_investigation") {
          await api.delegateInvestigation(token, selectedCase.id, {
            assignee_user_id: Number(actionState.assignee_user_id),
            assigned_unit: actionState.assigned_unit || undefined,
            due_in_days: Number(actionState.due_in_days),
          });
        }

        if (currentAction === "submit_investigation") {
          await api.submitInvestigation(token, selectedCase.id, {
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "review_investigation") {
          await api.reviewInvestigation(token, selectedCase.id, {
            decision: actionState.decision as "approved" | "rejected",
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "director_review") {
          await api.directorReview(token, selectedCase.id, {
            decision: actionState.decision as "approved" | "rejected",
            internal_note: actionState.internal_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        await refreshCases();
        setMessage("Workflow action completed successfully.");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The workflow action could not be completed.",
        );
      }
    });
  };

  if (!isReady) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading workflow session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isInternalUser || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Workspace</p>
          <h2 className="mt-4 text-3xl">Internal role access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            The workflow workbench is only available to supervisor, verificator,
            investigator, director, and system administrator accounts.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Access Policy
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Reporter accounts cannot access the internal workflow workbench.</li>
            <li>System administrator provisions internal user accounts.</li>
            <li>Workflow actions are exposed only when the current role owns the active stage.</li>
          </ul>
        </aside>
      </div>
    );
  }

  const queueVisible = cases.length;
  const actionableCases = cases.filter((item) => item.available_actions.length > 0).length;
  const workflowOwners = selectedCase
    ? [
        ["Supervisor of Verificator", selectedCase.workflow.verification_supervisor],
        ["Verificator", selectedCase.workflow.verificator],
        ["Supervisor of Investigator", selectedCase.workflow.investigation_supervisor],
        ["Investigator", selectedCase.workflow.investigator],
        ["Director", selectedCase.workflow.director],
      ]
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.37fr_0.63fr]">
      <aside className="space-y-6">
        <section className="panel rounded-[1rem] p-6">
          <p className="eyebrow">Case Queue</p>
          <h2 className="mt-3 text-3xl">Operational workbench</h2>
          <p className="muted mt-4 text-sm leading-7">
            Role-gated queue for verification, investigation, and director review.
          </p>

          {usingFallback ? (
            <div className="accent-card mt-5 rounded-[0.8rem] border border-[rgba(197,160,34,0.25)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
              Backend unavailable. Showing seeded workflow cases for interface review.
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <article className="outline-panel rounded-[0.8rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Logged in role
              </p>
              <p className="mt-2 text-lg font-semibold">{user.role_label}</p>
            </article>
            <article className="signal-card rounded-[0.8rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Visible queue
              </p>
              <p className="mt-2 font-display text-4xl">{queueVisible}</p>
            </article>
            <article className="accent-card rounded-[0.8rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Actionable now
              </p>
              <p className="mt-2 font-display text-4xl">{actionableCases}</p>
            </article>
          </div>
        </section>

        <section className="panel rounded-[1rem] p-6">
          <p className="eyebrow">Stage Filter</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Narrow the queue by active governance stage.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {stageFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStageFilter(filter.value)}
                className={`rounded-[0.55rem] border px-4 py-3 text-left text-sm font-semibold transition ${
                  stageFilter === filter.value
                    ? "border-[var(--primary)] bg-[rgba(239,47,39,0.08)] text-[var(--foreground)]"
                    : "border-[var(--panel-border)] bg-white/75 text-[var(--muted)] hover:border-[rgba(239,47,39,0.2)] hover:text-[var(--foreground)]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--panel-border)] pt-6">
            <p className="eyebrow">Assigned Cases</p>
            <div className="mt-4 space-y-3">
              {cases.length > 0 ? (
                cases.map((caseItem) => (
                  <button
                    key={caseItem.case_number}
                    type="button"
                    onClick={() => selectCase(caseItem)}
                    className={`w-full rounded-[0.9rem] border p-5 text-left transition ${
                      selectedCaseId === caseItem.id
                        ? "border-[var(--primary)] bg-[rgba(239,47,39,0.08)] shadow-[0_16px_30px_rgba(239,47,39,0.08)]"
                        : "border-[var(--panel-border)] bg-white/80 hover:border-[rgba(239,47,39,0.22)] hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                          {caseItem.case_number}
                        </p>
                        <h3 className="mt-2 text-xl">{caseItem.title}</h3>
                        <p className="muted mt-2 text-sm">
                          {caseItem.current_role_label} · {caseItem.assigned_to ?? "Unassigned"}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                          {caseItem.assigned_unit ?? "Unit pending"} · {caseItem.category}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={caseItem.stage} label={caseItem.stage_label} />
                        <StatusBadge value={caseItem.severity} />
                      </div>
                    </div>
                    {caseItem.governance_tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {caseItem.governance_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-[0.35rem] border border-[var(--panel-border)] bg-white px-2 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--muted)]"
                          >
                            {tag.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="muted text-sm leading-7">
                  No cases are currently available for this role and stage filter.
                </p>
              )}
            </div>
          </div>
        </section>
      </aside>

      <div className="space-y-6">
        <section className="panel rounded-[1rem] p-7">
          {selectedCase ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Selected Case</p>
                  <h2 className="mt-3 text-3xl">{selectedCase.title}</h2>
                  <p className="muted mt-3 text-sm leading-7">
                    {selectedCase.case_number} · {selectedCase.public_reference}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={selectedCase.stage} label={selectedCase.stage_label} />
                  <StatusBadge value={selectedCase.status} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="signal-card rounded-[0.85rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Current role
                  </p>
                  <p className="mt-2 text-sm">{selectedCase.current_role_label}</p>
                </article>
                <article className="outline-panel rounded-[0.85rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Assigned unit
                  </p>
                  <p className="mt-2 text-sm">{selectedCase.assigned_unit ?? "Not assigned"}</p>
                </article>
                <article className="accent-card rounded-[0.85rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Reporter
                  </p>
                  <p className="mt-2 text-sm">
                    {selectedCase.reporter.name ?? "Protected reporter"}
                  </p>
                </article>
                <article className="outline-panel rounded-[0.85rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Last activity
                  </p>
                  <p className="mt-2 text-sm">
                    {selectedCase.last_activity_at
                      ? formatDateTime(selectedCase.last_activity_at)
                      : "No activity recorded"}
                  </p>
                </article>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[0.54fr_0.46fr]">
                <article className="panel rounded-[0.95rem] border border-[var(--panel-border)] p-5">
                  <p className="eyebrow">Workflow Ownership</p>
                  <div className="mt-4 grid gap-3">
                    {workflowOwners.map(([label, owner]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 border-b border-[rgba(19,19,19,0.06)] pb-3 last:border-b-0 last:pb-0"
                      >
                        <p className="text-sm text-[var(--muted)]">{label}</p>
                        <p className="text-right text-sm font-semibold">
                          {owner ?? "Not set"}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="dark-card rounded-[0.95rem] border border-white/8 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
                    Case Signals
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                        Severity
                      </p>
                      <p className="mt-2 text-sm text-white/92">{selectedCase.severity}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                        Confidentiality
                      </p>
                      <p className="mt-2 text-sm text-white/92">
                        {selectedCase.confidentiality_level}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                        SLA due
                      </p>
                      <p className="mt-2 text-sm text-white/92">
                        {selectedCase.sla_due_at
                          ? formatDateTime(selectedCase.sla_due_at)
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                        Governance tags
                      </p>
                      <p className="mt-2 text-sm text-white/92">
                        {selectedCase.governance_tags.length > 0
                          ? selectedCase.governance_tags.join(", ")
                          : "None"}
                      </p>
                    </div>
                  </div>
                </article>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <article className="outline-panel rounded-[0.9rem] p-5">
                  <p className="eyebrow">Latest Internal Event</p>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {selectedCase.latest_internal_event ?? "No internal event logged yet."}
                  </p>
                </article>
                <article className="outline-panel rounded-[0.9rem] p-5">
                  <p className="eyebrow">Latest Public Milestone</p>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {selectedCase.latest_public_event ?? "No public update has been published."}
                  </p>
                </article>
              </div>
            </>
          ) : (
            <p className="muted text-sm leading-7">
              Select a case from the queue to view workflow details.
            </p>
          )}
        </section>

        <section className="dark-card rounded-[1rem] border border-white/8 p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Stage Action Center
          </p>

          {selectedCase && currentAction ? (
            <div className="mt-4 space-y-5">
              <div className="rounded-[0.8rem] border border-white/10 bg-white/4 p-4">
                <p className="text-sm font-semibold text-white">
                  {actionLabels[currentAction] ?? currentAction}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/65">
                  Only the current accountable role may execute this stage transition.
                </p>
              </div>

              {["delegate_verification", "delegate_investigation"].includes(currentAction) ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-white">
                      Assignee
                    </span>
                    <select
                      className="field"
                      value={actionState.assignee_user_id}
                      onChange={(event) =>
                        setActionState((current) => ({
                          ...current,
                          assignee_user_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select assignee</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={String(assignee.id)}>
                          {assignee.name} · {assignee.unit ?? assignee.role_label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">
                        Assigned unit
                      </span>
                      <input
                        className="field"
                        value={actionState.assigned_unit}
                        onChange={(event) =>
                          setActionState((current) => ({
                            ...current,
                            assigned_unit: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-white">
                        Due in days
                      </span>
                      <input
                        className="field"
                        type="number"
                        min={1}
                        max={90}
                        value={actionState.due_in_days}
                        onChange={(event) =>
                          setActionState((current) => ({
                            ...current,
                            due_in_days: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </>
              ) : null}

              {["review_verification", "review_investigation", "director_review"].includes(
                currentAction,
              ) ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">
                    Decision
                  </span>
                  <select
                    className="field"
                    value={actionState.decision}
                    onChange={(event) =>
                      setActionState((current) => ({
                        ...current,
                        decision: event.target.value,
                      }))
                    }
                  >
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">
                  Internal note
                </span>
                <textarea
                  className="field min-h-32"
                  value={actionState.internal_note}
                  onChange={(event) =>
                    setActionState((current) => ({
                      ...current,
                      internal_note: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="flex items-center gap-3 rounded-[0.8rem] border border-white/10 bg-white/4 px-4 py-4 text-sm text-white/88">
                <input
                  type="checkbox"
                  checked={actionState.publish_update}
                  onChange={(event) =>
                    setActionState((current) => ({
                      ...current,
                      publish_update: event.target.checked,
                    }))
                  }
                />
                Publish a public-safe update to the reporter tracking view
              </label>

              {actionState.publish_update ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">
                    Public message
                  </span>
                  <textarea
                    className="field min-h-24"
                    value={actionState.public_message}
                    onChange={(event) =>
                      setActionState((current) => ({
                        ...current,
                        public_message: event.target.value,
                      }))
                    }
                  />
                </label>
              ) : null}

              {message ? (
                <p
                  className={`rounded-[0.8rem] px-4 py-3 text-sm ${
                    message.includes("successfully")
                      ? "bg-emerald-100 text-emerald-900"
                      : "border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]"
                  }`}
                >
                  {message}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleAction}
                disabled={
                  isPending ||
                  (["delegate_verification", "delegate_investigation"].includes(currentAction) &&
                    !actionState.assignee_user_id) ||
                  !actionState.internal_note
                }
                className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Processing..." : actionLabels[currentAction]}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-white/65">
              No workflow action is currently available for this case and role.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
