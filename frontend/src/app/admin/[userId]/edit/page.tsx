import { AppShell } from "@/components/app-shell";
import { AdminEditUserForm } from "@/components/admin-edit-user-form";
import { PageIntro } from "@/components/page-intro";

export const metadata = {
  title: "Edit User",
};

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <AppShell>
      <PageIntro
        eyebrow="System Administration"
        title="Edit user record"
        description="Update user profile details, login status, and optional password reset from a dedicated edit screen, then return to the directory index after saving or cancelling."
        breadcrumbs={[
          { label: "User Directory", href: "/admin" },
          { label: "Edit User" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <AdminEditUserForm userId={Number(userId)} />
      </section>
    </AppShell>
  );
}
