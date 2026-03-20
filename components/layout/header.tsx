"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Menu, Bell, Palette, DownloadCloud, Shield, Search, UserCircle, 
  LogIn, Settings, Command, Plus, Database, Network, Radar, Key, LayoutDashboard 
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { Account } from "@/lib/types/schema";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { isGuest, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- SMART COMMAND PALETTE STATES ---
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [vaultData, setVaultData] = useState<Account[]>([]);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // EKSTRAKSI PROFIL CERDAS
  const googleData = user?.providerData?.find((p: any) => p.providerId === 'google.com');
  const displayPhotoURL = user?.photoURL || googleData?.photoURL || "";
  const displayName = user?.displayName || googleData?.displayName || (isGuest ? "Pengguna Tamu" : "Pengguna Vault");

  // 1. Fetch Data untuk Global Search
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVaultData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[]);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Keyboard Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. Auto-hide Header saat scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
        setIsProfileMenuOpen(false);
        setIsSearchFocused(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // PWA Install Event
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Click Outside Handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const cycleTheme = () => {
    if (theme === "formal") setTheme("hacker");
    else if (theme === "hacker") setTheme("casual");
    else setTheme("formal");
  };

  const handleLoginRedirect = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("myvault_guest_mode");
      router.push("/");
    } catch (error) {
      console.error("Gagal kembali ke halaman login:", error);
    }
  };

  const getPageTitle = () => {
    const path = pathname.split('/')[2];
    if (!path) return "Dashboard Overview";
    if (path === 'vault') return "Data Vault";
    if (path === 'connectivity') return "Network Map";
    if (path === 'radar') return "Security Radar";
    if (path === 'settings') return "Pengaturan Sistem";
    return "Dashboard";
  };

  // --- SMART SEARCH COMMANDS ---
  const COMMANDS = [
    { id: 'cmd-1', title: 'Tambah Data Baru', href: '/dashboard/vault/create', icon: Plus, keywords: ['tambah', 'baru', 'create', 'new', 'add'] },
    { id: 'cmd-2', title: 'Pengaturan Sistem', href: '/dashboard/settings', icon: Settings, keywords: ['pengaturan', 'setting', 'konfigurasi'] },
    { id: 'cmd-3', title: 'Security Radar', href: '/dashboard/radar', icon: Radar, keywords: ['radar', 'security', 'keamanan', 'bocor', 'scan'] },
    { id: 'cmd-4', title: 'Peta Jaringan', href: '/dashboard/connectivity', icon: Network, keywords: ['network', 'jaringan', 'koneksi', 'map', 'topology'] },
    { id: 'cmd-5', title: 'Lihat Semua Data', href: '/dashboard/vault', icon: Database, keywords: ['vault', 'data', 'database', 'akun', 'semua'] },
    { id: 'cmd-6', title: 'Ringkasan Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'home', 'beranda', 'ringkasan'] },
  ];

  const searchLower = globalSearchQuery.toLowerCase();
  
  const filteredCommands = COMMANDS.filter(c => 
    c.title.toLowerCase().includes(searchLower) || c.keywords.some(k => k.includes(searchLower))
  );
  
  const filteredAccounts = vaultData.filter(a => 
    a.serviceName.toLowerCase().includes(searchLower) || a.identifier.toLowerCase().includes(searchLower)
  ).slice(0, 5); // Batasi 5 hasil agar tidak menutupi layar

  const handleSelectResult = (href: string) => {
    setGlobalSearchQuery("");
    setIsSearchFocused(false);
    router.push(href);
  };

  // --- STYLES ---
  const styles = {
    formal: {
      header: "bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 backdrop-blur-xl",
      search: "bg-slate-100/70 dark:bg-slate-900/70 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-950",
      btn: "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500 dark:text-slate-400",
      brandIcon: "bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 rounded-xl",
      dropdown: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl",
      menuItem: "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg",
      menuItemHighlight: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg",
      searchDropdown: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl",
      searchHighlight: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
    },
    hacker: {
      header: "bg-[#020202]/90 border-green-900/30 backdrop-blur-xl font-mono",
      search: "bg-black border border-green-900/50 focus:border-green-500 text-green-400 placeholder:text-green-900/50 rounded-sm",
      btn: "text-green-700 hover:text-green-400 hover:bg-green-900/20 rounded-sm",
      textMain: "text-green-500 drop-shadow-[0_0_2px_rgba(34,197,94,0.5)]",
      textSub: "text-green-800",
      brandIcon: "bg-black border border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)] rounded-sm",
      dropdown: "bg-[#050505] border border-green-900/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] rounded-sm",
      menuItem: "text-green-600 hover:bg-green-900/20 hover:text-green-400 rounded-sm",
      menuItemHighlight: "text-green-400 hover:bg-green-900/40 border border-transparent hover:border-green-500/50 rounded-sm",
      searchDropdown: "bg-[#050505] border border-green-900 shadow-[0_0_30px_rgba(34,197,94,0.15)] rounded-sm",
      searchHighlight: "bg-green-900/30 text-green-400 border-l-2 border-green-500"
    },
    casual: {
      header: "bg-orange-50/80 dark:bg-stone-900/80 border-orange-200 dark:border-stone-800 backdrop-blur-xl",
      search: "bg-white/50 dark:bg-stone-950/50 border border-transparent focus:border-orange-400/50 focus:bg-white dark:focus:bg-stone-950 rounded-2xl",
      btn: "text-stone-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-stone-800 rounded-2xl",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500 dark:text-stone-400",
      brandIcon: "bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg rounded-2xl",
      dropdown: "bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-800 shadow-xl rounded-3xl",
      menuItem: "text-stone-600 dark:text-stone-300 hover:bg-orange-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white rounded-xl",
      menuItemHighlight: "text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl",
      searchDropdown: "bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-orange-200 dark:border-stone-800 shadow-2xl rounded-2xl",
      searchHighlight: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
    }
  };

  const currentStyle = styles[theme];

  return (
    <header 
      className={cn(
        "fixed left-0 right-0 h-16 lg:h-20 border-b flex items-center justify-between px-4 lg:px-6 z-40 lg:z-50 transition-all duration-300 ease-in-out", 
        currentStyle.header,
        isVisible ? "top-0 translate-y-0" : "top-0 -translate-y-full"
      )}
    >
      {/* KIRI: Tombol Mobile Menu & Brand Logo */}
      <div className="flex items-center gap-4 min-w-[200px]">
        <button onClick={onOpenSidebar} className={cn("lg:hidden p-2 transition-all", currentStyle.btn)}>
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 flex items-center justify-center transition-all duration-500 shrink-0", currentStyle.brandIcon)}>
            <Shield size={18} />
          </div>
          <div className="flex flex-col">
            <span className={cn("font-bold text-lg tracking-tight leading-tight", currentStyle.textMain)}>Vault ID.</span>
            <span className={cn("text-[10px] font-semibold tracking-wider uppercase", theme === 'hacker' ? 'text-green-500' : 'text-blue-600 dark:text-blue-400')}>
              {theme.toUpperCase()} MODE
            </span>
          </div>
        </div>

        <div className="hidden xl:flex flex-col ml-6 pl-6 border-l border-slate-200 dark:border-slate-800">
          <h1 className={cn("text-sm font-bold tracking-tight", currentStyle.textMain)}>
            {theme === 'hacker' ? `> ${getPageTitle().toUpperCase()}` : getPageTitle()}
          </h1>
        </div>
      </div>

      {/* TENGAH: SMART COMMAND PALETTE */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={searchContainerRef}>
        <div className="relative group w-full">
          <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-opacity", 
            theme === 'hacker' ? 'text-green-700 group-focus-within:text-green-500' : 'text-slate-400 group-focus-within:text-blue-500'
          )} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={theme === 'hacker' ? "EXECUTE_COMMAND..." : "Cari menu atau akun global..."}
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className={cn("w-full pl-11 pr-4 py-2.5 text-sm outline-none transition-all shadow-sm", currentStyle.search)}
          />
          <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1", 
            theme === 'hacker' ? 'bg-green-900/30 text-green-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          )}>
            <Command size={10} /> K
          </div>
        </div>

        {/* DROPDOWN HASIL PENCARIAN GLOBAL */}
        {isSearchFocused && (
          <div className={cn("absolute top-full left-0 right-0 mt-2 border overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200", currentStyle.searchDropdown)}>
            
            {/* Hasil Command / Navigasi */}
            {filteredCommands.length > 0 && (
              <div className="p-2">
                <p className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 mb-1", currentStyle.textSub)}>
                  {theme === 'hacker' ? 'SYSTEM_COMMANDS' : 'Aksi Cepat'}
                </p>
                {filteredCommands.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelectResult(cmd.href)}
                    className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm transition-all", currentStyle.menuItem)}
                  >
                    <cmd.icon size={16} className={currentStyle.textSub} />
                    <span className="font-medium text-left">{cmd.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Hasil Database Vault */}
            {filteredAccounts.length > 0 && (
              <>
                {filteredCommands.length > 0 && <div className={cn("h-px w-full", theme === 'hacker' ? 'bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800')} />}
                <div className="p-2">
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 mb-1", currentStyle.textSub)}>
                    {theme === 'hacker' ? 'DATA_NODES' : 'Dari Vault Anda'}
                  </p>
                  {filteredAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => handleSelectResult(`/dashboard/vault/${acc.id}`)}
                      className={cn("w-full flex items-center justify-between px-3 py-2 transition-all", currentStyle.menuItem)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Key size={16} className={currentStyle.textSub} />
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className="font-bold text-sm truncate">{acc.serviceName}</span>
                          <span className={cn("text-[10px] truncate", currentStyle.textSub)}>{acc.identifier}</span>
                        </div>
                      </div>
                      <span className={cn("text-[9px] border px-1.5 py-0.5 rounded font-mono uppercase", 
                        theme === 'hacker' ? 'border-green-900/50 text-green-700' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      )}>
                        {acc.category}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {globalSearchQuery && filteredCommands.length === 0 && filteredAccounts.length === 0 && (
              <div className="p-6 text-center">
                <Search className={cn("mx-auto mb-2 opacity-50", currentStyle.textSub)} size={24} />
                <p className={cn("text-sm font-bold", currentStyle.textMain)}>Tidak ditemukan</p>
                <p className={cn("text-xs mt-1", currentStyle.textSub)}>Coba kata kunci lain atau periksa ejaan.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KANAN: User Profile & Dropdown */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 relative" ref={menuRef}>
        <button 
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={cn("p-2 transition-all flex items-center gap-2", currentStyle.btn)}
        >
          <div className="relative">
            {displayPhotoURL ? (
              <img 
                src={displayPhotoURL} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full object-cover group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <UserCircle size={26} strokeWidth={1.5} className="group-hover:scale-105 transition-transform" />
            )}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-950 shadow-sm" />
          </div>
        </button>

        <div 
          className={cn(
            "absolute right-0 top-full mt-2 w-64 border flex flex-col transition-all duration-200 origin-top-right overflow-hidden",
            currentStyle.dropdown,
            isProfileMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
          )}
        >
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {displayPhotoURL ? (
                <img 
                  src={displayPhotoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <UserCircle size={28} className="text-slate-400" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className={cn("text-sm font-bold truncate", currentStyle.textMain)}>
                {displayName}
              </span>
              <span className={cn("text-xs truncate", currentStyle.textSub)}>
                {isGuest ? "Sesi Anonim Sementara" : (user?.email || "Email tidak tersedia")}
              </span>
            </div>
          </div>

          <div className="p-2 flex flex-col gap-1">
            <button 
              onClick={() => {
                setIsProfileMenuOpen(false);
                router.push('/dashboard/settings');
              }}
              className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", currentStyle.menuItem)}
            >
              <Settings size={18} />
              <span className="flex-1 text-left">Pengaturan</span>
            </button>

            <button 
              className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", currentStyle.menuItem)}
            >
              <Bell size={18} />
              <span className="flex-1 text-left">Notifikasi</span>
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </button>

            <button 
              onClick={cycleTheme}
              className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", currentStyle.menuItem)}
            >
              <Palette size={18} />
              <span className="flex-1 text-left">Ganti Tema ({theme})</span>
            </button>

            {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors", currentStyle.menuItem)}
              >
                <DownloadCloud size={18} />
                <span className="flex-1 text-left">Pasang Aplikasi PWA</span>
              </button>
            )}

            {isGuest && (
              <>
                <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-1 mx-1" />
                <button 
                  onClick={handleLoginRedirect}
                  className={cn("flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-colors", currentStyle.menuItemHighlight)}
                >
                  <LogIn size={18} />
                  <span className="flex-1 text-left">Daftar / Masuk Permanen</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}