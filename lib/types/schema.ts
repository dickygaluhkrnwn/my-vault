// Kategori utama untuk memisahkan logic UI
export type AccountCategory = 
  | "SOCIAL"    
  | "GAME"      
  | "FINANCE"   
  | "WORK"      
  | "UTILITY"   
  | "ENTERTAINMENT"
  | "EDUCATION"
  | "ECOMMERCE" // Tambahan dari analisis CSV (Shopee/Tokopedia)
  | "OTHER";

// Status akun
export type AccountStatus = "ACTIVE" | "BANNED" | "SUSPENDED" | "INACTIVE" | "SOLD";

// --- NOTE: Interface spesifik (GameDetails dll) dihapus/disederhanakan ---
// --- Kita beralih ke Dynamic Object agar form bisa "berubah wajah" ---

// --- MAIN ACCOUNT TYPE (UPDATED) ---
export interface Account {
  id: string;
  serviceName: string; // Contoh: "Mobile Legends", "BCA", "Netflix"
  category: AccountCategory;
  
  // Field Utama (Standard)
  identifier: string; // Bisa Email, Username, atau No HP (Login utama)
  password?: string;
  
  linkedEmail?: string; // Email pemulihan atau email terhubung
  
  owner: string; // Nama pemilik akun (Penting untuk data Family/Shared)
  device?: string; // Device login terakhir/umum (Analisis dari CSV Data Besar)
  
  // Data Personal (Sesuai update terakhirmu)
  birthDate?: string; // Format: YYYY-MM-DD
  gender?: "MALE" | "FEMALE" | ""; 
  
  status: AccountStatus;
  tags: string[]; // Label cepat
  
  // --- THE MAGIC PART (Sesuai Roadmap) ---
  // Menyimpan data dinamis seperti: { "server": "Asia", "pinAtm": "123456", "quotaLeft": "2GB" }
  details: Record<string, any>; 
  
  lastUpdated: Date;
  createdAt: Date;
}