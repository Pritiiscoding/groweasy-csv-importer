import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Importer — GrowEasy",
  description: "Upload any CRM export. The importer figures out the fields.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
