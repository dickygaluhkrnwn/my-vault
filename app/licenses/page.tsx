import React from 'react';
import Link from 'next/link';
import { BookOpen, Scale, Code2, ExternalLink } from 'lucide-react';

const LIBRARIES = [
  {
    name: "Next.js",
    author: "Vercel, Inc.",
    license: "MIT License",
    desc: "Framework React untuk produksi yang memberikan arsitektur dasar, routing, dan optimasi performa halaman web Vault ID.",
    link: "https://nextjs.org/"
  },
  {
    name: "React",
    author: "Meta Platforms, Inc.",
    license: "MIT License",
    desc: "Pustaka JavaScript inti untuk membangun antarmuka pengguna (User Interface) yang interaktif.",
    link: "https://react.dev/"
  },
  {
    name: "Tailwind CSS",
    author: "Tailwind Labs, Inc.",
    license: "MIT License",
    desc: "Kerangka kerja CSS utility-first yang memungkinkan desain antarmuka modern dan responsif secara cepat.",
    link: "https://tailwindcss.com/"
  },
  {
    name: "Firebase SDK",
    author: "Google LLC",
    license: "Apache License 2.0",
    desc: "Infrastruktur Backend-as-a-Service (BaaS) untuk sistem autentikasi dan database Firestore real-time.",
    link: "https://firebase.google.com/"
  },
  {
    name: "Three.js & React Three Fiber",
    author: "Mr.doob & Poimandres",
    license: "MIT License",
    desc: "Mesin rendering 3D WebGL yang mendasari visualisasi Peta Jaringan (Network Graph) dan Radar Keamanan interaktif.",
    link: "https://docs.pmnd.rs/react-three-fiber"
  },
  {
    name: "Lucide React",
    author: "Lucide Contributors",
    license: "ISC License",
    desc: "Kumpulan ikon vektor (SVG) open-source yang cantik dan konsisten yang digunakan di seluruh aplikasi.",
    link: "https://lucide.dev/"
  }
];

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020202] py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-5xl w-full animate-in fade-in duration-700 slide-in-from-bottom-8">
        
        {/* Header Section */}
        <div className="mb-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-blue-600 dark:bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl">
            <BookOpen size={36} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Lisensi Open Source
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Vault ID dibangun dengan bantuan teknologi sumber terbuka (open-source) kelas dunia. Kami berterima kasih kepada komunitas pengembang atas kontribusi luar biasa mereka.
          </p>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LIBRARIES.map((lib, idx) => (
            <div 
              key={idx} 
              className="p-6 md:p-8 bg-gray-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900/50 transition-colors shadow-sm flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                    <Code2 size={20} className="text-blue-600 dark:text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{lib.name}</h2>
                </div>
                <a 
                  href={lib.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Kunjungi Website"
                >
                  <ExternalLink size={18} />
                </a>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                {lib.desc}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-gray-200 dark:border-gray-800/50 mt-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg text-blue-700 dark:text-blue-400">
                  <Scale size={14} />
                  <span className="text-xs font-bold font-mono tracking-widest uppercase">{lib.license}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                  © {lib.author}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-12 text-center opacity-60 flex flex-col items-center gap-3">
          <Scale size={32} className="text-gray-400" />
          <p className="text-xs font-mono tracking-widest text-gray-500 uppercase max-w-md">
            PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. ALL TRADEMARKS ARE THE PROPERTY OF THEIR RESPECTIVE OWNERS.
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex justify-center pb-12">
          <Link 
            href="/" 
            className="group flex items-center gap-3 px-8 py-4 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/50 shadow-sm transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1.5 transition-transform">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            KEMBALI KE BERANDA
          </Link>
        </div>

      </div>
    </div>
  );
}