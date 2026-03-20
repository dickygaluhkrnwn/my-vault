"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, collection, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountCategory, AccountStatus, AuthMethod } from "@/lib/types/schema";
import { TEMPLATES, TemplateField } from "@/lib/constants/templates";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { cn, formatDate } from "@/lib/utils";
import { 
  Save, Gamepad2, Wallet, Share2, Briefcase, Mail, Music, 
  Loader2, ShieldAlert, Calendar, User, Terminal, Cpu, ChevronRight, 
  Database, GraduationCap, ShoppingBag, MoreHorizontal, Plus, Trash2, 
  Settings2, X, Link as LinkIcon, KeyRound, Eye, EyeOff, AlertTriangle, 
  Search, CheckCircle2, Clock
} from "lucide-react";

// --- OPSI FORM ---
const CATEGORIES: { label: string; value: AccountCategory }[] = [
  { label: "SOCIAL MEDIA", value: "SOCIAL" },
  { label: "GAME HUB", value: "GAME" },
  { label: "FINANCIAL", value: "FINANCE" },
  { label: "WORKSTATION", value: "WORK" },
  { label: "UTILITY / MAIL", value: "UTILITY" },
  { label: "ENTERTAINMENT", value: "ENTERTAINMENT" },
  { label: "EDUCATION", value: "EDUCATION" },
  { label: "E-COMMERCE", value: "ECOMMERCE" },
  { label: "OTHER", value: "OTHER" },
];

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

const STATUS_OPTIONS = [
  { label: "ACTIVE [SECURE]", value: "ACTIVE" },
  { label: "BANNED [CRITICAL]", value: "BANNED" },
  { label: "SUSPENDED [WARNING]", value: "SUSPENDED" },
  { label: "INACTIVE [ARCHIVED]", value: "INACTIVE" },
  { label: "SOLD [TRANSFERRED]", value: "SOLD" },
];

const GENDER_OPTIONS = [
  { label: "MALE", value: "MALE" },
  { label: "FEMALE", value: "FEMALE" }
];

const OWNERS = [
  { label: "Pribadi", value: "Pribadi" },
  { label: "Pekerjaan", value: "Pekerjaan" },
  { label: "Keluarga", value: "Keluarga" },
  { label: "Ibu", value: "Ibu" },
  { label: "Ayah", value: "Ayah" },
  { label: "Adik", value: "Adik" },
];

