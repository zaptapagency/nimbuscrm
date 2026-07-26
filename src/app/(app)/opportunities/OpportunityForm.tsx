"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useOwners } from "@/components/list";
import { useAccounts } from "@/hooks/useAccounts";
import { OPPORTUNITY_STAGES } from "@/lib/enums";
import { STAGE_LABELS, defaultProbabilityForStage } from "@/lib/stage";
import { api, HttpError } from "@/lib/http";

export type OpportunityFormValues = {
  id?: string;
  name: string;
  stage: string;
  amount: number;
  probability?: number;
  closeDate: string;
  accountId?: string;
  ownedById?: string;
};

function toDateInput(d?: string): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function OpportunityForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<OpportunityFormValues>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const owners = useOwners();
  const accounts = useAccounts();
  const [v, setV] = useState<OpportunityFormValues>({
    name: initial?.name ?? "",
    stage: initial?.stage ?? "PROSPECTING",
    amount: initial?.amount ?? 0,
    probability: initial?.probability,
    closeDate: toDateInput(initial?.closeDate) || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    accountId: initial?.accountId,
    ownedById: initial?.ownedById,
  });
  const [probabilityTouched, setProbabilityTouched] = useState(initial?.probability !== undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  function setStage(stage: string) {
    setV((s) => ({
      ...s,
      stage,
      probability: probabilityTouched ? s.probability : defaultProbabilityForStage(stage as never),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        name: v.name,
        stage: v.stage,
        amount: Number(v.amount),
        probability: v.probability,
        closeDate: v.closeDate,
        accountId: v.accountId || undefined,
        ownedById: v.ownedById || undefined,
      };
      if (isEdit) await api.patch(`/api/opportunities/${initial!.id}`, payload);
      else await api.post("/api/opportunities", payload);
      onSaved();
    } catch (err) {
      if (err instanceof HttpError) setErrors(err.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  const shownProbability = v.probability ?? defaultProbabilityForStage(v.stage as never);

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" error={errors.name}>
        <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stage" error={errors.stage}>
          <Select value={v.stage} onChange={(e) => setStage(e.target.value)}>
            {OPPORTUNITY_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Amount" error={errors.amount}>
          <Input type="number" min="0" value={v.amount} onChange={(e) => setV({ ...v, amount: Number(e.target.value) })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Probability (%)" error={errors.probability}>
          <Input
            type="number"
            min="0"
            max="100"
            value={shownProbability}
            onChange={(e) => { setProbabilityTouched(true); setV({ ...v, probability: Number(e.target.value) }); }}
          />
        </Field>
        <Field label="Close date" error={errors.closeDate}>
          <Input type="date" value={v.closeDate} onChange={(e) => setV({ ...v, closeDate: e.target.value })} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account" error={errors.accountId}>
          <Select value={v.accountId ?? ""} onChange={(e) => setV({ ...v, accountId: e.target.value || undefined })}>
            <option value="">— No account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Owner" error={errors.ownedById}>
          <Select value={v.ownedById ?? ""} onChange={(e) => setV({ ...v, ownedById: e.target.value || undefined })}>
            <option value="">— Me / current —</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create opportunity"}
        </Button>
      </div>
    </form>
  );
}
