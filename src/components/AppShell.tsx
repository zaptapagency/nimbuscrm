"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui";
import { GlobalSearch } from "@/components/GlobalSearch";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/accounts", label: "Accounts" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/tasks", label: "My Tasks" },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <Link href="/dashboard" className="text-lg font-bold text-brand-700">
            NimbusCRM
          </Link>
          <div className="ml-2 hidden max-w-md flex-1 md:block">
            <GlobalSearch />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-gray-500">
                {user.role.replace("_", " ").toLowerCase()}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials(user.name)}
            </div>
            <Button size="sm" variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out
            </Button>
          </div>
        </div>
        <div className="px-4 pb-2 md:hidden">
          <GlobalSearch />
        </div>
      </header>

      <div className="flex flex-1">
        <nav
          className={cn(
            "w-52 shrink-0 border-r border-gray-200 bg-white p-3 md:block",
            open ? "block" : "hidden",
          )}
        >
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
