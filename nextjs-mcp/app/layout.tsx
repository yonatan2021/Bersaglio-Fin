import type { Metadata } from "next";
import "./globals.css";
import { UnlockModal } from "@/components/UnlockModal";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Bersaglio",
  description: "ברסליו — ניהול תקציב אישי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className="bg-background text-foreground antialiased">
        <Nav />
        {children}
        <UnlockModal />
      </body>
    </html>
  );
}
