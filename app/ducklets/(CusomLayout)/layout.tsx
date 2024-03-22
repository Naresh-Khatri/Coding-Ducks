import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";
import NormalLayout from "../../../layout/NormalLayout";

function DuckletsLayout({ children }: { children: ReactNode }) {
  return <NormalLayout>{children}</NormalLayout>;
}

export default DuckletsLayout;
