import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faReact } from "@fortawesome/free-brands-svg-icons";
import { faLock, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext } from "react";
import { userContext } from "../contexts/userContext";

interface BottomActionsProps {
  setShowConsole: React.Dispatch<React.SetStateAction<boolean>>;
  showConsole: boolean;
  isLoading: boolean;
  runCode: (val: boolean) => void;
  isTutorialProblem: boolean;
}
function BottomActions({
  setShowConsole,
  showConsole,
  isLoading,
  runCode,
  isTutorialProblem,
}: BottomActionsProps) {
  const { user } = useContext(userContext);
  const toast = useToast();

  const notLoggedIn = !user?.username;
  const { isNoob } = user;

  return (
    <Box pos="relative" w={"100%"}>
      {!isTutorialProblem && (notLoggedIn || isNoob) && (
        <Center
          pos={"absolute"}
          w={"100%"}
          h={"52px"}
          bg={"rgba(0,0,0,0.4)"}
          borderRadius={"md"}
          zIndex={10}
          backdropFilter="auto"
          backdropBlur="1px"
          cursor={"not-allowed"}
          onClick={() => {
            toast({
              title: "Locked",
              description: "Solve above questions to unlock",
              status: "error",
              duration: 9000,
              isClosable: true,
            });
          }}
        >
          <FontAwesomeIcon
            style={{ marginRight: "10px" }}
            icon={faLock as IconProp}
          />
          {notLoggedIn && (
            <Text fontWeight={"bold"}>
              You need to be a member to run code.
            </Text>
          )}
          {isNoob && (
            <Text fontWeight={"bold"}>
              {" "}
              Solve starting 10 problem to unlock
            </Text>
          )}
        </Center>
      )}
      <Flex w="100%" h={"100%"} justify={"space-between"} align={"center"}>
        <Button
          onClick={() => setShowConsole((p) => !p)}
          bg={showConsole ? "gray.600" : ""}
          rightIcon={showConsole ? <ChevronDownIcon /> : <ChevronUpIcon />}
        >
          Console
        </Button>
        <HStack my={0} py={0}>
          <Button
            loadingText="Running..."
            isLoading={isLoading}
            bg="purple.600"
            leftIcon={<FontAwesomeIcon icon={faReact as IconProp} />}
            color="white"
            onClick={() => runCode(false)}
          >
            Run
          </Button>
          <Button
            loadingText="Running..."
            isLoading={isLoading}
            bg="green.400"
            leftIcon={<FontAwesomeIcon icon={faPlay as IconProp} />}
            color="white"
            onClick={() => runCode(true)}
          >
            Submit
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}

export default BottomActions;
