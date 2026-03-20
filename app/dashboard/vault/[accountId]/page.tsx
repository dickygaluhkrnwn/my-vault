"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountCategory } from "@/lib/types/schema";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";
import { 
  Pencil, Copy, Check, Eye, EyeOff, Calendar, 
  Shield, User, Gamepad2, Wallet, Share2, Briefcase, Mail, 
  Music, Lock, Globe, Smartphone, Server, CreditCard, Hash, 
  Loader2, Link as LinkIcon, ExternalLink, Terminal, Cpu, 
  Activity, GraduationCap, BookOpen, Award, Percent, ShoppingBag, 
  MoreHorizontal, Clock, Key, Database, Trash2, AlertTriangle,
  Send, XCircle
} from "lucide-react";

export default function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  
  const [account, setAccount] = useState<Account | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // States untuk Fitur Share (Burn-on-Read)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Helper Copy Text
  const handleCopy = (text: string | undefined | null, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper Icon Kategori
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "GAME": return <Gamepad2 size={28} className="text-purple-500 dark:text-purple-400" />;
      case "FINANCE": return <Wallet size={28} className="text-emerald-500 dark:text-emerald-400" />;
      case "SOCIAL": return <Share2 size={28} className="text-blue-500 dark:text-blue-400" />;
      case "WORK": return <Briefcase size={28} className="text-amber-500 dark:text-amber-400" />;
      case "UTILITY": return <Mail size={28} className="text-orange-500 dark:text-orange-400" />;
      case "ENTERTAINMENT": return <Music size={28} className="text-pink-500 dark:text-pink-400" />;
      case "EDUCATION": return <GraduationCap size={28} className="text-yellow-500 dark:text-yellow-400" />;
      case "ECOMMERCE": return <ShoppingBag size={28} className="text-rose-500 dark:text-rose-400" />;
      default: return <Lock size={28} className="text-slate-400" />;
    }
  };

  // FETCH SECURE DATA
  useEffect(() => {
    if (!user) return;

    const fetchAccountData = async () => {
      try {
        const docRef = doc(db, "accounts", accountId);
        const docSnap = await getDoc(docRef);
        
        // SECURITY CHECK: Pastikan data ada dan milik user ini
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          const data = docSnap.data();
          const mainAccount = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(),
            details: data.details || {} 
          } as Account;
          
          setAccount(mainAccount);

          // Fetch Linked Accounts Secara Aman
          if (mainAccount.identifier) {
             const q = query(
               collection(db, "accounts"), 
               where("linkedEmail", "==", mainAccount.identifier),
               where("userId", "==", user.uid)
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
  }, [accountId, user, router]);

  // LOGIKA GENERATE LINK (BURN-ON-READ)
  const handleGenerateShareLink = async () => {
    if (!account || !user || isGuest) {
      if (isGuest) alert("Sesi Tamu tidak dapat membagikan tautan keamanan.");
      return;
    }
    
    setIsGeneratingLink(true);
    setGeneratedLink(null);

    try {
      // 1. Siapkan payload data yang akan dibagikan (Hanya sebagian info esensial)
      const sharePayload = {
        serviceName: account.serviceName,
        category: account.category,
        identifier: account.identifier,
        password: account.password,
        ownerName: user.displayName || user.email?.split('@')[0] || "Seseorang",
        createdAt: new Date(),
        // Link expired dalam 24 Jam
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      // 2. Simpan ke koleksi public dengan path yang aman
      const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'default-app-id';
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_links'), sharePayload);
      
      // 3. Buat URL Publik
      const origin = window.location.origin;
      const url = `${origin}/share/${docRef.id}`;
      setGeneratedLink(url);

    } catch (error) {
      console.error("Error generating link:", error);
      alert("Gagal membuat tautan. Silakan coba lagi.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "font-sans text-slate-900 dark:text-slate-100",
      panel: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm",
      innerPanel: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      accent: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600 dark:bg-blue-500",
      btnOutline: "border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm",
      btnShare: "bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md border-transparent",
      fieldBg: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm",
      modalBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl"
    },
    hacker: {
      wrapper: "font-mono text-green-500",
      panel: "bg-[#050505] border border-green-900/50 rounded-sm shadow-[0_0_20px_rgba(34,197,94,0.05)]",
      innerPanel: "bg-[#020202] border border-green-900/30 rounded-sm",
      textMain: "text-green-400",
      textSub: "text-green-700",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500",
      btnOutline: "border border-green-900/50 hover:border-green-500/50 bg-black text-green-500 rounded-sm",
      btnShare: "bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border border-purple-500/50 rounded-sm shadow-[0_0_15px_rgba(168,85,247,0.2)]",
      fieldBg: "bg-black border border-green-900/80 shadow-inner",
      modalBg: "bg-[#050505] border-purple-900/50 shadow-[0_0_30px_rgba(168,85,247,0.15)] rounded-sm"
    },
    casual: {
      wrapper: "font-sans text-stone-800 dark:text-stone-100",
      panel: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-orange-200 dark:border-stone-800 rounded-[2rem] shadow-xl shadow-orange-900/5",
      innerPanel: "bg-orange-50/50 dark:bg-stone-950/50 border border-orange-100 dark:border-stone-800 rounded-3xl",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      accent: "text-orange-500 dark:text-orange-400",
      accentBg: "bg-gradient-to-r from-orange-500 to-pink-500",
      btnOutline: "border border-orange-200 dark:border-stone-800 hover:border-orange-400 hover:text-orange-500 bg-white/50 dark:bg-stone-950/50 rounded-xl shadow-sm",
      btnShare: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md border-transparent",
      fieldBg: "bg-white dark:bg-stone-950 border border-orange-200 dark:border-stone-800 shadow-sm",
      modalBg: "bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-purple-200 dark:border-purple-900/50 shadow-2xl rounded-3xl"
    }
  };

  const cs = styles[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[80vh] font-mono", cs.textMain)}>
        <Activity size={32} className={cn("animate-pulse mb-4", cs.accent)} />
        <span className="tracking-widest animate-pulse text-sm uppercase">DECRYPTING_NODE_DATA...</span>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className={cn("min-h-[85vh] relative flex flex-col gap-6 animate-in fade-in duration-500 pb-20", cs.wrapper)}>

      {/* --- MODAL BAGIKAN LINK --- */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); if (!isGeneratingLink) setShowShareModal(false); }}>
          <div 
            className={cn("max-w-md w-full p-6 lg:p-8 space-y-6 relative overflow-hidden border", cs.modalBg)} 
            onClick={(e) => e.stopPropagation()}
          >
            {theme === 'hacker' && <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 animate-pulse" />}
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full border", theme === 'hacker' ? 'bg-purple-950/50 border-purple-900 text-purple-400' : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400')}>
                  <Share2 size={24} />
                </div>
                <div>
                  <h3 className={cn("text-lg font-bold tracking-tight", theme === 'hacker' && 'tracking-widest uppercase text-purple-400 font-mono')}>Bagikan Akses</h3>
                  <p className={cn("text-[10px] uppercase tracking-wider font-bold", cs.textSub)}>One-Time Secure Link</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} disabled={isGeneratingLink} className="opacity-50 hover:opacity-100 transition-opacity disabled:opacity-30"><XCircle size={24}/></button>
            </div>

            {!generatedLink ? (
              <>
                <p className={cn("text-sm leading-relaxed border-l-2 pl-3", theme === 'hacker' ? 'border-purple-900/50' : 'border-purple-200 dark:border-purple-900/50', cs.textSub)}>
                  Sistem akan membuat tautan rahasia yang berisi data <strong className={cs.textMain}>{account.serviceName}</strong>. 
                  <br/><br/>
                  <span className="text-red-500 font-bold font-mono text-[10px] bg-red-500/10 px-2 py-1 rounded">BURN-ON-READ PROTOCOL:</span> Tautan ini akan <strong className="text-red-500">hancur selamanya</strong> setelah 1 kali dibuka oleh penerima, atau hangus otomatis dalam 24 Jam.
                </p>

                <div className="pt-2">
                  <button 
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingLink}
                    className={cn("w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50", cs.btnShare)}
                  >
                    {isGeneratingLink ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                    {isGeneratingLink ? (theme === 'hacker' ? 'ENCRYPTING_PAYLOAD...' : 'Membuat Tautan...') : (theme === 'hacker' ? 'GENERATE_SECURE_LINK' : 'Buat Tautan Rahasia')}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                   <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2">
                     <Check size={24} strokeWidth={3} />
                   </div>
                   <h4 className={cn("font-bold text-emerald-500", theme === 'hacker' && 'font-mono uppercase tracking-wider')}>LINK BERHASIL DIBUAT</h4>
                </div>

                <div className={cn("flex items-center gap-3 p-3 md:p-4 rounded-xl relative overflow-hidden group", cs.fieldBg, theme === 'hacker' && 'rounded-sm', theme === 'casual' && 'rounded-2xl')}>
                  <div className={cn("flex-1 font-mono overflow-hidden text-xs font-medium truncate", cs.textMain)}>
                     {generatedLink}
                  </div>
                  <button 
                    onClick={() => handleCopy(generatedLink, 'share_link')}
                    className={cn("p-2 rounded-lg transition-colors bg-purple-500 text-white hover:bg-purple-600 shrink-0", theme === 'hacker' && 'rounded-sm')}
                  >
                    {copiedField === 'share_link' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <p className={cn("text-[10px] text-center uppercase tracking-widest font-bold text-red-500 mt-4")}>Peringatan: Jangan klik link Anda sendiri, atau data akan hangus!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN IDENTITY BANNER (HERO) */}
      <div className={cn("overflow-hidden relative mt-2", cs.panel)}>
        {/* Animated Top Line */}
        <div className={cn("absolute top-0 left-0 w-full h-1 lg:h-1.5", cs.accentBg)} />

        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start gap-5 md:gap-8 relative z-10">
          
          {/* Logo / Icon */}
          <div className={cn("p-4 shrink-0 flex items-center justify-center transition-colors shadow-sm", theme === 'hacker' ? 'bg-black border border-green-900/50 rounded-md' : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl', theme === 'casual' && 'rounded-[1.5rem]')}>
            {getCategoryIcon(account.category)}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
              {/* Title & Tags */}
              <div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                   <h1 className={cn("text-2xl md:text-3xl font-extrabold tracking-tight break-words uppercase", cs.textMain)}>{account.serviceName}</h1>
                   {account.status === 'BANNED' && (
                      <span className="px-3 py-1 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30 animate-pulse w-fit tracking-wider">CRITICAL_BAN</span>
                   )}
                 </div>
                 <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={cn("px-3 py-1 text-[10px] font-bold border uppercase tracking-wider font-mono", theme === 'hacker' ? 'bg-black text-green-600 border-green-900/50 rounded-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 rounded-md')}>
                      TYPE: {account.category}
                    </span>
                    <span className={cn("px-3 py-1 text-[10px] font-bold border uppercase tracking-wider font-mono rounded-md", 
                      theme === 'hacker' && 'rounded-sm',
                      account.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 
                      account.status === 'BANNED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                      'bg-slate-500/10 text-slate-500 border-slate-500/30'
                    )}>
                      STATUS: {account.status}
                    </span>
                 </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 transition-all text-xs font-bold active:scale-95", cs.btnShare)}
                >
                  <Share2 size={14} />
                  <span>{theme === 'hacker' ? 'SHARE_NODE' : 'BAGIKAN'}</span>
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/vault/edit/${account.id}`)}
                  className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 transition-all text-xs font-bold active:scale-95", cs.btnOutline)}
                >
                  <Pencil size={14} />
                  <span>{theme === 'hacker' ? 'MODIFY_NODE' : 'EDIT'}</span>
                </button>
              </div>
            </div>
            
            {/* Meta Footer of Banner */}
            <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3 text-xs pt-4 border-t mt-5 w-full", cs.textSub, theme === 'hacker' ? 'border-green-900/30 border-dashed' : 'border-slate-200 dark:border-slate-800')}>
               <span className="flex items-center gap-2">
                 <User size={14} className={cs.accent} />
                 OWNER: <span className={cn("font-bold", cs.textMain)}>{account.owner || 'Vault Pribadi'}</span>
               </span>
               {account.linkedEmail && (
                 <span className="flex items-center gap-2 max-w-full">
                   <LinkIcon size={14} className="text-purple-500 shrink-0" />
                   <span className="truncate">PARENT: <span className={cn("font-bold", cs.textMain)}>{account.linkedEmail.split('@')[0]}</span></span>
                 </span>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN CONTENT GRID (Proporsi 5:7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* KOLOM KIRI (ACCESS CREDENTIALS) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          <div className={cn("p-6 flex flex-col h-full", cs.panel)}>
            <h3 className={cn("text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b pb-3", cs.textSub, theme === 'hacker' ? 'border-green-900/30' : 'border-slate-200 dark:border-slate-800')}>
              <Shield size={16} className={cs.accent} />
              {theme === 'hacker' ? 'ACCESS_CREDENTIALS' : 'Kredensial Akses'}
            </h3>

            <div className="space-y-6 flex-1">
              {/* Identifier */}
              <div className="group">
                <label className={cn("text-[10px] font-bold mb-1.5 block ml-1 uppercase tracking-wider", cs.textSub)}>User_Identifier</label>
                <div className={cn("flex items-center gap-3 p-3.5 md:p-4 rounded-xl transition-all group-hover:border-blue-500/50", cs.fieldBg, theme === 'hacker' && 'rounded-sm group-hover:border-green-500/50', theme === 'casual' && 'rounded-2xl group-hover:border-orange-500/50')}>
                  <Terminal size={18} className={cs.textSub} />
                  <span className={cn("flex-1 font-mono break-all text-sm whitespace-normal font-medium", cs.textMain)}>{account.identifier}</span>
                  <button 
                    onClick={() => handleCopy(account.identifier, 'identifier')}
                    className={cn("p-2 rounded-lg transition-colors shrink-0", cs.textSub, "hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-500", theme === 'hacker' && 'hover:bg-green-900/30 hover:text-green-400 rounded-sm', theme === 'casual' && 'hover:bg-orange-50 dark:hover:bg-stone-800 hover:text-orange-500')}
                    title="COPY_DATA"
                  >
                    {copiedField === 'identifier' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className={cn("text-[10px] font-bold mb-1.5 block ml-1 uppercase tracking-wider", cs.textSub)}>Auth_Key / Password</label>
                <div className={cn("flex items-center gap-3 p-3.5 md:p-4 rounded-xl transition-all relative overflow-hidden group-hover:border-red-500/40", cs.fieldBg, theme === 'hacker' && 'rounded-sm', theme === 'casual' && 'rounded-2xl')}>
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500/30" />
                  
                  <Key size={18} className={cs.textSub} />
                  <div className={cn("flex-1 font-mono overflow-hidden text-sm font-medium")}>
                    {showPassword ? (
                      <span className="break-all whitespace-normal text-red-500 dark:text-red-400 animate-in fade-in">{account.password || "NULL"}</span>
                    ) : (
                      <span className={cn("tracking-[0.3em]", cs.textSub)}>**********</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 relative z-10">
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn("p-2 rounded-lg transition-colors", cs.textSub, "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white", theme === 'hacker' && 'hover:bg-green-900/30 rounded-sm')}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => handleCopy(account.password, 'password')}
                      className={cn("p-2 rounded-lg transition-colors", cs.textSub, "hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-500", theme === 'hacker' && 'hover:bg-green-900/30 hover:text-green-400 rounded-sm', theme === 'casual' && 'hover:bg-orange-50 dark:hover:bg-stone-800 hover:text-orange-500')}
                    >
                      {copiedField === 'password' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked Email Banner */}
              {account.linkedEmail && (
                <div className={cn("mt-6 p-4 rounded-xl border border-purple-500/20 flex items-start gap-4", theme === 'hacker' ? 'bg-purple-950/10 rounded-sm' : 'bg-purple-50 dark:bg-purple-950/20', theme === 'casual' && 'rounded-2xl')}>
                  <Share2 size={20} className="text-purple-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">Parent_Node_Link</h4>
                    <p className={cn("text-sm break-all font-mono whitespace-normal font-bold", cs.textMain)}>{account.linkedEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (NODE ATTRIBUTES & CONNECTIVITY) */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full">
          
          {/* Attributes Panel */}
          <div className={cn("p-6 flex flex-col h-full", cs.panel)}>
            <h3 className={cn("text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-6 border-b pb-3", cs.textSub, theme === 'hacker' ? 'border-green-900/30' : 'border-slate-200 dark:border-slate-800')}>
              <Server size={16} className="text-amber-500" />
              {theme === 'hacker' ? 'NODE_ATTRIBUTES' : 'Detail Tambahan'}
            </h3>

            <div className="space-y-2 flex-1">
              {/* Custom Fields Rendering */}
              {renderSpecificDetails(account, copiedField, handleCopy, cs, theme)}
              
              {/* GENERIC FIELDS (Fallback) */}
               {account.details && Object.entries(account.details).map(([key, value]) => {
                  const knownKeys = ['ign', 'server', 'rank', 'level', 'accountNumber', 'pinAtm', 'pinApp', 'profileUrl', 'phoneLinked', 'institution', 'course', 'progress', 'shop_name', 'paylater_limit', 'phone_linked'];
                  if (knownKeys.includes(key)) return null;

                  return (
                    <DetailRow 
                      key={key} 
                      label={key.replace(/_/g, " ").toUpperCase()} 
                      value={String(value)} 
                      icon={<MoreHorizontal size={16}/>} 
                      onCopy={() => handleCopy(String(value), key)}
                      copied={copiedField === key}
                      cs={cs}
                      theme={theme}
                    />
                  );
               })}

              {/* TAGS */}
              {account.tags && account.tags.length > 0 && (account.tags[0] !== "") && (
                <div className="pt-6 mt-4 border-t border-dashed border-inherit">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-3 block", cs.textSub)}>DATA_FLAGS (Tags)</span>
                  <div className="flex flex-wrap gap-2">
                    {account.tags.map((tag, idx) => (
                      <span key={idx} className={cn("px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border", theme === 'hacker' ? 'bg-black text-green-600 border-green-900/50 rounded-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 rounded-md')}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONNECTIVITY MATRIX (FULL WIDTH BOTTOM) --- */}
      {connectedAccounts.length > 0 && (
        <div className={cn("p-6 md:p-8 mt-2", cs.innerPanel)}>
          <h3 className={cn("text-xs font-bold flex items-center gap-2 mb-6 uppercase tracking-[0.2em]", cs.textSub)}>
              <LinkIcon size={16} className="text-purple-500" />
              LINKED_SUBSYSTEMS ({connectedAccounts.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {connectedAccounts.map((child) => (
                <Link href={`/dashboard/vault/${child.id}`} key={child.id} className={cn("flex items-center gap-4 p-4 border transition-all group", cs.fieldBg, theme !== 'casual' && 'rounded-xl', theme === 'hacker' && 'rounded-sm', theme === 'casual' && 'rounded-2xl', "hover:border-purple-500/50 hover:shadow-md")}>
                    <div className={cn("p-2.5 rounded-lg border transition-colors shrink-0", theme === 'hacker' ? 'bg-black border-green-900/50 group-hover:border-purple-500/30' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-purple-200 dark:group-hover:border-purple-900/50')}>
                        {getCategoryIcon(child.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={cn("font-bold text-sm truncate transition-colors", cs.textMain, "group-hover:text-purple-500")}>{child.serviceName}</p>
                        <p className={cn("text-[10px] font-mono font-bold truncate mt-0.5", cs.textSub)}>{child.category}</p>
                    </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* FOOTER METADATA */}
      <div className={cn("px-6 py-4 flex flex-col sm:flex-row justify-between text-[10px] font-mono gap-4 font-bold tracking-wider", cs.textSub, cs.innerPanel)}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-2">
            <Calendar size={14} />
            INIT: <span className={cs.textMain}>{formatDate(account.createdAt)}</span>
          </span>
          <span className="flex items-center gap-2">
            <Pencil size={14} />
            MOD: <span className={cs.textMain}>{formatDate(account.lastUpdated)}</span>
          </span>
        </div>
        <div className="truncate flex items-center gap-2">
          <Database size={14} /> NODE_ID: <span className="opacity-70">{account.id}</span>
        </div>
      </div>

    </div>
  );
}

// --- SUB COMPONENTS ---

function renderSpecificDetails(account: Account, copiedField: string | null, handleCopy: any, cs: any, theme: string) {
    if (!account.details) return null;
    const d = account.details as any;

    if (account.category === "UTILITY") {
        return (
            <>
                {account.birthDate && <DetailRow label="DOB_RECORD" value={formatDate(account.birthDate)} icon={<Calendar size={16}/>} cs={cs} theme={theme} />}
                {account.gender && <DetailRow label="GENDER_ID" value={account.gender} icon={<User size={16}/>} cs={cs} theme={theme} />}
                {d.phoneLinked && <DetailRow label="RECOVERY_COMMS" value={d.phoneLinked} icon={<Smartphone size={16}/>} onCopy={() => handleCopy(d.phoneLinked, 'phone')} copied={copiedField === 'phone'} cs={cs} theme={theme} />}
            </>
        );
    }
    if (account.category === "EDUCATION") {
        return (
            <>
                {d.institution && <DetailRow label="INSTITUTION" value={d.institution} icon={<GraduationCap size={16}/>} cs={cs} theme={theme} />}
                {d.course && <DetailRow label="COURSE_MODULE" value={d.course} icon={<BookOpen size={16}/>} cs={cs} theme={theme} />}
                {d.level && <DetailRow label="CURRENT_LEVEL" value={d.level} icon={<Award size={16}/>} cs={cs} theme={theme} />}
                {d.progress && <DetailRow label="PROGRESS_PCT" value={d.progress} icon={<Percent size={16}/>} cs={cs} theme={theme} />}
            </>
        );
    }
    if (account.category === "ECOMMERCE") {
        return (
            <>
                {d.shop_name && <DetailRow label="SHOP_IDENTIFIER" value={d.shop_name} icon={<ShoppingBag size={16}/>} cs={cs} theme={theme} />}
                {d.paylater_limit && <DetailRow label="PAYLATER_CAP" value={d.paylater_limit} icon={<CreditCard size={16}/>} cs={cs} theme={theme} />}
                {d.phone_linked && <DetailRow label="LINKED_MOBILE" value={d.phone_linked} icon={<Smartphone size={16}/>} cs={cs} theme={theme} />}
            </>
        );
    }
    if (account.category === "GAME") {
        return (
            <>
                {d.ign && <DetailRow label="IGN_HANDLE" value={d.ign} icon={<User size={16}/>} onCopy={() => handleCopy(d.ign, 'ign')} copied={copiedField === 'ign'} cs={cs} theme={theme} />}
                {d.server && <DetailRow label="SERVER_REGION" value={d.server} icon={<Globe size={16}/>} cs={cs} theme={theme} />}
                {d.rank && <DetailRow label="COMPETITIVE_RANK" value={d.rank} icon={<Activity size={16}/>} cs={cs} theme={theme} />}
                {d.level && <DetailRow label="LEVEL_IND" value={d.level} icon={<Activity size={16}/>} cs={cs} theme={theme} />}
            </>
        );
    }
    if (account.category === "FINANCE") {
        return (
            <>
                {d.accountNumber && <DetailRow label="ACC_NUMBER" value={d.accountNumber} icon={<CreditCard size={16}/>} onCopy={() => handleCopy(d.accountNumber, 'norek')} copied={copiedField === 'norek'} cs={cs} theme={theme} />}
                {d.pinAtm && <DetailRow label="ATM_PIN_CODE" value={d.pinAtm} icon={<Hash size={16}/>} isSecret onCopy={() => handleCopy(d.pinAtm, 'pinAtm')} copied={copiedField === 'pinAtm'} cs={cs} theme={theme} />}
                {d.pinApp && <DetailRow label="APP_ACCESS_PIN" value={d.pinApp} icon={<Smartphone size={16}/>} isSecret onCopy={() => handleCopy(d.pinApp, 'pinApp')} copied={copiedField === 'pinApp'} cs={cs} theme={theme} />}
            </>
        );
    }
    if (account.category === "SOCIAL") {
        return (
            <>
                {d.profileUrl && (
                    <div className={cn("flex flex-col py-3 border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors group/row", theme === 'hacker' ? 'border-green-900/30 hover:bg-green-900/10 rounded-sm' : 'border-slate-200 dark:border-slate-800/50')}>
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider", cs.textSub)}>PROFILE_URL_LINK</span>
                        <a href={d.profileUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2 mt-1 font-mono break-all whitespace-normal text-sm font-medium transition-colors", cs.accent, "hover:opacity-70")}>
                            <ExternalLink size={14} className="shrink-0" />
                            {d.profileUrl}
                        </a>
                    </div>
                )}
                {d.phoneLinked && <DetailRow label="LINKED_MOBILE" value={d.phoneLinked} icon={<Smartphone size={16}/>} onCopy={() => handleCopy(d.phoneLinked, 'phone')} copied={copiedField === 'phone'} cs={cs} theme={theme} />}
            </>
        );
    }
    return null;
}

function DetailRow({ label, value, icon, onCopy, copied, isSecret, cs, theme }: any) {
  const lowerLabel = String(label).toLowerCase();
  const isActuallySecret = isSecret || lowerLabel.includes('pin') || lowerLabel.includes('pass') || lowerLabel.includes('secret') || lowerLabel.includes('key') || lowerLabel.includes('token');
  const [show, setShow] = useState(!isActuallySecret);
  
  if (isActuallySecret) {
    return (
      <div className="group mb-4 last:mb-0">
        <label className={cn("text-[10px] font-bold mb-1.5 block ml-1 uppercase tracking-wider", cs.textSub)}>{label}</label>
        <div className={cn("flex items-center gap-3 p-3.5 md:p-4 rounded-xl transition-all relative overflow-hidden group-hover:border-red-500/40", cs.fieldBg, theme === 'hacker' && 'rounded-sm', theme === 'casual' && 'rounded-2xl')}>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500/30" />
          
          <span className={cn("shrink-0 opacity-50", cs.textSub)}>{icon}</span>
          <div className={cn("flex-1 font-mono overflow-hidden text-sm font-medium")}>
            {show ? (
              <span className="break-all whitespace-normal text-red-500 dark:text-red-400 animate-in fade-in">{value || "NULL"}</span>
            ) : (
              <span className={cn("tracking-[0.3em]", cs.textSub)}>**********</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 relative z-10">
            <button 
              onClick={() => setShow(!show)}
              className={cn("p-2 rounded-lg transition-colors", cs.textSub, "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white", theme === 'hacker' && 'hover:bg-green-900/30 rounded-sm')}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {onCopy && (
              <button 
                onClick={onCopy}
                className={cn("p-2 rounded-lg transition-colors", cs.textSub, "hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-500", theme === 'hacker' && 'hover:bg-green-900/30 hover:text-green-400 rounded-sm', theme === 'casual' && 'hover:bg-orange-50 dark:hover:bg-stone-800 hover:text-orange-500')}
                title="COPY"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col py-3.5 border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors group/row", theme === 'hacker' ? 'border-green-900/30 hover:bg-green-900/10 rounded-sm' : 'border-slate-200 dark:border-slate-800/50')}>
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", cs.textSub)}>{label}</span>
      <div className="flex items-center gap-3 mt-1.5">
        <span className={cn("shrink-0", cs.textSub)}>{icon}</span>
        <span className={cn("font-mono flex-1 text-sm break-all whitespace-pre-wrap font-medium", cs.textMain)}>
          {value}
        </span>
        
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
            {onCopy && (
              <button onClick={onCopy} className={cn("p-1.5 rounded transition-colors", cs.textSub, "hover:bg-blue-100 dark:hover:bg-slate-800 hover:text-blue-500", theme === 'hacker' && 'hover:bg-green-900/30 hover:text-green-400', theme === 'casual' && 'hover:bg-orange-100 hover:text-orange-500')} title="COPY">
                {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}