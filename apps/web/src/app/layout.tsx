import type { Metadata, Viewport } from "next";
import {
  Fira_Code,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Source_Code_Pro,
} from "next/font/google";

import "~/app/styles.css";

import { Providers } from "~/components/providers";
import { env } from "~/env";
import { UmamiScript } from "~/lib/analytics";
import { cn } from "~/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(env.BASE_URL),
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
const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-fira-code",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-source-code-pro",
  display: "swap",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
          firaCode.variable,
          ibmPlexMono.variable,
          jetbrainsMono.variable,
          sourceCodePro.variable,
        )}
      >
        <Providers>{props.children}</Providers>
        <UmamiScript />
      </body>
    </html>
  );
}
