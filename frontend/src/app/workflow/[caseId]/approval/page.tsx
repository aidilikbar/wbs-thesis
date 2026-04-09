import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
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
      <PageIntro
        eyebrow="Approval Queue"
        title="Record the approval decision"
        description="Use this dedicated approval page to approve or reject verification, investigation, or director-level outcomes in accordance with the KPK workflow swimlane."
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Approval Queue", href: "/workflow/approvals" },
          { label: "Approval Case" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <WorkflowCaseEditor caseId={Number(caseId)} view="approval" />
      </section>
    </AppShell>
  );
}
