"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { 
  Shield, 
  Wallet, 
  Activity, 
  Cpu, 
  HardDrive, 
  Terminal, 
  AlertTriangle,
  Clock,
  Zap,
  Network
} from "lucide-react";
import { Account } from "@/lib/types/schema";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import type { Theme } from "@/components/theme-provider";

export default function DashboardPage() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0,
    finance: 0, 
    gaming: 0,
    social: 0,
    alerts: 0, 
    linked: 0, 
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  const [cpuLoad, setCpuLoad] = useState(0);
  const [systemTime, setSystemTime] = useState(new Date());

  // 1. Data Listener (SMART LOGIC & SECURE)
  useEffect(() => {
    if (!user) return;

    // QUERY AMAN FIREBASE (Strict User Isolation)
    const q = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let newStats = { total: 0, finance: 0, gaming: 0, social: 0, alerts: 0, linked: 0 };
      const logs: any[] = [];

      let allAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      newStats.total = allAccounts.length;

      allAccounts.forEach((data) => {
        if (["FINANCE", "BANK", "ECOMMERCE", "WALLET"].includes(data.category)) newStats.finance++;
        if (["GAME", "GAMING", "ENTERTAINMENT"].includes(data.category)) newStats.gaming++;
        if (["SOCIAL", "COMMUNICATION"].includes(data.category)) newStats.social++;
        if (["BANNED", "SUSPENDED", "SOLD"].includes(data.status)) newStats.alerts++;

        const isLinked = data.linkedAccountId || (data.linkedEmail && data.authMethod && data.authMethod !== 'email');
        if (isLinked) newStats.linked++;

        const getLogDate = (val: any) => {
            if (!val) return new Date();
            if (val.seconds) return new Date(val.seconds * 1000);
            if (typeof val.toDate === 'function') return val.toDate();
            return new Date(val); 
        };

        logs.push({
            id: data.id,
            action: data.createdAt && data.lastUpdated && JSON.stringify(data.createdAt) === JSON.stringify(data.lastUpdated) ? "NEW_ENTRY" : "UPDATE_DATA",
            target: data.serviceName || "UNKNOWN_NODE",
            timestamp: getLogDate(data.lastUpdated),
            status: "SUCCESS"
        });
      });

      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setStats(newStats);
      setRecentLogs(logs.slice(0, 5)); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. System Simulation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemTime(new Date());
      setCpuLoad(Math.floor(Math.random() * (45 - 20) + 20)); 
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "font-sans text-slate-900 dark:text-slate-100",
      panel: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      accent: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600 dark:bg-blue-500",
      graphBar: "bg-blue-100 dark:bg-blue-900/30 border-blue-500",
      logItem: "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200"
    },
    hacker: {
      wrapper: "font-mono text-green-500",
      panel: "bg-[#050505] border border-green-900/50 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.05)]",
      textMain: "text-green-400",
      textSub: "text-green-700",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500",
      graphBar: "bg-cyan-900/20 border-cyan-500",
      logItem: "bg-[#020202] border border-green-900/40 hover:border-green-500/50"
    },
    casual: {
      wrapper: "font-sans text-stone-800 dark:text-stone-100",
      panel: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-orange-200 dark:border-stone-800 rounded-[2rem] shadow-xl shadow-orange-900/5",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      accent: "text-orange-500 dark:text-orange-400",
      accentBg: "bg-orange-500",
      graphBar: "bg-orange-100 dark:bg-orange-900/20 border-orange-400",
      logItem: "bg-orange-50/50 dark:bg-stone-950/50 border border-orange-100 dark:border-stone-800 hover:border-orange-300"
    }
  };

  const cs = styles[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[80vh]", cs.wrapper)}>
        <div className="flex items-center gap-2 animate-pulse">
            <Terminal size={24} className={cs.accent} />
            <span>Memuat Data Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-[85vh] space-y-6 animate-in fade-in duration-700", cs.wrapper)}>
      
      {/* HEADER: COMMAND CENTER / OVERVIEW */}
      <div className={cn("p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden", cs.panel)}>
        {theme === 'hacker' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-20 animate-pulse" />
        )}

        <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                <Activity className={cs.accent} />
                {theme === 'hacker' ? 'MISSION_CONTROL' : 'Ringkasan Dashboard'}
            </h1>
            <p className={cn("text-xs mt-1 uppercase tracking-widest", cs.textSub)}>
                {theme === 'hacker' ? 'System Status:' : 'Status Sistem:'} <span className="text-emerald-500 font-bold">OPERATIONAL</span> 
                {isGuest ? ' // ANONYMOUS_SESSION' : ` // User: ${user?.email?.split('@')[0] || 'Unknown'}`}
            </p>
        </div>

        <div className="flex gap-6 text-xs">
            <div className="space-y-1">
                <div className={cn("flex items-center gap-2", cs.textSub)}>
                    <Clock size={14} /> {theme === 'hacker' ? 'SYS_TIME' : 'Waktu'}
                </div>
                <div className={cn("font-bold px-2 py-1 rounded border", cs.textMain, theme === 'hacker' ? 'bg-black border-green-900/50' : 'bg-slate-50 dark:bg-slate-950 border-inherit')}>
                    {systemTime.toLocaleTimeString()}
                </div>
            </div>
            <div className="space-y-1">
                <div className={cn("flex items-center gap-2", cs.textSub)}>
                    <Cpu size={14} /> CPU_LOAD
                </div>
                <div className={cn("w-24 h-6 rounded border relative overflow-hidden", theme === 'hacker' ? 'bg-black border-green-900/50' : 'bg-slate-50 dark:bg-slate-950 border-inherit')}>
                    <div 
                        className={cn("h-full border-r-2 transition-all duration-500", cs.accentBg, "opacity-20")} 
                        style={{ width: `${cpuLoad}%` }}
                    />
                    <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-bold", cs.accent)}>
                        {cpuLoad}%
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: STATS WIDGETS */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={theme === 'hacker' ? 'TOTAL_NODES' : 'Total Akun'} value={stats.total} icon={<Shield size={20} />} theme={theme} intent="primary" />
            <StatCard label={theme === 'hacker' ? 'NETWORK_DENSITY' : 'Terkoneksi'} value={stats.linked} subValue={`${Math.round((stats.linked / (stats.total || 1)) * 100)}% Linked`} icon={<Network size={20} />} theme={theme} intent="info" />
            <StatCard label={theme === 'hacker' ? 'ECONOMY_SECTOR' : 'Keuangan'} value={stats.finance} icon={<Wallet size={20} />} theme={theme} intent="success" />
            <StatCard label={theme === 'hacker' ? 'THREAT_LEVEL' : 'Peringatan'} value={stats.alerts} subValue={stats.alerts > 0 ? "WARNING" : "SECURE"} icon={<AlertTriangle size={20} />} theme={theme} intent={stats.alerts > 0 ? "danger" : "default"} />

            {/* BIG CHART AREA */}
            <div className={cn("sm:col-span-2 lg:col-span-3 p-6 relative min-h-[250px] flex flex-col", cs.panel)}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={cn("text-sm font-bold flex items-center gap-2", cs.textSub)}>
                        <Zap size={16} className="text-amber-500" />
                        {theme === 'hacker' ? 'ACTIVITY_FREQUENCY' : 'Frekuensi Aktivitas'}
                    </h3>
                    <div className="flex gap-2 items-center">
                        <span className={cn("w-2 h-2 rounded-full animate-ping", cs.accentBg)} />
                        <span className={cn("text-[10px] font-bold", cs.accent)}>LIVE_FEED</span>
                    </div>
                </div>
                <div className="flex-1 flex items-end justify-between gap-1 px-2 pb-2 opacity-80">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className={cn("w-full border-t transition-all duration-1000 ease-in-out", cs.graphBar)} style={{ height: `${Math.max(10, Math.random() * 100)}%`, opacity: Math.random() * 0.5 + 0.3 }} />
                    ))}
                </div>
            </div>

            {/* STORAGE WIDGET */}
            <div className={cn("sm:col-span-2 lg:col-span-1 p-6 flex flex-col gap-4", cs.panel)}>
                <h3 className={cn("text-sm font-bold flex items-center gap-2", cs.textSub)}>
                    <HardDrive size={16} />
                    {theme === 'hacker' ? 'STORAGE_DRIVE' : 'Kapasitas Vault'}
                </h3>
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="space-y-1">
                        <div className={cn("flex justify-between text-[10px]", cs.textSub)}>
                            <span>{theme === 'hacker' ? 'MAIN_VAULT' : 'Utama'}</span>
                            <span>45%</span>
                        </div>
                        <div className={cn("h-2 w-full rounded-full overflow-hidden border", theme === 'hacker' ? 'bg-black border-green-900' : 'bg-slate-100 dark:bg-slate-800 border-transparent')}>
                            <div className={cn("h-full w-[45%]", cs.accentBg)} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className={cn("flex justify-between text-[10px]", cs.textSub)}>
                            <span>{theme === 'hacker' ? 'BACKUP_SECTOR' : 'Cadangan'}</span>
                            <span>12%</span>
                        </div>
                        <div className={cn("h-2 w-full rounded-full overflow-hidden border", theme === 'hacker' ? 'bg-black border-green-900' : 'bg-slate-100 dark:bg-slate-800 border-transparent')}>
                            <div className="h-full bg-purple-500 w-[12%]" />
                        </div>
                    </div>
                    <div className={cn("p-3 rounded-xl border text-center mt-2", theme === 'hacker' ? 'bg-black border-green-900/50' : 'bg-slate-50 dark:bg-slate-950 border-inherit')}>
                        <span className={cn("text-2xl font-bold", cs.textMain)}>15.0</span>
                        <span className={cn("text-[10px] ml-1", cs.textSub)}>GB FREE</span>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: SYSTEM LOGS */}
        <div className={cn("lg:col-span-1 p-4 flex flex-col", cs.panel)}>
            <h3 className={cn("text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-wider border-b pb-2", cs.textSub, theme === 'hacker' ? 'border-green-900/50' : 'border-slate-100 dark:border-slate-800')}>
                <Terminal size={16} />
                {theme === 'hacker' ? 'System_Logs' : 'Aktivitas'}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[400px] lg:max-h-none text-xs font-mono">
                {recentLogs.length === 0 ? (
                    <div className={cn("italic text-center py-4", cs.textSub)}>NO_RECENT_ACTIVITY</div>
                ) : (
                    recentLogs.map((log, idx) => (
                        <div key={idx} className={cn("p-3 rounded-xl transition-colors group", cs.logItem)}>
                            <div className={cn("flex justify-between text-[10px] mb-1", cs.textSub)}>
                                <span>{log.timestamp.toLocaleTimeString()}</span>
                                <span className={log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}>[{log.status}]</span>
                            </div>
                            <div className={cn("font-bold truncate flex items-center gap-2", cs.accent)}>
                                <span className="opacity-50">{'>'}</span> 
                                {log.action}
                            </div>
                            <div className={cn("truncate mt-0.5 group-hover:opacity-100 transition-opacity opacity-70", cs.textMain)}>
                                TARGET: {log.target}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, theme, intent }: { label: string, value: number, subValue?: string, icon: React.ReactNode, theme: Theme, intent: 'primary' | 'info' | 'success' | 'danger' | 'default' }) {
    const getColors = () => {
        if (theme === 'hacker') {
            if (intent === 'danger') return { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/50' };
            return { text: 'text-green-400', bg: 'bg-green-400', border: 'border-green-900/50' };
        }
        if (theme === 'casual') {
            if (intent === 'primary') return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', border: 'border-orange-200 dark:border-stone-800' };
            if (intent === 'info') return { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500', border: 'border-orange-200 dark:border-stone-800' };
            if (intent === 'success') return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', border: 'border-orange-200 dark:border-stone-800' };
            if (intent === 'danger') return { text: 'text-rose-600 dark:text-rose-500', bg: 'bg-rose-500', border: 'border-rose-300 dark:border-rose-900/50' };
            return { text: 'text-stone-500', bg: 'bg-stone-500', border: 'border-orange-200 dark:border-stone-800' };
        }
        if (intent === 'primary') return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-600', border: 'border-slate-200 dark:border-slate-800' };
        if (intent === 'info') return { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-600', border: 'border-slate-200 dark:border-slate-800' };
        if (intent === 'success') return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', border: 'border-slate-200 dark:border-slate-800' };
        if (intent === 'danger') return { text: 'text-red-600 dark:text-red-500', bg: 'bg-red-500', border: 'border-red-200 dark:border-red-900/50' };
        return { text: 'text-slate-500', bg: 'bg-slate-500', border: 'border-slate-200 dark:border-slate-800' };
    };

    const colors = getColors();
    const panelClass = theme === 'hacker' ? "bg-[#050505] rounded-sm shadow-[0_0_10px_rgba(34,197,94,0.05)] hover:bg-black" : theme === 'casual' ? "bg-white/80 dark:bg-stone-900/80 rounded-[2rem] shadow-md hover:bg-orange-50 dark:hover:bg-stone-950 backdrop-blur-xl" : "bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-950";

    return (
        <div className={cn("p-5 border relative overflow-hidden group transition-colors", panelClass, colors.border)}>
            <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300", colors.text)}>
                {icon}
            </div>
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">{label}</h3>
            <div className={cn("text-3xl font-bold font-mono relative z-10", colors.text, intent === 'danger' && theme === 'hacker' ? 'animate-pulse' : '')}>{value}</div>
            {subValue && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold relative z-10">STATUS: {subValue}</div>}
            <div className={cn("absolute bottom-0 left-0 w-8 h-1 opacity-50", colors.bg)} />
        </div>
    );
}