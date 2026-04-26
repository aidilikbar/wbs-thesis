"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getRoleLabel, normalizeWorkflowCopy } from "@/lib/labels";
import { isInternalRole, isWorkflowUser } from "@/lib/roles";
import type {
  GovernanceActionItem,
  GovernanceAuditorCaseRow,
  GovernanceDashboardData,
  GovernancePhaseKpiSummary,
  GovernanceMetricCard,
  GovernanceScopeRow,
} from "@/lib/types";

const scopeRowsPerPage = 10;
const auditorCaseRowsPerPage = 10;

function metricToneClasses(tone: GovernanceMetricCard["tone"]) {
  if (tone === "critical") {
    return "border-[rgba(239,47,39,0.22)] bg-[rgba(239,47,39,0.08)]";
  }

  if (tone === "warning") {
    return "border-[rgba(197,160,34,0.28)] bg-[rgba(197,160,34,0.12)]";
  }

  return "border-[var(--panel-border)] bg-white/72";
}

function actionToneClasses(tone: GovernanceActionItem["tone"]) {
  if (tone === "critical") {
    return "border-[rgba(239,47,39,0.24)] bg-[rgba(239,47,39,0.08)]";
  }

  if (tone === "warning") {
    return "border-[rgba(197,160,34,0.3)] bg-[rgba(197,160,34,0.12)]";
  }

  return "border-[var(--panel-border)] bg-white/76";
}

