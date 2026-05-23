import { WipBanner } from "./_components/wip-banner";

export default function SystemDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <WipBanner />
      {children}
    </div>
  );
}
