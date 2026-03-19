import Link from "next/link";
import { AppShell } from "@/components/app-shell";

const institutionalPrinciples = [
  "accountability",
  "transparency",
  "public interest",
  "legal certainty",
];

const complementaryChannels = [
  "in-person reporting",
  "phone",
  "mail",
  "SMS",
];

const purposePoints = [
  "enable citizens to report corruption cases",
  "provide a secure and confidential reporting channel",
  "allow reporters to monitor case progress",
  "improve quality and traceability of reports",
  "support investigation and enforcement processes",
];

const functionalityCards = [
  {
    href: "/register",
    section: "4.1",
    title: "Online Report Submission",
    description:
      "KWS enables structured digital reporting with chronology, involved parties, supporting evidence, and report details designed to improve case quality.",
  },
  {
    href: "/submit",
    section: "4.2",
    title: "Evidence Submission",
    description:
      "Supporting materials may include financial records, contracts, payment documents, audit reports, images, official letters, and other documentation.",
  },
  {
    href: "/track",
    section: "4.3",
    title: "Confidentiality and Anonymity",
    description:
      "Protection of whistleblowers is central to KWS through identity confidentiality, anonymity safeguards, and protected communication.",
  },
  {
    href: "/workflow",
    section: "4.4",
    title: "Secure Communication Channel",
    description:
      "A confidential communication box supports follow-up clarification between the reporter and KPK without requiring identity disclosure in the interaction channel.",
  },
  {
    href: "/track",
    section: "4.5",
    title: "Case Tracking",
    description:
      "Tracking mechanisms, status updates, and ongoing communication improve transparency, traceability, and public trust in the reporting process.",
  },
];

const workflowSteps = [
  "Report Submission",
  "Administrative Validation",
  "Substantive Review",
];

const workflowOutcomes = [
  "Investigate",
  "Forward to other agency",
  "Reject or close",
];

