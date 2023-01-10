import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import React, { useContext } from "react";
import { submissionsContext } from "../contexts/submissionsContext";

function ProblemSelector({ problemId, isActive, state }) {
  const bgColor = isActive
    ? "blue.300"
    : state == "passed"
    ? "green.300"
    : state == "tried"
    ? "yellow.600"
    : "gray.700";
  return (
    <Box>
      <Flex
        alignItems="center"
        justifyContent="center"
        borderRadius={18}
        w={55}
        h={55}
        transform={isActive ? "scale(1.15)" : ""}
        bg={bgColor}
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

function LeftProblemsList({ problems, currentProblemIdx, setCurrentProblemIdx }) {
  const { submissions } = useContext(submissionsContext);
  const getState = (problemId) => {
    const submission = submissions.find((sub) => sub.problemId === problemId);
    if (submission?.marks == 10) return "passed";
    else if (submission?.marks < 10) return "tried";
    else return "notAttempted";
  };

  return (
    <Box overflowY={'auto'}>
      {problems.map((problem, index) => (
        <Box
          key={index}
          my={2}
          mx={1}
          onClick={() => {
            setCurrentProblemIdx(problem.order);
          }}
        >
          <ProblemSelector
            problemId={problem.order}
            isActive={problem.order == currentProblemIdx}
            state={getState(problem.id)}
          />
        </Box>
      ))}
    </Box>
  );
}

export default LeftProblemsList;
