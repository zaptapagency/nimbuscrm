"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useOwners } from "@/components/list";
import { useAccounts } from "@/hooks/useAccounts";
import { api, HttpError } from "@/lib/http";

export type ContactFormValues = {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  accountId?: string;
  ownedById?: string;
};

export function ContactForm({
  initial,
  lockedAccountId,
  onSaved,
  onCancel,
}: {
  initial?: Partial<ContactFormValues>;
  lockedAccountId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const owners = useOwners();
  const accounts = useAccounts();
  const [v, setV] = useState<ContactFormValues>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    title: initial?.title ?? "",
    accountId: initial?.accountId ?? lockedAccountId,
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
      const payload = { ...v, accountId: v.accountId || undefined };
      if (isEdit) await api.patch(`/api/contacts/${initial!.id}`, payload);
      else await api.post("/api/contacts", payload);
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
          <Input value={v.firstName} onChange={(e) => setV({ ...v, firstName: e.target.value })} required />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <Input value={v.lastName} onChange={(e) => setV({ ...v, lastName: e.target.value })} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" error={errors.email}>
          <Input type="email" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input value={v.phone ?? ""} onChange={(e) => setV({ ...v, phone: e.target.value })} />
        </Field>
      </div>
      <Field label="Title" error={errors.title}>
        <Input value={v.title ?? ""} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </Field>
      {!lockedAccountId ? (
        <Field label="Account" error={errors.accountId}>
          <Select value={v.accountId ?? ""} onChange={(e) => setV({ ...v, accountId: e.target.value || undefined })}>
            <option value="">— No account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Owner" error={errors.ownedById}>
        <Select value={v.ownedById ?? ""} onChange={(e) => setV({ ...v, ownedById: e.target.value || undefined })}>
          <option value="">— Me / current —</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create contact"}
        </Button>
      </div>
    </form>
  );
}
