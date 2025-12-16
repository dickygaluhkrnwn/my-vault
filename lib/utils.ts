import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Update fungsi ini agar aman dari error "Invalid time value"
export const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "-"; // Return strip jika kosong
  
  try {
    const date = new Date(dateString);
    // Cek apakah date valid
    if (isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(date);
  } catch (error) {
    return "-";
  }
};