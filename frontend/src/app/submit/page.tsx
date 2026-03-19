import { AppShell } from "@/components/app-shell";
import { ReportForm } from "@/components/report-form";

export const metadata = {
  title: "Submit Report",
};

export default function SubmitPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Reporter Submission</p>
        <h1 className="mt-4 text-5xl">Submit a report from a registered reporter account</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Reporter registration is mandatory before submission. The report is then routed into the KPK role-based process beginning with the supervisor of verificator.
        </p>
      </section>
      <section className="mt-8">
        <ReportForm />
      </section>
    </AppShell>
  );
}
