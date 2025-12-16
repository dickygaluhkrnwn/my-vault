"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account } from "@/lib/types/schema";
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  ShieldCheck, 
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
  Loader2
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const router = useRouter();
  
  const [account, setAccount] = useState<Account | null>(null);
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
      case "GAME": return <Gamepad2 size={32} className="text-purple-600" />;
      case "FINANCE": return <Wallet size={32} className="text-emerald-600" />;
      case "SOCIAL": return <Share2 size={32} className="text-blue-600" />;
      case "WORK": return <Briefcase size={32} className="text-slate-600" />;
      case "UTILITY": return <Mail size={32} className="text-orange-600" />;
      case "ENTERTAINMENT": return <Music size={32} className="text-pink-600" />;
      default: return <Lock size={32} className="text-gray-600" />;
    }
  };

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const docRef = doc(db, "accounts", accountId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAccount({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(),
          } as Account);
        } else {
          router.push("/dashboard/vault");
        }
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [accountId, router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6">
      
      {/* HEADER NAVIGASI */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Kembali</span>
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/dashboard/vault/edit/${account.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* KARTU UTAMA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            {getCategoryIcon(account.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{account.serviceName}</h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                  {account.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  account.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {account.status}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <User size={14} />
              Milik: <span className="font-semibold text-slate-700">{account.owner}</span>
            </p>
          </div>
        </div>

        {/* ISI KONTEN */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* KOLOM KIRI: KREDENSIAL UTAMA */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} />
              Kredensial Login
            </h3>

            {/* Identifier / Email */}
            <div className="group relative">
              <label className="text-xs text-slate-500 font-medium mb-1 block">Identifier / Email / Username</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors">
                <Mail size={18} className="text-slate-400" />
                <span className="flex-1 font-mono text-slate-800 break-all">{account.identifier}</span>
                <button 
                  onClick={() => handleCopy(account.identifier, 'identifier')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Salin"
                >
                  {copiedField === 'identifier' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="group relative">
              <label className="text-xs text-slate-500 font-medium mb-1 block">Password / PIN</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors">
                <Lock size={18} className="text-slate-400" />
                <div className="flex-1 font-mono text-slate-800 overflow-hidden">
                  {showPassword ? (
                    <span className="break-all">{account.password || "-"}</span>
                  ) : (
                    <span className="tracking-widest text-slate-400">••••••••••</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => handleCopy(account.password, 'password')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Salin"
                  >
                    {copiedField === 'password' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Linked Email */}
            {account.linkedEmail && (
              <div className="group relative">
                <label className="text-xs text-slate-500 font-medium mb-1 block">Terhubung Dengan (Induk)</label>
                <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  <Share2 size={18} className="text-indigo-400" />
                  <span className="flex-1 font-medium text-indigo-900 break-all text-sm">{account.linkedEmail}</span>
                </div>
              </div>
            )}
          </div>

          {/* KOLOM KANAN: DETAIL KHUSUS */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Server size={16} />
              Informasi Detail
            </h3>

            <div className="space-y-4">
              {/* UTILITY SPECIFIC (Birthday & Gender) */}
              {account.category === "UTILITY" && (
                <>
                  {account.birthDate && (
                    <div className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-500">Tanggal Lahir</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-800">{formatDate(account.birthDate)}</span>
                      </div>
                    </div>
                  )}
                  {account.gender && (
                    <div className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-500">Jenis Kelamin</span>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {account.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Phone Linked */}
                  {account.details && 'phoneLinked' in account.details && (account.details as any).phoneLinked && (
                    <div className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-500">No. HP Pemulihan</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Smartphone size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-800 font-mono">{(account.details as any).phoneLinked}</span>
                        <button onClick={() => handleCopy((account.details as any).phoneLinked, 'phone')} className="ml-auto text-slate-400 hover:text-blue-600"><Copy size={14}/></button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* GAME SPECIFIC */}
              {account.category === "GAME" && account.details && (
                <>
                  {'ign' in account.details && (account.details as any).ign && (
                    <DetailRow label="IGN (In-Game Name)" value={(account.details as any).ign} icon={<User size={16}/>} onCopy={() => handleCopy((account.details as any).ign, 'ign')} copied={copiedField === 'ign'} />
                  )}
                  {'server' in account.details && (account.details as any).server && (
                    <DetailRow label="Server / Region" value={(account.details as any).server} icon={<Globe size={16}/>} />
                  )}
                  {'rank' in account.details && (account.details as any).rank && (
                    <DetailRow label="Rank / Liga" value={(account.details as any).rank} icon={<ShieldCheck size={16}/>} />
                  )}
                  {'level' in account.details && (account.details as any).level && (
                    <DetailRow label="Level / TH" value={(account.details as any).level} icon={<ArrowLeft size={16} className="rotate-90"/>} />
                  )}
                </>
              )}

              {/* FINANCE SPECIFIC */}
              {account.category === "FINANCE" && account.details && (
                <>
                  {'accountNumber' in account.details && (account.details as any).accountNumber && (
                    <DetailRow label="Nomor Rekening" value={(account.details as any).accountNumber} icon={<CreditCard size={16}/>} onCopy={() => handleCopy((account.details as any).accountNumber, 'norek')} copied={copiedField === 'norek'} />
                  )}
                  {'pinAtm' in account.details && (account.details as any).pinAtm && (
                    <DetailRow label="PIN ATM" value={(account.details as any).pinAtm} icon={<Hash size={16}/>} isSecret />
                  )}
                  {'pinApp' in account.details && (account.details as any).pinApp && (
                    <DetailRow label="PIN Aplikasi" value={(account.details as any).pinApp} icon={<Smartphone size={16}/>} isSecret />
                  )}
                </>
              )}

              {/* SOCIAL SPECIFIC */}
              {(account.category === "SOCIAL") && account.details && (
                <>
                  {'profileUrl' in account.details && (account.details as any).profileUrl && (
                    <div className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-500">Link Profil</span>
                      <a href={(account.details as any).profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium mt-1 truncate block">
                        {(account.details as any).profileUrl}
                      </a>
                    </div>
                  )}
                  {'phoneLinked' in account.details && (account.details as any).phoneLinked && (
                    <DetailRow label="No. HP Terkait" value={(account.details as any).phoneLinked} icon={<Smartphone size={16}/>} onCopy={() => handleCopy((account.details as any).phoneLinked, 'phone')} copied={copiedField === 'phone'} />
                  )}
                </>
              )}

              {/* TAGS */}
              {account.tags && account.tags.length > 0 && (account.tags[0] !== "") && (
                <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                  <span className="text-xs text-slate-500 mb-2 block">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {account.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Dibuat: {formatDate(account.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Pencil size={12} />
              Update: {formatDate(account.lastUpdated)}
            </span>
          </div>
          <div>ID: <span className="font-mono">{account.id}</span></div>
        </div>
      </div>
    </div>
  );
}

// Component Kecil untuk Baris Detail
function DetailRow({ label, value, icon, onCopy, copied, isSecret }: any) {
  const [show, setShow] = useState(!isSecret);
  
  return (
    <div className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-slate-400">{icon}</span>
        <span className="font-medium text-slate-800 flex-1 truncate">
          {isSecret && !show ? "••••••" : value}
        </span>
        
        {isSecret && (
          <button onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600 px-1">
            {show ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        )}
        
        {onCopy && (
          <button onClick={onCopy} className="text-slate-400 hover:text-blue-600 px-1" title="Salin">
            {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
          </button>
        )}
      </div>
    </div>
  );
}