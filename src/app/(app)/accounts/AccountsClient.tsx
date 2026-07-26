"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Input, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { Column, PageHeader, Pagination, SortableTable } from "@/components/list";
import { AccountForm } from "./AccountForm";
import { api } from "@/lib/http";
import { formatDate } from "@/lib/utils";

type AccountRow = {
  id: string;
  name: string;
  industry: string | null;
  billingCity: string | null;
  createdAt: string;
  ownedBy: { name: string };
  _count: { contacts: number; opportunities: number };
};

export function AccountsClient() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, order });
    if (q.trim()) params.set("q", q.trim());
    const data = await api.get<{ items: AccountRow[]; total: number }>(`/api/accounts?${params}`);
    setRows(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [page, sort, order, q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function toggleSort(key: string) {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(key); setOrder("asc"); }
  }

  const columns: Column<AccountRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <Link href={`/accounts/${r.id}`} className="font-medium text-brand-700 hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: "industry", header: "Industry", sortable: true, render: (r) => r.industry ?? "—" },
    { key: "city", header: "City", render: (r) => r.billingCity ?? "—" },
    { key: "contacts", header: "Contacts", render: (r) => r._count.contacts },
    { key: "opps", header: "Opps", render: (r) => r._count.opportunities },
    { key: "owner", header: "Owner", render: (r) => r.ownedBy?.name ?? "—" },
    { key: "createdAt", header: "Created", sortable: true, render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Accounts" action={<Button onClick={() => setCreating(true)}>New Account</Button>} />
      <div className="mb-3">
        <Input className="max-w-xs" placeholder="Search accounts…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No accounts found" description="Create an account to organize your contacts and deals." action={<Button onClick={() => setCreating(true)}>New Account</Button>} />
      ) : (
        <>
          <SortableTable columns={columns} rows={rows} sort={sort} order={order} onSort={toggleSort} />
          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Account">
        <AccountForm onSaved={() => { setCreating(false); setPage(1); load(); }} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
