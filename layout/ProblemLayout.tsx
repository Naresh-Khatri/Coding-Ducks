import {
  Flex,
  HStack,
  IconButton,
  Spacer,
} from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faHome, faLeftLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import UserProfile from "../components/UserProfile";
import Timer from "../components/Timer";

interface ProblemLayoutProps {
  children: React.ReactNode;
}
function ProblemLayout({ children }: ProblemLayoutProps) {
  return (
    <Flex direction={"column"} h={"100vh"}>
      <Flex
        as="nav"
        alignItems={"center"}
        // bg="purple.600"
        // color={"white"}
        w={"100vw"}
        px={2}
        h={"70px"}
      >
        <HStack alignItems={"center"} h={"70px"}>
          <Link href={"/problems"}>
            <IconButton
              aria-label="Go back"
              bg={"transparent"}
              icon={
                <FontAwesomeIcon
                  height={"1.2rem"}
                  icon={faLeftLong as IconProp}
                />
              }
            />
          </Link>
          <Link href={"/"}>
            <IconButton
              aria-label="Go home"
              bg={"transparent"}
              icon={
                <FontAwesomeIcon height={"1.2rem"} icon={faHome as IconProp} />
              }
            />
          </Link>
        </HStack>
        <Spacer />
        {/* <Timer /> */}
        <Spacer />
        <HStack>
          {/* <Timer /> */}
          <ThemeToggler />
          <UserProfile />
        </HStack>
      </Flex>
      <Flex w={"100vw"} flexGrow={1} overflowY="hidden">
        {/* <EditorSettingsProvider>{children}</EditorSettingsProvider> */}
        {children}
      </Flex>
    </Flex>
  );
}

export default ProblemLayout;
