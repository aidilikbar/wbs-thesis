import { AppShell } from "@/components/app-shell";
import { WorkflowWorkbench } from "@/components/workflow-workbench";

export const metadata = {
  title: "Workflow",
};

export default function WorkflowPage() {
  return (
    <AppShell>
      <section className="max-w-5xl">
        <p className="eyebrow">Role-Based Workflow</p>
        <h1 className="mt-4 text-5xl">Internal case processing aligned to the KPK business process</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Supervisors, verificators, investigators, director, and system administrator access the same governed case dataset, but only the accountable role can execute the active workflow action.
        </p>
      </section>
      <section className="mt-8">
        <WorkflowWorkbench />
      </section>
    </AppShell>
  );
}
