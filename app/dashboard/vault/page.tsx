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
import { 
  Plus, 
  Search, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  Lock, 
  MoreVertical,
  Loader2,
  X,
  UserCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Eye
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { cn, formatDate } from "@/lib/utils";

// --- HELPERS ---
const getCategoryIcon = (category: AccountCategory) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={20} className="text-purple-500" />;
    case "FINANCE": return <Wallet size={20} className="text-emerald-500" />;
    case "SOCIAL": return <Share2 size={20} className="text-blue-500" />;
    case "WORK": return <Briefcase size={20} className="text-slate-500" />;
    case "UTILITY": return <Mail size={20} className="text-orange-600" />;
    case "ENTERTAINMENT": return <Music size={20} className="text-pink-500" />;
    default: return <Lock size={20} className="text-gray-500" />;
  }
};

const CATEGORIES: { label: string; value: AccountCategory | "ALL" }[] = [
  { label: "Semua", value: "ALL" },
  { label: "Social", value: "SOCIAL" },
  { label: "Game", value: "GAME" },
  { label: "Keuangan", value: "FINANCE" },
  { label: "Kerja", value: "WORK" },
  { label: "Utilitas", value: "UTILITY" },
  { label: "Hiburan", value: "ENTERTAINMENT" },
];

// --- KOMPONEN LOGIKA UTAMA (DIPISAH) ---
function VaultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerFilter = searchParams.get("owner");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  // --- STATE BARU: DROPDOWN & DELETE MODAL ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  // 1. Cek Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "accounts"), orderBy("serviceName", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          lastUpdated: d.lastUpdated?.toDate ? d.lastUpdated.toDate() : new Date(),
        };
      }) as Account[];
      setAccounts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Filter Logic
  const filteredAccounts = accounts.filter((acc) => {
    const matchesCategory = selectedCategory === "ALL" || acc.category === selectedCategory;
    const matchesSearch = acc.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          acc.identifier.toLowerCase().includes(searchQuery.toLowerCase());
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
      setDeleteTarget(null); // Tutup modal
    } catch (error) {
      alert("Gagal menghapus akun.");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      
      {/* --- MODAL KONFIRMASI DELETE --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Hapus Akun?</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Anda yakin ingin menghapus <strong>{deleteTarget.serviceName}</strong> ({deleteTarget.identifier})? 
              <br/>Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">The Vault</h1>
          <p className="text-slate-500 text-sm">Kelola semua sandi dan aset digital Anda di sini.</p>
        </div>
        <Link 
          href="/dashboard/vault/create" 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={18} />
          Tambah Baru
        </Link>
      </div>

      {/* Banner Filter Owner */}
      {ownerFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-800">
            <UserCircle size={24} />
            <div>
              <p className="text-sm font-medium">Sedang menampilkan brankas milik:</p>
              <p className="text-lg font-bold">{ownerFilter}</p>
            </div>
          </div>
          <button onClick={clearOwnerFilter} className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari layanan..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat.value ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4"><Lock size={32} className="text-slate-400" /></div>
          <h3 className="text-lg font-medium text-slate-900">Tidak ada data ditemukan</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
            {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Vault Anda masih kosong."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filteredAccounts.map((account) => (
            // Kita ubah div luar menjadi Container Relative saja
            <div key={account.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-200 relative">
              
              {/* LINK UNTUK KLIK DETAIL (Menutupi seluruh card kecuali tombol menu) */}
              <Link href={`/dashboard/vault/${account.id}`} className="absolute inset-0 z-0" />

              <div className="p-5 relative z-10 pointer-events-none"> 
                {/* pointer-events-none di parent, lalu kita aktifkan pointer-events-auto hanya di tombol menu agar Link di background bisa diklik */}
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                      {getCategoryIcon(account.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{account.serviceName}</h3>
                      <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">{account.category}</span>
                    </div>
                  </div>
                  
                  {/* --- MENU DROPDOWN (TITIK TIGA) --- */}
                  {/* Aktifkan pointer event di sini */}
                  <div className="relative pointer-events-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Biar gak trigger link detail
                        e.preventDefault();
                        setOpenMenuId(openMenuId === account.id ? null : account.id);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {/* Isi Menu */}
                    {openMenuId === account.id && (
                      <>
                        {/* Overlay transparan */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }} 
                        />
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                          {/* Menu: Lihat Detail (Opsional, karena klik card juga bisa) */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/vault/${account.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                          >
                            <Eye size={14} /> Lihat Detail
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(account.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(account); // Set target hapus
                              setOpenMenuId(null); // Tutup menu
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Detail Konten */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="truncate max-w-[200px]">{account.identifier}</span>
                  </div>
                  {account.details && 'ign' in account.details && (account.details as any).ign && (
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                       <Gamepad2 size={14} className="text-slate-400" />
                       <span className="truncate">IGN: {(account.details as any).ign}</span>
                     </div>
                  )}
                  {account.details && 'accountNumber' in account.details && (account.details as any).accountNumber && (
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                       <Wallet size={14} className="text-slate-400" />
                       <span className="truncate">{(account.details as any).accountNumber}</span>
                     </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                    <span>Updated: {formatDate(account.lastUpdated)}</span>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${ownerFilter ? 'text-blue-500' : 'text-slate-300'}`}>
                    {account.owner}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PEMBUNGKUS UTAMA UNTUK MENGHINDARI ERROR BUILD ---
export default function VaultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}>
      <VaultContent />
    </Suspense>
  );
}