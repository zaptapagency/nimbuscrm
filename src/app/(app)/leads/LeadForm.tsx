"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useOwners } from "@/components/list";
import { LEAD_STATUSES } from "@/lib/enums";
import { api, HttpError } from "@/lib/http";

export type LeadFormValues = {
  id?: string;
  firstName: string;
  lastName: string;
  company: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  status: string;
  source?: string | null;
  ownedById?: string;
};

export function LeadForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<LeadFormValues>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const owners = useOwners();
  const [values, setValues] = useState<LeadFormValues>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    company: initial?.company ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    title: initial?.title ?? "",
    status: initial?.status ?? "NEW",
    source: initial?.source ?? "",
    ownedById: initial?.ownedById,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof LeadFormValues>(k: K, v: LeadFormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...values };
      if (isEdit) {
        await api.patch(`/api/leads/${initial!.id}`, payload);
      } else {
        await api.post("/api/leads", payload);
      }
      onSaved();
    } catch (err) {
      if (err instanceof HttpError) setErrors(err.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName}>
          <Input value={values.firstName} onChange={(e) => set("firstName", e.target.value)} required />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <Input value={values.lastName} onChange={(e) => set("lastName", e.target.value)} required />
        </Field>
      </div>
      <Field label="Company" error={errors.company}>
        <Input value={values.company} onChange={(e) => set("company", e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" error={errors.email}>
          <Input type="email" value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" error={errors.title}>
          <Input value={values.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Lead source" error={errors.source}>
          <Input value={values.source ?? ""} onChange={(e) => set("source", e.target.value)} placeholder="Web, Referral…" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" error={errors.status}>
          <Select value={values.status} onChange={(e) => set("status", e.target.value)}>
            {LEAD_STATUSES.filter((s) => s !== "CONVERTED").map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Owner" error={errors.ownedById}>
          <Select value={values.ownedById ?? ""} onChange={(e) => set("ownedById", e.target.value || undefined)}>
            <option value="">— Me / current —</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
        </Button>
      </div>
    </form>
  );
}
