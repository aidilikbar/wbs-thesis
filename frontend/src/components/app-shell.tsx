"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { isInternalRole, isReporter, isSystemAdministrator, roleHomePath } from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
};

function navForRole(role?: string | null): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "Overview" },
    { href: "/track", label: "Track" },
  ];

  if (!role || isReporter(role)) {
    items.splice(1, 0, { href: "/submit", label: "Submit" });
  }

  if (role && isInternalRole(role)) {
    items.push({ href: "/workflow", label: "Workflow" });
    items.push({ href: "/governance", label: "Governance" });
  }

  if (role && isSystemAdministrator(role)) {
    items.push({ href: "/admin", label: "Admin" });
  }

  if (!role) {
    items.push({ href: "/login", label: "Login" });
    items.push({ href: "/register", label: "Register" });
  }

  return items;
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isReady, isAuthenticated, user, logout } = useAuth();

  const navItems = navForRole(user?.role);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-5 sm:px-8">
        <header className="panel relative rounded-[1.9rem] px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <Link href="/" className="inline-flex rounded-[1.1rem] bg-white px-3 py-2 shadow-[0_12px_30px_rgba(16,17,20,0.08)]">
                <Image
                  src="/logos/kpk-logo-official.jpg"
                  alt="KPK Komisi Pemberantasan Korupsi"
                  width={254}
                  height={88}
                  priority
                  className="h-auto w-[170px] sm:w-[220px]"
                />
              </Link>
              <p className="eyebrow mt-3">KPK Whistleblowing System</p>
              <p className="mt-2 max-w-2xl text-lg font-semibold leading-7 text-[var(--foreground)]">
                Registered reporting, governed case handling, and institutional oversight for corruption-related disclosures.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                The prototype follows the KPK role-based process: reporter submission, verification supervision,
                verificator review, investigation supervision, investigation analysis, director approval, and system administration.
              </p>
            </div>

            <div className="flex w-full max-w-xl flex-col gap-4 xl:items-end">
              <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {navItems.map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full border px-4 py-2 transition ${
                        active
                          ? "border-[rgba(237,28,36,0.22)] bg-[rgba(237,28,36,0.12)] text-[var(--accent-strong)]"
                          : "border-[var(--panel-border)] bg-white hover:border-[rgba(237,28,36,0.28)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="rounded-[1.4rem] border border-[var(--panel-border)] bg-white/78 px-4 py-3 text-sm text-[var(--muted)]">
                {isReady ? (
                  isAuthenticated && user ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{user.name}</p>
                        <p>
                          {user.role_label}
                          {user.unit ? ` · ${user.unit}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={roleHomePath(user.role)}
                          className="rounded-full border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                        >
                          Workspace
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={isPending}
                          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
                        >
                          {isPending ? "Signing out" : "Logout"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                      <p>
                        Reporters must register before submitting. Internal accounts are provisioned by the system administrator.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/login"
                          className="rounded-full border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
                        >
                          Reporter Register
                        </Link>
                      </div>
                    </div>
                  )
                ) : (
                  <p>Loading session information.</p>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 pt-8">{children}</main>

        <footer className="mt-10 rounded-[1.9rem] border border-[var(--panel-border)] bg-white/72 px-5 py-6 text-sm text-[var(--muted)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Institutional Context</p>
              <p className="mt-3 leading-7">
                This prototype is aligned to the KPK Whistleblowing System business process and supports thesis work on governance-oriented enterprise architecture.
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
            <p>KPK Whistleblowing System prototype with a red-black-white institutional design system.</p>
            <p className="font-mono text-xs uppercase tracking-[0.2em]">
              Next.js frontend + Laravel backend + PostgreSQL
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
