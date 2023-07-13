import { Box, Flex, HStack, Stack, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

import ExampleTestcase from "./ExampleTestcase";
import DiffBadge from "./problem/DiffBadge";
import LikeDislikeButtons from "./problem/LikeDislikeButtons";
import { IProblem } from "../types";
import { InfoIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faFlask } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

function ProblemStatement({ problem }: { problem: IProblem }) {
  return (
    <Box p={5} overflowY="auto">
      <Box>
        <Text fontWeight={"extrabold"} fontSize="4xl">
          #{problem.frontendProblemId}. {problem.title}
        </Text>
        <Flex justifyContent={"space-between"} w={"100%"}>
          <HStack>
            {problem.status === "solved" && (
              <Tooltip label="You've solved this problem">
                <FontAwesomeIcon
                  icon={faCheck as IconProp}
                  color="lightgreen"
                  size="2x"
                />
              </Tooltip>
            )}
            {problem.status === "tried" && (
              <Tooltip label="You've attempted">
                <FontAwesomeIcon
                  icon={faFlask as IconProp}
                  color="lightgreen"
                  size="2x"
                />
              </Tooltip>
            )}
            <LikeDislikeButtons problemId={problem.id} />
          </HStack>
          <DiffBadge difficulty={problem.difficulty} size="md" />
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
                {problem.submissionCount}
              </Text>
              <Tooltip label="Number of submission for this problem">
                <InfoIcon />
              </Tooltip>
            </HStack>
          </Stack>
        </Flex>
        <Box
          dangerouslySetInnerHTML={{ __html: problem.description }}
          fontSize="lg"
          mt={5}
        ></Box>
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
