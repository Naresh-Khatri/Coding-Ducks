import { Metadata } from "next";
import Providers from "./providers";

import "../styles/globals.css";
import "../styles/split.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://acme.com"),
  title: "Coding Ducks - Enhance Your Coding Skills with Fun Challenges",
  description:
    "Join Coding Ducks and take your coding skills to new heights. Solve coding challenges, practice programming in Python, JavaScript, C++, and Java, and level up your coding expertise.",
  keywords:
    "coding challenges, programming practice, Python, JavaScript, C++, Java, coding skills, coding platform, algorithmic problem solving",
  authors: [{ name: "naresh", url: "https://www.github.com/naresh-khatri" }],
  openGraph: {
    title: "Ducklets | CodingDucks",
    description: "Welcome to Ducklets!",
    url: "https://www.codingducks.live/",
  },
};

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
