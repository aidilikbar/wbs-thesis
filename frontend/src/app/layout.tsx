import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KPK Whistleblowing System",
    template: "%s | KPK Whistleblowing System",
  },
  description:
    "KPK Whistleblowing System with secure reporting, protected case tracking, investigator coordination, and governance oversight.",
  icons: {
    icon: "/logos/kws_favicon.png",
    shortcut: "/logos/kws_favicon.png",
    apple: "/logos/kws_favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
