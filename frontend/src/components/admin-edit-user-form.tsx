"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getRoleLabel } from "@/lib/labels";
import { isSystemAdministrator } from "@/lib/roles";
import type { AdminUserUpdatePayload, AuthUser } from "@/lib/types";

type EditFormState = AdminUserUpdatePayload & {
  id: number;
  role: AuthUser["role"];
  role_label: string;
  created_at: string | null;
};

function buildEditForm(user: AuthUser): EditFormState {
  return {
    id: user.id,
    role: user.role,
    role_label: getRoleLabel(user.role, user.role_label),
    created_at: user.created_at,
    name: user.name,
    email: user.email,
    phone: user.phone,
    unit: user.unit ?? "",
    is_active: user.is_active,
    password: "",
    password_confirmation: "",
  };
}

export function AdminEditUserForm({ userId }: { userId: number }) {
  const router = useRouter();
  const { isReady, isAuthenticated, token, user } = useAuth();
  const [form, setForm] = useState<EditFormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isAdmin = isSystemAdministrator(user?.role);
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token || !isAdmin || Number.isNaN(userId)) {
      setIsLoading(false);

      return;
    }

    let active = true;

    const loadUser = async () => {
      try {
        const data = await api.fetchUser(token, userId);

        if (!active) {
          return;
        }

        setForm(buildEditForm(data));
        setMessage(null);
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error ? error.message : "User could not be loaded.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [isReady, token, isAdmin, userId]);

  const updateField = <K extends keyof EditFormState>(
    field: K,
    value: EditFormState[K],
  ) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!token || !form) {
      setMessage("Select a valid user record before saving.");

      return;
    }

    const payload: AdminUserUpdatePayload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      unit: form.unit,
      is_active: form.is_active,
    };

    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    startTransition(async () => {
      try {
        await api.updateUser(token, form.id, payload);
        router.push("/admin?notice=updated");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "User update could not be completed.",
        );
      }
    });
  };

  if (!isReady || isLoading) {
    return (
      <div className="panel rounded-[1rem] p-8">
        <p className="text-sm text-[var(--muted)]">Loading user record.</p>
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
            Only the system administrator may edit internal or reporter accounts in the KPK Whistleblowing System.
          </p>
          <Link href="/login" className="primary-button mt-6">
            Login
          </Link>
        </div>
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Access Rule
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>System administrators may edit any provisioned account.</li>
            <li>Reporter records remain managed centrally once created.</li>
            <li>Cancel returns to the admin directory index.</li>
          </ul>
        </aside>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[1rem] p-8">
          <p className="eyebrow">User Not Available</p>
          <h2 className="mt-4 text-3xl">The requested user record could not be opened</h2>
          <p className="muted mt-4 text-sm leading-7">
            {message ?? "The requested directory record was not found."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="primary-button mt-6 cursor-pointer"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
      <form className="panel rounded-[1rem] p-8" onSubmit={handleSubmit}>
        <p className="eyebrow">Edit User</p>
        <h2 className="mt-4 text-4xl">{form.name}</h2>
        <p className="muted mt-5 max-w-3xl text-sm leading-7">
          Update the selected account on behalf of the user, then return to the directory index. Sensitive workflow ownership rules still apply to activation changes and deletions.
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
            <input className="field bg-[var(--surface-muted)]" value={form.role_label} disabled />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Unit</span>
            <input
              className="field"
              value={form.unit}
              onChange={(event) => updateField("unit", event.target.value)}
              disabled={form.role === "reporter"}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">New password</span>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Confirm password</span>
            <input
              className="field"
              type="password"
              value={form.password_confirmation}
              onChange={(event) => updateField("password_confirmation", event.target.value)}
              placeholder="Required only when changing password"
            />
          </label>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-[0.8rem] border border-[var(--panel-border)] bg-white/70 px-4 py-4 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => updateField("is_active", event.target.checked)}
            disabled={form.id === currentUserId}
          />
          Account is active
        </label>

        {message ? (
          <p className="mt-5 rounded-[0.65rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
            {message}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="submit" disabled={isPending} className="primary-button">
            {isPending ? "Saving..." : "Save Changes"}
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
          Record Context
        </p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-white/72">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Role
            </p>
            <p>{getRoleLabel(form.role, form.role_label)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Created
            </p>
            <p>{formatDateTime(form.created_at)}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Current status
            </p>
            <p>{form.is_active ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/48">
              Account scope
            </p>
            <p>Changes here affect login eligibility, directory visibility, and operational ownership display.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
