import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { WorkflowCaseEditor } from "@/components/workflow-case-editor";

export const metadata = {
  title: "Workflow Case",
};

export default async function WorkflowEditPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Workflow Queue"
        title="Execute the assigned swimlane step"
        description="Use this dedicated workflow page to delegate a report, submit verification, or submit investigation analysis without mixing those actions into the queue index."
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Workflow Case" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <WorkflowCaseEditor caseId={Number(caseId)} view="queue" />
      </section>
    </AppShell>
  );
}