const referenceLinks = [
  {
    label: "Official KWS portal",
    href: "https://kws.kpk.go.id",
  },
  {
    label: "KPK at a Glance",
    href: "https://www.kpk.go.id/en/about-KPK/kpk-at-a-glance",
  },
  {
    label: "Public complaints service",
    href: "https://aclc.kpk.go.id/learning-materials/governance/website/public-complaints",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <p className="eyebrow">KPK Whistleblowing System</p>
          <h1 className="max-w-4xl text-[clamp(3.2rem,8vw,6.2rem)]">
            KPK Whistleblowing
            <span className="block text-[var(--primary)]">System (KWS)</span>
          </h1>
          <p className="max-w-2xl text-xl leading-9 text-[var(--muted)]">
            The KPK Whistleblowing System is an online reporting platform operated by the Indonesian Corruption Eradication Commission (KPK) to enable the public to report suspected corruption cases digitally.
          </p>
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
            In this thesis project, KWS is treated as the institutional reference model for a governance-oriented enterprise architecture of whistleblowing systems.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="primary-button">
              Register as Reporter
            </Link>
            <Link href="/track" className="secondary-button">
              Track Report Status
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.2rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(216,203,192,0.8),rgba(239,47,39,0.18))] p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.62),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.24),transparent_48%)]" />
          <div className="relative grid min-h-[360px] gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:grid-rows-[auto_1fr_auto]">
            <div className="lg:col-start-2 lg:row-start-1 lg:justify-self-end">
              <div className="max-w-[16rem] rounded-[0.8rem] bg-white/90 px-5 py-4 shadow-[0_20px_40px_rgba(19,19,19,0.08)]">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--primary)]">
                  Official Portal
                </p>
                <a
                  href="https://kws.kpk.go.id"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-lg font-semibold leading-7 text-[var(--foreground)]"
                >
                  kws.kpk.go.id
                </a>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Digital corruption reporting platform operated by KPK
                </p>
              </div>
            </div>

            <div className="lg:col-start-1 lg:row-start-2">
              <div className="rounded-[1rem] border border-white/55 bg-white/72 p-6 shadow-[0_18px_36px_rgba(19,19,19,0.06)] backdrop-blur-[2px]">
                <p className="eyebrow">Institutional Context</p>
                <h2 className="mt-3 text-4xl">Public complaint infrastructure for anti-corruption reporting</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                  KWS is part of KPK&apos;s public complaint service infrastructure and supports public participation, transparency, and accountability in corruption reporting.
                </p>
                <div className="mt-6 space-y-3">
                  {institutionalPrinciples.map((item, index) => (
                    <div
                      key={item}
                      className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-[0.7rem] border border-[rgba(19,19,19,0.06)] bg-white/78 px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-[0.35rem] bg-[var(--primary)] font-mono text-[0.65rem] font-bold text-white">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm leading-6 text-[var(--foreground)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-start-2 lg:row-start-2 lg:self-end">
              <div className="dark-card rounded-[1rem] border border-white/8 p-5">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
                  Complaint Channels
                </p>
                <div className="mt-4 space-y-3">
                  {complementaryChannels.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm text-white/84">{item}</p>
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--secondary)]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-start-1 lg:row-start-3 lg:self-end">
              <div className="max-w-[22rem] rounded-[0.9rem] border-l-[3px] border-[var(--secondary)] bg-white/94 px-6 py-5 shadow-[0_24px_50px_rgba(19,19,19,0.12)]">
                <p className="text-5xl font-black leading-none">5</p>
                <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Core functionalities described in the institutional KWS model
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Access Point",
            value: "1",
            detail: "KWS is accessible through the official public web portal at kws.kpk.go.id.",
          },
          {
            label: "Core Principles",
            value: "4",
            detail: "Accountability, transparency, public interest, and legal certainty shape the institutional mandate.",
          },
          {
            label: "Complaint Channels",
            value: "4",
            detail: "KWS complements in-person reporting, phone, mail, and SMS complaint channels.",
          },
          {
            label: "Core Functionalities",
            value: "5",
            detail: "Submission, evidence, confidentiality, secure communication, and case tracking form the main service capabilities.",
          },
        ].map((stat, index) => (
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

      <section className="mt-16 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Institutional Context</p>
          <h2 className="mt-3 text-4xl">KPK public-service positioning</h2>
          <p className="muted mt-4 text-sm leading-8">
            The Corruption Eradication Commission is an independent state institution tasked with preventing and eradicating corruption in Indonesia. Within that mandate, KWS functions as an important digital public complaint channel for corruption reporting.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {institutionalPrinciples.map((principle) => (
              <div
                key={principle}
                className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/78 p-4"
              >
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--primary)]">
                  Principle
                </p>
                <p className="mt-3 text-xl">{principle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dark-card rounded-[1rem] border border-[rgba(0,0,0,0.3)] p-8">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
            Purpose of KWS
          </p>
          <h3 className="mt-4 text-4xl text-white">Public participation in corruption eradication</h3>
          <p className="mt-5 max-w-xl text-sm leading-8 text-white/72">
            KWS is intended to provide a secure, traceable, and transparent reporting mechanism that strengthens public participation in anti-corruption efforts.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {purposePoints.map((item) => (
              <div
                key={item}
                className="rounded-[0.85rem] border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm leading-7 text-white/88">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <p className="eyebrow">Core Functionalities</p>
          <h2 className="mt-3 text-4xl">Operational capabilities described for KWS</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {functionalityCards.map((card, index) => (
            <Link
              key={card.title}
              href={card.href}
              className={`panel rounded-[1rem] p-7 transition hover:-translate-y-1 ${
                index % 2 === 0
                  ? "border-l-[3px] border-l-[var(--primary)]"
                  : "border-t-[3px] border-t-[var(--secondary)]"
              }`}
            >
              <p className="eyebrow">{card.section}</p>
              <h3 className="mt-4 text-3xl">{card.title}</h3>
              <p className="muted mt-4 text-sm leading-7">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Operational Workflow (Inferred)</p>
          <h2 className="mt-3 text-4xl">Reference process flow of KWS</h2>
          <div className="mt-6 space-y-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="signal-card rounded-[0.9rem] border border-[var(--panel-border)] px-5 py-5"
              >
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--primary)]">
                  Stage {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm leading-7">{step}</p>
              </div>
            ))}
            <div className="dark-card rounded-[0.9rem] border border-[rgba(0,0,0,0.3)] px-5 py-5">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
                Decision
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {workflowOutcomes.map((item) => (
                  <div
                    key={item}
                    className="rounded-[0.75rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/84"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Institutional References</p>
          <h2 className="mt-3 text-4xl">Source links used for the KWS overview</h2>
          <div className="mt-6 space-y-4">
            {referenceLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[0.9rem] border border-[var(--panel-border)] bg-white/78 px-5 py-5 transition hover:-translate-y-1"
              >
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--primary)]">
                  Reference
                </p>
                <p className="mt-3 text-2xl">{item.label}</p>
                <p className="muted mt-3 text-sm leading-7">{item.href}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
