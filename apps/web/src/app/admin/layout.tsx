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
      <main className="bg-background flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-8">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
