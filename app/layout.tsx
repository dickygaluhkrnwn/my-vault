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
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-200 min-h-screen antialiased`}>
        {/* Sidebar SUDAH DIHAPUS DARI SINI dan dipindah ke dashboard/layout.tsx */}
        {/* Halaman ini bersih, hanya konten (Login) yang akan tampil di root */}
        {children}
      </body>
    </html>
  );
}