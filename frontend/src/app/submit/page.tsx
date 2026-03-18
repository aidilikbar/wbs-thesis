import { AppShell } from "@/components/app-shell";
import { ReportForm } from "@/components/report-form";

export const metadata = {
  title: "Submit Report",
};

export default function SubmitPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Public Intake</p>
        <h1 className="mt-4 text-5xl">Submit a protected disclosure</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          The intake flow prioritises confidentiality, evidence structure, and
          governance metadata so the case can be triaged with traceability from
          the first submission.
        </p>
      </section>
      <section className="mt-8">
        <ReportForm />
      </section>
    </AppShell>
  );
}
