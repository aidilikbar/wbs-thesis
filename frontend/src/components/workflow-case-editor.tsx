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
import { api, ApiError } from "@/lib/api";
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
import { isWorkflowUser } from "@/lib/roles";
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
      "Approve the verification outcome or return it to the Verification Officer with an approval note for revision.",
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
      "Approve the investigation result or return it to the Investigator with an approval note for revision.",
    button: "Record Investigation Approval",
    mode: "approval",
  },
  director_review: {
    title: "Director Decision",
    description:
      "Record the final director approval or return the case to the Investigator with a formal approval note for revision.",
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

function readFormString(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : fallback;
}

function resolveNativeActionState(base: ActionState, formData: FormData): ActionState {
  const publishUpdate = formData.has("publish_update");

  return {
    ...base,
    reject_report: formData.has("reject_report"),
    assignee_user_id: readFormString(formData, "assignee_user_id", base.assignee_user_id),
    assigned_unit: readFormString(formData, "assigned_unit", base.assigned_unit),
    distribution_note: readFormString(
      formData,
      "distribution_note",
      base.distribution_note,
    ),
    decision:
      readFormString(formData, "decision", base.decision) === "rejected"
        ? "rejected"
        : "approved",
    approval_note: readFormString(formData, "approval_note", base.approval_note),
    publish_update: publishUpdate,
    public_message: publishUpdate
      ? readFormString(formData, "public_message", base.public_message)
      : "",
    summary: readFormString(formData, "summary", base.summary),
    has_authority:
      readFormString(formData, "has_authority", base.has_authority ? "yes" : "no") ===
      "yes",
    criminal_assessment:
      readFormString(
        formData,
        "criminal_assessment",
        base.criminal_assessment,
      ) === "not_indicated"
        ? "not_indicated"
        : "indicated",
    reason: readFormString(formData, "reason", base.reason),
    recommendation: readFormString(
      formData,
      "recommendation",
      base.recommendation,
    ),
    forwarding_destination: readFormString(
      formData,
      "forwarding_destination",
      base.forwarding_destination,
    ),
    case_name: readFormString(formData, "case_name", base.case_name),
    description: readFormString(formData, "description", base.description),
    delict: readFormString(formData, "delict", base.delict),
    article: readFormString(formData, "article", base.article),
    start_month: readFormString(formData, "start_month", base.start_month),
    start_year: readFormString(formData, "start_year", base.start_year),
    end_month: readFormString(formData, "end_month", base.end_month),
    end_year: readFormString(formData, "end_year", base.end_year),
    city: readFormString(formData, "city", base.city),
    province: readFormString(formData, "province", base.province),
    modus: readFormString(formData, "modus", base.modus),
    related_report_reference: readFormString(
      formData,
      "related_report_reference",
      base.related_report_reference,
    ),
    is_priority: formData.has("is_priority"),
    additional_information: readFormString(
      formData,
      "additional_information",
      base.additional_information,
    ),
    conclusion: readFormString(formData, "conclusion", base.conclusion),
  };
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
      currentAction === "delegate_investigation"
        ? readString(reviewDistribution, "distribution_note")
        : readString(record?.workflow_records?.screening, "distribution_note"),
    decision: "rejected",
    approval_note:
      currentAction === "review_verification"
        ? readString(record?.workflow_records?.verification_approval, "approval_note")
        : currentAction === "review_investigation"
          ? readString(record?.workflow_records?.review_approval, "approval_note")
          : currentAction === "director_review"
            ? readString(record?.workflow_records?.director_approval, "approval_note")
            : "",
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
    related_report_reference: readString(review, "related_report_reference"),
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

function getOptionLabel(
  value: string | null | undefined,
  options: Array<{ value: string; label: string }>,
): string {
  if (!value) {
    return "";
  }

  return (
    options.find((option) => option.value === value)?.label ??
    normalizeWorkflowCopy(value.replaceAll("_", " "))
  );
}

function getOptionLabels(
  values: string[],
  options: Array<{ value: string; label: string }>,
): string {
  return values
    .map((value) => getOptionLabel(value, options))
    .filter((value) => value !== "")
    .join(", ");
}

function formatMonthYear(month: string, year: string): string {
  if (!month && !year) {
    return "";
  }

  const monthLabel = getOptionLabel(month, monthOptions);

  if (monthLabel && year) {
    return `${monthLabel} ${year}`;
  }

  return monthLabel || year;
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

  const isInternalUser = isWorkflowUser(user?.role);
  const supportsSecureMessaging =
    user?.role === "verificator" || user?.role === "investigator";
  const canReadApprovalCommunication =
    view === "approval" &&
    [
      "supervisor_of_verificator",
      "supervisor_of_investigator",
      "director",
    ].includes(user?.role ?? "");
  const canOpenSecureMessaging = supportsSecureMessaging || canReadApprovalCommunication;
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

        if (error instanceof ApiError && error.status < 500) {
          setRecord(null);
          setActionState(buildActionState(null));
          setUsingFallback(false);
          setMessage(error.message);

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
  const selectedRelatedReport =
    record?.related_reports?.find(
      (item) => item.public_reference === actionState.related_report_reference,
    ) ?? null;
  const screeningRejected = readBoolean(record?.workflow_records?.screening, "reject_report");
  const verificationApprovalRecord = record?.workflow_records?.verification_approval;
  const investigationApprovalRecord = record?.workflow_records?.review_approval;
  const directorApprovalRecord = record?.workflow_records?.director_approval;
  const screeningNoteLabel = actionState.reject_report ? "Reason of Rejection" : "Distribution Note";
  const screeningNotePlaceholder = actionState.reject_report
    ? "Document why the report is rejected at initial screening."
    : "Document the screening rationale or delegation note.";
  const rejectedDecisionHelper =
    currentAction === "review_verification"
      ? "Return the case to the Verification Officer for revision based on the approval note."
      : "Return the case to the Investigator for revision based on the approval note.";

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

    const resolvedActionState = resolveNativeActionState(
      actionState,
      new FormData(event.currentTarget),
    );

    startTransition(async () => {
      try {
        if (currentAction === "delegate_verification") {
          await api.delegateVerification(token, record.id, {
            reject_report: resolvedActionState.reject_report,
            assignee_user_id:
              resolvedActionState.reject_report || resolvedActionState.assignee_user_id === ""
                ? undefined
                : Number(resolvedActionState.assignee_user_id),
            assigned_unit: resolvedActionState.assigned_unit || undefined,
            distribution_note: resolvedActionState.distribution_note || undefined,
          });
        }

        if (currentAction === "submit_verification") {
          await api.submitVerification(token, record.id, {
            summary: resolvedActionState.summary,
            corruption_aspect_tags: resolvedActionState.corruption_aspect_tags,
            has_authority: resolvedActionState.has_authority,
            criminal_assessment: resolvedActionState.criminal_assessment,
            reason: resolvedActionState.reason,
            recommendation: resolvedActionState.recommendation,
            forwarding_destination:
              resolvedActionState.recommendation === "forward"
                ? resolvedActionState.forwarding_destination
                : undefined,
          });
        }

        if (currentAction === "review_verification") {
          await api.reviewVerification(token, record.id, {
            decision: resolvedActionState.decision,
            approval_note: resolvedActionState.approval_note,
          });
        }

        if (currentAction === "delegate_investigation") {
          await api.delegateInvestigation(token, record.id, {
            assignee_user_id: Number(resolvedActionState.assignee_user_id),
            assigned_unit: resolvedActionState.assigned_unit || undefined,
            distribution_note: resolvedActionState.distribution_note || undefined,
          });
        }

        if (currentAction === "submit_investigation") {
          await api.submitInvestigation(token, record.id, {
            case_name: resolvedActionState.case_name,
            reported_parties: resolvedActionState.reported_parties,
            description: resolvedActionState.description,
            corruption_aspect_tags: resolvedActionState.corruption_aspect_tags,
            recommendation: resolvedActionState.recommendation,
            delict: resolvedActionState.delict,
            article: resolvedActionState.article,
            start_month: resolvedActionState.start_month,
            start_year: resolvedActionState.start_year,
            end_month: resolvedActionState.end_month,
            end_year: resolvedActionState.end_year,
            city: resolvedActionState.city,
            province: resolvedActionState.province,
            modus: resolvedActionState.modus,
            related_report_reference: resolvedActionState.related_report_reference || undefined,
            has_authority: resolvedActionState.has_authority,
            is_priority: resolvedActionState.is_priority,
            additional_information: resolvedActionState.additional_information || undefined,
            conclusion: resolvedActionState.conclusion,
          });
        }

        if (currentAction === "review_investigation") {
          await api.reviewInvestigation(token, record.id, {
            decision: resolvedActionState.decision,
            approval_note: resolvedActionState.approval_note,
          });
        }

        if (currentAction === "director_review") {
          await api.directorReview(token, record.id, {
            decision: resolvedActionState.decision,
            approval_note: resolvedActionState.approval_note,
          });
        }

        const destination = `${backPath}?notice=updated`;

        if (typeof window !== "undefined") {
          window.location.assign(destination);

          return;
        }

        router.push(destination);
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
  const linkedReviewReportReference = readString(reviewRecord, "related_report_reference");
  const linkedReviewReport =
    record.related_reports?.find(
      (item) => item.public_reference === linkedReviewReportReference,
    ) ?? null;

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

              <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-5">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                  Reporter
                </p>
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  {record.reporter.name ?? "Not available"}
                </p>
              </div>

              {renderAuditSnapshot("Screening Record", [
                ["Rejected", screeningRejected ? "Yes" : ""],
                [
                  screeningRejected ? "Reason of Rejection" : "Distribution Note",
                  readString(record.workflow_records?.screening, "distribution_note"),
                ],
              ])}

              {renderAuditSnapshot("Verification Record", [
                ["Summary", readString(verificationRecord, "summary")],
                [
                  "Corruption Tags",
                  getOptionLabels(
                    readStringArray(verificationRecord, "corruption_aspect_tags"),
                    governanceTagOptions,
                  ),
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
                  normalizeWorkflowCopy(
                    readString(verificationRecord, "criminal_assessment").replaceAll("_", " "),
                  ),
                ],
                [
                  "Recommendation",
                  getOptionLabel(
                    readString(verificationRecord, "recommendation"),
                    verificationRecommendationOptions,
                  ),
                ],
                ["Reason", readString(verificationRecord, "reason")],
                ["Forwarding Destination", readString(verificationRecord, "forwarding_destination")],
              ])}

              {renderAuditSnapshot("Verification Approval Record", [
                ["Decision", readString(verificationApprovalRecord, "decision").replaceAll("_", " ")],
                ["Approval Note", readString(verificationApprovalRecord, "approval_note")],
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
                    <div>
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                        Complaint Description
                      </p>
                      <p className="mt-2 text-sm leading-7">
                        {readString(reviewRecord, "description")}
                      </p>
                    </div>
                    <ReportedPartiesSummary
                      parties={readReportedParties(reviewRecord, "reported_parties", [])}
                      title="Reported Parties in Investigation"
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Corruption Tags
                        </p>
                        <p className="mt-2 text-sm">
                          {getOptionLabels(
                            readStringArray(reviewRecord, "corruption_aspect_tags"),
                            governanceTagOptions,
                          ) || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Recommendation
                        </p>
                        <p className="mt-2 text-sm">
                          {getOptionLabel(
                            readString(reviewRecord, "recommendation"),
                            reviewRecommendationOptions,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Delict
                        </p>
                        <p className="mt-2 text-sm">
                          {getOptionLabel(readString(reviewRecord, "delict"), delictOptions)}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Article
                        </p>
                        <p className="mt-2 text-sm">
                          {getOptionLabel(
                            readString(reviewRecord, "article"),
                            corruptionArticleOptions,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Authority
                        </p>
                        <p className="mt-2 text-sm">
                          {readBoolean(reviewRecord, "has_authority") ? "Yes" : "No"}
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
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Start of Incident
                        </p>
                        <p className="mt-2 text-sm">
                          {formatMonthYear(
                            readString(reviewRecord, "start_month"),
                            readString(reviewRecord, "start_year"),
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          End of Incident
                        </p>
                        <p className="mt-2 text-sm">
                          {formatMonthYear(
                            readString(reviewRecord, "end_month"),
                            readString(reviewRecord, "end_year"),
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Incident Location
                        </p>
                        <p className="mt-2 text-sm">
                          {[readString(reviewRecord, "city"), readString(reviewRecord, "province")]
                            .filter((value) => value !== "")
                            .join(", ")}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Related WBS Report
                        </p>
                        <p className="mt-2 text-sm">
                          {linkedReviewReportReference
                            ? linkedReviewReport
                              ? `${linkedReviewReportReference} · ${linkedReviewReport.title}`
                              : linkedReviewReportReference
                            : "Not linked"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                        Modus
                      </p>
                      <p className="mt-2 text-sm leading-7">
                        {readString(reviewRecord, "modus")}
                      </p>
                    </div>
                    {linkedReviewReport?.description ? (
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Related Report Description
                        </p>
                        <p className="mt-2 text-sm leading-7">
                          {linkedReviewReport.description}
                        </p>
                      </div>
                    ) : null}
                    {readString(reviewRecord, "additional_information") ? (
                      <div>
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                          Additional Information
                        </p>
                        <p className="mt-2 text-sm leading-7">
                          {readString(reviewRecord, "additional_information")}
                        </p>
                      </div>
                    ) : null}
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

              {renderAuditSnapshot("Investigation Approval Record", [
                ["Decision", readString(investigationApprovalRecord, "decision").replaceAll("_", " ")],
                ["Approval Note", readString(investigationApprovalRecord, "approval_note")],
              ])}

              {renderAuditSnapshot("Director Decision Record", [
                ["Decision", readString(directorApprovalRecord, "decision").replaceAll("_", " ")],
                ["Approval Note", readString(directorApprovalRecord, "approval_note")],
              ])}
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
        canOpenSecureMessaging ? (
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
                    name="reject_report"
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
                      name="assignee_user_id"
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
                  <span className="mb-2 block text-sm font-semibold">{screeningNoteLabel}</span>
                  <textarea
                    className="field min-h-32"
                    name="distribution_note"
                    value={actionState.distribution_note}
                    onChange={(event) =>
                      updateActionState("distribution_note", event.target.value)
                    }
                    placeholder={screeningNotePlaceholder}
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
                    name="summary"
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
                      name="has_authority"
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
                      name="criminal_assessment"
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
                    name="reason"
                    value={actionState.reason}
                    onChange={(event) => updateActionState("reason", event.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Recommendation</span>
                  <select
                    className="field"
                    name="recommendation"
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
                      name="forwarding_destination"
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
                    name="assignee_user_id"
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
                    name="distribution_note"
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
                    name="case_name"
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
                    name="description"
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
                      name="recommendation"
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
                      name="delict"
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
                      name="article"
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
                      name="start_month"
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
                      name="start_year"
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
                      name="end_month"
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
                      name="end_year"
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
                      name="city"
                      value={actionState.city}
                      onChange={(event) => updateActionState("city", event.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Province</span>
                    <input
                      className="field"
                      name="province"
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
                    name="modus"
                    value={actionState.modus}
                    onChange={(event) => updateActionState("modus", event.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Related WBS Report</span>
                  <select
                    className="field"
                    name="related_report_reference"
                    value={actionState.related_report_reference}
                    onChange={(event) =>
                      updateActionState("related_report_reference", event.target.value)
                    }
                  >
                    <option value="">Select a related report</option>
                    {(record.related_reports ?? []).map((item) => (
                      <option key={item.public_reference} value={item.public_reference}>
                        {item.public_reference} · {item.title}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedRelatedReport ? (
                  <div className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-4 text-sm leading-7 text-[var(--muted)]">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                      Related Complaint Description
                    </p>
                    <p className="mt-2 text-[var(--foreground)]">
                      {selectedRelatedReport.description || "No complaint description available."}
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Has Authority?</span>
                    <select
                      className="field"
                      name="has_authority"
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
                      name="is_priority"
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
                    name="additional_information"
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
                    name="conclusion"
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
                <fieldset className="block">
                  <legend className="mb-3 block text-sm font-semibold">Decision</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white px-4 py-4 text-sm text-[var(--foreground)]">
                      <input
                        type="radio"
                        name="decision"
                        value="rejected"
                        checked={actionState.decision === "rejected"}
                        onChange={(event) =>
                          updateActionState(
                            "decision",
                            event.target.value as ActionState["decision"],
                          )
                        }
                      />
                      <span>
                        <span className="block font-semibold">Rejected</span>
                        <span className="mt-1 block text-[var(--muted)]">
                          {rejectedDecisionHelper}
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white px-4 py-4 text-sm text-[var(--foreground)]">
                      <input
                        type="radio"
                        name="decision"
                        value="approved"
                        checked={actionState.decision === "approved"}
                        onChange={(event) =>
                          updateActionState(
                            "decision",
                            event.target.value as ActionState["decision"],
                          )
                        }
                      />
                      <span>
                        <span className="block font-semibold">Approved</span>
                        <span className="mt-1 block text-[var(--muted)]">
                          Allow the case to continue to the next workflow outcome.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Approval Note</span>
                  <textarea
                    className="field min-h-32"
                    name="approval_note"
                    value={actionState.approval_note}
                    onChange={(event) =>
                      updateActionState("approval_note", event.target.value)
                    }
                    required
                  />
                </label>
              </>
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
          <div className="mt-6 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76">
            <div className="p-5 text-sm leading-7 text-[var(--muted)]">
              No workflow action is currently available for this case in the selected menu.
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--panel-border)] px-5 py-4">
              <button
                type="button"
                className="ghost-button"
                onClick={() => router.push(backPath)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
