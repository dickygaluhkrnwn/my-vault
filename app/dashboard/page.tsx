"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Wallet, 
  Gamepad2, 
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

// --- THEME CONFIG (Consistent with Connectivity Page) ---
const THEME = {
  bg: "bg-slate-950",
  panel: "bg-slate-900/50",
  border: "border-slate-800",
  accent: "text-cyan-400",
  accentBorder: "border-cyan-500/30",
  textMain: "text-slate-200",
  textDim: "text-slate-500",
  success: "text-emerald-400",
  danger: "text-red-400",
  warning: "text-amber-400",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Real Data State
  const [stats, setStats] = useState({
    total: 0,
    finance: 0, // Includes Ecommerce
    gaming: 0,
    social: 0,
    alerts: 0, // Banned/Suspended
    linked: 0, // New: Connected accounts
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  // Cosmetic State (Untuk efek visual "hidup")
  const [cpuLoad, setCpuLoad] = useState(0);
  const [systemTime, setSystemTime] = useState(new Date());

  // 1. Auth & Initial Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Data Listener (SMART LOGIC)
  useEffect(() => {
    if (!user) return;

    // Listen to 'accounts' collection
    const q = query(collection(db, "accounts"), orderBy("lastUpdated", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let newStats = { total: 0, finance: 0, gaming: 0, social: 0, alerts: 0, linked: 0 };
      const logs: any[] = [];

      newStats.total = snapshot.size;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Account;
        
        // Categorization Logic
        if (["FINANCE", "BANK", "ECOMMERCE", "WALLET"].includes(data.category)) newStats.finance++;
        if (["GAME", "GAMING", "ENTERTAINMENT"].includes(data.category)) newStats.gaming++;
        if (["SOCIAL", "COMMUNICATION"].includes(data.category)) newStats.social++;
        
        // Smart Alert: Count Banned, Suspended, or Sold as alerts
        if (["BANNED", "SUSPENDED", "SOLD"].includes(data.status)) newStats.alerts++;

        // Connectivity Logic: Hitung akun yang punya "Induk"
        // (Punya linkedAccountId ATAU punya linkedEmail tapi login bukan via email biasa)
        const isLinked = data.linkedAccountId || (data.linkedEmail && data.authMethod && data.authMethod !== 'email');
        if (isLinked) newStats.linked++;

        // Recent Logs (Top 5)
        if (logs.length < 5) {
            // Helper untuk konversi aman Timestamp/Date
            const getLogDate = (val: any) => {
                if (!val) return new Date();
                if (val.seconds) return new Date(val.seconds * 1000); // Handle Firestore Timestamp object directly
                if (typeof val.toDate === 'function') return val.toDate(); // Handle Firestore Timestamp class
                return new Date(val); // Handle standard Date or string
            };

            const logDate = getLogDate(data.lastUpdated);

            logs.push({
                id: doc.id,
                // Menggunakan string comparison sederhana untuk action type
                action: data.createdAt && data.lastUpdated && JSON.stringify(data.createdAt) === JSON.stringify(data.lastUpdated) ? "NEW_ENTRY" : "UPDATE_DATA",
                target: data.serviceName || "UNKNOWN_NODE",
                timestamp: logDate,
                status: "SUCCESS"
            });
        }
      });

      setStats(newStats);
      setRecentLogs(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. System Simulation Effect (Clock & Random Graphs)
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemTime(new Date());
      setCpuLoad(Math.floor(Math.random() * (45 - 20) + 20)); // Random 20-45%
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-[80vh] ${THEME.bg} font-mono`}>
        <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
            <Terminal size={24} />
            <span>ESTABLISHING_UPLINK...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[85vh] text-slate-200 font-mono space-y-6 animate-in fade-in duration-700`}>
      
      {/* HEADER: COMMAND CENTER */}
      <div className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg relative overflow-hidden`}>
        {/* Animated Background Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 animate-pulse" />

        <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <Activity className="text-cyan-400" />
                MISSION_CONTROL
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                System Status: <span className="text-emerald-400">OPERATIONAL</span> // User: {user?.email?.split('@')[0]}
            </p>
        </div>

        <div className="flex gap-6 text-xs">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={14} /> SYSTEM_TIME
                </div>
                <div className="text-cyan-300 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {systemTime.toLocaleTimeString()}
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                    <Cpu size={14} /> CPU_LOAD
                </div>
                <div className="w-24 h-6 bg-slate-900 rounded border border-slate-800 relative overflow-hidden">
                    <div 
                        className="h-full bg-cyan-500/20 border-r-2 border-cyan-500 transition-all duration-500" 
                        style={{ width: `${cpuLoad}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
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
            {/* Total Assets */}
            <StatCard 
                label="TOTAL_NODES" 
                value={stats.total} 
                icon={<Shield size={20} />} 
                color="text-cyan-400" 
                borderColor="border-cyan-500/30"
            />
            
            {/* Network Density (Smart Stat) */}
            <StatCard 
                label="NETWORK_DENSITY" 
                value={stats.linked} 
                subValue={`${Math.round((stats.linked / (stats.total || 1)) * 100)}% LINKED`}
                icon={<Network size={20} />} 
                color="text-purple-400" 
                borderColor="border-purple-500/30"
            />

            {/* Economy (Finance + Ecommerce) */}
            <StatCard 
                label="ECONOMY_SECTOR" 
                value={stats.finance} 
                icon={<Wallet size={20} />} 
                color="text-emerald-400" 
                borderColor="border-emerald-500/30"
            />

            {/* Security Alerts */}
            <StatCard 
                label="THREAT_LEVEL" 
                value={stats.alerts} 
                subValue={stats.alerts > 0 ? "WARNING" : "SECURE"}
                icon={<AlertTriangle size={20} />} 
                color={stats.alerts > 0 ? "text-red-500 animate-pulse" : "text-slate-400"} 
                borderColor={stats.alerts > 0 ? "border-red-500/50" : "border-slate-800"}
            />

            {/* BIG CHART AREA (Visual Only for now) */}
            <div className={`sm:col-span-2 lg:col-span-3 p-6 rounded-xl border ${THEME.border} ${THEME.panel} relative min-h-[250px] flex flex-col`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" />
                        ACTIVITY_FREQUENCY
                    </h3>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                        <span className="text-[10px] text-cyan-500">LIVE_FEED</span>
                    </div>
                </div>
                
                {/* Fake Graph Visualization */}
                <div className="flex-1 flex items-end justify-between gap-1 px-2 pb-2 opacity-80">
                    {[...Array(30)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-full bg-cyan-500/20 border-t border-cyan-400 transition-all duration-1000 ease-in-out"
                            style={{ 
                                height: `${Math.max(10, Math.random() * 100)}%`,
                                opacity: Math.random() * 0.5 + 0.3
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* STORAGE WIDGET */}
            <div className={`sm:col-span-2 lg:col-span-1 p-6 rounded-xl border ${THEME.border} ${THEME.panel} flex flex-col gap-4`}>
                <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <HardDrive size={16} className="text-slate-400" />
                    STORAGE_DRIVE
                </h3>
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>MAIN_VAULT</span>
                            <span>45%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-cyan-500 w-[45%]" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>BACKUP_SECTOR</span>
                            <span>12%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-purple-500 w-[12%]" />
                        </div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center">
                        <span className="text-2xl font-bold text-white">15.0</span>
                        <span className="text-[10px] text-slate-500 ml-1">GB FREE</span>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: SYSTEM LOGS */}
        <div className={`lg:col-span-1 p-4 rounded-xl border ${THEME.border} bg-slate-900/80 flex flex-col`}>
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-wider border-b border-slate-800 pb-2">
                <Terminal size={16} />
                System_Logs
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[400px] lg:max-h-none font-mono text-xs">
                {recentLogs.length === 0 ? (
                    <div className="text-slate-600 italic text-center py-4">NO_RECENT_ACTIVITY</div>
                ) : (
                    recentLogs.map((log, idx) => (
                        <div key={idx} className="p-3 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>{log.timestamp.toLocaleTimeString()}</span>
                                <span className="text-emerald-500">[{log.status}]</span>
                            </div>
                            <div className="text-cyan-300 font-bold truncate flex items-center gap-2">
                                <span className="text-slate-600">{'>'}</span> 
                                {log.action}
                            </div>
                            <div className="text-slate-400 truncate mt-0.5 group-hover:text-white transition-colors">
                                TARGET: {log.target}
                            </div>
                        </div>
                    ))
                )}
                
                {/* Fake filler logs to make it look busy */}
                <div className="p-2 rounded opacity-50">
                    <div className="text-[10px] text-slate-600 mb-1">{new Date().toLocaleTimeString()}</div>
                    <div className="text-slate-500">{'>'} SYS_CHECK_COMPLETE</div>
                </div>
                <div className="p-2 rounded opacity-30">
                    <div className="text-[10px] text-slate-600 mb-1">{new Date().toLocaleTimeString()}</div>
                    <div className="text-slate-500">{'>'} ENCRYPTION_ROTATION</div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ label, value, subValue, icon, color, borderColor }: any) {
    return (
        <div className={`p-5 rounded-xl border ${borderColor} ${THEME.panel} relative overflow-hidden group hover:bg-slate-800/50 transition-colors`}>
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                {icon}
            </div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                {label}
            </h3>
            <div className={`text-3xl font-bold ${color} font-mono`}>
                {value}
            </div>
            {subValue && (
                <div className="text-[10px] text-slate-400 mt-1 font-bold">
                    STATUS: {subValue}
                </div>
            )}
            
            {/* Corner Accent */}
            <div className={`absolute bottom-0 left-0 w-8 h-1 ${color.replace('text-', 'bg-')} opacity-50`} />
        </div>
    )
}