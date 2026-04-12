"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { internalRoleOptions } from "@/lib/demo-data";
import { api } from "@/lib/api";
import { isSystemAdministrator } from "@/lib/roles";
import type { InternalUserPayload } from "@/lib/types";

const initialCreateForm: InternalUserPayload = {
  name: "",
  email: "",
  phone: "",
  role: "supervisor_of_verificator",
  unit: "",
  password: "",
  password_confirmation: "",
};

export function AdminCreateUserForm() {
  const router = useRouter();
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [form, setForm] = useState<InternalUserPayload>(initialCreateForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = isSystemAdministrator(user?.role);

  const updateField = <K extends keyof InternalUserPayload>(
    field: K,
    value: InternalUserPayload[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
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
        router.push("/admin?notice=created");
        router.refresh();
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
            <li>Reporter accounts self-register and are not created here.</li>
            <li>Internal users are provisioned with role, unit, and credentials.</li>
            <li>Completed provisioning redirects back to the directory index.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
      <form className="panel rounded-[1rem] p-8" onSubmit={handleSubmit}>
        <p className="eyebrow">Create Internal User</p>
        <h2 className="mt-4 text-4xl">Provision an internal role account</h2>
        <p className="muted mt-5 max-w-3xl text-sm leading-7">
          Create a dedicated account for a KPK internal role. Reporter accounts remain self-registered and should not be created from this workspace.
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
              onChange={(event) => updateField("password_confirmation", event.target.value)}
              required
            />
          </label>
        </div>

        {message ? (
          <p className="mt-5 rounded-[0.65rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
            {message}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="submit" disabled={isPending} className="primary-button">
            {isPending ? "Creating..." : "Create Internal User"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="ghost-button cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      <aside className="dark-card rounded-[1rem] border border-white/8 p-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
          Provisioning Checklist
        </p>
        <ul className="mt-5 space-y-4 text-sm leading-7 text-white/72">
          <li>Assign only internal workflow, audit, or administration roles from this screen.</li>
          <li>Set the operational unit that should appear in the user directory and case ownership views.</li>
          <li>After submission, the workflow account will be available from the admin index immediately.</li>
        </ul>
      </aside>
    </div>
  );
}
