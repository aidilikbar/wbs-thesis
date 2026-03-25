import { AppShell } from "@/components/app-shell";
import { ReportForm } from "@/components/report-form";

export const metadata = {
  title: "Edit Report",
};

export default async function SubmitEditPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Reporter Workspace</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,5.4rem)]">Edit Report Record.</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Revise the selected report from a dedicated edit screen. Saving or cancelling returns to the reporter transaction index.
        </p>
      </section>
      <section className="mt-8">
        <ReportForm mode="edit" reportId={Number(reportId)} />
      </section>
    </AppShell>
  );
}
