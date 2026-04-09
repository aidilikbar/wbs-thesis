"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { CaseMessageBoard } from "@/components/case-message-board";
import { ReportedPartiesEditor } from "@/components/reported-parties-editor";
import { ReportedPartiesSummary } from "@/components/reported-parties-summary";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowAttachmentPanel } from "@/components/workflow-attachment-panel";
import { WorkflowNavigation } from "@/components/workflow-navigation";
import { api } from "@/lib/api";
import {
  corruptionArticleOptions,
  delictOptions,
  demoWorkflowCases,
  governanceTagOptions,
  monthOptions,
  reportedPartyClassificationOptions,
  reviewRecommendationOptions,
  verificationRecommendationOptions,
} from "@/lib/demo-data";
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
  ReportedParty,
  WorkflowAssignee,
  WorkflowCase,
  WorkflowDirectoryView,
} from "@/lib/types";

type WorkflowTab = "details" | "communication" | "timeline";

type WorkflowRecord = Record<string, unknown> | null | undefined;

type ActionState = {
  reject_report: boolean;
  assignee_user_id: string;
  assigned_unit: string;
  distribution_note: string;
  decision: "approved" | "rejected";
  approval_note: string;
  publish_update: boolean;
  public_message: string;
  summary: string;
  corruption_aspect_tags: string[];
  has_authority: boolean;
  criminal_assessment: "indicated" | "not_indicated";
  reason: string;
  recommendation: string;
  forwarding_destination: string;
  case_name: string;
  reported_parties: ReportedParty[];
  description: string;
  delict: string;
  article: string;
  start_month: string;
  start_year: string;
  end_month: string;
  end_year: string;
  city: string;
  province: string;
  modus: string;
  related_report_reference: string;
  is_priority: boolean;
  additional_information: string;
  conclusion: string;
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
    title: "Verification Screening",
    description:
      "Record the initial screening, reject invalid reports, or delegate the case to a verification officer.",
    button: "Save Screening Decision",
    mode: "queue",
  },
  submit_verification: {
    title: "Verification Assessment",
    description:
      "Document the verification outcome, authority assessment, criminal assessment, and recommendation.",
    button: "Submit Verification Assessment",
    mode: "queue",
  },
  review_verification: {
    title: "Verification Approval",
    description:
      "Approve or reject the verification outcome before the case is delegated to investigation or completed.",
    button: "Record Verification Approval",
    mode: "approval",
  },
  delegate_investigation: {
    title: "Investigation Delegation",
    description:
      "Assign the approved verification case to an investigator and capture the delegation note.",
    button: "Delegate Investigation",
    mode: "queue",
  },
  submit_investigation: {
    title: "Investigation Assessment",
    description:
      "Prepare the formal investigation case record, legal references, timing, linkage, and conclusion.",
    button: "Submit Investigation Assessment",
    mode: "queue",
  },
  review_investigation: {
    title: "Investigation Approval",
    description:
      "Approve or reject the investigation result before the director records the final decision.",
    button: "Record Investigation Approval",
    mode: "approval",
  },
  director_review: {
    title: "Director Decision",
    description:
      "Record the final director approval or rejection with a formal approval note.",
    button: "Record Director Decision",
    mode: "approval",
  },
};

function readString(record: WorkflowRecord, key: string, fallback = ""): string {
  const value = record?.[key];
  return typeof value === "string" ? value : fallback;
}

