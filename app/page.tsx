"use client";

import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  Terminal, 
  Lock, 
  Cpu, 
  ChevronRight,
  Power
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- THEME CONFIG ---
const THEME = {
  bg: "bg-slate-950",
  textMain: "text-cyan-400",
  textDim: "text-slate-500",
  border: "border-cyan-900/30",
  inputBg: "bg-slate-900/50",
  glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
};

export default function Home() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // State untuk Animasi Booting
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [isBooted, setIsBooted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // LOGS BOOTING PALSU TAPI KEREN
  const fullLogs = [
    "INITIALIZING_KERNEL...",
    "LOADING_MODULES... [OK]",
    "CHECKING_INTEGRITY... [VERIFIED]",
    "ESTABLISHING_SECURE_TUNNEL...",
    "ENCRYPTING_DATA_STREAM... [256-BIT]",
    "MOUNTING_VAULT_DRIVE...",
    "ACCESS_CONTROL_LIST... [LOADED]",
    "SYSTEM_READY."
  ];

  // Efek Booting saat pertama kali load
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullLogs.length) {
        setBootLogs(prev => [...prev, fullLogs[currentIndex]]);
        currentIndex++;
        // Auto scroll ke bawah
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooted(true), 800); // Jeda sebelum masuk form
      }
    }, 100); // Kecepatan ketikan log

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Efek dramatis sedikit delay
      await new Promise(r => setTimeout(r, 800)); 
      await signInWithEmailAndPassword(auth, email, password);
      // Suara akses diterima (imajiner) -> Redirect
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      // Pesan error gaya terminal
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("ACCESS_DENIED: INVALID_CREDENTIALS");
      } else if (err.code === 'auth/too-many-requests') {
        setError("SYSTEM_LOCKOUT: TOO_MANY_ATTEMPTS");
      } else {
        setError(`SYSTEM_ERROR: ${err.code}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- TAMPILAN BOOT SCREEN ---
  if (!isBooted) {
    return (
      <div className={`min-h-[100dvh] ${THEME.bg} flex items-center justify-center font-mono p-4`}>
        <div className="w-full max-w-md space-y-2">
            <div className="flex items-center gap-2 text-cyan-500 mb-4 animate-pulse">
                <Terminal size={24} />
                <span className="font-bold tracking-widest">BOOT_SEQUENCE</span>
            </div>
            <div 
                ref={scrollRef}
                className="h-64 max-h-[50vh] bg-slate-900/50 border border-slate-800 rounded p-4 overflow-y-auto font-mono text-xs md:text-sm text-green-400 shadow-inner custom-scrollbar"
            >
                {bootLogs.map((log, i) => (
                    <div key={i} className="mb-1">
                        <span className="text-slate-500 mr-2">{`[${String(i).padStart(3, '0')}]`}</span>
                        <span className="typing-effect">{log}</span>
                    </div>
                ))}
                <div className="animate-pulse text-cyan-500">_</div>
            </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA (LOGIN FORM) ---
  return (
    <div className={`min-h-[100dvh] ${THEME.bg} flex items-center justify-center font-mono relative overflow-hidden p-4`}>
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', 
               backgroundSize: '30px 30px' 
           }} 
      />
      
      {/* Content Container */}
      <div className={`w-full max-w-md p-6 md:p-8 rounded-xl border ${THEME.border} bg-slate-900/80 backdrop-blur-md relative z-10 ${THEME.glow} animate-in zoom-in-95 duration-500`}>
        
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-t-xl" />
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 md:mb-8">
          <div className="p-3 bg-cyan-500/10 rounded-full mb-3 ring-1 ring-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <ShieldCheck size={32} className="text-cyan-400 md:w-10 md:h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-widest text-cyan-100 uppercase">
            System Access Portal
          </h2>
          <p className="mt-1 text-[10px] md:text-xs text-slate-500 tracking-wider">
            SECURE // ENCRYPTED // PRIVATE
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
          
          {error && (
            <div className="flex items-center gap-3 p-3 text-xs font-bold text-red-400 bg-red-950/30 border border-red-900/50 rounded animate-in shake">
              <AlertCircle size={16} className="shrink-0 animate-pulse" />
              <span>{'>'} {error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Input Email Style Terminal */}
            <div className="group">
              <label className="block text-xs font-bold text-cyan-600 mb-1 uppercase tracking-wider ml-1 group-focus-within:text-cyan-400 transition-colors">
                User_Identifier
              </label>
              <div className={`flex items-center ${THEME.inputBg} border border-slate-700 rounded p-2 focus-within:border-cyan-500/70 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all`}>
                <ChevronRight size={16} className="text-slate-600 mr-2 shrink-0 group-focus-within:text-cyan-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // text-base di mobile mencegah zoom iOS, text-sm di desktop
                  className="bg-transparent border-none outline-none text-slate-200 text-base md:text-sm w-full placeholder:text-slate-700 font-mono"
                  placeholder="admin@root.system"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Input Password Style Terminal */}
            <div className="group">
              <label className="block text-xs font-bold text-cyan-600 mb-1 uppercase tracking-wider ml-1 group-focus-within:text-cyan-400 transition-colors">
                Access_Key
              </label>
              <div className={`flex items-center ${THEME.inputBg} border border-slate-700 rounded p-2 focus-within:border-cyan-500/70 focus-within:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all`}>
                <Lock size={14} className="text-slate-600 mr-2 shrink-0 group-focus-within:text-cyan-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // text-base di mobile mencegah zoom iOS, text-sm di desktop
                  className="bg-transparent border-none outline-none text-slate-200 text-base md:text-sm w-full placeholder:text-slate-700 tracking-widest font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-600 hover:text-cyan-400 transition-colors px-2 text-[10px] md:text-xs font-bold uppercase shrink-0"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full relative group overflow-hidden rounded bg-cyan-900/20 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-300 font-bold py-3 px-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {/* Animasi Scanline pada Button */}
            <div className="absolute inset-0 w-1 bg-cyan-400/30 group-hover:w-full transition-all duration-500 ease-out opacity-20" />
            
            <div className="flex items-center justify-center gap-2 relative z-10 text-xs md:text-sm">
                {isLoading ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AUTHENTICATING...</span>
                </>
                ) : (
                <>
                    <Power size={18} />
                    <span>INITIATE SESSION</span>
                </>
                )}
            </div>
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-6 md:mt-8 pt-4 border-t border-slate-800 flex justify-between text-[10px] text-slate-600 font-mono">
          <span>IP: 192.168.x.x [LOGGED]</span>
          <span className="flex items-center gap-1">
            <Cpu size={10} /> SYS_OPTIMAL
          </span>
        </div>
      </div>
    </div>
  );
}