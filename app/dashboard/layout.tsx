"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu, Shield } from "lucide-react"; // Icon Hamburger & Logo

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* MOBILE HEADER (Hanya muncul di layar kecil) */}
      <header className="lg:hidden h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-cyan-950/30 border border-cyan-500/30 rounded">
              <Shield size={18} className="text-cyan-400" />
            </div>
            <span className="font-bold text-slate-200 tracking-widest">MY_VAULT</span>
        </div>
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded transition-colors"
        >
            <Menu size={24} />
        </button>
      </header>

      {/* Sidebar (Responsive State passed here) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      {/* lg:ml-64 memberikan margin kiri hanya di desktop */}
      <main className="flex-1 lg:ml-64 min-h-[calc(100vh-64px)] lg:min-h-screen bg-slate-950 text-slate-200 transition-all duration-300 relative">
        {/* Global Grid Background Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
             style={{ 
                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                 backgroundSize: '50px 50px' 
             }} 
        />
        
        {/* Content Padding yang responsif */}
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}