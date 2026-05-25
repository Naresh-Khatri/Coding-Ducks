import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "~/app/styles.css";

import { Providers } from "~/components/providers";
import { UmamiScript } from "~/lib/analytics";
import { cn } from "~/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Coding Ducks",
  description: "The ultimate coding practice platform for developers.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&family=Source+Code+Pro:wght@400;500;700&display=swap"
        />
      </head>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <Providers>{props.children}</Providers>
        <UmamiScript />
      </body>
    </html>
  );
}
