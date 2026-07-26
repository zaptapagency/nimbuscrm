import { ContactDetail } from "./ContactDetail";

export const metadata = { title: "Contact · NimbusCRM" };

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  return <ContactDetail id={params.id} />;
}
