import { AppShell } from "@/components/app-shell";
import { InvestigatorWorkbench } from "@/components/investigator-workbench";

export const metadata = {
  title: "Investigator Portal",
};

export default function InvestigatorPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Investigator Portal</p>
        <h1 className="mt-4 text-5xl">Operational queue for assessment and investigation</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Investigators and case managers work from a structured queue that
          exposes stage, severity, ownership, SLA, and governance flags.
        </p>
      </section>
      <section className="mt-8">
        <InvestigatorWorkbench />
      </section>
    </AppShell>
  );
}
