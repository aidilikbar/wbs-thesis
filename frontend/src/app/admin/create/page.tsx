import { AppShell } from "@/components/app-shell";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";

export const metadata = {
  title: "Create Internal User",
};

export default function AdminCreatePage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">System Administration</p>
        <h1 className="mt-4 text-5xl">Create internal role account</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Provision internal KPK workflow and administration accounts from a dedicated create screen, then return to the directory index when finished.
        </p>
      </section>
      <section className="mt-8">
        <AdminCreateUserForm />
      </section>
    </AppShell>
  );
}
