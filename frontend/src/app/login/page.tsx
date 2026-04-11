import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { PageIntro } from "@/components/page-intro";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="Account Access"
        title="Login to the KPK Whistleblowing System"
        description="Reporters use their own accounts to submit reports. Internal users access the workflow and oversight screens using accounts created by the system administrator."
        breadcrumbs={[{ label: "Login" }]}
        titleClassName="text-5xl"
      />
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
