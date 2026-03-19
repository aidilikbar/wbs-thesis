"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { demoGovernanceDashboard } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";
import { isInternalRole } from "@/lib/roles";
import type { GovernanceDashboardData } from "@/lib/types";

const metricLabels: Record<string, string> = {
  total_reports: "Total reports",
  open_cases: "Open cases",
  completed_cases: "Completed cases",
  confidential_share: "Confidential share",
  overdue_cases: "Overdue cases",
  average_triage_hours: "Avg triage hours",
  verification_queue: "Verification queue",
  investigation_queue: "Investigation queue",
  director_review_queue: "Director review queue",
};

export function GovernanceDashboard() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [dashboard, setDashboard] =
    useState<GovernanceDashboardData>(demoGovernanceDashboard);
  const [usingFallback, setUsingFallback] = useState(true);

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
          setUsingFallback(false);
        }
      } catch {
        if (active) {
          setDashboard(demoGovernanceDashboard);
          setUsingFallback(true);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [token, isInternalUser]);

  if (!isReady) {
    return (
      <div className="panel rounded-[2rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading governance session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isInternalUser) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Restricted Oversight</p>
          <h2 className="mt-4 text-3xl">Internal role access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            Governance analytics are restricted to internal KPK workflow roles.
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
          <p className="eyebrow">Oversight Scope</p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
            <li>The dashboard summarizes queue pressure, confidentiality posture, and timeliness.</li>
            <li>Recent audit events expose operational evidence for governance analysis.</li>
            <li>Reporter accounts do not have access to internal governance metrics.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {usingFallback ? (
        <p className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-900">
          Backend unavailable. Showing seeded governance metrics for review.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(dashboard.metrics).map(([key, value]) => (
          <article key={key} className="panel rounded-[1.6rem] p-6">
            <p className="eyebrow">{metricLabels[key] ?? key}</p>
            <p className="metric-value mt-4">
              {key === "confidential_share" ? `${value}%` : value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel rounded-[2rem] p-7">
          <p className="eyebrow">Risk Distribution</p>
          <div className="mt-5 space-y-4">
            {dashboard.risk_distribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-white/70">
                  <div
                    className="h-3 rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(item.value * 18, 16)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="eyebrow mt-8">Case Status Breakdown</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {dashboard.status_breakdown.map((item) => (
              <div
                key={item.label}
                className="rounded-full border border-[var(--panel-border)] bg-white/60 px-4 py-2 text-sm"
              >
                {item.label}: {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[2rem] p-7">
          <p className="eyebrow">Governance Controls</p>
          <h2 className="mt-3 text-3xl">Operationalized control statements</h2>
          <div className="mt-6 grid gap-4">
            {dashboard.controls.map((control) => (
              <article
                key={control.code}
                className="rounded-[1.6rem] border border-[var(--panel-border)] bg-white/60 p-5"
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
                  {control.description}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-[var(--surface-soft)]/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Owner
                    </p>
                    <p className="mt-2 text-sm">{control.owner_role}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[var(--surface-soft)]/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Metric
                    </p>
                    <p className="mt-2 text-sm">
                      {control.current_metric ?? "Not configured"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-7">
        <p className="eyebrow">Recent Audit Events</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {dashboard.recent_audit_logs.map((log) => (
            <article
              key={`${log.action}-${log.happened_at}`}
              className="rounded-[1.4rem] border border-[var(--panel-border)] bg-white/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge value={log.action} label={log.action.replaceAll("_", " ")} />
                <p className="text-sm text-[var(--muted)]">
                  {formatDateTime(log.happened_at)}
                </p>
              </div>
              <p className="mt-4 text-lg">
                {log.actor_name ?? "System"} · {log.actor_role}
              </p>
              <p className="muted mt-3 text-sm leading-7">
                {Object.entries(log.context)
                  .map(([key, value]) => `${key}: ${String(value)}`)
                  .join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
