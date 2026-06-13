import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Interview rooms are private (never publicly listed), so there's no public OG
 * preview to attach — a generic title is all a crawler should ever see.
 */
export const metadata: Metadata = {
  title: "Interview · Coding Ducks",
};

export default function InterviewLayout({ children }: LayoutProps) {
  return children;
}
