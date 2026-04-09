import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
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
      <PageIntro
        eyebrow="Reporter Workspace"
        title="Report Detail."
        description="Review the selected submission, follow its case status directly on this page, and revise the filing content from a simplified authenticated reporter view."
        breadcrumbs={[
          { label: "Reports", href: "/submit" },
          { label: "Report Detail" },
        ]}
        titleClassName="text-[clamp(3rem,7vw,5.4rem)]"
      />
      <section className="mt-8">
        <ReporterReportEditor reportId={Number(reportId)} />
      </section>
    </AppShell>
  );
}
