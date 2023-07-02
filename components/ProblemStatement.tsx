import { Box, Flex, HStack, Stack, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

import ExampleTestcase from "./ExampleTestcase";
import DiffBadge from "./problem/DiffBadge";
import LikeDislikeButtons from "./problem/LikeDislikeButtons";
import { IProblem } from "../types";
import { InfoIcon } from "@chakra-ui/icons";

function ProblemStatement({ problem }: { problem: IProblem }) {
  return (
    <Box p={5} overflowY="auto">
      <Box>
        <Text fontWeight={"extrabold"} fontSize="4xl">
          #{problem.frontendProblemId}. {problem.title}
        </Text>
        <Flex justifyContent={"space-between"}>
          <HStack>
            <DiffBadge difficulty={problem.difficulty} size="lg" />
            <LikeDislikeButtons problemId={problem.id} />
          </HStack>
          <Stack alignItems={"end"}>
            <HStack>
              <Text fontSize={"sm"}>Accuracy: </Text>
              <Text fontWeight={"bold"} fontSize={"sm"}>
                {problem.accuracy.toFixed(1)}%
              </Text>
              <Tooltip label="How many submissions were correct">
                <InfoIcon />
              </Tooltip>
            </HStack>
            <HStack align={"center"}>
              <Text fontSize={"sm"}>Submissions:</Text>
              <Text fontWeight={"bold"} fontSize={"sm"}>
                {" "}
                {problem.submissionCount}
              </Text>
              <Tooltip label="Number of submission for this problem">
                <InfoIcon />
              </Tooltip>
            </HStack>
          </Stack>
        </Flex>
        <Box p={5}>
          <Text
            dangerouslySetInnerHTML={{ __html: problem.description }}
            fontSize="lg"
          ></Text>
        </Box>
        {problem.testCases.map((testCase, index) => (
          <Box key={index}>
            {testCase.isPublic && (
              <>
                <Text fontSize={"2xl"} fontWeight={"extrabold"} mt={20}>
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

export default ProblemStatement;
