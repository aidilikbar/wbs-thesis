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
        title="Manage internal and reporter accounts"
        description="Search, filter, activate, deactivate, and delete directory records from the administration index. Dedicated create and edit pages are available for full account maintenance."
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <AdminUserManager initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
