"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header"; 
import { useTheme } from "@/components/theme-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    // Struktur layout utama disesuaikan agar Header tidak ditimpa
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100">
      
      {/* Header merentang penuh di atas */}
      <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

      {/* Kontainer utama diberi Padding Top agar isinya tidak menyusup ke bawah Header yang fixed */}
      <div className="flex flex-1 pt-16 lg:pt-20">
        
        {/* Sidebar dipanggil di sini */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area: Margin kiri menyisakan tempat untuk Sidebar yang menciut (w-20 / 80px) */}
        <main className="flex-1 relative transition-all duration-500 overflow-x-hidden lg:ml-20">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none z-0" 
               style={{ 
                   backgroundImage: theme === 'hacker' 
                      ? 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)' 
                      : 'radial-gradient(currentColor 1px, transparent 1px)', 
                   backgroundSize: theme === 'hacker' ? '40px 40px' : '32px 32px' 
               }} 
          />
          
          {/* Area Render Halaman */}
          <div className="p-4 md:p-8 xl:p-10 max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}