import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vault ID",
  description: "Secure Identity & Access Management System",
  manifest: "/manifest.json", // Mendaftarkan file manifest
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vault ID",
  },
};

// Pengaturan Viewport terpisah (Next.js 14+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Mencegah zoom in otomatis saat input diklik di iOS
  themeColor: "#020617", // Warna status bar HP menyatu dengan aplikasi
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        {/* Menggunakan icon-192.png sebagai favicon utama agar konsisten */}
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-200 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {/* Sidebar SUDAH DIHAPUS DARI SINI dan dipindah ke dashboard/layout.tsx */}
        {/* Halaman ini bersih, hanya konten (Login) yang akan tampil di root */}
        {children}
      </body>
    </html>
  );
}