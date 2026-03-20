"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account } from "@/lib/types/schema";
import { useTheme, Theme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, LockOpen, KeySquare, 
  Activity, Fingerprint, Search, ChevronRight, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// 3D Imports
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- HELPER: K-ANONYMITY SHA-1 HASHING ---
async function sha1(str: string) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Cek HIBP Pwned Passwords API (Gratis, Tanpa API Key, Aman)
async function checkPwned(password: string): Promise<number> {
  if (!password) return 0;
  try {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5); 
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return 0;
    const text = await res.text();
    
    const lines = text.split('\n');
    for (const line of lines) {
      const [lineSuffix, count] = line.split(':');
      if (lineSuffix === suffix) {
        return parseInt(count.trim(), 10); 
      }
    }
  } catch (e) {
    console.error("HIBP API Scan failed", e);
  }
  return 0;
}

// ==========================================
// 3D RADAR COMPONENTS (THREE.JS)
// ==========================================

function RadarRings({ theme }: { theme: Theme }) {
  const getColors = () => {
    if (theme === 'hacker') return { ring: '#064e3b', cross: '#065f46' }; // Green
    if (theme === 'casual') return { ring: '#fed7aa', cross: '#ffedd5' }; // Orange
    return { ring: '#e2e8f0', cross: '#cbd5e1' }; // Slate
  };
  const { ring, cross } = getColors();

  return (
    <group>
      {/* Garis Lingkaran Radar */}
      {[1, 2, 3, 4].map(r => (
        <mesh key={r}>
          <ringGeometry args={[r, r + 0.015, 64]} />
          <meshBasicMaterial color={ring} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Garis Silang (Crosshairs) */}
      <mesh>
         <planeGeometry args={[8, 0.015]} />
         <meshBasicMaterial color={cross} transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
         <planeGeometry args={[8, 0.015]} />
         <meshBasicMaterial color={cross} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function RadarSweep({ isScanning, theme }: { isScanning: boolean, theme: Theme }) {
  const meshRef = useRef<THREE.Group>(null!);
  
  useFrame((state, delta) => {
    if (isScanning && meshRef.current) {
      meshRef.current.rotation.z -= delta * 3; // Kecepatan sapuan
    }
  });

  const color = theme === 'hacker' ? '#22c55e' : theme === 'casual' ? '#f97316' : '#3b82f6';
  
  return (
    <group ref={meshRef}>
      {/* Membuat efek trail memudar menggunakan beberapa potongan lingkaran */}
      {[...Array(12)].map((_, i) => (
         <mesh key={i} rotation={[0, 0, (i * Math.PI) / 36]}>
           <circleGeometry args={[4.2, 32, 0, Math.PI / 36]} />
           <meshBasicMaterial color={color} transparent opacity={0.3 - (i * 0.025)} side={THREE.DoubleSide} depthWrite={false} />
         </mesh>
      ))}
    </group>
  );
}

function RadarBlips({ accounts, riskyAccounts, theme, isScanning }: { accounts: Account[], riskyAccounts: any[], theme: Theme, isScanning: boolean }) {
  // Generate posisi acak untuk setiap akun agar terlihat seperti titik di radar
  const blips = useMemo(() => {
    return accounts.map(acc => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 3.5 + 0.5; // Hindari menumpuk di tengah persis
      const risk = riskyAccounts.find(r => r.acc.id === acc.id);
      
      let color = theme === 'hacker' ? '#22c55e' : theme === 'casual' ? '#fb923c' : '#60a5fa';
      let isDanger = false;
      let pulseSpeed = 0;

      if (risk) {
        if (risk.severity === 'high') { color = '#ef4444'; isDanger = true; pulseSpeed = 10; } // Merah
        else if (risk.severity === 'medium') { color = '#f59e0b'; isDanger = true; pulseSpeed = 5; } // Kuning/Amber
        else { color = '#eab308'; isDanger = false; }
      }
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, color, isDanger, pulseSpeed };
    });
  }, [accounts, riskyAccounts, theme]);

  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (isScanning && groupRef.current) {
      // Bikin titik merah berkedip saat scanning
      groupRef.current.children.forEach((child: any, i) => {
        if (blips[i].isDanger) {
          const scale = 1 + Math.sin(state.clock.elapsedTime * blips[i].pulseSpeed) * 0.5;
          child.scale.set(scale, scale, scale);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {blips.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]}>
          <circleGeometry args={[b.isDanger ? 0.08 : 0.05, 16]} />
          <meshBasicMaterial color={b.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Radar3D({ isScanning, accounts, riskyAccounts, theme }: { isScanning: boolean, accounts: Account[], riskyAccounts: any[], theme: Theme }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 60 }}>
        <RadarRings theme={theme} />
        <RadarSweep isScanning={isScanning} theme={theme} />
        <RadarBlips accounts={accounts} riskyAccounts={riskyAccounts} theme={theme} isScanning={isScanning} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function RadarPage() {
  const router = useRouter();
  const { theme } = useTheme() as { theme: Theme };
  const { user, isGuest } = useAuth();
  
  const [loading, setLoading] = useState(true);
  
  // States for Radar
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [healthScore, setHealthScore] = useState(100);
  const [stats, setStats] = useState({ breached: 0, weak: 0, reused: 0 });
  const [riskyAccounts, setRiskyAccounts] = useState<{acc: Account, reason: string, severity: 'high'|'medium'|'low'}[]>([]);

  // 1. FETCH DATA AKUN
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      setAccounts(fetchedAccounts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- DICTIONARY TEKS DINAMIS ---
  const textDict = {
    formal: {
      title: "Radar Keamanan",
      subtitle: "Audit kebocoran data dan kekuatan kata sandimu (Didukung oleh HIBP API)",
      guestBadge: "Sesi Tamu",
      btnScan: "Mulai Audit Keamanan",
      btnScanning: (p: number) => `Memindai... ${p}%`,
      loadingInitial: "MENYIAPKAN RADAR...",
      systemIndex: "Skor Kesehatan Vault",
      totalNodes: "Akun Terdaftar",
      lastUpdate: "Update:",
      never: "Belum pernah",
      statusSafe: "AMAN & TERLINDUNGI",
      statusWarn: "WASPADA (BUTUH TINDAKAN)",
      statusCrit: "KRITIS / BERBAHAYA",
      statBreachTitle: "Kebocoran Data",
      statBreachSub: "Ditemukan di Dark Web",
      statWeakTitle: "Sandi Lemah",
      statWeakSub: "Sangat rawan diretas",
      statReusedTitle: "Sandi Kembar",
      statReusedSub: "Risiko domino tinggi",
      issuesTitle: "Prioritas Penanganan",
      issuesBadge: "ISSUES",
      analyzingText: (p: number) => `ANALYZING_ENCRYPTION_HASH... [${p}%]`,
      waitTitle: "Menunggu Audit",
      waitSub: "Klik tombol Pindai untuk mengevaluasi keamanan Vault Anda.",
      perfectTitle: "Vault dalam kondisi sempurna!",
      perfectSub: "Tidak ada kebocoran atau kelemahan yang terdeteksi pada akun Anda.",
      reasonBreach: (count: number) => `BOCOR! Sandi ini ditemukan ${count.toLocaleString()} kali di internet.`,
      reasonReused: (count: number) => `Sandi kembar (Digunakan di ${count} layanan berbeda).`,
      reasonWeak: 'Sandi terlalu lemah. Sangat rentan terhadap Brute Force.',
      reasonOld: (days: number) => `Sandi belum diganti selama ${Math.floor(days)} hari (Sandi Usang).`
    },
    casual: {
      title: "Radar Keamanan",
      subtitle: "Cek kebocoran data dan seberapa kuat password kamu di sini.",
      guestBadge: "Sesi Tamu",
      btnScan: "Mulai Scan Sekarang",
      btnScanning: (p: number) => `Lagi nge-scan... ${p}%`,
      loadingInitial: "NYIAPIN RADAR...",
      systemIndex: "Skor Keamanan Kamu",
      totalNodes: "Total Akun",
      lastUpdate: "Terakhir Cek:",
      never: "Belum pernah",
      statusSafe: "AMAN BANGET",
      statusWarn: "LUMAYAN BAHAYA",
      statusCrit: "BAHAYA BANGET",
      statBreachTitle: "Data Bocor",
      statBreachSub: "Ketemu di internet",
      statWeakTitle: "Password Lemah",
      statWeakSub: "Gampang ditebak",
      statReusedTitle: "Password Kembar",
      statReusedSub: "Bahaya kalau satu jebol",
      issuesTitle: "Masalah yang Harus Diberesin",
      issuesBadge: "MASALAH",
      analyzingText: (p: number) => `Lagi ngecek password... [${p}%]`,
      waitTitle: "Belum Di-scan",
      waitSub: "Klik tombol scan buat ngecek seberapa aman password kamu.",
      perfectTitle: "Aman Sentosa!",
      perfectSub: "Gak ada password yang bocor atau lemah. Pertahankan!",
      reasonBreach: (count: number) => `BOCOR! Password ini udah ketahuan ${count.toLocaleString()} kali di internet.`,
      reasonReused: (count: number) => `Password kembar (Kamu pakai di ${count} tempat lain).`,
      reasonWeak: 'Password terlalu lemah, gampang banget ditebak hacker.',
      reasonOld: (days: number) => `Password ini udah ${Math.floor(days)} hari gak diganti (Usang).`
    },
    hacker: {
      title: "SECURITY_RADAR",
      subtitle: "DEEP_WEB_MONITORING_SYSTEM (HIBP_PROTOCOL)",
      guestBadge: "GUEST_SESSION",
      btnScan: "INITIATE_DEEP_SCAN",
      btnScanning: (p: number) => `SCANNING_NETWORK... [${p}%]`,
      loadingInitial: "INITIALIZING_RADAR_ARRAY...",
      systemIndex: "SYSTEM_INTEGRITY_INDEX",
      totalNodes: "NODES_REGISTERED",
      lastUpdate: "LAST_SYNC:",
      never: "NULL",
      statusSafe: "SECURE // ENCRYPTED",
      statusWarn: "WARNING // VULNERABLE",
      statusCrit: "CRITICAL // BREACHED",
      statBreachTitle: "DATA_BREACHES",
      statBreachSub: "DARK_WEB_MATCH_FOUND",
      statWeakTitle: "WEAK_CIPHERS",
      statWeakSub: "BRUTE_FORCE_RISK",
      statReusedTitle: "REUSED_KEYS",
      statReusedSub: "DOMINO_EFFECT_RISK",
      issuesTitle: "VULNERABILITY_LOGS",
      issuesBadge: "THREATS",
      analyzingText: (p: number) => `DECRYPTING_HASH_TABLES... [${p}%]`,
      waitTitle: "AWAITING_COMMAND",
      waitSub: "EXECUTE SCAN TO EVALUATE SYSTEM INTEGRITY.",
      perfectTitle: "ZERO_VULNERABILITIES_DETECTED",
      perfectSub: "SYSTEM IS FULLY SECURED. NO BREACHES OR WEAK CIPHERS FOUND.",
      reasonBreach: (count: number) => `CRITICAL: Hash match found ${count.toLocaleString()} times in known breaches.`,
      reasonReused: (count: number) => `WARNING: Cipher reused across ${count} different nodes.`,
      reasonWeak: 'VULNERABILITY: Cipher entropy too low. Brute-force risk.',
      reasonOld: (days: number) => `AGING_CIPHER: Key unrotated for ${Math.floor(days)} days.`
    }
  };

  const t = textDict[theme];

  // 2. MESIN AUDIT LOKAL (Proporsional Scoring)
  const startDeepScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    let breachedCount = 0;
    let weakCount = 0;
    let reusedCount = 0;
    const riskyList: {acc: Account, reason: string, severity: 'high'|'medium'|'low'}[] = [];

    // Deteksi Sandi Digunakan Ulang
    const passwordMap = new Map<string, Account[]>();
    accounts.forEach(acc => {
      if (acc.password) {
        if (!passwordMap.has(acc.password)) passwordMap.set(acc.password, []);
        passwordMap.get(acc.password)!.push(acc);
      }
    });

    // Looping Audit Semua Akun
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      let isRisky = false;

      if (acc.password) {
        // A. Cek Kebocoran (Dark Web)
        const pwnedCount = await checkPwned(acc.password);
        if (pwnedCount > 0) {
          breachedCount++;
          riskyList.push({ acc, reason: t.reasonBreach(pwnedCount), severity: 'high' });
          isRisky = true;
        }

        // B. Cek Sandi Digunakan Ulang (Risiko Menengah)
        if (!isRisky && passwordMap.get(acc.password)!.length > 1) {
          reusedCount++;
          riskyList.push({ acc, reason: t.reasonReused(passwordMap.get(acc.password)!.length), severity: 'medium' });
          isRisky = true;
        }

        // C. Cek Sandi Lemah
        const isWeak = acc.password.length < 8 || !/\d/.test(acc.password) || !/[A-Za-z]/.test(acc.password);
        if (!isRisky && isWeak) {
          weakCount++;
          riskyList.push({ acc, reason: t.reasonWeak, severity: 'medium' });
          isRisky = true;
        }
      }

      // D. Cek Sandi Usang
      if (!isRisky && acc.lastUpdated) {
        const getLogDate = (val: any) => {
            if (val.seconds) return new Date(val.seconds * 1000);
            if (typeof val.toDate === 'function') return val.toDate();
            return new Date(val); 
        };
        const lastUpd = getLogDate(acc.lastUpdated);
        const daysOld = (new Date().getTime() - lastUpd.getTime()) / (1000 * 3600 * 24);
        
        if (daysOld > 180) {
          riskyList.push({ acc, reason: t.reasonOld(daysOld), severity: 'low' });
        }
      }
      
      setScanProgress(Math.round(((i + 1) / accounts.length) * 100));
    }

    // 3. KALKULASI SKOR KESEHATAN (RATA-RATA KESEHATAN AKUN)
    let totalPoints = 0;
    accounts.forEach(acc => {
        const risk = riskyList.find(r => r.acc.id === acc.id);
        if (!risk) {
            totalPoints += 100; // Akun sempurna = 100 Poin
        } else {
            if (risk.reason.includes("BOCOR") || risk.reason.includes("CRITICAL")) totalPoints += 0; // Bocor = 0 Poin
            else if (risk.reason.includes("lemah") || risk.reason.includes("VULNERABILITY")) totalPoints += 30; // Lemah = 30 Poin
            else if (risk.reason.includes("kembar") || risk.reason.includes("reused")) totalPoints += 60; // Kembar = 60 Poin
            else totalPoints += 80; // Usang = 80 Poin
        }
    });

    const score = accounts.length === 0 ? 100 : Math.round(totalPoints / accounts.length);
    
    // Sort List by Severity
    const severityMap = { high: 3, medium: 2, low: 1 };
    riskyList.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);

    setHealthScore(score);
    setStats({ breached: breachedCount, weak: weakCount, reused: reusedCount });
    setRiskyAccounts(riskyList);
    setLastScan(new Date());
    setIsScanning(false);
  };

  // --- PEMETAAN STYLE TEMA DINAMIS ---
  const styles = {
    formal: {
      wrapper: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100",
      panel: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800",
      accent: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-600",
      textMain: "text-slate-900 dark:text-slate-100",
      textSub: "text-slate-500",
      danger: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/50",
      warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50",
      safe: "text-emerald-600 dark:text-emerald-400",
      btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent rounded-lg",
      listItem: "hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-lg",
      progressBg: "bg-slate-200 dark:bg-slate-800",
      overlay: "bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/50"
    },
    hacker: {
      wrapper: "bg-[#050505] border-green-900/50 text-green-500 font-mono shadow-[0_0_30px_rgba(34,197,94,0.05)]",
      panel: "bg-[#020202] border-green-900/30 rounded-sm",
      accent: "text-cyan-400",
      accentBg: "bg-cyan-500",
      textMain: "text-green-400",
      textSub: "text-green-700",
      danger: "text-red-500 bg-red-950/20 border-red-900/50",
      warning: "text-amber-500 bg-amber-950/20 border-amber-900/50",
      safe: "text-green-400",
      btn: "bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/50 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]",
      listItem: "hover:bg-green-900/10 border-green-900/30 rounded-sm",
      progressBg: "bg-green-950",
      overlay: "bg-black/60 border-green-900/50"
    },
    casual: {
      wrapper: "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-orange-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 rounded-[2rem]",
      panel: "bg-orange-50/50 dark:bg-stone-950/50 border-orange-100 dark:border-stone-800 rounded-3xl",
      accent: "text-orange-500 dark:text-orange-400",
      accentBg: "bg-gradient-to-r from-orange-500 to-pink-500",
      textMain: "text-stone-800 dark:text-stone-100",
      textSub: "text-stone-500",
      danger: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 rounded-2xl",
      warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 rounded-2xl",
      safe: "text-emerald-500",
      btn: "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl shadow-lg border-transparent",
      listItem: "hover:bg-orange-100 dark:hover:bg-stone-800 border-orange-100 dark:border-stone-800 rounded-2xl",
      progressBg: "bg-orange-100 dark:bg-stone-800",
      overlay: "bg-white/50 dark:bg-stone-950/50 border-orange-200 dark:border-stone-800"
    }
  };

  const cs = styles[theme];

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[80vh] font-mono", cs.textMain)}>
        <Activity size={32} className={cn("animate-pulse mb-4", cs.accent)} />
        <span className="tracking-widest animate-pulse text-sm">{t.loadingInitial}</span>
      </div>
    );
  }

  let healthColor = cs.safe;
  let healthText = t.statusSafe;
  if (healthScore <= 50) { healthColor = "text-red-500 dark:text-red-400"; healthText = t.statusCrit; }
  else if (healthScore < 80) { healthColor = "text-amber-500 dark:text-amber-400"; healthText = t.statusWarn; }

  return (
    <div className={cn("min-h-[85vh] p-4 lg:p-6 border shadow-2xl overflow-hidden flex flex-col transition-colors duration-500", cs.wrapper)}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-inherit pb-6 z-10 relative">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 border flex items-center justify-center", cs.panel)}>
            <Activity className={isScanning ? "animate-spin text-red-500" : cs.accent} size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t.title}
              {isGuest && <span className={cn("text-[10px] px-2 py-0.5 border font-bold uppercase", cs.warning, "ml-2")}>{t.guestBadge}</span>}
            </h1>
            <p className={cn("text-xs mt-1 font-medium", cs.textSub)}>
              {t.subtitle}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end w-full md:w-auto">
            <button 
              onClick={startDeepScan}
              disabled={isScanning || accounts.length === 0}
              className={cn("px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50", cs.btn)}
            >
              <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? t.btnScanning(scanProgress) : t.btnScan}
            </button>
        </div>
      </div>

      {/* KONTEN RADAR */}
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RADAR VISUAL & SCORE */}
          <div className={cn("col-span-1 border p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[380px] bg-black/5 dark:bg-black/40", cs.panel)}>
            
            {/* 3D RADAR BACKGROUND */}
            <Radar3D isScanning={isScanning} accounts={accounts} riskyAccounts={riskyAccounts} theme={theme} />

            {/* SCORE OVERLAY (Glassmorphism over 3D Radar) */}
            <div className={cn("relative z-10 flex flex-col items-center text-center mt-4 p-6 rounded-2xl backdrop-blur-md shadow-2xl border transition-colors", cs.overlay)}>
              <div className={cn("text-7xl font-bold font-mono tracking-tighter drop-shadow-lg transition-colors", healthColor)}>{healthScore}</div>
              <div className={cn("text-sm font-bold tracking-widest mt-2 transition-colors", healthColor)}>{healthText}</div>
              <div className={cn("text-[10px] mt-2 max-w-[200px] leading-relaxed font-bold uppercase tracking-wider", cs.textSub)}>{t.systemIndex}</div>
            </div>

            {/* META FOOTER OVERLAY */}
            <div className={cn("mt-auto relative z-10 w-full pt-4 text-[10px] flex justify-between font-bold uppercase", cs.textSub)}>
              <span className="flex items-center gap-1 px-2 py-1 bg-black/10 dark:bg-white/10 rounded backdrop-blur-sm"><Fingerprint size={12}/> {accounts.length} {t.totalNodes.split(' ')[1] || t.totalNodes}</span>
              <span className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded backdrop-blur-sm">{t.lastUpdate} {lastScan ? lastScan.toLocaleTimeString() : t.never}</span>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={cn("p-4 border flex flex-col gap-3 transition-colors", cs.panel, stats.breached > 0 ? cs.danger : "")}>
                <div className="flex justify-between items-start">
                  <ShieldAlert size={20} className={stats.breached > 0 ? "animate-pulse text-red-500" : "opacity-50"} />
                  <span className="text-2xl font-bold font-mono">{stats.breached}</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{t.statBreachTitle}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{t.statBreachSub}</p>
                </div>
              </div>
              <div className={cn("p-4 border flex flex-col gap-3 transition-colors", cs.panel, stats.weak > 0 ? cs.warning : "")}>
                <div className="flex justify-between items-start">
                  <LockOpen size={20} className={stats.weak > 0 ? "text-amber-500" : "opacity-50"} />
                  <span className="text-2xl font-bold font-mono">{stats.weak}</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{t.statWeakTitle}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{t.statWeakSub}</p>
                </div>
              </div>
              <div className={cn("p-4 border flex flex-col gap-3 transition-colors", cs.panel, stats.reused > 0 ? cs.warning : "")}>
                <div className="flex justify-between items-start">
                  <KeySquare size={20} className={stats.reused > 0 ? "text-amber-500" : "opacity-50"} />
                  <span className="text-2xl font-bold font-mono">{stats.reused}</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{t.statReusedTitle}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{t.statReusedSub}</p>
                </div>
              </div>
            </div>

            {/* ACTION ITEMS (ISSUES LIST) */}
            <div className={cn("flex-1 border flex flex-col overflow-hidden max-h-[400px]", cs.panel)}>
              <div className="p-4 border-b border-inherit flex items-center justify-between bg-black/5">
                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                  <Search size={16} className={cs.accent} />
                  {t.issuesTitle}
                </h3>
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded", stats.breached + stats.weak + stats.reused > 0 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500")}>
                  {riskyAccounts.length} {t.issuesBadge}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {isScanning ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50 font-mono text-xs gap-3 min-h-[200px]">
                    <div className={cn("w-48 h-1.5 rounded-full overflow-hidden border border-inherit", cs.progressBg)}>
                      <div className={cn("h-full transition-all duration-300", cs.accentBg)} style={{ width: `${scanProgress}%` }} />
                    </div>
                    <span className="animate-pulse">{t.analyzingText(scanProgress)}</span>
                  </div>
                ) : !lastScan ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50 text-sm gap-2 min-h-[200px]">
                    <Activity size={48} className={cs.textSub} />
                    <p className="font-bold text-center">{t.waitTitle}</p>
                    <p className="text-xs text-center max-w-xs">{t.waitSub}</p>
                  </div>
                ) : riskyAccounts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50 text-sm gap-2 min-h-[200px]">
                    <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
                    <p className="font-bold">{t.perfectTitle}</p>
                    <p className="text-xs text-center max-w-xs">{t.perfectSub}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {riskyAccounts.map((item, idx) => {
                      let sevColor = 'text-blue-500'; let sevBg = 'bg-blue-500/10'; let Icon = ShieldAlert;
                      if (item.severity === 'high') { sevColor = 'text-red-500'; sevBg = 'bg-red-500/10'; Icon = ShieldAlert; }
                      else if (item.severity === 'medium') { sevColor = 'text-amber-500'; sevBg = 'bg-amber-500/10'; Icon = AlertTriangle; }

                      return (
                        <div 
                          key={idx} 
                          onClick={() => router.push(`/dashboard/vault/${item.acc.id}`)}
                          className={cn("p-3 md:p-4 border flex items-center justify-between gap-4 transition-colors group cursor-pointer", cs.listItem)}
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={cn("p-2.5 rounded-full shrink-0", sevBg, sevColor)}>
                              <Icon size={18} />
                            </div>
                            <div className="overflow-hidden">
                              <p className={cn("font-bold text-sm truncate transition-colors", cs.textMain, "group-hover:text-blue-500", theme==='hacker'&&'group-hover:text-green-400', theme==='casual'&&'group-hover:text-orange-500')}>
                                {item.acc.serviceName} 
                                <span className="ml-2 font-normal opacity-50 font-mono text-[10px]">{item.acc.identifier}</span>
                              </p>
                              <p className={cn("text-[10px] mt-1 truncate font-bold uppercase tracking-wider", item.severity === 'high' ? 'text-red-500' : cs.textSub)}>{item.reason}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className={cn("opacity-0 group-hover:opacity-100 transition-opacity shrink-0", cs.accent)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}