import { Badge, Box, Stack, Text } from "@chakra-ui/react";
import React from "react";

import ExampleTestcase from "./ExampleTestcase";
import { IProblem } from "../types";

function ExamProblemStatement({ problem }: { problem: IProblem }) {
  if (!problem) return null;
  return (
    <Box p={5} overflowY="auto">
      <Box>
        <Text fontWeight={"extrabold"} fontSize="4xl">
          #{!problem?.examId ? problem.frontendProblemId : problem.order}.{" "}
          {problem.title}
        </Text>

        <Stack>
          <Badge
            w={"fit-content"}
            colorScheme={`${
              problem.difficulty === "easy" ? "green" : "yellow"
            }`}
          >
            {problem.difficulty}
          </Badge>
          {problem.tags?.map((tag) => (
            <Badge
              w={"fit-content"}
              key={tag}
              colorScheme={`${
                problem.difficulty === "easy" ? "green" : "yellow"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </Stack>
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

export default ExamProblemStatement;
