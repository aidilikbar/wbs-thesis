import { AppShell } from "@/components/app-shell";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { PageIntro } from "@/components/page-intro";

export const metadata = {
  title: "Create Internal User",
};

export default function AdminCreatePage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="System Administration"
        title="Create internal role account"
        description="Provision internal KPK workflow and administration accounts from a dedicated create screen, then return to the directory index when finished."
        breadcrumbs={[
          { label: "User Directory", href: "/admin" },
          { label: "Create Internal User" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <AdminCreateUserForm />
      </section>
    </AppShell>
  );
}
