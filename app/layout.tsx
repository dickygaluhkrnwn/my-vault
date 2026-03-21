import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/react"; // <-- Import Vercel Analytics

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vault ID",
  description: "Secure Identity & Access Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vault ID",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/icon-192.png" />
      </head>
      {/* Background dan text color akan dikendalikan otomatis oleh CSS Variables tema */}
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider>
          {/* Bungkus dengan AuthProvider untuk Proteksi Rute */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        
        {/* Komponen Analytics dari Vercel untuk melacak pengunjung */}
        <Analytics />
      </body>
    </html>
  );
}