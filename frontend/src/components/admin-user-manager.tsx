"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { internalRoleOptions } from "@/lib/form-options";
import { getRoleLabel } from "@/lib/labels";
import { isSystemAdministrator } from "@/lib/roles";
import type {
  AuthUser,
  OperationalKpiSettings,
  PaginatedData,
  UserRole,
} from "@/lib/types";

const PAGE_SIZE = 10;

type DirectoryRoleFilter = "all" | UserRole;
type DirectoryStatusFilter = "all" | "active" | "inactive";
type NoticeState =
  | {
      tone: "success" | "error";
      text: string;
    }
  | null;

const emptyDirectory: PaginatedData<AuthUser> = {
  items: [],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
    from: null,
    to: null,
  },
};

const roleFilterOptions: Array<{ value: DirectoryRoleFilter; label: string }> = [
  { value: "all", label: "All roles" },
  { value: "reporter", label: "Reporter" },
  ...internalRoleOptions,
];

const statusFilterOptions: Array<{
  value: DirectoryStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const weekdayLabels: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

function formatHours(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, "")} h`;
}

function summarizeWeekendDays(days: number[]) {
  if (days.length === 0) {
    return "No weekends configured";
  }

  return days
    .slice()
    .sort((left, right) => left - right)
    .map((day) => weekdayLabels[day] ?? String(day))
    .join(", ");
}

function noticeClasses(tone: "success" | "error") {
  if (tone === "success") {
    return "border border-[rgba(19,19,19,0.08)] bg-white text-[var(--foreground)]";
  }

  return "border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]";
}

function noticeFromQuery(value: string | null): NoticeState {
  if (value === "created") {
    return {
      tone: "success",
      text: "Internal user created successfully.",
    };
  }

  if (value === "updated") {
    return {
      tone: "success",
      text: "User updated successfully.",
    };
  }

  return null;
}

export function AdminUserManager({
  initialNotice,
}: {
  initialNotice?: string | null;
}) {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [directory, setDirectory] = useState<PaginatedData<AuthUser>>(emptyDirectory);
  const [directoryNotice, setDirectoryNotice] = useState<NoticeState>(() =>
    noticeFromQuery(initialNotice ?? null),
  );
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [roleFilter, setRoleFilter] = useState<DirectoryRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<DirectoryStatusFilter>("all");
  const [operationalKpiSettings, setOperationalKpiSettings] =
    useState<OperationalKpiSettings | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = isSystemAdministrator(user?.role);
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    let active = true;

    const loadUsers = async () => {
      try {
        const data = await api.fetchUsers(token, {
          page,
          per_page: PAGE_SIZE,
          search: deferredSearchTerm.trim() || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        });

        if (!active) {
          return;
        }

        if (data.items.length === 0 && page > 1) {
          setPage((current) => Math.max(current - 1, 1));

          return;
        }

        setDirectory(data);
      } catch (error) {
        if (active) {
          setDirectoryNotice({
            tone: "error",
            text:
              error instanceof Error
                ? error.message
                : "Internal user data could not be loaded.",
          });
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [token, isAdmin, page, deferredSearchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    let active = true;

    const loadSettings = async () => {
      try {
        const data = await api.fetchOperationalKpiSettings(token);

        if (active) {
          setOperationalKpiSettings(data);
        }
      } catch {
        if (active) {
          setOperationalKpiSettings(null);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [token, isAdmin]);

  const reloadUsers = async (targetPage = page) => {
    if (!token) {
      return;
    }

    const data = await api.fetchUsers(token, {
      page: targetPage,
      per_page: PAGE_SIZE,
      search: deferredSearchTerm.trim() || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });

    if (data.items.length === 0 && targetPage > 1) {
      setPage(targetPage - 1);

      return;
    }

    setDirectory(data);
  };

  const handleStatusToggle = (account: AuthUser) => {
    if (!token) {
      return;
    }

    const nextIsActive = !account.is_active;
    const actionLabel = nextIsActive ? "activate" : "deactivate";

    if (
      !window.confirm(
        `${nextIsActive ? "Activate" : "Deactivate"} ${account.email}?`,
      )
    ) {
      return;
    }

    setDirectoryNotice(null);

    startTransition(async () => {
      try {
        if (nextIsActive) {
          await api.updateUser(token, account.id, {
            name: account.name,
            email: account.email,
            phone: account.phone,
            unit: account.unit ?? "",
            is_active: true,
          });
        } else {
          await api.deactivateUser(token, account.id);
        }

        await reloadUsers();
        setDirectoryNotice({
          tone: "success",
          text: `User ${actionLabel}d successfully.`,
        });
      } catch (error) {
        setDirectoryNotice({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : `User could not be ${actionLabel}d.`,
        });
      }
    });
  };

  const handleDelete = (account: AuthUser) => {
    if (!token) {
      return;
    }

    if (!window.confirm(`Delete ${account.email}? This action cannot be undone.`)) {
      return;
    }

    setDirectoryNotice(null);

    startTransition(async () => {
      try {
        await api.deleteUser(token, account.id);
        await reloadUsers();
        setDirectoryNotice({
          tone: "success",
          text: "User deleted successfully.",
        });
      } catch (error) {
        setDirectoryNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "User could not be deleted.",
        });
      }
    });
  };

  if (!isReady) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading administrator session.</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Restricted Administration</p>
          <h2 className="mt-4 text-3xl">System administrator access required</h2>
          <p className="muted mt-4 text-sm leading-7">
            Only the system administrator may manage internal role accounts for the KPK Whistleblowing System.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Provisioning Rule
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Reporters self-register through the reporter registration page.</li>
            <li>All internal roles are provisioned here by the system administrator.</li>
            <li>Provisioned users can then log in through the shared login page.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
        <div className="panel rounded-[1rem] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Operational KPI Settings</p>
              <h2 className="mt-4 text-3xl">Current timing configuration</h2>
              <p className="muted mt-4 max-w-3xl text-sm leading-7">
                These stored values drive Governance KPI bars, at-risk thresholds, and overdue calculations. Editing remains on the dedicated settings page.
              </p>
            </div>
            <Link href="/admin/settings" className="secondary-button">
              Edit KPI Settings
            </Link>
          </div>

          {operationalKpiSettings ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="outline-panel rounded-[0.9rem] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Work Calendar
                </p>
                <div className="mt-4 space-y-3 text-sm leading-6">
                  <p>
                    <span className="font-semibold">Timezone:</span>{" "}
                    {operationalKpiSettings.timezone}
                  </p>
                  <p>
                    <span className="font-semibold">Working hours:</span>{" "}
                    {operationalKpiSettings.workday_start} - {operationalKpiSettings.workday_end}
                  </p>
                  <p>
                    <span className="font-semibold">Weekend days:</span>{" "}
                    {summarizeWeekendDays(operationalKpiSettings.weekend_days)}
                  </p>
                  <p>
                    <span className="font-semibold">Non-working dates:</span>{" "}
                    {operationalKpiSettings.non_working_dates.length}
                  </p>
                </div>
              </article>

              <article className="outline-panel rounded-[0.9rem] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Verification Budget
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {formatHours(operationalKpiSettings.verification_total_hours)}
                </p>
                <div className="mt-4 grid gap-2 text-sm leading-6">
                  <p>Screening / Delegation: {formatHours(operationalKpiSettings.verification_screening_hours)}</p>
                  <p>Verification Work: {formatHours(operationalKpiSettings.verification_work_hours)}</p>
                  <p>Supervisory Approval: {formatHours(operationalKpiSettings.verification_approval_hours)}</p>
                </div>
              </article>

              <article className="outline-panel rounded-[0.9rem] p-5 lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Investigation Budget
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {formatHours(operationalKpiSettings.investigation_total_hours)}
                    </p>
                  </div>
                  <div className="text-sm leading-6 text-right">
                    <p className="font-semibold">Last updated</p>
                    <p>{formatDateTime(operationalKpiSettings.updated_at)}</p>
                    <p className="muted">
                      {operationalKpiSettings.updated_by_name ?? "Default configuration"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm leading-6 md:grid-cols-2">
                  <p>Delegation: {formatHours(operationalKpiSettings.investigation_delegation_hours)}</p>
                  <p>Investigation Work: {formatHours(operationalKpiSettings.investigation_work_hours)}</p>
                  <p>Supervisory Approval: {formatHours(operationalKpiSettings.investigation_approval_hours)}</p>
                  <p>Director Approval: {formatHours(operationalKpiSettings.director_approval_hours)}</p>
                </div>
              </article>
            </div>
          ) : (
            <div className="mt-6 rounded-[0.9rem] border border-dashed border-[var(--panel-border)] px-5 py-5 text-sm text-[var(--muted)]">
              Operational KPI settings are not available right now. Open the dedicated settings page to review or restore the configuration.
            </div>
          )}
        </div>

        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Administration Scope
          </p>
          <ul className="mt-5 space-y-4 text-sm leading-7 text-white/72">
            <li>User administration covers reporter and internal account readiness, activation, and directory maintenance.</li>
            <li>Operational KPI settings define the work calendar and the verification or investigation hour budgets used in Governance.</li>
            <li>Use the summary on this page for review, and the dedicated settings page for editing and saving changes.</li>
          </ul>
        </aside>
      </section>

      <div className="panel rounded-[1rem] p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Provisioned Users</p>
            <h2 className="mt-4 text-3xl">Paginated user directory</h2>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <Link href="/admin/create" className="primary-button">
              Create Internal User
            </Link>
            <div className="text-right">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Total users
              </p>
              <p className="mt-2 text-3xl font-semibold">{directory.meta.total}</p>
            </div>
          </div>
        </div>

        {directoryNotice ? (
          <p className={`mt-5 rounded-[0.65rem] px-4 py-3 text-sm ${noticeClasses(directoryNotice.tone)}`}>
            {directoryNotice.text}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Search</span>
            <input
              className="field"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone, or unit"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Role</span>
            <select
              className="field"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value as DirectoryRoleFilter);
                setPage(1);
              }}
            >
              {roleFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Status</span>
            <select
              className="field"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as DirectoryStatusFilter);
                setPage(1);
              }}
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  User
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Role
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Unit
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Status
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Created
                </th>
                <th className="border-b border-[var(--panel-border)] px-4 py-3 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {directory.items.length > 0 ? (
                directory.items.map((account) => {
                  const canMutateSelf = account.id !== currentUserId;

                  return (
                    <tr key={account.id} className="align-top">
                      <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                        <p className="font-semibold">{account.name}</p>
                        <p className="muted mt-2 text-sm">{account.email}</p>
                        <p className="muted mt-1 text-sm">{account.phone}</p>
                      </td>
                      <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                        <StatusBadge
                          value={account.role}
                          label={getRoleLabel(account.role, account.role_label)}
                        />
                      </td>
                      <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4 text-sm">
                        {account.unit ?? "Not assigned"}
                      </td>
                      <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                        <StatusBadge
                          value={account.is_active ? "active" : "inactive"}
                          label={account.is_active ? "Active" : "Inactive"}
                        />
                      </td>
                      <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4 text-sm text-[var(--muted)]">
                        {formatDateTime(account.created_at)}
                      </td>
                      <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                        <div className="relative z-10 flex flex-wrap gap-2">
                          <Link
                            href={`/admin/${account.id}/edit`}
                            className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem]"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(account)}
                            disabled={isPending || !canMutateSelf}
                            className="secondary-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {account.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            disabled={isPending || !canMutateSelf}
                            className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-sm leading-7 text-[var(--muted)]"
                  >
                    No users match the current search or filter settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--panel-border)] pt-5">
          <p className="text-sm text-[var(--muted)]">
            Showing {directory.meta.from ?? 0} to {directory.meta.to ?? 0} of{" "}
            {directory.meta.total} users
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Page {directory.meta.current_page} of {directory.meta.last_page}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={isPending || directory.meta.current_page <= 1}
              className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, directory.meta.last_page))
              }
              disabled={isPending || directory.meta.current_page >= directory.meta.last_page}
              className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
