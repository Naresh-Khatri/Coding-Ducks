import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { useExamSubmissionsData } from "../hooks/useExamsData";

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
        w={isActive ? 51 : 55}
        h={isActive ? 51 : 55}
        transform={isActive ? "scale(1.15)" : ""}
        bg={bgColor}
        textAlign="center"
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

interface LeftProblemsListProps {
  examId: number;
  problems: any[];
  currentProblemIdx: number;
  setCurrentProblemIdx: (idx: number) => void;
}

function LeftProblemsList({
  examId,
  problems,
  currentProblemIdx,
  setCurrentProblemIdx,
}: LeftProblemsListProps) {
  const { data: examSubmissionsData, refetch: refetchExamSubmissionsData } =
    useExamSubmissionsData(examId);
  const submissions = examSubmissionsData?.submissions;
  const getState = (problemId: number) => {
    if (!examSubmissionsData) return "notAttempted";
    const submission = submissions.find((sub) => sub.problemId === problemId);
    if (submission?.marks == 10) return "passed";
    else if (submission?.marks < 10) return "tried";
    else return "notAttempted";
  };

  return (
    <Box overflowY={"auto"}>
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
            // state={"notAttempted"}
          />
        </Box>
      ))}
    </Box>
  );
}

export default LeftProblemsList;
