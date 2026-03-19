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
        <h1 className="mt-4 text-[clamp(3rem,7vw,5.4rem)]">Report Corruption.</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Enter the details of the suspected corruption activity. Reporter registration is mandatory before submission, and the case will then move into the formal KPK role-based process.
        </p>
      </section>
      <section className="mt-8">
        <ReportForm />
      </section>
    </AppShell>
  );
}
