import { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Next.js",
};
import "../styles/globals.css";
import "../styles/split.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
