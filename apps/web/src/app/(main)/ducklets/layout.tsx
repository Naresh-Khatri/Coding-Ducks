import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ducklets · Coding Ducks",
  description:
    "Real-time collaborative coding rooms for pair programming and interviews.",
};

export default function DuckletsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
