"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { TEMPLATES } from "@/lib/constants/templates"; // Import Brain kita
import { 
  Plus, 
  Search, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  MoreVertical,
  Loader2,
  X,
  User,
  Pencil,
  Trash2,
  AlertTriangle,
  Eye,
  Terminal,
  Database,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Clock
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { cn, formatDate } from "@/lib/utils";

// --- THEME CONFIG ---
const THEME = {
  bg: "bg-slate-950",
  panel: "bg-slate-900/50",
  border: "border-slate-800",
  accent: "text-cyan-400",
  accentBorder: "border-cyan-500/30",
  textMain: "text-slate-200",
  textDim: "text-slate-500",
};

// --- HELPERS ---
const getCategoryIcon = (category: AccountCategory) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={20} className="text-purple-400" />;
    case "FINANCE": return <Wallet size={20} className="text-emerald-400" />;
    case "SOCIAL": return <Share2 size={20} className="text-blue-400" />;
    case "WORK": return <Briefcase size={20} className="text-amber-400" />;
    case "UTILITY": return <Mail size={20} className="text-orange-400" />;
    case "ENTERTAINMENT": return <Music size={20} className="text-pink-400" />;
    case "EDUCATION": return <GraduationCap size={20} className="text-yellow-400" />;
    case "ECOMMERCE": return <ShoppingBag size={20} className="text-rose-400" />;
    default: return <MoreHorizontal size={20} className="text-slate-400" />;
  }
};

