import Link from "next/link";
import { AppShell } from "@/components/app-shell";

const purposePoints = [
  "Encourage safe reporting of corruption and misconduct",
  "Protect whistleblowers from retaliation",
  "Ensure fair, impartial, and timely case handling",
  "Strengthen governance and institutional integrity",
  "Support KPK's mission in corruption prevention and enforcement",
];

const principleCards = [
  {
    label: "Trust",
    title: "Safe and accessible reporting channels",
    points: [
      "Safe and accessible reporting channels",
      "Transparent process and clear feedback",
    ],
  },
  {
    label: "Impartiality",
    title: "Objective and role-based case handling",
    points: [
      "Objective handling of all reports",
      "Independent and role-based decision making",
    ],
  },
  {
    label: "Protection",
    title: "Confidentiality and anti-retaliation safeguards",
    points: [
      "Confidentiality and anonymity support",
      "Anti-retaliation mechanisms for whistleblowers",
    ],
  },
];

const lifecycleSteps = [
  {
    step: "01",
    title: "Submit Report",
    points: [
      "Report wrongdoing securely through the protected reporting channel",
      "Attach supporting evidence",
    ],
  },
  {
    step: "02",
    title: "Assessment (Triage)",
    points: [
      "Validate report scope and urgency",
      "Identify risks and required protections",
    ],
  },
  {
    step: "03",
    title: "Verification and Review",
    points: [
      "Role-based workflow for verification and review",
      "Secure access to evidence and case data",
    ],
  },
  {
    step: "04",
    title: "Resolution",
    points: [
      "Decision making and case closure",
      "Organizational actions and follow-up",
    ],
  },
];

const philosophyPoints = [
  "structured case lifecycle",
  "protection of all involved parties",
  "continuous monitoring and improvement",
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <p className="eyebrow">KPK Whistleblowing System (KWS)</p>
          <h1 className="max-w-4xl text-[clamp(3rem,8vw,6rem)]">
            Governance-Oriented
            <span className="block text-[var(--primary)]">Whistleblowing Platform</span>
          </h1>
          <p className="max-w-2xl text-xl leading-9 text-[var(--muted)]">
            A secure and governance-driven platform designed to support
            transparent, accountable, and protected reporting of wrongdoing,
            aligned with ISO 37002 principles.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register" className="primary-button">
              Register
            </Link>
            <Link href="/track" className="secondary-button">
              Track Report Status
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.2rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(216,203,192,0.78),rgba(239,47,39,0.14))] p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.68),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.24),transparent_48%)]" />
          <div className="relative grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[1rem] border border-white/55 bg-white/76 p-6 shadow-[0_18px_36px_rgba(19,19,19,0.06)]">
              <p className="eyebrow">Institutional Purpose</p>
              <h2 className="mt-3 text-4xl">Protected reporting embedded into governance</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                KWS is designed as more than a filing interface. It embeds
                accountability, protection, and structured case handling directly
                into the reporting architecture.
              </p>
              <div className="mt-6 space-y-3">
                {purposePoints.slice(0, 3).map((item, index) => (
                  <div
                    key={item}
                    className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-[0.7rem] border border-[rgba(19,19,19,0.06)] bg-white/82 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-[0.35rem] bg-[var(--primary)] font-mono text-[0.65rem] font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-6 text-[var(--foreground)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="dark-card rounded-[1rem] border border-white/8 p-5">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
                  ISO 37002
                </p>
                <p className="mt-4 text-5xl font-black leading-none text-white">3</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/62">
                  Trust, impartiality, and protection as core design principles
                </p>
              </div>

              <div className="rounded-[0.95rem] border-l-[3px] border-[var(--secondary)] bg-white/92 px-6 py-5 shadow-[0_24px_50px_rgba(19,19,19,0.12)]">
                <p className="text-5xl font-black leading-none">4</p>
                <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Structured lifecycle stages from reporting to resolution
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <p className="eyebrow">Purpose</p>
          <h2 className="mt-3 text-4xl">Why KWS exists</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {purposePoints.map((item, index) => (
            <article
              key={item}
              className={`panel rounded-[1rem] p-6 ${
                index === 0 || index === 3
                  ? "border-l-[3px] border-l-[var(--primary)]"
                  : "border-t-[3px] border-t-[var(--secondary)]"
              }`}
            >
              <p className="eyebrow">Point {String(index + 1).padStart(2, "0")}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <p className="eyebrow">Core Principles</p>
          <h2 className="mt-3 text-4xl">ISO 37002-based design principles</h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {principleCards.map((card, index) => (
            <article
              key={card.label}
              className={`rounded-[1rem] border p-8 ${
                index === 2
                  ? "dark-card border-white/8"
                  : "panel border-[var(--panel-border)]"
              }`}
            >
              <p
                className={`font-mono text-[0.64rem] uppercase tracking-[0.24em] ${
                  index === 2 ? "text-[var(--secondary)]" : "text-[var(--primary)]"
                }`}
              >
                {card.label}
              </p>
              <h3 className={`mt-4 text-3xl ${index === 2 ? "text-white" : ""}`}>
                {card.title}
              </h3>
              <div className="mt-6 space-y-3">
                {card.points.map((point) => (
                  <div
                    key={point}
                    className={`rounded-[0.85rem] border px-4 py-4 text-sm leading-7 ${
                      index === 2
                        ? "border-white/10 bg-white/5 text-white/84"
                        : "border-[var(--panel-border)] bg-white/78 text-[var(--foreground)]"
                    }`}
                  >
                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">How It Works</p>
          <h2 className="mt-3 text-4xl">Structured whistleblowing lifecycle</h2>
          <p className="muted mt-4 text-sm leading-8">
            The system follows a defined path from submission to closure so each
            report is handled consistently, transparently, and with appropriate
            protection controls.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {lifecycleSteps.map((step, index) => (
            <article
              key={step.step}
              className={`panel rounded-[1rem] p-7 ${
                index % 2 === 0
                  ? "border-l-[3px] border-l-[var(--primary)]"
                  : "border-t-[3px] border-t-[var(--secondary)]"
              }`}
            >
              <p className="eyebrow">{step.step}</p>
              <h3 className="mt-4 text-3xl">{step.title}</h3>
              <div className="mt-5 space-y-3">
                {step.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-[0.8rem] border border-[var(--panel-border)] bg-white/78 px-4 py-4 text-sm leading-7 text-[var(--foreground)]"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="dark-card rounded-[1rem] border border-[rgba(0,0,0,0.3)] p-8">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
            Design Philosophy
          </p>
          <h2 className="mt-4 text-4xl text-white">
            This is not just a reporting tool.
          </h2>
          <blockquote className="mt-6 border-l-[3px] border-[var(--secondary)] pl-5 text-lg leading-8 text-white/86">
            KWS is a governance-oriented system where policy, accountability, and
            protection are embedded into the architecture.
          </blockquote>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/72">
            Aligned with ISO 37002, the platform is intended to sustain
            whistleblowing as an organizational governance mechanism rather than
            a standalone complaint form.
          </p>
        </div>

        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Aligned Outcomes</p>
          <h2 className="mt-3 text-4xl">Built for continuous governance improvement</h2>
          <div className="mt-6 space-y-4">
            {philosophyPoints.map((item, index) => (
              <div
                key={item}
                className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/78 px-5 py-5"
              >
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[0.4rem] bg-[var(--primary)] font-mono text-[0.66rem] font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-7 text-[var(--foreground)]">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="primary-button">
              Begin Protected Reporting
            </Link>
            <Link href="/track" className="ghost-button">
              Check Existing Report
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
