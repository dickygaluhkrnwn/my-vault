"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { Account, AccountCategory } from "../../../lib/types/schema";
import { useRouter } from "next/navigation"; 
import { 
  Network, 
  GitBranch,
  Activity,
  Search,
  Wifi,
  Shield,
  List,
  Box,
  Eye
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
  const [filteredGroups, setFilteredGroups] = useState<ConnectionGroup[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  
  // Mobile View State ('list' or 'graph')
  const [mobileView, setMobileView] = useState<'list' | 'graph'>('list');
  const [searchQuery, setSearchQuery] = useState("");

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
    if (currentAcc.linkedEmail && currentAcc.authMethod !== 'email') {
        const potentialParents: Account[] = [];
        
        for (const acc of allAccountsMap.values()) {
            const targetIdentifier = currentAcc.linkedEmail.toLowerCase();
            const candidateIdentifier = acc.identifier.toLowerCase();
            const candidateServiceName = acc.serviceName.toLowerCase();

            if (
                (candidateIdentifier === targetIdentifier || candidateServiceName === targetIdentifier) && 
                acc.id !== currentAcc.id
            ) {
                potentialParents.push(acc);
            }
        }

        let bestParent: Account | undefined;

        if (potentialParents.length > 0) {
            if (currentAcc.authMethod === 'sso_steam') {
                bestParent = potentialParents.find(p => p.category === 'GAME') || 
                             potentialParents.find(p => p.serviceName.toLowerCase().includes('steam')) || 
                             potentialParents[0];
            } else if (currentAcc.authMethod === 'sso_google') {
                bestParent = potentialParents.find(p => p.category === 'UTILITY') || 
                             potentialParents.find(p => p.serviceName.toLowerCase().includes('google')) || 
                             potentialParents[0];
            } else if (currentAcc.authMethod === 'sso_supercell') { 
                bestParent = potentialParents.find(p => p.serviceName.toLowerCase().includes('supercell')) ||
                             potentialParents.find(p => p.identifier === currentAcc.linkedEmail) ||
                             potentialParents[0];
            } else {
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
            return { 
                rootIdentifier: currentAcc.linkedEmail.toLowerCase(), 
                path: ["External"],
                rootAccount: undefined 
            };
        }
    }

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
                    rootAccount: trace.rootAccount, 
                    children: []
                };
            }
            
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
        Object.values(tempGroups).forEach(group => {
            const potentialHubs = group.children.filter(
                c => c.category === 'GAME' || c.serviceName.toLowerCase().includes('steam')
            );

            group.children.forEach(child => {
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

        const groupedArray = Object.values(tempGroups)
            .sort((a, b) => b.children.length - a.children.length);
        
        setGroups(groupedArray);
        setFilteredGroups(groupedArray); // Init filtered groups
        
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

  // Search Filtering Effect
  useEffect(() => {
    if (!searchQuery) {
        setFilteredGroups(groups);
        return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = groups.filter(g => {
        const rootMatch = g.rootAccount?.serviceName.toLowerCase().includes(lowerQuery) || 
                          g.rootAccount?.identifier.toLowerCase().includes(lowerQuery) ||
                          g.parentId.toLowerCase().includes(lowerQuery);
        
        // Also check if any child matches (optional, but good for UX)
        const childMatch = g.children.some(c => 
            c.serviceName.toLowerCase().includes(lowerQuery) || 
            c.identifier.toLowerCase().includes(lowerQuery)
        );

        return rootMatch || childMatch;
    });
    setFilteredGroups(filtered);
  }, [searchQuery, groups]);


  // Handler interaksi
  const handleNodeClick = (account: Account) => {
    router.push(`/dashboard/vault/${account.id}`);
  };

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
    <div className={`min-h-[85vh] ${THEME.bg} text-slate-200 p-4 lg:p-6 rounded-xl border ${THEME.border} shadow-2xl font-mono overflow-hidden flex flex-col`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-8 border-b border-slate-800 pb-4">
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
        
        {/* MOBILE TOGGLE (LIST / GRAPH) */}
        <div className="flex items-center gap-2 lg:hidden bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
                onClick={() => setMobileView('list')}
                className={`p-2 rounded ${mobileView === 'list' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}
            >
                <List size={18} />
            </button>
            <button 
                onClick={() => setMobileView('graph')}
                className={`p-2 rounded ${mobileView === 'graph' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500'}`}
            >
                <Box size={18} />
            </button>
        </div>

        <div className="hidden lg:flex gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
                <Wifi size={14} className="text-cyan-400" />
                <span className="text-slate-400">{groups.length} CLUSTERS</span>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 relative h-[600px] lg:h-auto">
        
        {/* LEFT PANEL: LIST (Hidden on mobile if view is graph) */}
        <div className={`w-full lg:w-80 flex flex-col gap-4 absolute lg:relative inset-0 z-10 bg-slate-950 lg:bg-transparent transition-all duration-300 ${mobileView === 'graph' ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'}`}>
            <div className={`p-4 rounded-lg border ${THEME.border} ${THEME.panel} h-full flex flex-col`}>
                <div className="flex flex-col gap-3 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Search size={14} />
                        Identity Clusters
                    </div>
                    {/* SEARCH INPUT */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Find cluster..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                            >
                                <Shield size={10} className="rotate-45" /> {/* Close icon visual hack or import X */}
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {filteredGroups.length === 0 ? (
                        <div className="text-xs text-slate-600 text-center py-8 border border-dashed border-slate-800 rounded flex flex-col items-center gap-2">
                            <Shield size={24} className="opacity-20" />
                            NO_MATCH_FOUND
                        </div>
                    ) : filteredGroups.map((group) => (
                        <button
                            key={group.parentId}
                            onClick={() => {
                                setSelectedParentId(group.parentId);
                                if (window.innerWidth < 1024) setMobileView('graph'); // Auto switch to graph on mobile click
                            }}
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
                            {selectedParentId === group.parentId ? (
                                <Activity size={14} className="text-cyan-400 animate-pulse" />
                            ) : (
                                <Eye size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT PANEL: VISUALIZER (R3F) */}
        {/* Hidden on mobile if view is list */}
        <div className={`flex-1 flex flex-col gap-6 absolute lg:relative inset-0 bg-slate-950 lg:bg-transparent transition-all duration-300 ${mobileView === 'list' ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'}`}>
            {/* Mengirimkan data activeGroup ke dalam grafik 3D */}
            <NetworkGraph group={activeGroup} onNodeClick={handleNodeClick} />

            <div className="flex justify-between items-center text-[10px] text-slate-500 px-2 absolute bottom-2 w-full lg:relative lg:bottom-auto">
                <p className="hidden lg:block">MOUSE: Drag to rotate • Scroll to zoom • Click nodes to open details</p>
                <p className="lg:hidden">TOUCH: Drag to rotate • Pinch to zoom • Tap nodes</p>
                <p>RENDERER: WebGL 2.0 (Three.js)</p>
            </div>
        </div>

      </div>
    </div>
  );
}