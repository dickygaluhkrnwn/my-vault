"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { Account, AccountCategory } from "../../../lib/types/schema";
import { useRouter } from "next/navigation"; 
import { 
  Network, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  ShoppingBag,
  MoreHorizontal,
  GitBranch,
  Activity,
  Search,
  Wifi,
  Shield,
  GraduationCap,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import NetworkGraph from "../../../components/visual/NetworkGraph";

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

// Interface tambahan untuk node anak (HARUS SAMA DENGAN NetworkGraph.tsx untuk konsistensi)
export interface ConnectedNode extends Account {
    connectionPath?: string; 
    depth?: number;
    immediateParentId?: string; 
    isSmartLinked?: boolean; 
}

export interface ConnectionGroup {
  parentId: string; 
  rootAccount?: Account; 
  children: ConnectedNode[];
}

export default function ConnectivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ConnectionGroup[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // --- LOGIC INTI: RECURSIVE IDENTITY TRACING ---
  const findRootNode = (
    currentAcc: Account, 
    allAccountsMap: Map<string, Account>, 
    visitedIds = new Set<string>()
  ): { rootIdentifier: string, path: string[], rootAccount?: Account, immediateParentId?: string } => {
    
    // Mencegah Infinite Loop (Circular Dependency)
    if (visitedIds.has(currentAcc.id)) {
        return { rootIdentifier: currentAcc.identifier, path: [], rootAccount: currentAcc };
    }
    visitedIds.add(currentAcc.id);

    // 1. Cek Relasi Database (ID) - Prioritas Tertinggi
    // Jika user sudah memilih parent secara manual di form create/edit
    if (currentAcc.linkedAccountId) {
        const parentAcc = allAccountsMap.get(currentAcc.linkedAccountId);
        if (parentAcc) {
            const parentResult = findRootNode(parentAcc, allAccountsMap, visitedIds);
            return {
                rootIdentifier: parentResult.rootIdentifier,
                path: [parentAcc.serviceName, ...parentResult.path],
                rootAccount: parentResult.rootAccount,
                immediateParentId: parentAcc.id
            };
        }
    }

    // 2. Cek Relasi String (Linked Email/Identifier) - Fallback Cerdas
    // Jika tidak ada ID parent, kita cari berdasarkan string 'linkedEmail'
    if (currentAcc.linkedEmail && currentAcc.authMethod !== 'email') {
        const potentialParents: Account[] = [];
        
        for (const acc of allAccountsMap.values()) {
            // Case-insensitive comparison
            const targetIdentifier = currentAcc.linkedEmail.toLowerCase();
            const candidateIdentifier = acc.identifier.toLowerCase();
            const candidateServiceName = acc.serviceName.toLowerCase();

            // Match Logic: Identifier sama ATAU Service Name sama (misal "Google")
            if (
                (candidateIdentifier === targetIdentifier || candidateServiceName === targetIdentifier) && 
                acc.id !== currentAcc.id
            ) {
                potentialParents.push(acc);
            }
        }

        let bestParent: Account | undefined;

        if (potentialParents.length > 0) {
            // Heuristik Pemilihan Parent Terbaik
            if (currentAcc.authMethod === 'sso_steam') {
                bestParent = potentialParents.find(p => p.category === 'GAME') || 
                             potentialParents.find(p => p.serviceName.toLowerCase().includes('steam')) || 
                             potentialParents[0];
            } else if (currentAcc.authMethod === 'sso_google') {
                bestParent = potentialParents.find(p => p.category === 'UTILITY') || 
                             potentialParents.find(p => p.serviceName.toLowerCase().includes('google')) || 
                             potentialParents[0];
            } else if (currentAcc.authMethod === 'sso_supercell') { // [BARU] Logika Supercell
                bestParent = potentialParents.find(p => p.serviceName.toLowerCase().includes('supercell')) ||
                             potentialParents.find(p => p.identifier === currentAcc.linkedEmail) ||
                             potentialParents[0];
            } else {
                // Default: Ambil yang paling "mirip" atau yang pertama
                bestParent = potentialParents[0];
            }
        }

        if (bestParent) {
             const parentResult = findRootNode(bestParent, allAccountsMap, visitedIds);
             return {
                rootIdentifier: parentResult.rootIdentifier,
                path: [bestParent.serviceName, ...parentResult.path],
                rootAccount: parentResult.rootAccount,
                immediateParentId: bestParent.id
            };
        } else {
            // Jika linkedEmail ada tapi tidak ketemu akunnya di DB, 
            // kita tetap grupkan berdasarkan string email tersebut (External Cluster)
            return { 
                rootIdentifier: currentAcc.linkedEmail.toLowerCase(), 
                path: ["External"],
                rootAccount: undefined 
            };
        }
    }

    // Jika tidak ada link sama sekali, dia adalah Root bagi dirinya sendiri
    return { rootIdentifier: currentAcc.identifier.toLowerCase(), path: [], rootAccount: currentAcc };
  };

  // Fetch Data
  useEffect(() => {
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

        const accountsMap = new Map<string, Account>();
        allAccounts.forEach(acc => accountsMap.set(acc.id, acc));

        const tempGroups: Record<string, ConnectionGroup> = {};

        // Phase 1: Build Initial Groups
        allAccounts.forEach(acc => {
            const trace = findRootNode(acc, accountsMap, new Set());
            const rootId = trace.rootIdentifier;

            if (!tempGroups[rootId]) {
                tempGroups[rootId] = {
                    parentId: rootId,
                    rootAccount: trace.rootAccount, // Bisa undefined jika External
                    children: []
                };
            }

            // Jika akun ini bukan root, masukkan sebagai anak
            // ATAU jika dia root tapi ada akun lain yang menganggap dia root (logic handle later)
            // Di sini kita masukkan SEMUA node ke dalam grupnya masing-masing
            // kecuali dia adalah Root Account itu sendiri (agar tidak duplikat di visualisasi sebagai anak dan induk)
            
            const isSelfRoot = trace.rootAccount?.id === acc.id;
            
            if (!isSelfRoot) {
                let connectionPath = "Direct Link";
                if (trace.path.length > 0) {
                    connectionPath = `Via ${trace.path[0]}`;
                }

                tempGroups[rootId].children.push({
                    ...acc,
                    connectionPath: connectionPath,
                    depth: trace.path.length, 
                    immediateParentId: trace.immediateParentId
                });
            }
        });

        // Phase 2: SMART RE-LINKING (Post-Processing)
        // Memperbaiki relasi antar sibling agar struktur pohon lebih rapi
        Object.values(tempGroups).forEach(group => {
            const potentialHubs = group.children.filter(
                c => c.category === 'GAME' || c.serviceName.toLowerCase().includes('steam')
            );

            group.children.forEach(child => {
                // Logic khusus Steam
                if (
                    child.authMethod === 'sso_steam' && 
                    child.immediateParentId === group.rootAccount?.id &&
                    group.rootAccount?.category !== 'GAME'
                ) {
                    const steamHub = potentialHubs.find(h => h.id !== child.id); 
                    if (steamHub) {
                        child.immediateParentId = steamHub.id;
                        child.depth = (steamHub.depth || 1) + 1; 
                        child.connectionPath = `Via ${steamHub.serviceName}`;
                        child.isSmartLinked = true; 
                    }
                }
            });
        });

        // Filter grup yang valid (punya anak ATAU dia adalah single root yang valid)
        // Kita ingin menampilkan grup meskipun isinya cuma 1 node (single parent) agar user sadar ada akun itu
        const groupedArray = Object.values(tempGroups)
            .sort((a, b) => b.children.length - a.children.length);
        
        setGroups(groupedArray);
        
        // Auto-select logic
        if (!selectedParentId && groupedArray.length > 0) {
          setSelectedParentId(groupedArray[0].parentId);
        } else if (selectedParentId) {
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
  }, [selectedParentId]);

  // Handler interaksi
  const handleNodeClick = (account: Account) => {
    router.push(`/dashboard/vault/${account.id}`);
  };

  // Group yang sedang aktif (diklik di sidebar)
  const activeGroup = groups.find(g => g.parentId === selectedParentId);

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
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[85vh] ${THEME.bg} text-slate-200 p-6 rounded-xl border ${THEME.border} shadow-2xl font-mono overflow-hidden flex flex-col`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg animate-pulse">
                <Network className="text-cyan-400" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    NEURAL_NET <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-800">v5.0 3D</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">ORGANIC TOPOLOGY ACTIVE</p>
            </div>
        </div>
        <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
                <Wifi size={14} className="text-cyan-400" />
                <span className="text-slate-400">{groups.length} CLUSTERS</span>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* LEFT PANEL: LIST */}
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
                                {group.rootAccount && (
                                    <p className="text-[10px] text-slate-500 font-mono truncate">
                                        {group.rootAccount.identifier}
                                    </p>
                                )}
                                <p className="text-[10px] opacity-60 mt-0.5 flex items-center gap-1">
                                    <GitBranch size={10} />
                                    {group.children.length} NODES
                                </p>
                            </div>
                            {selectedParentId === group.parentId && (
                                <Activity size={14} className="text-cyan-400 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: VISUALIZER (R3F) */}
        <div className="flex-1 flex flex-col gap-6">
            {/* Mengirimkan data activeGroup ke dalam grafik 3D */}
            <NetworkGraph group={activeGroup} onNodeClick={handleNodeClick} />

            <div className="flex justify-between items-center text-[10px] text-slate-500 px-2">
                <p>MOUSE: Drag to rotate • Scroll to zoom • Click nodes to open details</p>
                <p>RENDERER: WebGL 2.0 (Three.js)</p>
            </div>
        </div>

      </div>
    </div>
  );
}