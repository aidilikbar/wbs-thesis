import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { ProfileWorkspace } from "@/components/profile-workspace";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="Account"
        title="User Profile."
        description="Dedicated profile page for authenticated reporters and internal officers. This keeps identity information out of the main filing and workflow screens."
        breadcrumbs={[{ label: "Profile" }]}
        titleClassName="text-[clamp(3rem,7vw,5.4rem)]"
      />
      <section className="mt-8">
        <ProfileWorkspace />
      </section>
    </AppShell>
  );
}
