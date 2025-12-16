"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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
  Pencil,
  Calendar,
  User
} from "lucide-react";

// Opsi Kategori
const CATEGORIES: { label: string; value: AccountCategory; icon: any }[] = [
  { label: "Social Media", value: "SOCIAL", icon: Share2 },
  { label: "Game & Hiburan", value: "GAME", icon: Gamepad2 },
  { label: "Keuangan (Bank)", value: "FINANCE", icon: Wallet },
  { label: "Pekerjaan", value: "WORK", icon: Briefcase },
  { label: "Utilitas / Email", value: "UTILITY", icon: Mail },
  { label: "Musik / Streaming", value: "ENTERTAINMENT", icon: Music },
];

const OWNERS = ["Dicky", "Ibu", "Ayah", "Adik", "Mase", "Keluarga"];

export default function EditAccountPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    birthDate: "", // Field baru
    gender: ""     // Field baru
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
            birthDate: data.birthDate || "", // Load Tanggal Lahir
            gender: data.gender || ""        // Load Gender
          });

          if (data.details) {
            setDetails(prev => ({ ...prev, ...data.details }));
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
      alert("Gagal update data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Akun</h1>
          <p className="text-slate-500 text-sm">Perbarui data {formData.serviceName}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Informasi Dasar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
            <Pencil size={18} className="text-blue-500" />
            Informasi Utama
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Nama Layanan</label>
              <input 
                required
                name="serviceName"
                value={formData.serviceName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Kategori</label>
              <div className="relative">
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Pemilik Akun</label>
              <select 
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {OWNERS.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="ACTIVE">Aktif (Aman)</option>
                <option value="BANNED">Terblokir / Banned</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Tidak Dipakai</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Kredensial */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2 mb-4">Login & Konektivitas</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Identifier</label>
              <input 
                required
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input 
                type="text"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-blue-600 bg-blue-50"
              />
            </div>

            <div className="space-y-1 pt-2 border-t border-dashed">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Share2 size={14} />
                Terhubung dengan Email
              </label>
              <input 
                type="email"
                name="linkedEmail"
                value={formData.linkedEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Detail Dinamis */}
        <div className="bg-slate-50 p-6 rounded-xl border border-blue-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-4">
            Detail Tambahan ({formData.category})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* KHUSUS UTILITY (EMAIL) - FITUR BARU */}
            {formData.category === "UTILITY" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Calendar size={14} /> Tanggal Lahir
                  </label>
                  <input 
                    type="date" 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleInputChange} 
                    className="input-detail" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <User size={14} /> Jenis Kelamin
                  </label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange} 
                    className="input-detail bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                   <label className="text-sm font-medium text-slate-600">Nomor HP Pemulihan</label>
                   <input name="phoneLinked" value={details.phoneLinked} onChange={handleDetailChange} className="input-detail" />
                </div>
              </>
            )}

             {formData.category === "GAME" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">IGN</label>
                  <input name="ign" value={details.ign} onChange={handleDetailChange} className="input-detail" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Server</label>
                  <input name="server" value={details.server} onChange={handleDetailChange} className="input-detail" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Rank</label>
                  <input name="rank" value={details.rank} onChange={handleDetailChange} className="input-detail" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Level</label>
                  <input name="level" value={details.level} onChange={handleDetailChange} className="input-detail" />
                </div>
              </>
            )}

            {formData.category === "FINANCE" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">No. Rekening</label>
                  <input name="accountNumber" value={details.accountNumber} onChange={handleDetailChange} className="input-detail" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">PIN ATM</label>
                  <input name="pinAtm" value={details.pinAtm} onChange={handleDetailChange} className="input-detail" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">PIN App</label>
                  <input name="pinApp" value={details.pinApp} onChange={handleDetailChange} className="input-detail" />
                </div>
              </>
            )}

            {(formData.category === "SOCIAL") && (
              <>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Link Profil</label>
                  <input name="profileUrl" value={details.profileUrl} onChange={handleDetailChange} className="input-detail" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">No HP</label>
                  <input name="phoneLinked" value={details.phoneLinked} onChange={handleDetailChange} className="input-detail" />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-600">Tags</label>
              <input name="tags" value={formData.tags} onChange={handleInputChange} className="input-detail" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="flex-[2] bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Simpan Perubahan
          </button>
        </div>
      </form>
      
      <style jsx>{`
        .input-detail {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          outline: none;
          font-size: 0.875rem;
        }
        .input-detail:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      `}</style>
    </div>
  );
}