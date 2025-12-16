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
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Tambah Akun Baru</h1>
          <p className="text-slate-500 text-sm">Simpan kredensial Anda dengan aman.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Informasi Dasar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-blue-500" />
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
                placeholder="Contoh: Gmail Utama" 
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  ▼
                </div>
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
              <label className="text-sm font-medium text-slate-700">Identifier (Email / Username)</label>
              <input 
                required
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="email@anda.com" 
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
                Terhubung dengan Email (Induk)
              </label>
              <input 
                type="email"
                name="linkedEmail"
                value={formData.linkedEmail}
                onChange={handleInputChange}
                placeholder="Contoh: dicky.utama@gmail.com" 
                className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Detail Dinamis */}
        <div className="bg-slate-50 p-6 rounded-xl border border-blue-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-4 flex justify-between">
            <span>Detail Tambahan ({formData.category})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* === INI BAGIAN UTILITY (EMAIL) YANG HILANG DI KODE ANDA === */}
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
                  <p className="text-xs text-slate-400">Penting untuk pemulihan akun.</p>
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
                   <input name="phoneLinked" value={details.phoneLinked} onChange={handleDetailChange} className="input-detail" placeholder="08..." />
                </div>
              </>
            )}

            {/* Field Khusus GAME */}
            {formData.category === "GAME" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">IGN (In-Game Name)</label>
                  <input name="ign" value={details.ign} onChange={handleDetailChange} className="input-detail" placeholder="Nama karakter..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Server / Region</label>
                  <input name="server" value={details.server} onChange={handleDetailChange} className="input-detail" placeholder="Asia / Global..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Rank / Liga</label>
                  <input name="rank" value={details.rank} onChange={handleDetailChange} className="input-detail" placeholder="Legend / Mythic..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Level (TH / Akun)</label>
                  <input name="level" value={details.level} onChange={handleDetailChange} className="input-detail" placeholder="Contoh: TH 15" />
                </div>
              </>
            )}

            {/* Field Khusus FINANCE */}
            {formData.category === "FINANCE" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">No. Rekening</label>
                  <input name="accountNumber" value={details.accountNumber} onChange={handleDetailChange} className="input-detail" placeholder="XXXX-XXXX..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">PIN ATM</label>
                  <input name="pinAtm" value={details.pinAtm} onChange={handleDetailChange} className="input-detail" placeholder="123456" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">PIN App</label>
                  <input name="pinApp" value={details.pinApp} onChange={handleDetailChange} className="input-detail" placeholder="Kode akses app..." />
                </div>
              </>
            )}

            {/* Field Khusus SOCIAL */}
            {formData.category === "SOCIAL" && (
              <>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Link Profil</label>
                  <input name="profileUrl" value={details.profileUrl} onChange={handleDetailChange} className="input-detail" placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">No HP</label>
                  <input name="phoneLinked" value={details.phoneLinked} onChange={handleDetailChange} className="input-detail" placeholder="08..." />
                </div>
              </>
            )}

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-600">Tags / Label (Pisahkan koma)</label>
              <input 
                name="tags" 
                value={formData.tags}
                onChange={handleInputChange} 
                className="input-detail" 
                placeholder="Contoh: Penting, Dana Darurat" 
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">Batal</button>
          <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Simpan ke Vault
          </button>
        </div>
      </form>
      <style jsx>{`
        .input-detail { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; font-size: 0.875rem; }
        .input-detail:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
      `}</style>
    </div>
  );
}