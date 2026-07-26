import { OpportunityDetail } from "./OpportunityDetail";

export const metadata = { title: "Opportunity · NimbusCRM" };

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  return <OpportunityDetail id={params.id} />;
}
