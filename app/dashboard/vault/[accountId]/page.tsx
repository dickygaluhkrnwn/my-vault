"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account } from "@/lib/types/schema";
import { 
  ArrowLeft, 
  Pencil, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  Shield, 
  User, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  Lock,
  Globe,
  Smartphone,
  Server,
  CreditCard,
  Hash,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Terminal,
  Cpu,
  Activity,
  HardDrive
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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

export default function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const router = useRouter();
  
  const [account, setAccount] = useState<Account | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Helper Copy Text
  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper Icon Kategori
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "GAME": return <Gamepad2 size={24} className="text-purple-400" />;
      case "FINANCE": return <Wallet size={24} className="text-emerald-400" />;
      case "SOCIAL": return <Share2 size={24} className="text-blue-400" />;
      case "WORK": return <Briefcase size={24} className="text-amber-400" />;
      case "UTILITY": return <Mail size={24} className="text-orange-400" />;
      case "ENTERTAINMENT": return <Music size={24} className="text-pink-400" />;
      default: return <Lock size={24} className="text-slate-400" />;
    }
  };

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const docRef = doc(db, "accounts", accountId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mainAccount = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(),
          } as Account;
          
          setAccount(mainAccount);

          if (mainAccount.identifier) {
             const q = query(
                collection(db, "accounts"), 
                where("linkedEmail", "==", mainAccount.identifier)
             );
             const linkedSnap = await getDocs(q);
             const children = linkedSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as Account))
                .filter(a => a.id !== mainAccount.id);
             
             setConnectedAccounts(children);
          }

        } else {
          router.push("/dashboard/vault");
        }
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountData();
  }, [accountId, router]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-[80vh] ${THEME.bg} font-mono`}>
        <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
            <Cpu size={32} />
            <span className="tracking-widest">ACCESSING_NODE_DATA...</span>
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className={`min-h-screen ${THEME.bg} text-slate-200 font-mono pb-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors px-3 py-2 rounded group text-xs font-bold tracking-wider"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {'<<'} RETURN_TO_GRID
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/dashboard/vault/edit/${account.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all text-xs font-bold"
          >
            <Pencil size={14} />
            // MODIFY_NODE
          </button>
        </div>
      </div>

      {/* MAIN IDENTITY CARD */}
      <div className={`rounded-xl border ${THEME.border} ${THEME.panel} overflow-hidden relative shadow-2xl`}>
        
        {/* Animated Top Line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

        {/* Banner Header */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 border-b border-slate-800 bg-slate-900/80">
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            {getCategoryIcon(account.category)}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
               <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-3xl font-bold text-white tracking-tight truncate uppercase">{account.serviceName}</h1>
                 {account.status === 'BANNED' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/50 text-red-500 border border-red-900 animate-pulse">CRITICAL_BAN</span>
                 )}
               </div>
               <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                    TYPE: {account.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                    account.status === 'ACTIVE' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900' : 
                    account.status === 'BANNED' ? 'bg-red-950/30 text-red-400 border-red-900' :
                    'bg-slate-800 text-slate-500 border-slate-700'
                  }`}>
                    STATUS: {account.status}
                  </span>
               </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-800 mt-2 border-dashed w-fit">
               <span className="flex items-center gap-1.5">
                 <User size={12} className="text-cyan-600" />
                 OWNER_ID: <span className="text-cyan-400 font-bold">{account.owner}</span>
               </span>
               {account.linkedEmail && (
                 <span className="flex items-center gap-1.5 hidden sm:flex">
                   <LinkIcon size={12} className="text-purple-500" />
                   PARENT_LINK: <span className="text-slate-300">{account.linkedEmail.split('@')[0]}</span>
                 </span>
               )}
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* LEFT: ACCESS CREDENTIALS */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <Shield size={14} className="text-cyan-500" />
              ACCESS_CREDENTIALS
            </h3>

            {/* Identifier */}
            <div className="group">
              <label className="text-[10px] text-slate-500 font-bold mb-1 block ml-1 uppercase">User_Identifier</label>
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded border border-slate-800 group-hover:border-cyan-500/50 transition-all shadow-inner">
                <Terminal size={16} className="text-slate-600" />
                <span className="flex-1 font-mono text-cyan-300 break-all text-sm">{account.identifier}</span>
                <button 
                  onClick={() => handleCopy(account.identifier, 'identifier')}
                  className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                  title="COPY_DATA"
                >
                  {copiedField === 'identifier' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="text-[10px] text-slate-500 font-bold mb-1 block ml-1 uppercase">Auth_Key / PIN</label>
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded border border-slate-800 group-hover:border-red-500/30 transition-all shadow-inner relative overflow-hidden">
                {/* Red glow for security */}
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500/20" />
                
                <Lock size={16} className="text-slate-600" />
                <div className="flex-1 font-mono text-slate-300 overflow-hidden text-sm">
                  {showPassword ? (
                    <span className="break-all text-red-300 animate-in fade-in">{account.password || "NULL"}</span>
                  ) : (
                    <span className="tracking-[0.3em] text-slate-600">**********</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button 
                    onClick={() => handleCopy(account.password, 'password')}
                    className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    {copiedField === 'password' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Linked Email Banner */}
            {account.linkedEmail && (
              <div className="mt-4 p-3 bg-purple-950/20 rounded border border-purple-500/20 flex items-start gap-3">
                <Share2 size={16} className="text-purple-400 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-1">Parent_Node_Link</h4>
                  <p className="text-xs text-purple-200/70 break-all font-mono">{account.linkedEmail}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: NODE ATTRIBUTES */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <Server size={14} className="text-amber-500" />
              NODE_ATTRIBUTES
            </h3>

            <div className="space-y-2">
              {/* UTILITY SPECIFIC */}
              {account.category === "UTILITY" && (
                <>
                  {account.birthDate && <DetailRow label="DOB_RECORD" value={formatDate(account.birthDate)} icon={<Calendar size={14}/>} />}
                  {account.gender && <DetailRow label="GENDER_ID" value={account.gender} icon={<User size={14}/>} />}
                  {account.details && 'phoneLinked' in account.details && (account.details as any).phoneLinked && (
                    <DetailRow label="RECOVERY_COMMS" value={(account.details as any).phoneLinked} icon={<Smartphone size={14}/>} onCopy={() => handleCopy((account.details as any).phoneLinked, 'phone')} copied={copiedField === 'phone'} />
                  )}
                </>
              )}

              {/* GAME SPECIFIC */}
              {account.category === "GAME" && account.details && (
                <>
                  {'ign' in account.details && (account.details as any).ign && (
                    <DetailRow label="IGN_HANDLE" value={(account.details as any).ign} icon={<User size={14}/>} onCopy={() => handleCopy((account.details as any).ign, 'ign')} copied={copiedField === 'ign'} />
                  )}
                  {'server' in account.details && (account.details as any).server && (
                    <DetailRow label="SERVER_REGION" value={(account.details as any).server} icon={<Globe size={14}/>} />
                  )}
                  {'rank' in account.details && (account.details as any).rank && (
                    <DetailRow label="COMPETITIVE_RANK" value={(account.details as any).rank} icon={<Activity size={14}/>} />
                  )}
                  {'level' in account.details && (account.details as any).level && (
                    <DetailRow label="LEVEL_IND" value={(account.details as any).level} icon={<ArrowLeft size={14} className="rotate-90"/>} />
                  )}
                </>
              )}

              {/* FINANCE SPECIFIC */}
              {account.category === "FINANCE" && account.details && (
                <>
                  {'accountNumber' in account.details && (account.details as any).accountNumber && (
                    <DetailRow label="ACC_NUMBER" value={(account.details as any).accountNumber} icon={<CreditCard size={14}/>} onCopy={() => handleCopy((account.details as any).accountNumber, 'norek')} copied={copiedField === 'norek'} />
                  )}
                  {'pinAtm' in account.details && (account.details as any).pinAtm && (
                    <DetailRow label="ATM_PIN_CODE" value={(account.details as any).pinAtm} icon={<Hash size={14}/>} isSecret />
                  )}
                  {'pinApp' in account.details && (account.details as any).pinApp && (
                    <DetailRow label="APP_ACCESS_PIN" value={(account.details as any).pinApp} icon={<Smartphone size={14}/>} isSecret />
                  )}
                </>
              )}

              {/* SOCIAL SPECIFIC */}
              {(account.category === "SOCIAL") && account.details && (
                <>
                  {'profileUrl' in account.details && (account.details as any).profileUrl && (
                    <div className="flex flex-col py-2 border-b border-slate-800/50 last:border-0">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">PROFILE_URL_LINK</span>
                      <a href={(account.details as any).profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-blue-400 hover:text-blue-300 text-xs font-mono truncate">
                        <ExternalLink size={12} />
                        {(account.details as any).profileUrl}
                      </a>
                    </div>
                  )}
                  {'phoneLinked' in account.details && (account.details as any).phoneLinked && (
                    <DetailRow label="LINKED_MOBILE" value={(account.details as any).phoneLinked} icon={<Smartphone size={14}/>} onCopy={() => handleCopy((account.details as any).phoneLinked, 'phone')} copied={copiedField === 'phone'} />
                  )}
                </>
              )}

              {/* TAGS */}
              {account.tags && account.tags.length > 0 && (account.tags[0] !== "") && (
                <div className="pt-4 mt-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">DATA_FLAGS</span>
                  <div className="flex flex-wrap gap-2">
                    {account.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- CONNECTIVITY MATRIX --- */}
        {connectedAccounts.length > 0 && (
          <div className="border-t border-slate-800 bg-slate-950/30 p-6 md:p-8">
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
               <LinkIcon size={14} className="text-purple-500" />
               LINKED_SUBSYSTEMS ({connectedAccounts.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               {connectedAccounts.map((child) => (
                  <Link href={`/dashboard/vault/${child.id}`} key={child.id} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                     <div className="text-slate-600 group-hover:text-cyan-400 transition-colors">
                        {getCategoryIcon(child.category)}
                     </div>
                     <div className="min-w-0">
                        <p className="font-bold text-slate-300 text-xs truncate group-hover:text-cyan-300">{child.serviceName}</p>
                        <p className="text-[10px] text-slate-600 font-mono truncate">{child.category}</p>
                     </div>
                  </Link>
               ))}
            </div>
          </div>
        )}

        {/* FOOTER METADATA */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between text-[10px] text-slate-600 font-mono gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock size={10} />
              INIT: {formatDate(account.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Pencil size={10} />
              MOD: {formatDate(account.lastUpdated)}
            </span>
          </div>
          <div>ID: <span className="text-slate-500">{account.id}</span></div>
        </div>
      </div>
    </div>
  );
}

// Component Kecil untuk Baris Detail
function DetailRow({ label, value, icon, onCopy, copied, isSecret }: any) {
  const [show, setShow] = useState(!isSecret);
  
  return (
    <div className="flex flex-col py-2 border-b border-slate-800/50 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded transition-colors">
      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-slate-600">{icon}</span>
        <span className="font-mono text-slate-300 flex-1 truncate text-xs">
          {isSecret && !show ? "********" : value}
        </span>
        
        {isSecret && (
          <button onClick={() => setShow(!show)} className="text-slate-600 hover:text-slate-300 px-1">
            {show ? <EyeOff size={12}/> : <Eye size={12}/>}
          </button>
        )}
        
        {onCopy && (
          <button onClick={onCopy} className="text-slate-600 hover:text-cyan-400 px-1" title="COPY">
            {copied ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}
          </button>
        )}
      </div>
    </div>
  );
}