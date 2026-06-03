import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnchorAI / DoubtGraph",
  description: "A span-grounded, node-based AI learning interface."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
