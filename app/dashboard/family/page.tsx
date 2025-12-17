"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { 
  Users, 
  User, 
  Gamepad2, 
  Wallet, 
  Share2, 
  ArrowRight,
  Loader2,
  Shield,
  Plus,
  Terminal,
  Activity,
  Lock,
  Briefcase,
  Mail,
  Music,
  ShoppingBag,
  GraduationCap,
  MoreHorizontal,
  Fingerprint,
  Smartphone
} from "lucide-react";
import Link from "next/link";
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
};

// Helper Icon Kategori (Expanded)
const getCategoryIcon = (category: AccountCategory | string) => {
  switch (category) {
    case "GAME": return <Gamepad2 size={12} className="text-purple-400" />;
    case "FINANCE": return <Wallet size={12} className="text-emerald-400" />;
    case "SOCIAL": return <Share2 size={12} className="text-blue-400" />;
    case "WORK": return <Briefcase size={12} className="text-amber-400" />;
    case "UTILITY": return <Mail size={12} className="text-orange-400" />;
    case "ENTERTAINMENT": return <Music size={12} className="text-pink-400" />;
    case "EDUCATION": return <GraduationCap size={12} className="text-yellow-400" />;
    case "ECOMMERCE": return <ShoppingBag size={12} className="text-rose-400" />;
    default: return <MoreHorizontal size={12} className="text-slate-400" />;
  }
};

