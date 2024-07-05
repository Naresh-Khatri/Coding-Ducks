import { ReactNode } from "react";
import NormalLayout from "../../../layout/NormalLayout";
import generateMeta from "_components/SEO/generateMeta";

export async function generateMetadata() {
  const metaData = generateMeta({
    title: `UI Challenges | CodingDucks`,
    description: "Welcome to Ducklets!",
    url: `https://www.codingducks.xyz/ui-challenges`,
  });
  return metaData;
}
function UIChallengesLayout({ children }: { children: ReactNode }) {
  return <NormalLayout>{children}</NormalLayout>;
}

export default UIChallengesLayout;
