"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { StageBadge } from "@/components/badges";
import { ActivityPanel } from "@/components/ActivityPanel";
import { ContactForm } from "../ContactForm";
import { api, HttpError } from "@/lib/http";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OpportunityStage } from "@/lib/enums";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  createdAt: string;
  account: { id: string; name: string } | null;
  ownedBy: { name: string };
  opportunities: { id: string; name: string; stage: OpportunityStage; amount: number }[];
};

export function ContactDetail({ id }: { id: string }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setContact(await api.get<Contact>(`/api/contacts/${id}`));
    } catch {
      setError("Contact not found");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function remove() {
    if (!confirm("Delete this contact?")) return;
    try {
      await api.delete(`/api/contacts/${id}`);
      router.push("/contacts");
    } catch (e) {
      if (e instanceof HttpError) alert(e.message);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!contact) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/contacts" className="text-sm text-brand-600 hover:underline">← Contacts</Link>
          <h1 className="mt-1 text-xl font-semibold">{contact.firstName} {contact.lastName}</h1>
          <p className="text-sm text-gray-500">{contact.title ?? "—"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{contact.email ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{contact.phone ?? "—"}</dd></div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Account</dt>
              <dd>{contact.account ? <Link href={`/accounts/${contact.account.id}`} className="text-brand-700 hover:underline">{contact.account.name}</Link> : "—"}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-gray-500">Owner</dt><dd>{contact.ownedBy?.name ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd>{formatDate(contact.createdAt)}</dd></div>
          </dl>

          <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-700">Opportunities</h3>
          {contact.opportunities.length === 0 ? (
            <EmptyState title="No opportunities" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {contact.opportunities.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/opportunities/${o.id}`} className="truncate font-medium text-brand-700 hover:underline">{o.name}</Link>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <StageBadge stage={o.stage} />
                    <span className="font-semibold">{formatCurrency(o.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <ActivityPanel link={{ contactId: contact.id }} />
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Contact">
        <ContactForm initial={{ ...contact, accountId: contact.account?.id }} onSaved={() => { setEditing(false); load(); }} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
