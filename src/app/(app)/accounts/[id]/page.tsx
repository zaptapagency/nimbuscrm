import { AccountDetail } from "./AccountDetail";

export const metadata = { title: "Account · NimbusCRM" };

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  return <AccountDetail id={params.id} />;
}
