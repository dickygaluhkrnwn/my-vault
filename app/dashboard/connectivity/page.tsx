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
  Globe,
  ShoppingBag,
  MoreHorizontal,
  GitBranch,
  ArrowRightCircle,
  Activity,
  Search,
  Wifi,
  Terminal,
  Cpu,
  Shield,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon
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
    case "ECOMMERCE": return <ShoppingBag size={size} className="text-rose-400" />;
    default: return <MoreHorizontal size={size} className="text-slate-400" />;
  }
};

// Interface tambahan untuk node anak agar bisa menyimpan info jalur koneksi
interface ConnectedNode extends Account {
    connectionPath?: string; // Info: "Direct", "Via Steam", dll
    depth?: number;
}

interface ConnectionGroup {
  parentId: string; // Identifier of the root parent
  rootAccount?: Account; // Data akun root jika ada di DB
  children: ConnectedNode[];
}

export default function ConnectivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ConnectionGroup[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
  // State untuk animasi scanning
  const [scanProgress, setScanProgress] = useState(0);

  // --- LOGIC INTI: RECURSIVE IDENTITY TRACING ---
  // Fungsi ini mencari "Root Identifier" dari sebuah akun dengan menelusuri rantai parent
  const findRootNode = (
    currentAcc: Account, 
    allAccountsMap: Map<string, Account>, 
    visitedIds = new Set<string>()
  ): { rootIdentifier: string, path: string[], rootAccount?: Account } => {
    
    // Mencegah infinite loop (Circular dependency protection)
    if (visitedIds.has(currentAcc.id)) {
        return { rootIdentifier: currentAcc.identifier, path: [], rootAccount: currentAcc };
    }
    visitedIds.add(currentAcc.id);

    // Cek Relasi 1: Via Linked Account ID (Fitur Baru)
    if (currentAcc.linkedAccountId) {
        const parentAcc = allAccountsMap.get(currentAcc.linkedAccountId);
        if (parentAcc) {
            const parentResult = findRootNode(parentAcc, allAccountsMap, visitedIds);
            return {
                rootIdentifier: parentResult.rootIdentifier,
                path: [parentAcc.serviceName, ...parentResult.path],
                rootAccount: parentResult.rootAccount
            };
        }
    }

    // Cek Relasi 2: Via Linked Email (Legacy String Matching)
    // Jika authMethod bukan email (misal sso_steam) dan punya linkedEmail
    if (currentAcc.linkedEmail && currentAcc.authMethod !== 'email') {
        // Cari akun yang identifier-nya sama dengan linkedEmail ini
        // Note: Ini agak expensive operasinya kalau data ribuan, tapi ok untuk personal vault
        let parentAcc: Account | undefined;
        for (const acc of allAccountsMap.values()) {
            if (acc.identifier.toLowerCase() === currentAcc.linkedEmail.toLowerCase() && acc.id !== currentAcc.id) {
                parentAcc = acc;
                break;
            }
        }

        if (parentAcc) {
             const parentResult = findRootNode(parentAcc, allAccountsMap, visitedIds);
             return {
                rootIdentifier: parentResult.rootIdentifier,
                path: [parentAcc.serviceName, ...parentResult.path],
                rootAccount: parentResult.rootAccount
            };
        } else {
            // Parent tidak ada di DB, tapi linkedEmail adalah "Ujung" yang diketahui
            return { 
                rootIdentifier: currentAcc.linkedEmail.toLowerCase(), 
                path: ["External Email"],
                rootAccount: undefined 
            };
        }
    }

    // Jika tidak punya parent, berarti dia adalah ROOT
    return { rootIdentifier: currentAcc.identifier.toLowerCase(), path: [], rootAccount: currentAcc };
  };

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

        // Buat Map untuk lookup cepat O(1) berdasarkan ID
        const accountsMap = new Map<string, Account>();
        allAccounts.forEach(acc => accountsMap.set(acc.id, acc));

        // Grouping Process
        const tempGroups: Record<string, ConnectionGroup> = {};

        allAccounts.forEach(acc => {
            // Lakukan tracing untuk setiap akun
            const trace = findRootNode(acc, accountsMap, new Set());
            const rootId = trace.rootIdentifier;

            if (!tempGroups[rootId]) {
                tempGroups[rootId] = {
                    parentId: rootId,
                    rootAccount: trace.rootAccount,
                    children: []
                };
            }

            // Jika akun ini bukan root-nya sendiri, masukkan ke children
            // ATAU jika dia root tapi kita ingin dia tampil juga (opsional, biasanya root jadi center)
            if (trace.rootAccount?.id !== acc.id || !trace.rootAccount) {
                // Tentukan label path koneksi
                let connectionPath = "Direct Link";
                if (trace.path.length > 0) {
                    connectionPath = `Via ${trace.path[0]}`; // Ambil parent terdekat
                }

                tempGroups[rootId].children.push({
                    ...acc,
                    connectionPath: connectionPath,
                    depth: trace.path.length
                });
            }
        });

        // Convert object to array & filter groups that have children OR are explicit roots
        const groupedArray = Object.values(tempGroups)
            .filter(g => g.children.length > 0) // Hanya tampilkan grup yang punya koneksi
            .sort((a, b) => b.children.length - a.children.length);
        
        setGroups(groupedArray);
        
        // Preserve selection or select first
        if (!selectedParentId && groupedArray.length > 0) {
          setSelectedParentId(groupedArray[0].parentId);
        } else if (selectedParentId) {
             // Pastikan selection masih valid setelah update data
             const stillExists = groupedArray.find(g => g.parentId === selectedParentId);
             if (!stillExists && groupedArray.length > 0) {
                 setSelectedParentId(groupedArray[0].parentId);
             }
        }

        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => {
        unsubscribeAuth();
        clearInterval(scanInterval);
    };
  }, [selectedParentId]); // Hapus deps yang tidak perlu jika ada warning, tapi selectedParentId aman disini untuk re-evaluasi selection

  const activeGroup = groups.find(g => g.parentId === selectedParentId);

  // Fungsi navigasi smart
  const handleNodeClick = (account: Account) => {
    // Cek apakah akun ini adalah Hub di group lain?
    const isParent = groups.some(g => g.parentId.toLowerCase() === account.identifier.toLowerCase());
    
    if (isParent) {
      setSelectedParentId(account.identifier.toLowerCase());
    } else {
      router.push(`/dashboard/vault/${account.id}`);
    }
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
                <p>{'>'} Tracing neural pathways...</p>
                <p>{'>'} Resolving identity chains...</p>
                <p>{'>'} Building logic matrix...</p>
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
                    NET_VISUALIZER <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-800">v3.0 AI</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">RECURSIVE IDENTITY TRACKING ACTIVE</p>
            </div>
        </div>
        <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-400">ONLINE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
                <Wifi size={14} className="text-cyan-400" />
                <span className="text-slate-400">{groups.length} CLUSTERS DETECTED</span>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* LEFT PANEL: NODE SELECTOR */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className={`p-4 rounded-lg border ${THEME.border} ${THEME.panel}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                    <Search size={14} />
                    Identity Clusters
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {groups.length === 0 ? (
                        <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-slate-800 rounded">
                            NO_RELATIONS_FOUND
                        </div>
                    ) : groups.map((group) => (
                        <button
                            key={group.parentId}
                            onClick={() => setSelectedParentId(group.parentId)}
                            className={`w-full text-left p-3 rounded border text-xs transition-all flex items-center justify-between group ${
                                selectedParentId === group.parentId
                                    ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                            }`}
                        >
                            <div className="truncate flex-1 mr-2">
                                <p className="font-bold truncate opacity-90">
                                    {group.rootAccount ? group.rootAccount.serviceName : group.parentId}
                                </p>
                                <p className="text-[10px] opacity-60 mt-0.5 flex items-center gap-1">
                                    <GitBranch size={10} />
                                    {group.children.length} LINKED_NODES
                                </p>
                            </div>
                            {selectedParentId === group.parentId && (
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
                        CLUSTER_METADATA
                    </div>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">ROOT_TYPE</span>
                            <span className="text-cyan-300">
                                {activeGroup.rootAccount ? activeGroup.rootAccount.category : "EXTERNAL"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-500">IDENTIFIER</span>
                            <span className="text-white truncate max-w-[120px]" title={activeGroup.parentId}>
                                {activeGroup.parentId}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">STATUS</span>
                            <span className="text-emerald-400">SECURE</span>
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
                    <TopologyViewer 
                      group={activeGroup} 
                      onNodeClick={handleNodeClick} 
                      allGroups={groups} 
                    />
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

// --- SUB-COMPONENT: TOPOLOGY VIEWER ---
function TopologyViewer({ group, onNodeClick, allGroups }: { group: ConnectionGroup, onNodeClick: (acc: Account) => void, allGroups: ConnectionGroup[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

    // Helper: Cek apakah node ini juga parent dari group lain
    const isNodeHub = (identifier: string) => {
      return allGroups.some(g => g.parentId.toLowerCase() === identifier.toLowerCase());
    };

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
    const radius = Math.min(dimensions.w, dimensions.h) / 3;

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                {group.children.map((app, index) => {
                    const angle = (index * 2 * Math.PI) / group.children.length;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    
                    return (
                        <g key={`link-${app.id}`}>
                            {/* Connecting Line */}
                            <line 
                                x1={centerX} y1={centerY} 
                                x2={x} y2={y} 
                                stroke="url(#lineGradient)" 
                                strokeWidth={app.depth && app.depth > 0 ? 0.5 : 1} // Garis lebih tipis kalau indirect
                                strokeDasharray={app.depth && app.depth > 0 ? "4 4" : ""} // Putus-putus kalau indirect
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
                <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-cyan-500/20 animate-pulse" />
                    <div className="relative z-10 flex flex-col items-center">
                      <Cpu size={32} className="text-cyan-400" />
                      <span className="text-[8px] font-bold text-cyan-200 mt-1">CORE</span>
                    </div>
                </div>
                <div className="mt-3 bg-slate-900/90 px-3 py-1 rounded text-[10px] text-cyan-300 border border-cyan-500/30 backdrop-blur-sm shadow-xl max-w-[200px] truncate text-center">
                    {group.rootAccount ? group.rootAccount.serviceName : group.parentId}
                </div>
            </div>

            {/* CHILD NODES (APPS) - CLICKABLE */}
            {group.children.map((app, index) => {
                const angle = (index * 2 * Math.PI) / group.children.length;
                // Adjust radius slightly for responsiveness
                const r = Math.min(dimensions.w, dimensions.h) / 3;
                
                // Kalkulasi posisi exact
                const topVal = centerY + r * Math.sin(angle);
                const leftVal = centerX + r * Math.cos(angle);
                
                const isHub = isNodeHub(app.identifier);

                return (
                    <div 
                        key={app.id}
                        onClick={() => onNodeClick(app)}
                        className="absolute z-10 flex flex-col items-center justify-center w-24 h-24 hover:z-30 transition-all duration-300 group/node cursor-pointer"
                        style={{ 
                            top: topVal - 48, // offset setengah tinggi (24px + margin area)
                            left: leftVal - 48 
                        }}
                    >
                        <div className={`w-12 h-12 rounded-lg bg-slate-900 border flex items-center justify-center shadow-lg group-hover/node:shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover/node:scale-110 transition-all relative
                            ${isHub ? 'border-amber-500/80 ring-1 ring-amber-500/30' : 'border-slate-700 group-hover/node:border-cyan-400'}
                        `}>
                            {getCategoryIcon(app.category, 20)}
                            
                            {/* Status Dot */}
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                            
                            {/* IF NODE IS HUB: Show Indicator */}
                            {isHub && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-950 flex items-center justify-center animate-bounce">
                                <GitBranch size={8} className="text-black" />
                              </div>
                            )}

                            {/* Indirect Link Indicator (Badge kecil jika koneksi tidak langsung) */}
                            {app.depth && app.depth > 0 && (
                                <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-slate-950 flex items-center justify-center" title="Indirect Connection">
                                    <LinkIcon size={8} className="text-white" />
                                </div>
                            )}
                        </div>
                        
                        {/* Tooltip Label */}
                        <div className="opacity-0 group-hover/node:opacity-100 absolute top-full mt-2 transition-opacity duration-200 pointer-events-none z-40">
                            <div className="bg-slate-900 px-3 py-2 rounded border border-slate-700 shadow-xl text-left min-w-[140px]">
                                <p className="text-xs font-bold text-white truncate">{app.serviceName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">{app.identifier}</p>
                                
                                {/* Info Koneksi */}
                                <div className="mt-1 pt-1 border-t border-slate-800">
                                    <p className="text-[9px] text-cyan-500 uppercase tracking-wider flex items-center gap-1">
                                        <LinkIcon size={8} /> {app.connectionPath || "Direct"}
                                    </p>
                                </div>
                                
                                {isHub ? (
                                  <p className="text-[9px] text-amber-400 mt-1 flex items-center gap-1 font-bold">
                                    <GitBranch size={10} /> EXPAND_HUB
                                  </p>
                                ) : (
                                  <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                                    <ExternalLink size={10} /> INSPECT_DATA
                                  </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}