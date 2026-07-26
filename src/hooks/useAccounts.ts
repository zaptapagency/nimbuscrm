"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/http";

export type AccountOption = { id: string; name: string };

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  useEffect(() => {
    api
      .get<{ items: AccountOption[] }>("/api/accounts?pageSize=100&sort=name&order=asc")
      .then((d) => setAccounts(d.items.map((a) => ({ id: a.id, name: a.name }))))
      .catch(() => setAccounts([]));
  }, []);
  return accounts;
}
