import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  architectureLayers,
  landingStats,
  moduleCards,
  oversightPillars,
} from "@/lib/demo-data";

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="panel rounded-[2rem] p-8 sm:p-10">
          <p className="eyebrow">KPK Whistleblowing System</p>
          <h1 className="mt-5 max-w-3xl text-5xl leading-none sm:text-6xl">
            Secure reporting, protected case tracking, and accountable
            governance oversight.
          </h1>
          <p className="muted mt-6 max-w-2xl text-lg leading-8">
            KPK Whistleblowing System supports confidential disclosure intake,
            structured triage, investigator coordination, and management
            oversight through a single institutional workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-90"
            >
              Submit a report
            </Link>
            <Link
              href="/track"
              className="rounded-full border border-[var(--panel-border)] bg-white/60 px-5 py-3 text-sm font-semibold transition hover:bg-white"
            >
              Track a case
            </Link>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Core Commitments</p>
            <StatusBadge value="active" />
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Public Flow
              </p>
              <p className="mt-2 text-lg leading-8">
                Anonymous or identified intake with protected tracking tokens.
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Internal Flow
              </p>
              <p className="mt-2 text-lg leading-8">
                Investigator queue, assignment, escalation, and audit logging.
              </p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Governance Flow
              </p>
              <p className="mt-2 text-lg leading-8">
                Control monitoring for anonymity, SLA, segregation, and trail
                completeness.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {landingStats.map((stat) => (
          <article key={stat.label} className="panel rounded-[1.6rem] p-6">
            <p className="eyebrow">{stat.label}</p>
            <p className="metric-value mt-4">{stat.value}</p>
            <p className="muted mt-4 text-sm leading-7">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Operational Modules</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">
              Modular screens aligned to stakeholder responsibilities
            </h2>
          </div>
          <p className="muted max-w-xl text-sm leading-7">
            Each module can evolve independently while staying governed through
            shared case, audit, and control data.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {moduleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="panel rounded-[1.7rem] p-6 transition hover:-translate-y-1"
            >
              <p className="eyebrow">{card.kicker}</p>
              <h3 className="mt-4 text-2xl">{card.title}</h3>
              <p className="muted mt-4 text-sm leading-7">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Service Layers</p>
          <h2 className="mt-4 text-3xl">Split by concern, joined by governance</h2>
          <div className="mt-6 space-y-5">
            {architectureLayers.map((layer) => (
              <div key={layer.title} className="rounded-[1.4rem] bg-white/55 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  {layer.kicker}
                </p>
                <h3 className="mt-2 text-2xl">{layer.title}</h3>
                <p className="muted mt-3 text-sm leading-7">{layer.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Governance Commitments</p>
          <h2 className="mt-4 text-3xl">
            Institutional controls that structure the reporting process
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {oversightPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--surface-soft)]/70 p-5"
              >
                <p className="eyebrow">{pillar.kicker}</p>
                <h3 className="mt-3 text-2xl">{pillar.title}</h3>
                <p className="muted mt-3 text-sm leading-7">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
