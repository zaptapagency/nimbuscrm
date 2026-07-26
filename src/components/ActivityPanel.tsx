"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, EmptyState, Input, Select, Spinner, Textarea } from "@/components/ui";
import { ActivityTypeBadge } from "@/components/badges";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/enums";
import { api } from "@/lib/http";
import { formatDate } from "@/lib/utils";

export type ActivityLink = {
  leadId?: string;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;
};

type ActivityRow = {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  ownedBy?: { name: string };
};

export function ActivityPanel({ link }: { link: ActivityLink }) {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<ActivityType>("TASK");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const query = new URLSearchParams(
    Object.entries(link).filter(([, v]) => v) as [string, string][],
  ).toString();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<{ items: ActivityRow[] }>(`/api/activities?${query}`);
    setItems(data.items);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    await api.post("/api/activities", {
      type,
      subject,
      description: description || undefined,
      dueDate: dueDate || undefined,
      ...link,
    });
    setSubject("");
    setDescription("");
    setDueDate("");
    setAdding(false);
    load();
  }

  async function toggle(a: ActivityRow) {
    await api.patch(`/api/activities/${a.id}`, { completed: !a.completed });
    load();
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Activity Timeline</h2>
        <Button size="sm" variant="secondary" onClick={() => setAdding((a) => !a)}>
          {adding ? "Cancel" : "Log Activity"}
        </Button>
      </div>

      {adding ? (
        <form onSubmit={add} className="mb-4 space-y-2 rounded-md border border-gray-200 p-3">
          <div className="flex gap-2">
            <Select className="w-32" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <Textarea placeholder="Notes (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex items-center gap-2">
            <Input type="date" className="w-44" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Button type="submit" size="sm">Save</Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No activities yet" description="Log a call, meeting, task, or note." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={a.completed}
                onChange={() => toggle(a)}
                aria-label={`Complete ${a.subject}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ActivityTypeBadge type={a.type} />
                  <span className={a.completed ? "text-sm line-through text-gray-400" : "text-sm font-medium"}>
                    {a.subject}
                  </span>
                </div>
                {a.description ? <p className="mt-0.5 text-xs text-gray-500">{a.description}</p> : null}
                <p className="mt-0.5 text-xs text-gray-400">
                  {a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No due date"}
                  {a.ownedBy ? ` · ${a.ownedBy.name}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
