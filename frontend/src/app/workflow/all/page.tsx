import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { WorkflowDirectory } from "@/components/workflow-directory";

export const metadata = {
  title: "All Workflow Cases",
};

export default async function WorkflowAllCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Workflow Oversight"
        title="All cases across workflow, approval, and completion stages"
        description="Review the full case portfolio connected to your workflow responsibility, including active work, approvals, and records that have already progressed or closed."
        breadcrumbs={[
          { label: "Workflow", href: "/workflow/all" },
          { label: "All Cases" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <WorkflowDirectory view="all" initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
