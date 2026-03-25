import { AppShell } from "@/components/app-shell";
import { ReportForm } from "@/components/report-form";

export const metadata = {
  title: "Create Report",
};

export default function SubmitCreatePage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Reporter Workspace</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,5.4rem)]">Create Secure Report.</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Enter the corruption allegation from a dedicated create screen. After submission, the workflow returns to the reporter transaction index together with the issued reference and tracking token.
        </p>
      </section>
      <section className="mt-8">
        <ReportForm mode="create" />
      </section>
    </AppShell>
  );
}
