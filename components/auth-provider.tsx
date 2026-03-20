"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Firebase otomatis mendeteksi sesi (baik user biasa maupun user anonim/tamu)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Jika currentUser ada dan isAnonymous bernilai true, berarti dia Tamu betulan di Firebase
      setIsGuest(currentUser?.isAnonymous || false);
      setIsLoading(false);

      const isProtectedRoute = pathname.startsWith("/dashboard");

      // LOGIKA ROUTE PROTECTION YANG LEBIH RAPI
      if (!currentUser && isProtectedRoute) {
        // Nyasar ke dashboard tanpa sesi -> Tendang ke Login
        router.replace("/");
      } else if (currentUser && pathname === "/") {
        // Sudah ada sesi (Tamu/Resmi) tapi buka halaman Login -> Lempar ke Dashboard
        router.replace("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Tampilan Loading Screen Global
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-4 transition-colors duration-500"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="relative flex items-center justify-center">
          <ShieldCheck size={48} className="opacity-20 animate-pulse" />
          <Loader2 size={24} className="absolute animate-spin" />
        </div>
        <p className="text-sm font-medium tracking-widest uppercase opacity-60 animate-pulse font-mono">
          Membangun Koneksi Aman...
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}