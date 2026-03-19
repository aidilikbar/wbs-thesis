import { AppShell } from "@/components/app-shell";
import { AdminUserManager } from "@/components/admin-user-manager";

export const metadata = {
  title: "Administration",
};

export default function AdminPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">System Administration</p>
        <h1 className="mt-4 text-5xl">Provision internal role accounts for the KPK workflow</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Reporter accounts are self-registered. All internal roles for verification, investigation, direction, and administration are created here by the system administrator.
        </p>
      </section>
      <section className="mt-8">
        <AdminUserManager />
      </section>
    </AppShell>
  );
}
