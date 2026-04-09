import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { ReportDirectory } from "@/components/report-directory";

export const metadata = {
  title: "Reporter Reports",
};

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    reference?: string;
    trackingToken?: string;
  }>;
}) {
  const { notice, reference, trackingToken } = await searchParams;

  return (
    <AppShell>
      <PageIntro
        eyebrow="Reporter Workspace"
        title="Manage Your Reports."
        description="Review your whistleblowing transactions in a searchable table, open a dedicated create page for new submissions, and maintain editable reports from their own dedicated edit pages."
        titleClassName="text-[clamp(3rem,7vw,5.4rem)]"
      />
      <section className="mt-8">
        <ReportDirectory
          initialNotice={notice ?? null}
          initialReference={reference ?? null}
          initialTrackingToken={trackingToken ?? null}
        />
      </section>
    </AppShell>
  );
}
