"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/http";
import { Input } from "@/components/ui";

type SearchResults = {
  leads: { id: string; label: string }[];
  accounts: { id: string; label: string }[];
  contacts: { id: string; label: string }[];
  opportunities: { id: string; label: string }[];
};

const GROUPS: { key: keyof SearchResults; label: string; path: string }[] = [
  { key: "leads", label: "Leads", path: "/leads" },
  { key: "accounts", label: "Accounts", path: "/accounts" },
  { key: "contacts", label: "Contacts", path: "/contacts" },
  { key: "opportunities", label: "Opportunities", path: "/opportunities" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.get<SearchResults>(
          `/api/search?q=${encodeURIComponent(q.trim())}`,
        );
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total = results
    ? GROUPS.reduce((sum, g) => sum + results[g.key].length, 0)
    : 0;

  return (
    <div className="relative" ref={boxRef}>
      <Input
        type="search"
        placeholder="Search leads, accounts, contacts, opportunities…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results && setOpen(true)}
        aria-label="Global search"
      />
      {open && results ? (
        <div className="absolute z-30 mt-1 max-h-96 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {total === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500">No results found</p>
          ) : (
            GROUPS.map((g) =>
              results[g.key].length ? (
                <div key={g.key} className="py-1">
                  <p className="px-3 py-1 text-xs font-semibold uppercase text-gray-400">
                    {g.label}
                  </p>
                  {results[g.key].map((r) => (
                    <button
                      key={r.id}
                      className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                      onClick={() => {
                        setOpen(false);
                        setQ("");
                        router.push(`${g.path}/${r.id}`);
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              ) : null,
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
