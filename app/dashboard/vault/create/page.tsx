"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AccountCategory, AccountStatus } from "@/lib/types/schema";
import { 
  Save, 
  ArrowLeft, 
  Gamepad2, 
  Wallet, 
  Share2, 
  Briefcase, 
  Mail, 
  Music, 
  Loader2,
  ShieldAlert,
  Calendar,
  User,
  Terminal,
  Cpu,
  ChevronRight,
  Database,
  GraduationCap
} from "lucide-react";

// --- THEME CONFIG ---
const THEME = {
  bg: "bg-slate-950",
  panel: "bg-slate-900/50",
  border: "border-slate-800",
  accent: "text-cyan-400",
  accentBorder: "border-cyan-500/30",
  textMain: "text-slate-200",
  textDim: "text-slate-500",
  inputBg: "bg-slate-950",
};

// Opsi Kategori (Updated with EDUCATION)
const CATEGORIES: { label: string; value: AccountCategory; icon: any }[] = [
  { label: "SOCIAL_MEDIA", value: "SOCIAL", icon: Share2 },
  { label: "GAME_HUB", value: "GAME", icon: Gamepad2 },
  { label: "FINANCIAL", value: "FINANCE", icon: Wallet },
  { label: "WORKSTATION", value: "WORK", icon: Briefcase },
  { label: "UTILITY/MAIL", value: "UTILITY", icon: Mail },
  { label: "ENTERTAINMENT", value: "ENTERTAINMENT", icon: Music },
  { label: "EDUCATION", value: "EDUCATION", icon: GraduationCap },
];

