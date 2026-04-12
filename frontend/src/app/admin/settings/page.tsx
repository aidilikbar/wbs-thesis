import { AppShell } from "@/components/app-shell";
import { AdminOperationalKpiForm } from "@/components/admin-operational-kpi-form";
import { PageIntro } from "@/components/page-intro";

export const metadata = {
  title: "Operational KPI Settings",
};

export default function AdminOperationalKpiSettingsPage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="System Administration"
        title="Configure operational KPI settings"
        description="Adjust the work calendar and the verification or investigation hour budgets that drive Governance KPI bars, at-risk indicators, and overdue calculations."
        breadcrumbs={[
          { label: "User Directory", href: "/admin" },
          { label: "Operational KPI Settings" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <AdminOperationalKpiForm />
      </section>
    </AppShell>
  );
}
