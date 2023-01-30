import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

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
      <HStack>
        {output?.results.map((res, i) => (
          <Button
            key={i}
            bg={selectedCase == i ? "gray.600" : ""}
            onClick={() => setSelectedCase(i)}
          >
            {res.isCorrect ? (
              <Box
                bg={"green.300"}
                mr={2}
                w={2}
                h={2}
                borderRadius={"50%"}
              ></Box>
            ) : (
              <Box bg={"red"} mr={2} w={2} h={2} borderRadius={"50%"}></Box>
            )}
            {/* {res.isCorrect && <Box bg={"green"} w={10} h={10}></Box>} */}
            Case {i + 1}
          </Button>
        ))}
      </HStack>
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
