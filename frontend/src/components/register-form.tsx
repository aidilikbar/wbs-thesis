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
    <form className="panel rounded-[2rem] p-8" onSubmit={handleSubmit}>
      <p className="eyebrow">Reporter Registration</p>
      <h2 className="mt-4 text-3xl">Create a reporter account</h2>
      <p className="muted mt-4 text-sm leading-7">
        This registration path is reserved for reporters. Internal roles are provisioned separately by the system administrator.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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

      {message ? (
        <p className="mt-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Registering..." : "Register reporter"}
      </button>
    </form>
  );
}
