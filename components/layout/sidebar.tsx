"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Database, Network, User, Shield, Plus, Radar, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Vault", href: "/dashboard/vault", icon: Database },
  // FIX: Path Network diarahkan ke connectivity
  { title: "Network", href: "/dashboard/connectivity", icon: Network }, 
  { title: "Radar", href: "/dashboard/radar", icon: Radar },
  { title: "Profil", href: "/dashboard/profile", icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("myvault_guest_mode");
      router.push("/");
    } catch (error) {
      console.error("Gagal keluar:", error);
    }
  };

  const styles = {
    formal: {
      aside: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
      btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md",
      navDefault: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl",
      navActive: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl",
      brandIconMobile: "bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 rounded-xl",
      btnDanger: "text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl",
      footerBorder: "border-slate-100 dark:border-slate-800"
    },
    hacker: {
      aside: "bg-[#050505] border-green-900/30 font-mono shadow-[5px_0_30px_rgba(0,0,0,0.8)]",
      btnPrimary: "bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/50 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]",
      navDefault: "text-green-700 hover:text-green-400 hover:bg-green-900/10 rounded-sm",
      navActive: "bg-green-900/20 text-green-400 border-l-2 border-green-500 rounded-sm",
      brandIconMobile: "bg-black border border-green-500/50 text-green-400 rounded-sm",
      btnDanger: "text-green-800 hover:text-red-500 hover:bg-red-900/20 rounded-sm",
      footerBorder: "border-green-900/30"
    },
    casual: {
      aside: "bg-orange-50 dark:bg-stone-900 border-orange-200 dark:border-stone-800",
      btnPrimary: "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl shadow-lg",
      navDefault: "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-orange-100/50 dark:hover:bg-stone-800 rounded-2xl",
      navActive: "bg-orange-200/50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 rounded-2xl shadow-sm",
      brandIconMobile: "bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-2xl",
      btnDanger: "text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-2xl",
      footerBorder: "border-orange-200 dark:border-stone-800"
    }
  };

  const currentStyle = styles[theme];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn("fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={onClose}
      />

      <aside 
        className={cn(
          "fixed left-0 bottom-0 top-0 z-50 lg:z-40 flex flex-col border-r shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out group overflow-hidden",
          isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-20 lg:hover:w-72",
          currentStyle.aside
        )}
      >
        {/* Header / Logo Sidebar (Muncul permanen agar saat header hilang, bagian atas tidak kosong) */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-5 lg:px-6 border-b border-inherit lg:border-transparent shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn("w-9 h-9 flex items-center justify-center shrink-0 transition-all duration-500", currentStyle.brandIconMobile)}>
              <Shield size={18} />
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight whitespace-nowrap transition-all duration-300",
              !isOpen ? "lg:opacity-0 lg:w-0 lg:invisible" : "opacity-100 w-auto visible"
            )}>
              Vault ID.
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden opacity-50 hover:opacity-100 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Action Button (Tambah Data) */}
        <div className="p-4 shrink-0 lg:mt-2">
          <Link 
              href="/dashboard/vault/create"
              onClick={() => onClose()} 
              className={cn("flex items-center justify-center h-12 transition-all active:scale-95 overflow-hidden", currentStyle.btnPrimary)}
          >
              <Plus size={22} className="shrink-0 group-hover:rotate-90 transition-transform duration-300"/>
              <span className={cn(
                "whitespace-nowrap font-semibold transition-all duration-300",
                !isOpen ? "lg:opacity-0 lg:w-0 lg:invisible lg:ml-0 group-hover:opacity-100 group-hover:w-auto group-hover:visible group-hover:ml-3" : "ml-3",
                theme === 'hacker' ? 'tracking-widest text-xs' : 'text-sm'
              )}>
                {theme === 'hacker' ? 'INJECT_DATA' : 'Tambah Data'}
              </span>
          </Link>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()} 
                className={cn(
                  "flex items-center px-3.5 py-3.5 text-sm font-medium transition-all duration-200 overflow-hidden relative",
                  isActive ? currentStyle.navActive : currentStyle.navDefault
                )}
                title={item.title}
              >
                <item.icon size={22} className={cn("shrink-0 transition-colors", isActive ? "" : "opacity-60 group-hover:opacity-100")} />
                <span className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  !isOpen ? "lg:opacity-0 lg:-translate-x-2 lg:invisible group-hover:opacity-100 group-hover:translate-x-0 group-hover:visible" : "",
                  "ml-4"
                )}>
                  {theme === 'hacker' ? item.title.toUpperCase() : item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area (Logout) */}
        <div className={cn("p-4 mt-auto border-t shrink-0", currentStyle.footerBorder)}>
          <button
            onClick={handleLogout}
            title="Keluar"
            className={cn("flex items-center w-full px-3.5 py-3 text-sm font-medium transition-all duration-200 overflow-hidden", currentStyle.btnDanger)}
          >
            <LogOut size={22} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className={cn(
              "whitespace-nowrap transition-all duration-300",
              !isOpen ? "lg:opacity-0 lg:-translate-x-2 lg:invisible group-hover:opacity-100 group-hover:translate-x-0 group-hover:visible" : "",
              "ml-4"
            )}>
              {theme === 'hacker' ? 'TERMINATE_SESSION' : 'Keluar Akun'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}