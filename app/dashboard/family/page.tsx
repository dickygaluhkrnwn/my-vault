"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Account } from "@/lib/types/schema";
import { 
  Users, 
  UserCircle, 
  Gamepad2, 
  Wallet, 
  Share2, 
  ArrowRight,
  Loader2,
  ShieldCheck,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

// Tipe data untuk statistik anggota keluarga
interface FamilyMember {
  name: string;
  totalAccounts: number;
  categories: { [key: string]: number };
  lastActive?: Date;
}

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [user, setUser] = useState<any>(null);

  // 1. Cek User Login
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch & Aggregate Data
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "accounts"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => doc.data()) as Account[];
      
      // LOGIKA GROUPING BY OWNER
      // Mengubah list akun menjadi list pemilik (FamilyMember)
      const ownerMap = new Map<string, FamilyMember>();

      accounts.forEach(acc => {
        // Normalisasi nama owner (Title Case / Trim)
        const ownerName = acc.owner ? acc.owner.trim() : "Unassigned";
        
        if (!ownerMap.has(ownerName)) {
          ownerMap.set(ownerName, {
            name: ownerName,
            totalAccounts: 0,
            categories: {},
            lastActive: undefined
          });
        }

        const member = ownerMap.get(ownerName)!;
        member.totalAccounts++;
        
        // Hitung Kategori per orang
        member.categories[acc.category] = (member.categories[acc.category] || 0) + 1;

        // Cek update terakhir
        // Handle timestamp firebase
        const accDate = acc.lastUpdated && (acc.lastUpdated as any).toDate 
          ? (acc.lastUpdated as any).toDate() 
          : new Date();
          
        if (!member.lastActive || accDate > member.lastActive) {
          member.lastActive = accDate;
        }
      });

      // Convert Map ke Array dan Sort (Dicky/User Login di atas biasanya)
      const sortedMembers = Array.from(ownerMap.values()).sort((a, b) => 
        b.totalAccounts - a.totalAccounts
      );

      setMembers(sortedMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-100 rounded-full">
          <Users className="text-orange-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Akses Keluarga</h1>
          <p className="text-slate-500 text-sm">Pusat kontrol aset digital seluruh anggota keluarga.</p>
        </div>
      </div>

      {/* Grid Anggota Keluarga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.name} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden group">
            
            {/* Header Card */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <UserCircle size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{member.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>Terlindungi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Area */}
            <div className="space-y-4 mb-6">
               <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100">
                 <span className="text-slate-600">Total Aset</span>
                 <span className="font-bold text-slate-900 text-lg">{member.totalAccounts}</span>
               </div>
               
               {/* Mini Badges untuk Kategori Terbanyak */}
               <div className="flex flex-wrap gap-2">
                 {member.categories['FINANCE'] && (
                   <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                     <Wallet size={10} /> Bank ({member.categories['FINANCE']})
                   </span>
                 )}
                 {member.categories['GAME'] && (
                   <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                     <Gamepad2 size={10} /> Game ({member.categories['GAME']})
                   </span>
                 )}
                  {member.categories['SOCIAL'] && (
                   <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                     <Share2 size={10} /> Sosmed ({member.categories['SOCIAL']})
                   </span>
                 )}
               </div>
            </div>

            {/* Footer / Action */}
            <div className="pt-2">
              <Link 
                // Kita kirim parameter owner ke halaman Vault
                href={`/dashboard/vault?owner=${member.name}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Buka Brankas {member.name}
                <ArrowRight size={16} />
              </Link>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Update: {member.lastActive ? new Intl.DateTimeFormat('id-ID').format(member.lastActive) : '-'}
              </p>
            </div>
          </div>
        ))}

        {/* Placeholder Tambah Anggota */}
        <Link href="/dashboard/vault/create" className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group min-h-[200px]">
          <div className="p-4 bg-slate-50 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
            <PlusCircle size={32} />
          </div>
          <p className="font-medium">Tambah Anggota Keluarga</p>
          <p className="text-xs mt-2 max-w-[200px]">
            Buat akun baru dan pilih nama Pemilik (Owner) baru untuk menambahkannya ke sini.
          </p>
        </Link>
      </div>
    </div>
  )
}