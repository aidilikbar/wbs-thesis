"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  isInternalRole,
  isReporter,
  isSystemAdministrator,
  roleHomePath,
} from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
};

function navForRole(role?: string | null): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "Dashboard" },
    { href: "/track", label: "Track Status" },
  ];

  if (!role || isReporter(role)) {
    items.splice(1, 0, { href: "/submit", label: "Reports" });
  }

  if (role && isInternalRole(role)) {
    items.push({ href: "/workflow", label: "Workflow" });
    items.push({ href: "/governance", label: "Resources" });
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

  const isNavItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen">
      <div className="security-strip">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-4 px-5 py-2 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="security-dot" />
            <span>Secure Encryption Active</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <span>Protocol: AES-256</span>
            <span>Session: Role-Separated Workflow</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-5 pb-12 sm:px-8">
        <header className="border-b border-[var(--panel-border)] bg-white/72">
          <div className="flex flex-col gap-5 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-8">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/logos/kpk-logo-official.jpg"
                  alt="KPK Komisi Pemberantasan Korupsi"
                  width={254}
                  height={88}
                  priority
                  className="h-auto w-[126px] sm:w-[146px]"
                />
              </Link>

              <nav className="flex flex-wrap items-center gap-6 sm:gap-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isNavItemActive(item.href) ? "is-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              {isReady ? (
                isAuthenticated && user ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="outline-panel rounded-[0.7rem] px-4 py-3 text-sm text-[var(--muted)]">
                      <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-[var(--primary)]">
                        Confidential Access
                      </p>
                      <p className="mt-1 font-semibold text-[var(--foreground)]">
                        {user.name}
                      </p>
                      <p>
                        {user.role_label}
                        {user.unit ? ` · ${user.unit}` : ""}
                      </p>
                    </div>
                    <Link href={roleHomePath(user.role)} className="ghost-button">
                      Workspace
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isPending}
                      className="dark-button disabled:opacity-60"
                    >
                      {isPending ? "Signing out" : "Logout"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="outline-panel rounded-[0.7rem] px-4 py-3 text-sm text-[var(--muted)]">
                      Reporters register before submission. Internal users are provisioned by the system administrator.
                    </div>
                    <Link href="/login" className="ghost-button">
                      Login
                    </Link>
                    <Link href="/register" className="primary-button">
                      Reporter Register
                    </Link>
                  </div>
                )
              ) : (
                <div className="outline-panel rounded-[0.7rem] px-4 py-3 text-sm text-[var(--muted)]">
                  Loading session information.
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-10 pt-8">{children}</main>

        <footer className="mt-16 border-t border-[var(--panel-border)] pt-8 text-sm text-[var(--muted)]">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-end">
            <div className="space-y-3">
              <p className="font-display text-3xl text-[var(--foreground)]">
                KPK Whistleblowing System
              </p>
              <p className="max-w-2xl leading-7">
                Thesis prototype aligned to the KPK whistleblowing business process, with governance-oriented enterprise architecture concerns built directly into the user interface and workflow model.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="outline-panel rounded-[0.9rem] px-4 py-4">
                <p className="mb-2 font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  KPK
                </p>
                <Image
                  src="/logos/kpk-logo-official.jpg"
                  alt="KPK Komisi Pemberantasan Korupsi"
                  width={254}
                  height={88}
                  className="h-auto w-[150px] sm:w-[170px]"
                />
              </div>
              <div className="outline-panel rounded-[0.9rem] px-4 py-4">
                <p className="mb-2 font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--neutral)]">
                  University of Twente
                </p>
                <Image
                  src="/logos/UT_Logo_0072_Black_EN.png"
                  alt="University of Twente"
                  width={234}
                  height={45}
                  className="h-auto w-[180px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--panel-border)] pt-4 font-mono text-[0.68rem] uppercase tracking-[0.24em] sm:flex-row sm:items-center sm:justify-between">
            <p>KPK Whistleblowing System · Secure & Encrypted</p>
            <p>Next.js frontend · Laravel backend · PostgreSQL</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
