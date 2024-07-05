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
import { faFlask, faLock, faPlay } from "@fortawesome/free-solid-svg-icons";
import React, { useContext } from "react";
import { userContext } from "../contexts/userContext";
import FAIcon from "./FAIcon";

interface BottomActionsProps {
  setShowConsole: React.Dispatch<React.SetStateAction<boolean>>;
  showConsole: boolean;
  isLoading: boolean;
  runCode: (val: boolean) => void;
  isTutorialProblem: boolean;
  examId?: number;
}
function BottomActions({
  setShowConsole,
  showConsole,
  isLoading,
  runCode,
  isTutorialProblem,
  examId,
}: BottomActionsProps) {
  const { user } = useContext(userContext);
  const toast = useToast();

  const notLoggedIn = !user?.username;
  const { isNoob } = user || { isNoob: false };

  return (
    <Box pos="relative" w={"100%"}>
      {(notLoggedIn || (!isTutorialProblem && isNoob)) && !examId && (
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
              icon: <FAIcon icon={faLock} />,
              description: notLoggedIn
                ? "Please login first!"
                : "Solve above questions to unlock",
              status: "error",
              duration: 9000,
              isClosable: true,
            });
          }}
        >
          <FAIcon style={{ marginRight: "10px" }} icon={faLock} />
          {notLoggedIn && !examId && (
            <Text fontWeight={"bold"}>
              You need to be a member to run code.
            </Text>
          )}
          {isNoob && !examId && (
            <Text fontWeight={"bold"}>Solve starting 10 problem to unlock</Text>
          )}
        </Center>
      )}
      <Flex w="100%" h={"100%"} justify={"space-between"} align={"center"}>
        <Button
          onClick={() => setShowConsole((p) => !p)}
          bg={showConsole ? "gray.600" : ""}
          variant={"outline"}
          rightIcon={showConsole ? <ChevronDownIcon /> : <ChevronUpIcon />}
        >
          Console
        </Button>
        <HStack my={0} py={0}>
          <Button
            loadingText="Running..."
            isLoading={isLoading}
            bg="purple.600"
            leftIcon={<FAIcon icon={faFlask} />}
            color="white"
            onClick={() => runCode(false)}
          >
            Run
          </Button>
          <Button
            loadingText="Running..."
            isLoading={isLoading}
            bg="green.400"
            leftIcon={<FAIcon icon={faPlay} />}
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
