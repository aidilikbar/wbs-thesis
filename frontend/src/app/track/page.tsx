import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { TrackingWorkbench } from "@/components/tracking-workbench";

export const metadata = {
  title: "Track Case",
};

export default function TrackPage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="Case Tracking"
        title="Check case progress without exposing identity"
        description="Tracking uses the public reference and token returned after reporter submission. The view only shows public-safe milestones, not internal workflow notes."
        breadcrumbs={[{ label: "Track Case" }]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <TrackingWorkbench />
      </section>
    </AppShell>
  );
}
