import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Note: Environment validation runs at server startup via Dockerfile CMD,
// not during build time. This ensures validation happens in production
// where environment variables are actually available.

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
