import { AppShell } from "@/components/app-shell";
import { GovernanceDashboard } from "@/components/governance-dashboard";
import { PageIntro } from "@/components/page-intro";

export const metadata = {
  title: "Governance Dashboard",
};

export default function GovernancePage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="Governance and Integrity"
        title="Operational dashboard for governance action"
        description="Use global signals to read the condition of the system, then move into role-specific KPIs and hierarchy-based workload to decide the next action."
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <GovernanceDashboard />
      </section>
    </AppShell>
  );
}
