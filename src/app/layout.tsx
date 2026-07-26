import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { validateEnv } from "@/lib/env";

// Validate environment at boot time
validateEnv();

export const metadata: Metadata = {
  title: "NimbusCRM",
  description: "A Salesforce-inspired CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
