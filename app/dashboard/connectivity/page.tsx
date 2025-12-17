"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { useRouter } from "next/navigation"; 
import { 
  Network, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  Lock,
  Globe,
  Smartphone,
  Cpu,
  Terminal,
  Activity,
  Shield,
  Wifi,
  Search,
  ExternalLink,
  GraduationCap
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

// --- THEME CONFIG ---
const THEME = {
  bg: "bg-slate-950",
  panel: "bg-slate-900/50",
  border: "border-slate-800",
  accent: "text-cyan-400",
  accentBorder: "border-cyan-500/30",
  textMain: "text-slate-200",
  textDim: "text-slate-500",
  success: "text-emerald-400",
};

// Helper Icon Kategori
const getCategoryIcon = (category: AccountCategory, size = 16) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={size} className="text-purple-400" />;
    case "FINANCE": return <Wallet size={size} className="text-emerald-400" />;
    case "SOCIAL": return <Share2 size={size} className="text-blue-400" />;
    case "WORK": return <Briefcase size={size} className="text-amber-400" />;
    case "UTILITY": return <Mail size={size} className="text-orange-400" />;
    case "ENTERTAINMENT": return <Music size={size} className="text-pink-400" />;
    case "EDUCATION": return <GraduationCap size={size} className="text-yellow-400" />;
    default: return <Lock size={size} className="text-slate-400" />;
  }
};

interface EmailGroup {
  email: string;
  apps: Account[];
}

