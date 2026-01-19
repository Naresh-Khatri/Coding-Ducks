import { Suspense } from "react";
// We can add a Navbar here later. For now, just a wrapper.
// import { Navbar } from "~/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navbar /> */}
      <div className="flex-1">
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
