"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AccountCategory, AccountStatus } from "@/lib/types/schema";
import { formatDate } from "@/lib/utils";
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
  Pencil,
  Calendar,
  User,
  Trash2,
  AlertTriangle,
  Clock,
  Terminal,
  Cpu,
  ChevronRight,
  Database,
  GraduationCap
} from "lucide-react";

// --- THEME CONFIG (Consistent with Create Page) ---
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

const OWNERS = ["Dicky", "Ibu", "Ayah", "Adik", "Mase", "Keluarga"];

export default function EditAccountPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<any>(null);

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

  // State Detail
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

  // Fetch Data Lama
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "accounts", accountId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            serviceName: data.serviceName || "",
            category: data.category || "SOCIAL",
            identifier: data.identifier || "",
            password: data.password || "",
            linkedEmail: data.linkedEmail || "",
            owner: data.owner || "Dicky",
            status: data.status || "ACTIVE",
            tags: data.tags ? data.tags.join(", ") : "",
            birthDate: data.birthDate || "",
            gender: data.gender || ""
          });

          if (data.details) {
            setDetails(prev => ({ ...prev, ...data.details }));
          }
          
          setLastUpdated(data.lastUpdated);
        } else {
          router.push("/dashboard/vault");
        }
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, router]);

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
    setSaving(true);

    try {
      const cleanDetails: any = {};
      Object.entries(details).forEach(([key, value]) => {
        if (value) cleanDetails[key] = value;
      });

      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(t => t),
        details: cleanDetails,
        lastUpdated: serverTimestamp(),
      };

      await updateDoc(doc(db, "accounts", accountId), payload);
      router.push("/dashboard/vault");
    } catch (error) {
      alert("SYSTEM ERROR: UPDATE_FAILED");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, "accounts", accountId));
      router.push("/dashboard/vault");
    } catch (error) {
      alert("SYSTEM ERROR: DELETE_FAILED");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex h-[80vh] items-center justify-center ${THEME.bg} font-mono`}>
        <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
            <Terminal size={24} />
            <span className="tracking-widest">FETCHING_RECORD...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto pb-20 space-y-6 font-mono text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      
      {/* --- MODAL DELETE (CYBER STYLE) --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-xl border border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-950/50 rounded-full border border-red-900">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold tracking-wider">CONFIRM_DELETION</h3>
            </div>
            <p className="text-slate-400 text-sm border-l-2 border-red-900/50 pl-3">
              Initiating removal sequence for: <br/>
              <strong className="text-white">{formData.serviceName}</strong>. 
              <br/><span className="text-red-400 text-xs mt-1 block">WARNING: THIS ACTION IS IRREVERSIBLE.</span>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-transparent hover:border-slate-600 transition-all"
              >
                ABORT
              </button>
              <button 
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600/80 hover:bg-red-600 rounded border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                EXECUTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-slate-900 rounded transition-colors group border border-transparent hover:border-slate-800"
          >
            <ArrowLeft size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Database size={20} className="text-cyan-400" />
              MODIFY_RECORD
            </h1>
            <p className="text-xs text-slate-500 tracking-widest mt-1 flex items-center gap-2">
              UPDATING ENTRY: {formData.serviceName}
              {lastUpdated && (
                 <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 flex items-center gap-1">
                   <Clock size={8} /> {formatDate(lastUpdated)}
                 </span>
               )}
            </p>
          </div>
        </div>
        
        {/* Delete Button */}
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-900/50 transition-all"
          title="PURGE_RECORD"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: CORE METADATA */}
        <div className={`p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20" />
          
          <h3 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
            <Pencil size={16} />
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
                   />
                </div>
              </>
            )}

            {/* EDUCATION FIELDS (NEW) */}
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
                  <input name="ign" value={details.ign} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">SERVER_REGION</label>
                  <input name="server" value={details.server} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">COMPETITIVE_RANK</label>
                  <input name="rank" value={details.rank} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">LEVEL_INDEX</label>
                  <input name="level" value={details.level} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
              </>
            )}

            {/* FINANCE FIELDS */}
            {formData.category === "FINANCE" && (
              <>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">ACCOUNT_NUMBER</label>
                  <input name="accountNumber" value={details.accountNumber} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">ATM_PIN</label>
                  <input name="pinAtm" value={details.pinAtm} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">APP_PIN</label>
                  <input name="pinApp" value={details.pinApp} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
              </>
            )}

            {/* SOCIAL FIELDS */}
            {formData.category === "SOCIAL" && (
              <>
                <div className="space-y-1 md:col-span-2 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">PROFILE_URL</label>
                  <input name="profileUrl" value={details.profileUrl} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
                <div className="space-y-1 group">
                  <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">LINKED_MOBILE</label>
                  <input name="phoneLinked" value={details.phoneLinked} onChange={handleDetailChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">DATA_TAGS (COMMA_SEPARATED)</label>
              <input 
                name="tags" 
                value={formData.tags}
                onChange={handleInputChange} 
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" 
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
            ABORT
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="flex-[2] bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 px-4 py-3 rounded font-bold hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all shadow-md flex justify-center items-center gap-2 text-xs tracking-wider"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            COMMIT_CHANGES
          </button>
        </div>
      </form>
    </div>
  );
}