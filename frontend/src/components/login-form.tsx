"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { roleHomePath } from "@/lib/roles";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const session = await login({ email, password });
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
    <form className="panel rounded-[2rem] p-8" onSubmit={handleSubmit}>
      <p className="eyebrow">Login</p>
      <h2 className="mt-4 text-3xl">Access your KPK WBS workspace</h2>
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Email</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