interface FamilyMemberStats {
  name: string;
  totalAccounts: number;
  categories: Record<string, number>;
  lastActive?: Date;
  primaryDevice?: string; // New: Derived from details
  securityScore: number; // New: Fake metric based on account types
  topServices: string[]; // New: List of most common services
}

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMemberStats[]>([]);
  const [user, setUser] = useState<any>(null);

  // 1. Cek User Login
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch & Aggregate Data
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "accounts"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => doc.data()) as Account[];
      
      const ownerMap = new Map<string, {
        accounts: Account[];
        lastActive?: Date;
      }>();

      // Grouping Logic
      accounts.forEach(acc => {
        const ownerName = acc.owner ? acc.owner.trim() : "Unassigned";
        if (!ownerMap.has(ownerName)) {
            ownerMap.set(ownerName, { accounts: [], lastActive: undefined });
        }
        const group = ownerMap.get(ownerName)!;
        group.accounts.push(acc);

        // Check Last Active
        const accDate = acc.lastUpdated && (acc.lastUpdated as any).toDate 
          ? (acc.lastUpdated as any).toDate() 
          : new Date();
        
        if (!group.lastActive || accDate > group.lastActive) {
          group.lastActive = accDate;
        }
      });

      // Analyze per Member
      const processedMembers: FamilyMemberStats[] = [];

      ownerMap.forEach((group, name) => {
        const categoryCounts: Record<string, number> = {};
        const serviceCounts: Record<string, number> = {};
        let deviceCounts: Record<string, number> = {};
        let securityPoints = 0;

        group.accounts.forEach(acc => {
            // Categories
            categoryCounts[acc.category] = (categoryCounts[acc.category] || 0) + 1;
            
            // Services
            const svc = acc.serviceName;
            serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;

            // Devices (from metadata details)
            if (acc.details?.device) {
                deviceCounts[acc.details.device] = (deviceCounts[acc.details.device] || 0) + 1;
            }

            // Simple Security calc (Active = good, Linked = better structure)
            if (acc.status === 'ACTIVE') securityPoints += 10;
            if (acc.authMethod !== 'email') securityPoints += 5; // SSO/Linked considered managed
        });

        // Determine Top Services
        const topServices = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0]);

        // Determine Primary Device
        const primaryDevice = Object.entries(deviceCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown Device";

        // Normalize Score (0-100 visual)
        const normalizedScore = Math.min(100, Math.floor((securityPoints / (group.accounts.length * 15)) * 100)) || 0;

        processedMembers.push({
            name,
            totalAccounts: group.accounts.length,
            categories: categoryCounts,
            lastActive: group.lastActive,
            primaryDevice,
            securityScore: normalizedScore,
            topServices
        });
      });

      // Sort by total accounts desc
      processedMembers.sort((a, b) => b.totalAccounts - a.totalAccounts);

      setMembers(processedMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-[80vh] ${THEME.bg} font-mono`}>
        <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
            <Users size={24} />
            <span className="tracking-widest">SCANNING_PERSONNEL...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[85vh] ${THEME.bg} text-slate-200 font-mono space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
       {/* Header */}
       <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-cyan-950/30 rounded border border-cyan-500/20">
          <Shield className="text-cyan-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ACCESS_CONTROL_MATRIX</h1>
          <p className="text-xs text-slate-500 mt-1 tracking-widest">
            PERSONNEL_MANAGEMENT // CLEARANCE_LEVELS
          </p>
        </div>
      </div>

      {/* Grid Anggota Keluarga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.name} className={`group relative bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:-translate-y-1 flex flex-col`}>
            
            {/* Header Card */}
            <div className="p-5 border-b border-slate-800/50 flex justify-between items-start bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white tracking-wide">{member.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase">
                    <Fingerprint size={10} className="text-emerald-500" />
                    <span>ID_VERIFIED</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Assets</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">{member.totalAccounts}</span>
              </div>
            </div>

            {/* Asset Distribution (Visual Bars) */}
            <div className="p-5 space-y-4 flex-1">
               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                    <span>Portfolio_Mix</span>
                    <span className="text-cyan-500">{member.securityScore}% Secure</span>
                 </div>
                 <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
                    {Object.entries(member.categories).map(([cat, count], idx) => {
                        const width = (count / member.totalAccounts) * 100;
                        let color = "bg-slate-600";
                        if(cat === 'FINANCE' || cat === 'ECOMMERCE') color = "bg-emerald-500";
                        else if(cat === 'GAME' || cat === 'ENTERTAINMENT') color = "bg-purple-500";
                        else if(cat === 'SOCIAL') color = "bg-blue-500";
                        else if(cat === 'WORK' || cat === 'EDUCATION') color = "bg-amber-500";
                        
                        return <div key={idx} className={`h-full ${color}`} style={{ width: `${width}%` }} title={`${cat}: ${count}`} />
                    })}
                 </div>
               </div>

               {/* Stats Grid */}
               <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                        <span className="text-[9px] text-slate-500 block mb-1">PRIMARY_DEVICE</span>
                        <div className="text-[10px] text-slate-300 flex items-center gap-1 truncate" title={member.primaryDevice}>
                            <Smartphone size={10} /> {member.primaryDevice}
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50">
                        <span className="text-[9px] text-slate-500 block mb-1">TOP_SERVICE</span>
                        <div className="text-[10px] text-slate-300 truncate">
                            {member.topServices[0] || "N/A"}
                        </div>
                    </div>
               </div>

               {/* Mini Badges */}
               <div className="flex flex-wrap gap-2 pt-1">
                 {Object.entries(member.categories).slice(0, 3).map(([cat, count]) => (
                   <span key={cat} className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono rounded flex items-center gap-1.5">
                     {getCategoryIcon(cat)} {cat.substring(0, 3)}: <span className="text-white">{count}</span>
                   </span>
                 ))}
               </div>
            </div>

            {/* Footer / Action */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-950/30 flex items-center justify-between mt-auto">
              <p className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                <Activity size={10} />
                SYNC: {member.lastActive ? new Intl.DateTimeFormat('id-ID', { month: 'short', day: 'numeric' }).format(member.lastActive) : 'N/A'}
              </p>
              <Link 
                href={`/dashboard/vault?owner=${member.name}`}
                className="flex items-center gap-2 text-[10px] font-bold text-cyan-500 hover:text-cyan-300 transition-colors uppercase tracking-wider group/link"
              >
                ACCESS_VAULT <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}

        {/* Add Member Placeholder */}
        <Link href="/dashboard/vault/create" className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-600 hover:border-cyan-500/50 hover:bg-cyan-950/10 hover:text-cyan-400 transition-all cursor-pointer group min-h-[250px]">
          <div className="p-4 bg-slate-900 rounded-full mb-3 group-hover:bg-cyan-950/50 group-hover:text-cyan-400 transition-colors border border-slate-800 group-hover:border-cyan-500/30">
            <Plus size={24} />
          </div>
          <p className="font-bold text-sm uppercase tracking-wider">GRANT_NEW_ACCESS</p>
          <p className="text-[10px] mt-2 max-w-[200px] text-slate-500 group-hover:text-cyan-500/70">
            Initialize new personnel record by creating a new data entry.
          </p>
        </Link>
      </div>
    </div>
  )
}