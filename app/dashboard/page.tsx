"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Users, Shield, Wallet, Gamepad2, Loader2, Database } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cek apakah user sudah login, jika belum tendang ke halaman login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setUserEmail(user.email);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Selamat Datang, {userEmail?.split("@")[0]}
        </h1>
        <p className="text-slate-500 mt-2">
          Ini adalah pusat kendali untuk semua aset digital dan data keluarga Anda.
        </p>
      </div>

      {/* Stats Grid Placeholder - Akan kita isi data real nanti */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Akun" 
          value="0" 
          icon={Shield} 
          color="bg-blue-500" 
        />
        <StatsCard 
          title="Keuangan" 
          value="0" 
          icon={Wallet} 
          color="bg-emerald-500" 
        />
        <StatsCard 
          title="Game & Hobi" 
          value="0" 
          icon={Gamepad2} 
          color="bg-purple-500" 
        />
        <StatsCard 
          title="Keluarga" 
          value="0" // Nanti ini menghitung jumlah Owner unik
          icon={Users} 
          color="bg-orange-500" 
        />
      </div>

      {/* Area Kosong untuk Next Phase */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center py-16">
        <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
          <Database size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Belum ada data ditampilkan</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          Database masih kosong. Di langkah selanjutnya, kita akan membuat halaman "The Vault" untuk mulai memindahkan data dari Excel.
        </p>
      </div>
    </div>
  );
}

// Komponen Kecil untuk Card (Hanya dipakai di sini)
function StatsCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`${color} p-3 rounded-lg text-white shadow-lg shadow-blue-500/20`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      </div>
    </div>
  );
}