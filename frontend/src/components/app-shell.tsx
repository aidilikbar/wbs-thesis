import Image from "next/image";
import Link from "next/link";
import { PropsWithChildren } from "react";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/submit", label: "Submit" },
  { href: "/track", label: "Track" },
  { href: "/investigator", label: "Investigator" },
  { href: "/governance", label: "Governance" },
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-5 sm:px-8">
        <header className="panel relative rounded-[1.9rem] px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="max-w-2xl">
              <div className="inline-flex rounded-[1.1rem] bg-white px-3 py-2 shadow-[0_12px_30px_rgba(16,17,20,0.08)]">
                <Image
                  src="/logos/kpk-logo-official.jpg"
                  alt="KPK Komisi Pemberantasan Korupsi"
                  width={254}
                  height={88}
                  priority
                  className="h-auto w-[170px] sm:w-[220px]"
                />
              </div>
              <p className="eyebrow mt-3">KPK Whistleblowing System</p>
              <p className="mt-2 max-w-xl text-lg font-semibold leading-7 text-[var(--foreground)]">
                Secure reporting, protected case handling, and accountable governance oversight.
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted)]">
                Confidential disclosure intake, case tracking, investigator coordination,
                and governance monitoring for institutional integrity management.
              </p>
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 transition hover:border-[rgba(237,28,36,0.28)] hover:text-[var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="relative z-10 pt-8">{children}</main>

        <footer className="mt-10 rounded-[1.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-6 text-sm text-[var(--muted)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Institutional Identity</p>
              <p className="mt-3 leading-7">
                KPK Whistleblowing System is presented with the KPK institutional
                mark and includes the University of Twente academic identity for
                the associated research context.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(16,17,20,0.08)]">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  KPK
                </p>
                <Image
                  src="/logos/kpk-logo-official.jpg"
                  alt="KPK Komisi Pemberantasan Korupsi"
                  width={254}
                  height={88}
                  className="h-auto w-[170px] sm:w-[220px]"
                />
              </div>
              <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(16,17,20,0.08)]">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  University of Twente
                </p>
                <Image
                  src="/logos/UT_Logo_0072_Black_EN.png"
                  alt="University of Twente"
                  width={234}
                  height={45}
                  className="h-auto w-[190px] sm:w-[230px]"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(16,17,20,0.08)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p>KPK Whistleblowing System interface with red-black-white institutional styling.</p>
            <p className="font-mono text-xs uppercase tracking-[0.2em]">
              Next.js frontend + Laravel backend + Docker infra
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
