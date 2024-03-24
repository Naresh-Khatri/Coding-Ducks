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
import { CloseIcon } from "@chakra-ui/icons";
import { errorType2Label } from "../lib/utils";
import FAIcon from "./FAIcon";
import { Output } from "../types";

interface NewConsoleProps {
  output: Output | null;
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

  if (output.errorCount > 0) {
    // get the testcase with error
    const errorTestCase = output.results.find((r) => r.isCorrect === false);
    return (
      <Box w={"100%"} p={5} overflowY={"auto"}>
        <HStack justifyContent={"space-between"}>
          <Text color={"red.400"} fontWeight="extrabold" fontSize={"xl"}>
            {
              errorType2Label[
                (errorTestCase && errorTestCase.errorType) || "run-time"
              ]
            }
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
              as={"pre"}
              overflowX={"auto"}
              whiteSpace={"pre-wrap"}
              textOverflow={"clip"}
              color={"red.400"}
              p={0}
              fontWeight={"semibold"}
              dangerouslySetInnerHTML={{
                __html: errorTestCase?.output?.replace(/\n/g, "<br />") || "",
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
              {/* Runtime: {output?.totalRuntime.toFixed(0)} ms */}
            </Text>{" "}
            <Text display={{ base: "none", md: "block" }} fontSize={"md"}>
              {/* Memory: {memoryUsage.toFixed(2)} MB */}
              {/* Memory: N/A MB */}
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
                __html:
                  output?.results[selectedCase]?.stdin?.replace(
                    /\n/g,
                    "<br />"
                  ) || "",
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
                __html:
                  output?.results[selectedCase]?.output?.replace(
                    /\n/g,
                    "<br />"
                  ) || "",
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
                __html:
                  output?.results[selectedCase]?.expectedOutput?.replace(
                    /\n/g,
                    "<br />"
                  ) || "",
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
