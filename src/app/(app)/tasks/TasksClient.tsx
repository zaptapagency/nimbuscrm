"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/list";
import { ActivityTypeBadge } from "@/components/badges";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/enums";
import { api } from "@/lib/http";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  contact: { id: string; firstName: string; lastName: string } | null;
  account: { id: string; name: string } | null;
  opportunity: { id: string; name: string } | null;
};

export function TasksClient() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [type, setType] = useState<ActivityType>("TASK");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ scope: "mine" });
    if (!showCompleted) params.set("completed", "false");
    const data = await api.get<{ items: Activity[] }>(`/api/activities?${params}`);
    setItems(data.items);
    setLoading(false);
  }, [showCompleted]);

  useEffect(() => { load(); }, [load]);

  async function toggle(a: Activity) {
    await api.patch(`/api/activities/${a.id}`, { completed: !a.completed });
    load();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    await api.post("/api/activities", { type, subject, dueDate: dueDate || undefined });
    setSubject("");
    setDueDate("");
    load();
  }

  const relatedLink = (a: Activity) => {
    if (a.opportunity) return { href: `/opportunities/${a.opportunity.id}`, label: a.opportunity.name };
    if (a.account) return { href: `/accounts/${a.account.id}`, label: a.account.name };
    if (a.contact) return { href: `/contacts/${a.contact.id}`, label: `${a.contact.firstName} ${a.contact.lastName}` };
    return null;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Tasks"
        action={
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
            Show completed
          </label>
        }
      />

      <Card className="p-3">
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <Select className="w-32" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
            ))}
          </Select>
          <Input className="min-w-[200px] flex-1" placeholder="New task subject…" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Input type="date" className="w-44" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
      </Card>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No open tasks" description="You're all caught up. Add a task above." />
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {items.map((a) => {
              const link = relatedLink(a);
              const overdue = !a.completed && a.dueDate && new Date(a.dueDate) < new Date();
              return (
                <li key={a.id} className="flex items-start gap-3 p-3">
                  <input type="checkbox" className="mt-1" checked={a.completed} onChange={() => toggle(a)} aria-label={`Complete ${a.subject}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ActivityTypeBadge type={a.type} />
                      <span className={a.completed ? "text-sm line-through text-gray-400" : "text-sm font-medium"}>{a.subject}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      <span className={cn(overdue && "font-medium text-red-600")}>
                        {a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No due date"}
                      </span>
                      {link ? (
                        <>
                          {" · "}
                          <Link href={link.href} className="text-brand-600 hover:underline">{link.label}</Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
