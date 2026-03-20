"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  onSnapshot, 
  where,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { TEMPLATES, TemplateField } from "@/lib/constants/templates"; 
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { 
  Plus, Search, Gamepad2, Wallet, Share2, Briefcase, Mail, Music, 
  MoreVertical, Loader2, X, User, Pencil, Trash2, AlertTriangle, 
  Eye, EyeOff, Terminal, Database, GraduationCap, ShoppingBag, MoreHorizontal, Clock,
  ArrowUpDown, Filter, Check, Users, ShieldCheck, Activity, Key
} from "lucide-react";

// --- HELPERS ---
const getCategoryIcon = (category: AccountCategory | string) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={20} className="text-purple-500 dark:text-purple-400" />;
    case "FINANCE": return <Wallet size={20} className="text-emerald-500 dark:text-emerald-400" />;
    case "SOCIAL": return <Share2 size={20} className="text-blue-500 dark:text-blue-400" />;
    case "WORK": return <Briefcase size={20} className="text-amber-500 dark:text-amber-400" />;
    case "UTILITY": return <Mail size={20} className="text-orange-500 dark:text-orange-400" />;
    case "ENTERTAINMENT": return <Music size={20} className="text-pink-500 dark:text-pink-400" />;
    case "EDUCATION": return <GraduationCap size={20} className="text-yellow-500 dark:text-yellow-400" />;
    case "ECOMMERCE": return <ShoppingBag size={20} className="text-rose-500 dark:text-rose-400" />;
    default: return <MoreHorizontal size={20} className="text-slate-400" />;
  }
};

// --- SMART FAVICON COMPONENT ---
function AccountIcon({ account }: { account: Account }) {
  const [error, setError] = useState(false);
  
  const cleanDomain = (url: string) => {
    if (!url) return "";
    try {
      const parsed = new URL(url.includes('http') ? url : `https://${url}`);
      return parsed.hostname;
    } catch {
      return url.split('/')[0];
    }
  };

  const domain = cleanDomain((account as any).websiteUrl || "");
  const iconUrl = domain ? `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=128` : "";

  if (iconUrl && !error) {
    return (
      <img 
        src={iconUrl} 
        alt={account.serviceName} 
        className="w-5 h-5 object-contain"
        onError={() => setError(true)}
      />
    );
  }

  return getCategoryIcon(account.category);
}

const CATEGORIES: { label: string; value: AccountCategory | "ALL" }[] = [
  { label: "ALL DATA", value: "ALL" },
  { label: "SOCIAL", value: "SOCIAL" },
  { label: "GAME", value: "GAME" },
  { label: "FINANCE", value: "FINANCE" },
  { label: "WORK", value: "WORK" },
  { label: "UTILITY", value: "UTILITY" },
  { label: "MEDIA", value: "ENTERTAINMENT" },
  { label: "EDUCATION", value: "EDUCATION" },
  { label: "SHOPPING", value: "ECOMMERCE" },
  { label: "OTHER", value: "OTHER" },
];

function VaultContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // FILTER & SORT STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeSpace, setActiveSpace] = useState<string>("ALL"); // Smart Space Filter
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-desc" | "date-asc">("name-asc");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "BREACHED">("ALL");

  // MENU STATES
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<'sort' | 'filter' | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // FETCH DATA DENGAN SECURE QUERY
  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }
    
    const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          lastUpdated: d.lastUpdated?.toDate ? d.lastUpdated.toDate() : new Date(),
          details: d.details || {} 
        };
      }) as Account[];
      
      setAccounts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching accounts:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // --- SMART VAULT SPACES LOGIC ---
  const vaultSpaces = useMemo(() => {
    const ownerMap = new Map<string, { accounts: Account[] }>();
    let totalSecurityPoints = 0;
    
    accounts.forEach(acc => {
      const owner = acc.owner && acc.owner.trim() !== '' ? acc.owner.trim() : "Pribadi";
      if (!ownerMap.has(owner)) ownerMap.set(owner, { accounts: [] });
      ownerMap.get(owner)!.accounts.push(acc);
      
      // Global Score Calc
      if (acc.status === 'ACTIVE') totalSecurityPoints += 10;
      else if (acc.status === 'BANNED' || acc.status === 'SUSPENDED') totalSecurityPoints -= 20;
      if (acc.authMethod !== 'email') totalSecurityPoints += 5;
    });

    const spaces = Array.from(ownerMap.entries()).map(([name, data]) => {
      let securityPoints = 0;
      data.accounts.forEach(acc => {
        if (acc.status === 'ACTIVE') securityPoints += 10;
        else if (acc.status === 'BANNED' || acc.status === 'SUSPENDED') securityPoints -= 20;
        if (acc.authMethod !== 'email') securityPoints += 5;
      });
      const maxPossible = data.accounts.length * 15;
      const score = maxPossible > 0 ? Math.min(100, Math.max(0, Math.floor((securityPoints / maxPossible) * 100))) : 0;
      
      const isOwner = name.toLowerCase() === "pribadi" || name.toLowerCase() === "personal vault";
      let role = 'TRUSTED';
      if (isOwner) role = 'OWNER';
      else if (data.accounts.length < 3) role = 'EMERGENCY';

      return { name, count: data.accounts.length, score, role };
    });

    // Sort: Owner first, then by count
    spaces.sort((a, b) => {
      if (a.role === 'OWNER') return -1;
      if (b.role === 'OWNER') return 1;
      return b.count - a.count;
    });

    // Calc All Data Score
    const globalMax = accounts.length * 15;
    const globalScore = globalMax > 0 ? Math.min(100, Math.max(0, Math.floor((totalSecurityPoints / globalMax) * 100))) : 100;

    return { spaces, globalScore };
  }, [accounts]);

  // ADVANCED SMART FILTER & SORTING
  let processedAccounts = accounts.filter((acc) => {
    const matchesCategory = selectedCategory === "ALL" || acc.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      acc.serviceName?.toLowerCase().includes(searchLower) || 
      acc.identifier?.toLowerCase().includes(searchLower) ||
      Object.values(acc.details || {}).some(val => String(val).toLowerCase().includes(searchLower));

    const accountOwner = acc.owner && acc.owner.trim() !== '' ? acc.owner.trim() : "Pribadi";
    const matchesSpace = activeSpace === "ALL" || accountOwner === activeSpace;
    
    const matchesStatus = filterStatus === "ALL" || 
      (filterStatus === "ACTIVE" && acc.status === "ACTIVE") ||
      (filterStatus === "BREACHED" && acc.status !== "ACTIVE");
      
    return matchesCategory && matchesSearch && matchesSpace && matchesStatus;
  });

  processedAccounts.sort((a, b) => {
    if (sortBy === "name-asc") return a.serviceName.localeCompare(b.serviceName);
    if (sortBy === "name-desc") return b.serviceName.localeCompare(a.serviceName);
    if (sortBy === "date-desc") return b.lastUpdated.getTime() - a.lastUpdated.getTime();
    if (sortBy === "date-asc") return a.lastUpdated.getTime() - b.lastUpdated.getTime();
    return 0;
  });

  const handleEdit = (id: string) => router.push(`/dashboard/vault/edit/${id}`);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "accounts", deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      alert("Gagal menghapus akun. Silakan coba lagi.");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const closeToolbar = () => setActiveToolbarMenu(null);
    if (activeToolbarMenu) {
      window.addEventListener('click', closeToolbar);
    }
    return () => window.removeEventListener('click', closeToolbar);
  }, [activeToolbarMenu]);

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "font-sans text-slate-900 dark:text-slate-100",
      accent: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      searchPanel: "bg-white/90 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800 shadow-sm",
      input: "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100",
      card: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg shadow-sm rounded-xl cursor-pointer",
      cardHeader: "bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50",
      btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md",
      btnOutline: "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300",
      catActive: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-500/50",
      catInactive: "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300",
      menuItem: "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
      menuBg: "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl",
      spaceActive: "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md",
      spaceInactive: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800",
      scrollbar: "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
    },
    hacker: {
      wrapper: "font-mono text-green-500",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500",
      textMain: "text-green-400",
      textSub: "text-green-700",
      searchPanel: "bg-[#050505]/95 border-green-900/50 shadow-[0_4px_30px_rgba(0,0,0,0.8)]",
      input: "bg-black border-green-900 focus:border-green-500 text-green-400",
      card: "bg-[#050505] border-green-900/50 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] rounded-sm cursor-pointer",
      cardHeader: "bg-black border-b border-green-900/30",
      btnPrimary: "bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/50 rounded-sm shadow-sm",
      btnOutline: "border-green-900/50 hover:border-green-500/50 bg-black text-green-600 hover:text-green-400 rounded-sm",
      catActive: "bg-green-900/30 text-green-400 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
      catInactive: "bg-black text-green-700 border-green-900/50 hover:border-green-700",
      menuItem: "hover:bg-green-900/20 text-green-500",
      menuBg: "bg-[#020202] border border-green-900/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
      spaceActive: "bg-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] text-green-400",
      spaceInactive: "bg-[#050505] border-green-900/50 hover:border-green-700/50 text-green-700",
      scrollbar: "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-green-900/80 [&::-webkit-scrollbar-thumb]:rounded-sm hover:[&::-webkit-scrollbar-thumb]:bg-green-700"
    },
    casual: {
      wrapper: "font-sans text-stone-800 dark:text-stone-100",
      accent: "text-orange-500 dark:text-orange-400",
      accentBg: "bg-gradient-to-r from-orange-500 to-pink-500",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      searchPanel: "bg-white/90 dark:bg-stone-900/90 border-orange-200 dark:border-stone-800 shadow-lg",
      input: "bg-orange-50 dark:bg-stone-950 border-orange-200 dark:border-stone-700 focus:border-orange-500 text-stone-800 dark:text-stone-100",
      card: "bg-white dark:bg-stone-900 border-orange-200 dark:border-stone-800 hover:border-orange-400 hover:shadow-xl shadow-orange-900/5 rounded-3xl cursor-pointer",
      cardHeader: "bg-orange-50/50 dark:bg-stone-950/50 border-b border-orange-100 dark:border-stone-800",
      btnPrimary: "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl shadow-md",
      btnOutline: "border-orange-200 dark:border-stone-700 hover:border-orange-400 hover:text-orange-500 bg-white/50 dark:bg-stone-950/50 rounded-2xl",
      catActive: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-400/50",
      catInactive: "bg-white dark:bg-stone-950 text-stone-500 border-orange-200 dark:border-stone-800 hover:border-orange-300",
      menuItem: "hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300",
      menuBg: "bg-white dark:bg-stone-950 border border-orange-100 dark:border-stone-800 shadow-xl rounded-2xl",
      spaceActive: "bg-orange-50 dark:bg-orange-900/20 border-orange-400 shadow-md",
      spaceInactive: "bg-white/80 dark:bg-stone-900 border-orange-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-stone-700",
      scrollbar: "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-orange-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-stone-700"
    }
  };

  // --- DICTIONARY TEKS DINAMIS ---
  const textDict = {
    formal: {
      headerTitle: "Data Vault",
      headerSub: "Kelola dan amankan semua kredensial digital Anda.",
      btnNew: "Tambah Data",
      globalSpace: "GLOBAL",
      allData: "Semua Data",
      searchPh: (space: string) => `Saring data di ${space === 'ALL' ? 'Semua Data' : space}...`,
      sort: "Urutkan",
      status: "Status",
      emptyTitle: (space: string) => `Tidak ada data${space !== 'ALL' ? ` di ${space}` : ''}`,
      emptySub: (space: string) => `Brankas ${space !== 'ALL' ? space : 'Anda'} masih kosong. Tambahkan kredensial untuk memulainya.`,
      btnInit: "Tambah Data Sekarang",
      decrypting: "DECRYPTING_VAULT..."
    },
    casual: {
      headerTitle: "Brankas Pintar",
      headerSub: "Simpan dan atur semua info login kamu di sini dengan aman.",
      btnNew: "Tambah Akun",
      globalSpace: "SEMUA",
      allData: "Semua Akun",
      searchPh: (space: string) => `Cari data di ${space === 'ALL' ? 'Semua Akun' : space}...`,
      sort: "Urutkan",
      status: "Status",
      emptyTitle: (space: string) => `Kosong melompong${space !== 'ALL' ? ` di ${space}` : ''} 😅`,
      emptySub: (space: string) => `Belum ada data di ${space !== 'ALL' ? space : 'sini'}. Yuk, mulai tambahin info login kamu!`,
      btnInit: "Tambah Akun Sekarang",
      decrypting: "Membuka brankas..."
    },
    hacker: {
      headerTitle: "DATABASE_VAULT",
      headerSub: "SECURE STORAGE // ENCRYPTED NODES",
      btnNew: "NEW_ENTRY",
      globalSpace: "GLOBAL_ROOT",
      allData: "ALL_NODES",
      searchPh: (space: string) => `SEARCH_IN [${space}]...`,
      sort: "SORT_BY",
      status: "FILTER_STATUS",
      emptyTitle: (space: string) => `NULL_POINTER_EXCEPTION: NO_DATA_IN_${space}`,
      emptySub: (space: string) => `DATA_NOT_FOUND. INITIATE NEW ENTRY TO POPULATE ${space === 'ALL' ? 'VAULT' : space.toUpperCase()}.`,
      btnInit: "+ INIT_ENTRY",
      decrypting: "DECRYPTING_NODES..."
    }
  };

  const cs = styles[theme];
  const t = textDict[theme];

  return (
    <div className={cn("min-h-[85vh] relative flex flex-col gap-6 animate-in fade-in duration-500 pb-20", cs.wrapper)}>
      
      {/* --- MODAL KONFIRMASI DELETE --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono" onClick={(e) => e.stopPropagation()}>
          <div className={cn("rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-sm w-full p-6 lg:p-8 space-y-5 relative overflow-hidden", theme === 'hacker' ? 'bg-[#050505] border border-red-900/50' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800')}>
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            <div className="flex items-center gap-3 text-red-500">
              <div className={cn("p-2 rounded-full border", theme === 'hacker' ? 'bg-red-950/50 border-red-900' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50')}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold tracking-wider">CONFIRM_DELETION</h3>
            </div>
            <p className={cn("text-sm border-l-2 pl-3 leading-relaxed", theme === 'hacker' ? 'text-slate-400 border-red-900/50' : 'text-slate-600 dark:text-slate-400 border-red-200 dark:border-red-900/50')}>
              Initiating removal sequence for: <br/>
              <strong className={cn("block mt-1", cs.textMain)}>{deleteTarget.serviceName}</strong> 
              <span className="opacity-70 text-xs">{deleteTarget.identifier}</span>
              <br/><br/><span className={cn("text-[10px] font-bold px-2 py-1 rounded inline-block border", theme === 'hacker' ? 'text-red-400 bg-red-950/30 border-red-900/30' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50')}>WARNING: ACTION IS IRREVERSIBLE.</span>
            </p>
            <div className="flex gap-3 justify-end pt-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(null); }}
                className={cn("px-5 py-2.5 text-xs font-bold transition-all", cs.btnOutline)}
              >
                ABORT
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600/90 hover:bg-red-600 rounded-lg border border-red-500/50 shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                EXECUTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 border flex items-center justify-center", theme === 'hacker' ? 'bg-[#050505] border-green-900/50 rounded-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm')}>
             <Database className={cs.accent} size={28} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
              {t.headerTitle}
            </h1>
            <p className={cn("text-xs lg:text-sm mt-1 font-medium", cs.textSub, theme === 'hacker' && 'tracking-widest uppercase font-mono')}>
              {t.headerSub}
            </p>
          </div>
        </div>
        <Link 
          href="/dashboard/vault/create" 
          className={cn("flex items-center gap-2 px-5 py-2.5 transition-all text-sm font-bold tracking-wider group w-full md:w-auto justify-center", cs.btnPrimary, theme !== 'casual' && theme !== 'hacker' && 'rounded-xl')}
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          {t.btnNew}
        </Link>
      </div>

      {/* SMART VAULT SPACES CAROUSEL */}
      {!loading && vaultSpaces.spaces.length > 0 && (
        <div className={cn("flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x", cs.scrollbar)}>
            
            {/* ALL DATA SPACE */}
            <button 
                onClick={() => setActiveSpace("ALL")}
                className={cn(
                    "snap-start shrink-0 w-[240px] p-4 border flex flex-col gap-3 transition-all text-left relative overflow-hidden group", 
                    theme !== 'casual' && theme !== 'hacker' && 'rounded-xl',
                    theme === 'hacker' && 'rounded-sm',
                    theme === 'casual' && 'rounded-[1.5rem]',
                    activeSpace === "ALL" ? cs.spaceActive : cs.spaceInactive
                )}
            >
                {activeSpace === "ALL" && <div className={cn("absolute top-0 left-0 w-full h-1", cs.accentBg)} />}
                <div className="flex justify-between items-start w-full">
                    <div className={cn("p-2 border rounded-lg transition-colors", activeSpace === "ALL" ? (theme === 'hacker' ? 'bg-black border-green-500/50' : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800') : (theme === 'hacker' ? 'bg-black border-green-900/50' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'))}>
                        <Database size={18} className={activeSpace === "ALL" ? cs.accent : cs.textSub} />
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 border rounded uppercase tracking-wider", activeSpace === "ALL" ? (theme === 'hacker' ? 'bg-black text-green-500 border-green-500/50' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800') : (theme === 'hacker' ? 'bg-black text-green-700 border-green-900/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'))}>
                        {t.globalSpace}
                    </span>
                </div>
                <div>
                    <h3 className={cn("font-bold text-sm truncate", activeSpace === "ALL" ? cs.textMain : cs.textSub)}>{t.allData}</h3>
                    <p className={cn("text-[10px] font-mono mt-0.5", activeSpace === "ALL" ? cs.textMain : cs.textSub)}>{accounts.length} ASSETS</p>
                </div>
                <div className={cn("mt-2 h-1 w-full rounded-full overflow-hidden", theme === 'hacker' ? 'bg-green-950' : 'bg-slate-200 dark:bg-slate-800')}>
                    <div className={cn("h-full transition-all", vaultSpaces.globalScore > 80 ? 'bg-emerald-500' : vaultSpaces.globalScore > 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${vaultSpaces.globalScore}%` }} />
                </div>
            </button>

            {/* OWNER SPACES */}
            {vaultSpaces.spaces.map((space) => {
                const isActive = activeSpace === space.name;
                return (
                    <button 
                        key={space.name}
                        onClick={() => setActiveSpace(space.name)}
                        className={cn(
                            "snap-start shrink-0 w-[240px] p-4 border flex flex-col gap-3 transition-all text-left relative overflow-hidden group", 
                            theme !== 'casual' && theme !== 'hacker' && 'rounded-xl',
                            theme === 'hacker' && 'rounded-sm',
                            theme === 'casual' && 'rounded-[1.5rem]',
                            isActive ? cs.spaceActive : cs.spaceInactive
                        )}
                    >
                        {isActive && <div className={cn("absolute top-0 left-0 w-full h-1", cs.accentBg)} />}
                        <div className="flex justify-between items-start w-full">
                            <div className={cn("p-2 border rounded-lg transition-colors", isActive ? (theme === 'hacker' ? 'bg-black border-green-500/50' : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800') : (theme === 'hacker' ? 'bg-black border-green-900/50' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'))}>
                                {space.role === 'OWNER' ? <ShieldCheck size={18} className={isActive ? cs.accent : cs.textSub} /> : space.role === 'EMERGENCY' ? <AlertTriangle size={18} className={isActive ? cs.accent : cs.textSub} /> : <Users size={18} className={isActive ? cs.accent : cs.textSub} />}
                            </div>
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 border rounded uppercase tracking-wider", isActive ? (theme === 'hacker' ? 'bg-black text-green-500 border-green-500/50' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800') : (theme === 'hacker' ? 'bg-black text-green-700 border-green-900/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'))}>
                                {space.role}
                            </span>
                        </div>
                        <div>
                            <h3 className={cn("font-bold text-sm truncate", isActive ? cs.textMain : cs.textSub)}>{space.name}</h3>
                            <p className={cn("text-[10px] font-mono mt-0.5", isActive ? cs.textMain : cs.textSub)}>{space.count} ASSETS</p>
                        </div>
                        <div className={cn("mt-2 h-1 w-full rounded-full overflow-hidden", theme === 'hacker' ? 'bg-green-950' : 'bg-slate-200 dark:bg-slate-800')}>
                            <div className={cn("h-full transition-all", space.score > 80 ? 'bg-emerald-500' : space.score > 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${space.score}%` }} />
                        </div>
                    </button>
                )
            })}
        </div>
      )}

      {/* ADVANCED DATA TOOLBAR (STICKY GLASSMORPHISM) */}
      <div className={cn("p-4 border backdrop-blur-xl space-y-4 sticky top-4 z-30 transition-all", cs.searchPanel, theme === 'formal' ? 'rounded-2xl' : theme === 'casual' ? 'rounded-3xl' : 'rounded-sm')}>
        
        <div className="flex flex-col lg:flex-row gap-3">
            {/* Filter Lokal / Saringan Data */}
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search size={18} className={cn("transition-colors", cs.textSub, "group-focus-within:text-blue-500", theme === 'hacker' && 'group-focus-within:text-green-500', theme === 'casual' && 'group-focus-within:text-orange-500')} />
                </div>
                <input 
                    type="text" 
                    placeholder={t.searchPh(activeSpace)} 
                    className={cn("w-full border py-2.5 pl-10 pr-4 outline-none transition-all text-sm", cs.input, theme !== 'hacker' ? 'rounded-xl' : 'rounded-sm', theme === 'hacker' && 'font-mono')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Advanced Toolbar: Sort & Filter Buttons */}
            <div className="flex items-center gap-2 relative">
                
                {/* TOMBOL URUTKAN (SORT) */}
                <div className="relative w-1/2 lg:w-auto">
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveToolbarMenu(activeToolbarMenu === 'sort' ? null : 'sort');
                        }}
                        className={cn("w-full lg:w-auto px-4 py-2.5 flex items-center justify-between lg:justify-center gap-2 text-sm font-bold border transition-colors", cs.btnOutline)}
                    >
                        <span className="flex items-center gap-2"><ArrowUpDown size={16} /> <span className="hidden sm:inline">{t.sort}</span></span>
                    </button>

                    {/* Dropdown Urutkan */}
                    {activeToolbarMenu === 'sort' && (
                        <div onClick={(e) => e.stopPropagation()} className={cn("absolute right-0 lg:left-0 top-full mt-2 w-48 border z-40 py-1.5 animate-in fade-in zoom-in-95 duration-200", cs.menuBg)}>
                            {[
                              { id: 'name-asc', label: 'Nama (A-Z)' },
                              { id: 'name-desc', label: 'Nama (Z-A)' },
                              { id: 'date-desc', label: 'Terbaru Diubah' },
                              { id: 'date-asc', label: 'Terlama Diubah' }
                            ].map((opt) => (
                              <button 
                                key={opt.id}
                                onClick={() => { setSortBy(opt.id as any); setActiveToolbarMenu(null); }}
                                className={cn("w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between transition-colors", cs.menuItem, sortBy === opt.id ? cs.accent : "")}
                              >
                                {opt.label}
                                {sortBy === opt.id && <Check size={14} />}
                              </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* TOMBOL FILTER STATUS */}
                <div className="relative w-1/2 lg:w-auto">
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveToolbarMenu(activeToolbarMenu === 'filter' ? null : 'filter');
                        }}
                        className={cn("w-full lg:w-auto px-4 py-2.5 flex items-center justify-between lg:justify-center gap-2 text-sm font-bold border transition-colors", cs.btnOutline, filterStatus !== 'ALL' && "border-blue-500 text-blue-500")}
                    >
                        <span className="flex items-center gap-2">
                          <Filter size={16} className={filterStatus !== 'ALL' ? cs.accent : ''} /> 
                          <span className="hidden sm:inline">{t.status}</span>
                        </span>
                        {filterStatus !== 'ALL' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                    </button>

                    {/* Dropdown Filter */}
                    {activeToolbarMenu === 'filter' && (
                        <div onClick={(e) => e.stopPropagation()} className={cn("absolute right-0 top-full mt-2 w-48 border z-40 py-1.5 animate-in fade-in zoom-in-95 duration-200", cs.menuBg)}>
                            {[
                              { id: 'ALL', label: 'Semua Akun' },
                              { id: 'ACTIVE', label: 'Aman (Aktif)' },
                              { id: 'BREACHED', label: 'Terindikasi Bocor' }
                            ].map((opt) => (
                              <button 
                                key={opt.id}
                                onClick={() => { setFilterStatus(opt.id as any); setActiveToolbarMenu(null); }}
                                className={cn("w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between transition-colors", cs.menuItem, filterStatus === opt.id ? cs.accent : "")}
                              >
                                {opt.label}
                                {filterStatus === opt.id && <Check size={14} />}
                              </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Filter Kategori Horizontal Scroll - Expanded */}
        <div className={cn("flex gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth", cs.scrollbar)}>
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                        "flex-1 px-4 py-2 text-xs font-bold tracking-wider border transition-all whitespace-nowrap text-center",
                        theme === 'casual' ? 'rounded-xl' : theme === 'formal' ? 'rounded-lg' : 'rounded-sm',
                        selectedCategory === cat.value ? cs.catActive : cs.catInactive
                    )}
                >
                    {cat.label}
                </button>
            ))}
        </div>
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <div className={cn("flex flex-col items-center justify-center py-32 gap-4", cs.accent)}>
          <Loader2 className="animate-spin" size={48} />
          <p className="text-sm tracking-[0.2em] animate-pulse font-mono font-bold">{t.decrypting}</p>
        </div>
      ) : processedAccounts.length === 0 ? (
        <div className={cn("text-center py-24 border border-dashed rounded-2xl flex flex-col items-center justify-center", theme === 'hacker' ? 'border-green-900/50 bg-[#050505]' : 'border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm')}>
          <div className={cn("inline-flex p-5 rounded-full mb-5", theme === 'hacker' ? 'bg-green-950/30 text-green-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
            {activeSpace !== 'ALL' ? <Key size={40} strokeWidth={1.5} /> : <Database size={40} strokeWidth={1.5} />}
          </div>
          <h3 className={cn("font-bold text-lg tracking-wide", cs.textMain)}>
            {t.emptyTitle(activeSpace)}
          </h3>
          <p className={cn("text-sm mt-2 max-w-sm px-4", cs.textSub)}>
            {searchQuery || filterStatus !== 'ALL' || selectedCategory !== 'ALL'
              ? `Tidak ada data yang cocok dengan kriteria filter saat ini.` 
              : t.emptySub(activeSpace)}
          </p>
          {(!searchQuery && filterStatus === 'ALL' && selectedCategory === 'ALL') && (
            <Link href="/dashboard/vault/create" className={cn("mt-6 px-6 py-2.5 text-sm font-bold transition-all", cs.btnPrimary, theme !== 'casual' && theme !== 'hacker' && 'rounded-lg')}>
               {t.btnInit}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedAccounts.map((account) => {
            const templateFields = TEMPLATES[account.category] || [];
            const highlights = templateFields
              .filter(field => (account.details as any)?.[field.key])
              .slice(0, 2);

            const displayDate = new Intl.DateTimeFormat('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }).format(account.lastUpdated);

            return (
              <div 
                key={account.id} 
                onClick={() => router.push(`/dashboard/vault/${account.id}`)}
                className={cn("group relative border flex flex-col transition-all duration-300 overflow-hidden cursor-pointer", cs.card)}
              >
                
                {/* Decorative Top Line */}
                <div className={cn("absolute top-0 left-0 w-full h-1 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 z-20", cs.accentBg)} />

                <div className={cn("p-5 relative z-10 flex-1 flex flex-col", cs.cardHeader)}>
                  
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn("p-3 w-[46px] h-[46px] border flex items-center justify-center shrink-0 transition-colors shadow-sm", theme === 'hacker' ? 'bg-black border-green-900/50 group-hover:border-green-500/50 rounded-sm' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 group-hover:border-blue-500/30 rounded-xl')}>
                        <AccountIcon account={account} />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className={cn("font-bold text-base line-clamp-1 transition-colors", cs.textMain, "group-hover:text-blue-500", theme === 'hacker' && 'group-hover:text-green-400', theme === 'casual' && 'group-hover:text-orange-500')}>{account.serviceName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[9px] font-bold px-2 py-0.5 border uppercase tracking-wider font-mono", theme === 'hacker' ? 'bg-black text-green-600 border-green-900/50 rounded-sm' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 rounded')}>
                              {account.category}
                          </span>
                          <span title={account.status === 'ACTIVE' ? 'Aman' : 'Terdeteksi Kebocoran'} className={`w-2 h-2 rounded-full shadow-sm ${account.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Menu (Ellipsis) */}
                    <div className="relative shrink-0 ml-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenMenuId(openMenuId === account.id ? null : account.id);
                        }}
                        className={cn("p-1.5 rounded-lg transition-colors", cs.textSub, "hover:bg-slate-200 dark:hover:bg-slate-800", theme === 'hacker' && 'hover:bg-green-900/30 rounded-sm')}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openMenuId === account.id && (
                        <>
                          <div className="fixed inset-0 z-10 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                          <div className={cn("absolute right-0 top-full mt-2 w-36 border z-20 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200", cs.menuBg)}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(account.id); }}
                              className={cn("w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-colors", cs.menuItem)}
                            >
                              <Pencil size={14} /> UBAH
                            </button>
                            <div className={cn("h-px w-full my-1", theme === 'hacker' ? 'bg-green-900/50' : 'bg-slate-100 dark:bg-slate-800')}></div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(account); setOpenMenuId(null); }}
                              className={cn("w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 flex items-center gap-2 transition-colors", theme === 'hacker' ? 'hover:bg-red-950/20' : 'hover:bg-red-50 dark:hover:bg-red-950/30')}
                            >
                              <Trash2 size={14} /> HAPUS
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Data Preview */}
                  <div className="space-y-3 mt-auto">
                    <div className={cn("p-3 border transition-colors", theme === 'hacker' ? 'bg-black border-green-900/50 rounded-sm group-hover:border-green-700/50' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl group-hover:border-slate-300 dark:group-hover:border-slate-700')}>
                      <div className={cn("flex items-center gap-2 text-[10px] uppercase tracking-wider mb-1 font-bold", cs.textSub)}>
                          <Terminal size={12} /> Identifier
                      </div>
                      <p className={cn("text-sm font-mono truncate font-medium", cs.textMain)}>{account.identifier}</p>
                    </div>

                    <div className="space-y-2 pt-2 px-1">
                      {highlights.map(field => (
                          <HighlightField 
                             key={field.key}
                             field={field}
                             value={(account.details as any)[field.key]}
                             cs={cs}
                             theme={theme}
                          />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className={cn("p-4 flex justify-between items-center bg-transparent border-t", theme === 'hacker' ? 'border-green-900/30' : 'border-slate-100 dark:border-slate-800')}>
                  <span className={cn("text-[10px] font-mono flex items-center gap-1.5 font-medium", cs.textSub)}>
                      <Clock size={12} /> {displayDate}
                  </span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", cs.textMain, "group-hover:text-blue-500", theme === 'hacker' && 'group-hover:text-green-500', theme === 'casual' && 'group-hover:text-orange-500')}>
                      {account.owner || 'Vault Pribadi'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- SUB KOMPONEN HIGHLIGHT ---
function HighlightField({ field, value, cs, theme }: { field: TemplateField, value: any, cs: any, theme: string }) {
    const isSecret = field.type === 'password' || field.key.toLowerCase().includes('pin');
    const [show, setShow] = useState(!isSecret);
    
    return (
      <div className={cn("flex justify-between items-center text-xs font-medium border-t pt-2", theme === 'hacker' ? 'border-green-900/30 text-green-600' : 'border-slate-200 dark:border-slate-800 text-slate-500')}>
        <span className="uppercase text-[10px] tracking-wider opacity-80 pr-2 truncate">{field.label}</span>
        <div className="flex items-center gap-1.5 max-w-[60%] justify-end min-w-0">
          <span className={cn("font-mono truncate text-right", cs.textMain)}>
            {isSecret && !show ? "••••••••" : String(value)}
          </span>
          {isSecret && (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShow(!show);
              }}
              className={cn("opacity-50 hover:opacity-100 transition-opacity z-10 shrink-0 pointer-events-auto cursor-pointer", theme === 'hacker' && 'hover:text-green-400', theme === 'casual' && 'hover:text-orange-500')}
              title={show ? "Sembunyikan" : "Tampilkan"}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>
    );
  }

export default function VaultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
      <VaultContent />
    </Suspense>
  );
}