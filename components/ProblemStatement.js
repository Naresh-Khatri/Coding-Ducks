import { Badge, Box, Text } from "@chakra-ui/react";
import React from "react";

import ExampleTestcase from "./ExampleTestcase";

function ProblemStaement({ problem }) {
  return (
    <Box p={5} overflowY="scroll">
      {/* {JSON.stringify(problem, null, 2)} */}
      <Box>
        <Text fontWeight={"extrabold"} fontSize="4xl">
          #{problem.id}.{problem.title}
        </Text>

        <Badge colorScheme="green">{problem.diffLevel}</Badge>
        <Box p={5}>
          <Text
            dangerouslySetInnerHTML={{ __html: problem.description }}
          ></Text>
        </Box>
        {problem.testCases.map((testCase, index) => (
          <Box key={index}>
            <Text fontSize={"30px"} mt={20}>
              Test Case: {index + 1}
            </Text>
            <ExampleTestcase testCase={testCase} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ProblemStaement;
