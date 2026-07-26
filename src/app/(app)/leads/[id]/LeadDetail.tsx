"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { LeadStatusBadge } from "@/components/badges";
import { ActivityPanel } from "@/components/ActivityPanel";
import { LeadForm } from "../LeadForm";
import { api, HttpError } from "@/lib/http";
import { formatDate } from "@/lib/utils";
import type { LeadStatus } from "@/lib/enums";

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  status: LeadStatus;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  ownedBy: { id: string; name: string };
  createdBy: { id: string; name: string };
  convertedAccountId: string | null;
  convertedContactId: string | null;
  convertedOpportunityId: string | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function LeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLead(await api.get<Lead>(`/api/leads/${id}`));
    } catch {
      setError("Lead not found");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove() {
    if (!confirm("Delete this lead?")) return;
    try {
      await api.delete(`/api/leads/${id}`);
      router.push("/leads");
    } catch (e) {
      if (e instanceof HttpError) alert(e.message);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!lead) return <Spinner />;

  const converted = lead.status === "CONVERTED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/leads" className="text-sm text-brand-600 hover:underline">
            ← Leads
          </Link>
          <h1 className="mt-1 text-xl font-semibold">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-sm text-gray-500">{lead.company}</p>
        </div>
        <div className="flex gap-2">
          {!converted ? (
            <Button onClick={() => setConverting(true)}>Convert</Button>
          ) : null}
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </div>

      {converted ? (
        <Card className="border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
          This lead has been converted.{" "}
          {lead.convertedAccountId ? (
            <Link href={`/accounts/${lead.convertedAccountId}`} className="font-medium underline">
              View account
            </Link>
          ) : null}
          {lead.convertedOpportunityId ? (
            <>
              {" · "}
              <Link href={`/opportunities/${lead.convertedOpportunityId}`} className="font-medium underline">
                View opportunity
              </Link>
            </>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Details</h2>
          <Row label="Status" value={<LeadStatusBadge status={lead.status} />} />
          <Row label="Email" value={lead.email ?? "—"} />
          <Row label="Phone" value={lead.phone ?? "—"} />
          <Row label="Title" value={lead.title ?? "—"} />
          <Row label="Source" value={lead.source ?? "—"} />
          <Row label="Owner" value={lead.ownedBy?.name ?? "—"} />
          <Row label="Created by" value={lead.createdBy?.name ?? "—"} />
          <Row label="Created" value={formatDate(lead.createdAt)} />
        </Card>

        <ActivityPanel link={{ leadId: lead.id }} />
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Lead">
        <LeadForm
          initial={lead}
          onSaved={() => {
            setEditing(false);
            load();
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <ConvertModal
        open={converting}
        leadCompany={lead.company}
        onClose={() => setConverting(false)}
        onDone={() => {
          setConverting(false);
          load();
        }}
        id={lead.id}
      />
    </div>
  );
}

function ConvertModal({
  open,
  onClose,
  onDone,
  id,
  leadCompany,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  id: string;
  leadCompany: string;
}) {
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState("");
  const [amount, setAmount] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.post(`/api/leads/${id}/convert`, {
        createOpportunity,
        opportunityName: opportunityName || undefined,
        amount: amount ? Number(amount) : undefined,
        closeDate: closeDate || undefined,
      });
      onDone();
    } catch (e2) {
      if (e2 instanceof HttpError) setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Convert Lead">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Creates an account and contact from this lead
          {createOpportunity ? " and a new opportunity" : ""}.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={createOpportunity}
            onChange={(e) => setCreateOpportunity(e.target.checked)}
          />
          Create an opportunity
        </label>
        {createOpportunity ? (
          <>
            <Field label="Opportunity name">
              <Input
                value={opportunityName}
                onChange={(e) => setOpportunityName(e.target.value)}
                placeholder={`${leadCompany} - New Business`}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount">
                <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Close date">
                <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </Field>
            </div>
          </>
        ) : null}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Converting…" : "Convert"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
