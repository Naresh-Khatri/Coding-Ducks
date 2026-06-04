import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Design | Coding Ducks",
  description:
    "Practice system design with interactive drag-and-drop architecture puzzles and real-time traffic simulation.",
};

export default function SystemDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
