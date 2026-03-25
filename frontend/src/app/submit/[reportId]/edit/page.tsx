import { AppShell } from "@/components/app-shell";
import { ReporterReportEditor } from "@/components/reporter-report-editor";

export const metadata = {
  title: "Report Detail",
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
        <h1 className="mt-4 text-[clamp(3rem,7vw,5.4rem)]">Report Detail.</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Review the selected submission, follow its case status directly on this page,
          and revise the filing content from a simplified authenticated reporter view.
        </p>
      </section>
      <section className="mt-8">
        <ReporterReportEditor reportId={Number(reportId)} />
      </section>
    </AppShell>
  );
}
