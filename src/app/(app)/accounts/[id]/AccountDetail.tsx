"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { StageBadge } from "@/components/badges";
import { ActivityPanel } from "@/components/ActivityPanel";
import { AccountForm } from "../AccountForm";
import { api, HttpError } from "@/lib/http";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OpportunityStage } from "@/lib/enums";

type Account = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  billingCity: string | null;
  employees: number | null;
  createdAt: string;
  ownedBy: { name: string };
  contacts: { id: string; firstName: string; lastName: string; email: string | null; title: string | null }[];
  opportunities: { id: string; name: string; stage: OpportunityStage; amount: number; closeDate: string }[];
};

export function AccountDetail({ id }: { id: string }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAccount(await api.get<Account>(`/api/accounts/${id}`));
    } catch {
      setError("Account not found");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function remove() {
    if (!confirm("Delete this account?")) return;
    try {
      await api.delete(`/api/accounts/${id}`);
      router.push("/accounts");
    } catch (e) {
      if (e instanceof HttpError) alert(e.message);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!account) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/accounts" className="text-sm text-brand-600 hover:underline">← Accounts</Link>
          <h1 className="mt-1 text-xl font-semibold">{account.name}</h1>
          <p className="text-sm text-gray-500">{account.industry ?? "—"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Website</dt><dd>{account.website ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{account.phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">City</dt><dd>{account.billingCity ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Employees</dt><dd>{account.employees ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Owner</dt><dd>{account.ownedBy?.name ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd>{formatDate(account.createdAt)}</dd></div>
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Contacts ({account.contacts.length})</h2>
          {account.contacts.length === 0 ? (
            <EmptyState title="No contacts" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {account.contacts.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                  <p className="text-xs text-gray-500">{c.title ?? c.email ?? ""}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Opportunities ({account.opportunities.length})</h2>
          {account.opportunities.length === 0 ? (
            <EmptyState title="No opportunities" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {account.opportunities.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/opportunities/${o.id}`} className="min-w-0 truncate font-medium text-brand-700 hover:underline">
                    {o.name}
                  </Link>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <StageBadge stage={o.stage} />
                    <span className="font-semibold">{formatCurrency(o.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ActivityPanel link={{ accountId: account.id }} />

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Account">
        <AccountForm initial={account} onSaved={() => { setEditing(false); load(); }} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
