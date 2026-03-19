import { AppShell } from "@/components/app-shell";
import { GovernanceDashboard } from "@/components/governance-dashboard";

export const metadata = {
  title: "Governance Dashboard",
};

export default function GovernancePage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Governance Dashboard</p>
        <h1 className="mt-4 text-5xl">Oversight metrics and control health</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          This dashboard supports internal governance analysis across registration enforcement, role segregation, timeliness, confidentiality posture, and audit evidence.
        </p>
      </section>
      <section className="mt-8">
        <GovernanceDashboard />
      </section>
    </AppShell>
  );
}
