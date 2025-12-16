import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      {/* ml-64 memberikan margin kiri agar konten tidak tertutup sidebar */}
      <main className="ml-64 min-h-screen bg-slate-50 text-slate-900">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}