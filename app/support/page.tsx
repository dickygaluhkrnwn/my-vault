"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LifeBuoy, Mail, Sparkles, ShieldAlert, Info, 
  HelpCircle, ChevronDown, ExternalLink 
} from 'lucide-react';

const FAQS = [
  {
    q: "Apa yang harus saya lakukan jika lupa kata sandi akun (Master Password)?",
    a: "Karena Vault ID menggunakan enkripsi Client-Side (Zero-Knowledge), kami TIDAK menyimpan salinan kata sandi Anda di server kami. Jika Anda lupa kata sandi, Anda bisa meminta tautan reset. Namun, perhatikan bahwa me-reset kata sandi mungkin akan menghilangkan akses Anda ke data lama yang terenkripsi oleh kunci sebelumnya."
  },
  {
    q: "Apakah data biometrik saya dikirim ke server Vault ID?",
    a: "TIDAK. Pemindaian biometrik (Sidik Jari / Face ID) diproses 100% secara lokal oleh perangkat keras ponsel Anda. Aplikasi hanya menerima sinyal 'Berhasil' atau 'Gagal' dari sistem operasi."
  },
  {
    q: "Bagaimana cara kerja fitur Bagikan Tautan (Burn-on-Read)?",
    a: "Saat Anda membagikan kredensial, sistem akan mengenkripsi data tersebut dan menyimpannya sementara. Ketika penerima membuka tautan tersebut, data akan ditampilkan satu kali, lalu secara otomatis DIHAPUS secara permanen dari server kami. Jika tautan tidak dibuka dalam 24 jam, ia juga akan hangus dengan sendirinya."
  },
  {
    q: "Apakah aman menyimpan data menggunakan Mode Tamu (Guest Mode)?",
    a: "Mode Tamu aman, namun TIDAK PERMANEN. Data yang Anda buat di Mode Tamu hanya disimpan di cache sementara browser/perangkat saat ini. Jika Anda membersihkan cache atau pindah perangkat, data akan hilang. Untuk menyimpannya secara permanen, tautkan akun Google Anda."
  },
  {
    q: "Bagaimana Security Radar mengetahui kata sandi saya bocor tanpa mengetahui isinya?",
    a: "Kami menggunakan protokol k-Anonymity. Aplikasi mengubah sandi Anda menjadi Hash SHA-1, lalu hanya mengirimkan 5 karakter pertama dari hash tersebut ke database keamanan publik. Pencocokan akhir dilakukan secara lokal di perangkat Anda, sehingga privasi Anda terjaga mutlak."
  }
];

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020202] py-16 px-4 sm:px-6 lg:px-8 flex justify-center">
      {/* 🚨 DIUBAH: max-w-4xl menjadi max-w-5xl agar lebih lebar dan lega */}
      <div className="max-w-5xl w-full animate-in fade-in duration-700 slide-in-from-bottom-8">
        
        {/* Header Section */}
        <div className="mb-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-blue-600 dark:bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl">
            <LifeBuoy size={36} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Pusat Bantuan
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Temukan panduan penggunaan, solusi kendala, dan jawaban untuk pertanyaan seputar Vault ID.
          </p>
        </div>

        {/* Contact Support Card */}
        <div className="mb-10 p-8 md:p-10 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[2rem] text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 opacity-5">
            <LifeBuoy size={250} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm mb-5">
              <Mail size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Butuh Bantuan Langsung?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Tim dukungan kami siap membantu mengatasi masalah yang Anda alami. Jangan ragu untuk menghubungi kami.
            </p>
            <a 
              href="mailto:ikytech.id@gmail.com?subject=Bantuan%20Vault%20ID%20Web"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold tracking-wider uppercase transition-colors shadow-md"
            >
              <ExternalLink size={18} />
              Kirim Email Sekarang
            </a>
            <p className="text-xs font-mono text-gray-500 mt-4">ikytech.id@gmail.com</p>
          </div>
        </div>

        {/* Quick Guide Section */}
        <div className="mb-10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 ml-2">
            Panduan Cepat
          </h3>
          <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-200 dark:border-gray-800 p-2">
            
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex gap-4 md:gap-6">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-fit shrink-0">
                <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Menambah Kredensial Baru</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                  Buka menu <strong className="text-gray-900 dark:text-gray-200">Vault</strong> di navigasi utama, lalu klik tombol <strong className="text-gray-900 dark:text-gray-200">Tambah Data</strong>. Anda bisa menyimpan username, kata sandi, hingga data kustom lainnya dengan aman.
                </p>
              </div>
            </div>

            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex gap-4 md:gap-6">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-fit shrink-0">
                <ShieldAlert size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Membagikan Data Aman</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                  Buka detail salah satu akun Anda, lalu klik tombol <strong className="text-gray-900 dark:text-gray-200">Bagikan</strong>. Sistem akan membuat tautan <em>Burn-on-Read</em> yang akan otomatis hangus setelah penerima membukanya satu kali.
                </p>
              </div>
            </div>

            <div className="p-4 md:p-6 flex gap-4 md:gap-6">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-fit shrink-0">
                <Info size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Keamanan Tambahan</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                  Untuk versi Web, pastikan Anda menautkan akun Google Anda di menu Pengaturan agar data tidak hilang jika cache browser terhapus. Untuk pengguna Mobile, aktifkan kunci Biometrik.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 ml-2 flex items-center gap-2">
            <HelpCircle size={16} /> Pertanyaan Populer (FAQ)
          </h3>
          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className={`border overflow-hidden transition-all duration-300 rounded-2xl ${
                    isOpen 
                      ? 'border-blue-500 shadow-md bg-white dark:bg-[#0a0a0a]' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#050505] hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between focus:outline-none"
                  >
                    <span className={`font-bold text-sm md:text-base pr-4 ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                      {faq.q}
                    </span>
                    <div className={`p-1.5 rounded-lg transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                      <ChevronDown size={16} />
                    </div>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-5 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base border-t border-gray-100 dark:border-gray-800 mt-2">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-center pb-12">
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