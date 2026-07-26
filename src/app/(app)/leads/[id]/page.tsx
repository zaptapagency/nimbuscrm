import { LeadDetail } from "./LeadDetail";

export const metadata = { title: "Lead · NimbusCRM" };

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  return <LeadDetail id={params.id} />;
}
