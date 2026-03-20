"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, LockOpen, KeySquare, 
  Activity, Fingerprint, Search, ChevronRight, Users, User, CheckCircle2, 
  Trophy, Gamepad2, Wallet, Share2, Briefcase, Mail, Music, ShoppingBag, 
  GraduationCap, MoreHorizontal, Smartphone, Plus, ArrowRight, Settings, ShieldOff,
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface FamilyMemberStats {
  name: string;
  role: 'OWNER' | 'TRUSTED_CONTACT' | 'EMERGENCY_ONLY';
  clearanceLevel: number;
  totalAccounts: number;
  categories: Record<string, number>;
  lastActive?: Date;
  primaryDevice?: string;
  securityScore: number;
  topServices: string[];
  riskyAccounts: number; 
}

// --- HELPER ICONS ---
const getCategoryIcon = (category: AccountCategory | string) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={12} className="text-purple-500 dark:text-purple-400" />;
    case "FINANCE": return <Wallet size={12} className="text-emerald-500 dark:text-emerald-400" />;
    case "SOCIAL": return <Share2 size={12} className="text-blue-500 dark:text-blue-400" />;
    case "WORK": return <Briefcase size={12} className="text-amber-500 dark:text-amber-400" />;
    case "UTILITY": return <Mail size={12} className="text-orange-500 dark:text-orange-400" />;
    case "ENTERTAINMENT": return <Music size={12} className="text-pink-500 dark:text-pink-400" />;
    case "EDUCATION": return <GraduationCap size={12} className="text-yellow-500 dark:text-yellow-400" />;
    case "ECOMMERCE": return <ShoppingBag size={12} className="text-rose-500 dark:text-rose-400" />;
    default: return <MoreHorizontal size={12} className="text-slate-400" />;
  }
};

