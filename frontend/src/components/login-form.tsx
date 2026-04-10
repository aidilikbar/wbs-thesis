"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { roleHomePath } from "@/lib/roles";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const credentials = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    startTransition(async () => {
      try {
        const session = await login(credentials);
        router.push(roleHomePath(session.user.role));
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Login could not be completed.",
        );
      }
    });
  };

  return (
    <form className="panel overflow-hidden rounded-[1rem]" onSubmit={handleSubmit}>
      <div className="border-b border-[var(--panel-border)] bg-[rgba(239,47,39,0.05)] px-8 py-5">
        <p className="eyebrow">Login</p>
        <h2 className="mt-3 text-3xl">Access your KPK WBS workspace</h2>
        <p className="muted mt-3 text-sm leading-7">
          Shared access gateway for reporters and authorized internal officers.
        </p>
      </div>

      <div className="p-8">
        <div className="space-y-4">
          <label className="block" htmlFor="login-email">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input
              id="login-email"
              name="email"
              aria-label="Email"
              autoComplete="email"
              className="field"
              type="email"
              required
            />
          </label>
          <label className="block" htmlFor="login-password">
            <span className="mb-2 block text-sm font-semibold">Password</span>
            <input
              id="login-password"
              name="password"
              aria-label="Password"
              autoComplete="current-password"
              className="field"
              type="password"
              required
            />
          </label>
        </div>

        {message ? (
          <p className="mt-5 rounded-[0.65rem] border border-[rgba(197,160,34,0.25)] bg-[rgba(197,160,34,0.14)] px-4 py-3 text-sm text-[var(--secondary-strong)]">
            {message}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isPending} className="primary-button">
            {isPending ? "Signing in..." : "Login"}
          </button>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Role-based routing after authentication
          </p>
        </div>
      </div>
    </form>
  );
}
