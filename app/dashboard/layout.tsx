import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar Fixed di Kiri */}
      <Sidebar />

      {/* Main Content Area */}
      {/* ml-64 memberikan margin kiri agar konten tidak tertutup sidebar */}
      {/* w-full memastikan konten mengambil sisa lebar */}
      <main className="flex-1 ml-64 min-h-screen bg-slate-950 text-slate-200 transition-all duration-300 relative">
        {/* Global Grid Background Effect untuk Dashboard */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
             style={{ 
                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                 backgroundSize: '50px 50px' 
             }} 
        />
        
        <div className="p-8 max-w-[1600px] mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}