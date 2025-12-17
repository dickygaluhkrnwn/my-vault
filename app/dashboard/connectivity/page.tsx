"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
// Menggunakan relative path untuk menghindari error build
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
  Globe,
  ShoppingBag,
  MoreHorizontal,
  GitBranch,
  Activity,
  Search,
  Wifi,
  Terminal,
  Cpu,
  Shield,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Rotate3d
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

// Interface tambahan untuk node anak
interface ConnectedNode extends Account {
    connectionPath?: string; 
    depth?: number;
    immediateParentId?: string; 
    isSmartLinked?: boolean; 
}

interface ConnectionGroup {
  parentId: string; 
  rootAccount?: Account; 
  children: ConnectedNode[];
}

// 3D Point Interface
interface Point3D {
    x: number;
    y: number;
    z: number;
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
    
    if (visitedIds.has(currentAcc.id)) {
        return { rootIdentifier: currentAcc.identifier, path: [], rootAccount: currentAcc };
    }
    visitedIds.add(currentAcc.id);

    // 1. Cek Relasi Database (ID)
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

    // 2. Cek Relasi String (Linked Email/Identifier)
    if (currentAcc.linkedEmail && currentAcc.authMethod !== 'email') {
        const potentialParents: Account[] = [];
        
        for (const acc of allAccountsMap.values()) {
            if (acc.identifier.toLowerCase() === currentAcc.linkedEmail.toLowerCase() && acc.id !== currentAcc.id) {
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

            if (trace.rootAccount?.id !== acc.id || !trace.rootAccount) {
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

        // Phase 2: SMART RE-LINKING
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
            .filter(g => g.children.length > 0)
            .sort((a, b) => b.children.length - a.children.length);
        
        setGroups(groupedArray);
        
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

  const activeGroup = groups.find(g => g.parentId === selectedParentId);

  const handleNodeClick = (account: Account) => {
    router.push(`/dashboard/vault/${account.id}`);
  };

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
                <p className="text-xs text-slate-500 mt-1">3D INTERACTIVE TOPOLOGY ACTIVE</p>
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

        {/* RIGHT PANEL: VISUALIZER */}
        <div className="flex-1 flex flex-col gap-6">
            <div className={`rounded-xl border ${THEME.border} bg-[#020617] relative overflow-hidden flex items-center justify-center flex-1 min-h-[600px] shadow-inner`}>
                {/* 3D Stars Background */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', 
                        backgroundSize: '30px 30px' 
                    }} 
                />
                
                {activeGroup ? (
                    <TopologyViewer 
                      group={activeGroup} 
                      onNodeClick={handleNodeClick} 
                      allGroups={groups} 
                    />
                ) : (
                    <div className="flex flex-col items-center text-slate-600 animate-pulse">
                        <Shield size={64} className="mb-4 opacity-10" />
                        <p className="text-xs tracking-widest font-mono">WAITING FOR TARGET SELECTION...</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// --- TOPOLOGY VIEWER 3D NEURON STYLE ---
function TopologyViewer({ group, onNodeClick, allGroups }: { group: ConnectionGroup, onNodeClick: (acc: Account) => void, allGroups: ConnectionGroup[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
    
    // 3D Controls State
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    // Store calculated 3D positions
    const [node3DPositions, setNode3DPositions] = useState<Map<string, Point3D>>(new Map());

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                w: containerRef.current.clientWidth,
                h: containerRef.current.clientHeight
            });
        }
    }, [containerRef.current]);

    // --- CALCULATE 3D LAYOUT (SPHERICAL) ---
    useEffect(() => {
        const newPositions = new Map<string, Point3D>();
        
        // Root at origin (0,0,0)
        if (group.rootAccount) {
            newPositions.set(group.rootAccount.id, { x: 0, y: 0, z: 0 });
        }

        // Group children by immediate parent to form clusters
        const clusters: Record<string, ConnectedNode[]> = {};
        
        group.children.forEach(node => {
            const parentId = node.immediateParentId || group.rootAccount?.id || "root";
            if (!clusters[parentId]) clusters[parentId] = [];
            clusters[parentId].push(node);
        });

        // Distribute nodes in 3D Space
        // Strategy: Parent is center of its own sphere for its children
        // Use recursive or layered approach. Here we simplify to Layers for 3D look.
        
        const layerRadiusBase = 180; // Distance between layers

        // Process children level by level or by cluster
        // Simple approach: Root -> Children on Sphere -> Grandchildren on smaller spheres around children
        
        // 1. Level 1 Children (Directly connected to Root)
        const rootId = group.rootAccount?.id || "root";
        const level1Nodes = clusters[rootId] || [];
        
        level1Nodes.forEach((node, idx) => {
            // Fibonacci Sphere distribution for even spread
            const samples = level1Nodes.length;
            const phi = Math.acos(1 - 2 * (idx + 0.5) / samples);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (idx + 0.5);
            
            const r = layerRadiusBase;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            newPositions.set(node.id, { x, y, z });

            // 2. Level 2 Children (Grandchildren) - cluster around their parent
            const grandChildren = clusters[node.id] || [];
            if (grandChildren.length > 0) {
                const subRadius = 80;
                grandChildren.forEach((gc, gcIdx) => {
                    // Random spherical offset from parent
                    const gcPhi = Math.acos(1 - 2 * (gcIdx + 0.5) / grandChildren.length);
                    const gcTheta = Math.PI * (1 + Math.sqrt(5)) * (gcIdx + 0.5);

                    // Add slight random jitter
                    const jitter = 20;
                    const r2 = subRadius + (Math.random() * jitter);

                    const dx = r2 * Math.sin(gcPhi) * Math.cos(gcTheta);
                    const dy = r2 * Math.sin(gcPhi) * Math.sin(gcTheta);
                    const dz = r2 * Math.cos(gcPhi);

                    newPositions.set(gc.id, {
                        x: x + dx, // Parent X + offset
                        y: y + dy,
                        z: z + dz
                    });
                });
            }
        });

        setNode3DPositions(newPositions);
    }, [group]);


    // --- 3D PROJECTION HELPER ---
    // Projects 3D point (x,y,z) to 2D screen (x,y) with scale based on Z (perspective)
    const project = (point: Point3D) => {
        // 1. Rotate around Y axis
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.z * cosY + point.x * sinY;

        // 2. Rotate around X axis
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const y2 = point.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + point.y * sinX;

        // 3. Perspective Projection
        // Camera distance
        const cameraZ = 800;
        const perspective = cameraZ / (cameraZ + z2);
        
        // Final screen coords
        const x2d = x1 * perspective * zoom + dimensions.w / 2;
        const y2d = y2 * perspective * zoom + dimensions.h / 2;
        const scale = perspective * zoom;

        return { x: x2d, y: y2d, scale, zIndex: z2 };
    };

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMouse.x;
        const deltaY = e.clientY - lastMouse.y;
        
        setRotation(prev => ({
            x: prev.x - deltaY * 0.005,
            y: prev.y + deltaX * 0.005
        }));
        
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);
    
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * delta, 0.2), 3));
    };

    const handleReset = () => {
        setRotation({ x: 0, y: 0 });
        setZoom(1);
    };

    // --- PREPARE RENDER OBJECTS ---
    // Convert 3D map to 2D projected items list, sorted by Z depth
    const renderItems = useMemo(() => {
        const items: any[] = [];

        // Project Root
        if (group.rootAccount && node3DPositions.has(group.rootAccount.id)) {
            const p3 = node3DPositions.get(group.rootAccount.id)!;
            const proj = project(p3);
            items.push({
                type: 'node',
                data: group.rootAccount,
                ...proj,
                isRoot: true
            });
        }

        // Project Children
        group.children.forEach(child => {
            if (!node3DPositions.has(child.id)) return;
            const p3 = node3DPositions.get(child.id)!;
            const proj = project(p3);
            items.push({
                type: 'node',
                data: child,
                ...proj,
                isRoot: false
            });

            // Calculate Link (Bezier Curve in 3D projected to 2D)
            const parentId = child.immediateParentId || group.rootAccount?.id || 'root';
            if (node3DPositions.has(parentId)) {
                const parentP3 = node3DPositions.get(parentId)!;
                const parentProj = project(parentP3);

                // Control Point for Curve (Midpoint + Offset in 3D)
                // This makes the line look like a 3D arc
                const midX = (p3.x + parentP3.x) / 2;
                const midY = (p3.y + parentP3.y) / 2;
                const midZ = (p3.z + parentP3.z) / 2;
                
                // Offset control point away from center to create arc
                // Using spherical normal for "outward" curve
                const len = Math.sqrt(midX*midX + midY*midY + midZ*midZ) || 1;
                const curveIntensity = 50;
                const cp3 = {
                    x: midX + (midX/len) * curveIntensity,
                    y: midY + (midY/len) * curveIntensity,
                    z: midZ + (midZ/len) * curveIntensity
                };
                const cpProj = project(cp3);

                items.push({
                    type: 'link',
                    data: child, // Link belongs to child
                    start: parentProj,
                    end: proj,
                    cp: cpProj, // Control point
                    zIndex: (parentProj.zIndex + proj.zIndex) / 2 // Average Z for sorting
                });
            }
        });

        // Sort by Z Index (Painter's Algorithm) - Draw furthest first
        return items.sort((a, b) => b.zIndex - a.zIndex); // Higher Z means further away in our projection math (z2)
    }, [node3DPositions, rotation, zoom, group]);


    return (
        <div 
            ref={containerRef} 
            className="w-full h-full relative cursor-move overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* CONTROLS */}
            <div className="absolute bottom-4 right-4 flex gap-2 z-50 pointer-events-auto">
                <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.2, z - 0.2))}} className="p-2 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 text-slate-400"><ZoomOut size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleReset()}} className="p-2 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 text-slate-400"><Rotate3d size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.2))}} className="p-2 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 text-slate-400"><ZoomIn size={16} /></button>
            </div>

            <svg className="w-full h-full pointer-events-none">
                <defs>
                    {/* GLOW FILTERS */}
                    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                        <stop offset="100%" stopColor="#083344" stopOpacity="0.8" />
                    </radialGradient>
                </defs>

                {renderItems.map((item, idx) => {
                    if (item.type === 'link') {
                        const isSmart = item.data.isSmartLinked;
                        return (
                            <g key={`link-${idx}`} className="transition-opacity duration-500">
                                <path 
                                    d={`M ${item.start.x} ${item.start.y} Q ${item.cp.x} ${item.cp.y} ${item.end.x} ${item.end.y}`}
                                    stroke={isSmart ? "#a855f7" : "#0e7490"} 
                                    strokeWidth={(isSmart ? 1.5 : 1) * item.end.scale} 
                                    fill="none"
                                    opacity={Math.max(0.2, 0.6 * item.end.scale)} // Fade distant lines
                                    strokeDasharray={isSmart ? "4 2" : "0"}
                                />
                                {/* Pulsing Data Packet */}
                                <circle r={3 * item.end.scale} fill={isSmart ? "#d8b4fe" : "#67e8f9"}>
                                    <animateMotion 
                                        dur={`${3 + Math.random()}s`} 
                                        repeatCount="indefinite"
                                        path={`M ${item.start.x} ${item.start.y} Q ${item.cp.x} ${item.cp.y} ${item.end.x} ${item.end.y}`}
                                    />
                                </circle>
                            </g>
                        );
                    }

                    if (item.type === 'node') {
                        if (item.isRoot) {
                            return (
                                <g 
                                    key={`root-${item.data.id}`}
                                    transform={`translate(${item.x}, ${item.y}) scale(${item.scale})`}
                                    className={`cursor-pointer pointer-events-auto hover:scale-110 transition-transform`}
                                    onClick={(e) => { e.stopPropagation(); onNodeClick(item.data); }}
                                >
                                    <circle r="30" fill="url(#nodeGradient)" filter="url(#glow-cyan)" className="animate-pulse" />
                                    <circle r="35" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.5">
                                        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite" />
                                    </circle>
                                    <foreignObject x="-60" y="35" width="120" height="40">
                                        <div className="bg-slate-950/80 border border-cyan-500/50 rounded px-2 py-1 text-center backdrop-blur-sm">
                                            <p className="text-[10px] font-bold text-cyan-300 truncate">
                                                {item.data.serviceName}
                                            </p>
                                        </div>
                                    </foreignObject>
                                </g>
                            );
                        } else {
                            const isSmart = item.data.isSmartLinked;
                            return (
                                <g 
                                    key={`node-${item.data.id}`}
                                    transform={`translate(${item.x}, ${item.y}) scale(${item.scale})`}
                                    className="cursor-pointer pointer-events-auto group/node"
                                    onClick={(e) => { e.stopPropagation(); onNodeClick(item.data); }}
                                >
                                    {/* Glow Halo */}
                                    <circle r="12" fill={isSmart ? "#7e22ce" : "#0e7490"} opacity="0.4" filter={isSmart ? "url(#glow-purple)" : "url(#glow-cyan)"} />
                                    
                                    {/* Core */}
                                    <circle 
                                        r="8" 
                                        fill={isSmart ? "#a855f7" : "#06b6d4"} 
                                        className="transition-all duration-300 group-hover/node:r-10"
                                    />
                                    
                                    {/* Icon Container */}
                                    <foreignObject x="-8" y="-8" width="16" height="16" className="pointer-events-none">
                                        <div className="flex items-center justify-center w-full h-full text-white/90">
                                            {getCategoryIcon(item.data.category, 10)}
                                        </div>
                                    </foreignObject>

                                    {/* Tooltip on Hover (Always on top visually) */}
                                    <g className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 9999}}>
                                        <foreignObject x="15" y="-20" width="140" height="60">
                                            <div className="bg-slate-900/90 border border-slate-700 p-2 rounded shadow-xl backdrop-blur-md">
                                                <p className="text-[10px] font-bold text-white truncate">{item.data.serviceName}</p>
                                                <p className="text-[8px] text-slate-400 truncate">{item.data.identifier}</p>
                                                {isSmart && <p className="text-[8px] text-purple-400 font-bold mt-1">Smart Linked</p>}
                                            </div>
                                        </foreignObject>
                                    </g>
                                </g>
                            );
                        }
                    }
                    return null;
                })}
            </svg>
        </div>
    );
}