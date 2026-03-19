"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { roleHomePath } from "@/lib/roles";

export function RegisterForm() {
  const router = useRouter();
  const { registerReporter } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const session = await registerReporter(form);
        router.push(roleHomePath(session.user.role));
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Reporter registration could not be completed.",
        );
      }
    });
  };

  return (
    <form className="panel overflow-hidden rounded-[1rem]" onSubmit={handleSubmit}>
      <div className="border-b border-[var(--panel-border)] bg-[rgba(239,47,39,0.05)] px-8 py-5">
        <p className="eyebrow">Reporter Registration</p>
        <h2 className="mt-3 text-3xl">Create a reporter account</h2>
        <p className="muted mt-3 text-sm leading-7">
          Registration is mandatory before a report can be filed. Internal roles remain provisioned exclusively by the system administrator.
        </p>
      </div>

      <div className="p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Full name</span>
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

        <div className="accent-card mt-6 rounded-[0.8rem] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Registration rule
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Reporter onboarding establishes an accountable submission identity while preserving confidentiality controls on each case.
          </p>
        </div>

        {message ? (
          <p className="mt-5 rounded-[0.65rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
            {message}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isPending} className="primary-button">
            {isPending ? "Registering..." : "Register Reporter"}
          </button>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Reporter-only onboarding path
          </p>
        </div>
      </div>
    </form>
  );
}
