"use client";

import { useState, useEffect } from "react";
import { auth, db, googleProvider } from "@/lib/firebase"; 
import { signOut, updateProfile, linkWithPopup } from "firebase/auth"; 
import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { 
  Settings, User, Shield, HardDrive, Bell, LogOut, Loader2, Download, 
  Upload, Trash2, AlertTriangle, CheckCircle2, Cpu, RefreshCw, Lock, X, Info,
  Activity, Link as LinkIcon, Edit2
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  
  // Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [storageUsage, setStorageUsage] = useState({ count: 0, size: "0 KB" });
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({
    message: "", type: null
  });

  const showNotification = (msg: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: "", type: null }), 5000);
  };

  // 1. Data Fetching Secure Logic
  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }
    
    setDisplayName(prev => prev || user.displayName || (isGuest ? "Pengguna Tamu" : ""));
    
    const googleProviderData = user.providerData?.find(p => p.providerId === 'google.com');
    setPhotoURL(prev => prev || user.photoURL || googleProviderData?.photoURL || "");
    
    const linkedToGoogle = user.providerData.some(provider => provider.providerId === 'google.com');
    setIsGoogleLinked(linkedToGoogle);

    const fetchStorageMetrics = async () => {
      try {
        const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const count = snapshot.size;
        const sizeKB = (count * 1.5).toFixed(2); 
        setStorageUsage({ count, size: `${sizeKB} KB` });
      } catch (e) {
        console.error("Gagal memuat kalkulasi penyimpanan", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageMetrics();
  }, [user, isGuest]);

  // 2. Handlers
  const handleUpdateProfile = async () => {
    if (!user) return;
    if (isGuest) {
      showNotification("Sesi tamu tidak dapat menyimpan profil permanen.", "info");
      return;
    }
    try {
      await updateProfile(user, { displayName });
      setIsEditingProfile(false);
      showNotification("Profil berhasil diperbarui!", "success");
      
      await user.reload();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showNotification("ERROR: Gagal memperbarui profil", "error");
    }
  };

  const handleLinkGoogle = async () => {
    if (!user) return;
    setIsLinkingGoogle(true);
    try {
      const result = await linkWithPopup(user, googleProvider);
      setIsGoogleLinked(true);
      
      const googleData = result.user.providerData.find(p => p.providerId === 'google.com');
      if (googleData) {
        const updates: any = {};
        if (googleData.photoURL && !user.photoURL) {
          updates.photoURL = googleData.photoURL;
          setPhotoURL(googleData.photoURL);
        }
        if (googleData.displayName && !user.displayName) {
          updates.displayName = googleData.displayName;
          setDisplayName(googleData.displayName);
        }
        if (Object.keys(updates).length > 0) {
          await updateProfile(result.user, updates);
          await result.user.reload();
        }
      }

      showNotification("Akun Google berhasil ditautkan!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error("Gagal menautkan Google:", error);
      if (error.code === 'auth/credential-already-in-use') {
        showNotification("Akun Google ini sudah digunakan oleh pengguna lain.", "error");
      } else {
        showNotification("Gagal menautkan akun Google. Coba lagi.", "error");
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("myvault_guest_mode");
    router.push("/");
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vault-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification("BACKUP_SEQUENCE_COMPLETE", "success");
    } catch (error) {
      showNotification("SYSTEM_ERROR: EXPORT_FAILED", "error");
    } finally {
      setExporting(false);
    }
  };

  const handlePurgeVault = async () => {
    if (!user) return;
    setPurging(true);
    try {
      const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      
      setStorageUsage({ count: 0, size: "0 KB" });
      setShowPurgeModal(false);
      showNotification("ALL_RECORDS_PURGED_SUCCESSFULLY", "success");
    } catch (error) {
      console.error(error);
      showNotification("CRITICAL_ERROR: PURGE_FAILED", "error");
    } finally {
      setPurging(false);
    }
  };

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "font-sans text-slate-900 dark:text-slate-100",
      panel: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      accent: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600 dark:bg-blue-500",
      dangerPanel: "bg-red-50/30 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl",
      input: "bg-transparent border border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-lg",
      btnSave: "bg-blue-600 hover:bg-blue-700 text-white rounded-lg",
      btnOutline: "border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50 dark:bg-slate-800/50 rounded-lg",
      btnGoogle: "bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg"
    },
    hacker: {
      wrapper: "font-mono text-green-500",
      panel: "bg-[#050505] border border-green-900/50 rounded-sm",
      textMain: "text-green-400",
      textSub: "text-green-700",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500",
      dangerPanel: "bg-red-950/10 border border-red-900/30 rounded-sm",
      input: "bg-black border border-green-900 focus:border-green-500 text-green-400 rounded-sm",
      btnSave: "bg-green-900/40 hover:bg-green-900/60 text-green-400 border border-green-500/50 rounded-sm",
      btnOutline: "border border-green-900/50 hover:border-green-500/50 bg-black text-green-500 rounded-sm",
      btnGoogle: "bg-black border border-green-900 hover:bg-green-900/30 text-green-500 rounded-sm"
    },
    casual: {
      wrapper: "font-sans text-stone-800 dark:text-stone-100",
      panel: "bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl border border-orange-200 dark:border-stone-800 rounded-2xl shadow-lg shadow-orange-900/5",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      accent: "text-orange-500 dark:text-orange-400",
      accentBg: "bg-gradient-to-r from-orange-500 to-pink-500",
      dangerPanel: "bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl",
      input: "bg-transparent border border-orange-200 dark:border-stone-700 focus:border-orange-500 text-stone-800 dark:text-stone-100 rounded-xl",
      btnSave: "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl",
      btnOutline: "border border-orange-200 dark:border-stone-800 hover:border-orange-400 bg-white/50 dark:bg-stone-950/50 rounded-xl",
      btnGoogle: "bg-white dark:bg-stone-950 border border-orange-200 dark:border-stone-800 hover:bg-orange-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-200 rounded-xl"
    }
  };

  const cs = styles[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[60vh] font-mono", cs.textMain)}>
        <Activity size={32} className={cn("animate-pulse mb-4", cs.accent)} />
        <span className="tracking-widest animate-pulse text-sm">INITIALIZING_CONFIG...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full pb-20 flex flex-col gap-6 lg:gap-8 animate-in fade-in duration-500", cs.wrapper)}>
      
      {/* NOTIFICATION TOAST */}
      {notification.type && (
        <div className={cn(
            "fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 border shadow-2xl animate-in slide-in-from-right-4 duration-300 font-mono rounded-xl",
            notification.type === 'success' ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-400" :
            notification.type === 'error' ? "bg-red-950/90 border-red-500/50 text-red-400" :
            "bg-blue-950/90 border-blue-500/50 text-blue-400"
        )}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : 
             notification.type === 'error' ? <AlertTriangle size={20} /> : <Info size={20} />}
            <span className="text-sm font-bold tracking-widest">{notification.message}</span>
            <button onClick={() => setNotification({ message: "", type: null })} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                <X size={16} />
            </button>
        </div>
      )}

      {/* MODAL PURGE VAULT */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono">
            <div className="bg-[#050505] rounded-2xl border border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full p-6 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
                <div className="flex items-center gap-3 text-red-500">
                    <div className="p-2 bg-red-950/50 rounded-full border border-red-900"><AlertTriangle size={24} /></div>
                    <h3 className="text-lg font-bold tracking-wider">CRITICAL_ACTION</h3>
                </div>
                <p className="text-slate-400 text-sm border-l-2 border-red-900/50 pl-3 leading-relaxed">
                    You are about to initiate a <strong className="text-white">FULL_DATABASE_PURGE</strong>. 
                    This will permanently destroy all {storageUsage.count} records.
                    <br/><br/><span className="text-red-400 text-[10px] font-bold bg-red-950/30 px-2 py-1 rounded inline-block border border-red-900/30">LOG_DATA: NO_BACKUP_DETECTED</span>
                </p>
                <div className="flex gap-3 justify-end pt-2">
                    <button 
                        onClick={() => setShowPurgeModal(false)} 
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                        ABORT
                    </button>
                    <button 
                        onClick={handlePurgeVault} 
                        disabled={purging}
                        className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md flex items-center gap-2 transition-all"
                    >
                        {purging ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />} EXECUTE_PURGE
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className={cn("p-2.5 rounded-lg", theme === 'hacker' ? 'bg-green-900/20 text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
          <Settings size={22} />
        </div>
        <div>
          <h1 className={cn("text-xl font-bold tracking-tight", cs.textMain)}>
            {theme === 'hacker' ? 'SYSTEM_CONFIGURATION' : 'Pengaturan Sistem'}
          </h1>
          <p className={cn("text-xs mt-0.5", cs.textSub)}>
            {theme === 'hacker' ? 'PREFERENCES // SECURITY // IDENTITY' : 'Kelola identitas dan preferensi keamanan'}
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROW 1: USER PROFILE (Kiri) & IDENTITY PROTOCOL (Kanan)    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* User Card (KIRI) */}
        <div className={cn("p-6 lg:col-span-4 flex flex-col items-center justify-center text-center relative overflow-hidden h-full", cs.panel, theme !== 'casual' && 'rounded-xl')}>
            <div className={cn("absolute top-0 left-0 w-full h-1.5", cs.accentBg)} />
            <div className={cn("w-24 h-24 lg:w-28 lg:h-28 rounded-full border-2 flex items-center justify-center mb-4 relative group overflow-hidden shadow-sm", theme === 'hacker' ? 'bg-black border-green-500/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700')}>
                {photoURL ? (
                    <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                    <User size={36} className={cn("transition-colors", cs.textSub, "group-hover:text-blue-500", theme === 'hacker' && 'group-hover:text-green-500')} />
                )}
            </div>
            <div className="space-y-1 w-full">
                <h3 className={cn("font-bold text-lg truncate px-2", cs.textMain)}>{displayName || (isGuest ? "Tamu Anonim" : "Pengguna Vault")}</h3>
                <p className={cn("text-xs truncate px-2", cs.textSub)}>{user?.email || "Sesi lokal aktif"}</p>
            </div>
            <div className={cn("mt-4 inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold tracking-widest font-mono uppercase", isGuest ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500")}>
                {isGuest ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />} 
                {isGuest ? 'GUEST_MODE' : 'SYSTEM_ONLINE'}
            </div>
        </div>

        {/* Identity Form & Link Google (KANAN) */}
        <section className={cn("p-6 lg:p-8 lg:col-span-8 flex flex-col h-full relative overflow-hidden", cs.panel, theme !== 'casual' && 'rounded-xl')}>
            <div className={cn("flex items-center justify-between border-b pb-4 mb-5", theme === 'hacker' ? 'border-green-900/30' : 'border-slate-200 dark:border-slate-800')}>
                <h3 className={cn("text-sm font-bold flex items-center gap-2 uppercase tracking-wider", cs.accent)}>
                    <User size={16} /> Identity Protocol
                </h3>
                {!isEditingProfile && !isGuest && (
                    <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className={cn("text-[10px] font-bold px-3 py-1.5 transition-colors flex items-center gap-1.5", cs.btnOutline)}
                    >
                        <Edit2 size={12} /> EDIT
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider ml-0.5", cs.textSub)}>Display Name</label>
                    {isEditingProfile ? (
                        <input 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Ketik nama..."
                            className={cn("w-full p-2.5 text-sm outline-none transition-colors", cs.input)}
                            autoFocus
                        />
                    ) : (
                        <div className={cn("p-2.5 text-sm font-medium", cs.textMain)}>
                            {displayName || (isGuest ? "Tamu Anonim" : "Belum diatur")}
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider ml-0.5", cs.textSub)}>Registered Email</label>
                    <div className={cn("p-2.5 text-sm font-medium opacity-70", cs.textMain)}>
                        {user?.email || (isGuest ? "Sesi Sementara (Guest)" : "Belum diatur")}
                    </div>
                </div>
            </div>

            {isEditingProfile && (
                <div className="flex justify-end gap-3 mb-5">
                    <button 
                        onClick={() => {
                            setIsEditingProfile(false);
                            setDisplayName(user?.displayName || ""); 
                        }}
                        className={cn("px-5 py-2 text-xs font-bold transition-all", cs.btnOutline)}
                    >
                        BATAL
                    </button>
                    <button 
                        onClick={handleUpdateProfile} 
                        className={cn("px-6 py-2 text-xs font-bold transition-all active:scale-95 flex items-center gap-2", cs.btnSave)}
                    >
                        SIMPAN
                    </button>
                </div>
            )}

            {/* Google Connection Item (Dipaksa ke Bawah dengan mt-auto) */}
            <div className={cn("mt-auto pt-5 border-t", theme === 'hacker' ? 'border-green-900/30' : 'border-slate-200 dark:border-slate-800')}>
                <label className={cn("text-xs font-bold uppercase tracking-wider ml-1 mb-2 block", cs.textSub)}>Connected Accounts</label>
                <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 border p-4 lg:p-5 transition-colors", cs.input, theme !== 'casual' && 'rounded-xl')}>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", theme === 'hacker' ? 'bg-black' : 'bg-slate-100 dark:bg-slate-800')}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        </div>
                        <div>
                            <p className={cn("text-sm font-bold", cs.textMain)}>Google Account</p>
                            <p className={cn("text-[10px]", cs.textSub)}>{isGoogleLinked ? "Autentikasi diaktifkan via Google" : "Tautkan untuk Login dengan Google"}</p>
                        </div>
                    </div>
                    {isGoogleLinked ? (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                            <CheckCircle2 size={14}/> TERTAUT
                        </span>
                    ) : (
                        <button 
                            onClick={handleLinkGoogle} 
                            disabled={isGuest || isLinkingGoogle}
                            className={cn("px-4 py-2 text-[10px] font-bold transition-all flex items-center justify-center gap-2 border", cs.btnGoogle, isGuest && 'opacity-50 cursor-not-allowed')}
                        >
                            {isLinkingGoogle ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                            {isLinkingGoogle ? "MENAUTKAN..." : "TAUTKAN"}
                        </button>
                    )}
                </div>
                {isGuest && <p className="text-[10px] text-amber-500 mt-2 ml-1 flex items-center gap-1"><AlertTriangle size={12} /> Fitur tautan akun tidak tersedia untuk Sesi Tamu.</p>}
            </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* ROW 2: DATABASE METRICS (Kiri) & DATA CONTROL (Kanan)     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Metrics Card (KIRI) */}
        <div className={cn("p-6 flex flex-col justify-between h-full lg:col-span-4", cs.panel, theme !== 'casual' && 'rounded-xl')}>
            <div className="space-y-4">
                <h4 className={cn("text-sm font-bold uppercase flex items-center gap-2 tracking-wider border-b pb-3", cs.textSub, theme === 'hacker' ? 'border-green-900/30' : 'border-slate-200 dark:border-slate-800')}>
                    <HardDrive size={16} /> Database Metrics
                </h4>
                <div className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between items-center">
                        <span className={cs.textSub}>Total Entries</span>
                        <span className={cn("font-bold", cs.accent)}>{storageUsage.count} Records</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className={cs.textSub}>Est. Size</span>
                        <span className="text-purple-500 font-bold">{storageUsage.size}</span>
                    </div>
                    <div className={cn("w-full rounded-full h-1.5 mt-2", theme === 'hacker' ? 'bg-black border border-green-900' : 'bg-slate-200 dark:bg-slate-800')}>
                        <div className={cn("h-full rounded-full transition-all", cs.accentBg)} style={{ width: `${Math.max(5, (storageUsage.count / 1000) * 100)}%` }} />
                    </div>
                    <p className={cn("text-[10px] text-right mt-1", cs.textSub)}>Server Capacity: Optimized</p>
                </div>
            </div>
            
            <div className="pt-5 mt-5 border-t border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
                <div className={cn("flex items-center justify-between", cs.textSub)}>
                    <span className="flex items-center gap-1.5"><Cpu size={14} /> Version</span>
                    <span className={cs.textMain}>v5.0.0-beta</span>
                </div>
                <div className={cn("flex items-center justify-between", cs.textSub)}>
                    <span className="flex items-center gap-1.5"><RefreshCw size={14} /> Sync</span>
                    <span className={cs.textMain}>Just now</span>
                </div>
            </div>
        </div>

        {/* Security & Data Actions (KANAN) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            
            {/* Preferences / Toggles */}
            <section className={cn("p-6 flex flex-col justify-center gap-4 h-full", cs.panel, theme !== 'casual' && 'rounded-xl')}>
                <h3 className={cn("text-sm font-bold uppercase tracking-wider mb-2", cs.textSub)}>Preferences</h3>
                
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", theme === 'hacker' ? 'bg-black' : 'bg-slate-100 dark:bg-slate-800')}><Bell size={18} className={cs.textSub} /></div>
                        <div>
                            <p className={cn("text-sm font-bold", cs.textMain)}>Security Alerts</p>
                            <p className={cn("text-[10px]", cs.textSub)}>Email notifications</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={cn("w-10 h-5 rounded-full relative transition-colors border", emailNotifications ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-300 dark:bg-slate-700 border-transparent')}
                    >
                        <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all", emailNotifications ? 'right-0.5 bg-emerald-500' : 'left-0.5 bg-slate-500')} />
                    </button>
                </div>

                <div className="flex items-center justify-between w-full opacity-60 mt-2">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", theme === 'hacker' ? 'bg-black' : 'bg-slate-100 dark:bg-slate-800')}><Lock size={18} className={cs.textSub} /></div>
                        <div>
                            <p className={cn("text-sm font-bold", cs.textMain)}>2FA Auth</p>
                            <p className={cn("text-[10px]", cs.textSub)}>Hardware required</p>
                        </div>
                    </div>
                    <span className={cn("text-[10px] font-bold font-mono", cs.textSub)}>DISABLED</span>
                </div>
            </section>

            {/* Import/Export */}
            <section className={cn("p-6 flex flex-col h-full", cs.panel, theme !== 'casual' && 'rounded-xl')}>
                <h3 className={cn("text-sm font-bold uppercase tracking-wider mb-4", cs.textSub)}>Data Control</h3>
                <div className="flex-1 flex flex-col gap-3">
                    <button 
                        onClick={handleExportData}
                        disabled={exporting}
                        className={cn("flex items-center justify-center gap-3 transition-all font-mono text-xs font-bold w-full h-full flex-1 min-h-[50px]", cs.btnOutline)}
                    >
                        {exporting ? <Loader2 size={16} className={cn("animate-spin", cs.accent)} /> : <Download size={16} className={cs.textSub} />}
                        EXPORT_JSON
                    </button>
                    <button className={cn("flex items-center justify-center gap-3 transition-all font-mono text-xs font-bold w-full h-full flex-1 min-h-[50px] opacity-50 cursor-not-allowed", cs.btnOutline)}>
                        <Upload size={16} className={cs.textSub} />
                        IMPORT_DATA
                    </button>
                </div>
            </section>
        </div>
      </div>

      {/* DANGER ZONE - FULL WIDTH BOTTOM */}
      <section className={cn("p-6 md:p-8 mt-2", cs.dangerPanel)}>
          <h3 className="text-sm font-bold text-red-500 border-b border-red-900/20 pb-3 flex items-center gap-2 uppercase tracking-wider mb-6">
              <AlertTriangle size={16} /> Danger Zone
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col justify-between p-5 md:p-6 bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-xl">
                <div>
                    <p className="text-base font-bold text-red-500">Log Out Session</p>
                    <p className="text-xs text-red-500/70 mt-2 leading-relaxed max-w-sm">Akhiri sesi akses Anda saat ini dengan aman. Anda akan perlu masuk kembali untuk mengakses vault.</p>
                </div>
                <button onClick={handleLogout} className="mt-5 py-2.5 px-6 border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto self-start">
                    <LogOut size={14} /> KELUAR AKUN
                </button>
            </div>
            
            <div className="flex flex-col justify-between p-5 md:p-6 bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-xl">
                <div>
                    <p className="text-base font-bold text-red-500">Purge Vault</p>
                    <p className="text-xs text-red-500/70 mt-2 leading-relaxed max-w-sm">Hapus semua data secara permanen. Tindakan ini tidak bisa dibatalkan dan data tidak dapat dipulihkan.</p>
                </div>
                <button onClick={() => setShowPurgeModal(true)} className="mt-5 py-2.5 px-6 bg-red-500/10 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-500 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto self-start">
                    <Trash2 size={14} /> DELETE ALL DATA
                </button>
            </div>
          </div>
      </section>

    </div>
  );
}