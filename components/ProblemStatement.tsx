import { Badge, Box, Text } from "@chakra-ui/react";
import React from "react";

import ExampleTestcase from "./ExampleTestcase";
import { Problem } from "../hooks/useProblemsData";

function ProblemStaement({ problem }: { problem: Problem }) {
  return (
    <Box p={5} overflowY="scroll">
      {/* {JSON.stringify(problem, null, 2)} */}
      <Box>
        <Text fontWeight={"extrabold"} fontSize="4xl">
          #{problem.order}. {problem.title}
        </Text>

        <Badge colorScheme={`${problem.difficulty === 'easy'? 'green': 'yellow'}`}>{problem.difficulty}</Badge>
        <Box p={5}>
          <Text
            dangerouslySetInnerHTML={{ __html: problem.description }}
            fontSize="xl"
          ></Text>
        </Box>
        {problem.testCases.map((testCase, index) => (
          <Box key={index}>
            {testCase.isPublic && (
              <>
                <Text fontSize={"30px"} mt={20}>
                  Test Case: {index + 1}
                </Text>
                <ExampleTestcase testCase={testCase} />
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ProblemStaement;