export default function EditAccountPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<any>(null);
  
  const [showMainPassword, setShowMainPassword] = useState(false);
  const [showSecretFields, setShowSecretFields] = useState<Record<string, boolean>>({});

  // State Utama
  const [formData, setFormData] = useState({
    serviceName: "",
    category: "SOCIAL" as AccountCategory,
    identifier: "",
    password: "",
    authMethod: "email" as AuthMethod,
    linkedEmail: "",
    linkedAccountId: "",
    owner: "Pribadi",
    status: "ACTIVE" as AccountStatus,
    tags: "",
    birthDate: "",
    gender: ""
  });

  // State Dinamis
  const [details, setDetails] = useState<Record<string, any>>({});
  const [activeTemplateKeys, setActiveTemplateKeys] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<{key: string, value: string, isSecret: boolean}[]>([]);

  // --- SMART PARENT SEARCH STATE ---
  const [parentSuggestions, setParentSuggestions] = useState<Account[]>([]);
  const [filteredParents, setFilteredParents] = useState<Account[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Suggestions
  useEffect(() => {
    const fetchParents = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const accounts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account));
        accounts.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
        setParentSuggestions(accounts);
      } catch (e) {
        console.error("Failed to load suggestions", e);
      }
    };
    fetchParents();
  }, [user]);

  // 2. Fetch Existing Data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const docRef = doc(db, "accounts", accountId);
        const docSnap = await getDoc(docRef);

        // Security Check
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          const data = docSnap.data();
          const category = (data.category || "SOCIAL") as AccountCategory;

          setFormData({
            serviceName: data.serviceName || "",
            category: category,
            identifier: data.identifier || "",
            password: data.password || "",
            authMethod: (data.authMethod as AuthMethod) || "email",
            linkedEmail: data.linkedEmail || "",
            linkedAccountId: data.linkedAccountId || "",
            owner: data.owner || "Pribadi",
            status: data.status || "ACTIVE",
            tags: data.tags ? data.tags.join(", ") : "",
            birthDate: data.birthDate || "",
            gender: data.gender || ""
          });

          if (data.details) {
            const fetchedDetails = data.details;
            setDetails(fetchedDetails);
            const templateKeys = (TEMPLATES[category] || []).map(t => t.key);
            const foundTemplateKeys: string[] = [];
            const foundCustomFields: {key: string, value: string, isSecret: boolean}[] = [];

            Object.entries(fetchedDetails).forEach(([key, value]) => {
              if (templateKeys.includes(key)) {
                foundTemplateKeys.push(key);
              } else {
                foundCustomFields.push({ key, value: String(value), isSecret: false });
              }
            });

            setActiveTemplateKeys(foundTemplateKeys);
            setCustomFields(foundCustomFields);
          }
          setLastUpdated(data.lastUpdated);
        } else {
          router.push("/dashboard/vault"); // Tendang jika data bukan miliknya
        }
      } catch (error) {
        console.error("Error fetching:", error);
        setErrorMsg("Gagal memuat data akun.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accountId, user, router]);

  // Filter Suggestions Logic
  useEffect(() => {
    if (!formData.linkedEmail) {
      setFilteredParents([]);
      return;
    }
    const search = formData.linkedEmail.toLowerCase();
    const filtered = parentSuggestions.filter(acc => {
      if (acc.id === accountId) return false; // Jangan sarankan diri sendiri
      return acc.serviceName.toLowerCase().includes(search) || acc.identifier.toLowerCase().includes(search);
    });
    setFilteredParents(filtered.slice(0, 10));
  }, [formData.linkedEmail, parentSuggestions, accountId]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "linkedEmail") {
        setFormData(prev => ({ ...prev, linkedAccountId: "" }));
        setShowSuggestions(true);
    }
  };

  const handleCustomSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setCustomFields([...customFields, { key: "", value: "", isSecret: false }]);
  };

  const removeCustomField = (index: number) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value' | 'isSecret', val: any) => {
    const newFields = [...customFields];
    newFields[index] = { ...newFields[index], [field]: val };
    setCustomFields(newFields);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecretFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg("");

    try {
      const finalDetails: Record<string, any> = { ...details };
      customFields.forEach(field => {
        if (field.key && field.value) {
          const safeKey = field.key.toLowerCase().replace(/\s+/g, '_');
          finalDetails[safeKey] = field.value;
        }
      });
      
      // Bersihkan empty fields
      Object.keys(finalDetails).forEach(key => {
        if (finalDetails[key] === "" || finalDetails[key] === undefined) {
          delete finalDetails[key];
        }
      });

      const payload = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(t => t),
        details: finalDetails,
        lastUpdated: serverTimestamp(),
      };

      await updateDoc(doc(db, "accounts", accountId), payload);
      router.push("/dashboard/vault");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      setErrorMsg("Sistem gagal memperbarui data. Silakan coba lagi.");
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
      setErrorMsg("Sistem gagal menghapus data.");
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const currentTemplateFields = TEMPLATES[formData.category] || [];
  const availableSuggestions = currentTemplateFields.filter(f => !activeTemplateKeys.includes(f.key));
  const activeFields = currentTemplateFields.filter(f => activeTemplateKeys.includes(f.key));

  const shouldShowParentSearch = [
    "linked_account", "sso_google", "sso_steam", "sso_facebook", "sso_apple", "sso_supercell"
  ].includes(formData.authMethod);

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "font-sans text-slate-900 dark:text-slate-100",
      panel: "bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm rounded-b-2xl border-t-4 border-t-blue-500",
      panelAlt: "bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm rounded-b-2xl border-t-4 border-t-purple-500",
      panelAlt2: "bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm rounded-b-2xl border-t-4 border-t-emerald-500",
      inputBg: "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 rounded-xl",
      inputPlain: "bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none w-full",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      accent: "text-blue-600 dark:text-blue-400",
      btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md",
      btnOutline: "border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 bg-white dark:bg-slate-900 rounded-xl",
      menuBg: "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl"
    },
    hacker: {
      wrapper: "font-mono text-green-500",
      panel: "bg-[#050505] border-x border-b border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.05)] rounded-b-sm border-t-2 border-t-cyan-500",
      panelAlt: "bg-[#050505] border-x border-b border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.05)] rounded-b-sm border-t-2 border-t-purple-500",
      panelAlt2: "bg-[#050505] border-x border-b border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.05)] rounded-b-sm border-t-2 border-t-emerald-500",
      inputBg: "bg-black border border-green-900 focus-within:border-green-500 rounded-sm shadow-inner",
      inputPlain: "bg-transparent text-green-400 placeholder:text-green-900/60 outline-none w-full",
      textMain: "text-green-400",
      textSub: "text-green-700",
      accent: "text-cyan-400",
      btnPrimary: "bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/50 rounded-sm shadow-sm",
      btnOutline: "border border-green-900/50 hover:border-green-500/50 bg-black text-green-600 hover:text-green-400 rounded-sm",
      menuBg: "bg-[#020202] border border-green-900/80 shadow-[0_0_30px_rgba(34,197,94,0.15)] rounded-sm"
    },
    casual: {
      wrapper: "font-sans text-stone-800 dark:text-stone-100",
      panel: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-x border-b border-orange-200 dark:border-stone-800 shadow-xl shadow-orange-900/5 rounded-b-[2rem] border-t-4 border-t-orange-500",
      panelAlt: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-x border-b border-orange-200 dark:border-stone-800 shadow-xl shadow-orange-900/5 rounded-b-[2rem] border-t-4 border-t-purple-500",
      panelAlt2: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-x border-b border-orange-200 dark:border-stone-800 shadow-xl shadow-orange-900/5 rounded-b-[2rem] border-t-4 border-t-emerald-500",
      inputBg: "bg-white dark:bg-stone-950 border border-orange-200 dark:border-stone-700 focus-within:border-orange-500 rounded-2xl shadow-sm",
      inputPlain: "bg-transparent text-stone-800 dark:text-stone-100 placeholder:text-stone-400 outline-none w-full",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      accent: "text-orange-500 dark:text-orange-400",
      btnPrimary: "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl shadow-md",
      btnOutline: "border border-orange-200 dark:border-stone-800 hover:border-orange-400 hover:text-orange-500 bg-white/50 dark:bg-stone-950/50 rounded-2xl",
      menuBg: "bg-white dark:bg-stone-950 border border-orange-200 dark:border-stone-800 shadow-2xl rounded-2xl"
    }
  };

  // --- DICTIONARY TEKS DINAMIS ---
  const textDict = {
    formal: {
      headerTitle: "Ubah Kredensial",
      headerSub: "Perbarui informasi atau pengaturan keamanan data ini.",
      sec1Title: "Informasi Dasar",
      lblService: "Nama Layanan",
      phService: "Contoh: Netflix, BCA, Mobile Legends...",
      lblCategory: "Kategori Data",
      lblOwner: "Pemilik Akses",
      lblStatus: "Status Keamanan",
      sec2Title: "Kredensial Akses",
      lblAuth: "Metode Autentikasi",
      lblId: "Username / Email / Identitas",
      phId: "Ketik username, email, atau ID...",
      lblPass: "Kata Sandi",
      phPass: "Masukkan kata sandi rahasia...",
      lblParent: "Tautkan ke Akun Induk",
      phParent: "Cari Akun Induk (Email, Google, dll)...",
      parentHelp: "*Tautkan akun ini ke akun induknya (misal: Game > Steam) untuk memetakan konektivitas 3D Graph.",
      reqBadge: "WAJIB",
      sec3Title: "Atribut Lanjutan",
      lblMode: "Mode",
      lblQuickAdd: "Pilihan Tambah Cepat:",
      lblDob: "Tanggal Lahir",
      lblGender: "Jenis Kelamin",
      lblTags: "Label / Tag (Pisahkan dengan koma)",
      phTags: "Penting, Pribadi, Utama...",
      lblCustom: "Atribut Kustom Baru",
      phCustomKey: "Nama (Cth: Server IP)",
      phCustomVal: "Isi Nilai",
      btnAddCustom: "Tambah Atribut",
      btnCancel: "Kembali",
      btnSave: "Simpan Perubahan",
      btnDeleteTooltip: "Hapus Data",
      deleteConfirmTitle: "Konfirmasi Penghapusan",
      deleteConfirmMsg: "Tindakan ini akan menghapus data secara permanen. Apakah Anda yakin?",
      btnExecuteDelete: "Hapus",
      selectPlaceholder: "Pilih..."
    },
    casual: {
      headerTitle: "Edit Akun",
      headerSub: "Ubah info login atau perbarui data tambahan.",
      sec1Title: "Info Dasar",
      lblService: "Nama Aplikasi / Web",
      phService: "Misal: Netflix, Spotify, BCA...",
      lblCategory: "Pilih Kategori",
      lblOwner: "Punya Siapa?",
      lblStatus: "Status Akun",
      sec2Title: "Data Login",
      lblAuth: "Cara Login",
      lblId: "Username atau Email",
      phId: "Ketik username atau email kamu...",
      lblPass: "Kata Sandi",
      phPass: "Ketik password di sini...",
      lblParent: "Sambungkan ke Akun Utama",
      phParent: "Cari nama akun utama...",
      parentHelp: "*Biar gampang dilacak, sambungin akun ini ke akun utamanya (kayak akun game nyambung ke email).",
      reqBadge: "HARUS DIISI",
      sec3Title: "Info Ekstra",
      lblMode: "Kategori",
      lblQuickAdd: "Pilihan Cepat:",
      lblDob: "Tanggal Lahir",
      lblGender: "Jenis Kelamin",
      lblTags: "Kasih Tag (Pisahin pakai koma)",
      phTags: "Streaming, Kerjaan, Rahasia...",
      lblCustom: "Bikin Kolom Sendiri",
      phCustomKey: "Nama (Misal: Server)",
      phCustomVal: "Isi nilainya",
      btnAddCustom: "Tambah Kolom",
      btnCancel: "Gak Jadi",
      btnSave: "Simpan Sekarang",
      btnDeleteTooltip: "Hapus Akun Ini",
      deleteConfirmTitle: "Hapus Akun?",
      deleteConfirmMsg: "Akun ini bakal dihapus permanen dan nggak bisa dibalikin lagi. Lanjut?",
      btnExecuteDelete: "Ya, Hapus",
      selectPlaceholder: "Pilih dong..."
    },
    hacker: {
      headerTitle: "MODIFY_RECORD",
      headerSub: "UPDATING ENTRY CONFIGURATION...",
      sec1Title: "CORE_METADATA",
      lblService: "SERVICE_NAME",
      phService: "Ex: Netflix, BCA, Mobile Legends...",
      lblCategory: "DATA_CATEGORY",
      lblOwner: "ACCESS_OWNER",
      lblStatus: "INTEGRITY_STATUS",
      sec2Title: "LOGIN_CREDENTIALS",
      lblAuth: "AUTH_PROTOCOL (METHOD)",
      lblId: "IDENTIFIER / USERNAME",
      phId: "user@domain.com, Username, or ID",
      lblPass: "ENCRYPTED_KEY (PASSWORD)",
      phPass: "Input_Secret_Key...",
      lblParent: "CONNECT_TO_PARENT_NODE",
      phParent: "Search Parent Account (Email, Steam, Google...)",
      parentHelp: "*Link this node to its parent (e.g. Game > Steam) to enable 3D connectivity mapping.",
      reqBadge: "REQUIRED",
      sec3Title: "EXTENDED_ATTRIBUTES",
      lblMode: "MODE",
      lblQuickAdd: "QUICK_ADD_ATTRIBUTES:",
      lblDob: "DOB_RECORD",
      lblGender: "GENDER_ID",
      lblTags: "DATA_TAGS (COMMA_SEPARATED)",
      phTags: "Important, Personal, Main Account...",
      lblCustom: "CUSTOM_ATTRIBUTES (UNLIMITED)",
      phCustomKey: "Field Name (e.g. Server IP)",
      phCustomVal: "Value",
      btnAddCustom: "ADD_NEW_FIELD",
      btnCancel: "ABORT",
      btnSave: "COMMIT_CHANGES",
      btnDeleteTooltip: "PURGE_RECORD",
      deleteConfirmTitle: "CONFIRM_DELETION",
      deleteConfirmMsg: "WARNING: THIS ACTION IS IRREVERSIBLE. INITIATING REMOVAL SEQUENCE.",
      btnExecuteDelete: "EXECUTE_PURGE",
      selectPlaceholder: "-- SELECT --"
    }
  };

  const cs = styles[theme];
  const t = textDict[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[80vh] font-mono", cs.textMain)}>
        <Cpu size={32} className={cn("animate-pulse mb-4", cs.accent)} />
        <span className="tracking-widest animate-pulse text-sm uppercase">ACCESSING_NODE_DATA...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto pb-24 space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", cs.wrapper)}>
      
      {/* MODAL DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full p-6 lg:p-8 space-y-5 relative overflow-hidden", theme === 'hacker' ? 'bg-[#050505] border border-red-900/50' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800')}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 animate-pulse" />
            <div className="flex items-center gap-3 text-red-500">
              <div className={cn("p-2 rounded-full border", theme === 'hacker' ? 'bg-red-950/50 border-red-900' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50')}><AlertTriangle size={24} /></div>
              <h3 className="text-lg font-bold tracking-wider uppercase">{t.deleteConfirmTitle}</h3>
            </div>
            <p className={cn("text-sm border-l-2 pl-3 leading-relaxed", theme === 'hacker' ? 'text-slate-400 border-red-900/50' : 'text-slate-600 dark:text-slate-400 border-red-200 dark:border-red-900/50')}>
              {t.deleteConfirmMsg}
              <br/><br/><span className={cn("text-[10px] font-bold px-2 py-1 rounded inline-block border", theme === 'hacker' ? 'text-red-400 bg-red-950/30 border-red-900/30' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50')}>TARGET: {formData.serviceName}</span>
            </p>
            <div className="flex gap-3 justify-end pt-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className={cn("px-4 py-2.5 text-xs font-bold transition-all", cs.btnOutline)}>{t.btnCancel}</button>
              <button type="button" onClick={handleDelete} disabled={saving} className="px-5 py-2.5 text-xs font-bold text-white bg-red-600/90 hover:bg-red-600 rounded-lg border border-red-500/50 shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />} {t.btnExecuteDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 border-b border-inherit pb-6 pt-2">
        <div>
          <h1 className={cn("text-xl md:text-2xl font-bold flex items-center gap-2 uppercase tracking-tight", cs.textMain)}>
            <Database size={24} className={cs.accent} />
            {t.headerTitle}
          </h1>
          <p className={cn("text-xs mt-1 flex items-center gap-2", cs.textSub, theme === 'hacker' && 'font-mono uppercase tracking-widest')}>
            {t.headerSub}
            {lastUpdated && (
                <span className={cn("hidden sm:flex text-[9px] px-1.5 py-0.5 rounded border items-center gap-1 font-mono tracking-widest uppercase", theme === 'hacker' ? 'bg-black text-green-700 border-green-900/50' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800')}>
                    <Clock size={10} /> {formatDate(lastUpdated)}
                </span>
            )}
          </p>
        </div>
        <button 
          type="button" 
          onClick={() => setShowDeleteModal(true)} 
          className="p-2.5 text-red-500/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all" 
          title={t.btnDeleteTooltip}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold flex items-center gap-3">
            <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* === GRID 2 KOLOM PROPORSIONAL (5:7) === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* --- KOLOM KIRI (CORE & CREDENTIALS) --- */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8 h-full">
                
                {/* SECTION 1: CORE METADATA */}
                <div className={cn("p-6 md:p-8", cs.panel)}>
                    <h3 className={cn("text-sm font-bold border-b pb-3 mb-6 flex items-center gap-2 uppercase tracking-wider", cs.accent, theme === 'hacker' ? 'border-green-900/50' : 'border-slate-200 dark:border-slate-800')}>
                        <ShieldAlert size={18} />
                        {t.sec1Title}
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="space-y-2 group">
                            <label className={cn("text-xs font-bold uppercase tracking-wider ml-1 transition-colors", cs.textSub, "group-focus-within:text-blue-500", theme === 'hacker' && 'group-focus-within:text-green-500', theme === 'casual' && 'group-focus-within:text-orange-500')}>
                              {t.lblService}
                            </label>
                            <div className={cn("flex items-center p-3 md:p-3.5 transition-all", cs.inputBg)}>
                                <Database className={cn("shrink-0 mr-3 opacity-50", cs.textSub)} size={18} /> 
                                <input required name="serviceName" value={formData.serviceName} onChange={handleInputChange} placeholder={t.phService} className={cs.inputPlain} />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className={cn("text-xs font-bold uppercase tracking-wider ml-1 transition-colors", cs.textSub, "group-focus-within:text-blue-500", theme === 'hacker' && 'group-focus-within:text-green-500', theme === 'casual' && 'group-focus-within:text-orange-500')}>
                              {t.lblCategory}
                            </label>
                            <CustomSelect 
                                value={formData.category} 
                                onChange={(val) => handleCustomSelectChange('category', val)} 
                                options={CATEGORIES} 
                                cs={cs} theme={theme}
                                placeholder={t.selectPlaceholder}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className={cn("text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors", cs.textSub, "group-focus-within:text-blue-500", theme === 'hacker' && 'group-focus-within:text-green-500', theme === 'casual' && 'group-focus-within:text-orange-500')}>
                                  {t.lblOwner}
                                </label>
                                <CustomSelect 
                                    value={formData.owner} 
                                    onChange={(val) => handleCustomSelectChange('owner', val)} 
                                    options={OWNERS} 
                                    cs={cs} theme={theme}
                                    placeholder={t.selectPlaceholder} 
                                />
                            </div>

                            <div className="space-y-2 group">
                                <label className={cn("text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors", cs.textSub, "group-focus-within:text-blue-500", theme === 'hacker' && 'group-focus-within:text-green-500', theme === 'casual' && 'group-focus-within:text-orange-500')}>
                                  {t.lblStatus}
                                </label>
                                <CustomSelect 
                                    value={formData.status} 
                                    onChange={(val) => handleCustomSelectChange('status', val)} 
                                    options={STATUS_OPTIONS} 
                                    cs={cs} theme={theme}
                                    placeholder={t.selectPlaceholder} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: ACCESS CREDENTIALS */}
                <div className={cn("p-6 md:p-8 flex-1", cs.panelAlt)}>
                    <h3 className="text-sm font-bold text-purple-500 border-b border-inherit pb-3 mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Terminal size={18} />
                        {t.sec2Title}
                    </h3>

                    <div className="space-y-5">
                        
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-500 transition-colors flex items-center gap-2 uppercase tracking-wider ml-1">
                                <KeyRound size={14} /> {t.lblAuth}
                            </label>
                            <CustomSelect 
                                value={formData.authMethod} 
                                onChange={(val) => handleCustomSelectChange('authMethod', val)} 
                                options={AUTH_METHODS} 
                                cs={cs} theme={theme} 
                                isPurple
                                placeholder={t.selectPlaceholder}
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-500 transition-colors uppercase tracking-wider ml-1">
                              {t.lblId}
                            </label>
                            <div className={cn("flex items-center p-3 md:p-3.5 transition-all", cs.inputBg, "focus-within:border-purple-500")}>
                                <Mail size={18} className={cn("shrink-0 mr-3 opacity-50", cs.textSub)} />
                                <input required name="identifier" value={formData.identifier} onChange={handleInputChange} placeholder={t.phId} className={cs.inputPlain} />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 group-focus-within:text-purple-500 transition-colors uppercase tracking-wider ml-1">
                              {t.lblPass}
                            </label>
                            <div className={cn("flex items-center p-3 md:p-3.5 transition-all relative overflow-hidden", cs.inputBg, "focus-within:border-purple-500")}>
                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500/30" />
                                <Cpu size={18} className={cn("shrink-0 mr-3 opacity-50", cs.textSub)} />
                                <input 
                                    type={showMainPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    className={cn("flex-1 text-purple-500 font-mono tracking-wider", cs.inputPlain)} 
                                    placeholder={t.phPass} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowMainPassword(!showMainPassword)}
                                    className={cn("px-3 py-1 opacity-50 hover:opacity-100 transition-opacity z-10", cs.textMain)}
                                >
                                    {showMainPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* --- SMART PARENT LINK SECTION --- */}
                        <div className={`space-y-2 pt-6 mt-4 border-t border-dashed transition-all duration-300 relative ${shouldShowParentSearch ? 'opacity-100' : 'opacity-40 grayscale'} ${theme === 'hacker' ? 'border-green-900/30' : 'border-slate-300 dark:border-slate-700'}`} ref={suggestionRef}>
                            <div className="flex justify-between items-end mb-3">
                                <label className={`text-xs font-bold flex items-center gap-2 transition-colors uppercase tracking-wider ml-1 ${shouldShowParentSearch ? 'text-slate-500 group-focus-within:text-purple-500' : 'text-slate-400'}`}>
                                <LinkIcon size={14} />
                                {t.lblParent}
                                </label>
                                
                                {shouldShowParentSearch && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-500 px-2 py-1 rounded border border-purple-500/30 font-bold tracking-widest uppercase">
                                    {t.reqBadge}
                                </span>
                                )}
                            </div>

                            <div className="relative">
                                <div className={cn("flex items-center p-3 md:p-3.5 transition-all", cs.inputBg, shouldShowParentSearch ? 'focus-within:border-purple-500' : '')}>
                                    <Search size={18} className={cn("shrink-0 mr-3 opacity-50", cs.textSub)} />
                                    <input 
                                    type="text"
                                    name="linkedEmail"
                                    value={formData.linkedEmail}
                                    onChange={handleInputChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder={t.phParent} 
                                    className={cn(cs.inputPlain, !shouldShowParentSearch && 'cursor-not-allowed')}
                                    autoComplete="off"
                                    disabled={!shouldShowParentSearch}
                                    />
                                    {formData.linkedAccountId && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    )}
                                </div>
                                
                                {/* SUGGESTION DROPDOWN */}
                                {showSuggestions && formData.linkedEmail && filteredParents.length > 0 && (
                                <div className={cn("absolute top-full left-0 right-0 mt-2 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200", cs.menuBg)}>
                                    <div className={cn("px-4 py-3 text-[10px] font-bold uppercase border-b flex justify-between tracking-widest", cs.textSub, theme === 'hacker' ? 'bg-black border-green-900/50' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800')}>
                                    <span>SUGGESTED_PARENTS</span>
                                    <span>RESULTS: {filteredParents.length}</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredParents.map(acc => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => selectParent(acc)}
                                            className={cn("w-full text-left px-4 py-3 transition-colors flex flex-col gap-1 border-b last:border-0", theme === 'hacker' ? 'hover:bg-purple-900/20 border-green-900/30' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 border-slate-100 dark:border-slate-800/50', cs.textMain)}
                                        >
                                            <span className="text-sm font-bold flex items-center gap-2">
                                            {acc.serviceName}
                                            <span className={cn("text-[9px] px-2 py-0.5 rounded font-mono uppercase border", theme === 'hacker' ? 'bg-black text-green-600 border-green-900/50' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800')}>{acc.category}</span>
                                            </span>
                                            <span className={cn("text-xs font-mono truncate", cs.textSub)}>{acc.identifier}</span>
                                        </button>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                            <p className={cn("text-[10px] mt-2 ml-1 opacity-70 leading-relaxed", cs.textSub)}>
                                {t.parentHelp}
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- KOLOM KANAN (EXTENDED ATTRIBUTES) --- */}
            <div className="lg:col-span-7 flex flex-col h-full">
                
                {/* SECTION 3: EXTENDED ATTRIBUTES */}
                <div className={cn("p-6 md:p-8 flex-1", cs.panelAlt2)}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-6 gap-3">
                        <h3 className="text-sm font-bold text-emerald-500 flex items-center gap-2 uppercase tracking-wider">
                        <Settings2 size={18} />
                        {t.sec3Title}
                        </h3>
                        <span className={cn("text-[10px] px-3 py-1 rounded-md font-bold tracking-widest uppercase border", theme === 'hacker' ? 'bg-black text-emerald-500 border-emerald-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50')}>
                        {t.lblMode}: {formData.category}
                        </span>
                    </div>
                    
                    {availableSuggestions.length > 0 && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className={cn("text-[10px] font-bold mb-3 uppercase tracking-widest", cs.textSub)}>{t.lblQuickAdd}</p>
                        <div className="flex flex-wrap gap-2">
                            {availableSuggestions.map(field => (
                            <button 
                                key={field.key} 
                                type="button" 
                                onClick={() => toggleTemplateField(field.key, true)} 
                                className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm", cs.btnOutline, theme !== 'casual' && 'rounded-full')}
                            >
                                <Plus size={14} /> {theme === 'hacker' ? field.label.toUpperCase().replace(/\s/g, "_") : field.label}
                            </button>
                            ))}
                        </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                        <label className={cn("text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2 transition-colors", cs.textSub, "group-focus-within:text-emerald-500")}>
                            <Calendar size={14} /> {t.lblDob}
                        </label>
                        <div className={cn("p-3 md:p-3.5 transition-all", cs.inputBg, "focus-within:border-emerald-500")}>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className={cs.inputPlain} />
                        </div>
                        </div>
                        
                        <div className="space-y-2 group">
                        <label className={cn("text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2 transition-colors", cs.textSub, "group-focus-within:text-emerald-500")}>
                            <User size={14} /> {t.lblGender}
                        </label>
                        <CustomSelect 
                            value={formData.gender} 
                            onChange={(val) => handleCustomSelectChange('gender', val)} 
                            options={GENDER_OPTIONS} 
                            placeholder={t.selectPlaceholder}
                            cs={cs} theme={theme} 
                            isEmerald
                        />
                        </div>

                        {/* RENDER TEMPLATE FIELDS DENGAN EYE TOGGLE UNTUK PIN/PASSWORD */}
                        {activeFields.map((field: TemplateField) => {
                        const isFieldSecret = field.type === 'password' || field.key.toLowerCase().includes('pin');
                        const showSecret = showSecretFields[field.key] || false;
                        const labelRender = theme === 'hacker' ? field.label.replace(/\s/g, "_").toUpperCase() : field.label;

                        return (
                            <div key={field.key} className={cn("space-y-2 group animate-in zoom-in-95 duration-200", field.type === 'textarea' ? 'md:col-span-2' : '')}>
                            <div className="flex justify-between items-center px-1">
                                <label className={cn("text-xs font-bold uppercase tracking-wider transition-colors text-emerald-600 dark:text-emerald-500/80 group-focus-within:text-emerald-500")}>
                                    {labelRender}
                                </label>
                                <button type="button" onClick={() => toggleTemplateField(field.key, false)} className={cn("transition-colors hover:text-red-500", cs.textSub)}>
                                    <X size={14} />
                                </button>
                            </div>
                            
                            {field.type === 'select' ? (
                                <CustomSelect 
                                    value={details[field.key] || ""} 
                                    onChange={(val) => handleDetailChange(field.key, val)} 
                                    options={field.options?.map(opt => ({ label: opt, value: opt })) || []} 
                                    placeholder={t.selectPlaceholder}
                                    cs={cs} theme={theme} 
                                    isEmerald
                                />
                            ) : field.type === 'textarea' ? (
                                <div className={cn("p-3 md:p-3.5 transition-all", cs.inputBg, "focus-within:border-emerald-500")}>
                                    <textarea value={details[field.key] || ""} onChange={(e) => handleDetailChange(field.key, e.target.value)} placeholder={field.placeholder || `${labelRender}...`} className={cn("h-24 resize-none", cs.inputPlain)} />
                                </div>
                            ) : (
                                <div className={cn("flex items-center p-3 md:p-3.5 transition-all relative overflow-hidden", cs.inputBg, "focus-within:border-emerald-500")}>
                                    {isFieldSecret && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500/20" />}
                                    <input 
                                        type={isFieldSecret && !showSecret ? "password" : "text"} 
                                        value={details[field.key] || ""} 
                                        onChange={(e) => handleDetailChange(field.key, e.target.value)} 
                                        placeholder={field.placeholder || `${labelRender}...`} 
                                        className={cn(cs.inputPlain, isFieldSecret && !showSecret && 'tracking-[0.3em] font-mono')} 
                                    />
                                    {isFieldSecret && (
                                        <button 
                                            type="button"
                                            onClick={() => toggleSecretVisibility(field.key)}
                                            className={cn("px-2 py-0.5 opacity-50 hover:opacity-100 transition-opacity z-10", cs.textMain)}
                                        >
                                            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    )}
                                </div>
                            )}
                            </div>
                        );
                        })}

                        <div className="space-y-2 md:col-span-2 group">
                        <label className={cn("text-xs font-bold uppercase tracking-wider ml-1 transition-colors", cs.textSub, "group-focus-within:text-emerald-500")}>
                          {t.lblTags}
                        </label>
                        <div className={cn("p-3 md:p-3.5 transition-all", cs.inputBg, "focus-within:border-emerald-500")}>
                            <input name="tags" value={formData.tags} onChange={handleInputChange} className={cs.inputPlain} placeholder={t.phTags} />
                        </div>
                        </div>
                    </div>

                    <div className={cn("pt-8 mt-6 border-t border-dashed", theme === 'hacker' ? 'border-green-900/30' : 'border-slate-200 dark:border-slate-800')}>
                        <h4 className={cn("text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2", cs.textSub)}>
                            <Plus size={14} /> {t.lblCustom}
                        </h4>
                        <div className="space-y-4">
                        {customFields.map((field, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className={cn("flex-1 p-2 md:p-3 transition-all", cs.inputBg, "focus-within:border-emerald-500")}>
                                <input placeholder={t.phCustomKey} value={field.key} onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)} className={cn("text-sm font-bold font-mono", cs.inputPlain)} />
                            </div>
                            
                            <div className={cn("flex-[2] flex items-center p-2 md:p-3 transition-all relative overflow-hidden", cs.inputBg, "focus-within:border-emerald-500")}>
                                {field.isSecret && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500/20" />}
                                <input 
                                    type={field.isSecret && !showSecretFields[`custom_${index}`] ? "password" : "text"} 
                                    placeholder={t.phCustomVal}
                                    value={field.value} 
                                    onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)} 
                                    className={cn("text-sm flex-1", cs.inputPlain, field.isSecret && !showSecretFields[`custom_${index}`] && 'tracking-[0.3em] font-mono')} 
                                />
                                
                                {/* Tombol Toggle Secret untuk Field Custom */}
                                <button 
                                    type="button"
                                    onClick={() => handleCustomFieldChange(index, 'isSecret', !field.isSecret)}
                                    className={cn("px-2 py-1 text-[9px] font-bold border rounded ml-2 transition-colors", field.isSecret ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20" : "bg-transparent text-slate-500 border-slate-500/30 hover:text-emerald-500 hover:border-emerald-500/50")}
                                    title={field.isSecret ? "Hapus Sifat Rahasia" : "Jadikan Rahasia"}
                                >
                                    {field.isSecret ? 'SECRET' : 'NORMAL'}
                                </button>

                                {field.isSecret && (
                                    <button 
                                        type="button"
                                        onClick={() => toggleSecretVisibility(`custom_${index}`)}
                                        className={cn("px-2 py-0.5 ml-1 opacity-50 hover:opacity-100 transition-opacity z-10", cs.textMain)}
                                    >
                                        {showSecretFields[`custom_${index}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                )}
                            </div>
                            
                            <button type="button" onClick={() => removeCustomField(index)} className="p-3 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center justify-center shrink-0">
                                <Trash2 size={16} />
                            </button>
                            </div>
                        ))}
                        <button type="button" onClick={addCustomField} className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-4 py-2 transition-all hover:opacity-70", cs.accent)}>
                            <Plus size={14} /> {t.btnAddCustom}
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200 dark:border-slate-800 -mx-4 md:mx-0 px-4 md:px-0">
          <button type="button" onClick={() => router.back()} className={cn("flex-1 px-5 py-4 text-sm font-bold tracking-widest uppercase transition-all shadow-sm", cs.btnOutline)}>
              {t.btnCancel}
          </button>
          <button type="submit" disabled={saving || loading} className={cn("flex-[2] px-5 py-4 text-sm font-bold tracking-widest uppercase transition-all shadow-md flex justify-center items-center gap-2", cs.btnPrimary, (saving || loading) && 'opacity-70 cursor-not-allowed')}>
            {(saving || loading) ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {t.btnSave}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- SUB KOMPONEN: CUSTOM SELECT PREMIUM ---
interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  cs: any;
  theme: string;
  isPurple?: boolean;
  isEmerald?: boolean;
}

function CustomSelect({ value, onChange, options, placeholder = "-- SELECT --", cs, theme, isPurple, isEmerald }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));
  
  // Dynamic Ring Focus Color
  let ringColor = "focus-within:border-blue-500";
  let activeText = cs.accent;
  if (theme === 'hacker') ringColor = "focus-within:border-green-500";
  if (theme === 'casual') ringColor = "focus-within:border-orange-500";
  
  if (isPurple) {
      ringColor = "focus-within:border-purple-500";
      activeText = "text-purple-500 dark:text-purple-400";
  } else if (isEmerald) {
      ringColor = "focus-within:border-emerald-500";
      activeText = "text-emerald-500 dark:text-emerald-400";
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={cn("w-full flex items-center justify-between cursor-pointer p-3 md:p-3.5 transition-all", cs.inputBg, ringColor, isOpen && ringColor.replace('focus-within:border-', 'border-'))}
      >
        <span className={cn("truncate text-sm font-medium", !selectedOption ? "opacity-50" : cs.inputPlain)}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronRight size={16} className={cn("transition-transform opacity-50 shrink-0", isOpen ? "-rotate-90" : "rotate-90", cs.textSub)} />
      </div>

      {isOpen && (
        <div className={cn("absolute z-[100] top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto border animate-in fade-in zoom-in-95 duration-200", cs.menuBg)}>
          <div className="py-2">
            {options.map((opt, idx) => {
              const isSelected = String(value) === String(opt.value);
              return (
                <button
                    key={idx}
                    type="button"
                    onClick={() => {
                        onChange(String(opt.value));
                        setIsOpen(false);
                    }}
                    className={cn(
                        "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between border-b border-inherit last:border-0",
                        theme === 'hacker' ? 'hover:bg-green-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                        isSelected ? activeText : cs.textMain,
                        theme === 'formal' && 'border-slate-100 dark:border-slate-800/50',
                        theme === 'hacker' && 'border-green-900/30',
                        theme === 'casual' && 'border-orange-100 dark:border-stone-800'
                    )}
                >
                    {opt.label}
                    {isSelected && <CheckCircle2 size={16} className={activeText} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}