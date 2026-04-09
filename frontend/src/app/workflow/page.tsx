import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { WorkflowDirectory } from "@/components/workflow-directory";

export const metadata = {
  title: "Workflow",
};

export default async function WorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Role-Based Workflow"
        title="Internal case processing aligned to the KPK business process"
        description="Search the active queue in table form, then open dedicated case pages to delegate, verify, or analyse in alignment with the KPK whistleblowing swimlane."
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <WorkflowDirectory view="queue" initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
