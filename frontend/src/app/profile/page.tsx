import { AppShell } from "@/components/app-shell";
import { ProfileWorkspace } from "@/components/profile-workspace";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Account</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,5.4rem)]">User Profile.</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Dedicated profile page for authenticated reporters and internal officers. This
          keeps identity information out of the main filing and workflow screens.
        </p>
      </section>
      <section className="mt-8">
        <ProfileWorkspace />
      </section>
    </AppShell>
  );
}
