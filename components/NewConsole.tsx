import { Box, Button, Flex, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

function NewConsole({ output }) {
  const [selectedCase, setSelectedCase] = useState(0);
  if (!output?.results) return null;

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

  if (output.results?.some((r) => r.errorOccurred))
    return (
      <Box w={"100%"} p={5}>
        <Text color={"red.400"} fontWeight="extrabold" fontSize={"xl"}>
          Compilation Error
        </Text>
        <Box py={2}>
          <Text>Details: </Text>
          <Box bg={"#f1635f22"} p={3} borderRadius={10}>
            <Text
              as="code"
              w={"100%"}
              color={"red.400"}
              dangerouslySetInnerHTML={{
                __html: output.results[0].errorMessage.replace(/\n/g, "<br />"),
              }}
            ></Text>
          </Box>
        </Box>
      </Box>
    );

  return (
    <Box w={"100%"} p={5} overflowY={"auto"} maxH={400}>
      <HStack>
        <Flex justify={"space-between"} mb={5} w="100%">
          <Text
            color={output.isCorrect ? "green.400" : "red.400"}
            fontWeight="extrabold"
            fontSize={"xl"}
          >
            {output.isCorrect ? "Accepted!" : "Wrong Answer"}
          </Text>
          <HStack>
            <Text fontSize={"md"}>Runtime: {cpuUsage.toFixed(1)} ms</Text>{" "}
            <Text fontSize={"md"}> Memory: {memoryUsage.toFixed(2)} MB</Text>
          </HStack>
        </Flex>
      </HStack>
      <SimpleGrid columns={4} gap={2}>
        {output?.results.map((res, i) => (
          <Button
            key={i}
            bg={selectedCase == i ? "gray.600" : ""}
            // border={selectedCase == i ? "2px solid white" : ""}
            onClick={() => setSelectedCase(i)}
            disabled={res.isHidden}
          >
            <Box
              bg={res.isCorrect ? "green.300" : "red.400"}
              mr={2}
              w={2}
              h={2}
              borderRadius={"50%"}
            ></Box>
            {res.isHidden && (
              <>
                <Box
                  bg={res.isCorrect ? "green.300" : "red.400"}
                  h={2}
                  borderRadius={"50%"}
                ></Box>
                <Box mr={1}>
                  <FontAwesomeIcon icon={faLock as IconProp} />
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
          <Box
            bg={"gray.700"}
            p={3}
            borderRadius={10}
            maxH={200}
            overflowY={"auto"}
          >
            <Text
              as="code"
              w={"100%"}
              maxH={200}
              dangerouslySetInnerHTML={{
                __html: output?.results[selectedCase].actualOutput.replace(
                  /\n/g,
                  "<br />"
                ),
              }}
            ></Text>
          </Box>
        </Box>
        <Box py={2}>
          <Text>Expected: </Text>
          <Box
            bg={"gray.700"}
            p={3}
            borderRadius={10}
            maxH={200}
            overflowY={"auto"}
          >
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
