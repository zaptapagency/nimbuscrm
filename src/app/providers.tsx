"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ConfirmProvider } from "@/components/ConfirmDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SessionProvider>
        <ConfirmProvider>
          {children}
          <Toaster position="top-right" />
        </ConfirmProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
