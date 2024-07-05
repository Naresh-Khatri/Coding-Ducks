import { ReactNode } from "react";
import NormalLayout from "../../../layout/NormalLayout";
import generateMeta from "_components/SEO/generateMeta";

export async function generateMetadata() {
  const metaData = generateMeta({
    title: `Ducklets | CodingDucks`,
    description: "Welcome to Ducklets!",
    url: `https://www.codingducks.xyz/ducklets`,
  });
  return metaData;
}
function DuckletsLayout({ children }: { children: ReactNode }) {
  return <NormalLayout>{children}</NormalLayout>;
}

export default DuckletsLayout;
