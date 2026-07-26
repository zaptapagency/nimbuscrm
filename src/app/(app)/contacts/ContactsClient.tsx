"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Input, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { Column, PageHeader, Pagination, SortableTable } from "@/components/list";
import { ContactForm } from "./ContactForm";
import { api } from "@/lib/http";
import { formatDate } from "@/lib/utils";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  createdAt: string;
  account: { id: string; name: string } | null;
  ownedBy: { name: string };
};

export function ContactsClient() {
  const [rows, setRows] = useState<ContactRow[]>([]);
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
    const data = await api.get<{ items: ContactRow[]; total: number }>(`/api/contacts?${params}`);
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

  const columns: Column<ContactRow>[] = [
    {
      key: "lastName",
      header: "Name",
      sortable: true,
      render: (r) => (
        <Link href={`/contacts/${r.id}`} className="font-medium text-brand-700 hover:underline">
          {r.firstName} {r.lastName}
        </Link>
      ),
    },
    { key: "title", header: "Title", render: (r) => r.title ?? "—" },
    {
      key: "account",
      header: "Account",
      render: (r) => r.account ? (
        <Link href={`/accounts/${r.account.id}`} className="text-brand-700 hover:underline">{r.account.name}</Link>
      ) : "—",
    },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "owner", header: "Owner", render: (r) => r.ownedBy?.name ?? "—" },
    { key: "createdAt", header: "Created", sortable: true, render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Contacts" action={<Button onClick={() => setCreating(true)}>New Contact</Button>} />
      <div className="mb-3">
        <Input className="max-w-xs" placeholder="Search contacts…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No contacts found" description="Add contacts and link them to accounts." action={<Button onClick={() => setCreating(true)}>New Contact</Button>} />
      ) : (
        <>
          <SortableTable columns={columns} rows={rows} sort={sort} order={order} onSort={toggleSort} />
          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Contact">
        <ContactForm onSaved={() => { setCreating(false); setPage(1); load(); }} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
