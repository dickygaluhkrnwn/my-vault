import { AccountCategory } from "@/lib/types/schema";

export type FieldType = "text" | "number" | "password" | "date" | "select" | "url" | "textarea" | "tel";

export interface TemplateField {
  key: string;       // Key untuk disimpan di database (misal: 'pin_atm')
  label: string;     // Label yang muncul di UI (misal: 'PIN ATM')
  type: FieldType;
  options?: string[]; // Hanya untuk tipe 'select'
  placeholder?: string;
  isSecret?: boolean; // Jika true, UI mungkin akan menyensor/masking secara default
}

// Registry ini memetakan Kategori -> Daftar Input Tambahan
export const TEMPLATES: Record<AccountCategory, TemplateField[]> = {
  GAME: [
    { key: "ign", label: "IGN / Nickname", type: "text", placeholder: "e.g. ProPlayer123" },
    { key: "server", label: "Server / Region", type: "text", placeholder: "e.g. Asia, Global" },
    { key: "rank", label: "Rank / Tier", type: "text", placeholder: "e.g. Mythic, TH 15" },
    { key: "level", label: "Level / XP", type: "number" },
    { key: "platform", label: "Platform Login", type: "select", options: ["Android", "iOS", "Steam", "Supercell ID", "Moonton", "PlayStation", "Xbox"] },
    { key: "items", label: "Mata Uang (Gems/Candles)", type: "text" }, // Dari analisis CSV Sky COTL
  ],
  FINANCE: [
    { key: "account_number", label: "No. Rekening", type: "number" },
    { key: "account_name", label: "Nama di Buku Tabungan", type: "text" },
    { key: "card_number", label: "No. Kartu (16 Digit)", type: "text" },
    { key: "pin_atm", label: "PIN ATM", type: "password", isSecret: true },
    { key: "pin_app", label: "PIN Mobile Banking", type: "password", isSecret: true },
    { key: "card_type", label: "Jenis Kartu", type: "select", options: ["VISA", "Mastercard", "GPN", "JCB", "AMEX"] },
    { key: "branch", label: "Kantor Cabang", type: "text" },
  ],
  SOCIAL: [
    { key: "username", label: "Username (@)", type: "text" },
    { key: "profile_url", label: "Link Profil", type: "url" },
    { key: "phone_linked", label: "No. HP Terdaftar", type: "tel" },
    { key: "recovery_email", label: "Email Pemulihan", type: "text" },
  ],
  UTILITY: [
    { key: "quota_total", label: "Total Kuota (GB)", type: "number" },
    { key: "quota_used", label: "Terpakai (GB)", type: "number" },
    { key: "quota_left", label: "Sisa (GB)", type: "number" }, // Dari analisis CSV Email Penyimpanan
    { key: "provider_type", label: "Jenis Layanan", type: "select", options: ["Cloud Storage", "Internet/WiFi", "Listrik", "Air"] },
  ],
  EDUCATION: [
    { key: "institution", label: "Institusi / Platform", type: "text", placeholder: "e.g. Busuu, Ruangguru" },
    { key: "course_name", label: "Nama Kursus", type: "text" },
    { key: "current_level", label: "Level Saat Ini", type: "text" },
    { key: "progress_percent", label: "Progress (%)", type: "number" },
    { key: "certificate_url", label: "Link Sertifikat", type: "url" },
  ],
  ECOMMERCE: [
    { key: "shop_name", label: "Nama Toko", type: "text" },
    { key: "pin_transaction", label: "PIN Transaksi", type: "password", isSecret: true },
    { key: "phone_linked", label: "No. HP Terdaftar", type: "tel" },
    { key: "paylater_limit", label: "Limit Paylater", type: "number" },
  ],
  WORK: [
    { key: "company", label: "Perusahaan", type: "text" },
    { key: "role", label: "Posisi / Jabatan", type: "text" },
    { key: "employee_id", label: "NIP / ID Karyawan", type: "text" },
    { key: "work_email", label: "Email Kantor", type: "text" },
  ],
  ENTERTAINMENT: [
    { key: "plan_type", label: "Jenis Paket", type: "select", options: ["Free", "Premium", "Family", "Student"] },
    { key: "expiry_date", label: "Tanggal Habis", type: "date" },
    { key: "screen_name", label: "Nama Profil/Screen", type: "text" },
  ],
  OTHER: [
    { key: "notes", label: "Catatan Tambahan", type: "textarea" },
  ]
};