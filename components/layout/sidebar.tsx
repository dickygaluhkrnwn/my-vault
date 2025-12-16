"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  Network, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Users
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "The Vault",
    href: "/dashboard/vault",
    icon: Database,
  },
  {
    title: "Konektivitas",
    href: "/dashboard/connectivity",
    icon: Network,
  },
  {
    title: "Family Access", // Fitur untuk mengatur akun keluarga nanti
    href: "/dashboard/family",
    icon: Users,
  },
  {
    title: "Pengaturan",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 text-slate-100 flex flex-col transition-all duration-300">
      {/* Header Sidebar */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="p-1.5 bg-blue-600/20 rounded-lg">
          <ShieldCheck size={24} className="text-blue-500" />
        </div>
        <span className="font-bold text-lg tracking-wide">My Vault</span>
      </div>

      {/* Menu List */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              )}
            >
              <item.icon size={18} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-all"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </aside>
  );
}