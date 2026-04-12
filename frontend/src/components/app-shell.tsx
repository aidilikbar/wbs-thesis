"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { getRoleLabel } from "@/lib/labels";
import {
  isInternalRole,
  isReporter,
  isSystemAdministrator,
  isWorkflowUser,
} from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
};

const CURRENT_RELEASE = "v0.2.2";

function navForRole(role?: string | null): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "Dashboard" },
    { href: "/track", label: "Tracking" },
  ];

  if (!role || isReporter(role)) {
    items.splice(1, 0, { href: "/submit", label: "Reports" });
  }

  if (role && isWorkflowUser(role)) {
    items.push({ href: "/workflow", label: "Workflow" });
  }

  if (role && isInternalRole(role)) {
    items.push({ href: "/governance", label: "Oversight" });
  }

  if (role && isSystemAdministrator(role)) {
    items.push({ href: "/admin", label: "Admin" });
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
        <header className="sticky top-0 z-40 -mx-5 border-b border-[rgba(19,19,19,0.08)] bg-[rgba(255,251,246,0.9)] backdrop-blur-xl sm:-mx-8">
          <div className="px-5 py-3 sm:px-8">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/logos/kws_logo_header.png"
                  alt="KPK Whistleblowing System"
                  width={2869}
                  height={818}
                  priority
                  className="h-auto w-[92px] sm:w-[104px] lg:w-[112px]"
                />
              </Link>

                <div className="-mx-1 overflow-x-auto pb-1">
                  <nav className="flex min-w-max items-center gap-2 px-1">
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
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {isReady ? (
                  isAuthenticated && user ? (
                    <>
                      <Link
                        href="/profile"
                        className={`outline-panel flex min-w-0 items-center gap-3 rounded-[0.9rem] px-3 py-2.5 text-sm transition ${
                          pathname === "/profile"
                            ? "border-[rgba(239,47,39,0.24)] bg-[rgba(239,47,39,0.06)]"
                            : ""
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(239,47,39,0.1)] font-mono text-[0.68rem] font-bold uppercase text-[var(--primary)]">
                          {user.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("") || "U"}
                        </span>
                        <span className="min-w-0 text-left text-[var(--muted)]">
                          <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
                            {user.name}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                            {getRoleLabel(user.role, user.role_label)}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isPending}
                        className="dark-button !px-4 !py-2.5 !text-[0.64rem] disabled:opacity-60"
                      >
                        {isPending ? "Signing out" : "Logout"}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="ghost-button !px-4 !py-2.5 !text-[0.64rem]">
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="primary-button !px-4 !py-2.5 !text-[0.64rem]"
                      >
                        Register
                      </Link>
                    </>
                  )
                ) : (
                  <div className="outline-panel rounded-[0.8rem] px-3 py-2 text-xs text-[var(--muted)]">
                    Loading session information.
                  </div>
                )}
              </div>
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
                Thesis prototype aligned to the KPK whistleblowing business process, with operational governance and enterprise architecture concerns built directly into the user interface and workflow model.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="outline-panel flex min-h-[108px] items-center justify-center rounded-[0.9rem] px-4 py-4">
                <Image
                  src="/logos/kpk_logo_footer.png"
                  alt="KPK Komisi Pemberantasan Korupsi"
                  width={1191}
                  height={446}
                  className="h-[40px] w-auto sm:h-[46px]"
                />
              </div>
              <div className="outline-panel flex min-h-[108px] items-center justify-center rounded-[0.9rem] px-4 py-4">
                <Image
                  src="/logos/utwente_logo_footer.png"
                  alt="University of Twente"
                  width={960}
                  height={480}
                  className="h-[44px] w-auto sm:h-[50px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--panel-border)] pt-4 font-mono text-[0.68rem] uppercase tracking-[0.24em]">
            <p>&copy; 2026 KPK Whistleblowing System - {CURRENT_RELEASE}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