export default function ConnectivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  
  // State untuk animasi scanning
  const [scanProgress, setScanProgress] = useState(0);

  // Fetch Data
  useEffect(() => {
    // Simulasi scanning effect
    const scanInterval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(collection(db, "accounts"), orderBy("serviceName", "asc"));
      
      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const allAccounts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Account[];

        const linkedEmails = new Set<string>();
        allAccounts.forEach(acc => {
          if (acc.linkedEmail) linkedEmails.add(acc.linkedEmail.toLowerCase().trim());
        });

        const groupedData: EmailGroup[] = [];
        linkedEmails.forEach(email => {
          const connectedApps = allAccounts.filter(
            acc => acc.linkedEmail?.toLowerCase().trim() === email
          );
          if (connectedApps.length > 0) {
            groupedData.push({ email, apps: connectedApps });
          }
        });

        groupedData.sort((a, b) => b.apps.length - a.apps.length);
        setGroups(groupedData);
        if (!selectedEmail && groupedData.length > 0) {
          setSelectedEmail(groupedData[0].email);
        }
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => {
        unsubscribeAuth();
        clearInterval(scanInterval);
    };
  }, [selectedEmail]);

  const activeGroup = groups.find(g => g.email === selectedEmail);

  // Fungsi navigasi ke detail
  const handleNodeClick = (accountId: string) => {
    router.push(`/dashboard/vault/${accountId}`);
  };

  // --- LOADING SCREEN (TERMINAL STYLE) ---
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-[80vh] ${THEME.bg} font-mono`}>
        <div className="w-96 space-y-4">
            <div className="flex justify-between text-xs text-cyan-500 mb-1">
                <span>SYSTEM_INIT</span>
                <span>{scanProgress}%</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-cyan-500 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                    style={{ width: `${scanProgress}%` }}
                />
            </div>
            <div className="text-xs text-slate-500 space-y-1">
                <p>{'>'} Detecting nodes...</p>
                <p>{'>'} Encrypting connection...</p>
                <p>{'>'} Fetching topology map...</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[85vh] ${THEME.bg} text-slate-200 p-6 rounded-xl border ${THEME.border} shadow-2xl font-mono overflow-hidden flex flex-col`}>
      
      {/* HEADER: STATUS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg animate-pulse">
                <Network className="text-cyan-400" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    NET_VISUALIZER <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-800">v2.0</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">SECURE CONNECTION ESTABLISHED</p>
            </div>
        </div>
        <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-400">ONLINE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
                <Wifi size={14} className="text-cyan-400" />
                <span className="text-slate-400">{groups.length} HUBS DETECTED</span>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* LEFT PANEL: NODE SELECTOR */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className={`p-4 rounded-lg border ${THEME.border} ${THEME.panel}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                    <Search size={14} />
                    Signal Sources
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {groups.length === 0 ? (
                        <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-slate-800 rounded">
                            NO_SIGNAL
                        </div>
                    ) : groups.map((group) => (
                        <button
                            key={group.email}
                            onClick={() => setSelectedEmail(group.email)}
                            className={`w-full text-left p-3 rounded border text-xs transition-all flex items-center justify-between group ${
                                selectedEmail === group.email
                                    ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                            }`}
                        >
                            <div className="truncate flex-1 mr-2">
                                <p className="font-bold truncate opacity-90">{group.email}</p>
                                <p className="text-[10px] opacity-60 mt-0.5">{group.apps.length} NODES LINKED</p>
                            </div>
                            {selectedEmail === group.email && (
                                <Activity size={14} className="text-cyan-400 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Panel Kecil */}
            {activeGroup && (
                <div className={`p-4 rounded-lg border ${THEME.border} ${THEME.panel} flex-1`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                        <Terminal size={14} />
                        Metadata
                    </div>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">TARGET</span>
                            <span className="text-cyan-300 truncate max-w-[150px]" title={activeGroup.email}>{activeGroup.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">TOTAL NODES</span>
                            <span className="text-white">{activeGroup.apps.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">SECURITY</span>
                            <span className="text-emerald-400">ENCRYPTED</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT PANEL: VISUALIZER */}
        <div className="flex-1 flex flex-col gap-6">
            
            {/* VISUALIZER CANVAS */}
            <div className={`rounded-xl border ${THEME.border} bg-slate-900/80 relative overflow-hidden flex items-center justify-center flex-1 min-h-[500px]`}>
                {/* Grid Background Effect */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ 
                        backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', 
                        backgroundSize: '40px 40px' 
                    }} 
                />
                
                {/* Radar Scan Effect */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/5 w-[800px] h-[800px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] pointer-events-none" />
                <div className="absolute inset-0 rounded-full border border-cyan-500/10 w-[500px] h-[500px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                {/* VISUALIZATION CONTENT */}
                {activeGroup ? (
                    <TopologyViewer group={activeGroup} onNodeClick={handleNodeClick} />
                ) : (
                    <div className="flex flex-col items-center text-slate-600 animate-pulse">
                        <Shield size={48} className="mb-4 opacity-20" />
                        <p className="text-xs tracking-widest">WAITING FOR TARGET SELECTION...</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: TOPOLOGY VIEWER (THE COOL PART) ---
function TopologyViewer({ group, onNodeClick }: { group: EmailGroup, onNodeClick: (id: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

    // Update dimensions on mount/resize
    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                w: containerRef.current.clientWidth,
                h: containerRef.current.clientHeight
            });
        }
    }, [containerRef.current]);

    // Calculate Positions
    const centerX = dimensions.w / 2;
    const centerY = dimensions.h / 2;
    const radius = Math.min(dimensions.w, dimensions.h) / 3; // Jarak node anak dari pusat

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                {group.apps.map((app, index) => {
                    const angle = (index * 2 * Math.PI) / group.apps.length; // Distribusi melingkar
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    
                    return (
                        <g key={`link-${app.id}`}>
                            {/* Connecting Line */}
                            <line 
                                x1={centerX} y1={centerY} 
                                x2={x} y2={y} 
                                stroke="url(#lineGradient)" 
                                strokeWidth="1"
                                className="opacity-50"
                            />
                            {/* Animated Packet */}
                            <circle r="2" fill="#22d3ee">
                                <animateMotion 
                                    dur={`${2 + Math.random() * 2}s`} 
                                    repeatCount="indefinite"
                                    path={`M${centerX},${centerY} L${x},${y}`}
                                />
                            </circle>
                        </g>
                    );
                })}
            </svg>

            {/* CENTER NODE (HUB) */}
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-default"
            >
                <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-cyan-500/20 animate-pulse" />
                    <Cpu size={32} className="text-cyan-400 relative z-10" />
                </div>
                <div className="mt-3 bg-slate-900/90 px-3 py-1 rounded text-[10px] text-cyan-300 border border-cyan-500/30 backdrop-blur-sm shadow-xl max-w-[200px] truncate text-center">
                    {group.email}
                </div>
            </div>

            {/* CHILD NODES (APPS) - CLICKABLE */}
            {group.apps.map((app, index) => {
                const angle = (index * 2 * Math.PI) / group.apps.length;
                // Posisi CSS (offset dari center)
                const top = 50 + 33 * Math.sin(angle); // 33% dari tinggi container (approx radius)
                const left = 50 + 33 * Math.cos(angle) * (dimensions.h / dimensions.w); // Adjust aspect ratio dikit

                return (
                    <div 
                        key={app.id}
                        onClick={() => onNodeClick(app.id)} // AKSI KLIK DI SINI
                        className="absolute z-10 flex flex-col items-center justify-center w-24 h-24 hover:z-30 transition-all duration-300 group/node cursor-pointer" // Tambahkan cursor-pointer
                        style={{ 
                            top: `calc(${50 + 35 * Math.sin(angle)}% - 3rem)`, 
                            left: `calc(${50 + 35 * Math.cos(angle)}% - 3rem)` 
                        }}
                    >
                        <div className={`w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg group-hover/node:border-cyan-400 group-hover/node:shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover/node:scale-110 transition-all relative
                            ${app.category === 'GAME' ? 'group-hover/node:border-purple-500' : ''}
                            ${app.category === 'FINANCE' ? 'group-hover/node:border-emerald-500' : ''}
                            ${app.category === 'EDUCATION' ? 'group-hover/node:border-yellow-500' : ''}
                        `}>
                            {getCategoryIcon(app.category, 18)}
                            
                            {/* Status Dot */}
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
                            
                            {/* External Link Icon on Hover */}
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-opacity">
                                <ExternalLink size={12} className="text-white" />
                            </div>
                        </div>
                        
                        {/* Tooltip Label */}
                        <div className="opacity-0 group-hover/node:opacity-100 absolute top-full mt-2 transition-opacity duration-200 pointer-events-none z-40">
                            <div className="bg-slate-900 px-3 py-2 rounded border border-slate-700 shadow-xl text-left min-w-[120px]">
                                <p className="text-xs font-bold text-white truncate">{app.serviceName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[100px]">{app.identifier}</p>
                                <p className="text-[9px] text-cyan-500 mt-1 uppercase tracking-wider">{app.category}</p>
                                <p className="text-[9px] text-emerald-400 mt-1 border-t border-slate-800 pt-1 flex items-center gap-1">
                                    {'>'} CLICK_TO_INSPECT
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}