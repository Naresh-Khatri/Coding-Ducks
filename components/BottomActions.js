import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, HStack, Spacer } from "@chakra-ui/react";
import { faReact } from "@fortawesome/free-brands-svg-icons";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

function BottomActions({ setShowConsole, showConsole, isLoading, runCode }) {
  return (
    <Flex w="100%" justify={"space-between"}>
      <Button
        onClick={() => setShowConsole((p) => !p)}
        rightIcon={showConsole ? <ChevronDownIcon /> : <ChevronUpIcon />}
      >
        Console
      </Button>
      <HStack my={0} py={0}>
        <Button
          loadingText="Running..."
          isLoading={isLoading}
          bg="purple.600"
          leftIcon={<FontAwesomeIcon icon={faReact} />}
          color="white"
          onClick={() => runCode(false)}
        >
          Run
        </Button>
        <Button
          loadingText="Running..."
          isLoading={isLoading}
          bg="green.400"
          leftIcon={<FontAwesomeIcon icon={faPlay} />}
          color="white"
          onClick={() => runCode(true)}
        >
          Submit
        </Button>
      </HStack>
    </Flex>
  );
}

export default BottomActions;
