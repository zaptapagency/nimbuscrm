"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui";
import { PageHeader } from "@/components/list";
import { OPPORTUNITY_STAGES, type OpportunityStage } from "@/lib/enums";
import { STAGE_LABELS } from "@/lib/stage";
import { api } from "@/lib/http";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Opp = {
  id: string;
  name: string;
  stage: OpportunityStage;
  amount: number;
  account: { id: string; name: string } | null;
};

export function PipelineBoard() {
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<{ items: Opp[] }>("/api/opportunities?pageSize=100&sort=amount&order=desc");
    setOpps(data.items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function drop(stage: OpportunityStage) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const current = opps.find((o) => o.id === id);
    if (!current || current.stage === stage) return;
    // optimistic update
    setOpps((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    try {
      await api.patch(`/api/opportunities/${id}/stage`, { stage });
    } catch {
      load(); // revert on failure
    }
  }

  if (loading) return <Spinner label="Loading pipeline…" />;

  return (
    <div>
      <PageHeader
        title="Pipeline"
        action={<Link href="/opportunities" className="text-sm text-brand-600 hover:underline">List view →</Link>}
      />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {OPPORTUNITY_STAGES.map((stage) => {
          const items = opps.filter((o) => o.stage === stage);
          const sum = items.reduce((s, o) => s + o.amount, 0);
          return (
            <div
              key={stage}
              data-stage={stage}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => drop(stage)}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-lg border bg-gray-50 p-2",
                overStage === stage ? "border-brand-500 bg-brand-50" : "border-gray-200",
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-700">{STAGE_LABELS[stage]}</h3>
                <span className="text-xs text-gray-500">{items.length}</span>
              </div>
              <p className="mb-2 px-1 text-xs font-medium text-gray-500">{formatCurrency(sum)}</p>
              <div className="flex flex-1 flex-col gap-2">
                {items.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    data-opp-id={o.id}
                    onDragStart={() => setDragId(o.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "cursor-grab rounded-md border border-gray-200 bg-white p-2 shadow-sm active:cursor-grabbing",
                      dragId === o.id && "opacity-50",
                    )}
                  >
                    <Link
                      href={`/opportunities/${o.id}`}
                      className="block truncate text-sm font-medium text-brand-700 hover:underline"
                      draggable={false}
                    >
                      {o.name}
                    </Link>
                    <p className="truncate text-xs text-gray-500">{o.account?.name ?? "No account"}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-700">{formatCurrency(o.amount)}</p>
                  </div>
                ))}
                {items.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-gray-400">Drop here</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
