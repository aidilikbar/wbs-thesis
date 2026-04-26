import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

type LifecyclePoint = {
  text: string;
  icon: "person" | "paperclip" | "checklist" | "shield" | "folder" | "document" | "users" | "archive";
};

type LifecycleStep = {
  step: string;
  title: string;
  icon: string;
  points: LifecyclePoint[];
};

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
    title: "Safe and accessible reporting",
    icon: "trust",
    points: [
      "Secure channels for submitting reports",
      "Clear feedback throughout the process",
    ],
  },
  {
    label: "Impartiality",
    title: "Objective case handling",
    icon: "impartiality",
    points: [
      "Defined roles and responsibilities",
      "Evidence-based decisions",
    ],
  },
  {
    label: "Protection",
    title: "Confidentiality and safeguards",
    icon: "protection",
    points: [
      "Confidentiality and anonymity by design",
      "Protection against retaliation and misuse",
    ],
  },
] as const;

const institutionalPurposeFeatures = [
  {
    key: "safe_reporting",
    icon: "shield",
    text: "Encourage safe reporting of corruption and misconduct",
  },
  {
    key: "whistleblower_protection",
    icon: "person-shield",
    text: "Protect whistleblowers from retaliation",
  },
  {
    key: "fair_case_handling",
    icon: "scales",
    text: "Ensure fair, impartial, and timely case handling",
  },
] as const;

const institutionalResponsibility = {
  icon: "lock-shield",
  title: "Your voice. Our responsibility.",
  text: "Every report is treated confidentially, fairly, and in accordance with ISO 37002 principles.",
} as const;

const lifecycleSteps: LifecycleStep[] = [
  {
    step: "01",
    title: "Report Submission",
    icon: "/assets/how-it-works-assets/icon-report-transparent.png",
    points: [
      {
        icon: "person",
        text: "Submit a protected whistleblowing report through the dedicated reporter channel",
      },
      {
        icon: "paperclip",
        text: "Attach supporting files and identify the reported parties involved",
      },
    ],
  },
  {
    step: "02",
    title: "Verification",
    icon: "/assets/how-it-works-assets/icon-verification-transparent.png",
    points: [
      {
        icon: "shield",
        text: "Screen, delegate, and verify the report before escalation or closure",
      },
      {
        icon: "checklist",
        text: "Assess authority, corruption indication, and the immediate handling path",
      },
    ],
  },
  {
    step: "03",
    title: "Investigation",
    icon: "/assets/how-it-works-assets/icon-investigation-transparent.png",
    points: [
      {
        icon: "person",
        text: "Assign the case for formal investigation when verification supports escalation",
      },
      {
        icon: "document",
        text: "Review evidence, chronology, legal basis, and follow-up conclusions",
      },
    ],
  },
  {
    step: "04",
    title: "Final Review",
    icon: "/assets/how-it-works-assets/icon-review-transparent.png",
    points: [
      {
        icon: "users",
        text: "Complete the final approval chain through supervisor and director review",
      },
      {
        icon: "archive",
        text: "Close, archive, or finalize the case based on the approved outcome",
      },
    ],
  },
];

const philosophyFeatures = [
  {
    title: "Policy Embedded",
    description: "Workflows and rules enforce policy and accountability at every stage.",
    icon: "/assets/design-philosophy-assets/icon-policy-embedded-transparent.png",
  },
  {
    title: "Protection by Design",
    description: "Confidentiality, anonymity, and anti-retaliation are built into the system.",
    icon: "/assets/design-philosophy-assets/icon-protection-by-design-transparent.png",
  },
  {
    title: "Accountability and Traceability",
    description: "Audit trails and role-based access ensure integrity and transparency.",
    icon: "/assets/design-philosophy-assets/icon-accountability-traceability-transparent.png",
  },
  {
    title: "Governance for Impact",
    description: "Insights and metrics support continuous improvement and organizational learning.",
    icon: "/assets/design-philosophy-assets/icon-governance-impact-transparent.png",
  },
] as const;

