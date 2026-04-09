import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Account Access</p>
        <h1 className="mt-4 text-5xl">Login to the KPK Whistleblowing System</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Reporters use their own accounts to submit reports. Internal users access the workflow and governance screens using accounts created by the system administrator.
        </p>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <LoginForm />
        <aside className="dark-card rounded-[1rem] border border-white/8 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--secondary)]">
            Access Notes
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-white/72">
            <li>Reporter accounts are self-registered through the reporter registration page.</li>
            <li>System administrators provision verification, investigation, director, and administration accounts.</li>
            <li>After login, each role is directed to its relevant workspace.</li>
          </ul>
        </aside>
      </section>
    </AppShell>
  );
}
