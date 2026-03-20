"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account } from "@/lib/types/schema";
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
  Eye,
  Terminal
} from "lucide-react";
import NetworkGraph from "@/components/visual/NetworkGraph";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

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
  const { theme } = useTheme();
  const { user, isGuest } = useAuth(); 
  
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ConnectionGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<ConnectionGroup[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  
  const [mobileView, setMobileView] = useState<'list' | 'graph'>('list');
  const [searchQuery, setSearchQuery] = useState("");

  const findRootNode = (
    currentAcc: Account, 
    allAccountsMap: Map<string, Account>, 
    visitedIds = new Set<string>()
  ): { rootIdentifier: string, path: string[], rootAccount?: Account, immediateParentId?: string } => {
    
    if (visitedIds.has(currentAcc.id)) {
        return { rootIdentifier: currentAcc.identifier, path: [], rootAccount: currentAcc };
    }
    visitedIds.add(currentAcc.id);

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

  useEffect(() => {
    const scanInterval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    if (!user) {
        clearInterval(scanInterval);
        return;
    }

    // KEMBALI KE QUERY AMAN FIREBASE (Strict User Isolation)
    const q = query(
        collection(db, "accounts"),
        where("userId", "==", user.uid)
    );
      
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        let allAccounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Account[];

        allAccounts.sort((a, b) => a.serviceName.localeCompare(b.serviceName));

        const accountsMap = new Map<string, Account>();
        allAccounts.forEach(acc => accountsMap.set(acc.id, acc));

        const tempGroups: Record<string, ConnectionGroup> = {};

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
        setFilteredGroups(groupedArray); 
        
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

    return () => {
        unsubscribeSnapshot();
        clearInterval(scanInterval);
    };
  }, [user]);

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
        
        const childMatch = g.children.some(c => 
            c.serviceName.toLowerCase().includes(lowerQuery) || 
            c.identifier.toLowerCase().includes(lowerQuery)
        );

        return rootMatch || childMatch;
    });
    setFilteredGroups(filtered);
  }, [searchQuery, groups]);

  const handleNodeClick = (account: Account) => {
    router.push(`/dashboard/vault/${account.id}`);
  };

  const activeGroup = groups.find(g => g.parentId === selectedParentId);

  const styles = {
    formal: {
      wrapper: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100",
      headerIcon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      accentText: "text-blue-600 dark:text-blue-400",
      subText: "text-slate-500",
      panel: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800",
      input: "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-slate-100",
      listItem: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800",
      listItemSelected: "bg-blue-50 dark:bg-blue-900/20 border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-sm",
      badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
    },
    hacker: {
      wrapper: "bg-[#050505] border-green-900/50 text-green-500 font-mono shadow-[0_0_30px_rgba(34,197,94,0.05)]",
      headerIcon: "bg-black border-green-500/50 text-green-400",
      accentText: "text-green-400",
      subText: "text-green-700",
      panel: "bg-[#020202] border-green-900/30",
      input: "bg-black border-green-900 focus:border-green-500 text-green-400",
      listItem: "bg-black border-green-900 hover:bg-green-900/20",
      listItemSelected: "bg-green-900/20 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
      badge: "bg-black text-green-400 border-green-900"
    },
    casual: {
      wrapper: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-orange-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 rounded-[2rem]",
      headerIcon: "bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-stone-700",
      accentText: "text-orange-500 dark:text-orange-400",
      subText: "text-stone-500",
      panel: "bg-orange-50/50 dark:bg-stone-950/50 border-orange-100 dark:border-stone-800 rounded-3xl",
      input: "bg-white dark:bg-stone-900 border-orange-200 dark:border-stone-700 focus:border-orange-500 text-stone-800 dark:text-stone-100 rounded-xl",
      listItem: "bg-white dark:bg-stone-900 border-orange-100 dark:border-stone-800 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-2xl",
      listItemSelected: "bg-orange-100 dark:bg-orange-900/20 border-orange-400 text-orange-700 dark:text-orange-300 shadow-sm rounded-2xl",
      badge: "bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-stone-700"
    }
  };

  const cs = styles[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[80vh] font-mono", theme === 'hacker' ? 'text-green-500' : 'text-slate-800 dark:text-slate-200')}>
        <div className="w-96 space-y-4">
            <div className={cn("flex justify-between text-xs mb-1", cs.accentText)}>
                <span>{theme === 'hacker' ? 'SYSTEM_INIT' : 'Memindai Jaringan...'}</span>
                <span>{scanProgress}%</span>
            </div>
            <div className={cn("h-1 w-full rounded-full overflow-hidden", theme === 'hacker' ? 'bg-green-950' : 'bg-slate-200 dark:bg-slate-800')}>
                <div 
                    className={cn("h-full transition-all duration-75 ease-out", theme === 'hacker' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-blue-500')} 
                    style={{ width: `${scanProgress}%` }}
                />
            </div>
            <div className={cn("text-xs space-y-1", cs.subText)}>
                <p>{'>'} Tracing neural pathways...</p>
                <p>{'>'} Resolving identity chains...</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-[85vh] p-4 lg:p-6 border shadow-2xl overflow-hidden flex flex-col transition-colors duration-500", cs.wrapper, theme !== 'casual' && 'rounded-xl')}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-8 border-b border-inherit pb-4">
        <div className="flex items-center gap-4">
            <div className={cn("p-3 border rounded-lg", cs.headerIcon, theme === 'hacker' && 'animate-pulse')}>
                <Network size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    {theme === 'hacker' ? 'NEURAL_NET' : 'Peta Jaringan Akun'} 
                    <span className={cn("text-xs px-2 py-0.5 border rounded-md font-bold", cs.badge)}>
                        {isGuest ? 'GUEST DATA' : 'v5.0 3D'}
                    </span>
                </h1>
                <p className={cn("text-xs mt-1", cs.subText)}>
                  {theme === 'hacker' ? 'ORGANIC TOPOLOGY ACTIVE' : 'Visualisasi interkoneksi identitas digitalmu'}
                </p>
            </div>
        </div>
        
        <div className={cn("flex items-center gap-2 lg:hidden p-1 border", cs.panel, theme !== 'casual' && 'rounded-lg')}>
            <button 
                onClick={() => setMobileView('list')}
                className={cn("p-2 rounded transition-colors", mobileView === 'list' ? cs.listItemSelected : cs.subText)}
            >
                <List size={18} />
            </button>
            <button 
                onClick={() => setMobileView('graph')}
                className={cn("p-2 rounded transition-colors", mobileView === 'graph' ? cs.listItemSelected : cs.subText)}
            >
                <Box size={18} />
            </button>
        </div>

        <div className="hidden lg:flex gap-4 text-xs">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 border font-bold", cs.panel, theme !== 'casual' && 'rounded-md')}>
                <Wifi size={14} className={cs.accentText} />
                <span className={cs.subText}>{groups.length} KLASTER</span>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 relative h-[600px] lg:h-auto">
        
        <div className={cn(
          "w-full lg:w-80 flex flex-col gap-4 absolute lg:relative inset-0 z-10 transition-all duration-300", 
          theme === 'hacker' ? 'bg-[#050505] lg:bg-transparent' : 'bg-white dark:bg-slate-950 lg:bg-transparent',
          mobileView === 'graph' ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'
        )}>
            <div className={cn("p-4 border h-full flex flex-col", cs.panel, theme !== 'casual' && 'rounded-lg')}>
                <div className="flex flex-col gap-3 mb-3">
                    <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider", cs.subText)}>
                        <Search size={14} />
                        {theme === 'hacker' ? 'Identity Clusters' : 'Daftar Klaster'}
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder={theme === 'hacker' ? "Find cluster..." : "Cari klaster..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn("w-full border px-3 py-2 text-sm focus:outline-none transition-colors", cs.input, theme !== 'casual' && 'rounded')}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                            >
                                <Shield size={10} className="rotate-45" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {filteredGroups.length === 0 ? (
                        <div className={cn("text-xs text-center py-8 border border-dashed flex flex-col items-center gap-2", cs.subText, cs.listItem, theme !== 'casual' && 'rounded')}>
                            <Shield size={24} className="opacity-20" />
                            NO_MATCH_FOUND
                        </div>
                    ) : filteredGroups.map((group) => (
                        <button
                            key={group.parentId}
                            onClick={() => {
                                setSelectedParentId(group.parentId);
                                if (window.innerWidth < 1024) setMobileView('graph');
                            }}
                            className={cn(
                                "w-full text-left p-3 border text-xs transition-all flex items-center justify-between group",
                                theme !== 'casual' && 'rounded',
                                selectedParentId === group.parentId ? cs.listItemSelected : cs.listItem
                            )}
                        >
                            <div className="truncate flex-1 mr-2">
                                <p className="font-bold truncate opacity-90">
                                    {group.rootAccount ? group.rootAccount.serviceName : group.parentId}
                                </p>
                                {group.rootAccount && (
                                    <p className={cn("text-[10px] font-mono truncate mt-0.5", cs.subText)}>
                                        {group.rootAccount.identifier}
                                    </p>
                                )}
                                <p className={cn("text-[10px] mt-1 flex items-center gap-1 opacity-70", cs.subText)}>
                                    <GitBranch size={10} />
                                    {group.children.length} {theme === 'hacker' ? 'NODES' : 'TERHUBUNG'}
                                </p>
                            </div>
                            {selectedParentId === group.parentId ? (
                                <Activity size={14} className={cn("animate-pulse", cs.accentText)} />
                            ) : (
                                <Eye size={14} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", cs.subText)} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className={cn(
          "flex-1 flex flex-col gap-6 absolute lg:relative inset-0 transition-all duration-300", 
          theme === 'hacker' ? 'bg-[#050505] lg:bg-transparent' : 'bg-white dark:bg-slate-950 lg:bg-transparent',
          mobileView === 'list' ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : 'opacity-100'
        )}>
            <NetworkGraph group={activeGroup} onNodeClick={handleNodeClick} />

            <div className={cn("flex justify-between items-center text-[10px] font-bold px-2 absolute bottom-2 w-full lg:relative lg:bottom-auto pointer-events-none", cs.subText)}>
                <p className="hidden lg:block">MOUSE: Drag to rotate • Scroll to zoom • Click nodes</p>
                <p className="lg:hidden">TOUCH: Drag to rotate • Pinch to zoom</p>
                <p>RENDERER: WebGL 2.0 (Three.js)</p>
            </div>
        </div>

      </div>
    </div>
  );
}