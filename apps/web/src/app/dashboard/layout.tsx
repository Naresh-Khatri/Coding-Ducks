import { Suspense } from "react";

import { Navbar } from "~/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl p-6">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
