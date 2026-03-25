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
  confidential_share: "Anonymous share",
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
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading governance session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isInternalUser) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Oversight</p>
          <h2 className="mt-4 text-3xl">Internal role access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            Governance analytics are restricted to internal KPK workflow roles.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Oversight Scope
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
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
        <p className="inline-flex rounded-[0.45rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-2 text-sm text-[var(--secondary-strong)]">
          Backend unavailable. Showing seeded governance metrics for review.
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
        <div className="panel rounded-[1rem] p-7">
          <p className="eyebrow">Control Posture</p>
          <h2 className="mt-3 text-4xl">Governed case operations</h2>
          <p className="muted mt-4 max-w-3xl text-sm leading-7">
            Oversight combines throughput, queue segregation, confidentiality discipline, and auditable control execution across the full KPK whistleblowing process.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="signal-card rounded-[0.85rem] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Open cases
              </p>
              <p className="mt-3 font-display text-5xl">{dashboard.metrics.open_cases}</p>
            </article>
            <article className="accent-card rounded-[0.85rem] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Confidential share
              </p>
              <p className="mt-3 font-display text-5xl">
                {dashboard.metrics.confidential_share}%
              </p>
            </article>
            <article className="outline-panel rounded-[0.85rem] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Avg triage hours
              </p>
              <p className="mt-3 font-display text-5xl">
                {dashboard.metrics.average_triage_hours}
              </p>
            </article>
          </div>
        </div>

        <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Mandated Safeguards
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                Role segregation
              </p>
              <p className="mt-2 text-sm leading-7 text-white/88">
                Reporter, verification, investigation, director review, and administration remain segregated by explicit role ownership.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                Audit visibility
              </p>
              <p className="mt-2 text-sm leading-7 text-white/88">
                Every transition generates operational evidence to support governance assessment and thesis analysis.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                Timeliness
              </p>
              <p className="mt-2 text-sm leading-7 text-white/88">
                Queue metrics expose pressure points across verification, investigation, and director approval stages.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(dashboard.metrics).map(([key, value]) => (
          <article key={key} className="panel rounded-[0.9rem] p-6">
            <p className="eyebrow">{metricLabels[key] ?? key}</p>
            <p className="metric-value mt-4">
              {key === "confidential_share" ? `${value}%` : value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="panel rounded-[1rem] p-7">
          <p className="eyebrow">Risk Distribution</p>
          <div className="mt-5 space-y-4">
            {dashboard.risk_distribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="mt-2 h-3 rounded-[999px] bg-white/70">
                  <div
                    className="h-3 rounded-[999px] bg-[var(--primary)]"
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
                className="rounded-[0.45rem] border border-[var(--panel-border)] bg-white/60 px-4 py-2 text-sm"
              >
                {item.label}: {item.value}
              </div>
            ))}
          </div>
        </div>

        <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Queue Pressure
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[0.8rem] border border-white/10 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                Verification queue
              </p>
              <p className="mt-2 font-display text-4xl text-white">
                {dashboard.metrics.verification_queue}
              </p>
            </div>
            <div className="rounded-[0.8rem] border border-white/10 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                Investigation queue
              </p>
              <p className="mt-2 font-display text-4xl text-white">
                {dashboard.metrics.investigation_queue}
              </p>
            </div>
            <div className="rounded-[0.8rem] border border-white/10 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                Director review queue
              </p>
              <p className="mt-2 font-display text-4xl text-white">
                {dashboard.metrics.director_review_queue}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel rounded-[1rem] p-7">
        <p className="eyebrow">Governance Controls</p>
        <h2 className="mt-3 text-3xl">Operationalized control statements</h2>
        <div className="mt-6 grid gap-4">
          {dashboard.controls.map((control) => (
            <article
              key={control.code}
              className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/60 p-5"
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="outline-panel rounded-[0.75rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Owner
                  </p>
                  <p className="mt-2 text-sm">{control.owner_role}</p>
                </div>
                <div className="outline-panel rounded-[0.75rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Current metric
                  </p>
                  <p className="mt-2 text-sm">{control.current_metric ?? "Not configured"}</p>
                </div>
                <div className="outline-panel rounded-[0.75rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Target metric
                  </p>
                  <p className="mt-2 text-sm">{control.target_metric ?? "Not configured"}</p>
                </div>
                <div className="outline-panel rounded-[0.75rem] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Notes
                  </p>
                  <p className="mt-2 text-sm">{control.notes ?? "No notes recorded"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel rounded-[1rem] p-7">
        <p className="eyebrow">Recent Audit Events</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {dashboard.recent_audit_logs.map((log) => (
            <article
              key={`${log.action}-${log.happened_at}`}
              className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/60 p-5"
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
