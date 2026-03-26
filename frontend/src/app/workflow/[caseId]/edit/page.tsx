import { AppShell } from "@/components/app-shell";
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
      <section className="max-w-5xl">
        <p className="eyebrow">Workflow Queue</p>
        <h1 className="mt-4 text-5xl">Execute the assigned swimlane step</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Use this dedicated workflow page to delegate a report, submit verification, or submit investigation analysis without mixing those actions into the queue index.
        </p>
      </section>
      <section className="mt-8">
        <WorkflowCaseEditor caseId={Number(caseId)} view="queue" />
      </section>
    </AppShell>
  );
}
