"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useOwners } from "@/components/list";
import { api, HttpError } from "@/lib/http";

export type AccountFormValues = {
  id?: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  billingCity?: string | null;
  employees?: number | null;
  ownedById?: string;
};

export function AccountForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<AccountFormValues>;
  onSaved: (id?: string) => void;
  onCancel: () => void;
}) {
  const owners = useOwners();
  const [v, setV] = useState<AccountFormValues>({
    name: initial?.name ?? "",
    industry: initial?.industry ?? "",
    website: initial?.website ?? "",
    phone: initial?.phone ?? "",
    billingCity: initial?.billingCity ?? "",
    employees: initial?.employees ?? undefined,
    ownedById: initial?.ownedById,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...v,
        employees: v.employees === undefined || Number.isNaN(v.employees) ? undefined : Number(v.employees),
      };
      const res = isEdit
        ? await api.patch<{ id: string }>(`/api/accounts/${initial!.id}`, payload)
        : await api.post<{ id: string }>("/api/accounts", payload);
      onSaved(res.id);
    } catch (err) {
      if (err instanceof HttpError) setErrors(err.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Account name" error={errors.name}>
        <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Industry" error={errors.industry}>
          <Input value={v.industry ?? ""} onChange={(e) => setV({ ...v, industry: e.target.value })} />
        </Field>
        <Field label="Billing city" error={errors.billingCity}>
          <Input value={v.billingCity ?? ""} onChange={(e) => setV({ ...v, billingCity: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Website" error={errors.website}>
          <Input value={v.website ?? ""} onChange={(e) => setV({ ...v, website: e.target.value })} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input value={v.phone ?? ""} onChange={(e) => setV({ ...v, phone: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Employees" error={errors.employees}>
          <Input
            type="number"
            min="0"
            value={v.employees ?? ""}
            onChange={(e) => setV({ ...v, employees: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
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
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
