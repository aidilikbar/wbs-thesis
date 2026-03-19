import { AppShell } from "@/components/app-shell";
import { TrackingWorkbench } from "@/components/tracking-workbench";

export const metadata = {
  title: "Track Case",
};

export default function TrackPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Case Tracking</p>
        <h1 className="mt-4 text-5xl">Check case progress without exposing identity</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Tracking uses the public reference and token returned after reporter submission. The view only shows public-safe milestones, not internal workflow notes.
        </p>
      </section>
      <section className="mt-8">
        <TrackingWorkbench />
      </section>
    </AppShell>
  );
}
