import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import React from "react";

function ProblemSelector({ problemId, isActive, isComplete }) {
  return (
    <Box>
      <Flex
        alignItems="center"
        justifyContent="center"
        borderRadius={18}
        w={55}
        h={55}
        transform={isActive ? "scale(1.15)" : ""}
        bg={isActive ? "blue.300" : isComplete ? "green.300" : "gray.700"}
        textAlign="center"
        // bg={isComplete ? 'green.400' : 'brand.900'}
        border={isActive ? "2px solid white" : ""}
        color={useColorModeValue("black", "black")}
        _hover={{ border: "2px dotted black", cursor: "pointer" }}
      >
        <Text fontWeight={"extrabold"} fontSize="xl" color={"white"}>
          {problemId}
        </Text>
      </Flex>
    </Box>
  );
}

function LeftProblemsList({ problems, currentProblemId, setCurrentProblemId }) {
  return (
    <Box>
      {problems.map((problem) => (
        <Box
          key={problem.id}
          my={2}
          mx={1}
          onClick={() => {
            setCurrentProblemId(problem.id);
          }}
        >
          <ProblemSelector
            problemId={problem.id}
            isActive={problem.id == currentProblemId}
            isComplete={problem.id < 5}
          />
        </Box>
      ))}
    </Box>
  );
}

export default LeftProblemsList;
