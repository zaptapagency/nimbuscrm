"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { StageBadge } from "@/components/badges";
import { api } from "@/lib/http";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OpportunityStage } from "@/lib/enums";

type Dashboard = {
  pipelineByStage: { stage: string; label: string; value: number; count: number }[];
  openPipelineValue: number;
  wonThisQuarter: number;
  conversionRate: number;
  totalLeads: number;
  convertedLeads: number;
  topOpen: {
    id: string;
    name: string;
    amount: number;
    stage: OpportunityStage;
    account: string | null;
  }[];
  overdueTasks: { id: string; subject: string; dueDate: string | null }[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </Card>
  );
}

export function DashboardClient() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Dashboard>("/api/dashboard")
      .then(setData)
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <Spinner label="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open Pipeline" value={formatCurrency(data.openPipelineValue)} />
        <Stat label="Won This Quarter" value={formatCurrency(data.wonThisQuarter)} />
        <Stat label="Lead Conversion" value={`${data.conversionRate}%`} />
        <Stat label="Total Leads" value={String(data.totalLeads)} />
      </div>

      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Pipeline value by stage
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineByStage} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Top 5 open opportunities
          </h2>
          {data.topOpen.length === 0 ? (
            <EmptyState title="No open opportunities" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.topOpen.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <Link
                      href={`/opportunities/${o.id}`}
                      className="block truncate text-sm font-medium text-brand-700 hover:underline"
                    >
                      {o.name}
                    </Link>
                    <p className="truncate text-xs text-gray-500">
                      {o.account ?? "No account"}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <StageBadge stage={o.stage} />
                    <span className="text-sm font-semibold">
                      {formatCurrency(o.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            My overdue tasks
          </h2>
          {data.overdueTasks.length === 0 ? (
            <EmptyState title="Nothing overdue" description="You're all caught up." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.overdueTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <span className="truncate text-sm">{t.subject}</span>
                  <span className="ml-3 shrink-0 text-xs text-red-600">
                    {formatDate(t.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
