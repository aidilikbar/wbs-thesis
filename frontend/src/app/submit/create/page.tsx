import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { ReportForm } from "@/components/report-form";

export const metadata = {
  title: "Create Report",
};

export default function SubmitCreatePage() {
  return (
    <AppShell>
      <PageIntro
        eyebrow="Reporter Workspace"
        title="Create Secure Report."
        description="Enter the corruption allegation from a dedicated create screen. After submission, the workflow returns to the reporter transaction index together with the issued reference and tracking token."
        breadcrumbs={[
          { label: "Reports", href: "/submit" },
          { label: "Create Report" },
        ]}
        titleClassName="text-[clamp(3rem,7vw,5.4rem)]"
      />
      <section className="mt-8">
        <ReportForm mode="create" />
      </section>
    </AppShell>
  );
}
