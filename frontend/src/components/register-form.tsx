"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { roleHomePath } from "@/lib/roles";

export function RegisterForm() {
  const router = useRouter();
  const { registerReporter } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
      password_confirmation: String(formData.get("password_confirmation") ?? ""),
    };

    startTransition(async () => {
      try {
        const session = await registerReporter(payload);
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
          <label className="block" htmlFor="register-name">
            <span className="mb-2 block text-sm font-semibold">Full name</span>
            <input
              id="register-name"
              name="name"
              aria-label="Full name"
              autoComplete="name"
              className="field"
              required
            />
          </label>
          <label className="block" htmlFor="register-phone">
            <span className="mb-2 block text-sm font-semibold">Phone</span>
            <input
              id="register-phone"
              name="phone"
              aria-label="Phone"
              autoComplete="tel"
              className="field"
              required
            />
          </label>
          <label className="block md:col-span-2" htmlFor="register-email">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input
              id="register-email"
              name="email"
              aria-label="Email"
              autoComplete="email"
              className="field"
              type="email"
              required
            />
          </label>
          <label className="block" htmlFor="register-password">
            <span className="mb-2 block text-sm font-semibold">Password</span>
            <input
              id="register-password"
              name="password"
              aria-label="Password"
              autoComplete="new-password"
              className="field"
              type="password"
              required
            />
          </label>
          <label className="block" htmlFor="register-password-confirmation">
            <span className="mb-2 block text-sm font-semibold">Confirm password</span>
            <input
              id="register-password-confirmation"
              name="password_confirmation"
              aria-label="Confirm password"
              autoComplete="new-password"
              className="field"
              type="password"
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
