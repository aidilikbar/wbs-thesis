import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KPK Whistleblowing System",
    template: "%s | KPK Whistleblowing System",
  },
  description:
    "KPK Whistleblowing System with secure reporting, protected case tracking, investigator coordination, and governance oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
