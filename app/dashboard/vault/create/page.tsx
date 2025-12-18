"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountCategory, AccountStatus, AuthMethod } from "@/lib/types/schema";
import { TEMPLATES, TemplateField } from "@/lib/constants/templates";
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
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Plus,
  Trash2,
  Settings2,
  X,
  Link as LinkIcon,
  Search,
  KeyRound
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

// Opsi Kategori
const CATEGORIES: { label: string; value: AccountCategory; icon: any }[] = [
  { label: "SOCIAL_MEDIA", value: "SOCIAL", icon: Share2 },
  { label: "GAME_HUB", value: "GAME", icon: Gamepad2 },
  { label: "FINANCIAL", value: "FINANCE", icon: Wallet },
  { label: "WORKSTATION", value: "WORK", icon: Briefcase },
  { label: "UTILITY/MAIL", value: "UTILITY", icon: Mail },
  { label: "ENTERTAINMENT", value: "ENTERTAINMENT", icon: Music },
  { label: "EDUCATION", value: "EDUCATION", icon: GraduationCap },
  { label: "E-COMMERCE", value: "ECOMMERCE", icon: ShoppingBag },
  { label: "OTHER", value: "OTHER", icon: MoreHorizontal },
];

// Opsi Auth Method
const AUTH_METHODS: { label: string; value: AuthMethod }[] = [
  { label: "Email & Password", value: "email" },
  { label: "Username & Password", value: "username" },
  { label: "Phone Number", value: "phone" },
  { label: "SSO: Google Account", value: "sso_google" },
  { label: "SSO: Apple ID", value: "sso_apple" },
  { label: "SSO: Facebook", value: "sso_facebook" },
  { label: "SSO: Steam", value: "sso_steam" },
  { label: "SSO: Supercell ID", value: "sso_supercell" },
  { label: "Linked / 3rd Party", value: "linked_account" },
  { label: "Other Method", value: "other" },
];

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
    authMethod: "email" as AuthMethod,
    linkedEmail: "", 
    linkedAccountId: "",
    owner: "Dicky",
    status: "ACTIVE" as AccountStatus,
    tags: "", 
    birthDate: "", 
    gender: ""     
  });

  // State Dinamis
  const [details, setDetails] = useState<Record<string, any>>({});
  const [activeTemplateKeys, setActiveTemplateKeys] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<{key: string, value: string}[]>([]);

  // --- SMART PARENT SEARCH STATE ---
  const [parentSuggestions, setParentSuggestions] = useState<Account[]>([]);
  const [filteredParents, setFilteredParents] = useState<Account[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Fetch All Accounts for Suggestions (Once)
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const q = query(collection(db, "accounts"), orderBy("serviceName"));
        const snapshot = await getDocs(q);
        const accounts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account));
        setParentSuggestions(accounts);
      } catch (e) {
        console.error("Failed to load suggestions", e);
      }
    };
    fetchParents();
  }, []);

  // [LOGIKA BARU] Rekomendasi Auth Method berdasarkan Kategori
  useEffect(() => {
    if (formData.category === "GAME") {
      setFormData(prev => ({ ...prev, authMethod: "username" })); 
    } else if (["FINANCE", "UTILITY", "WORK"].includes(formData.category)) {
      setFormData(prev => ({ ...prev, authMethod: "email" }));
    }
  }, [formData.category]);

  // Filter Suggestions Logic
  useEffect(() => {
    if (!formData.linkedEmail) {
      setFilteredParents([]);
      return;
    }
    const search = formData.linkedEmail.toLowerCase();
    const filtered = parentSuggestions.filter(acc => {
      const textMatch = 
        acc.serviceName.toLowerCase().includes(search) || 
        acc.identifier.toLowerCase().includes(search);
      
      return textMatch;
    });
    setFilteredParents(filtered.slice(0, 50)); 
  }, [formData.linkedEmail, parentSuggestions]);

  // Click Outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset details saat kategori berubah
  useEffect(() => {
    setDetails({});
    setActiveTemplateKeys([]);
  }, [formData.category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "linkedEmail") {
        setFormData(prev => ({ ...prev, linkedAccountId: "" }));
        setShowSuggestions(true);
    }
  };

  const selectParent = (acc: Account) => {
    setFormData(prev => ({ 
        ...prev, 
        linkedEmail: acc.identifier,
        linkedAccountId: acc.id
    }));
    setShowSuggestions(false);
  };

  const handleDetailChange = (key: string, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  const toggleTemplateField = (key: string, isActive: boolean) => {
    if (isActive) {
      setActiveTemplateKeys(prev => [...prev, key]);
    } else {
      setActiveTemplateKeys(prev => prev.filter(k => k !== key));
      const newDetails = { ...details };
      delete newDetails[key];
      setDetails(newDetails);
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const removeCustomField = (index: number) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    const newFields = [...customFields];
    newFields[index][field] = val;
    setCustomFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalDetails: Record<string, any> = { ...details };
      customFields.forEach(field => {
        if (field.key && field.value) {
          const safeKey = field.key.toLowerCase().replace(/\s+/g, '_');
          finalDetails[safeKey] = field.value;
        }
      });
      Object.keys(finalDetails).forEach(key => {
        if (finalDetails[key] === "" || finalDetails[key] === undefined) {
          delete finalDetails[key];
        }
      });

      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(t => t),
        details: finalDetails,
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

  const currentTemplateFields = TEMPLATES[formData.category] || [];
  const availableSuggestions = currentTemplateFields.filter(f => !activeTemplateKeys.includes(f.key));
  const activeFields = currentTemplateFields.filter(f => activeTemplateKeys.includes(f.key));

  const shouldShowParentSearch = [
    "linked_account", 
    "sso_google", 
    "sso_steam", 
    "sso_facebook", 
    "sso_apple",
    "sso_supercell"
  ].includes(formData.authMethod);

  return (
    <div className={`max-w-3xl mx-auto pb-20 space-y-4 md:space-y-6 font-mono text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button 
          type="button"
          onClick={() => router.back()} 
          className="p-2 hover:bg-slate-900 rounded transition-colors group border border-transparent hover:border-slate-800"
        >
          <ArrowLeft size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Database size={20} className="text-cyan-400" />
            SMART_DATA_INJECTION
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 tracking-widest mt-1">
            ESTABLISHING NEW SECURE RECORD...
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: CORE METADATA */}
        <div className={`p-4 md:p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-4 md:space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20" />
          <h3 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert size={16} />
            CORE_METADATA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">SERVICE_NAME</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-cyan-500/50 transition-all">
                <span className="text-slate-600 mr-2">&gt;</span> 
                <input required name="serviceName" value={formData.serviceName} onChange={handleInputChange} placeholder="Ex: Mobile Legends, BCA" className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-700" />
              </div>
            </div>
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">DATA_CATEGORY</label>
              <div className="relative">
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 appearance-none text-slate-300">
                  {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600"><ChevronRight size={14} className="rotate-90" /></div>
              </div>
            </div>
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">ACCESS_OWNER</label>
              <select name="owner" value={formData.owner} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 text-slate-300">
                {OWNERS.map(owner => <option key={owner} value={owner}>{owner}</option>)}
              </select>
            </div>
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-cyan-400 transition-colors">INTEGRITY_STATUS</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-cyan-500/50 text-slate-300">
                <option value="ACTIVE">ACTIVE [SECURE]</option>
                <option value="BANNED">BANNED [CRITICAL]</option>
                <option value="SUSPENDED">SUSPENDED [WARNING]</option>
                <option value="INACTIVE">INACTIVE [ARCHIVED]</option>
                <option value="SOLD">SOLD [TRANSFERRED]</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACCESS CREDENTIALS (ADAPTIVE) */}
        <div className={`p-4 md:p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-4 md:space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20" />
          <h3 className="text-sm font-bold text-purple-400 border-b border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider">
            <Terminal size={16} />
            LOGIN_CREDENTIALS
          </h3>

          <div className="space-y-4">
            
            {/* AUTH METHOD SELECTOR */}
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-400 transition-colors flex items-center gap-2">
                <KeyRound size={12} /> AUTH_PROTOCOL (METHOD)
              </label>
              <div className="relative">
                <select name="authMethod" value={formData.authMethod} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-purple-500/50 text-slate-300 appearance-none">
                  {AUTH_METHODS.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600"><ChevronRight size={14} className="rotate-90" /></div>
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-400 transition-colors">IDENTIFIER / USERNAME</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-purple-500/50 transition-all">
                <Mail size={14} className="text-slate-600 mr-2" />
                <input required name="identifier" value={formData.identifier} onChange={handleInputChange} placeholder="user@domain.com, Username, or ID" className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-700" />
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-400 transition-colors">ENCRYPTED_KEY (PASSWORD)</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-2 focus-within:border-purple-500/50 transition-all">
                <Cpu size={14} className="text-slate-600 mr-2" />
                <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="bg-transparent border-none outline-none w-full text-sm text-purple-300 font-mono tracking-wider" placeholder="Input_Secret_Key..." />
              </div>
            </div>

            {/* --- SMART PARENT LINK SECTION --- */}
            <div className={`space-y-2 pt-2 border-t border-slate-800 border-dashed group relative transition-all duration-300 ${shouldShowParentSearch ? 'opacity-100' : 'opacity-50 grayscale'}`} ref={suggestionRef}>
              <div className="flex justify-between items-end">
                <label className={`text-xs font-bold flex items-center gap-2 transition-colors ${shouldShowParentSearch ? 'text-slate-500 group-focus-within:text-purple-400' : 'text-slate-700'}`}>
                  <LinkIcon size={12} />
                  CONNECT_TO_PARENT_NODE
                </label>
                
                {shouldShowParentSearch && (
                  <span className="text-[9px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                    REQUIRED FOR {formData.authMethod.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="relative">
                <input 
                  type="text"
                  name="linkedEmail"
                  value={formData.linkedEmail}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search Parent Account (Email, Steam, Google...)" 
                  className={`w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none placeholder:text-slate-700 ${shouldShowParentSearch ? 'focus:border-purple-500/50' : 'cursor-not-allowed opacity-50'}`}
                  autoComplete="off"
                />
                
                {formData.linkedAccountId && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500">
                        <LinkIcon size={14} />
                    </div>
                )}

                {showSuggestions && formData.linkedEmail && filteredParents.length > 0 && (
                  <div className="absolute bottom-full left-0 w-full mb-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 bg-slate-950 border-b border-slate-800 flex justify-between">
                      <span>SUGGESTED_PARENTS</span>
                      <span>RESULTS: {filteredParents.length}</span>
                    </div>
                    {filteredParents.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => selectParent(acc)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-900/20 hover:text-purple-300 transition-colors flex flex-col gap-0.5 border-b border-slate-800/50 last:border-0"
                      >
                        <span className="text-xs font-bold flex items-center gap-2">
                          {acc.serviceName}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{acc.category}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 truncate">{acc.identifier}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-600 italic">
                *Tautkan akun ini ke akun induknya (misal: Game &gt; Steam, Shopee &gt; Google) untuk visualisasi konektivitas.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: EXTENDED ATTRIBUTES */}
        <div className={`p-4 md:p-6 rounded-xl border ${THEME.border} ${THEME.panel} space-y-4 md:space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <Settings2 size={16} />
              EXTENDED_ATTRIBUTES
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              MODE: {formData.category}
            </span>
          </div>
          {availableSuggestions.length > 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">QUICK_ADD_ATTRIBUTES:</p>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map(field => (
                  <button key={field.key} type="button" onClick={() => toggleTemplateField(field.key, true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:text-emerald-400 text-xs text-slate-400 transition-all active:scale-95">
                    <Plus size={12} /> {field.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400 flex items-center gap-2"><Calendar size={12} /> DOB_RECORD</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 text-slate-300" />
            </div>
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400 flex items-center gap-2"><User size={12} /> GENDER_ID</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 text-slate-300">
                <option value="">-- SELECT --</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option>
              </select>
            </div>
            {activeFields.map((field: TemplateField) => (
              <div key={field.key} className={`space-y-1 group animate-in zoom-in-95 duration-200 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-emerald-500/80 group-focus-within:text-emerald-400 uppercase">{field.label.replace(/\s/g, "_")}</label>
                  <button type="button" onClick={() => toggleTemplateField(field.key, false)} className="text-slate-600 hover:text-red-400 transition-colors"><X size={12} /></button>
                </div>
                {field.type === 'select' ? (
                  <div className="relative">
                    <select value={details[field.key] || ""} onChange={(e) => handleDetailChange(field.key, e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 text-slate-300 appearance-none">
                      <option value="">-- Select {field.label} --</option>{field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600"><ChevronRight size={14} className="rotate-90" /></div>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea value={details[field.key] || ""} onChange={(e) => handleDetailChange(field.key, e.target.value)} placeholder={field.placeholder || `Enter ${field.label}`} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700 h-24 resize-none" />
                ) : (
                  <input type={field.type} value={details[field.key] || ""} onChange={(e) => handleDetailChange(field.key, e.target.value)} placeholder={field.placeholder || `Enter ${field.label}`} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" />
                )}
              </div>
            ))}
            <div className="space-y-1 md:col-span-2 group">
              <label className="text-xs font-bold text-slate-500 group-focus-within:text-emerald-400">DATA_TAGS (COMMA_SEPARATED)</label>
              <input name="tags" value={formData.tags} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm outline-none focus:border-emerald-500/50 placeholder:text-slate-700" placeholder="Important, Personal, Main Account..." />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800 border-dashed">
            <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2"><Plus size={12} /> CUSTOM_ATTRIBUTES (UNLIMITED)</h4>
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <input placeholder="Field Name" value={field.key} onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-xs outline-none focus:border-emerald-500/50 text-slate-300 placeholder:text-slate-600" />
                  <input placeholder="Value" value={field.value} onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)} className="flex-[2] bg-slate-900 border border-slate-800 rounded p-2 text-xs outline-none focus:border-emerald-500/50 text-slate-300 placeholder:text-slate-600" />
                  <button type="button" onClick={() => removeCustomField(index)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" onClick={addCustomField} className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1 hover:underline underline-offset-4"><Plus size={12} /> ADD_NEW_FIELD</button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-slate-950/80 backdrop-blur-sm p-4 border-t border-slate-800 -mx-4 md:mx-0 md:relative md:border-none md:p-0 md:bg-transparent">
          <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-3 border border-slate-800 text-slate-500 hover:text-white rounded hover:bg-slate-900 transition-colors text-xs font-bold tracking-wider">ABORT</button>
          <button type="submit" disabled={loading} className="flex-[2] bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 px-4 py-3 rounded font-bold hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all shadow-md flex justify-center items-center gap-2 text-xs tracking-wider">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={16} />} EXECUTE
          </button>
        </div>
      </form>
    </div>
  );
}