import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Problems | Coding Ducks",
  description:
    "Browse and solve coding problems across multiple languages with instant online judging.",
};

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
