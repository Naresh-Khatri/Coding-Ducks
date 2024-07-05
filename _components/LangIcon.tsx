import React from "react";
import { Lang } from "../types";
import FAIcon from "./FAIcon";
import {
  faCuttlefish,
  faJava,
  faPython,
  faSquareJs,
} from "@fortawesome/free-brands-svg-icons";
import { Box, Flex, Text } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

function LangIcon({ lang, height }: { lang: Lang; height: string }) {
  if (lang === "py")
    return <FAIcon icon={faPython as IconProp} height={height} />;
  if (lang === "js")
    return <FAIcon icon={faSquareJs as IconProp} height={height} />;
  if (lang === "java")
    return <FAIcon icon={faJava as IconProp} height={height} />;
  if (lang === "c")
    return <FAIcon icon={faCuttlefish as IconProp} height={height} />;
  if (lang === "cpp")
    return (
      <Flex alignItems={"center"}>
        <FAIcon icon={faCuttlefish as IconProp} height={height} />
        <Text fontWeight={"extrabold"} fontSize={"2xl"}>
          ++
        </Text>
      </Flex>
    );
}

export default LangIcon;
