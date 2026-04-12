import { AppShell } from "@/components/app-shell";
import { AdminUserManager } from "@/components/admin-user-manager";
import { PageIntro } from "@/components/page-intro";

export const metadata = {
  title: "Administration",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AppShell>
      <PageIntro
        eyebrow="System Administration"
        title="Manage user administration and operational KPI settings"
        description="Use the administration workspace to manage reporter and internal accounts, while also reviewing and maintaining the operational KPI timing model used across Governance."
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <AdminUserManager initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
