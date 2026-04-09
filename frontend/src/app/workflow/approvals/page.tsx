import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { WorkflowDirectory } from "@/components/workflow-directory";

export const metadata = {
  title: "Workflow Approvals",
};

export default async function WorkflowApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Approval Workflow"
        title="Supervisor and director approval queue"
        description="Review the cases awaiting approval from the verification supervisor, investigation supervisor, or director, then open a dedicated approval page for the decision."
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Approval Queue" },
        ]}
        titleClassName="text-5xl"
      />
      <section className="mt-8">
        <WorkflowDirectory view="approval" initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
