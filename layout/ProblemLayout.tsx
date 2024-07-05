import { Button, Flex, HStack, IconButton, Spacer } from "@chakra-ui/react";
import { faBars, faCode, faLeftLong } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import ThemeToggler from "../_components/ThemeToggler";
import UserProfile from "../_components/UserProfile";
import { useContext } from "react";
import { EditorSettingsContext } from "../contexts/editorSettingsContext";
import FAIcon from "../_components/FAIcon";

interface ProblemLayoutProps {
  children: React.ReactNode;
}
function ProblemLayout({ children }: ProblemLayoutProps) {
  const { setBottomSheetIsOpen } = useContext(EditorSettingsContext);
  return (
    <Flex direction={"column"} h={"100dvh"}>
      <Flex as="nav" alignItems={"center"} w={"100vw"} px={2} h={"4rem"}>
        <HStack alignItems={"center"} h={"4rem"}>
          <Link href={"/problems"}>
            <IconButton
              aria-label="Go back"
              bg={"transparent"}
              icon={<FAIcon icon={faLeftLong} />}
            />
          </Link>
        </HStack>
        <Spacer />
        <Link href={"/problems"}>
          <Button leftIcon={<FAIcon icon={faBars} />}>Problems</Button>
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
          leftIcon={<FAIcon icon={faCode} />}
          onClick={() => setBottomSheetIsOpen(true)}
        >
          Open Editor
        </Button>
      </Flex>
    </Flex>
  );
}

export default ProblemLayout;
