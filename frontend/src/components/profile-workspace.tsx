"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { formatDateTime } from "@/lib/format";
import { getRoleLabel } from "@/lib/labels";
import { roleHomePath } from "@/lib/roles";

export function ProfileWorkspace() {
  const { isReady, isAuthenticated, user } = useAuth();

  if (!isReady) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading profile.</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Authentication Required</p>
          <h2 className="mt-4 text-3xl">Login before opening your profile</h2>
          <p className="muted mt-4 text-sm leading-7">
            Account details are available only to the active authenticated user session.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="primary-button">
              Login
            </Link>
            <Link href="/register" className="ghost-button">
              Register
            </Link>
          </div>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Profile Access
          </p>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Reporter and internal users share the same profile destination, while their
            operational workspaces remain role-specific.
          </p>
        </aside>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-6">
      <section className="panel rounded-[1rem] p-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_340px] xl:items-start">
          <div>
            <p className="eyebrow">Profile</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.2rem)]">{user.name}</h2>
            <p className="muted mt-4 max-w-3xl text-sm leading-8">
              Dedicated account destination for identity, role assignment, and contact
              details. Operational pages no longer duplicate this profile block inside
              the report forms.
            </p>
          </div>

          <div className="dark-card rounded-[1rem] border border-white/8 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/12 text-xl font-black text-white">
                {initials || "U"}
              </div>
              <div>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary)]">
                  Active Role
                </p>
                <p className="mt-2 text-lg text-white">
                  {getRoleLabel(user.role, user.role_label)}
                </p>
                <p className="text-sm text-white/64">
                  {user.unit ?? "Protected routing unit"}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Link href={roleHomePath(user.role)} className="primary-button">
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <section className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Account Detail</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Full Name
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">{user.name}</p>
            </div>
            <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Role
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {getRoleLabel(user.role, user.role_label)}
              </p>
            </div>
            <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Email
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">{user.email}</p>
            </div>
            <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Phone
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">{user.phone}</p>
            </div>
            <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Unit
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {user.unit ?? "Not assigned"}
              </p>
            </div>
            <div className="rounded-[0.85rem] border border-[var(--panel-border)] bg-white/76 px-5 py-4">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--neutral)]">
                Member Since
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">
                {user.created_at ? formatDateTime(user.created_at) : "Not available"}
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="accent-card rounded-[1rem] border border-[var(--panel-border)] p-7">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-[var(--secondary-strong)]">
              Security Notice
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Reporter identity, role assignment, and contact data are intentionally
              separated from the main filing and tracking flows to keep those pages more
              focused and easier to audit.
            </p>
          </section>

          <section className="panel rounded-[1rem] p-7">
            <p className="eyebrow">Quick Links</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={roleHomePath(user.role)} className="primary-button">
                Workspace
              </Link>
              <Link href="/track" className="ghost-button">
                Tracking
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
