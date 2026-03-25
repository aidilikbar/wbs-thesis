import { AppShell } from "@/components/app-shell";
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
      <section className="max-w-5xl">
        <p className="eyebrow">Reporter Workspace</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,5.4rem)]">Manage Your Reports.</h1>
        <p className="muted mt-5 max-w-3xl text-lg leading-8">
          Review your whistleblowing transactions in a searchable table, open a dedicated create page for new submissions, and maintain editable reports from their own dedicated edit pages.
        </p>
      </section>
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
