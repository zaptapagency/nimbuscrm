"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { StageBadge } from "@/components/badges";
import { ActivityPanel } from "@/components/ActivityPanel";
import { OpportunityForm } from "../OpportunityForm";
import { api, HttpError } from "@/lib/http";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OpportunityStage } from "@/lib/enums";

type Opportunity = {
  id: string;
  name: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  closeDate: string;
  createdAt: string;
  account: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  ownedBy: { name: string };
};

export function OpportunityDetail({ id }: { id: string }) {
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setOpp(await api.get<Opportunity>(`/api/opportunities/${id}`));
    } catch {
      setError("Opportunity not found");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function remove() {
    if (!confirm("Delete this opportunity?")) return;
    try {
      await api.delete(`/api/opportunities/${id}`);
      router.push("/opportunities");
    } catch (e) {
      if (e instanceof HttpError) alert(e.message);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!opp) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/opportunities" className="text-sm text-brand-600 hover:underline">← Opportunities</Link>
          <h1 className="mt-1 text-xl font-semibold">{opp.name}</h1>
          <div className="mt-1"><StageBadge stage={opp.stage} /></div>
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
            <div className="flex justify-between"><dt className="text-gray-500">Amount</dt><dd className="font-semibold">{formatCurrency(opp.amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Probability</dt><dd>{opp.probability}%</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Weighted</dt><dd>{formatCurrency(opp.amount * opp.probability / 100)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Close date</dt><dd>{formatDate(opp.closeDate)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Account</dt>
              <dd>{opp.account ? <Link href={`/accounts/${opp.account.id}`} className="text-brand-700 hover:underline">{opp.account.name}</Link> : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Contact</dt>
              <dd>{opp.contact ? <Link href={`/contacts/${opp.contact.id}`} className="text-brand-700 hover:underline">{opp.contact.firstName} {opp.contact.lastName}</Link> : "—"}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-gray-500">Owner</dt><dd>{opp.ownedBy?.name ?? "—"}</dd></div>
          </dl>
        </Card>

        <ActivityPanel link={{ opportunityId: opp.id }} />
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Opportunity">
        <OpportunityForm
          initial={{ ...opp, accountId: opp.account?.id }}
          onSaved={() => { setEditing(false); load(); }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </div>
  );
}
