import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Private Vault",
  description: "Secure Identity & Access Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        {/* Kita akan tambahkan Sidebar/Navbar di sini nanti */}
        <main className="w-full min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}