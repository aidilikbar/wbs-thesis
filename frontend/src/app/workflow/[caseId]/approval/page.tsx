import { AppShell } from "@/components/app-shell";
import { WorkflowCaseEditor } from "@/components/workflow-case-editor";

export const metadata = {
  title: "Workflow Approval",
};

export default async function WorkflowApprovalPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Approval Queue</p>
        <h1 className="mt-4 text-5xl">Record the approval decision</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Use this dedicated approval page to approve or reject verification, investigation, or director-level outcomes in accordance with the KPK workflow swimlane.
        </p>
      </section>
      <section className="mt-8">
        <WorkflowCaseEditor caseId={Number(caseId)} view="approval" />
      </section>
    </AppShell>
  );
}
