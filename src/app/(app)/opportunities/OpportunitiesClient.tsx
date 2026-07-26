"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { Column, PageHeader, Pagination, SortableTable } from "@/components/list";
import { OpportunityForm } from "./OpportunityForm";
import { OPPORTUNITY_STAGES } from "@/lib/enums";
import { STAGE_LABELS } from "@/lib/stage";
import { api } from "@/lib/http";
import { formatCurrency, formatDate } from "@/lib/utils";

type OppRow = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  closeDate: string;
  account: { id: string; name: string } | null;
  ownedBy: { name: string };
};

export function OpportunitiesClient() {
  const [rows, setRows] = useState<OppRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState("closeDate");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, order });
    if (q.trim()) params.set("q", q.trim());
    if (stage) params.set("stage", stage);
    const data = await api.get<{ items: OppRow[]; total: number }>(`/api/opportunities?${params}`);
    setRows(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [page, sort, order, q, stage]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function toggleSort(key: string) {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(key); setOrder("asc"); }
  }

  async function quickStage(id: string, value: string) {
    await api.patch(`/api/opportunities/${id}/stage`, { stage: value });
    load();
  }

  const columns: Column<OppRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <Link href={`/opportunities/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.name}</Link>
      ),
    },
    {
      key: "account",
      header: "Account",
      render: (r) => r.account ? <Link href={`/accounts/${r.account.id}`} className="text-brand-700 hover:underline">{r.account.name}</Link> : "—",
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      render: (r) => (
        <Select className="w-40 py-1 text-xs" value={r.stage} onChange={(e) => quickStage(r.id, e.target.value)} aria-label={`Stage for ${r.name}`}>
          {OPPORTUNITY_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </Select>
      ),
    },
    { key: "amount", header: "Amount", sortable: true, render: (r) => formatCurrency(r.amount) },
    { key: "probability", header: "Prob.", render: (r) => `${r.probability}%` },
    { key: "closeDate", header: "Close", sortable: true, render: (r) => formatDate(r.closeDate) },
    { key: "owner", header: "Owner", render: (r) => r.ownedBy?.name ?? "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Opportunities"
        action={
          <div className="flex gap-2">
            <Link href="/pipeline"><Button variant="secondary">Pipeline</Button></Link>
            <Button onClick={() => setCreating(true)}>New Opportunity</Button>
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search opportunities…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <Select className="max-w-[200px]" value={stage} onChange={(e) => { setPage(1); setStage(e.target.value); }}>
          <option value="">All stages</option>
          {OPPORTUNITY_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No opportunities found" description="Track your deals through the sales pipeline." action={<Button onClick={() => setCreating(true)}>New Opportunity</Button>} />
      ) : (
        <>
          <SortableTable columns={columns} rows={rows} sort={sort} order={order} onSort={toggleSort} />
          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Opportunity">
        <OpportunityForm onSaved={() => { setCreating(false); setPage(1); load(); }} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
