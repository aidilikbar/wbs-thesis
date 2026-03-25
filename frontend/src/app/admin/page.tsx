import { AppShell } from "@/components/app-shell";
import { AdminUserManager } from "@/components/admin-user-manager";

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
      <section className="max-w-5xl">
        <p className="eyebrow">System Administration</p>
        <h1 className="mt-4 text-5xl">Manage internal and reporter accounts</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Search, filter, activate, deactivate, and delete directory records from the administration index. Dedicated create and edit pages are available for full account maintenance.
        </p>
      </section>
      <section className="mt-8">
        <AdminUserManager initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