function readBoolean(record: WorkflowRecord, key: string, fallback = false): boolean {
  const value = record?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function readStringArray(record: WorkflowRecord, key: string): string[] {
  const value = record?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readReportedParties(
  record: WorkflowRecord,
  key: string,
  fallback: ReportedParty[],
): ReportedParty[] {
  const value = record?.[key];

  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((party) => ({
      full_name: typeof party.full_name === "string" ? party.full_name : "",
      position: typeof party.position === "string" ? party.position : "",
      classification:
        typeof party.classification === "string" ? party.classification : "other",
    }))
    .filter((party) => party.full_name !== "" || party.position !== "");

  return parsed.length > 0 ? parsed : fallback;
}

function buildDefaultReportedParties(record: WorkflowCase | null): ReportedParty[] {
  if (!record || (record.reported_parties ?? []).length === 0) {
    return [
      {
        full_name: "",
        position: "",
        classification: "other",
      },
    ];
  }

  return record.reported_parties ?? [];
}

function buildActionState(record: WorkflowCase | null): ActionState {
  const currentAction = record?.available_actions[0] ?? null;
  const verification = record?.workflow_records?.verification;
  const review = record?.workflow_records?.review;
  const reviewDistribution = record?.workflow_records?.review_distribution;
  const verificationHasAuthority = verification?.has_authority;
  const reviewHasAuthority = review?.has_authority;

  return {
    reject_report: readBoolean(record?.workflow_records?.screening, "reject_report"),
    assignee_user_id: "",
    assigned_unit: record?.assigned_unit ?? "",
    distribution_note:
      readString(record?.workflow_records?.screening, "distribution_note") ||
      readString(reviewDistribution, "distribution_note"),
    decision: "approved",
    approval_note:
      readString(record?.workflow_records?.verification_approval, "approval_note") ||
      readString(record?.workflow_records?.review_approval, "approval_note") ||
      readString(record?.workflow_records?.director_approval, "approval_note"),
    publish_update: false,
    public_message: "",
    summary: readString(verification, "summary"),
    corruption_aspect_tags:
      readStringArray(verification, "corruption_aspect_tags").length > 0
        ? readStringArray(verification, "corruption_aspect_tags")
        : readStringArray(review, "corruption_aspect_tags"),
    has_authority:
      typeof verificationHasAuthority === "boolean"
        ? verificationHasAuthority
        : typeof reviewHasAuthority === "boolean"
          ? reviewHasAuthority
          : true,
    criminal_assessment:
      readString(verification, "criminal_assessment", "indicated") === "not_indicated"
        ? "not_indicated"
        : "indicated",
    reason: readString(verification, "reason"),
    recommendation:
      readString(verification, "recommendation") ||
      readString(review, "recommendation") ||
      (currentAction === "submit_investigation" ? "internal_forwarding" : "review"),
    forwarding_destination: readString(verification, "forwarding_destination"),
    case_name: readString(review, "case_name", record?.title ?? ""),
    reported_parties: readReportedParties(
      review,
      "reported_parties",
      buildDefaultReportedParties(record),
    ),
    description: readString(review, "description", record?.description ?? ""),
    delict: readString(review, "delict", "other"),
    article: readString(review, "article", "article_2_31_1999"),
    start_month: readString(review, "start_month", "01"),
    start_year: readString(review, "start_year", new Date().getFullYear().toString()),
    end_month: readString(review, "end_month", "01"),
    end_year: readString(review, "end_year", new Date().getFullYear().toString()),
    city: readString(review, "city"),
    province: readString(review, "province"),
    modus: readString(review, "modus", record?.description ?? ""),
    related_report_reference: readString(
      review,
      "related_report_reference",
      record?.public_reference ?? "",
    ),
    is_priority: readBoolean(review, "is_priority"),
    additional_information: readString(review, "additional_information"),
    conclusion: readString(review, "conclusion"),
  };
}

function renderAuditSnapshot(title: string, items: Array<[string, string | null | undefined]>) {
  const visibleItems = items.filter(([, value]) => value && value.trim() !== "");

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5">
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
        {title}
      </p>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        {visibleItems.map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
              {label}
            </dt>
            <dd className="mt-2 text-sm leading-7 text-[var(--foreground)]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
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
  const [actionState, setActionState] = useState<ActionState>(() => buildActionState(null));
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkflowTab>("details");
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

  const currentAction = record?.available_actions[0] ?? null;
  const meta = currentAction ? actionMeta[currentAction] : null;
  const currentActionMode =
    currentAction && isApprovalAction(currentAction) ? "approval" : "queue";

  useEffect(() => {
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
  }, [record, currentAction, token, usingFallback]);

  const updateActionState = <K extends keyof ActionState>(
    field: K,
    value: ActionState[K],
  ) => {
    setActionState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleAspectTag = (tag: string) => {
    updateActionState(
      "corruption_aspect_tags",
      actionState.corruption_aspect_tags.includes(tag)
        ? actionState.corruption_aspect_tags.filter((item) => item !== tag)
        : [...actionState.corruption_aspect_tags, tag],
    );
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
            reject_report: actionState.reject_report,
            assignee_user_id:
              actionState.reject_report || actionState.assignee_user_id === ""
                ? undefined
                : Number(actionState.assignee_user_id),
            assigned_unit: actionState.assigned_unit || undefined,
            distribution_note: actionState.distribution_note || undefined,
          });
        }

        if (currentAction === "submit_verification") {
          await api.submitVerification(token, record.id, {
            summary: actionState.summary,
            corruption_aspect_tags: actionState.corruption_aspect_tags,
            has_authority: actionState.has_authority,
            criminal_assessment: actionState.criminal_assessment,
            reason: actionState.reason,
            recommendation: actionState.recommendation,
            forwarding_destination:
              actionState.recommendation === "forward"
                ? actionState.forwarding_destination
                : undefined,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "review_verification") {
          await api.reviewVerification(token, record.id, {
            decision: actionState.decision,
            approval_note: actionState.approval_note,
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
            distribution_note: actionState.distribution_note || undefined,
          });
        }

        if (currentAction === "submit_investigation") {
          await api.submitInvestigation(token, record.id, {
            case_name: actionState.case_name,
            reported_parties: actionState.reported_parties,
            description: actionState.description,
            corruption_aspect_tags: actionState.corruption_aspect_tags,
            recommendation: actionState.recommendation,
            delict: actionState.delict,
            article: actionState.article,
            start_month: actionState.start_month,
            start_year: actionState.start_year,
            end_month: actionState.end_month,
            end_year: actionState.end_year,
            city: actionState.city,
            province: actionState.province,
            modus: actionState.modus,
            related_report_reference: actionState.related_report_reference || undefined,
            has_authority: actionState.has_authority,
            is_priority: actionState.is_priority,
            additional_information: actionState.additional_information || undefined,
            conclusion: actionState.conclusion,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "review_investigation") {
          await api.reviewInvestigation(token, record.id, {
            decision: actionState.decision,
            approval_note: actionState.approval_note,
            publish_update: actionState.publish_update,
            public_message: actionState.publish_update
              ? actionState.public_message
              : undefined,
          });
        }

        if (currentAction === "director_review") {
          await api.directorReview(token, record.id, {
            decision: actionState.decision,
            approval_note: actionState.approval_note,
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
            Approval pages are reserved for the approving roles only.
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

  const tabs: Array<{ id: WorkflowTab; label: string }> = [
    { id: "details", label: "Case Details" },
    { id: "communication", label: "Secure Communication" },
    { id: "timeline", label: "Case Timeline" },
  ];

  const timeline = [...(record.timeline ?? [])].reverse();
  const verificationRecord = record.workflow_records?.verification;
  const reviewRecord = record.workflow_records?.review;

  return (
    <div className="space-y-6">
      <WorkflowNavigation activeView={view} role={user.role} />

      <section className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{view === "approval" ? "Approval Case" : "Workflow Case"}</p>
            <h2 className="mt-4 text-[clamp(2.3rem,5vw,4rem)]">{record.title}</h2>
            <p className="muted mt-4 max-w-4xl text-sm leading-8">
              {meta?.description ??
                "Review the protected case record, attachments, and workflow history before recording the next step."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge value={record.status} />
            <StatusBadge value={record.severity} />
            <Link href={backPath} className="ghost-button">
              Back to Queue
            </Link>
          </div>
        </div>

        {usingFallback ? (
          <p className="mt-6 inline-flex rounded-[0.45rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-2 text-sm text-[var(--secondary-strong)]">
            Backend unavailable. Showing seeded workflow detail for interface review.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="outline-panel rounded-[0.9rem] px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
              Case Number
            </p>
            <p className="mt-3 font-mono text-sm">{record.case_number}</p>
          </article>
          <article className="outline-panel rounded-[0.9rem] px-5 py-4">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
              Public Reference
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

      <section className="panel rounded-[1rem] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[0.8rem] border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-[rgba(239,47,39,0.2)] bg-[rgba(239,47,39,0.08)] text-[var(--primary)]"
                    : "border-[var(--panel-border)] bg-white/76 text-[var(--muted)] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "details" ? (
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <article className="panel rounded-[1rem] p-8">
            <p className="eyebrow">Case Record</p>
            <div className="mt-6 space-y-6">
              <div>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                  Report Description
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                  {record.description ?? "No report description recorded."}
                </p>
              </div>

              <ReportedPartiesSummary parties={record.reported_parties ?? []} />

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="dark-card rounded-[1rem] border border-white/8 p-6">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
                    Reporter Visibility
                  </p>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-white/76">
                    <div>
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/44">
                        Reporter Name
                      </p>
                      <p className="mt-1 text-white">
                        {record.reporter.is_protected
                          ? "Protected by anonymous mode"
                          : record.reporter.name ?? "Not available"}
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

                <div className="outline-panel rounded-[1rem] p-6">
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
              </div>

              {renderAuditSnapshot("Screening Record", [
                ["Rejected", readBoolean(record.workflow_records?.screening, "reject_report") ? "Yes" : ""],
                ["Distribution Note", readString(record.workflow_records?.screening, "distribution_note")],
              ])}

              {renderAuditSnapshot("Verification Record", [
                ["Summary", readString(verificationRecord, "summary")],
                [
                  "Corruption Tags",
                  readStringArray(verificationRecord, "corruption_aspect_tags")
                    .map((item) => item.replaceAll("_", " "))
                    .join(", "),
                ],
                [
                  "Authority",
                  verificationRecord
                    ? readBoolean(verificationRecord, "has_authority")
                      ? "Yes"
                      : "No"
                    : "",
                ],
                [
                  "Criminal Assessment",
                  readString(verificationRecord, "criminal_assessment")
                    .replaceAll("_", " "),
                ],
                ["Recommendation", readString(verificationRecord, "recommendation").replaceAll("_", " ")],
                ["Reason", readString(verificationRecord, "reason")],
                ["Forwarding Destination", readString(verificationRecord, "forwarding_destination")],
              ])}

              {reviewRecord ? (
                <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5">
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                    Investigation Record
                  </p>
                  <div className="mt-4 space-y-5">
                    <div>
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                        Case Name
                      </p>
                      <p className="mt-2 text-sm">{readString(reviewRecord, "case_name")}</p>
                    </div>
                    <ReportedPartiesSummary
                      parties={readReportedParties(reviewRecord, "reported_parties", [])}
                      title="Reported Parties in Investigation"
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Recommendation
                        </p>
                        <p className="mt-2 text-sm">
                          {readString(reviewRecord, "recommendation").replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Delict
                        </p>
                        <p className="mt-2 text-sm">
                          {readString(reviewRecord, "delict").replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Article
                        </p>
                        <p className="mt-2 text-sm">
                          {readString(reviewRecord, "article").replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Priority
                        </p>
                        <p className="mt-2 text-sm">
                          {readBoolean(reviewRecord, "is_priority") ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                        Conclusion
                      </p>
                      <p className="mt-2 text-sm leading-7">
                        {readString(reviewRecord, "conclusion")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <WorkflowAttachmentPanel
            token={token}
            caseId={record.id}
            attachments={record.attachments}
          />
        </section>
      ) : null}

      {activeTab === "communication" ? (
        supportsSecureMessaging ? (
          <CaseMessageBoard token={token} scope={{ kind: "workflow", caseId: record.id }} />
        ) : (
          <section className="panel rounded-[1rem] p-8">
            <p className="eyebrow">Secure Communication</p>
            <h3 className="mt-4 text-3xl">Communication opens only for active handler roles</h3>
            <p className="muted mt-4 max-w-3xl text-sm leading-7">
              Secure discussion is available only to the assigned verification officer or investigator during the active communication stage.
            </p>
          </section>
        )
      ) : null}

      {activeTab === "timeline" ? (
        <section className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Case Timeline</p>
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
      ) : null}

      <section className="panel rounded-[1rem] p-8">
        <p className="eyebrow">{view === "approval" ? "Approval Action" : "Execution Action"}</p>
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
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {currentAction === "delegate_verification" ? (
              <>
                <label className="flex items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-4 text-sm leading-7">
                  <input
                    type="checkbox"
                    checked={actionState.reject_report}
                    onChange={(event) =>
                      updateActionState("reject_report", event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    Reject the report during initial screening because it is invalid, malicious, or outside the workflow scope.
                  </span>
                </label>

                {!actionState.reject_report ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Distribution Target</span>
                    <select
                      className="field"
                      value={actionState.assignee_user_id}
                      onChange={(event) =>
                        updateActionState("assignee_user_id", event.target.value)
                      }
                      required
                    >
                      <option value="">Select verification officer</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name} · {assignee.unit ?? assignee.role_label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Distribution Note</span>
                  <textarea
                    className="field min-h-32"
                    value={actionState.distribution_note}
                    onChange={(event) =>
                      updateActionState("distribution_note", event.target.value)
                    }
                    placeholder="Document the screening rationale or delegation note."
                  />
                </label>
              </>
            ) : null}

            {currentAction === "submit_verification" ? (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Information Summary</span>
                  <textarea
                    className="field min-h-32"
                    value={actionState.summary}
                    onChange={(event) => updateActionState("summary", event.target.value)}
                    required
                  />
                </label>

                <div>
                  <span className="mb-2 block text-sm font-semibold">Complaint Tagging</span>
                  <div className="flex flex-wrap gap-3">
                    {governanceTagOptions.map((tag) => {
                      const active = actionState.corruption_aspect_tags.includes(tag.value);

                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleAspectTag(tag.value)}
                          className={`rounded-[0.35rem] border px-4 py-3 text-[0.72rem] font-mono uppercase tracking-[0.22em] transition ${
                            active
                              ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.1)] text-[var(--primary-strong)]"
                              : "border-[var(--panel-border)] bg-white/80 text-[var(--foreground)]"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Has KPK Authority?</span>
                    <select
                      className="field"
                      value={actionState.has_authority ? "yes" : "no"}
                      onChange={(event) =>
                        updateActionState("has_authority", event.target.value === "yes")
                      }
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Criminal Assessment</span>
                    <select
                      className="field"
                      value={actionState.criminal_assessment}
                      onChange={(event) =>
                        updateActionState(
                          "criminal_assessment",
                          event.target.value as ActionState["criminal_assessment"],
                        )
                      }
                    >
                      <option value="indicated">Indicated corruption/crime</option>
                      <option value="not_indicated">Not indicated</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Reason</span>
                  <textarea
                    className="field min-h-28"
                    value={actionState.reason}
                    onChange={(event) => updateActionState("reason", event.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Recommendation</span>
                  <select
                    className="field"
                    value={actionState.recommendation}
                    onChange={(event) =>
                      updateActionState("recommendation", event.target.value)
                    }
                  >
                    {verificationRecommendationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {actionState.recommendation === "forward" ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Forwarding Destination</span>
                    <input
                      className="field"
                      value={actionState.forwarding_destination}
                      onChange={(event) =>
                        updateActionState("forwarding_destination", event.target.value)
                      }
                      required
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            {currentAction === "delegate_investigation" ? (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Distribution Target</span>
                  <select
                    className="field"
                    value={actionState.assignee_user_id}
                    onChange={(event) =>
                      updateActionState("assignee_user_id", event.target.value)
                    }
                    required
                  >
                    <option value="">Select investigator</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} · {assignee.unit ?? assignee.role_label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Distribution Note</span>
                  <textarea
                    className="field min-h-32"
                    value={actionState.distribution_note}
                    onChange={(event) =>
                      updateActionState("distribution_note", event.target.value)
                    }
                    placeholder="Explain the investigation assignment and immediate focus."
                  />
                </label>
              </>
            ) : null}

            {currentAction === "submit_investigation" ? (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Case Name</span>
                  <input
                    className="field"
                    value={actionState.case_name}
                    onChange={(event) => updateActionState("case_name", event.target.value)}
                    required
                  />
                </label>

                <ReportedPartiesEditor
                  parties={actionState.reported_parties}
                  options={reportedPartyClassificationOptions}
                  title="Reported Parties in Investigation"
                  description="Confirm or refine the parties carried into the investigation record."
                  onChange={(reported_parties) =>
                    updateActionState("reported_parties", reported_parties)
                  }
                />

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Complaint Description</span>
                  <textarea
                    className="field min-h-32"
                    value={actionState.description}
                    onChange={(event) =>
                      updateActionState("description", event.target.value)
                    }
                    required
                  />
                </label>

                <div>
                  <span className="mb-2 block text-sm font-semibold">Investigation Tagging</span>
                  <div className="flex flex-wrap gap-3">
                    {governanceTagOptions.map((tag) => {
                      const active = actionState.corruption_aspect_tags.includes(tag.value);

                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleAspectTag(tag.value)}
                          className={`rounded-[0.35rem] border px-4 py-3 text-[0.72rem] font-mono uppercase tracking-[0.22em] transition ${
                            active
                              ? "border-[rgba(239,47,39,0.18)] bg-[rgba(239,47,39,0.1)] text-[var(--primary-strong)]"
                              : "border-[var(--panel-border)] bg-white/80 text-[var(--foreground)]"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Investigation Recommendation</span>
                    <select
                      className="field"
                      value={actionState.recommendation}
                      onChange={(event) =>
                        updateActionState("recommendation", event.target.value)
                      }
                    >
                      {reviewRecommendationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Delict</span>
                    <select
                      className="field"
                      value={actionState.delict}
                      onChange={(event) => updateActionState("delict", event.target.value)}
                    >
                      {delictOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold">Article</span>
                    <select
                      className="field"
                      value={actionState.article}
                      onChange={(event) => updateActionState("article", event.target.value)}
                    >
                      {corruptionArticleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Start Month</span>
                    <select
                      className="field"
                      value={actionState.start_month}
                      onChange={(event) =>
                        updateActionState("start_month", event.target.value)
                      }
                    >
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Start Year</span>
                    <input
                      className="field"
                      value={actionState.start_year}
                      onChange={(event) =>
                        updateActionState("start_year", event.target.value)
                      }
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">End Month</span>
                    <select
                      className="field"
                      value={actionState.end_month}
                      onChange={(event) =>
                        updateActionState("end_month", event.target.value)
                      }
                    >
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">End Year</span>
                    <input
                      className="field"
                      value={actionState.end_year}
                      onChange={(event) =>
                        updateActionState("end_year", event.target.value)
                      }
                      inputMode="numeric"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">City</span>
                    <input
                      className="field"
                      value={actionState.city}
                      onChange={(event) => updateActionState("city", event.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Province</span>
                    <input
                      className="field"
                      value={actionState.province}
                      onChange={(event) =>
                        updateActionState("province", event.target.value)
                      }
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Modus</span>
                  <textarea
                    className="field min-h-28"
                    value={actionState.modus}
                    onChange={(event) => updateActionState("modus", event.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Related WBS Report</span>
                  <input
                    className="field"
                    value={actionState.related_report_reference}
                    onChange={(event) =>
                      updateActionState("related_report_reference", event.target.value)
                    }
                    placeholder="WBS-2026-0001"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Has Authority?</span>
                    <select
                      className="field"
                      value={actionState.has_authority ? "yes" : "no"}
                      onChange={(event) =>
                        updateActionState("has_authority", event.target.value === "yes")
                      }
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-4 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={actionState.is_priority}
                      onChange={(event) =>
                        updateActionState("is_priority", event.target.checked)
                      }
                    />
                    Mark as priority
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Additional Information</span>
                  <textarea
                    className="field min-h-28"
                    value={actionState.additional_information}
                    onChange={(event) =>
                      updateActionState("additional_information", event.target.value)
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Conclusion</span>
                  <textarea
                    className="field min-h-32"
                    value={actionState.conclusion}
                    onChange={(event) =>
                      updateActionState("conclusion", event.target.value)
                    }
                    required
                  />
                </label>
              </>
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
                  <span className="mb-2 block text-sm font-semibold">Approval Note</span>
                  <textarea
                    className="field min-h-32"
                    value={actionState.approval_note}
                    onChange={(event) =>
                      updateActionState("approval_note", event.target.value)
                    }
                    required
                  />
                </label>
              </>
            ) : null}

            {["submit_verification", "review_verification", "submit_investigation", "review_investigation", "director_review"].includes(
              currentAction,
            ) ? (
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
                    Publish a public-safe update so the reporter can see progress in the tracking workflow.
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

            <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--panel-border)] pt-6">
              <button
                type="button"
                className="ghost-button"
                onClick={() => router.push(backPath)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button disabled:opacity-60"
                disabled={isPending || !currentAction}
              >
                {isPending ? "Saving..." : meta.button}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5 text-sm leading-7 text-[var(--muted)]">
            No workflow action is currently available for this case in the selected menu.
          </div>
        )}
      </section>
    </div>
  );
}
