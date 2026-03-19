import { AppShell } from "@/components/app-shell";
import { RegisterForm } from "@/components/register-form";

export const metadata = {
  title: "Reporter Registration",
};

export default function RegisterPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Reporter Registration</p>
        <h1 className="mt-4 text-5xl">Create a reporter account before submission</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          The KPK Whistleblowing System prototype requires reporter registration before a report can be filed. Internal users are created only by the system administrator.
        </p>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <RegisterForm />
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Why Registration Matters
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>It establishes a governed submission path before the first case record is created.</li>
            <li>It enables follow-up communication while preserving confidentiality settings on the case.</li>
            <li>It separates reporter onboarding from internal role provisioning and administration.</li>
          </ul>
        </aside>
      </section>
    </AppShell>
  );
}