// Opsi Pemilik
const OWNERS = ["Dicky", "Ibu", "Ayah", "Adik", "Mase", "Keluarga"];

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // State Utama
  const [formData, setFormData] = useState({
    serviceName: "",
    category: "SOCIAL" as AccountCategory,
    identifier: "",
    password: "",
    linkedEmail: "", 
    owner: "Dicky",
    status: "ACTIVE" as AccountStatus,
    tags: "", 
    birthDate: "", 
    gender: ""     
  });

  // State Detail (Expanded for Education)
  const [details, setDetails] = useState({
    ign: "",
    server: "",
    rank: "",
    level: "",
    accountNumber: "",
    pinAtm: "",
    pinApp: "",
    profileUrl: "",
    phoneLinked: "",
    quotaTotalGB: "",
    // Education Fields
    institution: "",
    course: "",
    progress: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanDetails: any = {};
      Object.entries(details).forEach(([key, value]) => {
        if (value) cleanDetails[key] = value;
      });

      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(t => t),
        details: cleanDetails,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      };

      await addDoc(collection(db, "accounts"), payload);
      router.push("/dashboard/vault");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("SYSTEM ERROR: WRITE_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto pb-20 space-y-6 font-mono text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-slate-900 rounded transition-colors group border border-transparent hover:border-slate-800"
        >
          <ArrowLeft size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database size={20} className="text-cyan-400" />
            DATA_INJECTION_PROTOCOL
          </h1>
          <p className="text-xs text-slate-500 tracking-widest mt-1">
            ESTABLISHING NEW SECURE RECORD...
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: CORE METADATA */}
        <div className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-6 relative overflow-hidden`}>
          {/* Decorative Line */}
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20" />
          
          <h3 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert size={16} />
            CORE_METADATA
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">SERVICE_NAME</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all">
                <span className="text-slate-600 mr-2">{'>'}</span>
                <input 
                  required
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  placeholder="Ex: Main_Google_Account" 
                  className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-700"
                />
              </div>
            </div>
            
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">DATA_CATEGORY</label>
              <div className="relative">
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 appearance-none text-slate-300"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">ACCESS_OWNER</label>
              <select 
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 text-slate-300"
              >
                {OWNERS.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">INTEGRITY_STATUS</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 text-slate-300"
              >
                <option value="ACTIVE">ACTIVE [SECURE]</option>
                <option value="BANNED">BANNED [CRITICAL]</option>
                <option value="SUSPENDED">SUSPENDED [WARNING]</option>
                <option value="INACTIVE">INACTIVE [ARCHIVED]</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACCESS CREDENTIALS */}
        <div className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20" />
          
          <h3 className="text-sm font-bold text-purple-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
            <Terminal size={16} />
            LOGIN_CREDENTIALS
          </h3>

          <div className="space-y-4">
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-400 transition-colors">IDENTIFIER / USERNAME</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-purple-500/50 focus-within:shadow-[0_0_10px_rgba(168,85,247,0.1)] transition-all">
                <Mail size={14} className="text-slate-600 mr-2" />
                <input 
                  required
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="user@domain.com" 
                  className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-400 transition-colors">ENCRYPTED_KEY (PASSWORD)</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-purple-500/50 focus-within:shadow-[0_0_10px_rgba(168,85,247,0.1)] transition-all">
                <Cpu size={14} className="text-slate-600 mr-2" />
                <input 
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-transparent border-none outline-none w-full text-sm text-purple-300 font-mono tracking-wider"
                  placeholder="Input_Secret_Key..."
                />
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800 border-dashed group">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2 group-focus-within:text-purple-400 transition-colors">
                <Share2 size={12} />
                PARENT_NODE_LINK (EMAIL)
              </label>
              <input 
                type="email"
                name="linkedEmail"
                value={formData.linkedEmail}
                onChange={handleInputChange}
                placeholder="root_email@domain.com" 
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-purple-500/50 placeholder:text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: EXTENDED ATTRIBUTES */}
        <div className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
          
          <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2 flex justify-between uppercase tracking-wider">
            <span>EXTENDED_ATTRIBUTES [{formData.category}]</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* UTILITY FIELDS */}
            {formData.category === "UTILITY" && (
              <>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400 flex items-center gap-2">
                    <Calendar size={12} /> DOB_RECORD
                  </label>
                  <input 
                    type="date" 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 text-slate-300"
                  />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400 flex items-center gap-2">
                    <User size={12} /> GENDER_ID
                  </label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 text-slate-300"
                  >
                    <option value="">-- SELECT --</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2 group">
                   <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">RECOVERY_PHONE</label>
                   <input 
                    name="phoneLinked" 
                    value={details.phoneLinked} 
                    onChange={handleDetailChange} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" 
                    placeholder="08..." 
                   />
                </div>
              </>
            )}

            {/* EDUCATION FIELDS */}
            {formData.category === "EDUCATION" && (
              <>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400">INSTITUTION</label>
                  <input name="institution" value={details.institution} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 placeholder:text-slate-700" placeholder="Busuu, Udemy..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400">COURSE_NAME</label>
                  <input name="course" value={details.course} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 placeholder:text-slate-700" placeholder="English B2..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400">CURRENT_LEVEL</label>
                  <input name="level" value={details.level} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 placeholder:text-slate-700" placeholder="Intermediate..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400">PROGRESS_PCT</label>
                  <input name="progress" value={details.progress} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 placeholder:text-slate-700" placeholder="50%..." />
                </div>
              </>
            )}

            {/* GAME FIELDS */}
            {formData.category === "GAME" && (
              <>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">IGN_HANDLE</label>
                  <input name="ign" value={details.ign} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="Nick..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">SERVER_REGION</label>
                  <input name="server" value={details.server} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="Asia/Global..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">COMPETITIVE_RANK</label>
                  <input name="rank" value={details.rank} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="Rank..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">LEVEL_INDEX</label>
                  <input name="level" value={details.level} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="Lvl..." />
                </div>
              </>
            )}

            {/* FINANCE FIELDS */}
            {formData.category === "FINANCE" && (
              <>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">ACCOUNT_NUMBER</label>
                  <input name="accountNumber" value={details.accountNumber} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="XXXX-XXXX..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">ATM_PIN</label>
                  <input name="pinAtm" value={details.pinAtm} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="******" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">APP_PIN</label>
                  <input name="pinApp" value={details.pinApp} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="******" />
                </div>
              </>
            )}

            {/* SOCIAL FIELDS */}
            {formData.category === "SOCIAL" && (
              <>
                <div className="space-y-1 md:col-span-2 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">PROFILE_URL</label>
                  <input name="profileUrl" value={details.profileUrl} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="https://..." />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">LINKED_MOBILE</label>
                  <input name="phoneLinked" value={details.phoneLinked} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="08..." />
                </div>
              </>
            )}

            {/* ENTERTAINMENT FIELDS */}
            {formData.category === "ENTERTAINMENT" && (
              <div className="space-y-1 md:col-span-2 group">
                <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400">PROFILE_URL</label>
                <input 
                  name="profileUrl" 
                  value={details.profileUrl} 
                  onChange={handleDetailChange} 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 placeholder:text-slate-700" 
                  placeholder="https://open.spotify.com/user/..." 
                />
              </div>
            )}

            <div className="space-y-1 md:col-span-2 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">DATA_TAGS (COMMA_SEPARATED)</label>
              <input 
                name="tags" 
                value={formData.tags}
                onChange={handleInputChange} 
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" 
                placeholder="Important, Personal..." 
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex-1 px-4 py-3 border border-slate-800 text-slate-500 hover:text-white rounded hover:bg-slate-900 transition-colors text-xs font-bold tracking-wider"
          >
            ABORT_PROTOCOL
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-[2] bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 px-4 py-3 rounded font-bold hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all shadow-md flex justify-center items-center gap-2 text-xs tracking-wider"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={16} />}
            EXECUTE_INJECTION
          </button>
        </div>
      </form>
    </div>
  );
}