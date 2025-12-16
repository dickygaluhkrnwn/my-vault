// Kategori utama untuk memisahkan logic UI
export type AccountCategory = 
  | "SOCIAL"    
  | "GAME"      
  | "FINANCE"   
  | "WORK"      
  | "UTILITY"   
  | "ENTERTAINMENT";

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
}

export interface StorageDetails {
  provider?: "Google Drive" | "OneDrive" | "Dropbox";
  quotaTotalGB?: number;
  quotaUsedGB?: number;
  quotaLeftGB?: number;
  fileType?: string;
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
  
  details?: GameDetails | FinanceDetails | SocialDetails | StorageDetails;
  
  lastUpdated: Date;
  createdAt: Date;
}