const CATEGORIES: { label: string; value: AccountCategory | "ALL" }[] = [
  { label: "ALL_DATA", value: "ALL" },
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

// --- KOMPONEN LOGIKA UTAMA ---
function VaultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerFilter = searchParams.get("owner");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  // --- STATE ACTION ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  // 1. Cek Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data (Realtime Listener)
  useEffect(() => {
    if (!user) return;
    
    const accountsRef = collection(db, "accounts");
    const q = query(accountsRef, orderBy("serviceName", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          lastUpdated: d.lastUpdated?.toDate ? d.lastUpdated.toDate() : new Date(),
          details: d.details || {} // Pastikan details selalu object
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

  // 3. Smart Filter Logic (Updated Phase 3)
  const filteredAccounts = accounts.filter((acc) => {
    const matchesCategory = selectedCategory === "ALL" || acc.category === selectedCategory;
    
    // Deep Search: Cari di Service Name, Identifier, ATAU values di dalam Details
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      acc.serviceName?.toLowerCase().includes(searchLower) || 
      acc.identifier?.toLowerCase().includes(searchLower) ||
      Object.values(acc.details || {}).some(val => 
        String(val).toLowerCase().includes(searchLower)
      );

    const matchesOwner = ownerFilter 
      ? acc.owner?.toLowerCase() === ownerFilter.toLowerCase() 
      : true;
      
    return matchesCategory && matchesSearch && matchesOwner;
  });

  const clearOwnerFilter = () => router.push("/dashboard/vault");

  // --- FUNGSI ACTION ---
  const handleEdit = (id: string) => {
    router.push(`/dashboard/vault/edit/${id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "accounts", deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      alert("Gagal menghapus akun.");
      console.error(error);
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} text-slate-200 font-mono relative space-y-6 animate-in fade-in duration-500`}>
      
      {/* --- MODAL KONFIRMASI DELETE (CYBER STYLE) --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-xl border border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            {/* Red Scanline */}
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-950/50 rounded-full border border-red-900">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold tracking-wider">CONFIRM_DELETION</h3>
            </div>
            <p className="text-slate-400 text-sm border-l-2 border-red-900/50 pl-3">
              Initiating removal sequence for: <br/>
              <strong className="text-white">{deleteTarget.serviceName}</strong> ({deleteTarget.identifier})? 
              <br/><span className="text-red-400 text-xs mt-1 block">WARNING: THIS ACTION IS IRREVERSIBLE.</span>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-transparent hover:border-slate-600 transition-all"
              >
                ABORT
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600/80 hover:bg-red-600 rounded border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 transition-all"
              >
                <Trash2 size={14} />
                EXECUTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="text-cyan-400" />
            DATABASE_VAULT
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono tracking-widest">
            SECURE STORAGE // ENCRYPTED NODES
          </p>
        </div>
        <Link 
          href="/dashboard/vault/create" 
          className="flex items-center gap-2 bg-cyan-900/20 text-cyan-400 px-4 py-2 rounded border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all text-xs font-bold tracking-wider group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          NEW_ENTRY
        </Link>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className={`p-4 rounded-xl border ${THEME.border} bg-slate-900/30 backdrop-blur-sm space-y-4 sticky top-4 z-10 shadow-xl`}>
        
        {/* Banner Filter Owner */}
        {ownerFilter && (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded p-2 px-4 flex items-center justify-between text-blue-300 text-xs mb-2">
            <div className="flex items-center gap-2">
                <User size={14} />
                <span>FILTER_ACTIVE: OWNER = <span className="font-bold text-white">{ownerFilter}</span></span>
            </div>
            <button onClick={clearOwnerFilter} className="hover:text-white"><X size={14} /></button>
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
            {/* Terminal Input */}
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-cyan-500 font-bold">{'>'}_</span>
                </div>
                <input 
                    type="text" 
                    placeholder="search_query (name, id, server, rank...)" 
                    className="w-full bg-slate-950/50 text-slate-200 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-900/50 transition-all font-mono text-sm placeholder:text-slate-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-2.5">
                    <Search size={16} className="text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
                </div>
            </div>

            {/* Filter Toggles */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={cn(
                            "px-3 py-2 rounded text-[10px] font-bold tracking-wider border transition-all whitespace-nowrap",
                            selectedCategory === cat.value 
                            ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                            : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-cyan-500/50">
          <Loader2 className="animate-spin" size={48} />
          <p className="text-xs tracking-[0.2em] animate-pulse">DECRYPTING_VAULT...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
          <div className="inline-flex p-4 bg-slate-800/50 rounded-full mb-4 text-slate-600">
            <Terminal size={32} />
          </div>
          <h3 className="text-slate-400 font-bold tracking-wide">NO_DATA_FOUND</h3>
          <p className="text-slate-600 text-xs mt-2 font-mono">
            {searchQuery 
              ? `query "${searchQuery}" returned 0 results.` 
              : "Database is empty. Initialize new entry."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filteredAccounts.map((account) => {
            // SMART CARD LOGIC: Ambil 2 field terpenting dari Template berdasarkan kategori akun
            const templateFields = TEMPLATES[account.category] || [];
            // Filter field yang punya value di detail akun ini, ambil max 2
            const highlights = templateFields
              .filter(field => (account.details as any)?.[field.key])
              .slice(0, 2);

            return (
              <div key={account.id} className="group relative bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:-translate-y-1">
                
                {/* Scanline Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 translate-y-[-100%] group-hover:translate-y-[100%] transition-all duration-1000 pointer-events-none" />

                {/* Link Wrapper */}
                <Link href={`/dashboard/vault/${account.id}`} className="absolute inset-0 z-0" />

                <div className="p-5 relative z-10 pointer-events-none">
                  
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg group-hover:border-cyan-500/30 transition-colors">
                        {getCategoryIcon(account.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm line-clamp-1 group-hover:text-cyan-400 transition-colors">{account.serviceName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 uppercase tracking-wider">
                              {account.category}
                          </span>
                          {/* Status Dot */}
                          <span className={`w-1.5 h-1.5 rounded-full ${account.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Menu (Interactive) */}
                    <div className="relative pointer-events-auto">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenMenuId(openMenuId === account.id ? null : account.id);
                        }}
                        className="text-slate-600 hover:text-cyan-400 p-1 hover:bg-cyan-950/30 rounded transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {openMenuId === account.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/vault/${account.id}`);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-400 hover:bg-cyan-950/50 hover:text-cyan-400 flex items-center gap-2"
                            >
                              <Eye size={12} /> INSPECT
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(account.id);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-400 hover:bg-blue-950/50 hover:text-blue-400 flex items-center gap-2"
                            >
                              <Pencil size={12} /> MODIFY
                            </button>
                            <div className="h-px bg-slate-800 my-1"></div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(account);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-950/30 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> PURGE
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Data Preview */}
                  <div className="space-y-3">
                    <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50 group-hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <Terminal size={10} />
                          <span className="uppercase tracking-wider text-[9px]">Identifier</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono truncate">{account.identifier}</p>
                    </div>

                    {/* SMART DYNAMIC DETAILS */}
                    {highlights.map(field => (
                       <div key={field.key} className="flex justify-between text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                         <span className="uppercase">{field.label}</span>
                         <span className="text-cyan-400 font-mono truncate max-w-[50%] text-right">
                           {(account.details as any)[field.key]}
                         </span>
                       </div>
                    ))}

                    <div className="flex justify-between items-end pt-2">
                      <span className="text-[9px] text-slate-600 font-mono flex items-center gap-1">
                          <Clock size={8} /> {formatDate(account.lastUpdated)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-700 group-hover:text-cyan-600 transition-colors uppercase tracking-widest">
                          {account.owner}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- PEMBUNGKUS UTAMA ---
export default function VaultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" size={32} /></div>}>
      <VaultContent />
    </Suspense>
  );
}