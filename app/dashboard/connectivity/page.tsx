"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { 
  Network, 
  ArrowRight, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  Lock,
  Globe,
  Smartphone,
  Loader2
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

// Helper Icon Kategori (Kita reuse biar konsisten)
const getCategoryIcon = (category: AccountCategory) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={16} className="text-purple-600" />;
    case "FINANCE": return <Wallet size={16} className="text-emerald-600" />;
    case "SOCIAL": return <Share2 size={16} className="text-blue-600" />;
    case "WORK": return <Briefcase size={16} className="text-slate-600" />;
    case "UTILITY": return <Mail size={16} className="text-orange-600" />;
    case "ENTERTAINMENT": return <Music size={16} className="text-pink-600" />;
    default: return <Lock size={16} className="text-gray-600" />;
  }
};

// Tipe Data untuk Grouping
interface EmailGroup {
  email: string;
  apps: Account[];
}

export default function ConnectivityPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(collection(db, "accounts"), orderBy("serviceName", "asc"));
      
      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const allAccounts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Account[];

        // LOGIKA PENGELOMPOKAN (CORE LOGIC)
        // 1. Cari semua email unik yang dipakai sebagai "linkedEmail"
        const linkedEmails = new Set<string>();
        allAccounts.forEach(acc => {
          if (acc.linkedEmail) linkedEmails.add(acc.linkedEmail.toLowerCase().trim());
        });

        // 2. Buat struktur grup
        const groupedData: EmailGroup[] = [];
        linkedEmails.forEach(email => {
          const connectedApps = allAccounts.filter(
            acc => acc.linkedEmail?.toLowerCase().trim() === email
          );
          
          if (connectedApps.length > 0) {
            groupedData.push({
              email: email,
              apps: connectedApps
            });
          }
        });

        // Sort by jumlah aplikasi terbanyak
        groupedData.sort((a, b) => b.apps.length - a.apps.length);

        setGroups(groupedData);
        // Default pilih email pertama jika ada
        if (!selectedEmail && groupedData.length > 0) {
          setSelectedEmail(groupedData[0].email);
        }
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [selectedEmail]);

  // Cari grup yang sedang dipilih
  const activeGroup = groups.find(g => g.email === selectedEmail);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-full">
          <Network className="text-indigo-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Peta Konektivitas</h1>
          <p className="text-slate-500 text-sm">Lihat aplikasi apa saja yang terhubung ke email utama Anda.</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center">
          <p className="text-slate-500">Belum ada data relasi.</p>
          <p className="text-sm text-slate-400 mt-2">
            Pastikan Anda mengisi kolom <strong>"Terhubung dengan Email"</strong> saat menambah akun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: Daftar Email Induk */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Akun Induk (Email)
            </h3>
            {groups.map((group) => (
              <button
                key={group.email}
                onClick={() => setSelectedEmail(group.email)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                  selectedEmail === group.email
                    ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200"
                    : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className={`font-medium truncate ${selectedEmail === group.email ? "text-indigo-900" : "text-slate-700"}`}>
                    {group.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Globe size={12} />
                    {group.apps.length} Aplikasi Terhubung
                  </p>
                </div>
                {selectedEmail === group.email && (
                  <ArrowRight size={16} className="text-indigo-500" />
                )}
              </button>
            ))}
          </div>

          {/* KOLOM KANAN: Detail Aplikasi Terhubung */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Aplikasi Terhubung ke: <span className="text-indigo-600 normal-case">{selectedEmail}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeGroup?.apps.map((app) => (
                <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Decorative Stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    app.category === 'GAME' ? 'bg-purple-500' : 
                    app.category === 'FINANCE' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />

                  <div className="p-2 bg-slate-50 rounded-lg">
                    {getCategoryIcon(app.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-900 truncate">{app.serviceName}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                        {app.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mt-1 truncate font-mono bg-slate-50 inline-block px-1 rounded">
                      {app.identifier}
                    </p>

                    {/* Detail Tambahan Jika Ada */}
                    {app.category === "GAME" && (app.details as any)?.ign && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                        <Gamepad2 size={12} />
                        IGN: {(app.details as any).ign}
                      </div>
                    )}
                    {app.category === "SOCIAL" && (app.details as any)?.phoneLinked && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                        <Smartphone size={12} />
                        HP: {(app.details as any).phoneLinked}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}