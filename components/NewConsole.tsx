import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Output } from "../types";
import { CloseIcon } from "@chakra-ui/icons";
import { errorType2Label } from "../lib/utils";
import FAIcon from "./FAIcon";

interface NewConsoleProps {
  output: Output;
  isLoading: boolean;
  onClose: () => void;
}

function NewConsole({ output, isLoading, onClose }: NewConsoleProps) {
  const [selectedCase, setSelectedCase] = useState(0);
  if (!output?.results)
    return (
      <Center p={4} w={"100%"} h={"100%"}>
        {isLoading ? (
          <Spinner />
        ) : (
          <Text textAlign={"center"} color={"whiteAlpha.400"} fontSize={"3xl"}>
            No output yet!
            <br /> Try running your code!
          </Text>
        )}
      </Center>
    );

  const memoryUsage =
    output.results?.reduce((acc, res) => {
      return acc + res.result?.memoryUsage;
    }, 0) /
    (1024 * 1024 * output.results.length);
  const cpuUsage =
    output.results?.reduce((acc, res) => {
      return acc + res.result?.cpuUsage;
    }, 0) /
    (1000 * output.results.length);

  if (output.results?.some((r) => r.errorOccurred)) {
    // get the testcase with error
    const errorTestCase = output.results.find((r) => r.errorOccurred === true);
    return (
      <Box w={"100%"} p={5} overflowY={"auto"}>
        <HStack justifyContent={"space-between"}>
          <Text color={"red.400"} fontWeight="extrabold" fontSize={"xl"}>
            {errorType2Label[errorTestCase.errorType]}
          </Text>
          <IconButton
            aria-label="close"
            icon={<CloseIcon />}
            size={"sm"}
            colorScheme="red"
            onClick={onClose}
          />
        </HStack>
        <Box py={2}>
          <Text>Details: </Text>
          <Box bg={"#f1635f22"} p={3} borderRadius={10}>
            <Text
              w={"100%"}
              as={"code"}
              color={"red.400"}
              p={0}
              fontWeight={"semibold"}
              dangerouslySetInnerHTML={{
                __html: errorTestCase?.errorMessage?.replace(/\n/g, "<br />"),
              }}
            ></Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box w={"100%"} p={5} overflowY={"auto"}>
      <HStack>
        <Flex justify={"space-between"} mb={5} w="100%">
          <Text
            color={output.isCorrect ? "green.400" : "red.400"}
            fontWeight="extrabold"
            fontSize={"xl"}
          >
            {output.isCorrect ? "Accepted!" : "Wrong Output!"}
          </Text>
          <HStack>
            <Text display={{ base: "none", md: "block" }} fontSize={"md"}>
              Runtime: {cpuUsage.toFixed(1)} ms
            </Text>{" "}
            <Text display={{ base: "none", md: "block" }} fontSize={"md"}>
              Memory: {memoryUsage.toFixed(2)} MB
            </Text>
            <IconButton
              aria-label="close"
              icon={<CloseIcon />}
              size={"sm"}
              colorScheme="red"
              onClick={onClose}
            />
          </HStack>
        </Flex>
      </HStack>
      <SimpleGrid columns={{ base: 3, md: 4 }} gap={2}>
        {output?.results.map((res, i) => (
          <Button
            key={i}
            bg={selectedCase == i ? "gray.600" : ""}
            onClick={() => setSelectedCase(i)}
            isDisabled={!res.isPublic}
            minW={"fit-content"}
          >
            <Box
              bg={res.isCorrect ? "green.300" : "red.400"}
              mr={2}
              w={2}
              h={2}
              borderRadius={"50%"}
            >
              {/* {res.isCorrect ? "T" : "F"} */}{" "}
            </Box>
            {!res.isPublic && (
              <>
                <Box
                  bg={res.isCorrect ? "green.300" : "red.400"}
                  h={2}
                  borderRadius={"50%"}
                ></Box>
                <Box mr={1}>
                  <FAIcon icon={faLock} />
                </Box>
              </>
            )}
            Case {i + 1}
          </Button>
        ))}
      </SimpleGrid>
      <Box overflow={"auto"}>
        <Box py={2}>
          <Text>Input: </Text>
          <Box bg={"gray.700"} p={3} borderRadius={10}>
            <Text
              as="code"
              w={"100%"}
              p={0}
              dangerouslySetInnerHTML={{
                __html: output?.results[selectedCase]?.input.replace(
                  /\n/g,
                  "<br />"
                ),
              }}
            ></Text>
          </Box>
        </Box>
        <Box py={2}>
          <Text>Output: </Text>
          <Box bg={"gray.700"} p={3} borderRadius={10} overflowY={"auto"}>
            <Text
              as="code"
              w={"100%"}
              dangerouslySetInnerHTML={{
                __html: output?.results[selectedCase]?.actualOutput?.replace(
                  /\n/g,
                  "<br />"
                ),
              }}
            ></Text>
          </Box>
        </Box>
        <Box py={2}>
          <Text>Expected: </Text>
          <Box bg={"gray.700"} p={3} borderRadius={10} overflowY={"auto"}>
            <Text
              as="code"
              w={"100%"}
              dangerouslySetInnerHTML={{
                __html: output?.results[selectedCase].output.replace(
                  /\n/g,
                  "<br />"
                ),
              }}
            ></Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// const Cases = ()=>{

// }

export default NewConsole;
