"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, query, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Shield, 
  HardDrive, 
  Bell, 
  LogOut, 
  Save, 
  Loader2, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Lock,
  X,
  Info
} from "lucide-react";

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

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  
  // Form States
  const [displayName, setDisplayName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [storageUsage, setStorageUsage] = useState({ count: 0, size: "0 KB" });

  // Notification State (Ganti alert)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({
    message: "",
    type: null
  });

  const showNotification = (msg: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: "", type: null }), 5000);
  };

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        
        // Calculate "Storage" Usage
        try {
          const q = query(collection(db, "accounts"));
          const snapshot = await getDocs(q);
          const count = snapshot.size;
          const sizeKB = (count * 1.5).toFixed(2); 
          setStorageUsage({ count, size: `${sizeKB} KB` });
        } catch (e) {
          console.error("Failed to calc storage", e);
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Handlers
  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName });
      showNotification("PROFILE_UPDATED_SUCCESSFULLY", "success");
    } catch (error) {
      showNotification("ERROR: UPDATE_FAILED", "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const querySnapshot = await getDocs(collection(db, "accounts"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
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

  // Logika Purge Vault (Pembersihan Total)
  const handlePurgeVault = async () => {
    setPurging(true);
    try {
      const q = query(collection(db, "accounts"));
      const snapshot = await getDocs(q);
      
      // Batch deletion (client side simulation)
      const deletePromises = snapshot.docs.map(docSnap => 
        deleteDoc(doc(db, "accounts", docSnap.id))
      );
      
      await Promise.all(deletePromises);
      
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

  if (loading) {
    return (
      <div className={`flex h-[80vh] items-center justify-center ${THEME.bg} font-mono`}>
        <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
            <Settings size={24} className="animate-spin" />
            <span className="tracking-widest">INITIALIZING_CONFIG...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto pb-20 space-y-8 font-mono text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      
      {/* NOTIFICATION TOAST */}
      {notification.type && (
        <div className={cn(
            "fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl animate-in slide-in-from-right-4 duration-300",
            notification.type === 'success' ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-400" :
            notification.type === 'error' ? "bg-red-950/90 border-red-500/50 text-red-400" :
            "bg-blue-950/90 border-blue-500/50 text-blue-400"
        )}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : 
             notification.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
            <span className="text-xs font-bold tracking-widest">{notification.message}</span>
            <button onClick={() => setNotification({ message: "", type: null })} className="ml-2 opacity-50 hover:opacity-100">
                <X size={14} />
            </button>
        </div>
      )}

      {/* MODAL PURGE VAULT */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-xl border border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
                <div className="flex items-center gap-3 text-red-500">
                    <div className="p-2 bg-red-950/50 rounded-full border border-red-900"><AlertTriangle size={24} /></div>
                    <h3 className="text-lg font-bold tracking-wider">CRITICAL_ACTION</h3>
                </div>
                <p className="text-slate-400 text-sm border-l-2 border-red-900/50 pl-3">
                    You are about to initiate a <strong className="text-white">FULL_DATABASE_PURGE</strong>. 
                    This will permanently destroy all {storageUsage.count} records.
                    <br/><span className="text-red-400 text-xs mt-2 block font-bold">LOG_DATA: NO_BACKUP_DETECTED_IN_CACHE</span>
                </p>
                <div className="flex gap-3 justify-end pt-2">
                    <button 
                        onClick={() => setShowPurgeModal(false)} 
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-transparent hover:border-slate-600 transition-all"
                    >
                        ABORT_MISSION
                    </button>
                    <button 
                        onClick={handlePurgeVault} 
                        disabled={purging}
                        className="px-4 py-2 text-xs font-bold text-white bg-red-600/80 hover:bg-red-600 rounded border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 transition-all"
                    >
                        {purging ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />} EXECUTE_PURGE
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="text-cyan-400" />
          SYSTEM_CONFIGURATION
        </h1>
        <p className="text-xs text-slate-500 mt-1 tracking-widest">
          CONTROL_PANEL // PREFERENCES // SECURITY
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: NAVIGATION / STATUS */}
        <div className="space-y-6">
            
            {/* User Badge */}
            <div className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} flex flex-col items-center text-center space-y-3`}>
                <div className="w-20 h-20 bg-slate-950 rounded-full border-2 border-cyan-500/50 flex items-center justify-center relative group overflow-hidden">
                    {user?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={32} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">{user?.displayName || "Admin User"}</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-bold tracking-wider">
                    <CheckCircle2 size={12} /> SYSTEM_ONLINE
                </div>
            </div>

            {/* Storage Status */}
            <div className={`p-4 rounded-xl border ${THEME.border} ${THEME.panel} space-y-4`}>
                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <HardDrive size={14} /> Database_Metrics
                </h4>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Entries</span>
                        <span className="text-cyan-400 font-mono">{storageUsage.count} Records</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Est. Size</span>
                        <span className="text-purple-400 font-mono">{storageUsage.size}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                        <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded-full" style={{ width: '15%' }} />
                    </div>
                    <p className="text-[9px] text-slate-600 text-right">Server Capacity: Optimized</p>
                </div>
            </div>

            {/* System Info */}
            <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-950/30 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Cpu size={14} />
                    <span>Vault Version: <span className="text-slate-300">v2.4.0-beta</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <RefreshCw size={14} />
                    <span>Last Sync: <span className="text-slate-300">Just now</span></span>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS FORMS */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* PROFILE SETTINGS */}
            <section className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-4 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20" />
                <h3 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
                    <User size={16} /> Identity_Protocol
                </h3>
                <div className="grid gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Display Name</label>
                        <div className="flex gap-2">
                            <input 
                                value={displayName} 
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 text-slate-300"
                            />
                            <button onClick={handleUpdateProfile} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-700 transition-colors">
                                SAVE
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Registered Email</label>
                        <input disabled value={user?.email || ""} className="w-full bg-slate-950/50 border border-slate-800 rounded p-2 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                </div>
            </section>

            {/* SECURITY & DATA */}
            <section className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-4 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
                    <Shield size={16} /> Security_&_Data
                </h3>
                
                {/* Toggles */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <Bell className="text-slate-400" size={18} />
                            <div>
                                <p className="text-sm font-bold text-slate-300">Security Notifications</p>
                                <p className="text-[10px] text-slate-500">Receive email alerts for suspicious activity.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${emailNotifications ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800 border border-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${emailNotifications ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-slate-500'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <Lock className="text-slate-400" size={18} />
                            <div>
                                <p className="text-sm font-bold text-slate-300">2-Factor Authentication</p>
                                <p className="text-[10px] text-slate-500">Hardware token or authenticator app required.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">DISABLED</span>
                            <button className="w-10 h-5 rounded-full relative bg-slate-800 border border-slate-700">
                                <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Actions */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/50">
                    <button 
                        onClick={handleExportData}
                        disabled={exporting}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/10 rounded-lg transition-all group"
                    >
                        {exporting ? <Loader2 size={20} className="animate-spin text-cyan-400" /> : <Download size={20} className="text-slate-400 group-hover:text-cyan-400" />}
                        <span className="text-xs font-bold text-slate-400 group-hover:text-cyan-300">EXPORT_DB (JSON)</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/10 rounded-lg transition-all group">
                        <Upload size={20} className="text-slate-400 group-hover:text-purple-400" />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-purple-300">IMPORT_DATA</span>
                    </button>
                </div>
            </section>

            {/* DANGER ZONE */}
            <section className={`p-6 rounded-xl border border-red-900/30 bg-red-950/5 space-y-4 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600/50" />
                <h3 className="text-sm font-bold text-red-500 border-b border-red-900/30 pb-2 flex items-center gap-2 uppercase tracking-wider">
                    <AlertTriangle size={16} /> Danger_Zone
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-300">Log Out Session</p>
                        <p className="text-[10px] text-slate-500">Terminate current access token.</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 border border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-500 hover:bg-red-950/20 rounded text-xs font-bold transition-all flex items-center gap-2">
                        <LogOut size={14} /> LOGOUT
                    </button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-red-900/20">
                    <div>
                        <p className="text-sm font-bold text-red-400">Purge Vault</p>
                        <p className="text-[10px] text-red-500/70">Permanently delete all records. Cannot be undone.</p>
                    </div>
                    <button 
                        onClick={() => setShowPurgeModal(true)}
                        className="px-4 py-2 bg-red-950/30 border border-red-900/50 hover:bg-red-600 hover:text-white text-red-500 rounded text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Trash2 size={14} /> DELETE_ALL
                    </button>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
}

// Helper function untuk merge Tailwind classes
function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}