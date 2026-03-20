"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Key, 
  Terminal, Copy, Check, Flame, Loader2, Lock, User, Shield
} from "lucide-react";
import Link from "next/link";

interface SharedData {
  serviceName: string;
  category: string;
  identifier: string;
  password: string;
  ownerName: string;
  expiresAt: any;
}

export default function SharePage({ params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = use(params);
  const { theme } = useTheme();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading');
  const [data, setData] = useState<SharedData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // LOGIKA UTAMA: BURN-ON-READ
  useEffect(() => {
    let isMounted = true;

    const fetchAndBurnData = async () => {
      if (isAuthLoading) return; // Tunggu modul keamanan siap

      try {
        // Berikan akses hantu jika penerima belum login
        if (!user) {
          await signInAnonymously(auth);
        }

        // Cari data di jalur publik yang aman
        const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'default-app-id';
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_links', linkId);
        
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          if (isMounted) setStatus('expired');
          return;
        }

        const payload = docSnap.data() as SharedData;
        const now = new Date();
        const expiresAt = payload.expiresAt?.toDate ? payload.expiresAt.toDate() : new Date(0);

        // Jika waktu sudah lewat batas expired (24 jam)
        if (now > expiresAt) {
          await deleteDoc(docRef); // Bersihkan sampah
          if (isMounted) setStatus('expired');
          return;
        }

        // TAHAP KRUSIAL: Simpan ke State LALU HAPUS DARI SERVER!
        if (isMounted) {
          setData(payload);
          setStatus('success');
        }
        
        // EKSEKUSI PEMBAKARAN DATA (Data ditarik, lalu dihapus permanen)
        await deleteDoc(docRef);
        console.log("BURN_PROTOCOL_EXECUTED: Data has been permanently deleted from the server.");

      } catch (error) {
        console.error("Error accessing secure link:", error);
        if (isMounted) setStatus('error');
      }
    };

    fetchAndBurnData();

    return () => { isMounted = false; };
  }, [linkId, user, isAuthLoading]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- STYLES TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100",
      card: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl",
      accent: "text-blue-600 dark:text-blue-400",
      fieldBg: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl",
      btnCopy: "hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400",
      dangerBg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400",
    },
    hacker: {
      wrapper: "bg-[#020202] text-green-500 font-mono",
      card: "bg-[#050505] border border-green-900/50 shadow-[0_0_30px_rgba(34,197,94,0.1)] rounded-sm",
      accent: "text-cyan-400",
      fieldBg: "bg-black border border-green-900/50 shadow-inner rounded-sm",
      btnCopy: "hover:bg-green-900/30 text-green-700 hover:text-green-400 rounded-sm",
      dangerBg: "bg-red-950/20 border-red-900/50 text-red-500",
    },
    casual: {
      wrapper: "bg-orange-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100",
      card: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-orange-200 dark:border-stone-800 shadow-2xl shadow-orange-900/5 rounded-[2rem]",
      accent: "text-orange-500 dark:text-orange-400",
      fieldBg: "bg-white dark:bg-stone-950 border border-orange-100 dark:border-stone-800 rounded-2xl shadow-sm",
      btnCopy: "hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-500 hover:text-orange-500 dark:hover:text-orange-400",
      dangerBg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400",
    }
  };

  const cs = styles[theme];

  // STATE: LOADING
  if (status === 'loading') {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-6", cs.wrapper)}>
        <div className="relative flex items-center justify-center mb-6">
          <ShieldCheck size={64} className="opacity-20 animate-pulse" />
          <Loader2 size={32} className={cn("absolute animate-spin", cs.accent)} />
        </div>
        <h2 className="text-xl font-bold tracking-widest uppercase animate-pulse">DECRYPTING LINK...</h2>
        <p className="text-xs opacity-60 mt-2 font-mono">ESTABLISHING SECURE CONNECTION</p>
      </div>
    );
  }

  // STATE: EXPIRED / BURNED / ERROR
  if (status === 'expired' || status === 'error') {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4 lg:p-6", cs.wrapper)}>
        <div className={cn("max-w-md w-full p-8 md:p-10 text-center relative overflow-hidden", cs.card)}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 animate-pulse" />
          
          <div className={cn("w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border-2 border-red-500/30 bg-red-500/10 text-red-500", theme === 'hacker' && 'rounded-sm')}>
            <Flame size={32} />
          </div>
          
          <h2 className="text-2xl font-bold uppercase tracking-widest text-red-500 mb-3">LINK BURNED</h2>
          <p className="text-sm opacity-80 leading-relaxed mb-8">
            Tautan ini telah dihancurkan atau kadaluarsa. Sistem <strong className="font-mono text-red-400">Burn-on-Read</strong> memastikan bahwa data hanya dapat dilihat satu kali saja untuk alasan keamanan.
          </p>

          <Link href="/" className={cn("inline-flex items-center justify-center w-full px-6 py-3 font-bold text-xs tracking-widest uppercase transition-all border rounded-lg", theme === 'hacker' ? 'bg-black border-green-900/50 hover:border-green-500 text-green-500 rounded-sm' : 'bg-transparent border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800', theme === 'casual' && 'rounded-xl')}>
            KEMBALI KE BERANDA
          </Link>
        </div>
      </div>
    );
  }

  // STATE: SUCCESS (DATA DITAMPILKAN 1 KALI)
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 lg:p-6 selection:bg-purple-500/30", cs.wrapper)}>
      <div className={cn("max-w-xl w-full p-6 md:p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500", cs.card)}>
        
        {/* Animated Burn Warning Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-[length:200%_100%] animate-[pulse_2s_ease-in-out_infinite]" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl border flex items-center justify-center", theme === 'hacker' ? 'bg-black border-green-900/50 rounded-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', cs.accent, theme === 'casual' && 'rounded-2xl')}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight uppercase">SECURE_PAYLOAD</h1>
              <p className="text-[10px] uppercase tracking-widest font-mono opacity-60 mt-0.5">Dikirim oleh: {data?.ownerName}</p>
            </div>
          </div>
        </div>

        {/* PERINGATAN HANGUS */}
        <div className={cn("p-4 border mb-8 flex gap-4 items-start", cs.dangerBg, theme === 'formal' ? 'rounded-xl' : theme === 'casual' ? 'rounded-2xl' : 'rounded-sm')}>
          <AlertTriangle size={24} className="shrink-0 animate-pulse mt-0.5" />
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-1">DATA INI TELAH DIHAPUS DARI SERVER</h4>
            <p className="text-xs opacity-90 leading-relaxed font-mono">
              Protokol <strong className="font-bold border-b border-current pb-0.5">Burn-on-Read</strong> aktif. Jangan <em>refresh</em> halaman ini. Segera salin dan amankan kredensial di bawah sebelum Anda menutup browser.
            </p>
          </div>
        </div>

        {/* DATA CONTAINER */}
        <div className="space-y-5">
          
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("px-2 py-1 text-[10px] font-bold border uppercase tracking-wider font-mono", theme === 'hacker' ? 'bg-black text-green-600 border-green-900/50 rounded-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 rounded')}>
              {data?.category}
            </span>
            <h3 className={cn("text-lg font-bold uppercase tracking-wider line-clamp-1", cs.accent)}>{data?.serviceName}</h3>
          </div>

          <div className="space-y-4 border-t border-dashed border-inherit pt-5">
            {/* Identifier Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Username / Email</label>
              <div className={cn("flex items-center p-3.5 transition-all group", cs.fieldBg)}>
                <User size={16} className="opacity-40 shrink-0 mr-3" />
                <span className="flex-1 font-mono text-sm break-all font-medium">{data?.identifier}</span>
                <button 
                  onClick={() => handleCopy(data?.identifier || '', 'identifier')}
                  className={cn("p-2 rounded-lg transition-colors shrink-0", cs.btnCopy)}
                  title="Copy Identifier"
                >
                  {copiedField === 'identifier' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Secret Password</label>
              <div className={cn("flex items-center p-3.5 transition-all group border-l-2", cs.fieldBg, "border-l-purple-500")}>
                <Key size={16} className="text-purple-500 shrink-0 mr-3" />
                <span className="flex-1 font-mono text-sm break-all font-medium text-purple-500 dark:text-purple-400">{data?.password}</span>
                <button 
                  onClick={() => handleCopy(data?.password || '', 'password')}
                  className={cn("p-2 rounded-lg transition-colors shrink-0", cs.btnCopy)}
                  title="Copy Password"
                >
                  {copiedField === 'password' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BRAND FOOTER */}
        <div className="mt-10 pt-6 border-t border-inherit flex justify-center opacity-40">
          <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase">
            <Shield size={14} /> VAULT ID. SECURE SHARE
          </div>
        </div>

      </div>
    </div>
  );
}