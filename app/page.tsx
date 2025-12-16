"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Jika berhasil, arahkan ke dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email atau password salah. Coba lagi.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Terlalu banyak percobaan gagal. Tunggu sebentar.");
      } else {
        setError("Terjadi kesalahan sistem. Cek koneksi internet.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-slate-50">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-blue-600/20 rounded-full mb-4 ring-1 ring-blue-500/50">
            <ShieldCheck size={48} className="text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            Private Vault
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sistem Keamanan & Aset Terpusat
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6 bg-slate-900/50 p-8 rounded-xl border border-slate-800 shadow-xl backdrop-blur-sm">
          
          {error && (
            <div className="flex items-center gap-3 p-3 text-sm text-red-200 bg-red-900/30 border border-red-800 rounded-md animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Akses
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                placeholder="admin@vault.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Kode Keamanan
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex w-full justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-[0.98]",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Membuka Brankas...
              </>
            ) : (
              "Buka Vault"
            )}
          </button>
        </form>
        
        <div className="text-center text-xs text-slate-600">
          <p>Akses terbatas hanya untuk pemilik resmi.</p>
          <p className="mt-1">IP Address Anda dicatat sistem.</p>
        </div>
      </div>
    </div>
  );
}