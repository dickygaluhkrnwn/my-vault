"use client";

import { useState } from "react";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Compass, 
  Loader2, 
  LockKeyhole, 
  Fingerprint, 
  Network,
  Mail,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { Theme } from "@/components/theme-provider";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme() as { theme: Theme }; 
  
  // States untuk Auth
  const [isLoading, setIsLoading] = useState<"google" | "guest" | "email" | null>(null);
  const [error, setError] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // States untuk Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Email dan kata sandi harus diisi.");
    
    setIsLoading("email");
    setError("");

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Email atau kata sandi salah.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Email sudah terdaftar. Silakan masuk.");
      } else if (err.code === 'auth/weak-password') {
        setError("Kata sandi terlalu lemah (minimal 6 karakter).");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading("google");
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login dibatalkan oleh pengguna.");
      } else {
        setError("Gagal masuk dengan Google. Pastikan Google Provider aktif di Firebase.");
      }
      setIsLoading(null);
    }
  };

  const handleGuestMode = async () => {
    setIsLoading("guest");
    setError("");
    try {
      // BIKIN AKUN HANTU DI FIREBASE SECARA INSTAN
      await signInAnonymously(auth);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Guest Mode Error:", err);
      setError("Gagal masuk mode tamu. Pastikan Anonymous Auth aktif di Firebase Console.");
      setIsLoading(null);
    }
  };

  // --- PEMETAAN STYLE TEMA DINAMIS UNTUK LANDING PAGE ---
  const styles = {
    formal: {
      wrapper: "font-sans text-slate-900 dark:text-slate-100",
      brandIcon: "bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 rounded-xl",
      highlightText: "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400",
      card: "bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-3xl",
      input: "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 focus:border-blue-500 rounded-xl",
      btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md",
      btnGoogle: "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl",
      btnGuest: "bg-slate-100 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl",
      ornament1: "bg-blue-500/10 blur-3xl",
      ornament2: "bg-indigo-500/10 blur-3xl"
    },
    hacker: {
      wrapper: "font-mono text-green-500",
      brandIcon: "bg-black border border-green-500/50 text-green-400 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.3)]",
      highlightText: "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]",
      card: "bg-[#050505] border border-green-900/50 shadow-[0_0_30px_rgba(34,197,94,0.1)] rounded-none",
      input: "bg-black border border-green-900 focus:ring-green-500/50 focus:border-green-500 rounded-none text-green-400 outline-none",
      btnPrimary: "bg-green-900/20 hover:bg-green-900/40 border border-green-500 text-green-400 rounded-sm",
      btnGoogle: "bg-black border border-green-900 hover:bg-green-900/20 text-green-500 rounded-sm",
      btnGuest: "bg-black border border-green-900 hover:bg-green-900/30 text-green-600 rounded-sm",
      ornament1: "bg-green-500/5 border border-green-500/20 rounded-none",
      ornament2: "bg-green-500/5 border border-green-500/20 rounded-none"
    },
    casual: {
      wrapper: "font-sans text-stone-800 dark:text-stone-100",
      brandIcon: "bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-2xl shadow-lg",
      highlightText: "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500",
      card: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-orange-200 dark:border-stone-800 shadow-2xl shadow-orange-900/5 dark:shadow-none rounded-[2rem]",
      input: "bg-orange-50/50 dark:bg-stone-950/50 border border-orange-200 dark:border-stone-800 focus:ring-orange-500/50 focus:border-orange-500 rounded-2xl outline-none",
      btnPrimary: "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl shadow-lg",
      btnGoogle: "bg-white dark:bg-stone-950 border border-orange-200 dark:border-stone-800 hover:bg-orange-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-200 rounded-2xl",
      btnGuest: "bg-orange-100/50 dark:bg-stone-800/50 hover:border-orange-300 dark:hover:border-stone-700 text-orange-700 dark:text-stone-300 rounded-2xl",
      ornament1: "bg-orange-500/10 blur-3xl",
      ornament2: "bg-pink-500/10 blur-3xl"
    }
  };

  // --- DICTIONARY TEKS DINAMIS ---
  const textDict = {
    formal: {
      heroTitle1: "Kendalikan Keamanan",
      heroTitle2: "Identitas Digitalmu.",
      heroSub: "Sistem manajemen kata sandi cerdas dengan enkripsi Zero-Knowledge, pemantauan kebocoran data, dan fitur pewarisan akses otomatis.",
      feat1: "Enkripsi Client-Side (Zero-Knowledge)",
      feat2: "Keamanan Tanpa Jejak Server",
      feat3: "Visualisasi Jaringan Akun & Relasi",
      authTitleLogin: "Selamat Datang Kembali",
      authTitleReg: "Buat Akun Baru",
      authSubLogin: "Masuk untuk mengakses brankas Anda.",
      authSubReg: "Mulai amankan identitas digital Anda.",
      phEmail: "Alamat Email",
      phPass: "Kata Sandi",
      btnLogin: "Masuk",
      btnReg: "Daftar Sekarang",
      toggleToReg: "Belum punya akun? Daftar gratis",
      toggleToLogin: "Sudah punya akun? Masuk di sini",
      separator: "Atau lanjutkan dengan",
      btnGoogle: "Google",
      btnGuest: "Coba Mode Tamu",
    },
    casual: {
      heroTitle1: "Amanin Semua",
      heroTitle2: "Akun Digital Kamu.",
      heroSub: "Simpan password tanpa was-was. Dilengkapi enkripsi canggih, cek data bocor otomatis, dan fitur warisan akun buat keluarga.",
      feat1: "Enkripsi Super Aman (Zero-Knowledge)",
      feat2: "Privasi Dijamin 100% Anti Ngintip",
      feat3: "Lihat Jalur Koneksi Akun & Keluarga",
      authTitleLogin: "Halo, Ketemu Lagi!",
      authTitleReg: "Bikin Akun Gratis",
      authSubLogin: "Yuk masuk buat buka brankas kamu.",
      authSubReg: "Mulai amanin data digital kamu sekarang.",
      phEmail: "Email kamu",
      phPass: "Password",
      btnLogin: "Masuk",
      btnReg: "Daftar Sekarang",
      toggleToReg: "Belum punya akun? Daftar dulu yuk",
      toggleToLogin: "Udah punya akun? Masuk di sini",
      separator: "Atau pakai cara cepat",
      btnGoogle: "Google",
      btnGuest: "Cobain Mode Tamu",
    },
    hacker: {
      heroTitle1: "SECURE YOUR",
      heroTitle2: "DIGITAL FOOTPRINT.",
      heroSub: "ADVANCED CIPHER MANAGEMENT. ZERO-KNOWLEDGE PROTOCOL. REAL-TIME BREACH MONITORING AND DEAD-MAN'S SWITCH AUTOMATION.",
      feat1: "CLIENT-SIDE_ENCRYPTION(AES-256)",
      feat2: "ZERO_SERVER_LOGS_PROTOCOL",
      feat3: "3D_NEURAL_ACCOUNT_TOPOLOGY",
      authTitleLogin: "INITIATE_HANDSHAKE",
      authTitleReg: "CREATE_NEW_ENTITY",
      authSubLogin: "AUTHENTICATE TO ACCESS ENCRYPTED VAULT.",
      authSubReg: "REGISTER NEW IDENTITY IN THE SYSTEM.",
      phEmail: "TARGET_EMAIL_ADDRESS",
      phPass: "INPUT_SECRET_KEY",
      btnLogin: "AUTHENTICATE",
      btnReg: "INITIALIZE_ENTITY",
      toggleToReg: "NO_ENTITY_FOUND? INITIATE_REGISTRATION",
      toggleToLogin: "ENTITY_EXISTS? INITIATE_HANDSHAKE",
      separator: "ALTERNATIVE_AUTH_PROTOCOLS",
      btnGoogle: "OAUTH: GOOGLE",
      btnGuest: "BYPASS: GUEST_MODE",
    }
  };

  const currentStyle = styles[theme];
  const t = textDict[theme];

  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500", currentStyle.wrapper)}>
      
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none flex justify-center items-center z-0">
        <div className={cn("absolute w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] -top-20 -left-20 animate-pulse transition-all duration-700", currentStyle.ornament1)} style={{ animationDuration: '8s' }} />
        <div className={cn("absolute w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bottom-0 right-0 animate-pulse transition-all duration-700", currentStyle.ornament2)} style={{ animationDuration: '10s' }} />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
        
        {/* Left Side - Brand & Value Proposition */}
        <div className="flex flex-col gap-5 text-center lg:text-left">
          <div className="inline-flex items-center justify-center lg:justify-start gap-3 mb-2">
            <div className={cn("w-12 h-12 flex items-center justify-center transition-all duration-500", currentStyle.brandIcon)}>
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Vault ID.</h1>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
            {t.heroTitle1} <br className="hidden lg:block" />
            <span className={cn("transition-colors duration-500", currentStyle.highlightText)}>
              {t.heroTitle2}
            </span>
          </h2>
          
          <p className="text-base lg:text-lg opacity-80 max-w-lg mx-auto lg:mx-0 leading-relaxed mt-2">
            {t.heroSub}
          </p>

          <div className="hidden lg:flex flex-col gap-4 mt-6">
            <FeatureItem icon={<LockKeyhole size={20} />} text={t.feat1} theme={theme} />
            <FeatureItem icon={<Fingerprint size={20} />} text={t.feat2} theme={theme} />
            <FeatureItem icon={<Network size={20} />} text={t.feat3} theme={theme} />
          </div>
        </div>

        {/* Right Side - Auth Card */}
        <div className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
          <div className={cn("p-8 transition-all duration-500 border", currentStyle.card)}>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">
                {isLoginMode ? t.authTitleLogin : t.authTitleReg}
              </h3>
              <p className="text-sm opacity-70">
                {isLoginMode ? t.authSubLogin : t.authSubReg}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Form Email & Password */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.phEmail}
                  required
                  className={cn("w-full pl-11 pr-4 py-3 transition-all text-sm border", currentStyle.input)}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.phPass}
                  required
                  className={cn("w-full pl-11 pr-12 py-3 transition-all text-sm tracking-wide border", currentStyle.input)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center opacity-40 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading !== null}
                className={cn("w-full font-semibold py-3 px-4 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1", currentStyle.btnPrimary)}
              >
                {isLoading === "email" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLoginMode ? (
                  t.btnLogin
                ) : (
                  t.btnReg
                )}
              </button>
            </form>

            <div className="text-center mb-6">
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError("");
                }}
                className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              >
                {isLoginMode ? t.toggleToReg : t.toggleToLogin}
              </button>
            </div>

            <div className="relative flex items-center py-2 mb-6">
              <div className="flex-grow border-t border-inherit opacity-20"></div>
              <span className="flex-shrink-0 mx-4 opacity-50 text-xs font-medium uppercase tracking-wider">{t.separator}</span>
              <div className="flex-grow border-t border-inherit opacity-20"></div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Login Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading !== null}
                className={cn("group relative flex items-center justify-center gap-3 w-full font-semibold py-3 px-4 transition-all disabled:opacity-70 text-sm border", currentStyle.btnGoogle)}
              >
                {isLoading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>{t.btnGoogle}</span>
              </button>

              {/* Guest Mode Button */}
              <button
                onClick={handleGuestMode}
                disabled={isLoading !== null}
                className={cn("group relative flex items-center justify-center gap-3 w-full font-semibold py-3 px-4 transition-all disabled:opacity-70 text-sm border border-transparent", currentStyle.btnGuest)}
              >
                {isLoading === "guest" ? (
                  <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                ) : (
                  <Compass className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
                <span>{t.btnGuest}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Kecil untuk List Fitur di Desktop dengan Adaptasi Tema Dinamis
function FeatureItem({ icon, text, theme }: { icon: React.ReactNode, text: string, theme: Theme }) {
  const iconStyles = {
    formal: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg",
    hacker: "bg-green-900/20 text-green-400 border border-green-500/30 rounded-sm",
    casual: "bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 rounded-xl"
  };

  const textStyles = {
    formal: "text-slate-700 dark:text-slate-300",
    hacker: "text-green-500",
    casual: "text-stone-700 dark:text-stone-300"
  };

  return (
    <div className={cn("flex items-center gap-3 transition-colors duration-500", textStyles[theme])}>
      <div className={cn("p-2.5 shadow-sm shrink-0 transition-all duration-500", iconStyles[theme])}>
        {icon}
      </div>
      <span className="font-medium text-sm lg:text-base">{text}</span>
    </div>
  );
}