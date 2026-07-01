import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Ale & Cris",
  description: "Ripartizione budget mensile da Notion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