const alignedOutcomePoints = [
  {
    title: "Structured case lifecycle",
    description: "Reports follow a clear path from submission to resolution.",
  },
  {
    title: "Protection of all involved parties",
    description: "Confidentiality and role-based access support fair and protected handling.",
  },
  {
    title: "Evidence-based improvement",
    description: "Dashboards, SLA indicators, and audit logs help identify issues and improve governance over time.",
  },
] as const;

function InstitutionalPanelIcon({ kind }: { kind: "emblem" | "lifecycle" }) {
  if (kind === "emblem") {
    return (
      <svg viewBox="0 0 220 180" fill="none" className="h-full w-full" aria-hidden="true">
        <circle cx="122" cy="90" r="68" stroke="rgba(197,160,34,0.18)" strokeWidth="1.5" />
        <circle cx="122" cy="90" r="52" stroke="rgba(197,160,34,0.22)" strokeWidth="1.5" />
        <circle cx="122" cy="90" r="36" stroke="rgba(197,160,34,0.26)" strokeWidth="1.5" />
        <circle cx="68" cy="48" r="2.75" fill="rgba(232,194,72,0.9)" />
        <circle cx="174" cy="124" r="2.75" fill="rgba(232,194,72,0.9)" />
        <path
          d="M122 34c15 11 28 15 40 17v28c0 24-15 38-40 46-25-8-40-22-40-46V51c12-2 25-6 40-17Z"
          fill="url(#shieldFill)"
          stroke="rgba(235,194,84,0.96)"
          strokeWidth="4"
        />
        <path
          d="m102 93 13 13 27-30"
          stroke="rgba(244,201,94,0.96)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="shieldFill" x1="82" y1="34" x2="162" y2="125" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(36,39,43,0.96)" />
            <stop offset="1" stopColor="rgba(18,20,24,0.98)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 180" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="18" y="24" width="84" height="34" rx="10" fill="rgba(244,239,231,0.95)" />
      <rect x="18" y="72" width="84" height="34" rx="10" fill="rgba(244,239,231,0.95)" />
      <rect x="18" y="120" width="84" height="34" rx="10" fill="rgba(244,239,231,0.95)" />
      <path d="M34 34h16M34 42h24M34 50h18" stroke="rgba(189,148,41,0.92)" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 79h14M37 72v14" stroke="rgba(189,148,41,0.92)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="127" r="8" stroke="rgba(189,148,41,0.92)" strokeWidth="3" />
      <path d="m44 133 8 8" stroke="rgba(189,148,41,0.92)" strokeWidth="3" strokeLinecap="round" />
      <path d="M116 42h46v18" stroke="rgba(210,172,84,0.7)" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
      <path d="M116 90h46v-8" stroke="rgba(210,172,84,0.7)" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
      <path d="M116 138h46v-14" stroke="rgba(210,172,84,0.7)" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
      <circle cx="180" cy="120" r="22" fill="rgba(214,169,71,0.92)" />
      <path d="m171 120 7 7 12-14" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InstitutionalFeatureIcon({
  kind,
}: {
  kind: "shield" | "person-shield" | "scales" | "lock-shield";
}) {
  const common = "h-4.5 w-4.5 text-[var(--primary)]";

  switch (kind) {
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path
            d="M12 3c3 2.1 5.6 2.9 8 3.2v5.5c0 4.6-2.9 7.3-8 8.8-5.1-1.5-8-4.2-8-8.8V6.2C6.4 5.9 9 5.1 12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "person-shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <circle cx="9" cy="7.5" r="2.7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 18a4.8 4.8 0 0 1 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M17 9c1.7 1.2 3.1 1.6 4.4 1.8v3c0 2.5-1.6 4-4.4 4.9-2.8-.9-4.4-2.4-4.4-4.9v-3c1.3-.2 2.7-.6 4.4-1.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "scales":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M12 4v14M7 7h10M6 20h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m7 7-3 5h6L7 7Zm10 0-3 5h6l-3-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "lock-shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path
            d="M12 3c3 2.1 5.6 2.9 8 3.2v5.5c0 4.6-2.9 7.3-8 8.8-5.1-1.5-8-4.2-8-8.8V6.2C6.4 5.9 9 5.1 12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect x="8.75" y="10.5" width="6.5" height="5.1" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 10.5V9.6a2 2 0 0 1 4 0v.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

function PrincipleCardIcon({
  kind,
  inverse = false,
}: {
  kind: "trust" | "impartiality" | "protection";
  inverse?: boolean;
}) {
  const common = inverse ? "h-6 w-6 text-[var(--secondary)]" : "h-6 w-6 text-[var(--primary)]";

  switch (kind) {
    case "trust":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M6 7.5h12M6 12h8M6 16.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "impartiality":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M12 4v14M7 7h10M6 20h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m7 7-3 5h6L7 7Zm10 0-3 5h6l-3-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "protection":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path
            d="M12 3c3 2.1 5.6 2.9 8 3.2v5.5c0 4.6-2.9 7.3-8 8.8-5.1-1.5-8-4.2-8-8.8V6.2C6.4 5.9 9 5.1 12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="m9.5 12 1.9 1.9 3.6-4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function LifecyclePointIcon({ icon }: { icon: LifecyclePoint["icon"] }) {
  const common = "h-5 w-5 text-[var(--foreground)]";

  switch (icon) {
    case "person":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.9" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "paperclip":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="m9 12.5 5.9-5.9a3.25 3.25 0 1 1 4.6 4.6l-8.1 8.1a5 5 0 0 1-7.1-7.1l8.8-8.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "checklist":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M8 6h11M8 12h11M8 18h11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="m4 6 1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 11M4 18l1.2 1.2L7.5 17" stroke="var(--primary)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M12 3c3 2.1 5.6 2.9 8 3.2v5.5c0 4.6-2.9 7.3-8 8.8-5.1-1.5-8-4.2-8-8.8V6.2C6.4 5.9 9 5.1 12 3Z" stroke="currentColor" strokeWidth="1.9" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.9" />
        </svg>
      );
    case "document":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M7 3h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.9" />
          <path d="M14 3v5h5M8 12h8M8 16h8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <circle cx="9" cy="9" r="2.75" stroke="currentColor" strokeWidth="1.9" />
          <circle cx="16.5" cy="10.5" r="2.25" stroke="currentColor" strokeWidth="1.9" />
          <path d="M3.5 18a5.5 5.5 0 0 1 11 0M14 18a4 4 0 0 1 6.5-3.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "archive":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7ZM3 5h18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M9 11h6" stroke="var(--primary)" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function Home() {
  return (
    <AppShell>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_1.1fr] xl:items-start">
        <div className="space-y-6">
          <p className="eyebrow">KPK Whistleblowing System (KWS)</p>
          <h1 className="max-w-[38rem] text-[clamp(3rem,7.2vw,5.55rem)] leading-[0.93]">
            Governance-Oriented
            <span className="block text-[var(--primary)]">Whistleblowing Platform</span>
          </h1>
          <p className="max-w-[27rem] text-[1.04rem] leading-8 text-[var(--muted)] sm:text-[1.1rem]">
            A secure and governance-oriented platform designed to support
            transparent, accountable, and protected reporting of wrongdoing,
            aligned with ISO 37002 principles.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="primary-button">
              Register
            </Link>
            <Link href="/track" className="secondary-button">
              Track Report Status
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.28rem] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(216,203,192,0.78),rgba(239,47,39,0.14))] p-3 shadow-[0_16px_38px_rgba(19,19,19,0.07)] sm:p-3.5 xl:p-3.75">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.68),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.24),transparent_48%)]" />
          <div className="relative space-y-3">
            <div>
              <p className="eyebrow">Institutional Purpose</p>
              <h2 className="mt-2 max-w-none whitespace-nowrap text-[clamp(1.42rem,2.05vw,2rem)] leading-[0.95]">
                Protected reporting by design
              </h2>
              <div className="mt-2.5 h-[3px] w-8 rounded-full bg-[var(--primary)]" />
              <p className="mt-2.5 max-w-[26rem] text-[0.77rem] leading-4.5 text-[var(--muted)]">
                KWS is designed as more than a filing interface. It embeds
                accountability, protection, and structured case handling directly
                into the reporting architecture.
              </p>
            </div>

            <div className="space-y-1.25">
              {institutionalPurposeFeatures.map((feature) => (
                <div
                  key={feature.key}
                  className="grid grid-cols-[auto_1px_1fr] items-center gap-1.5 rounded-[0.82rem] border border-[rgba(19,19,19,0.05)] bg-white px-2 py-1.75 shadow-[0_8px_18px_rgba(19,19,19,0.04)]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-[0.58rem] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,244,239,0.96))]">
                    <InstitutionalFeatureIcon kind={feature.icon} />
                  </div>
                  <div className="h-7 w-px bg-[rgba(19,19,19,0.12)]" />
                  <p className="text-[0.71rem] leading-4.5 text-[var(--foreground)]">
                    {feature.text}
                  </p>
                </div>
              ))}

              <div className="grid grid-cols-[auto_1px_1fr] items-center gap-1.5 rounded-[0.82rem] border border-[rgba(19,19,19,0.05)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,242,0.95))] px-2 py-1.75 shadow-[0_8px_18px_rgba(19,19,19,0.04)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-[0.58rem] bg-white">
                  <InstitutionalFeatureIcon kind={institutionalResponsibility.icon} />
                </div>
                <div className="h-7 w-px bg-[rgba(19,19,19,0.12)]" />
                <div>
                  <h3 className="text-[0.71rem] font-semibold leading-4 text-[var(--foreground)]">
                    {institutionalResponsibility.title}
                  </h3>
                  <p className="mt-0.5 text-[0.63rem] leading-4 text-[var(--muted)]">
                    {institutionalResponsibility.text}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.75">
              <div className="relative overflow-hidden rounded-[0.96rem] bg-[radial-gradient(circle_at_78%_34%,rgba(197,160,34,0.16),transparent_18%),linear-gradient(180deg,rgba(24,24,24,0.98),rgba(16,16,16,0.98))] px-2.75 py-2.75 text-white shadow-[0_18px_36px_rgba(19,19,19,0.12)] sm:px-3 sm:py-3">
                <p className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[var(--secondary)]">
                  ISO 37002
                </p>
                <div className="mt-1.25 text-[1.9rem] font-black leading-none text-white sm:text-[2.1rem]">3</div>
                <p className="mt-0.75 pr-20 font-mono text-[0.47rem] uppercase tracking-[0.055em] text-white/82 sm:text-[0.53rem] xl:whitespace-nowrap">
                  Trust, impartiality, and protection as core design principles
                </p>
                <div className="pointer-events-none absolute right-2 top-2 h-[3.75rem] w-[3.75rem] sm:h-[4.25rem] sm:w-[4.25rem]">
                  <InstitutionalPanelIcon kind="emblem" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[0.96rem] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(250,247,242,0.98))] px-2.75 py-2.75 shadow-[0_14px_30px_rgba(19,19,19,0.08)] sm:px-3 sm:py-3">
                <div className="absolute inset-y-0 left-0 w-[4px] bg-[var(--secondary)]" />
                <div className="text-[1.9rem] font-black leading-none text-black sm:text-[2.1rem]">4</div>
                <p className="mt-0.75 pr-24 font-mono text-[0.47rem] uppercase tracking-[0.055em] text-[rgba(19,19,19,0.62)] sm:text-[0.53rem] xl:whitespace-nowrap">
                  Structured lifecycle stages from reporting to resolution
                </p>
                <div className="pointer-events-none absolute right-2 top-2 h-[3.9rem] w-[4.55rem] sm:h-[4.25rem] sm:w-[5rem]">
                  <InstitutionalPanelIcon kind="lifecycle" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
        <div className="panel rounded-[1.1rem] p-6 sm:p-7">
          <p className="eyebrow">Purpose</p>
          <h2 className="mt-3 text-[clamp(2rem,3.8vw,3.1rem)] leading-[0.98]">Why KWS exists</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
            KWS is intended to institutionalize protected reporting as part of governance, not just as a standalone submission channel.
          </p>
          <div className="mt-6 space-y-2.5">
            {purposePoints.map((item, index) => (
              <article
                key={item}
                className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/80 px-4 py-3.5"
              >
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-[0.38rem] bg-[var(--primary)] font-mono text-[0.64rem] font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-6 text-[var(--foreground)]">{item}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.18rem] border border-[var(--panel-border)] bg-white shadow-[0_18px_40px_rgba(19,19,19,0.08)]">
          <Image
            src="/assets/kpk_building_with_employee.png"
            alt="KPK representative in front of the KPK building."
            width={1536}
            height={1024}
            className="block h-auto w-full object-cover"
          />
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
              <div
                className={`mt-4 flex h-12 w-12 items-center justify-center rounded-full border ${
                  index === 2
                    ? "border-white/10 bg-white/[0.05]"
                    : "border-[var(--panel-border)] bg-white/72"
                }`}
              >
                <PrincipleCardIcon kind={card.icon} inverse={index === 2} />
              </div>
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

      <section className="mt-16 rounded-[1.32rem] border border-[rgba(19,19,19,0.08)] bg-white px-4 py-5 shadow-[0_18px_48px_rgba(19,19,19,0.05)] sm:px-6 sm:py-7 xl:px-7">
        <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr] xl:gap-6">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.08rem] bg-[radial-gradient(circle_at_22%_18%,rgba(239,47,39,0.1),transparent_34%),radial-gradient(circle_at_78%_82%,rgba(197,160,34,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,244,0.98))] p-4 sm:p-5">
            <div className="absolute -left-8 bottom-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(239,47,39,0.06),transparent_68%)] blur-2xl" />
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(197,160,34,0.08),transparent_72%)] blur-2xl" />
            <div className="relative">
              <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.26em] text-[var(--primary)]">
                How It Works
              </p>
              <h2 className="mt-3 max-w-sm text-[clamp(2rem,4.2vw,3.35rem)] font-black leading-[0.97]">
                Structured whistleblowing workflow
              </h2>
              <div className="mt-4 h-[3px] w-9 rounded-full bg-[var(--primary)]" />
              <p className="mt-4 max-w-sm text-[0.9rem] leading-7 text-[var(--muted)]">
                The system follows a defined path from submission to closure so each
                report is handled consistently, transparently, and with appropriate
                protection controls.
              </p>
            </div>

            <div className="relative mt-6 flex justify-center xl:justify-start">
              <Image
                src="/assets/how-it-works-assets/lifecycle-illustration-transparent.png"
                alt="Whistleblowing lifecycle illustration"
                width={530}
                height={435}
                className="h-auto w-full max-w-[20.5rem] object-contain"
                priority={false}
              />
            </div>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {lifecycleSteps.map((step) => (
              <article
                key={step.step}
                className="relative rounded-[1.08rem] border border-[rgba(19,19,19,0.08)] bg-white p-4 shadow-[0_12px_30px_rgba(19,19,19,0.045)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-4.5"
              >
                <div className="absolute left-4 top-3.5 text-[1.18rem] font-black tracking-[-0.04em] text-[var(--primary)] sm:left-4.5 sm:top-4 sm:text-[1.4rem]">
                  {step.step}
                </div>

                <div className="flex flex-col items-center pt-6 text-center sm:pt-6.5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(247,247,247,0.96),rgba(236,232,228,0.95))] shadow-[0_12px_26px_rgba(19,19,19,0.05)] sm:h-18 sm:w-18">
                    <Image
                      src={step.icon}
                      alt=""
                      width={160}
                      height={160}
                      className="h-11 w-11 object-contain sm:h-12 sm:w-12"
                    />
                  </div>

                  <h3 className="mt-4 text-[1.42rem] font-black leading-tight text-[var(--foreground)] sm:text-[1.55rem]">
                    {step.title}
                  </h3>

                  <div className="mt-2.5 h-[3px] w-8 rounded-full bg-[var(--primary)]" />
                </div>

                <div className="mt-5 space-y-3">
                  {step.points.map((point) => (
                    <div key={point.text} className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(19,19,19,0.08)] bg-[linear-gradient(180deg,rgba(249,249,249,0.98),rgba(239,236,232,0.92))] text-[var(--foreground)]">
                        <LifecyclePointIcon icon={point.icon} />
                      </div>
                      <p className="text-left text-[0.88rem] leading-6.5 text-[rgba(19,19,19,0.86)]">
                        {point.text}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-5 xl:grid-cols-[1.14fr_0.86fr]">
        <div className="overflow-hidden rounded-[1.24rem] border border-[rgba(0,0,0,0.4)] bg-[radial-gradient(circle_at_72%_24%,rgba(197,160,34,0.12),transparent_18%),radial-gradient(circle_at_72%_24%,rgba(197,160,34,0.06),transparent_31%),linear-gradient(180deg,rgba(17,20,24,0.98),rgba(11,13,16,0.98))] px-4 py-4 shadow-[0_18px_46px_rgba(8,10,14,0.2)] sm:px-5 sm:py-5">
          <div className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr] xl:items-center xl:gap-4">
            <div>
              <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.26em] text-[var(--secondary)]">
                Design Philosophy
              </p>
              <div className="mt-3 h-[3px] w-10 rounded-full bg-[var(--secondary)]" />
              <h2 className="mt-4 max-w-md text-[clamp(1.75rem,3.7vw,3rem)] font-black leading-[0.98] text-white">
                This is not just a reporting tool.
              </h2>

              <blockquote className="mt-4 max-w-lg border-l-[3px] border-[var(--secondary)] pl-3.5 text-[0.9rem] leading-6.5 text-white/82 sm:text-[0.96rem]">
                KWS is a governance-oriented system where policy, accountability, and
                protection are embedded into the architecture.
              </blockquote>

              <div className="mt-3.5 h-px w-full max-w-lg bg-white/10" />

              <p className="mt-3.5 max-w-lg text-[0.84rem] leading-6.5 text-white/68 sm:text-[0.9rem]">
                Aligned with <span className="font-semibold text-[var(--secondary)]">ISO 37002</span>, the platform is intended to sustain whistleblowing as an organizational governance mechanism rather than a standalone complaint form.
              </p>
            </div>

            <div className="relative flex justify-center xl:justify-end">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[10.25rem] w-[10.25rem] rounded-full border border-[rgba(197,160,34,0.12)]" />
                <div className="absolute h-[7.5rem] w-[7.5rem] rounded-full border border-[rgba(197,160,34,0.15)]" />
                <div className="absolute h-[4.4rem] w-[4.4rem] rounded-full border border-[rgba(197,160,34,0.18)]" />
              </div>
              <Image
                src="/assets/design-philosophy-assets/main-governance-illustration-transparent.png"
                alt="Governance-oriented reporting illustration"
                width={645}
                height={595}
                className="relative z-10 h-auto w-full max-w-[17.5rem] object-contain sm:max-w-[18.75rem]"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-2.5 md:grid-cols-2 xl:mt-5.5 xl:grid-cols-2">
            {philosophyFeatures.map((feature) => (
              <article
                key={feature.title}
                className="flex gap-2.5 rounded-[0.82rem] border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm md:px-3.5 md:py-3.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_8px_18px_rgba(0,0,0,0.16)]">
                  <Image
                    src={feature.icon}
                    alt=""
                    width={90}
                    height={93}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-[0.88rem] font-bold leading-5.5 text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-0.5 text-[0.82rem] leading-5.5 text-white/68">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel rounded-[1rem] p-6">
          <p className="eyebrow">Aligned Outcomes</p>
          <h2 className="mt-3 text-[clamp(1.85rem,3.7vw,3rem)]">Built for continuous governance improvement</h2>
          <p className="mt-4 text-[0.92rem] leading-7 text-[var(--muted)]">
            KWS turns every report into governance insight. Through structured workflows, protection controls, audit trails, SLA indicators, and case outcomes, the system helps improve accountability, trust, and institutional learning.
          </p>
          <div className="mt-4 space-y-3.5">
            {alignedOutcomePoints.map((item, index) => (
              <div
                key={item.title}
                className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-[0.9rem] border border-[var(--panel-border)] bg-white/78 px-4 py-3.5"
              >
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[0.4rem] bg-[var(--primary)] font-mono text-[0.66rem] font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-4">
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