function scopeRowMatches(row: GovernanceScopeRow, term: string) {
  const needle = term.trim().toLowerCase();

  if (needle.length === 0) {
    return true;
  }

  return [row.subject_label, getRoleLabel(row.role, row.role_label), row.unit]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function auditorCaseRowMatches(row: GovernanceAuditorCaseRow, term: string) {
  const needle = term.trim().toLowerCase();

  if (needle.length === 0) {
    return true;
  }

  return [
    row.audit_case_id,
    row.stage_label,
    row.status,
    getRoleLabel(row.current_role, row.current_role_label),
    row.assigned_unit,
    row.sla_status_label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function formatHours(value?: number | null) {
  const safeValue =
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  const normalized = Number.isInteger(safeValue)
    ? safeValue.toFixed(0)
    : safeValue.toFixed(1);

  return `${normalized.replace(/\.0$/, "")} h`;
}

function kpiBarToneClasses(tone: GovernanceMetricCard["tone"]) {
  if (tone === "critical") {
    return "bg-[var(--primary)]";
  }

  if (tone === "warning") {
    return "bg-[var(--secondary)]";
  }

  return "bg-[#2f8f46]";
}

function slaToneClasses(tone: GovernanceMetricCard["tone"]) {
  if (tone === "critical") {
    return "border-[rgba(239,47,39,0.24)] bg-[rgba(239,47,39,0.1)] text-[var(--primary)]";
  }

  if (tone === "warning") {
    return "border-[rgba(197,160,34,0.28)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]";
  }

  return "border-[rgba(47,143,70,0.24)] bg-[rgba(47,143,70,0.1)] text-[#25673a]";
}

function renderKpiCell(kpi: GovernancePhaseKpiSummary | null) {
  if (!kpi) {
    return (
      <div className="rounded-[0.85rem] border border-dashed border-[var(--panel-border)] px-4 py-4 text-sm text-[var(--muted)]">
        Not applicable in this role scope.
      </div>
    );
  }

  return (
    <div className="min-w-[280px] rounded-[0.9rem] border border-[var(--panel-border)] bg-white/76 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {kpi.label}
          </p>
          <p className="mt-2 text-sm leading-6">
            {kpi.focus_case_number ? (
              <>
                <span className="font-semibold">{kpi.focus_case_number}</span>
                <span className="muted"> · {kpi.focus_status === "completed" ? "Completed" : "In progress"}</span>
              </>
            ) : (
              "No case selected"
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Target
          </p>
          <p className="mt-2 text-lg font-semibold">{formatHours(kpi.budget_hours)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Focus case elapsed</span>
          <span className="font-semibold">
            {formatHours(kpi.focus_elapsed_working_hours)} / {formatHours(kpi.budget_hours)}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[rgba(19,19,19,0.08)]">
          <div
            className={`h-3 rounded-full ${kpiBarToneClasses(kpi.tone)}`}
            style={{
              width: `${Math.max(
                Math.min(kpi.focus_utilization_percent, 100),
                kpi.focus_utilization_percent > 0 ? 6 : 0,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
        <p>{kpi.active_case_count} active</p>
        <p>{kpi.completed_case_count} completed</p>
        <p>{kpi.at_risk_case_count} at risk</p>
        <p>{kpi.overdue_case_count} overdue</p>
      </div>

      <div className="mt-4 space-y-2">
        {kpi.substeps.map((step) => (
          <div key={step.key}>
            <div className="flex items-center justify-between gap-3 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--muted)]">
              <span>{step.label}</span>
              <span>
                {formatHours(step.elapsed_working_hours)} / {formatHours(step.budget_hours)}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(19,19,19,0.08)]">
              <div
                className={`h-2 rounded-full ${
                  step.status === "pending"
                    ? "bg-[rgba(19,19,19,0.14)]"
                    : kpiBarToneClasses(step.tone)
                }`}
                style={{
                  width: `${Math.max(
                    Math.min(step.utilization_percent, 100),
                    step.status === "pending"
                      ? 0
                      : step.utilization_percent > 0
                        ? 6
                        : 0,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Average cycle: {formatHours(kpi.average_elapsed_working_hours)}
      </p>
    </div>
  );
}

export function GovernanceDashboard() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [dashboard, setDashboard] =
    useState<GovernanceDashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopePage, setScopePage] = useState(1);
  const [caseSearch, setCaseSearch] = useState("");
  const [casePage, setCasePage] = useState(1);

  const isInternalUser = isInternalRole(user?.role);

  useEffect(() => {
    if (!token || !isInternalUser) {
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const data = await api.fetchGovernanceDashboard(token);

        if (active) {
          setDashboard(data);
          setLoadError(null);
        }
      } catch (error) {
        if (active) {
          setDashboard(null);
          setLoadError(
            error instanceof ApiError
              ? error.message
              : "The governance dashboard could not be loaded. Try again when the backend is available.",
          );
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [token, isInternalUser, user?.role]);

  if (!isReady) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading governance session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isInternalUser) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Governance</p>
          <h2 className="mt-4 text-3xl">Internal role access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            Governance and integrity indicators are available only to internal KPK roles.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Intended Use
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Use global data to understand queue pressure and control posture.</li>
            <li>Use role-specific KPIs to identify the next internal action.</li>
            <li>Use scope data to follow up on subordinate workload where hierarchy applies.</li>
          </ul>
        </aside>
      </div>
    );
  }

  if (!dashboard && loadError) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="eyebrow">Governance Unavailable</p>
        <h2 className="mt-4 text-3xl">The governance dashboard could not be loaded</h2>
        <p className="muted mt-4 text-sm leading-7">{loadError}</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading governance dashboard.</p>
      </div>
    );
  }

  const filteredScopeRows = dashboard.specific.scope_rows
    .filter((row) => scopeRowMatches(row, scopeSearch))
    .sort((left, right) => {
      const leftTimestamp = left.last_activity_at
        ? new Date(left.last_activity_at).getTime()
        : 0;
      const rightTimestamp = right.last_activity_at
        ? new Date(right.last_activity_at).getTime()
        : 0;

      if (rightTimestamp !== leftTimestamp) {
        return rightTimestamp - leftTimestamp;
      }

      return left.subject_label.localeCompare(right.subject_label);
    });
  const totalScopePages = Math.max(
    1,
    Math.ceil(filteredScopeRows.length / scopeRowsPerPage),
  );
  const currentScopePage = Math.min(scopePage, totalScopePages);
  const paginatedScopeRows = filteredScopeRows.slice(
    (currentScopePage - 1) * scopeRowsPerPage,
    currentScopePage * scopeRowsPerPage,
  );
  const scopeFrom =
    filteredScopeRows.length === 0
      ? 0
      : (currentScopePage - 1) * scopeRowsPerPage + 1;
  const scopeTo = Math.min(
    currentScopePage * scopeRowsPerPage,
    filteredScopeRows.length,
  );
  const filteredCaseRows = (dashboard.specific.case_rows ?? [])
    .filter((row) => auditorCaseRowMatches(row, caseSearch))
    .sort((left, right) => {
      const leftTimestamp = left.last_activity_at
        ? new Date(left.last_activity_at).getTime()
        : 0;
      const rightTimestamp = right.last_activity_at
        ? new Date(right.last_activity_at).getTime()
        : 0;

      if (rightTimestamp !== leftTimestamp) {
        return rightTimestamp - leftTimestamp;
      }

      return left.audit_case_id.localeCompare(right.audit_case_id);
    });
  const totalCasePages = Math.max(
    1,
    Math.ceil(filteredCaseRows.length / auditorCaseRowsPerPage),
  );
  const currentCasePage = Math.min(casePage, totalCasePages);
  const paginatedCaseRows = filteredCaseRows.slice(
    (currentCasePage - 1) * auditorCaseRowsPerPage,
    currentCasePage * auditorCaseRowsPerPage,
  );
  const caseFrom =
    filteredCaseRows.length === 0
      ? 0
      : (currentCasePage - 1) * auditorCaseRowsPerPage + 1;
  const caseTo = Math.min(
    currentCasePage * auditorCaseRowsPerPage,
    filteredCaseRows.length,
  );

  return (
    <div className="space-y-6">
      <section className="panel rounded-[1rem] p-8">
        <div className="grid gap-6 xl:grid-cols-[0.52fr_0.48fr]">
          <div>
            <p className="eyebrow">Global Governance Picture</p>
            <h2 className="mt-4 text-4xl">Act from live queue and integrity signals</h2>
            <p className="muted mt-4 max-w-3xl text-sm leading-7">
              The global section shows the condition of the whistleblowing system as a
              whole. The specific section below narrows that data into your own workload
              and, where applicable, the workload of your subordinate scope.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboard.global.metrics.map((metric) => (
              <article
                key={metric.label}
                className={`rounded-[0.9rem] border p-5 ${metricToneClasses(metric.tone)}`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {metric.label}
                </p>
                <p className="metric-value-governance mt-4">{metric.value}</p>
                <p className="muted mt-3 text-sm leading-6">
                  {normalizeWorkflowCopy(metric.detail)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
        <div className="panel rounded-[1rem] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Global Queues</p>
              <h2 className="mt-4 text-3xl">Current workflow pressure</h2>
            </div>
            {isWorkflowUser(user?.role) ? (
              <Link href="/workflow" className="ghost-button">
                Open Workflow
              </Link>
            ) : (
              <span className="rounded-[0.8rem] border border-[var(--panel-border)] bg-white/72 px-4 py-3 text-sm text-[var(--muted)]">
                Read-only monitoring
              </span>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.global.queue_snapshot.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-white/70">
                  <div
                    className="h-3 rounded-full bg-[var(--primary)]"
                    style={{
                      width: `${Math.max(
                        Math.min(item.value * 14, 100),
                        item.value > 0 ? 12 : 0,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="panel rounded-[1rem] p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Immediate Global Actions</p>
              <h2 className="mt-4 text-3xl">Where the system needs attention</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.global.action_items.map((item) => (
              <article
                key={item.title}
                className={`rounded-[0.9rem] border p-5 ${actionToneClasses(item.tone)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl">{normalizeWorkflowCopy(item.title)}</h3>
                    <p className="muted mt-3 text-sm leading-6">
                      {normalizeWorkflowCopy(item.detail)}
                    </p>
                  </div>
                  <div className="rounded-[0.7rem] bg-white px-4 py-3 text-right">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Count
                    </p>
                    <p className="mt-1 text-3xl font-semibold">{item.count}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={item.href} className="ghost-button">
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Specific KPIs</p>
          <h2 className="mt-4 text-4xl">
            {getRoleLabel(dashboard.specific.role, dashboard.specific.role_label)} action board
          </h2>
          <p className="muted mt-4 text-sm leading-7">
            {normalizeWorkflowCopy(dashboard.specific.scope_label)}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {dashboard.specific.metrics.map((metric) => (
              <article
                key={metric.label}
                className={`rounded-[0.9rem] border p-5 ${metricToneClasses(metric.tone)}`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {metric.label}
                </p>
                <p className="metric-value-governance mt-4">{metric.value}</p>
                <p className="muted mt-3 text-sm leading-6">
                  {normalizeWorkflowCopy(metric.detail)}
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Role-Scoped Next Actions
          </p>
          <div className="mt-6 space-y-4">
            {dashboard.specific.action_items.map((item) => (
              <article
                key={item.title}
                className="rounded-[0.9rem] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg text-white">
                      {normalizeWorkflowCopy(item.title)}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/72">
                      {normalizeWorkflowCopy(item.detail)}
                    </p>
                  </div>
                  <span
                    className={`rounded-[0.7rem] px-3 py-2 text-sm font-semibold ${
                      item.tone === "critical"
                        ? "bg-[rgba(239,47,39,0.18)] text-white"
                        : item.tone === "warning"
                          ? "bg-[rgba(197,160,34,0.18)] text-[var(--secondary)]"
                          : "bg-white/12 text-white"
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
                <div className="mt-4">
                  <Link href={item.href} className="ghost-button-on-dark">
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {dashboard.specific.case_rows?.length ? "Case Monitoring" : "Specific Scope"}
            </p>
            <h2 className="mt-4 text-3xl">
              {dashboard.specific.case_rows?.length
                ? "Case KPI and SLA table"
                : "Operational KPI table"}
            </h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
              Total rows
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {dashboard.specific.case_rows?.length ?? dashboard.specific.scope_rows.length}
            </p>
          </div>
        </div>

        {dashboard.specific.case_rows?.length ? (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Search case monitor</span>
                <input
                  className="field"
                  value={caseSearch}
                  onChange={(event) => {
                    setCaseSearch(event.target.value);
                    setCasePage(1);
                  }}
                  placeholder="Search case number, stage, role, unit, or SLA"
                />
              </label>
              <div className="outline-panel rounded-[0.85rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Auditor boundary
                </p>
                <p className="mt-3 text-sm leading-6">
                  Auditor sees case numbers, stage timestamps, assigned role or unit, KPI
                  utilization, and audit metadata only. Complaint content,
                  whistleblower identity, evidence, and internal notes remain hidden.
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Case
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Workflow state
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Assigned scope
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Verification time
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Investigation time
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Stage timestamps
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      SLA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCaseRows.length > 0 ? (
                    paginatedCaseRows.map((row) => (
                      <tr key={row.audit_case_id} className="align-top">
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <p className="font-semibold">{row.audit_case_id}</p>
                          <p className="muted mt-2 text-sm">
                            Submitted{" "}
                            {row.submitted_at ? formatDateTime(row.submitted_at) : "not recorded"}
                          </p>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <p className="font-semibold">{row.stage_label}</p>
                          <p className="muted mt-2 text-sm">
                            Status: {normalizeWorkflowCopy(row.status ?? "unknown")}
                          </p>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <p>{getRoleLabel(row.current_role, row.current_role_label)}</p>
                          <p className="muted mt-2 text-sm">
                            {row.assigned_unit ?? "Unit not set"}
                          </p>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          {renderKpiCell(row.verification_kpi)}
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          {renderKpiCell(row.investigation_kpi)}
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <div className="space-y-2 text-sm text-[var(--muted)]">
                            <p>
                              Verification start:{" "}
                              {row.verification_started_at
                                ? formatDateTime(row.verification_started_at)
                                : "Not reached"}
                            </p>
                            <p>
                              Verification close:{" "}
                              {row.verification_completed_at
                                ? formatDateTime(row.verification_completed_at)
                                : "Not reached"}
                            </p>
                            <p>
                              Investigation start:{" "}
                              {row.investigation_started_at
                                ? formatDateTime(row.investigation_started_at)
                                : "Not reached"}
                            </p>
                            <p>
                              Investigation close:{" "}
                              {row.investigation_completed_at
                                ? formatDateTime(row.investigation_completed_at)
                                : "Not reached"}
                            </p>
                            <p>
                              Director decision:{" "}
                              {row.director_decided_at
                                ? formatDateTime(row.director_decided_at)
                                : "Not reached"}
                            </p>
                            <p>
                              Last activity:{" "}
                              {row.last_activity_at
                                ? formatDateTime(row.last_activity_at)
                                : "No recent activity"}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <span
                            className={`inline-flex rounded-[0.75rem] border px-3 py-2 text-sm font-semibold ${slaToneClasses(row.sla_tone)}`}
                          >
                            {row.sla_status_label}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-sm leading-7 text-[var(--muted)]"
                      >
                        No case rows match the current search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--panel-border)] pt-5">
              <p className="text-sm text-[var(--muted)]">
                Showing {caseFrom} to {caseTo} of {filteredCaseRows.length} case rows
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Page {currentCasePage} of {totalCasePages}
                </span>
                <button
                  type="button"
                  onClick={() => setCasePage((current) => Math.max(current - 1, 1))}
                  disabled={currentCasePage <= 1}
                  className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCasePage((current) =>
                      Math.min(current + 1, totalCasePages),
                    )
                  }
                  disabled={currentCasePage >= totalCasePages}
                  className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : dashboard.specific.scope_rows.length > 0 ? (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Search scope</span>
                <input
                  className="field"
                  value={scopeSearch}
                  onChange={(event) => {
                    setScopeSearch(event.target.value);
                    setScopePage(1);
                  }}
                  placeholder="Search name, role, or unit"
                />
              </label>
              <div className="outline-panel rounded-[0.85rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Scope rule
                </p>
                <p className="mt-3 text-sm leading-6">
                  {getRoleLabel(
                    dashboard.specific.role,
                    dashboard.specific.role_label,
                  )}{" "}
                  sees only the users that fall inside the configured hierarchy scope.
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Subject
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Role
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Verification time
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Investigation time
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Scope summary
                    </th>
                    <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                      Last activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedScopeRows.length > 0 ? (
                    paginatedScopeRows.map((row) => (
                      <tr key={`${row.role}-${row.subject_label}`} className="align-top">
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <p className="font-semibold">{row.subject_label}</p>
                          <p className="muted mt-2 text-sm">{row.unit ?? "Unit not set"}</p>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <p>{getRoleLabel(row.role, row.role_label)}</p>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          {renderKpiCell(row.verification_kpi)}
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          {renderKpiCell(row.investigation_kpi)}
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="font-semibold">{row.open_cases}</span> open
                            </p>
                            <p>
                              <span className="font-semibold">{row.pending_queue}</span> queue
                            </p>
                            <p>
                              <span className="font-semibold">{row.pending_approvals}</span>{" "}
                              approvals
                            </p>
                            <p>
                              <span className="font-semibold">{row.overdue_cases}</span> overdue
                            </p>
                            <p>
                              <span className="font-semibold">{row.completed_cases}</span>{" "}
                              completed
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4 text-sm text-[var(--muted)]">
                          {row.last_activity_at
                            ? formatDateTime(row.last_activity_at)
                            : "No recent activity"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-sm leading-7 text-[var(--muted)]"
                      >
                        No scope rows match the current search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--panel-border)] pt-5">
              <p className="text-sm text-[var(--muted)]">
                Showing {scopeFrom} to {scopeTo} of {filteredScopeRows.length} scope rows
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Page {currentScopePage} of {totalScopePages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setScopePage((current) => Math.max(current - 1, 1))
                  }
                  disabled={currentScopePage <= 1}
                  className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScopePage((current) =>
                      Math.min(current + 1, totalScopePages),
                    )
                  }
                  disabled={currentScopePage >= totalScopePages}
                  className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-5 text-sm leading-7 text-[var(--muted)]">
            This role does not use a subordinate KPI table. The key actions for this
            account are shown in the specific KPI and action sections above.
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Control Integrity</p>
          <h2 className="mt-4 text-3xl">Controls to monitor</h2>
          <div className="mt-6 grid gap-4">
            {dashboard.global.controls.map((control) => (
              <article
                key={control.code}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {control.code}
                    </p>
                    <h3 className="mt-2 text-2xl">{control.name}</h3>
                  </div>
                  <StatusBadge value={control.status} />
                </div>
                <p className="muted mt-4 text-sm leading-7">
                  {normalizeWorkflowCopy(control.description)}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="outline-panel rounded-[0.75rem] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Owner
                    </p>
                    <p className="mt-2 text-sm">
                      {normalizeWorkflowCopy(control.owner_role)}
                    </p>
                  </div>
                  <div className="outline-panel rounded-[0.75rem] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Current metric
                    </p>
                    <p className="mt-2 text-sm">
                      {control.current_metric ?? "Not configured"}
                    </p>
                  </div>
                  <div className="outline-panel rounded-[0.75rem] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Target
                    </p>
                    <p className="mt-2 text-sm">
                      {control.target_metric ?? "Not configured"}
                    </p>
                  </div>
                </div>
                {control.notes ? (
                  <p className="muted mt-4 text-sm leading-6">
                    {normalizeWorkflowCopy(control.notes)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <aside className="panel rounded-[1rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Recent Audit Events</p>
              <h2 className="mt-4 text-3xl">Operational evidence trail</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.global.recent_audit_logs.map((log) => (
              <article
                key={log.id}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/72 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge value={log.action} />
                  <p className="text-sm text-[var(--muted)]">
                    {formatDateTime(log.happened_at)}
                  </p>
                </div>
                <p className="mt-4 text-lg">
                  {log.actor_name
                    ? `${log.actor_name} · ${getRoleLabel(log.actor_role)}`
                    : getRoleLabel(log.actor_role)}
                </p>
                <p className="muted mt-3 text-sm leading-6">
                  {Object.keys(log.context).length > 0
                    ? Object.entries(log.context)
                        .slice(0, 3)
                        .map(
                          ([key, value]) =>
                            `${key.replaceAll("_", " ")}: ${normalizeWorkflowCopy(String(value))}`,
                        )
                        .join(" · ")
                    : "Metadata-only audit event."}
                </p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
