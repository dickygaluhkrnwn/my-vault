"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  Network, 
  Settings, 
  LogOut, 
  Shield, 
  Users,
  Plus,
  ChevronRight,
  Terminal,
  Activity,
  X, // Icon Close untuk Mobile
  Download // Icon untuk Install App
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "DASHBOARD",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "THE_VAULT",
    href: "/dashboard/vault",
    icon: Database,
  },
  {
    title: "NETWORK_MAP",
    href: "/dashboard/connectivity",
    icon: Network,
  },
  {
    title: "FAMILY_ACCESS", 
    href: "/dashboard/family",
    icon: Users,
  },
  {
    title: "SYSTEM_CONFIG",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      // Mencegah browser menampilkan prompt default
      e.preventDefault();
      // Simpan event untuk dipicu nanti
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Tampilkan prompt install
    installPrompt.prompt();
    // Tunggu respon user
    const { outcome } = await installPrompt.userChoice;
    // Jika user menginstall, kita bisa clear prompt nya (opsional)
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <>
      {/* Mobile Overlay (Background gelap saat sidebar terbuka di HP) */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 text-slate-400 flex flex-col font-mono shadow-[5px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        
        {/* Header Sidebar Brand */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 gap-3 relative overflow-hidden shrink-0">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded-lg">
              <Shield size={20} className="text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base lg:text-lg tracking-widest text-slate-200">
                VAULT_ID
              </span>
              <span className="text-[9px] text-cyan-500 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                v2.0_BETA
              </span>
            </div>
          </div>

          {/* Close Button (Mobile Only) */}
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 pb-2">
          <Link 
              href="/dashboard/vault/create"
              onClick={() => onClose()} // Auto close on click (mobile)
              className="group flex items-center justify-center gap-2 w-full bg-cyan-900/20 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 font-bold py-3 px-4 rounded transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
          >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300"/>
              <span className="text-xs tracking-wider">INJECT_DATA</span>
          </Link>
        </div>

        {/* Menu List */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 mt-2 flex items-center gap-2">
            <Terminal size={10} />
            Main_Modules
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()} // Auto close on click (mobile)
                className={cn(
                  "group flex items-center justify-between px-4 py-3 text-xs font-bold tracking-wide rounded-lg transition-all duration-200 border border-transparent",
                  isActive 
                    ? "bg-slate-900 text-cyan-400 border-slate-800 shadow-inner" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 hover:border-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className={cn(
                      "transition-colors",
                      isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"
                  )} />
                  {item.title}
                </div>
                {isActive && <ChevronRight size={14} className="text-cyan-500 animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        {/* System Status / Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-2">
          {/* Install App Button (Visible only if installPrompt exists) */}
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex w-full items-center gap-3 px-4 py-2 text-xs font-bold text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all group tracking-wider"
            >
              <Download size={16} className="group-hover:animate-bounce" />
              INSTALL_APP
            </button>
          )}

          <div className="px-2 py-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-bold">SYSTEM_STATUS</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono animate-pulse">ONLINE</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2 text-xs font-bold text-red-500/70 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all border border-transparent hover:border-red-900/30 group tracking-wider"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            TERMINATE_SESSION
          </button>
        </div>
      </aside>
    </>
  );
}