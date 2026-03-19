import { redirect } from "next/navigation";

export const metadata = {
  title: "Workflow",
};

export default function InvestigatorPage() {
  redirect("/workflow");
}
