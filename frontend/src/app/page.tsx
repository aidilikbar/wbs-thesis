import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  architectureLayers,
  landingStats,
  moduleCards,
  oversightPillars,
  processSteps,
  roleCards,
} from "@/lib/demo-data";

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <p className="eyebrow">Official Integrity Portal</p>
          <h1 className="max-w-4xl text-[clamp(3.3rem,8vw,6.4rem)]">
            The Guardian&apos;s Archive:
            <span className="block text-[var(--primary)]">Governed Confidentiality.</span>
          </h1>
          <p className="max-w-2xl text-xl leading-9 text-[var(--muted)]">
            A governance-oriented whistleblowing prototype aligned to the KPK business process,
            with reporter registration, role-separated workflow, public-safe tracking, and auditable oversight.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="primary-button">
              File a New Report
            </Link>
            <Link href="/track" className="secondary-button">
              Check Report Status
            </Link>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-[1.2rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(216,203,192,0.8),rgba(239,47,39,0.18))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.62),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.24),transparent_48%)]" />
          <div className="absolute right-8 top-8 max-w-[15rem] rounded-[0.8rem] bg-white/84 px-5 py-4 shadow-[0_20px_40px_rgba(19,19,19,0.08)]">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--primary)]">
              Confidential Access
            </p>
            <p className="mt-3 text-5xl font-black leading-none">7</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Role-separated actors in the adjusted process
            </p>
          </div>
          <div className="absolute bottom-8 left-8 max-w-[18rem] rounded-[0.9rem] border-l-[3px] border-[var(--secondary)] bg-white/94 px-6 py-5 shadow-[0_24px_50px_rgba(19,19,19,0.12)]">
            <p className="text-5xl font-black leading-none">100%</p>
            <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[var(--muted)]">
              Registered reporter gate enforced before submission
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        {landingStats.map((stat, index) => (
          <article
            key={stat.label}
            className={`panel rounded-[1rem] p-6 ${
              index === 1 ? "border-t-[3px] border-t-[var(--secondary)]" : ""
            } ${index === 3 ? "border-l-[3px] border-l-[var(--primary)]" : ""}`}
          >
            <p className="eyebrow">{stat.label}</p>
            <p className="metric-value mt-4">{stat.value}</p>
            <p className="muted mt-4 text-sm leading-7">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <p className="eyebrow">Scope of Reporting</p>
          <h2 className="mt-3 text-4xl">Institutional modules and protection layers</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {moduleCards.slice(0, 4).map((card, index) => (
              <Link
                key={card.href}
                href={card.href}
                className={`panel rounded-[1rem] p-7 transition hover:-translate-y-1 ${
                  index % 2 === 0 ? "border-l-[3px] border-l-[var(--primary)]" : "border-t-[3px] border-t-[var(--secondary)]"
                }`}
              >
                <p className="eyebrow">{card.kicker}</p>
                <h3 className="mt-4 text-3xl">{card.title}</h3>
                <p className="muted mt-4 text-sm leading-7">{card.description}</p>
              </Link>
            ))}
          </div>

          <div className="dark-card rounded-[1rem] border border-[rgba(0,0,0,0.3)] p-8">
            <p className="eyebrow text-[var(--secondary)]">Protection Layers</p>
            <h3 className="mt-4 text-4xl">Whistleblower Protection</h3>
            <p className="mt-5 max-w-xl text-sm leading-8 text-white/72">
              The user interface is intentionally designed around procedural seriousness:
              authenticated filing, controlled disclosure, role-separated review, and governance evidence.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {oversightPillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-[0.85rem] border border-white/10 bg-white/5 p-4"
                >
                  <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--secondary)]">
                    {pillar.kicker}
                  </p>
                  <p className="mt-3 text-xl text-white">{pillar.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Role Directory</p>
          <h2 className="mt-3 text-4xl">Seven roles in the prototype</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {roleCards.map((role) => (
              <article
                key={role.title}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/75 p-5"
              >
                <h3 className="text-2xl">{role.title}</h3>
                <p className="muted mt-3 text-sm leading-7">{role.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Process Ledger</p>
          <h2 className="mt-3 text-4xl">Adjusted KPK case progression</h2>
          <div className="mt-6 space-y-4">
            {processSteps.map((step, index) => (
              <div
                key={step}
                className={`rounded-[0.9rem] px-5 py-5 ${
                  index === processSteps.length - 1
                    ? "dark-card border border-[rgba(0,0,0,0.3)]"
                    : "signal-card border border-[var(--panel-border)]"
                }`}
              >
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--primary)]">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <p className={`mt-2 text-sm leading-7 ${index === processSteps.length - 1 ? "text-white/80" : ""}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {architectureLayers.map((layer, index) => (
          <article
            key={layer.title}
            className={`panel rounded-[1rem] p-7 ${
              index === 1 ? "border-t-[3px] border-t-[var(--primary)]" : "border-t-[3px] border-t-[var(--secondary)]"
            }`}
          >
            <p className="eyebrow">{layer.kicker}</p>
            <h3 className="mt-4 text-3xl">{layer.title}</h3>
            <p className="muted mt-4 text-sm leading-7">{layer.description}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
