import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Machine Coding · Coding Ducks",
  description:
    "Practice the most-asked machine-coding interview questions in a real in-browser IDE. No login required.",
};

export default function MachineCodingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