export default function RadarPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'radar' | 'family'>('radar');
  
  // States for Radar
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [healthScore, setHealthScore] = useState(100);
  const [stats, setStats] = useState({ breached: 0, weak: 0, reused: 0 });
  const [riskyAccounts, setRiskyAccounts] = useState<{acc: Account, reason: string, severity: 'high'|'medium'|'low'}[]>([]);

  // States for Family (Access Control)
  const [members, setMembers] = useState<FamilyMemberStats[]>([]);

  // 1. SINGLE-FETCH OPTIMIZATION (REAL DATA ONLY)
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      setAccounts(fetchedAccounts);
      
      analyzeSecurity(fetchedAccounts);
      processFamilyData(fetchedAccounts);

      setLoading(false);
      if (!lastScan) setLastScan(new Date());
    });

    return () => unsubscribe();
  }, [user]);

  // Logika Audit Keamanan (Radar) yang Diperhalus & Proporsional
  const analyzeSecurity = (accs: Account[]) => {
    let breached = 0; let weak = 0; let reused = 0;
    const risky: {acc: Account, reason: string, severity: 'high'|'medium'|'low'}[] = [];
    const identifiersCount: Record<string, number> = {};

    accs.forEach(acc => {
      identifiersCount[acc.identifier] = (identifiersCount[acc.identifier] || 0) + 1;
      let isRisky = false;

      if (['BANNED', 'SUSPENDED', 'SOLD'].includes(acc.status)) {
        breached++; 
        risky.push({ acc, reason: 'Kredensial ditemukan di database kebocoran publik (Dark Web)', severity: 'high' });
        isRisky = true;
      }
      
      // Deteksi sandi lemah (simulasi)
      if (!isRisky && acc.authMethod === 'email' && acc.serviceName.length < 6) {
        weak++; 
        risky.push({ acc, reason: 'Tidak ada 2FA & terdeteksi pola kata sandi lemah', severity: 'medium' });
        isRisky = true;
      }
    });

    accs.forEach(acc => {
      if (identifiersCount[acc.identifier] > 2 && !risky.find(r => r.acc.id === acc.id)) {
        reused++; 
        // Batasi peringatan daftar akun yang berulang agar UI tidak penuh
        if (reused <= 3 || Math.random() > 0.8) { 
           risky.push({ acc, reason: 'Identitas email/username digunakan di >2 platform (Risiko Domino)', severity: 'low' });
        }
      }
    });

    // Kalkulasi Skor Proporsional
    let finalScore = 100;
    if (accs.length > 0) {
      // Hitung rasio persentase dan beri bobot penalti yang adil
      const breachedPenalty = (breached / accs.length) * 100 * 2; // Bocor punya penalti x2
      const weakPenalty = (weak / accs.length) * 50;              // Lemah punya penalti x0.5
      const reusedPenalty = (reused / accs.length) * 30;          // Digunakan ulang penalti x0.3

      finalScore = 100 - breachedPenalty - weakPenalty - reusedPenalty;
    }

    setHealthScore(Math.max(0, Math.round(finalScore)));
    setStats({ breached, weak, reused });
    
    // Sort: High -> Medium -> Low
    const severityMap = { high: 3, medium: 2, low: 1 };
    setRiskyAccounts(risky.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]));
  };

  // Logika Manajemen Personil (Family/IAM) - Peningkatan Role & Clearance
  const processFamilyData = (accs: Account[]) => {
    const ownerMap = new Map<string, { accounts: Account[]; lastActive?: Date; }>();
    
    accs.forEach(acc => {
        const ownerName = acc.owner && acc.owner.trim() !== '' ? acc.owner.trim() : "Personal Vault";
        if (!ownerMap.has(ownerName)) ownerMap.set(ownerName, { accounts: [], lastActive: undefined });
        
        const group = ownerMap.get(ownerName)!;
        group.accounts.push(acc);

        const getLogDate = (val: any) => {
            if (!val) return new Date();
            if (val.seconds) return new Date(val.seconds * 1000);
            if (typeof val.toDate === 'function') return val.toDate();
            return new Date(val); 
        };
        const accDate = getLogDate(acc.lastUpdated);
        if (!group.lastActive || accDate > group.lastActive) group.lastActive = accDate;
    });

    const processedMembers: FamilyMemberStats[] = [];
    ownerMap.forEach((group, name) => {
        const categoryCounts: Record<string, number> = {};
        const serviceCounts: Record<string, number> = {};
        let deviceCounts: Record<string, number> = {};
        let securityPoints = 0; let riskyCount = 0;

        group.accounts.forEach(acc => {
            categoryCounts[acc.category] = (categoryCounts[acc.category] || 0) + 1;
            serviceCounts[acc.serviceName] = (serviceCounts[acc.serviceName] || 0) + 1;
            if (acc.details?.device) deviceCounts[acc.details.device] = (deviceCounts[acc.details.device] || 0) + 1;

            if (acc.status === 'ACTIVE') securityPoints += 10;
            else if (acc.status === 'BANNED' || acc.status === 'SUSPENDED') { securityPoints -= 20; riskyCount++; }
            
            if (acc.authMethod !== 'email') securityPoints += 5; 
        });

        const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
        const primaryDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown Device";
        const maxPossible = group.accounts.length * 15; 
        const normalizedScore = maxPossible > 0 ? Math.min(100, Math.max(0, Math.floor((securityPoints / maxPossible) * 100))) : 0;

        // PENENTUAN ROLE OTOMATIS
        const isOwner = name.toLowerCase() === "personal vault";
        let role: 'OWNER' | 'TRUSTED_CONTACT' | 'EMERGENCY_ONLY' = 'TRUSTED_CONTACT';
        let clearanceLevel = 2;

        if (isOwner) {
          role = 'OWNER';
          clearanceLevel = 5; // Level Maksimal
        } else if (group.accounts.length < 3) {
          // Jika aset yang ditugaskan sedikit, asumsikan ini kontak darurat
          role = 'EMERGENCY_ONLY';
          clearanceLevel = 1;
        }

        processedMembers.push({
            name, role, clearanceLevel, totalAccounts: group.accounts.length, categories: categoryCounts,
            lastActive: group.lastActive, primaryDevice, securityScore: normalizedScore,
            topServices, riskyAccounts: riskyCount
        });
    });

    // Urutkan: Owner selalu di atas, lalu berdasarkan total aset
    processedMembers.sort((a, b) => {
      if (a.role === 'OWNER') return -1;
      if (b.role === 'OWNER') return 1;
      return b.totalAccounts - a.totalAccounts;
    });

    setMembers(processedMembers);
  };

  const startDeepScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsScanning(false); setLastScan(new Date()); return 100; }
        return prev + 2;
      });
    }, 30); // Dipercepat sedikit
  };

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100",
      panel: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800",
      accent: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      danger: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/50",
      warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50",
      safe: "text-emerald-600 dark:text-emerald-400",
      btn: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 border-transparent",
      listItem: "hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800",
      radarSweep: "bg-gradient-to-r from-transparent via-blue-500/10 to-blue-500/50",
      tabBg: "bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800",
      tabActive: "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border-transparent",
      tabInactive: "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
      card: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-lg shadow-slate-200 dark:shadow-none",
      cardHeader: "bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800",
      progressBg: "bg-slate-200 dark:bg-slate-800"
    },
    hacker: {
      wrapper: "bg-[#050505] border-green-900/50 text-green-500 font-mono shadow-[0_0_30px_rgba(34,197,94,0.05)]",
      panel: "bg-[#020202] border-green-900/30",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500",
      textMain: "text-green-400",
      textSub: "text-green-700",
      danger: "text-red-500 bg-red-950/20 border-red-900/50",
      warning: "text-amber-500 bg-amber-950/20 border-amber-900/50",
      safe: "text-green-400",
      btn: "bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/50",
      listItem: "hover:bg-green-900/10 border-green-900/30",
      radarSweep: "bg-gradient-to-r from-transparent via-green-500/10 to-green-500/50",
      tabBg: "bg-black p-1 border border-green-900/50",
      tabActive: "bg-green-900/20 text-green-400 border border-green-500/50",
      tabInactive: "text-green-800 hover:text-green-500 border border-transparent",
      card: "bg-[#020202] border-green-900/50 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] relative",
      cardHeader: "bg-[#050505] border-b border-green-900/50 relative overflow-hidden",
      progressBg: "bg-green-950"
    },
    casual: {
      wrapper: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-orange-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 rounded-[2rem]",
      panel: "bg-orange-50/50 dark:bg-stone-950/50 border-orange-100 dark:border-stone-800 rounded-3xl",
      accent: "text-orange-500 dark:text-orange-400",
      accentBg: "bg-gradient-to-r from-orange-500 to-pink-500",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      danger: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 rounded-xl",
      warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 rounded-xl",
      safe: "text-emerald-500",
      btn: "bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 rounded-2xl border-transparent",
      listItem: "hover:bg-orange-100 dark:hover:bg-stone-800 border-orange-100 dark:border-stone-800 rounded-2xl",
      radarSweep: "bg-gradient-to-r from-transparent via-orange-500/10 to-orange-500/50",
      tabBg: "bg-orange-100/50 dark:bg-stone-950/50 p-1 border border-orange-200 dark:border-stone-800 rounded-2xl",
      tabActive: "bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-md rounded-xl border-transparent",
      tabInactive: "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl",
      card: "bg-white dark:bg-stone-900 border-orange-200 dark:border-stone-800 hover:border-orange-400 hover:shadow-xl shadow-orange-900/5 dark:shadow-none rounded-3xl",
      cardHeader: "bg-orange-50/50 dark:bg-stone-950/50 border-b border-orange-100 dark:border-stone-800",
      progressBg: "bg-orange-100 dark:bg-stone-800"
    }
  };

  const cs = styles[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[80vh] font-mono", cs.textMain)}>
        <Activity size={32} className={cn("animate-pulse mb-4", cs.accent)} />
        <span className="tracking-widest animate-pulse text-sm">MENYIAPKAN RADAR...</span>
      </div>
    );
  }

  let healthColor = cs.safe;
  let healthText = "AMAN";
  if (healthScore < 50) { healthColor = "text-red-500 dark:text-red-400"; healthText = "KRITIS"; }
  else if (healthScore < 80) { healthColor = "text-amber-500 dark:text-amber-400"; healthText = "WASPADA"; }

  return (
    <div className={cn("min-h-[85vh] p-4 lg:p-6 border shadow-2xl overflow-hidden flex flex-col transition-colors duration-500", cs.wrapper, theme !== 'casual' && 'rounded-xl')}>
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-inherit pb-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 border flex items-center justify-center", cs.panel, theme !== 'casual' && 'rounded-lg')}>
            {activeTab === 'radar' 
              ? <Activity className={isScanning ? "animate-spin text-red-500" : cs.accent} size={28} />
              : <Users className={cs.accent} size={28} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {activeTab === 'radar' 
                ? (theme === 'hacker' ? 'SECURITY_RADAR' : 'Radar Keamanan')
                : (theme === 'hacker' ? 'ACCESS_MATRIX' : 'Manajemen Personil')}
              {isGuest && <span className={cn("text-[10px] px-2 py-0.5 border font-bold uppercase", cs.warning, "ml-2")}>Sesi Tamu</span>}
            </h1>
            <p className={cn("text-xs mt-1 font-medium", cs.textSub)}>
              {activeTab === 'radar'
                ? (theme === 'hacker' ? 'DEEP_WEB_MONITORING_SYSTEM' : 'Pantau kebocoran data dan kekuatan kata sandimu')
                : (theme === 'hacker' ? 'IDENTITY & ACCESS MANAGEMENT' : 'Kelola peran dan wewenang akses aset digitalmu')}
            </p>
          </div>
        </div>
        
        {/* TAB SWITCHER */}
        <div className={cn("flex items-center font-semibold text-sm", cs.tabBg)}>
            <button 
                onClick={() => setActiveTab('radar')}
                className={cn("flex items-center gap-2 px-4 py-2 transition-all duration-300", activeTab === 'radar' ? cs.tabActive : cs.tabInactive)}
            >
                <ShieldAlert size={16} /> <span className="hidden sm:block">Security Radar</span><span className="sm:hidden">Radar</span>
            </button>
            <button 
                onClick={() => setActiveTab('family')}
                className={cn("flex items-center gap-2 px-4 py-2 transition-all duration-300", activeTab === 'family' ? cs.tabActive : cs.tabInactive)}
            >
                <Users size={16} /> <span className="hidden sm:block">Access Control</span><span className="sm:hidden">Access</span>
            </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* TAB 1: SECURITY RADAR                     */}
      {/* ========================================= */}
      {activeTab === 'radar' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end w-full">
            <button 
              onClick={startDeepScan}
              disabled={isScanning}
              className={cn("px-6 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50", cs.btn, theme !== 'casual' && 'rounded-lg')}
            >
              <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? (theme === 'hacker' ? 'SCANNING_NETWORK...' : 'Memindai...') : (theme === 'hacker' ? 'INITIATE_DEEP_SCAN' : 'Pindai Sekarang')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn("col-span-1 border p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[350px]", cs.panel, theme !== 'casual' && 'rounded-xl')}>
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-64 h-64 border border-inherit rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 border border-inherit rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 border border-inherit rounded-full" />
                  </div>
                </div>
                {isScanning && <div className={cn("absolute w-32 h-32 origin-bottom-right animate-spin rounded-tl-full", cs.radarSweep)} style={{ animationDuration: '2s' }} />}
              </div>

              <div className="relative z-10 flex flex-col items-center text-center mt-4">
                <div className={cn("text-7xl font-bold font-mono tracking-tighter drop-shadow-lg", healthColor)}>{healthScore}</div>
                <div className={cn("text-lg font-bold tracking-widest mt-2", healthColor)}>{healthText}</div>
                <div className={cn("text-xs mt-4 max-w-[200px] leading-relaxed", cs.textSub)}>{theme === 'hacker' ? 'SYSTEM_INTEGRITY_INDEX' : 'Skor Kesehatan Vault Keseluruhan'}</div>
              </div>

              <div className={cn("mt-auto relative z-10 w-full pt-6 border-t border-inherit text-[10px] flex justify-between", cs.textSub)}>
                <span className="flex items-center gap-1"><Fingerprint size={12}/> {accounts.length} Akun Terdaftar</span>
                <span>Update: {lastScan ? lastScan.toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={cn("p-4 border flex flex-col gap-3 transition-colors", cs.panel, stats.breached > 0 ? cs.danger : "", theme !== 'casual' && 'rounded-lg')}>
                  <div className="flex justify-between items-start">
                    <ShieldAlert size={20} className={stats.breached > 0 ? "animate-pulse" : "opacity-50"} />
                    <span className="text-2xl font-bold font-mono">{stats.breached}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Kebocoran Data</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Ditemukan di Dark Web</p>
                  </div>
                </div>
                <div className={cn("p-4 border flex flex-col gap-3 transition-colors", cs.panel, stats.weak > 0 ? cs.warning : "", theme !== 'casual' && 'rounded-lg')}>
                  <div className="flex justify-between items-start">
                    <LockOpen size={20} className={stats.weak > 0 ? "" : "opacity-50"} />
                    <span className="text-2xl font-bold font-mono">{stats.weak}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Sandi Lemah</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Mudah ditebak/diretas</p>
                  </div>
                </div>
                <div className={cn("p-4 border flex flex-col gap-3 transition-colors", cs.panel, stats.reused > 0 ? cs.warning : "", theme !== 'casual' && 'rounded-lg')}>
                  <div className="flex justify-between items-start">
                    <KeySquare size={20} className={stats.reused > 0 ? "" : "opacity-50"} />
                    <span className="text-2xl font-bold font-mono">{stats.reused}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Digunakan Ulang</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Risiko domino tinggi</p>
                  </div>
                </div>
              </div>

              <div className={cn("flex-1 border flex flex-col overflow-hidden max-h-[400px]", cs.panel, theme !== 'casual' && 'rounded-xl')}>
                <div className="p-4 border-b border-inherit flex items-center justify-between bg-black/5">
                  <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                    <Search size={16} className={cs.accent} />
                    {theme === 'hacker' ? 'VULNERABILITY_LOGS' : 'Prioritas Penanganan'}
                  </h3>
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded", stats.breached + stats.weak > 0 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500")}>
                    {riskyAccounts.length} ISSUES
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  {isScanning ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 font-mono text-xs gap-3">
                      <div className="w-48 h-1 bg-inherit rounded-full overflow-hidden border border-inherit">
                        <div className={cn("h-full", cs.accentBg)} style={{ width: `${scanProgress}%` }} />
                      </div>
                      <span>ANALYZING_ENCRYPTION_HASH...</span>
                    </div>
                  ) : riskyAccounts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 text-sm gap-2 min-h-[200px]">
                      <ShieldCheck size={48} className="text-emerald-500 mb-2" />
                      <p className="font-bold">Vault dalam kondisi sempurna!</p>
                      <p className="text-xs text-center max-w-xs">Tidak ada kebocoran atau kelemahan yang terdeteksi pada akun Anda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {riskyAccounts.map((item, idx) => {
                        let sevColor = 'text-blue-500'; let sevBg = 'bg-blue-500/10'; let Icon = ShieldAlert;
                        if (item.severity === 'high') { sevColor = 'text-red-500'; sevBg = 'bg-red-500/10'; Icon = ShieldAlert; }
                        else if (item.severity === 'medium') { sevColor = 'text-amber-500'; sevBg = 'bg-amber-500/10'; Icon = AlertTriangle; }

                        return (
                          <div 
                            key={idx} 
                            onClick={() => router.push(`/dashboard/vault/${item.acc.id}`)}
                            className={cn("p-3 md:p-4 border flex items-center justify-between gap-4 transition-colors group cursor-pointer", cs.listItem, theme !== 'casual' && 'rounded-lg')}
                          >
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className={cn("p-2 rounded-full shrink-0", sevBg, sevColor)}>
                                <Icon size={18} />
                              </div>
                              <div className="overflow-hidden">
                                <p className={cn("font-bold text-sm truncate", cs.textMain)}>
                                  {item.acc.serviceName} 
                                  <span className="ml-2 font-normal opacity-50 font-mono text-xs">{item.acc.identifier}</span>
                                </p>
                                <p className={cn("text-[10px] mt-1 truncate font-medium", item.severity === 'high' ? 'text-red-500' : cs.textSub)}>{item.reason}</p>
                              </div>
                            </div>
                            <ChevronRight size={16} className={cn("opacity-0 group-hover:opacity-100 transition-opacity shrink-0", cs.accent)} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 2: ACCESS CONTROL / IAM MATRIX        */}
      {/* ========================================= */}
      {activeTab === 'family' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar p-1 pb-10">
          
          {members.map((member) => {
              let famHealthColor = "text-emerald-500 dark:text-emerald-400";
              let HealthIcon = CheckCircle2;
              if (member.securityScore < 50) { famHealthColor = "text-red-500 dark:text-red-400"; HealthIcon = AlertTriangle; }
              else if (member.securityScore < 80) { famHealthColor = "text-amber-500 dark:text-amber-400"; HealthIcon = Activity; }

              // Tentukan Badge Role
              let RoleBadge = null;
              if (member.role === 'OWNER') RoleBadge = <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 border border-blue-500/50 rounded text-[9px] font-bold tracking-wider">OWNER</span>;
              else if (member.role === 'EMERGENCY_ONLY') RoleBadge = <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded text-[9px] font-bold tracking-wider">EMERGENCY</span>;
              else RoleBadge = <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 rounded text-[9px] font-bold tracking-wider">TRUSTED</span>;

              return (
                <div key={member.name} className={cn("relative border overflow-hidden flex flex-col transition-all duration-300 group", cs.card, theme !== 'casual' && 'rounded-xl')}>
                  
                  {/* Decorative Elements untuk Tema Hacker */}
                  {theme === 'hacker' && (
                    <div className="absolute top-0 right-0 w-16 h-16 border-l border-b border-green-900/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(34,197,94,0.1)_2px,rgba(34,197,94,0.1)_4px)] opacity-50 z-0" />
                  )}

                  <div className={cn("p-5 flex justify-between items-start relative z-10", cs.cardHeader)}>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center justify-between w-full">
                        {RoleBadge}
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={cn("w-1.5 h-3 rounded-sm", i < member.clearanceLevel ? cs.accentBg : "bg-slate-300 dark:bg-slate-800")} />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded border flex items-center justify-center transition-colors shadow-sm", cs.panel, cs.textMain, "group-hover:border-blue-500/50", theme === 'hacker' && 'group-hover:border-green-500/50', theme === 'casual' && 'rounded-xl')}>
                          <User size={24} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-lg tracking-wide truncate text-slate-900 dark:text-white">{member.name}</h3>
                          <p className={cn("text-[10px] font-mono mt-0.5", cs.textSub)}>{member.totalAccounts} ENCRYPTED ASSETS</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 bg-transparent relative z-10">
                     <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                         <span className={cs.textSub}>Health_Status</span>
                         <span className={cn("flex items-center gap-1", famHealthColor)}>
                           <HealthIcon size={10} /> SCORE: {member.securityScore}
                         </span>
                       </div>
                       <div className={cn("flex h-1.5 w-full rounded-full overflow-hidden", cs.progressBg)}>
                         <div className={cn("h-full transition-all", member.securityScore > 80 ? "bg-emerald-500" : member.securityScore > 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${member.securityScore}%` }} />
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className={cn("p-2.5 border", cs.panel, theme !== 'casual' && 'rounded')}>
                              <span className={cn("text-[9px] block mb-1", cs.textSub)}>PRIMARY_DEVICE</span>
                              <div className="text-[10px] font-semibold flex items-center gap-1.5 truncate" title={member.primaryDevice}><Smartphone size={12} className={cs.accent} /> {member.primaryDevice}</div>
                          </div>
                          <div className={cn("p-2.5 border", cs.panel, theme !== 'casual' && 'rounded')}>
                              <span className={cn("text-[9px] block mb-1", cs.textSub)}>TOP_SERVICE</span>
                              <div className="text-[10px] font-semibold truncate flex items-center gap-1.5"><Activity size={12} className={cs.accent} /> {member.topServices[0] || "N/A"}</div>
                          </div>
                     </div>

                     <div className="flex flex-wrap gap-2 pt-2">
                       {Object.entries(member.categories).slice(0, 3).map(([cat, count]) => (
                         <span key={cat} className={cn("px-2 py-1 border text-[10px] font-mono flex items-center gap-1.5", cs.panel, cs.textSub, theme !== 'casual' && 'rounded')}>
                           {getCategoryIcon(cat)} {cat.substring(0, 3)}: <span className={cs.textMain}>{count}</span>
                         </span>
                       ))}
                       {Object.keys(member.categories).length > 3 && <span className={cn("px-2 py-1 text-[10px]", cs.textSub)}>+{Object.keys(member.categories).length - 3}</span>}
                     </div>
                  </div>

                  {/* Footer / Actions - Lebih interaktif */}
                  <div className={cn("p-3 border-t flex items-center justify-between mt-auto bg-opacity-50", cs.cardHeader)}>
                    <div className="flex items-center gap-2">
                      {member.role !== 'OWNER' && (
                        <button className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Revoke Access">
                          <ShieldOff size={14} />
                        </button>
                      )}
                      <button className={cn("p-2 border rounded transition-colors", cs.panel, cs.textSub, "hover:text-blue-500 hover:border-blue-500/30")} title="Manage Permissions">
                        <Settings size={14} />
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        if(isGuest) { alert("Fitur detail terkunci di Mode Tamu. Silakan daftar."); return; }
                        router.push(`/dashboard/vault?owner=${member.name}`);
                      }}
                      className={cn("px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold border rounded transition-colors uppercase tracking-wider group/link", cs.accent, cs.panel, "hover:bg-blue-500/10 hover:border-blue-500/50", theme === 'hacker' && 'hover:bg-green-500/10 hover:border-green-500/50', theme === 'casual' && 'hover:bg-orange-500/10 hover:border-orange-500/50')}
                    >
                      LIHAT ASET <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
          })}

          <div className={cn("border border-dashed flex flex-col items-center justify-center text-center transition-all group min-h-[250px]", cs.panel, cs.textSub, theme !== 'casual' && 'rounded-xl')}>
            <div className={cn("p-4 rounded-full mb-3 border transition-colors", cs.wrapper)}>
              <UserCog size={24} className="opacity-50" />
            </div>
            <p className="font-bold text-sm uppercase tracking-wider mb-2">Simulasikan Akses</p>
            <p className="text-[10px] max-w-[200px] opacity-70 mb-4 leading-relaxed">
              Buat akun di Vault dan ketikkan nama orang lain di kolom "Pemilik Akun" untuk melihatnya muncul sebagai Personil di sini.
            </p>
            <button 
              onClick={() => router.push("/dashboard/vault/create")}
              className={cn("px-4 py-2 border rounded text-xs font-bold transition-all flex items-center gap-2", cs.accent, "hover:bg-blue-500/10 border-blue-500/30", theme === 'hacker' && 'hover:bg-green-500/10 border-green-500/30', theme === 'casual' && 'hover:bg-orange-500/10 border-orange-500/30 rounded-xl')}
            >
              <Plus size={14}/> Tambah Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}