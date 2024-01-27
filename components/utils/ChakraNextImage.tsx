import { chakra } from "@chakra-ui/react";
import Image from "next/image";

export default chakra(Image, {
  shouldForwardProp: (prop) => ["width", "height", "src", "alt", "style"].includes(prop),
});
