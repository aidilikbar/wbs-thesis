"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { internalRoleOptions } from "@/lib/demo-data";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { isSystemAdministrator } from "@/lib/roles";
import type {
  AdminUserUpdatePayload,
  AuthUser,
  InternalUserPayload,
  PaginatedData,
  UserRole,
} from "@/lib/types";

const PAGE_SIZE = 8;

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

const initialCreateForm: InternalUserPayload = {
  name: "",
  email: "",
  phone: "",
  role: "supervisor_of_verificator",
  unit: "",
  password: "",
  password_confirmation: "",
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

type EditFormState = AdminUserUpdatePayload & {
  id: number;
  role: AuthUser["role"];
  role_label: string;
};

function noticeClasses(tone: "success" | "error") {
  if (tone === "success") {
    return "border border-[rgba(19,19,19,0.08)] bg-white text-[var(--foreground)]";
  }

  return "border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]";
}

export function AdminUserManager() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [directory, setDirectory] = useState<PaginatedData<AuthUser>>(emptyDirectory);
  const [createForm, setCreateForm] = useState<InternalUserPayload>(initialCreateForm);
  const [editingUser, setEditingUser] = useState<EditFormState | null>(null);
  const [createNotice, setCreateNotice] = useState<NoticeState>(null);
  const [directoryNotice, setDirectoryNotice] = useState<NoticeState>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [roleFilter, setRoleFilter] = useState<DirectoryRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<DirectoryStatusFilter>("all");
  const editorRef = useRef<HTMLFormElement | null>(null);
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
    if (!editingUser || !editorRef.current) {
      return;
    }

    editorRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [editingUser]);

  const updateCreateField = <K extends keyof InternalUserPayload>(
    field: K,
    value: InternalUserPayload[K],
  ) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const updateEditField = <K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K],
  ) => {
    setEditingUser((current) => (current ? { ...current, [field]: value } : current));
  };

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

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateNotice(null);

    if (!token) {
      setCreateNotice({
        tone: "error",
        text: "System administrator authentication is required.",
      });

      return;
    }

    startTransition(async () => {
      try {
        await api.createUser(token, createForm);
        setPage(1);
        await reloadUsers(1);
        setCreateForm(initialCreateForm);
        setCreateNotice({
          tone: "success",
          text: "Internal user created successfully.",
        });
        setDirectoryNotice({
          tone: "success",
          text: "Directory refreshed with the newly created user.",
        });
      } catch (error) {
        setCreateNotice({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "Internal user could not be created.",
        });
      }
    });
  };

  const openEditor = (account: AuthUser) => {
    setEditingUser({
      id: account.id,
      role: account.role,
      role_label: account.role_label,
      name: account.name,
      email: account.email,
      phone: account.phone,
      unit: account.unit ?? "",
      is_active: account.is_active,
      password: "",
      password_confirmation: "",
    });
    setDirectoryNotice({
      tone: "success",
      text: `Editing ${account.email}.`,
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDirectoryNotice(null);

    if (!token || !editingUser) {
      setDirectoryNotice({
        tone: "error",
        text: "Select a user to edit first.",
      });

      return;
    }

    const payload: AdminUserUpdatePayload = {
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone,
      unit: editingUser.unit,
      is_active: editingUser.is_active,
    };

    if (editingUser.password) {
      payload.password = editingUser.password;
      payload.password_confirmation = editingUser.password_confirmation;
    }

    startTransition(async () => {
      try {
        const updatedUser = await api.updateUser(token, editingUser.id, payload);
        await reloadUsers();
        setEditingUser((current) =>
          current && current.id === updatedUser.id
            ? {
                ...current,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                unit: updatedUser.unit ?? "",
                is_active: updatedUser.is_active,
                password: "",
                password_confirmation: "",
              }
            : current,
        );
        setDirectoryNotice({
          tone: "success",
          text: "User updated successfully.",
        });
      } catch (error) {
        setDirectoryNotice({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "User update could not be completed.",
        });
      }
    });
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

        if (editingUser?.id === account.id) {
          setEditingUser((current) =>
            current ? { ...current, is_active: nextIsActive } : current,
          );
        }

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

        if (editingUser?.id === account.id) {
          setEditingUser(null);
        }

        setDirectoryNotice({
          tone: "success",
          text: "User deleted successfully.",
        });
      } catch (error) {
        setDirectoryNotice({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "User could not be deleted.",
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
            Only the system administrator may create internal role accounts for the KPK Whistleblowing System.
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
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <form className="panel rounded-[1rem] p-8" onSubmit={handleCreate}>
        <p className="eyebrow">Create Internal User</p>
        <h2 className="mt-4 text-3xl">Provision a workflow role account</h2>
        <p className="muted mt-4 text-sm leading-7">
          Internal accounts are assigned to explicit governance roles and organizational units before they can access operational workspaces.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Name</span>
            <input
              className="field"
              value={createForm.name}
              onChange={(event) => updateCreateField("name", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Phone</span>
            <input
              className="field"
              value={createForm.phone}
              onChange={(event) => updateCreateField("phone", event.target.value)}
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input
              className="field"
              type="email"
              value={createForm.email}
              onChange={(event) => updateCreateField("email", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Role</span>
            <select
              className="field"
              value={createForm.role}
              onChange={(event) =>
                updateCreateField("role", event.target.value as InternalUserPayload["role"])
              }
            >
              {internalRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Unit</span>
            <input
              className="field"
              value={createForm.unit}
              onChange={(event) => updateCreateField("unit", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Password</span>
            <input
              className="field"
              type="password"
              value={createForm.password}
              onChange={(event) => updateCreateField("password", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Confirm password</span>
            <input
              className="field"
              type="password"
              value={createForm.password_confirmation}
              onChange={(event) =>
                updateCreateField("password_confirmation", event.target.value)
              }
              required
            />
          </label>
        </div>

        {createNotice ? (
          <p className={`mt-5 rounded-[0.65rem] px-4 py-3 text-sm ${noticeClasses(createNotice.tone)}`}>
            {createNotice.text}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isPending} className="primary-button">
            {isPending ? "Creating..." : "Create Internal User"}
          </button>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Role, unit, and credentials required
          </p>
        </div>
      </form>

      <div className="space-y-6">
        <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Directory Controls
          </p>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Search by name, email, phone, or unit. Filter by role and status, then edit, activate, deactivate, or delete user accounts without breaking active workflow ownership.
          </p>
        </aside>

        {editingUser ? (
          <form
            ref={editorRef}
            className="panel rounded-[1rem] p-8"
            onSubmit={handleUpdate}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Edit User</p>
                <h2 className="mt-4 text-3xl">{editingUser.name}</h2>
                <p className="muted mt-3 text-sm">
                  Changes are applied directly on behalf of the selected user.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Name</span>
                <input
                  className="field"
                  value={editingUser.name}
                  onChange={(event) => updateEditField("name", event.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Phone</span>
                <input
                  className="field"
                  value={editingUser.phone}
                  onChange={(event) => updateEditField("phone", event.target.value)}
                  required
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Email</span>
                <input
                  className="field"
                  type="email"
                  value={editingUser.email}
                  onChange={(event) => updateEditField("email", event.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Role</span>
                <input
                  className="field bg-[var(--surface-muted)]"
                  value={editingUser.role_label}
                  disabled
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Unit</span>
                <input
                  className="field"
                  value={editingUser.unit}
                  onChange={(event) => updateEditField("unit", event.target.value)}
                  disabled={editingUser.role === "reporter"}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">New password</span>
                <input
                  className="field"
                  type="password"
                  value={editingUser.password}
                  onChange={(event) => updateEditField("password", event.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Confirm password</span>
                <input
                  className="field"
                  type="password"
                  value={editingUser.password_confirmation}
                  onChange={(event) =>
                    updateEditField("password_confirmation", event.target.value)
                  }
                  placeholder="Required only when changing password"
                />
              </label>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-[0.8rem] border border-[var(--panel-border)] bg-white/70 px-4 py-4 text-sm">
              <input
                type="checkbox"
                checked={editingUser.is_active}
                onChange={(event) => updateEditField("is_active", event.target.checked)}
                disabled={editingUser.id === currentUserId}
              />
              Account is active
            </label>

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="submit" disabled={isPending} className="primary-button">
                {isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="ghost-button cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="panel rounded-[1rem] p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Provisioned Users</p>
              <h2 className="mt-4 text-3xl">Paginated user directory</h2>
            </div>
            <div className="text-right">
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-[var(--muted)]">
                Total users
              </p>
              <p className="mt-2 text-3xl font-semibold">{directory.meta.total}</p>
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
                    const isEditingThisRow = editingUser?.id === account.id;
                    const canMutateSelf = account.id !== currentUserId;

                    return (
                      <tr
                        key={account.id}
                        className={`align-top ${
                          isEditingThisRow ? "bg-[rgba(239,47,39,0.05)]" : ""
                        }`}
                      >
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <p className="font-semibold">{account.name}</p>
                          <p className="muted mt-2 text-sm">{account.email}</p>
                          <p className="muted mt-1 text-sm">{account.phone}</p>
                        </td>
                        <td className="border-b border-[rgba(19,19,19,0.06)] px-4 py-4">
                          <StatusBadge value={account.role} label={account.role_label} />
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
                            <button
                              type="button"
                              onClick={() => openEditor(account)}
                              className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem]"
                            >
                              Edit
                            </button>
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
                  setPage((current) =>
                    Math.min(current + 1, directory.meta.last_page),
                  )
                }
                disabled={
                  isPending || directory.meta.current_page >= directory.meta.last_page
                }
                className="ghost-button cursor-pointer px-3 py-2 text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
