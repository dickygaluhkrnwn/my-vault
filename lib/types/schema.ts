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

// [BARU] Metode Otentikasi - Kunci untuk fitur Connectivity
export type AuthMethod = 
  | "email" 
  | "username" 
  | "phone" 
  | "sso_google" 
  | "sso_apple" 
  | "sso_facebook"
  | "sso_steam" 
  | "linked_account" // Untuk akun yang numpang login (misal: Login Game via Steam)
  | "other";

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
  
  // [BARU] Connectivity & Relasi
  // Ini yang akan menghubungkan "Game" ke "Steam" ke "Email Utama"
  authMethod: AuthMethod; 
  linkedAccountId?: string; // ID dari akun induk (Parent ID)
  linkedEmail?: string; // Masih disimpan untuk referensi cepat/legacy display
  
  owner: string; // Nama pemilik akun (Penting untuk data Family/Shared)
  device?: string; // Device login terakhir/umum (Analisis dari CSV Data Besar)
  
  // Data Personal
  birthDate?: string; // Format: YYYY-MM-DD
  gender?: "MALE" | "FEMALE" | ""; 
  
  status: AccountStatus;
  tags: string[]; // Label cepat
  
  // --- THE MAGIC PART ---
  // Menyimpan data dinamis seperti: { "server": "Asia", "pinAtm": "123456", "quotaLeft": "2GB", "game_rank": "Mythic" }
  details: Record<string, any>; 
  
  lastUpdated: Date;
  createdAt: Date;
}