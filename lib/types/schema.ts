// Kategori utama untuk memisahkan logic UI
export type AccountCategory = 
  | "SOCIAL"    
  | "GAME"      
  | "FINANCE"   
  | "WORK"      
  | "UTILITY"   
  | "ENTERTAINMENT"
  | "EDUCATION"; // Kategori Baru ditambahkan

// Status akun
export type AccountStatus = "ACTIVE" | "BANNED" | "SUSPENDED" | "INACTIVE";

// --- DETAILS INTERFACES (Sama seperti sebelumnya) ---
export interface GameDetails {
  ign?: string;
  server?: string;
  rank?: string;
  level?: string | number;
  platform?: string;
  loginMethod?: string;
}

export interface FinanceDetails {
  accountNumber?: string;
  accountName?: string;
  pinAtm?: string;
  pinApp?: string;
  cardType?: "VISA" | "MASTERCARD" | "GPN" | "UNKNOWN";
  expireDate?: string;
  branch?: string;
}

export interface SocialDetails {
  profileUrl?: string;
  username?: string;
  phoneLinked?: string;
  recoveryEmail?: string;
  // Field tambahan untuk fleksibilitas
  [key: string]: any; 
}

export interface StorageDetails {
  provider?: "Google Drive" | "OneDrive" | "Dropbox";
  quotaTotalGB?: number;
  quotaUsedGB?: number;
  quotaLeftGB?: number;
  fileType?: string;
}

// Interface Baru untuk Edukasi
export interface EducationDetails {
  institution?: string; // Nama Platform/Sekolah (misal: Busuu, Ruangguru)
  course?: string;      // Materi (misal: English, Coding)
  level?: string;       // Level (misal: B2, Intermediate)
  progress?: string;    // Progress (misal: 50%)
}

// --- MAIN ACCOUNT TYPE (UPDATED) ---
export interface Account {
  id: string;
  serviceName: string;
  category: AccountCategory;
  
  identifier: string;
  password: string;
  
  linkedEmail?: string;
  
  owner: string;
  device?: string;
  
  // Update Baru: Tanggal Lahir & Gender
  birthDate?: string; // Format: YYYY-MM-DD
  gender?: "MALE" | "FEMALE" | ""; // Jenis Kelamin
  
  status: AccountStatus;
  tags: string[];
  
  // Update Union Type dengan EducationDetails
  details?: GameDetails | FinanceDetails | SocialDetails | StorageDetails | EducationDetails | any;
  
  lastUpdated: Date;
  createdAt: Date;
}