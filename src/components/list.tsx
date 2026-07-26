"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { api } from "@/lib/http";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function SortableTable<T extends { id: string }>({
  columns,
  rows,
  sort,
  order,
  onSort,
}: {
  columns: Column<T>[];
  rows: T[];
  sort?: string;
  order?: "asc" | "desc";
  onSort?: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-2 font-medium", c.className)}>
                {c.sortable && onSort ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-gray-800"
                    onClick={() => onSort(c.key)}
                  >
                    {c.header}
                    {sort === c.key ? (order === "asc" ? "▲" : "▼") : ""}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-2 align-middle", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Prev
        </Button>
        <span className="px-2 py-1">
          Page {page} / {pages}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export type OwnerOption = { id: string; name: string; role: string };

export function useOwners() {
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  useEffect(() => {
    api
      .get<{ items: OwnerOption[] }>("/api/users")
      .then((d) => setOwners(d.items))
      .catch(() => setOwners([]));
  }, []);
  return owners;
}
