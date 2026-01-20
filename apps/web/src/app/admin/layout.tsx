import { Suspense } from "react";
import { AdminSidebar } from "./components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <Suspense fallback={<div className="p-8">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
