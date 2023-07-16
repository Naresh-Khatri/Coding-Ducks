import { Button, Flex, HStack, IconButton, Spacer } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBars, faCode, faLeftLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import UserProfile from "../components/UserProfile";
import { useContext } from "react";
import { EditorSettingsContext } from "../contexts/editorSettingsContext";

interface ProblemLayoutProps {
  children: React.ReactNode;
}
function ProblemLayout({ children }: ProblemLayoutProps) {
  const { setBottomSheetIsOpen } = useContext(EditorSettingsContext);
  return (
    <Flex direction={"column"} h={"100dvh"}>
      <Flex as="nav" alignItems={"center"} w={"100vw"} px={2} h={"70px"}>
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
        </HStack>
        <Spacer />
        <Link href={"/problems"}>
          <Button leftIcon={<FontAwesomeIcon icon={faBars as IconProp} />}>
            Problems
          </Button>
        </Link>
        <Spacer />
        <HStack>
          <ThemeToggler />
          <UserProfile />
        </HStack>
      </Flex>
      <Flex w={"100vw"} flexGrow={1} overflowY="hidden">
        {children}
      </Flex>
      <Flex display={{ base: "flex", md: "none" }}>
        <Button
          position={"absolute"}
          bottom={0}
          w={"100%"}
          zIndex={0}
          colorScheme="purple"
          leftIcon={<FontAwesomeIcon icon={faCode as IconProp} />}
          onClick={() => setBottomSheetIsOpen(true)}
        >
          Open Editor
        </Button>
      </Flex>
    </Flex>
  );
}

export default ProblemLayout;
