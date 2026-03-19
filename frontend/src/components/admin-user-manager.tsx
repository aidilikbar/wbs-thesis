"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { internalRoleOptions } from "@/lib/demo-data";
import { api } from "@/lib/api";
import { isSystemAdministrator } from "@/lib/roles";
import type { AuthUser, InternalUserPayload } from "@/lib/types";

const initialForm: InternalUserPayload = {
  name: "",
  email: "",
  phone: "",
  role: "supervisor_of_verificator",
  unit: "",
  password: "",
  password_confirmation: "",
};

export function AdminUserManager() {
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState<InternalUserPayload>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = isSystemAdministrator(user?.role);

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    let active = true;

    const loadUsers = async () => {
      try {
        const data = await api.fetchUsers(token);

        if (active) {
          setUsers(data);
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Internal user data could not be loaded.",
          );
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [token, isAdmin]);

  const updateField = <K extends keyof InternalUserPayload>(
    field: K,
    value: InternalUserPayload[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reloadUsers = async () => {
    if (!token) {
      return;
    }

    const data = await api.fetchUsers(token);
    setUsers(data);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!token) {
      setMessage("System administrator authentication is required.");

      return;
    }

    startTransition(async () => {
      try {
        await api.createUser(token, form);
        await reloadUsers();
        setForm(initialForm);
        setMessage("Internal user created successfully.");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Internal user could not be created.",
        );
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
      <form className="panel rounded-[1rem] p-8" onSubmit={handleSubmit}>
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
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Phone</span>
            <input
              className="field"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Role</span>
            <select
              className="field"
              value={form.role}
              onChange={(event) =>
                updateField("role", event.target.value as InternalUserPayload["role"])
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
              value={form.unit}
              onChange={(event) => updateField("unit", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Password</span>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Confirm password</span>
            <input
              className="field"
              type="password"
              value={form.password_confirmation}
              onChange={(event) =>
                updateField("password_confirmation", event.target.value)
              }
              required
            />
          </label>
        </div>

        {message ? (
          <p
            className={`mt-5 rounded-[0.65rem] px-4 py-3 text-sm ${
              message.includes("successfully")
                ? "bg-emerald-100 text-emerald-900"
                : "border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] text-[var(--secondary-strong)]"
            }`}
          >
            {message}
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
            Governance Note
          </p>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Reporter self-registration is intentionally separated from internal provisioning to preserve role segregation and reduce unauthorized access paths.
          </p>
        </aside>

        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">Provisioned Users</p>
          <h2 className="mt-4 text-3xl">Current role directory</h2>
          <div className="mt-6 space-y-4">
            {users.map((account) => (
              <article
                key={account.id}
                className="rounded-[0.9rem] border border-[var(--panel-border)] bg-white/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl">{account.name}</h3>
                    <p className="muted mt-2 text-sm leading-7">
                      {account.role_label}
                      {account.unit ? ` · ${account.unit}` : ""}
                    </p>
                  </div>
                  <span className="rounded-[0.4rem] border border-[var(--panel-border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    {account.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="muted mt-3 text-sm">{account.email}</p>
              </article>
            ))}
            {users.length === 0 ? (
              <p className="muted text-sm leading-7">
                No internal users are available yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
