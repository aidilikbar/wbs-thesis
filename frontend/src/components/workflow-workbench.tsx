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

        const nextSelectedId = fallback.some((item) => item.id === selectedCaseIdRef.current)
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
      <div className="panel rounded-[2rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading workflow session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isInternalUser || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Restricted Workspace</p>
          <h2 className="mt-4 text-3xl">Internal role access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            The workflow workbench is only available to supervisor, verificator,
            investigator, director, and system administrator accounts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
            >
              Login
            </Link>
          </div>
        </div>
        <aside className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Access Policy</p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
            <li>Reporter accounts cannot access the internal workflow workbench.</li>
            <li>System administrator provisions internal user accounts.</li>
            <li>Workflow actions are exposed only when the current role owns the active stage.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="panel rounded-[2rem] p-7">
        <div className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">Queue Overview</p>
            <h2 className="mt-3 text-3xl">Role-specific case queue</h2>
            {usingFallback ? (
              <p className="mt-3 rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-900">
                Backend unavailable. Showing seeded workflow cases.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {stageFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStageFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  stageFilter === filter.value
                    ? "bg-[var(--foreground)] text-white"
                    : "border border-[var(--panel-border)] bg-white/55"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {cases.length > 0 ? (
            cases.map((caseItem) => (
              <button
                key={caseItem.case_number}
                type="button"
                onClick={() => selectCase(caseItem)}
                className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
                  selectedCaseId === caseItem.id
                    ? "border-[rgba(237,28,36,0.28)] bg-[rgba(237,28,36,0.08)]"
                    : "border-[var(--panel-border)] bg-white/60 hover:bg-white"
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
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={caseItem.stage} label={caseItem.stage_label} />
                    <StatusBadge value={caseItem.severity} />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="muted text-sm leading-7">
              No cases are currently available for this role and stage filter.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel rounded-[2rem] p-7">
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

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Current role
                  </p>
                  <p className="mt-2 text-sm">{selectedCase.current_role_label}</p>
                </article>
                <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Assigned unit
                  </p>
                  <p className="mt-2 text-sm">{selectedCase.assigned_unit ?? "Not assigned"}</p>
                </article>
                <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Reporter
                  </p>
                  <p className="mt-2 text-sm">{selectedCase.reporter.name ?? "Protected reporter"}</p>
                </article>
                <article className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
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

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="rounded-[1.4rem] border border-[var(--panel-border)] bg-white/60 p-5">
                  <p className="eyebrow">Workflow Ownership</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                    <li>Supervisor of Verificator: {selectedCase.workflow.verification_supervisor ?? "Not set"}</li>
                    <li>Verificator: {selectedCase.workflow.verificator ?? "Not set"}</li>
                    <li>Supervisor of Investigator: {selectedCase.workflow.investigation_supervisor ?? "Not set"}</li>
                    <li>Investigator: {selectedCase.workflow.investigator ?? "Not set"}</li>
                    <li>Director: {selectedCase.workflow.director ?? "Not set"}</li>
                  </ul>
                </article>
                <article className="rounded-[1.4rem] border border-[var(--panel-border)] bg-white/60 p-5">
                  <p className="eyebrow">Case Signals</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                    <li>Severity: {selectedCase.severity}</li>
                    <li>Confidentiality: {selectedCase.confidentiality_level}</li>
                    <li>
                      SLA due: {selectedCase.sla_due_at ? formatDateTime(selectedCase.sla_due_at) : "Not set"}
                    </li>
                    <li>
                      Governance flags:{" "}
                      {selectedCase.governance_tags.length > 0
                        ? selectedCase.governance_tags.join(", ")
                        : "None"}
                    </li>
                  </ul>
                </article>
              </div>
            </>
          ) : (
            <p className="muted text-sm leading-7">
              Select a case from the queue to view workflow details.
            </p>
          )}
        </div>

        <div className="panel rounded-[2rem] p-7">
          <p className="eyebrow">Available Action</p>
          {selectedCase && currentAction ? (
            <div className="mt-4 space-y-5">
              <div className="rounded-[1.3rem] bg-[var(--surface-soft)]/70 p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {actionLabels[currentAction] ?? currentAction}
                </p>
                <p className="muted mt-2 text-sm leading-7">
                  Only the current accountable role may execute this stage transition.
                </p>
              </div>

              {["delegate_verification", "delegate_investigation"].includes(currentAction) ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Assignee</span>
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
                      <span className="mb-2 block text-sm font-semibold">Assigned unit</span>
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
                      <span className="mb-2 block text-sm font-semibold">Due in days</span>
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
                  <span className="mb-2 block text-sm font-semibold">Decision</span>
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

              {currentAction ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Internal note</span>
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
                  <label className="flex items-center gap-3 text-sm">
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
                      <span className="mb-2 block text-sm font-semibold">Public message</span>
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
                </>
              ) : null}

              {message ? (
                <p
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.includes("successfully")
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
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
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? "Processing..." : actionLabels[currentAction]}
              </button>
            </div>
          ) : (
            <p className="muted mt-4 text-sm leading-7">
              No workflow action is currently available for this case and role.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
