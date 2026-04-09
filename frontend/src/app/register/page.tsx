import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { RegisterForm } from "@/components/register-form";

export const metadata = {
  title: "Reporter Registration",
};

export default function RegisterPage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="Reporter Registration"
        title="Create a reporter account before submission"
        description="The KPK Whistleblowing System prototype requires reporter registration before a report can be filed. Internal users are created only by the system administrator."
        breadcrumbs={[{ label: "Register" }]}
        titleClassName="text-5xl"
      />
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
