import { AppShell } from "@/components/app-shell";
import { GovernanceDashboard } from "@/components/governance-dashboard";

export const metadata = {
  title: "Governance Dashboard",
};

export default function GovernancePage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Governance and Integrity</p>
        <h1 className="mt-4 text-5xl">Operational dashboard for governance action</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Use global signals to read the condition of the system, then move into
          role-specific KPIs and hierarchy-based workload to decide the next action.
        </p>
      </section>
      <section className="mt-8">
        <GovernanceDashboard />
      </section>
    </AppShell>
  );
}
