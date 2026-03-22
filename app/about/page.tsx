"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Info, ShieldCheck, BookOpen, Code2, Building2, ChevronRight, FileText
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020202] py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-5xl w-full animate-in fade-in duration-700 slide-in-from-bottom-8">

        {/* --- HEADER HERO --- */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-12 border-b border-gray-200 dark:border-gray-800 pb-10">
          <div className="w-28 h-28 md:w-32 md:h-32 bg-blue-600 dark:bg-blue-500 rounded-[2rem] flex items-center justify-center shadow-xl shrink-0">
            <Info size={48} className="text-white" strokeWidth={2} />
          </div>
          <div className="text-center md:text-left flex-1 mt-2 md:mt-0">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Vault ID.
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-3 max-w-2xl leading-relaxed mx-auto md:mx-0">
              Sistem manajemen identitas digital dan kata sandi dengan enkripsi mutakhir (Zero-Knowledge) yang memastikan privasi data Anda selalu terjaga.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
              <span className="text-xs font-bold font-mono uppercase tracking-widest">Version 1.0.0</span>
            </div>
          </div>
        </div>

        {/* --- CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: Credits & Info */}
          <div className="lg:col-span-5 space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 ml-2">
                Informasi Pengembang
             </h3>

             <div className="p-6 bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 transition-colors hover:border-blue-300 dark:hover:border-blue-900">
                <div className="p-3 bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 shrink-0">
                  <Code2 size={24} className="text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Pengembang Utama</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">IKY Tech</p>
                </div>
             </div>

             <div className="p-6 bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 transition-colors hover:border-blue-300 dark:hover:border-blue-900">
                <div className="p-3 bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 shrink-0">
                  <Building2 size={24} className="text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Perusahaan</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">Humaira Innovative Group</p>
                </div>
             </div>
          </div>

          {/* KOLOM KANAN: Legal & Dokumen Hub */}
          <div className="lg:col-span-7 space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 ml-2">
                Dokumen & Legalitas
             </h3>

             {/* Tautan ke Kebijakan Privasi */}
             <Link 
                href="/privacy" 
                className="group flex items-center p-6 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900/50 transition-all"
             >
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Kebijakan Privasi
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Pelajari aturan pengumpulan, penyimpanan, dan keamanan data kredensial Anda.
                  </p>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
             </Link>

             {/* Tautan ke Lisensi Open Source */}
             <Link 
                href="/licenses" 
                className="group flex items-center p-6 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-900/50 transition-all"
             >
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Lisensi Open Source
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Atribusi resmi pustaka perangkat lunak pihak ketiga yang digunakan.
                  </p>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
             </Link>

             {/* 🚨 FIX: Tautan ke Syarat & Ketentuan Aktif */}
             <Link 
                href="/terms" 
                className="group flex items-center p-6 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-900/50 transition-all text-left"
             >
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Syarat & Ketentuan
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Peraturan dan batasan hukum dalam penggunaan layanan Vault ID.
                  </p>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
             </Link>

          </div>
        </div>

        {/* --- FOOTER COPYRIGHT --- */}
        <div className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold font-mono tracking-widest uppercase text-gray-400 dark:text-gray-500 pb-12">
           <p>© 2026 IKY TECH</p>
           <p>HUMAIRA INNOVATIVE GROUP</p>
        </div>

      </div>
    </div>
  );
}