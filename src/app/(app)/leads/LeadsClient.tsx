"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { LeadStatusBadge } from "@/components/badges";
import {
  Column,
  PageHeader,
  Pagination,
  SortableTable,
} from "@/components/list";
import { LEAD_STATUSES } from "@/lib/enums";
import { api } from "@/lib/http";
import { formatDate } from "@/lib/utils";

type LeadRow = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string | null;
  status: string;
  source: string | null;
  createdAt: string;
  ownedBy: { id: string; name: string };
};

export function LeadsClient() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      order,
    });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const data = await api.get<{ items: LeadRow[]; total: number }>(
      `/api/leads?${params.toString()}`,
    );
    setRows(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [page, sort, order, q, status]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function toggleSort(key: string) {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setOrder("asc");
    }
  }

  async function quickStatus(id: string, value: string) {
    await api.patch(`/api/leads/${id}`, { status: value });
    load();
  }

  const columns: Column<LeadRow>[] = [
    {
      key: "lastName",
      header: "Name",
      sortable: true,
      render: (r) => (
        <Link href={`/leads/${r.id}`} className="font-medium text-brand-700 hover:underline">
          {r.firstName} {r.lastName}
        </Link>
      ),
    },
    { key: "company", header: "Company", sortable: true, render: (r) => r.company },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) =>
        r.status === "CONVERTED" ? (
          <LeadStatusBadge status="CONVERTED" />
        ) : (
          <Select
            className="w-36 py-1 text-xs"
            value={r.status}
            onChange={(e) => quickStatus(r.id, e.target.value)}
            aria-label={`Status for ${r.firstName} ${r.lastName}`}
          >
            {LEAD_STATUSES.filter((s) => s !== "CONVERTED").map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        ),
    },
    { key: "source", header: "Source", render: (r) => r.source ?? "—" },
    { key: "owner", header: "Owner", render: (r) => r.ownedBy?.name ?? "—" },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        action={<Button onClick={() => setCreating(true)}>New Lead</Button>}
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search name, company, email…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <Select
          className="max-w-[180px]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Create your first lead to start building your pipeline."
          action={<Button onClick={() => setCreating(true)}>New Lead</Button>}
        />
      ) : (
        <>
          <SortableTable columns={columns} rows={rows} sort={sort} order={order} onSort={toggleSort} />
          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Lead">
        <LeadFormLazy
          onSaved={() => {
            setCreating(false);
            setPage(1);
            load();
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </div>
  );
}

// Lazy import avoids loading owners list until modal opens.
import { LeadForm } from "./LeadForm";
function LeadFormLazy(props: { onSaved: () => void; onCancel: () => void }) {
  return <LeadForm {...props} />;
}
