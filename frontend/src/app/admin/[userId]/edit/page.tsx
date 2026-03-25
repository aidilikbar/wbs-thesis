import { AppShell } from "@/components/app-shell";
import { AdminEditUserForm } from "@/components/admin-edit-user-form";

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
      <section className="max-w-5xl">
        <p className="eyebrow">System Administration</p>
        <h1 className="mt-4 text-5xl">Edit user record</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Update user profile details, login status, and optional password reset from a dedicated edit screen, then return to the directory index after saving or cancelling.
        </p>
      </section>
      <section className="mt-8">
        <AdminEditUserForm userId={Number(userId)} />
      </section>
    </AppShell>
  );
}
