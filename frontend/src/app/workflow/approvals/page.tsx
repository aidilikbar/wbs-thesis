import { AppShell } from "@/components/app-shell";
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
      <section className="max-w-5xl">
        <p className="eyebrow">Approval Workflow</p>
        <h1 className="mt-4 text-5xl">Supervisor and director approval queue</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Review the cases awaiting approval from Supervisor of Verificator, Supervisor of Investigator, or Director, then open a dedicated approval page for the decision.
        </p>
      </section>
      <section className="mt-8">
        <WorkflowDirectory view="approval" initialNotice={notice ?? null} />
      </section>
    </AppShell>
  );
}
